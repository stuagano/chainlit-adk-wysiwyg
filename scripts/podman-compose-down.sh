#!/bin/bash
# Chainlit ADK WYSIWYG - Podman Compose Down Script
# Stops and removes containers

set -e

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
  echo "ERROR: podman-compose is not installed!"
  echo ""
  echo "To stop containers started with podman-run.sh, use:"
  echo "  podman stop chainlit-adk-wysiwyg"
  echo "  podman rm chainlit-adk-wysiwyg"
  exit 1
fi

echo "Stopping services with podman-compose..."
echo "=================================================="

# Stop and remove containers
podman-compose -f podman-compose.yml down

echo ""
echo "Services stopped and removed successfully!"
