/**
 * Production Backend Server
 *
 * Provides API endpoints for:
 * - Syncing generated code to Chainlit
 * - Launching Chainlit server
 * - File validation and processing
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { ensureChainlitRunning } from '../services/chainlitProcessQueue';
import { validateFilenames } from '../utils/validation';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/sync-chainlit
 *
 * Syncs generated code files to the chainlit_app directory
 * Validates Python syntax before syncing
 */
app.post('/api/sync-chainlit', async (req: Request, res: Response) => {
  let tempDir: string | null = null;

  try {
    const { files } = req.body;

    // Validate payload
    if (!files || typeof files !== 'object') {
      return res.status(400).json({
        error: 'Invalid payload: expected { files: Record<string, string> }',
      });
    }

    // Validate all filenames to prevent path traversal attacks
    const filenames = Object.keys(files);
    const validationResult = validateFilenames(filenames);

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid filenames detected',
        details: `The following filenames are not allowed: ${validationResult.invalidFiles.join(', ')}`,
      });
    }

    // Create temporary directory for preflight validation
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chainlit-preflight-'));

    const entries = Object.entries(files).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    );

    // Write files to temp directory
    await Promise.all(
      entries.map(async ([filename, content]) => {
        const tempPath = path.join(tempDir!, filename);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, content, 'utf8');
      })
    );

    // Validate Python syntax
    const pythonTargets = ['main.py', 'tools.py']
      .map((name) => (files[name] && tempDir ? path.join(tempDir, name) : null))
      .filter((target): target is string => Boolean(target));

    if (pythonTargets.length > 0) {
      const compileErrors: Record<string, string> = {};

      for (const target of pythonTargets) {
        try {
          await execFileAsync('python', ['-m', 'py_compile', target]);
        } catch (error: unknown) {
          const err = error as { stderr?: Buffer; stdout?: Buffer; message?: string };
          const stderr = err?.stderr?.toString().trim();
          const stdout = err?.stdout?.toString().trim();
          compileErrors[path.basename(target)] =
            stderr || stdout || err?.message || 'Python compilation failed';
        }
      }

      if (Object.keys(compileErrors).length > 0) {
        return res.status(400).json({
          error: 'Python compilation failed',
          details: compileErrors,
        });
      }
    }

    // Copy files to chainlit_app directory
    const outputDir = path.resolve(__dirname, '..', 'chainlit_app');
    await fs.mkdir(outputDir, { recursive: true });

    await Promise.all(
      entries.map(async ([filename]) => {
        const tempPath = path.join(tempDir!, filename);
        const destination = path.join(outputDir, filename);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.copyFile(tempPath, destination);
      })
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[sync-chainlit] Error:', error);
    res.status(500).json({
      error: 'Failed to sync Chainlit files',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('[sync-chainlit] Temp cleanup failed:', cleanupError);
      }
    }
  }
});

/**
 * POST /api/launch-chainlit
 *
 * Launches the Chainlit development server
 */
app.post('/api/launch-chainlit', async (_req: Request, res: Response) => {
  try {
    await ensureChainlitRunning();
    res.json({ ok: true });
  } catch (error) {
    console.error('[launch-chainlit] Error:', error);
    res.status(500).json({
      error: 'Failed to launch Chainlit',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
