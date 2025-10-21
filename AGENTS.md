# Repository Guidelines

## Project Structure & Module Organization
The UI is a TypeScript/React app bootstrapped by Vite. `index.tsx` mounts `App.tsx`, which orchestrates config panels under `components/`. Feature-specific panes such as `components/AdvancedAgentConfig.tsx` and shared inputs in `components/common/` keep logic modular. Domain constants live in `constants.ts`, shared types in `types.ts`, and service helpers (e.g., prompt generation) in `services/codeGenerator.ts`. Static entry assets remain in `index.html` and `metadata.json`. Prefer new views under `components/` and colocate styles or hooks beside their consumer.

## Build, Test, and Development Commands
Run `npm install` once to hydrate dependencies. Use `npm run dev` for Vite’s hot module server on http://localhost:5173. Ship-ready bundles come from `npm run build`, which emits optimized assets to `dist/`. Validate builds locally with `npm run preview`, serving the compiled output.

## Coding Style & Naming Conventions
Write React features as TypeScript `.tsx` modules with functional components and hooks. Follow 2-space indentation, camelCase for variables/functions, and PascalCase for component files (e.g., `AgentConfig.tsx`) and directories. Keep shared utilities typed explicitly and export named symbols only. When introducing configuration constants, extend `constants.ts` to prevent magic values. Prefer React 19 server-safe patterns: avoid legacy lifecycle APIs and mutate state via hooks.

## Testing Guidelines
Automated tests are not yet present; when adding them, place component specs in a parallel `__tests__` directory or alongside the source, using Vitest with `@testing-library/react` for parity with Vite. Name files `ComponentName.test.tsx`. Ensure new features include coverage for rendering paths and critical helper logic, and document manual validation steps in PRs until suites exist.

## Commit & Pull Request Guidelines
Match the existing conventional commits style (`feat:`, `fix:`, `chore:`). Keep messages in present tense with a concise imperative. PRs should summarize the change, link any tracking issue, list test evidence or screenshots for UI work, and call out configuration impacts. Request at least one reviewer before merge.

## Configuration Notes
Environment secrets are not consumed directly; keep API keys external and document expected `.env` variables inside the PR description when they become necessary.
