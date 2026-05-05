const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PRODUCTS_JSON = path.join(ROOT, 'database', 'cms', 'products.json');
const PRODUK_CSV = path.join(ROOT, 'database', 'produk.csv');

function toSlug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

if (!fs.existsSync(PRODUCTS_JSON)) {
  console.error('products.json not found!');
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
console.log(`Checking ${products.length} products...`);

let fixedCount = 0;
let missingCount = 0;

products.forEach(p => {
  const currentPath = path.join(ROOT, p.image);
  if (fs.existsSync(currentPath) && p.image.endsWith('.png')) {
    // Already exists
    return;
  }

  const brandSlug = toSlug(p.brand);
  const brandDir = path.join(ROOT, 'assets', 'images', 'products', brandSlug);
  
  if (!fs.existsSync(brandDir)) {
    console.log(`[!] Brand directory missing: ${brandSlug}`);
    missingCount++;
    return;
  }

  const files = fs.readdirSync(brandDir).filter(f => f.endsWith('.png'));
  const nameSlug = toSlug(p.name);
  
  // Try to find a match
  let found = false;
  
  // 1. Exact slug match
  let match = files.find(f => toSlug(f.replace('.png', '')) === nameSlug);
  
  // 2. Contains name slug
  if (!match) {
    match = files.find(f => toSlug(f.replace('.png', '')).includes(nameSlug));
  }

  // 3. Name slug contains file slug
  if (!match) {
    match = files.find(f => nameSlug.includes(toSlug(f.replace('.png', ''))));
  }

  // 4. Fuzzy match (remove weight suffixes)
  if (!match) {
    const nameNoWeight = nameSlug.replace(/\d+g.*$/, '').replace(/-$/, '');
    match = files.find(f => toSlug(f.replace('.png', '')).includes(nameNoWeight));
  }

  if (match) {
    const newPath = `assets/images/products/${brandSlug}/${match}`;
    console.log(`[FIXED] ${p.name}: ${p.image} -> ${newPath}`);
    p.image = newPath;
    found = true;
    fixedCount++;
  } else {
    console.log(`[MISSING] ${p.name}: No match found in ${brandSlug}/`);
    p.image = 'assets/images/placeholder.png';
    missingCount++;
  }
});

fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf8');

// Also update CSV
const headers = ['id', 'name', 'category', 'brand', 'brand_logo', 'image', 'desc', 'origin', 'weight', 'cert', 'info'];
const csvRows = [headers.join(',')];
products.forEach(p => {
  const row = headers.map(h => {
    let val = String(p[h] || '').replace(/"/g, '""');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
    return val;
  });
  csvRows.push(row.join(','));
});
fs.writeFileSync(PRODUK_CSV, csvRows.join('\n'), 'utf8');

console.log(`\nDone! Fixed: ${fixedCount}, Still Missing: ${missingCount}`);
