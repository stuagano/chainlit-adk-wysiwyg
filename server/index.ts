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
import { logError, ValidationError, FileSystemError, ProcessError, isAppError, getErrorMessage } from '../utils/errors';

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

// Request logging middleware with unique request IDs
app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    type: 'request',
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  }));
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
  const requestId = (req as any).requestId;
  let tempDir: string | null = null;
  const startTime = Date.now();

  try {
    const { files } = req.body;

    // Validate payload
    if (!files || typeof files !== 'object') {
      throw new ValidationError('Invalid payload: expected { files: Record<string, string> }', {
        requestId,
        receivedType: typeof files,
      });
    }

    // Validate file count
    const filenames = Object.keys(files);
    if (filenames.length === 0) {
      throw new ValidationError('No files provided', { requestId });
    }

    if (filenames.length > 20) {
      throw new ValidationError('Too many files (max 20)', {
        requestId,
        count: filenames.length
      });
    }

    // Validate all filenames to prevent path traversal attacks
    const validationResult = validateFilenames(filenames);

    if (!validationResult.isValid) {
      throw new ValidationError('Invalid filenames detected', {
        requestId,
        invalidFiles: validationResult.invalidFiles,
      });
    }

    // Validate file sizes
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content !== 'string') continue;
      if (content.length > MAX_FILE_SIZE) {
        throw new ValidationError(`File too large: ${filename}`, {
          requestId,
          filename,
          size: content.length,
          maxSize: MAX_FILE_SIZE,
        });
      }
    }

    // Create temporary directory for preflight validation
    try {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chainlit-preflight-'));
    } catch (error) {
      throw new FileSystemError('Failed to create temporary directory', undefined, {
        requestId,
        error: getErrorMessage(error),
      });
    }

    const entries = Object.entries(files).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    );

    // Write files to temp directory with error handling
    try {
      await Promise.all(
        entries.map(async ([filename, content]) => {
          // Use basename to strip any path components
          const safeName = path.basename(filename);
          const tempPath = path.join(tempDir!, safeName);

          // Additional security check
          if (!tempPath.startsWith(tempDir!)) {
            throw new ValidationError('Path traversal attempt detected', {
              requestId,
              filename,
            });
          }

          await fs.mkdir(path.dirname(tempPath), { recursive: true });
          await fs.writeFile(tempPath, content, 'utf8');
        })
      );
    } catch (error) {
      throw new FileSystemError('Failed to write files to temp directory', tempDir, {
        requestId,
        error: getErrorMessage(error),
      });
    }

    // Validate Python syntax
    const pythonTargets = ['main.py', 'tools.py']
      .map((name) => (files[name] && tempDir ? path.join(tempDir, name) : null))
      .filter((target): target is string => Boolean(target));

    if (pythonTargets.length > 0) {
      const compileErrors: Record<string, string> = {};

      for (const target of pythonTargets) {
        try {
          await execFileAsync('python', ['-m', 'py_compile', target], {
            timeout: 10000, // 10 second timeout
          });
        } catch (error: unknown) {
          const err = error as { stderr?: Buffer; stdout?: Buffer; message?: string; killed?: boolean };

          if (err.killed) {
            throw new ProcessError('Python validation timed out', undefined, {
              requestId,
              file: path.basename(target),
            });
          }

          const stderr = err?.stderr?.toString().trim();
          const stdout = err?.stdout?.toString().trim();
          compileErrors[path.basename(target)] =
            stderr || stdout || err?.message || 'Python compilation failed';
        }
      }

      if (Object.keys(compileErrors).length > 0) {
        throw new ValidationError('Python compilation failed', {
          requestId,
          compileErrors,
        });
      }
    }

    // Copy files to chainlit_app directory
    const outputDir = path.resolve(__dirname, '..', 'chainlit_app');

    try {
      await fs.mkdir(outputDir, { recursive: true });

      await Promise.all(
        entries.map(async ([filename]) => {
          const safeName = path.basename(filename);
          const tempPath = path.join(tempDir!, safeName);
          const destination = path.join(outputDir, safeName);

          // Security check
          if (!destination.startsWith(outputDir)) {
            throw new ValidationError('Path traversal attempt detected', {
              requestId,
              filename,
            });
          }

          await fs.mkdir(path.dirname(destination), { recursive: true });
          await fs.copyFile(tempPath, destination);
        })
      );
    } catch (error) {
      throw new FileSystemError('Failed to copy files to output directory', outputDir, {
        requestId,
        error: getErrorMessage(error),
      });
    }

    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'sync_success',
      requestId,
      fileCount: filenames.length,
      duration,
    }));

    res.json({
      success: true,
      message: 'Files synced successfully',
      files: filenames,
    });
  } catch (error) {
    logError(error, {
      component: 'server',
      operation: 'sync-chainlit',
      requestId,
      duration: Date.now() - startTime,
    });

    const statusCode = isAppError(error) ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: getErrorMessage(error),
      details: isAppError(error) ? error.context : undefined,
    });
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logError(cleanupError, {
          component: 'server',
          operation: 'cleanup-temp-dir',
          requestId,
          tempDir,
        });
      }
    }
  }
});

/**
 * POST /api/launch-chainlit
 *
 * Launches the Chainlit development server
 */
app.post('/api/launch-chainlit', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    await ensureChainlitRunning();

    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'launch_success',
      requestId,
      duration,
    }));

    res.json({
      success: true,
      message: 'Chainlit is running',
      url: 'http://localhost:8000',
    });
  } catch (error) {
    logError(error, {
      component: 'server',
      operation: 'launch-chainlit',
      requestId,
      duration: Date.now() - startTime,
    });

    const statusCode = isAppError(error) ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: getErrorMessage(error),
      details: isAppError(error) ? error.context : undefined,
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId;

  logError(err, {
    component: 'server',
    operation: 'global-error-handler',
    requestId,
    method: req.method,
    path: req.path,
  });

  const statusCode = isAppError(err) ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    details: process.env.NODE_ENV === 'development' && isAppError(err) ? err.context : undefined,
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
