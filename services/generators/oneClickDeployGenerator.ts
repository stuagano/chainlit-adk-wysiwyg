/**
 * One-Click Deployment Script Generator
 *
 * Generates a single script that handles everything from setup to deployment
 */

import { GCPConfig } from '../../types';

/**
 * Generates a comprehensive one-click deployment script
 * @param gcpConfig - GCP deployment configuration
 * @returns Complete setup and deployment script
 */
export const generateOneClickDeploy = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName, region } = gcpConfig;

    return `#!/bin/bash
# ============================================================================
# One-Click Deployment Script for Chainlit ADK Agent
# ============================================================================
# This script automates the entire deployment process:
# 1. Environment setup
# 2. GCP configuration
# 3. Dependency installation
# 4. Deployment to Cloud Run
#
# Usage: ./one-click-deploy.sh [--local-only | --skip-tests]
# ============================================================================

set -e

# Configuration
PROJECT_ID="${projectId}"
SERVICE_NAME="${serviceName}"
REGION="${region}"
REPOSITORY="agent-repo"

# Parse arguments
LOCAL_ONLY=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --local-only)
      LOCAL_ONLY=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

echo -e "\${BLUE}╔════════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${BLUE}║       One-Click Chainlit ADK Agent Deployment                 ║\${NC}"
echo -e "\${BLUE}╚════════════════════════════════════════════════════════════════╝\${NC}"
echo ""

# ============================================================================
# Step 1: Environment Check
# ============================================================================
echo -e "\${YELLOW}[1/6] Checking environment...\${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "\${RED}✗ Python 3 not found. Please install Python 3.10+\${NC}"
    exit 1
fi

PYTHON_VERSION=\$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if (( \$(echo "\$PYTHON_VERSION < 3.10" | bc -l) )); then
    echo -e "\${RED}✗ Python 3.10+ required (found \$PYTHON_VERSION)\${NC}"
    exit 1
fi

echo -e "\${GREEN}✓ Python \$PYTHON_VERSION found\${NC}"

if ! command -v gcloud &> /dev/null && [ "\$LOCAL_ONLY" = false ]; then
    echo -e "\${RED}✗ gcloud CLI not found. Installing...\${NC}"
    curl https://sdk.cloud.google.com | bash
    exec -l \$SHELL
fi

if [ "\$LOCAL_ONLY" = false ]; then
    echo -e "\${GREEN}✓ gcloud CLI found\${NC}"
fi

# ============================================================================
# Step 2: Python Environment Setup
# ============================================================================
echo ""
echo -e "\${YELLOW}[2/6] Setting up Python environment...\${NC}"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "\${GREEN}✓ Virtual environment created\${NC}"
else
    echo -e "\${GREEN}✓ Virtual environment exists\${NC}"
fi

source .venv/bin/activate

echo -e "\${BLUE}Installing dependencies...\${NC}"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install -e ".[dev]" > /dev/null 2>&1

echo -e "\${GREEN}✓ Dependencies installed\${NC}"

# ============================================================================
# Step 3: Environment Variables
# ============================================================================
echo ""
echo -e "\${YELLOW}[3/6] Configuring environment variables...\${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "\${YELLOW}⚠ .env file created from template\${NC}"
        echo -e "\${YELLOW}⚠ Please edit .env and add your API keys\${NC}"
        echo -e "\${YELLOW}⚠ Then run this script again\${NC}"

        # Check if editor is available
        if command -v \$EDITOR &> /dev/null; then
            read -p "Open .env in editor now? (y/n) " -n 1 -r
            echo
            if [[ \$REPLY =~ ^[Yy]$ ]]; then
                \$EDITOR .env
            fi
        fi
        exit 0
    else
        echo -e "\${RED}✗ .env.example not found\${NC}"
        exit 1
    fi
else
    echo -e "\${GREEN}✓ .env file found\${NC}"
fi

# Validate required environment variables
source .env

REQUIRED_VARS=()
if grep -q "openai" backend/main.py 2>/dev/null; then
    REQUIRED_VARS+=("OPENAI_API_KEY")
fi
if grep -q "gemini\\|VertexAI" backend/main.py 2>/dev/null; then
    REQUIRED_VARS+=("GOOGLE_APPLICATION_CREDENTIALS")
fi

for var in "\${REQUIRED_VARS[@]}"; do
    if [ -z "\${!var}" ]; then
        echo -e "\${RED}✗ Required environment variable not set: \$var\${NC}"
        echo -e "\${YELLOW}Please edit .env and add \$var\${NC}"
        exit 1
    fi
done

echo -e "\${GREEN}✓ All required environment variables set\${NC}"

# ============================================================================
# Step 4: Local Testing
# ============================================================================
echo ""
echo -e "\${YELLOW}[4/6] Running tests...\${NC}"

if [ "\$SKIP_TESTS" = false ]; then
    if [ -d "tests" ]; then
        pytest --tb=short || {
            echo -e "\${RED}✗ Tests failed\${NC}"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
        echo -e "\${GREEN}✓ Tests passed\${NC}"
    else
        echo -e "\${YELLOW}⚠ No tests found, skipping...\${NC}"
    fi
else
    echo -e "\${YELLOW}⚠ Tests skipped\${NC}"
fi

# ============================================================================
# Step 5: Local Run Option
# ============================================================================
if [ "\$LOCAL_ONLY" = true ]; then
    echo ""
    echo -e "\${GREEN}╔════════════════════════════════════════════════════════════════╗\${NC}"
    echo -e "\${GREEN}║           Starting Local Chainlit Server                      ║\${NC}"
    echo -e "\${GREEN}╚════════════════════════════════════════════════════════════════╝\${NC}"
    echo ""
    echo -e "\${BLUE}Access your agent at: http://localhost:8000\${NC}"
    echo -e "\${YELLOW}Press Ctrl+C to stop\${NC}"
    echo ""
    chainlit run backend/main.py -w
    exit 0
fi

# ============================================================================
# Step 6: GCP Deployment
# ============================================================================
echo ""
echo -e "\${YELLOW}[5/6] Configuring GCP...\${NC}"

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "\${YELLOW}⚠ Not authenticated with GCP\${NC}"
    gcloud auth login
fi

echo -e "\${GREEN}✓ Authenticated with GCP\${NC}"

# Set project
gcloud config set project "\$PROJECT_ID" --quiet
echo -e "\${GREEN}✓ Project set to \$PROJECT_ID\${NC}"

# Enable required APIs
echo -e "\${BLUE}Enabling required APIs...\${NC}"
gcloud services enable \\
    cloudbuild.googleapis.com \\
    artifactregistry.googleapis.com \\
    run.googleapis.com \\
    --quiet

echo -e "\${GREEN}✓ APIs enabled\${NC}"

# Create repository if needed
if ! gcloud artifacts repositories describe "\$REPOSITORY" \\
    --location="\$REGION" &> /dev/null; then
    echo -e "\${BLUE}Creating Artifact Registry repository...\${NC}"
    gcloud artifacts repositories create "\$REPOSITORY" \\
        --repository-format=docker \\
        --location="\$REGION" \\
        --description="Agent Docker repository" \\
        --quiet
    echo -e "\${GREEN}✓ Repository created\${NC}"
else
    echo -e "\${GREEN}✓ Repository exists\${NC}"
fi

# ============================================================================
# Step 7: Deploy
# ============================================================================
echo ""
echo -e "\${YELLOW}[6/6] Deploying to Cloud Run...\${NC}"
echo -e "\${BLUE}This may take 5-10 minutes...\${NC}"
echo ""

gcloud builds submit \\
    --config cloudbuild.yaml \\
    --project="\$PROJECT_ID" \\
    --region="\$REGION" \\
    --quiet

# Get service URL
SERVICE_URL=\$(gcloud run services describe "\$SERVICE_NAME" \\
    --platform managed \\
    --region "\$REGION" \\
    --format 'value(status.url)')

# ============================================================================
# Success!
# ============================================================================
echo ""
echo -e "\${GREEN}╔════════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║                 🎉 Deployment Successful! 🎉                   ║\${NC}"
echo -e "\${GREEN}╚════════════════════════════════════════════════════════════════╝\${NC}"
echo ""
echo -e "\${BLUE}Your agent is now running at:\${NC}"
echo -e "\${GREEN}\$SERVICE_URL\${NC}"
echo ""
echo -e "\${YELLOW}Next steps:\${NC}"
echo "  • Visit the URL above to interact with your agent"
echo "  • View logs: gcloud run services logs read \$SERVICE_NAME --region=\$REGION"
echo "  • Update deployment: Run this script again"
echo ""
echo -e "\${BLUE}Useful commands:\${NC}"
echo "  • Local run: ./one-click-deploy.sh --local-only"
echo "  • Redeploy: ./one-click-deploy.sh"
echo "  • View logs: make logs (or gcloud run services logs read \$SERVICE_NAME)"
echo ""
`;
};

