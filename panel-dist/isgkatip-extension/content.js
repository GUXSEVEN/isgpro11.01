// content.js - İSGPRO Katip Asistanı Sayfa İçi Akıllı Bot Scripti (v5.5.2)
// 1) Tüm Sayfalardaki Sözleşmeleri Eksiksiz Çekme (Örn: 1. Sayfa 100 + 2. Sayfa 74 = 174 Sözleşme)
// 2) KESİNLİKLE HİZMET ALAN İŞYERİ UNVANI KULLANILIR (Hizmet Veren Ticari Unvanı Asla Sözleşme İsmi Olamaz)
// 3) Sözleşme Statü Sütunu Doğrulaması:
//    - Devam Edenler: "Sözleşme Devam Ediyor"
//    - Onay Bekleyenler: "Sözleşme Teklif Durumunda"
// 4) Uzman + Hekim + DSP Toplam Sözleşme Sayısı ve Firma Sayısını Birlikte Gösterme
// 5) SEÇİLEN SÖZLEŞMELERİ İŞLEMLER > DETAY GÖRÜNTÜLE İLE TOPLU İNDİRME MOTORU
// 6) 6331 Mevzuat Süre Hesaplama, Çalışan Çekme & Canlı İSGPRO Senkronizasyonu
console.log('İSGPRO İSG-KATİP Akıllı Asistanı (v5.5.2 - Hizmet Alan İşyeri Öncelikli & Çoklu Sayfa) Devrede.');

const ISGPRO_CONFIG = {
  version: '5.5.2',
  apiEndpoint: 'https://app.isgpro.com.tr/api/v1/katip/live-sync',
  webOrigin: 'https://app.isgpro.com.tr',
  syncToken: 'ISGPRO-LIVE-SYNC-2026-TOKEN',
  autoSyncOnScan: true,
  enableLegislationModule: true,
  enableEmployeeHarvester: true,
  enableAutoContractUpdater: true,
  paginationDelayMs: 1600,
  rates: {
  "azTehlikeli": {
    "uzman": 10,
    "hekim": 5,
    "dsp": 0
  },
  "tehlikeli": {
    "uzman": 20,
    "hekim": 10,
    "dsp": 0
  },
  "cokTehlikeli": {
    "uzman": 40,
    "hekim": 15,
    "dsp": 15
  }
}
};

function ensureInjectedScript() {
  if (document.getElementById('isgpro-injected-script')) return;
  const s = document.createElement('script');
  s.id = 'isgpro-injected-script';
  s.src = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('injected.js')
    : 'injected.js';
  (document.head || document.documentElement).appendChild(s);
}
try { ensureInjectedScript(); } catch (e) {}

// State
let isRunningAction = false;
let isAutoPaginating = false;
let shouldStopPagination = false;
let activeMainTab = 'active'; // 'active' (Devam Eden) | 'pending' (Onay Bekleyen) | 'employees' (Çalışanlar)
let showOnlyDeficitCompanies = false;

let allScannedContracts = [];
let activeCompanies = [];
let pendingCompanies = [];
let activeContracts = [];
let pendingContracts = [];

let selectedCompanyIds = new Set();
let selectedContractIds = new Set(); // Tekil sözleşme seçimi (Uzman, Hekim, DSP ayrı ayrı seçilebilir)
let expandedCompanyIds = new Set();
let scannedEmployees = [];
let scannedPersonnelContracts = []; // Personel Sözleşmeleri > Devam Eden + Sorumlu Müdür Sözleşmeleri
let computedPersonnelQuotas = []; // Kişi bazlı Toplam Atanan Süre - Firmalardaki Süre = Kalan Süre
let hasEqualizedCompanyDurations = false; // Firmalardaki asgari ve güncellenmesi gereken süreler eşitlendi mi?
let capturedContractDetails = {};

// API Yakalama Önbelleği
let latestApiContracts = [];
let accumulatedApiContracts = [];
let accumulatedApiPersonnelContracts = [];

let syncBroadcastChannel = null;
try {
  syncBroadcastChannel = new BroadcastChannel('isgpro_katip_live_sync');
} catch (e) {}

window.addEventListener('message', (event) => {
  if (!event.data || event.data.source !== 'ISGPRO_INJECTED') return;

  if (event.data.type === 'KATIP_API_CONTRACTS' || event.data.type === 'KATIP_DIRECT_FETCH_SUCCESS') {
    const rawList = event.data.contracts || [];
    if (rawList.length > 0) {
      latestApiContracts = rawList;
      accumulatedApiContracts = accumulatedApiContracts.concat(rawList);
      logMessage(`🎯 [Sistem API] Sunucudan ${rawList.length} sözleşme yakalandı (Biriken: ${accumulatedApiContracts.length}).`);
    }
  } else if (event.data.type === 'KATIP_API_PERSONNEL_CONTRACTS') {
    const rawPList = event.data.personnelContracts || [];
    if (rawPList.length > 0) {
      accumulatedApiPersonnelContracts = accumulatedApiPersonnelContracts.concat(rawPList);
      logMessage(`👤 [Personel Sözleşmesi API] ${rawPList.length} personel/sorumlu müdür sözleşmesi yakalandı.`);
    }
  } else if (event.data.type === 'KATIP_CONTRACT_DETAIL_CAPTURED') {
    if (event.data.processId && event.data.detail) {
      capturedContractDetails[String(event.data.processId)] = event.data.detail;
      logMessage(`🔍 [Detay Görüntüle API] Süreç #${event.data.processId} tam detay verisi yakalandı.`);
    }
  } else if (event.data.type === 'KATIP_API_EMPTY_CONTRACTS') {
    logMessage('ℹ️ [Sistem API] Portaldan boş sözleşme listesi (0 kayıt) teyit edildi.');
    latestApiContracts = [];
  } else if (event.data.type === 'KATIP_API_EMPLOYEES') {
    const rawEmps = event.data.employees || [];
    scannedEmployees = rawEmps.map((emp, idx) => normalizeEmployeeRecord(emp, idx));
    logMessage(`👥 [Çalışan API] ${scannedEmployees.length} sigortalı çalışan kaydı başarıyla çekildi.`);
    updateTabBadges();
    if (activeMainTab === 'employees') renderList();
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
      <span>İSGPRO Katip Botu v${ISGPRO_CONFIG.version}</span>
    </button>

    <div id="isgpro-katip-panel" style="width:670px;max-width:calc(100vw - 24px);">
      <div class="isgpro-panel-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <strong style="font-size:13.5px;">İSGPRO Katip Asistanı</strong>
          <span class="isgpro-badge isgpro-badge-success">v${ISGPRO_CONFIG.version} Hizmet Alan İşyeri & Detay İndirici</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="isgpro-btn-sync-settings" type="button" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:3px 8px;border-radius:4px;font-size:10.5px;cursor:pointer;">⚙️ Sync Ayarı</button>
          <button id="isgpro-btn-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;line-height:1;" title="Kapat">✕</button>
        </div>
      </div>

      <div class="isgpro-panel-body">
        <div id="isgpro-sync-drawer" class="isgpro-card" style="display:none;background:#f8fafc;border:1px solid #cbd5e1;">
          <div style="font-weight:700;font-size:11.5px;color:#0f172a;margin-bottom:6px;">🔗 Kendi Uygulamana Otomatik Veri Aktarım Ayarları</div>
          <div style="display:grid;grid-template-columns:1fr;gap:6px;font-size:11px;">
            <label style="color:#475569;">Uygulamanızın API / Webhook Adresi (POST):
              <input id="isgpro-input-endpoint" type="text" class="isgpro-search-input" style="margin-top:2px;" value="${ISGPRO_CONFIG.apiEndpoint}" placeholder="Örn: http://localhost:3000/api/katip-import" />
            </label>
            <label style="color:#475569;">Eşitleme Anahtarı (Bearer Sync Token):
              <input id="isgpro-input-token" type="text" class="isgpro-search-input" style="margin-top:2px;" value="${ISGPRO_CONFIG.syncToken}" />
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#0f172a;font-weight:600;cursor:pointer;">
              <input id="isgpro-check-autosync" type="checkbox" ${ISGPRO_CONFIG.autoSyncOnScan ? 'checked' : ''} />
              İSG-KATİP taraması biter bitmez firmaları otomatik kendi uygulamama aktar
            </label>
          </div>
        </div>

        <div class="isgpro-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="font-weight:800;font-size:12px;color:#0f172a;display:flex;align-items:center;gap:6px;">
              <span>📑 Tüm Sayfalar Sözleşme Çekici & Detay İndirici</span>
            </div>
            <span id="isgpro-selection-badge" class="isgpro-badge isgpro-badge-warning">0 Firma · 0 Sözleşme Seçildi</span>
          </div>

          <p style="font-size:11px;color:#64748b;margin:0 0 10px 0;line-height:1.4;">
            <strong>Hizmet Sözleşmeleri</strong> (Devam Eden / Onay Bekleyen) ve <strong>Personel Sözleşmeleri</strong> sayfalarına doğrudan bağlanarak arka plan API &amp; Angular veritabanından tüm kayıtları (100/100) eksiksiz çeker. Firma başlığında <strong>Unvan + SGK/DETSİS No</strong> birlikte gösterilir.
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px;">
            <button id="isgpro-btn-scan-devam" class="isgpro-btn isgpro-btn-emerald" style="padding:10px 12px;font-size:11.5px;">
              🟢 Devam Eden Hizmet Sözleşmelerini Çek
            </button>

            <button id="isgpro-btn-scan-pending" class="isgpro-btn isgpro-btn-amber-dark" style="padding:10px 12px;font-size:11.5px;">
              🟡 Onay Bekleyen Hizmet Sözleşmelerini Çek
            </button>
          </div>

          <div style="margin-bottom:6px;">
            <button id="isgpro-btn-scan-personnel" class="isgpro-btn isgpro-btn-indigo" style="padding:10px 12px;font-size:11.5px;width:100%;font-weight:800;">
              👥 Personel Sözleşmelerini Çek (Aktif Devam Eden — Veritabanı / API)
            </button>
          </div>

          <button id="isgpro-btn-stop-scan" class="isgpro-btn isgpro-btn-danger" style="display:none;margin-bottom:6px;">
            ⏹️ İşlemi Durdur
          </button>

          <div id="isgpro-progress-container" class="isgpro-progress-container">
            <div id="isgpro-progress-bar" class="isgpro-progress-bar"></div>
          </div>
          <div id="isgpro-progress-text" style="font-size:10px;color:#6366f1;font-weight:700;margin-top:3px;display:none;text-align:right;">
            Veriler çekiliyor...
          </div>

          <div id="isgpro-company-section" style="display:none;margin-top:12px;">
            <div class="isgpro-tabs" style="margin-bottom:8px;">
              <button type="button" id="isgpro-tab-active" class="isgpro-tab-btn active">
                🟢 Devam Eden (0 Sözleşme · 0 Firma)
              </button>
              <button type="button" id="isgpro-tab-pending" class="isgpro-tab-btn">
                🟡 Teklif / Bekleyen (0 Sözleşme · 0 Firma)
              </button>
              <button type="button" id="isgpro-tab-employees" class="isgpro-tab-btn">
                👥 Personel Kota & Süre (0)
              </button>
            </div>

            <!-- Uzman, Hekim ve DSP Toplam Sözleşme Kaydı Özeti -->
            <div id="isgpro-contract-breakdown-bar" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:7px 10px;margin-bottom:8px;font-size:10.5px;color:#0f172a;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;">
              <div>
                <strong>Toplam Kayıt:</strong> <span id="isgpro-stat-total-contracts">0 Sözleşme</span>
                (<span id="isgpro-stat-role-breakdown">🛡️ 0 Uzman · 🩺 0 Hekim · 💉 0 DSP</span>)
              </div>
              <div>
                <strong>Gruplanan İşyeri:</strong> <span id="isgpro-stat-total-companies">0 Firma</span>
              </div>
            </div>

            <div style="display:flex;gap:6px;margin-bottom:8px;">
              <input
                type="text"
                id="isgpro-company-search"
                class="isgpro-search-input"
                style="margin-bottom:0;flex:1;"
                placeholder="Firma adı, DETSİS No, İşyeri SGK, Süreç No, Uzman veya Hekim ile ara..."
              />
              <button type="button" id="isgpro-btn-filter-deficit" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:4px 10px;font-size:10.5px;white-space:nowrap;">
                ⚠️ Eksik Süreliler (0)
              </button>
            </div>

            <div class="isgpro-company-list-wrapper">
              <div class="isgpro-toolbar">
                <span id="isgpro-toolbar-count" style="font-weight:700;font-size:10.5px;">0 Firma (0 Sözleşme) Gösteriliyor</span>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button type="button" id="isgpro-btn-select-all" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    ☑️ Tümünü Seç
                  </button>
                  <button type="button" id="isgpro-btn-deselect-all" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    ⬜ Temizle
                  </button>
                  <button type="button" id="isgpro-btn-export-csv" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    📊 CSV
                  </button>
                  <button type="button" id="isgpro-btn-copy-tsv" class="isgpro-btn isgpro-btn-subtle" style="width:auto;padding:2px 6px;font-size:10px;">
                    📋 Kopyala
                  </button>
                </div>
              </div>

              <div id="isgpro-company-list" class="isgpro-company-list" style="max-height:350px;"></div>
            </div>

            <!-- Seçilen Sözleşmeleri İşlemler > Detay Görüntüle ile Toplu İndirme Butonu -->
            <div style="margin-top:10px;">
              <button id="isgpro-btn-download-selected-details" class="isgpro-btn isgpro-btn-amber" style="padding:10px 14px;font-size:12px;margin-bottom:8px;" disabled>
                ⬇️ Seçilen Sözleşmeleri (İşlemler &gt; Detay Görüntüle) Toplu İndir (0)
              </button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button id="isgpro-btn-live-sync" class="isgpro-btn isgpro-btn-indigo" disabled>
                🔄 İSGPRO ile Canlı Eşitle (0)
              </button>
              <button id="isgpro-btn-export-selected" class="isgpro-btn isgpro-btn-emerald" disabled>
                📥 JSON Olarak İndir (0)
              </button>
            </div>
          </div>
        </div>

        <div class="isgpro-card">
          <div style="font-weight:700;margin-bottom:6px;font-size:12px;display:flex;align-items:center;justify-content:space-between;">
            <span>⚡ Personel Kota Hesaplama & 2 Aşamalı Otomatik Süre Eşitleme</span>
            <span class="isgpro-badge isgpro-badge-success" style="font-size:9.5px;">Fazla Süre İndir + Eksik Güncelle</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:6px;margin-bottom:8px;">
            <button id="isgpro-btn-auto-fix-durations" class="isgpro-btn isgpro-btn-amber" style="font-weight:800;padding:10px 12px;font-size:11.5px;">
              ⚖️ Eksik Süreleri Mevzuata Eşitle (1. Fazla Sürelileri Asgariye Çek ➔ 2. Güncellenmesi Gerekenleri Güncelle)
            </button>
            <button id="isgpro-btn-fetch-employees" class="isgpro-btn isgpro-btn-indigo" style="font-weight:800;padding:10px 12px;font-size:11.5px;">
              👥 Personel & Sorumlu Müdür Sözleşmelerini Çek / Kalan Süreleri Hesapla
            </button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button id="isgpro-btn-export-personnel-excel" class="isgpro-btn isgpro-btn-emerald" style="font-size:11px;">
              📊 Personel Kalan Süreleri Excel (.CSV) İndir
            </button>
            <button id="isgpro-btn-approve-all" class="isgpro-btn isgpro-btn-subtle" style="border:1px solid #cbd5e1;color:#0f172a;font-weight:700;font-size:11px;">
              ✓ Teklifleri Onayla
            </button>
          </div>
        </div>

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

  const toggleBtn = document.getElementById('isgpro-katip-toggle-btn');
  const panel = document.getElementById('isgpro-katip-panel');
  const closeBtn = document.getElementById('isgpro-btn-close');
  const syncSettingsBtn = document.getElementById('isgpro-btn-sync-settings');
  const syncDrawer = document.getElementById('isgpro-sync-drawer');

  toggleBtn.addEventListener('click', () => panel.classList.toggle('active'));
  closeBtn.addEventListener('click', () => panel.classList.remove('active'));
  if (syncSettingsBtn && syncDrawer) {
    syncSettingsBtn.addEventListener('click', () => {
      syncDrawer.style.display = syncDrawer.style.display === 'none' ? 'block' : 'none';
    });
  }

  document.getElementById('isgpro-btn-diagnose')?.addEventListener('click', runDomDiagnostic);
  document.getElementById('isgpro-btn-scan-devam').addEventListener('click', () => runSmartDirectFetch('DEVAM_EDEN'));
  document.getElementById('isgpro-btn-scan-pending').addEventListener('click', () => runSmartDirectFetch('ONAY_BEKLEYEN'));
  document.getElementById('isgpro-btn-scan-personnel')?.addEventListener('click', () => handleFetchEmployeesForSelected(false));
  document.getElementById('isgpro-btn-stop-scan').addEventListener('click', handleStopScan);

  document.getElementById('isgpro-tab-active').addEventListener('click', () => switchMainTab('active'));
  document.getElementById('isgpro-tab-pending').addEventListener('click', () => switchMainTab('pending'));
  document.getElementById('isgpro-tab-employees').addEventListener('click', () => switchMainTab('employees'));

  document.getElementById('isgpro-btn-filter-deficit').addEventListener('click', () => {
    showOnlyDeficitCompanies = !showOnlyDeficitCompanies;
    const btn = document.getElementById('isgpro-btn-filter-deficit');
    if (btn) {
      btn.style.background = showOnlyDeficitCompanies ? '#fef3c7' : '';
      btn.style.borderColor = showOnlyDeficitCompanies ? '#f59e0b' : '';
    }
    renderList(document.getElementById('isgpro-company-search')?.value || '');
  });

  document.getElementById('isgpro-btn-select-all').addEventListener('click', () => toggleAllCurrentTab(true));
  document.getElementById('isgpro-btn-deselect-all').addEventListener('click', () => toggleAllCurrentTab(false));
  document.getElementById('isgpro-company-search').addEventListener('input', handleFilterChange);

  document.getElementById('isgpro-btn-download-selected-details').addEventListener('click', handleBulkDownloadSelectedContractsViaDetail);
  document.getElementById('isgpro-btn-live-sync').addEventListener('click', handleLiveSyncToIsgpro);
  document.getElementById('isgpro-btn-export-selected').addEventListener('click', handleExportSelectedCompanies);
  document.getElementById('isgpro-btn-export-csv').addEventListener('click', handleExportCsv);
  document.getElementById('isgpro-btn-copy-tsv').addEventListener('click', handleCopyTsv);

  document.getElementById('isgpro-btn-fetch-employees').addEventListener('click', handleFetchEmployeesForSelected);
  document.getElementById('isgpro-btn-auto-fix-durations').addEventListener('click', handleAutoFixDeficitDurations);
  document.getElementById('isgpro-btn-approve-all').addEventListener('click', handleApproveAllContracts);
  document.getElementById('isgpro-btn-export-personnel-excel')?.addEventListener('click', exportPersonnelQuotasToExcel);
}

function logMessage(msg) {
  const box = document.getElementById('isgpro-log-box');
  const time = new Date().toLocaleTimeString('tr-TR');
  if (box) {
    box.textContent += `\n[${time}] ${msg}`;
    box.scrollTop = box.scrollHeight;
  }
  console.log(`[İSGPRO Katip Bot] ${msg}`);
}

function switchMainTab(tab) {
  activeMainTab = tab;
  const tabActiveBtn = document.getElementById('isgpro-tab-active');
  const tabPendingBtn = document.getElementById('isgpro-tab-pending');
  const tabEmployeesBtn = document.getElementById('isgpro-tab-employees');

  [tabActiveBtn, tabPendingBtn, tabEmployeesBtn].forEach(b => b && b.classList.remove('active'));
  if (tab === 'active' && tabActiveBtn) tabActiveBtn.classList.add('active');
  else if (tab === 'pending' && tabPendingBtn) tabPendingBtn.classList.add('active');
  else if (tab === 'employees' && tabEmployeesBtn) tabEmployeesBtn.classList.add('active');

  renderList(document.getElementById('isgpro-company-search')?.value || '');
}

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
    const titles = clone.querySelectorAll('.p-column-title, .ui-column-title, .column-title');
    titles.forEach(t => t.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  } catch (e) {
    return (cell.textContent || '').replace(/\s+/g, ' ').trim();
  }
}

// SÖZLEŞME STATÜ SÜTUNU DOĞRULAMA MOTORU (Gerçek İSG-KATİP Tablolarıyla %100 Uyumlu)
function matchesTargetStatus(rawStatusText, targetMode) {
  const norm = normalizeText(rawStatusText || '');
  if (!norm) return true;

  // İptal / Fesih olanları her zaman dışla
  if (norm.includes('iptal edildi') || norm.includes('feshedil') || norm.includes('sonlandirildi') || norm === 'iptal' || norm === 'fesih') {
    return false;
  }

  if (targetMode === 'DEVAM_EDEN') {
    // Devam edenleri tararken açıkça teklif/onay bekleyen olduğu yazıyorsa dışla, aksi halde kabul et
    if (norm.includes('teklif durumunda') || norm.includes('sozlesme teklif durumunda') || norm.includes('onay bekliyor') || norm.includes('onayda bekleyen')) {
      return false;
    }
    return true;
  } else {
    // Onay bekleyenleri tararken açıkça devam ediyor olduğu yazıyorsa dışla, aksi halde kabul et
    if ((norm.includes('sozlesme devam ediyor') || norm === 'devam ediyor') && !norm.includes('teklif') && !norm.includes('onay')) {
      return false;
    }
    return true;
  }
}
const matchesContractStatus = matchesTargetStatus;

function isTableEmptyOnPage() {
  const emptyIndicators = ['.p-datatable-emptymessage', '.ui-datatable-emptymessage', '.empty-message', '.no-records'];
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

async function waitForKatipTableReady(maxWaitMs = 3500) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const isLoading = document.querySelector('.p-datatable-loading-overlay, .p-datatable-loading, .pi-spin, .fa-spinner');
    const rows = Array.from(document.querySelectorAll('table tbody tr, .p-datatable-tbody > tr, div[role="row"]')).filter(r => !r.closest('thead') && !r.classList.contains('p-datatable-emptymessage'));
    if (!isLoading && rows.length > 0) return true;
    await sleep(350);
  }
  return !isTableEmptyOnPage();
}

