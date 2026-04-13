/**
 * sync_cms.js — Sync Excel CMS data to JSON database files
 * Run: node sync_cms.js
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = __dirname;
const CMS_DIR = path.join(ROOT, 'database', 'cms');
const LOGO_DIR = path.join(ROOT, 'assets', 'logobrands');

// ── 1. Read Excel ──────────────────────────────────────────────────────────
const wb = XLSX.readFile(path.join(ROOT, 'database', 'CMS_Produk_MitraAbadi_Update.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log(`[Excel] ${rawData.length} rows read`);

// ── 2. Brand → Logo mapping ──────────────────────────────────────────────
const brandLogoMap = {
  'oriental':           'assets/logobrands/oriental.jpg',
  'jacker':             'assets/logobrands/jacker.jpg',
  'zess':               'assets/logobrands/zess.jpg',
  'zees':               'assets/logobrands/zess.jpg',
  'fudo':               'assets/logobrands/fudo.jpg',
  'win2':               'assets/logobrands/win2.jpg',
  'kolakids':           'assets/logobrands/kolakids.jpg',
  'potato crips':       'assets/logobrands/potato-crips.jpg',
  'bake story':         'assets/logobrands/bake-story.jpg',
  'tomo':               'assets/logobrands/tomo.jpg',
  'ibumie':             'assets/logobrands/ibumie.jpg',
  'ibu mie':            'assets/logobrands/ibumie.jpg',
  'telly':              'assets/logobrands/telly.jpg',
  'veggilicious':       'assets/logobrands/veggilicious.jpg',
  'a-taste':            'assets/logobrands/a-taste.jpg',
  'huang xiao gu!':     'assets/logobrands/huang-xiao-gu.jpg',
  'huang xiao gu':      'assets/logobrands/huang-xiao-gu.jpg',
  'vetrue':             'assets/logobrands/vetrue.jpg',
  'hui xiang zhai zi':  'assets/logobrands/hui-xiang-zhai-zi.jpg',
  'kiss delicias':      'assets/logobrands/kiss-delicias.jpg',
  'yamamoto kawahiro':  'assets/logobrands/yamamoto-kawahiro.jpg',
  'mikku':              'assets/logobrands/mikku.jpg',
  'tawandang':          'assets/logobrands/tawandang.jpg',
  'swecco':             'assets/logobrands/swecco.jpg',
  'xiduodong':          'assets/logobrands/xiduodong.jpg',
  'shuang-jiao':        'assets/logobrands/shuang-jiao.jpg',
  'master jh':          'assets/logobrands/master-jh.jpg',
};

function getBrandLogo(brandName) {
  const key = (brandName || '').toLowerCase().trim();
  return brandLogoMap[key] || '';
}

// ── 3. Category key normalisation ─────────────────────────────────────────
const catKeyMap = {
  'snack':              'snack',
  'biskuit':            'biskuit',
  'biskuit & cookies':  'biskuit',
  'wafer':              'wafer',
  'kue & pastry':       'kue',
  'kue':                'kue',
  'minuman':            'minuman',
  'permen':             'permen',
  'condiments':         'condiments',
  'instant noodle':     'noodle',
  'vegelicious':        'vegelicious',
  'pudding':            'pudding',
};

// ── Slug helper ────────────────────────────────────────────────────────────
function toSlug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .trim()
    .replace(/\s+/g, '-')           // spaces to dash
    .replace(/-+/g, '-');           // double dash to single
}

// ── 4. Convert to product objects ─────────────────────────────────────────
const products = rawData.map((r, i) => {
  const brandName     = (r['Brand'] || '').trim();
  const logoFromExcel = (r['Logo Brand'] || '').trim();
  const brandLogo     = logoFromExcel || getBrandLogo(brandName);
  const catRaw        = (r['Kategori'] || '').toLowerCase().trim();
  const category      = catKeyMap[catRaw] || catRaw;
  
  const weightVal     = r['Berat/Ukuran'] !== undefined ? String(r['Berat/Ukuran']).trim() : '';
  
  // Auto-generate image path if empty in Excel
  let imgPath = String(r['Gambar'] || '').trim();
  if (!imgPath) {
    const brandSlug = toSlug(brandName);
    const prodSlug = toSlug(String(r['Nama Produk'] || ''));
    if (brandSlug && prodSlug) {
      imgPath = `assets/images/products/${brandSlug}/${prodSlug}.jpg`;
    }
  }

  return {
    id:         parseInt(r['ID']) || (i + 1),
    name:       String(r['Nama Produk'] || '').trim(),
    category:   category,
    brand:      brandName,
    brand_logo: brandLogo,
    image:      imgPath,
    desc:       String(r['Deskripsi'] || '').trim(),
    origin:     String(r['Asal Negara'] || '').trim(),
    weight:     weightVal,
    cert:       String(r['Sertifikasi'] || '').trim(),
    info:       String(r['Info Kemasan'] || '').trim()
  };
}).filter(p => p.name);

console.log(`[Products] ${products.length} products mapped`);
console.log(`[Categories in use] ${[...new Set(products.map(p => p.category))].join(', ')}`);

// ── 5. Save products.json ─────────────────────────────────────────────────
const productsJsonPath = path.join(CMS_DIR, 'products.json');
fs.writeFileSync(
  productsJsonPath,
  JSON.stringify(products, null, 2),
  'utf8'
);
console.log('[OK] products.json saved');

// ── 5b. Save produk.csv (Standard fallback) ─────────────────────────────
const productCsvHeaders = ['id', 'name', 'category', 'brand', 'brand_logo', 'image', 'desc', 'origin', 'weight', 'cert', 'info'];
const productCsvRows = [productCsvHeaders.join(',')];
products.forEach(p => {
  const row = productCsvHeaders.map(h => {
    let val = p[h] || '';
    if (h === 'id') val = String(val);
    // Escape quotes and wrap in quotes if contains comma
    val = String(val).replace(/"/g, '""');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      val = `"${val}"`;
    }
    return val;
  });
  productCsvRows.push(row.join(','));
});
fs.writeFileSync(
  path.join(ROOT, 'database', 'produk.csv'),
  productCsvRows.join('\n'),
  'utf8'
);
console.log('[OK] produk.csv updated');

// ── 6. Build & save brand_partners.json ──────────────────────────────────
const brandPartners = [];
let bpId = 1;
const seenBrands = {};
products.forEach(p => {
  const key = p.brand.toLowerCase().trim();
  if (!seenBrands[key]) {
    seenBrands[key] = true;
    brandPartners.push({
      id:       bpId++,
      name:     p.brand,
      logo:     p.brand_logo,
      logoData: ''
    });
  }
});
fs.writeFileSync(
  path.join(CMS_DIR, 'brand_partners.json'),
  JSON.stringify(brandPartners, null, 2),
  'utf8'
);
console.log(`[OK] brand_partners.json saved (${brandPartners.length} brands)`);

// ── 7. Update categories.json (Auto-sync all categories) ──────────────────
const catsPath = path.join(CMS_DIR, 'categories.json');
let cats = [];
if (fs.existsSync(catsPath)) {
  cats = JSON.parse(fs.readFileSync(catsPath, 'utf8'));
}

const usedCategories = [...new Set(products.map(p => p.category))];
const existingCatKeys = cats.map(c => c.key);

const catDefaults = {
  'snack': { title: 'Makanan Ringan', icon: 'fas fa-cookie' },
  'biskuit': { title: 'Biskuit & Cookies', icon: 'fas fa-cookie-bite' },
  'wafer': { title: 'Wafer', icon: 'fas fa-layer-group' },
  'kue': { title: 'Kue & Pastry', icon: 'fas fa-cake-candles' },
  'minuman': { title: 'Minuman', icon: 'fas fa-bottle-water' },
  'permen': { title: 'Permen', icon: 'fas fa-candy-cane' },
  'condiments': { title: 'Condiments', icon: 'fas fa-jar' },
  'noodle': { title: 'Instant Noodle', icon: 'fas fa-bowl-food' },
  'vegelicious': { title: 'Vegelicious', icon: 'fas fa-leaf' },
  'pudding': { title: 'Pudding', icon: 'fas fa-ice-cream' }
};

let catsChanged = false;
usedCategories.forEach(key => {
  if (!existingCatKeys.includes(key)) {
    const def = catDefaults[key] || { title: key.charAt(0).toUpperCase() + key.slice(1), icon: 'fas fa-th-large' };
    cats.push({
      key: key,
      title: def.title,
      desc: `Berbagai produk ${def.title.toLowerCase()} berkualitas tinggi.`,
      image: `assets/images/${key}.png`,
      imageData: '',
      icon: def.icon || 'fas fa-th-large'
    });
    catsChanged = true;
    console.log(`[Categories] Added new category: ${key}`);
  }
});

if (catsChanged) {
  fs.writeFileSync(catsPath, JSON.stringify(cats, null, 2), 'utf8');
  console.log('[OK] categories.json updated');
}

// ── 8. Update brands.csv ──────────────────────────────────────────────────
const csvLines = ['id,name,category,logo'];
brandPartners.forEach((b, i) => {
  const catList = [...new Set(
    products.filter(p => p.brand.toLowerCase() === b.name.toLowerCase()).map(p => p.category)
  )].join(',');
  csvLines.push(`${i + 1},"${b.name}","${catList}",${b.logo}`);
});
fs.writeFileSync(
  path.join(ROOT, 'database', 'brands.csv'),
  csvLines.join('\n') + '\n',
  'utf8'
);
console.log('[OK] brands.csv updated');

// ── 9. Summary ────────────────────────────────────────────────────────────
console.log('\n====== SYNC COMPLETE ======');
console.log(`Products  : ${products.length}`);
console.log(`Brands    : ${brandPartners.length}`);
console.log(`Categories: ${cats.length}`);
console.log('\nBrand → Logo mapping:');
brandPartners.forEach(b => {
  const hasLogo = b.logo ? '✓' : '✗ (missing!)';
  console.log(`  ${hasLogo}  ${b.name}  →  ${b.logo || 'NO LOGO FILE'}`);
});
