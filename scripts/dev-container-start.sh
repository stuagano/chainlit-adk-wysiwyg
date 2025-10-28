#!/bin/bash
# Chainlit ADK WYSIWYG - Start Development Container
# Starts all development services with hot-reload in container

set -e

COMPOSE_FILE="docker-compose.dev.yml"

echo "Starting Development Container Environment..."
echo "=================================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  WARNING: .env.local not found!"
  echo ""
  echo "Creating .env.local from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "Please edit .env.local and add your API keys:"
    echo "  - GEMINI_API_KEY (required)"
    echo "  - OPENAI_API_KEY (optional)"
    echo ""
    read -p "Press Enter after configuring .env.local, or Ctrl+C to exit..."
  else
    echo "❌ ERROR: .env.example not found!"
    exit 1
  fi
fi

# Load environment variables
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  set -a
  source .env.local
  set +a
fi

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
  echo ""
  echo "❌ ERROR: GEMINI_API_KEY is not set!"
  echo "Please set it in .env.local"
  exit 1
fi

# Check if Docker or Podman is available
if command -v docker &> /dev/null; then
  CONTAINER_CMD="docker"
  COMPOSE_CMD="docker compose"
elif command -v podman &> /dev/null; then
  CONTAINER_CMD="podman"
  if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
  else
    echo ""
    echo "❌ ERROR: podman-compose is not installed!"
    echo "Install it with: pip install podman-compose"
    exit 1
  fi
else
  echo ""
  echo "❌ ERROR: Neither Docker nor Podman is installed!"
  echo "Please install Docker or Podman to continue."
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Build the development image if needed
echo "Building development image (if needed)..."
$COMPOSE_CMD -f $COMPOSE_FILE build

echo ""
echo "Starting development services..."
echo ""

# Start services in detached mode
$COMPOSE_CMD -f $COMPOSE_FILE up -d

echo ""
echo "✅ Development container started successfully!"
echo ""
echo "Services available at:"
echo "  🎨 Frontend (Vite):     http://localhost:3000"
echo "  🔧 Backend API:         http://localhost:3001"
echo "  🤖 Chainlit Server:     http://localhost:8000"
echo ""
echo "Useful commands:"
echo "  📋 View logs:           $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "  🔍 View specific logs:  $COMPOSE_CMD -f $COMPOSE_FILE logs -f dev"
echo "  🐚 Shell into container: ./scripts/dev-container-shell.sh"
echo "  🔄 Restart services:    $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "  🛑 Stop services:       $COMPOSE_CMD -f $COMPOSE_FILE down"
echo ""
echo "Following logs (Ctrl+C to exit, services keep running)..."
echo ""

# Follow logs
$COMPOSE_CMD -f $COMPOSE_FILE logs -f