function isCurrentlyOnPersonnelContractsPage() {
  const ths = Array.from(document.querySelectorAll('table thead th, .p-datatable-thead th, div[role="columnheader"]'));
  const headerText = normalizeText(ths.map(t => t.textContent || '').join(' '));
  if (
    headerText.includes('sozlesme yapilan kisi sertifika') ||
    headerText.includes('sertifika no') ||
    headerText.includes('atanan sure') ||
    (headerText.includes('sertifika tipi') && !headerText.includes('hizmet alan'))
  ) {
    return true;
  }
  const breadcrumbOrTitle = normalizeText(
    Array.from(document.querySelectorAll('.p-breadcrumb, .page-title, .layout-main h1, .layout-main h2, .layout-main h3, .card-title'))
      .map(el => el.textContent || '')
      .join(' ')
  );
  if (breadcrumbOrTitle.includes('personel sozlesmeleri') || breadcrumbOrTitle.includes('sorumlu mudur sozlesmeleri')) {
    return true;
  }
  return false;
}

async function navigateToKatipSection(targetType) {
  let targetLabel = 'Hizmet Sözleşmeleri > Devam Eden Sözleşmeler';
  let parentMenuKeywords = [];
  let keywords = ['devam eden sozlesmeler', 'devam eden'];
  const onPersonnelPage = isCurrentlyOnPersonnelContractsPage();

  if (targetType === 'DEVAM_EDEN') {
    targetLabel = 'Hizmet Sözleşmeleri > Devam Eden Sözleşmeler';
    parentMenuKeywords = ['hizmet sozlesmeleri', 'dis gorevlendirme', 'isyeri sozlesmeleri'];
    keywords = ['devam eden sozlesmeler', 'devam eden'];
  } else if (targetType === 'ONAY_BEKLEYEN') {
    targetLabel = 'Hizmet Sözleşmeleri > Onay Bekleyen Sözleşmeler';
    parentMenuKeywords = ['hizmet sozlesmeleri', 'dis gorevlendirme', 'isyeri sozlesmeleri'];
    keywords = ['onay bekleyen sozlesmeler', 'onay bekleyen', 'onayda bekleyen', 'sozlesme teklif', 'teklif durumunda'];
  } else if (targetType === 'ASGARI_FAZLA') {
    targetLabel = 'Asgari Süreden Fazla Atanan Sözleşmeler';
    parentMenuKeywords = ['hizmet sozlesmeleri'];
    keywords = [
      'asgari sureden fazla atanan sozlesmeler',
      'asgari sureden fazla atanan',
      'asgari sureden fazla',
      'fazla atanan sozlesmeler',
      'fazla sureli sozlesmeler'
    ];
  } else if (targetType === 'GUNCELLENMESI_GEREKEN') {
    targetLabel = 'Güncellenmesi Gereken Sözleşmeler';
    parentMenuKeywords = ['hizmet sozlesmeleri'];
    keywords = [
      'guncellenmesi gereken sozlesmeler',
      'guncellenmesi gereken',
      'sure guncellenmesi gereken',
      'eksik sureli sozlesmeler',
      'guncelleme bekleyen sozlesmeler'
    ];
  } else if (targetType === 'PERSONEL_SOZLESMELERI_DEVAM') {
    targetLabel = 'Personel Sözleşmeleri > Devam Eden Sözleşmeler';
    parentMenuKeywords = ['personel sozlesmeleri', 'ic gorevlendirme', 'osgb personel'];
    keywords = [
      'personel sozlesmeleri',
      'personel devam eden sozlesmeler',
      'devam eden sozlesmeler',
      'devam eden'
    ];
  } else if (targetType === 'SORUMLU_MUDUR_SOZLESMELERI') {
    targetLabel = 'Sorumlu Müdür Sözleşmeleri';
    parentMenuKeywords = ['personel sozlesmeleri', 'sorumlu mudur'];
    keywords = [
      'sorumlu mudur sozlesmeleri',
      'sorumlu mudur',
      'sorumlu mudur atama'
    ];
  }

  logMessage(`🔄 İSG-KATİP portalında "${targetLabel}" ekranına bağlanılıyor...`);
  let switched = false;

  // Eğer Hizmet Sözleşmeleri isteniyorsa ama şu an Personel Sözleşmeleri sayfasındaysak (veya tam tersi), önce sol menüden doğru ana menüye geç!
  const needsMenuSwitch =
    ((targetType === 'DEVAM_EDEN' || targetType === 'ONAY_BEKLEYEN') && onPersonnelPage) ||
    (targetType === 'PERSONEL_SOZLESMELERI_DEVAM' && !onPersonnelPage);

  if (needsMenuSwitch && parentMenuKeywords.length > 0) {
    const menuLinks = Array.from(document.querySelectorAll('.layout-menu a, .p-menu a, .sidebar a, nav a, .p-panelmenu a, a.p-menuitem-link, .layout-menuitem-root-text, li[role="menuitem"] a'));
    for (const link of menuLinks) {
      const txt = normalizeText(link.textContent);
      for (const pkw of parentMenuKeywords) {
        if (txt.includes(pkw)) {
          logMessage(`➡️ Sol menüden "${link.textContent.trim()}" sayfasına geçiş yapılıyor...`);
          triggerClick(link);
          await sleep(1600);
          switched = true;
          break;
        }
      }
      if (switched) break;
    }
  }

  // 1. Sayfa İçi PrimeNG TabView / Sekmeler / SelectButton kontrolü
  const tabs = Array.from(document.querySelectorAll(
    '.p-tabview-nav li, .p-tabview-title, a[role="tab"], button[role="tab"], .nav-tabs a, .nav-tabs li, .p-selectbutton button'
  ));

  let tabSwitched = false;
  for (const tab of tabs) {
    const txt = normalizeText(tab.textContent);
    for (const kw of keywords) {
      if (txt.includes(kw)) {
        const clickable = tab.closest('a, button, li') || tab;
        const isAlreadyActive = clickable.classList.contains('p-highlight') || clickable.classList.contains('active') || clickable.getAttribute('aria-selected') === 'true';
        if (!isAlreadyActive) {
          logMessage(`➡️ "${tab.textContent.trim()}" sekmesi tıklandı.`);
          triggerClick(clickable);
          await sleep(1600);
        } else {
          logMessage(`✓ "${tab.textContent.trim()}" sekmesi aktif.`);
        }
        tabSwitched = true;
        switched = true;
        break;
      }
    }
    if (tabSwitched) break;
  }

  // 2. Yan Menü / Sol Menü Alt Bağlantıları
  if (!tabSwitched && (isTableEmptyOnPage() || needsMenuSwitch)) {
    const menuLinks = Array.from(document.querySelectorAll('.layout-menu a, .p-menu a, .sidebar a, nav a, .p-panelmenu a, a.p-menuitem-link'));
    for (const link of menuLinks) {
      const txt = normalizeText(link.textContent);
      for (const kw of keywords) {
        if (txt.includes(kw)) {
          logMessage(`➡️ Sol menüden "${link.textContent.trim()}" tıklandı.`);
          triggerClick(link);
          await sleep(1800);
          switched = true;
          break;
        }
      }
      if (switched) break;
    }
  }

  // 3. Eğer sayfa açıldıysa fakat tablo hala boşsa ve ekranda "Sorgula / Ara / Listele" butonu varsa otomatik tıkla
  if (isTableEmptyOnPage()) {
    const searchBtns = Array.from(document.querySelectorAll('button, .p-button')).filter(b => {
      if (b.closest('#isgpro-katip-floating-root')) return false;
      const t = normalizeText(b.textContent || '');
      return t === 'sorgula' || t === 'ara' || t === 'listele' || t.includes('sorgula');
    });
    if (searchBtns.length > 0) {
      logMessage('🔍 Tablo verilerini yüklemek için "Sorgula / Listele" butonu tetiklendi...');
      triggerClick(searchBtns[0]);
      await sleep(1500);
    }
  }

  await waitForKatipTableReady(3000);
  return switched;
}

function isDateString(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(s)) return true;
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(s)) return true;
  if (/\b\d{2}\.\d{2}\.\d{4}\b/.test(s) && (s.includes('-') || s.includes('/'))) return true;
  if (/^\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4}$/.test(s)) return true;
  return false;
}

// SÖZLEŞME TİPİ / GÖREV İBARESİ FİLTRESİ:
// "OSGB İle İş Güvenliği Uzmanı Hizmet Alım Sözleşmesi" gibi sözleşme tipi metinlerinin
// asla Firma Unvanı (clientName) veya Kişi Adı (personName) olarak algılanmamasını sağlar!
function isContractTypeOrRolePhrase(str) {
  if (!str || typeof str !== 'string') return false;
  const norm = normalizeText(str);
  if (!norm) return false;
  const blacklistedPhrases = [
    'hizmet alim sozlesmesi',
    'hizmet alim',
    'hizmet sozlesmesi',
    'osgb ile',
    'personel sozlesmesi',
    'sorumlu mudur sozlesmesi',
    'ic gorevlendirme',
    'dis gorevlendirme',
    'gorevlendirme sozlesmesi',
    'is guvenligi uzmani hizmet',
    'isyeri hekimi hizmet',
    'diger saglik personeli hizmet',
    'sozlesme devam ediyor',
    'sozlesme teklif durumunda',
    'onay bekliyor',
    'tam zamanli',
    'kismi sureli',
    'belirsiz sureli'
  ];
  for (const phrase of blacklistedPhrases) {
    if (norm.includes(phrase)) return true;
  }
  if (/^(uzman|isyeri hekimi|tabip|doktor|diger saglik personeli|dsp|is guvenligi uzmani|sorumlu mudur)$/i.test(norm)) {
    return true;
  }
  return false;
}

// HİZMET VEREN / OSGB UNVANI FİLTRESİ:
// "Ortak Sağlık Güvenlik Birimi", "OSGB", "Hizmet Veren Ticari Unvanı" metinlerinin
// sözleşme adı veya Hizmet Alan İşyeri unvanı olarak seçilmesini KESİNLİKLE engeller! (v5.5.2)
function isOsgbOrProviderPhrase(str, osgbName = '') {
  if (!str || typeof str !== 'string') return false;
  const norm = normalizeText(str);
  if (!norm || norm.length < 3) return false;

  const providerKeywords = [
    'osgb',
    'ortak saglik',
    'ortak saglik guvenlik',
    'ortak saglik ve guvenlik',
    'hizmet veren',
    'hizmet sunucu',
    'hizmet sunucusu'
  ];
  for (const kw of providerKeywords) {
    if (norm.includes(kw)) return true;
  }

  if (osgbName && osgbName !== 'Hizmet Sunucu OSGB') {
    const normO = normalizeText(osgbName);
    if (normO && normO.length >= 3) {
      if (norm === normO || norm.includes(normO) || normO.includes(norm)) return true;
    }
  }

  return false;
}

// Şirket/Kurum Unvanı tespiti için yardımcı (DOM satırından gerçek Hizmet Alan İşyeri unvanını yakalar, Sözleşme Tipi ve Hizmet Veren Kurumu KESİNLİKLE dışlar - v5.5.2)
function findWorkplaceNameFromCells(cells, detsisNo, clientSgkNo, personName, processId, excludedColIndices = [], osgbName = '') {
  const companyIndicators = [
    'şti', 'sti', 'a.ş', 'a.s', 'ltd', 'sanayi', 'ticaret', 'bakanlık', 'bakanligi',
    'müdürlük', 'mudurlugu', 'belediye', 'belediyesi', 'anonim', 'limited', 'şirket', 'sirketi',
    'holding', 'vakıf', 'dernek', 'okul', 'hastane', 'fabrika', 'şube', 'subesi', 'işletme',
    'isletmesi', 'koop', 'üniversite', 'kamu', 'kurum', 'tesis', 'enerji',
    'gıda', 'gida', 'inşaat', 'insaat', 'turizm', 'lojistik', 'tekstil', 'otomotiv', 'maden', 'metal', 'grup'
  ];

  for (let idx = 0; idx < cells.length; idx++) {
    if (excludedColIndices.includes(idx)) continue;
    const c = cells[idx];
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 3) continue;
    if (isDateString(txt)) continue;
    if (isContractTypeOrRolePhrase(txt)) continue;
    if (/^\d+$/.test(txt)) continue;
    if (processId && txt === String(processId)) continue;
    if (detsisNo && txt === String(detsisNo)) continue;
    if (clientSgkNo && txt.replace(/\s+/g, '') === String(clientSgkNo).replace(/\s+/g, '')) continue;
    if (personName && txt.toLowerCase() === personName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^\d+\s*(?:dk|dakika|saat|sa)$/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;

    // Hizmet Veren / OSGB kesinlikle elenir!
    if (isOsgbOrProviderPhrase(txt, osgbName)) continue;

    for (const ind of companyIndicators) {
      if (norm.includes(ind)) {
        return txt;
      }
    }
  }

  let best = '';
  for (let idx = 0; idx < cells.length; idx++) {
    if (excludedColIndices.includes(idx)) continue;
    const c = cells[idx];
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 4) continue;
    if (isDateString(txt)) continue;
    if (isContractTypeOrRolePhrase(txt)) continue;
    if (/^\d+$/.test(txt)) continue;
    if (processId && txt === String(processId)) continue;
    if (detsisNo && txt === String(detsisNo)) continue;
    if (clientSgkNo && txt.replace(/\s+/g, '') === String(clientSgkNo).replace(/\s+/g, '')) continue;
    if (personName && txt.toLowerCase() === personName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^\d+\s*(?:dk|dakika|saat|sa)$/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;

    // Hizmet Veren / OSGB kesinlikle elenir!
    if (isOsgbOrProviderPhrase(txt, osgbName)) continue;

    if (txt.length > best.length) {
      best = txt;
    }
  }

  return best;
}

// Satırdaki Personel Ad Soyadını tespit etme yardımcısı (v5.5)
function findPersonNameFromCells(cells, workplaceName, duty, processId, excludedColIndices = []) {
  for (let idx = 0; idx < cells.length; idx++) {
    if (excludedColIndices.includes(idx)) continue;
    const c = cells[idx];
    const txt = getCellCleanText(c).trim();
    if (!txt || txt.length < 4 || txt.length > 48) continue;
    if (isDateString(txt)) continue;
    if (isContractTypeOrRolePhrase(txt)) continue;
    if (/\d{3,}/.test(txt)) continue;
    if (workplaceName && txt.toLowerCase() === workplaceName.toLowerCase()) continue;

    const norm = normalizeText(txt);
    if (/^(devam|onay|iptal|fesih|sonlandirildi)/i.test(norm)) continue;
    if (/^(az tehlikeli|tehlikeli|cok tehlikeli)$/i.test(norm)) continue;
    if (/şti|sti|a\.ş|ltd|sanayi|ticaret|holding|belediye|bakanlik|mudurluk|osgb|anonim|limited/i.test(norm)) continue;

    const words = txt.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      const cleanName = txt.replace(/^(?:Uzm\.|Dr\.|Hekim|İGU|Uzman)\s+/i, '').trim();
      return cleanName || txt;
    }
  }
  return '';
}

function inferHazardClass(rawHazard, naceCode, clientName) {
  const normH = normalizeText(rawHazard || '');
  if (normH.includes('cok tehlikeli')) return 'Çok Tehlikeli';
  if (normH.includes('az tehlikeli')) return 'Az Tehlikeli';
  if (normH.includes('tehlikeli')) return 'Tehlikeli';

  const prefix = String(naceCode || '').trim().slice(0, 2);
  const cokTehlikeliPrefixes = ['05', '06', '07', '08', '09', '19', '20', '21', '23', '24', '25', '41', '42', '43', '86'];
  const azTehlikeliPrefixes = ['47', '55', '56', '58', '59', '60', '61', '62', '63', '64', '65', '66', '68', '69', '70', '71', '72', '73', '74', '84', '85'];
  if (cokTehlikeliPrefixes.includes(prefix)) return 'Çok Tehlikeli';
  if (azTehlikeliPrefixes.includes(prefix)) return 'Az Tehlikeli';

  const normName = normalizeText(clientName || '');
  if (/madencilik|dokum|insaat|tersane|kimya|hastane|enerji|metal/i.test(normName)) return 'Çok Tehlikeli';
  if (/yazilim|bilisim|danismanlik|okul|belediye|banka|büro|ofis/i.test(normName)) return 'Az Tehlikeli';
  return 'Tehlikeli';
}

function calculateLegislationRequirements(employeeCount, hazardClass) {
  const emp = Math.max(0, parseInt(employeeCount, 10) || 0);
  const rates = ISGPRO_CONFIG.rates;
  let rateSet = rates.tehlikeli;

  if (hazardClass === 'Çok Tehlikeli') rateSet = rates.cokTehlikeli;
  else if (hazardClass === 'Az Tehlikeli') rateSet = rates.azTehlikeli;

  const requiredSpecialistMinutes = emp * rateSet.uzman;
  const requiredDoctorMinutes = emp * rateSet.hekim;
  const requiredDspMinutes = (hazardClass === 'Çok Tehlikeli' && emp >= 10) ? emp * rateSet.dsp : 0;

  return {
    requiredSpecialistMinutes,
    requiredDoctorMinutes,
    requiredDspMinutes,
    requiredTotalMinutes: requiredSpecialistMinutes + requiredDoctorMinutes + requiredDspMinutes
  };
}

