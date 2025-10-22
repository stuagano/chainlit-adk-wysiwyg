import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../App';
import { Agent } from '../types';

// Mock JSZip
vi.mock('jszip', () => {
  const mockJSZip = vi.fn(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob(['test'])),
  }));
  return { default: mockJSZip };
});

// Mock generateCode
vi.mock('../services/codeGenerator', () => ({
  generateCode: vi.fn((agents: Agent[]) => ({
    'main.py': `# Generated code for ${agents[0]?.name || 'agent'}`,
    'tools.py': '# Tools',
    'requirements.txt': 'chainlit\nrequests',
    'README.md': '# README',
    'Dockerfile': 'FROM python:3.11',
    '.gcloudignore': 'venv/',
  })),
}));

// Mock preflight validation
vi.mock('../services/preflight', () => ({
  runPreflightValidation: vi.fn(() => ({
    hasErrors: false,
    errors: [],
    warnings: [],
  })),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Mock window.open
    vi.stubGlobal('open', vi.fn());

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock fetch
    global.fetch = vi.fn();

    // Mock alert
    global.alert = vi.fn();

    // Mock FileReader
    class MockFileReader {
      result: string | null = null;
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

      readAsText(_file: Blob) {
        setTimeout(() => {
          if (this.onload) {
            const mockEvent = {
              target: { result: '{"type":"service_account","project_id":"test","private_key_id":"123","private_key":"key","client_email":"test@test.com"}' },
            } as unknown as ProgressEvent<FileReader>;
            this.onload(mockEvent);
          }
        }, 0);
      }
    }

    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(screen.getByText(/Configuration/i)).toBeInTheDocument();
    });

    it('renders all major sections', () => {
      render(<App />);
      expect(screen.getByText(/Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Actions & Preview/i)).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<App />);
      expect(screen.getByText(/Generate Code/i)).toBeInTheDocument();
      expect(screen.getByText(/Download .zip/i)).toBeInTheDocument();
      expect(screen.getByText(/Sync to Chainlit/i)).toBeInTheDocument();
      expect(screen.getByText(/Reset Form/i)).toBeInTheDocument();
    });

    it('download button is initially disabled', () => {
      render(<App />);
      const downloadButton = screen.getByText(/Download .zip/i);
      expect(downloadButton).toBeDisabled();
    });

    it('sync to Chainlit button is initially disabled', () => {
      render(<App />);
      const syncButton = screen.getByText(/Sync to Chainlit/i);
      expect(syncButton).toBeDisabled();
    });
  });

  describe('Code Generation', () => {
    it('enables download button after code generation', async () => {
      render(<App />);
      const generateButton = screen.getByText(/Generate Code/i);

      fireEvent.click(generateButton);

      await waitFor(() => {
        const downloadButton = screen.getByText(/Download .zip/i);
        expect(downloadButton).toBeEnabled();
      });
    });

    it('enables sync button after code generation', async () => {
      render(<App />);
      const generateButton = screen.getByText(/Generate Code/i);

      fireEvent.click(generateButton);

      await waitFor(() => {
        const syncButton = screen.getByText(/Sync to Chainlit/i);
        expect(syncButton).toBeEnabled();
      });
    });

    it('displays generated code in preview after generation', async () => {
      render(<App />);
      const generateButton = screen.getByText(/Generate Code/i);

      fireEvent.click(generateButton);

      await waitFor(() => {
        // CodePreview should render with generated files
        expect(screen.getByText(/main.py/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('resets form when reset button is clicked', async () => {
      render(<App />);

      // Generate code first
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Download .zip/i)).toBeEnabled();
      });

      // Reset the form
      const resetButton = screen.getByText(/Reset Form/i);
      fireEvent.click(resetButton);

      // Download button should be disabled again
      await waitFor(() => {
        expect(screen.getByText(/Download .zip/i)).toBeDisabled();
      });
    });

    it('clears generated code after reset', async () => {
      render(<App />);

      // Generate code
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/main.py/i)).toBeInTheDocument();
      });

      // Reset
      const resetButton = screen.getByText(/Reset Form/i);
      fireEvent.click(resetButton);

      // Code preview should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/main.py/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Download Functionality', () => {
    it('does not download when no code is generated', () => {
      render(<App />);
      const downloadButton = screen.getByText(/Download .zip/i);

      // Button should be disabled
      expect(downloadButton).toBeDisabled();
    });

    it('download button enabled after code generation', async () => {
      render(<App />);

      // Generate code
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Download .zip/i)).toBeEnabled();
      });
    });
  });

  describe('Chainlit Sync Functionality', () => {
    it('shows error when trying to sync without generated code', async () => {
      render(<App />);

      const syncButton = screen.getByText(/Sync to Chainlit/i);

      // Button should be disabled
      expect(syncButton).toBeDisabled();
    });

    it('calls sync API when sync button is clicked', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      global.fetch = mockFetch;

      render(<App />);

      // Generate code first
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Sync to Chainlit/i)).toBeEnabled();
      });

      // Click sync
      const syncButton = screen.getByText(/Sync to Chainlit/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sync-chainlit',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('displays success message after successful sync', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      global.fetch = mockFetch;

      render(<App />);

      // Generate code
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Sync to Chainlit/i)).toBeEnabled();
      });

      // Sync
      const syncButton = screen.getByText(/Sync to Chainlit/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Synced to chainlit_app/i)).toBeInTheDocument();
      });
    });

    it('displays error message on sync failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      render(<App />);

      // Generate code
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Sync to Chainlit/i)).toBeEnabled();
      });

      // Sync
      const syncButton = screen.getByText(/Sync to Chainlit/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('opens new window on successful sync', async () => {
      const mockWindowOpen = vi.fn();
      vi.stubGlobal('open', mockWindowOpen);

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      global.fetch = mockFetch;

      render(<App />);

      // Generate code
      const generateButton = screen.getByText(/Generate Code/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Sync to Chainlit/i)).toBeEnabled();
      });

      // Sync
      const syncButton = screen.getByText(/Sync to Chainlit/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith('http://localhost:8000', '_blank');
      });
    });
  });

  describe('Service Account Key Upload', () => {
    it('validates file type on upload', async () => {
      const mockAlert = vi.fn();
      global.alert = mockAlert;

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'));
      });
    });

    it('validates file size on upload', async () => {
      const mockAlert = vi.fn();
      global.alert = mockAlert;

      // Mock FileReader to throw size error before reading
      class MockFileReaderSizeCheck {
        readAsText() {
          // Size check happens before FileReader is used
        }
      }
      global.FileReader = MockFileReaderSizeCheck as unknown as typeof FileReader;

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      // Create a file larger than 100KB
      const largeContent = 'x'.repeat(101 * 1024);
      const largeFile = new File([largeContent], 'large.json', { type: 'application/json' });

      // Create a spy to check the file size
      Object.defineProperty(largeFile, 'size', {
        value: 101 * 1024,
        writable: false,
      });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('too large'));
      });
    });
  });
});
