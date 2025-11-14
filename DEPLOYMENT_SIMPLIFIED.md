# Simplified Deployment Guide

## 🚀 Deployment Options (Ranked by Simplicity)

### Option 1: One-Click Deploy Script (Easiest! ⭐)

**From 7 steps to 2 steps:**

```bash
# Step 1: Make script executable
chmod +x one-click-deploy.sh

# Step 2: Run it!
./one-click-deploy.sh
```

**What it does automatically:**
- ✅ Checks Python version
- ✅ Creates virtual environment
- ✅ Installs dependencies
- ✅ Sets up GCP authentication
- ✅ Enables required APIs
- ✅ Creates Artifact Registry
- ✅ Builds and deploys to Cloud Run
- ✅ Returns your live agent URL

**First-time setup:**
The script will create `.env` from template and pause for you to add API keys. After that, run it again and it deploys!

**Local testing:**
```bash
./one-click-deploy.sh --local-only
```

---

### Option 2: Cloud Shell Button (Browser-Based)

**Zero local setup required!**

1. Click the "Open in Cloud Shell" button in your README
2. Wait for Cloud Shell to open (in your browser)
3. Run: `./one-click-deploy.sh`
4. Done!

**Perfect for:**
- Users without local dev environment
- Quick demos
- Testing without installing anything locally

---

### Option 3: Makefile (Developer-Friendly)

**If you have make installed:**

```bash
# First time setup
make init

# Deploy
make deploy
```

That's it! The Makefile handles all the complexity.

---

### Option 4: GitHub Actions (Fully Automated)

**Zero manual deployment:**

1. Push to `main` branch
2. GitHub Actions automatically:
   - Runs tests
   - Builds Docker image
   - Deploys to Cloud Run
3. Get deployment URL in GitHub Actions logs

**Setup (one-time):**
Add these secrets to your GitHub repo:
- `WIF_PROVIDER` - Workload Identity Provider
- `WIF_SERVICE_ACCOUNT` - Service Account Email

Then every push to `main` = automatic deployment! 🎉

---

## Comparison Table

| Method | Steps | Setup Time | Best For |
|--------|-------|------------|----------|
| **One-Click Script** | 2 | 1 min | Everyone |
| **Cloud Shell** | 1 | 0 min | Quick demos |
| **Makefile** | 2 | 1 min | Developers |
| **GitHub Actions** | 0 | 5 min | Production |

---

## Recommended Workflow

### For Development:
```bash
# 1. Test locally first
./one-click-deploy.sh --local-only

# 2. When ready, deploy
./one-click-deploy.sh
```

### For Production:
```bash
# 1. Push to GitHub
git push origin main

# 2. GitHub Actions deploys automatically
# (Check Actions tab for deployment status)
```

---

## Troubleshooting

### Script fails with "Python 3.10+ required"
```bash
# Install Python 3.11
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv
```

### "gcloud not authenticated"
```bash
gcloud auth login
# Then run deployment script again
```

### "Missing API keys"
```bash
# Edit .env file
nano .env

# Add your keys:
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Run script again
./one-click-deploy.sh
```

### Test locally before deploying
```bash
# This runs everything locally so you can test
./one-click-deploy.sh --local-only

# Visit http://localhost:8000
# Press Ctrl+C when done
```

---

## Migration Guide: Old vs New

### Old Way (7 Steps):
```bash
1. Download generated files
2. Create .env manually
3. python3 -m venv .venv
4. source .venv/bin/activate
5. pip install -r requirements.txt
6. gcloud auth login
7. bash deploy.sh
```

### New Way (2 Steps):
```bash
1. chmod +x one-click-deploy.sh
2. ./one-click-deploy.sh
```

### Absolute Simplest (1 Step):
```bash
Click: "Open in Cloud Shell" button
```

---

## Advanced: Environment Variables from Secret Manager

For production, store secrets securely:

```bash
# Store OpenAI key
echo -n "sk-..." | gcloud secrets create openai-api-key \\
  --data-file=- \\
  --project=YOUR_PROJECT

# Deploy with secrets
./one-click-deploy.sh
# The Cloud Run service will automatically access secrets
```

---

## What Changed?

### Before:
- Manual environment setup
- Multiple configuration steps
- Easy to miss requirements
- Different commands for different platforms

### After:
- Single script handles everything
- Automatic dependency detection
- Clear error messages with solutions
- Works on Linux, macOS, Cloud Shell

---

## Summary

**Fastest way to deploy:**
```bash
./one-click-deploy.sh
```

**Test before deploying:**
```bash
./one-click-deploy.sh --local-only
```

**Skip tests:**
```bash
./one-click-deploy.sh --skip-tests
```

**Set it and forget it:**
```bash
git push origin main  # GitHub Actions deploys automatically
```

Choose the method that fits your workflow! 🚀