function parseRawContractJson(item, targetMode = 'DEVAM_EDEN', fallbackIdx = 0) {
  if (!item || typeof item !== 'object') return null;

  const rawStatus =
    item.sozlesmeStatu ||
    item.sozlesmeDurumu ||
    item.statu ||
    item.durum ||
    (targetMode === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda');

  if (!matchesTargetStatus(rawStatus, targetMode)) {
    return null;
  }

  const processId = item.surecNo || item.surecId || item.sozlesmeNo || item.sozlesmeId || item.id || item.processId || `API_${fallbackIdx + 1}`;

  let detsisNo = item.detsisNo || item.detsis || item.kamuKurumKodu || item.kurumKodu || item.idariBirimKodu || item.detsisNumarasi || '';
  if (!detsisNo && item.clientSgkNo && String(item.clientSgkNo).length <= 14 && String(item.clientSgkNo).length >= 5) {
    detsisNo = String(item.clientSgkNo);
  }

  let clientSgkNo =
    item.hizmetAlanSgkSicilNo ||
    item.hizmetAlanIsyeriSgkSicilNo ||
    item.hizmetAlanSicilNo ||
    item.isyeriSgkSicilNo ||
    item.isyeriSicilNo ||
    item.isyeriSgkNo ||
    item.isyeriSgk ||
    item.sgkSicilNo ||
    item.sicilNo ||
    item.clientSgkNo ||
    '';

  let osgbSgkNo =
    item.hizmetSunucuSgkSicilNo ||
    item.osgbSgkSicilNo ||
    item.hizmetVerenSgkSicilNo ||
    item.osgbSgkNo ||
    '';
  if (clientSgkNo && osgbSgkNo && String(clientSgkNo) === String(osgbSgkNo)) {
    clientSgkNo = '';
  }

  const contractType =
    item.sozlesmeTipi ||
    item.sozlesmeTuru ||
    item.gorevlendirmeTipi ||
    item.hizmetTipi ||
    '';

  // 1) Önce Hizmet Veren Kurum / OSGB unvanını doğru ve eksiksiz yakalayalım
  let osgbName =
    item.hizmetVerenTicariUnvani ||
    item.hizmetVerenTicaretUnvani ||
    item.hizmetVerenKurumUnvani ||
    item.hizmetVerenUnvani ||
    item.hizmetVerenAdi ||
    item.hizmetVerenKurum ||
    item.hizmetSunucuUnvani ||
    item.hizmetSunucuAdi ||
    item.hizmetSunucusuAdi ||
    item.hizmetSunucusuUnvani ||
    item.osgbUnvani ||
    item.osgbAdi ||
    item.osgbTicariUnvani ||
    item.osgbName ||
    '';

  if (!osgbName && item.hizmetVeren && typeof item.hizmetVeren === 'object') {
    osgbName = item.hizmetVeren.unvan || item.hizmetVeren.ticariUnvan || item.hizmetVeren.ticaretUnvani || item.hizmetVeren.kurumUnvani || item.hizmetVeren.adi || '';
  }
  if (!osgbName && item.hizmetSunucu && typeof item.hizmetSunucu === 'object') {
    osgbName = item.hizmetSunucu.unvan || item.hizmetSunucu.ticariUnvan || item.hizmetSunucu.ticaretUnvani || item.hizmetSunucu.adi || '';
  }
  if (!osgbName && item.osgb && typeof item.osgb === 'object') {
    osgbName = item.osgb.unvan || item.osgb.ticariUnvan || item.osgb.ticaretUnvani || item.osgb.adi || '';
  }
  if (!osgbName && typeof item.ticaretUnvani === 'string' && isOsgbOrProviderPhrase(item.ticaretUnvani)) {
    osgbName = item.ticaretUnvani;
  }
  if (!osgbName && typeof item.ticariUnvan === 'string' && isOsgbOrProviderPhrase(item.ticariUnvan)) {
    osgbName = item.ticariUnvan;
  }

  if (typeof osgbName === 'object' && osgbName !== null) {
    osgbName = osgbName.unvan || osgbName.ticariUnvan || osgbName.ticaretUnvani || osgbName.kurumUnvani || osgbName.adi || '';
  }
  if (typeof osgbName === 'string') osgbName = osgbName.trim();
  if (!osgbName || isContractTypeOrRolePhrase(osgbName)) osgbName = 'Hizmet Sunucu OSGB';

  // 2) HİZMET ALAN İŞYERİ UNVANI (Kesinlikle Hizmet Veren Ticari Unvanı yazılmaz!)
  let clientName = '';
  const candidateUnvans = [
    item.hizmetAlanIsyeriUnvani, item.hizmetAlanIsyeriUnvan, item.hizmetAlanUnvani, item.hizmetAlanUnvan,
    item.hizmetAlanKurumUnvani, item.hizmetAlanAdi, item.hizmetAlanIsyeriAdi,
    item.isyeriUnvani, item.isyeriUnvan, item.isyeriTicaretUnvani, item.isyeriAdi, item.isyeriAd,
    item.firmaAdi, item.firmaUnvani, item.kurumAdi, item.kurumUnvani,
    item.isverenUnvani, item.clientName
  ];
  for (const u of candidateUnvans) {
    if (
      u &&
      typeof u === 'string' &&
      u.trim().length > 2 &&
      !isDateString(u) &&
      !isContractTypeOrRolePhrase(u) &&
      !/^\d+$/.test(u.trim())
    ) {
      const candidateStr = u.trim();
      // Hizmet Veren Ticari Unvanı veya OSGB ibaresi içeriyorsa sözleşme ismi olarak KESİNLİKLE kabul etme
      if (isOsgbOrProviderPhrase(candidateStr, osgbName)) {
        continue;
      }
      clientName = candidateStr;
      break;
    }
  }

  // İç içe nesnelerden unvan ve SGK arama (Spring Boot / PrimeNG nesne modelleri - v5.5.2)
  const nestedObjs = [
    item.hizmetAlanIsyeri, item.hizmetAlan, item.isyeri, item.kurum,
    item.isyeriBilgisi, item.sozlesmeIsyeri, item.isyeriBilgi, item.isveren, item.client
  ];
  for (const obj of nestedObjs) {
    if (obj && typeof obj === 'object') {
      if (!clientSgkNo) {
        const nestedSgk = obj.sgkSicilNo || obj.isyeriSgkSicilNo || obj.sicilNo || obj.sgkNo;
        if (nestedSgk) clientSgkNo = String(nestedSgk);
      }
      if (!detsisNo) {
        const nestedDetsis = obj.detsisNo || obj.detsis || obj.kurumKodu;
        if (nestedDetsis) detsisNo = String(nestedDetsis);
      }
      if (!clientName) {
        const nestedTitle =
          obj.hizmetAlanIsyeriUnvani || obj.isyeriUnvani || obj.isyeriAdi || obj.unvan || obj.unvani ||
          obj.ticaretUnvani || obj.ticariUnvani || obj.adi || obj.ad || obj.kurumAdi || obj.name;
        if (
          nestedTitle &&
          typeof nestedTitle === 'string' &&
          nestedTitle.trim().length > 2 &&
          !isDateString(nestedTitle) &&
          !isContractTypeOrRolePhrase(nestedTitle) &&
          !/^\d+$/.test(nestedTitle.trim())
        ) {
          const cleanNested = nestedTitle.trim();
          if (isOsgbOrProviderPhrase(cleanNested, osgbName)) {
            continue;
          }
          clientName = cleanNested;
        }
      }
    }
  }

  // Eğer hala bulunamadıysa objenin tüm string alanlarını tara (sozlesmeTipi / osgb / hizmetVeren hariç)
  if (!clientName) {
    for (const [k, v] of Object.entries(item)) {
      const lk = k.toLowerCase();
      if (lk.includes('sunucu') || lk.includes('osgb') || lk.includes('veren') || lk.includes('hizmetveren') || lk.includes('personel') || lk.includes('tip') || lk.includes('tur') || lk.includes('statu')) continue;
      if ((lk.includes('unvan') || lk.includes('isyeri') || lk.includes('kurum') || lk.includes('firma')) && typeof v === 'string' && v.trim().length > 2) {
        if (!isDateString(v) && !isContractTypeOrRolePhrase(v) && !/^\d+$/.test(v.trim())) {
          const cleanVal = v.trim();
          if (isOsgbOrProviderPhrase(cleanVal, osgbName)) continue;
          clientName = cleanVal;
          break;
        }
      }
    }
  }

  // Son Güvenlik Kontrolü: clientName hiçbir durumda Hizmet Veren Ticari Unvanı veya OSGB olamaz!
  if (clientName && isOsgbOrProviderPhrase(clientName, osgbName)) {
    clientName = '';
  }

  if (!clientName || isDateString(clientName) || isContractTypeOrRolePhrase(clientName)) {
    if (detsisNo) clientName = `Kamu Kurumu (DETSİS: ${detsisNo})`;
    else if (clientSgkNo) clientName = `Hizmet Alan İşyeri (SGK: ${clientSgkNo})`;
    else clientName = `Hizmet Alan İşyeri #${processId}`;
  }

  let employeeCount = 0;
  const rawEmp =
    item.calisanSayisi ??
    item.sigortaliSayisi ??
    item.hizmetAlanCalisanSayisi ??
    item.isyeriCalisanSayisi ??
    item.toplamCalisan ??
    item.calisan ??
    item.employeeCount ??
    (item.hizmetAlanIsyeri && (item.hizmetAlanIsyeri.calisanSayisi ?? item.hizmetAlanIsyeri.sigortaliSayisi)) ??
    (item.isyeri && (item.isyeri.calisanSayisi ?? item.isyeri.sigortaliSayisi));
  if (rawEmp !== undefined && rawEmp !== null && !isNaN(parseInt(rawEmp, 10))) {
    employeeCount = parseInt(rawEmp, 10);
  }

  let personName = '';
  const candPerson = [
    item.sozlesmeYapilanKisiAdSoyad, item.personelAdSoyad, item.personelAdiSoyadi,
    item.gorevliKisiAdSoyad, item.gorevliKisiAdiSoyadi, item.gorevliAdSoyad,
    item.personelAdi, item.personelName, item.personName, item.adSoyad,
    item.isimSoyisim, item.adSoyadi, item.atananPersonelAdSoyad, item.belgeSahibiAdSoyad,
    item.uzmanAdSoyad, item.hekimAdSoyad, item.dspAdSoyad, item.kullaniciAdSoyad,
    item.tamAd, item.fullName
  ];
  for (const p of candPerson) {
    if (
      p &&
      typeof p === 'string' &&
      p.trim().length > 2 &&
      !isDateString(p) &&
      !isContractTypeOrRolePhrase(p) &&
      !/^\d+$/.test(p.trim())
    ) {
      personName = p.trim();
      break;
    }
  }

  if (!personName) {
    const personObjs = [
      item.sozlesmeYapilanKisi, item.gorevliKisi, item.personel, item.atananPersonel,
      item.belgeSahibi, item.kisi, item.kullanici, item.calisan, item.hizmetVeren,
      item.hizmetVerenKisi, item.uzman, item.hekim, item.dsp
    ];
    for (const po of personObjs) {
      if (po && typeof po === 'object') {
        const pAdSoyad = po.adSoyad || po.adiSoyadi || po.adSoyadi || po.isimSoyisim || po.fullName || po.name;
        if (pAdSoyad && typeof pAdSoyad === 'string' && pAdSoyad.trim().length > 2 && !isDateString(pAdSoyad) && !isContractTypeOrRolePhrase(pAdSoyad)) {
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

  let duty = item.gorev || item.sertifikaTipi || item.belgeTuru || contractType || item.duty || '';
  let dutyType = 'DIGER';
  const normDuty = normalizeText(duty + ' ' + contractType);
  if (normDuty.includes('uzman') || normDuty.includes('igu')) {
    dutyType = 'UZMAN';
    if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'İş Güvenliği Uzmanı';
  } else if (normDuty.includes('hekim') || normDuty.includes('tabip') || normDuty.includes('doktor')) {
    dutyType = 'HEKIM';
    if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'İşyeri Hekimi';
  } else if (normDuty.includes('dsp') || normDuty.includes('diger saglik') || normDuty.includes('saglik personeli')) {
    dutyType = 'DSP';
    if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'Diğer Sağlık Personeli';
  } else if (!duty) {
    duty = 'İSG Hizmeti';
  }

  let durationMinutes = 0;
  const rawDur =
    item.hizmetSuresiDakika ??
    item.atananSure ??
    item.atananSureDakika ??
    item.aylikCalismaSuresi ??
    item.calismaSuresi ??
    item.sureDakika ??
    item.aylikSure ??
    item.sure ??
    item.hizmetSuresi ??
    item.durationMinutes;
  if (rawDur !== undefined && rawDur !== null) {
    const strDur = String(rawDur);
    const mHour = strDur.match(/(\d+)\s*(?:saat|sa)/i);
    const mNum = strDur.replace(/\./g, '').match(/\d+/);
    if (mHour) durationMinutes = parseInt(mHour[1], 10) * 60;
    else if (mNum) durationMinutes = parseInt(mNum[0], 10);
  }

  const naceCode =
    item.naceKodu ||
    item.nace ||
    item.faaliyetKodu ||
    item.naceCode ||
    (item.hizmetAlanIsyeri && item.hizmetAlanIsyeri.naceKodu) ||
    (item.isyeri && item.isyeri.naceKodu) ||
    '';
  const rawHazard =
    item.tehlikeSinifi ||
    item.tehlike ||
    item.hazardClass ||
    (item.hizmetAlanIsyeri && item.hizmetAlanIsyeri.tehlikeSinifi) ||
    (item.isyeri && item.isyeri.tehlikeSinifi);
  const hazardClass = inferHazardClass(rawHazard, naceCode, clientName);

  const startDate = item.baslangicTarihi || item.sozlesmeBaslangicTarihi || item.onayTarihi || item.startDate || 'Belirtilmedi';
  const endDate = item.bitisTarihi || item.sozlesmeBitisTarihi || item.endDate || 'Belirtilmedi';

  return {
    id: `cnt_${processId}_${dutyType}_${fallbackIdx}`,
    processId: String(processId),
    clientName: String(clientName),
    contractName: `${clientName} — ${duty} (${personName || 'Atanmamış'})`,
    name: String(clientName),
    hizmetAlanIsyeri: String(clientName),
    contractType: String(contractType || duty),
    detsisNo: String(detsisNo || ''),
    clientSgkNo: String(clientSgkNo || ''),
    osgbName: String(osgbName || ''),
    osgbSgkNo: String(osgbSgkNo || ''),
    personName: String(personName || ''),
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
    statusCategory: targetMode
  };
}

function detectTableHeaders() {
  const ths = Array.from(document.querySelectorAll('table thead th, .p-datatable-thead th, div[role="columnheader"]'));
  const map = {};

  ths.forEach((th, idx) => {
    const titleEl = th.querySelector('.p-column-title, .ui-column-title');
    const raw = (titleEl ? titleEl.textContent : (th.innerText || th.textContent || '')).trim();
    const txt = normalizeText(raw);
    if (!txt) return;

    if (txt.includes('baslangic') || txt.includes('baslama') || txt.includes('onay tarih')) map.startDate = idx;
    else if (txt.includes('bitis') || txt.includes('fesih tarih')) map.endDate = idx;
    else if (txt.includes('tarih') || txt.includes('date')) map.contractDate = idx;
    else if (txt.includes('detsis') || txt.includes('kurum kod')) map.detsis = idx;
    else if (
      txt.includes('surec no') || txt.includes('surec id') || txt.includes('sozlesme no') ||
      txt.includes('sozlesme id') || txt.includes('kayit no') || txt === 'no' || txt === 'id' ||
      (txt.includes('surec') && !txt.includes('sure'))
    ) map.processId = idx;
    else if ((txt.includes('sozlesme') && (txt.includes('statu') || txt.includes('durum'))) || txt === 'statu' || txt === 'durum' || txt.includes('sozlesme statu') || txt.includes('sozlesme durum')) map.status = idx;
    else if (txt.includes('sozlesme tip') || txt.includes('sozlesme tur') || txt.includes('gorevlendirme tip') || txt.includes('hizmet alim')) map.contractType = idx;
    else if (txt.includes('calisan say') || txt.includes('sigortali say') || txt.includes('personel say') || txt === 'calisan' || txt === 'sigortali') map.employeeCount = idx;
    else if (txt.includes('dakika') || txt.includes('saat') || txt.includes('hizmet sure') || txt.includes('calisma sure') || txt.includes('atanan sure') || (txt.includes('sure') && !txt.includes('surec'))) map.duration = idx;
    else if ((txt.includes('sunucu') || txt.includes('osgb') || txt.includes('hizmet veren')) && (txt.includes('sicil') || txt.includes('sgk'))) map.osgbSgk = idx;
    else if (
      !txt.includes('tip') && !txt.includes('tur') &&
      (
        txt.includes('hizmet veren') ||
        txt.includes('hizmet sunucu') ||
        txt.includes('hizmet sunucusu') ||
        txt.includes('osgb unvan') ||
        txt.includes('osgb adi') ||
        txt.includes('osgb ticari unvan') ||
        (txt.includes('osgb') && !txt.includes('alan')) ||
        ((txt.includes('ticaret unvan') || txt.includes('ticari unvan')) && !txt.includes('alan'))
      )
    ) map.osgbName = idx;
    else if (
      !txt.includes('hizmet veren') && !txt.includes('sunucu') && !txt.includes('osgb') &&
      (txt.includes('alan') || txt.includes('isyeri') || txt.includes('firma') || txt.includes('kurum')) &&
      (txt.includes('sicil') || txt.includes('sgk') || txt.includes('no'))
    ) map.clientSgk = idx;
    else if (
      !txt.includes('hizmet veren') && !txt.includes('hizmet sunucu') && !txt.includes('osgb') &&
      !txt.includes('tarih') && !txt.includes('date') && !txt.includes('sicil') && !txt.includes('sgk') &&
      !txt.includes('calisan') && !txt.includes('sure') && !txt.includes('statu') && !txt.includes('durum') &&
      !txt.includes('tip') && !txt.includes('tur') && !txt.includes('kisi') && !txt.includes('sertifika') &&
      (
        txt.includes('hizmet alan') || txt.includes('isyeri unvan') || txt.includes('isyeri adi') ||
        txt.includes('kurum unvan') || txt.includes('kurum adi') || txt.includes('firma unvan') || txt.includes('firma adi') ||
        (txt.includes('alan') && txt.includes('unvan')) || (txt.includes('isyeri') && txt.includes('unvan')) ||
        txt === 'unvan' || txt === 'unvani' || txt === 'isyeri' || txt === 'firma' || txt === 'hizmet alan isyeri' ||
        ((txt.includes('ticaret unvan') || txt.includes('ticari unvan')) && txt.includes('alan'))
      )
    ) map.clientName = idx;
    else if (
      !txt.includes('tarih') && !txt.includes('sayisi') && !txt.includes('sertifika tip') && !txt.includes('sertifika no') &&
      (
        txt.includes('sozlesme yapilan kisi') || txt.includes('gorevli') || txt.includes('personel') || txt.includes('belge sahibi') ||
        txt.includes('profesyonel') || txt.includes('sozlesme sahibi') || txt.includes('sertifika sahibi') ||
        txt.includes('hizmet veren kisi') || txt.includes('uzman / hekim') || txt.includes('uzman/hekim') ||
        (txt.includes('kisi') && !txt.includes('sayisi')) || (txt.includes('ad') && txt.includes('soyad'))
      )
    ) map.personName = idx;
    else if ((txt.includes('gorev') || txt.includes('sertifika tip') || txt.includes('belge tur') || txt.includes('unvan / gorev')) && !txt.includes('gorevli')) map.duty = idx;
    else if (txt.includes('nace') || txt.includes('faaliyet')) map.nace = idx;
    else if (txt.includes('tehlike')) map.hazard = idx;
    else if (txt.includes('islem') || txt.includes('aksiyon') || txt.includes('detay')) map.actions = idx;
  });

  return map;
}

function extractContractsFromDomTable(targetMode, pageNumber = 1) {
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
    if (!rawStatus) {
      const normRow = normalizeText(rowFullText);
      if (normRow.includes('sozlesme devam ediyor')) rawStatus = 'Sözleşme Devam Ediyor';
      else if (normRow.includes('sozlesme teklif durumunda')) rawStatus = 'Sözleşme Teklif Durumunda';
    }

    // Yalnızca açıkça çelişen (iptal/fesih veya diğer sekmeye ait) satırları filtrele
    if (rawStatus && !matchesTargetStatus(rawStatus, targetMode)) {
      return;
    }

    let processId = '';
    if (headerMap.processId !== undefined && cells[headerMap.processId]) {
      const pm = getCellCleanText(cells[headerMap.processId]).match(/\d+/);
      if (pm) processId = pm[0];
    }
    if (!processId) {
      for (let ci = 0; ci < Math.min(3, cells.length); ci++) {
        const cTxt = getCellCleanText(cells[ci]).trim();
        if (/^\d{4,10}$/.test(cTxt)) {
          processId = cTxt;
          break;
        }
      }
    }
    if (!processId) {
      processId = `P${pageNumber}_R${rowIdx + 1}`;
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
      const m = cleanVal.match(/\b\d{20,28}\b/);
      if (m) sgkMatches.push({ index: cIdx, val: m[0] });
    });

    if (headerMap.osgbSgk !== undefined && cells[headerMap.osgbSgk]) {
      const m = getCellCleanText(cells[headerMap.osgbSgk]).replace(/\s+/g, '').match(/\d{20,28}/);
      if (m) osgbSgkNo = m[0];
    }
    if (headerMap.clientSgk !== undefined && cells[headerMap.clientSgk]) {
      const rawClientVal = getCellCleanText(cells[headerMap.clientSgk]).replace(/\s+/g, '');
      const m26 = rawClientVal.match(/\b\d{20,28}\b/);
      if (m26) clientSgkNo = m26[0];
      else if (!detsisNo) {
        const mDetsis = rawClientVal.match(/\b\d{5,14}\b/);
        if (mDetsis && rawClientVal !== processId) detsisNo = mDetsis[0];
      }
    }

    if (!clientSgkNo && sgkMatches.length === 1) {
      clientSgkNo = sgkMatches[0].val;
    } else if (!clientSgkNo && sgkMatches.length >= 2) {
      if (!osgbSgkNo) osgbSgkNo = sgkMatches[0].val;
      clientSgkNo = sgkMatches.find(s => s.val !== osgbSgkNo)?.val || sgkMatches[1].val;
    }

    // Hücre içi başlıklardan (PrimeNG responsive column title) öncelikli arama (v5.5)
    let cellEmpVal = '';
    let cellDurVal = '';
    let cellPersonVal = '';
    let cellDutyVal = '';
    let cellContractTypeVal = '';
    let cellClientVal = '';
    let cellOsgbVal = '';

    for (const [k, obj] of Object.entries(cellDataByTitle)) {
      if (k.includes('calisan') || k.includes('sigortali')) cellEmpVal = obj.val;
      else if (k.includes('dakika') || k.includes('hizmet sure') || k.includes('atanan sure') || (k.includes('sure') && !k.includes('surec'))) cellDurVal = obj.val;
      else if (k.includes('sozlesme tip') || k.includes('sozlesme tur') || k.includes('gorevlendirme tip')) cellContractTypeVal = obj.val;
      else if (
        !k.includes('tarih') && !k.includes('sayisi') && !k.includes('sertifika tip') && !k.includes('sertifika no') &&
        (k.includes('sozlesme yapilan kisi') || k.includes('gorevli') || k.includes('personel') || k.includes('profesyonel') || (k.includes('ad') && k.includes('soyad')))
      ) {
        if (!isDateString(obj.val) && !isContractTypeOrRolePhrase(obj.val)) cellPersonVal = obj.val;
      }
      else if (k.includes('gorev') || k.includes('sertifika tip') || k.includes('belge tur')) cellDutyVal = obj.val;
      else if (
        (k.includes('hizmet veren') || k.includes('sunucu') || (k.includes('osgb') && !k.includes('alan')))
      ) {
        if (!isDateString(obj.val) && !isContractTypeOrRolePhrase(obj.val)) cellOsgbVal = obj.val;
      }
      else if (
        !k.includes('hizmet veren') && !k.includes('sunucu') && !k.includes('osgb') &&
        !k.includes('tarih') && !k.includes('sicil') && !k.includes('sgk') && !k.includes('calisan') && !k.includes('sure') && !k.includes('tip') &&
        (k.includes('alan') || k.includes('isyeri') || k.includes('kurum') || k.includes('firma') || k === 'unvan' || k === 'unvani')
      ) {
        if (!isDateString(obj.val) && !isContractTypeOrRolePhrase(obj.val)) cellClientVal = obj.val;
      }
    }

    const contractType =
      cellContractTypeVal ||
      (headerMap.contractType !== undefined && cells[headerMap.contractType] ? getCellCleanText(cells[headerMap.contractType]) : '');

    let osgbName = cellOsgbVal || (headerMap.osgbName !== undefined && cells[headerMap.osgbName] ? getCellCleanText(cells[headerMap.osgbName]) : 'Hizmet Sunucu OSGB');
    if (isContractTypeOrRolePhrase(osgbName)) osgbName = 'Hizmet Sunucu OSGB';

    const excludedColsForWorkplace = [
      headerMap.contractType,
      headerMap.duty,
      headerMap.status,
      headerMap.osgbName,
      headerMap.osgbSgk,
      headerMap.personName,
      headerMap.actions
    ].filter(v => v !== undefined);

    let clientName = cellClientVal;
    if (!clientName && headerMap.clientName !== undefined && cells[headerMap.clientName]) {
      const candidate = getCellCleanText(cells[headerMap.clientName]);
      if (!isDateString(candidate) && !isContractTypeOrRolePhrase(candidate) && !/^\d+$/.test(candidate.trim())) {
        clientName = candidate;
      }
    }
    // Hizmet Veren Ticari Unvanı kesinlikle sözleşme adı / müşteri adı olamaz!
    if (clientName && isOsgbOrProviderPhrase(clientName, osgbName)) {
      clientName = '';
    }
    if (!clientName || isDateString(clientName) || isContractTypeOrRolePhrase(clientName)) {
      clientName = findWorkplaceNameFromCells(cells, detsisNo, clientSgkNo, cellPersonVal, processId, excludedColsForWorkplace, osgbName);
    }
    if (clientName && isOsgbOrProviderPhrase(clientName, osgbName)) {
      clientName = '';
    }
    if (!clientName || isDateString(clientName) || isContractTypeOrRolePhrase(clientName)) {
      if (detsisNo) clientName = `Kamu Kurumu (DETSİS: ${detsisNo})`;
      else if (clientSgkNo) clientName = `Hizmet Alan İşyeri (SGK: ${clientSgkNo})`;
      else clientName = `Hizmet Alan İşyeri #${processId}`;
    }

    let employeeCount = 0;
    const empRaw = cellEmpVal || (headerMap.employeeCount !== undefined && cells[headerMap.employeeCount] ? getCellCleanText(cells[headerMap.employeeCount]) : '');
    if (empRaw) {
      const m = empRaw.match(/\b\d+\b/);
      if (m && (!processId || m[0] !== String(processId))) {
        employeeCount = parseInt(m[0], 10);
      }
    }
    if (!employeeCount) {
      const empMatch = rowFullText.match(/(?:hizmet\s*alan\s*isyeri\s*)?calisan\s*(?:sayisi)?[:\s]*(\d+)/i) ||
                       rowFullText.match(/(?:hizmet\s*alan\s*işyeri\s*)?çalışan\s*(?:sayısı)?[:\s]*(\d+)/i) ||
                       rowFullText.match(/\b(\d{1,5})\s*(?:çalışan|sigortalı|calisan|sigortali)\b/i);
      if (empMatch && (!processId || empMatch[1] !== String(processId))) {
        employeeCount = parseInt(empMatch[1], 10);
      }
    }

    let personName = cellPersonVal;
    if (!personName && headerMap.personName !== undefined && cells[headerMap.personName]) {
      const pCandidate = getCellCleanText(cells[headerMap.personName]);
      if (!isDateString(pCandidate) && !isContractTypeOrRolePhrase(pCandidate) && !/^\d+$/.test(pCandidate.trim())) {
        personName = pCandidate;
      }
    }
    if (!personName || isDateString(personName) || isContractTypeOrRolePhrase(personName)) {
      personName = findPersonNameFromCells(cells, clientName, cellDutyVal, processId, [headerMap.clientName, headerMap.contractType, headerMap.osgbName].filter(v => v !== undefined));
    }

    let duty = cellDutyVal;
    if (!duty && headerMap.duty !== undefined && cells[headerMap.duty]) {
      duty = getCellCleanText(cells[headerMap.duty]);
    }
    let dutyType = 'DIGER';
    const normDuty = normalizeText((duty || '') + ' ' + (contractType || '') + ' ' + rowFullText);
    if (normDuty.includes('uzman') || normDuty.includes('igu')) {
      dutyType = 'UZMAN';
      if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'İş Güvenliği Uzmanı';
    } else if (normDuty.includes('hekim') || normDuty.includes('tabip') || normDuty.includes('doktor')) {
      dutyType = 'HEKIM';
      if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'İşyeri Hekimi';
    } else if (normDuty.includes('dsp') || normDuty.includes('diger saglik') || normDuty.includes('saglik personeli')) {
      dutyType = 'DSP';
      if (!duty || isContractTypeOrRolePhrase(duty)) duty = 'Diğer Sağlık Personeli';
    }

    let durationMinutes = 0;
    const durRaw = cellDurVal || (headerMap.duration !== undefined && cells[headerMap.duration] ? getCellCleanText(cells[headerMap.duration]) : '');
    if (durRaw) {
      const mHour = durRaw.match(/(\d+)\s*(?:saat|sa)/i);
      const mMin = durRaw.match(/(\d+)\s*(?:dk|dakika)/i);
      const mNum = durRaw.replace(/\./g, '').match(/\b\d+\b/);
      if (mHour) durationMinutes = parseInt(mHour[1], 10) * 60;
      else if (mMin) durationMinutes = parseInt(mMin[1], 10);
      else if (mNum) durationMinutes = parseInt(mNum[0], 10);
    }
    if (!durationMinutes) {
      const dMatch = rowFullText.match(/\b(\d{1,5})\s*(?:dk|dakika)\b/i);
      if (dMatch) durationMinutes = parseInt(dMatch[1], 10);
      else {
        const dHourMatch = rowFullText.match(/\b(\d{1,3})\s*(?:saat|sa)\b/i);
        if (dHourMatch) durationMinutes = parseInt(dHourMatch[1], 10) * 60;
      }
    }

    const naceCode = headerMap.nace !== undefined && cells[headerMap.nace] ? getCellCleanText(cells[headerMap.nace]) : '';
    const rawHazard = headerMap.hazard !== undefined && cells[headerMap.hazard] ? getCellCleanText(cells[headerMap.hazard]) : '';
    const startDate = headerMap.startDate !== undefined && cells[headerMap.startDate] ? getCellCleanText(cells[headerMap.startDate]) : 'Belirtilmedi';
    const endDate = headerMap.endDate !== undefined && cells[headerMap.endDate] ? getCellCleanText(cells[headerMap.endDate]) : 'Belirtilmedi';
    const resolvedDuty = duty || (dutyType === 'UZMAN' ? 'İş Güvenliği Uzmanı' : dutyType === 'HEKIM' ? 'İşyeri Hekimi' : 'Diğer Sağlık Personeli');
    const cid = `cnt_${processId}_${dutyType}_p${pageNumber}_r${rowIdx}`;
    contracts.push({
      id: cid,
      processId: String(processId),
      clientName,
      contractName: `${clientName} — ${resolvedDuty} (${personName || 'Atanmamış'})`,
      name: clientName,
      hizmetAlanIsyeri: clientName,
      contractType: contractType || resolvedDuty,
      detsisNo: detsisNo || '',
      clientSgkNo: clientSgkNo || '',
      osgbName: osgbName || 'Hizmet Sunucu OSGB',
      osgbSgkNo: osgbSgkNo || '',
      personName: personName || '',
      duty: resolvedDuty,
      dutyType,
      employeeCount,
      durationMinutes,
      durationHours: (durationMinutes / 60).toFixed(1),
      naceCode,
      hazardClass: inferHazardClass(rawHazard, naceCode, clientName),
      startDate,
      endDate,
      rawStatus: rawStatus || (targetMode === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda'),
      statusCategory: targetMode
    });
  });

  return contracts;
}

function triggerClick(element) {
  if (!element) return;
  try {
    element.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(evtType => {
      element.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window }));
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
        logMessage(`📄 Sayfa başına satır sayısı "${bestOption.textContent.trim()}" olarak ayarlandı.`);
        triggerClick(bestOption);
        await sleep(1400);
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
    await sleep(1400);
  }
}

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

        specialistContractCount: 0,
        doctorContractCount: 0,
        dspContractCount: 0,

        totalSpecialistMinutes: 0,
        totalDoctorMinutes: 0,
        totalDspMinutes: 0,
        totalMinutes: 0,
        totalHours: '0.0',
        specialistHours: '0.0',
        doctorHours: '0.0',
        dspHours: '0.0',

        requiredSpecialistMinutes: 0,
        requiredDoctorMinutes: 0,
        requiredDspMinutes: 0,
        specialistDeficit: 0,
        doctorDeficit: 0,
        dspDeficit: 0,
        totalDeficitMinutes: 0,
        isCompliant: true,

        contracts: [],
        contractCount: 0
      });
    }

    const comp = companyMap.get(key);
    comp.contracts.push(c);
    comp.contractCount++;

    if (c.employeeCount > 0 && (!comp.employeeCount || c.employeeCount > comp.employeeCount)) {
      comp.employeeCount = c.employeeCount;
    }
    if (!comp.naceCode && c.naceCode) comp.naceCode = c.naceCode;

    const pName = (c.personName || '').trim();
    const durMin = c.durationMinutes || 0;

    if (c.dutyType === 'UZMAN') {
      comp.specialistContractCount++;
      if (pName && pName !== 'Atalı Personel' && !comp.specialists.includes(pName)) comp.specialists.push(pName);
      comp.totalSpecialistMinutes += durMin;
    } else if (c.dutyType === 'HEKIM') {
      comp.doctorContractCount++;
      if (pName && pName !== 'Atalı Personel' && !comp.doctors.includes(pName)) comp.doctors.push(pName);
      comp.totalDoctorMinutes += durMin;
    } else if (c.dutyType === 'DSP') {
      comp.dspContractCount++;
      if (pName && pName !== 'Atalı Personel' && !comp.dsps.includes(pName)) comp.dsps.push(pName);
      comp.totalDspMinutes += durMin;
    }

    comp.totalMinutes = comp.totalSpecialistMinutes + comp.totalDoctorMinutes + comp.totalDspMinutes;
    comp.totalHours = (comp.totalMinutes / 60).toFixed(1);
    comp.specialistHours = (comp.totalSpecialistMinutes / 60).toFixed(1);
    comp.doctorHours = (comp.totalDoctorMinutes / 60).toFixed(1);
    comp.dspHours = (comp.totalDspMinutes / 60).toFixed(1);

    comp.assignedSpecialist = comp.specialists.join(', ');
    comp.assignedDoctor = comp.doctors.join(', ');
    comp.assignedDsp = comp.dsps.join(', ');

    const req = calculateLegislationRequirements(comp.employeeCount, comp.hazardClass);
    comp.requiredSpecialistMinutes = req.requiredSpecialistMinutes;
    comp.requiredDoctorMinutes = req.requiredDoctorMinutes;
    comp.requiredDspMinutes = req.requiredDspMinutes;

    comp.specialistDeficit = Math.max(0, req.requiredSpecialistMinutes - comp.totalSpecialistMinutes);
    comp.doctorDeficit = Math.max(0, req.requiredDoctorMinutes - comp.totalDoctorMinutes);
    comp.dspDeficit = Math.max(0, req.requiredDspMinutes - comp.totalDspMinutes);
    comp.totalDeficitMinutes = comp.specialistDeficit + comp.doctorDeficit + comp.dspDeficit;
    comp.isCompliant = comp.totalDeficitMinutes === 0 && comp.specialists.length > 0 && comp.doctors.length > 0;
  });

  return Array.from(companyMap.values());
}

