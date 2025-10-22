/**
 * Auxiliary File Generators
 *
 * Generates supporting files like requirements.txt, README.md,
 * Dockerfile, and GCP deployment scripts.
 */

import { Agent, GCPConfig, WorkflowType } from '../../types';

/**
 * Generates requirements.txt with necessary Python dependencies
 */
export const generateRequirementsTxt = (agents: Agent[], gcpConfig: GCPConfig): string => {
    const requirements = new Set<string>(['chainlit', 'requests']);
    const allModels = agents.map(agent => agent.llmModel);

    if (allModels.some(model => !model.startsWith('gemini'))) {
        requirements.add('openai');
    }
    if (allModels.some(model => model.startsWith('gemini')) || gcpConfig.useMemoryBank) {
        requirements.add('google-cloud-aiplatform');
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

/**
 * Generates README.md with setup and deployment instructions
 */
export const generateReadme = (agents: Agent[], gcpConfig: GCPConfig, workflowType: WorkflowType): string => {
    const hasGcpConfig = gcpConfig.projectId;
    const agentOverview = generateAgentOverview(agents, workflowType);
    const memorySection = generateMemorySection(gcpConfig);
    const deploymentSection = hasGcpConfig ? generateGCPDeploymentSection(gcpConfig) : `
## ☁️ Deploy to GCP Agent Engine
...
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

/**
 * Generates agent overview section based on workflow type
 */
function generateAgentOverview(agents: Agent[], workflowType: WorkflowType): string {
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

    const agentListItem = (agent: Agent) =>
        `- **${agent.name}** (LLM: \`${agent.llmModel}\`): ${agent.tools.length > 0 ? `(Tools: ${agent.tools.map(t => `\`${t.name}\``).join(', ')})` : ''}`;

    switch (workflowType) {
        case 'Hierarchical':
            return `This is a hierarchical workflow where agents operate in a supervisor-subordinate structure.\n\n${buildAgentTree()}`;
        case 'Collaborative':
            return `This is a collaborative workflow where ${agents.length} agents work as a team of peers.\n\n` + agents.map(agentListItem).join('\n');
        case 'Sequential':
        default:
            return `This is a sequential workflow consisting of ${agents.length} agent(s). The output of one agent is passed as the input to the next.\n\n` +
                   agents.map((agent, index) =>
                       `**Step ${index + 1}: ${agent.name}** (LLM: \`${agent.llmModel}\`)\n   - **Tools:** ${agent.tools.length > 0 ? agent.tools.map(t => `\`${t.name}\``).join(', ') : 'None'}`
                   ).join('\n');
    }
}

/**
 * Generates memory configuration section
 */
function generateMemorySection(gcpConfig: GCPConfig): string {
    return gcpConfig.useMemoryBank ? `
### 🧠 Memory Bank

This agent is configured to use **GCP Memory Bank**, providing a persistent, managed memory solution. Ensure your deployment environment has the correct permissions to access the Memory Bank API in project \`${gcpConfig.projectId}\`.
` : `
### 🧠 Local Memory

This agent is configured to use in-memory storage, which is reset on each session start. For persistent memory, consider enabling Memory Bank in the GCP settings and redeploying.
`;
}

/**
 * Generates GCP deployment instructions
 */
function generateGCPDeploymentSection(gcpConfig: GCPConfig): string {
    return `
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
`;
}

/**
 * Generates Dockerfile for containerization
 */
export const generateDockerfile = (): string => {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV AGENT_ENGINE_DEPLOYMENT=false
ENV PORT 8080
EXPOSE 8080
CMD ["chainlit", "run", "main.py", "--host", "0.0.0.0", "--port", "8080"]
`;
};

/**
 * Generates cloudbuild.yaml for GCP Cloud Build
 */
export const generateCloudBuildYaml = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName, region } = gcpConfig;
    return `steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '${region}-docker.pkg.dev/${projectId}/agent-engine-repo/${serviceName}:latest', '.']

  # Push the image to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${region}-docker.pkg.dev/${projectId}/agent-engine-repo/${serviceName}:latest']

images:
  - '${region}-docker.pkg.dev/${projectId}/agent-engine-repo/${serviceName}:latest'
`;
};

/**
 * Generates deploy.sh script for GCP deployment
 */
export const generateDeploySh = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName, region } = gcpConfig;
    return `#!/bin/bash
export PROJECT_ID="${projectId}"
export SERVICE_NAME="${serviceName}"
export REGION="${region}"

echo "Deploying to GCP Agent Engine..."
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"

# Submit to Cloud Build
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID
`;
};

/**
 * Generates .gcloudignore for GCP deployment
 */
export const generateGcloudIgnore = (): string => {
    return `venv/
__pycache__/
*.pyc
.env
gcp-credentials.json
`;
};
