<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Chainlit ADK WYSIWYG Builder

**Visual Multi-Agent Workflow Builder for Chainlit**

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/stuagano/chainlit-adk-wysiwyg&cloudshell_tutorial=docs/CLOUDSHELL_TUTORIAL.md)

[![Node.js CI](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-212%20passing-success)](./test/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🚀 Try it now:** Click the "Open in Cloud Shell" button above to get started in your browser!

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Containerization (Podman/Docker)](#containerization-podmandocker)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

A visual, no-code interface for building and deploying multi-agent AI workflows powered by Google's ADK (Agent Development Kit) and Chainlit. Design sophisticated agent hierarchies, configure tools, and deploy production-ready conversational AI applications—all through an intuitive drag-and-drop interface.

**Key Capabilities:**
- 🎨 **Visual Workflow Designer** - Drag-and-drop interface for agent orchestration
- 🛠️ **Tool Configuration** - Define and configure custom tools with parameter validation
- 🔄 **Multiple Workflow Types** - Sequential, Hierarchical, and Collaborative workflows
- ⚡ **Live Preview** - Real-time Chainlit server with hot-reload
- 🚀 **One-Click Deploy** - Generate deployment-ready code for GCP Cloud Run
- 🔐 **Enterprise-Ready** - Comprehensive error handling, validation, and security

---

## ✨ Features

### Agent Management
- Create and configure multiple AI agents with custom prompts
- Support for multiple LLM providers (Gemini, Claude, GPT-4)
- Drag-and-drop agent ordering and hierarchy
- Visual workflow designer with three workflow types

### Tool System
- Define custom tools with typed parameters (string, number, boolean)
- Parameter validation with required/optional flags
- Automatic code generation for tool implementations
- Built-in preflight validation

### Development Experience
- **Live Preview** - Chainlit dev server with hot-reload (http://localhost:8000)
- **Instant Sync** - One-click sync of UI changes to Chainlit
- **Type Safety** - Full TypeScript with Zod schema validation
- **Error Handling** - Comprehensive error boundaries and structured logging
- **Auto-Save** - Persistent localStorage with version management

### Deployment
- **GCP Cloud Run** - Pre-configured Dockerfile and deployment configs
- **Environment Management** - Secure credential handling
- **Production Ready** - Includes all dependencies and optimizations

### Quality Assurance
- 212 passing tests with 100% coverage on critical paths
- Schema validation on all data structures
- Input sanitization and path traversal protection
- Structured error logging with context

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │  Agent     │  │  Tools     │  │  Workflow Designer  │  │
│  │  Config    │  │  Config    │  │  (Drag & Drop)      │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ API Calls (fetch with retry)
┌──────────────────────▼──────────────────────────────────────┐
│              Express Backend Server                          │
│  ┌──────────────────┐    ┌─────────────────────────────┐  │
│  │  /api/sync-      │    │  /api/launch-chainlit      │  │
│  │   chainlit       │    │  (Process Management)       │  │
│  │  (Validation &   │    │                             │  │
│  │   Code Gen)      │    │                             │  │
│  └──────────────────┘    └─────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Generates & Syncs
┌──────────────────────▼──────────────────────────────────────┐
│                 Chainlit Application                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py (Generated Agent Workflow)                  │  │
│  │  tools.py (Generated Tool Implementations)           │  │
│  │  requirements.txt                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Python** 3.10+
- **Git**

### Required API Keys

Set up environment variables in `.env.local`:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for deployment)
GCP_PROJECT_ID=your_gcp_project_id
GCP_REGION=us-central1
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd chainlit-adk-wysiwyg
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 3. Start Development Server

```bash
# Option A: Frontend only
npm run dev

# Option B: Frontend + Backend (recommended)
npm run dev:all
```

Visit http://localhost:3000 to access the UI builder.

### 4. Create Your First Agent

1. Configure agent settings (name, prompt, LLM model)
2. Add tools with parameters
3. Click **Generate Code**
4. Click **Sync to Chainlit**

### 5. Launch Chainlit Preview

```bash
# First time: Install Python dependencies
cd chainlit_app
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start Chainlit dev server
npm run chainlit:dev
```

Visit http://localhost:8000 to interact with your agent workflow.

---

## 🐳 Container-Based Development (Optional)

For a consistent, reproducible development environment without installing Node.js or Python locally.

### Quick Start with Containers

**Option A: VS Code DevContainer (Recommended)**
```bash
# 1. Install Docker Desktop or Podman
# 2. Install VS Code "Dev Containers" extension
# 3. Open project in VS Code
code .

# 4. Click "Reopen in Container" when prompted
# Wait ~30 seconds, then you're ready to code!
```

**Option B: Docker Compose**
```bash
# Start development environment
./scripts/dev-container-start.sh

# Services available at:
#   - Frontend: http://localhost:3000
#   - Backend:  http://localhost:3001
#   - Chainlit: http://localhost:8000

# Shell into container
./scripts/dev-container-shell.sh

# Stop environment
./scripts/dev-container-stop.sh
```

### Benefits

- ✅ **Zero Local Dependencies** - No Node.js or Python installation needed
- ✅ **Instant Onboarding** - Clone → Open → Code (< 5 minutes)
- ✅ **Team Consistency** - Everyone uses identical environment
- ✅ **Hot Reload** - All services support live editing
- ✅ **CI/CD Parity** - Dev environment matches production

### Container Development Scripts

```bash
npm run dev:container          # Start dev container
npm run dev:container:build    # Build dev container
npm run dev:container:down     # Stop dev containers
npm run dev:container:shell    # Shell into container
npm run dev:container:logs     # View container logs
```

### Full Documentation

See [CONTAINER_DEV.md](./CONTAINER_DEV.md) for complete guide including:
- VS Code DevContainer setup
- Docker Compose workflows
- Troubleshooting
- Advanced usage

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend (Vite) on port 3000
npm run dev:backend      # Start backend (Express) on port 3001
npm run dev:all          # Start both frontend and backend
npm run chainlit:dev     # Start Chainlit server on port 8000

# Building
npm run build            # Build frontend for production
npm run build:backend    # Build backend for production
npm run preview          # Preview production build

# Code Quality
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking

# Security
npm run security:audit   # Run security audit
npm run security:npm     # Check npm dependencies
npm run security:fix     # Fix security vulnerabilities
```

### Development Workflow

1. **Make Changes** in the UI builder
2. **Generate Code** to create Python files
3. **Sync to Chainlit** to update the running server
4. **Test** in the Chainlit preview (auto-reloads)
5. **Iterate** and repeat

### Hot Reload

Both the frontend and Chainlit server support hot reload:
- **Frontend**: Changes to React components reload instantly
- **Chainlit**: Re-syncing updates Python files and restarts the server

---

## 🧪 Testing

### Test Suite

The project includes comprehensive tests:

- **212 tests** covering all critical functionality
- **62 schema validation tests**
- **29 error handling tests**
- **Integration tests** for the full workflow

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

- ✅ Schema validation (Zod schemas)
- ✅ Error handling utilities
- ✅ API endpoints
- ✅ React components
- ✅ Code generation
- ✅ File operations

---

## 🐳 Containerization (Podman/Docker)

The application includes full support for containerization using Podman (or Docker).

### Quick Start with Podman

```bash
# 1. Build the container
./scripts/podman-build.sh

# 2. Run with podman-compose
./scripts/podman-compose-up.sh

# Or run standalone
./scripts/podman-run.sh
```

### Access Services

- **Backend API:** http://localhost:3001
- **Chainlit UI:** http://localhost:8000

### Container Features

- Multi-stage build for optimized image size
- Node.js + Python runtime
- Rootless container support
- Health checks and auto-restart
- Persistent volumes for generated code
- Resource limits and security hardening

### Available Scripts

```bash
./scripts/podman-build.sh           # Build container image
./scripts/podman-run.sh             # Run container standalone
./scripts/podman-compose-up.sh      # Start with compose
./scripts/podman-compose-down.sh    # Stop compose services
./scripts/podman-logs.sh            # View container logs
```

### Requirements

- **Podman** 4.0+ or **Docker** 20.10+
- **podman-compose** (optional, for compose support)

### Installation

**Linux (RHEL/Fedora):**
```bash
sudo dnf install -y podman
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y podman
```

**macOS:**
```bash
brew install podman
podman machine init && podman machine start
```

**Windows:**
Download from [Podman Desktop](https://podman-desktop.io/)

### Documentation

For complete containerization documentation, including:
- Advanced configuration
- Volume management
- Network setup
- Troubleshooting
- Production deployment

See [PODMAN.md](./PODMAN.md)

---

## 🚢 Deployment

### Standalone Chainlit Deployment (Recommended)

Deploy only the Chainlit application as a dedicated instance to Cloud Run. This provides:
- ✅ Smaller container size (Python only, no Node.js)
- ✅ Better security (no development tools)
- ✅ Easier scaling and lower costs

#### Quick Deployment

```bash
# 1. Set your GCP project
export GCP_PROJECT_ID="your-project-id"

# 2. Deploy to Cloud Run
./scripts/deploy-chainlit.sh --project-id $GCP_PROJECT_ID --region us-central1 --no-auth
```

#### Manual Deployment

```bash
# 1. Create .env file in chainlit_app/
cd chainlit_app
cp .env.example .env
# Edit .env and add your API keys

# 2. Build and deploy
cd ..
gcloud builds submit --tag gcr.io/PROJECT_ID/chainlit-app --dockerfile=Dockerfile.chainlit .
gcloud run deploy chainlit-app \
  --image gcr.io/PROJECT_ID/chainlit-app \
  --platform managed \
  --region us-central1 \
  --port 8000 \
  --set-env-vars="GEMINI_API_KEY=your_key" \
  --allow-unauthenticated
```

**📖 Complete deployment guide:** See [docs/CHAINLIT_DEPLOYMENT.md](./docs/CHAINLIT_DEPLOYMENT.md)

### Full Stack Deployment (UI Builder + Chainlit)

For deploying both the UI builder and Chainlit together:

1. **Configure GCP Settings** in the UI:
   - Project ID
   - Service Name
   - Region
   - Upload Service Account Key

2. **Generate Deployment Files**:
   - Click "Generate Code"
   - Downloads include Dockerfile and deployment configs

3. **Deploy** using the main Dockerfile:

```bash
# Authenticate with GCP
gcloud auth login

# Deploy to Cloud Run
gcloud run deploy [SERVICE_NAME] \
  --source . \
  --project [PROJECT_ID] \
  --region [REGION] \
  --allow-unauthenticated
```

### Environment Variables for Production

Set these in your deployment environment:

```bash
GEMINI_API_KEY=your_production_api_key
NODE_ENV=production
PORT=8080  # Cloud Run default
CHAINLIT_PORT=8000  # For standalone Chainlit
```

---

## 📁 Project Structure

```
chainlit-adk-wysiwyg/
├── components/           # React components
│   ├── AgentConfig.tsx
│   ├── ToolsConfig.tsx
│   ├── WorkflowDesigner.tsx
│   ├── CodePreview.tsx
│   ├── ErrorBoundary.tsx
│   └── ...
├── services/             # Business logic
│   ├── codeGenerator.ts  # Code generation engine
│   ├── preflight.ts      # Validation service
│   ├── storage.ts        # localStorage management
│   └── chainlitProcessQueue.ts  # Process lifecycle
├── server/               # Express backend
│   └── index.ts          # API endpoints
├── utils/                # Shared utilities
│   ├── schemas.ts        # Zod validation schemas
│   ├── errors.ts         # Error handling utilities
│   ├── fetch.ts          # Network utilities
│   └── validation.ts     # Input validators
├── test/                 # Test suites
│   ├── schemas.test.ts
│   ├── errors.test.ts
│   ├── App.test.tsx
│   └── ...
├── chainlit_app/         # Generated Chainlit code (gitignored)
│   ├── main.py
│   ├── tools.py
│   └── requirements.txt
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
├── App.tsx               # Main React application
├── index.tsx             # Application entry point
├── types.ts              # TypeScript type definitions
├── constants.ts          # Application constants
└── vite.config.ts        # Vite configuration
```

---

## 🔐 Security

### Security Features

- ✅ **Input Validation** - Zod schema validation on all inputs
- ✅ **Path Traversal Protection** - Filename sanitization and validation
- ✅ **Credential Handling** - Secure storage, excluded from git
- ✅ **CORS Configuration** - Restricted origins in production
- ✅ **Error Handling** - No sensitive data in error messages
- ✅ **Rate Limiting** - Process queue with failure thresholds
- ✅ **Structured Logging** - Security event tracking

### Best Practices

1. **Never commit** `.env` files or credentials
2. **Validate all inputs** using Zod schemas
3. **Use environment variables** for secrets
4. **Review generated code** before deployment
5. **Keep dependencies updated** (`npm audit`)

### Excluded from Git

See [.gitignore](.gitignore) for complete list:
- Credentials (`.env`, `*credentials*.json`, `*.pem`)
- API keys and service account files
- Build artifacts and dependencies
- Local configuration files

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with tests
4. **Run the test suite** (`npm test`)
5. **Lint and format** (`npm run lint:fix && npm run format`)
6. **Commit** with conventional commits
7. **Push** and create a Pull Request

### Code Standards

- TypeScript with strict mode
- ESLint + Prettier for formatting
- 100% test coverage on new features
- Meaningful commit messages

---

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Chainlit server fails to start**
```bash
# Check Python environment
python3 --version  # Should be 3.10+

# Recreate virtual environment
cd chainlit_app
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**"Module not found" errors**
```bash
# Ensure all dependencies are installed
npm install
cd chainlit_app && pip install -r requirements.txt
```

**Tests failing**
```bash
# Clear test cache
npm run test -- --clearCache
npm test
```

### Getting Help

- 📖 **Documentation**: See [docs/](./docs/)
- 💬 **Issues**: [GitHub Issues](../../issues)
- 📧 **Contact**: See repository owner

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Chainlit** - Conversational AI framework
- **Google ADK** - Agent Development Kit
- **React** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety

---

<div align="center">

**Built with ❤️ using Claude Code**

[⬆ Back to Top](#-table-of-contents)

</div>
