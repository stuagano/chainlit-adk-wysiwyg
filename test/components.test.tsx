import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PreflightPanel } from '../components/PreflightPanel';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PreflightValidationResult } from '../types';

describe('PreflightPanel Component', () => {
  it('renders nothing when result is null', () => {
    const { container } = render(<PreflightPanel result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no errors or warnings', () => {
    const result: PreflightValidationResult = {
      hasErrors: false,
      hasWarnings: false,
      errors: [],
      warnings: [],
    };
    const { container } = render(<PreflightPanel result={result} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error list when errors exist', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: false,
      errors: [
        { message: 'Test error 1', path: 'agent1.tools[0]' },
        { message: 'Test error 2', path: 'agent2.name' },
      ],
      warnings: [],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText('Preflight Validation')).toBeInTheDocument();
    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.getByText('Test error 2')).toBeInTheDocument();
    expect(screen.getByText('agent1.tools[0]')).toBeInTheDocument();
    expect(screen.getByText('agent2.name')).toBeInTheDocument();
  });

  it('renders warning list when warnings exist', () => {
    const result: PreflightValidationResult = {
      hasErrors: false,
      hasWarnings: true,
      errors: [],
      warnings: [
        { message: 'Test warning 1', path: 'agent1.temperature' },
      ],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText('Test warning 1')).toBeInTheDocument();
    expect(screen.getByText('agent1.temperature')).toBeInTheDocument();
  });

  it('displays correct message for errors', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: false,
      errors: [{ message: 'Error', path: '' }],
      warnings: [],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText(/Resolve the errors below/i)).toBeInTheDocument();
  });

  it('displays correct message for warnings only', () => {
    const result: PreflightValidationResult = {
      hasErrors: false,
      hasWarnings: true,
      errors: [],
      warnings: [{ message: 'Warning', path: '' }],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText(/No blocking errors detected/i)).toBeInTheDocument();
  });

  it('displays error count correctly (plural)', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: false,
      errors: [
        { message: 'Error 1', path: '' },
        { message: 'Error 2', path: '' },
      ],
      warnings: [],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText(/2 errors found/i)).toBeInTheDocument();
  });

  it('displays error count correctly (singular)', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: false,
      errors: [{ message: 'Error', path: '' }],
      warnings: [],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText(/1 error found/i)).toBeInTheDocument();
  });

  it('displays warning count correctly (plural)', () => {
    const result: PreflightValidationResult = {
      hasErrors: false,
      hasWarnings: true,
      errors: [],
      warnings: [
        { message: 'Warning 1', path: '' },
        { message: 'Warning 2', path: '' },
      ],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText(/2 warnings found/i)).toBeInTheDocument();
  });

  it('displays both errors and warnings', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: true,
      errors: [{ message: 'Error', path: '' }],
      warnings: [{ message: 'Warning', path: '' }],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders issues without paths', () => {
    const result: PreflightValidationResult = {
      hasErrors: true,
      hasWarnings: false,
      errors: [{ message: 'Error without path', path: undefined }],
      warnings: [],
    };

    render(<PreflightPanel result={result} />);

    expect(screen.getByText('Error without path')).toBeInTheDocument();
  });
});

describe('Header Component', () => {
  it('renders without crashing', () => {
    render(<Header />);
  });

  it('renders the title parts', () => {
    render(<Header />);
    // Title is split across multiple spans, so search for parts
    expect(screen.getByText('ADK')).toBeInTheDocument();
    expect(screen.getByText('Chainlit')).toBeInTheDocument();
    expect(screen.getByText(/Agent Builder/i)).toBeInTheDocument();
  });

  it('renders the header element', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});

describe('Footer Component', () => {
  it('renders without crashing', () => {
    render(<Footer />);
  });

  it('renders footer text', () => {
    render(<Footer />);
    // Footer should contain some text
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders copyright or attribution', () => {
    render(<Footer />);
    // Most footers have some copyright or year
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toBeTruthy();
  });
});
