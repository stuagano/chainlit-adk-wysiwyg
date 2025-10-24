/**
 * Validation Schemas
 *
 * Comprehensive Zod schemas for runtime validation of all data structures
 */

import { z } from 'zod';

// ============================================================================
// LLM Configuration Schemas
// ============================================================================

export const ALLOWED_LLM_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'gpt-4o',
  'gpt-4o-mini',
] as const;

export const llmModelSchema = z.enum(ALLOWED_LLM_MODELS);

export const temperatureSchema = z
  .number()
  .min(0, 'Temperature must be at least 0')
  .max(2, 'Temperature must be at most 2');

// ============================================================================
// Parameter and Tool Schemas
// ============================================================================

export const parameterTypeSchema = z.enum(['string', 'number', 'boolean']);

export const parameterSchema = z.object({
  id: z.string().min(1, 'Parameter ID is required'),
  name: z
    .string()
    .min(1, 'Parameter name is required')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Parameter name must be valid identifier'),
  type: parameterTypeSchema,
  description: z.string().min(1, 'Parameter description is required'),
  required: z.boolean(),
});

export const toolSchema = z.object({
  id: z.string().min(1, 'Tool ID is required'),
  name: z
    .string()
    .min(1, 'Tool name is required')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Tool name must be valid identifier'),
  description: z
    .string()
    .min(10, 'Tool description must be at least 10 characters')
    .max(1000, 'Tool description must be less than 1000 characters'),
  parameters: z.array(parameterSchema),
});

// ============================================================================
// Agent Schema
// ============================================================================

export const workflowTypeSchema = z.enum(['Sequential', 'Hierarchical', 'Collaborative']);

export const agentSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(50, 'Agent name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Agent name contains invalid characters'),
  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(5000, 'System prompt must be less than 5000 characters'),
  welcome_message: z
    .string()
    .min(1, 'Welcome message is required')
    .max(500, 'Welcome message must be less than 500 characters'),
  input_placeholder: z
    .string()
    .min(1, 'Input placeholder is required')
    .max(100, 'Input placeholder must be less than 100 characters'),
  tools: z.array(toolSchema),
  parentId: z.string().nullable(),
  llmModel: llmModelSchema,
  temperature: temperatureSchema,
});

// ============================================================================
// GCP Configuration Schema
// ============================================================================

export const gcpServiceAccountSchema = z.object({
  type: z.literal('service_account'),
  project_id: z.string().min(1, 'Project ID is required'),
  private_key_id: z.string().min(1, 'Private key ID is required'),
  private_key: z
    .string()
    .regex(/^-----BEGIN PRIVATE KEY-----/, 'Private key must be in valid PEM format')
    .regex(/-----END PRIVATE KEY-----\s*$/, 'Private key must end with proper PEM footer'),
  client_email: z
    .string()
    .email('Client email must be a valid email')
    .regex(/@.*\.iam\.gserviceaccount\.com$/, 'Must be a valid service account email'),
  client_id: z.string().min(1, 'Client ID is required'),
  auth_uri: z.string().url('Auth URI must be a valid URL'),
  token_uri: z.string().url('Token URI must be a valid URL'),
  auth_provider_x509_cert_url: z.string().url('Auth provider cert URL must be valid'),
  client_x509_cert_url: z.string().url('Client cert URL must be valid'),
  universe_domain: z.string().optional(),
});

export const gcpConfigSchema = z.object({
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .regex(/^[a-z0-9-]+$/, 'Project ID must contain only lowercase letters, numbers, and hyphens'),
  serviceName: z
    .string()
    .min(1, 'Service name is required')
    .regex(/^[a-z0-9-]+$/, 'Service name must contain only lowercase letters, numbers, and hyphens'),
  region: z
    .string()
    .min(1, 'Region is required')
    .regex(/^[a-z]+-[a-z]+[0-9]+$/, 'Region must be a valid GCP region (e.g., us-central1)'),
  serviceAccountKeyJson: z.string().min(1, 'Service account key JSON is required'),
  serviceAccountKeyName: z.string().min(1, 'Service account key name is required'),
  useMemoryBank: z.boolean(),
});

export const partialGcpConfigSchema = gcpConfigSchema.partial();

// ============================================================================
// App State Schema
// ============================================================================

export const appStateSchema = z.object({
  agents: z.array(agentSchema).min(1, 'At least one agent is required'),
  gcpConfig: partialGcpConfigSchema,
  workflowType: workflowTypeSchema,
  selectedAgentId: z.string().nullable(),
  version: z.string(),
  timestamp: z.string().datetime(),
});

export const partialAppStateSchema = appStateSchema.partial();

// ============================================================================
// API Response Schemas
// ============================================================================

export const syncChainlitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  files: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export const launchChainlitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string().url().optional(),
  error: z.string().optional(),
});

export const validationIssueSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  path: z.string().optional(),
});

export const preflightValidationResultSchema = z.object({
  errors: z.array(validationIssueSchema),
  warnings: z.array(validationIssueSchema),
  hasErrors: z.boolean(),
  hasWarnings: z.boolean(),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type Parameter = z.infer<typeof parameterSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type WorkflowType = z.infer<typeof workflowTypeSchema>;
export type GCPConfig = z.infer<typeof gcpConfigSchema>;
export type GCPServiceAccount = z.infer<typeof gcpServiceAccountSchema>;
export type AppState = z.infer<typeof appStateSchema>;
export type SyncChainlitResponse = z.infer<typeof syncChainlitResponseSchema>;
export type LaunchChainlitResponse = z.infer<typeof launchChainlitResponseSchema>;

// ============================================================================
// Safe Parse Helpers
// ============================================================================

export interface ValidationResult<T> {
  success: true;
  data: T;
  error?: never;
}

export interface ValidationError {
  success: false;
  data?: never;
  error: {
    message: string;
    issues: Array<{
      path: string;
      message: string;
    }>;
  };
}

export type SafeParseResult<T> = ValidationResult<T> | ValidationError;

/**
 * Safely parse and validate data against a Zod schema
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): SafeParseResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  const contextMsg = context ? `${context}: ` : '';
  const message = `${contextMsg}Validation failed: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`;

  return {
    success: false,
    error: {
      message,
      issues,
    },
  };
}

/**
 * Safely parse JSON and validate against a schema
 */
export function safeParseJson<T>(
  schema: z.ZodSchema<T>,
  jsonString: string,
  context?: string
): SafeParseResult<T> {
  try {
    const parsed = JSON.parse(jsonString);
    return safeValidate(schema, parsed, context);
  } catch (error) {
    const contextMsg = context ? `${context}: ` : '';
    return {
      success: false,
      error: {
        message: `${contextMsg}Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [{ path: '', message: 'Failed to parse JSON' }],
      },
    };
  }
}
