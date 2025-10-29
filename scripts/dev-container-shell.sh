#!/bin/bash
# Chainlit ADK WYSIWYG - Development Container Shell
# Opens an interactive shell in the development container

set -e

CONTAINER_NAME="chainlit-adk-dev"

echo "Opening shell in development container..."
echo "=================================================="

# Check if Docker or Podman is available
if command -v docker &> /dev/null; then
  CONTAINER_CMD="docker"
elif command -v podman &> /dev/null; then
  CONTAINER_CMD="podman"
else
  echo "❌ ERROR: Neither Docker nor Podman is installed!"
  exit 1
fi

# Check if container is running
if ! $CONTAINER_CMD ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ ERROR: Container '${CONTAINER_NAME}' is not running!"
  echo ""
  echo "Start the development environment first:"
  echo "  ./scripts/dev-container-start.sh"
  echo ""
  exit 1
fi

echo "✅ Connected to container: ${CONTAINER_NAME}"
echo ""
echo "You are now inside the development container."
echo "Working directory: /workspace"
echo ""
echo "Useful commands:"
echo "  npm run dev             # Start frontend"
echo "  npm run dev:backend     # Start backend"
echo "  npm run chainlit:dev    # Start Chainlit"
echo "  npm test                # Run tests"
echo "  exit                    # Exit shell"
echo ""
echo "=================================================="
echo ""

# Open interactive shell
$CONTAINER_CMD exec -it $CONTAINER_NAME /bin/bash
