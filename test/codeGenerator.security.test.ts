import { describe, it, expect } from 'vitest';
import { generateCode } from '../services/codeGenerator';
import { Agent, GCPConfig } from '../types';

describe('codeGenerator - Security', () => {
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

  describe('GCP Credentials Security', () => {
    it('should NOT include gcp-credentials.json file even when credentials are provided', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '{"type":"service_account","project_id":"test","private_key":"fake"}',
        serviceAccountKeyName: 'test-key.json',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');

      // Critical: credentials should NOT be in generated files
      expect(files['gcp-credentials.json']).toBeUndefined();
      expect(Object.keys(files)).not.toContain('gcp-credentials.json');
    });

    it('should include security warnings in README when GCP config is provided', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: false,
        serviceAccountKeyJson: '{"type":"service_account"}',
        serviceAccountKeyName: 'test-key.json',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      const readme = files['README.md'];

      expect(readme).toBeDefined();
      expect(readme).toContain('SECURITY WARNING');
      expect(readme).toContain('NEVER commit service account keys');
      expect(readme).toContain('GOOGLE_APPLICATION_CREDENTIALS');
      expect(readme).toContain('/path/to/your/service-account-key.json');
    });

    it('should include deployment files when GCP project ID is provided', () => {
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
      expect(files['README.md']).toContain('Deploy to GCP Agent Engine');
    });

    it('should NOT include credentials in any generated file content', () => {
      const fakeCredentials = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'fake-key-id',
        private_key: '-----BEGIN PRIVATE KEY-----\nFAKE_PRIVATE_KEY\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test-project.iam.gserviceaccount.com',
      });

      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: true,
        serviceAccountKeyJson: fakeCredentials,
        serviceAccountKeyName: 'fake-credentials.json',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');

      // Check that private key is NOT in any generated file
      Object.entries(files).forEach(([filename, content]) => {
        expect(content).not.toContain('FAKE_PRIVATE_KEY');
        expect(content).not.toContain(fakeCredentials);
      });
    });

    it('should include .gcloudignore with gcp-credentials.json excluded', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');

      expect(files['.gcloudignore']).toBeDefined();
      expect(files['.gcloudignore']).toContain('gcp-credentials.json');
    });
  });

  describe('Generated File Structure', () => {
    it('should always include core files', () => {
      const files = generateCode([mockAgent], {} as GCPConfig, 'Sequential');

      expect(files['main.py']).toBeDefined();
      expect(files['tools.py']).toBeDefined();
      expect(files['requirements.txt']).toBeDefined();
      expect(files['README.md']).toBeDefined();
      expect(files['Dockerfile']).toBeDefined();
      expect(files['.gcloudignore']).toBeDefined();
    });

    it('should not include any credential files', () => {
      const gcpConfig: GCPConfig = {
        projectId: 'test-project',
        serviceName: 'test-service',
        region: 'us-central1',
        useMemoryBank: true,
        serviceAccountKeyJson: '{"type":"service_account","project_id":"test"}',
        serviceAccountKeyName: 'credentials.json',
      };

      const files = generateCode([mockAgent], gcpConfig, 'Sequential');
      const filenames = Object.keys(files);

      // Should not have any credential-related files
      const credentialFilePatterns = [
        'gcp-credentials.json',
        'service-account',
        'credentials.json',
        '.json', // Any other JSON files besides package.json if it existed
      ];

      filenames.forEach(filename => {
        if (filename.includes('credentials') || filename.includes('service-account')) {
          throw new Error(`Found credential file in generated files: ${filename}`);
        }
      });
    });
  });
});
