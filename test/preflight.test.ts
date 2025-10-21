import { describe, expect, it } from 'vitest';

import { runPreflightValidation } from '../services/preflight';
import { Agent } from '../types';

const buildAgent = (overrides: Partial<Agent>): Agent => ({
  id: 'agent-1',
  name: 'MyAssistant',
  system_prompt: 'You are helpful.',
  welcome_message: 'hello',
  input_placeholder: 'ask me',
  tools: [],
  parentId: null,
  llmModel: 'gemini-2.5-flash',
  temperature: 0.7,
  ...overrides,
});

describe('runPreflightValidation identifier sanitization', () => {
  it('flags tool "Search Docs" with warning indicating sanitized name', () => {
    const agent = buildAgent({
      tools: [
        {
          id: 'tool-1',
          name: 'Search Docs',
          description: 'Search documentation',
          parameters: [],
        },
      ],
    });

    const result = runPreflightValidation({ agents: [agent] });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('search_docs'),
        }),
      ]),
    );
  });

  it('flags tool name "class" as an error', () => {
    const agent = buildAgent({
      tools: [
        {
          id: 'tool-1',
          name: 'class',
          description: 'Invalid keyword',
          parameters: [],
        },
      ],
    });

    const result = runPreflightValidation({ agents: [agent] });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          message: expect.stringContaining('must be a valid Python identifier'),
        }),
      ]),
    );
    expect(result.warnings).toHaveLength(0);
  });

  it('flags parameter "User query" with warning indicating sanitized name', () => {
    const agent = buildAgent({
      tools: [
        {
          id: 'tool-1',
          name: 'search',
          description: 'Search something',
          parameters: [
            {
              id: 'param-1',
              name: 'User query',
              type: 'string',
              description: 'The user input',
              required: true,
            },
          ],
        },
      ],
    });

    const result = runPreflightValidation({ agents: [agent] });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('user_query'),
        }),
      ]),
    );
  });

  it('flags parameter name "return" as an error', () => {
    const agent = buildAgent({
      tools: [
        {
          id: 'tool-1',
          name: 'search',
          description: 'Search something',
          parameters: [
            {
              id: 'param-1',
              name: 'return',
              type: 'string',
              description: 'Reserved keyword',
              required: true,
            },
          ],
        },
      ],
    });

    const result = runPreflightValidation({ agents: [agent] });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          message: expect.stringContaining('must be a valid Python identifier'),
        }),
      ]),
    );
    expect(result.warnings).toHaveLength(0);
  });
});
