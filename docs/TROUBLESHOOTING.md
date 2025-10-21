# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the ADK & Chainlit Agent Builder.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Server Issues](#development-server-issues)
- [Code Generation Issues](#code-generation-issues)
- [Chainlit Sync Issues](#chainlit-sync-issues)
- [GCP Deployment Issues](#gcp-deployment-issues)
- [Testing Issues](#testing-issues)
- [General Debugging](#general-debugging)

## Installation Issues

### npm install fails with platform-specific errors

**Problem:** Installation fails with errors like `Unsupported platform for @esbuild/darwin-arm64`

**Cause:** Platform-specific build dependencies

**Solution:**
```bash
# These are optional dependencies and can be ignored on different platforms
npm install --ignore-scripts

# Or remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Prevention:** The project now uses `optionalDependencies` for platform-specific packages

### Node version incompatibility

**Problem:** `error The engine "node" is incompatible with this module`

**Cause:** Wrong Node.js version

**Solution:**
```bash
# Check your Node version
node --version

# Required: Node >= 20.0.0
# Install nvm and use correct version
nvm install 20
nvm use 20
npm install
```

**Using .nvmrc:**
```bash
# If you have nvm installed
nvm use
```

## Development Server Issues

### Vite dev server won't start

**Problem:** `Error: Port 5173 is already in use`

**Solution:**
```bash
# Find and kill process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
PORT=5174 npm run dev
```

### Chainlit dev server issues

**Problem:** `chainlit: command not found`

**Cause:** Python virtual environment not activated or chainlit not installed

**Solution:**
```bash
# Create and activate venv
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install chainlit
pip install chainlit

# Verify installation
chainlit --version
```

### Both servers running but not communicating

**Problem:** Frontend can't sync with Chainlit backend

**Solution:**
```bash
# Make sure both are running on correct ports
# Frontend: localhost:5173
# Chainlit: localhost:8000

# Check vite.config.ts proxy settings
# Restart both servers
npm run dev:all
```

## Code Generation Issues

### Preflight validation errors

**Problem:** Red errors appear after clicking "Generate Code"

**Common Issues and Fixes:**

#### "Tool name must be a valid Python identifier"
```typescript
// ❌ Bad
toolName: "get-weather"  // Hyphens not allowed
toolName: "2day_forecast"  // Can't start with number
toolName: "class"  // Python keyword

// ✅ Good
toolName: "get_weather"
toolName: "today_forecast"
toolName: "weather_class"
```

#### "Duplicate agent name found"
**Solution:** Each agent must have a unique name (case-insensitive)

#### "Unsupported LLM model"
**Solution:** Use one of the supported models:
- `gemini-2.5-flash`
- `gemini-1.5-flash`
- `gemini-1.5-pro`
- `gpt-4o`

### Generated code has syntax errors

**Problem:** Downloaded Python code has errors

**Diagnosis:**
```bash
# Unzip the downloaded file
unzip multi-agent-workflow.zip -d my-project

# Check for Python syntax errors
python3 -m py_compile main.py
```

**Common Causes:**
1. Special characters in agent/tool names
2. Empty or whitespace-only descriptions
3. Unescaped quotes in prompts

**Solution:** Use the preflight panel to fix issues before generating

### Download button is disabled

**Problem:** Can't download generated code

**Cause:** Code hasn't been generated yet

**Solution:**
1. Configure at least one agent
2. Click "Generate Code" button
3. Wait for preview to appear
4. Download button will enable

## Chainlit Sync Issues

### "Failed to sync Chainlit files" error

**Problem:** Sync button shows error message

**Diagnosis:**
```bash
# Check if chainlit_app directory exists and is writable
ls -la chainlit_app/

# Check server logs
# Look in browser console (F12) for API errors
```

**Common Causes:**

#### 1. Chainlit not installed
```bash
pip install chainlit
```

#### 2. Permission issues
```bash
# Make sure chainlit_app/ directory exists and is writable
chmod -R 755 chainlit_app/
```

#### 3. Invalid file paths (path traversal protection)
**Solution:** Ensure all generated filenames are valid and don't contain `..`, `/`, or other dangerous characters

### Chainlit preview doesn't open

**Problem:** Sync succeeds but preview window doesn't open

**Solution:**
```bash
# Manually start Chainlit
cd chainlit_app
chainlit run main.py

# Then open http://localhost:8000 in your browser
```

**Browser Pop-up Blocker:**
- Check if your browser blocked the pop-up
- Allow pop-ups from localhost
- Manually navigate to http://localhost:8000

### Chainlit shows errors in preview

**Problem:** Preview window opens but shows errors

**Diagnosis:**
```bash
# Check chainlit_app/main.py for errors
cd chainlit_app
python3 -m py_compile main.py

# Try running directly to see error messages
chainlit run main.py
```

**Common Errors:**

#### ImportError: No module named 'chainlit'
```bash
pip install chainlit
```

#### ImportError: No module named 'google.cloud.aiplatform'
```bash
pip install google-cloud-aiplatform
```

#### API Key not found
```bash
# Create .env file in chainlit_app/
cd chainlit_app
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

## GCP Deployment Issues

### Service account key upload fails

**Problem:** "Invalid file type" or "Invalid GCP service account key" error

**Solution:**
1. Ensure file is JSON format (not .p12 or other format)
2. File must be smaller than 100KB
3. File must contain `type: "service_account"`
4. Required fields: `project_id`, `private_key_id`, `private_key`, `client_email`

**Getting a valid service account key:**
```bash
# In Google Cloud Console:
# 1. Go to IAM & Admin > Service Accounts
# 2. Create or select service account
# 3. Keys tab > Add Key > Create New Key
# 4. Choose JSON format
# 5. Download and upload to the app
```

### Cloud Build fails

**Problem:** Deployment to GCP fails during build

**Common Causes:**

#### 1. APIs not enabled
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable agentengine.googleapis.com
```

#### 2. Insufficient permissions
**Solution:** Service account needs roles:
- Cloud Build Service Account
- Cloud Run Admin
- Artifact Registry Writer

#### 3. Project ID mismatch
**Solution:** Verify project ID in GCP config matches your actual GCP project

### Cloud Run deployment succeeds but app doesn't work

**Problem:** Deployment succeeds but app shows errors

**Diagnosis:**
```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=YOUR_SERVICE_NAME" --limit 50
```

**Common Issues:**
1. Environment variables not set (GEMINI_API_KEY, etc.)
2. Service account credentials not configured
3. Memory/CPU limits too low

**Solution:**
```bash
# Set environment variables
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars="GEMINI_API_KEY=your_key_here"

# Increase resources if needed
gcloud run services update YOUR_SERVICE_NAME \
  --memory=512Mi \
  --cpu=1
```

## Testing Issues

### Tests fail with "Cannot find module"

**Problem:** `Error: Cannot find module '@testing-library/react'`

**Solution:**
```bash
# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Tests timeout

**Problem:** Tests hang or timeout

**Solution:**
```bash
# Increase timeout (in vitest.config.ts)
# Default is 5000ms

# Run tests with more time
npm test -- --testTimeout=10000
```

### Mock failures in tests

**Problem:** Mocks don't work as expected

**Solution:**
```typescript
// Ensure mocks are properly cleared between tests
import { vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## General Debugging

### Enable debug logging

**In browser console (F12):**
```javascript
// See all API requests
localStorage.debug = '*'

// See Vite debug info
localStorage.vite = 'true'
```

**In Chainlit:**
```bash
# Run with verbose logging
chainlit run main.py --debug
```

### Check browser console for errors

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed API calls

### Verify file permissions

```bash
# Make sure files are readable/writable
ls -la

# Fix permissions if needed
chmod -R 755 .
```

### Clear cache and restart

```bash
# Clear npm cache
npm cache clean --force

# Remove build artifacts
rm -rf node_modules dist .vite

# Clean reinstall
npm install

# Clear browser cache
# In Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
```

### Check for port conflicts

```bash
# List processes using ports
lsof -i :5173  # Vite dev server
lsof -i :8000  # Chainlit server

# Kill process if needed
kill -9 <PID>
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - Browser console (F12)
   - Terminal output from `npm run dev`
   - Chainlit logs from `chainlit run`

2. **Search existing issues:**
   - Check the GitHub issues page
   - Search for error messages

3. **Gather information:**
   - Node version: `node --version`
   - npm version: `npm --version`
   - Python version: `python3 --version`
   - Operating system
   - Exact error message
   - Steps to reproduce

4. **Create a minimal reproduction:**
   - Simplify to smallest case that shows the problem
   - Remove unnecessary configuration
   - Test with fresh install if possible

5. **Report the issue:**
   - Open GitHub issue with all gathered information
   - Include error messages and steps to reproduce
   - Attach screenshots if helpful

## Common Error Messages and Solutions

### "EADDRINUSE: address already in use"
**Solution:** Port is occupied. Kill the process or use a different port.

### "Module not found: Error: Can't resolve..."
**Solution:** Missing dependency. Run `npm install` again.

### "SyntaxError: Unexpected token"
**Solution:** Check for syntax errors in configuration files (JSON, TypeScript).

### "Network request failed"
**Solution:** Check internet connection, proxy settings, or firewall.

### "Permission denied"
**Solution:** Run with appropriate permissions or fix file ownership.

### "Cannot read property of undefined"
**Solution:** Check for null/undefined values in your configuration.

---

**Still stuck?** Check the [Security Guide](./SECURITY.md) for security-related issues, or open an issue on GitHub with details about your problem.
