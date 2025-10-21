import path from 'path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { IncomingMessage, ServerResponse } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

import { ensureChainlitRunning } from './services/chainlitProcess';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chainlitSyncEndpoint = () => ({
  name: 'chainlit-sync-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/sync-chainlit', async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let tempDir: string | null = null;

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        const rawBody = Buffer.concat(chunks).toString();
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const files = payload?.files;

        if (!files || typeof files !== 'object') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid payload: expected { files: Record<string, string> }' }));
          return;
        }

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chainlit-preflight-'));

        const entries = Object.entries(files).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        );

        await Promise.all(
          entries.map(async ([filename, content]) => {
            const tempPath = path.join(tempDir!, filename);
            await fs.mkdir(path.dirname(tempPath), { recursive: true });
            await fs.writeFile(tempPath, content, 'utf8');
          })
        );

        const pythonTargets = ['main.py', 'tools.py']
          .map((name) => (files[name] ? path.join(tempDir, name) : null))
          .filter((target): target is string => Boolean(target));

        if (pythonTargets.length > 0) {
          const compileErrors: Record<string, string> = {};

          for (const target of pythonTargets) {
            try {
              await execFileAsync('python', ['-m', 'py_compile', target]);
            } catch (error: any) {
              const stderr = error?.stderr?.toString().trim();
              const stdout = error?.stdout?.toString().trim();
              compileErrors[path.basename(target)] = stderr || stdout || error?.message || 'Python compilation failed';
            }
          }

          if (Object.keys(compileErrors).length > 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Python compilation failed', details: compileErrors }));
            return;
          }
        }

        const outputDir = path.resolve(__dirname, 'chainlit_app');
        await fs.mkdir(outputDir, { recursive: true });

        await Promise.all(
          entries.map(async ([filename]) => {
            const tempPath = path.join(tempDir!, filename);
            const destination = path.join(outputDir, filename);
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.copyFile(tempPath, destination);
          })
        );

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('[chainlit-sync-endpoint]', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to sync Chainlit files' }));
      } finally {
        if (tempDir) {
          try {
            await fs.rm(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error('[chainlit-sync-endpoint] temp cleanup failed', cleanupError);
          }
        }
      }
    });

    server.middlewares.use('/api/launch-chainlit', async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      try {
        await ensureChainlitRunning();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('[chainlit-launch-endpoint]', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to launch Chainlit' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const plugins: PluginOption[] = [react()];
    if (mode === 'development') {
      plugins.push(chainlitSyncEndpoint());
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        css: true,
        coverage: {
          reporter: ['text', 'html'],
          exclude: [...configDefaults.coverage?.exclude ?? [], 'test/setup.ts']
        }
      }
    };
});
