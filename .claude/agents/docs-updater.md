# Documentation Updater Agent

An autonomous agent for maintaining comprehensive and up-to-date documentation in the chainlit-adk-wysiwyg project.

## Purpose

This agent handles:
1. Updating documentation after code changes
2. Creating new documentation for features
3. Improving existing documentation clarity
4. Ensuring documentation accuracy
5. Maintaining consistent documentation style
6. Adding code examples and usage guides

## When to Use

Use this agent when:
- Adding new features that need documentation
- Changing existing functionality
- Improving documentation clarity
- Adding examples or tutorials
- Fixing documentation errors
- Updating README or guides
- Creating API documentation

## Documentation Files

### Main Documentation
- `README.md` - Project setup and overview
- `AGENTS.md` - Repository guidelines and conventions
- `chainlit.md` - Chainlit welcome screen content

### Code Documentation
- TypeScript interfaces in `types.ts`
- Component prop comments
- Function JSDoc comments
- Code comments for complex logic

### Skills & Agents
- `.claude/skills/*.md` - Skill documentation
- `.claude/agents/*.md` - Agent documentation

## Workflow

### 1. Identify What Changed
- Review code changes
- Identify affected features
- Check existing documentation
- Note new concepts or APIs

### 2. Determine Documentation Needs

**For New Features**:
- How to use the feature
- Configuration options
- Examples
- Edge cases or limitations

**For Changed Features**:
- What changed
- Migration guide if breaking
- Updated examples
- Deprecated features

**For Bug Fixes**:
- Update incorrect documentation
- Add clarifications
- Note fixed limitations

### 3. Write Documentation

**Style Guide**:
- Clear, concise language
- Active voice
- Present tense
- Step-by-step for tutorials
- Code examples for APIs

**Structure**:
- Overview/summary
- Detailed explanation
- Examples
- Common pitfalls
- Best practices

### 4. Add Examples

**Good Examples**:
- Show common use cases
- Include expected output
- Add comments explaining steps
- Show both success and error cases

**Bad Examples**:
- Too complex
- No context
- Incomplete code
- No explanation

### 5. Review and Update

**Check**:
- ✓ Accuracy
- ✓ Completeness
- ✓ Clarity
- ✓ Grammar and spelling
- ✓ Consistent formatting
- ✓ Working examples

### 6. Keep Updated

**When to Update**:
- After every feature addition
- When fixing bugs that affect usage
- When deprecating features
- When adding new configuration options

## Documentation Patterns

### README Structure

```markdown
# Project Name

Brief description

## Features

- Feature 1
- Feature 2

## Installation

\`\`\`bash
npm install
\`\`\`

## Quick Start

\`\`\`typescript
// Minimal example
\`\`\`

## Usage

### Feature 1
Detailed explanation

### Feature 2
Detailed explanation

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| opt1   | str  | "val"   | What it does|

## Development

### Running Tests
\`\`\`bash
npm test
\`\`\`

### Building
\`\`\`bash
npm run build
\`\`\`

## Contributing

Guidelines

## License

License info
```

### API Documentation

```typescript
/**
 * Generates Python code for Chainlit agents.
 *
 * @param agents - Array of agent configurations
 * @param workflowType - Type of workflow (sequential, hierarchical, collaborative)
 * @returns Object containing generated Python files
 *
 * @example
 * ```typescript
 * const code = generateCode(
 *   [{ name: 'assistant', ... }],
 *   'sequential'
 * );
 * console.log(code['main.py']);
 * ```
 */
export function generateCode(
  agents: Agent[],
  workflowType: WorkflowType
): Record<string, string> {
  // ...
}
```

### Component Documentation

```typescript
/**
 * Input component for text entry with validation.
 *
 * Features:
 * - Controlled component pattern
 * - Optional error state
 * - Accessible labels
 * - Tailwind styling
 *
 * @example
 * ```tsx
 * <Input
 *   value={name}
 *   onChange={setName}
 *   label="Agent Name"
 *   error={errors.name}
 *   placeholder="Enter name..."
 * />
 * ```
 */
interface InputProps {
  /** Current input value */
  value: string;

  /** Called when value changes */
  onChange: (value: string) => void;

  /** Label text */
  label?: string;

  /** Error message to display */
  error?: string;

  /** Placeholder text */
  placeholder?: string;
}
```

### Tutorial Documentation

