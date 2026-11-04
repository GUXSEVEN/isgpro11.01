// content.js - İSGPRO Katip Asistanı Sayfa İçi Akıllı Bot Scripti (v4.1)
// API/Network Interceptor Desteği, Doğrudan Sistem Verisi Çekme, Boş Liste Doğrulaması & Kusursuz Alan Eşleme
console.log('İSGPRO İSG-KATİP Akıllı Asistanı (v4.1 - Sistem API & Network Entegreli Kesin Çözüm) Devrede.');

// Injected Script'i Sayfaya Dahil Et (Eğer daha önce yüklenmediyse)
function ensureInjectedScript() {
  if (document.getElementById('isgpro-injected-script')) return;
  const s = document.createElement('script');
  s.id = 'isgpro-injected-script';
  s.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(s);
}
try { ensureInjectedScript(); } catch (e) {}

// State
let isRunningAction = false;
let isAutoPaginating = false;
let shouldStopPagination = false;
let activeMainTab = 'active'; // 'active' (Devam Eden) | 'pending' (Onay Bekleyen)

let allScannedContracts = [];
let activeCompanies = [];
let pendingCompanies = [];
let activeContracts = [];
let pendingContracts = [];

let selectedCompanyIds = new Set();
let expandedCompanyIds = new Set();
let scannedEmployees = [];

// API Yakalama Önbelleği
let latestApiContracts = [];
let lastApiMode = '';

// Injected Script'ten Gelen API Mesajlarını Dinle
window.addEventListener('message', (event) => {
  if (!event.data || event.data.source !== 'ISGPRO_INJECTED') return;

  if (event.data.type === 'KATIP_API_CONTRACTS' || event.data.type === 'KATIP_DIRECT_FETCH_SUCCESS') {
    const rawList = event.data.contracts || [];
    if (rawList.length > 0) {
      logMessage(`🎯 [Sistem API Yakalandı] Bakanlık sunucusundan ${rawList.length} sözleşme ham veri olarak yakalandı!`);
      latestApiContracts = rawList;
      lastApiMode = event.data.mode || (isCurrentPortalPageDevamEden() ? 'DEVAM_EDEN' : 'ONAY_BEKLEYEN');
    }
  } else if (event.data.type === 'KATIP_API_EMPTY_CONTRACTS') {
    logMessage('ℹ️ [Sistem API] Portaldan boş sözleşme listesi (0 kayıt) teyit edildi.');
    latestApiContracts = [];
  }
});

// 1. ARAYÜZ (FLOATING WIDGET) ENJEKSİYONU
function injectFloatingBot() {
  if (document.getElementById('isgpro-katip-floating-root')) return;

  const root = document.createElement('div');
  root.id = 'isgpro-katip-floating-root';
  root.innerHTML = `
    <button id="isgpro-katip-toggle-btn" type="button" title="İSGPRO İSG-KATİP Asistanını Aç/Kapat">
      <span style="font-size:17px;">🤖</span>
      <span>İSGPRO Katip Botu</span>
    </button>

    <div id="isgpro-katip-panel" style="width:610px;max-width:calc(100vw - 24px);">
      <div class="isgpro-panel-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <strong style="font-size:13.5px;">İSGPRO Katip Asistanı</strong>
          <span class="isgpro-badge isgpro-badge-success">v4.1 Sistem API Modu</span>
        </div>
        <button id="isgpro-btn-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;line-height:1;" title="Kapat">✕</button>
      </div>

      <div class="isgpro-panel-body">
        <!-- Tarama Kontrol Kartı -->
        <div class="isgpro-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-weight:800;font-size:12px;color:#0f172a;display:flex;align-items:center;gap:6px;">
              <span>📑 Doğrudan Sistem Verisi Çekici</span>
            </div>
            <span id="isgpro-selection-badge" class="isgpro-badge isgpro-badge-warning">0 Firma Seçildi</span>
          </div>

          <p style="font-size:11px;color:#64748b;margin:0 0 10px 0;line-height:1.4;">
            Bakanlık sunucusundaki orijinal JSON verilerini doğrudan çeker.
            Gerçek çalışan sayıları, atalı uzman/hekim aylık dakika süreleri ve DETSİS numaraları %100 doğrulukla listelenir.
          </p>

          <!-- 2 Temel Buton -->
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:6px;">
            <button id="isgpro-btn-scan-devam" class="isgpro-btn isgpro-btn-emerald" style="padding:10px 14px;font-size:12px;" title="İSG-KATİP portalında Devam Eden Sözleşmeler ekranına geçer ve tüm sayfaları çeker">
              🟢 Devam Eden Sözleşmeleri Çek (Tüm Sayfalar)
            </button>

            <button id="isgpro-btn-scan-pending" class="isgpro-btn isgpro-btn-amber-dark" style="padding:10px 14px;font-size:12px;" title="İSG-KATİP portalında Onay Bekleyen Sözleşmeler ekranına geçer ve tüm sayfaları çeker">
              🟡 Onay Bekleyen Sözleşmeleri Çek (Tüm Sayfalar)
            </button>
          </div>

          <button id="isgpro-btn-stop-scan" class="isgpro-btn isgpro-btn-danger" style="display:none;margin-bottom:6px;">
            ⏹️ Taramayı Durdur
          </button>

          <!-- İlerleme Çubuğu -->
          <div id="isgpro-progress-container" class="isgpro-progress-container">
            <div id="isgpro-progress-bar" class="isgpro-progress-bar"></div>
          </div>
          <div id="isgpro-progress-text" style="font-size:10px;color:#6366f1;font-weight:700;margin-top:3px;display:none;text-align:right;">
            Veriler çekiliyor...
          </div>

          <!-- Taranan Veri Alanı (Dinamik) -->
          <div id="isgpro-company-section" style="display:none;margin-top:12px;">
            <!-- 2 Ana Sekme: Devam Edenler ve Onay Bekleyenler -->
            <div class="isgpro-tabs" style="margin-bottom:10px;">
              <button type="button" id="isgpro-tab-active" class="isgpro-tab-btn active">
                🟢 Devam Edenler (0)
              </button>
              <button type="button" id="isgpro-tab-pending" class="isgpro-tab-btn">
                🟡 Onay Bekleyenler (0)
              </button>
            </div>

            <!-- Filtre Arama -->
            <input
              type="text"
              id="isgpro-company-search"
              class="isgpro-search-input"
              placeholder="Firma adı, DETSİS No, İşyeri SGK, Uzman veya Hekim ile ara..."
            />

            <div class="isgpro-company-list-wrapper">
              <div class="isgpro-toolbar">
                <span id="isgpro-toolbar-count" style="font-weight:700;font-size:10.5px;">0 Firma Gösteriliyor</span>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button type="button" id="isgpro-btn-select-all" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    ☑️ Tümünü Seç
                  </button>
                  <button type="button" id="isgpro-btn-deselect-all" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    ⬜ Temizle
                  </button>
                  <button type="button" id="isgpro-btn-export-csv" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;" title="Excel CSV Olarak İndir">
                    📊 CSV
                  </button>
                  <button type="button" id="isgpro-btn-copy-tsv" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;" title="Excel için Tabloyu Kopyala">
                    📋 Kopyala
                  </button>
                </div>
              </div>

              <!-- Liste Konteyneri -->
              <div id="isgpro-company-list" class="isgpro-company-list" style="max-height:350px;">
                <!-- Dinamik Firma ve Sözleşme Kartları -->
              </div>
            </div>

            <div style="margin-top:10px;">
              <button id="isgpro-btn-export-selected" class="isgpro-btn isgpro-btn-emerald" disabled>
                📥 Seçilen Firmaları İSGPRO'ya Aktar (0)
              </button>
            </div>
          </div>
        </div>

        <!-- Toplu İşlemler Kartı (Sözleşmeler) -->
        <div class="isgpro-card">
          <div style="font-weight:700;margin-bottom:6px;font-size:12px;">
            <span>⚡ Sözleşme Yönetim Araçları</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button id="isgpro-btn-approve-all" class="isgpro-btn isgpro-btn-indigo">
              ✓ Bekleyenleri Onayla
            </button>
            <button id="isgpro-btn-download-all" class="isgpro-btn isgpro-btn-amber">
              ⬇️ Sözleşmeleri İndir (PDF)
            </button>
          </div>
        </div>

        <!-- İşlem Konsolu (Loglar) -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:10.5px;font-weight:700;color:#475569;">İşlem Günlüğü:</span>
            <button id="isgpro-btn-diagnose" type="button" style="background:none;border:none;color:#6366f1;font-size:10.5px;font-weight:700;cursor:pointer;text-decoration:underline;">🔬 Tablo Teşhisi</button>
          </div>
          <div id="isgpro-log-box" class="isgpro-log-box">[Hazır] Çekmek istediğiniz sözleşme grubunu seçiniz.</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Olay Dinleyicileri
  const toggleBtn = document.getElementById('isgpro-katip-toggle-btn');
  const panel = document.getElementById('isgpro-katip-panel');
  const closeBtn = document.getElementById('isgpro-btn-close');

  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('active');
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('active');
  });

  // Teşhis Butonu
  const diagBtn = document.getElementById('isgpro-btn-diagnose');
  if (diagBtn) diagBtn.addEventListener('click', runDomDiagnostic);

  // 2 Ana Tarama Butonu
  document.getElementById('isgpro-btn-scan-devam').addEventListener('click', () => runSmartDirectFetch('DEVAM_EDEN'));
  document.getElementById('isgpro-btn-scan-pending').addEventListener('click', () => runSmartDirectFetch('ONAY_BEKLEYEN'));
  document.getElementById('isgpro-btn-stop-scan').addEventListener('click', handleStopScan);

  document.getElementById('isgpro-tab-active').addEventListener('click', () => switchMainTab('active'));
  document.getElementById('isgpro-tab-pending').addEventListener('click', () => switchMainTab('pending'));

  document.getElementById('isgpro-btn-select-all').addEventListener('click', () => toggleAllCurrentTab(true));
  document.getElementById('isgpro-btn-deselect-all').addEventListener('click', () => toggleAllCurrentTab(false));
  document.getElementById('isgpro-company-search').addEventListener('input', handleFilterChange);

  document.getElementById('isgpro-btn-export-selected').addEventListener('click', handleExportSelectedCompanies);
  document.getElementById('isgpro-btn-export-csv').addEventListener('click', handleExportCsv);
  document.getElementById('isgpro-btn-copy-tsv').addEventListener('click', handleCopyTsv);

  document.getElementById('isgpro-btn-approve-all').addEventListener('click', handleApproveAllContracts);
  document.getElementById('isgpro-btn-download-all').addEventListener('click', handleDownloadAllContracts);
}

// Log Mesajı Yazıcı
function logMessage(msg) {
  const box = document.getElementById('isgpro-log-box');
  const time = new Date().toLocaleTimeString('tr-TR');
  if (box) {
    box.textContent += `\n[${time}] ${msg}`;
    box.scrollTop = box.scrollHeight;
  }
  console.log(`[İSGPRO Katip Bot] ${msg}`);
}

// Sistem & Tablo Teşhisi Aracı
function runDomDiagnostic() {
  logMessage('🔬 [Teşhis] Ekrandaki tablo ve iframe yapısı inceleniyor...');

  const tables = Array.from(document.querySelectorAll('table, .p-datatable'));
  const iframes = Array.from(document.querySelectorAll('iframe'));

  let report = `=== İSGPRO PORTAL TEŞHİS RAPORU ===\n`;
  report += `Sayfa URL: ${window.location.href}\n`;
  report += `Iframe Sayısı: ${iframes.length}\n`;
  report += `Tablo Sayısı: ${tables.length}\n\n`;

  if (tables.length === 0) {
    report += `UYARI: Ekranda hiçbir <table> veya PrimeNG .p-datatable bulunamadı!\n`;
  }

  tables.forEach((t, tIdx) => {
    report += `--- Tablo #${tIdx + 1} (${t.tagName}.${t.className}) ---\n`;
    const ths = Array.from(t.querySelectorAll('thead th, .p-datatable-thead th, div[role="columnheader"]'));
    const headers = ths.map((th, i) => {
      const titleSpan = th.querySelector('.p-column-title, .ui-column-title');
      const txt = (titleSpan ? titleSpan.textContent : (th.innerText || th.textContent || '')).replace(/\s+/g, ' ').trim();
      return `[${i}: "${txt}"]`;
    });
    report += `Kolon Başlıkları (${headers.length}):\n${headers.join(' | ')}\n\n`;

    const firstRows = Array.from(t.querySelectorAll('tbody tr, .p-datatable-tbody > tr')).filter(r => !r.closest('thead')).slice(0, 3);
    report += `İlk Satırlar (${firstRows.length} adet):\n`;
    firstRows.forEach((r, rIdx) => {
      const tds = Array.from(r.querySelectorAll('td, div[role="cell"]'));
      const rowVals = tds.map((td, i) => `[${i}: "${td.innerText.replace(/\s+/g, ' ').trim()}"]`);
      report += `Satır #${rIdx + 1}: ${rowVals.join(' | ')}\n`;
    });
    report += `\n`;
  });

  console.log(report);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(report).then(() => {
      logMessage('✓ Teşhis raporu panoya (clipboard) KOPYALANDI!');
      alert('🔬 Teşhis raporu kopyalandı! Panonuza (Ctrl+V) yapıştırıp inceleyebilirsiniz.');
    }).catch(() => {
      logMessage('✓ Teşhis raporu F12 konsoluna yazıldı.');
    });
  } else {
    logMessage('✓ Teşhis raporu F12 konsoluna yazıldı.');
  }
}

