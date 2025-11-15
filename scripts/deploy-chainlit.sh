#!/bin/bash
# Deploy Chainlit to Google Cloud Run
#
# This script builds and deploys the standalone Chainlit application to Cloud Run.
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Docker or Podman installed
# - GCP project configured
#
# Usage:
#   ./scripts/deploy-chainlit.sh [OPTIONS]
#
# Options:
#   --project-id      GCP Project ID (or set GCP_PROJECT_ID env var)
#   --region          GCP Region (default: us-central1)
#   --service-name    Cloud Run service name (default: chainlit-adk-app)
#   --image-name      Container image name (default: chainlit-adk-app)
#   --no-auth         Allow unauthenticated access (default: requires auth)
#   --env-file        Path to .env file with API keys (default: chainlit_app/.env)
#
# Example:
#   ./scripts/deploy-chainlit.sh --project-id my-project --region us-west1

set -e

# Default values
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${CHAINLIT_SERVICE_NAME:-chainlit-adk-app}"
IMAGE_NAME="chainlit-adk-app"
ALLOW_UNAUTHENTICATED=false
ENV_FILE="chainlit_app/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --service-name)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --image-name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --no-auth)
            ALLOW_UNAUTHENTICATED=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID is required.${NC}"
    echo "Set GCP_PROJECT_ID environment variable or use --project-id flag"
    exit 1
fi

echo -e "${GREEN}Starting Chainlit deployment to Cloud Run...${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Image Name: $IMAGE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with gcloud.${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    --project="$PROJECT_ID"

# Build the container image using Cloud Build
echo -e "${YELLOW}Building container image with Cloud Build...${NC}"
FULL_IMAGE_NAME="gcr.io/$PROJECT_ID/$IMAGE_NAME"

gcloud builds submit \
    --tag "$FULL_IMAGE_NAME" \
    --dockerfile=Dockerfile.chainlit \
    --project="$PROJECT_ID" \
    .

echo -e "${GREEN}Container image built successfully: $FULL_IMAGE_NAME${NC}"

# Prepare environment variables
ENV_VARS=""
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Loading environment variables from $ENV_FILE...${NC}"

    # Read .env file and create --set-env-vars parameter
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue

        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)

        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"

        if [ -n "$ENV_VARS" ]; then
            ENV_VARS="$ENV_VARS,$key=$value"
        else
            ENV_VARS="$key=$value"
        fi
    done < "$ENV_FILE"
fi

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"

DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
    --image $FULL_IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0"

if [ -n "$ENV_VARS" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --set-env-vars=\"$ENV_VARS\""
fi

if [ "$ALLOW_UNAUTHENTICATED" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --allow-unauthenticated"
fi

# Execute deployment
eval "$DEPLOY_CMD"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format 'value(status.url)')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
echo ""
echo "To view logs:"
echo "  gcloud logs tail --project=$PROJECT_ID --service=$SERVICE_NAME"
echo ""
echo "To update environment variables:"
echo "  gcloud run services update $SERVICE_NAME \\"
echo "    --region $REGION \\"
echo "    --project $PROJECT_ID \\"
echo "    --set-env-vars=\"KEY=value\""
echo ""
