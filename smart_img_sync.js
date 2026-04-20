const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PRODUCTS_JSON = path.join(ROOT, 'database', 'cms', 'products.json');

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

console.log('--- Resyncing Image Filenames to Brand - Name Weight Standard ---');

products.forEach(p => {
  const brandSlug = toSlug(p.brand);
  const targetSlug = toSlug(p.name);
  const targetPath = `assets/images/products/${brandSlug}/${targetSlug}.png`;
  const fullTargetPath = path.join(ROOT, targetPath);

  if (fs.existsSync(fullTargetPath)) {
    // Already correct
    return;
  }

  // Brand directory
  const brandDir = path.join(ROOT, 'assets', 'images', 'products', brandSlug);
  if (!fs.existsSync(brandDir)) return;

  const files = fs.readdirSync(brandDir);
  
  // Try to find a match among existing files
  // 1. Check if there's a file that was the "old slug" (Brand - Name)
  // Extract parts of name without weight to try finding the previous filename
  const brandPrefix = p.brand + ' - ';
  const nameWithoutBrand = p.name.startsWith(brandPrefix) ? p.name.substring(brandPrefix.length) : p.name;
  const weight = p.weight || '';
  const nameOnly = weight ? nameWithoutBrand.replace(new RegExp('\\s*' + weight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim() : nameWithoutBrand;

  const oldSlugNoWeight = toSlug(p.brand + ' - ' + nameOnly);
  const oldSlugNoBrandNoWeight = toSlug(nameOnly);
  
  const candidates = [
    oldSlugNoWeight + '.png',
    oldSlugNoBrandNoWeight + '.png',
    toSlug(nameWithoutBrand) + '.png'
  ];

  for (let cand of candidates) {
    const candPath = path.join(brandDir, cand);
    if (fs.existsSync(candPath)) {
      try {
        fs.renameSync(candPath, fullTargetPath);
        console.log(`[RENAMED] ${cand} -> ${targetSlug}.png`);
        p.image = targetPath;
        break;
      } catch (e) {
        console.error(`Failed to rename ${cand}: ${e.message}`);
      }
    }
  }
});

// Update products.json with potentially fixed paths
fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf8');
console.log('--- Migration Finished ---');