// Sekme Değişimi: Devam Eden vs Onay Bekleyen
function switchMainTab(tab) {
  activeMainTab = tab;
  const tabActiveBtn = document.getElementById('isgpro-tab-active');
  const tabPendingBtn = document.getElementById('isgpro-tab-pending');

  if (tab === 'active') {
    tabActiveBtn.classList.add('active');
    tabPendingBtn.classList.remove('active');
  } else {
    tabPendingBtn.classList.add('active');
    tabActiveBtn.classList.remove('active');
  }

  renderList(document.getElementById('isgpro-company-search')?.value || '');
}

// 2. GELİŞMİŞ METİN & HÜCRE AYRIŞTIRMA

function normalizeText(str) {
  if (!str) return '';
  return str
    .toString()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCellCleanText(cell) {
  if (!cell) return '';
  try {
    const clone = cell.cloneNode(true);
    // Sadece PrimeNG mobil/duyarlı kolon başlığı etiketlerini temizle, asıl içerik butonlarını veya metinlerini SİLME!
    const titles = clone.querySelectorAll('.p-column-title, .ui-column-title, .column-title');
    titles.forEach(t => t.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  } catch (e) {
    return (cell.textContent || '').replace(/\s+/g, ' ').trim();
  }
}

// Portaldaki Mevcut Tablonun Boş Olup Olmadığını Anlar ("Kayıt bulunamadı")
function isTableEmptyOnPage() {
  const emptyIndicators = [
    '.p-datatable-emptymessage',
    '.ui-datatable-emptymessage',
    '.empty-message',
    '.no-records'
  ];
  for (const sel of emptyIndicators) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) return true;
  }
  const rows = Array.from(document.querySelectorAll('table tbody tr, .p-datatable-tbody > tr, div[role="row"]')).filter(r => !r.closest('thead'));
  if (rows.length === 0) return true;
  if (rows.length === 1) {
    const txt = normalizeText(rows[0].textContent || '');
    if (txt.includes('kayit bulunamadi') || txt.includes('bulunmamaktadir') || txt.includes('veri yok') || txt.includes('no records')) {
      return true;
    }
  }
  return false;
}

function isCurrentPortalPageDevamEden() {
  const url = window.location.href.toLowerCase();
  if (url.includes('devam-eden') || url.includes('active-contract') || url.includes('devameden')) return true;

  const activeTabs = Array.from(document.querySelectorAll('.p-tabview-nav li.p-highlight, a.active[role="tab"], .p-selectbutton button.p-highlight, h1, h2, h3, .p-panel-title'));
  for (const t of activeTabs) {
    const txt = normalizeText(t.textContent);
    if (txt.includes('devam eden')) return true;
  }

  return false;
}

// 3. İSG-KATİP PORTALINDA İLGİLİ MENÜYE GEÇİŞ MOTORU

async function navigateToKatipSection(targetType) {
  const isDevam = targetType === 'DEVAM_EDEN';
  const targetLabel = isDevam ? 'Devam Eden Sözleşmeler' : 'Onay Bekleyen Sözleşmeler';
  const keywords = isDevam ? ['devam eden sozlesmeler', 'devam eden'] : ['onay bekleyen sozlesmeler', 'onay bekleyen', 'onayda bekleyen'];

  logMessage(`🔄 İSG-KATİP portalında "${targetLabel}" ekranına geçiliyor...`);

  let switched = false;

  // 1. PrimeNG TabView / Sekmeler / SelectButton
  const tabs = Array.from(document.querySelectorAll(
    '.p-tabview-nav li, .p-tabview-title, a[role="tab"], button[role="tab"], .nav-tabs a, .nav-tabs li, .p-selectbutton button, .p-button'
  ));

  for (const tab of tabs) {
    const txt = normalizeText(tab.textContent);
    for (const kw of keywords) {
      if (txt.includes(kw)) {
        const clickable = tab.closest('a, button, li') || tab;
        const isAlreadyActive = clickable.classList.contains('p-highlight') || clickable.classList.contains('active') || clickable.getAttribute('aria-selected') === 'true';
        if (!isAlreadyActive) {
          logMessage(`➡️ "${tab.textContent.trim()}" sekmesi tıklandı.`);
          triggerClick(clickable);
          await sleep(2200);
        } else {
          logMessage(`✓ Zaten "${tab.textContent.trim()}" sekmesindesiniz.`);
        }
        switched = true;
        break;
      }
    }
    if (switched) break;
  }

  // 2. Yan Menü / Sol Menü Bağlantıları
  if (!switched) {
    const menuLinks = Array.from(document.querySelectorAll('.layout-menu a, .p-menu a, .sidebar a, nav a, .p-panelmenu a, a.p-menuitem-link'));
    for (const link of menuLinks) {
      const txt = normalizeText(link.textContent);
      for (const kw of keywords) {
        if (txt.includes(kw)) {
          logMessage(`➡️ Sol menüden "${link.textContent.trim()}" tıklandı.`);
          triggerClick(link);
          await sleep(2200);
          switched = true;
          break;
        }
      }
      if (switched) break;
    }
  }

  // 3. Dropdown Filtre
  if (!switched) {
    const dropdowns = Array.from(document.querySelectorAll('.p-dropdown, select'));
    for (const dd of dropdowns) {
      const txt = normalizeText(dd.textContent);
      if (txt.includes('statu') || txt.includes('durum')) {
        triggerClick(dd);
        await sleep(400);
        const items = Array.from(document.querySelectorAll('.p-dropdown-item, option'));
        for (const item of items) {
          const itemTxt = normalizeText(item.textContent);
          for (const kw of keywords) {
            if (itemTxt.includes(kw)) {
              logMessage(`➡️ Portaldaki statü filtresi "${item.textContent.trim()}" seçildi.`);
              triggerClick(item);
              await sleep(1800);
              switched = true;
              break;
            }
          }
          if (switched) break;
        }
      }
      if (switched) break;
    }
  }

  await sleep(1000);
  return switched;
}

// ============================================================================
// 4. GELİŞMİŞ DOĞRULAMA VE AYRIŞTIRMA YARDIMCILARI (TARİH, UNVAN & PERSONEL)
// ============================================================================

// Tarih formatı kontrolü (Başlıkta unvan yerine tarih gelmesini %100 engeller)
function isDateString(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(s)) return true;
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(s)) return true;
  if (/\b\d{2}\.\d{2}\.\d{4}\b/.test(s) && (s.includes('-') || s.includes('/'))) return true;
  if (/^\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4}$/.test(s)) return true;
  return false;
}

