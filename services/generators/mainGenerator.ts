/**
 * Main.py Generator
 *
 * Generates the main.py file that orchestrates the multi-agent workflow
 * using Chainlit and ADK frameworks.
 */

import { Agent, GCPConfig, WorkflowType } from '../../types';
import { toPascalCase } from './utils';

/**
 * Generates the complete main.py file
 * @param agents - Array of agent configurations
 * @param gcpConfig - GCP deployment configuration
 * @param workflowType - Type of workflow (Sequential, Hierarchical, Collaborative)
 * @returns Python code string for main.py
 */
export const generateMainPy = (agents: Agent[], gcpConfig: GCPConfig, workflowType: WorkflowType): string => {
    if (agents.length === 0) {
        return `# No agents defined. Please add an agent to the workflow.`;
    }

    const imports = generateImports(agents, workflowType);
    const memoryConfig = generateMemoryConfig(gcpConfig);
    const envChecks = generateEnvironmentChecks(agents, gcpConfig);
    const agentCreationFunctions = generateAgentCreationFunctions(agents, memoryConfig.instantiation);
    const workflowInstantiation = generateWorkflowInstantiation(agents, workflowType);
    const chainlitHandlers = generateChainlitHandlers(agents, workflowInstantiation);

    return `${imports}
${memoryConfig.import}

# Import your tools. ADK will automatically discover them in the 'tools.py' file.
import tools as agent_tools

# It is recommended to use environment variables for api keys
# from dotenv import load_dotenv
# load_dotenv()

logging.basicConfig(level=logging.INFO)

${envChecks}
${agentCreationFunctions}
${chainlitHandlers}
`;
};

/**
 * Generates import statements based on used models
 */
function generateImports(agents: Agent[], workflowType: WorkflowType): string {
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

    return imports;
}

/**
 * Generates memory configuration
 */
function generateMemoryConfig(gcpConfig: GCPConfig): { import: string; instantiation: string } {
    if (gcpConfig.useMemoryBank) {
        return {
            import: 'from adk.memory.google.memory_bank import MemoryBank',
            instantiation: `MemoryBank(project_id="${gcpConfig.projectId}", location="${gcpConfig.region}")`
        };
    } else {
        return {
            import: 'from adk.memory.memory import Memory as LocalMemory',
            instantiation: 'LocalMemory()'
        };
    }
}

/**
 * Generates environment variable validation checks
 */
function generateEnvironmentChecks(agents: Agent[], gcpConfig: GCPConfig): string {
    const allModels = agents.map(agent => agent.llmModel);
    const usesOpenAI = allModels.some(model => !model.startsWith('gemini'));
    const usesVertex = allModels.some(model => model.startsWith('gemini'));

    const envChecks: string[] = [];
    if (usesOpenAI) {
        envChecks.push(`if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable not set")`);
    }
    if (usesVertex || gcpConfig.useMemoryBank) {
        envChecks.push(`if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    print("Warning: GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Using default credentials.")`);
    }

    return envChecks.join('\n\n');
}

/**
 * Generates agent creation functions
 */
function generateAgentCreationFunctions(agents: Agent[], memoryInstantiation: string): string {
    return agents.map((agent, index) => {
        const agentFunctionName = `create_agent_${index + 1}`;
        const llmInstantiation = agent.llmModel.startsWith('gemini')
            ? `VertexAI(model="${agent.llmModel}", temperature=${agent.temperature})`
            : `OpenAI(model="${agent.llmModel}", temperature=${agent.temperature})`;

        return `
def ${agentFunctionName}() -> Agent:
    """Instantiates the '${agent.name}' agent."""
    return Agent(
        llm=${llmInstantiation},
        memory=${memoryInstantiation},
        system_prompt="""${agent.system_prompt}""",
        tools=agent_tools,
    )
`;
    }).join('\n');
}

/**
 * Generates workflow instantiation based on workflow type
 */
function generateWorkflowInstantiation(agents: Agent[], workflowType: WorkflowType): string {
    const agentVarMap = new Map<string, string>();
    agents.forEach((agent, index) => {
        agentVarMap.set(agent.id, `agent_${index + 1}`);
    });

    switch (workflowType) {
        case 'Hierarchical':
            return generateHierarchicalWorkflow(agents, agentVarMap);
        case 'Collaborative':
            return generateCollaborativeWorkflow(agents);
        case 'Sequential':
        default:
            return generateSequentialWorkflow(agents);
    }
}

/**
 * Generates hierarchical workflow with supervisor-worker structure
 */
function generateHierarchicalWorkflow(agents: Agent[], agentVarMap: Map<string, string>): string {
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

    return `
    # Create instances of each agent
    ${agents.map((_, index) => `agent_${index + 1} = create_agent_${index + 1}()`).join('\n    ')}

    # Assemble the agents into a hierarchical workflow
    workflow = Hierarchical(
        agents=[${agents.map((_, index) => `agent_${index + 1}`).join(', ')}],
        structure=${structureString || '{}'}
    )
    cl.user_session.set("workflow", workflow)`;
}

/**
 * Generates collaborative workflow where all agents work together
 */
function generateCollaborativeWorkflow(agents: Agent[]): string {
    return `
    # Create instances of each agent
    ${agents.map((_, index) => `agent_${index + 1} = create_agent_${index + 1}()`).join('\n    ')}

    # Assemble the agents into a collaborative workflow
    workflow = Collaborative(
        agents=[
            ${agents.map((_, index) => `agent_${index + 1}`).join(',\n            ')}
        ]
    )
    cl.user_session.set("workflow", workflow)`;
}

/**
 * Generates sequential workflow where agents process in order
 */
function generateSequentialWorkflow(agents: Agent[]): string {
    return `
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
}

/**
 * Generates Chainlit event handlers
 */
function generateChainlitHandlers(agents: Agent[], workflowInstantiation: string): string {
    const firstAgent = agents[0];
    const welcomeMessage = firstAgent?.welcome_message || 'Welcome to the agent workflow!';
    const inputPlaceholder = firstAgent?.input_placeholder || 'Start the workflow...';

    return `
@cl.on_chat_start
async def start_chat():
    ${workflowInstantiation}
    await cl.Message(content="${welcomeMessage}").send()


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
        chat_input_placeholder="${inputPlaceholder}",
    ).mount_app(port=port)
else:
    print("Chainlit Copilot API not available; using the default Chainlit UI on port", port)
`;
}
