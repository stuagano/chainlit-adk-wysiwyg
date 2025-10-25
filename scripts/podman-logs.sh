#!/bin/bash
# Chainlit ADK WYSIWYG - Podman Logs Script
# View container logs

set -e

CONTAINER_NAME="${1:-chainlit-adk-wysiwyg}"
FOLLOW="${2:--f}"

echo "Viewing logs for container: ${CONTAINER_NAME}"
echo "=================================================="

# Check if container exists
if ! podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '${CONTAINER_NAME}' not found!"
  echo ""
  echo "Available containers:"
  podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  exit 1
fi

# Follow logs
podman logs ${FOLLOW} "${CONTAINER_NAME}"