// Şirket/Kurum Unvanı tespiti için yardımcı (DOM satırından gerçek unvanı yakalar)
function findWorkplaceNameFromCells(cells, detsisNo, clientSgkNo, personName, processId) {
  const companyIndicators = [
    'şti', 'sti', 'a.ş', 'a.s', 'ltd', 'sanayi', 'ticaret', 'hizmet', 'bakanlık', 'bakanligi',
    'müdürlük', 'mudurlugu', 'belediye', 'belediyesi', 'anonim', 'limited', 'şirket', 'sirketi',
    'holding', 'vakıf', 'dernek', 'okul', 'hastane', 'fabrika', 'şube', 'subesi', 'işletme',
    'isletmesi', 'koop', 'üniversite', 'kamu', 'kurum', 'tesis', 'sağlık', 'saglik', 'enerji',
    'gıda', 'gida', 'inşaat', 'insaat', 'turizm', 'lojistik', 'tekstil', 'otomotiv', 'maden'
  ];

  // 1. Şirket göstergesi içeren hücreyi bul
  for (const c of cells) {
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 4) continue;
    if (isDateString(txt)) continue;
    if (/^\d+$/.test(txt)) continue;
    if (processId && txt === String(processId)) continue;
    if (detsisNo && txt === String(detsisNo)) continue;
    if (clientSgkNo && txt.replace(/\s+/g, '') === String(clientSgkNo).replace(/\s+/g, '')) continue;
    if (personName && txt.toLowerCase() === personName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^(uzman|isyeri hekimi|tabip|doktor|diger saglik personeli|dsp|is guvenligi uzmani)$/i.test(norm)) continue;
    if (/^\d+\s*(?:dk|dakika|saat|sa)$/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;

    for (const ind of companyIndicators) {
      if (norm.includes(ind)) {
        return txt;
      }
    }
  }

  // 2. İkinci tur: Tarih/Sayı/Statü olmayan en uygun metin hücresi
  let best = '';
  for (const c of cells) {
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 5) continue;
    if (isDateString(txt)) continue;
    if (/^\d+$/.test(txt)) continue;
    if (processId && txt === String(processId)) continue;
    if (detsisNo && txt === String(detsisNo)) continue;
    if (clientSgkNo && txt.replace(/\s+/g, '') === String(clientSgkNo).replace(/\s+/g, '')) continue;
    if (personName && txt.toLowerCase() === personName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^(uzman|isyeri hekimi|tabip|doktor|diger saglik personeli|dsp|is guvenligi uzmani)$/i.test(norm)) continue;
    if (/^\d+\s*(?:dk|dakika|saat|sa)$/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;

    if (txt.length > best.length) {
      best = txt;
    }
  }

  return best;
}

// Satırdaki Personel Ad Soyadını tespit etme yardımcısı
function findPersonNameFromCells(cells, workplaceName, duty, processId) {
  for (const c of cells) {
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 4 || txt.length > 50) continue;
    if (isDateString(txt)) continue;
    if (/\d{4,}/.test(txt)) continue;
    if (workplaceName && txt.toLowerCase() === workplaceName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^(uzman|isyeri hekimi|tabip|doktor|diger saglik personeli|dsp|is guvenligi uzmani)$/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;
    if (/şti|sti|a\.ş|ltd|sanayi|ticaret|holding|belediye|bakanlik|mudurluk/i.test(norm)) continue;

    const words = txt.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      const cleanName = txt.replace(/^(?:Uzm\.|Dr\.|Hekim|İGU|Uzman)\s+/i, '').trim();
      return cleanName || txt;
    }
  }
  return '';
}

// ============================================================================
// 5. KUSURSUZ ALAN EŞLEME: HAM JSON NESNESİNDEN SÖZLEŞME OLUŞTURMA (API VERİSİ)
// ============================================================================

