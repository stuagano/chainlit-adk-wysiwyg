/**
 * Integration Tests
 *
 * Tests the complete workflow from configuration to code generation
 * Ensures all components work together correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCode } from '../services/codeGenerator';
import { runPreflightValidation } from '../services/preflight';
import { Agent, GCPConfig, Tool } from '../types';

describe('Integration Tests - Full Workflow', () => {
  let testAgents: Agent[];
  let testGCPConfig: GCPConfig;
  let testTool: Tool;

  beforeEach(() => {
    // Set up a realistic test scenario
    testTool = {
      id: 'tool-1',
      name: 'search_database',
      description: 'Searches the customer database for information',
      parameters: [
        {
          id: 'param-1',
          name: 'query',
          type: 'string',
          description: 'The search query',
          required: true,
        },
        {
          id: 'param-2',
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          required: false,
        },
      ],
    };

    testAgents = [
      {
        id: 'agent-1',
        name: 'Customer Service Agent',
        system_prompt: 'You are a helpful customer service agent.',
        welcome_message: 'Hello! How can I assist you today?',
        input_placeholder: 'Ask me anything...',
        tools: [testTool],
        llmModel: 'gemini-1.5-flash',
        temperature: 0.7,
        parentId: null,
      },
    ];

    testGCPConfig = {
      projectId: 'my-project-123',
      serviceName: 'customer-service',
      region: 'us-central1',
      serviceAccountKeyJson: '',
      serviceAccountKeyName: '',
      useMemoryBank: false,
    };
  });

  describe('Sequential Workflow Integration', () => {
    it('completes full generation workflow successfully', () => {
      // Step 1: Validate configuration
      const preflightResult = runPreflightValidation({ agents: testAgents });
      expect(preflightResult.hasErrors).toBe(false);
      expect(preflightResult.errors).toHaveLength(0);

      // Step 2: Generate code
      const generatedFiles = generateCode(testAgents, testGCPConfig, 'Sequential');

      // Step 3: Verify all expected files are generated
      expect(generatedFiles['main.py']).toBeDefined();
      expect(generatedFiles['tools.py']).toBeDefined();
      expect(generatedFiles['requirements.txt']).toBeDefined();
      expect(generatedFiles['README.md']).toBeDefined();
      expect(generatedFiles['Dockerfile']).toBeDefined();
      expect(generatedFiles['.gcloudignore']).toBeDefined();
      expect(generatedFiles['cloudbuild.yaml']).toBeDefined();
      expect(generatedFiles['deploy.sh']).toBeDefined();

      // Step 4: Verify main.py structure
      const mainPy = generatedFiles['main.py']!;
      expect(mainPy).toContain('import chainlit as cl');
      expect(mainPy).toContain('Sequential');
      expect(mainPy).toContain('Customer Service Agent');
      expect(mainPy).toContain('create_agent_1');
      expect(mainPy).toContain('@cl.on_chat_start');
      expect(mainPy).toContain('@cl.on_message');

      // Step 5: Verify tools.py structure
      const toolsPy = generatedFiles['tools.py']!;
      expect(toolsPy).toContain('search_database');
      expect(toolsPy).toContain('SearchDatabaseInput');
      expect(toolsPy).toContain('query');
      expect(toolsPy).toContain('limit');

      // Step 6: Verify requirements.txt
      const requirementsTxt = generatedFiles['requirements.txt']!;
      expect(requirementsTxt).toContain('chainlit');
      expect(requirementsTxt).toContain('requests');
      expect(requirementsTxt).toContain('google-cloud-aiplatform');

      // Step 7: Verify Docker configuration
      const dockerfile = generatedFiles['Dockerfile']!;
      expect(dockerfile).toContain('FROM python:3.11-slim');
      expect(dockerfile).toContain('COPY requirements.txt');
      expect(dockerfile).toContain('CMD ["chainlit"');

      // Step 8: Verify GCP deployment files
      const cloudbuildYaml = generatedFiles['cloudbuild.yaml']!;
      expect(cloudbuildYaml).toContain('my-project-123');
      expect(cloudbuildYaml).toContain('customer-service');

      const deploySh = generatedFiles['deploy.sh']!;
      expect(deploySh).toContain('#!/bin/bash');
      expect(deploySh).toContain('gcloud builds submit');
    });

    it('handles multi-agent workflow with shared tools', () => {
      const sharedTool = { ...testTool };

      const agents: Agent[] = [
        {
          ...testAgents[0]!,
          id: 'agent-1',
          name: 'Research Agent',
          tools: [sharedTool],
        },
        {
          ...testAgents[0]!,
          id: 'agent-2',
          name: 'Analysis Agent',
          tools: [sharedTool],
        },
        {
          ...testAgents[0]!,
          id: 'agent-3',
          name: 'Summary Agent',
          tools: [],
        },
      ];

      // Validate
      const preflightResult = runPreflightValidation({ agents });
      expect(preflightResult.hasErrors).toBe(false);

      // Generate
      const files = generateCode(agents, testGCPConfig, 'Sequential');

      // Verify all agents are created
      expect(files['main.py']).toContain('create_agent_1');
      expect(files['main.py']).toContain('create_agent_2');
      expect(files['main.py']).toContain('create_agent_3');

      // Verify tools are deduplicated
      const toolsPy = files['tools.py']!;
      const toolMatches = toolsPy.match(/def search_database/g);
      expect(toolMatches).toHaveLength(1); // Should only appear once
    });
  });

  describe('Hierarchical Workflow Integration', () => {
    it('generates correct supervisor-worker structure', () => {
      const supervisor: Agent = {
        ...testAgents[0]!,
        id: 'supervisor',
        name: 'Manager Agent',
      };

      const worker1: Agent = {
        ...testAgents[0]!,
        id: 'worker-1',
        name: 'Technical Support',
        parentId: 'supervisor',
      };

      const worker2: Agent = {
        ...testAgents[0]!,
        id: 'worker-2',
        name: 'Billing Support',
        parentId: 'supervisor',
      };

      const hierarchicalAgents = [supervisor, worker1, worker2];

      // Validate
      const preflightResult = runPreflightValidation({ agents: hierarchicalAgents });
      expect(preflightResult.hasErrors).toBe(false);

      // Generate
      const files = generateCode(hierarchicalAgents, testGCPConfig, 'Hierarchical');

      // Verify hierarchical structure
      const mainPy = files['main.py']!;
      expect(mainPy).toContain('Hierarchical');
      expect(mainPy).toContain('structure=');
      expect(mainPy).toContain('agent_1'); // supervisor
      expect(mainPy).toContain('agent_2'); // worker1
      expect(mainPy).toContain('agent_3'); // worker2

      // Verify README documents hierarchy
      const readme = files['README.md']!;
      expect(readme).toContain('hierarchical workflow');
      expect(readme).toContain('supervisor-subordinate');
    });
  });

  describe('Collaborative Workflow Integration', () => {
    it('generates correct peer-to-peer structure', () => {
      const agents: Agent[] = [
        { ...testAgents[0]!, id: '1', name: 'Data Analyst' },
        { ...testAgents[0]!, id: '2', name: 'Creative Strategist' },
        { ...testAgents[0]!, id: '3', name: 'Implementation Expert' },
      ];

      // Validate
      const preflightResult = runPreflightValidation({ agents });
      expect(preflightResult.hasErrors).toBe(false);

      // Generate
      const files = generateCode(agents, testGCPConfig, 'Collaborative');

      // Verify collaborative structure
      const mainPy = files['main.py']!;
      expect(mainPy).toContain('Collaborative');
      expect(mainPy).not.toContain('structure='); // No hierarchy
      expect(mainPy).toContain('agents=[');

      // Verify README documents collaboration
      const readme = files['README.md']!;
      expect(readme).toContain('collaborative workflow');
      expect(readme).toContain('team of peers');
    });
  });

  describe('LLM Model Integration', () => {
    it('handles mixed LLM models correctly', () => {
      const agents: Agent[] = [
        { ...testAgents[0]!, id: '1', name: 'Gemini Agent', llmModel: 'gemini-1.5-flash' },
        { ...testAgents[0]!, id: '2', name: 'GPT Agent', llmModel: 'gpt-4' },
      ];

      const files = generateCode(agents, testGCPConfig, 'Sequential');

      // Verify both providers imported
      const mainPy = files['main.py']!;
      expect(mainPy).toContain('from adk.llm.provider.openai import OpenAI');
      expect(mainPy).toContain('from adk.llm.provider.vertex import VertexAI');

      // Verify both used correctly
      expect(mainPy).toContain('VertexAI(model="gemini-1.5-flash"');
      expect(mainPy).toContain('OpenAI(model="gpt-4"');

      // Verify dependencies
      const requirements = files['requirements.txt']!;
      expect(requirements).toContain('openai');
      expect(requirements).toContain('google-cloud-aiplatform');
    });
  });

  describe('Memory Configuration Integration', () => {
    it('configures Memory Bank when enabled', () => {
      const gcpWithMemory = { ...testGCPConfig, useMemoryBank: true };
      const files = generateCode(testAgents, gcpWithMemory, 'Sequential');

      const mainPy = files['main.py']!;
      expect(mainPy).toContain('from adk.memory.google.memory_bank import MemoryBank');
      expect(mainPy).toContain(`MemoryBank(project_id="${testGCPConfig.projectId}"`);
      expect(mainPy).toContain(`location="${testGCPConfig.region}"`);

      const readme = files['README.md']!;
      expect(readme).toContain('Memory Bank');
      expect(readme).toContain('persistent, managed memory');
    });

    it('uses LocalMemory when Memory Bank disabled', () => {
      const files = generateCode(testAgents, testGCPConfig, 'Sequential');

      const mainPy = files['main.py']!;
      expect(mainPy).toContain('from adk.memory.memory import Memory as LocalMemory');
      expect(mainPy).toContain('LocalMemory()');

      const readme = files['README.md']!;
      expect(readme).toContain('Local Memory');
      expect(readme).toContain('in-memory storage');
    });
  });

  describe('Validation Integration', () => {
    it('detects invalid configurations before generation', () => {
      const invalidAgents: Agent[] = [
        {
          ...testAgents[0]!,
          name: '',  // Invalid: empty name
          tools: [
            {
              ...testTool,
              name: 'invalid tool name!',  // Invalid: special characters
            },
          ],
        },
      ];

      const preflightResult = runPreflightValidation({ agents: invalidAgents });

      expect(preflightResult.hasErrors).toBe(true);
      expect(preflightResult.errors.length).toBeGreaterThan(0);
    });

    it('validates tool parameters before generation', () => {
      const agentsWithInvalidTool: Agent[] = [
        {
          ...testAgents[0]!,
          tools: [
            {
              ...testTool,
              parameters: [
                {
                  id: 'param-1',
                  name: '',  // Invalid: empty parameter name
                  type: 'string',
                  description: '',  // Invalid: empty description
                  required: true,
                },
              ],
            },
          ],
        },
      ];

      const preflightResult = runPreflightValidation({ agents: agentsWithInvalidTool });

      expect(preflightResult.hasErrors).toBe(true);
      expect(preflightResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('completes entire workflow from validation to deployment files', () => {
      // Step 1: Start with user configuration
      const userConfig = {
        agents: testAgents,
        gcpConfig: testGCPConfig,
        workflowType: 'Sequential' as const,
      };

      // Step 2: Validate
      const validation = runPreflightValidation({ agents: userConfig.agents });
      expect(validation.hasErrors).toBe(false);

      if (validation.hasErrors) {
        throw new Error('Validation failed');
      }

      // Step 3: Generate all files
      const files = generateCode(
        userConfig.agents,
        userConfig.gcpConfig,
        userConfig.workflowType
      );

      // Step 4: Verify production-ready output
      expect(Object.keys(files)).toHaveLength(8); // All files generated

      // Verify Python files have valid structure
      expect(files['main.py']).toMatch(/import chainlit as cl/);
      expect(files['tools.py']).toMatch(/class \w+Input\(BaseModel\)/);

      // Verify deployment readiness
      expect(files['Dockerfile']).toContain('FROM python:');
      expect(files['requirements.txt']).toContain('chainlit');
      expect(files['README.md']).toContain('# Multi-Agent Workflow');

      // Verify GCP deployment files
      expect(files['cloudbuild.yaml']).toContain('steps:');
      expect(files['deploy.sh']).toContain('gcloud builds submit');
      expect(files['.gcloudignore']).toContain('venv/');

      // This output would be ready to:
      // - Download as ZIP
      // - Sync to chainlit_app/
      // - Deploy to GCP
    });
  });
});
