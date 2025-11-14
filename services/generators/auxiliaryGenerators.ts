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

<div align="center">

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_workspace=.&cloudshell_tutorial=CLOUD_SHELL_TUTORIAL.md)

**🚀 One-Click Deploy:** Click the button above, then run \`./one-click-deploy.sh\`

</div>

---

This multi-agent workflow was configured and generated using the **ADK & Chainlit Agent Builder**.

✨ **Compatible with Google Cloud Platform agent-starter-pack patterns**

## 📁 Project Structure

\`\`\`
├── backend/              # Python agent code
│   ├── __init__.py      # Package initialization
│   ├── main.py          # Agent workflow logic
│   └── tools.py         # Tool implementations
├── .github/
│   └── workflows/       # CI/CD automation
├── pyproject.toml       # Modern Python packaging
├── Makefile            # Development automation
├── .env.example        # Environment variables template
├── Dockerfile          # Container configuration
└── README.md           # This file
\`\`\`

## Workflow Overview: ${workflowType}

${agentOverview}

${memorySection}

## 🚀 Quick Start

### ⚡ Fastest Way (One-Click Deploy)

\`\`\`bash
# Step 1: Make script executable
chmod +x one-click-deploy.sh

# Step 2: Deploy!
./one-click-deploy.sh
\`\`\`

**What this does:**
- ✅ Checks requirements
- ✅ Sets up Python environment
- ✅ Installs dependencies
- ✅ Configures GCP
- ✅ Deploys to Cloud Run
- ✅ Returns your live agent URL

**Test locally first:**
\`\`\`bash
./one-click-deploy.sh --local-only
\`\`\`

### Using Make (Alternative)

\`\`\`bash
# Initialize project (creates venv, installs deps, creates .env)
make init

# Activate virtual environment
source .venv/bin/activate

# Run the application
make run
\`\`\`

### Manual Setup

1.  **Install Dependencies:**
    \`\`\`bash
    # Using pip with pyproject.toml
    pip install -e ".[dev]"

    # Or using requirements.txt (legacy)
    pip install -r requirements.txt
    \`\`\`

2.  **Set Environment Variables:**
    Copy \`.env.example\` to \`.env\` and add your API keys:
    \`\`\`bash
    cp .env.example .env
    # Edit .env with your credentials
    \`\`\`

3.  **Run the Chainlit App:**
    \`\`\`bash
    chainlit run backend/main.py -w
    # Or use make
    make run
    \`\`\`

4.  **Interact with your Agent:**
    Open your browser and navigate to \`http://localhost:8000\` to start chatting!

## 🛠️ Development

### Available Commands

\`\`\`bash
make help          # Show all available commands
make test          # Run tests with coverage
make lint          # Run linting checks
make format        # Format code
make type-check    # Run type checking
make clean         # Clean build artifacts
\`\`\`

### Code Quality

This project includes:
- **Ruff**: Fast Python linter
- **Black**: Code formatter
- **Mypy**: Type checking
- **Pytest**: Testing framework

Run all quality checks:
\`\`\`bash
make check
\`\`\`

## 🐳 Docker

### Build and Run

\`\`\`bash
# Build Docker image
make docker-build

# Run container
make docker-run

# Or use docker directly
docker build -t chainlit-adk-agent .
docker run -p 8080:8080 --env-file .env chainlit-adk-agent
\`\`\`

${deploymentSection}

## 📚 Learn More

- [Chainlit Documentation](https://docs.chainlit.io)
- [Google ADK Documentation](https://github.com/google/genai-agent-development-kit)
- [Agent Starter Pack](https://github.com/GoogleCloudPlatform/agent-starter-pack)
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
 * Generates GCP deployment instructions with enhanced features
 */
function generateGCPDeploymentSection(gcpConfig: GCPConfig): string {
    return `
## ☁️ Deploy to Google Cloud

This project is pre-configured for deployment to Google Cloud Run with enhanced features:

