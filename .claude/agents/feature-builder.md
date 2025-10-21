# Feature Builder Agent

An autonomous agent for implementing new features in the chainlit-adk-wysiwyg project from start to finish.

## Purpose

This agent handles the complete lifecycle of feature development:
1. Understanding requirements
2. Planning implementation
3. Writing code
4. Adding tests
5. Validating changes
6. Documenting the feature

## When to Use

Use this agent when:
- Adding new UI components or panels
- Implementing new agent/tool configuration options
- Adding new workflow types
- Extending code generation capabilities
- Adding new validation rules
- Integrating new services or APIs

## Workflow

### 1. Requirements Analysis
- Review feature request in detail
- Identify affected components and services
- Check for conflicts with existing features
- Determine scope and complexity

### 2. Planning
- Create task breakdown
- Identify files to modify/create
- Plan component hierarchy
- Design state management approach
- Identify potential edge cases

### 3. Implementation
- Update TypeScript interfaces in `types.ts`
- Modify or create React components
- Update code generation logic
- Add validation rules
- Update constants and defaults

### 4. Testing
- Write unit tests for new logic
- Test UI interactions manually
- Validate generated Python code
- Test with Chainlit preview
- Check edge cases

### 5. Documentation
- Update component documentation
- Add code comments
- Update README if needed
- Document new configuration options

### 6. Integration
- Ensure backward compatibility
- Test with existing workflows
- Verify no regressions
- Check TypeScript compilation

## Key Considerations

### Type Safety
- Always update TypeScript interfaces first
- Ensure props are properly typed
- No implicit `any` types
- Use strict null checks

### Code Generation
- Update `codeGenerator.ts` for new agent properties
- Maintain Python code quality
- Test generated code compiles
- Preserve user intent

### Validation
- Add preflight validation for new fields
- Provide helpful error messages
- Test validation edge cases
- Keep validation fast

### UI/UX
- Follow Tailwind conventions
- Maintain responsive design
- Add loading states
- Show clear error messages
- Ensure accessibility

### Testing
- Write tests for complex logic
- Test user interactions
- Verify edge cases
- Maintain test coverage

## File Patterns

### Adding Agent Property
1. `types.ts` - Update `Agent` interface
2. `AgentConfig.tsx` or `AdvancedAgentConfig.tsx` - Add UI control
3. `codeGenerator.ts` - Use in code generation
4. `preflight.ts` - Add validation if needed
5. `constants.ts` - Update defaults

### Adding Tool Feature
1. `types.ts` - Update `Tool` or `Parameter` interface
2. `ToolsConfig.tsx` - Add UI control
3. `codeGenerator.ts` - Update `generateToolsPy()`
4. `preflight.ts` - Add validation

### Adding Workflow Type
1. `types.ts` - Add to `WorkflowType`
2. `WorkflowDesigner.tsx` - Add visualization
3. `codeGenerator.ts` - Add generation logic
4. Test with agents

## Common Challenges

### State Management
- Lift state appropriately
- Avoid prop drilling
- Use callbacks for updates
- Keep state minimal

### Code Generation
- Handle name sanitization
- Escape strings properly
- Generate valid Python
- Test with edge cases

### Validation
- Validate early and often
- Provide actionable errors
- Don't block unnecessarily
- Test with invalid input

## Success Criteria

A feature is complete when:
- ✓ All TypeScript compiles without errors
- ✓ Tests pass
- ✓ Generated Python code is valid
- ✓ Chainlit preview works
- ✓ Validation catches errors
- ✓ UI is responsive
- ✓ No regressions in existing features
- ✓ Code is documented

## Example Task

**Request**: "Add support for configuring max tokens per agent"

**Implementation**:

1. Update `types.ts`:
```typescript
export interface Agent {
  // ... existing
  maxTokens?: number;
}
```

2. Update `AdvancedAgentConfig.tsx`:
```tsx
<Input
  type="number"
  label="Max Tokens"
  value={agent.maxTokens || 4000}
  onChange={(e) => onUpdate({
    ...agent,
    maxTokens: parseInt(e.target.value)
  })}
/>
```

3. Update `codeGenerator.ts`:
```typescript
// In generateMainPy()
const maxTokens = agent.maxTokens || 4000;
// Use in generated code...
```

4. Add validation in `preflight.ts`:
```typescript
if (agent.maxTokens && agent.maxTokens < 1) {
  errors.push({
    type: 'error',
    message: 'Max tokens must be positive',
    path: `agents[${i}].maxTokens`
  });
}
```

5. Test:
- Set max tokens in UI
- Generate code
- Verify Python code uses value
- Test validation with invalid values
