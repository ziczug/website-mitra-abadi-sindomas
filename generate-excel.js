/**
 * Script untuk generate Excel CMS produk
 * Jalankan: node generate-excel.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ==========================================
// DATA PRODUK
// ==========================================
const products = [
  { id: 1, name: "Super Ring", category: "snack", brand: "Oriental", brand_logo: "assets/images/brands/oriental.png", image: "assets/images/products/super-ring.png", desc: "Snack Makanan ringan berbentuk cincin dengan rasa keju premium renyah di mulut. Snack keju yang gurih dan renyah.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 2, name: "Cheese Balls", category: "snack", brand: "Oriental", brand_logo: "assets/images/brands/oriental.png", image: "assets/images/products/cheese-balls.png", desc: "Puff balls dengan rasa keju yang lezat, tekstur ringan and crunchy. Snack populer dari Malaysia.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 3, name: "Prawn Crackers", category: "snack", brand: "Oriental", brand_logo: "assets/images/brands/oriental.png", image: "assets/images/products/prawn-crackers.png", desc: "Kerupuk udang renyah dengan rasa seafood autentik. Cocok untuk camilan sehari-hari.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 4, name: "Green Pea Snack", category: "snack", brand: "Oriental", brand_logo: "assets/images/brands/oriental.png", image: "assets/images/products/green-pea.png", desc: "Snack kacang polong hijau yang renyah dan gurih. Camilan sehat dan lezat.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 5, name: "Potato Chips", category: "snack", brand: "Jacker", brand_logo: "assets/images/brands/jacker.png", image: "assets/images/products/potato-chips.png", desc: "Keripik kentang premium dengan bumbu original yang gurih. Dipotong tipis dan digoreng sempurna.", origin: "Malaysia", weight: "100g", cert: "Halal, BPOM", info: "100g x 12 Cans | QTY: 12 Pcs | 0.054 m³/Ctn" },
  { id: 6, name: "Butter Cookies", category: "biskuit", brand: "Zess", brand_logo: "assets/images/brands/zess.png", image: "assets/images/products/butter-cookies.png", desc: "Biskuit mentega premium dalam kemasan kaleng elegan. Berbagai bentuk dan varian rasa.", origin: "Malaysia", weight: "454g", cert: "Halal, BPOM", info: "454g x 12 Tins | QTY: 12 Pcs | 0.082 m³/Ctn" },
  { id: 7, name: "Cream Crackers", category: "biskuit", brand: "Zess", brand_logo: "assets/images/brands/zess.png", image: "assets/images/products/cream-crackers.png", desc: "Biskuit cream cracker klasik yang renyah dan gurih. Cocok untuk sarapan dan camilan.", origin: "Malaysia", weight: "350g", cert: "Halal, BPOM", info: "350g x 24 Packs | QTY: 24 Pcs | 0.095 m³/Ctn" },
  { id: 8, name: "Chocolate Wafer", category: "wafer", brand: "Jacker", brand_logo: "assets/images/brands/jacker.png", image: "assets/images/products/chocolate-wafer.png", desc: "Wafer berlapis dengan krim coklat premium. Tekstur renyah dengan rasa coklat yang kaya.", origin: "Malaysia", weight: "150g", cert: "Halal, BPOM", info: "150g x 24 Packs | QTY: 24 Pcs | 0.076 m³/Ctn" },
  { id: 9, name: "Vanilla Wafer Rolls", category: "wafer", brand: "Jacker", brand_logo: "assets/images/brands/jacker.png", image: "assets/images/products/vanilla-wafer.png", desc: "Wafer roll renyah dengan isian krim vanilla yang lembut. Bentuk stick yang mudah dinikmati.", origin: "Malaysia", weight: "120g", cert: "Halal, BPOM", info: "120g x 24 Packs | QTY: 24 Pcs | 0.068 m³/Ctn" },
  { id: 10, name: "Swiss Roll Chocolate", category: "kue", brand: "Fudo", brand_logo: "assets/images/brands/fudo.png", image: "assets/images/products/swiss-roll.png", desc: "Swiss roll lembut dengan lapisan krim coklat. Kue gulung premium dengan tekstur moist.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM", info: "432g (18g x 24) x 12 Boxes | QTY: 288 Pcs | 0.045 m³/Ctn" },
  { id: 11, name: "Layer Cake Strawberry", category: "kue", brand: "Fudo", brand_logo: "assets/images/brands/fudo.png", image: "assets/images/products/layer-cake.png", desc: "Layer cake dengan krim strawberry yang lezat. Lapisan sponge cake lembut berlapis krim.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM", info: "432g (18g x 24) x 12 Boxes | QTY: 288 Pcs | 0.045 m³/Ctn" },
  { id: 12, name: "Tropical Fruit Juice", category: "minuman", brand: "Oriental", brand_logo: "assets/images/brands/oriental.png", image: "assets/images/products/fruit-juice.png", desc: "Jus buah tropis segar dengan rasa mangga alami. Dibuat dari konsentrat buah pilihan.", origin: "Malaysia", weight: "250ml", cert: "Halal, BPOM", info: "250ml x 24 Tins | QTY: 24 Pcs | 0.032 m³/Ctn" }
];

// ==========================================
// DATA MEREK (BRANDS) dengan Kategori
// ==========================================
const brands = [
  { id: 1, name: "ORIENTAL", category: "snack,minuman", logo: "assets/logobrands/oriental.jpg" },
  { id: 2, name: "JACKER", category: "snack,wafer", logo: "assets/logobrands/jacker.jpg" },
  { id: 3, name: "FUDO", category: "kue", logo: "assets/logobrands/fudo.jpg" },
  { id: 4, name: "ZESS", category: "biskuit", logo: "assets/logobrands/zess.jpg" },
  { id: 5, name: "WIN2", category: "snack", logo: "assets/logobrands/win2.jpg" },
  { id: 6, name: "KOLAKIDS", category: "snack", logo: "assets/logobrands/kolakids.jpg" },
  { id: 7, name: "POTATO CRIPS", category: "snack", logo: "assets/logobrands/potato-crips.jpg" },
  { id: 8, name: "BAKE STORY", category: "biskuit", logo: "assets/logobrands/bake-story.jpg" },
  { id: 9, name: "TOMO", category: "snack", logo: "assets/logobrands/tomo.jpg" },
  { id: 10, name: "IBUMIE", category: "snack", logo: "assets/logobrands/ibumie.jpg" },
  { id: 11, name: "TELLY", category: "snack", logo: "assets/logobrands/telly.jpg" },
  { id: 12, name: "VEGGILICIOUS", category: "snack", logo: "assets/logobrands/veggilicious.jpg" },
  { id: 13, name: "A-TASTE", category: "biskuit", logo: "assets/logobrands/a-taste.jpg" },
  { id: 14, name: "HUANG XIAO GU!", category: "snack", logo: "assets/logobrands/huang-xiao-gu.jpg" },
  { id: 15, name: "VETRUE", category: "biskuit", logo: "assets/logobrands/vetrue.jpg" },
  { id: 16, name: "HUI XIANG ZHAI ZI", category: "snack", logo: "assets/logobrands/hui-xiang-zhai-zi.jpg" },
  { id: 17, name: "KISS DELICIAS", category: "snack", logo: "assets/logobrands/kiss-delicias.jpg" },
  { id: 18, name: "YAMAMOTO KAWAHIRO", category: "snack", logo: "assets/logobrands/yamamoto-kawahiro.jpg" },
  { id: 19, name: "MIKKU", category: "snack", logo: "assets/logobrands/mikku.jpg" },
  { id: 20, name: "TAWANDANG", category: "snack", logo: "assets/logobrands/tawandang.jpg" },
  { id: 21, name: "SWECCO", category: "biskuit", logo: "assets/logobrands/swecco.jpg" },
  { id: 22, name: "XIDUODONG", category: "snack", logo: "assets/logobrands/xiduodong.jpg" },
  { id: 23, name: "SHUANG-JIAO", category: "snack", logo: "assets/logobrands/shuang-jiao.jpg" },
  { id: 24, name: "MASTER JH", category: "snack", logo: "assets/logobrands/master-jh.jpg" }
];

// ==========================================
// CREATE WORKBOOK
// ==========================================
const wb = XLSX.utils.book_new();

// ----- SHEET 1: DATA PRODUK -----
const headers = ['id', 'name', 'category', 'brand', 'brand_logo', 'image', 'desc', 'origin', 'weight', 'cert', 'info'];
const headerLabels = ['ID', 'Nama Produk', 'Kategori', 'Brand', 'Logo Brand (Path)', 'Path Gambar', 'Deskripsi', 'Asal Negara', 'Berat/Ukuran', 'Sertifikasi', 'Informasi Tambahan'];

const wsData = [headerLabels];
products.forEach(p => {
  wsData.push([p.id, p.name, p.category, p.brand, p.brand_logo, p.image, p.desc, p.origin, p.weight, p.cert, p.info]);
});

const ws = XLSX.utils.aoa_to_sheet(wsData);
ws['!cols'] = [
  { wch: 5 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, 
  { wch: 45 }, { wch: 70 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 50 },
];
XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');

// ----- SHEET 2: DATA MEREK -----
const brandHeaders = ['id', 'name', 'category', 'logo'];
const brandHeaderLabels = ['ID', 'Nama Brand', 'Kategori Terkait', 'Logo Brand (Path)'];
const wsBrandData = [brandHeaderLabels];
brands.forEach(b => {
  wsBrandData.push([b.id, b.name, b.category, b.logo]);
});
const wsBrands = XLSX.utils.aoa_to_sheet(wsBrandData);
wsBrands['!cols'] = [
  { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 50 }
];
XLSX.utils.book_append_sheet(wb, wsBrands, 'Data Merek');

// ----- SHEET 3: PANDUAN -----
const guideData = [
  ['📊 PANDUAN CMS - PT MITRA ABADI SINDOMAS'],
  [''],
  ['CARA UPDATE DATA:'],
  ['1. Edit data di sheet "Data Produk" atau "Data Merek"'],
  ['2. Simpan file ini (Ctrl+S)'],
  ['3. Export sheet ke CSV:'],
  ['   a. Sheet "Data Produk" -> Save As CSV UTF-8 dengan nama "produk.csv"'],
  ['   b. Sheet "Data Merek" -> Save As CSV UTF-8 dengan nama "brands.csv"'],
  ['4. Simpan kedua CSV di folder "database/"'],
  ['5. Refresh website'],
  [''],
  ['PENTING:'],
  ['- Logo Brand di sheet Produk akan mengambil dari folder "assets/images/brands/"'],
  ['- Logo Brand di sheet Merek juga mengambil dari folder yang sama'],
  ['- Di sheet Merek, kolom Kategori bisa diisi lebih dari satu (pisahkan dengan koma), misal: snack,wafer'],
  ['- Kategori yang didukung: snack, biskuit, wafer, kue, minuman, permen, condiments, noodle, vegelicious'],
  ['- Jika Logo kosong, website akan otomatis menampilkan Inisial Huruf Brand'],
];

const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

// ==========================================
// SAVE FILE
// ==========================================
const outputPath = path.join(__dirname, 'database', 'CMS_Mitra_Abadi.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('✅ File Excel berhasil dibuat:', outputPath);

// REGENERATE CSVs
// --- produk.csv ---
const csvContent = [headers.join(','), ...products.map(p => [
  p.id, p.name, p.category, p.brand, p.brand_logo, p.image, `"${p.desc}"`, p.origin, p.weight, `"${p.cert}"`, `"${p.info}"`
].join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'database', 'produk.csv'), csvContent, 'utf-8');

// --- brands.csv ---
const brandCsvContent = [brandHeaders.join(','), ...brands.map(b => [
  b.id, `"${b.name}"`, `"${b.category}"`, b.logo
].join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'database', 'brands.csv'), brandCsvContent, 'utf-8');

console.log('✅ Database CSV (produk.csv & brands.csv) berhasil disinkronisasi.');
