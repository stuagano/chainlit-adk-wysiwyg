#!/bin/bash
# Chainlit ADK WYSIWYG - Podman Build Script
# Builds the container image using Podman

set -e

IMAGE_NAME="chainlit-adk-wysiwyg"
TAG="${1:-latest}"

echo "Building Podman container image: ${IMAGE_NAME}:${TAG}"
echo "=================================================="

# Build the container using Podman
podman build \
  --file Containerfile \
  --tag "${IMAGE_NAME}:${TAG}" \
  --format docker \
  .

echo ""
echo "Build complete!"
echo "Image: ${IMAGE_NAME}:${TAG}"
echo ""
echo "Next steps:"
echo "  - Run with compose: ./scripts/podman-compose-up.sh"
echo "  - Run standalone:   ./scripts/podman-run.sh"
echo "  - List images:      podman images | grep ${IMAGE_NAME}"
