# Chainlit Standalone Deployment Guide

This guide explains how to deploy Chainlit as a standalone instance to Google Cloud Run, independent of the UI builder and backend API.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Standalone Setup](#local-standalone-setup)
- [Cloud Run Deployment](#cloud-run-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

The Chainlit ADK WYSIWYG builder creates two separate components:

1. **UI Builder + Backend** - Visual interface for designing agent workflows (development only)
2. **Chainlit Application** - The actual conversational AI interface (deployment target)

This guide focuses on deploying **only the Chainlit application** as a standalone service.

### Why Standalone Deployment?

- **Smaller container size** - Only Python dependencies, no Node.js
- **Better security** - No development tools in production
- **Easier scaling** - Single service to manage
- **Lower cost** - Reduced memory and CPU requirements

## Prerequisites

### For Local Testing

- Python 3.10 or higher
- Bash shell (Linux/macOS/WSL)
- Generated Chainlit code in `chainlit_app/` directory

### For Cloud Run Deployment

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install)
- Docker or Podman
- GCP project with billing enabled
- API keys (GEMINI_API_KEY, OPENAI_API_KEY, etc.)

## Local Standalone Setup

### Option 1: Using the Start Script (Recommended)

```bash
# Navigate to chainlit_app directory
cd chainlit_app

# Run the standalone start script
./start.sh
```

The script will:
1. Create a Python virtual environment if needed
2. Install dependencies from `requirements.txt`
3. Load environment variables from `.env`
4. Start Chainlit on port 8000

### Option 2: Using npm Scripts

```bash
# From project root
npm run chainlit:start

# Or for a production-like setup
npm run chainlit:standalone
```

### Option 3: Manual Setup

```bash
cd chainlit_app

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
cat > .env << EOF
GEMINI_API_KEY=your_key_here
EOF

# Start Chainlit
chainlit run main.py --host 0.0.0.0 --port 8000
```

Access the application at: http://localhost:8000

## Cloud Run Deployment

### Quick Deployment

The easiest way to deploy is using the deployment script:

```bash
# Set your GCP project ID
export GCP_PROJECT_ID="your-project-id"

# Run the deployment script
./scripts/deploy-chainlit.sh --project-id $GCP_PROJECT_ID --region us-central1 --no-auth
```

The script will:
1. Build the Docker image using Cloud Build
2. Deploy to Cloud Run
3. Configure environment variables from `chainlit_app/.env`
4. Return the service URL

### Manual Deployment

#### Step 1: Prepare Environment Variables

Create `chainlit_app/.env` with your API keys:

```bash
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

#### Step 2: Build the Container

```bash
# Build using Cloud Build
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/chainlit-adk-app \
  --dockerfile=Dockerfile.chainlit \
  .

# Or build locally with Docker
docker build -f Dockerfile.chainlit -t chainlit-adk-app .
docker tag chainlit-adk-app gcr.io/YOUR_PROJECT_ID/chainlit-adk-app
docker push gcr.io/YOUR_PROJECT_ID/chainlit-adk-app
```

#### Step 3: Deploy to Cloud Run

```bash
# Deploy with environment variables
gcloud run deploy chainlit-adk-app \
  --image gcr.io/YOUR_PROJECT_ID/chainlit-adk-app \
  --platform managed \
  --region us-central1 \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="GEMINI_API_KEY=your_key" \
  --allow-unauthenticated
```

#### Step 4: Get the Service URL

```bash
gcloud run services describe chainlit-adk-app \
  --region us-central1 \
  --format 'value(status.url)'
```

### Using the Cloud Run YAML Configuration

Alternatively, you can deploy using the provided YAML configuration:

```bash
# Update cloudrun-chainlit.yaml with your project details
sed -i 's/PROJECT_ID/your-project-id/g' cloudrun-chainlit.yaml
sed -i 's/YOUR_GEMINI_API_KEY/your_actual_key/g' cloudrun-chainlit.yaml

# Deploy using the YAML
gcloud run services replace cloudrun-chainlit.yaml \
  --region us-central1
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | `sk-ant-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAINLIT_PORT` | Port for Chainlit server | `8000` |
| `PYTHONUNBUFFERED` | Disable Python output buffering | `1` |

### Setting Environment Variables in Cloud Run

#### Via gcloud CLI

```bash
gcloud run services update chainlit-adk-app \
  --region us-central1 \
  --set-env-vars="GEMINI_API_KEY=your_key,OPENAI_API_KEY=another_key"
```

#### Via Cloud Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Go to "Variables & Secrets" tab
5. Add environment variables
6. Click "Deploy"

#### Using Secret Manager (Recommended for Production)

```bash
# Create a secret
echo -n "your_api_key" | gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secret
gcloud run deploy chainlit-adk-app \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"
```

## Syncing Code to Standalone Chainlit

When you make changes in the UI builder and sync to Chainlit, the files are updated in the `chainlit_app/` directory. Here's how to deploy updates:

### For Local Development

The Chainlit dev server auto-reloads when files change, so just sync from the UI and changes appear immediately.

### For Cloud Run

After syncing code from the UI:

```bash
# Rebuild and redeploy
./scripts/deploy-chainlit.sh --project-id your-project-id
```

Or manually:

```bash
# Build new image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chainlit-adk-app --dockerfile=Dockerfile.chainlit .

# Deploy new revision
gcloud run deploy chainlit-adk-app \
  --image gcr.io/YOUR_PROJECT_ID/chainlit-adk-app \
  --region us-central1
```

## Troubleshooting

### Container Fails to Start

**Check logs:**
```bash
gcloud logs tail --service=chainlit-adk-app --region=us-central1
```

**Common issues:**
- Missing `main.py` in `chainlit_app/` - Generate code in the UI first
- Missing API keys - Set environment variables
- Invalid Python syntax - Check code generation in UI

### Port Binding Issues

Ensure `CHAINLIT_PORT=8000` is set and matches the Cloud Run container port configuration.

### API Key Not Working

**Verify environment variables:**
```bash
gcloud run services describe chainlit-adk-app \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

### Timeout Errors

Increase timeout in Cloud Run:
```bash
gcloud run services update chainlit-adk-app \
  --timeout 600 \
  --region us-central1
```

### Out of Memory

Increase memory allocation:
```bash
gcloud run services update chainlit-adk-app \
  --memory 1Gi \
  --region us-central1
```

## Cost Optimization

### Minimize Cold Starts

Set minimum instances to 1:
```bash
gcloud run services update chainlit-adk-app \
  --min-instances 1 \
  --region us-central1
```

### Scale to Zero (Free Tier Friendly)

```bash
gcloud run services update chainlit-adk-app \
  --min-instances 0 \
  --max-instances 3 \
  --region us-central1
```

### CPU Throttling

Enable CPU throttling when not handling requests:
```bash
gcloud run services update chainlit-adk-app \
  --cpu-throttling \
  --region us-central1
```

## Security Best Practices

1. **Use Secret Manager** for API keys instead of environment variables
2. **Enable authentication** by removing `--allow-unauthenticated`
3. **Set up IAM policies** to restrict access
4. **Use VPC connector** for private network access
5. **Enable Cloud Armor** for DDoS protection

## Next Steps

- [Configure custom domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Set up CI/CD with Cloud Build](https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run)
- [Monitor with Cloud Logging](https://cloud.google.com/logging/docs/view/logs-viewer-interface)
- [Set up alerts](https://cloud.google.com/monitoring/alerts)

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Chainlit Documentation](https://docs.chainlit.io/)
- [Google ADK Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview)
