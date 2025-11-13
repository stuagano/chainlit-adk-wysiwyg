/**
 * GitHub Actions Workflow Generator
 *
 * Generates CI/CD workflows for testing, linting, and deployment
 */

import { GCPConfig } from '../../types';

/**
 * Generates GitHub Actions CI workflow
 * @returns GitHub Actions workflow YAML
 */
export const generateCIWorkflow = (): string => {
    return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test and Lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: \${{ matrix.python-version }}
        cache: 'pip'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -e ".[dev]"

    - name: Run linting (ruff)
      run: |
        ruff check backend/

    - name: Check code formatting (black)
      run: |
        black --check backend/

    - name: Run type checking (mypy)
      run: |
        mypy backend/
      continue-on-error: true

    - name: Run tests with coverage
      run: |
        pytest --cov=backend --cov-report=xml --cov-report=term

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage.xml
        flags: unittests
        name: codecov-umbrella
      continue-on-error: true

  security:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -e .

    - name: Run safety check
      run: |
        pip install safety
        safety check
      continue-on-error: true

    - name: Run bandit security linter
      run: |
        pip install bandit
        bandit -r backend/
      continue-on-error: true
`;
};

/**
 * Generates GitHub Actions CD workflow for GCP deployment
 * @param gcpConfig - GCP deployment configuration
 * @returns GitHub Actions workflow YAML
 */
export const generateCDWorkflow = (gcpConfig: GCPConfig): string => {
    const projectId = gcpConfig.projectId || 'your-project-id';
    const serviceName = gcpConfig.serviceName || 'chainlit-adk-agent';
    const region = gcpConfig.region || 'us-central1';

    return `name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  PROJECT_ID: ${projectId}
  SERVICE_NAME: ${serviceName}
  REGION: ${region}

jobs:
  deploy:
    name: Deploy to GCP Cloud Run
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: \${{ secrets.WIF_PROVIDER }}
        service_account: \${{ secrets.WIF_SERVICE_ACCOUNT }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Configure Docker for Artifact Registry
      run: |
        gcloud auth configure-docker \${{ env.REGION }}-docker.pkg.dev

    - name: Build and Push Docker Image
      run: |
        docker build -t \${{ env.REGION }}-docker.pkg.dev/\${{ env.PROJECT_ID }}/agent-repo/\${{ env.SERVICE_NAME }}:latest .
        docker push \${{ env.REGION }}-docker.pkg.dev/\${{ env.PROJECT_ID }}/agent-repo/\${{ env.SERVICE_NAME }}:latest

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy \${{ env.SERVICE_NAME }} \\
          --image \${{ env.REGION }}-docker.pkg.dev/\${{ env.PROJECT_ID }}/agent-repo/\${{ env.SERVICE_NAME }}:latest \\
          --platform managed \\
          --region \${{ env.REGION }} \\
          --allow-unauthenticated \\
          --memory 2Gi \\
          --cpu 2 \\
          --timeout 3600 \\
          --max-instances 10 \\
          --set-env-vars "ENVIRONMENT=production" \\
          --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest,GOOGLE_APPLICATION_CREDENTIALS=GCP_SERVICE_ACCOUNT_KEY:latest"

    - name: Show deployment URL
      run: |
        gcloud run services describe \${{ env.SERVICE_NAME }} \\
          --platform managed \\
          --region \${{ env.REGION }} \\
          --format 'value(status.url)'
`;
};

/**
 * Generates Dependabot configuration for automated dependency updates
 * @returns Dependabot YAML configuration
 */
export const generateDependabotConfig = (): string => {
    return `version: 2
updates:
  # Enable version updates for Python dependencies
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
      - "python"

  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "github-actions"
`;
};
