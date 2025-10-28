#!/bin/bash
# Chainlit ADK WYSIWYG - Stop Development Container
# Stops all development services

set -e

COMPOSE_FILE="docker-compose.dev.yml"

echo "Stopping Development Container Environment..."
echo "=================================================="

# Check if Docker or Podman is available
if command -v docker &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v podman-compose &> /dev/null; then
  COMPOSE_CMD="podman-compose"
else
  echo "❌ ERROR: Neither docker-compose nor podman-compose is available!"
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Stop and remove containers
$COMPOSE_CMD -f $COMPOSE_FILE down

echo ""
echo "✅ Development containers stopped and removed successfully!"
echo ""
echo "To start again, run:"
echo "  ./scripts/dev-container-start.sh"
echo ""
