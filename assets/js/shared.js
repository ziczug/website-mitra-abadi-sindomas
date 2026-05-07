/**
 * shared.js — PT Mitra Abadi Sindomas
 * Berisi semua logika yang digunakan di seluruh halaman:
 * - Navbar scroll effect & mobile toggle
 * - Nav indicator
 * - Search functionality
 * - Scroll-to-top button
 * - Floating CS Contact Form (WhatsApp)
 */

document.addEventListener('DOMContentLoaded', function () {

  // =============================================
  // NAVBAR: Scroll Effect, Mobile Toggle, Indicator
  // =============================================
  const navbar       = document.getElementById('navbar');
  const navLinks     = document.getElementById('navLinks');
  const mobileToggle = document.getElementById('mobileToggle');
  const navOverlay   = document.getElementById('navOverlay');
  const navIndicator = document.getElementById('navIndicator');
  const navItems     = document.querySelectorAll('.nav-item');
  const scrollTopBtn = document.getElementById('scrollTop');

  // Scroll handler — mengubah navbar dari transparan ke solid
  const checkScroll = () => {
    const scrolled = window.scrollY > 50;
    if (navbar)       navbar.classList.toggle('scrolled', scrolled);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', checkScroll);
  window.addEventListener('load', checkScroll);
  checkScroll();

  // Mobile nav toggle
  window.toggleNav = function () {
    if (!navLinks || !mobileToggle) return;
    navLinks.classList.toggle('active');
    mobileToggle.classList.toggle('active');
    if (navOverlay) navOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  };

  // Tutup nav saat link diklik (mobile)
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      if (navLinks) navLinks.classList.remove('active');
      if (mobileToggle) mobileToggle.classList.remove('active');
      if (navOverlay) navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Nav Indicator (hover underline)
  function updateIndicator(indicator, el) {
    if (!indicator || !el || window.innerWidth <= 768) {
      if (indicator) indicator.style.opacity = '0';
      return;
    }
    indicator.style.opacity = '1';
    indicator.style.width   = el.offsetWidth + 'px';
    indicator.style.left    = el.offsetLeft + 'px';
  }

  function initIndicators() {
    const activeItem = document.querySelector('.nav-item.active') || navItems[0];
    updateIndicator(navIndicator, activeItem);
  }

  setTimeout(initIndicators, 300);
  window.addEventListener('resize', initIndicators);

  navItems.forEach(item => {
    item.addEventListener('mouseenter', () => updateIndicator(navIndicator, item));
  });

  if (navLinks) {
    navLinks.addEventListener('mouseleave', () => {
      updateIndicator(navIndicator, document.querySelector('.nav-item.active') || navItems[0]);
    });
  }

  // Language Dropdown
  window.toggleLangDropdown = function (isMobile) {
    const dd = isMobile
      ? document.getElementById('langDropdownMobile')
      : document.getElementById('langDropdown');
    if (dd) dd.classList.toggle('active');
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown')) {
      document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('active'));
    }
  });

  // =============================================
  // SEARCH FUNCTIONALITY
  // =============================================
  const searchWrapper   = document.getElementById('searchWrapper');
  const searchToggle    = document.getElementById('searchToggle');
  const searchContainer = document.getElementById('searchContainer');
  const searchInput     = document.getElementById('searchInput');
  const searchResults   = document.getElementById('searchResults');

  let searchProducts = [];

  async function initSearchData() {
    try {
      const resp = await fetch('database/cms/products.json');
      if (resp.ok) {
        searchProducts = await resp.json();
      }
    } catch (e) {
      // Fallback ke CSV jika JSON gagal
      if (typeof Papa !== 'undefined') {
        Papa.parse('database/produk.csv', {
          download: true,
          header: true,
          complete: (results) => { searchProducts = results.data.filter(p => p.name); }
        });
      }
    }
  }
  initSearchData();

  if (searchToggle) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = searchContainer.classList.toggle('active');
      searchToggle.classList.toggle('active');
      const icon = searchToggle.querySelector('i');
      if (isActive) {
        icon.classList.replace('fa-search', 'fa-times');
        if (searchInput) searchInput.focus();
      } else {
        icon.classList.replace('fa-times', 'fa-search');
        if (searchInput)  searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) { searchResults.innerHTML = ''; return; }

      const results = searchProducts.filter(p =>
        (p.name   && p.name.toLowerCase().includes(query))   ||
        (p.brand  && p.brand.toLowerCase().includes(query))  ||
        (p.category && p.category.toLowerCase().includes(query))
      ).slice(0, 6);

      searchResults.innerHTML = results.map(p => `
        <div class="search-result-item" onclick="goToProduct('${p.id}')">
          <img src="${p.image || p.imageData || 'assets/images/placeholder.png'}"
               alt="${p.name}" class="search-result-img"
               onerror="this.src='assets/images/placeholder.png'">
          <div class="search-result-info">
            <span class="search-result-title">${p.name}</span>
            <span class="search-result-meta">${p.brand || ''} • ${p.category || ''}</span>
          </div>
        </div>
      `).join('');
    });
  }

  window.goToProduct = function (id) {
    window.location.href = `produk.html?search=${id}`;
  };

  window.closeSearch = function () {
    if (searchContainer) searchContainer.classList.remove('active');
    if (searchToggle) {
      searchToggle.classList.remove('active');
      const icon = searchToggle.querySelector('i');
      if (icon) icon.classList.replace('fa-times', 'fa-search');
    }
    if (searchInput)   searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  };

  document.addEventListener('click', (e) => {
    if (searchWrapper && !searchWrapper.contains(e.target) &&
        searchContainer && searchContainer.classList.contains('active')) {
      window.closeSearch();
    }
  });

  // =============================================
  // FLOATING CS CONTACT FORM (WHATSAPP)
  // =============================================
  window.toggleContactModal = function () {
    const modal = document.getElementById('contactModalOverlay');
    if (!modal) return;
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
      initContactFormProducts();
    }
  };

  async function initContactFormProducts() {
    const productSelect = document.getElementById('waProduct');
    if (!productSelect || productSelect.options.length > 1) return;

    let prods = [];
    try {
      const resp = await fetch('database/cms/products.json');
      if (resp.ok) {
        prods = await resp.json();
      } else {
        const stored = localStorage.getItem('mas_products');
        if (stored) prods = JSON.parse(stored);
      }
    } catch (e) {
      const stored = localStorage.getItem('mas_products');
      if (stored) { try { prods = JSON.parse(stored); } catch (_) {} }
    }

    if (!prods || prods.length === 0) return;

    const seen = new Set();
    prods.forEach(p => {
      const catLabel = getCategoryLabel(p.category);
      const display  = `${p.name} - ${p.brand} - ${catLabel}`;
      if (!seen.has(display)) {
        seen.add(display);
        const opt = document.createElement('option');
        opt.value = display;
        opt.textContent = display;
        opt.dataset.image = p.imageData || p.image || '';
        productSelect.appendChild(opt);
      }
    });
  }

  window.updateProductPreview = function () {
    const select      = document.getElementById('waProduct');
    const box         = document.getElementById('waProductPreviewBox');
    const img         = document.getElementById('waProductImg');
    const placeholder = document.getElementById('waProductPlaceholder');
    if (!select || select.selectedIndex < 0) return;

    const imgSrc = select.options[select.selectedIndex].dataset.image;
    if (imgSrc) {
      img.src = imgSrc;
      img.classList.add('loaded');
      if (placeholder) placeholder.style.display = 'none';
      if (box) box.classList.add('active');
    } else {
      img.src = '';
      img.classList.remove('loaded');
      if (placeholder) placeholder.style.display = 'block';
      if (box) box.classList.remove('active');
    }
  };

  window.sendWhatsApp = function () {
    const name    = (document.getElementById('waName')?.value    || '').trim();
    const phone   = (document.getElementById('waPhone')?.value   || '').trim();
    const region  = (document.getElementById('waRegion')?.value  || '').trim();
    const outlet  = (document.getElementById('waOutlet')?.value  || '').trim();
    const product = (document.getElementById('waProduct')?.value || '');
    const message = (document.getElementById('waMessage')?.value || '').trim();

    if (!name || !phone) {
      alert('Mohon isi Nama dan No. WhatsApp Anda.');
      return;
    }

    const targetPhone = '6281295001778';
    const text = `Halo Mitra Abadi, Saya calon customer ${name}, nomer telpon ${phone}, Region ${region}. ` +
      `nama outlet ${outlet}, tertarik produk ${product || 'Umum'}. \n\n` +
      `${message}\n\n` +
      `Setelah saya pelajari di website dan lihat katalog saya cukup tertarik.`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  window.getCategoryLabel = function (cat) {
    if (typeof t === 'function') {
      const translated = t(`cat-${cat}`);
      if (translated !== `cat-${cat}`) return translated;
    }
    const labels = {
      snack: 'Snack', biskuit: 'Biskuit', wafer: 'Wafer', kue: 'Kue & Pastry',
      minuman: 'Minuman', permen: 'Permen', condiments: 'Condiments',
      noodle: 'Instant Noodle', vegelicious: 'Vegelicious', pudding: 'Pudding'
    };
    return labels[cat] || cat;
  };

  // Reveal animation untuk page lain (tentang, berita, dll)
  function reveal() {
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight - 100) {
        el.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', reveal);
  reveal();

}); // END DOMContentLoaded
