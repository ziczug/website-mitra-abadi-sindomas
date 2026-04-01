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
  { id: 1, name: "Super Ring", category: "snack", brand: "Oriental", image: "assets/images/products/super-ring.png", desc: "Makanan ringan berbentuk cincin dengan rasa keju yang gurih dan renyah. Favorit anak-anak dan dewasa.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM" },
  { id: 2, name: "Cheese Balls", category: "snack", brand: "Oriental", image: "assets/images/products/cheese-balls.png", desc: "Puff balls dengan rasa keju yang lezat, tekstur ringan dan crunchy. Snack populer dari Malaysia.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM" },
  { id: 3, name: "Prawn Crackers", category: "snack", brand: "Oriental", image: "assets/images/products/prawn-crackers.png", desc: "Kerupuk udang renyah dengan rasa seafood autentik. Cocok untuk camilan sehari-hari.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM" },
  { id: 4, name: "Green Pea Snack", category: "snack", brand: "Oriental", image: "assets/images/products/green-pea.png", desc: "Snack kacang polong hijau yang renyah dan gurih. Camilan sehat dan lezat.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM" },
  { id: 5, name: "Potato Chips", category: "snack", brand: "Jacker", image: "assets/images/products/potato-chips.png", desc: "Keripik kentang premium dengan bumbu original yang gurih. Dipotong tipis dan digoreng sempurna.", origin: "Malaysia", weight: "100g", cert: "Halal, BPOM" },
  { id: 6, name: "Butter Cookies", category: "biskuit", brand: "Zess", image: "assets/images/products/butter-cookies.png", desc: "Biskuit mentega premium dalam kemasan kaleng elegan. Berbagai bentuk dan varian rasa.", origin: "Malaysia", weight: "454g", cert: "Halal, BPOM" },
  { id: 7, name: "Cream Crackers", category: "biskuit", brand: "Zess", image: "assets/images/products/cream-crackers.png", desc: "Biskuit cream cracker klasik yang renyah dan gurih. Cocok untuk sarapan dan camilan.", origin: "Malaysia", weight: "350g", cert: "Halal, BPOM" },
  { id: 8, name: "Chocolate Wafer", category: "wafer", brand: "Jacker", image: "assets/images/products/chocolate-wafer.png", desc: "Wafer berlapis dengan krim coklat premium. Tekstur renyah dengan rasa coklat yang kaya.", origin: "Malaysia", weight: "150g", cert: "Halal, BPOM" },
  { id: 9, name: "Vanilla Wafer Rolls", category: "wafer", brand: "Jacker", image: "assets/images/products/vanilla-wafer.png", desc: "Wafer roll renyah dengan isian krim vanilla yang lembut. Bentuk stick yang mudah dinikmati.", origin: "Malaysia", weight: "120g", cert: "Halal, BPOM" },
  { id: 10, name: "Swiss Roll Chocolate", category: "kue", brand: "Fudo", image: "assets/images/products/swiss-roll.png", desc: "Swiss roll lembut dengan lapisan krim coklat. Kue gulung premium dengan tekstur moist.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM" },
  { id: 11, name: "Layer Cake Strawberry", category: "kue", brand: "Fudo", image: "assets/images/products/layer-cake.png", desc: "Layer cake dengan krim strawberry yang lezat. Lapisan sponge cake lembut berlapis krim.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM" },
  { id: 12, name: "Tropical Fruit Juice", category: "minuman", brand: "Oriental", image: "assets/images/products/fruit-juice.png", desc: "Jus buah tropis segar dengan rasa mangga alami. Dibuat dari konsentrat buah pilihan.", origin: "Malaysia", weight: "250ml", cert: "Halal, BPOM" }
];

// ==========================================
// CREATE WORKBOOK
// ==========================================
const wb = XLSX.utils.book_new();

// ----- SHEET 1: DATA PRODUK -----
const headers = ['id', 'name', 'category', 'brand', 'image', 'desc', 'origin', 'weight', 'cert'];
const headerLabels = ['ID', 'Nama Produk', 'Kategori', 'Brand', 'Path Gambar', 'Deskripsi', 'Asal Negara', 'Berat/Ukuran', 'Sertifikasi'];

const wsData = [headerLabels];
products.forEach(p => {
  wsData.push([p.id, p.name, p.category, p.brand, p.image, p.desc, p.origin, p.weight, p.cert]);
});

const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
  { wch: 5 },   // ID
  { wch: 24 },  // Nama Produk
  { wch: 14 },  // Kategori
  { wch: 14 },  // Brand
  { wch: 45 },  // Path Gambar
  { wch: 70 },  // Deskripsi
  { wch: 14 },  // Asal Negara
  { wch: 14 },  // Berat
  { wch: 16 },  // Sertifikasi
];

XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');

// ----- SHEET 2: PANDUAN -----
const guideData = [
  ['📊 PANDUAN CMS PRODUK - PT MITRA ABADI SINDOMAS'],
  [''],
  ['CARA UPDATE PRODUK:'],
  ['1. Edit data di sheet "Data Produk"'],
  ['2. Simpan file ini (Ctrl+S)'],
  ['3. Buka file ini lagi, lalu Save As → CSV UTF-8 (Comma delimited) (*.csv)'],
  ['4. Simpan dengan nama "produk.csv" di folder "database/"'],
  ['5. Refresh halaman website untuk melihat perubahan'],
  [''],
  ['ALTERNATIF: Upload langsung di website'],
  ['1. Buka halaman produk di browser'],
  ['2. Klik tombol CSV (📊) di pojok kanan bawah'],
  ['3. Pilih file CSV yang sudah di-export dari Excel'],
  [''],
  ['KOLOM YANG TERSEDIA:'],
  ['Kolom', 'Keterangan', 'Contoh', 'Wajib?'],
  ['id', 'Nomor urut unik produk', '1, 2, 3, ...', 'YA'],
  ['name', 'Nama produk', 'Super Ring', 'YA'],
  ['category', 'Kategori produk (huruf kecil)', 'snack, biskuit, wafer, kue, minuman', 'YA'],
  ['brand', 'Nama brand/merek', 'Oriental, Jacker, Zess, Fudo', 'YA'],
  ['image', 'Path file gambar (relatif)', 'assets/images/products/nama-file.png', 'YA'],
  ['desc', 'Deskripsi produk', 'Makanan ringan yang lezat...', 'YA'],
  ['origin', 'Negara asal produk', 'Malaysia', 'TIDAK'],
  ['weight', 'Berat atau ukuran produk', '60g, 250ml, 18g x 24', 'TIDAK'],
  ['cert', 'Sertifikasi produk', 'Halal, BPOM', 'TIDAK'],
  [''],
  ['KATEGORI YANG TERSEDIA:'],
  ['Kode Kategori', 'Label di Website'],
  ['snack', 'Makanan Ringan'],
  ['biskuit', 'Biskuit'],
  ['wafer', 'Wafer'],
  ['kue', 'Kue & Pastry'],
  ['minuman', 'Minuman'],
  [''],
  ['TIPS GAMBAR:'],
  ['- Format: PNG dengan background transparan (direkomendasikan)'],
  ['- Ukuran ideal: 500x500 pixel'],
  ['- Simpan di folder: assets/images/products/'],
  ['- Nama file: huruf kecil, gunakan strip (-) untuk spasi'],
  ['  Contoh: cheese-balls.png, swiss-roll.png'],
  [''],
  ['PENTING:'],
  ['- JANGAN ubah nama header/kolom di baris pertama sheet "Data Produk"'],
  ['- Saat Save As CSV, pilih format "CSV UTF-8" agar karakter Indonesia tampil benar'],
  ['- Header yang benar (huruf kecil): id,name,category,brand,image,desc,origin,weight,cert'],
];

const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
wsGuide['!cols'] = [
  { wch: 55 },
  { wch: 40 },
  { wch: 40 },
  { wch: 12 },
];

// Merge cells for title
wsGuide['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
];

XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

// ----- SHEET 3: TEMPLATE TAMBAH PRODUK -----
const templateData = [
  ['TEMPLATE TAMBAH PRODUK BARU'],
  ['Isi data di bawah, lalu copy-paste ke sheet "Data Produk"'],
  [''],
  headerLabels,
  [13, 'Nama Produk Baru', 'snack', 'Nama Brand', 'assets/images/products/nama-file.png', 'Deskripsi produk di sini...', 'Malaysia', '100g', 'Halal, BPOM'],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
];

const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
wsTemplate['!cols'] = ws['!cols'];
wsTemplate['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
];

XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Tambah');

// ==========================================
// SAVE FILE
// ==========================================
const outputPath = path.join(__dirname, 'database', 'CMS_Produk_MitraAbadi.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('✅ File Excel berhasil dibuat:', outputPath);
console.log('📊 Total produk:', products.length);

// Also regenerate CSV to ensure sync
const csvHeaders = headers.join(',');
const csvRows = products.map(p => {
  return [
    p.id,
    p.name,
    p.category,
    p.brand,
    p.image,
    `"${p.desc}"`,
    p.origin,
    p.weight,
    `"${p.cert}"`
  ].join(',');
});
const csvContent = [csvHeaders, ...csvRows].join('\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'database', 'produk.csv'), csvContent, 'utf-8');
console.log('✅ File CSV juga di-regenerate untuk sinkronisasi');
