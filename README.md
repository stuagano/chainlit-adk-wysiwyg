<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ljg_yAgz5feA8D_iGkxxN-vKBZyjiggV

## Run Locally

**Prerequisites:**  Node.js, Python 3.10+


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Live Chainlit Preview (hot reload)

1. From the UI, configure your workflow and click **Generate Code**, then **Sync to Chainlit**.
2. Install the Python deps once (creates a virtualenv recommended):
   ```bash
   cd chainlit_app
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. In a second terminal, launch the Chainlit dev server with autoreload:
   ```bash
   npm run chainlit:dev
   ```
   Or run both Vite and Chainlit together in one shell:
   ```bash
   npm run dev:all
   ```
4. Visit http://localhost:8000 to chat with the generated multi-agent workflow. Re-run **Sync to Chainlit** any time you tweak the configuration; the Python files update and Chainlit restarts automatically.
