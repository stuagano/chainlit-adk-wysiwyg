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

// Global lock to prevent race conditions
let isLocked = false;

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
 * Starts the Chainlit process. Throws on failure.
 */
async function startProcess(): Promise<void> {
  if (state.status !== 'idle') {
    throw new Error(`Cannot start: current status is ${state.status}`);
  }

  if (state.failureCount >= CONFIG.MAX_FAILURES) {
    const timeSinceLastFailure = state.lastError ? Date.now() - new Date(state.lastError).getTime() : Infinity;
    if (timeSinceLastFailure < CONFIG.FAILURE_RESET_TIME) {
      throw new Error(`Too many failures (${state.failureCount}). Please try again later.`);
    }
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
      env: { ...process.env },
    });
    state.process = proc;

    const processPromise = new Promise((_, reject) => {
      proc.on('error', (error) => reject(new ProcessError('Chainlit process error', undefined, { errorMessage: error.message })));
      proc.on('exit', (code) => {
        if (state.status === 'starting') {
          reject(new ProcessError('Process exited unexpectedly during startup', code || undefined));
        }
      });
    });

    const serverReadyPromise = (async () => {
      await new Promise(res => setTimeout(res, CONFIG.STARTUP_WAIT_TIME));
      if (!await waitForServerReady()) {
        throw new TimeoutError('Chainlit server failed to start within timeout period', CONFIG.MAX_STARTUP_TIME);
      }
    })();

    await Promise.race([processPromise, serverReadyPromise]);

    state.status = 'running';
    state.startTime = new Date();
    state.failureCount = 0;
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

  } catch (error) {
    state.status = 'idle';
    state.failureCount++;
    state.lastError = error instanceof Error ? error.message : String(error);
    if (state.process) {
      state.process.kill();
      state.process = null;
    }
    logError(error, {
      component: 'chainlit-process',
      operation: 'startProcess',
      failureCount: state.failureCount,
    });
    throw error;
  }
}


/**
 * Ensures Chainlit server is running, with queue support for concurrent requests
 */
export function ensureChainlitRunning(): Promise<void> {
  const queuePromise = new Promise<void>((resolve, reject) => {
    requestQueue.push({ resolve, reject, timestamp: new Date() });
  });

  if (isLocked) {
    return queuePromise;
  }

  isLocked = true;

  (async () => {
    try {
      if (state.status === 'running' && await isPortOpen(CONFIG.PORT)) {
        processQueue(true);
      } else if (state.status === 'idle') {
        await startProcess();
        processQueue(true);
      } else {
        throw new Error(`Cannot start server in state: ${state.status}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      processQueue(false, err);
      logError(err, { component: 'ensureChainlitRunning' });
    } finally {
      isLocked = false;
    }
  })();

  return queuePromise;
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

    const killTimeout = setTimeout(() => {
      if (state.process && !state.process.killed) {
        console.warn('[Chainlit] Force killing unresponsive process');
        state.process.kill('SIGKILL');
      }
    }, 5000);

    state.process.kill('SIGTERM');
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
