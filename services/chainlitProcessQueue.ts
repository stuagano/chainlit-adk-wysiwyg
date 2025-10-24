/**
 * Chainlit Process Queue Manager
 *
 * Manages Chainlit server lifecycle with proper queuing and concurrency control
 * to prevent race conditions when multiple users/requests try to start the server.
 */

import { spawn, ChildProcess } from 'node:child_process';
import http from 'node:http';
import { logError, ProcessError, TimeoutError } from '../utils/errors';

interface ProcessState {
  process: ChildProcess | null;
  status: 'idle' | 'starting' | 'running' | 'stopping';
  startTime: Date | null;
  failureCount: number;
  lastError: string | null;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: Date;
}

// Process state
const state: ProcessState = {
  process: null,
  status: 'idle',
  startTime: null,
  failureCount: 0,
  lastError: null,
};

// Request queue for handling concurrent launch requests
const requestQueue: QueuedRequest[] = [];

// Configuration
const CONFIG = {
  PORT: parseInt(process.env.CHAINLIT_PORT || '8000', 10),
  MAX_STARTUP_TIME: 30000, // 30 seconds max startup time
  MAX_FAILURES: 3, // Max consecutive failures before giving up
  FAILURE_RESET_TIME: 300000, // Reset failure count after 5 minutes
  PORT_CHECK_TIMEOUT: 500,
  STARTUP_WAIT_TIME: 2000, // Wait 2 seconds after spawn before considering it started
};

/**
 * Checks if a port is open and accepting connections
 */
async function isPortOpen(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const req = http
      .request(
        {
          host: '127.0.0.1',
          port,
          method: 'HEAD',
          timeout: CONFIG.PORT_CHECK_TIMEOUT,
        },
        (res) => {
          res.resume();
          resolve(true);
        }
      )
      .on('error', () => resolve(false))
      .on('timeout', () => {
        req.destroy();
        resolve(false);
      });

    req.end();
  });
}

/**
 * Processes the request queue
 */
function processQueue(success: boolean, error?: Error) {
  const requests = [...requestQueue];
  requestQueue.length = 0; // Clear queue

  if (success) {
    requests.forEach(req => req.resolve());
  } else {
    const err = error || new Error('Failed to start Chainlit server');
    requests.forEach(req => req.reject(err));
  }
}

/**
 * Waits for the Chainlit server to be ready
 */
