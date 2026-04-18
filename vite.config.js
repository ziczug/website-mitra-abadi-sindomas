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

      // POST /api/sync — regenerasi semua file turunan (CSV, brands) dari products.json
      server.middlewares.use('/api/sync', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        try {
          const productsPath = path.join(cmsDir, 'products.json');
          if (!fs.existsSync(productsPath)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'products.json not found' }));
            return;
          }

          const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
          const syncResults = [];

          // ── 1. Regenerasi produk.csv ──
          const csvHeaders = ['id', 'name', 'category', 'brand', 'brand_logo', 'image', 'desc', 'origin', 'weight', 'cert', 'info'];
          const csvRows = [csvHeaders.join(',')];
          products.forEach(p => {
            const row = csvHeaders.map(h => {
              let val = String(p[h] !== undefined ? p[h] : '');
              val = val.replace(/"/g, '""');
              if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = `"${val}"`;
              }
              return val;
            });
            csvRows.push(row.join(','));
          });
          fs.writeFileSync(path.join(dbDir, 'produk.csv'), csvRows.join('\n'), 'utf8');
          syncResults.push('produk.csv');

          // ── 2. Regenerasi brand_partners.json ──
          // Baca yang existing untuk preserve logoData
          let existingBP = [];
          const bpPath = path.join(cmsDir, 'brand_partners.json');
          if (fs.existsSync(bpPath)) {
            try { existingBP = JSON.parse(fs.readFileSync(bpPath, 'utf8')); } catch(e) {}
          }
          const existingBPMap = {};
          existingBP.forEach(b => { existingBPMap[b.name.toLowerCase().trim()] = b; });

          const brandPartners = [];
          const seenBrands = {};
          let bpId = 1;
          products.forEach(p => {
            const key = (p.brand || '').toLowerCase().trim();
            if (key && !seenBrands[key]) {
              seenBrands[key] = true;
              const existing = existingBPMap[key];
              brandPartners.push({
                id: bpId++,
                name: p.brand,
                logo: p.brand_logo || (existing ? existing.logo : ''),
                logoData: existing ? (existing.logoData || '') : ''
              });
            }
          });
          fs.writeFileSync(bpPath, JSON.stringify(brandPartners, null, 2), 'utf8');
          syncResults.push('brand_partners.json');

          // ── 3. Regenerasi brands.csv ──
          const brandCsvLines = ['id,name,category,logo'];
          brandPartners.forEach((b, i) => {
            const catList = [...new Set(
              products.filter(p => (p.brand || '').toLowerCase() === b.name.toLowerCase()).map(p => p.category)
            )].join(';');
            brandCsvLines.push(`${i + 1},"${b.name}","${catList}",${b.logo}`);
          });
          fs.writeFileSync(path.join(dbDir, 'brands.csv'), brandCsvLines.join('\n') + '\n', 'utf8');
          syncResults.push('brands.csv');

          console.log(`[API/Sync] ✅ Berhasil sinkronisasi: ${syncResults.join(', ')} (${products.length} produk, ${brandPartners.length} brand)`);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            products: products.length,
            brands: brandPartners.length,
            files: syncResults,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          console.error('[API/Sync] ❌ Error:', e.message);
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
