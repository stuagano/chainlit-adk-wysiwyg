# Code Generation Skill

This skill helps you work with the code generation system in the chainlit-adk-wysiwyg project.

## Context

The code generation system is located in `services/codeGenerator.ts` and generates Python code for Chainlit/ADK agents based on visual configurations.

## Key Responsibilities

1. **Generate Python Code**: Create `main.py`, `tools.py`, and `requirements.txt` from agent configurations
2. **Name Sanitization**: Convert UI names to valid Python identifiers (snake_case, PascalCase)
3. **Pydantic Model Generation**: Create type-safe tool parameter models
4. **Tool Implementation**: Generate function implementations with proper signatures

## Key Files

- `services/codeGenerator.ts` - Main code generation logic (637 lines)
- `types.ts` - TypeScript interfaces (Agent, Tool, Parameter)
- `constants.ts` - Default configurations

## Common Tasks

### Adding Support for New Agent Properties

1. Update `Agent` interface in `types.ts`
2. Modify `generateMainPy()` in `services/codeGenerator.ts`
3. Update agent config UI components

### Adding New Tool Types

1. Extend `Parameter` type in `types.ts`
2. Update type mapping in `generateToolsPy()`
3. Add UI controls in `components/ToolsConfig.tsx`

### Modifying Code Templates

Key template sections:
- `generateMainPy()` - Agent orchestration code
- `generateToolsPy()` - Tool definitions and implementations
- `generateRequirements()` - Python dependencies

## Name Sanitization Rules

- **snake_case**: Function names, tool names, parameter names
- **PascalCase**: Class names, Pydantic models
- Strip invalid characters, convert spaces to underscores
- Check against Python reserved keywords

## Type Mappings

- `string` → `str`
- `number` → `float`
- `boolean` → `bool`

## Best Practices

1. Always validate generated code with preflight checks
2. Test with Python compile-time validation
3. Preserve user intent when sanitizing names
4. Generate helpful code comments
5. Keep requirements.txt minimal and pinned

## Testing

- Test code generation with various agent configurations
- Verify Python syntax with `py_compile`
- Test with actual Chainlit execution
