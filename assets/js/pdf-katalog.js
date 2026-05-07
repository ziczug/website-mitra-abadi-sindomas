// ==========================================
// KATALOG PDF LOGIC (Shared Across All Pages)
// ==========================================

let pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  pdfScale = 0.8;

document.addEventListener('DOMContentLoaded', () => {
  const catalogModal = document.getElementById('catalogModal');
  const pdfLoading = document.getElementById('pdfLoading');
  const pdfViewer = document.getElementById('pdfViewer') || document.querySelector('.pdf-stage');
  const pdfCanvas = document.getElementById('pdfCanvas');
  
  if (!pdfCanvas) return; // Safeguard if not present
  
  const ctx = pdfCanvas.getContext('2d');

  window.renderPage = function(num) {
    if (!pdfDoc) return;
    pageRendering = true;

    // 1. Render Halaman Utama
    renderSingleCanvas(num, pdfCanvas, pdfScale, true);

    // 2. Render Halaman Sebelumnya (Mini Preview - Kiri)
    const prevContainer = document.getElementById('pdfSidePrev');
    if (prevContainer) {
      if (num > 1) {
        prevContainer.style.visibility = 'visible';
        renderSingleCanvas(num - 1, document.getElementById('pdfCanvasPrev'), 0.3, false);
      } else {
        prevContainer.style.visibility = 'hidden';
      }
    }

    // 3. Render Halaman Berikutnya (Mini Preview - Kanan)
    const nextContainer = document.getElementById('pdfSideNext');
    if (nextContainer) {
      if (num < pdfDoc.numPages) {
        nextContainer.style.visibility = 'visible';
        renderSingleCanvas(num + 1, document.getElementById('pdfCanvasNext'), 0.3, false);
      } else {
        nextContainer.style.visibility = 'hidden';
      }
    }

    const pageNumEl = document.getElementById('pdfPageNum');
    if (pageNumEl) pageNumEl.textContent = num;
    
    const zoomLevelEl = document.getElementById('pdfZoomLevel');
    if (zoomLevelEl) zoomLevelEl.textContent = Math.round(pdfScale * 100) + '%';
  };

  function renderSingleCanvas(num, canvas, scale, isMain) {
    if (!canvas) return;
    pdfDoc.getPage(num).then(function (page) {
      const viewport = page.getViewport({ scale: scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const ctx = canvas.getContext('2d');
      const renderContext = { canvasContext: ctx, viewport: viewport };
      page.render(renderContext).promise.then(() => {
        if (isMain) {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        }
      });
    });
  }

  window.queueRenderPage = function(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  };

  // Navigasi Klik pada Preview Samping
  const sidePrev = document.getElementById('pdfSidePrev');
  if (sidePrev) {
    sidePrev.onclick = () => {
      if (pageNum <= 1) return;
      pageNum--;
      
      const stage = document.querySelector('.pdf-stage');
      if (stage) {
        stage.classList.add('flipping');
        setTimeout(() => stage.classList.remove('flipping'), 600);
      }
      
      renderPage(pageNum);
    };
  }
  
  const sideNext = document.getElementById('pdfSideNext');
  if (sideNext) {
    sideNext.onclick = () => {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      
      const stage = document.querySelector('.pdf-stage');
      if (stage) {
        stage.classList.add('flipping');
        setTimeout(() => stage.classList.remove('flipping'), 600);
      }
      
      renderPage(pageNum);
    };
  }

  const btnPrev = document.getElementById('pdfPrev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (pageNum <= 1) return;
      pageNum--;
    
      const stage = document.querySelector('.pdf-stage');
      if (stage) {
        stage.classList.add('flipping');
        setTimeout(() => stage.classList.remove('flipping'), 600);
      }
    
      queueRenderPage(pageNum);
      const viewer = document.querySelector('.pdf-stage') || document.querySelector('#pdfViewer > div:nth-child(2)');
      if (viewer) viewer.scrollTop = 0;
    });
  }

  const btnNext = document.getElementById('pdfNext');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
    
      const stage = document.querySelector('.pdf-stage');
      if (stage) {
        stage.classList.add('flipping');
        setTimeout(() => stage.classList.remove('flipping'), 600);
      }
    
      queueRenderPage(pageNum);
      const viewer = document.querySelector('.pdf-stage') || document.querySelector('#pdfViewer > div:nth-child(2)');
      if (viewer) viewer.scrollTop = 0;
    });
  }

  const btnZoomIn = document.getElementById('pdfZoomIn');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (pdfScale >= 3.0) return;
      pdfScale += 0.2;
      queueRenderPage(pageNum);
    });
  }

  const btnZoomOut = document.getElementById('pdfZoomOut');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (pdfScale <= 0.5) return;
      pdfScale -= 0.2;
      queueRenderPage(pageNum);
    });
  }

  window.openKatalog = function() {
    if (catalogModal) {
      catalogModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    // Set default zoom to 80% (scale 0.8)
    pdfScale = 0.8;
    
    if (!pdfDoc) {
      if (pdfLoading) pdfLoading.style.display = 'flex';
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      const savedKatalog = localStorage.getItem('mas_katalog_path') || 'Catalog PTMAS 2026_compressed.pdf';
      const btnDownload = document.querySelector('.btn-download-katalog');
      if (btnDownload) {
        btnDownload.href = 'database/asset-katalog/' + savedKatalog;
      }

      const loadingTask = pdfjsLib.getDocument('database/asset-katalog/' + savedKatalog);
      loadingTask.promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        const pageCountEl = document.getElementById('pdfPageCount');
        if (pageCountEl) pageCountEl.textContent = pdfDoc.numPages;
        if (pdfLoading) pdfLoading.style.display = 'none';
        if (pdfViewer) pdfViewer.style.display = 'flex';
        renderPage(pageNum);
      }).catch(function (err) {
        console.error("PDFJS Error: ", err);
        if (pdfLoading) pdfLoading.innerHTML = '<p>Gagal memuat katalog. Pastikan jalur file benar.</p>';
      });
    } else {
      // Jika sudah terload, pastikan dirender ulang dengan skala default
      renderPage(pageNum);
    }
  };

  window.closeKatalog = function() {
    if (catalogModal) catalogModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (catalogModal) {
    catalogModal.addEventListener('click', (e) => {
      if (e.target === catalogModal) closeKatalog();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && catalogModal && catalogModal.classList.contains('active')) {
      closeKatalog();
    }
  });

});