function parseRawContractJson(item, defaultCategory = 'DEVAM_EDEN') {
  if (!item || typeof item !== 'object') return null;

  // 1. Süreç No / Sözleşme ID
  const processId = item.surecNo || item.surecId || item.sozlesmeNo || item.sozlesmeId || item.id || item.processId || '';

  // 2. DETSİS No
  let detsisNo = item.detsisNo || item.detsis || item.kamuKurumKodu || item.kurumKodu || item.idariBirimKodu || item.detsisNumarasi || '';
  if (!detsisNo && item.clientSgkNo && String(item.clientSgkNo).length <= 14 && String(item.clientSgkNo).length >= 5) {
    detsisNo = String(item.clientSgkNo);
  }

  // 3. SGK Sicil No
  let clientSgkNo = item.hizmetAlanSgkSicilNo || item.hizmetAlanSicilNo || item.isyeriSgkSicilNo || item.isyeriSgk || item.sgkSicilNo || item.clientSgkNo || '';
  let osgbSgkNo = item.hizmetSunucuSgkSicilNo || item.osgbSgkSicilNo || item.hizmetVerenSgkSicilNo || item.osgbSgkNo || '';
  if (clientSgkNo && osgbSgkNo && String(clientSgkNo) === String(osgbSgkNo)) {
    clientSgkNo = '';
  }

  // 4. Hizmet Alan İşyeri Unvanı (Tarih ve Fallback Kontrollü)
  let clientName = '';
  const candidateUnvans = [
    item.hizmetAlanIsyeriUnvani, item.hizmetAlanIsyeriUnvan, item.hizmetAlanUnvani, item.hizmetAlanUnvan,
    item.isyeriUnvani, item.isyeriUnvan, item.isyeriTicaretUnvani, item.ticaretUnvani,
    item.isyeriAdi, item.isyeriAd, item.firmaAdi, item.firmaUnvani, item.kurumAdi,
    item.kurumUnvani, item.unvan, item.unvani, item.clientName
  ];
  for (const u of candidateUnvans) {
    if (u && typeof u === 'string' && u.trim().length > 2 && !isDateString(u) && !/^\d+$/.test(u.trim())) {
      clientName = u.trim();
      break;
    }
  }

  // İç içe nesnelerden unvan arama (Spring Boot / PrimeNG nesne modelleri)
  if (!clientName) {
    const nestedObjs = [
      item.hizmetAlanIsyeri, item.hizmetAlan, item.isyeri, item.kurum,
      item.isyeriBilgisi, item.sozlesmeIsyeri, item.isyeriBilgi, item.client
    ];
    for (const obj of nestedObjs) {
      if (obj && typeof obj === 'object') {
        const nestedTitle = obj.hizmetAlanIsyeriUnvani || obj.isyeriUnvani || obj.unvan || obj.unvani ||
                            obj.ticaretUnvani || obj.adi || obj.ad || obj.isyeriAdi || obj.kurumAdi || obj.name;
        if (nestedTitle && typeof nestedTitle === 'string' && nestedTitle.trim().length > 2 && !isDateString(nestedTitle) && !/^\d+$/.test(nestedTitle.trim())) {
          clientName = nestedTitle.trim();
          break;
        }
      }
    }
  }

  let osgbName = item.hizmetSunucuUnvani || item.hizmetSunucuAdi || item.osgbUnvani || item.osgbName || 'Hizmet Sunucu OSGB';

  // Fallback: ASLA "İşyeri (xxxxxxx)" şeklinde yazma!
  if (!clientName || isDateString(clientName)) {
    if (detsisNo) clientName = `Kamu Kurumu (DETSİS: ${detsisNo})`;
    else if (clientSgkNo) clientName = `Hizmet Alan İşyeri (SGK: ${clientSgkNo})`;
    else clientName = `Hizmet Alan İşyeri_${processId || 'Bakanlık'}`;
  }

  // 5. Gerçek Çalışan Sayısı (Ham Sayısal Değer - Korunmuş Mantık)
  let employeeCount = 0;
  const rawEmp = item.calisanSayisi ?? item.sigortaliSayisi ?? item.hizmetAlanCalisanSayisi ?? item.toplamCalisan ?? item.calisan ?? item.employeeCount;
  if (rawEmp !== undefined && rawEmp !== null && !isNaN(parseInt(rawEmp, 10))) {
    employeeCount = parseInt(rawEmp, 10);
  }

  // 6. Personel ve Görev (ASLA 'Atalı Personel' Yazmaz)
  let personName = '';
  const candPerson = [
    item.personelAdSoyad, item.personelAdiSoyadi, item.gorevliKisiAdSoyad, item.gorevliKisiAdiSoyadi,
    item.gorevliAdSoyad, item.personelAdi, item.personelName, item.personName, item.adSoyad,
    item.isimSoyisim, item.adSoyadi, item.atananPersonelAdSoyad, item.belgeSahibiAdSoyad,
    item.uzmanAdSoyad, item.hekimAdSoyad, item.dspAdSoyad, item.kullaniciAdSoyad,
    item.tamAd, item.fullName, item.name
  ];
  for (const p of candPerson) {
    if (p && typeof p === 'string' && p.trim().length > 2 && !isDateString(p) && !/^\d+$/.test(p.trim())) {
      personName = p.trim();
      break;
    }
  }

  // İç içe nesnelerden personel arama
  if (!personName) {
    const personObjs = [
      item.gorevliKisi, item.personel, item.atananPersonel, item.belgeSahibi,
      item.kisi, item.kullanici, item.calisan, item.hizmetVeren, item.hizmetVerenKisi,
      item.uzman, item.hekim, item.dsp
    ];
    for (const po of personObjs) {
      if (po && typeof po === 'object') {
        const pAdSoyad = po.adSoyad || po.adiSoyadi || po.adSoyadi || po.isimSoyisim || po.fullName || po.name;
        if (pAdSoyad && typeof pAdSoyad === 'string' && pAdSoyad.trim().length > 2 && !isDateString(pAdSoyad)) {
          personName = pAdSoyad.trim();
          break;
        }
        if (po.ad && po.soyad) {
          personName = `${po.ad} ${po.soyad}`.trim();
          break;
        }
      }
    }
  }

  if (!personName && item.ad && item.soyad) {
    personName = `${item.ad} ${item.soyad}`.trim();
  }

  let duty = item.gorev || item.belgeTuru || item.sozlesmeTuru || item.duty || 'İSG Hizmeti';
  let dutyType = 'DIGER';
  const normDuty = normalizeText(duty);
  if (normDuty.includes('uzman') || normDuty.includes('isg')) dutyType = 'UZMAN';
  else if (normDuty.includes('hekim') || normDuty.includes('tabip') || normDuty.includes('doktor')) dutyType = 'HEKIM';
  else if (normDuty.includes('dsp') || normDuty.includes('saglik')) dutyType = 'DSP';

  // 7. Aylık Çalışma Süresi (Ham Sayısal Dakika)
  let durationMinutes = 0;
  const rawDur = item.hizmetSuresiDakika ?? item.aylikCalismaSuresi ?? item.calismaSuresi ?? item.sureDakika ?? item.aylikSure ?? item.sure ?? item.hizmetSuresi ?? item.durationMinutes;
  if (rawDur !== undefined && rawDur !== null && !isNaN(parseInt(rawDur, 10))) {
    durationMinutes = parseInt(rawDur, 10);
  }

  // 8. NACE ve Tehlike Sınıfı
  const naceCode = item.naceKodu || item.nace || item.faaliyetKodu || item.naceCode || '';
  const hazardClass = item.tehlikeSinifi || item.tehlike || item.hazardClass || 'Tehlikeli';

  // 9. Başlangıç & Bitiş
  const startDate = item.baslangicTarihi || item.sozlesmeBaslangicTarihi || item.startDate || 'Belirtilmedi';
  const endDate = item.bitisTarihi || item.sozlesmeBitisTarihi || item.endDate || 'Belirtilmedi';

  // 10. Statü
  const rawStatus = item.sozlesmeDurumu || item.statu || item.durum || (defaultCategory === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Onay Bekliyor');
  let statusCategory = defaultCategory;
  const normStat = normalizeText(rawStatus);
  if (normStat.includes('iptal') || normStat.includes('feshedil')) statusCategory = 'IPTAL_EDILDI';
  else if (normStat.includes('onay bekliyor') || normStat.includes('onayda')) statusCategory = 'ONAY_BEKLEYEN';
  else if (normStat.includes('devam')) statusCategory = 'DEVAM_EDEN';

  return {
    id: `api_${processId || Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    processId: String(processId),
    clientName: String(clientName),
    detsisNo: String(detsisNo || ''),
    clientSgkNo: String(clientSgkNo || ''),
    osgbName: String(osgbName || ''),
    osgbSgkNo: String(osgbSgkNo || ''),
    personName: String(personName || ''), // KESİNLİKLE 'Atalı Personel' DEĞİL
    duty: String(duty),
    dutyType,
    employeeCount,
    durationMinutes,
    durationHours: (durationMinutes / 60).toFixed(1),
    naceCode: String(naceCode),
    hazardClass: String(hazardClass),
    startDate: String(startDate),
    endDate: String(endDate),
    rawStatus: String(rawStatus),
    statusCategory
  };
}

// ============================================================================
// 6. SAYFADAKİ DOM TABLOSUNU AYRIŞTIRMA (YEDEK / İKİNCİ KATMAN)
// ============================================================================

function detectTableHeaders() {
  const ths = Array.from(document.querySelectorAll('table thead th, .p-datatable-thead th, div[role="columnheader"]'));
  const map = {};

  ths.forEach((th, idx) => {
    const titleEl = th.querySelector('.p-column-title, .ui-column-title');
    const raw = (titleEl ? titleEl.textContent : (th.innerText || th.textContent || '')).trim();
    const txt = normalizeText(raw);
    if (!txt) return;

    // ÖNCELİK 1: Tarih kolonları (Başlangıç, Bitiş, Sözleşme Tarihi vb.)
    // Bu sayede unvan kolonu ile kesinlikle karışamaz!
    if (txt.includes('baslangic') || txt.includes('baslama')) {
      map.startDate = idx;
    } else if (txt.includes('bitis')) {
      map.endDate = idx;
    } else if (txt.includes('tarih') || txt.includes('date')) {
      map.contractDate = idx;
    } else if (txt.includes('detsis') || txt.includes('kurum kod')) {
      map.detsis = idx;
    } else if (txt.includes('surec no') || txt.includes('surec id') || txt.includes('sozlesme no') || (txt.includes('surec') && txt.includes('no'))) {
      map.processId = idx;
    } else if ((txt.includes('sozlesme') && (txt.includes('statu') || txt.includes('durum'))) || txt === 'statu' || txt === 'durum' || txt.includes('sozlesme durum')) {
      map.status = idx;
    } else if (txt.includes('calisan') || txt.includes('sigortali') || txt.includes('personel say')) {
      map.employeeCount = idx; // Çalışan sayısı korundu!
    } else if (txt.includes('dakika') || txt.includes('saat') || txt.includes('hizmet sure') || txt.includes('calisma sure') || (txt.includes('sure') && !txt.includes('surec'))) {
      map.duration = idx;
    } else if ((txt.includes('sunucu') || txt.includes('osgb') || txt.includes('hizmet veren')) && (txt.includes('sicil') || txt.includes('sgk'))) {
      map.osgbSgk = idx;
    } else if (txt.includes('sunucu') || txt.includes('hizmet veren') || (txt.includes('osgb') && !txt.includes('alan'))) {
      map.osgbName = idx;
    } else if ((txt.includes('alan') || txt.includes('isyeri') || txt.includes('firma')) && (txt.includes('sicil') || txt.includes('sgk'))) {
      map.clientSgk = idx;
    } else if (
      !txt.includes('tarih') && !txt.includes('date') && !txt.includes('sicil') && !txt.includes('sgk') &&
      !txt.includes('calisan') && !txt.includes('sure') && !txt.includes('statu') && !txt.includes('durum') &&
      (
        txt.includes('hizmet alan') || txt.includes('isyeri unvan') || txt.includes('isyeri adi') ||
        txt.includes('kurum unvan') || txt.includes('firma unvan') || txt.includes('firma adi') ||
        (txt.includes('alan') && txt.includes('unvan')) || (txt.includes('isyeri') && txt.includes('unvan')) ||
        txt === 'unvan' || txt === 'unvani' || txt === 'isyeri'
      )
    ) {
      map.clientName = idx;
    } else if (
      !txt.includes('tarih') && !txt.includes('sayisi') &&
      (
        txt.includes('gorevli') || txt.includes('personel') || txt.includes('belge sahibi') ||
        txt.includes('profesyonel') || txt.includes('sozlesme sahibi') || txt.includes('sertifika sahibi') ||
        txt.includes('hizmet veren kisi') || txt.includes('uzman / hekim') || txt.includes('uzman/hekim') ||
        (txt.includes('kisi') && !txt.includes('sayisi')) || (txt.includes('ad') && txt.includes('soyad'))
      )
    ) {
      map.personName = idx;
    } else if ((txt.includes('gorev') || txt.includes('belge tur') || txt.includes('sozlesme tur') || txt.includes('hizmet tur')) && !txt.includes('gorevli')) {
      map.duty = idx;
    } else if (txt.includes('nace') || txt.includes('faaliyet')) {
      map.nace = idx;
    } else if (txt.includes('tehlike')) {
      map.hazard = idx;
    }
  });

  return map;
}

function extractContractsFromDomTable(targetMode) {
  const contracts = [];
  const headerMap = detectTableHeaders();

  const rows = Array.from(document.querySelectorAll('table tbody tr, .p-datatable-tbody > tr, div[role="row"]')).filter(row => {
    if (row.closest('thead') || row.classList.contains('p-datatable-emptymessage')) return false;
    const txt = (row.innerText || row.textContent || '').trim();
    return txt.length > 5;
  });

  rows.forEach((row, rowIdx) => {
    const cells = Array.from(row.querySelectorAll('td, div[role="cell"], .p-col'));
    if (cells.length === 0) return;

    const rowFullText = (row.innerText || row.textContent || '').replace(/\s+/g, ' ').trim();

    const cellDataByTitle = {};
    cells.forEach((c, idx) => {
      const titleSpan = c.querySelector('.p-column-title, .ui-column-title');
      if (titleSpan) {
        const normT = normalizeText(titleSpan.textContent);
        cellDataByTitle[normT] = { cell: c, val: getCellCleanText(c), index: idx };
      }
    });

    let rawStatus = '';
    for (const key of Object.keys(cellDataByTitle)) {
      if ((key.includes('sozlesme') && (key.includes('statu') || key.includes('durum'))) || key === 'statu' || key === 'durum') {
        rawStatus = cellDataByTitle[key].val;
        break;
      }
    }
    if (!rawStatus && headerMap.status !== undefined && cells[headerMap.status]) {
      rawStatus = getCellCleanText(cells[headerMap.status]);
    }

    const normStat = normalizeText(rawStatus + ' ' + rowFullText);
    const isCancelled = normStat.includes('iptal edildi') || normStat.includes('feshedil') || normStat.includes('sonlandirildi');

    if (targetMode === 'DEVAM_EDEN' && isCancelled) return;

    let processId = '';
    if (headerMap.processId !== undefined && cells[headerMap.processId]) {
      const pm = getCellCleanText(cells[headerMap.processId]).match(/\d+/);
      if (pm) processId = pm[0];
    }
    if (!processId) {
      const c0 = getCellCleanText(cells[0]);
      if (/^\d{2,7}$/.test(c0)) processId = c0;
    }

    let detsisNo = '';
    if (headerMap.detsis !== undefined && cells[headerMap.detsis]) {
      const cellTxt = getCellCleanText(cells[headerMap.detsis]);
      const dm = cellTxt.match(/detsis[:\s]*([0-9]{4,14})/i) || cellTxt.match(/\b([0-9]{5,12})\b/);
      if (dm && !cellTxt.match(/\b\d{26}\b/)) detsisNo = dm[1] || dm[0];
    }
    if (!detsisNo) {
      const rowDetsisMatch = rowFullText.match(/detsis(?:\s*no)?[:\s]*([0-9]{4,14})/i);
      if (rowDetsisMatch) detsisNo = rowDetsisMatch[1];
    }

    let clientSgkNo = '';
    let osgbSgkNo = '';
    const sgkMatches = [];
    cells.forEach((c, cIdx) => {
      const cleanVal = getCellCleanText(c).replace(/\s+/g, '');
      const m = cleanVal.match(/\b\d{26}\b/);
      if (m) sgkMatches.push({ index: cIdx, val: m[0] });
    });

    if (headerMap.osgbSgk !== undefined && cells[headerMap.osgbSgk]) {
      const m = getCellCleanText(cells[headerMap.osgbSgk]).replace(/\s+/g, '').match(/\d{20,28}/);
      if (m) osgbSgkNo = m[0];
    }
    if (!osgbSgkNo && sgkMatches.length > 0) osgbSgkNo = sgkMatches[0].val;

    if (headerMap.clientSgk !== undefined && cells[headerMap.clientSgk]) {
      const rawClientVal = getCellCleanText(cells[headerMap.clientSgk]).replace(/\s+/g, '');
      const m26 = rawClientVal.match(/\b\d{26}\b/);
      if (m26 && m26[0] !== osgbSgkNo) clientSgkNo = m26[0];
      else if (!detsisNo) {
        const mDetsis = rawClientVal.match(/\b\d{5,14}\b/);
        if (mDetsis && rawClientVal !== processId) detsisNo = mDetsis[0];
      }
    }
    if (!clientSgkNo && sgkMatches.length >= 2 && sgkMatches[1].val !== osgbSgkNo) {
      clientSgkNo = sgkMatches[1].val;
    }
    if (clientSgkNo === osgbSgkNo) clientSgkNo = '';

    // Hücre içi başlıklardan (PrimeNG responsive column title) öncelikli arama
    let cellEmpVal = '';
    let cellDurVal = '';
    let cellPersonVal = '';
    let cellDutyVal = '';
    let cellClientVal = '';

    for (const [k, obj] of Object.entries(cellDataByTitle)) {
      if (k.includes('calisan') || k.includes('sigortali')) cellEmpVal = obj.val;
      else if (k.includes('dakika') || k.includes('hizmet sure') || (k.includes('sure') && !k.includes('surec'))) cellDurVal = obj.val;
      else if (
        !k.includes('tarih') && !k.includes('sayisi') &&
        (k.includes('gorevli') || k.includes('personel') || k.includes('profesyonel') || (k.includes('ad') && k.includes('soyad')))
      ) {
        if (!isDateString(obj.val)) cellPersonVal = obj.val;
      }
      else if (k.includes('gorev') || k.includes('belge tur') || k.includes('sozlesme tur')) cellDutyVal = obj.val;
      else if (
        !k.includes('tarih') && !k.includes('sicil') && !k.includes('sgk') && !k.includes('calisan') && !k.includes('sure') &&
        (k.includes('alan') || k.includes('isyeri') || k.includes('kurum') || k.includes('firma')) &&
        (k.includes('unvan') || k.includes('adi'))
      ) {
        if (!isDateString(obj.val)) cellClientVal = obj.val;
      }
    }

    // 1. Hizmet Alan İşyeri Unvanı (Tarih ve Fallback Korumalı)
    let clientName = cellClientVal;
    if (!clientName && headerMap.clientName !== undefined && cells[headerMap.clientName]) {
      const candidate = getCellCleanText(cells[headerMap.clientName]);
      if (!isDateString(candidate) && !/^\d+$/.test(candidate.trim())) {
        clientName = candidate;
      }
    }

    // Eğer clientName hala boşsa veya tarih geldiyse, satırdaki tüm hücreleri akıllıca tara
    if (!clientName || isDateString(clientName)) {
      clientName = findWorkplaceNameFromCells(cells, detsisNo, clientSgkNo, cellPersonVal, processId);
    }

    // Fallback: ASLA "İşyeri (xxxxxxx)" şeklinde yazma!
    if (!clientName || isDateString(clientName)) {
      if (detsisNo) clientName = `Kamu Kurumu (DETSİS: ${detsisNo})`;
      else if (clientSgkNo) clientName = `Hizmet Alan İşyeri (SGK: ${clientSgkNo})`;
      else clientName = `Hizmet Alan İşyeri_${rowIdx + 1}`;
    }

    // 2. Gerçek Çalışan Sayısı (Kusursuz Çalışan Mantık)
    let employeeCount = 0;
    const empRaw = cellEmpVal || (headerMap.employeeCount !== undefined && cells[headerMap.employeeCount] ? getCellCleanText(cells[headerMap.employeeCount]) : '');
    if (empRaw) {
      const m = empRaw.match(/\b\d+\b/);
      if (m && (!processId || parseInt(m[0], 10) !== parseInt(processId, 10))) {
        employeeCount = parseInt(m[0], 10);
      }
    }
    if (!employeeCount) {
      const empMatch = rowFullText.match(/(?:hizmet\s*alan\s*isyeri\s*)?calisan\s*(?:sayisi)?[:\s]*(\d+)/i) || 
                       rowFullText.match(/(?:hizmet\s*alan\s*işyeri\s*)?çalışan\s*(?:sayısı)?[:\s]*(\d+)/i) || 
                       rowFullText.match(/\b(\d{1,5})\s*(?:çalışan|sigortalı|calisan|sigortali)\b/i);
      if (empMatch && (!processId || parseInt(empMatch[1], 10) !== parseInt(processId, 10))) {
        employeeCount = parseInt(empMatch[1], 10);
      }
    }

    // 3. Personel Adı Soyadı (ASLA 'Atalı Personel' Yazmaz)
    let personName = cellPersonVal;
    if (!personName && headerMap.personName !== undefined && cells[headerMap.personName]) {
      const pCandidate = getCellCleanText(cells[headerMap.personName]);
      if (!isDateString(pCandidate) && !/^\d+$/.test(pCandidate.trim())) {
        personName = pCandidate;
      }
    }
    if (!personName || isDateString(personName)) {
      personName = findPersonNameFromCells(cells, clientName, cellDutyVal, processId);
    }

    let duty = cellDutyVal;
    if (!duty && headerMap.duty !== undefined && cells[headerMap.duty]) {
      duty = getCellCleanText(cells[headerMap.duty]);
    }

    let dutyType = 'DIGER';
    const normDuty = normalizeText(duty + ' ' + rowFullText);
    if (normDuty.includes('uzman') || normDuty.includes('isg')) dutyType = 'UZMAN';
    else if (normDuty.includes('hekim') || normDuty.includes('tabip') || normDuty.includes('doktor')) dutyType = 'HEKIM';
    else if (normDuty.includes('dsp') || normDuty.includes('saglik')) dutyType = 'DSP';

    let durationMinutes = 0;
    const durRaw = cellDurVal || (headerMap.duration !== undefined && cells[headerMap.duration] ? getCellCleanText(cells[headerMap.duration]) : '');
    if (durRaw) {
      const mHour = durRaw.match(/(\d+)\s*(?:saat|sa)/i);
      const mMin = durRaw.match(/(\d+)\s*(?:dk|dakika)/i);
      const mNum = durRaw.match(/\b\d+\b/);
      if (mHour) {
        durationMinutes = parseInt(mHour[1], 10) * 60;
      } else if (mMin) {
        durationMinutes = parseInt(mMin[1], 10);
      } else if (mNum) {
        durationMinutes = parseInt(mNum[0], 10);
      }
    }
    if (!durationMinutes) {
      const dMatch = rowFullText.match(/\b(\d{1,5})\s*(?:dk|dakika)\b/i);
      if (dMatch) durationMinutes = parseInt(dMatch[1], 10);
      else {
        const dHourMatch = rowFullText.match(/\b(\d{1,3})\s*(?:saat|sa)\b/i);
        if (dHourMatch) durationMinutes = parseInt(dHourMatch[1], 10) * 60;
      }
    }

    contracts.push({
      id: `dom_${processId || (rowIdx + 1)}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      processId: processId || `${rowIdx + 1}`,
      clientName,
      detsisNo: detsisNo || '',
      clientSgkNo: clientSgkNo || '',
      osgbName: 'Hizmet Sunucu OSGB',
      osgbSgkNo: osgbSgkNo || '',
      personName: personName || '', // KESİNLİKLE 'Atalı Personel' DEĞİL
      duty: duty || (dutyType === 'UZMAN' ? 'İş Güvenliği Uzmanı' : 'İşyeri Hekimi'),
      dutyType,
      employeeCount,
      durationMinutes,
      durationHours: (durationMinutes / 60).toFixed(1),
      naceCode: '',
      hazardClass: 'Tehlikeli',
      startDate: 'Belirtilmedi',
      endDate: 'Belirtilmedi',
      rawStatus: targetMode === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Onay Bekliyor',
      statusCategory: targetMode
    });
  });

  return contracts;
}

