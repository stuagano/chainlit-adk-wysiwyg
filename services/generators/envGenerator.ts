/**
 * Environment File Generator
 *
 * Generates .env.example template with all required environment variables
 */

import { Agent, GCPConfig } from '../../types';

/**
 * Generates .env.example file with environment variable templates
 * @param agents - Array of agent configurations
 * @param gcpConfig - GCP deployment configuration
 * @returns .env.example content
 */
export const generateEnvExample = (agents: Agent[], gcpConfig: GCPConfig): string => {
    const allModels = agents.map(agent => agent.llmModel);
    const usesOpenAI = allModels.some(model => !model.startsWith('gemini'));
    const usesVertex = allModels.some(model => model.startsWith('gemini'));

    let envContent = `# Environment Configuration for Chainlit ADK Agent
# Copy this file to .env and fill in your actual values
# NEVER commit the .env file to version control

# ============================================================================
# Application Settings
# ============================================================================

# Server port (default: 8000 for local, 8080 for production)
PORT=8000

# Environment mode (development, staging, production)
ENVIRONMENT=development

# Enable debug logging
DEBUG=false

`;

    // OpenAI configuration
    if (usesOpenAI) {
        envContent += `# ============================================================================
# OpenAI Configuration
# ============================================================================

# OpenAI API Key
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...your-openai-api-key...

# Optional: OpenAI Organization ID
# OPENAI_ORG_ID=org-...your-org-id...

`;
    }

    // Google Cloud / Vertex AI configuration
    if (usesVertex || gcpConfig.useMemoryBank) {
        envContent += `# ============================================================================
# Google Cloud Platform Configuration
# ============================================================================

# GCP Project ID
GCP_PROJECT_ID=${gcpConfig.projectId || 'your-gcp-project-id'}

# GCP Region
GCP_REGION=${gcpConfig.region || 'us-central1'}

# Google Application Credentials
# Path to your service account key JSON file
# IMPORTANT: Store this file OUTSIDE your repository for security
# Download from: https://console.cloud.google.com/iam-admin/serviceaccounts
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Alternative: Use Application Default Credentials (ADC)
# For local development, run: gcloud auth application-default login
# Then comment out GOOGLE_APPLICATION_CREDENTIALS above

`;
    }

    // Memory Bank configuration
    if (gcpConfig.useMemoryBank) {
        envContent += `# ============================================================================
# Memory Bank Configuration
# ============================================================================

# Enable Memory Bank (true/false)
USE_MEMORY_BANK=true

# Memory Bank project and location (usually same as GCP settings above)
MEMORY_BANK_PROJECT_ID=${gcpConfig.projectId || 'your-gcp-project-id'}
MEMORY_BANK_LOCATION=${gcpConfig.region || 'us-central1'}

`;
    }

    // Chainlit configuration
    envContent += `# ============================================================================
# Chainlit Configuration
# ============================================================================

# Chainlit server host
CHAINLIT_HOST=0.0.0.0

# Chainlit server port (uses PORT from above if not set)
CHAINLIT_PORT=8000

# Session timeout in seconds (default: 3600 = 1 hour)
# CHAINLIT_SESSION_TIMEOUT=3600

# Enable telemetry (true/false)
# CHAINLIT_TELEMETRY=false

`;

    // Cloud Run / Production configuration
    if (gcpConfig.projectId) {
        envContent += `# ============================================================================
# Cloud Run / Production Configuration
# ============================================================================

# Service name for deployment
SERVICE_NAME=${gcpConfig.serviceName || 'chainlit-adk-agent'}

# Maximum instances for autoscaling
# MAX_INSTANCES=10

# Minimum instances (0 = scale to zero)
# MIN_INSTANCES=0

# Memory limit (e.g., 2Gi, 4Gi)
# MEMORY_LIMIT=2Gi

# CPU allocation (e.g., 1, 2, 4)
# CPU_LIMIT=2

# Request timeout in seconds
# TIMEOUT=3600

`;
    }

    // Security and monitoring
    envContent += `# ============================================================================
# Security & Monitoring (Optional)
# ============================================================================

# Enable CORS (comma-separated origins)
# CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# API rate limiting (requests per minute)
# RATE_LIMIT=60

# Enable request logging
# LOG_REQUESTS=true

# Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Enable structured logging (for Cloud Logging)
# STRUCTURED_LOGGING=false

# ============================================================================
# Development Tools (Optional)
# ============================================================================

# Enable auto-reload on code changes
# CHAINLIT_WATCH=true

# Enable detailed error messages
# SHOW_DETAILED_ERRORS=true
`;

    return envContent;
};
