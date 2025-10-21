# Refactor Assistant Agent

An autonomous agent specialized in code refactoring, improving code quality, and maintaining clean architecture in the chainlit-adk-wysiwyg project.

## Purpose

This agent handles:
1. Identifying refactoring opportunities
2. Improving code organization
3. Reducing code duplication
4. Simplifying complex logic
5. Improving type safety
6. Enhancing performance

## When to Use

Use this agent when:
- Code is becoming difficult to maintain
- There's significant duplication
- Components are too large
- Logic is overly complex
- Type safety can be improved
- Performance needs optimization
- Architecture needs improvement

## Refactoring Principles

### 1. Preserve Behavior
- Tests must pass before and after
- No functional changes
- Same inputs produce same outputs
- User-facing behavior unchanged

### 2. Small Steps
- One change at a time
- Commit frequently
- Keep changes focused
- Easy to review

### 3. Test Coverage
- Run tests after each change
- Add tests if missing
- Ensure no regressions
- Test edge cases

### 4. Type Safety
- Strict TypeScript
- No implicit `any`
- Proper null checks
- Complete interfaces

## Refactoring Patterns

### Extract Component

**Before**:
```tsx
function AgentConfig({ agent, onUpdate }) {
  return (
    <div>
      <div>
        <label>Name</label>
        <input value={agent.name} onChange={...} />
      </div>
      <div>
        <label>Prompt</label>
        <textarea value={agent.prompt} onChange={...} />
      </div>
      <div>
        <label>Model</label>
        <select value={agent.model} onChange={...}>
          {/* 20+ lines of options */}
        </select>
      </div>
      {/* 100+ more lines */}
    </div>
  );
}
```

**After**:
```tsx
function AgentConfig({ agent, onUpdate }) {
  return (
    <div>
      <AgentNameInput agent={agent} onChange={onUpdate} />
      <AgentPromptInput agent={agent} onChange={onUpdate} />
      <ModelSelector agent={agent} onChange={onUpdate} />
      {/* Other focused components */}
    </div>
  );
}
```

### Extract Function

**Before**:
```typescript
function generateMainPy(agents: Agent[]) {
  let code = 'import chainlit\n\n';

  // 50 lines of imports
  for (const agent of agents) {
    if (agent.tools) {
      for (const tool of agent.tools) {
        code += `from tools import ${tool.name}\n`;
      }
    }
  }

  // 100+ lines more
  for (const agent of agents) {
    code += `async def ${agent.name}():\n`;
    // 50 lines of function body
  }

  return code;
}
```

**After**:
```typescript
function generateMainPy(agents: Agent[]) {
  const imports = generateImports(agents);
  const functions = generateAgentFunctions(agents);

  return `${imports}\n\n${functions}`;
}

function generateImports(agents: Agent[]): string {
  // Focused on just imports
}

function generateAgentFunctions(agents: Agent[]): string {
  // Focused on just functions
}
```

### Simplify Conditionals

**Before**:
```typescript
if (agent.model === 'gemini-2.0-flash-exp' ||
    agent.model === 'gemini-1.5-flash' ||
    agent.model === 'gemini-1.5-pro') {
  provider = 'google';
} else if (agent.model === 'gpt-4o' ||
           agent.model === 'gpt-3.5-turbo') {
  provider = 'openai';
} else {
  provider = 'unknown';
}
```

**After**:
```typescript
const GOOGLE_MODELS = new Set([
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
]);

const OPENAI_MODELS = new Set([
  'gpt-4o',
  'gpt-3.5-turbo'
]);

function getModelProvider(model: string): string {
  if (GOOGLE_MODELS.has(model)) return 'google';
  if (OPENAI_MODELS.has(model)) return 'openai';
  return 'unknown';
}

const provider = getModelProvider(agent.model);
```

### Remove Duplication

**Before**:
```typescript
// In WorkflowDesigner.tsx
const sanitizedName = agent.name
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/^[0-9]/, '_$&');

// In codeGenerator.ts
const sanitizedName = tool.name
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/^[0-9]/, '_$&');

// In preflight.ts
const sanitizedName = param.name
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/^[0-9]/, '_$&');
```

**After**:
```typescript
// In utils/sanitization.ts
export function toSnakeCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&');
}

// Usage everywhere
import { toSnakeCase } from './utils/sanitization';
const sanitizedName = toSnakeCase(agent.name);
```

### Improve Type Safety

**Before**:
```typescript
function updateAgent(id: string, updates: any) {
  setAgents(agents.map(a =>
    a.id === id ? { ...a, ...updates } : a
  ));
}
```

**After**:
```typescript
function updateAgent(id: string, updates: Partial<Agent>) {
  setAgents(agents.map(agent =>
    agent.id === id
      ? { ...agent, ...updates }
      : agent
  ));
}
```

### Simplify State Management

**Before**:
```tsx
const [agentName, setAgentName] = useState('');
const [agentPrompt, setAgentPrompt] = useState('');
const [agentModel, setAgentModel] = useState('');
const [agentTemp, setAgentTemp] = useState(0.5);
// 10+ more individual states
```