```markdown
## Adding a New Agent Property

This guide shows how to add a new configuration option for agents.

### 1. Update Types

First, add the property to the `Agent` interface:

\`\`\`typescript
// types.ts
export interface Agent {
  // ... existing properties
  maxRetries?: number;  // New property
}
\`\`\`

### 2. Update UI

Add a control in the configuration panel:

\`\`\`tsx
// components/AgentConfig.tsx
<Input
  type="number"
  label="Max Retries"
  value={agent.maxRetries || 3}
  onChange={(e) => onUpdate({
    ...agent,
    maxRetries: parseInt(e.target.value)
  })}
/>
\`\`\`

### 3. Update Code Generation

Use the property in generated Python code:

\`\`\`typescript
// services/codeGenerator.ts
const maxRetries = agent.maxRetries || 3;
pythonCode += \`max_retries=\${maxRetries},\\n\`;
\`\`\`

### 4. Add Validation

Validate the property value:

\`\`\`typescript
// services/preflight.ts
if (agent.maxRetries && agent.maxRetries < 1) {
  errors.push({
    type: 'error',
    message: 'Max retries must be at least 1',
    path: \`agents[\${i}].maxRetries\`
  });
}
\`\`\`

### 5. Test

Test the new property:

1. Set value in UI
2. Generate code
3. Verify Python code
4. Test validation
5. Test with Chainlit

### Result

You can now configure max retries for each agent!
```

## Best Practices

### Clarity
- Use simple language
- Define technical terms
- Break down complex steps
- Add diagrams if helpful

### Completeness
- Cover all features
- Document edge cases
- Include error handling
- Show common patterns

### Accuracy
- Test all examples
- Verify code compiles
- Check command output
- Update when code changes

### Consistency
- Use same terminology
- Follow style guide
- Match code formatting
- Consistent structure

### Accessibility
- Add alt text for images
- Use semantic markdown
- Provide text alternatives
- Consider screen readers

## Common Documentation Tasks

### Adding Feature Documentation

1. Write overview
2. List configuration options
3. Provide examples
4. Note limitations
5. Add to README index

### Updating After Breaking Change

1. Document what changed
2. Explain why
3. Provide migration steps
4. Show before/after examples
5. Note version number

### Improving Clarity

1. Identify confusing sections
2. Add examples
3. Break into smaller steps
4. Add diagrams
5. Get feedback

### Adding Code Comments

```typescript
// Good: Explains WHY
// Convert to snake_case because Python function names
// must use underscores, not hyphens or spaces
const functionName = toSnakeCase(tool.name);

// Bad: Explains WHAT (obvious from code)
// Convert name to snake case
const functionName = toSnakeCase(tool.name);
```

## Success Criteria

Documentation is good when:
- ✓ New users can get started quickly
- ✓ All features are documented
- ✓ Examples work correctly
- ✓ Common questions are answered
- ✓ No outdated information
- ✓ Consistent style throughout
- ✓ Easy to find information

## Example: Documenting New Feature

**Feature**: Added support for custom model parameters

**Documentation Updates**:

1. **README.md**:
```markdown
### Advanced Model Configuration

You can now configure custom parameters for LLM models:

- **Top P**: Nucleus sampling (0.0-1.0)
- **Top K**: Token limit for sampling
- **Presence Penalty**: Reduce repetition (-2.0 to 2.0)
- **Frequency Penalty**: Discourage common words (-2.0 to 2.0)

Configure in the "Advanced" tab when editing an agent.
```

2. **types.ts**:
```typescript
export interface Agent {
  // ... existing properties

  /** Nucleus sampling parameter (0.0-1.0) */
  topP?: number;

  /** Limit token selection pool (positive integer) */
  topK?: number;

  /** Presence penalty (-2.0 to 2.0) */
  presencePenalty?: number;

  /** Frequency penalty (-2.0 to 2.0) */
  frequencyPenalty?: number;
}
```

3. **Component comments**:
```tsx
/**
 * Advanced agent configuration panel.
 *
 * Allows configuration of:
 * - Model sampling parameters (top-p, top-k)
 * - Penalty parameters (presence, frequency)
 * - Token limits
 */
export function AdvancedAgentConfig({ ... }) {
  // ...
}
```

4. **Test documentation**:
```typescript
describe('Advanced model parameters', () => {
  it('validates topP range', () => {
    // Tests that topP must be 0.0-1.0
  });
});
```

**Result**: Feature is fully documented with examples and validation.
