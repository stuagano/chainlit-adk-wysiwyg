/**
 * Preflight Validation Service
 *
 * Validates agent configurations before code generation to ensure:
 * - Valid Python identifiers for names
 * - No duplicate agent/tool names
 * - Supported LLM models
 * - Required fields are present
 */

import { Agent, Tool, ValidationIssue, PreflightValidationResult } from '../types';

/** Regular expression for valid Python identifiers */
const PYTHON_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Python language keywords that cannot be used as identifiers */
const PYTHON_KEYWORDS = new Set([
  'False', 'await', 'else', 'import', 'pass', 'None', 'break', 'except', 'in', 'raise',
  'True', 'class', 'finally', 'is', 'return', 'and', 'continue', 'for', 'lambda', 'try',
  'as', 'def', 'from', 'nonlocal', 'while', 'assert', 'del', 'global', 'not', 'with',
  'async', 'elif', 'if', 'or', 'yield',
]);

/** Supported LLM models for code generation */
const ALLOWED_LLM_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gpt-4o',
]);

interface PreflightInput {
  agents: Agent[];
}

/**
 * Checks if a string is a valid Python identifier
 * @param value - The string to check
 * @returns True if valid Python identifier, false otherwise
 */
function isPythonIdentifier(value: string) {
  return PYTHON_IDENTIFIER.test(value) && !PYTHON_KEYWORDS.has(value);
}

/**
 * Converts a string to snake_case format
 * @param str - The string to convert
 * @returns Snake case formatted string
 */
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

/**
 * Runs preflight validation on agent configurations
 *
 * Validates:
 * - At least one agent exists
 * - Agent names are unique and non-empty
 * - LLM models are supported
 * - Tool names are valid Python identifiers and unique
 * - Parameter names are valid Python identifiers
 *
 * @param input - Object containing agents array to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * const result = runPreflightValidation({ agents: [myAgent] });
 * if (result.hasErrors) {
 *   console.error('Validation failed:', result.errors);
 * }
 */
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
