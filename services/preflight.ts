import { Agent, Tool, ValidationIssue, PreflightValidationResult } from '../types';

const PYTHON_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PYTHON_KEYWORDS = new Set([
  'False', 'await', 'else', 'import', 'pass', 'None', 'break', 'except', 'in', 'raise',
  'True', 'class', 'finally', 'is', 'return', 'and', 'continue', 'for', 'lambda', 'try',
  'as', 'def', 'from', 'nonlocal', 'while', 'assert', 'del', 'global', 'not', 'with',
  'async', 'elif', 'if', 'or', 'yield',
]);

const ALLOWED_LLM_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gpt-4o',
]);

interface PreflightInput {
  agents: Agent[];
}

function isPythonIdentifier(value: string) {
  return PYTHON_IDENTIFIER.test(value) && !PYTHON_KEYWORDS.has(value);
}

function toSnakeCase(str: string) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1');
}

function validateTool(tool: Tool, agentIndex: number, seen: Set<string>) {
  const issues: ValidationIssue[] = [];
  const pathRoot = `agents[${agentIndex}].tools[${tool.id}]`;

  const trimmedName = tool.name.trim();

  if (!trimmedName) {
    issues.push({
      severity: 'error',
      message: 'Tool name is required.',
      path: `${pathRoot}.name`,
    });
    return issues;
  }

  const normalized = toSnakeCase(trimmedName);
  const normalizedIsValid = isPythonIdentifier(normalized);

  if (!isPythonIdentifier(trimmedName)) {
    if (normalizedIsValid) {
      issues.push({
        severity: 'warning',
        message: `Tool name "${tool.name}" will be sanitized to "${normalized}" in the generated code.`,
        path: `${pathRoot}.name`,
      });
    } else {
      issues.push({
        severity: 'error',
        message: `Tool name "${tool.name}" must be a valid Python identifier (letters, numbers, underscore; cannot start with a number or be a Python keyword).`,
        path: `${pathRoot}.name`,
      });
    }
  }

  if (seen.has(normalized)) {
    issues.push({
      severity: 'error',
      message: `Duplicate tool name "${tool.name}" found. Tool names must be unique per agent.`,
      path: `${pathRoot}.name`,
    });
  } else {
    seen.add(normalized);
  }

  tool.parameters.forEach((parameter, parameterIndex) => {
    const paramPath = `${pathRoot}.parameters[${parameterIndex}]`;
    const paramName = parameter.name.trim();

    if (!paramName) {
      issues.push({
        severity: 'error',
        message: 'Parameter name is required.',
        path: `${paramPath}.name`,
      });
      return;
    }

    const sanitizedParam = toSnakeCase(paramName);
    const sanitizedIsValid = isPythonIdentifier(sanitizedParam);

    if (!isPythonIdentifier(paramName)) {
      if (sanitizedIsValid) {
        issues.push({
          severity: 'warning',
          message: `Parameter name "${parameter.name}" will be sanitized to "${sanitizedParam}" in the generated code.`,
          path: `${paramPath}.name`,
        });
      } else {
        issues.push({
          severity: 'error',
          message: `Parameter name "${parameter.name}" must be a valid Python identifier.`,
          path: `${paramPath}.name`,
        });
      }
    }
  });

  return issues;
}

export function runPreflightValidation({ agents }: PreflightInput): PreflightValidationResult {
  const issues: ValidationIssue[] = [];

  if (agents.length === 0) {
    issues.push({ severity: 'error', message: 'At least one agent is required.', path: 'agents' });
  }

  const seenAgentNames = new Set<string>();

  agents.forEach((agent, index) => {
    const agentPath = `agents[${index}]`;
    const trimmedName = agent.name.trim();

    if (!trimmedName) {
      issues.push({
        severity: 'error',
        message: 'Agent name is required.',
        path: `${agentPath}.name`,
      });
    } else {
      const normalized = trimmedName.toLowerCase();
      if (seenAgentNames.has(normalized)) {
        issues.push({
          severity: 'error',
          message: `Duplicate agent name "${agent.name}" found. Agent names must be unique.`,
          path: `${agentPath}.name`,
        });
      } else {
        seenAgentNames.add(normalized);
      }
    }

    if (!ALLOWED_LLM_MODELS.has(agent.llmModel)) {
      issues.push({
        severity: 'error',
        message: `Unsupported LLM model "${agent.llmModel}". Allowed values: ${Array.from(ALLOWED_LLM_MODELS).join(', ')}.`,
        path: `${agentPath}.llmModel`,
      });
    }

    const seenTools = new Set<string>();
    agent.tools.forEach((tool) => {
      issues.push(...validateTool(tool, index, seenTools));
    });
  });

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return {
    errors,
    warnings,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
  };
}
