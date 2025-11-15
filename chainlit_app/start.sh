#!/bin/bash
# Standalone Chainlit Start Script
# This script runs Chainlit as a dedicated instance without the Express backend

set -e

echo "Starting Chainlit as standalone instance..."

# Check if we're in the chainlit_app directory
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found. Please run this script from the chainlit_app directory or ensure main.py exists."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install/upgrade dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt
else
    echo "Warning: requirements.txt not found. Installing default Chainlit dependencies..."
    pip install --quiet chainlit python-dotenv
fi

# Set default port if not specified
export CHAINLIT_PORT=${CHAINLIT_PORT:-8000}

# Check if .env file exists and load it
if [ -f ".env" ]; then
    echo "Loading environment variables from .env..."
    set -a
    source .env
    set +a
fi

# Check for required API keys
if [ -z "$GEMINI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "WARNING: No API keys found. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in .env file."
fi

echo "Starting Chainlit server on port $CHAINLIT_PORT..."
echo "Access the UI at: http://localhost:$CHAINLIT_PORT"
echo ""

# Run Chainlit
exec chainlit run main.py --host 0.0.0.0 --port "$CHAINLIT_PORT"
