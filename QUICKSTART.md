# Quick Start Guide

This guide will help you set up and start working on fixing the identified gaps in the repository.

## Prerequisites

- Node.js >= 20.0.0 (use `nvm use` if you have nvm installed)
- npm >= 10.0.0
- Python 3.10+
- Git

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd chainlit-adk-wysiwyg

# Use the correct Node version
nvm use
# or manually ensure you're using Node 20+

# Install npm dependencies
npm install

# Install linting/formatting tools
npm install -D \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your API keys
# Required: GEMINI_API_KEY
# Optional: OPENAI_API_KEY
```

### 3. Verify Setup

```bash
# Run tests
npm test

# Run linting (will fail until dependencies are installed)
npm run lint

# Check formatting
npm run format:check

# Build the project
npm run build
```

## Development Workflow

### Running the Application

```bash
# Option 1: Run frontend only
npm run dev

# Option 2: Run frontend + Chainlit preview
npm run dev:all
```

### Code Quality Commands

```bash
# Run linter
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code
npm run format

# Check formatting without changes
npm run format:check

# Type check
npm run type-check

# Run all checks
npm run lint && npm run format:check && npm run type-check && npm test
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Working on Fixes

### Week 1 Priority (Security & Critical)

Start with these tasks in order:

#### 1. Install Linting Tools (15 minutes)
```bash
npm install -D \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks
```

#### 2. Fix Path Traversal (1 hour)
See `IMPLEMENTATION_PLAN.md` → P0-1

```bash
# Create validation utility
mkdir -p utils
# Edit utils/validation.ts
# Update vite.config.ts
# Add tests
```

#### 3. Add SRI Integrity (2 hours)
See `IMPLEMENTATION_PLAN.md` → P0-2

```bash
# Generate hashes for CDN resources
# Update index.html
```

#### 4. Remove API Key from Build (4 hours)
See `IMPLEMENTATION_PLAN.md` → P0-3

**Note:** This requires creating a backend proxy or rethinking the architecture.

#### 5. Fix Promise Rejections (2 hours)
See `IMPLEMENTATION_PLAN.md` → P0-5

```bash
# Add error handlers to:
# - App.tsx (zip download)
# - CodePreview.tsx (clipboard)
# - App.tsx (file reader)
```

### Checking Progress

Track your progress using the checklists in `IMPLEMENTATION_PLAN.md`.

Update the status emoji:
- 🔴 Not Started → 🟡 In Progress → 🟢 Completed

## Git Workflow

### Creating a Feature Branch

```bash
# Create a new branch for your fix
git checkout -b fix/path-traversal-vulnerability

# Make your changes
# ...

# Commit with descriptive message
git add .
git commit -m "fix: add path traversal validation

- Add validateFilename() utility
- Update sync-chainlit endpoint
- Add unit tests
- Fixes security vulnerability CWE-22"

# Push to remote
git push -u origin fix/path-traversal-vulnerability
```

### Commit Message Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `fix`: Bug fix
- `feat`: New feature
- `docs`: Documentation changes
- `test`: Adding tests
- `refactor`: Code refactoring
- `chore`: Build/tooling changes

**Examples:**
```bash
git commit -m "fix: prevent path traversal in file sync"
git commit -m "test: add unit tests for codeGenerator"
git commit -m "docs: update API documentation"
git commit -m "chore: add ESLint configuration"
```

## CI/CD Pipeline

After pushing your changes, GitHub Actions will automatically:

1. Run tests
2. Run linting
3. Check formatting
4. Build the project
5. Run security audit

Check the Actions tab on GitHub to see results.

## Common Issues

### Port Already in Use

```bash
# If port 3000 is taken
PORT=3001 npm run dev

# If Chainlit port 8000 is taken
CHAINLIT_PORT=8001 npm run chainlit:dev
```

### Node Version Mismatch

```bash
# Use nvm to switch to correct version
nvm use

# Or install the required version
nvm install 20.10.0
nvm use 20.10.0
```

### Linting Errors

```bash
# Auto-fix what can be fixed
npm run lint:fix

# Format code
npm run format
```

### Test Failures

```bash
# Run tests in watch mode to debug
npm run test:watch

# Run with verbose output
npm test -- --reporter=verbose
```

## Getting Help

1. Check `IMPLEMENTATION_PLAN.md` for detailed task descriptions
2. Check `GAP_ANALYSIS.md` for context on issues
3. Check existing tests for patterns
4. Check `AGENTS.md` for coding guidelines

## Next Steps

1. ✅ Complete environment setup
2. ✅ Run all verification commands
3. 📋 Review `IMPLEMENTATION_PLAN.md`
4. 🎯 Pick a P0 task from Week 1
5. 🔧 Make changes following the plan
6. ✅ Run tests and linting
7. 📝 Commit with descriptive message
8. 🚀 Push and create PR

## Useful Links

- [Gap Analysis](./GAP_ANALYSIS.md) - What needs to be fixed
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - How to fix it
- [Contributing Guide](./AGENTS.md) - Code standards
- [README](./README.md) - Project overview

---

**Ready to start?** Pick a task from Week 1 in `IMPLEMENTATION_PLAN.md` and get coding! 🚀