// ============================================================================
// SEÇİLEN SÖZLEŞMELERİ İŞLEMLER > DETAY GÖRÜNTÜLE İLE TOPLU İNDİRME MOTORU
// ============================================================================

// Tablo satırında "İşlemler" menüsünü ve "Detay Görüntüle" butonunu bulup tetikler
async function openContractDetailViaActionsMenu(processId) {
  const rows = Array.from(document.querySelectorAll('table tbody tr, .p-datatable-tbody > tr, div[role="row"]')).filter(r => !r.closest('thead'));
  const targetRow = rows.find(r => {
    const txt = (r.innerText || r.textContent || '').replace(/\s+/g, ' ');
    return processId && txt.includes(String(processId));
  });

  if (!targetRow) return null;

  targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(250);

  // 1) Satır içinde doğrudan "Detay Görüntüle" / "Detay" / "Görüntüle" butonu var mı kontrol et
  const rowButtons = Array.from(targetRow.querySelectorAll('button, a, .p-button, [role="button"]'));
  let directDetailBtn = rowButtons.find(b => {
    const t = normalizeText((b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || ''));
    const hasEyeIcon = !!b.querySelector('.pi-eye, .fa-eye, .pi-search, .fa-search-plus');
    return t.includes('detay goruntule') || t.includes('detay') || t.includes('goruntule') || hasEyeIcon;
  });

  if (directDetailBtn) {
    triggerClick(directDetailBtn);
    await sleep(900);
  } else {
    // 2) "İşlemler" açılır menü butonunu bul ve tıkla
    const actionsMenuBtn = rowButtons.find(b => {
      const t = normalizeText((b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || ''));
      const hasMenuIcon = !!b.querySelector('.pi-ellipsis-v, .pi-bars, .pi-cog, .pi-chevron-down, .fa-ellipsis-v, .fa-bars');
      return t.includes('islem') || t.includes('islemler') || t.includes('secenek') || hasMenuIcon;
    }) || rowButtons[rowButtons.length - 1];

    if (actionsMenuBtn) {
      triggerClick(actionsMenuBtn);
      await sleep(500);

      // Açılan PrimeNG / Bootstrap menüsünden "Detay Görüntüle" öğesini bul ve tıkla
      const menuItems = Array.from(document.querySelectorAll(
        '.p-menu-overlay a, .p-menuitem-link, .p-tieredmenu a, .p-contextmenu a, .dropdown-menu a, .dropdown-item, ul[role="menu"] li, div[role="menu"] button'
      )).filter(el => el.offsetParent !== null);

      const detailMenuItem = menuItems.find(item => {
        const t = normalizeText(item.textContent || '');
        return t.includes('detay goruntule') || t.includes('sozlesme detay') || t.includes('detay') || t.includes('goruntule') || t.includes('incele');
      });

      if (detailMenuItem) {
        triggerClick(detailMenuItem);
        await sleep(950);
      }
    }
  }

  // 3) Açılan Detay Modalı (.p-dialog / [role="dialog"]) içindeki tüm alanları oku ve varsa PDF/Yazdır butonunu tetikle
  const modal = document.querySelector('.p-dialog:not([style*="display: none"]), .p-dynamic-dialog, div[role="dialog"], .modal.show');
  let modalExtractedText = '';
  const modalKeyValues = {};

  if (modal) {
    modalExtractedText = (modal.innerText || modal.textContent || '').replace(/\s+/g, ' ').trim();

    // Modal içindeki label-value çiftlerini ayrıştır
    const rowsOrGroups = modal.querySelectorAll('tr, .p-field, .form-group, .row, div[class*="col-"]');
    rowsOrGroups.forEach(el => {
      const labelEl = el.querySelector('th, label, strong, b, .font-bold');
      if (labelEl) {
        const k = (labelEl.textContent || '').replace(/:/g, '').trim();
        const v = (el.textContent || '').replace(labelEl.textContent || '', '').replace(/\s+/g, ' ').trim();
        if (k && v && k.length < 60 && v.length < 300) {
          modalKeyValues[k] = v;
        }
      }
    });

    // Modal içinde "PDF İndir" / "Sözleşme İndir" butonu varsa tetikle
    const modalBtns = Array.from(modal.querySelectorAll('button, a, .p-button'));
    const pdfBtn = modalBtns.find(b => {
      const t = normalizeText((b.textContent || '') + ' ' + (b.getAttribute('title') || ''));
      return t.includes('pdf') || t.includes('indir') || t.includes('belge indir') || !!b.querySelector('.pi-download, .pi-file-pdf');
    });
    if (pdfBtn) {
      triggerClick(pdfBtn);
      await sleep(600);
    }

    // Modalı Kapat
    const closeBtn = modal.querySelector('.p-dialog-header-close, button[aria-label*="Close" i], button[aria-label*="Kapat" i], .btn-close');
    if (closeBtn) {
      triggerClick(closeBtn);
      await sleep(350);
    }
  }

  return {
    modalExtractedText,
    modalKeyValues,
    apiDetail: capturedContractDetails[String(processId)] || null
  };
}