// ============================================================================
// 7. FİRMALARI GRUPLAMA & SÜRELERİ HESAPLAMA
// ============================================================================

function groupCompaniesByContracts(contractsList) {
  const companyMap = new Map();

  contractsList.forEach(c => {
    let key = '';
    if (c.detsisNo && c.detsisNo.length >= 4) {
      key = `DETSIS_${c.detsisNo.trim()}`;
    } else if (c.clientSgkNo && c.clientSgkNo.length >= 15 && c.clientSgkNo !== c.osgbSgkNo) {
      key = `SGK_${c.clientSgkNo.trim()}`;
    } else {
      key = `NAME_${normalizeText(c.clientName || c.id)}`;
    }

    if (!key) return;

    if (!companyMap.has(key)) {
      const isDetsis = !!(c.detsisNo && c.detsisNo.length >= 4);
      companyMap.set(key, {
        id: `comp_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        name: c.clientName,
        detsisNo: c.detsisNo || '',
        isDetsis: isDetsis,
        sgkNo: isDetsis ? c.detsisNo : (c.clientSgkNo || ''),
        clientSgkNo: c.clientSgkNo || '',
        workplaceSgkNo: isDetsis ? c.detsisNo : (c.clientSgkNo || ''),
        osgbName: c.osgbName || '',
        osgbSgkNo: c.osgbSgkNo || '',
        naceCode: c.naceCode || '',
        hazardClass: c.hazardClass || 'Tehlikeli',
        employeeCount: c.employeeCount || 0,
        statusCategory: c.statusCategory,

        specialists: [],
        doctors: [],
        dsps: [],
        assignedSpecialist: '',
        assignedDoctor: '',
        assignedDsp: '',

        totalSpecialistMinutes: 0,
        totalDoctorMinutes: 0,
        totalDspMinutes: 0,
        totalMinutes: 0,
        totalHours: '0.0',
        specialistHours: '0.0',
        doctorHours: '0.0',
        dspHours: '0.0',

        contracts: [],
        contractCount: 0
      });
    }

    const comp = companyMap.get(key);
    comp.contracts.push(c);
    comp.contractCount++;

    // Unvan güncelleme: Eğer comp.name bir tarih ise veya fallback ise ve gelen c.clientName gerçek bir firma unvanı ise güncelle!
    const isBadTitle = (n) => !n || isDateString(n) || n.startsWith('İşyeri (') || n.startsWith('Firma_') || n.startsWith('Hizmet Alan İşyeri_');
    if (isBadTitle(comp.name) && !isBadTitle(c.clientName)) {
      comp.name = c.clientName;
    }

    if (!comp.detsisNo && c.detsisNo) {
      comp.detsisNo = c.detsisNo;
      comp.isDetsis = true;
      comp.sgkNo = c.detsisNo;
      comp.workplaceSgkNo = c.detsisNo;
    }

    if (!comp.isDetsis && !comp.clientSgkNo && c.clientSgkNo && c.clientSgkNo !== c.osgbSgkNo) {
      comp.clientSgkNo = c.clientSgkNo;
      comp.sgkNo = c.clientSgkNo;
      comp.workplaceSgkNo = c.clientSgkNo;
    }

    if (c.employeeCount > 0 && (!comp.employeeCount || c.employeeCount > comp.employeeCount)) {
      comp.employeeCount = c.employeeCount;
    }
    if (!comp.naceCode && c.naceCode) comp.naceCode = c.naceCode;
    if (!comp.osgbName && c.osgbName) comp.osgbName = c.osgbName;
    if (!comp.osgbSgkNo && c.osgbSgkNo) comp.osgbSgkNo = c.osgbSgkNo;

    const pName = (c.personName || '').trim();
    const durMin = c.durationMinutes || 0;

    // KESİNLİKLE 'Atalı Personel' ismi personel listelerine eklenmez! Yalnızca gerçek isimler eklenir
    if (pName && pName !== 'Atalı Personel') {
      if (c.dutyType === 'UZMAN' || /uzman|isg/i.test(c.duty)) {
        if (!comp.specialists.includes(pName)) comp.specialists.push(pName);
        comp.totalSpecialistMinutes += durMin;
      } else if (c.dutyType === 'HEKIM' || /hekim|tabip|doktor/i.test(c.duty)) {
        if (!comp.doctors.includes(pName)) comp.doctors.push(pName);
        comp.totalDoctorMinutes += durMin;
      } else if (c.dutyType === 'DSP' || /dsp|sağlık/i.test(c.duty)) {
        if (!comp.dsps.includes(pName)) comp.dsps.push(pName);
        comp.totalDspMinutes += durMin;
      }
    } else {
      // İsim olmasa bile süre dakikaları hesaplamaya dahil edilir
      if (c.dutyType === 'UZMAN' || /uzman|isg/i.test(c.duty)) {
        comp.totalSpecialistMinutes += durMin;
      } else if (c.dutyType === 'HEKIM' || /hekim|tabip|doktor/i.test(c.duty)) {
        comp.totalDoctorMinutes += durMin;
      } else if (c.dutyType === 'DSP' || /dsp|sağlık/i.test(c.duty)) {
        comp.totalDspMinutes += durMin;
      }
    }

    comp.totalMinutes = comp.totalSpecialistMinutes + comp.totalDoctorMinutes + comp.totalDspMinutes;
    comp.totalHours = (comp.totalMinutes / 60).toFixed(1);
    comp.specialistHours = (comp.totalSpecialistMinutes / 60).toFixed(1);
    comp.doctorHours = (comp.totalDoctorMinutes / 60).toFixed(1);
    comp.dspHours = (comp.totalDspMinutes / 60).toFixed(1);

    comp.assignedSpecialist = comp.specialists.join(', ');
    comp.assignedDoctor = comp.doctors.join(', ');
    comp.assignedDsp = comp.dsps.join(', ');
  });

  return Array.from(companyMap.values());
}

// 7. YARDIMCI BUTON & SAYFALAMA KONTROLLERİ

function triggerClick(element) {
  if (!element) return;
  try {
    element.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    const mouseEvents = ['mouseover', 'mousedown', 'mouseup', 'click'];
    mouseEvents.forEach(evtType => {
      const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window });
      element.dispatchEvent(evt);
    });
    if (typeof element.click === 'function') element.click();
  } catch (e) {
    if (typeof element.click === 'function') element.click();
  }
}

function isButtonDisabled(btn) {
  if (!btn) return true;
  if (btn.disabled || btn.getAttribute('disabled') !== null) return true;
  if (btn.classList.contains('p-disabled') || btn.classList.contains('ui-state-disabled')) return true;
  if (btn.getAttribute('aria-disabled') === 'true') return true;
  return false;
}

function getTableRowsFingerprint() {
  const rows = Array.from(document.querySelectorAll('table tbody tr, .p-datatable-tbody > tr, div[role="row"]')).slice(0, 3);
  return rows.map(r => (r.textContent || '').slice(0, 40).trim()).join('|');
}

function findActiveNextPageButton() {
  const candidates = Array.from(document.querySelectorAll(
    'button.p-paginator-next, .p-paginator-next, a.p-paginator-next, a.ui-paginator-next, ' +
    'button[aria-label*="Next" i], button[aria-label*="Sonraki" i], button[title*="Sonraki" i]'
  ));
  for (const btn of candidates) {
    if (!btn.offsetParent && btn.offsetWidth === 0 && btn.offsetHeight === 0) continue;
    if (isButtonDisabled(btn)) continue;
    return btn;
  }
  return null;
}

function findNextPageNumberButton(currentPageNum) {
  const pageButtons = Array.from(document.querySelectorAll('.p-paginator-pages button, .p-paginator-page')).filter(b => b.offsetParent !== null);
  const targetNum = currentPageNum + 1;
  const nextBtn = pageButtons.find(b => parseInt(b.textContent.trim(), 10) === targetNum);
  if (nextBtn && !isButtonDisabled(nextBtn)) return nextBtn;
  return null;
}

async function tryMaximizeRowsPerPage() {
  try {
    const rppDropdown = document.querySelector('.p-paginator-rpp-options, p-dropdown.p-paginator-rpp-options, .ui-paginator-rpp-options');
    if (rppDropdown && rppDropdown.offsetParent !== null) {
      triggerClick(rppDropdown);
      await sleep(400);
      const options = Array.from(document.querySelectorAll('.p-dropdown-item, .p-dropdown-panel li, .ui-dropdown-item'));
      let bestOption = null;
      let maxVal = -1;
      options.forEach(opt => {
        const val = parseInt(opt.textContent.trim(), 10);
        if (!isNaN(val) && val > maxVal) { maxVal = val; bestOption = opt; }
      });
      if (bestOption && maxVal > 10) {
        logMessage(`📄 Satır sayısı "${bestOption.textContent.trim()}" olarak genişletildi.`);
        triggerClick(bestOption);
        await sleep(1500);
      }
    }
  } catch (e) {}
}

async function ensureFirstPage() {
  const activePageBtn = document.querySelector('.p-paginator-pages button.p-highlight, .p-paginator-page.p-highlight');
  if (activePageBtn && activePageBtn.textContent.trim() === '1') return;

  const firstBtn = document.querySelector('button.p-paginator-first:not(.p-disabled), .p-paginator-first:not(.p-disabled)');
  if (firstBtn && firstBtn.offsetParent !== null && !isButtonDisabled(firstBtn)) {
    triggerClick(firstBtn);
    await sleep(1500);
  }
}

// 8. AKILLI DOĞRUDAN SİSTEM VERİSİ ÇEKİCİ (API ÖNCELİKLİ + DOM YEDEK)

async function runSmartDirectFetch(targetMode) {
  if (isRunningAction) return;
  isRunningAction = true;
  isAutoPaginating = true;
  shouldStopPagination = false;

  const isDevam = targetMode === 'DEVAM_EDEN';
  const modeTitle = isDevam ? 'Devam Eden Sözleşmeler' : 'Onay Bekleyen Sözleşmeler';

  // State Temizliği
  selectedCompanyIds.clear();
  expandedCompanyIds.clear();
  latestApiContracts = [];

  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progContainer = document.getElementById('isgpro-progress-container');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'block';
  if (progContainer) progContainer.style.display = 'block';
  if (progText) progText.style.display = 'block';

  logMessage(`🚀 [Sistem Verisi] ${modeTitle} çekiliyor...`);

  // ADIM 1: Portaldaki ilgili ekrana geç
  const navSuccess = await navigateToKatipSection(targetMode);

  // ADIM 2: Eğer Onay Bekleyenler seçildiyse fakat portal hala Devam Edenler sekmesindeyse KESİNLİKLE devam edenleri okuma!
  if (!isDevam && isCurrentPortalPageDevamEden() && !navSuccess) {
    logMessage('⚠️ Portalda "Onay Bekleyen Sözleşmeler" sekmesi bulunamadı veya açılamadı. Hatalı veri çekilmemesi için işlem durduruldu.');
    pendingContracts = [];
    pendingCompanies = [];
    updateTabBadges();
    renderList();
    finalizeScan(0, modeTitle);
    return;
  }

  // ADIM 3: Boş tablo kontrolü (Örn: Onay bekleyen sözleşme yokken 52 kayıt uydurulmasını engeller)
  await sleep(1200);
  if (isTableEmptyOnPage()) {
    logMessage(`✓ İSG-KATİP: ${modeTitle} ekranında kayıt bulunmamaktadır (0 Sözleşme).`);
    if (isDevam) {
      activeContracts = [];
      activeCompanies = [];
    } else {
      pendingContracts = [];
      pendingCompanies = [];
    }
    updateTabBadges();
    renderList();
    finalizeScan(0, modeTitle);
    return;
  }

  // ADIM 3: Injected Script'e Doğrudan API İsteği Gönder
  window.postMessage({
    source: 'ISGPRO_CONTENT',
    type: 'TRIGGER_DIRECT_FETCH',
    mode: targetMode
  }, '*');

  // API yanıtı için 2 saniye bekle
  await sleep(1500);

  let finalContracts = [];

  // Eğer doğrudan API verisi yakalandıysa doğrudan onu kullan!
  if (latestApiContracts && latestApiContracts.length > 0) {
    logMessage(`🎉 [DOĞRUDAN SİSTEM VERİSİ] ${latestApiContracts.length} sözleşme Bakanlık veri kaynağından ham JSON olarak alındı!`);
    finalContracts = latestApiContracts.map(item => parseRawContractJson(item, targetMode)).filter(Boolean);
  } else {
    // API henüz tetiklenmediyse, DOM gezgini ile tüm sayfaları eksiksiz tara
    logMessage('📄 Sayfa tarayıcısı devreye girdi, tüm sayfalar dolaşılıyor...');
    await tryMaximizeRowsPerPage();
    await ensureFirstPage();

    const contractsMap = new Map();
    let currentPage = 1;
    let hasNext = true;

    while (hasNext && !shouldStopPagination && currentPage <= 50) {
      progText.textContent = `Sayfa ${currentPage} taranıyor... (${contractsMap.size} sözleşme toplandı)`;
      progBar.style.width = `${Math.min(currentPage * 20, 95)}%`;

      await sleep(500);

      const pageRows = extractContractsFromDomTable(targetMode);
      pageRows.forEach(c => {
        const sig = `${c.detsisNo || c.clientSgkNo || c.clientName}_${c.personName}_${c.duty}_${c.processId}`;
        if (!contractsMap.has(sig)) contractsMap.set(sig, c);
      });

      logMessage(`[Sayfa ${currentPage}] ${pageRows.length} satır okundu (Toplam: ${contractsMap.size})`);

      const currentFingerprint = getTableRowsFingerprint();
      let nextBtn = findActiveNextPageButton();
      if (!nextBtn) nextBtn = findNextPageNumberButton(currentPage);

      if (nextBtn) {
        triggerClick(nextBtn);
        await sleep(1800);
        currentPage++;
      } else {
        hasNext = false;
      }
    }

    finalContracts = Array.from(contractsMap.values());
  }

  // Verileri Kaydet ve UI'yı Güncelle
  if (isDevam) {
    activeContracts = finalContracts;
    activeCompanies = groupCompaniesByContracts(activeContracts);
    activeCompanies.forEach(c => selectedCompanyIds.add(c.id));
    switchMainTab('active');
  } else {
    pendingContracts = finalContracts;
    pendingCompanies = groupCompaniesByContracts(pendingContracts);
    pendingCompanies.forEach(c => selectedCompanyIds.add(c.id));
    switchMainTab('pending');
  }

  allScannedContracts = [...activeContracts, ...pendingContracts];

  updateTabBadges();
  renderList();

  const secDiv = document.getElementById('isgpro-company-section');
  if (secDiv) secDiv.style.display = 'block';

  finalizeScan(finalContracts.length, modeTitle);
}

function finalizeScan(count, title) {
  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'none';
  if (progBar) progBar.style.width = '100%';
  if (progText) progText.textContent = `İşlem tamamlandı: Toplam ${count} sözleşme`;

  isRunningAction = false;
  isAutoPaginating = false;

  logMessage(`🎉 TAMAMLANDI: ${title} altında ${count} sözleşme başarıyla çekildi.`);
}

function handleStopScan() {
  shouldStopPagination = true;
  logMessage('Tarama durdurma komutu verildi...');
}

// 9. LİSTE RENDER ETME VE KART GÖRÜNÜMÜ

function updateTabBadges() {
  const tabActiveBtn = document.getElementById('isgpro-tab-active');
  const tabPendingBtn = document.getElementById('isgpro-tab-pending');
  const selectionBadge = document.getElementById('isgpro-selection-badge');

  if (tabActiveBtn) tabActiveBtn.textContent = `🟢 Devam Edenler (${activeCompanies.length})`;
  if (tabPendingBtn) tabPendingBtn.textContent = `🟡 Onay Bekleyenler (${pendingCompanies.length})`;

  const totalComps = activeCompanies.length + pendingCompanies.length;
  if (selectionBadge) {
    selectionBadge.textContent = `${selectedCompanyIds.size} / ${totalComps} Firma Seçildi`;
  }
}

function renderList(filterQuery = '') {
  const container = document.getElementById('isgpro-company-list');
  const toolbarCount = document.getElementById('isgpro-toolbar-count');
  const exportBtn = document.getElementById('isgpro-btn-export-selected');

  if (!container) return;

  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  const q = filterQuery.toLowerCase().trim();
  updateTabBadges();

  const filtered = currentList.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.detsisNo && c.detsisNo.includes(q)) ||
    (c.clientSgkNo && c.clientSgkNo.includes(q)) ||
    (c.sgkNo && c.sgkNo.includes(q)) ||
    (c.naceCode && c.naceCode.includes(q)) ||
    (c.assignedSpecialist && c.assignedSpecialist.toLowerCase().includes(q)) ||
    (c.assignedDoctor && c.assignedDoctor.toLowerCase().includes(q))
  );

  toolbarCount.textContent = `${filtered.length} Firma Gösteriliyor (${currentList.length} Toplam)`;

  if (selectedCompanyIds.size > 0) {
    exportBtn.removeAttribute('disabled');
    exportBtn.textContent = `📥 Seçilen (${selectedCompanyIds.size}) Firmayı İSGPRO'ya Aktar`;
  } else {
    exportBtn.setAttribute('disabled', 'true');
    exportBtn.textContent = '📥 Lütfen En Az 1 Firma Seçin';
  }

  if (filtered.length === 0) {
    const emptyMsg = activeMainTab === 'active'
      ? 'Devam eden aktif sözleşme kaydı bulunamadı. Lütfen "Devam Eden Sözleşmeleri Çek" butonunu kullanınız.'
      : 'Onay bekleyen sözleşme kaydı bulunamadı (0 Kayıt).';

    container.innerHTML = `
      <div style="padding:20px;text-align:center;color:#94a3b8;font-size:11px;">
        ${emptyMsg}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isSelected = selectedCompanyIds.has(c.id);
    const isExpanded = expandedCompanyIds.has(c.id);
    const hazardClass = c.hazardClass === 'Çok Tehlikeli' ? 'isgpro-tag-red' : (c.hazardClass === 'Az Tehlikeli' ? 'isgpro-tag-green' : 'isgpro-tag-yellow');

    const hasSpecialist = c.specialists && c.specialists.length > 0;
    const hasDoctor = c.doctors && c.doctors.length > 0;
    const hasDsp = c.dsps && c.dsps.length > 0;

    const statusTag = activeMainTab === 'active'
      ? '<span class="isgpro-tag isgpro-tag-green">SÖZLEŞME DEVAM EDİYOR</span>'
      : '<span class="isgpro-tag isgpro-tag-yellow">ONAY BEKLİYOR</span>';

    return `
      <div class="isgpro-company-row ${isSelected ? 'selected' : ''}" data-id="${c.id}">
        <input
          type="checkbox"
          class="isgpro-company-check"
          data-id="${c.id}"
          ${isSelected ? 'checked' : ''}
        />
        <div class="isgpro-company-details">
          <!-- BAŞLIK KARTI: Firma Unvanı & Statü -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
            <div class="isgpro-company-title" title="${c.name}">${c.name}</div>
            ${statusTag}
          </div>

          <!-- DETSİS NO VEYA İŞYERİ SGK BİLGİSİ & GERÇEK ÇALIŞAN SAYISI -->
          <div class="isgpro-tags">
            ${c.isDetsis ? `
              <span class="isgpro-tag isgpro-tag-purple" title="Kamu Kurumu DETSİS Numarası">
                🏛️ DETSİS No: <strong>${c.detsisNo}</strong>
                <button type="button" class="isgpro-copy-btn" data-copy="${c.detsisNo}" title="DETSİS No Kopyala">📋</button>
              </span>
            ` : (c.clientSgkNo ? `
              <span class="isgpro-tag isgpro-tag-blue" title="Hizmet Alan İşyeri SGK Sicil No">
                🏢 İşyeri SGK: <strong>${c.clientSgkNo}</strong>
                <button type="button" class="isgpro-copy-btn" data-copy="${c.clientSgkNo}" title="SGK Sicil Kopyala">📋</button>
              </span>
            ` : '<span class="isgpro-tag isgpro-tag-gray">Sicil / DETSİS Yok</span>')}

            <span class="isgpro-tag isgpro-tag-teal" title="Bakanlık Sisteminden Alınan Gerçek Çalışan Sayısı">
              👥 <strong>${c.employeeCount > 0 ? c.employeeCount : '0 (Belirtilmemiş)'}</strong> Çalışan
            </span>

            <span class="isgpro-tag ${hazardClass}">${c.hazardClass}</span>
            ${c.naceCode ? `<span class="isgpro-tag isgpro-tag-purple" title="NACE Faaliyet Kodu">NACE: ${c.naceCode}</span>` : ''}
            <span class="isgpro-tag isgpro-tag-gray">📄 ${c.contractCount} Sözleşme</span>
          </div>

          <!-- ATALI UZMAN VE HEKİM BİLGİLERİ -->
          <div class="isgpro-personnel-box">
            <span>🛡️ <strong>Uzman:</strong> ${hasSpecialist ? `<strong>${c.assignedSpecialist}</strong>` : '<span class="isgpro-badge-unassigned">Atanmamış</span>'}</span>
            <span>🩺 <strong>Hekim:</strong> ${hasDoctor ? `<strong>${c.assignedDoctor}</strong>` : '<span class="isgpro-badge-unassigned">Atanmamış</span>'}</span>
            ${hasDsp ? `<span>💉 <strong>DSP:</strong> <strong>${c.assignedDsp}</strong></span>` : ''}
          </div>

          <!-- AYLIK HİZMET SÜRELERİ KARTI (GERÇEK DAKİKALAR & SAATLER) -->
          <div class="isgpro-duration-card">
            <div class="isgpro-duration-grid">
              <div class="isgpro-duration-col">
                <span class="dur-title">🛡️ Uzman Hizmet Süresi:</span>
                <strong>${c.totalSpecialistMinutes}</strong> dk/ay <span style="color:#64748b;">(${c.specialistHours} saat/ay)</span>
              </div>
              <div class="isgpro-duration-col">
                <span class="dur-title">🩺 Hekim Hizmet Süresi:</span>
                <strong>${c.totalDoctorMinutes}</strong> dk/ay <span style="color:#64748b;">(${c.doctorHours} saat/ay)</span>
              </div>
              ${c.totalDspMinutes > 0 ? `
              <div class="isgpro-duration-col" style="grid-column: span 2;">
                <span class="dur-title">💉 DSP Hizmet Süresi:</span>
                <strong>${c.totalDspMinutes}</strong> dk/ay <span style="color:#64748b;">(${c.dspHours} saat/ay)</span>
              </div>
              ` : ''}
            </div>
            <!-- TOPLAM İSG HİZMET SÜRESİ -->
            <div class="isgpro-duration-total-row">
              <span>⏱️ <strong>Toplam İSG Hizmet Süresi:</strong></span>
              <span><strong>${c.totalMinutes} Dk/Ay</strong> <span style="font-weight:600;color:#1e40af;">(${c.totalHours} Saat/Ay)</span></span>
            </div>
          </div>

          <!-- AÇILIR KAPANIR SÖZLEŞME DETAYLARI -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:5px;">
            <button type="button" class="isgpro-detail-toggle-btn" data-toggle="${c.id}">
              ${isExpanded ? '🔼 Sözleşme Detaylarını Gizle' : '🔍 Sözleşme Tarihleri & Detayları Göster ▾'}
            </button>
            ${c.osgbName ? `<span style="font-size:9.5px;color:#64748b;">OSGB: ${c.osgbName}</span>` : ''}
          </div>

          <!-- DETAY PANELİ -->
          <div id="details-${c.id}" class="isgpro-details-panel ${isExpanded ? 'open' : ''}">
            <div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:4px;">Sözleşme Kayıtları & Görevli Personeller:</div>

            ${!hasSpecialist ? `
              <div class="isgpro-unassigned-alert">
                🛡️ <strong>İş Güvenliği Uzmanı:</strong> <span class="isgpro-badge-unassigned">Atanmamış (Aktif Sözleşme Yok)</span>
              </div>
            ` : ''}

            ${!hasDoctor ? `
              <div class="isgpro-unassigned-alert">
                🩺 <strong>İşyeri Hekimi:</strong> <span class="isgpro-badge-unassigned">Atanmamış (Aktif Sözleşme Yok)</span>
              </div>
            ` : ''}

            ${c.contracts.map((cnt, ci) => {
              let roleBadge = '';
              if (cnt.dutyType === 'UZMAN') roleBadge = '<span class="isgpro-role-tag role-uzman">İş Güvenliği Uzmanı</span>';
              else if (cnt.dutyType === 'HEKIM') roleBadge = '<span class="isgpro-role-tag role-hekim">İşyeri Hekimi</span>';
              else if (cnt.dutyType === 'DSP') roleBadge = '<span class="isgpro-role-tag role-dsp">Diğer Sağlık Personeli</span>';
              else roleBadge = `<span class="isgpro-role-tag role-other">${cnt.duty}</span>`;

              const statBadge = cnt.statusCategory === 'DEVAM_EDEN'
                ? '<span class="isgpro-badge isgpro-badge-success">Devam Ediyor</span>'
                : '<span class="isgpro-badge isgpro-badge-warning">Onay Bekliyor</span>';

              return `
                <div class="isgpro-contract-item">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div>${roleBadge} <strong>#${ci + 1} — ${cnt.duty}</strong></div>
                    <div style="display:flex;gap:4px;align-items:center;">
                      ${statBadge}
                      <span class="isgpro-badge isgpro-badge-info">Süreç No: ${cnt.processId || '-'}</span>
                    </div>
                  </div>
                  <div style="color:#0f172a;margin-bottom:2px;font-size:10.5px;">
                    👤 Personel: ${cnt.personName ? `<strong>${cnt.personName}</strong>` : '<span class="isgpro-badge-unassigned" style="display:inline-block;padding:1px 6px;">Atama Yapılmamış</span>'}
                  </div>
                  <div style="display:flex;gap:8px;color:#475569;flex-wrap:wrap;margin-top:2px;">
                    <span>📅 <strong>Başlangıç:</strong> ${cnt.startDate}</span>
                    <span>🏁 <strong>Bitiş:</strong> ${cnt.endDate}</span>
                    <span>⏱️ <strong>Aylık Süre:</strong> <strong>${cnt.durationMinutes}</strong> dk/ay (${cnt.durationHours} sa/ay)</span>
                  </div>
                  ${cnt.detsisNo ? `<div style="color:#6b21a8;margin-top:2px;">🏛️ <strong>DETSİS No:</strong> ${cnt.detsisNo}</div>` : ''}
                  ${cnt.osgbName ? `<div style="color:#64748b;margin-top:2px;">🏢 Hizmet Sunucu OSGB: ${cnt.osgbName} (Sicil: ${cnt.osgbSgkNo || '-'})</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.isgpro-company-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = chk.getAttribute('data-id');
      if (e.target.checked) selectedCompanyIds.add(id);
      else selectedCompanyIds.delete(id);
      renderList(document.getElementById('isgpro-company-search')?.value || '');
    });
  });

  container.querySelectorAll('.isgpro-detail-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-toggle');
      if (expandedCompanyIds.has(id)) {
        expandedCompanyIds.delete(id);
      } else {
        expandedCompanyIds.add(id);
      }
      renderList(document.getElementById('isgpro-company-search')?.value || '');
    });
  });

  container.querySelectorAll('.isgpro-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(val);
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = '📋'; }, 1500);
    });
  });
}

