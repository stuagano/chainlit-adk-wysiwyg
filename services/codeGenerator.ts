import { Agent, Tool, Parameter, GCPConfig, WorkflowType } from '../types';

const toSnakeCase = (str: string) => {
    // Sanitize the name to be a valid Python identifier
    return str
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
        .replace(/^(\d)/, '_$1');    // Prepend underscore if it starts with a number
};

const toKebabCase = (str: string) => {
    return str.replace(/[\s_]+/g, '-').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
};

const toPascalCase = (str: string) => {
    return str.replace(/(?:^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (g) => g.toUpperCase().replace(/[^a-zA-Z0-9]/g, ''));
}


const getPythonType = (type: Parameter['type']): string => {
    switch (type) {
        case 'number': return 'float';
        case 'boolean': return 'bool';
        case 'string':
        default: return 'str';
    }
};

const generateToolsPy = (allTools: Tool[]): string => {
    if (allTools.length === 0) {
        return `# No tools defined across any agents.`;
    }

    const hasWeatherTool = allTools.some(tool => toSnakeCase(tool.name) === 'get_weather');

    const imports = hasWeatherTool
        ? `from __future__ import annotations

import requests
from datetime import datetime
from typing import Optional
import typing
from pydantic import BaseModel, Field

`
        : `from pydantic import BaseModel, Field
import typing

`;

    const uniqueTools = Array.from(new Map(allTools.map(tool => [tool.name, tool])).values());

    const classAndFuncStrings = uniqueTools.map(tool => {
        const snakeCaseToolName = toSnakeCase(tool.name);
        const modelName = `${toPascalCase(tool.name)}Input`;

        const fields = tool.parameters.map(param => {
            const pythonType = getPythonType(param.type);
            const required = param.required;
            // Escape backslashes and double quotes for Python string literal
            const escapedParamDesc = param.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const fieldArgs = `description="${escapedParamDesc}"`;
            return `    ${toSnakeCase(param.name)}: ${required ? pythonType : `typing.Optional[${pythonType}]`} = Field(${required ? '...' : 'None'}, ${fieldArgs})`;
        }).join('\n');

        if (snakeCaseToolName === 'get_weather') {
            return `
WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


class ${modelName}(BaseModel):
    location: str = Field(..., description="The city and state, e.g., 'San Francisco, CA'")
    unit: Optional[str] = Field(None, description="Temperature unit to return (celsius or fahrenheit). Defaults to fahrenheit.")
    time: Optional[str] = Field(None, description="Optional ISO timestamp or hour (e.g., '2025-10-20T22:00', '10 PM').")


def _geocode_${snakeCaseToolName}(name: str) -> tuple[float, float, str]:
    response = requests.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": name, "count": 1, "language": "en", "format": "json"},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    results = payload.get("results") or []
    if not results:
        raise ValueError(f"No geocoding results found for '{name}'.")
    result = results[0]
    label = ", ".join(filter(None, [result.get("name"), result.get("admin1"), result.get("country")]))
    return float(result["latitude"]), float(result["longitude"]), label


def _pick_unit_${snakeCaseToolName}(unit: Optional[str]) -> tuple[str, str]:
    normalized = (unit or "fahrenheit").strip().lower()
    if normalized in {"c", "celsius"}:
        return "celsius", "°C"
    return "fahrenheit", "°F"


def _match_hour_${snakeCaseToolName}(hours: list[str], target: Optional[str]) -> int:
    if not target or not hours:
        return 0
    try:
        return hours.index(target)
    except ValueError:
        try:
            desired = datetime.fromisoformat(target)
        except ValueError:
            return 0
        deltas = [abs((datetime.fromisoformat(ts) - desired).total_seconds()) for ts in hours]
        return int(min(range(len(deltas)), key=deltas.__getitem__))


def ${snakeCaseToolName}(inputs: ${modelName}) -> str:
    """${tool.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""

    latitude, longitude, label = _geocode_${snakeCaseToolName}(inputs.location)
    temperature_unit, unit_suffix = _pick_unit_${snakeCaseToolName}(inputs.unit)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,weather_code",
        "temperature_unit": temperature_unit,
        "forecast_days": 1,
    }
    forecast = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=10)
    forecast.raise_for_status()
    data = forecast.json()

    current = data.get("current", {})
    hourly = data.get("hourly", {})
    hourly_times = hourly.get("time", [])

    target_iso = None
    if inputs.time:
        try:
            dt = datetime.fromisoformat(inputs.time)
            target_iso = dt.replace(minute=0, second=0, microsecond=0).isoformat()
        except ValueError:
            try:
                parsed = datetime.strptime(inputs.time.strip().upper(), "%I %p")
                now = datetime.utcnow()
                dt = now.replace(hour=parsed.hour, minute=0, second=0, microsecond=0)
                target_iso = dt.isoformat(timespec="seconds")
            except ValueError:
                target_iso = None

    summary = [f"Weather for {label}"]
    temp = current.get("temperature_2m")
    if temp is not None:
        summary.append(f"Current temperature: {float(temp):.1f}{unit_suffix}")
    code = int(current.get("weather_code", 0))
    summary.append(f"Conditions: {WEATHER_CODES.get(code, 'Unknown conditions')}")
    wind = current.get("wind_speed_10m")
    if wind is not None:
        summary.append(f"Wind speed: {float(wind):.1f} m/s")

    if hourly_times:
        idx = _match_hour_${snakeCaseToolName}(hourly_times, target_iso)
        hourly_temp = hourly.get("temperature_2m", [None])[idx] if idx < len(hourly.get("temperature_2m", [])) else None
        hourly_code = hourly.get("weather_code", [None])[idx] if idx < len(hourly.get("weather_code", [])) else None
        hourly_desc = WEATHER_CODES.get(int(hourly_code or 0), "Unknown conditions")
        hourly_time = hourly_times[idx]
        if hourly_temp is not None:
            summary.append(f"Forecast @ {hourly_time}: {float(hourly_temp):.1f}{unit_suffix}, {hourly_desc}")

    return '\\n'.join(summary)
`;
        }

        const model = `class ${modelName}(BaseModel):\n${fields || '    pass'}\n`;

        // Escape backslashes and double quotes for Python docstring
        const escapedToolDesc = tool.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const functionDef = `
def ${snakeCaseToolName}(inputs: ${modelName}) -> str:
    """${escapedToolDesc}"""
    # TODO: Implement the actual logic for this tool.
    # This is a placeholder implementation.
    print(f"Executing tool '${snakeCaseToolName}' with inputs: {inputs.dict()}")
    return f"Tool '${snakeCaseToolName}' executed successfully with inputs: {inputs.dict()}"
`;
        return model + functionDef;
    }).join('\n');

    const toolList = `
tools = [${uniqueTools.map(t => toSnakeCase(t.name)).join(', ')}]
`;

    return imports + classAndFuncStrings + toolList;
};

const generateMainPy = (agents: Agent[], gcpConfig: GCPConfig, workflowType: WorkflowType): string => {
    if (agents.length === 0) {
        return `# No agents defined. Please add an agent to the workflow.`;
    }

    const allModels = agents.map(agent => agent.llmModel);
    const usesOpenAI = allModels.some(model => !model.startsWith('gemini'));
    const usesVertex = allModels.some(model => model.startsWith('gemini'));

    let imports = `import chainlit as cl
import logging
import os
from adk.agent import Agent
from adk.workflow import ${toPascalCase(workflowType)}
`;
    if (usesOpenAI) {
        imports += 'from adk.llm.provider.openai import OpenAI\n';
    }
    if (usesVertex) {
        imports += 'from adk.llm.provider.vertex import VertexAI\n';
    }

    let memoryImport: string;
    let memoryInstantiation: string;
    if (gcpConfig.useMemoryBank) {
        memoryImport = 'from adk.memory.google.memory_bank import MemoryBank';
        memoryInstantiation = `MemoryBank(project_id="${gcpConfig.projectId}", location="${gcpConfig.region}")`;
    } else {
        memoryImport = 'from adk.memory.memory import Memory as LocalMemory';
        memoryInstantiation = 'LocalMemory()';
    }

    const envChecks: string[] = [];
    if (usesOpenAI) {
        envChecks.push(`if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable not set")`);
    }
    if (usesVertex || gcpConfig.useMemoryBank) {
        envChecks.push(`if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    print("Warning: GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Using default credentials.")`);
    }

    const agentCreationFunctions = agents.map((agent, index) => {
        const agentFunctionName = `create_agent_${index + 1}`;
        let llmInstantiation: string;
        if (agent.llmModel.startsWith('gemini')) {
            llmInstantiation = `VertexAI(model="${agent.llmModel}", temperature=${agent.temperature})`;
        } else {
            llmInstantiation = `OpenAI(model="${agent.llmModel}", temperature=${agent.temperature})`;
        }
        return `
def ${agentFunctionName}() -> Agent:
    """Instantiates the '${agent.name}' agent."""
    return Agent(
        llm=${llmInstantiation},
        memory=${memoryInstantiation},
        system_prompt=\"\"\"${agent.system_prompt}\"\"\",
        tools=agent_tools,
    )
`;
    }).join('\n');
    
    const agentVarMap = new Map<string, string>();
    agents.forEach((agent, index) => {
      agentVarMap.set(agent.id, `agent_${index + 1}`);
    });

    let workflowInstantiation: string;
    switch(workflowType) {
        case 'Hierarchical':
            const structure: Record<string, string[]> = {};
            agents.forEach(agent => {
              if (agent.parentId && agentVarMap.has(agent.parentId)) {
                const parentVar = agentVarMap.get(agent.parentId)!;
                const childVar = agentVarMap.get(agent.id)!;
                if (!structure[parentVar]) {
                  structure[parentVar] = [];
                }
                structure[parentVar].push(childVar);
              }
            });
            const structureString = JSON.stringify(structure, null, 4)
                                        .replace(/"/g, '') // remove quotes from keys/values
                                        .replace(/\[\n\s*/g, '[') // compact arrays
                                        .replace(/\n\s*\]/g, ']')
                                        .replace(/,\n\s*/g, ', ');


            workflowInstantiation = `
    # Create instances of each agent
    ${agents.map((_, index) => `agent_${index + 1} = create_agent_${index + 1}()`).join('\n    ')}

    # Assemble the agents into a hierarchical workflow
    workflow = Hierarchical(
        agents=[${agents.map((_, index) => `agent_${index + 1}`).join(', ')}],
        structure=${structureString || '{}'}
    )
    cl.user_session.set("workflow", workflow)`;
            break;
        case 'Collaborative':
             workflowInstantiation = `
    # Create instances of each agent
    ${agents.map((_, index) => `agent_${index + 1} = create_agent_${index + 1}()`).join('\n    ')}

    # Assemble the agents into a collaborative workflow
    workflow = Collaborative(
        agents=[
            ${agents.map((_, index) => `agent_${index + 1}`).join(',\n            ')}
        ]
    )
    cl.user_session.set("workflow", workflow)`;
            break;
        case 'Sequential':
        default:
             workflowInstantiation = `
    # Create instances of each agent
    ${agents.map((_, index) => `agent_${index + 1} = create_agent_${index + 1}()`).join('\n    ')}

    # Assemble the agents into a sequential workflow
    # The output of agent_1 becomes the input for agent_2, and so on.
    workflow = Sequential(
        agents=[
            ${agents.map((_, index) => `agent_${index + 1}`).join(',\n            ')}
        ]
    )
    cl.user_session.set("workflow", workflow)`;
            break;
    }

    return `${imports}
${memoryImport}

# Import your tools. ADK will automatically discover them in the 'tools.py' file.
import tools as agent_tools

# It is recommended to use environment variables for api keys
# from dotenv import load_dotenv
# load_dotenv()

logging.basicConfig(level=logging.INFO)

${envChecks.join('\n\n')}
${agentCreationFunctions}

@cl.on_chat_start
async def start_chat():
    ${workflowInstantiation}
    await cl.Message(content="${agents[0]?.welcome_message || 'Welcome to the agent workflow!'}").send()


@cl.on_message
async def main(message: cl.Message):
    workflow = cl.user_session.get("workflow")
    response_message = cl.Message(content="")

    # Collect the streamed response and send it as a single payload
    chunks: list[str] = []

    async for chunk in workflow.astream(message.content):
        if chunk:
            chunks.append(str(chunk))

    response_message.content = ''.join(chunks) if chunks else ""
    await response_message.send()

# To configure the Chainlit UI
@cl.set_chat_profiles
async def chat_profile():
    return [
        cl.ChatProfile(
            name="Multi-Agent Workflow",
            markdown_description="This chat is powered by a sequence of specialized agents.",
            icon="https://picsum.photos/200",
        ),
    ]

# Get the port from the environment variable, default to 8000 for local development
port = int(os.environ.get("PORT", 8000))
os.environ.setdefault("CHAINLIT_PORT", str(port))

try:
    Copilot = getattr(cl, "Copilot")
except (AttributeError, KeyError):
    Copilot = None

if Copilot:
    Copilot(
        route="/",
        chat_input_placeholder="${agents[0]?.input_placeholder || 'Start the workflow...'}",
    ).mount_app(port=port)
else:
    print("Chainlit Copilot API not available; using the default Chainlit UI on port", port)
`;
};

const generateRequirementsTxt = (agents: Agent[], gcpConfig: GCPConfig): string => {
    const requirements = new Set<string>(['chainlit', 'requests']);
    const allModels = agents.map(agent => agent.llmModel);

    if (allModels.some(model => !model.startsWith('gemini'))) {
        requirements.add('openai');
    }
    if (allModels.some(model => model.startsWith('gemini')) || gcpConfig.useMemoryBank) {
        requirements.add('google-cloud-aiplatform');
        // Generated Vertex AI client relies on google-cloud-aiplatform
    }
    
    let reqs = Array.from(requirements).join('\n');

    reqs += `
# The ADK may have optional dependencies.
# e.g., adk[google] for full GCP support.
# python-dotenv # Recommended for local development
# redis # Uncomment if you use Redis for memory
`;
    return reqs;
};

const generateReadme = (agents: Agent[], gcpConfig: GCPConfig, workflowType: WorkflowType): string => {
    const hasGcpConfig = gcpConfig.projectId;
    const deploymentSection = hasGcpConfig ? `
## ☁️ Deploy to GCP Agent Engine

This project is pre-configured for easy deployment to Google Cloud Agent Engine.

**Prerequisites:**

1.  **Google Cloud SDK:** Make sure you have the \`gcloud\` CLI installed and authenticated (\`gcloud auth login\`).
2.  **Enable APIs:** Ensure the Cloud Build, Artifact Registry, and Agent Engine APIs are enabled for your project (\`${gcpConfig.projectId}\`).
    \`\`\`bash
    gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com agentengine.googleapis.com --project=${gcpConfig.projectId}
    \`\`\`
3.  **Permissions:** The service account you use needs roles like "Agent Engine Admin", "Cloud Build Editor", "Artifact Registry Admin", and "Service Account User" to execute the deployment.

**Deployment Steps:**

1.  **Run the Deployment Script:**
    Execute the provided script. It will use Cloud Build to build the Docker image, push it to Artifact Registry, and deploy it to Agent Engine.

    \`\`\`bash
    source ./deploy.sh
    \`\`\`
` : `
## ☁️ Deploy to GCP Agent Engine
...
`;
    let agentOverview: string;

    const buildAgentTree = (parentId: string | null = null, level = 0): string => {
        return agents
            .filter(a => a.parentId === parentId)
            .map(agent => {
                const prefix = '  '.repeat(level) + '- ';
                const tools = agent.tools.length > 0 ? `(Tools: ${agent.tools.map(t => `\`${t.name}\``).join(', ')})` : '';
                const children = buildAgentTree(agent.id, level + 1);
                return `${prefix}**${agent.name}** (LLM: \`${agent.llmModel}\`) ${tools}\n${children}`;
            })
            .join('');
    };

    const agentListItem = (agent: Agent) => `- **${agent.name}** (LLM: \`${agent.llmModel}\`): ${agent.tools.length > 0 ? `(Tools: ${agent.tools.map(t => `\`${t.name}\``).join(', ')})` : ''}`;


    switch (workflowType) {
        case 'Hierarchical':
            agentOverview = `This is a hierarchical workflow where agents operate in a supervisor-subordinate structure.\n\n${buildAgentTree()}`;
            break;
        case 'Collaborative':
            agentOverview = `This is a collaborative workflow where ${agents.length} agents work as a team of peers.\n\n` + agents.map(agentListItem).join('\n');
            break;
        case 'Sequential':
        default:
             agentOverview = `This is a sequential workflow consisting of ${agents.length} agent(s). The output of one agent is passed as the input to the next.\n\n` + agents.map((agent, index) => `**Step ${index + 1}: ${agent.name}** (LLM: \`${agent.llmModel}\`)\n   - **Tools:** ${agent.tools.length > 0 ? agent.tools.map(t => `\`${t.name}\``).join(', ') : 'None'}`).join('\n');
            break;

    }

    const memorySection = gcpConfig.useMemoryBank ? `
### 🧠 Memory Bank

This agent is configured to use **GCP Memory Bank**, providing a persistent, managed memory solution. Ensure your deployment environment has the correct permissions to access the Memory Bank API in project \`${gcpConfig.projectId}\`.
` : `
### 🧠 Local Memory

This agent is configured to use in-memory storage, which is reset on each session start. For persistent memory, consider enabling Memory Bank in the GCP settings and redeploying.
`;

    return `# Multi-Agent Workflow - ADK & Chainlit

This multi-agent workflow was configured and generated using the ADK & Chainlit Agent Builder.

## Workflow Overview: ${workflowType}

${agentOverview}

${memorySection}

## 🚀 Local Setup & Run

The local setup allows you to test your agent's logic and Chainlit UI before deploying.

1.  **Install Dependencies:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`

2.  **Set Environment Variables:**
    Create a \`.env\` file and add your necessary API keys and credentials.
    \`\`\`.env
    # For OpenAI Models
    OPENAI_API_KEY="your-openai-api-key-here"

    # For Google (Vertex AI) Models & Memory Bank
    # IMPORTANT: Store your GCP service account key file securely outside this directory
    # Download your key from: https://console.cloud.google.com/iam-admin/serviceaccounts
    # Then set the path to it (use absolute path for security):
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

    # SECURITY WARNING:
    # - NEVER commit service account keys to git
    # - NEVER include credentials in your codebase
    # - Use GCP Secret Manager for production deployments
    # - The .gitignore file already excludes gcp-credentials.json
    \`\`\`

3.  **Run the Chainlit App:**
    \`\`\`bash
    chainlit run main.py -w
    \`\`\`

4.  **Interact with your Agent:**
    Open your browser and navigate to \`http://localhost:8000\` to start chatting!

${deploymentSection}
`;
};

