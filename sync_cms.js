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
  const brandName = (r['Brand'] || '').trim();
  const logoFromExcel = (r['Logo Brand'] || '').trim();
  const brandLogo = logoFromExcel || getBrandLogo(brandName);
  const catRaw = (r['Kategori'] || '').toLowerCase().trim();
  const category = catKeyMap[catRaw] || catRaw;
  const weightVal = (r['Berat/Ukuran'] !== undefined ? String(r['Berat/Ukuran']).trim() : '')
    .replace(/(\d+)\s*gr\b/gi, '$1g');

  const originalName = String(r['Nama Produk'] || '').trim()
    .replace(/Garlic Butte\b/g, 'Garlic Butter')
    .replace(/\bChia\b(?!\s+Seed)/gi, 'Chia Seed')
    .replace(/Sadwich/gi, 'Sandwich')
    .replace(/Vannila/gi, 'Vanilla')
    .replace(/Chiken/gi, 'Chicken')
    .replace(/Sasame/gi, 'Sesame')
    .replace(/Craker/gi, 'Cracker')
    .replace(/Gingseng/gi, 'Ginseng')
    .replace(/Natural Flavor Potato Crisps/gi, 'Natural Flavor Potato Chips')
    .replace(/Hot & Spicy Flavor Potato Crisps/gi, 'Hot & Spicy Flavor Potato Chips')
    .replace(/Barbecue Flavor Potato Crisps/gi, 'Barbecue Flavor Potato Chips')
    .replace(/Spicy Mala Hot Pot Flavor Potato Crisps/gi, 'Spicy Mala Hot Pot Flavor Potato Chips')
    .replace(/(\d+)\s*gr\b/gi, '$1g');

  // New naming standard: Brand - Product Name Weight
  // If originalName already starts with brandName (case insensitive), don't prepend it again
  let displayName = originalName.toLowerCase().startsWith(brandName.toLowerCase()) 
    ? originalName 
    : `${brandName} - ${originalName}`;
    
  if (weightVal && !originalName.toLowerCase().includes(weightVal.toLowerCase())) {
    displayName += ` ${weightVal}`;
  }
  
  const brandSlug = toSlug(brandName);
  const prodSlug = toSlug(originalName);

  // Convert weight for filename: g → gr, ml → mlgr (matching README convention)
  let fileWeight = weightVal
    .replace(/(\d+[\d.]*)g$/i, '$1gr')
    .replace(/(\d+[\d.]*)ml$/i, '$1mlgr');

  // Standard path: brand-folder/product-slug + weight + .png (README convention)
  let imgPathSuffix = `${prodSlug}${fileWeight}`;
  
  // If slug already contains the weight, don't duplicate it (avoids ...100g100gr.png)
  const weightSlug = toSlug(fileWeight);
  const rawWeightSlug = toSlug(weightVal);
  if (prodSlug.endsWith(weightSlug) || prodSlug.endsWith(rawWeightSlug)) {
    imgPathSuffix = prodSlug;
  }

  let imgPath = `assets/images/products/${brandSlug}/${imgPathSuffix}.png`;

  // --- FALLBACK LOGIC ---
  const fullPath = path.join(ROOT, imgPath);
  if (!fs.existsSync(fullPath)) {
    const pLower = originalName.toLowerCase();
    const bLower = brandName.toLowerCase();

    // Jacker Potato Chips/Crisps
    if (bLower === 'jacker' && pLower.includes('potato')) {
      if (pLower.includes('hot & spicy')) {
        imgPath = `assets/images/products/${brandSlug}/hot-spicy-flavor-potato-chips60gr.png`;
      } else if (pLower.includes('barbecue')) {
        imgPath = `assets/images/products/${brandSlug}/barbecue-flavor-potato-chips60gr.png`;
      } else if (pLower.includes('mexican hot sauce')) {
        imgPath = `assets/images/products/${brandSlug}/wavy-chips-mexican-hot-sauce60gr.png`;
      } else {
        const original60 = `assets/images/products/${brandSlug}/original-flavor-potato-crisps60gr.png`;
        if (fs.existsSync(path.join(ROOT, original60))) imgPath = original60;
      }
    } 
    // Zees Sandwich Crackers
    else if (bLower === 'zees' && pLower.includes('sandwich cracker')) {
      let flavor = '';
      if (pLower.includes('chocolate')) flavor = 'chocolate';
      else if (pLower.includes('lemon')) flavor = 'lemon';
      else if (pLower.includes('cheese')) flavor = 'cheese';
      
      if (flavor) {
        const fallback180 = `assets/images/products/${brandSlug}/sandwich-cracker-${flavor}180gr.png`;
        if (fs.existsSync(path.join(ROOT, fallback180))) imgPath = fallback180;
      }
    }
    // Win2 Croutons
    else if (bLower === 'win2' && pLower.includes('croutons')) {
      let flavor = '';
      if (pLower.includes('honey mustard')) flavor = 'honey-mustard';
      else if (pLower.includes('margarine sugar')) flavor = 'margarine-sugar';
      else if (pLower.includes('garlic butter')) flavor = 'garlic-butter';
      
      if (flavor) {
        const fallback30 = `assets/images/products/${brandSlug}/${flavor}-croutons30gr.png`;
        if (fs.existsSync(path.join(ROOT, fallback30))) imgPath = fallback30;
      }
    }
    // Zees Original Cream Crackers
    else if (bLower === 'zees' && pLower.includes('original cream crackers')) {
      const fallback184 = `assets/images/products/${brandSlug}/original-cream-crackers184gr.png`;
      if (fs.existsSync(path.join(ROOT, fallback184))) imgPath = fallback184;
    }
  }

  // Fallback: If generated path doesn't exist but Excel path does, check it
  const excelImgPath = String(r['Gambar'] || '').trim().replace(/\.jpg$/i, '.png');
  const currentPath = path.join(ROOT, imgPath);
  if (!fs.existsSync(currentPath) && excelImgPath) {
    let candidate = '';
    if (excelImgPath.startsWith('assets/images/products/')) {
      candidate = excelImgPath;
    } else {
      candidate = `assets/images/products/${brandSlug}/${excelImgPath}`;
    }
    
    if (fs.existsSync(path.join(ROOT, candidate))) {
      imgPath = candidate;
    }
  }

  return {
    id: parseInt(r['ID']) || (i + 1),
    name: displayName,
    category: category,
    brand: brandName,
    brand_logo: brandLogo,
    image: imgPath.replace(/garlic-butte\b/g, 'garlic-butter')
      .replace(/-chia(?![-\w]*seed)/gi, '-chia-seed')
      .replace(/sadwich/gi, 'sandwich')
      .replace(/vannila/gi, 'vanilla')
      .replace(/chiken/gi, 'chicken')
      .replace(/sasame/gi, 'sesame')
      .replace(/craker/gi, 'cracker')
      .replace(/gingseng/gi, 'ginseng'),
    desc: String(r['Deskripsi'] || '').trim().replace(/(\d+)\s*gr\b/gi, '$1g'),
    origin: String(r['Asal Negara'] || '').trim(),
    weight: weightVal.replace(/(\d+)\s*gr\b/gi, '$1g'),
    cert: String(r['Sertifikasi'] || '').trim()
      .replace(/halal\.?\s*bpom/gi, 'HALAL & BPOM')
      .replace(/bpom\.?\s*halal/gi, 'HALAL & BPOM')
      .replace(/(\d+)\s*gr\b/gi, '$1g'),
    info: String(r['Info Kemasan'] || '').trim().replace(/(\d+)\s*gr\b/gi, '$1g')
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
      id: bpId++,
      name: p.brand,
      logo: p.brand_logo,
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

// ── 7. Update categories.json ─────────────────────────────────────────────
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

console.log('\n====== SYNC COMPLETE ======');
