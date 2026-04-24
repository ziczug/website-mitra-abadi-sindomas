// ==========================================
// STATE & CONFIG
// ==========================================
const ADMIN_PIN_KEY = 'mas_admin_pin';
const PRODUCTS_KEY = 'mas_products';
const SYNC_KEY = 'mas_products_synced';
const DEFAULT_PIN = '7878';
let products = [];
let currentPage = 1;
let perPage = 10;
let sortField = '';
let sortDir = 'asc';
let pendingImport = [];
let katalogs = [];
let promos = [];
let heroBanners = [];
let branches = [];
let partners = [];
let newsItems = [];

// ==========================================
// FILE SYNC UTILITIES
// ==========================================
// Helper untuk simpan ke localStorage dengan aman (cegah crash jika penuh)
function safeLSSet(key, data) {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, str);
    return true;
  } catch (e) {
    console.warn(`[Storage] Gagal simpan ${key} ke localStorage (mungkin penuh):`, e.message);
    return false;
  }
}

// Simpan data ke file JSON di database/cms/ (via API)
async function saveToFile(key, data) {
  try {
    const payload = JSON.stringify({ key, data });
    // Jika data sangat besar (>2MB), beri peringatan di console
    if (payload.length > 2 * 1024 * 1024) {
      console.warn(`[FileSync] Menyimpan data besar (${(payload.length/1024/1024).toFixed(2)} MB) untuk ${key}...`);
    }

    const resp = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Server error: ${resp.status} ${errText}`);
    }
    
    const res = await resp.json();
    if (res.success) {
      console.log(`[FileSync] Berhasil simpan file: ${key}.json`);
      
      // Auto-trigger master file sync if products or categories are updated
      if (key === 'products' || key === 'categories') {
          triggerServerSync();
      }
      
      return true;
    } else {
      throw new Error(res.error || 'Unknown error');
    }
  } catch(e) {
    console.error(`[FileSync] Gagal simpan file ${key}:`, e.message);
    toast(`Gagal sinkron ke server: ${key}. Data hanya tersimpan di browser.`, 'warning');
    return false;
  }
}

// Trigger sinkronisasi server untuk regenerasi file master (CSV, Brands, dll)
async function triggerServerSync() {
  try {
    console.log('[Sync] Memicu sinkronisasi file master di server...');
    const resp = await fetch('/api/sync', { method: 'POST' });
    if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
    
    const res = await resp.json();
    if (res.success) {
      console.log('[Sync] ✅ Sinkronisasi file master berhasil:', res.files.join(', '));
      // Jika kita berada di dashboard atau halaman produk, kita mungkin ingin refresh status
      updateSyncStatus(true);
    }
  } catch (e) {
    console.warn('[Sync] ❌ Gagal sinkronisasi otomatis di server:', e.message);
  }
}

// Baca data dari file JSON
async function loadFromFile(key) {
  try {
    const resp = await fetch(`/api/load?key=${key}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch(e) {
    console.warn(`[FileSync] Gagal baca file ${key}:`, e.message);
    return null;
  }
}

// Baca semua data CMS dari file sekaligus, lalu sinkronkan ke localStorage
async function syncAllFromFiles() {
  try {
    const resp = await fetch(`/api/load-all?t=${Date.now()}`);
    if (!resp.ok) return;
    const allData = await resp.json();
    
    const keyMap = {
      'company_info': 'mas_company_info',
      'contact_info': 'mas_contact_info',
      'statistics': 'mas_statistics',
      'brand_partners': 'mas_brand_partners',
      'categories': 'mas_categories',
      'certifications': 'mas_certifications',
      'footer_info': 'mas_footer_info',
      'heroes': 'mas_heroes',

      'branches': 'mas_branches',
      'partners': 'mas_partners',
      'promos': 'mas_promos',
      'katalogs': 'mas_katalogs',
      'products': 'mas_products',
      'news': 'mas_news'
    };
    
    let synced = 0;
    Object.entries(allData).forEach(([fileKey, data]) => {
      const lsKey = keyMap[fileKey];
      if (lsKey && data && (!Array.isArray(data) || data.length > 0 || typeof data === 'object')) {
        try {
          localStorage.setItem(lsKey, JSON.stringify(data));
          synced++;
        } catch (e) {
          console.warn(`[FileSync] QuotaExceeded for ${lsKey}, continuing...`);
        }
      }
    });

    if (synced > 0) {
      console.log(`[FileSync] ✅ ${synced} file disinkronkan ke localStorage`);
      try { localStorage.setItem('mas_sync_complete', '1'); } catch(e) {}
    }
  } catch(e) {
    console.warn('[FileSync] API tidak tersedia, gunakan localStorage saja.', e.message);
  }
}

const defaultProducts = [
  { id: 1, name: "Super Ring", category: "snack", brand: "Oriental", brand_logo: "assets/logobrands/oriental.jpg", image: "assets/images/products/super-ring.png", desc: "Makanan ringan berbentuk cincin dengan rasa keju yang gurih dan renyah.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 2, name: "Cheese Balls", category: "snack", brand: "Oriental", brand_logo: "assets/logobrands/oriental.jpg", image: "assets/images/products/cheese-balls.png", desc: "Puff balls dengan rasa keju yang lezat, tekstur ringan dan crunchy.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 3, name: "Prawn Crackers", category: "snack", brand: "Oriental", brand_logo: "assets/logobrands/oriental.jpg", image: "assets/images/products/prawn-crackers.png", desc: "Kerupuk udang renyah dengan rasa seafood autentik.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 4, name: "Green Pea Snack", category: "snack", brand: "Oriental", brand_logo: "assets/logobrands/oriental.jpg", image: "assets/images/products/green-pea.png", desc: "Snack kacang polong hijau yang renyah dan gurih.", origin: "Malaysia", weight: "60g", cert: "Halal, BPOM", info: "60g x 10 Bags x 6 Balls | QTY: 60 Pcs | 0.1104 m³/Ctn" },
  { id: 5, name: "Potato Chips", category: "snack", brand: "Jacker", brand_logo: "assets/logobrands/jacker.jpg", image: "assets/images/products/potato-chips.png", desc: "Keripik kentang premium dengan bumbu original yang gurih.", origin: "Malaysia", weight: "100g", cert: "Halal, BPOM", info: "100g x 12 Cans | QTY: 12 Pcs | 0.054 m³/Ctn" },
  { id: 6, name: "Butter Cookies", category: "biskuit", brand: "Zess", brand_logo: "assets/logobrands/zess.jpg", image: "assets/images/products/butter-cookies.png", desc: "Biskuit mentega premium dalam kemasan kaleng elegan.", origin: "Malaysia", weight: "454g", cert: "Halal, BPOM", info: "454g x 12 Tins | QTY: 12 Pcs | 0.082 m³/Ctn" },
  { id: 7, name: "Cream Crackers", category: "biskuit", brand: "Zess", brand_logo: "assets/logobrands/zess.jpg", image: "assets/images/products/cream-crackers.png", desc: "Biskuit cream cracker klasik yang renyah dan gurih.", origin: "Malaysia", weight: "350g", cert: "Halal, BPOM", info: "350g x 24 Packs | QTY: 24 Pcs | 0.095 m³/Ctn" },
  { id: 8, name: "Chocolate Wafer", category: "wafer", brand: "Jacker", brand_logo: "assets/logobrands/jacker.jpg", image: "assets/images/products/chocolate-wafer.png", desc: "Wafer berlapis dengan krim coklat premium.", origin: "Malaysia", weight: "150g", cert: "Halal, BPOM", info: "150g x 24 Packs | QTY: 24 Pcs | 0.076 m³/Ctn" },
  { id: 9, name: "Vanilla Wafer Rolls", category: "wafer", brand: "Jacker", brand_logo: "assets/logobrands/jacker.jpg", image: "assets/images/products/vanilla-wafer.png", desc: "Wafer roll renyah dengan isian krim vanilla yang lembut.", origin: "Malaysia", weight: "120g", cert: "Halal, BPOM", info: "120g x 24 Packs | QTY: 24 Pcs | 0.068 m³/Ctn" },
  { id: 10, name: "Swiss Roll Chocolate", category: "kue", brand: "Fudo", brand_logo: "assets/logobrands/fudo.jpg", image: "assets/images/products/swiss-roll.png", desc: "Swiss roll lembut dengan lapisan krim coklat.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM", info: "432g (18g x 24) x 12 Boxes | QTY: 288 Pcs | 0.045 m³/Ctn" },
  { id: 11, name: "Layer Cake Strawberry", category: "kue", brand: "Fudo", brand_logo: "assets/logobrands/fudo.jpg", image: "assets/images/products/layer-cake.png", desc: "Layer cake dengan krim strawberry yang lezat.", origin: "Malaysia", weight: "18g x 24", cert: "Halal, BPOM", info: "432g (18g x 24) x 12 Boxes | QTY: 288 Pcs | 0.045 m³/Ctn" },
  { id: 12, name: "Tropical Fruit Juice", category: "minuman", brand: "Oriental", brand_logo: "assets/logobrands/oriental.jpg", image: "assets/images/products/fruit-juice.png", desc: "Jus buah tropis segar dengan rasa mangga alami.", origin: "Malaysia", weight: "250ml", cert: "Halal, BPOM", info: "250ml x 24 Tins | QTY: 24 Pcs | 0.032 m³/Ctn" }
];

// ==========================================
// AUTH
// ==========================================
function getPin() { return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN; }

async function attemptLogin() {
  const pin = document.getElementById('pinInput').value;
  if (pin === getPin()) {
    sessionStorage.setItem('mas_logged', '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('active');
    await syncAllFromFiles();
    loadProducts();
  } else {
    const err = document.getElementById('loginError');
    err.classList.add('show');
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
    setTimeout(() => err.classList.remove('show'), 3000);
  }
}

// Form submission is now handled by the <form onsubmit="..."> in admin.html

function doLogout() { sessionStorage.removeItem('mas_logged'); location.reload(); }

async function checkSession() {
  if (sessionStorage.getItem('mas_logged') === '1') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('active');
    await syncAllFromFiles();
    loadProducts();
  }
}

function changePin() {
  const np = document.getElementById('newPin').value;
  if (np.length < 4) return toast('PIN minimal 4 karakter', 'error');
  localStorage.setItem(ADMIN_PIN_KEY, np);
  document.getElementById('newPin').value = '';
  toast('PIN berhasil diubah!', 'success');
}

// ==========================================
// NAVIGATION
// ==========================================
function showPage(page, btn) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titles = { dashboard:'Dashboard', products:'Manajemen Produk', images:'Gambar & Icon', importexport:'Import / Export', katalog:'Manajemen Katalog', promo: 'Manajemen Popup Promo', hero: 'Manajemen Banner Hero', news: 'Manajemen Berita', branches: 'Manajemen Cabang Gudang', company:'Profil Perusahaan', contact:'Informasi Kontak', statistics:'Statistik Website', brandpartner:'Brand Partner', partners:'Mitra Distribusi', categories:'Kategori Produk', certifications:'Manajemen Sertifikasi', footermgr:'Manajemen Footer', settings:'Pengaturan' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  if (page === 'images') renderImageGrid();
  if (page === 'katalog') renderKatalogs();
  if (page === 'promo') renderPromos();
  if (page === 'hero') renderHeroes();
  if (page === 'branches') renderBranches();
  if (page === 'news') renderNews();
  if (page === 'company') loadCompanyForm();
  if (page === 'contact') loadContactForm();
  if (page === 'statistics') loadStatisticsForm();
  if (page === 'brandpartner') renderBrandPartners();
  if (page === 'partners') renderPartners();
  if (page === 'categories') renderCategoriesEditor();
  if (page === 'certifications') renderCertEditor();
  if (page === 'footermgr') loadFooterForm();
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('mobileOverlay').classList.toggle('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('mobileOverlay').classList.remove('active');
}

// ==========================================
// DATA
// ==========================================
async function loadProducts() {
  // Data sudah disinkronkan di checkSession atau attemptLogin
  await loadCategories();

  const stored = localStorage.getItem(PRODUCTS_KEY);
  products = stored ? JSON.parse(stored) : [...defaultProducts];

  // Proactive Migration: Fix brand logo paths/extensions
  let migrated = false;
  products.forEach(p => {
    if (p.brand_logo && p.brand_logo.includes('assets/images/brands/')) {
      p.brand_logo = p.brand_logo.replace('assets/images/brands/', 'assets/logobrands/').replace('.png', '.jpg');
      migrated = true;
    }
  });

  if (migrated) {
    console.log('🔄 Data Brand Logo berhasil dimigrasikan ke resolusi path baru.');
    saveProducts();
  }

  loadKatalogs();
  loadPromos();
  loadHeroes();
  loadBranches();
  loadNews();
  await loadBrandPartners();
  await loadPartners(); // Now async
  // saveProducts(); // Removed redundant save on load
  refreshAll();
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  saveToFile('products', products);
  updateSyncStatus(false);
}

function getNextId() {
  return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

// ==========================================
// SYNC TO WEBSITE
// ==========================================
function syncToWebsite() {
  // Website sekarang membaca langsung dari products.json
  // Tombol ini tetap ada untuk memastikan localStorage backup di sisi client terupdate
  localStorage.setItem(SYNC_KEY, JSON.stringify(products));
  localStorage.setItem('mas_sync_timestamp', Date.now().toString());
  saveToFile('products', products); // Redundant but safe
  updateSyncStatus(true);
  toast('Data berhasil disinkronkan ke file dan website!', 'success');
}

function updateSyncStatus(synced) {
  const badge = document.getElementById('syncStatusBadge');
  if (!badge) return;
  const syncData = localStorage.getItem(SYNC_KEY);
  const isSynced = synced || (syncData && syncData === JSON.stringify(products));
  badge.innerHTML = isSynced
    ? '<span class="sync-badge synced"><span class="dot"></span> Tersinkron</span>'
    : '<span class="sync-badge unsynced"><span class="dot"></span> Belum Sync</span>';
}

// ==========================================
// RENDER
// ==========================================
function refreshAll() {
  renderStats();
  renderTable();
  renderBrandFilter();
  updateSyncStatus();
  document.getElementById('navProductCount').textContent = products.length;
  const sp = document.getElementById('settingsTotalProducts');
  if (sp) sp.textContent = products.length;
  renderKatalogs();
}

let categories = [];
async function loadCategories() {
  const stored = localStorage.getItem('mas_categories');
  if (stored) {
    categories = JSON.parse(stored);
  } else {
    try {
      const resp = await fetch('/database/cms/categories.json');
      if (resp.ok) {
        categories = await resp.json();
        localStorage.setItem('mas_categories', JSON.stringify(categories));
      }
    } catch (e) {}
  }
}

function getCategoryLabel(key) {
  const found = categories.find(c => c.key === key);
  return found ? found.title : key.charAt(0).toUpperCase() + key.slice(1);
}

function renderStats() {
  const cats = {}, brands = {};
  products.forEach(p => { cats[p.category] = (cats[p.category]||0)+1; brands[p.brand] = (brands[p.brand]||0)+1; });
  
  const catColors = {snack:'#FF6B35',biskuit:'#A88238',wafer:'#8B5A2B',kue:'#DC5078',minuman:'#2E8BC0',permen:'#E91E63',condiments:'#FF9800',noodle:'#795548',vegelicious:'#4CAF50',pudding:'#A259FF'};

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-box-open"></i></div><div class="stat-value">${products.length}</div><div class="stat-label">Total Produk</div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-tags"></i></div><div class="stat-value">${Object.keys(cats).length}</div><div class="stat-label">Kategori Aktif</div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-star"></i></div><div class="stat-value">${Object.keys(brands).length}</div><div class="stat-label">Brand Partner</div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-certificate"></i></div><div class="stat-value">${products.filter(p=>p.cert).length}</div><div class="stat-label">Bersertifikat</div></div>`;

  document.getElementById('catBreakdown').innerHTML = categories.map(c =>
    `<div class="cat-item"><div class="cat-dot" style="background:${catColors[c.key] || '#ccc'}"></div><div class="cat-name">${c.title}</div><div class="cat-count">${cats[c.key]||0}</div></div>`
  ).join('');
}

function renderBrandFilter() {
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const sel = document.getElementById('filterBrand');
  const cur = sel.value;
  sel.innerHTML = '<option value="all">Semua Brand</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
  sel.value = cur || 'all';
}

function getFilteredProducts() {
  const q = (document.getElementById('tableSearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('filterCategory')?.value || 'all';
  const brand = document.getElementById('filterBrand')?.value || 'all';
  let list = products.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (brand !== 'all' && p.brand !== brand) return false;
    if (q) {
      const keywords = q.split(' ').filter(k => k.trim() !== '');
      const searchableText = [
        p.name, p.brand, p.category, p.desc, p.weight, p.origin, p.info
      ].filter(Boolean).join(' ').toLowerCase();
      if (!keywords.every(kw => searchableText.includes(kw))) return false;
    }
    return true;
  });
  if (sortField) {
    list.sort((a, b) => {
      const va = (a[sortField] || '').toLowerCase();
      const vb = (b[sortField] || '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }
  return list;
}

function renderTable() {
  const filtered = getFilteredProducts();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');

  if (total === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; document.getElementById('pagination').innerHTML = ''; return; }
  empty.style.display = 'none';

  tbody.innerHTML = pageItems.map(p => `<tr>
    <td><input type="checkbox" class="custom-check" data-id="${p.id}"></td>
    <td><div class="product-cell"><div class="product-thumb">${p.image ? `<img src="${p.image}" alt="${p.name}">` : '<span class="no-img"><i class="fas fa-image"></i></span>'}</div><div><div class="product-name">${p.name}</div><div class="product-id">ID: ${p.id}</div></div></div></td>
    <td><span class="category-badge ${p.category}">${getCategoryLabel(p.category)}</span></td>
    <td style="font-weight:600">${p.brand}</td>
    <td>${p.weight||'-'}</td>
    <td>${p.cert||'-'}</td>
    <td><div class="action-btns">
      <button class="action-btn edit" title="Edit" onclick="editProduct(${p.id})"><i class="fas fa-pen"></i></button>
      <button class="action-btn copy" title="Duplikat" onclick="duplicateProduct(${p.id})"><i class="fas fa-copy"></i></button>
      <button class="action-btn delete" title="Hapus" onclick="confirmDeleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
    </div></td>
  </tr>`).join('');

  const pag = document.getElementById('pagination');
  let pagHTML = `<div class="pagination-info">Menampilkan <strong>${start+1}-${Math.min(start+perPage,total)}</strong> dari <strong>${total}</strong></div><div class="pagination-buttons">`;
  pagHTML += `<button class="page-btn" ${currentPage<=1?'disabled':''} onclick="goPage(${currentPage-1})"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) pagHTML += `<button class="page-btn" disabled>…</button>`;
      continue;
    }
    pagHTML += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  pagHTML += `<button class="page-btn" ${currentPage>=totalPages?'disabled':''} onclick="goPage(${currentPage+1})"><i class="fas fa-chevron-right"></i></button></div>`;
  pag.innerHTML = pagHTML;
}

function goPage(p) { currentPage = p; renderTable(); }
function sortTable(field) {
  if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortField = field; sortDir = 'asc'; }
  renderTable();
}
function toggleAll(cb) { document.querySelectorAll('#tableBody .custom-check').forEach(c => c.checked = cb.checked); }

// ==========================================
// PRODUCT CRUD
// ==========================================
function openProductModal() {
  document.getElementById('editProductId').value = '';
  document.getElementById('modalFormTitle').textContent = 'Tambah Produk';
  ['fName','fBrand','fDesc','fImage','fBrandLogo','fInfo'].forEach(f => document.getElementById(f).value = '');
  document.getElementById('fCategory').value = '';
  document.getElementById('fOrigin').value = 'Malaysia';
  document.getElementById('fWeight').value = '';
  document.getElementById('fCert').value = 'Halal, BPOM';
  document.getElementById('imagePreview').classList.remove('show');
  document.getElementById('uploadArea').style.display = '';
  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  openProductModal();
  document.getElementById('editProductId').value = id;
  document.getElementById('modalFormTitle').textContent = 'Edit Produk';
  document.getElementById('fName').value = p.name;
  document.getElementById('fBrand').value = p.brand;
  document.getElementById('fCategory').value = p.category;
  document.getElementById('fOrigin').value = p.origin || '';
  document.getElementById('fWeight').value = p.weight || '';
  document.getElementById('fCert').value = p.cert || '';
  document.getElementById('fDesc').value = p.desc || '';
  document.getElementById('fImage').value = p.image || '';
  document.getElementById('fBrandLogo').value = p.brand_logo || '';
  document.getElementById('fInfo').value = p.info || '';
  document.getElementById('fProductImageData').value = p.imageData || '';
  
  if (p.imageData || p.image) {
    document.getElementById('previewImg').src = p.imageData || p.image;
    document.getElementById('imagePreview').classList.add('show');
    document.getElementById('uploadArea').style.display = 'none';
  }
}

function saveProduct() {
  const name = document.getElementById('fName').value.trim();
  const brand = document.getElementById('fBrand').value.trim();
  const category = document.getElementById('fCategory').value;
  const desc = document.getElementById('fDesc').value.trim();
  if (!name || !brand || !category || !desc) return toast('Lengkapi field yang wajib diisi!', 'error');

  const data = {
    name, brand, category, desc,
    origin: document.getElementById('fOrigin').value.trim(),
    weight: document.getElementById('fWeight').value.trim(),
    cert: document.getElementById('fCert').value.trim(),
    image: document.getElementById('fImage').value.trim() || `assets/images/products/${name.toLowerCase().replace(/\s+/g,'-')}.png`,
    brand_logo: document.getElementById('fBrandLogo').value.trim() || `assets/logobrands/${brand.toLowerCase().replace(/\s+/g,'-')}.jpg`,
    info: document.getElementById('fInfo').value.trim(),
    imageData: document.getElementById('fProductImageData').value
  };

  const editId = document.getElementById('editProductId').value;
  if (editId) {
    const idx = products.findIndex(p => p.id === parseInt(editId));
    if (idx >= 0) products[idx] = { ...products[idx], ...data };
    toast('Produk berhasil diperbarui!', 'success');
  } else {
    data.id = getNextId();
    products.push(data);
    toast('Produk berhasil ditambahkan!', 'success');
  }
  saveProducts(); refreshAll(); closeProductModal();
}

function duplicateProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  
  const duplicated = { 
    ...p, 
    id: getNextId(), 
    name: p.name + ' (Copy)' 
  };
  
  products.push(duplicated);
  saveProducts();
  refreshAll();
  toast('Produk diduplikat!', 'success');
}