async function waitForServerReady(): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < CONFIG.MAX_STARTUP_TIME) {
    if (await isPortOpen(CONFIG.PORT)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

/**
 * Starts the Chainlit process
 */
async function startProcess(): Promise<void> {
  if (state.status !== 'idle') {
    throw new Error(`Cannot start: current status is ${state.status}`);
  }

  // Check failure count
  if (state.failureCount >= CONFIG.MAX_FAILURES) {
    const timeSinceLastFailure = state.lastError ? Date.now() - new Date(state.lastError).getTime() : Infinity;
    if (timeSinceLastFailure < CONFIG.FAILURE_RESET_TIME) {
      throw new Error(`Too many failures (${state.failureCount}). Please try again later.`);
    }
    // Reset failure count after cooldown period
    state.failureCount = 0;
  }

  state.status = 'starting';

  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'process_starting',
      component: 'chainlit-process',
      command: `${npmCmd} run chainlit:dev`,
      port: CONFIG.PORT,
    }));

    const proc = spawn(npmCmd, ['run', 'chainlit:dev'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    });

    state.process = proc;

    // Set up process event handlers
    proc.on('error', (error) => {
      const processError = new ProcessError('Chainlit process error', undefined, {
        errorMessage: error.message,
        pid: proc.pid,
        status: state.status,
      });

      logError(processError, {
        component: 'chainlit-process',
        operation: 'process-error',
      });

      state.lastError = error.message;
      state.failureCount++;

      if (state.status === 'starting') {
        state.status = 'idle';
        processQueue(false, processError);
      }
    });

    proc.on('exit', (code, signal) => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: code === 0 ? 'INFO' : 'WARN',
        type: 'process_exit',
        component: 'chainlit-process',
        code,
        signal,
        pid: proc.pid,
        status: state.status,
      }));

      state.process = null;
      state.startTime = null;

      if (code !== 0 && code !== null) {
        state.failureCount++;

        const exitError = new ProcessError(
          `Chainlit process exited with non-zero code`,
          code,
          { signal, pid: proc.pid }
        );

        logError(exitError, {
          component: 'chainlit-process',
          operation: 'process-exit',
        });
      }

      const wasStarting = state.status === 'starting';
      state.status = 'idle';

      if (wasStarting) {
        processQueue(false, new ProcessError(`Process exited unexpectedly`, code || undefined));
      }
    });

    // Handle uncaught exceptions in child process
    proc.on('close', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'WARN',
          type: 'process_close',
          component: 'chainlit-process',
          code,
          signal,
          pid: proc.pid,
        }));
      }
    });

    // Wait a bit for process to initialize
    await new Promise(resolve => setTimeout(resolve, CONFIG.STARTUP_WAIT_TIME));

    // Wait for server to be ready
    const isReady = await waitForServerReady();

    if (!isReady) {
      proc.kill();
      const timeoutError = new TimeoutError(
        'Chainlit server failed to start within timeout period',
        CONFIG.MAX_STARTUP_TIME,
        { port: CONFIG.PORT }
      );

      logError(timeoutError, {
        component: 'chainlit-process',
        operation: 'startup-timeout',
      });

      throw timeoutError;
    }

    state.status = 'running';
    state.startTime = new Date();
    state.failureCount = 0; // Reset on successful start
    state.lastError = null;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'process_started',
      component: 'chainlit-process',
      port: CONFIG.PORT,
      pid: proc.pid,
      startupTime: Date.now() - (state.startTime?.getTime() || Date.now()),
    }));

    processQueue(true);
  } catch (error) {
    logError(error, {
      component: 'chainlit-process',
      operation: 'startProcess',
      failureCount: state.failureCount,
    });

    state.status = 'idle';
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    state.failureCount++;

    if (state.process) {
      state.process.kill();
      state.process = null;
    }

    processQueue(false, error instanceof Error ? error : new Error('Failed to start server'));
  }
}

/**
 * Ensures Chainlit server is running, with queue support for concurrent requests
 */
export async function ensureChainlitRunning(): Promise<void> {
  // Check if already running
  if (state.status === 'running' && await isPortOpen(CONFIG.PORT)) {
    return;
  }

  // If currently starting, queue this request
  if (state.status === 'starting') {
    return new Promise<void>((resolve, reject) => {
      requestQueue.push({ resolve, reject, timestamp: new Date() });
    });
  }

  // If idle, start the process
  if (state.status === 'idle') {
    const queuePromise = new Promise<void>((resolve, reject) => {
      requestQueue.push({ resolve, reject, timestamp: new Date() });
    });

    // Start process (will resolve/reject all queued requests)
    startProcess().catch(() => {
      // Error already handled in startProcess
    });

    return queuePromise;
  }

  throw new Error(`Unexpected state: ${state.status}`);
}

/**
 * Stops the Chainlit server
 */
export async function stopChainlit(): Promise<void> {
  if (!state.process || state.status === 'idle') {
    return;
  }

  state.status = 'stopping';

  return new Promise<void>((resolve) => {
    if (!state.process) {
      state.status = 'idle';
      resolve();
      return;
    }

    const cleanup = () => {
      state.process = null;
      state.status = 'idle';
      state.startTime = null;
      resolve();
    };

    state.process.once('exit', cleanup);

    // Force kill after timeout
    const killTimeout = setTimeout(() => {
      if (state.process && !state.process.killed) {
        console.warn('[Chainlit] Force killing unresponsive process');
        state.process.kill('SIGKILL');
      }
    }, 5000);

    // Try graceful shutdown first
    state.process.kill('SIGTERM');

    // Clean up timeout
    state.process.once('exit', () => clearTimeout(killTimeout));
  });
}

/**
 * Gets current process state (for monitoring/debugging)
 */
export function getProcessState(): Readonly<ProcessState> {
  return { ...state };
}

/**
 * Gets queue length (for monitoring/debugging)
 */
export function getQueueLength(): number {
  return requestQueue.length;
}
