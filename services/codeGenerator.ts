/**
 * Code Generation Service (Refactored)
 *
 * Main orchestrator for generating Python code for multi-agent workflows.
 * Delegates to specialized generators for each file type.
 *
 * This refactored version replaces the 699-line codeGenerator.ts with a clean,
 * modular architecture.
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
} from './generators/auxiliaryGenerators';

/**
 * Generates a complete multi-agent workflow codebase
 *
 * @param agents - Array of agent configurations from the UI
 * @param gcpConfig - GCP deployment configuration
 * @param workflowType - Workflow architecture type (Sequential, Hierarchical, Collaborative)
 * @returns Object mapping filenames to their generated content
 *
 * @example
 * const files = generateCode(agents, gcpConfig, 'Sequential');
 * // Returns:
 * // {
 * //   'main.py': '...',
 * //   'tools.py': '...',
 * //   'requirements.txt': '...',
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

    // Generate core Python files
    const files: Record<string, string> = {
        'main.py': generateMainPy(agents, gcpConfig, workflowType),
        'tools.py': generateToolsPy(allTools),
        'requirements.txt': generateRequirementsTxt(agents, gcpConfig),
        'README.md': generateReadme(agents, gcpConfig, workflowType),
        'Dockerfile': generateDockerfile(),
        '.gcloudignore': generateGcloudIgnore(),
    };

    // Add GCP-specific deployment files if configuration provided
    if (gcpConfig.projectId) {
        files['cloudbuild.yaml'] = generateCloudBuildYaml(gcpConfig);
        files['deploy.sh'] = generateDeploySh(gcpConfig);
    }

    return files;
};