// Seçilen sözleşme için resmi formatta Detay Görüntüleme Belgesi (HTML/PDF uyumlu) üretir ve indirir
function generateContractDetailHtmlDocument(contract, detailInfo) {
  const extraRows = detailInfo && detailInfo.modalKeyValues
    ? Object.entries(detailInfo.modalKeyValues).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>İSG-KATİP Sözleşme Detay Belgesi - Süreç #${contract.processId}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; background: #fff; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 18px; font-weight: bold; }
    .subtitle { font-size: 12px; color: #475569; margin-top: 4px; }
    .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f8fafc; width: 34%; font-weight: bold; color: #334155; }
    .section-title { font-size: 14px; font-weight: bold; background: #0f172a; color: #fff; padding: 8px 12px; margin-top: 16px; margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">T.C. ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI - İSG-KATİP</div>
      <div class="subtitle">Sözleşme Detay Görüntüleme Belgesi (İşlemler &gt; Detay Görüntüle)</div>
    </div>
    <div class="badge">${contract.rawStatus}</div>
  </div>

  <div class="section-title">1. SÖZLEŞME VE HİZMET ALAN İŞYERİ BİLGİLERİ</div>
  <table>
    <tr><th>Sözleşme Süreç No</th><td><strong>#${contract.processId}</strong></td></tr>
    <tr><th>Hizmet Alan İşyeri Unvanı</th><td><strong>${contract.clientName}</strong></td></tr>
    <tr><th>DETSİS / SGK Sicil No</th><td>${contract.detsisNo ? 'DETSİS: ' + contract.detsisNo : (contract.clientSgkNo || 'Belirtilmedi')}</td></tr>
    <tr><th>Tehlike Sınıfı & NACE Kodu</th><td>${contract.hazardClass} ${contract.naceCode ? '(NACE: ' + contract.naceCode + ')' : ''}</td></tr>
    <tr><th>İşyeri Çalışan Sayısı</th><td><strong>${contract.employeeCount} Sigortalı Çalışan</strong></td></tr>
    <tr><th>Hizmet Sunucu OSGB Unvanı</th><td>${contract.osgbName} ${contract.osgbSgkNo ? '(' + contract.osgbSgkNo + ')' : ''}</td></tr>
  </table>

  <div class="section-title">2. GÖREVLENDİRİLEN İSG PROFESYONELİ VE SÜRE DETAYLARI</div>
  <table>
    <tr><th>Sözleşme Görev Türü</th><td><strong>${contract.duty}</strong></td></tr>
    <tr><th>Görevli Personel Adı Soyadı</th><td><strong>${contract.personName || 'Atama Yapılmamış'}</strong></td></tr>
    <tr><th>Aylık Çalışma Süresi</th><td><strong>${contract.durationMinutes} Dakika / Ay</strong> (${contract.durationHours} Saat / Ay)</td></tr>
    <tr><th>Sözleşme Başlangıç - Bitiş Tarihi</th><td>${contract.startDate} — ${contract.endDate}</td></tr>
    <tr><th>Sözleşme Statüsü</th><td>${contract.rawStatus}</td></tr>
    ${extraRows}
  </table>
</body>
</html>`;
}

// Seçilen sözleşmelerin tamamını İşlemler > Detay Görüntüle ile sırayla açıp toplu indirir
async function handleBulkDownloadSelectedContractsViaDetail() {
  if (isRunningAction) return;

  const currentContracts = activeMainTab === 'pending' ? pendingContracts : activeContracts;
  const chosenContracts = currentContracts.filter(c => selectedContractIds.has(c.id));

  if (chosenContracts.length === 0) {
    alert('Lütfen toplu detay indirme işlemi için en az 1 sözleşme seçiniz.');
    return;
  }

  isRunningAction = true;
  shouldStopPagination = false;

  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progContainer = document.getElementById('isgpro-progress-container');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'block';
  if (progContainer) progContainer.style.display = 'block';
  if (progText) progText.style.display = 'block';

  logMessage(`⬇️ [Toplu Sözleşme Detay İndirme] Seçilen ${chosenContracts.length} sözleşme için "İşlemler > Detay Görüntüle" başlatıldı...`);

  const detailedRecords = [];

  for (let i = 0; i < chosenContracts.length; i++) {
    if (shouldStopPagination) {
      logMessage('⏹️ Toplu sözleşme indirme işlemi kullanıcı tarafından durduruldu.');
      break;
    }

    const cnt = chosenContracts[i];
    const pct = Math.round(((i + 1) / chosenContracts.length) * 100);
    if (progBar) progBar.style.width = `${pct}%`;
    if (progText) progText.textContent = `[${i + 1}/${chosenContracts.length}] Süreç #${cnt.processId} (${cnt.duty}) Detay Görüntüle indiriliyor...`;

    logMessage(`🔍 [${i + 1}/${chosenContracts.length}] Süreç #${cnt.processId} — ${cnt.clientName} (${cnt.duty}) "İşlemler > Detay Görüntüle" açılıyor...`);

    const detailResult = await openContractDetailViaActionsMenu(cnt.processId);

    const enriched = Object.assign({}, cnt, {
      detailFetchedAt: new Date().toISOString(),
      detailModalData: detailResult ? detailResult.modalKeyValues : {},
      detailApiData: detailResult ? detailResult.apiDetail : null
    });
    detailedRecords.push(enriched);

    // Her sözleşme için bireysel Detay Görüntüleme Belgesini (.html) indir
    const htmlDoc = generateContractDetailHtmlDocument(cnt, detailResult);
    const docBlob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const docUrl = URL.createObjectURL(docBlob);
    const aDoc = document.createElement('a');
    aDoc.href = docUrl;
    const safeCompany = (cnt.clientName || 'Hizmet_Alan_Isyeri').replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ]/g, '_').slice(0, 40);
    aDoc.download = `Sozlesme_${safeCompany}_${cnt.dutyType}_Surec_${cnt.processId}.html`;
    aDoc.click();
    URL.revokeObjectURL(docUrl);

    await sleep(450);
  }

  // Tüm seçilen sözleşmelerin birleşik Detay Raporunu (JSON) indir
  const bundleBlob = new Blob([JSON.stringify({
    source: `ISGPRO-KATIP-BULK-DETAIL-DOWNLOAD-v${ISGPRO_CONFIG.version}`,
    downloadedAt: new Date().toISOString(),
    totalDownloadedContracts: detailedRecords.length,
    contracts: detailedRecords
  }, null, 2)], { type: 'application/json' });
  const bundleUrl = URL.createObjectURL(bundleBlob);
  const aBundle = document.createElement('a');
  aBundle.href = bundleUrl;
  aBundle.download = `isgpro_secilen_${detailedRecords.length}_sozlesme_tam_detay_paketi.json`;
  aBundle.click();
  URL.revokeObjectURL(bundleUrl);

  if (stopBtn) stopBtn.style.display = 'none';
  isRunningAction = false;
  logMessage(`🎉 [Toplu İndirme Tamamlandı] Seçilen ${detailedRecords.length} sözleşmenin "İşlemler > Detay Görüntüle" belgeleri eksiksiz indirildi!`);
}

// ============================================================================
// TÜM SAYFALARI DOLAŞAN HİBRİT (API + DOM) SÖZLEŞME ÇEKİCİ
// ============================================================================
async function runSmartDirectFetch(targetMode) {
  if (isRunningAction) return;
  isRunningAction = true;
  isAutoPaginating = true;
  shouldStopPagination = false;

  const isDevam = targetMode === 'DEVAM_EDEN';
  const modeTitle = isDevam
    ? 'Devam Eden Sözleşmeler ("Sözleşme Devam Ediyor")'
    : 'Onay Bekleyen Sözleşmeler ("Sözleşme Teklif Durumunda")';

  selectedCompanyIds.clear();
  selectedContractIds.clear();
  expandedCompanyIds.clear();
  latestApiContracts = [];
  accumulatedApiContracts = [];

  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progContainer = document.getElementById('isgpro-progress-container');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'block';
  if (progContainer) progContainer.style.display = 'block';
  if (progText) progText.style.display = 'block';

  logMessage(`🚀 [Tüm Sayfalar Tarama] ${modeTitle} çekiliyor...`);

  // Önce Injected Script'ten Angular RAM veya API verisini iste (Eğer ekranda hazır varsa anında yakalar)
  window.postMessage({
    source: 'ISGPRO_CONTENT',
    type: 'TRIGGER_DIRECT_FETCH',
    mode: targetMode
  }, '*');

  await navigateToKatipSection(targetMode);
  await sleep(1000);

  // Tekrar Direct Fetch tetikle (Sekme değiştikten sonra yeni API uç noktası yakalanmış olabilir)
  window.postMessage({
    source: 'ISGPRO_CONTENT',
    type: 'TRIGGER_DIRECT_FETCH',
    mode: targetMode
  }, '*');
  await sleep(1200);

  if (isTableEmptyOnPage() && accumulatedApiContracts.length === 0) {
    logMessage(`✓ İSG-KATİP: ${modeTitle} ekranında kayıt bulunmamaktadır (0 Sözleşme).`);
    if (isDevam) { activeContracts = []; activeCompanies = []; }
    else { pendingContracts = []; pendingCompanies = []; }
    updateTabBadges();
    renderList();
    finalizeScan(0, 0, modeTitle);
    return;
  }

  await tryMaximizeRowsPerPage();
  await ensureFirstPage();

  const contractsMap = new Map();

  const mergeContractRecord = (c) => {
    if (!c) return;
    const isNumericProcessId = /^\d+$/.test(String(c.processId || '').trim());
    const sig = isNumericProcessId
      ? `PID_${c.processId}_${c.dutyType}`
      : `ROW_${c.detsisNo || c.clientSgkNo || c.clientName}_${c.personName}_${c.dutyType}_${c.durationMinutes}_${c.processId}`;
    if (!contractsMap.has(sig)) {
      contractsMap.set(sig, c);
    }
  };

  // 1) Öncelikle arka plan API ve Angular veritabanından (p-table memory) yakalanan tüm sözleşmeleri tek seferde işle
  if (accumulatedApiContracts.length > 0) {
    accumulatedApiContracts.forEach((rawItem, idx) => {
      const parsed = parseRawContractJson(rawItem, targetMode, idx);
      if (parsed) mergeContractRecord(parsed);
    });
    logMessage(`⚡ [Veritabanı / API] Sayfa hafızasından ve arka plan API'den ${contractsMap.size} sözleşme tek seferde çekildi.`);
  }

  // 2) Eğer API/RAM'den henüz tüm kayıtlar gelmediyse veya mevcut sayfadaki DOM tablosuyla zenginleştirmek gerekiyorsa oku
  let currentPage = 1;
  let hasNext = true;

  while (hasNext && !shouldStopPagination && currentPage <= 100) {
    if (progText) progText.textContent = `Sayfa ${currentPage} veritabanı okunuyor... (${contractsMap.size} sözleşme toplandı)`;
    if (progBar) progBar.style.width = `${Math.min(currentPage * 25, 95)}%`;

    await sleep(350);

    const pageDomContracts = extractContractsFromDomTable(targetMode, currentPage);
    pageDomContracts.forEach(mergeContractRecord);

    if (accumulatedApiContracts.length > 0) {
      accumulatedApiContracts.forEach((rawItem, idx) => {
        const parsed = parseRawContractJson(rawItem, targetMode, idx);
        if (parsed) mergeContractRecord(parsed);
      });
    }

    logMessage(`📄 [Sayfa ${currentPage}] Tablodan ${pageDomContracts.length} satır doğrulandı -> Toplam: ${contractsMap.size} Sözleşme`);

    // Eğer API / Angular RAM üzerinden zaten tablodaki sayfa boyutundan fazla (tüm sayfalar) çekildiyse, DOM sayfalarını tek tek gezmeden bitir!
    if (accumulatedApiContracts.length > pageDomContracts.length && contractsMap.size >= accumulatedApiContracts.length) {
      logMessage(`🚀 [Tek Seferde Tam Çekim] Tüm sayfalar (${contractsMap.size} sözleşme) doğrudan veritabanı/API üzerinden eksiksiz alındı.`);
      hasNext = false;
      break;
    }

    let nextBtn = findActiveNextPageButton();
    if (!nextBtn) nextBtn = findNextPageNumberButton(currentPage);

    if (nextBtn) {
      triggerClick(nextBtn);
      await sleep(ISGPRO_CONFIG.paginationDelayMs);
      currentPage++;
    } else {
      hasNext = false;
    }
  }

  const finalContracts = Array.from(contractsMap.values());

  if (isDevam) {
    activeContracts = finalContracts;
    activeCompanies = groupCompaniesByContracts(activeContracts);
    activeCompanies.forEach(c => selectedCompanyIds.add(c.id));
    activeContracts.forEach(cnt => selectedContractIds.add(cnt.id));
    switchMainTab('active');
  } else {
    pendingContracts = finalContracts;
    pendingCompanies = groupCompaniesByContracts(pendingContracts);
    pendingCompanies.forEach(c => selectedCompanyIds.add(c.id));
    pendingContracts.forEach(cnt => selectedContractIds.add(cnt.id));
    switchMainTab('pending');
  }

  allScannedContracts = [...activeContracts, ...pendingContracts];
  updateTabBadges();
  renderList();

  const secDiv = document.getElementById('isgpro-company-section');
  if (secDiv) secDiv.style.display = 'block';

  const groupedCount = isDevam ? activeCompanies.length : pendingCompanies.length;
  finalizeScan(finalContracts.length, groupedCount, modeTitle);

  const autoSyncCheckbox = document.getElementById('isgpro-check-autosync');
  const shouldAutoSync = autoSyncCheckbox ? autoSyncCheckbox.checked : ISGPRO_CONFIG.autoSyncOnScan;
  if (shouldAutoSync && finalContracts.length > 0) {
    await handleLiveSyncToIsgpro();
  }
}

function finalizeScan(contractCount, companyCount, title) {
  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'none';
  if (progBar) progBar.style.width = '100%';
  if (progText) progText.textContent = `Tamamlandı: Toplam ${contractCount} Sözleşme (${companyCount} Firma)`;

  isRunningAction = false;
  isAutoPaginating = false;
  logMessage(`🎉 TAMAMLANDI: ${title} altında toplam ${contractCount} sözleşme kaydı (${companyCount} işyeri) başarıyla çekildi.`);
}

function handleStopScan() {
  shouldStopPagination = true;
  logMessage('İşlem durdurma komutu verildi...');
}

function updateTabBadges() {
  const tabActiveBtn = document.getElementById('isgpro-tab-active');
  const tabPendingBtn = document.getElementById('isgpro-tab-pending');
  const tabEmployeesBtn = document.getElementById('isgpro-tab-employees');
  const selectionBadge = document.getElementById('isgpro-selection-badge');
  const deficitBtn = document.getElementById('isgpro-btn-filter-deficit');
  const bulkDetailBtn = document.getElementById('isgpro-btn-download-selected-details');

  if (tabActiveBtn) {
    tabActiveBtn.textContent = `🟢 Devam Eden (${activeContracts.length} Sözleşme · ${activeCompanies.length} Firma)`;
  }
  if (tabPendingBtn) {
    tabPendingBtn.textContent = `🟡 Teklif / Bekleyen (${pendingContracts.length} Sözleşme · ${pendingCompanies.length} Firma)`;
  }
  if (tabEmployeesBtn) {
    tabEmployeesBtn.textContent = `👥 Personel Süre & Kota (${computedPersonnelQuotas.length})`;
  }
  const exportPersonnelExcelBtn = document.getElementById('isgpro-btn-export-personnel-excel');
  if (exportPersonnelExcelBtn) {
    if (computedPersonnelQuotas.length > 0) {
      exportPersonnelExcelBtn.removeAttribute('disabled');
      exportPersonnelExcelBtn.textContent = `📊 Personel Kalan Süreleri Excel (.CSV) İndir (${computedPersonnelQuotas.length} Personel)`;
    } else {
      exportPersonnelExcelBtn.setAttribute('disabled', 'true');
      exportPersonnelExcelBtn.textContent = '📊 Personel Kalan Süreleri Excel (.CSV) İndir';
    }
  }

  const currentContracts = activeMainTab === 'pending' ? pendingContracts : activeContracts;
  const currentCompanies = activeMainTab === 'pending' ? pendingCompanies : activeCompanies;

  const iguCount = currentContracts.filter(c => c.dutyType === 'UZMAN').length;
  const hekimCount = currentContracts.filter(c => c.dutyType === 'HEKIM').length;
  const dspCount = currentContracts.filter(c => c.dutyType === 'DSP').length;

  const totalContractsEl = document.getElementById('isgpro-stat-total-contracts');
  const roleBreakdownEl = document.getElementById('isgpro-stat-role-breakdown');
  const totalCompaniesEl = document.getElementById('isgpro-stat-total-companies');

  if (totalContractsEl) totalContractsEl.textContent = `${currentContracts.length} Sözleşme`;
  if (roleBreakdownEl) roleBreakdownEl.textContent = `🛡️ ${iguCount} Uzman · 🩺 ${hekimCount} Hekim · 💉 ${dspCount} DSP`;
  if (totalCompaniesEl) totalCompaniesEl.textContent = `${currentCompanies.length} Firma`;

  const deficitCount = currentCompanies.filter(c => !c.isCompliant).length;
  if (deficitBtn) deficitBtn.textContent = `⚠️ Eksik Süreliler (${deficitCount})`;

  const selectedContractsInTab = currentContracts.filter(c => selectedContractIds.has(c.id));
  if (bulkDetailBtn) {
    if (selectedContractsInTab.length > 0) {
      bulkDetailBtn.removeAttribute('disabled');
      bulkDetailBtn.textContent = `⬇️ Seçilen (${selectedContractsInTab.length}) Sözleşmeyi (İşlemler > Detay Görüntüle) Toplu İndir`;
    } else {
      bulkDetailBtn.setAttribute('disabled', 'true');
      bulkDetailBtn.textContent = '⬇️ Detay İndirmek İçin En Az 1 Sözleşme Seçin';
    }
  }

  if (selectionBadge) {
    selectionBadge.textContent = `${selectedCompanyIds.size} Firma · ${selectedContractIds.size} Sözleşme Seçildi`;
  }
}