- ✅ Automated CI/CD with GitHub Actions
- ✅ Cloud Build integration with testing
- ✅ Multi-stage Docker builds for optimization
- ✅ Artifact Registry for image storage
- ✅ Production-ready health checks and monitoring

### Prerequisites

1.  **Google Cloud SDK:**
    \`\`\`bash
    # Install gcloud CLI
    # https://cloud.google.com/sdk/docs/install

    # Authenticate
    gcloud auth login
    \`\`\`

2.  **Setup GCP Project:**
    \`\`\`bash
    # Use the provided Makefile
    make gcp-setup

    # Or manually enable required APIs
    gcloud services enable \\
      cloudbuild.googleapis.com \\
      artifactregistry.googleapis.com \\
      run.googleapis.com \\
      --project=${gcpConfig.projectId}
    \`\`\`

### Deployment Options (Ranked by Simplicity)

#### ⭐ Option 1: One-Click Deploy (EASIEST!)

**From 7 steps to 2 steps:**

\`\`\`bash
chmod +x one-click-deploy.sh
./one-click-deploy.sh
\`\`\`

This single script:
- Handles ALL setup automatically
- Tests your code
- Deploys to Cloud Run
- Returns your live URL

**First time:** Script will prompt you to add API keys to \`.env\`, then run again.

#### Option 2: Cloud Shell Button

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor)

Click the button above, then run:
\`\`\`bash
./one-click-deploy.sh
\`\`\`

**Zero local setup required!**

#### Option 3: Makefile Commands

\`\`\`bash
make init      # One-time setup
make deploy    # Deploy to GCP
\`\`\`

#### Option 4: GitHub Actions (Automated)

Push to \`main\` branch = automatic deployment! 🎉

See \`.github/workflows/deploy.yml\` for configuration.

### GitHub Actions CI/CD

This project includes automated workflows in \`.github/workflows/\`:

- **\`ci.yml\`**: Runs tests, linting, and security checks on every push
- **\`deploy.yml\`**: Automatically deploys to Cloud Run on main branch

To enable GitHub Actions deployment:

1. Set up Workload Identity Federation (recommended) or add service account key to GitHub Secrets
2. Add these secrets to your GitHub repository:
   - \`WIF_PROVIDER\`: Workload Identity Provider
   - \`WIF_SERVICE_ACCOUNT\`: Service Account Email

### Post-Deployment

After deployment, you can:

\`\`\`bash
# View service details
gcloud run services describe ${gcpConfig.serviceName} \\
  --platform managed \\
  --region ${gcpConfig.region}

# View logs
gcloud run services logs read ${gcpConfig.serviceName} \\
  --platform managed \\
  --region ${gcpConfig.region}

# Get service URL
gcloud run services describe ${gcpConfig.serviceName} \\
  --platform managed \\
  --region ${gcpConfig.region} \\
  --format 'value(status.url)'
\`\`\`
`;
}

/**
 * Generates enhanced multi-stage Dockerfile for production deployment
 */
export const generateDockerfile = (): string => {
    return `# Multi-stage Dockerfile for Chainlit ADK Agent
# Optimized for production deployment on Google Cloud Run

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    make \\
    libffi-dev \\
    libssl-dev \\
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \\
    pip install --no-cache-dir -e .

# ============================================================================
# Stage 2: Runtime
# ============================================================================
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime system dependencies only
RUN apt-get update && apt-get install -y \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY backend/ ./backend/
COPY pyproject.toml ./
COPY README.md ./

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \\
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080
ENV ENVIRONMENT=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["chainlit", "run", "backend/main.py", "--host", "0.0.0.0", "--port", "8080"]
`;
};

/**
 * Generates cloudbuild.yaml for GCP Cloud Build with enhanced features
 */
