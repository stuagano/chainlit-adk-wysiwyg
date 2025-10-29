#!/bin/bash
# Chainlit ADK WYSIWYG - Development Container Logs
# View logs from development containers

set -e

COMPOSE_FILE="docker-compose.dev.yml"
SERVICE="${1:-dev}"
FOLLOW="${2:--f}"

echo "Viewing logs for service: ${SERVICE}"
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

# Check if service is specified
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: $0 [SERVICE] [OPTIONS]"
  echo ""
  echo "Services:"
  echo "  dev         All services (default)"
  echo "  frontend    Frontend only (when using separate profile)"
  echo "  backend     Backend only (when using separate profile)"
  echo "  chainlit    Chainlit only (when using separate profile)"
  echo ""
  echo "Options:"
  echo "  -f          Follow logs (default)"
  echo "  --no-follow Don't follow, just show recent logs"
  echo ""
  echo "Examples:"
  echo "  $0                    # Follow all logs"
  echo "  $0 dev                # Follow dev service logs"
  echo "  $0 dev --no-follow    # Show recent logs without following"
  exit 0
fi

# Follow logs
if [ "$FOLLOW" == "--no-follow" ]; then
  $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100 $SERVICE
else
  $COMPOSE_CMD -f $COMPOSE_FILE logs -f $SERVICE
fi