function toggleAllCurrentTab(select) {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  if (select) {
    currentList.forEach(c => selectedCompanyIds.add(c.id));
    logMessage(`Sekmedeki tüm firmalar (${currentList.length}) seçildi.`);
  } else {
    currentList.forEach(c => selectedCompanyIds.delete(c.id));
    logMessage('Firma seçimleri temizlendi.');
  }
  renderList(document.getElementById('isgpro-company-search')?.value || '');
}

function handleFilterChange(e) {
  renderList(e.target.value);
}

// 10. İSGPRO'YA AKTARMA VE EXCEL (CSV / TSV)

function handleExportSelectedCompanies() {
  const allComps = [...activeCompanies, ...pendingCompanies];
  const chosen = allComps.filter(c => selectedCompanyIds.has(c.id));

  if (chosen.length === 0) {
    alert('Lütfen aktarmak için en az bir firma seçiniz.');
    return;
  }

  const exportPayload = {
    source: 'ISG-KATIP Chrome Extension v4.1',
    exportedAt: new Date().toISOString(),
    totalContractsScanned: allScannedContracts.length,
    selectedCompanyCount: chosen.length,
    companies: chosen,
    contracts: allScannedContracts.filter(c => chosen.some(comp => comp.contracts.some(cc => cc.id === c.id))),
    employees: scannedEmployees
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);

  navigator.clipboard.writeText(jsonStr).then(() => {
    logMessage(`✓ ${chosen.length} firmanın tüm detayları panoya kopyalandı!`);
  }).catch(() => {});

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `isgpro_katip_${activeMainTab}_firmalar_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  chrome.runtime.sendMessage({ action: 'SAVE_KATIP_DATA', payload: exportPayload });

  logMessage(`🎉 BAŞARILI: Seçilen ${chosen.length} firmanın bilgileri dışa aktarıldı.`);
}

function handleExportCsv() {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;

  if (currentList.length === 0) {
    alert('Aktarılacak firma bulunamadı.');
    return;
  }

  let csvContent = '\uFEFF';
  csvContent += 'Sıra;Hizmet Alan İşyeri Unvanı;DETSİS No;Hizmet Alan SGK Sicil No;Çalışan Sayısı;Atalı Uzman;Uzman Süresi (Dk/Ay);Uzman Süresi (Saat/Ay);Atalı Hekim;Hekim Süresi (Dk/Ay);Hekim Süresi (Saat/Ay);Toplam İSG Süresi (Dk/Ay);Toplam İSG Süresi (Saat/Ay);Tehlike Sınıfı;NACE Kodu;Statü;OSGB Adı\n';

  currentList.forEach((c, idx) => {
    csvContent += `"${idx + 1}";"${c.name}";"${c.detsisNo || '-'}";"${c.clientSgkNo || '-'}";"${c.employeeCount}";"${c.assignedSpecialist || 'Atanmamış'}";"${c.totalSpecialistMinutes}";"${c.specialistHours}";"${c.assignedDoctor || 'Atanmamış'}";"${c.totalDoctorMinutes}";"${c.doctorHours}";"${c.totalMinutes}";"${c.totalHours}";"${c.hazardClass}";"${c.naceCode}";"${c.statusCategory}";"${c.osgbName}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `isgpro_katip_${activeMainTab}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  logMessage('✓ Excel CSV dosyası indirildi.');
}

