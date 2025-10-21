# Test Runner Agent

An autonomous agent for running tests, fixing test failures, and maintaining test coverage in the chainlit-adk-wysiwyg project.

## Purpose

This agent handles:
1. Running the test suite
2. Analyzing test failures
3. Fixing broken tests
4. Writing new tests
5. Improving test coverage
6. Maintaining test quality

## When to Use

Use this agent when:
- Tests are failing after changes
- Adding new features that need tests
- Refactoring code and need to update tests
- Improving test coverage
- Investigating flaky tests
- Setting up new test infrastructure

## Test Infrastructure

### Framework
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation

### Test Files
- `test/preflight.test.ts` - Validation logic tests
- `components/common/__tests__/` - Component tests
- `test/setup.ts` - Test configuration

### Commands
```bash
npm run test              # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode
npm run test:ui          # Interactive UI
```

## Workflow

### 1. Run Tests
```bash
npm run test
```

Analyze output:
- Which tests failed?
- What are the error messages?
- Are failures consistent?
- Is it a regression?

### 2. Investigate Failures

**For Logic Tests** (`preflight.test.ts`):
- Check if implementation changed
- Verify test expectations are correct
- Check for edge cases
- Review test data

**For Component Tests**:
- Check if component structure changed
- Verify test selectors are valid
- Check for async issues
- Review props and state

### 3. Fix Issues

**Update Implementation**:
- If test is correct, fix the code
- Ensure backward compatibility
- Handle edge cases properly

**Update Tests**:
- If implementation is correct, fix test
- Update assertions
- Fix selectors
- Update mock data

### 4. Verify Fix
```bash
npm run test
```

Ensure:
- Fixed test now passes
- No new failures introduced
- All tests still pass
- Coverage maintained

### 5. Add New Tests

For new features:
- Test happy path
- Test error cases
- Test edge cases
- Test user interactions

### 6. Coverage Analysis
```bash
npm run test:coverage
```

Target:
- 80%+ line coverage
- 80%+ branch coverage
- 100% critical paths

## Common Test Patterns

### Testing Validation Logic

```typescript
import { describe, it, expect } from 'vitest';
import { validatePythonIdentifier } from '../services/preflight';

describe('validatePythonIdentifier', () => {
  it('accepts valid identifiers', () => {
    expect(validatePythonIdentifier('valid_name')).toBe(true);
    expect(validatePythonIdentifier('_private')).toBe(true);
    expect(validatePythonIdentifier('CamelCase')).toBe(true);
  });

  it('rejects invalid identifiers', () => {
    expect(validatePythonIdentifier('123invalid')).toBe(false);
    expect(validatePythonIdentifier('with spaces')).toBe(false);
    expect(validatePythonIdentifier('special-chars')).toBe(false);
  });

  it('rejects Python keywords', () => {
    expect(validatePythonIdentifier('def')).toBe(false);
    expect(validatePythonIdentifier('class')).toBe(false);
    expect(validatePythonIdentifier('return')).toBe(false);
  });
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../components/common/Input';

describe('Input', () => {
  it('renders with value', () => {
    render(<Input value="test" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('calls onChange when typed', () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error state', () => {
    render(<Input value="" onChange={() => {}} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react';

it('handles async validation', async () => {
  render(<MyComponent />);

  fireEvent.click(screen.getByText('Validate'));

  await waitFor(() => {
    expect(screen.getByText('Validation complete')).toBeInTheDocument();
  });
});
```

### Testing Code Generation

```typescript
import { generateMainPy } from '../services/codeGenerator';

describe('generateMainPy', () => {
  it('generates valid Python code', () => {
    const agents = [{ name: 'test_agent', ... }];
    const code = generateMainPy(agents, 'sequential');

    // Test structure
    expect(code).toContain('async def test_agent');
    expect(code).toContain('from chainlit');

    // Test syntax validity
    const ast = require('py-ast'); // hypothetical
    expect(() => ast.parse(code)).not.toThrow();
  });

  it('handles special characters in names', () => {
    const agents = [{ name: 'Agent Name!', ... }];
    const code = generateMainPy(agents, 'sequential');

    expect(code).toContain('agent_name');
    expect(code).not.toContain('Agent Name!');
  });
});
```

## Debugging Test Failures

### 1. Read Error Message
```
FAIL  test/preflight.test.ts
  validatePythonIdentifier
    ✕ rejects invalid identifiers (2 ms)

  Expected: false
  Received: true
```

### 2. Check Test Code
```typescript
// Is the test expectation correct?
expect(validatePythonIdentifier('with spaces')).toBe(false);
```

### 3. Check Implementation
```typescript
// Does the implementation handle spaces?
export function validatePythonIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
```

### 4. Identify Issue
- Test expects `false` for "with spaces"
- Regex should reject spaces
- Regex is correct (`\s` not in pattern)
- But test is failing...
- Check if implementation is being called

### 5. Fix and Verify
```bash
npm run test -- --reporter=verbose
```

## Best Practices

### Test Organization
- Group related tests with `describe`
- Use clear test names
- One assertion per test when possible
- Test behavior, not implementation

### Test Data
- Use realistic data
- Test edge cases
- Use constants for reusable data
- Avoid hardcoded magic numbers

### Mocking
- Mock external dependencies
- Use `vi.fn()` for callbacks
- Mock API calls
- Don't mock what you're testing

### Assertions
- Be specific in expectations
- Test both positive and negative cases
- Use appropriate matchers
- Add helpful error messages

### Maintenance
- Update tests when code changes
- Remove obsolete tests
- Keep tests fast
- Avoid test interdependencies

## Common Issues

### Flaky Tests
- Async timing issues
- Random data
- External dependencies
- Test order dependency

**Fix**: Use `waitFor`, stable data, proper mocking

### Slow Tests
- Too many renders
- Real API calls
- Large datasets
- No parallelization

**Fix**: Mock expensive operations, use smaller data

### False Positives
- Tests pass but code is wrong
- Weak assertions
- Mocking too much

**Fix**: Strengthen assertions, test real behavior

## Success Criteria

Tests are healthy when:
- ✓ All tests pass
- ✓ Coverage meets targets
- ✓ Tests run fast (< 5s total)
- ✓ No flaky tests
- ✓ Clear error messages
- ✓ Tests are maintainable
- ✓ New features have tests

## Example: Fixing a Test Failure

**Failure**:
```
✕ validates agent names correctly
Expected: errors.length = 0
Received: errors.length = 1
```

**Investigation**:
1. Check test: Expects no errors for valid agent name
2. Check implementation: Added new validation rule
3. Check data: Agent name "TestAgent" should be valid
4. Issue: New rule rejects PascalCase

**Fix**:
Either:
- Update validation to allow PascalCase
- Update test to use snake_case

**Decision**: Allow PascalCase (it's valid Python)

**Implementation**:
```typescript
// Update validation logic
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
  // Allow both snake_case and PascalCase
}
```

**Verify**:
```bash
npm run test
```

**Result**: ✓ All tests pass
