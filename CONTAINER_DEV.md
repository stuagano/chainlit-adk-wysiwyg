# Container-Based Development Workflow

Complete guide for developing Chainlit ADK WYSIWYG using containers for a consistent, reproducible development environment.

## Table of Contents

- [Overview](#overview)
- [Benefits](#benefits)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflows](#development-workflows)
- [VS Code DevContainer](#vs-code-devcontainer)
- [Docker Compose Dev Mode](#docker-compose-dev-mode)
- [Daily Development](#daily-development)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)
- [Comparison: Traditional vs Container](#comparison-traditional-vs-container)

---

## Overview

The container-based development workflow allows you to develop the entire application inside a container, eliminating "works on my machine" issues and providing a consistent environment across your team.

**What's Included:**
- Pre-configured development container with Node.js 20 + Python 3.x
- Hot-reload for all services (Frontend, Backend, Chainlit)
- VS Code DevContainer support for seamless IDE integration
- Docker Compose for orchestrating services
- Helper scripts for common tasks

---

## Benefits

### For Individual Developers
✅ **No Local Dependencies** - No need to install Node.js, Python, or manage versions
✅ **Instant Setup** - From clone to coding in < 5 minutes
✅ **Clean Host** - Keep your machine free of project-specific tools
✅ **Easy Switching** - Jump between projects with different requirements
✅ **CI/CD Parity** - Dev environment matches production containers

### For Teams
✅ **Consistent Environment** - Everyone uses identical tools and versions
✅ **Fast Onboarding** - New developers productive immediately
✅ **No Config Drift** - Environment defined in code, version controlled
✅ **Reduced Support** - Fewer "it works for me" issues
✅ **Cross-Platform** - Same experience on Mac, Linux, Windows

---

## Prerequisites

### Option A: Docker (Recommended for Most Users)

**Install Docker Desktop:**

- **macOS:** [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- **Windows:** [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- **Linux:**
  ```bash
  # Ubuntu/Debian
  sudo apt-get update
  sudo apt-get install docker.io docker-compose

  # RHEL/Fedora/CentOS
  sudo dnf install docker docker-compose
  ```

**Verify Installation:**
```bash
docker --version
docker compose version
```

### Option B: Podman (Alternative)

**Install Podman:**

- **macOS:**
  ```bash
  brew install podman
  podman machine init
  podman machine start
  ```

- **Linux:**
  ```bash
  # RHEL/Fedora
  sudo dnf install podman podman-compose

  # Ubuntu/Debian
  sudo apt-get install podman
  pip install podman-compose
  ```

**Verify Installation:**
```bash
podman --version
podman-compose --version
```

### For VS Code Users

Install the **Dev Containers** extension:
```
ext install ms-vscode-remote.remote-containers
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chainlit-adk-wysiwyg
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 3. Choose Your Workflow

**Option A: VS Code DevContainer (Easiest)**
```bash
# Open in VS Code
code .

# Click "Reopen in Container" when prompted
# OR: Cmd/Ctrl + Shift + P → "Dev Containers: Reopen in Container"
```

**Option B: Docker Compose (Manual)**
```bash
# Start development environment
./scripts/dev-container-start.sh

# Services start automatically with hot-reload
```

**Option C: npm Scripts**
```bash
npm run dev:container
```

### 4. Access Services

- **Frontend (Vite):** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Chainlit Server:** http://localhost:8000

---

## Development Workflows

### Workflow 1: VS Code DevContainer (Recommended)

**Best for:**
- VS Code users
- Team environments
- Seamless IDE experience

**How it works:**
1. Open project in VS Code
2. Click "Reopen in Container"
3. VS Code runs entirely inside the container
4. Extensions, terminal, debugging all work natively
5. Edit files on host, run in container

**Daily usage:**
```bash
# Open VS Code
code .

# Click "Reopen in Container"
# Wait ~30 seconds for container to start
# Everything just works!

# Run commands in integrated terminal
npm run dev:all
npm test
```

**Advantages:**
- ✅ Seamless experience (feels like local dev)
- ✅ Extensions auto-installed
- ✅ Debugging works out of the box
- ✅ No manual container management

**Disadvantages:**
- ⚠️ Requires VS Code
- ⚠️ Slightly slower on Windows/macOS (volume mounting)

---

### Workflow 2: Docker Compose Dev Mode

**Best for:**
- Any IDE/editor users
- Manual control over services
- Debugging container issues

**How it works:**
1. Start containers with `docker-compose -f docker-compose.dev.yml up`
2. Edit code on host machine
3. Changes sync to container via volume mounts
4. Services auto-reload

**Daily usage:**
```bash
# Start all services
./scripts/dev-container-start.sh

# Or manually
docker-compose -f docker-compose.dev.yml up

# Edit files with your favorite editor
vim App.tsx
code .
idea .

# Changes auto-reload in container

# View logs
./scripts/dev-container-logs.sh

# Shell into container
./scripts/dev-container-shell.sh

# Stop services
./scripts/dev-container-stop.sh
```

**Advantages:**
- ✅ Works with any editor
- ✅ Clear separation (host vs container)
- ✅ Easy to inspect container state

**Disadvantages:**
- ⚠️ Need to manually manage containers
- ⚠️ Debugging requires extra setup

---

## VS Code DevContainer

### Opening the DevContainer

**Method 1: Automatic Prompt**
```bash
code .
# Click "Reopen in Container" when prompted
```

**Method 2: Command Palette**
```bash
code .
# Press Cmd/Ctrl + Shift + P
# Type "Dev Containers: Reopen in Container"
# Press Enter
```

**Method 3: Remote Explorer**
```bash
# Click Remote Explorer icon in Activity Bar
# Click "Reopen Folder in Container" next to folder name
```

### First-Time Setup

When you first open in a DevContainer:

1. **Container Building** (~3-5 minutes)
   - Pulls base image
   - Installs dependencies
   - Sets up environment

2. **Post-Create Commands** (~1-2 minutes)
   - Runs `npm install`
   - Initializes Python venv
   - Configures git

3. **Extension Installation** (~1 minute)
   - Installs VS Code extensions inside container

**Total: 5-8 minutes (one-time)**
**Subsequent starts: 10-30 seconds**

### Using the DevContainer

**Terminal:**
```bash
# Terminal is already inside the container
pwd  # /workspace

# Run any command
npm run dev:all
npm test
python --version
```

**Debugging:**
```javascript
// Set breakpoints in VS Code as usual
// Press F5 or click Debug icon
// Debugging works natively in the container
```

**Extensions:**
All configured extensions are automatically installed:
- ESLint
- Prettier
- Python
- GitLens
- And more...

**Port Forwarding:**
Ports are automatically forwarded to your host:
- 3000 → Frontend
- 3001 → Backend
- 8000 → Chainlit

---

## Docker Compose Dev Mode

### Starting Services

**Using Helper Script:**
```bash
./scripts/dev-container-start.sh
```

**Manual Start:**
```bash
# Build if needed
docker-compose -f docker-compose.dev.yml build

# Start services
docker-compose -f docker-compose.dev.yml up

# Or in detached mode
docker-compose -f docker-compose.dev.yml up -d
```

### Service Management

**View Logs:**
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f dev
```

**Restart Services:**
```bash
docker-compose -f docker-compose.dev.yml restart
```

**Stop Services:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Shell into Container:**
```bash
./scripts/dev-container-shell.sh

# Or manually
docker exec -it chainlit-adk-dev /bin/bash
```

### Separate Services (Advanced)

Run services in separate containers:

```bash
# Start with separate profile
docker-compose -f docker-compose.dev.yml --profile separate up

# This starts:
# - frontend (port 3000)
# - backend (port 3001)
# - chainlit (port 8000)
```

---

## Daily Development

### Morning Routine

**VS Code DevContainer:**
```bash
code .  # Opens in container automatically
# Start coding immediately
```

**Docker Compose:**
```bash
./scripts/dev-container-start.sh
# Edit files with your editor
# Services auto-reload
```

### Making Changes

**Frontend (React/TypeScript):**
```bash
# Edit any .tsx or .ts file
# Vite HMR reloads instantly (<1 second)
```

**Backend (Express):**
```bash
# Edit server/*.ts files
# tsx watch restarts server (1-2 seconds)
```

**Chainlit (Python):**
```bash
# Edit chainlit_app/*.py files
# Chainlit watch reloads (2-3 seconds)
```

### Running Commands

**VS Code DevContainer:**
```bash
# Terminal is already in container
npm run test
npm run lint
npm run build
```

**Docker Compose:**
```bash
# Execute in running container
docker-compose -f docker-compose.dev.yml exec dev npm test
docker-compose -f docker-compose.dev.yml exec dev npm run lint

# Or shell in first
./scripts/dev-container-shell.sh
npm test
```

### Installing Dependencies

**Node.js packages:**
```bash
# VS Code DevContainer
npm install package-name

# Docker Compose
docker-compose -f docker-compose.dev.yml exec dev npm install package-name
```

**Python packages:**
```bash
# VS Code DevContainer
/workspace/chainlit_app/.venv/bin/pip install package-name

# Docker Compose
docker-compose -f docker-compose.dev.yml exec dev \
  /workspace/chainlit_app/.venv/bin/pip install package-name
```

### Evening Routine

**VS Code DevContainer:**
```bash
# Just close VS Code
# Container stops automatically
```

**Docker Compose:**
```bash
./scripts/dev-container-stop.sh
# Or leave running for next session
```

---

## Troubleshooting

### Container Won't Start

**Issue: Port already in use**
```bash
# Find process using port
lsof -i :3000
lsof -i :3001
lsof -i :8000

# Kill the process or change port in docker-compose.dev.yml
```

**Issue: Docker daemon not running**
```bash
# macOS/Windows: Start Docker Desktop
# Linux:
sudo systemctl start docker
```

### Hot Reload Not Working

**Issue: Changes not detected**
```bash
# Ensure file watching is enabled
# Already configured in docker-compose.dev.yml:
# CHOKIDAR_USEPOLLING=true
# WATCHPACK_POLLING=true

# If still not working, restart container
docker-compose -f docker-compose.dev.yml restart
```

### VS Code Extensions Not Loading

**Issue: Extensions missing in container**
```bash
# Rebuild container
# Cmd/Ctrl + Shift + P → "Dev Containers: Rebuild Container"
```

### Permission Issues

**Issue: Cannot write files**
```bash
# Check file ownership
ls -la

# If needed, fix ownership (from host)
sudo chown -R $(id -u):$(id -g) .

# Or run container as root temporarily
# Edit .devcontainer/devcontainer.json
# "remoteUser": "root"
```

### Slow Performance

**macOS/Windows:**
```yaml
# Use :cached flag for volumes (already configured)
volumes:
  - .:/workspace:cached
```

**Linux:**
```bash
# Performance is native, no special config needed
```

### Container Build Fails

**Issue: Network timeout**
```bash
# Rebuild with increased timeout
docker-compose -f docker-compose.dev.yml build --build-arg BUILDKIT_INLINE_CACHE=1

# Or use cached build
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Environment Variables Not Working

**Issue: .env.local not loaded**
```bash
# Ensure .env.local exists
cp .env.example .env.local

# Check it's mounted in docker-compose.dev.yml:
# volumes:
#   - ./.env.local:/workspace/.env.local:ro

# Restart container
docker-compose -f docker-compose.dev.yml restart
```

---

## Advanced Usage

### Custom Node/Python Versions

**Edit `.devcontainer/Dockerfile`:**
```dockerfile
ARG NODE_VERSION=18  # Change to desired version
```

**Rebuild:**
```bash
./scripts/dev-container-rebuild.sh
```

### Docker-in-Docker

**Run Docker commands inside container:**

Uncomment in `.devcontainer/devcontainer.json`:
```json
{
  "mounts": [
    "source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind"
  ]
}
```

### Persistent Data

**Volumes configured:**
- `dev-bash-history` - Command history across restarts
- `node_modules` - Faster rebuilds
- `.venv` - Python packages persist

**Backup volumes:**
```bash
docker run --rm -v chainlit-adk-wysiwyg_dev-bash-history:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/history-backup.tar.gz /data
```

### Performance Tuning

**macOS/Windows - NFS Mounting:**
```yaml
# Edit docker-compose.dev.yml
volumes:
  - type: volume
    source: workspace
    target: /workspace
    volume:
      nocopy: true
```

**Linux - Native Performance:**
No changes needed, already optimal.

---

## Comparison: Traditional vs Container

| Aspect | Traditional Dev | Container Dev |
|--------|----------------|---------------|
| **Setup Time** | 1-2 hours | 5-10 minutes |
| **Node.js Install** | Required locally | Bundled in container |
| **Python Install** | Required locally | Bundled in container |
| **Version Management** | nvm, pyenv, etc. | Dockerfile |
| **Dependency Conflicts** | Common | Impossible |
| **Hot Reload** | ✅ Native | ✅ Via volume mounts |
| **Debugging** | ✅ Easy | ✅ VS Code DevContainer |
| **Performance** | ⚡ Fastest | 🐢 5-10% slower (Mac/Win) |
| **Team Consistency** | Manual alignment | Automatic |
| **CI/CD Parity** | Different environments | Identical |
| **Disk Usage** | ~500MB (local deps) | ~1.5GB (image + volumes) |
| **Onboarding** | Complex | Simple |

### When to Use Container Dev

**✅ Use Container Dev When:**
- Working in a team
- Onboarding new developers frequently
- Need exact CI/CD environment parity
- Developers on different OS (Mac/Linux/Windows)
- Complex or conflicting dependencies
- Want isolated project environments

**❌ Stick with Traditional When:**
- Solo developer with simple setup
- Need maximum performance (games, graphics)
- Heavy debugging with native tools
- Unfamiliar with containers
- Low-powered development machine
- Frequent Docker/networking issues

---

## Helper Scripts Reference

| Script | Purpose |
|--------|---------|
| `./scripts/dev-container-start.sh` | Start development environment |
| `./scripts/dev-container-stop.sh` | Stop and remove containers |
| `./scripts/dev-container-shell.sh` | Open shell in running container |
| `./scripts/dev-container-logs.sh` | View container logs |
| `./scripts/dev-container-rebuild.sh` | Rebuild container from scratch |

---

## npm Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev:container` | Start dev container with Docker Compose |
| `npm run dev:container:build` | Build dev container image |
| `npm run dev:container:down` | Stop dev containers |
| `npm run dev:container:shell` | Shell into dev container |
| `npm run dev:container:logs` | View dev container logs |

---

## Additional Resources

- [VS Code DevContainers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Podman Documentation](https://docs.podman.io/)

---

## Getting Help

**Container Issues:**
```bash
# Check container status
docker ps -a

# View container logs
./scripts/dev-container-logs.sh

# Inspect container
docker inspect chainlit-adk-dev

# Rebuild from scratch
./scripts/dev-container-rebuild.sh
```

**Application Issues:**
- Check main [README.md](./README.md)
- See [PODMAN.md](./PODMAN.md) for production containers
- Open a [GitHub Issue](../../issues)

---

**Happy Coding in Containers! 🐳**

*Consistent environments, consistent results.*
