/**
 * Makefile Generator
 *
 * Generates a Makefile for development automation following
 * agent-starter-pack patterns and Python best practices.
 */

import { GCPConfig } from '../../types';

/**
 * Generates Makefile with common development tasks
 * @param gcpConfig - GCP deployment configuration
 * @returns Makefile content
 */
export const generateMakefile = (gcpConfig: GCPConfig): string => {
    const projectId = gcpConfig.projectId || 'your-project-id';
    const serviceName = gcpConfig.serviceName || 'chainlit-adk-agent';
    const region = gcpConfig.region || 'us-central1';

    return `.PHONY: help install install-dev run test lint format type-check clean docker-build docker-run deploy

# Default target
help:
\t@echo "Available targets:"
\t@echo "  install          Install production dependencies"
\t@echo "  install-dev      Install development dependencies"
\t@echo "  run              Run the Chainlit application locally"
\t@echo "  test             Run tests with coverage"
\t@echo "  lint             Run linting (ruff)"
\t@echo "  format           Format code (black + ruff)"
\t@echo "  type-check       Run type checking (mypy)"
\t@echo "  clean            Clean build artifacts and caches"
\t@echo "  docker-build     Build Docker image"
\t@echo "  docker-run       Run Docker container locally"
\t@echo "  deploy           Deploy to GCP Cloud Run"
\t@echo "  deploy-build     Submit build to Cloud Build"

# Python environment variables
PYTHON := python3
PIP := \${PYTHON} -m pip
VENV := .venv
ACTIVATE := . \${VENV}/bin/activate

# GCP configuration
PROJECT_ID := ${projectId}
SERVICE_NAME := ${serviceName}
REGION := ${region}
IMAGE_NAME := \${REGION}-docker.pkg.dev/\${PROJECT_ID}/agent-repo/\${SERVICE_NAME}

# Installation
install:
\t@echo "Installing production dependencies..."
\t\${PIP} install -e .

install-dev:
\t@echo "Installing development dependencies..."
\t\${PIP} install -e ".[dev,gcp]"

# Virtual environment setup
venv:
\t@echo "Creating virtual environment..."
\t\${PYTHON} -m venv \${VENV}
\t@echo "Activate with: source \${VENV}/bin/activate"

# Running the application
run:
\t@echo "Starting Chainlit application..."
\tchainlit run backend/main.py -w --host 0.0.0.0 --port 8000

run-prod:
\t@echo "Starting Chainlit application (production mode)..."
\tchainlit run backend/main.py --host 0.0.0.0 --port 8080

# Testing
test:
\t@echo "Running tests with coverage..."
\tpytest

test-verbose:
\t@echo "Running tests in verbose mode..."
\tpytest -v

test-watch:
\t@echo "Running tests in watch mode..."
\tpytest-watch

# Code quality
lint:
\t@echo "Running linting checks..."
\truff check backend/

lint-fix:
\t@echo "Running linting with auto-fix..."
\truff check backend/ --fix

format:
\t@echo "Formatting code..."
\tblack backend/
\truff format backend/

format-check:
\t@echo "Checking code formatting..."
\tblack --check backend/
\truff format --check backend/

type-check:
\t@echo "Running type checking..."
\tmypy backend/

# Quality checks (run all)
check: lint format-check type-check test
\t@echo "All quality checks passed!"

# Cleaning
clean:
\t@echo "Cleaning build artifacts and caches..."
\trm -rf build/
\trm -rf dist/
\trm -rf *.egg-info
\trm -rf .pytest_cache/
\trm -rf .mypy_cache/
\trm -rf .ruff_cache/
\trm -rf .coverage
\trm -rf htmlcov/
\tfind . -type d -name __pycache__ -exec rm -rf {} +
\tfind . -type f -name "*.pyc" -delete

clean-all: clean
\t@echo "Removing virtual environment..."
\trm -rf \${VENV}

# Docker operations
docker-build:
\t@echo "Building Docker image..."
\tdocker build -t \${SERVICE_NAME}:latest .

docker-run:
\t@echo "Running Docker container..."
\tdocker run -p 8080:8080 --env-file .env \${SERVICE_NAME}:latest

docker-shell:
\t@echo "Opening shell in Docker container..."
\tdocker run -it --env-file .env \${SERVICE_NAME}:latest /bin/bash

# GCP deployment
gcp-setup:
\t@echo "Setting up GCP project..."
\tgcloud config set project \${PROJECT_ID}
\tgcloud services enable cloudbuild.googleapis.com
\tgcloud services enable artifactregistry.googleapis.com
\tgcloud services enable run.googleapis.com
\tgcloud artifacts repositories create agent-repo \\
\t\t--repository-format=docker \\
\t\t--location=\${REGION} \\
\t\t--description="Agent Docker repository" || true

deploy-build:
\t@echo "Submitting build to Cloud Build..."
\tgcloud builds submit \\
\t\t--config cloudbuild.yaml \\
\t\t--project=\${PROJECT_ID} \\
\t\t--region=\${REGION}

deploy: deploy-build
\t@echo "Deploying to Cloud Run..."
\tgcloud run deploy \${SERVICE_NAME} \\
\t\t--image \${IMAGE_NAME}:latest \\
\t\t--platform managed \\
\t\t--region \${REGION} \\
\t\t--project \${PROJECT_ID} \\
\t\t--allow-unauthenticated \\
\t\t--memory 2Gi \\
\t\t--cpu 2 \\
\t\t--timeout 3600 \\
\t\t--max-instances 10

deploy-local:
\t@echo "Deploying from local Dockerfile..."
\tgcloud run deploy \${SERVICE_NAME} \\
\t\t--source . \\
\t\t--platform managed \\
\t\t--region \${REGION} \\
\t\t--project \${PROJECT_ID} \\
\t\t--allow-unauthenticated

# Development helpers
env-example:
\t@echo "Creating .env.example file..."
\t@echo "OPENAI_API_KEY=your-openai-api-key" > .env.example
\t@echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json" >> .env.example
\t@echo "GCP_PROJECT_ID=\${PROJECT_ID}" >> .env.example
\t@echo "GCP_REGION=\${REGION}" >> .env.example
\t@echo "PORT=8000" >> .env.example

init: venv install-dev env-example
\t@echo "Project initialized!"
\t@echo "Activate environment: source \${VENV}/bin/activate"
\t@echo "Copy .env.example to .env and add your credentials"

# CI/CD helpers
ci: lint format-check type-check test
\t@echo "CI pipeline checks passed!"
`;
};