/**
 * Generates a Cloud Shell button configuration
 * This allows users to deploy directly from the Cloud Console
 */
export const generateCloudShellTutorial = (gcpConfig: GCPConfig): string => {
    const { projectId, serviceName } = gcpConfig;

    return `# Cloud Shell Deployment Tutorial

## One-Click Deploy from Cloud Shell

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=YOUR_REPO_URL&cloudshell_tutorial=TUTORIAL.md)

This button will:
1. Clone the repository
2. Open in Cloud Shell Editor
3. Guide you through deployment

## Manual Cloud Shell Deployment

If you prefer manual deployment:

\`\`\`bash
# 1. Clone or upload your code to Cloud Shell
# (Files are already uploaded if you clicked the button above)

# 2. Run one-click deployment
chmod +x one-click-deploy.sh
./one-click-deploy.sh

# That's it! ✨
\`\`\`

## Environment Variables in Cloud Shell

The script will prompt you to configure environment variables.
You can also set them using Secret Manager:

\`\`\`bash
# Store API key in Secret Manager
echo -n "your-api-key" | gcloud secrets create openai-api-key \\
  --data-file=- \\
  --project=${projectId}

# Grant Cloud Run access to the secret
gcloud run services update ${serviceName} \\
  --update-secrets=OPENAI_API_KEY=openai-api-key:latest \\
  --region=us-central1
\`\`\`

## Troubleshooting

If deployment fails:

1. **Check APIs are enabled:**
   \`\`\`bash
   gcloud services list --enabled --project=${projectId}
   \`\`\`

2. **Check authentication:**
   \`\`\`bash
   gcloud auth list
   \`\`\`

3. **View build logs:**
   \`\`\`bash
   gcloud builds list --project=${projectId}
   \`\`\`

4. **Test locally first:**
   \`\`\`bash
   ./one-click-deploy.sh --local-only
   \`\`\`
`;
};
