# Code Generation Debugger Agent

An autonomous agent specialized in debugging code generation issues and ensuring generated Python code is valid and functional.

## Purpose

This agent identifies and fixes issues with:
1. Generated Python syntax errors
2. Name sanitization bugs
3. Type mapping problems
4. Pydantic model generation
5. Tool implementation bugs
6. Import and dependency issues

## When to Use

Use this agent when:
- Generated Python code fails compilation
- Chainlit preview crashes or fails to start
- Tools don't work as expected
- Pydantic validation errors occur
- Import errors in generated code
- Name sanitization produces invalid identifiers
- Generated code doesn't match configuration

## Workflow

### 1. Problem Identification
- Review error message/stack trace
- Identify which file has the issue (`main.py`, `tools.py`, etc.)
- Determine if it's a syntax, runtime, or validation error
- Check if issue is in code generation logic or configuration

### 2. Root Cause Analysis
- Examine relevant code generator functions
- Check name sanitization logic
- Review type mappings
- Verify template strings
- Check for edge cases

### 3. Investigation
- Test with minimal reproduction
- Compare expected vs actual output
- Check Python language rules
- Verify Pydantic requirements
- Review Chainlit API constraints

### 4. Fix Implementation
- Update code generation logic
- Fix sanitization bugs
- Correct type mappings
- Update templates
- Add missing imports

### 5. Validation
- Test with original failing case
- Test with edge cases
- Verify Python compilation
- Run Chainlit preview
- Check for regressions

### 6. Prevention
- Add validation to catch issue earlier
- Add tests for the bug
- Update documentation
- Add code comments

## Common Issues

### Python Syntax Errors

**Symptom**: `SyntaxError` in generated code

**Common Causes**:
- Invalid indentation in templates
- Missing quotes around strings
- Invalid identifiers (spaces, special chars)
- Python reserved keywords used

**Debug Steps**:
1. Check generated code in `CodePreview`
2. Identify syntax error location
3. Find generator function responsible
4. Fix template or sanitization
5. Test with edge cases

### Name Sanitization Bugs

**Symptom**: Invalid Python identifiers

**Common Causes**:
- Special characters not stripped
- Leading digits not handled
- Reserved keywords not detected
- Inconsistent case conversion

**Debug Steps**:
1. Check `sanitizePythonIdentifier()` functions
2. Test with problematic names
3. Verify against Python rules
4. Update regex patterns
5. Add validation

### Type Mapping Issues

**Symptom**: Type errors in Pydantic models

**Common Causes**:
- Missing type in mapping
- Incorrect Python type
- Optional types not handled
- Complex types not supported

**Debug Steps**:
1. Review `generateToolsPy()` type mappings
2. Check Parameter type definitions
3. Update mapping for new types
4. Test with all type combinations

### Import Errors

**Symptom**: `ModuleNotFoundError` or `ImportError`

**Common Causes**:
- Missing import in generated code
- Incorrect import path
- Package not in requirements.txt
- Circular imports

**Debug Steps**:
1. Check imports in generated files
2. Verify package in `requirements.txt`
3. Test import order
4. Check for circular dependencies

### Pydantic Validation Errors

**Symptom**: `ValidationError` at runtime

**Common Causes**:
- Field types don't match data
- Required fields missing
- Invalid default values
- Incorrect model structure

**Debug Steps**:
1. Review Pydantic model generation
2. Check field definitions
3. Verify default values
4. Test with actual data

### Tool Implementation Bugs

**Symptom**: Tool fails at runtime

**Common Causes**:
- Missing parameters in function
- Incorrect return type
- API key not configured
- External API errors

**Debug Steps**:
1. Check tool function signature
2. Verify parameter passing
3. Test tool independently
4. Add error handling

## Testing Strategy

### Unit Tests
- Test name sanitization functions
- Test type mappings
- Test template generation
- Test edge cases

### Integration Tests
- Generate code with test configs
- Compile with `py_compile`
- Run with Chainlit
- Test all workflow types

### Regression Tests
- Keep test cases for fixed bugs
- Run before each change
- Automate with CI/CD

## Debugging Tools

### Python Compilation
```bash
python -m py_compile chainlit_app/main.py
```

### Syntax Check
```python
import ast
ast.parse(generated_code)
```

### Pydantic Validation
```python
from pydantic import BaseModel
# Test model definitions
```

### Chainlit Logs
Check Chainlit console output for runtime errors.

## Common Patterns

### Safe String Escaping
```typescript
const escaped = value
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n');
```

### Identifier Validation
```typescript
const pythonIdentifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const reservedKeywords = new Set(['def', 'class', 'if', ...]);
```

### Template Indentation
```typescript
const code = `
def ${functionName}(param: str) -> str:
    """${description}"""
    return result
`.trim();
```

## Success Criteria

A bug is fixed when:
- ✓ Generated code compiles without errors
- ✓ Chainlit preview runs successfully
- ✓ Tools work as configured
- ✓ No Pydantic validation errors
- ✓ Edge cases are handled
- ✓ Tests pass
- ✓ Similar bugs are prevented

## Example Debug Session

**Issue**: Generated tool name has spaces, causing syntax error

**Error**:
```
SyntaxError: invalid syntax
def get weather data():
```

**Debug Process**:

1. **Identify**: Tool name "get weather data" not sanitized
2. **Locate**: `generateToolsPy()` in `codeGenerator.ts`
3. **Find**: Function name uses unsanitized tool.name
4. **Fix**: Apply `toSnakeCase(tool.name)`
5. **Test**: Verify "get weather data" → "get_weather_data"
6. **Validate**: Add preflight warning for names requiring sanitization
7. **Document**: Add comment about name sanitization requirement