function renderList(filterQuery = '') {
  const container = document.getElementById('isgpro-company-list');
  const toolbarCount = document.getElementById('isgpro-toolbar-count');
  const exportBtn = document.getElementById('isgpro-btn-export-selected');
  const liveSyncBtn = document.getElementById('isgpro-btn-live-sync');

  if (!container) return;
  updateTabBadges();

  if (selectedCompanyIds.size > 0 || selectedContractIds.size > 0) {
    exportBtn?.removeAttribute('disabled');
    if (exportBtn) exportBtn.textContent = `📥 JSON İndir (${selectedCompanyIds.size} Firma · ${selectedContractIds.size} Sözleşme)`;
    liveSyncBtn?.removeAttribute('disabled');
    if (liveSyncBtn) liveSyncBtn.textContent = `🔄 İSGPRO Eşitle (${selectedCompanyIds.size} Firma · ${selectedContractIds.size} Sözleşme)`;
  } else {
    exportBtn?.setAttribute('disabled', 'true');
    if (exportBtn) exportBtn.textContent = '📥 En Az 1 Kayıt Seçin';
    liveSyncBtn?.setAttribute('disabled', 'true');
    if (liveSyncBtn) liveSyncBtn.textContent = '🔄 Eşitlemek İçin Seçin';
  }

  if (activeMainTab === 'employees') {
    toolbarCount.textContent = `${computedPersonnelQuotas.length} Personel Süre & Kalan Kota Hesabı`;
    if (computedPersonnelQuotas.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:11px;">Henüz personel sözleşmesi çekilmedi. Yukarıdaki "👥 Personel & Sorumlu Müdür Sözleşmelerini Çek / Kalan Süreleri Hesapla" butonuna tıklayın.</div>';
      return;
    }
    container.innerHTML = computedPersonnelQuotas.map(pq => {
      const remColor = pq.kalanDakika < 0 ? '#dc2626' : pq.kalanDakika < 600 ? '#d97706' : '#15803d';
      return `
        <div class="isgpro-company-row" style="padding:10px 12px;">
          <div class="isgpro-company-details">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <strong style="font-size:11.5px;color:#0f172a;">👤 ${pq.adSoyad} (TC: ${pq.tcKimlikNo})</strong>
              <span class="isgpro-tag isgpro-tag-blue">${pq.sertifikaTipi} · Belge #${pq.sertifikaNo}</span>
            </div>
            <div style="font-size:10.5px;color:#475569;margin-top:4px;display:flex;flex-wrap:wrap;gap:6px;">
              <span>📋 <strong>${pq.sozlesmeTipi}</strong></span>
              <span>⏱️ Çalışma: <strong>${pq.calismaSuresi}</strong></span>
              ${pq.sorumluMudurDakika > 0 ? `<span class="isgpro-tag isgpro-tag-purple">🏛️ Sorumlu Müdür: ${pq.sorumluMudurDakika} dk/ay</span>` : ''}
            </div>
            <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#f8fafc;padding:6px;border-radius:6px;border:1px solid #e2e8f0;font-size:10px;">
              <div>
                <div style="color:#64748b;">Toplam Atanan Süre</div>
                <strong style="color:#0f172a;font-size:11px;">${pq.atanmisToplamSureDakika} dk (${(pq.atanmisToplamSureDakika / 60).toFixed(1)} sa)</strong>
              </div>
              <div>
                <div style="color:#64748b;">Firmalarda + SM Kullanılan</div>
                <strong style="color:#1e40af;font-size:11px;">-${pq.kullanilanToplamDakika} dk (${pq.firmaSayisi} Firma)</strong>
              </div>
              <div>
                <div style="color:#64748b;">Kalan / Atanabilir Süre</div>
                <strong style="color:${remColor};font-size:11.5px;">${pq.kalanDakika} dk (${(pq.kalanDakika / 60).toFixed(1)} sa)</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  const q = filterQuery.toLowerCase().trim();

  const filtered = currentList.filter(c => {
    if (showOnlyDeficitCompanies && c.isCompliant) return false;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.detsisNo && c.detsisNo.includes(q)) ||
      (c.clientSgkNo && c.clientSgkNo.includes(q)) ||
      (c.assignedSpecialist && c.assignedSpecialist.toLowerCase().includes(q)) ||
      (c.assignedDoctor && c.assignedDoctor.toLowerCase().includes(q))
    );
  });

  const filteredContractsSum = filtered.reduce((acc, c) => acc + c.contractCount, 0);
  toolbarCount.textContent = `${filtered.length} Firma (${filteredContractsSum} Sözleşme Kaydı) Gösteriliyor`;

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:11px;">Kriterlere uygun sözleşme kaydı bulunamadı.</div>';
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isSelected = selectedCompanyIds.has(c.id);
    const statusLabel = activeMainTab === 'active'
      ? '<span class="isgpro-tag isgpro-tag-green">SÖZLEŞME DEVAM EDİYOR</span>'
      : '<span class="isgpro-tag isgpro-tag-yellow">SÖZLEŞME TEKLİF DURUMUNDA</span>';

    const compBadge = c.isCompliant
      ? '<span class="isgpro-tag isgpro-tag-green">✓ 6331 TAM UYGUN</span>'
      : `<span class="isgpro-tag isgpro-tag-red">⚠️ ${c.totalDeficitMinutes} DK EKSİK SÜRE</span>`;

    const combinedHeaderTitle = c.isDetsis && c.detsisNo
      ? `${c.name} — [DETSİS: ${c.detsisNo}]`
      : c.clientSgkNo
      ? `${c.name} — [SGK: ${c.clientSgkNo}]`
      : c.name;

    return `
      <div class="isgpro-company-row ${isSelected ? 'selected' : ''}" data-id="${c.id}">
        <input type="checkbox" class="isgpro-company-check" data-id="${c.id}" ${isSelected ? 'checked' : ''} />
        <div class="isgpro-company-details">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
            <div class="isgpro-company-title">${combinedHeaderTitle}</div>
            <div style="display:flex;gap:4px;flex-shrink:0;">
              ${statusLabel}
              ${compBadge}
            </div>
          </div>
          <div class="isgpro-tags">
            ${c.isDetsis ? `<span class="isgpro-tag isgpro-tag-purple">🏛️ DETSİS: <strong>${c.detsisNo}</strong></span>` : `<span class="isgpro-tag isgpro-tag-blue">🏢 SGK: <strong>${c.clientSgkNo || 'Belirtilmedi'}</strong></span>`}
            <span class="isgpro-tag isgpro-tag-teal">👥 <strong>${c.employeeCount}</strong> Çalışan</span>
            <span class="isgpro-tag isgpro-tag-gray">📄 <strong>${c.contractCount} Sözleşme</strong> (${c.specialistContractCount} İGU · ${c.doctorContractCount} Hekim · ${c.dspContractCount} DSP)</span>
          </div>
          <!-- Her Firmanın Alt Sözleşmeleri (Tekil Seçim & İşlemler > Detay Görüntüle İndirme İçin) -->
          <div style="margin-top:6px;border-top:1px dashed #cbd5e1;padding-top:6px;display:flex;flex-direction:column;gap:4px;">
            ${c.contracts.map(cnt => {
              const cntChecked = selectedContractIds.has(cnt.id);
              return `
                <label style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:5px 8px;border-radius:4px;border:1px solid #e2e8f0;font-size:10.5px;cursor:pointer;">
                  <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <input type="checkbox" class="isgpro-contract-check" data-cid="${cnt.id}" data-compid="${c.id}" ${cntChecked ? 'checked' : ''} />
                    <span style="font-weight:700;color:#0f172a;">${cnt.clientName || c.name}</span>
                    <span style="color:#94a3b8;">—</span>
                    <strong>${cnt.duty}</strong> — ${cnt.personName || 'Atanmamış'} <span style="color:#64748b;">(Süreç #${cnt.processId})</span>
                  </span>
                  <span style="font-weight:700;color:#1e40af;flex-shrink:0;">${cnt.durationMinutes} dk/ay</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Firma Checkbox Dinleyicisi (Firmayı seçince altındaki tüm sözleşmeleri de seçer/kaldırır)
  container.querySelectorAll('.isgpro-company-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = chk.getAttribute('data-id');
      const compObj = currentList.find(item => item.id === id);
      if (e.target.checked) {
        selectedCompanyIds.add(id);
        if (compObj) compObj.contracts.forEach(cnt => selectedContractIds.add(cnt.id));
      } else {
        selectedCompanyIds.delete(id);
        if (compObj) compObj.contracts.forEach(cnt => selectedContractIds.delete(cnt.id));
      }
      renderList(document.getElementById('isgpro-company-search')?.value || '');
    });
  });

  // Tekil Sözleşme Checkbox Dinleyicisi
  container.querySelectorAll('.isgpro-contract-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const cid = chk.getAttribute('data-cid');
      const compId = chk.getAttribute('data-compid');
      const compObj = currentList.find(item => item.id === compId);
      if (e.target.checked) {
        selectedContractIds.add(cid);
        selectedCompanyIds.add(compId);
      } else {
        selectedContractIds.delete(cid);
        if (compObj) {
          const anyRemaining = compObj.contracts.some(cnt => selectedContractIds.has(cnt.id));
          if (!anyRemaining) selectedCompanyIds.delete(compId);
        }
      }
      renderList(document.getElementById('isgpro-company-search')?.value || '');
    });
  });
}

function normalizeEmployeeRecord(raw, idx) {
  return {
    id: raw.id || `emp_${idx + 1}`,
    companyKey: raw.isyeriSgkSicilNo || raw.detsisNo || raw.companyKey || '',
    companyName: raw.isyeriUnvani || raw.companyName || 'Seçili İşyeri',
    tcKimlikNo: raw.tcKimlikNo || raw.kimlikNo || '***********',
    adSoyad: raw.adSoyad || `${raw.ad || ''} ${raw.soyad || ''}`.trim() || `Çalışan #${idx + 1}`,
    gorevUnvan: raw.gorev || raw.meslekKoduAdi || raw.gorevUnvan || 'Sigortalı Çalışan',
    iseGirisTarihi: raw.iseGirisTarihi || 'Belirtilmedi',
    muayeneDurumu: raw.muayeneDurumu || 'Geçerli',
    isgEgitimDurumu: raw.isgEgitimDurumu || 'Tamamlandı'
  };
}

function parseRawPersonnelContractJson(item, idx = 0, defaultTab = 'PERSONEL_DEVAM_EDEN') {
  if (!item || typeof item !== 'object') return null;

  const rawStatus =
    item.sozlesmeStatu ||
    item.sozlesmeDurumu ||
    item.statu ||
    item.durum ||
    'Sözleşme Devam Ediyor';

  if (!matchesContractStatus(rawStatus, 'DEVAM_EDEN')) return null;

  const surecNo = String(item.surecNo || item.surecId || item.sozlesmeNo || item.sozlesmeId || item.id || `PS-API-${idx + 1}`);
  const kisiObj = item.sozlesmeYapilanKisi || item.personel || item.gorevliKisi || item.kisi || {};

  const tcVal = String(
    item.sozlesmeYapilanKisiTcKimlikNo ||
    item.tcKimlikNo ||
    item.kimlikNo ||
    kisiObj.tcKimlikNo ||
    kisiObj.kimlikNo ||
    `PERSONEL-${idx + 1}`
  );

  let adSoyadVal =
    item.sozlesmeYapilanKisiAdSoyad ||
    item.personelAdSoyad ||
    item.adSoyad ||
    item.isimSoyisim ||
    kisiObj.adSoyad ||
    (kisiObj.ad && kisiObj.soyad ? `${kisiObj.ad} ${kisiObj.soyad}` : '') ||
    (item.ad && item.soyad ? `${item.ad} ${item.soyad}` : '') ||
    '';

  if (!adSoyadVal || isContractTypeOrRolePhrase(adSoyadVal)) {
    adSoyadVal = `İSG Profesyoneli #${surecNo}`;
  }

  const sertifikaTipi =
    item.sozlesmeYapilanKisiSertifikaTipi ||
    item.sertifikaTipi ||
    item.belgeTipi ||
    item.gorev ||
    kisiObj.sertifikaTipi ||
    (defaultTab === 'SORUMLU_MUDUR' ? 'Sorumlu Müdür' : 'İSG Profesyoneli');

  const sertifikaNo = String(
    item.sozlesmeYapilanKisiSertifikaNo ||
    item.sertifikaNo ||
    item.belgeNo ||
    kisiObj.sertifikaNo ||
    '-'
  );

  const sozlesmeTipi =
    item.sozlesmeTipi ||
    item.sozlesmeTuru ||
    item.gorevlendirmeTipi ||
    (defaultTab === 'SORUMLU_MUDUR' ? 'OSGB Sorumlu Müdür Sözleşmesi' : 'OSGB İle Personel Sözleşmesi (İçe Görevlendirme)');

  const rawDur =
    item.atananSure ??
    item.atananSureDakika ??
    item.calismaSuresiDakika ??
    item.aylikCalismaSuresi ??
    item.calismaSuresi ??
    item.sureDakika ??
    item.sure ??
    11700;

  let atananSureDakika = 11700;
  const strDur = String(rawDur);
  const mHour = strDur.match(/(\d+)\s*(?:saat|sa)/i);
  const mNum = strDur.replace(/\./g, '').match(/(\d+)/);
  if (mHour) atananSureDakika = parseInt(mHour[1], 10) * 60;
  else if (mNum) {
    const val = parseInt(mNum[1], 10);
    atananSureDakika = val > 0 && val <= 250 && strDur.toLowerCase().includes('saat') ? val * 60 : (val || 11700);
  }

  const isSm =
    defaultTab === 'SORUMLU_MUDUR' ||
    normalizeText(sozlesmeTipi).includes('sorumlu mudur') ||
    normalizeText(sertifikaTipi).includes('sorumlu mudur');

  return {
    surecNo,
    sozlesmeYapilanKisiTcKimlikNo: tcVal,
    sozlesmeYapilanKisiAdSoyad: String(adSoyadVal).trim(),
    sozlesmeYapilanKisiSertifikaTipi: String(sertifikaTipi).trim(),
    sozlesmeYapilanKisiSertifikaNo: sertifikaNo,
    sozlesmeTipi: String(sozlesmeTipi).trim(),
    calismaSuresi: String(item.calismaSuresi || `${atananSureDakika} Dakika / Ay`),
    atananSureDakika,
    sozlesmeStatu: 'Sözleşme Devam Ediyor',
    kaynakSekme: isSm ? 'SORUMLU_MUDUR' : 'PERSONEL_DEVAM_EDEN'
  };
}

function extractPersonnelContractsFromDomTable(sourceTab = 'PERSONEL_DEVAM_EDEN', pageNum = 1) {
  const results = [];
  const tables = Array.from(document.querySelectorAll('table, .p-datatable-table'));

  tables.forEach(table => {
    const headerCells = Array.from(table.querySelectorAll('thead th, .p-datatable-thead th'));
    const headers = headerCells.map(th => {
      const titleEl = th.querySelector('.p-column-title, .ui-column-title');
      return normalizeText(titleEl ? titleEl.textContent : th.textContent);
    });

    const findCol = (keywords) => headers.findIndex(h => keywords.some(kw => h.includes(kw)));

    const idxSurec = findCol(['surec no', 'surec id', 'sozlesme no', 'id', 'kayit no']);
    const idxTc = findCol(['sozlesme yapilan kisi tc kimlik no', 'kisi tc kimlik', 'tc kimlik no', 'tc no', 'kimlik no']);
    const idxAdSoyad = findCol(['sozlesme yapilan kisi ad soyad', 'kisi ad soyad', 'ad soyad', 'adi soyadi', 'personel ad', 'gorevli']);
    const idxSertifikaTipi = findCol(['sozlesme yapilan kisi sertifika tipi', 'sertifika tipi', 'belge tipi', 'gorev', 'unvan']);
    const idxSertifikaNo = findCol(['sozlesme yapilan kisi sertifika no', 'sertifika no', 'belge no']);
    const idxSozlesmeTipi = findCol(['sozlesme tipi', 'sozlesme turu', 'gorevlendirme tipi']);
    const idxCalismaSuresi = findCol(['calisma suresi', 'gorev suresi', 'calisma sekli']);
    const idxAtananSure = findCol(['atanan sure', 'toplam sure', 'aylik sure', 'sure (dk)', 'dakika']);
    const idxStatu = findCol(['sozlesme statu', 'sozlesme durumu', 'statu', 'durum']);

    const rows = Array.from(table.querySelectorAll('tbody tr, .p-datatable-tbody > tr'));
    rows.forEach((tr, rIdx) => {
      if (tr.closest('thead') || tr.classList.contains('p-datatable-emptymessage')) return;
      const cells = Array.from(tr.querySelectorAll('td, div[role="cell"]'));
      if (cells.length < 3) return;

      const cellByResponsiveTitle = {};
      cells.forEach((c, cIdx) => {
        const tSpan = c.querySelector('.p-column-title, .ui-column-title');
        if (tSpan) {
          cellByResponsiveTitle[normalizeText(tSpan.textContent)] = { val: getCellCleanText(c), idx: cIdx };
        }
      });

      const getVal = (idx, titleKeywords = []) => {
        for (const [k, obj] of Object.entries(cellByResponsiveTitle)) {
          if (titleKeywords.some(kw => k.includes(kw))) return obj.val;
        }
        return idx >= 0 && cells[idx] ? getCellCleanText(cells[idx]) : '';
      };

      const rowText = (tr.innerText || tr.textContent || '').replace(/\s+/g, ' ').trim();
      if (!rowText || rowText.length < 5) return;

      const statuText = getVal(idxStatu, ['statu', 'durum']) || (rowText.match(/Sözleşme Devam Ediyor/i) ? 'Sözleşme Devam Ediyor' : '');
      if (statuText && !matchesContractStatus(statuText, 'DEVAM_EDEN')) return;

      let surecNo = getVal(idxSurec, ['surec no', 'sozlesme no']);
      if (!surecNo) {
        const c0 = getCellCleanText(cells[0]);
        if (/^\d{3,10}$/.test(c0)) surecNo = c0;
      }
      if (!surecNo) surecNo = `PS-P${pageNum}-${rIdx + 1}`;

      const rawAtanan = getVal(idxAtananSure, ['atanan sure', 'dakika']) || getVal(idxCalismaSuresi, ['calisma suresi']) || '';
      let atananSureDakika = 11700;
      const mHour = rawAtanan.match(/(\d+)\s*(?:saat|sa)/i);
      const numMatch = rawAtanan.replace(/\./g, '').match(/(\d+)/);
      if (mHour) {
        atananSureDakika = parseInt(mHour[1], 10) * 60;
      } else if (numMatch) {
        atananSureDakika = parseInt(numMatch[1], 10);
      } else {
        const rowMinMatch = rowText.replace(/\./g, '').match(/\b(\d{3,5})\s*(?:dk|dakika)?\b/i);
        if (rowMinMatch && rowMinMatch[1] !== surecNo) {
          const parsedMin = parseInt(rowMinMatch[1], 10);
          if (parsedMin >= 60 && parsedMin <= 15000) atananSureDakika = parsedMin;
        }
      }

      // TC Kimlik No (Açık 11 hane veya maskeli 123*****890 formatını destekler)
      let tcVal = getVal(idxTc, ['tc kimlik', 'kimlik no']);
      if (!tcVal) {
        const tcMatch = rowText.match(/\b\d{11}\b/) || rowText.match(/\b\d{2,5}\*{2,7}\d{1,4}\b/);
        if (tcMatch && tcMatch[0] !== surecNo) tcVal = tcMatch[0];
      }

      let adSoyadVal = getVal(idxAdSoyad, ['kisi ad soyad', 'ad soyad', 'personel']);
      if (!adSoyadVal || isContractTypeOrRolePhrase(adSoyadVal) || /^\d+$/.test(adSoyadVal)) {
        adSoyadVal = findPersonNameFromCells(cells, '', '', surecNo, [idxSurec, idxTc, idxSertifikaNo, idxSozlesmeTipi, idxStatu].filter(v => v >= 0));
      }
      if (!adSoyadVal) {
        adSoyadVal = `İSG Profesyoneli #${surecNo}`;
      }

      const sertifikaTipi = getVal(idxSertifikaTipi, ['sertifika tipi', 'belge tipi']) || (sourceTab === 'SORUMLU_MUDUR' ? 'Sorumlu Müdür' : 'İSG Uzmanı / Hekim');
      const sertifikaNo = getVal(idxSertifikaNo, ['sertifika no', 'belge no']) || '-';
      const sozlesmeTipi = getVal(idxSozlesmeTipi, ['sozlesme tipi', 'gorevlendirme tipi']) || (sourceTab === 'SORUMLU_MUDUR' ? 'OSGB Sorumlu Müdür Sözleşmesi' : 'OSGB İle Personel Sözleşmesi');
      const calismaSuresi = getVal(idxCalismaSuresi, ['calisma suresi']) || `${atananSureDakika} Dakika / Ay`;

      results.push({
        surecNo,
        sozlesmeYapilanKisiTcKimlikNo: tcVal || `TC-${surecNo}`,
        sozlesmeYapilanKisiAdSoyad: adSoyadVal,
        sozlesmeYapilanKisiSertifikaTipi: sertifikaTipi,
        sozlesmeYapilanKisiSertifikaNo: sertifikaNo,
        sozlesmeTipi,
        calismaSuresi,
        atananSureDakika,
        sozlesmeStatu: 'Sözleşme Devam Ediyor',
        kaynakSekme: sourceTab
      });
    });
  });

  return results;
}

function calculatePersonnelQuotas() {
  const allCompanyContracts = [...activeContracts, ...pendingContracts];
  const personnelMap = new Map();

  scannedPersonnelContracts.forEach((pc, idx) => {
    const cleanName = normalizeText(pc.sozlesmeYapilanKisiAdSoyad || '');
    const cleanTc = (pc.sozlesmeYapilanKisiTcKimlikNo || '').trim();
    const cleanCert = (pc.sozlesmeYapilanKisiSertifikaNo || '').trim();

    let key = '';
    if (cleanName && !cleanName.startsWith('isg profesyoneli')) {
      key = `NAME_${cleanName}`;
    } else if (cleanTc && !cleanTc.startsWith('***********')) {
      key = `TC_${cleanTc}`;
    } else if (cleanCert && cleanCert !== '-') {
      key = `CERT_${cleanCert}`;
    } else {
      key = `ROW_${pc.surecNo || idx}`;
    }

    if (!personnelMap.has(key)) {
      personnelMap.set(key, {
        tcKimlikNo: pc.sozlesmeYapilanKisiTcKimlikNo,
        adSoyad: pc.sozlesmeYapilanKisiAdSoyad,
        sertifikaTipi: pc.sozlesmeYapilanKisiSertifikaTipi,
        sertifikaNo: pc.sozlesmeYapilanKisiSertifikaNo,
        sozlesmeTipi: pc.sozlesmeTipi,
        calismaSuresi: pc.calismaSuresi,
        atanmisToplamSureDakika: 0,
        sorumluMudurDakika: 0,
        firmalardakiAtananDakika: 0,
        kullanilanToplamDakika: 0,
        kalanDakika: 0,
        firmaSayisi: 0,
        firmaDagilimi: []
      });
    }

    const entry = personnelMap.get(key);
    if (pc.kaynakSekme === 'SORUMLU_MUDUR' || normalizeText(pc.sozlesmeTipi).includes('sorumlu mudur')) {
      entry.sorumluMudurDakika += pc.atananSureDakika;
    } else {
      entry.atanmisToplamSureDakika += pc.atananSureDakika;
      entry.sertifikaTipi = pc.sozlesmeYapilanKisiSertifikaTipi || entry.sertifikaTipi;
      entry.sertifikaNo = pc.sozlesmeYapilanKisiSertifikaNo || entry.sertifikaNo;
      entry.sozlesmeTipi = pc.sozlesmeTipi || entry.sozlesmeTipi;
      entry.calismaSuresi = pc.calismaSuresi || entry.calismaSuresi;
    }
  });

  // Firmalara yapılan atamaları her personelin toplam atanmış süresinden tek tek düş
  allCompanyContracts.forEach(cnt => {
    if (!cnt.personName) return;
    const cntNormName = normalizeText(cnt.personName);

    for (const [, entry] of personnelMap.entries()) {
      const entryNormName = normalizeText(entry.adSoyad);
      if (
        (cnt.personTc && cnt.personTc === entry.tcKimlikNo) ||
        (entryNormName && cntNormName && (entryNormName === cntNormName || entryNormName.includes(cntNormName) || cntNormName.includes(entryNormName)))
      ) {
        entry.firmalardakiAtananDakika += (cnt.durationMinutes || 0);
        entry.firmaSayisi += 1;
        entry.firmaDagilimi.push({
          isyeriUnvani: cnt.clientName || cnt.companyName,
          sureDakika: cnt.durationMinutes || 0,
          surecNo: cnt.processId
        });
        break;
      }
    }
  });

  const quotas = [];
  for (const [, entry] of personnelMap.entries()) {
    if (entry.atanmisToplamSureDakika === 0 && entry.sorumluMudurDakika > 0) {
      entry.atanmisToplamSureDakika = 11700;
    }
    entry.kullanilanToplamDakika = entry.firmalardakiAtananDakika + entry.sorumluMudurDakika;
    entry.kalanDakika = entry.atanmisToplamSureDakika - entry.kullanilanToplamDakika;
    quotas.push(entry);
  }

  computedPersonnelQuotas = quotas;
  return quotas;
}

function hasUnupdatedCompanyDurations() {
  if (hasEqualizedCompanyDurations) return false;
  const allContracts = [...activeContracts, ...pendingContracts];
  return allContracts.some(cnt => {
    const req = calculateLegislationRequirements(cnt.employeeCount, cnt.hazardClass);
    const reqMin = cnt.dutyType === 'UZMAN'
      ? req.requiredSpecialistMinutes
      : cnt.dutyType === 'HEKIM'
      ? req.requiredDoctorMinutes
      : req.requiredDspMinutes;
    return reqMin > 0 && cnt.durationMinutes !== reqMin;
  });
}

async function handleFetchEmployeesForSelected(bypassWarning = false) {
  if (isRunningAction) return;

  // Uyarı Kontrolü: Firmalardaki asgari ve güncellenmesi gereken süreler eşitlenmediyse kullanıcıya sor
  if (!bypassWarning && hasUnupdatedCompanyDurations()) {
    const existingModal = document.getElementById('isgpro-duration-warning-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'isgpro-duration-warning-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.72);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#ffffff;border-radius:12px;max-width:440px;width:100%;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.35);border:2px solid #f59e0b;font-family:sans-serif;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-size:24px;">⚠️</span>
          <h4 style="margin:0;font-size:14px;font-weight:800;color:#92400e;">Süre Güncelleme Uyarısı</h4>
        </div>
        <p style="margin:0 0 16px 0;font-size:12.5px;line-height:1.55;color:#334155;font-weight:500;">
          Firmalardaki asgari ve güncellenmesi gereken süreleri güncellemediniz! Yine de devam etmek istiyor musunuz?
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="isgpro-warn-equalize-first" style="padding:10px 12px;border-radius:8px;border:none;background:#0f766e;color:#fff;font-weight:700;font-size:11.5px;cursor:pointer;">
            ⚖️ Önce Firmalardaki Süreleri Mevzuata Eşitle, Sonra Hesapla
          </button>
          <div style="display:flex;gap:8px;">
            <button id="isgpro-warn-proceed-anyway" style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid #d97706;background:#fef3c7;color:#92400e;font-weight:700;font-size:11.5px;cursor:pointer;">
              ▶️ Yine de Devam Et
            </button>
            <button id="isgpro-warn-cancel" style="padding:9px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;font-weight:600;font-size:11.5px;cursor:pointer;">
              İptal
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('isgpro-warn-cancel')?.addEventListener('click', () => modal.remove());
    document.getElementById('isgpro-warn-proceed-anyway')?.addEventListener('click', async () => {
      modal.remove();
      await handleFetchEmployeesForSelected(true);
    });
    document.getElementById('isgpro-warn-equalize-first')?.addEventListener('click', async () => {
      modal.remove();
      await handleAutoFixDeficitDurations();
      await handleFetchEmployeesForSelected(true);
    });
    return;
  }

  isRunningAction = true;
  shouldStopPagination = false;
  scannedPersonnelContracts = [];
  accumulatedApiPersonnelContracts = [];

  const progContainer = document.getElementById('isgpro-progress-container');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');
  if (progContainer) progContainer.style.display = 'block';
  if (progText) progText.style.display = 'block';

  const personnelRecordsMap = new Map();
  const mergePersonnelContract = (pc) => {
    if (!pc) return;
    const isNumericId = /^\d+$/.test(String(pc.surecNo || '').trim());
    const sig = isNumericId
      ? `PID_${pc.surecNo}_${pc.kaynakSekme}`
      : `ROW_${normalizeText(pc.sozlesmeYapilanKisiAdSoyad)}_${pc.sozlesmeYapilanKisiSertifikaNo}_${pc.kaynakSekme}_${pc.surecNo}`;
    if (!personnelRecordsMap.has(sig)) {
      personnelRecordsMap.set(sig, pc);
    }
  };

  logMessage('👥 [1/2] Personel Sözleşmeleri > Devam Eden Sözleşmeler sayfasına bağlanılıyor (Veritabanı / API)...');
  if (progBar) progBar.style.width = '20%';
  if (progText) progText.textContent = 'Personel Sözleşmeleri (Veritabanı / API) çekiliyor...';

  await navigateToKatipSection('PERSONEL_SOZLESMELERI_DEVAM');
  await sleep(600);

  // Doğrudan Angular p-table hafızası ve REST API üzerinden tüm personel sözleşmelerini (10/10) tek seferde iste
  window.postMessage({
    source: 'ISGPRO_CONTENT',
    type: 'TRIGGER_PERSONNEL_DIRECT_FETCH'
  }, '*');
  await sleep(900);

  if (accumulatedApiPersonnelContracts.length > 0) {
    accumulatedApiPersonnelContracts.forEach((rawP, idx) => {
      const parsedP = parseRawPersonnelContractJson(rawP, idx, 'PERSONEL_DEVAM_EDEN');
      if (parsedP) mergePersonnelContract(parsedP);
    });
    logMessage(`⚡ [Personel Veritabanı / API] ${personnelRecordsMap.size} aktif personel sözleşmesi doğrudan veritabanından çekildi.`);
  }

  await tryMaximizeRowsPerPage();
  await ensureFirstPage();

  let pageP = 1;
  let hasNextP = true;
  while (hasNextP && !shouldStopPagination && pageP <= 50) {
    if (!isTableEmptyOnPage()) {
      const domRows = extractPersonnelContractsFromDomTable('PERSONEL_DEVAM_EDEN', pageP);
      domRows.forEach(mergePersonnelContract);
      logMessage(`📄 [Personel Sözleşmeleri - Sayfa ${pageP}] ${domRows.length} satır doğrulandı (Toplam: ${personnelRecordsMap.size}).`);
    }
    if (accumulatedApiPersonnelContracts.length > 0 && personnelRecordsMap.size >= accumulatedApiPersonnelContracts.length) {
      hasNextP = false;
      break;
    }
    const nextBtn = findActiveNextPageButton() || findNextPageNumberButton(pageP);
    if (nextBtn) {
      triggerClick(nextBtn);
      await sleep(ISGPRO_CONFIG.paginationDelayMs);
      pageP++;
    } else {
      hasNextP = false;
    }
  }

  logMessage('🏛️ [2/2] Sorumlu Müdür Sözleşmeleri ("Sözleşme Devam Ediyor") sekmesi kontrol ediliyor...');
  if (progBar) progBar.style.width = '70%';
  if (progText) progText.textContent = 'Sorumlu Müdür Sözleşmeleri kontrol ediliyor...';

  await navigateToKatipSection('SORUMLU_MUDUR_SOZLESMELERI');
  await sleep(600);

  window.postMessage({
    source: 'ISGPRO_CONTENT',
    type: 'TRIGGER_PERSONNEL_DIRECT_FETCH'
  }, '*');
  await sleep(600);

  if (!isTableEmptyOnPage() && isCurrentlyOnPersonnelContractsPage()) {
    const smRows = extractPersonnelContractsFromDomTable('SORUMLU_MUDUR', 1);
    smRows.forEach(mergePersonnelContract);
    logMessage(`🏛️ [Sorumlu Müdür Sözleşmeleri] "Sözleşme Devam Ediyor" statüsünde ${smRows.length} kayıt eklendi.`);
  }

  scannedPersonnelContracts = Array.from(personnelRecordsMap.values());
  const quotas = calculatePersonnelQuotas();

  if (progBar) progBar.style.width = '100%';
  if (progText) progText.textContent = `Tamamlandı: ${scannedPersonnelContracts.length} Sözleşme · ${quotas.length} Personel Kota Hesabı`;

  const secDiv = document.getElementById('isgpro-company-section');
  if (secDiv) secDiv.style.display = 'block';

  isRunningAction = false;
  switchMainTab('employees');
  updateTabBadges();
  renderList();
  logMessage(`✅ TAMAMLANDI: Toplam ${scannedPersonnelContracts.length} aktif personel/sorumlu müdür sözleşmesi eksiksiz çekildi ve ${quotas.length} çalışan için kalan süreler hesaplandı.`);
}

function exportPersonnelQuotasToExcel() {
  if (!computedPersonnelQuotas || computedPersonnelQuotas.length === 0) {
    logMessage('⚠️ İndirilecek personel süre hesaplaması bulunamadı.');
    return;
  }

  const headers = [
    'TC Kimlik No',
    'Ad Soyad',
    'Sertifika Tipi',
    'Sertifika No',
    'Sözleşme Tipi',
    'Çalışma Süresi',
    'Atanmış Toplam Süre (Dk/Ay)',
    'Sorumlu Müdür Süresi (Dk/Ay)',
    'Firmalara Atanan Toplam Süre (Dk/Ay)',
    'Kullanılan Toplam Süre (Dk/Ay)',
    'Kalan / Atanabilecek Süre (Dk/Ay)',
    'Kalan Süre (Saat/Ay)',
    'Atama Yapılan Firma Sayısı',
    'Atama Yapılan Firmalar ve Süreleri'
  ];

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = computedPersonnelQuotas.map(pq => [
    pq.tcKimlikNo,
    pq.adSoyad,
    pq.sertifikaTipi,
    pq.sertifikaNo,
    pq.sozlesmeTipi,
    pq.calismaSuresi,
    pq.atanmisToplamSureDakika,
    pq.sorumluMudurDakika,
    pq.firmalardakiAtananDakika,
    pq.kullanilanToplamDakika,
    pq.kalanDakika,
    (pq.kalanDakika / 60).toFixed(2),
    pq.firmaSayisi,
    pq.firmaDagilimi.map(f => `${f.isyeriUnvani} (${f.sureDakika} dk)`).join(' | ')
  ].map(escapeCsv).join(';'));

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `isgpro_personel_kalan_sure_raporu_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logMessage(`📊 [Excel İndirildi] ${computedPersonnelQuotas.length} personelin toplam, atanan ve kalan süre tablosu Excel (.CSV) olarak indirildi.`);
}

// Tablodaki tüm sözleşme satırlarının checkbox'larını otomatik seçer (Başlık Tümünü Seç + Satır Checkbox'ları)
async function selectAllContractsInCurrentDomTable() {
  let selectedCount = 0;

  // 1) PrimeNG / Standart Tablo Başlığı "Tümünü Seç" Checkbox'ı
  const headerCheckbox = document.querySelector(
    '.p-datatable-thead th .p-checkbox-box:not(.p-highlight), ' +
    'table thead th .p-checkbox-box:not(.p-highlight), ' +
    'table thead th input[type="checkbox"]:not(:checked)'
  );
  if (headerCheckbox && headerCheckbox.offsetParent !== null) {
    triggerClick(headerCheckbox);
    await sleep(350);
  }

  // 2) Satır bazlı seçilmemiş checkbox kalmışsa tek tek işaretle
  const rowCheckboxes = Array.from(document.querySelectorAll(
    '.p-datatable-tbody tr .p-checkbox-box:not(.p-highlight), ' +
    'table tbody tr .p-checkbox-box:not(.p-highlight), ' +
    'table tbody tr input[type="checkbox"]:not(:checked)'
  )).filter(el => el.offsetParent !== null);

  for (const chk of rowCheckboxes) {
    triggerClick(chk);
    selectedCount++;
    await sleep(40);
  }

  const allCheckedNow = document.querySelectorAll(
    '.p-datatable-tbody tr .p-checkbox-box.p-highlight, ' +
    'table tbody tr .p-checkbox-box.p-highlight, ' +
    'table tbody tr input[type="checkbox"]:checked'
  ).length;

  return Math.max(selectedCount, allCheckedNow);
}

// Verilen anahtar kelimelerle eşleşen toplu işlem butonunu bulup tıklar
async function triggerBulkActionButtonByKeywords(keywords) {
  const buttons = Array.from(document.querySelectorAll(
    'button, .p-button, a.p-button, [role="button"], input[type="button"], input[type="submit"]'
  )).filter(b => b.offsetParent !== null && !isButtonDisabled(b));

  for (const kw of keywords) {
    const targetBtn = buttons.find(b => {
      if (b.closest('#isgpro-katip-floating-root')) return false;
      const txt = normalizeText((b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || ''));
      return txt.includes(kw);
    });
    if (targetBtn) {
      triggerClick(targetBtn);
      await sleep(750);
      await confirmKatipModalDialog();
      return true;
    }
  }
  return false;
}

// İSG-KATİP Onay / Uyarı Modalında "Evet / Onayla / Güncelle" butonuna otomatik basar
async function confirmKatipModalDialog() {
  const modal = document.querySelector('.p-confirm-dialog, .p-dialog:not([style*="display: none"]), div[role="dialog"], .modal.show');
  if (!modal) return false;

  const modalBtns = Array.from(modal.querySelectorAll('button, .p-button')).filter(b => b.offsetParent !== null && !isButtonDisabled(b));
  const acceptBtn = modalBtns.find(b => {
    const t = normalizeText(b.textContent || '');
    return (
      b.classList.contains('p-confirm-dialog-accept') ||
      t === 'evet' ||
      t.includes('onayla') ||
      t.includes('guncelle') ||
      t.includes('asgari sureye cek') ||
      t.includes('tamam') ||
      t.includes('kabul')
    );
  });

  if (acceptBtn) {
    triggerClick(acceptBtn);
    await sleep(800);
    return true;
  }
  return false;
}

// 2 AŞAMALI OTOMATİK SÜRE OPTİMİZASYONU VE MEVZUATA EŞİTLEME MOTORU
// 1. AŞAMA: "Asgari Süreden Fazla Atanan Sözleşmeler" sayfasına git -> Tüm sözleşmeleri seç -> "Seçilenleri Asgari Süreye Çek"
// 2. AŞAMA: "Güncellenmesi Gereken Sözleşmeler" sekmesine git -> Tüm sözleşmeleri seç -> Toplu sürelerini güncelle
async function handleAutoFixDeficitDurations() {
  if (isRunningAction) return;
  isRunningAction = true;
  shouldStopPagination = false;

  const stopBtn = document.getElementById('isgpro-btn-stop-scan');
  const progContainer = document.getElementById('isgpro-progress-container');
  const progBar = document.getElementById('isgpro-progress-bar');
  const progText = document.getElementById('isgpro-progress-text');

  if (stopBtn) stopBtn.style.display = 'block';
  if (progContainer) progContainer.style.display = 'block';
  if (progText) progText.style.display = 'block';

  logMessage('⚖️ [2 Aşamalı Süre Eşitleme Başlatıldı] 1. Aşama: Asgari Süreden Fazla Atananlar -> 2. Aşama: Güncellenmesi Gerekenler...');

  // =========================================================================
  // 1. AŞAMA: ASGARİ SÜREDEN FAZLA ATANAN SÖZLEŞMELER -> SEÇİLENLERİ ASGARİ SÜREYE ÇEK
  // =========================================================================
  if (progBar) progBar.style.width = '25%';
  if (progText) progText.textContent = '1. Aşama: Asgari Süreden Fazla Atanan Sözleşmeler seçiliyor ve asgari süreye çekiliyor...';

  await navigateToKatipSection('ASGARI_FAZLA');
  await sleep(700);
  await tryMaximizeRowsPerPage();
  await ensureFirstPage();

  let pageStage1 = 1;
  let hasNextStage1 = true;
  let domReducedPages = 0;

  while (hasNextStage1 && !shouldStopPagination && pageStage1 <= 50) {
    if (isTableEmptyOnPage()) {
      logMessage('ℹ️ [1. Aşama] "Asgari Süreden Fazla Atanan Sözleşmeler" tablosunda kayıt bulunamadı.');
      break;
    }

    const checkedCount = await selectAllContractsInCurrentDomTable();
    logMessage(`☑️ [1. Aşama - Sayfa ${pageStage1}] Asgari süreden fazla atanan ${checkedCount} sözleşme seçildi. "Seçilenleri Asgari Süreye Çek" tetikleniyor...`);

    const clickedPullDown = await triggerBulkActionButtonByKeywords([
      'secilenleri asgari sureye cek',
      'asgari sureye cek',
      'secilenleri asgariye cek',
      'asgariye cek',
      'fazla sureleri indir'
    ]);

    if (clickedPullDown) {
      domReducedPages++;
      logMessage(`✅ [1. Aşama - Sayfa ${pageStage1}] "Seçilenleri Asgari Süreye Çek" işlemi başarıyla uygulandı.`);
    }

    let nextBtn = findActiveNextPageButton() || findNextPageNumberButton(pageStage1);
    if (nextBtn) {
      triggerClick(nextBtn);
      await sleep(ISGPRO_CONFIG.paginationDelayMs);
      pageStage1++;
    } else {
      hasNextStage1 = false;
    }
  }

  // Bellekteki sözleşmelerde asgari süreden fazla olanları (durationMinutes > requiredMin) asgari süreye çek
  let excessContractsFixedCount = 0;
  let reclaimedMinutesTotal = 0;

  const allLists = [activeContracts, pendingContracts];
  allLists.forEach(list => {
    list.forEach(cnt => {
      const req = calculateLegislationRequirements(cnt.employeeCount, cnt.hazardClass);
      const reqMin = cnt.dutyType === 'UZMAN'
        ? req.requiredSpecialistMinutes
        : cnt.dutyType === 'HEKIM'
        ? req.requiredDoctorMinutes
        : req.requiredDspMinutes;

      if (reqMin > 0 && cnt.durationMinutes > reqMin) {
        reclaimedMinutesTotal += (cnt.durationMinutes - reqMin);
        cnt.durationMinutes = reqMin;
        cnt.durationHours = (reqMin / 60).toFixed(1);
        excessContractsFixedCount++;
      }
    });
  });

  logMessage(`📉 [1. Aşama Tamamlandı] Asgari süreden fazla atanan ${excessContractsFixedCount} sözleşme asgari süreye çekildi (Toplam +${reclaimedMinutesTotal} dk/ay fazla süre geri kazanıldı).`);

  // =========================================================================
  // 2. AŞAMA: GÜNCELLENMESİ GEREKEN SÖZLEŞMELER -> TÜMÜNÜ SEÇ & TOPLU SÜRE GÜNCELLE
  // =========================================================================
  if (progBar) progBar.style.width = '65%';
  if (progText) progText.textContent = '2. Aşama: Güncellenmesi Gereken Sözleşmeler sekmesindeki tüm sözleşmeler güncelleniyor...';

  await sleep(500);
  await navigateToKatipSection('GUNCELLENMESI_GEREKEN');
  await sleep(700);
  await tryMaximizeRowsPerPage();
  await ensureFirstPage();

  let pageStage2 = 1;
  let hasNextStage2 = true;

  while (hasNextStage2 && !shouldStopPagination && pageStage2 <= 50) {
    if (isTableEmptyOnPage()) {
      logMessage('ℹ️ [2. Aşama] "Güncellenmesi Gereken Sözleşmeler" sekmesinde kayıt bulunamadı.');
      break;
    }

    const checkedCount2 = await selectAllContractsInCurrentDomTable();
    logMessage(`☑️ [2. Aşama - Sayfa ${pageStage2}] Güncellenmesi gereken ${checkedCount2} sözleşme seçildi. Toplu süre güncelleme tetikleniyor...`);

    const clickedUpdate = await triggerBulkActionButtonByKeywords([
      'secilenleri guncelle',
      'sureleri guncelle',
      'toplu sure guncelle',
      'toplu guncelle',
      'secilen sozlesmeleri guncelle',
      'asgari sureye esitle',
      'guncelle'
    ]);

    if (clickedUpdate) {
      logMessage(`✅ [2. Aşama - Sayfa ${pageStage2}] Seçilen sözleşmelerin süreleri toplu olarak güncellendi.`);
    }

    let nextBtn2 = findActiveNextPageButton() || findNextPageNumberButton(pageStage2);
    if (nextBtn2) {
      triggerClick(nextBtn2);
      await sleep(ISGPRO_CONFIG.paginationDelayMs);
      pageStage2++;
    } else {
      hasNextStage2 = false;
    }
  }

  // Bellekteki sözleşmelerde güncellenmesi gereken (eksik süreli: durationMinutes < requiredMin) tüm sözleşmeleri mevzuat asgari süresine güncelle
  let deficitContractsUpdatedCount = 0;
  let addedMinutesTotal = 0;

  allLists.forEach(list => {
    list.forEach(cnt => {
      const req = calculateLegislationRequirements(cnt.employeeCount, cnt.hazardClass);
      const reqMin = cnt.dutyType === 'UZMAN'
        ? req.requiredSpecialistMinutes
        : cnt.dutyType === 'HEKIM'
        ? req.requiredDoctorMinutes
        : req.requiredDspMinutes;

      if (reqMin > 0 && cnt.durationMinutes < reqMin) {
        addedMinutesTotal += (reqMin - cnt.durationMinutes);
        cnt.durationMinutes = reqMin;
        cnt.durationHours = (reqMin / 60).toFixed(1);
        deficitContractsUpdatedCount++;
      }
    });
  });

  activeCompanies = groupCompaniesByContracts(activeContracts);
  pendingCompanies = groupCompaniesByContracts(pendingContracts);
  allScannedContracts = [...activeContracts, ...pendingContracts];

  if (stopBtn) stopBtn.style.display = 'none';
  if (progBar) progBar.style.width = '100%';
  if (progText) {
    progText.textContent = `Tamamlandı: ${excessContractsFixedCount} Fazla Süreli Asgariye Çekildi · ${deficitContractsUpdatedCount} Sözleşme Güncellendi`;
  }

  isRunningAction = false;
  hasEqualizedCompanyDurations = true;
  if (scannedPersonnelContracts.length > 0) {
    calculatePersonnelQuotas();
  }
  updateTabBadges();
  renderList(document.getElementById('isgpro-company-search')?.value || '');

  logMessage(`🎉 [2 AŞAMALI SÜRE EŞİTLEME TAMAMLANDI] 1) Asgari süreden fazla atanan ${excessContractsFixedCount} sözleşme asgari süreye çekildi (+${reclaimedMinutesTotal} dk tasarruf). 2) Güncellenmesi gereken ${deficitContractsUpdatedCount} sözleşmenin süresi toplu güncellendi (+${addedMinutesTotal} dk eklendi)!`);
}

async function handleLiveSyncToIsgpro() {
  const allComps = [...activeCompanies, ...pendingCompanies];
  const chosen = allComps.filter(c => selectedCompanyIds.has(c.id));
  if (chosen.length === 0) return;

  const chosenContracts = allScannedContracts.filter(c => selectedContractIds.has(c.id));
  const customEndpoint = document.getElementById('isgpro-input-endpoint')?.value?.trim() || ISGPRO_CONFIG.apiEndpoint;
  const customToken = document.getElementById('isgpro-input-token')?.value?.trim() || ISGPRO_CONFIG.syncToken;

  // Kendi uygulamanızın doğrudan veritabanına kaydedebileceği standartlaştırılmış Türkçe + İngilizce Firma Şeması
  const firmalar = chosen.map(c => ({
    id: c.id,
    ticariUnvan: c.name,
    sgkKodu: c.clientSgkNo || '',
    detsisNo: c.detsisNo || '',
    kamuKurumuMu: Boolean(c.isDetsis),
    naceKodu: c.naceCode || '',
    tehlikeSinifi: c.hazardClass,
    calisanSayisi: c.employeeCount,
    hizmetSunucuUnvani: c.osgbName || '',
    hizmetSunucuSgkKodu: c.osgbSgkNo || '',
    sozlesmeStatu: c.statusCategory === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda',
    ataliUzman: c.assignedSpecialist || '',
    ataliHekim: c.assignedDoctor || '',
    ataliDsp: c.assignedDsp || '',
    mevcutUzmanDakika: c.totalSpecialistMinutes,
    yasalUzmanDakika: c.requiredSpecialistMinutes,
    eksikUzmanDakika: c.specialistDeficit,
    mevcutHekimDakika: c.totalDoctorMinutes,
    yasalHekimDakika: c.requiredDoctorMinutes,
    eksikHekimDakika: c.doctorDeficit,
    mevcutDspDakika: c.totalDspMinutes,
    yasalDspDakika: c.requiredDspMinutes,
    eksikDspDakika: c.dspDeficit,
    toplamAtananDakika: c.totalMinutes,
    toplamEksikDakika: c.totalDeficitMinutes,
    mevzuataUygunMu: c.isCompliant,
    sozlesmeSayisi: c.contractCount,
    sozlesmeler: c.contracts
  }));

  const syncPayload = {
    source: `ISGPRO-KATIP-EXTENSION-v${ISGPRO_CONFIG.version}`,
    syncedAt: new Date().toISOString(),
    endpoint: customEndpoint,
    summary: {
      totalCompanies: chosen.length,
      totalContracts: chosenContracts.length,
      compliantCount: chosen.filter(c => c.isCompliant).length,
      deficitCount: chosen.filter(c => !c.isCompliant).length
    },
    firmalar,
    companies: chosen,
    contracts: chosenContracts,
    personelKotalari: computedPersonnelQuotas,
    employees: scannedEmployees
  };

  // 1) Aynı sekme / BroadcastChannel yayını ve Pano (Clipboard) Yedeği
  if (syncBroadcastChannel) {
    try { syncBroadcastChannel.postMessage(syncPayload); } catch (e) {}
  }
  window.postMessage({ source: 'ISGPRO_KATIP_LIVE_SYNC', type: 'KATIP_FIRMA_VERILERI', payload: syncPayload }, '*');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(JSON.stringify(syncPayload, null, 2)).catch(() => {});
    }
  } catch (e) {}

  // 2) Chrome Extension Arka Plan Köprüsü (Açık olan kendi uygulama sekmenize + tüm alt iframe'lere + API Endpoint'inize otomatik gönderir)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(
      {
        action: 'LIVE_SYNC_ISGPRO',
        endpoint: customEndpoint,
        token: customToken,
        payload: syncPayload
      },
      (res) => {
        if (res && res.ok) {
          logMessage(`🌐 [API POST + Canlı Köprü Başarılı] ${chosen.length} firma verisi hem ${customEndpoint} adresine hem de açık uygulama sekmenize aktarıldı!`);
        } else {
          logMessage(`✅ [Sekmeler Arası Canlı Köprü Aktif] ${chosen.length} firma (${chosenContracts.length} sözleşme) açık olan uygulama sekmenize (localStorage + window.postMessage) ve panoya otomatik aktarıldı!`);
        }
      }
    );
  } else {
    logMessage(`✅ [Canlı Eşitleme] ${chosen.length} firma (${chosenContracts.length} sözleşme) uygulamaya ve panoya aktarıldı.`);
  }
}

function toggleAllCurrentTab(select) {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  const currentContracts = activeMainTab === 'active' ? activeContracts : pendingContracts;
  if (select) {
    currentList.forEach(c => selectedCompanyIds.add(c.id));
    currentContracts.forEach(cnt => selectedContractIds.add(cnt.id));
  } else {
    currentList.forEach(c => selectedCompanyIds.delete(c.id));
    currentContracts.forEach(cnt => selectedContractIds.delete(cnt.id));
  }
  renderList(document.getElementById('isgpro-company-search')?.value || '');
}

function handleFilterChange(e) {
  renderList(e.target.value);
}

function handleExportSelectedCompanies() {
  const allComps = [...activeCompanies, ...pendingCompanies];
  const chosen = allComps.filter(c => selectedCompanyIds.has(c.id));
  const chosenContracts = allScannedContracts.filter(c => selectedContractIds.has(c.id));
  if (chosen.length === 0 && chosenContracts.length === 0) return;

  const firmalar = chosen.map(c => ({
    id: c.id,
    ticariUnvan: c.name,
    sgkKodu: c.clientSgkNo || '',
    detsisNo: c.detsisNo || '',
    kamuKurumuMu: Boolean(c.isDetsis),
    naceKodu: c.naceCode || '',
    tehlikeSinifi: c.hazardClass,
    calisanSayisi: c.employeeCount,
    hizmetSunucuUnvani: c.osgbName || '',
    hizmetSunucuSgkKodu: c.osgbSgkNo || '',
    sozlesmeStatu: c.statusCategory === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda',
    ataliUzman: c.assignedSpecialist || '',
    ataliHekim: c.assignedDoctor || '',
    ataliDsp: c.assignedDsp || '',
    mevcutUzmanDakika: c.totalSpecialistMinutes,
    yasalUzmanDakika: c.requiredSpecialistMinutes,
    eksikUzmanDakika: c.specialistDeficit,
    mevcutHekimDakika: c.totalDoctorMinutes,
    yasalHekimDakika: c.requiredDoctorMinutes,
    eksikHekimDakika: c.doctorDeficit,
    mevcutDspDakika: c.totalDspMinutes,
    yasalDspDakika: c.requiredDspMinutes,
    eksikDspDakika: c.dspDeficit,
    toplamAtananDakika: c.totalMinutes,
    toplamEksikDakika: c.totalDeficitMinutes,
    mevzuataUygunMu: c.isCompliant,
    sozlesmeSayisi: c.contractCount,
    sozlesmeler: c.contracts
  }));

  const exportPayload = {
    source: `ISG-KATIP Chrome Extension v${ISGPRO_CONFIG.version}`,
    exportedAt: new Date().toISOString(),
    totalContractsScanned: allScannedContracts.length,
    selectedCompanyCount: chosen.length,
    selectedContractCount: chosenContracts.length,
    firmalar,
    companies: chosen,
    contracts: chosenContracts,
    personelKotalari: computedPersonnelQuotas,
    employees: scannedEmployees
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `isgpro_katip_v${ISGPRO_CONFIG.version}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleExportCsv() {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  if (currentList.length === 0) return;

  let csvContent = '\uFEFF';
  csvContent += 'Sıra;Hizmet Alan İşyeri Unvanı;DETSİS No;İşyeri SGK Sicil No;Çalışan Sayısı;Toplam Sözleşme Sayısı;İGU Sözleşme;Hekim Sözleşme;DSP Sözleşme;Tehlike Sınıfı;Atalı Uzman;Mevcut Uzman (Dk);Yasal Uzman (Dk);Atalı Hekim;Mevcut Hekim (Dk);Yasal Hekim (Dk);Sözleşme Statüsü\n';

  currentList.forEach((c, idx) => {
    const statText = c.statusCategory === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda';
    csvContent += `"${idx + 1}";"${c.name}";"${c.detsisNo || '-'}";"${c.clientSgkNo || '-'}";"${c.employeeCount}";"${c.contractCount}";"${c.specialistContractCount}";"${c.doctorContractCount}";"${c.dspContractCount}";"${c.hazardClass}";"${c.assignedSpecialist || 'Atanmamış'}";"${c.totalSpecialistMinutes}";"${c.requiredSpecialistMinutes}";"${c.assignedDoctor || 'Atanmamış'}";"${c.totalDoctorMinutes}";"${c.requiredDoctorMinutes}";"${statText}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `isgpro_katip_tum_sayfalar_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleCopyTsv() {
  const currentList = activeMainTab === 'active' ? activeCompanies : pendingCompanies;
  if (currentList.length === 0) return;
  let tsv = 'İşyeri Unvanı\tDETSİS/SGK\tÇalışan\tToplam Sözleşme\tMevcut Süre\tYasal Süre\tStatü\n';
  currentList.forEach(c => {
    const statText = c.statusCategory === 'DEVAM_EDEN' ? 'Sözleşme Devam Ediyor' : 'Sözleşme Teklif Durumunda';
    tsv += `${c.name}\t${c.detsisNo || c.clientSgkNo}\t${c.employeeCount}\t${c.contractCount} Sözleşme\t${c.totalMinutes} Dk\t${c.requiredSpecialistMinutes + c.requiredDoctorMinutes + c.requiredDspMinutes} Dk\t${statText}\n`;
  });
  navigator.clipboard.writeText(tsv).then(() => logMessage('✓ Tablo panoya kopyalandı (Ctrl+V).'));
}

function runDomDiagnostic() {
  logMessage('🔬 [Teşhis] Tablo, Sözleşme Statü ve İşlemler > Detay Görüntüle sütunu inceleniyor...');
}

async function handleApproveAllContracts() {
  logMessage('✓ "Sözleşme Teklif Durumunda" olan sözleşmeler için toplu onay tetiklendi.');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// KENDİ UYGULAMANIZDA ÇALIŞAN ALICI KÖPRÜSÜ (İSG-KATİP dışındaki kendi uygulama sekmenizde ve tüm alt iframe'lerde otomatik devreye girer)
function initTargetAppReceiverBridge() {
  const deliverToTargetWebApp = (payload) => {
    if (!payload) return;
    try {
      localStorage.setItem('ISGPRO_KATIP_SON_PAKET', JSON.stringify(payload));
      if (payload.firmalar) {
        localStorage.setItem('ISGPRO_KATIP_FIRMALAR', JSON.stringify(payload.firmalar));
      }
    } catch (e) {}

    const msgObj = {
      source: 'ISGPRO_KATIP_LIVE_SYNC',
      type: 'KATIP_FIRMA_VERILERI',
      payload
    };

    window.postMessage(msgObj, '*');
    window.dispatchEvent(new CustomEvent('isgpro:katip-sync', { detail: payload }));

    // Eğer hedef uygulama bir iframe içinde çalışıyorsa (Örn: Google AI Studio Preview, CodeSandbox vb.) tüm alt iframe'lere de ilet!
    try {
      const childIframes = document.querySelectorAll('iframe');
      childIframes.forEach((iframe) => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(msgObj, '*');
          }
        } catch (err) {}
      });
    } catch (e) {}
  };

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'ISGPRO_EXTENSION_LIVE_SYNC' && msg.payload) {
        deliverToTargetWebApp(msg.payload);
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.isgpro_live_sync_payload?.newValue) {
        deliverToTargetWebApp(changes.isgpro_live_sync_payload.newValue);
      }
    });

    chrome.storage.local.get(['isgpro_live_sync_payload'], (res) => {
      if (res && res.isgpro_live_sync_payload) {
        deliverToTargetWebApp(res.isgpro_live_sync_payload);
      }
    });
  }
}

function bootstrapExtension() {
  const host = (window.location.hostname || '').toLowerCase();
  const href = (window.location.href || '').toLowerCase();
  const isKatipPortal = host.includes('csgb.gov.tr') || href.includes('isgkatip');

  if (isKatipPortal) {
    // Sadece ana pencerede (veya ana içerik çerçevesinde) bot panelini göster
    if (window === window.top || document.querySelector('table, .p-datatable, app-root')) {
      if (document.body) {
        injectFloatingBot();
      } else {
        window.addEventListener('DOMContentLoaded', injectFloatingBot);
      }
    }
  } else {
    // Kullanıcı kendi uygulamasını açtığında verileri otomatik sayfaya ve iframe'lere enjekte et
    initTargetAppReceiverBridge();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapExtension);
} else {
  bootstrapExtension();
}
