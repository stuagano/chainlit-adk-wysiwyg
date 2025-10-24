/**
 * Schema Validation Tests
 *
 * Tests for Zod schemas and validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  agentSchema,
  toolSchema,
  parameterSchema,
  gcpServiceAccountSchema,
  gcpConfigSchema,
  appStateSchema,
  llmModelSchema,
  temperatureSchema,
  safeValidate,
  safeParseJson,
} from '../utils/schemas';

describe('Schema Validation', () => {
  describe('Parameter Schema', () => {
    it('should validate valid parameter', () => {
      const validParam = {
        id: '123',
        name: 'test_param',
        type: 'string',
        description: 'A test parameter',
        required: true,
      };

      const result = parameterSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it('should reject parameter with invalid name', () => {
      const invalidParam = {
        id: '123',
        name: '123invalid', // Cannot start with number
        type: 'string',
        description: 'A test parameter',
        required: true,
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it('should reject parameter with empty description', () => {
      const invalidParam = {
        id: '123',
        name: 'test_param',
        type: 'string',
        description: '',
        required: true,
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe('Tool Schema', () => {
    it('should validate valid tool', () => {
      const validTool = {
        id: '123',
        name: 'test_tool',
        description: 'A test tool with sufficient description',
        parameters: [
          {
            id: 'p1',
            name: 'param1',
            type: 'string',
            description: 'First parameter',
            required: true,
          },
        ],
      };

      const result = toolSchema.safeParse(validTool);
      expect(result.success).toBe(true);
    });

    it('should reject tool with short description', () => {
      const invalidTool = {
        id: '123',
        name: 'test_tool',
        description: 'Short', // Less than 10 characters
        parameters: [],
      };

      const result = toolSchema.safeParse(invalidTool);
      expect(result.success).toBe(false);
    });

    it('should reject tool with description over 1000 characters', () => {
      const invalidTool = {
        id: '123',
        name: 'test_tool',
        description: 'a'.repeat(1001),
        parameters: [],
      };

      const result = toolSchema.safeParse(invalidTool);
      expect(result.success).toBe(false);
    });
  });

  describe('LLM Model Schema', () => {
    it('should validate allowed models', () => {
      const validModels = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'claude-3-5-sonnet-20241022',
        'gpt-4o',
      ];

      validModels.forEach((model) => {
        const result = llmModelSchema.safeParse(model);
        expect(result.success).toBe(true);
      });
    });

    it('should reject unknown models', () => {
      const result = llmModelSchema.safeParse('gpt-5-turbo');
      expect(result.success).toBe(false);
    });
  });

  describe('Temperature Schema', () => {
    it('should validate temperatures in valid range', () => {
      const validTemps = [0, 0.5, 1, 1.5, 2];

      validTemps.forEach((temp) => {
        const result = temperatureSchema.safeParse(temp);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative temperatures', () => {
      const result = temperatureSchema.safeParse(-0.1);
      expect(result.success).toBe(false);
    });

    it('should reject temperatures above 2', () => {
      const result = temperatureSchema.safeParse(2.1);
      expect(result.success).toBe(false);
    });
  });

  describe('Agent Schema', () => {
    it('should validate valid agent', () => {
      const validAgent = {
        id: 'agent1',
        name: 'Test Agent',
        system_prompt: 'You are a helpful assistant that helps with testing',
        welcome_message: 'Hello! How can I help you?',
        input_placeholder: 'Type your message here...',
        tools: [],
        parentId: null,
        llmModel: 'gpt-4o',
        temperature: 0.7,
      };

      const result = agentSchema.safeParse(validAgent);
      expect(result.success).toBe(true);
    });

    it('should reject agent with short system prompt', () => {
      const invalidAgent = {
        id: 'agent1',
        name: 'Test Agent',
        system_prompt: 'Short', // Less than 10 characters
        welcome_message: 'Hello!',
        input_placeholder: 'Type...',
        tools: [],
        parentId: null,
        llmModel: 'gpt-4o',
        temperature: 0.7,
      };

      const result = agentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with invalid name characters', () => {
      const invalidAgent = {
        id: 'agent1',
        name: 'Test@Agent!', // Invalid characters
        system_prompt: 'You are a helpful assistant',
        welcome_message: 'Hello!',
        input_placeholder: 'Type...',
        tools: [],
        parentId: null,
        llmModel: 'gpt-4o',
        temperature: 0.7,
      };

      const result = agentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });
  });

  describe('GCP Service Account Schema', () => {
    it('should validate valid service account', () => {
      const validSA = {
        type: 'service_account',
        project_id: 'my-project',
        private_key_id: 'key123',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n',
        client_email: 'test@my-project.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40my-project.iam.gserviceaccount.com',
      };

      const result = gcpServiceAccountSchema.safeParse(validSA);
      expect(result.success).toBe(true);
    });

    it('should reject non-service account type', () => {
      const invalid = {
        type: 'user_account',
        project_id: 'my-project',
        private_key_id: 'key123',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n',
        client_email: 'test@my-project.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40my-project.iam.gserviceaccount.com',
      };

      const result = gcpServiceAccountSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid private key format', () => {
      const invalid = {
        type: 'service_account',
        project_id: 'my-project',
        private_key_id: 'key123',
        private_key: 'not-a-valid-private-key',
        client_email: 'test@my-project.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40my-project.iam.gserviceaccount.com',
      };

      const result = gcpServiceAccountSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid service account email', () => {
      const invalid = {
        type: 'service_account',
        project_id: 'my-project',
        private_key_id: 'key123',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n',
        client_email: 'test@gmail.com', // Not a service account email
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40gmail.com',
      };

      const result = gcpServiceAccountSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('GCP Config Schema', () => {
    it('should validate valid GCP config', () => {
      const validConfig = {
        projectId: 'my-project-123',
        serviceName: 'my-service',
        region: 'us-central1',
        serviceAccountKeyJson: '{"type":"service_account"}',
        serviceAccountKeyName: 'key.json',
        useMemoryBank: true,
      };

      const result = gcpConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid project ID', () => {
      const invalid = {
        projectId: 'MY_PROJECT', // Uppercase not allowed
        serviceName: 'my-service',
        region: 'us-central1',
        serviceAccountKeyJson: '{"type":"service_account"}',
        serviceAccountKeyName: 'key.json',
        useMemoryBank: true,
      };

      const result = gcpConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid region format', () => {
      const invalid = {
        projectId: 'my-project',
        serviceName: 'my-service',
        region: 'invalid-region',
        serviceAccountKeyJson: '{"type":"service_account"}',
        serviceAccountKeyName: 'key.json',
        useMemoryBank: true,
      };

      const result = gcpConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Safe Validation Helpers', () => {
    it('should safely validate valid data', () => {
      const result = safeValidate(llmModelSchema, 'gpt-4o');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('gpt-4o');
      }
    });

    it('should safely handle invalid data', () => {
      const result = safeValidate(llmModelSchema, 'invalid-model');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Validation failed');
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should include context in error message', () => {
      const result = safeValidate(llmModelSchema, 'invalid', 'LLM Model');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('LLM Model');
      }
    });
  });

  describe('Safe JSON Parsing', () => {
    it('should parse and validate valid JSON', () => {
      const json = JSON.stringify({ id: '1', name: 'test_param', type: 'string', description: 'Test', required: true });
      const result = safeParseJson(parameterSchema, json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test_param');
      }
    });

    it('should handle invalid JSON', () => {
      const result = safeParseJson(parameterSchema, 'not valid json');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid JSON');
      }
    });

    it('should handle JSON with invalid schema', () => {
      const json = JSON.stringify({ id: '1', name: '', type: 'string', description: '', required: true });
      const result = safeParseJson(parameterSchema, json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('App State Schema', () => {
    it('should validate complete app state', () => {
      const validState = {
        agents: [{
          id: 'agent1',
          name: 'Test Agent',
          system_prompt: 'You are a helpful assistant',
          welcome_message: 'Hello!',
          input_placeholder: 'Type...',
          tools: [],
          parentId: null,
          llmModel: 'gpt-4o',
          temperature: 0.7,
        }],
        gcpConfig: {
          projectId: 'my-project',
          serviceName: 'my-service',
          region: 'us-central1',
          serviceAccountKeyJson: '{}',
          serviceAccountKeyName: 'key.json',
          useMemoryBank: false,
        },
        workflowType: 'Sequential',
        selectedAgentId: 'agent1',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };

      const result = appStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it('should require at least one agent', () => {
      const invalid = {
        agents: [],
        gcpConfig: {},
        workflowType: 'Sequential',
        selectedAgentId: null,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };

      const result = appStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
