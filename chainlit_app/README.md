# Chainlit Application Directory

This directory contains the generated Chainlit application that runs your AI agent workflows.

## Quick Start

### Local Development

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   ```bash
   GEMINI_API_KEY=your_key_here
   ```

3. **Run the standalone server:**
   ```bash
   ./start.sh
   ```

4. **Access the UI:**
   Open http://localhost:8000 in your browser

### Using the UI Builder

1. Use the main UI builder (port 3000) to design your agent workflow
2. Click "Generate Code" to create the Python files
3. Click "Sync to Chainlit" to update this directory
4. The Chainlit server will auto-reload with your changes

## Files

- **main.py** - Generated agent workflow and Chainlit event handlers
- **tools.py** - Generated tool implementations
- **requirements.txt** - Python dependencies
- **start.sh** - Standalone startup script
- **.env** - Environment variables (API keys, configuration)
- **.env.example** - Template for environment variables

## Deployment

See [CHAINLIT_DEPLOYMENT.md](../docs/CHAINLIT_DEPLOYMENT.md) for detailed deployment instructions to:

- Google Cloud Run
- Docker/Podman containers
- Other cloud platforms

### Quick Cloud Run Deployment

```bash
# From the project root
./scripts/deploy-chainlit.sh --project-id YOUR_GCP_PROJECT
```

## Development Tips

### Running with Auto-Reload

```bash
# From project root
npm run chainlit:dev
```

This watches for file changes and auto-reloads.

### Running as Standalone

```bash
# From project root
npm run chainlit:standalone

# Or directly in this directory
./start.sh
```

### Building Docker Image

```bash
# From project root
npm run chainlit:build

# Or manually
docker build -f Dockerfile.chainlit -t chainlit-app ..
docker run -p 8000:8000 --env-file .env chainlit-app
```

## Troubleshooting

### Missing main.py

If `main.py` is missing, use the UI builder to:
1. Configure your agents and tools
2. Click "Generate Code"
3. Click "Sync to Chainlit"

### Import Errors

```bash
# Reinstall dependencies
source .venv/bin/activate
pip install -r requirements.txt
```

### API Key Issues

Check that your `.env` file has the correct API keys:
```bash
cat .env
```

### Port Already in Use

Change the port in `.env`:
```bash
CHAINLIT_PORT=8001
```

## Learn More

- [Chainlit Documentation](https://docs.chainlit.io/)
- [Google ADK Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview)
- [Main Project README](../README.md)
- [Deployment Guide](../docs/CHAINLIT_DEPLOYMENT.md)