function confirmDeleteProduct(id) {
  const p = products.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Produk?';
  document.getElementById('confirmMsg').textContent = `"${p?.name}" akan dihapus permanen.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { deleteProduct(id); closeConfirm(); };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  saveProducts(); refreshAll();
  toast('Produk berhasil dihapus.', 'success');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================
// IMAGE MANAGER
// ==========================================
function renderImageGrid() {
  const filterType = document.getElementById('imgFilterType')?.value || 'all';
  const grid = document.getElementById('imageManagerGrid');
  const empty = document.getElementById('imgEmptyState');
  
  let items = [];
  products.forEach(p => {
    if (p.image && (filterType === 'all' || filterType === 'produk')) {
      items.push({ type:'produk', name: p.name, path: p.image, productId: p.id, brand: p.brand });
    }
    if (p.brand_logo && (filterType === 'all' || filterType === 'brand')) {
      const exists = items.find(i => i.type === 'brand' && i.path === p.brand_logo);
      if (!exists) items.push({ type:'brand', name: p.brand + ' Logo', path: p.brand_logo, productId: p.id, brand: p.brand });
    }
  });

  if (items.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = items.map(item => `
    <div class="image-manager-card">
      <div class="img-thumb">
        <span class="img-type-badge ${item.type}">${item.type === 'produk' ? 'Produk' : 'Brand'}</span>
        <img src="${item.path}" alt="${item.name}">
      </div>
      <div class="img-info">
        <div class="img-name">${item.name}</div>
        <div class="img-path" title="${item.path}">${item.path}</div>
      </div>
      <div class="img-actions">
        <button onclick="editProduct(${item.productId})" title="Edit produk terkait"><i class="fas fa-pen"></i> Edit</button>
        <button onclick="copyPath('${item.path}')" title="Copy path"><i class="fas fa-copy"></i> Copy</button>
      </div>
    </div>
  `).join('');
}

function copyPath(path) {
  navigator.clipboard.writeText(path).then(() => toast('Path disalin!', 'success')).catch(() => toast('Gagal menyalin', 'error'));
}

// ==========================================
// IMAGE UPLOAD
// ==========================================
function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Ukuran file max 2MB', 'error');
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('previewImg').src = ev.target.result;
    document.getElementById('imagePreview').classList.add('show');
    document.getElementById('uploadArea').style.display = 'none';
    const path = `assets/images/products/${file.name}`;
    document.getElementById('fImage').value = path;
    document.getElementById('fProductImageData').value = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  document.getElementById('imagePreview').classList.remove('show');
  document.getElementById('uploadArea').style.display = '';
  document.getElementById('fImage').value = '';
  document.getElementById('fProductImageData').value = '';
}

function previewBrandLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Ukuran file max 2MB', 'error');
  
  const reader = new FileReader();
  reader.onload = ev => {
    // Brand logos are formatted: assets/logobrands/brandname.jpg
    // But we'll accept what the user uploads
    const name = file.name.toLowerCase();
    const cleanName = name.split('.')[0].replace(/\s+/g,'-');
    const path = `assets/logobrands/${cleanName}.jpg`;
    document.getElementById('fBrandLogo').value = path;
    toast('Logo Brand berhasil dipilih.', 'success');
  };
  reader.readAsDataURL(file);
}

// ==========================================
// IMPORT / EXPORT
// ==========================================
function handleImport(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  if (type === 'csv') {
    reader.onload = e => {
      try {
        const result = Papa.parse(e.target.result, { header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase() });
        pendingImport = result.data.filter(r => r.name).map((r, i) => ({
          id: parseInt(r.id) || 0, name:(r.name||'').trim(), category:(r.category||'').toLowerCase().trim(),
          brand:(r.brand||'').trim(), brand_logo:(r.brand_logo||'').trim(), image:(r.image||'').trim(),
          desc:(r.desc||'').trim(), origin:(r.origin||'').trim(), weight:(r.weight||'').trim(),
          cert:(r.cert||'').trim(), info:(r.info||'').trim()
        }));
        showImportPreview();
      } catch(err) { toast('Gagal membaca CSV: '+err.message,'error'); }
    };
    reader.readAsText(file);
  } else {
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, {defval:''});
        pendingImport = data.filter(r => r.name || r['Nama Produk']).map((r,i) => {
          let img = (r.image || r['Path Gambar'] || r['Nama File Gambar'] || '').trim();
          if (img && !img.includes('/')) img = 'assets/images/products/' + img;
          return {
            id: parseInt(r.id||r.ID)||0, name:(r.name||r['Nama Produk']||'').trim(),
            category:(r.category||r.Kategori||'').toLowerCase().trim(), brand:(r.brand||r.Brand||'').trim(),
            brand_logo:(r.brand_logo||r['Logo Brand (Path)']||'').trim(), image:img, desc:(r.desc||r.Deskripsi||'').trim(),
            origin:(r.origin||r['Asal Negara']||'').trim(), weight:(r.weight||r['Berat/Ukuran']||'').trim(),
            cert:(r.cert||r.Sertifikasi||'').trim(), info:(r.info||r['Informasi Tambahan']||r['Info Kemasan']||'').trim()
          };
        });
        showImportPreview();
      } catch(err) { toast('Gagal membaca Excel: '+err.message,'error'); }
    };
    reader.readAsArrayBuffer(file);
  }
  event.target.value = '';
}

function showImportPreview() {
  if (pendingImport.length === 0) return toast('Tidak ada data valid.','error');
  document.getElementById('importCount').textContent = pendingImport.length;
  document.getElementById('importPreview').innerHTML = `<table><thead><tr><th>ID</th><th>Nama</th><th>Kategori</th><th>Brand</th><th>Berat</th></tr></thead><tbody>${
    pendingImport.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.category}</td><td>${p.brand}</td><td>${p.weight}</td></tr>`).join('')
  }</tbody></table>`;
  document.getElementById('importModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImportModal() { document.getElementById('importModal').classList.remove('active'); document.body.style.overflow = ''; }

function confirmImport() {
  let maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
  pendingImport.forEach(p => {
    if (p.id) {
       const idx = products.findIndex(x => x.id === p.id);
       if (idx >= 0) products[idx] = { ...products[idx], ...p };
       else products.push(p);
    } else {
       p.id = ++maxId;
       products.push(p);
    }
  });
  saveProducts(); refreshAll(); closeImportModal();
  toast(`${pendingImport.length} produk berhasil diimport/diupdate!`, 'success');
  pendingImport = [];
}

function exportCSV() {
  if (products.length === 0) return toast('Tidak ada produk.','error');
  const csv = Papa.unparse(products.map(p => ({
    id: p.id, name: p.name, category: p.category, brand: p.brand, brand_logo: p.brand_logo || '',
    image: p.image || '', desc: p.desc || '', origin: p.origin || '', weight: p.weight || '',
    cert: p.cert || '', info: p.info || ''
  })));
  downloadFile(csv + '\n', 'produk.csv', 'text/csv');
  toast('CSV berhasil didownload!','success');
}

function exportExcel() {
  if (products.length === 0) return toast('Tidak ada produk.','error');
  const wb = XLSX.utils.book_new();
  const wsData = [['ID','Nama Produk','Kategori','Brand','Logo Brand','Gambar','Deskripsi','Asal Negara','Berat/Ukuran','Sertifikasi','Info Kemasan']];
  products.forEach(p => wsData.push([p.id,p.name,p.category,p.brand,p.brand_logo||'',p.image,p.desc,p.origin,p.weight,p.cert,p.info||'']));
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{wch:5},{wch:24},{wch:14},{wch:14},{wch:28},{wch:28},{wch:50},{wch:14},{wch:14},{wch:16},{wch:40}];
  XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
  XLSX.writeFile(wb, 'CMS_Produk_MitraAbadi.xlsx');
  toast('Excel berhasil didownload!','success');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], {type: type+';charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ==========================================
// SETTINGS
// ==========================================
function confirmResetData() {
  document.getElementById('confirmTitle').textContent = 'Reset Semua Data?';
  document.getElementById('confirmMsg').textContent = 'Semua produk akan dikembalikan ke data default.';
  document.getElementById('confirmBtn').textContent = 'Ya, Reset';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => {
    products = [...defaultProducts];
    saveProducts(); refreshAll(); closeConfirm();
    toast('Data berhasil direset.','success');
  };
  document.getElementById('confirmModal').classList.add('active');
}

// ==========================================
// KATALOG MANAGEMENT
// ==========================================
function loadKatalogs() {
  const stored = localStorage.getItem('mas_katalogs');
  if (stored) {
    katalogs = JSON.parse(stored);
  } else {
    const oldPath = localStorage.getItem('mas_katalog_path') || 'Catalog PTMAS 2026_compressed.pdf';
    katalogs = [{ id: Date.now(), name: 'Katalog Default', filename: oldPath, active: true }];
    saveKatalogs();
  }
}

function saveKatalogs() {
  localStorage.setItem('mas_katalogs', JSON.stringify(katalogs));
  const activeK = katalogs.find(k => k.active);
  if (activeK) {
    localStorage.setItem('mas_katalog_path', activeK.filename);
  }
  saveToFile('katalogs', katalogs);
}

function renderKatalogs() {
  const tbody = document.getElementById('katalogTableBody');
  const empty = document.getElementById('katalogEmptyState');
  if(!tbody) return;

  if (katalogs.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  tbody.innerHTML = katalogs.map(k => `
    <tr>
      <td style="text-align:center;">
        <input type="radio" name="active_katalog" onchange="setKatalogActive(${k.id})" ${k.active ? 'checked' : ''} style="cursor:pointer; transform:scale(1.2);">
      </td>
      <td style="font-weight:600">${k.name}</td>
      <td><code>${k.filename}</code></td>
      <td>
        <div class="action-btns">
          <button class="action-btn delete" title="Hapus" onclick="deleteKatalog(${k.id})" ${k.active?'disabled style="opacity:0.5;cursor:not-allowed;"':''}><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openKatalogModal() {
  document.getElementById('fKatalogTitle').value = '';
  document.getElementById('fKatalogFile').value = '';
  document.getElementById('fKatalogFilename').value = '';
  document.getElementById('katalogModalManager').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeKatalogModal() {
  document.getElementById('katalogModalManager').classList.remove('active');
  document.body.style.overflow = '';
}

function handleKatalogUpload(event) {
  const file = event.target.files[0];
  if(file) {
    document.getElementById('fKatalogFilename').value = file.name;
    if(!document.getElementById('fKatalogTitle').value) {
      document.getElementById('fKatalogTitle').value = file.name.replace('.pdf', '');
    }
  }
}

function saveKatalogEntry() {
  const title = document.getElementById('fKatalogTitle').value.trim();
  const filename = document.getElementById('fKatalogFilename').value.trim();
  
  if(!title || !filename) return toast('Harap lengkapi judul dan pilih file PDF', 'error');
  
  katalogs.push({
    id: Date.now(),
    name: title,
    filename: filename,
    active: katalogs.length === 0
  });
  
  saveKatalogs();
  renderKatalogs();
  closeKatalogModal();
  toast('Katalog baru berhasil ditambahkan', 'success');
}

function setKatalogActive(id) {
  katalogs.forEach(k => k.active = (k.id === id));
  saveKatalogs();
  renderKatalogs();
  toast('Katalog aktif berhasil diubah. Website akan menggunakan file PDF ini.', 'success');
}

function deleteKatalog(id) {
  const k = katalogs.find(x => x.id === id);
  if(k && k.active) return toast('Tidak dapat menghapus katalog yang sedang aktif', 'error');
  
  document.getElementById('confirmTitle').textContent = 'Hapus Katalog?';
  document.getElementById('confirmMsg').textContent = `"${k.name}" akan dihapus dari daftar.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { 
    katalogs = katalogs.filter(x => x.id !== id);
    saveKatalogs(); renderKatalogs(); closeConfirm(); toast('Katalog berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// PROMO MANAGEMENT
// ==========================================
function loadPromos() {
  const stored = localStorage.getItem('mas_promos');
  if (stored) {
    promos = JSON.parse(stored);
  } else {
    promos = [];
    // Jangan langsung save default jika baru load (hindari overwrite data server)
  }
}

function savePromos() {
  localStorage.setItem('mas_promos', JSON.stringify(promos));
  saveToFile('promos', promos);
}

function renderPromos() {
  const tbody = document.getElementById('promoTableBody');
  const empty = document.getElementById('promoEmptyState');
  if(!tbody) return;

  if (promos.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  tbody.innerHTML = promos.map(p => `
    <tr>
      <td style="text-align:center;">
        <input type="radio" name="active_promo" onchange="setPromoActive(${p.id})" ${p.active ? 'checked' : ''} style="cursor:pointer; transform:scale(1.2);">
      </td>
      <td>
        <div style="width:70px; height:50px; background:#f0f0f0; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${p.imageData ? `<img src="${p.imageData}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:10px;color:#999;text-align:center;">Tanpa<br>Gambar</span>`}
        </div>
      </td>
      <td style="font-weight:600">${p.title}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn delete" title="Hapus" onclick="deletePromo(${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openPromoModal() {
  document.getElementById('fPromoTitle').value = '';
  document.getElementById('fPromoFile').value = '';
  document.getElementById('fPromoFilename').value = '';
  document.getElementById('fPromoImageData').value = '';
  
  const previewCont = document.querySelector('#promoUploadArea .upload-preview');
  if(previewCont) previewCont.style.display = 'none';
  const img = document.getElementById('fPromoPreview');
  if(img) img.src = '';
  
  document.getElementById('promoModalManager').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePromoModalManager() {
  document.getElementById('promoModalManager').classList.remove('active');
  document.body.style.overflow = '';
}

function handlePromoUpload(event) {
  const file = event.target.files[0];
  if(file) {
    if (file.size > 2 * 1024 * 1024) return toast('Ukuran file maksimal 2MB', 'error');
    document.getElementById('fPromoFilename').value = file.name;
    if(!document.getElementById('fPromoTitle').value) {
      document.getElementById('fPromoTitle').value = file.name.replace(/\.[^/.]+$/, "");
    }
    
    // Baca sebagai base64 dan simpan ke hidden input
    const reader = new FileReader();
    reader.onload = function(e) {
      // Simpan base64 data URL di hidden field
      document.getElementById('fPromoImageData').value = e.target.result;
      
      // Tampilkan preview
      const previewCont = document.querySelector('#promoUploadArea .upload-preview');
      const img = document.getElementById('fPromoPreview');
      if(previewCont && img) {
        img.src = e.target.result;
        previewCont.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

function savePromoEntry() {
  const title = document.getElementById('fPromoTitle').value.trim();
  const filename = document.getElementById('fPromoFilename').value.trim();
  const imageData = document.getElementById('fPromoImageData').value;
  
  if(!title || !imageData) return toast('Harap lengkapi nama promosi dan pilih gambar!', 'error');
  
  promos.push({
    id: Date.now(),
    title: title,
    filename: filename,
    imageData: imageData,   // base64 — bisa langsung ditampilkan
    active: promos.length === 0
  });
  
  savePromos();
  renderPromos();
  closePromoModalManager();
  toast('Promo berhasil ditambahkan', 'success');
}

function setPromoActive(id) {
  promos.forEach(p => p.active = (p.id === id));
  savePromos();
  renderPromos();
  toast('Promo aktif berhasil diubah.', 'success');
}

function deletePromo(id) {
  const p = promos.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Promo?';
  document.getElementById('confirmMsg').textContent = (p && p.active) ? `Promo "${p.title}" sedang aktif. Yakin ingin menghapus?` : `"${p.title}" akan dihapus permanen.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { 
    promos = promos.filter(x => x.id !== id);
    savePromos(); renderPromos(); closeConfirm(); toast('Promo berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// HERO BANNER MANAGEMENT
// ==========================================
function loadHeroes() {
  const stored = localStorage.getItem('mas_heroes');
  if (stored) {
    heroBanners = JSON.parse(stored);
  } else {
    heroBanners = [];
  }
}

function saveHeroes() {
  localStorage.setItem('mas_heroes', JSON.stringify(heroBanners));
  saveToFile('heroes', heroBanners);
}

function renderHeroes() {
  const tbody = document.getElementById('heroTableBody');
  const empty = document.getElementById('heroEmptyState');
  if(!tbody) return;

  if (heroBanners.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  tbody.innerHTML = heroBanners.map((h, idx) => `
    <tr>
      <td style="text-align:center;">
        <input type="checkbox" onchange="toggleHeroActive(${h.id})" ${h.active ? 'checked' : ''} style="cursor:pointer; transform:scale(1.2);">
      </td>
      <td>
        <div style="width:100px; height:60px; background:#f0f0f0; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${h.imageData ? `<img src="${h.imageData}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:10px;color:#999;text-align:center;">Tanpa<br>Gambar</span>`}
        </div>
      </td>
      <td style="font-weight:600">${h.title}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn delete" title="Hapus" onclick="deleteHero(${h.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openHeroModal() {
  document.getElementById('fHeroTitle').value = '';
  document.getElementById('fHeroFile').value = '';
  document.getElementById('fHeroFilename').value = '';
  document.getElementById('fHeroImageData').value = '';
  
  const previewCont = document.querySelector('#heroUploadArea .upload-preview');
  if(previewCont) previewCont.style.display = 'none';
  const img = document.getElementById('fHeroPreview');
  if(img) img.src = '';
  
  document.getElementById('heroModalManager').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeHeroModal() {
  document.getElementById('heroModalManager').classList.remove('active');
  document.body.style.overflow = '';
}

function handleHeroUpload(event) {
  const file = event.target.files[0];
  if(file) {
    if (file.size > 2 * 1024 * 1024) return toast('Ukuran file maksimal 2MB', 'error');
    document.getElementById('fHeroFilename').value = file.name;
    if(!document.getElementById('fHeroTitle').value) {
      document.getElementById('fHeroTitle').value = file.name.replace(/\.[^/.]+$/, "");
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('fHeroImageData').value = e.target.result;
      const previewCont = document.querySelector('#heroUploadArea .upload-preview');
      const img = document.getElementById('fHeroPreview');
      if(previewCont && img) {
        img.src = e.target.result;
        previewCont.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

function saveHeroEntry() {
  const title = document.getElementById('fHeroTitle').value.trim();
  const imageData = document.getElementById('fHeroImageData').value;
  
  if(!title || !imageData) return toast('Harap lengkapi judul dan pilih gambar banner!', 'error');
  
  heroBanners.push({
    id: Date.now(),
    title: title,
    imageData: imageData,
    active: true
  });
  
  saveHeroes();
  renderHeroes();
  closeHeroModal();
  toast('Banner hero berhasil ditambahkan', 'success');
}

function toggleHeroActive(id) {
  const h = heroBanners.find(x => x.id === id);
  if(h) {
    h.active = !h.active;
    saveHeroes();
    toast('Status banner berhasil diubah.', 'success');
  }
}

function deleteHero(id) {
  const h = heroBanners.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Banner Hero?';
  document.getElementById('confirmMsg').textContent = `"${h.title}" akan dihapus dari daftar banner.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { 
    heroBanners = heroBanners.filter(x => x.id !== id);
    saveHeroes(); renderHeroes(); closeConfirm(); toast('Banner berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}




// ==========================================
// BRANCH LOCATIONS MANAGEMENT
// ==========================================
function loadBranches() {
  const stored = localStorage.getItem('mas_branches');
  if (stored) {
    branches = JSON.parse(stored);
  } else {
    branches = [];
  }
}

function saveBranches() {
  safeLSSet('mas_branches', branches);
  saveToFile('branches', branches);
}

function renderBranches() {
  const tbody = document.getElementById('branchesTableBody');
  const empty = document.getElementById('branchesEmptyState');
  if(!tbody) return;

  if (branches.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  tbody.innerHTML = branches.map(b => `
    <tr>
      <td>
        <div style="width:100px; height:60px; background:#f0f0f0; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${b.imageData || b.path ? `<img src="${b.imageData || b.path}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:10px;color:#999;text-align:center;">Tanpa<br>Gambar</span>`}
        </div>
      </td>
      <td style="font-weight:600">${b.name}</td>
      <td>${b.address}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit" onclick="editBranch(${b.id})"><i class="fas fa-pen"></i></button>
          <button class="action-btn delete" title="Hapus" onclick="deleteBranch(${b.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openBranchesModal() {
  document.getElementById('fBranchId').value = '';
  document.getElementById('fBranchName').value = '';
  document.getElementById('fBranchAddress').value = '';
  document.getElementById('fBranchImageData').value = '';
  document.getElementById('branchesModalTitle').textContent = 'Tambah Cabang';
  
  const previewCont = document.querySelector('#branchesUploadArea .upload-preview');
  if(previewCont) previewCont.style.display = 'none';
  const img = document.getElementById('fBranchPreview');
  if(img) img.src = '';
  
  document.getElementById('branchesModalManager').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBranchesModal() {
  document.getElementById('branchesModalManager').classList.remove('active');
  document.body.style.overflow = '';
}

function editBranch(id) {
  const b = branches.find(x => x.id === id);
  if(!b) return;
  
  openBranchesModal();
  document.getElementById('fBranchId').value = b.id;
  document.getElementById('branchesModalTitle').textContent = 'Edit Cabang';
  document.getElementById('fBranchName').value = b.name;
  document.getElementById('fBranchAddress').value = b.address;
  document.getElementById('fBranchImageData').value = b.imageData || '';
  
  if (b.imageData || b.path) {
    const previewCont = document.querySelector('#branchesUploadArea .upload-preview');
    const img = document.getElementById('fBranchPreview');
    if(previewCont && img) {
      img.src = b.imageData || b.path;
      previewCont.style.display = 'block';
    }
  }
}

function handleBranchesUpload(event) {
  const file = event.target.files[0];
  if(file) {
    if (file.size > 2 * 1024 * 1024) return toast('Ukuran file maksimal 2MB', 'error');
    
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('fBranchImageData').value = e.target.result;
      const previewCont = document.querySelector('#branchesUploadArea .upload-preview');
      const img = document.getElementById('fBranchPreview');
      if(previewCont && img) {
        img.src = e.target.result;
        previewCont.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

function saveBranchesEntry() {
  const name = document.getElementById('fBranchName').value.trim();
  const address = document.getElementById('fBranchAddress').value.trim();
  const imageData = document.getElementById('fBranchImageData').value;
  const id = document.getElementById('fBranchId').value;
  
  if(!name || !address) return toast('Harap lengkapi nama dan lokasi cabang', 'error');
  
  if (id) {
    const idx = branches.findIndex(x => x.id == id);
    if (idx >= 0) {
      branches[idx].name = name;
      branches[idx].address = address;
      if(imageData) branches[idx].imageData = imageData;
    }
  } else {
    branches.push({
      id: Date.now(),
      name: name,
      address: address,
      imageData: imageData,
      path: '' 
    });
  }
  
  saveBranches();
  renderBranches();
  closeBranchesModal();
  toast('Cabang berhasil disimpan', 'success');
}

function deleteBranch(id) {
  const b = branches.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Cabang?';
  document.getElementById('confirmMsg').textContent = `Cabang "${b.name}" akan dihapus dari daftar.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { 
    branches = branches.filter(x => x.id !== id);
    saveBranches(); renderBranches(); closeConfirm(); toast('Cabang berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// COMPANY PROFILE MANAGEMENT
// ==========================================
const defaultCompanyInfo = {
  name: 'PT Mitra Abadi Sindomas',
  desc1: 'Adalah perusahaan internasional & nasional yang bergerak di bidang perdagangan umum, ekspor, impor, dan distribusi. Sejak 2016, kami telah menjalin kerja sama dengan merek-merek internasional terkemuka untuk menghadirkan produk makanan dan minuman impor berkualitas.',
  desc2: 'Seluruh produk kami telah bersertifikat Halal dan terdaftar di BPOM, menjamin keamanan dan kualitas untuk konsumen Indonesia.',
  image: 'assets/images/mas-bangunan.jpg',
  imageData: '',
  features: [
    { icon: 'fas fa-ship', title: 'Importir Terpercaya', desc: 'Partner resmi brand internasional' },
    { icon: 'fas fa-certificate', title: 'Halal & BPOM', desc: 'Sertifikasi lengkap & terjamin' },
    { icon: 'fas fa-truck-fast', title: 'Distribusi Nasional', desc: 'Jangkauan seluruh Indonesia' },
    { icon: 'fas fa-award', title: 'Kualitas Premium', desc: 'Produk bermerek berkualitas tinggi' }
  ]
};

function loadCompanyForm() {
  const stored = localStorage.getItem('mas_company_info');
  const info = stored ? JSON.parse(stored) : defaultCompanyInfo;
  document.getElementById('fCompanyName').value = info.name || '';
  document.getElementById('fCompanyDesc1').value = info.desc1 || '';
  document.getElementById('fCompanyDesc2').value = info.desc2 || '';
  document.getElementById('fCompanyImgData').value = info.imageData || '';
  if (info.imageData) {
    const pc = document.querySelector('#companyImgUploadArea .upload-preview');
    const img = document.getElementById('fCompanyImgPreview');
    if (pc && img) { img.src = info.imageData; pc.style.display = 'block'; }
  }
  const f = info.features || defaultCompanyInfo.features;
  for (let i = 0; i < 4; i++) {
    document.getElementById(`fFeature${i+1}Icon`).value = f[i]?.icon || '';
    document.getElementById(`fFeature${i+1}Title`).value = f[i]?.title || '';
    document.getElementById(`fFeature${i+1}Desc`).value = f[i]?.desc || '';
  }
}

function handleCompanyImgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Ukuran file max 2MB', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('fCompanyImgData').value = e.target.result;
    const pc = document.querySelector('#companyImgUploadArea .upload-preview');
    const img = document.getElementById('fCompanyImgPreview');
    if (pc && img) { img.src = e.target.result; pc.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function saveCompanyInfo() {
  const features = [];
  for (let i = 1; i <= 4; i++) {
    features.push({
      icon: document.getElementById(`fFeature${i}Icon`).value.trim(),
      title: document.getElementById(`fFeature${i}Title`).value.trim(),
      desc: document.getElementById(`fFeature${i}Desc`).value.trim()
    });
  }
  const info = {
    name: document.getElementById('fCompanyName').value.trim(),
    desc1: document.getElementById('fCompanyDesc1').value.trim(),
    desc2: document.getElementById('fCompanyDesc2').value.trim(),
    imageData: document.getElementById('fCompanyImgData').value,
    features: features
  };
  safeLSSet('mas_company_info', info);
  saveToFile('company_info', info);
  toast('Profil perusahaan berhasil disimpan!', 'success');
}

// ==========================================
// CONTACT MANAGEMENT
// ==========================================
const defaultContactInfo = {
  address: 'Green Sedayu Bizpark Blok DM 11 No. 65\nJl. Daan Mogot Raya KM.18\nJakarta Barat 11840, Indonesia',
  phone: '+62 812-9500-1778',
  whatsapp: '6281295001778',
  hours1: 'Senin - Jumat: 08:00 - 17:00 WIB',
  hours2: 'Sabtu: 08:00 - 12:00 WIB',
  instagram: 'https://www.instagram.com/masfoodindonesia/',
  email: '',
  mapsUrl: 'https://maps.google.com/maps?q=-6.1528425245516996,106.69466594009853&hl=id&z=17&output=embed'
};

function loadContactForm() {
  const stored = localStorage.getItem('mas_contact_info');
  const info = stored ? JSON.parse(stored) : defaultContactInfo;
  document.getElementById('fContactAddress').value = info.address || '';
  document.getElementById('fContactPhone').value = info.phone || '';
  document.getElementById('fContactWhatsApp').value = info.whatsapp || '';
  document.getElementById('fContactHours1').value = info.hours1 || '';
  document.getElementById('fContactHours2').value = info.hours2 || '';
  document.getElementById('fContactInstagram').value = info.instagram || '';
  document.getElementById('fContactEmail').value = info.email || '';
  document.getElementById('fContactMapsUrl').value = info.mapsUrl || '';
}

function saveContactInfo() {
  const info = {
    address: document.getElementById('fContactAddress').value.trim(),
    phone: document.getElementById('fContactPhone').value.trim(),
    whatsapp: document.getElementById('fContactWhatsApp').value.trim(),
    hours1: document.getElementById('fContactHours1').value.trim(),
    hours2: document.getElementById('fContactHours2').value.trim(),
    instagram: document.getElementById('fContactInstagram').value.trim(),
    email: document.getElementById('fContactEmail').value.trim(),
    mapsUrl: document.getElementById('fContactMapsUrl').value.trim()
  };
  safeLSSet('mas_contact_info', info);
  saveToFile('contact_info', info);
  toast('Informasi kontak berhasil disimpan!', 'success');
}

// ==========================================
// STATISTICS MANAGEMENT
// ==========================================
const defaultStatistics = {
  heroYears: 8, heroProducts: 500, heroCities: 34,
  distCities: 34, distWarehouse: 40000, distSKU: 500,
  distDesc1: 'Jaringan kantor kami tersebar di berbagai kota besar, beserta dengan gudang modern dan kendaraan truk milik perusahaan.',
  distDesc2: 'Fasilitas gudang kami yang aman dan canggih memiliki kapasitas luas untuk penyimpanan makanan kering, ruang pendingin, serta ruang pembeku (freezer). Pengiriman produk dilakukan menggunakan kendaraan khusus yang dilengkapi fasilitas memadai untuk menjaga agar produk tetap dalam kondisi terbaik dan aman selama pengiriman.'
};

function loadStatisticsForm() {
  const stored = localStorage.getItem('mas_statistics');
  const s = stored ? JSON.parse(stored) : defaultStatistics;
  document.getElementById('fStatYears').value = s.heroYears || '';
  document.getElementById('fStatProducts').value = s.heroProducts || '';
  document.getElementById('fStatCities').value = s.heroCities || '';
  document.getElementById('fStatDistCities').value = s.distCities || '';
  document.getElementById('fStatWarehouse').value = s.distWarehouse || '';
  document.getElementById('fStatSKU').value = s.distSKU || '';
  document.getElementById('fStatDistDesc1').value = s.distDesc1 || '';
  document.getElementById('fStatDistDesc2').value = s.distDesc2 || '';
}

function saveStatistics() {
  const s = {
    heroYears: parseInt(document.getElementById('fStatYears').value) || 0,
    heroProducts: parseInt(document.getElementById('fStatProducts').value) || 0,
    heroCities: parseInt(document.getElementById('fStatCities').value) || 0,
    distCities: parseInt(document.getElementById('fStatDistCities').value) || 0,
    distWarehouse: parseInt(document.getElementById('fStatWarehouse').value) || 0,
    distSKU: parseInt(document.getElementById('fStatSKU').value) || 0,
    distDesc1: document.getElementById('fStatDistDesc1').value.trim(),
    distDesc2: document.getElementById('fStatDistDesc2').value.trim()
  };
  safeLSSet('mas_statistics', s);
  saveToFile('statistics', s);
  toast('Statistik berhasil disimpan!', 'success');
}

// ==========================================
// BRAND PARTNER MANAGEMENT
// ==========================================
let brandPartners = [];

async function loadBrandPartners() {
  // Try server file first
  try {
    const resp = await fetch('/api/load?key=brand_partners');
    if (resp.ok) {
      const fileData = await resp.json();
      if (fileData && fileData.length > 0) {
        brandPartners = fileData;
        // Sync to localStorage so offline fallback works
        localStorage.setItem('mas_brand_partners', JSON.stringify(brandPartners));
        return;
      }
    }
  } catch(e) {}
  // Fallback to localStorage
  const stored = localStorage.getItem('mas_brand_partners');
  if (stored) {
    brandPartners = JSON.parse(stored);
  } else {
    brandPartners = [];
  }
}

function saveBrandPartners() {
  safeLSSet('mas_brand_partners', brandPartners);
  saveToFile('brand_partners', brandPartners);
}

function renderBrandPartners() {
  const grid = document.getElementById('brandPartnerGrid');
  const empty = document.getElementById('brandPartnerEmptyState');
  if (!grid) return;
  if (brandPartners.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = brandPartners.map(b => {
    // Prefer uploaded base64 logoData, then fall back to file path logo
    const logoSrc = b.logoData || b.logo || '';
    const logoHtml = logoSrc
      ? `<img src="${logoSrc}" alt="${b.name}" style="width:100%;height:100%;object-fit:contain;background:#fff;padding:4px;">`
      : `<div class="no-img-placeholder"><span style="font-size:24px;font-weight:900">${b.name.charAt(0)}</span></div>`;
    return `
    <div class="image-manager-card">
      <div class="img-thumb">
        <span class="img-type-badge brand">Brand</span>
        ${logoHtml}
      </div>
      <div class="img-info">
        <div class="img-name">${b.name}</div>
        ${b.logo ? `<div class="img-path" title="${b.logo}">${b.logo}</div>` : ''}
      </div>
      <div class="img-actions">
        <button onclick="editBrandPartner(${b.id})" title="Edit"><i class="fas fa-pen"></i> Edit</button>
        <button onclick="deleteBrandPartner(${b.id})" title="Hapus"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    </div>`;
  }).join('');
}

function openBrandPartnerModal() {
  document.getElementById('fBrandPartnerId').value = '';
  document.getElementById('fBrandPartnerName').value = '';
  document.getElementById('fBrandPartnerLogoData').value = '';
  const pathInp = document.getElementById('fBrandPartnerLogoPath');
  if (pathInp) pathInp.value = '';
  document.getElementById('brandPartnerModalTitle').textContent = 'Tambah Brand Partner';
  const pc = document.querySelector('#brandPartnerUploadArea .upload-preview');
  if (pc) pc.style.display = 'none';
  const img = document.getElementById('fBrandPartnerPreview');
  if (img) img.src = '';
  document.getElementById('brandPartnerModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBrandPartnerModal() {
  document.getElementById('brandPartnerModal').classList.remove('active');
  document.body.style.overflow = '';
}

function editBrandPartner(id) {
  const b = brandPartners.find(x => x.id === id);
  if (!b) return;
  openBrandPartnerModal();
  document.getElementById('fBrandPartnerId').value = b.id;
  document.getElementById('brandPartnerModalTitle').textContent = 'Edit Brand Partner';
  document.getElementById('fBrandPartnerName').value = b.name;
  document.getElementById('fBrandPartnerLogoData').value = b.logoData || '';
  const pathInp = document.getElementById('fBrandPartnerLogoPath');
  if (pathInp) pathInp.value = b.logo || '';
  const displaySrc = b.logoData || b.logo;
  if (displaySrc) {
    const pc = document.querySelector('#brandPartnerUploadArea .upload-preview');
    const img = document.getElementById('fBrandPartnerPreview');
    if (pc && img) { img.src = displaySrc; pc.style.display = 'block'; }
  }
}

function handleBrandPartnerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Ukuran file max 2MB', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('fBrandPartnerLogoData').value = e.target.result;
    const pc = document.querySelector('#brandPartnerUploadArea .upload-preview');
    const img = document.getElementById('fBrandPartnerPreview');
    if (pc && img) { img.src = e.target.result; pc.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function saveBrandPartnerEntry() {
  const name = document.getElementById('fBrandPartnerName').value.trim();
  if (!name) return toast('Nama brand wajib diisi!', 'error');
  const logoData = document.getElementById('fBrandPartnerLogoData').value;
  const logoPath = document.getElementById('fBrandPartnerLogoPath')?.value.trim() || '';
  const id = document.getElementById('fBrandPartnerId').value;
  if (id) {
    const idx = brandPartners.findIndex(x => x.id == id);
    if (idx >= 0) {
      brandPartners[idx].name = name;
      if (logoData) brandPartners[idx].logoData = logoData;
      if (logoPath) brandPartners[idx].logo = logoPath;
    }
    toast('Brand berhasil diperbarui!', 'success');
  } else {
    // Auto-generate logo path from brand name
    const autoLogo = logoPath || `assets/logobrands/${name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}.jpg`;
    brandPartners.push({ id: Date.now(), name: name, logo: autoLogo, logoData: logoData });
    toast('Brand berhasil ditambahkan!', 'success');
  }
  saveBrandPartners();
  renderBrandPartners();
  closeBrandPartnerModal();
}

function deleteBrandPartner(id) {
  const b = brandPartners.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Brand?';
  document.getElementById('confirmMsg').textContent = `"${b.name}" akan dihapus dari daftar brand partner.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => {
    brandPartners = brandPartners.filter(x => x.id !== id);
    saveBrandPartners(); renderBrandPartners(); closeConfirm(); toast('Brand berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// DISTRIBUTION PARTNER MANAGEMENT
// ==========================================
async function loadPartners() {
  // Try server file first
  try {
    const resp = await fetch('/api/load?key=partners');
    if (resp.ok) {
      const fileData = await resp.json();
      if (fileData && Array.isArray(fileData) && fileData.length > 0) {
        partners = fileData;
        safeLSSet('mas_partners', partners);
        renderPartners();
        return;
      }
    }
  } catch(e) {
    console.warn('[Sync] Gagal memuat mitra dari server, menggunakan local storage.');
  }

  const stored = localStorage.getItem('mas_partners');
  if (stored) {
    try {
      partners = JSON.parse(stored);
      renderPartners();
    } catch(e) {
      console.error('[Sync] Error parsing local partners data');
      partners = [];
    }
  }
}

function savePartners() {
  try {
    localStorage.setItem('mas_partners', JSON.stringify(partners));
  } catch (e) {
    console.warn('[Storage] Local storage full, saving to file anyway.');
  }
  saveToFile('partners', partners);
}

function renderPartners() {
  const grid = document.getElementById('partnersGrid');
  const empty = document.getElementById('partnersEmptyState');
  if (!grid) return;

  const q = (document.getElementById('partnerSearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('filterPartnerCategory')?.value || 'all';

  let list = partners.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (q) {
      const keywords = q.split(' ').filter(k => k.trim() !== '');
      const searchableText = [p.name, p.category].filter(Boolean).join(' ').toLowerCase();
      if (!keywords.every(kw => searchableText.includes(kw))) return false;
    }
    return true;
  });

  if (list.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = list.map(p => `
    <div class="image-manager-card">
      <div class="img-thumb">
        <span class="img-type-badge ${p.category}">${p.category.split(' ')[0]}</span>
        ${p.imageData || p.image ? `<img src="${p.imageData || p.image}" alt="${p.name}">` : `<div class="no-img-placeholder"><span style="font-size:24px;font-weight:900">${p.name.charAt(0)}</span></div>`}
      </div>
      <div class="img-info">
        <div class="img-name">${p.name}</div>
        <div class="img-path" style="font-size:10px">${p.category}</div>
      </div>
      <div class="img-actions">
        <button onclick="editPartner(${p.id})" title="Edit"><i class="fas fa-pen"></i> Edit</button>
        <button onclick="deletePartner(${p.id})" title="Hapus"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    </div>`).join('');
}

function openPartnerModal() {
  document.getElementById('partnerModal').classList.add('active');
  document.getElementById('fPartnerId').value = '';
  document.getElementById('partnerModalTitle').textContent = 'Tambah Mitra Distribusi';
  document.getElementById('fPartnerName').value = '';
  document.getElementById('fPartnerCategory').value = 'NATIONAL KEY ACCOUNT';
  document.getElementById('fPartnerImageData').value = '';
  document.getElementById('fPartnerFile').value = '';
  document.querySelector('#partnerUploadArea .upload-preview').style.display = 'none';
  document.querySelector('#partnerUploadArea .upload-placeholder').style.display = 'block';
  document.getElementById('fPartnerPreview').src = '';
  document.body.style.overflow = 'hidden';
}

function removePartnerLogo() {
  document.getElementById('fPartnerImageData').value = '';
  document.getElementById('fPartnerFile').value = '';
  document.querySelector('#partnerUploadArea .upload-preview').style.display = 'none';
  document.querySelector('#partnerUploadArea .upload-placeholder').style.display = 'block';
  document.getElementById('fPartnerPreview').src = '';
}

function closePartnerModal() {
  document.getElementById('partnerModal').classList.remove('active');
  document.body.style.overflow = '';
}

function editPartner(id) {
  const p = partners.find(x => x.id == id);
  if (!p) return;
  openPartnerModal();
  document.getElementById('fPartnerId').value = p.id;
  document.getElementById('partnerModalTitle').textContent = 'Edit Mitra Distribusi';
  document.getElementById('fPartnerName').value = p.name;
  document.getElementById('fPartnerCategory').value = p.category;
  document.getElementById('fPartnerImageData').value = p.imageData || '';
  if (p.imageData || p.image) {
    const pc = document.querySelector('#partnerUploadArea .upload-preview');
    const ph = document.querySelector('#partnerUploadArea .upload-placeholder');
    const img = document.getElementById('fPartnerPreview');
    if (pc && img) { 
        img.src = p.imageData || p.image; 
        pc.style.display = 'block';
        if (ph) ph.style.display = 'none';
    }
  }
}

function handlePartnerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Ukuran file max 2MB', 'error');
  
  const saveBtn = document.querySelector('#partnerModal .btn-primary');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
  }

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('fPartnerImageData').value = e.target.result;
    const pc = document.querySelector('#partnerUploadArea .upload-preview');
    const ph = document.querySelector('#partnerUploadArea .upload-placeholder');
    const img = document.getElementById('fPartnerPreview');
    if (pc && img) { 
        img.src = e.target.result; 
        pc.style.display = 'block'; 
        if (ph) ph.style.display = 'none';
    }
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Simpan Mitra';
    }
  };
  reader.readAsDataURL(file);
}

function savePartnerEntry() {
  const name = document.getElementById('fPartnerName').value.trim();
  const category = document.getElementById('fPartnerCategory').value;
  if (!name) return toast('Nama mitra wajib diisi!', 'error');
  const imageData = document.getElementById('fPartnerImageData').value;
  const id = document.getElementById('fPartnerId').value;
  
  if (id) {
    const idx = partners.findIndex(x => x.id == id);
    if (idx >= 0) {
      partners[idx].name = name;
      partners[idx].category = category;
      if (imageData) {
        partners[idx].imageData = imageData;
        partners[idx].image = ''; // Clear path if we use raw data
      }
    }
    toast('Mitra berhasil diperbarui!', 'success');
  } else {
    partners.push({ 
      id: Date.now(), 
      name: name, 
      category: category, 
      image: '', 
      imageData: imageData || '', 
      active: true 
    });
    toast('Mitra berhasil ditambahkan!', 'success');
  }
  savePartners();
  renderPartners();
  closePartnerModal();
}

function deletePartner(id) {
  const p = partners.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = 'Hapus Mitra?';
  document.getElementById('confirmMsg').textContent = `"${p.name}" akan dihapus dari daftar mitra distribusi.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => {
    partners = partners.filter(x => x.id !== id);
    savePartners(); renderPartners(); closeConfirm(); toast('Mitra berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// CATEGORIES MANAGEMENT
// ==========================================
const defaultCategories = [
  { key: 'snack', title: 'Makanan Ringan', desc: 'Super Ring, Cheese Balls, Rota, Rostik, Chicken Ring, Green Pea Snack dan lainnya.', image: 'assets/images/snack.png', imageData: '' },
  { key: 'biskuit', title: 'Biskuit & Cookies', desc: 'Beragam biskuit, cream crackers, dan cookies premium dari brand internasional.', image: 'assets/images/biskuit.png', imageData: '' },
  { key: 'wafer', title: 'Wafer', desc: 'Wafer coklat, vanilla, dan berbagai varian rasa dari produsen berkualitas.', image: 'assets/images/wafer.png', imageData: '' },
  { key: 'kue', title: 'Kue & Pastry', desc: 'Swiss roll, layer cake, muffin dan berbagai kue kemasan premium.', image: 'assets/images/kue.png', imageData: '' },
  { key: 'minuman', title: 'Minuman', desc: 'Berbagai minuman berkualitas termasuk jus, teh, dan minuman rasa buah.', image: 'assets/images/minuman.png', imageData: '' },
  { key: 'permen', title: 'Permen', desc: 'Berbagai macam permen dan manisan dengan rasa yang menyegarkan.', image: 'assets/images/permen.png', imageData: '' },
  { key: 'condiments', title: 'Condiments & Sauces', desc: 'Saus, bumbu, dan bahan pelengkap makanan untuk menambah citarasa.', image: 'assets/images/condiments.png', imageData: '' },
  { key: 'noodle', title: 'Instant Noodle', desc: 'Mie instan dengan berbagai pilihan rasa dari brand internasional terbaik.', image: 'assets/images/noodle.png', imageData: '' },
  { key: 'vegelicious', title: 'Vegelicious', desc: 'Pilihan makanan sehat dan bernutrisi tinggi berbasis sayuran berkualitas.', image: 'assets/images/vegelicious.png', imageData: '' },
  { key: 'pudding', title: 'Pudding', desc: 'Berbagai produk pudding premium dengan rasa yang lezat dan menyegarkan.', image: 'assets/images/pudding.png', imageData: '' }
];

function renderCategoriesEditor() {
  const stored = localStorage.getItem('mas_categories');
  const cats = stored ? JSON.parse(stored) : defaultCategories;
  const editor = document.getElementById('categoriesEditor');
  if (!editor) return;
  editor.innerHTML = cats.map((c, i) => `
    <div style="border:1px solid var(--gray-100);border-radius:12px;padding:20px;margin-bottom:16px;background:var(--gray-50)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span class="category-badge ${c.key}" style="font-size:11px;">${c.key.toUpperCase()}</span>
        <strong style="color:var(--primary)">${c.title}</strong>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Judul</label><input type="text" class="form-input" id="fCat${i}Title" value="${c.title}"></div>
        <div class="form-group full"><label class="form-label">Deskripsi</label><input type="text" class="form-input" id="fCat${i}Desc" value="${c.desc}"></div>
        <div class="form-group full">
          <label class="form-label">Gambar Kategori</label>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:80px;height:60px;border-radius:8px;overflow:hidden;background:#eee;flex-shrink:0;display:flex;align-items:center;justify-content:center">
              <img id="fCat${i}Preview" src="${c.imageData || c.image}" style="width:100%;height:100%;object-fit:cover">
            </div>
            <input type="file" accept="image/*" onchange="handleCatImageUpload(event,${i})" style="font-size:12px">
            <input type="hidden" id="fCat${i}ImageData" value="${c.imageData || ''}">
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function handleCatImageUpload(event, index) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Max 2MB', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(`fCat${index}ImageData`).value = e.target.result;
    const preview = document.getElementById(`fCat${index}Preview`);
    if (preview) preview.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveCategories() {
  const stored = localStorage.getItem('mas_categories');
  const cats = stored ? JSON.parse(stored) : defaultCategories;
  for (let i = 0; i < cats.length; i++) {
    const title = document.getElementById(`fCat${i}Title`);
    const desc = document.getElementById(`fCat${i}Desc`);
    const imgData = document.getElementById(`fCat${i}ImageData`);
    if (title) cats[i].title = title.value.trim();
    if (desc) cats[i].desc = desc.value.trim();
    if (imgData && imgData.value) cats[i].imageData = imgData.value;
  }
  localStorage.setItem('mas_categories', JSON.stringify(cats));
  saveToFile('categories', cats);
  toast('Kategori berhasil disimpan!', 'success');
}

// ==========================================
// CERTIFICATIONS MANAGEMENT
// ==========================================
const defaultCertifications = [
  { title: 'Sertifikat Halal', desc: 'Semua produk bersertifikat halal dari MUI, menjamin kehalalan untuk konsumen Muslim Indonesia.', image: 'assets/images/icon/halal.png', imageData: '' },
  { title: 'Izin Edar BPOM', desc: 'Terdaftar dan diawasi oleh BPOM RI, menjamin keamanan dan kelayakan konsumsi produk.', image: 'assets/images/icon/bpom.png', imageData: '' },
  { title: 'Standar Internasional', desc: 'Produk diproduksi sesuai standar internasional dengan quality control ketat dari negara asal.', image: 'assets/images/icon/world.png', imageData: '' }
];

function renderCertEditor() {
  const stored = localStorage.getItem('mas_certifications');
  const certs = stored ? JSON.parse(stored) : defaultCertifications;
  const editor = document.getElementById('certEditor');
  if (!editor) return;
  editor.innerHTML = certs.map((c, i) => `
    <div style="border:1px solid var(--gray-100);border-radius:12px;padding:20px;margin-bottom:16px;background:var(--gray-50)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--white);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
          <img id="fCert${i}IconPreview" src="${c.imageData || c.image}" style="width:28px;height:28px;object-fit:contain">
        </div>
        <strong style="color:var(--primary)">${c.title}</strong>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Judul</label><input type="text" class="form-input" id="fCert${i}Title" value="${c.title}"></div>
        <div class="form-group full"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="fCert${i}Desc" rows="2">${c.desc}</textarea></div>
        <div class="form-group">
          <label class="form-label">Gambar Icon</label>
          <input type="file" accept="image/*" onchange="handleCertImageUpload(event,${i})" style="font-size:12px">
          <input type="hidden" id="fCert${i}ImageData" value="${c.imageData || ''}">
        </div>
      </div>
    </div>
  `).join('');
}

function handleCertImageUpload(event, index) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast('Max 2MB', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(`fCert${index}ImageData`).value = e.target.result;
    const preview = document.getElementById(`fCert${index}IconPreview`);
    if (preview) preview.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveCertifications() {
  const stored = localStorage.getItem('mas_certifications');
  const certs = stored ? JSON.parse(stored) : defaultCertifications;
  for (let i = 0; i < certs.length; i++) {
    const title = document.getElementById(`fCert${i}Title`);
    const desc = document.getElementById(`fCert${i}Desc`);
    const imgData = document.getElementById(`fCert${i}ImageData`);
    if (title) certs[i].title = title.value.trim();
    if (desc) certs[i].desc = desc.value.trim();
    if (imgData && imgData.value) certs[i].imageData = imgData.value;
  }
  localStorage.setItem('mas_certifications', JSON.stringify(certs));
  saveToFile('certifications', certs);
  toast('Sertifikasi berhasil disimpan!', 'success');
}

// ==========================================
// FOOTER MANAGEMENT
// ==========================================
const defaultFooterInfo = {
  desc: 'Perusahaan importir dan distributor produk makanan & minuman berkualitas tinggi dari brand internasional terkemuka, dengan jaringan distribusi seluruh Indonesia.',
  year: '2025',
  company: 'PT Mitra Abadi Sindomas'
};

function loadFooterForm() {
  const stored = localStorage.getItem('mas_footer_info');
  const info = stored ? JSON.parse(stored) : defaultFooterInfo;
  document.getElementById('fFooterDesc').value = info.desc || '';
  document.getElementById('fFooterYear').value = info.year || '';
  document.getElementById('fFooterCompany').value = info.company || '';
}

// ==========================================
// NEWS/BERITA MANAGEMENT
// ==========================================
function loadNews() {
  const stored = localStorage.getItem('mas_news');
  if (stored) {
    newsItems = JSON.parse(stored);
  } else {
    newsItems = [];
  }
}

function saveNews() {
  safeLSSet('mas_news', newsItems);
  saveToFile('news', newsItems);
}

function renderNews() {
  const tbody = document.getElementById('newsTableBody');
  const empty = document.getElementById('newsEmptyState');
  if(!tbody) return;

  if (newsItems.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  // Sort by date descending
  const sorted = [...newsItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  tbody.innerHTML = sorted.map(n => {
    const dateStr = n.date ? new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    return `
    <tr>
      <td style="text-align:center;">
        <input type="checkbox" onchange="toggleNewsActive(${n.id})" ${n.active !== false ? 'checked' : ''} style="cursor:pointer; transform:scale(1.2);">
      </td>
      <td>
        <div style="width:80px; height:50px; background:#f0f0f0; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${n.imageData ? `<img src="${n.imageData}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:10px;color:#999;text-align:center;">Tanpa<br>Gambar</span>`}
        </div>
      </td>
      <td>
        <div style="font-weight:600">${n.title}</div>
        <div style="font-size:11px;color:rgba(0,0,0,0.4);margin-top:2px;">${(n.summary || '').substring(0, 60)}${(n.summary || '').length > 60 ? '...' : ''}</div>
      </td>
      <td>${dateStr}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit" onclick="editNews(${n.id})"><i class="fas fa-pen"></i></button>
          <button class="action-btn delete" title="Hapus" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

function openNewsModal() {
  document.getElementById('fNewsId').value = '';
  document.getElementById('newsModalTitle').textContent = 'Tambah Berita';
  document.getElementById('fNewsTitle').value = '';
  document.getElementById('fNewsDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('fNewsActive').value = 'true';
  document.getElementById('fNewsSummary').value = '';
  document.getElementById('fNewsContent').value = '';
  document.getElementById('fNewsImageData').value = '';
  document.getElementById('fNewsFile').value = '';
  
  const previewCont = document.querySelector('#newsUploadArea .upload-preview');
  if(previewCont) previewCont.style.display = 'none';
  const placeholder = document.querySelector('#newsUploadArea .upload-placeholder');
  if(placeholder) placeholder.style.display = '';
  const img = document.getElementById('fNewsPreview');
  if(img) img.src = '';
  
  document.getElementById('newsModalManager').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
  document.getElementById('newsModalManager').classList.remove('active');
  document.body.style.overflow = '';
}

function editNews(id) {
  const n = newsItems.find(x => x.id === id || x.id == id);
  if(!n) return;
  
  openNewsModal();
  document.getElementById('fNewsId').value = n.id;
  document.getElementById('newsModalTitle').textContent = 'Edit Berita';
  document.getElementById('fNewsTitle').value = n.title || '';
  document.getElementById('fNewsDate').value = n.date || '';
  document.getElementById('fNewsActive').value = n.active !== false ? 'true' : 'false';
  document.getElementById('fNewsSummary').value = n.summary || '';
  document.getElementById('fNewsContent').value = n.content || '';
  document.getElementById('fNewsImageData').value = n.imageData || '';
  
  if (n.imageData) {
    const previewCont = document.querySelector('#newsUploadArea .upload-preview');
    const placeholder = document.querySelector('#newsUploadArea .upload-placeholder');
    const img = document.getElementById('fNewsPreview');
    if(previewCont && img) {
      img.src = n.imageData;
      previewCont.style.display = 'block';
      if(placeholder) placeholder.style.display = 'none';
    }
  }
}

function handleNewsUpload(event) {
  const file = event.target.files[0];
  if(file) {
    if (file.size > 2 * 1024 * 1024) return toast('Ukuran file maksimal 2MB', 'error');
    
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('fNewsImageData').value = e.target.result;
      const previewCont = document.querySelector('#newsUploadArea .upload-preview');
      const placeholder = document.querySelector('#newsUploadArea .upload-placeholder');
      const img = document.getElementById('fNewsPreview');
      if(previewCont && img) {
        img.src = e.target.result;
        previewCont.style.display = 'block';
        if(placeholder) placeholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }
}

function saveNewsEntry() {
  const title = document.getElementById('fNewsTitle').value.trim();
  const date = document.getElementById('fNewsDate').value;
  const summary = document.getElementById('fNewsSummary').value.trim();
  const content = document.getElementById('fNewsContent').value.trim();
  const imageData = document.getElementById('fNewsImageData').value;
  const active = document.getElementById('fNewsActive').value === 'true';
  const id = document.getElementById('fNewsId').value;
  
  if(!title || !date || !summary || !content) return toast('Harap lengkapi judul, tanggal, ringkasan, dan konten!', 'error');
  
  if (id) {
    const idx = newsItems.findIndex(x => x.id == id);
    if (idx >= 0) {
      newsItems[idx].title = title;
      newsItems[idx].date = date;
      newsItems[idx].summary = summary;
      newsItems[idx].content = content;
      newsItems[idx].active = active;
      if(imageData) newsItems[idx].imageData = imageData;
    }
    toast('Berita berhasil diperbarui!', 'success');
  } else {
    newsItems.push({
      id: Date.now(),
      title: title,
      date: date,
      summary: summary,
      content: content,
      imageData: imageData,
      imagePath: '',
      active: active,
      createdAt: new Date().toISOString()
    });
    toast('Berita berhasil ditambahkan!', 'success');
  }
  
  saveNews();
  renderNews();
  closeNewsModal();
}

function toggleNewsActive(id) {
  const n = newsItems.find(x => x.id === id || x.id == id);
  if(n) {
    n.active = !n.active;
    saveNews();
    renderNews();
    toast('Status berita berhasil diubah.', 'success');
  }
}

function deleteNews(id) {
  const n = newsItems.find(x => x.id === id || x.id == id);
  document.getElementById('confirmTitle').textContent = 'Hapus Berita?';
  document.getElementById('confirmMsg').textContent = `"${n ? n.title : ''}" akan dihapus permanen.`;
  document.getElementById('confirmBtn').textContent = 'Ya, Hapus';
  document.getElementById('confirmBtn').className = 'btn btn-danger';
  document.getElementById('confirmBtn').onclick = () => { 
    newsItems = newsItems.filter(x => x.id !== id && x.id != id);
    saveNews(); renderNews(); closeConfirm(); toast('Berita berhasil dihapus', 'success');
  };
  document.getElementById('confirmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function saveFooterInfo() {
  const info = {
    desc: document.getElementById('fFooterDesc').value.trim(),
    year: document.getElementById('fFooterYear').value.trim(),
    company: document.getElementById('fFooterCompany').value.trim()
  };
  localStorage.setItem('mas_footer_info', JSON.stringify(info));
  saveToFile('footer_info', info);
  toast('Footer berhasil disimpan!', 'success');
}

// ==========================================
// TOAST
// ==========================================
function toast(msg, type='info') {
  const icons = {success:'check-circle',error:'times-circle',info:'info-circle',warning:'exclamation-triangle'};
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${msg}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(40px)'; setTimeout(() => el.remove(), 400); }, 3500);
}

// ==========================================
// DRAG & DROP & CLICK
// ==========================================
document.querySelectorAll('.image-upload-area, .upload-area').forEach(area => {
  // Click support
  area.addEventListener('click', (e) => {
    // If we didn't click the input directly, trigger it
    if (e.target.tagName !== 'INPUT') {
      const input = area.querySelector('input[type="file"]');
      if (input) input.click();
    }
  });

  // Drag & drop support
  ['dragenter','dragover'].forEach(ev => area.addEventListener(ev, e => {
    e.preventDefault();
    e.stopPropagation();
    area.classList.add('dragover');
  }));
  
  ['dragleave','drop'].forEach(ev => area.addEventListener(ev, e => {
    e.preventDefault();
    e.stopPropagation();
    area.classList.remove('dragover');
  }));
  
  area.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = area.querySelector('input[type="file"]');
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        // Manual dispatch
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
      }
    }
  });
});

// Close modals on overlay click
['productModal','confirmModal','importModal','katalogModalManager','promoModalManager','heroModalManager','topHeroModalManager','partnerModal','brandPartnerModal','newsModalManager'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', function(e) {
    if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = ''; }
  });
});

// ESC to close modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['productModal','confirmModal','importModal','katalogModalManager','promoModalManager','heroModalManager','partnerModal','brandPartnerModal','newsModalManager'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ==========================================
// INIT
// ==========================================
checkSession();
