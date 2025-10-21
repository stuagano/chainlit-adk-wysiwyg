import { describe, it, expect } from 'vitest';
import { generateCode } from '../services/codeGenerator';
import { Agent, GCPConfig, Tool } from '../types';

describe('codeGenerator - Core Functionality', () => {
  const mockAgent: Agent = {
    id: '1',
    name: 'TestAgent',
    system_prompt: 'You are a test agent',
    llmModel: 'gemini-1.5-flash',
    temperature: 0.7,
    tools: [],
    welcome_message: 'Hello',
    input_placeholder: 'Type here',
    parentId: null,
  };

  describe('generateCode - Basic File Generation', () => {
    it('should generate all core files without GCP config', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toBeDefined();
      expect(files['tools.py']).toBeDefined();
      expect(files['requirements.txt']).toBeDefined();
      expect(files['README.md']).toBeDefined();
      expect(files['Dockerfile']).toBeDefined();
      expect(files['.gcloudignore']).toBeDefined();

      // Should not include deployment files without GCP config
      expect(files['cloudbuild.yaml']).toBeUndefined();
      expect(files['deploy.sh']).toBeUndefined();
    });

    it('should generate deployment files when GCP project ID is provided', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');

      expect(files['cloudbuild.yaml']).toBeDefined();
      expect(files['deploy.sh']).toBeDefined();
      expect(files['cloudbuild.yaml']).toContain('test-project');
      expect(files['deploy.sh']).toContain('test-project');
    });

    it('should generate correct file count without GCP', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(Object.keys(files).length).toBe(6);
    });

    it('should generate correct file count with GCP', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(Object.keys(files).length).toBe(8);
    });
  });

  describe('generateCode - Agent Configuration', () => {
    it('should include agent name in main.py', () => {
      const agent = { ...mockAgent, name: 'CustomAgent' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('CustomAgent');
    });

    it('should include system prompt in main.py', () => {
      const agent = { ...mockAgent, system_prompt: 'Custom system prompt' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('Custom system prompt');
    });

    it('should include LLM model in main.py', () => {
      const agent = { ...mockAgent, llmModel: 'gemini-1.5-pro' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('gemini-1.5-pro');
    });

    it('should include temperature in main.py', () => {
      const agent = { ...mockAgent, temperature: 0.9 };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('0.9');
    });

    it('should include welcome message in main.py', () => {
      const agent = { ...mockAgent, welcome_message: 'Welcome to the test' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('Welcome to the test');
    });

    it('should handle multiple agents', () => {
      const agent1 = { ...mockAgent, id: '1', name: 'Agent1' };
      const agent2 = { ...mockAgent, id: '2', name: 'Agent2' };
      const files = generateCode([agent1, agent2], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toContain('Agent1');
      expect(files['main.py']).toContain('Agent2');
    });
  });

  describe('generateCode - Tool Configuration', () => {
    it('should generate tools.py with no tools message when no tools defined', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');

      expect(files['tools.py']).toContain('No tools defined');
    });

    it('should generate tool class and function for a single tool', () => {
      const tool: Tool = {
        id: '1',
        name: 'get_data',
        description: 'Gets data',
        parameters: [
          {
            id: 'p1',
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: true,
          },
        ],
      };

      const agent = { ...mockAgent, tools: [tool] };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['tools.py']).toContain('get_data');
      expect(files['tools.py']).toContain('GetDataInput');
      expect(files['tools.py']).toContain('query');
      expect(files['tools.py']).toContain('Search query');
    });

    it('should handle optional parameters correctly', () => {
      const tool: Tool = {
        id: '1',
        name: 'test_tool',
        description: 'Test tool',
        parameters: [
          {
            id: 'p1',
            name: 'required_param',
            type: 'string',
            description: 'Required',
            required: true,
          },
          {
            id: 'p2',
            name: 'optional_param',
            type: 'string',
            description: 'Optional',
            required: false,
          },
        ],
      };

      const agent = { ...mockAgent, tools: [tool] };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['tools.py']).toContain('required_param: str');
      expect(files['tools.py']).toContain('optional_param: typing.Optional[str]');
    });

    it('should convert parameter types to Python types', () => {
      const tool: Tool = {
        id: '1',
        name: 'test_tool',
        description: 'Test tool',
        parameters: [
          {
            id: 'p1',
            name: 'text',
            type: 'string',
            description: 'Text param',
            required: true,
          },
          {
            id: 'p2',
            name: 'count',
            type: 'number',
            description: 'Number param',
            required: true,
          },
          {
            id: 'p3',
            name: 'enabled',
            type: 'boolean',
            description: 'Boolean param',
            required: true,
          },
        ],
      };

      const agent = { ...mockAgent, tools: [tool] };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      expect(files['tools.py']).toContain('text: str');
      expect(files['tools.py']).toContain('count: float');
      expect(files['tools.py']).toContain('enabled: bool');
    });

    it('should deduplicate tools with the same name', () => {
      const tool: Tool = {
        id: '1',
        name: 'shared_tool',
        description: 'Shared tool',
        parameters: [],
      };

      const agent1 = { ...mockAgent, id: '1', tools: [tool] };
      const agent2 = { ...mockAgent, id: '2', tools: [{ ...tool, id: '2' }] };
      const files = generateCode([agent1, agent2], {} as GCPConfig, 'Sequential');

      // Count occurrences of "def shared_tool" - should appear only once
      const matches = files['tools.py'].match(/def shared_tool/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('generateCode - Workflow Types', () => {
    it('should handle Sequential workflow type', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['main.py']).toBeDefined();
      // Sequential is default, should not have special workflow code
    });

    it('should handle Hierarchical workflow type', () => {
      const agent1 = { ...mockAgent, id: '1', name: 'Supervisor' };
      const agent2 = { ...mockAgent, id: '2', name: 'Worker', parentId: '1' };
      const files = generateCode([agent1, agent2], {} as GCPConfig, 'Hierarchical');

      expect(files['main.py']).toContain('Supervisor');
      expect(files['main.py']).toContain('Worker');
    });

    it('should handle Collaborative workflow type', () => {
      const agent1 = { ...mockAgent, id: '1', name: 'Agent1' };
      const agent2 = { ...mockAgent, id: '2', name: 'Agent2' };
      const files = generateCode([agent1, agent2], {} as GCPConfig, 'Collaborative');

      expect(files['main.py']).toContain('Agent1');
      expect(files['main.py']).toContain('Agent2');
    });
  });

  describe('generateCode - Requirements.txt Generation', () => {
    it('should always include chainlit and requests', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('chainlit');
      expect(files['requirements.txt']).toContain('requests');
    });

    it('should include openai for GPT models', () => {
      const agent = { ...mockAgent, llmModel: 'gpt-4' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('openai');
    });

    it('should include google-cloud-aiplatform for Gemini models', () => {
      const agent = { ...mockAgent, llmModel: 'gemini-1.5-pro' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('google-cloud-aiplatform');
    });

    it('should include both openai and google-cloud-aiplatform for mixed models', () => {
      const agent1 = { ...mockAgent, id: '1', llmModel: 'gpt-4' };
      const agent2 = { ...mockAgent, id: '2', llmModel: 'gemini-1.5-flash' };
      const files = generateCode([agent1, agent2], {} as GCPConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('openai');
      expect(files['requirements.txt']).toContain('google-cloud-aiplatform');
    });
  });

  describe('generateCode - GCP Configuration', () => {
    it('should include google-cloud-aiplatform when Memory Bank is enabled', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: true,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('google-cloud-aiplatform');
    });

    it('should include google-cloud-aiplatform for Gemini models', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      // mockAgent has gemini-1.5-flash as llmModel
      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(files['requirements.txt']).toContain('google-cloud-aiplatform');
    });

    it('should include GCP region in cloudbuild.yaml', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'europe-west1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(files['cloudbuild.yaml']).toContain('europe-west1');
    });

    it('should include service name in cloudbuild.yaml', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'my-custom-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(files['cloudbuild.yaml']).toContain('my-custom-service');
    });
  });

  describe('generateCode - Special Characters and Edge Cases', () => {
    it('should handle agent names with special characters', () => {
      const agent = { ...mockAgent, name: 'Test Agent #1!' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      // Should sanitize to valid Python identifier
      expect(files['main.py']).toBeDefined();
    });

    it('should handle empty agent list', () => {
      const files = generateCode([], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toBeDefined();
      expect(files['tools.py']).toBeDefined();
    });

    it('should handle descriptions with quotes and backslashes', () => {
      const tool: Tool = {
        id: '1',
        name: 'test_tool',
        description: 'Tool with "quotes" and \\backslashes\\',
        parameters: [
          {
            id: 'p1',
            name: 'param',
            type: 'string',
            description: 'Param with "quotes" and \\backslashes\\',
            required: true,
          },
        ],
      };

      const agent = { ...mockAgent, tools: [tool] };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      // Should escape properly for Python strings
      expect(files['tools.py']).toBeDefined();
      expect(files['tools.py']).not.toContain('\\\\\\\\'); // Should not double-escape
    });

    it('should handle agent name starting with number', () => {
      const agent = { ...mockAgent, name: '123Agent' };
      const files = generateCode([agent], {} as GCPConfig, 'Sequential');

      // Should prepend underscore to make valid Python identifier
      expect(files['main.py']).toBeDefined();
    });
  });

  describe('generateCode - README Generation', () => {
    it('should include setup instructions in README', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');

      expect(files['README.md']).toContain('Setup');
      expect(files['README.md']).toContain('Install');
    });

    it('should include deployment instructions when GCP is configured', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '',
        serviceAccountKeyName: '',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      expect(files['README.md']).toContain('Deploy');
      expect(files['README.md']).toContain('GCP');
    });

    it('should include workflow type in README', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Hierarchical');
      expect(files['README.md']).toContain('Hierarchical');
    });
  });

  describe('generateCode - Dockerfile Generation', () => {
    it('should include Python base image', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['Dockerfile']).toContain('python');
    });

    it('should include COPY and RUN commands', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['Dockerfile']).toContain('COPY');
      expect(files['Dockerfile']).toContain('RUN');
    });

    it('should include CMD to start the application', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['Dockerfile']).toContain('CMD');
    });
  });

  describe('generateCode - .gcloudignore Generation', () => {
    it('should exclude venv directory', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['.gcloudignore']).toContain('venv');
    });

    it('should exclude __pycache__ directory', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['.gcloudignore']).toContain('__pycache__');
    });

    it('should exclude gcp-credentials.json', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['.gcloudignore']).toContain('gcp-credentials.json');
    });

    it('should exclude .env file', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');
      expect(files['.gcloudignore']).toContain('.env');
    });
  });
});