function handleCopyTsv() {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  if (currentList.length === 0) return;

  let tsvContent = 'Hizmet Alan İşyeri\tDETSİS No\tİşyeri SGK No\tÇalışan Sayısı\tUzman\tUzman Süresi (Dk/Ay)\tHekim\tHekim Süresi (Dk/Ay)\tToplam Süre (Dk/Ay)\tToplam Saat\tTehlike Sınıfı\tNACE\n';
  currentList.forEach(c => {
    tsvContent += `${c.name}\t${c.detsisNo || '-'}\t${c.clientSgkNo || '-'}\t${c.employeeCount}\t${c.assignedSpecialist || 'Atanmamış'}\t${c.totalSpecialistMinutes} Dk\t${c.assignedDoctor || 'Atanmamış'}\t${c.totalDoctorMinutes} Dk\t${c.totalMinutes} Dk\t${c.totalHours} Sa\t${c.hazardClass}\t${c.naceCode}\n`;
  });

  navigator.clipboard.writeText(tsvContent).then(() => {
    logMessage('✓ Tablo kopyalandı! Excel sayfasına gidip doğrudan Ctrl + V ile yapıştırabilirsiniz.');
    alert('Tablo panoya kopyalandı. Excel açıp doğrudan Ctrl + V ile yapıştırabilirsiniz.');
  });
}

