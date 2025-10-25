# Podman Containerization Guide

Complete guide for running Chainlit ADK WYSIWYG using Podman containers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Container Architecture](#container-architecture)
- [Building the Container](#building-the-container)
- [Running with Podman Compose](#running-with-podman-compose)
- [Running Standalone](#running-standalone)
- [Configuration](#configuration)
- [Volumes and Persistence](#volumes-and-persistence)
- [Networking](#networking)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Overview

This project includes full Podman support for containerizing the Chainlit ADK WYSIWYG application. The container includes:

- **Node.js Frontend & Backend** - React UI builder and Express API server
- **Python Chainlit Server** - Runtime for AI agent workflows
- **Multi-stage Build** - Optimized production image
- **Security Hardening** - Non-root user, minimal attack surface

**Benefits:**
- Consistent development and production environments
- Easy deployment on any system with Podman/Docker
- Isolated dependencies and reproducible builds
- Rootless container support for enhanced security

---

## Prerequisites

### Install Podman

**Linux (RHEL/Fedora/CentOS):**
```bash
sudo dnf install -y podman
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y podman
```

**macOS:**
```bash
brew install podman
podman machine init
podman machine start
```

**Windows:**
Download from [Podman Desktop](https://podman-desktop.io/)

### Verify Installation

```bash
podman --version
# Should output: podman version 4.0.0 or higher
```

### Optional: Install podman-compose

For Docker Compose-style orchestration:

```bash
pip install podman-compose
```

---

## Quick Start

### 1. Configure Environment

Create a `.env.local` file with your API keys:

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 2. Build the Container

```bash
./scripts/podman-build.sh
```

### 3. Run the Container

**Option A: Using podman-compose (recommended)**
```bash
./scripts/podman-compose-up.sh
```

**Option B: Standalone Podman**
```bash
./scripts/podman-run.sh
```

### 4. Access the Application

- **Backend API:** http://localhost:3001
- **Chainlit UI:** http://localhost:8000

### 5. View Logs

```bash
./scripts/podman-logs.sh
```

### 6. Stop the Container

**With podman-compose:**
```bash
./scripts/podman-compose-down.sh
```

**Standalone:**
```bash
podman stop chainlit-adk-wysiwyg
```

---

## Container Architecture

### Multi-Stage Build

The `Containerfile` uses a multi-stage build process:

```
┌─────────────────────────────────────┐
│   Stage 1: Builder                   │
│   - Node.js 20 Alpine                │
│   - Build frontend (Vite)            │
│   - Build backend (TypeScript)       │
└──────────────┬──────────────────────┘
               │ Copy build artifacts
┌──────────────▼──────────────────────┐
│   Stage 2: Runtime                   │
│   - Node.js 20 Alpine                │
│   - Python 3.x + Chainlit            │
│   - Non-root user (nodejs:1001)      │
│   - Health checks enabled            │
└─────────────────────────────────────┘
```

### Services Running in Container

1. **Backend API Server** (Port 3001)
   - Express.js REST API
   - Handles agent configuration
   - Code generation and sync

2. **Chainlit Server** (Port 8000)
   - Python-based conversational UI
   - Runs generated agent workflows
   - Hot-reload support

---

## Building the Container

### Basic Build

```bash
./scripts/podman-build.sh
```

### Build with Custom Tag

```bash
./scripts/podman-build.sh v1.0.0
```

### Manual Build

```bash
podman build \
  --file Containerfile \
  --tag chainlit-adk-wysiwyg:latest \
  --format docker \
  .
```

### Build Arguments

Customize the build process:

```bash
podman build \
  --build-arg NODE_VERSION=20 \
  --build-arg PYTHON_VERSION=3.11 \
  --tag chainlit-adk-wysiwyg:custom \
  .
```

### Verify the Image

```bash
podman images | grep chainlit-adk-wysiwyg
podman inspect chainlit-adk-wysiwyg:latest
```

---

## Running with Podman Compose

### Start Services

```bash
./scripts/podman-compose-up.sh
```

This command:
- Reads configuration from `podman-compose.yml`
- Creates volumes for persistent data
- Sets up networking
- Starts all services in detached mode

### View Service Status

```bash
podman-compose -f podman-compose.yml ps
```

### View Logs

```bash
# All services
podman-compose -f podman-compose.yml logs -f

# Specific service
podman-compose -f podman-compose.yml logs -f chainlit-adk
```

### Restart Services

```bash
podman-compose -f podman-compose.yml restart
```

### Stop and Remove

```bash
./scripts/podman-compose-down.sh
```

### Rebuild and Restart

```bash
podman-compose -f podman-compose.yml up -d --build
```

---

## Running Standalone

### Start Container

```bash
./scripts/podman-run.sh
```

### Manual Run

```bash
podman run -d \
  --name chainlit-adk-wysiwyg \
  -p 3001:3001 \
  -p 8000:8000 \
  -e GEMINI_API_KEY="your-api-key" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  chainlit-adk-wysiwyg:latest
```

### Interactive Mode (for debugging)

```bash
podman run -it \
  --name chainlit-adk-debug \
  -p 3001:3001 \
  -p 8000:8000 \
  -e GEMINI_API_KEY="your-api-key" \
  chainlit-adk-wysiwyg:latest \
  /bin/sh
```

### Container Management

```bash
# List running containers
podman ps

# Stop container
podman stop chainlit-adk-wysiwyg

# Start stopped container
podman start chainlit-adk-wysiwyg

# Restart container
podman restart chainlit-adk-wysiwyg

# Remove container
podman rm -f chainlit-adk-wysiwyg
```

---

## Configuration

### Environment Variables

Configure the container using environment variables:

#### Required

- `GEMINI_API_KEY` - Google Gemini API key (required)

#### Optional

- `OPENAI_API_KEY` - OpenAI API key (if using GPT models)
- `NODE_ENV` - Environment mode (default: `production`)
- `BACKEND_PORT` - Backend API port (default: `3001`)
- `CHAINLIT_PORT` - Chainlit server port (default: `8000`)
- `GCP_PROJECT_ID` - Google Cloud project ID
- `GCP_REGION` - GCP region (default: `us-central1`)
- `DEBUG` - Enable debug logging (default: `false`)

### Using .env File

**With podman-compose:**

The `podman-compose.yml` automatically loads variables from `.env.local`:

```bash
# .env.local
GEMINI_API_KEY=your-key-here
DEBUG=true
```

**With standalone podman:**

Load the file before running:

```bash
export $(grep -v '^#' .env.local | xargs)
./scripts/podman-run.sh
```

### Passing Environment Variables

**At runtime:**
```bash
podman run -d \
  -e GEMINI_API_KEY="key1" \
  -e OPENAI_API_KEY="key2" \
  chainlit-adk-wysiwyg:latest
```

**From file:**
```bash
podman run -d \
  --env-file .env.local \
  chainlit-adk-wysiwyg:latest
```

---

## Volumes and Persistence

### Volume Configuration

The `podman-compose.yml` defines a volume for persistent data:

```yaml
volumes:
  chainlit-data:/app/chainlit_app
```

This persists:
- Generated Chainlit applications
- Agent configurations
- Tool implementations

### Managing Volumes

**List volumes:**
```bash
podman volume ls
```

**Inspect volume:**
```bash
podman volume inspect chainlit-adk-wysiwyg_chainlit-data
```

**Backup volume:**
```bash
podman run --rm \
  -v chainlit-adk-wysiwyg_chainlit-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/chainlit-backup.tar.gz /data
```

**Restore volume:**
```bash
podman run --rm \
  -v chainlit-adk-wysiwyg_chainlit-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/chainlit-backup.tar.gz -C /
```

**Remove volume:**
```bash
podman volume rm chainlit-adk-wysiwyg_chainlit-data
```

### Bind Mounts

Mount local directories for development:

```bash
podman run -d \
  -v $(pwd)/chainlit_app:/app/chainlit_app:Z \
  -v $(pwd)/.env.local:/app/.env.local:Z,ro \
  chainlit-adk-wysiwyg:latest
```

---

## Networking

### Port Mapping

Default ports:
- `3001` - Backend API Server
- `8000` - Chainlit Server

### Custom Port Mapping

```bash
podman run -d \
  -p 8080:3001 \
  -p 9000:8000 \
  chainlit-adk-wysiwyg:latest
```

### Network Inspection

```bash
# List networks
podman network ls

# Inspect network
podman network inspect chainlit-adk-wysiwyg_chainlit-network
```

### Host Network Mode

Use host networking for direct access:

```bash
podman run -d \
  --network host \
  chainlit-adk-wysiwyg:latest
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
podman logs chainlit-adk-wysiwyg
```

**Verify environment variables:**
```bash
podman inspect chainlit-adk-wysiwyg | grep -A 20 "Env"
```

### Port Already in Use

**Find process using port:**
```bash
lsof -i :3001
lsof -i :8000
```

**Use different ports:**
```bash
podman run -d \
  -p 3002:3001 \
  -p 8001:8000 \
  chainlit-adk-wysiwyg:latest
```

### Permission Denied Errors

**SELinux issues (Linux):**
```bash
# Add :Z flag to volume mounts
podman run -d \
  -v $(pwd)/data:/app/data:Z \
  chainlit-adk-wysiwyg:latest
```

**Rootless mode:**
```bash
# Ensure running in rootless mode
podman info | grep rootless
```

### Python Dependencies Missing

**Rebuild with no cache:**
```bash
podman build --no-cache -t chainlit-adk-wysiwyg:latest .
```

### Health Check Failing

**Check health status:**
```bash
podman inspect chainlit-adk-wysiwyg | grep -A 10 "Health"
```

**Manual health check:**
```bash
podman exec chainlit-adk-wysiwyg curl http://localhost:3001/health
```

### View Container Processes

```bash
podman top chainlit-adk-wysiwyg
```

### Execute Commands in Container

```bash
# Interactive shell
podman exec -it chainlit-adk-wysiwyg /bin/sh

# Run specific command
podman exec chainlit-adk-wysiwyg ps aux
```

---

## Advanced Usage

### Rootless Podman

Run containers without root privileges:

```bash
# Check if running rootless
podman info | grep rootless

# Run in rootless mode
podman run -d \
  --userns keep-id \
  chainlit-adk-wysiwyg:latest
```

### Resource Limits

**CPU limits:**
```bash
podman run -d \
  --cpus=2 \
  chainlit-adk-wysiwyg:latest
```

**Memory limits:**
```bash
podman run -d \
  --memory=2g \
  --memory-swap=2g \
  chainlit-adk-wysiwyg:latest
```

### Systemd Integration

Create a systemd service for auto-start:

```bash
# Generate systemd unit file
podman generate systemd \
  --name chainlit-adk-wysiwyg \
  --files \
  --new

# Move to systemd directory
mkdir -p ~/.config/systemd/user/
mv container-chainlit-adk-wysiwyg.service ~/.config/systemd/user/

# Enable and start
systemctl --user daemon-reload
systemctl --user enable container-chainlit-adk-wysiwyg.service
systemctl --user start container-chainlit-adk-wysiwyg.service
```

### Pod Support

Run multiple containers in a pod:

```bash
# Create pod
podman pod create \
  --name chainlit-pod \
  -p 3001:3001 \
  -p 8000:8000

# Run container in pod
podman run -d \
  --pod chainlit-pod \
  --name chainlit-app \
  chainlit-adk-wysiwyg:latest
```

### Container Registry

**Tag for registry:**
```bash
podman tag chainlit-adk-wysiwyg:latest \
  your-registry.com/chainlit-adk-wysiwyg:latest
```

**Push to registry:**
```bash
podman push your-registry.com/chainlit-adk-wysiwyg:latest
```

**Pull from registry:**
```bash
podman pull your-registry.com/chainlit-adk-wysiwyg:latest
```

### Export/Import Images

**Save image to tar:**
```bash
podman save -o chainlit-adk-wysiwyg.tar chainlit-adk-wysiwyg:latest
```

**Load image from tar:**
```bash
podman load -i chainlit-adk-wysiwyg.tar
```

### Docker Compatibility

Podman is Docker-compatible. Use `docker` commands:

```bash
# Create alias
alias docker=podman

# Or use docker-compose
docker-compose -f podman-compose.yml up -d
```

---

## Security Best Practices

1. **Use Rootless Containers** - Enhanced security isolation
2. **Regular Updates** - Keep base images updated
3. **Secret Management** - Use environment variables, not hardcoded secrets
4. **Minimal Images** - Use Alpine Linux for smaller attack surface
5. **Resource Limits** - Prevent resource exhaustion
6. **Read-only Mounts** - Mount sensitive files as read-only (`:ro`)
7. **Network Isolation** - Use custom networks

---

## Performance Tuning

### Build Performance

**Use cache:**
```bash
podman build --layers -t chainlit-adk-wysiwyg:latest .
```

**Parallel builds:**
```bash
podman build --jobs=4 -t chainlit-adk-wysiwyg:latest .
```

### Runtime Performance

**Shared memory:**
```bash
podman run -d --shm-size=256m chainlit-adk-wysiwyg:latest
```

**Disable logging:**
```bash
podman run -d --log-driver=none chainlit-adk-wysiwyg:latest
```

---

## Comparison: Docker vs Podman

| Feature | Docker | Podman |
|---------|--------|--------|
| Daemon | Required | Daemonless |
| Root Access | Required | Optional (rootless) |
| Docker Compose | Native | Via podman-compose |
| Systemd | Limited | Native integration |
| CLI Compatibility | - | 100% Docker-compatible |

**Why Podman?**
- Enhanced security (rootless, daemonless)
- Better systemd integration
- No daemon overhead
- Drop-in replacement for Docker

---

## Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/)
- [Podman Compose](https://github.com/containers/podman-compose)
- [Containerfile Best Practices](https://docs.podman.io/en/latest/markdown/podman-build.1.html)

---

## Getting Help

**Container Issues:**
```bash
podman logs chainlit-adk-wysiwyg
podman inspect chainlit-adk-wysiwyg
podman events
```

**Application Issues:**
- Check the main [README.md](./README.md)
- Review [Troubleshooting](./README.md#troubleshooting)
- Open a [GitHub Issue](../../issues)

---

Built with Podman for secure, efficient containerization.