const generateDockerfile = (): string => {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV AGENT_ENGINE_DEPLOYMENT=false
ENV PORT 8080
CMD ["chainlit", "run", "main.py", "--host", "0.0.0.0"]
`;
};

const generateCloudBuildYaml = (gcpConfig: GCPConfig): string => {
    const serviceName = toKebabCase(gcpConfig.serviceName || 'my-adk-agent');
    const projectId = gcpConfig.projectId || 'YOUR_PROJECT_ID';
    const region = gcpConfig.region || 'us-central1';
    const imageUrl = `${region}-docker.pkg.dev/${projectId}/agent-engine-images/${serviceName}`;

    return `# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', '${imageUrl}', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', '${imageUrl}']
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args: [
      'beta', 'agent-engine', 'agents', 'deploy', '${serviceName}',
      '--project=${projectId}',
      '--region=${region}',
      '--image=${imageUrl}',
      '--display-name=${gcpConfig.serviceName}',
      '--agent-type=ADK',
      '--set-env-vars', 'AGENT_ENGINE_DEPLOYMENT=true'
    ]
images:
- '${imageUrl}'
options:
  logging: CLOUD_LOGGING_ONLY
`;
};

const generateDeploySh = (gcpConfig: GCPConfig): string => {
    const projectId = gcpConfig.projectId || 'YOUR_PROJECT_ID';
    return `#!/bin/bash
export PROJECT_ID="${projectId}"
gcloud config set project $PROJECT_ID
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com agentengine.googleapis.com
gcloud builds submit --config cloudbuild.yaml .
`;
};

const generateGcloudIgnore = (): string => {
    return `venv/
__pycache__/
*.pyc
.env
gcp-credentials.json
`;
};

export const generateCode = (agents: Agent[], gcpConfig: GCPConfig, workflowType: WorkflowType): Record<string, string> => {
    const allTools = agents.flatMap(agent => agent.tools);

    const files: Record<string, string> = {
        'main.py': generateMainPy(agents, gcpConfig, workflowType),
        'tools.py': generateToolsPy(allTools),
        'requirements.txt': generateRequirementsTxt(agents, gcpConfig),
        'README.md': generateReadme(agents, gcpConfig, workflowType),
        'Dockerfile': generateDockerfile(),
        '.gcloudignore': generateGcloudIgnore(),
    };
    
    if (gcpConfig.projectId) {
        files['cloudbuild.yaml'] = generateCloudBuildYaml(gcpConfig);
        files['deploy.sh'] = generateDeploySh(gcpConfig);
    }

    // SECURITY: Never include credentials in generated files
    // Users must download their service account key separately and set GOOGLE_APPLICATION_CREDENTIALS
    // See README.md for instructions

    return files;
};
