# Cloud Shell Tutorial: Chainlit ADK Agent Builder

Welcome! This tutorial will guide you through deploying the Chainlit ADK Agent Builder in Google Cloud Shell.

## What You'll Build

A visual interface for creating multi-agent AI workflows that can be deployed to Google Cloud Run.

## Prerequisites

✅ Already done! You clicked the "Open in Cloud Shell" button.

## Step 1: Install Dependencies

```bash
npm install
```

<walkthrough-info-message>
This installs both frontend and backend dependencies. It may take 2-3 minutes.
</walkthrough-info-message>

## Step 2: Start the Application

Open **three terminals** in Cloud Shell (click the + icon):

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```

**Terminal 3 - Chainlit (optional for testing):**
```bash
npm run chainlit:dev
```

<walkthrough-info-message>
The application will be available via Cloud Shell's web preview on port 3000.
</walkthrough-info-message>

## Step 3: Open Web Preview

1. Click the **Web Preview** button (🔍) in the top-right corner
2. Select **Preview on port 3000**
3. The Agent Builder UI will open in a new tab

## Step 4: Configure Your Agent

In the web interface:

1. **Agent Configuration Tab:**
   - Set agent name (e.g., "Research Assistant")
   - Write system prompt
   - Choose LLM model
   - Set temperature

2. **Tools Configuration Tab:**
   - Define tools your agent can use
   - Add parameters with types

3. **Workflow Designer Tab:**
   - Choose workflow type (Sequential, Hierarchical, Collaborative)
   - Arrange agents if using multiple

4. **GCP Configuration Tab:**
   - Enter your GCP project ID
   - Set service name
   - Choose region

## Step 5: Generate Code

1. Click **"Generate Code"** in the Code Preview tab
2. Review the generated files
3. Click **"Sync to Chainlit"**
4. Click **"Launch Preview"** to test locally

## Step 6: Deploy to Cloud Run

Once you're happy with your agent:

1. The generated code is in `chainlit_app/`
2. Navigate to that directory:
   ```bash
   cd chainlit_app
   ```

3. Run the one-click deployment:
   ```bash
   chmod +x one-click-deploy.sh
   ./one-click-deploy.sh
   ```

4. The script will:
   - Prompt for API keys (add to `.env`)
   - Deploy to Cloud Run
   - Return your live agent URL

<walkthrough-info-message>
**First time?** The script will create `.env` and pause. Add your API keys, then run the script again.
</walkthrough-info-message>

## Testing Locally in Cloud Shell

Before deploying, test your agent locally:

```bash
cd chainlit_app
./one-click-deploy.sh --local-only
```

Then use Cloud Shell's web preview on port 8000 to test your agent.

## Environment Variables

You'll need to set these in `chainlit_app/.env`:

**For OpenAI models:**
```bash
OPENAI_API_KEY=sk-...
```

**For Google/Gemini models:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
# Or use Application Default Credentials:
# gcloud auth application-default login
```

<walkthrough-info-message>
**Pro tip:** Use Secret Manager for production deployments instead of `.env` files.
</walkthrough-info-message>

## Quick Commands Reference

### Development (from project root):
```bash
npm run dev:all          # All services
npm run dev              # Frontend only
npm run dev:backend      # Backend only
```

### Testing:
```bash
npm test                 # Run tests
npm run lint             # Check code quality
```

### Deployment (from chainlit_app/):
```bash
./one-click-deploy.sh              # Full deployment
./one-click-deploy.sh --local-only # Test locally
./one-click-deploy.sh --skip-tests # Skip tests
```

## Troubleshooting

### Port already in use?
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9
```

### Need to restart?
```bash
# Stop all npm processes
pkill -f "npm run"

# Start again
npm run dev:all
```

### GCP Authentication?
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Next Steps

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

Congratulations! You've successfully set up the Chainlit ADK Agent Builder.

**What's next?**
- 📖 Read the [full documentation](../README.md)
- 🔧 Explore example agents in `examples/`
- 🚀 Deploy your first agent to Cloud Run
- 🤝 Contribute on [GitHub](https://github.com/stuagano/chainlit-adk-wysiwyg)

## Support

- **Documentation:** See `README.md` in the project root
- **Issues:** [GitHub Issues](https://github.com/stuagano/chainlit-adk-wysiwyg/issues)
- **Deployment Guide:** See `DEPLOYMENT_SIMPLIFIED.md`

---

**💡 Tip:** Bookmark your Cloud Shell session to return later!
