# Agent Configuration Skill

This skill helps you work with agent configurations and the workflow designer.

## Context

The visual builder allows users to configure multi-agent workflows with three types:
1. **Sequential**: Agents execute in order
2. **Hierarchical**: Parent-child agent relationships
3. **Collaborative**: Agents work together

## Key Responsibilities

1. **Agent Properties**: Name, system prompt, model, temperature
2. **Workflow Design**: Agent hierarchy and execution order
3. **Tool Assignment**: Which tools each agent can use
4. **LLM Configuration**: Model selection and parameters

## Key Files

- `components/WorkflowDesigner.tsx` - Visual workflow editor
- `components/AgentConfig.tsx` - Basic agent settings
- `components/AdvancedAgentConfig.tsx` - Advanced LLM settings
- `types.ts` - Agent and workflow type definitions

## Agent Properties

### Basic
- **name**: Agent identifier (must be valid Python identifier)
- **systemPrompt**: Agent personality and instructions
- **model**: LLM model to use

### Advanced
- **temperature**: Randomness (0.0-1.0)
- **maxTokens**: Response length limit
- **topP**: Nucleus sampling parameter
- **parentId**: For hierarchical workflows

### UI Configuration
- **welcomeMessage**: Chainlit UI greeting
- **inputPlaceholder**: Chat input hint

## Supported LLM Models

### Gemini (Default)
- `gemini-2.0-flash-exp`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### OpenAI
- `gpt-4o`

## Workflow Types

### Sequential
```
Agent1 → Agent2 → Agent3
```
- Agents execute in order
- Output flows forward
- Simple linear flow

### Hierarchical
```
    Manager
    ├── Worker1
    └── Worker2
```
- Parent delegates to children
- Supports nesting
- Manager-worker pattern

### Collaborative
```
Agent1 ↔ Agent2 ↔ Agent3
```
- Agents communicate freely
- Shared context
- Team collaboration

## Common Tasks

### Adding New Agent Field

1. Update `Agent` interface in `types.ts`:
```typescript
export interface Agent {
  // ... existing fields
  newField: string;
}
```

2. Add UI control in `AgentConfig.tsx`:
```tsx
<Input
  value={agent.newField}
  onChange={(e) => onUpdate({ ...agent, newField: e.target.value })}
/>
```

3. Update code generation in `codeGenerator.ts`:
```typescript
# Use agent.newField in generated Python code
```

4. Update validation if needed in `preflight.ts`

### Adding New Workflow Type

1. Add to `WorkflowType` in `types.ts`
2. Update `WorkflowDesigner.tsx` rendering logic
3. Update code generation to handle new type
4. Add tests for new workflow

### Configuring Tools for Agent

Tools are configured in `ToolsConfig.tsx` and associated with agents through the visual interface.

## Validation

Agent configuration must pass:
- Name is valid Python identifier
- System prompt is non-empty
- Model is in whitelist
- Temperature is 0.0-1.0
- No duplicate names in same scope

## Best Practices

1. Use descriptive agent names
2. Write clear system prompts
3. Start with lower temperature (0.3-0.5)
4. Test with simple tools first
5. Use hierarchical for complex tasks
6. Keep agent count manageable (< 10)

## Example Agent Configuration

```typescript
{
  id: "agent_1",
  name: "ResearchAssistant",
  systemPrompt: "You are a helpful research assistant...",
  model: "gemini-2.0-flash-exp",
  temperature: 0.4,
  tools: ["search_web", "summarize_text"],
  welcomeMessage: "Hello! I can help you research topics.",
  inputPlaceholder: "Ask me to research something..."
}
```

## Code Generation Output

Each agent becomes a function in `main.py`:
```python
async def research_assistant(
    state: State,
    config: RunnableConfig
) -> dict:
    # Agent implementation
    ...
```
