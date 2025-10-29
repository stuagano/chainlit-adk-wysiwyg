#!/bin/bash
# Chainlit ADK WYSIWYG - Podman Run Script
# Runs the container directly with Podman (without compose)

set -e

IMAGE_NAME="chainlit-adk-wysiwyg"
TAG="${1:-latest}"
CONTAINER_NAME="chainlit-adk-wysiwyg"

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY is not set!"
  echo "Please set it in .env.local or export it as an environment variable."
  exit 1
fi

echo "Running Podman container: ${IMAGE_NAME}:${TAG}"
echo "=================================================="

# Remove existing container if it exists
if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing existing container: ${CONTAINER_NAME}"
  podman rm -f "${CONTAINER_NAME}"
fi

# Run the container
podman run -d \
  --name "${CONTAINER_NAME}" \
  --publish 3001:3001 \
  --publish 8000:8000 \
  --env GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --env OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  --env NODE_ENV=production \
  --env BACKEND_PORT=3001 \
  --env CHAINLIT_PORT=8000 \
  --env GCP_PROJECT_ID="${GCP_PROJECT_ID:-}" \
  --env GCP_REGION="${GCP_REGION:-us-central1}" \
  --env DEBUG="${DEBUG:-false}" \
  --restart unless-stopped \
  "${IMAGE_NAME}:${TAG}"

echo ""
echo "Container started successfully!"
echo "Container name: ${CONTAINER_NAME}"
echo ""
echo "Services available at:"
echo "  - Backend API: http://localhost:3001"
echo "  - Chainlit UI:  http://localhost:8000"
echo ""
echo "Useful commands:"
echo "  - View logs:    podman logs -f ${CONTAINER_NAME}"
echo "  - Stop:         podman stop ${CONTAINER_NAME}"
echo "  - Restart:      podman restart ${CONTAINER_NAME}"
echo "  - Remove:       podman rm -f ${CONTAINER_NAME}"