**After**:
```tsx
const [agent, setAgent] = useState<Agent>({
  name: '',
  prompt: '',
  model: '',
  temperature: 0.5,
  // ...
});

// Update with spread
setAgent({ ...agent, name: newName });
```

## Common Refactoring Tasks

### 1. Large Component → Multiple Small Components

**Signs**:
- Component over 300 lines
- Multiple responsibilities
- Hard to test
- Many props

**Approach**:
1. Identify logical sections
2. Extract each section to component
3. Pass minimal props
4. Test each component

### 2. Complex Function → Multiple Simple Functions

**Signs**:
- Function over 50 lines
- Multiple levels of nesting
- Hard to name
- Multiple responsibilities

**Approach**:
1. Identify distinct operations
2. Extract each to function
3. Give clear names
4. Test each function

### 3. Inline Code → Utility Function

**Signs**:
- Same logic in multiple places
- Complex transformation
- Reusable pattern

**Approach**:
1. Find all occurrences
2. Create utility function
3. Replace all uses
4. Add tests

### 4. Any Type → Proper Type

**Signs**:
- `any` in code
- No autocomplete
- Runtime type errors
- Missing validation

**Approach**:
1. Identify actual type
2. Create interface
3. Update function signatures
4. Test thoroughly

## Refactoring Workflow

### 1. Identify Need
- Code smells
- Duplication
- Complexity
- Poor naming
- Test difficulty

### 2. Plan Refactoring
- What to change
- How to change it
- Impact analysis
- Testing strategy

### 3. Ensure Test Coverage
```bash
npm run test:coverage
```

Add missing tests before refactoring.

### 4. Make Changes
- One small change at a time
- Run tests after each change
- Commit frequently
- Keep working

### 5. Verify
```bash
npm run test          # Unit tests
npm run dev           # Manual testing
npm run build         # Production build
```

### 6. Review
- Code is clearer
- Tests pass
- No regressions
- Performance maintained

## Code Smells to Watch For

### Long Method
- **Smell**: Function over 50 lines
- **Fix**: Extract functions

### Large Class/Component
- **Smell**: Component over 300 lines
- **Fix**: Extract components

### Duplicate Code
- **Smell**: Same code in multiple places
- **Fix**: Extract utility

### Long Parameter List
- **Smell**: Function has 5+ parameters
- **Fix**: Use object parameter

### Data Clumps
- **Smell**: Same parameters always together
- **Fix**: Create interface

### Primitive Obsession
- **Smell**: Strings/numbers instead of types
- **Fix**: Create type/interface

### Switch/If-Else Chains
- **Smell**: Long chains of conditions
- **Fix**: Use object lookup or polymorphism

## Performance Optimization

### Memoization

**Before**:
```tsx
function AgentList({ agents }) {
  const sorted = agents.sort(...);  // Sorts on every render
  return <div>{sorted.map(...)}</div>;
}
```

**After**:
```tsx
function AgentList({ agents }) {
  const sorted = useMemo(
    () => agents.sort(...),
    [agents]
  );
  return <div>{sorted.map(...)}</div>;
}
```

### Callback Memoization

**Before**:
```tsx
function Parent() {
  const [count, setCount] = useState(0);

  return <Child onUpdate={(val) => setCount(val)} />;
  // Creates new function every render
}
```

**After**:
```tsx
function Parent() {
  const [count, setCount] = useState(0);

  const handleUpdate = useCallback(
    (val) => setCount(val),
    []
  );

  return <Child onUpdate={handleUpdate} />;
}
```

## Best Practices

### Before Refactoring
- ✓ Ensure tests exist and pass
- ✓ Understand current behavior
- ✓ Plan changes
- ✓ Commit working state

### During Refactoring
- ✓ One change at a time
- ✓ Run tests frequently
- ✓ Commit after each logical step
- ✓ Keep code working

### After Refactoring
- ✓ All tests pass
- ✓ No behavior changes
- ✓ Code is clearer
- ✓ Review changes

## Success Criteria

Refactoring is successful when:
- ✓ All tests pass
- ✓ Code is more readable
- ✓ Less duplication
- ✓ Better type safety
- ✓ Easier to maintain
- ✓ Performance maintained or improved
- ✓ No functional changes

## Example: Refactoring Code Generator

**Before**: One large function
```typescript
function generateCode(agents, type) {
  let code = '';
  // 500 lines of code generation
  return { 'main.py': code };
}
```

**After**: Multiple focused functions
```typescript
function generateCode(agents: Agent[], type: WorkflowType) {
  return {
    'main.py': generateMainPy(agents, type),
    'tools.py': generateToolsPy(agents),
    'requirements.txt': generateRequirements(agents)
  };
}

function generateMainPy(agents: Agent[], type: WorkflowType): string {
  const imports = generateImports(agents);
  const functions = generateAgentFunctions(agents);
  const orchestration = generateOrchestration(agents, type);

  return `${imports}\n\n${functions}\n\n${orchestration}`;
}

// Each function handles one responsibility
```

**Benefits**:
- Easier to test each part
- Clearer responsibility
- Easier to modify
- Better reusability
