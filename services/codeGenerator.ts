/**
 * Code Generation Service (Refactored)
 *
 * Main orchestrator for generating Python code for multi-agent workflows.
 * Delegates to specialized generators for each file type.
 *
 * Updated to generate agent-starter-pack compatible structure with:
 * - pyproject.toml (modern Python packaging)
 * - Makefile (development automation)
 * - backend/ directory structure
 * - GitHub Actions workflows
 * - Enhanced deployment configurations
 */

import { Agent, GCPConfig, WorkflowType } from '../types';
import { generateToolsPy } from './generators/toolsGenerator';
import { generateMainPy } from './generators/mainGenerator';
import {
    generateRequirementsTxt,
    generateReadme,
    generateDockerfile,
    generateCloudBuildYaml,
    generateDeploySh,
    generateGcloudIgnore,
    generateDockerignore,
} from './generators/auxiliaryGenerators';
import { generatePyprojectToml } from './generators/pyprojectGenerator';
import { generateMakefile } from './generators/makefileGenerator';
import { generateEnvExample } from './generators/envGenerator';
import { generateBackendInit } from './generators/initGenerator';
import {
    generateCIWorkflow,
    generateCDWorkflow,
    generateDependabotConfig,
} from './generators/githubActionsGenerator';

/**
 * Generates a complete multi-agent workflow codebase
 * Compatible with Google Cloud agent-starter-pack patterns
 *
 * @param agents - Array of agent configurations from the UI
 * @param gcpConfig - GCP deployment configuration
 * @param workflowType - Workflow architecture type (Sequential, Hierarchical, Collaborative)
 * @returns Object mapping filenames to their generated content
 *
 * @example
 * const files = generateCode(agents, gcpConfig, 'Sequential');
 * // Returns agent-starter-pack compatible structure:
 * // {
 * //   'backend/main.py': '...',
 * //   'backend/tools.py': '...',
 * //   'backend/__init__.py': '...',
 * //   'pyproject.toml': '...',
 * //   'Makefile': '...',
 * //   '.env.example': '...',
 * //   'README.md': '...',
 * //   'Dockerfile': '...',
 * //   '.github/workflows/ci.yml': '...',
 * //   ...
 * // }
 */
export const generateCode = (
    agents: Agent[],
    gcpConfig: GCPConfig,
    workflowType: WorkflowType
): Record<string, string> => {
    // Collect all unique tools from all agents
    const allTools = agents.flatMap(agent => agent.tools);

    // Generate backend/ directory files
    const files: Record<string, string> = {
        // Backend Python package
        'backend/__init__.py': generateBackendInit(),
        'backend/main.py': generateMainPy(agents, gcpConfig, workflowType),
        'backend/tools.py': generateToolsPy(allTools),

        // Modern Python packaging (replaces requirements.txt)
        'pyproject.toml': generatePyprojectToml(agents, gcpConfig),

        // Legacy requirements.txt for backwards compatibility
        'requirements.txt': generateRequirementsTxt(agents, gcpConfig),

        // Development automation
        'Makefile': generateMakefile(gcpConfig),

        // Environment configuration
        '.env.example': generateEnvExample(agents, gcpConfig),

        // Documentation
        'README.md': generateReadme(agents, gcpConfig, workflowType),

        // Docker configuration
        'Dockerfile': generateDockerfile(),
        '.dockerignore': generateDockerignore(),
        '.gcloudignore': generateGcloudIgnore(),

        // GitHub Actions CI/CD
        '.github/workflows/ci.yml': generateCIWorkflow(),
        '.github/dependabot.yml': generateDependabotConfig(),
    };

    // Add GCP-specific deployment files if configuration provided
    if (gcpConfig.projectId) {
        files['cloudbuild.yaml'] = generateCloudBuildYaml(gcpConfig);
        files['deploy.sh'] = generateDeploySh(gcpConfig);
        files['.github/workflows/deploy.yml'] = generateCDWorkflow(gcpConfig);
    }

    return files;
};
