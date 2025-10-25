#!/bin/bash
# Chainlit ADK WYSIWYG - Podman Compose Up Script
# Starts the application using podman-compose

set -e

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
  echo "ERROR: podman-compose is not installed!"
  echo ""
  echo "Install it with:"
  echo "  pip install podman-compose"
  echo ""
  echo "Or use the standalone script:"
  echo "  ./scripts/podman-run.sh"
  exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  set -a
  source .env.local
  set +a
fi

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY is not set!"
  echo "Please set it in .env.local or export it as an environment variable."
  exit 1
fi

echo "Starting services with podman-compose..."
echo "=================================================="

# Start services
podman-compose -f podman-compose.yml up -d

echo ""
echo "Services started successfully!"
echo ""
echo "Services available at:"
echo "  - Backend API: http://localhost:3001"
echo "  - Chainlit UI:  http://localhost:8000"
echo ""
echo "Useful commands:"
echo "  - View logs:    podman-compose -f podman-compose.yml logs -f"
echo "  - Stop:         podman-compose -f podman-compose.yml down"
echo "  - Restart:      podman-compose -f podman-compose.yml restart"
echo "  - Status:       podman-compose -f podman-compose.yml ps"
