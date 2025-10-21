# UI Components Skill

This skill helps you work with React components and UI development in the chainlit-adk-wysiwyg project.

## Context

The UI is built with React 19, TypeScript, and Tailwind CSS. Components follow a functional, hooks-based pattern with clear separation of concerns.

## Key Responsibilities

1. **Component Development**: Build reusable React components
2. **Styling**: Apply Tailwind CSS utilities
3. **State Management**: Use React hooks effectively
4. **Type Safety**: Maintain TypeScript interfaces
5. **Testing**: Write component tests with Vitest

## Key Files

- `components/` - All React components
- `components/common/` - Reusable UI primitives
- `App.tsx` - Main application component (state hub)
- `index.html` - HTML template with Tailwind CDN

## Component Structure

### Main Components
- `WorkflowDesigner.tsx` - Visual workflow editor
- `AgentConfig.tsx` - Agent configuration panel
- `ToolsConfig.tsx` - Tool management
- `GCPConfig.tsx` - Deployment configuration
- `ChainlitConfig.tsx` - Chainlit UI settings
- `CodePreview.tsx` - Code display panel
- `PreflightPanel.tsx` - Validation results
- `Header.tsx` / `Footer.tsx` - Layout

### Common Components
- `Card.tsx` - Container with styling
- `Input.tsx` - Text input field
- `Textarea.tsx` - Multi-line text input
- `Button.tsx` - Action buttons

## Styling with Tailwind

### Common Patterns

#### Cards
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Content */}
</div>
```

#### Buttons
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>
```

#### Forms
```tsx
<input
  type="text"
  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

#### Layout
```tsx
<div className="flex flex-col gap-4">
  {/* Items */}
</div>
```

## State Management

### Props Pattern
```tsx
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

function Component({ value, onChange }: ComponentProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

### Hook Usage
- `useState` - Local component state
- `useEffect` - Side effects
- `useCallback` - Memoized callbacks
- `useMemo` - Memoized values

## Common Tasks

### Creating New Component

1. Create component file in `components/`:
```tsx
import React from 'react';

interface MyComponentProps {
  // Props
}

export function MyComponent({ }: MyComponentProps) {
  return (
    <div className="...">
      {/* Content */}
    </div>
  );
}
```

2. Export from `App.tsx` or parent component

3. Add tests in `test/__tests__/`

### Adding Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Updating Styles

1. Modify Tailwind classes in JSX
2. Check responsive breakpoints (`md:`, `lg:`)
3. Test in browser
4. Ensure dark mode support if needed

## Type Safety

### Component Props
```tsx
interface Props {
  required: string;
  optional?: number;
  callback: (value: string) => void;
  children?: React.ReactNode;
}
```

### Event Handlers
```tsx
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // Handle click
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Handle change
};
```

## Best Practices

1. **Single Responsibility**: Each component does one thing
2. **Props Over State**: Lift state up when needed
3. **Type Everything**: No implicit `any`
4. **Memoization**: Use `React.memo` for expensive components
5. **Accessibility**: Add ARIA labels and keyboard support
6. **Error Boundaries**: Handle errors gracefully
7. **Loading States**: Show feedback during async operations

## Testing

Run tests:
```bash
npm run test
```

Test coverage:
```bash
npm run test:coverage
```

Focus on:
- Component rendering
- User interactions
- Prop changes
- Edge cases

## Responsive Design

### Breakpoints
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

### Mobile-First
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Responsive width */}
</div>
```

## Performance

### Optimization Tips
1. Use `React.memo` for pure components
2. Memoize expensive calculations with `useMemo`
3. Debounce input handlers
4. Lazy load heavy components
5. Avoid inline object/array creation in props

### Code Splitting
```tsx
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```
