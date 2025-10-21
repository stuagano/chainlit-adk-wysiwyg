import path from 'path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

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

        const outputDir = path.resolve(__dirname, 'chainlit_app');
        await fs.mkdir(outputDir, { recursive: true });

        await Promise.all(
          Object.entries(files).map(async ([filename, content]) => {
            if (typeof content !== 'string') {
              return;
            }
            const destination = path.join(outputDir, filename);
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.writeFile(destination, content, 'utf8');
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