// 11. SÖZLEŞME İŞLEMLERİ (ONAY & İNDİRME)

async function handleApproveAllContracts() {
  if (isRunningAction) return;
  if (!confirm('Sayfadaki bekleyen tüm sözleşmeler sırayla onaylanacak. Onaylıyor musunuz?')) return;

  isRunningAction = true;
  logMessage('Bekleyen sözleşmeler onaylanıyor...');

  const buttons = Array.from(document.querySelectorAll('button, a, .p-button, input[type="button"]')).filter(btn => {
    const t = (btn.textContent || btn.getAttribute('title') || '').toLowerCase();
    return (t.includes('onayla') || t.includes('kabul et')) && !t.includes('reddet') && !t.includes('iptal');
  });

  if (buttons.length === 0) {
    logMessage('⚠️ Onaylanabilecek sözleşme butonu bulunamadı.');
    isRunningAction = false;
    return;
  }

  for (let i = 0; i < buttons.length; i++) {
    try {
      logMessage(`[${i + 1}/${buttons.length}] Onay tetikleniyor...`);
      buttons[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      triggerClick(buttons[i]);
      await sleep(1000);
      confirmModalDialog();
      await sleep(2000);
    } catch (e) {
      logMessage(`Hata: ${e.message}`);
    }
  }

  isRunningAction = false;
  logMessage('✓ Toplu onay tamamlandı.');
}

function confirmModalDialog() {
  const dialogButtons = document.querySelectorAll('.p-dialog button, .modal button, .swal2-confirm, div[role="dialog"] button');
  dialogButtons.forEach(btn => {
    const txt = btn.textContent.toLowerCase();
    if (txt.includes('evet') || txt.includes('onayla') || txt.includes('tamam')) {
      triggerClick(btn);
    }
  });
}

async function handleDownloadAllContracts() {
  if (isRunningAction) return;
  isRunningAction = true;
  logMessage('Sözleşme PDF belgeleri indiriliyor...');

  const links = Array.from(document.querySelectorAll('a[href*="pdf"], a[download], button[title*="İndir"], .fa-download, .pi-download')).map(el => el.closest('button, a') || el);

  if (links.length === 0) {
    logMessage('⚠️ İndirilebilir sözleşme bağlantısı bulunamadı.');
    isRunningAction = false;
    return;
  }

  for (let i = 0; i < links.length; i++) {
    try {
      logMessage(`[${i + 1}/${links.length}] Belge indiriliyor...`);
      links[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      triggerClick(links[i]);
      await sleep(1500);
    } catch (e) {
      logMessage(`İndirme hatası: ${e.message}`);
    }
  }

  isRunningAction = false;
  logMessage('✓ Tüm sözleşmelerin indirilmesi tamamlandı.');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Bot Başlatıcı
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingBot);
} else {
  injectFloatingBot();
}
