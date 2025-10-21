# Quick Start Guide - UI-Only Workflow

**No Terminal Required!** This application is designed to work entirely from the web interface.

## One-Time Setup

### Prerequisites
1. **Node.js 20+** installed
2. **Python 3.10+** installed
3. **Chainlit** installed via pip

### Initial Setup (Only Once)

```bash
# Clone and install
git clone <repository-url>
cd chainlit-adk-wysiwyg
npm install

# Install Python dependencies
pip install chainlit

# Start the application
npm run dev
```

That's it! After running `npm run dev`, you never need to touch the terminal again.

## UI-Only Workflow ✨

### Step 1: Open the Application
- Navigate to `http://localhost:3000` in your browser
- The interface loads automatically

### Step 2: Configure Your Agents
1. **Add Agents**: Click "Add Agent" to create agents
2. **Configure Each Agent**:
   - Set agent name (e.g., "Customer Support")
   - Write system prompt (agent's instructions)
   - Choose LLM model (Gemini or GPT)
   - Set temperature (creativity level)
   - Configure Chainlit UI (welcome message, placeholder)

3. **Add Tools** (Optional):
   - Click "Add Tool" under the agent
   - Configure tool name, description, and parameters
   - Tools appear in the generated code

4. **Choose Workflow Type**:
   - **Sequential**: Agents work in order
   - **Hierarchical**: Supervisor delegates to workers
   - **Collaborative**: Agents work together

5. **GCP Deployment** (Optional):
   - Enter Project ID, Service Name, Region
   - Upload service account key (validates automatically)

### Step 3: Generate Code
Click **"✨ Generate Code"** button

**What Happens**:
- ✅ Validates all configurations
- ✅ Shows errors/warnings if any issues
- ✅ Generates Python files (main.py, tools.py, requirements.txt, etc.)
- ✅ Displays code preview with tabs
- ✅ Enables download and sync buttons

### Step 4: Preview in Chainlit (Optional)
Click **"Sync to Chainlit"** button

**What Happens Automatically**:
- ✅ Validates Python syntax
- ✅ Copies files to `chainlit_app/`
- ✅ **Automatically starts Chainlit server** (no terminal needed!)
- ✅ Opens preview in new browser tab (http://localhost:8000)
- ✅ You can test your agents immediately

**No manual Chainlit launch required!** The "Sync to Chainlit" button does everything.

### Step 5: Download Project
Click **"Download .zip"** button

**What You Get**:
- Complete Python project ready to deploy
- All configuration files included
- README with setup instructions
- Dockerfile for containerization
- GCP deployment files (if configured)

## Common Actions

### Test Different Configurations
1. Modify agent settings in the UI
2. Click "Generate Code" again
3. Click "Sync to Chainlit" to see changes
4. Test in the preview window

### Download for Deployment
1. Configure GCP settings (optional)
2. Generate code
3. Download .zip
4. Deploy to GCP or run locally

### Reset and Start Over
Click **"Reset Form"** to clear all configurations and start fresh

## Behind the Scenes (Automatic)

When you click **"Sync to Chainlit"**, the system:

1. **Validates Files**: Checks Python syntax automatically
2. **Syncs Files**: Copies to `chainlit_app/` directory
3. **Launches Chainlit**: Runs `chainlit run main.py` automatically
4. **Opens Preview**: New browser tab to localhost:8000

**Everything is automatic!** No terminal commands needed.

## Troubleshooting

### "Sync to Chainlit" button is disabled
- **Cause**: Code not generated yet
- **Fix**: Click "Generate Code" first

### Preview window shows errors
- **Cause**: Missing Python dependencies
- **Fix**: Run once in terminal:
  ```bash
  pip install chainlit google-cloud-aiplatform requests
  ```

### Port 8000 already in use
- **Cause**: Chainlit already running
- **Fix**: Either:
  - Use the existing preview at localhost:8000
  - Stop the existing process (close terminal/window)
  - Click "Sync to Chainlit" again

### "Failed to sync Chainlit files"
- **Cause**: Permission issues or invalid Python
- **Fix**: Check browser console (F12) for details
- The UI will show specific error messages

## Advanced: Manual Terminal Usage (Optional)

If you prefer to use the terminal for Chainlit:

```bash
# In one terminal - keep running
npm run dev

# In another terminal - run Chainlit manually
cd chainlit_app
chainlit run main.py
```

But this is **NOT required** - the UI handles everything automatically!

## Next Steps

1. ✅ Configure agents in the UI
2. ✅ Generate code
3. ✅ Preview in Chainlit (automatic launch)
4. ✅ Download for deployment

**Everything from the browser - no terminal juggling required!** 🎉

---

**Need Help?**
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for generated code details
