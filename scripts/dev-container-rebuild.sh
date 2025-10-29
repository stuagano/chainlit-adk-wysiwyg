#!/bin/bash
# Chainlit ADK WYSIWYG - Rebuild Development Container
# Rebuilds the development container from scratch

set -e

COMPOSE_FILE="docker-compose.dev.yml"

echo "Rebuilding Development Container..."
echo "=================================================="

# Check if Docker or Podman is available
if command -v docker &> /dev/null; then
  COMPOSE_CMD="docker compose"
  CONTAINER_CMD="docker"
elif command -v podman &> /dev/null; then
  if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    CONTAINER_CMD="podman"
  else
    echo "❌ ERROR: podman-compose is not installed!"
    exit 1
  fi
else
  echo "❌ ERROR: Neither Docker nor Podman is installed!"
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Stop running containers
echo "Stopping existing containers..."
$COMPOSE_CMD -f $COMPOSE_FILE down

# Remove old image
echo ""
echo "Removing old development image..."
$CONTAINER_CMD rmi chainlit-adk-wysiwyg:dev 2>/dev/null || true

# Rebuild with no cache
echo ""
echo "Building new development image (no cache)..."
$COMPOSE_CMD -f $COMPOSE_FILE build --no-cache

echo ""
echo "✅ Development container rebuilt successfully!"
echo ""
echo "To start the development environment:"
echo "  ./scripts/dev-container-start.sh"
echo ""
