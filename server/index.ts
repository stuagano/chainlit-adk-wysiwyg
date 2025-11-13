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
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { ensureChainlitRunning } from '../services/chainlitProcessQueue';
import { validateFilenames } from '../utils/validation';
import { logError, ValidationError, FileSystemError, ProcessError, isAppError, getErrorMessage } from '../utils/errors';
import { websocketService } from '../services/websocketService';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize WebSocket service
websocketService.initialize(httpServer, FRONTEND_URL);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware with unique request IDs and user tracking
app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // Get userId from header or query param, or generate one
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || requestId;

  (req as any).requestId = requestId;
  (req as any).userId = userId;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    type: 'request',
    requestId,
    userId,
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
  const userId = (req as any).userId;
  let tempDir: string | null = null;
  const startTime = Date.now();

  try {
    const { files } = req.body;

    // Send initial progress update
    websocketService.sendSyncProgress(userId, 'validating', 10, 'Validating files...');

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
    // Support nested directory structures (backend/, .github/, etc.)
    try {
      await Promise.all(
        entries.map(async ([filename, content]) => {
          // Normalize the path and ensure it's safe
          const normalizedPath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
          const tempPath = path.join(tempDir!, normalizedPath);

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

    // Update progress: validation in progress
    websocketService.sendSyncProgress(userId, 'validating', 30, 'Validating Python syntax...');

    // Validate Python syntax (support both flat and backend/ structure)
    const pythonTargets = ['backend/main.py', 'backend/tools.py', 'main.py', 'tools.py']
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

    // Update progress: syncing files
    websocketService.sendSyncProgress(userId, 'syncing', 50, 'Syncing files to chainlit_app...');

    // Copy files to chainlit_app directory
    // Preserve directory structure for nested files
    const outputDir = path.resolve(__dirname, '..', 'chainlit_app');

    try {
      await fs.mkdir(outputDir, { recursive: true });

      await Promise.all(
        entries.map(async ([filename]) => {
          // Normalize path and preserve directory structure
          const normalizedPath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
          const tempPath = path.join(tempDir!, normalizedPath);
          const destination = path.join(outputDir, normalizedPath);

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

    // Send completion progress
    websocketService.sendSyncProgress(userId, 'complete', 100, 'Files synced successfully');

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'sync_success',
      requestId,
      userId,
      fileCount: filenames.length,
      duration,
    }));

    res.json({
      success: true,
      message: 'Files synced successfully',
      files: filenames,
    });
  } catch (error) {
    // Send error notification via WebSocket
    websocketService.sendError(userId, getErrorMessage(error), isAppError(error) ? error.constructor.name : undefined);

    logError(error, {
      component: 'server',
      operation: 'sync-chainlit',
      requestId,
      userId,
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
  const userId = (req as any).userId;
  const startTime = Date.now();

  try {
    // Send initial status update
    websocketService.sendSyncProgress(userId, 'launching', 70, 'Starting Chainlit server...');
    websocketService.sendPreviewStatus(userId, 'starting', 'Launching Chainlit preview server...');

    await ensureChainlitRunning(userId);

    const duration = Date.now() - startTime;

    // Send success status updates
    websocketService.sendPreviewStatus(userId, 'ready', 'Chainlit preview is ready', 'http://localhost:8000');
    websocketService.sendNotification(userId, 'success', 'Chainlit preview server is running');

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'launch_success',
      requestId,
      userId,
      duration,
    }));

    res.json({
      success: true,
      message: 'Chainlit is running',
      url: 'http://localhost:8000',
    });
  } catch (error) {
    // Send error status updates
    websocketService.sendPreviewStatus(userId, 'error', getErrorMessage(error));
    websocketService.sendError(userId, getErrorMessage(error), isAppError(error) ? error.constructor.name : undefined);

    logError(error, {
      component: 'server',
      operation: 'launch-chainlit',
      requestId,
      userId,
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
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`WebSocket server enabled`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);

  // Stop accepting new connections
  httpServer.close(() => {
    console.log('HTTP server closed');

    // Shutdown WebSocket connections
    websocketService.shutdown();

    console.log('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
