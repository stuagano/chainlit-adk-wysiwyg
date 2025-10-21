export interface Parameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

export type WorkflowType = 'Sequential' | 'Hierarchical' | 'Collaborative';

export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  input_placeholder: string;
  tools: Tool[];
  parentId: string | null;
  llmModel: string;
  temperature: number;
}

export interface GCPConfig {
    projectId: string;
    serviceName: string;
    region: string;
    serviceAccountKeyJson: string;
    serviceAccountKeyName: string;
    useMemoryBank: boolean;
}

export interface ParameterValidationError {
  name?: string;
  description?: string;
}

export interface ToolValidationError {
  name?: string;
  parameters: Record<string, ParameterValidationError>;
}

export interface ValidationErrors {
  tools: Record<string, ToolValidationError>;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  path?: string;
}

export interface PreflightValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
}