export const generateCloudBuildYaml = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName, region } = gcpConfig;
    return `# Cloud Build configuration for Chainlit ADK Agent
# Builds and pushes Docker image to Artifact Registry

options:
  machineType: 'N1_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

substitutions:
  _SERVICE_NAME: ${serviceName}
  _REGION: ${region}
  _REPOSITORY: agent-repo

steps:
  # Run tests before building
  - name: 'python:3.11-slim'
    id: 'test'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        pip install -e ".[dev]"
        pytest || exit 1

  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build'
    args:
      - 'build'
      - '-t'
      - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:$COMMIT_SHA'
      - '-t'
      - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:latest'
      - '--cache-from'
      - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:latest'
      - '.'
    waitFor: ['test']

  # Push the image to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push'
    args:
      - 'push'
      - '--all-tags'
      - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}'
    waitFor: ['build']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'deploy'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - '\${_SERVICE_NAME}'
      - '--image'
      - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:$COMMIT_SHA'
      - '--region'
      - '\${_REGION}'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '2'
      - '--timeout'
      - '3600'
      - '--max-instances'
      - '10'
    waitFor: ['push']

images:
  - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:$COMMIT_SHA'
  - '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPOSITORY}/\${_SERVICE_NAME}:latest'

timeout: 1200s
`;
};

/**
 * Generates deploy.sh script for GCP deployment with validation
 */
export const generateDeploySh = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName, region } = gcpConfig;
    return `#!/bin/bash
set -e

# Configuration
export PROJECT_ID="${projectId}"
export SERVICE_NAME="${serviceName}"
export REGION="${region}"
export REPOSITORY="agent-repo"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}Deploying Chainlit ADK Agent to GCP\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""
echo "Project ID:    $PROJECT_ID"
echo "Service Name:  $SERVICE_NAME"
echo "Region:        $REGION"
echo ""

# Validate gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "\${RED}Error: gcloud CLI not found. Please install it first.\${NC}"
    exit 1
fi

# Validate authentication
echo -e "\${YELLOW}Checking authentication...\${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "\${RED}Error: Not authenticated with gcloud. Run 'gcloud auth login'\${NC}"
    exit 1
fi

# Set project
echo -e "\${YELLOW}Setting project to $PROJECT_ID...\${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "\${YELLOW}Enabling required APIs...\${NC}"
gcloud services enable \\
    cloudbuild.googleapis.com \\
    artifactregistry.googleapis.com \\
    run.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo -e "\${YELLOW}Ensuring Artifact Registry repository exists...\${NC}"
if ! gcloud artifacts repositories describe "$REPOSITORY" \\
    --location="$REGION" &> /dev/null; then
    echo "Creating repository $REPOSITORY..."
    gcloud artifacts repositories create "$REPOSITORY" \\
        --repository-format=docker \\
        --location="$REGION" \\
        --description="Agent Docker repository"
else
    echo "Repository $REPOSITORY already exists."
fi

# Submit build to Cloud Build
echo -e "\${YELLOW}Submitting build to Cloud Build...\${NC}"
gcloud builds submit \\
    --config cloudbuild.yaml \\
    --project="$PROJECT_ID" \\
    --region="$REGION"

# Get service URL
echo ""
echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}Deployment completed successfully!\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""
echo -e "\${YELLOW}Service URL:\${NC}"
gcloud run services describe "$SERVICE_NAME" \\
    --platform managed \\
    --region "$REGION" \\
    --format 'value(status.url)'
`;
};

/**
 * Generates .gcloudignore for GCP deployment
 */
export const generateGcloudIgnore = (): string => {
    return `.git
.gitignore
.venv/
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
.pytest_cache/
.mypy_cache/
.ruff_cache/
.coverage
htmlcov/
.env
.env.local
gcp-credentials.json
*.json.key
tests/
docs/
*.md
!README.md
node_modules/
.DS_Store
`;
};

/**
 * Generates .dockerignore for Docker builds
 */
export const generateDockerignore = (): string => {
    return `.git
.gitignore
.venv
venv
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist
build
.pytest_cache
.mypy_cache
.ruff_cache
.coverage
htmlcov
.env
.env.local
gcp-credentials.json
*.json.key
tests
*.md
!README.md
Dockerfile
.dockerignore
docker-compose.yml
.github
node_modules
.DS_Store
Makefile
`;
};
