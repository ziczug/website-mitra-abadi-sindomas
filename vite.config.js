import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Vite plugin: API untuk simpan/baca data admin ke file JSON
function adminDataApi() {
  const dbDir = path.resolve(__dirname, 'database');
  
  // Pastikan folder database/cms/ ada
  const cmsDir = path.join(dbDir, 'cms');
  if (!fs.existsSync(cmsDir)) {
    fs.mkdirSync(cmsDir, { recursive: true });
  }

  return {
    name: 'admin-data-api',
    configureServer(server) {
      // POST /api/save — simpan data ke file JSON
      server.middlewares.use('/api/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { key, data } = JSON.parse(body);
            if (!key || data === undefined) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing key or data' }));
              return;
            }
            const filePath = path.join(cmsDir, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, file: `database/cms/${key}.json` }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // GET /api/load?key=xxx — baca data dari file JSON
      server.middlewares.use('/api/load', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const url = new URL(req.url, 'http://localhost');
        const key = url.searchParams.get('key');
        if (!key) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing key parameter' }));
          return;
        }
        const filePath = path.join(cmsDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });

      // GET /api/load-all — baca semua data CMS sekaligus
      server.middlewares.use('/api/load-all', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        try {
          const result = {};
          if (fs.existsSync(cmsDir)) {
            const files = fs.readdirSync(cmsDir).filter(f => f.endsWith('.json'));
            files.forEach(f => {
              const key = f.replace('.json', '');
              try {
                result[key] = JSON.parse(fs.readFileSync(path.join(cmsDir, f), 'utf8'));
              } catch(e) {}
            });
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch(e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [adminDataApi()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
