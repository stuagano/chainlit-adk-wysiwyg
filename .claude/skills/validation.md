# Validation Skill

This skill helps you work with validation and preflight checks in the chainlit-adk-wysiwyg project.

## Context

The validation system performs two-phase validation:
1. **Preflight validation** - UI-level checks before code generation
2. **Compile-time validation** - Python syntax validation after code generation

## Key Responsibilities

1. **Identifier Validation**: Ensure names are valid Python identifiers
2. **Duplicate Detection**: Find conflicting agent/tool/parameter names
3. **Model Whitelisting**: Verify LLM models are supported
4. **Reserved Keyword Checking**: Prevent use of Python keywords
5. **Cross-Agent Validation**: Check for conflicts in hierarchical workflows

## Key Files

- `services/preflight.ts` - All validation logic
- `components/PreflightPanel.tsx` - Validation results UI
- `test/preflight.test.ts` - Validation unit tests
- `vite.config.ts` - Compile-time validation endpoint

## Validation Types

### Errors (Block Code Generation)
- Invalid Python identifiers
- Duplicate names at same scope
- Use of Python reserved keywords
- Missing required fields
- Unsupported LLM models

### Warnings (Informational)
- Names that will be sanitized
- Best practice violations
- Potential conflicts

## Common Tasks

### Adding New Validation Rules

1. Add validation function to `services/preflight.ts`
2. Update `ValidationResult` type if needed
3. Add tests to `test/preflight.test.ts`
4. Update UI display in `PreflightPanel.tsx`

### Testing Validation

```bash
npm run test
```

Focus on:
- Edge cases (empty strings, special characters)
- Python reserved keywords
- Nested agent scenarios
- Tool parameter validation

## Python Identifier Rules

Valid identifiers must:
- Start with letter or underscore
- Contain only letters, digits, underscores
- Not be a Python reserved keyword
- Be non-empty

Reserved keywords: `False`, `None`, `True`, `and`, `as`, `assert`, `async`, `await`, `break`, `class`, `continue`, `def`, `del`, `elif`, `else`, `except`, `finally`, `for`, `from`, `global`, `if`, `import`, `in`, `is`, `lambda`, `nonlocal`, `not`, `or`, `pass`, `raise`, `return`, `try`, `while`, `with`, `yield`

## Best Practices

1. Run validation before every code generation
2. Show clear error messages with context
3. Provide suggestions for fixing issues
4. Test with actual Python compiler
5. Keep validation fast (< 100ms)
6. Validate incrementally as user types (debounced)

## Error Message Format

```typescript
{
  type: 'error' | 'warning',
  message: 'Clear description',
  path: 'agents[0].tools[2].parameters[1].name',
  suggestion: 'Try using "param_name" instead'
}
```
