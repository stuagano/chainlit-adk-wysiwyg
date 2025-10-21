import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import http from 'node:http';

let chainlitProcess: ChildProcessWithoutNullStreams | null = null;
let starting = false;

const isPortOpen = async (port: number) => {
  return new Promise<boolean>((resolve) => {
    const req = http
      .request(
        {
          host: '127.0.0.1',
          port,
          method: 'HEAD',
          timeout: 500,
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
};

export const ensureChainlitRunning = async () => {
  if (starting) {
    return;
  }

  const alreadyRunning = await isPortOpen(8000);
  if (alreadyRunning) {
    return;
  }

  if (chainlitProcess && !chainlitProcess.killed) {
    return;
  }

  starting = true;

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  chainlitProcess = spawn(npmCmd, ['run', 'chainlit:dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });

  chainlitProcess.on('exit', () => {
    chainlitProcess = null;
  });

  starting = false;
};

export const stopChainlit = async () => {
  if (chainlitProcess && !chainlitProcess.killed) {
    chainlitProcess.kill();
    chainlitProcess = null;
  }
};
