import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), apiProxy(env)],
    server: {
      port: 3000,
      open: true,
    },
  };
});

function apiProxy(env) {
  return {
    name: 'api-proxy',
    configureServer(server) {
      // Auth — always allow in dev (no SITE_PASSWORD set)
      server.middlewares.use('/api/auth', (req, res, next) => {
        if (req.method !== 'POST') return next();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

      // Claude API — POST only
      server.middlewares.use('/api/claude', (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
              },
              body,
            });
            const text = await response.text();
            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(text);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // Google Places API — handles JSON and image (photo) responses
      server.middlewares.use('/api/google-places', async (req, res) => {
        try {
          const url = new URL(`https://maps.googleapis.com${req.url}`);
          url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

          const response = await fetch(url.toString());
          const contentType = response.headers.get('content-type') || '';

          if (contentType.includes('image')) {
            res.writeHead(200, { 'Content-Type': contentType });
            const buffer = Buffer.from(await response.arrayBuffer());
            res.end(buffer);
          } else {
            const text = await response.text();
            res.writeHead(response.status, { 'Content-Type': contentType });
            res.end(text);
          }
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Brave Search API
      server.middlewares.use('/api/brave-search', async (req, res) => {
        try {
          const url = new URL(`https://api.search.brave.com${req.url}`);
          const response = await fetch(url.toString(), {
            headers: { 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY },
          });
          const text = await response.text();
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(text);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
