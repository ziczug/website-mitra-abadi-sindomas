/**
 * Generate Excel CMS Produk - PT Mitra Abadi Sindomas
 * Jalankan: node generate-excel.js
 * 
 * File ini membuat Excel yang user-friendly dengan:
 * - Sheet 1: Data Produk (tabel utama, langsung edit di sini)
 * - Sheet 2: Panduan Lengkap (cara pakai + aturan gambar)
 * - Sheet 3: Template Tambah Produk (copy-paste ke Sheet 1)
 * - Sheet 4: Daftar Kategori & Brand (referensi)
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

// ===== SHEET 1: DATA PRODUK =====
const headers = ['id', 'name', 'category', 'brand', 'image', 'desc', 'origin', 'weight', 'cert'];
const headerLabels = ['ID', 'Nama Produk', 'Kategori', 'Brand', 'Nama File Gambar', 'Deskripsi', 'Asal Negara', 'Berat/Ukuran', 'Sertifikasi'];

const wsData = [headerLabels];
products.forEach(p => {
  // Kolom image hanya perlu nama file, bukan full path
  const imageFileName = p.image.split('/').pop(); // super-ring.png
  wsData.push([p.id, p.name, p.category, p.brand, imageFileName, p.desc, p.origin, p.weight, p.cert]);
});

const ws = XLSX.utils.aoa_to_sheet(wsData);
ws['!cols'] = [
  { wch: 5 },   // ID
  { wch: 24 },  // Nama Produk
  { wch: 14 },  // Kategori
  { wch: 14 },  // Brand
  { wch: 28 },  // Nama File Gambar
  { wch: 60 },  // Deskripsi
  { wch: 14 },  // Asal Negara
  { wch: 14 },  // Berat
  { wch: 16 },  // Sertifikasi
];

// Freeze header row
ws['!freeze'] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');

// ===== SHEET 2: PANDUAN LENGKAP =====
const guideData = [
  ['📊 PANDUAN CMS PRODUK — PT MITRA ABADI SINDOMAS'],
  [''],
  ['════════════════════════════════════════════════════'],
  ['  CARA UPDATE PRODUK DI WEBSITE'],
  ['════════════════════════════════════════════════════'],
  [''],
  ['LANGKAH 1: Edit data di sheet "Data Produk"'],
  ['  → Ubah nama, kategori, brand, deskripsi, dll langsung di tabel'],
  ['  → Untuk tambah produk baru, isi baris baru di bawah data terakhir'],
  ['  → Untuk hapus produk, hapus barisnya'],
  [''],
  ['LANGKAH 2: Simpan sebagai CSV'],
  ['  → Klik File → Save As'],
  ['  → Pilih format: CSV UTF-8 (Comma delimited) (*.csv)'],
  ['  → Simpan dengan nama: produk.csv'],
  [''],
  ['LANGKAH 3: Upload ke server'],
  ['  → Upload file produk.csv ke folder database/ di server website'],
  ['  → Refresh halaman produk untuk melihat perubahan'],
  [''],
  ['ALTERNATIF: Gunakan Admin Dashboard'],
  ['  → Buka halaman admin.html di browser'],
  ['  → Login dengan PIN'],
  ['  → Upload file CSV/Excel langsung dari menu Import/Export'],
  [''],
  ['════════════════════════════════════════════════════'],
  ['  ATURAN GAMBAR PRODUK'],
  ['════════════════════════════════════════════════════'],
  [''],
  ['Di kolom "Nama File Gambar", isi HANYA nama file gambar.'],
  ['Contoh: super-ring.png, cheese-balls.png'],
  [''],
  ['ATURAN NAMA FILE GAMBAR:'],
  ['  ✅ Gunakan huruf kecil semua'],
  ['  ✅ Gunakan tanda strip (-) untuk spasi'],
  ['  ✅ Format yang didukung: .png, .jpg, .jpeg, .webp'],
  ['  ✅ Ukuran ideal: 500x500 pixel'],
  ['  ✅ Background transparan (PNG) direkomendasikan'],
  [''],
  ['  ❌ JANGAN gunakan spasi di nama file'],
  ['  ❌ JANGAN gunakan huruf kapital'],
  ['  ❌ JANGAN gunakan karakter spesial (!@#$%^&)'],
  [''],
  ['CONTOH BENAR:'],
  ['  Nama Produk          →  Nama File Gambar'],
  ['  Super Ring            →  super-ring.png'],
  ['  Cheese Balls          →  cheese-balls.png'],
  ['  Swiss Roll Chocolate  →  swiss-roll-chocolate.png'],
  ['  Tropical Fruit Juice  →  tropical-fruit-juice.png'],
  [''],
  ['CARA UPLOAD GAMBAR:'],
  ['  1. Siapkan foto produk (crop 1:1, background putih/transparan)'],
  ['  2. Rename file sesuai aturan di atas'],
  ['  3. Upload file gambar ke folder: assets/images/products/ di server'],
  ['  4. Isi nama file di kolom "Nama File Gambar" di Excel ini'],
  [''],
  ['CATATAN: Gambar disimpan TERPISAH dari file Excel.'],
  ['Excel hanya menyimpan NAMA FILE, bukan gambar itu sendiri.'],
  [''],
  ['════════════════════════════════════════════════════'],
  ['  PENJELASAN KOLOM'],
  ['════════════════════════════════════════════════════'],
  [''],
  ['Kolom', 'Keterangan', 'Wajib?', 'Contoh'],
  ['ID', 'Nomor urut unik (angka)', 'YA', '1, 2, 3, ...'],
  ['Nama Produk', 'Nama produk yang tampil di website', 'YA', 'Super Ring'],
  ['Kategori', 'Kode kategori (huruf kecil, lihat Sheet 4)', 'YA', 'snack'],
  ['Brand', 'Nama brand/merek produk', 'YA', 'Oriental'],
  ['Nama File Gambar', 'Nama file gambar (lihat aturan di atas)', 'YA', 'super-ring.png'],
  ['Deskripsi', 'Penjelasan produk (1-2 kalimat)', 'YA', 'Makanan ringan rasa keju...'],
  ['Asal Negara', 'Negara asal produk', 'TIDAK', 'Malaysia'],
  ['Berat/Ukuran', 'Berat atau volume produk', 'TIDAK', '60g, 250ml'],
  ['Sertifikasi', 'Sertifikasi yang dimiliki', 'TIDAK', 'Halal, BPOM'],
  [''],
  ['════════════════════════════════════════════════════'],
  ['  PENTING!'],
  ['════════════════════════════════════════════════════'],
  [''],
  ['⚠️  JANGAN ubah nama kolom di baris pertama sheet "Data Produk"'],
  ['⚠️  Saat Save As CSV, WAJIB pilih format "CSV UTF-8"'],
  ['⚠️  ID harus unik (tidak boleh duplikat)'],
  ['⚠️  Kategori harus sesuai daftar di Sheet 4'],
];

const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
wsGuide['!cols'] = [
  { wch: 60 },
  { wch: 45 },
  { wch: 12 },
  { wch: 30 },
];
wsGuide['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
];
XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

// ===== SHEET 3: TEMPLATE TAMBAH PRODUK =====
const templateData = [
  ['📝 TEMPLATE TAMBAH PRODUK BARU'],
  ['Isi data di baris kuning, lalu COPY-PASTE ke sheet "Data Produk"'],
  [''],
  headerLabels,
  [13, 'Contoh: Nama Produk', 'snack', 'Oriental', 'nama-produk.png', 'Deskripsi produk di sini...', 'Malaysia', '100g', 'Halal, BPOM'],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  [''],
  ['TIPS:'],
  ['1. Isi ID dengan nomor urut berikutnya (lanjutkan dari ID terakhir di Data Produk)'],
  ['2. Kategori harus salah satu dari: snack, biskuit, wafer, kue, minuman'],
  ['3. Nama File Gambar: nama-file.png (huruf kecil, pakai strip)'],
  ['4. Setelah isi di sini, select baris → Copy → Paste di sheet "Data Produk" baris paling bawah'],
];

const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
wsTemplate['!cols'] = ws['!cols'];
wsTemplate['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
];
XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Tambah');

// ===== SHEET 4: REFERENSI KATEGORI & BRAND =====
const refData = [
  ['📋 REFERENSI KATEGORI & BRAND'],
  [''],
  ['═══ DAFTAR KATEGORI ═══'],
  ['Kode (tulis ini di Excel)', 'Label di Website', 'Warna Badge'],
  ['snack', 'Makanan Ringan', '🟠 Orange'],
  ['biskuit', 'Biskuit', '🟡 Coklat Emas'],
  ['wafer', 'Wafer', '🟤 Coklat'],
  ['kue', 'Kue & Pastry', '🩷 Pink'],
  ['minuman', 'Minuman', '🔵 Biru'],
  [''],
  ['═══ DAFTAR BRAND ═══'],
  ['Brand', 'Asal', 'Produk Utama'],
  ['Oriental', 'Malaysia', 'Super Ring, Cheese Balls, Prawn Crackers, Green Pea'],
  ['Jacker', 'Malaysia', 'Potato Chips, Chocolate Wafer, Wafer Rolls'],
  ['Zess', 'Malaysia', 'Butter Cookies, Cream Crackers'],
  ['Fudo', 'Malaysia', 'Swiss Roll, Layer Cake'],
  [''],
  ['═══ CONTOH NAMA FILE GAMBAR ═══'],
  ['Nama Produk', 'Nama File Gambar yang Benar', '❌ Nama File yang Salah'],
  ['Super Ring', 'super-ring.png', 'Super Ring.png (ada spasi & huruf besar)'],
  ['Cheese Balls', 'cheese-balls.png', 'Cheese_Balls.PNG (underscore & huruf besar)'],
  ['Swiss Roll Chocolate', 'swiss-roll-chocolate.png', 'swissRoll.jpg (camelCase)'],
  ['Butter Cookies', 'butter-cookies.png', 'BUTTER COOKIES.png (huruf besar & spasi)'],
  [''],
  ['═══ STRUKTUR FOLDER GAMBAR DI SERVER ═══'],
  [''],
  ['📁 mitra-abadi/'],
  ['  ├── 📁 assets/'],
  ['  │   └── 📁 images/'],
  ['  │       └── 📁 products/          ← TARUH GAMBAR DI SINI'],
  ['  │           ├── 🖼️ super-ring.png'],
  ['  │           ├── 🖼️ cheese-balls.png'],
  ['  │           ├── 🖼️ prawn-crackers.png'],
  ['  │           └── 🖼️ ... (gambar lainnya)'],
  ['  ├── 📁 database/'],
  ['  │   └── 📄 produk.csv            ← FILE CSV DI SINI'],
  ['  └── 📄 admin.html'],
];

const wsRef = XLSX.utils.aoa_to_sheet(refData);
wsRef['!cols'] = [
  { wch: 40 },
  { wch: 40 },
  { wch: 45 },
];
wsRef['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
];
XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

// ==========================================
// SAVE FILE
// ==========================================
const outputDir = path.join(__dirname, 'database');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'CMS_Produk_MitraAbadi.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('✅ File Excel berhasil dibuat:', outputPath);
console.log('📊 Total produk:', products.length);
console.log('📑 Sheets: Data Produk, Panduan, Template Tambah, Referensi');

// Also regenerate CSV with full image paths
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
fs.writeFileSync(path.join(outputDir, 'produk.csv'), csvContent, 'utf-8');
console.log('✅ File CSV juga di-regenerate untuk sinkronisasi');
