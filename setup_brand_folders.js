/**
 * setup_brand_folders.js
 * ─────────────────────────────────────────────
 * 1. Buat folder per brand di assets/images/products/
 * 2. Buat README.md di setiap folder sebagai panduan upload
 * 3. Update products.json agar field `image` mengarah ke folder brand
 * 4. Buat INDEX lengkap (daftar nama file yang dibutuhkan per brand)
 *
 * Jalankan: node setup_brand_folders.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = __dirname;
const PRODUCTS_PATH = path.join(ROOT, 'database', 'cms', 'products.json');
const IMG_BASE   = path.join(ROOT, 'assets', 'images', 'products');

// ── Slug helper ──────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // hapus karakter aneh
    .trim()
    .replace(/\s+/g, '-')           // spasi → dash
    .replace(/-+/g, '-');           // double dash → single
}

// ── Load products ─────────────────────────────────────────────────────────────
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

// ── Kumpulkan info per brand ───────────────────────────────────────────────
const brandMap = {}; // brandSlug → { brandName, products[] }
products.forEach(p => {
  const slug = toSlug(p.brand);
  if (!brandMap[slug]) brandMap[slug] = { name: p.brand, products: [] };
  brandMap[slug].products.push(p);
});

// ── Buat folder & update image path ──────────────────────────────────────────
let updatedCount = 0;
const summary = [];

Object.entries(brandMap).forEach(([brandSlug, { name, products: brandProducts }]) => {
  const brandDir = path.join(IMG_BASE, brandSlug);

  // Buat folder jika belum ada
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
    console.log(`[CREATED] ${brandDir}`);
  } else {
    console.log(`[EXISTS]  ${brandDir}`);
  }

  // Daftar file yang dibutuhkan untuk README
  const fileList = [];

  brandProducts.forEach(p => {
    // Get filename from current image path or generate fallback
    let fileName = '';
    if (p.image) {
      fileName = path.basename(p.image);
    } else {
      const productSlug = toSlug(p.name);
      fileName = `${productSlug}.png`;
      p.image = `assets/images/products/${brandSlug}/${fileName}`;
    }

    // Ensure path in products.json is correct
    const idx = products.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      products[idx].image = p.image;
    }

    fileList.push({ id: p.id, name: p.name, file: fileName, path: p.image });
  });

  // ── Tulis README.md ──────────────────────────────────────────────────────
  const readmeLines = [
    `# 📦 ${name} — Folder Gambar Produk`,
    ``,
    `Folder ini berisi gambar produk untuk brand **${name}**.`,
    ``,
    `## 📋 Daftar File yang Dibutuhkan`,
    ``,
    `| ID | Nama Produk | Nama File |`,
    `|----|-------------|-----------|`,
    ...fileList.map(f => `| ${f.id} | ${f.name} | \`${f.file}\` |`),
    ``,
    `## 📌 Panduan Upload`,
    ``,
    `- Format yang disarankan: **JPG/PNG**`,
    `- Ukuran maks: **2MB per file**`,
    `- Resolusi disarankan: **400×400 px** atau lebih (ratio 1:1)`,
    `- Nama file **HARUS PERSIS** seperti kolom "Nama File" di atas`,
    `- Setelah upload, jalankan \`node sync_cms.js\` untuk sinkronkan ke dashboard`,
    ``,
    `## 🔗 Path yang digunakan di sistem`,
    ``,
    `\`\`\``,
    `assets/images/products/${brandSlug}/{nama-file}`,
    `\`\`\``,
  ];

  fs.writeFileSync(
    path.join(brandDir, 'README.md'),
    readmeLines.join('\n'),
    'utf8'
  );

  summary.push({ brand: name, slug: brandSlug, count: fileList.length, files: fileList });
});

// ── Simpan products.json yang sudah diupdate ──────────────────────────────────
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf8');
console.log(`\n[OK] products.json diperbarui`);

// ── Buat INDEX.md global di assets/images/products/ ─────────────────────────
const indexLines = [
  `# 🗂️ Index Gambar Produk — PT Mitra Abadi Sindomas`,
  ``,
  `> Generated: ${new Date().toLocaleString('id-ID')}`,
  ``,
  `## Ringkasan Folder Brand`,
  ``,
  `| Brand | Folder | Jumlah Produk |`,
  `|-------|--------|---------------|`,
  ...summary.map(s => `| ${s.brand} | \`assets/images/products/${s.slug}/\` | ${s.count} produk |`),
  ``,
  `## Detail per Brand`,
  ``,
];

summary.forEach(s => {
  indexLines.push(`### 🏷️ ${s.brand}`);
  indexLines.push(`Folder: \`assets/images/products/${s.slug}/\``);
  indexLines.push(``);
  indexLines.push(`| ID | Nama Produk | File |`);
  indexLines.push(`|----|-------------|------|`);
  s.files.forEach(f => indexLines.push(`| ${f.id} | ${f.name} | \`${f.file}\` |`));
  indexLines.push(``);
});

fs.writeFileSync(
  path.join(IMG_BASE, 'INDEX.md'),
  indexLines.join('\n'),
  'utf8'
);
console.log(`[OK] INDEX.md dibuat di assets/images/products/`);

// ── Print summary ─────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(55)}`);
console.log(`SELESAI — Folder Brand Dibuat`);
console.log(`${'='.repeat(55)}`);
summary.forEach(s => {
  console.log(`  📁 ${s.slug.padEnd(28)} ${s.count} produk`);
});
console.log(`${'─'.repeat(55)}`);
console.log(`  Total brand  : ${summary.length}`);
console.log(`  Total produk : ${products.length}`);
console.log(`  Path diupdate: ${updatedCount}`);
console.log(`${'='.repeat(55)}`);
console.log(`\nSelanjutnya:`);
console.log(`  1. Upload gambar ke masing-masing folder brand`);
console.log(`  2. Nama file harus sesuai dengan README.md di setiap folder`);
console.log(`  3. Jalankan node sync_cms.js setelah semua upload selesai`);
