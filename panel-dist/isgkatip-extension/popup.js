// popup.js - İSGPRO Katip Asistanı Popup Kontrolcüsü (v2.0 Seçimli)
document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('tab-status');
  const summaryEl = document.getElementById('data-summary');

  const btnScan = document.getElementById('btn-scan');
  const btnApprove = document.getElementById('btn-approve');
  const btnDownload = document.getElementById('btn-download');
  const btnExport = document.getElementById('btn-export-json');

  // Aktif sekmeyi bul
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isKatipTab = tab && tab.url && (tab.url.includes('csgb.gov.tr') || tab.url.includes('isgkatip'));

  if (isKatipTab) {
    statusBadge.textContent = 'İSG-KATİP Bağlı';
    statusBadge.className = 'status-badge connected';
  } else {
    statusBadge.textContent = 'KATİP Sekmesi Değil';
    statusBadge.className = 'status-badge disconnected';
  }

  // Kayıtlı veriyi yükle
  chrome.storage.local.get(['lastKatipData'], (result) => {
    if (result.lastKatipData) {
      const { companies, company, selectedCount } = result.lastKatipData;
      const compList = companies || (company ? [company] : []);
      if (compList.length > 0) {
        summaryEl.innerHTML = `
          <strong>${selectedCount || compList.length} Firma Seçildi</strong><br/>
          <span style="font-size:10.5px;color:#64748b;">${compList.slice(0, 2).map(c => c.name).join(', ')}${compList.length > 2 ? '...' : ''}</span>
        `;
      }
    }
  });

  // Buton Eylemleri
  btnScan.addEventListener('click', () => {
    if (!isKatipTab) {
      alert('Lütfen önce açık olan İSG-KATİP sekmesine geçiniz veya sayfayı açınız.');
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const toggleBtn = document.getElementById('isgpro-katip-toggle-btn');
        const panel = document.getElementById('isgpro-katip-panel');
        if (panel && !panel.classList.contains('active')) {
          panel.classList.add('active');
        }
        const scanBtn = document.getElementById('isgpro-btn-scan');
        if (scanBtn) scanBtn.click();
        else alert('İSG-KATİP sayfası henüz tam yüklenmedi.');
      }
    });
    window.close();
  });

  btnApprove.addEventListener('click', () => {
    if (!isKatipTab) {
      alert('Lütfen önce açık olan İSG-KATİP sekmesine geçiniz.');
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const approveBtn = document.getElementById('isgpro-btn-approve-all');
        if (approveBtn) approveBtn.click();
        else alert('İSG-KATİP sayfası henüz tam yüklenmedi.');
      }
    });
    window.close();
  });

  btnDownload.addEventListener('click', () => {
    if (!isKatipTab) {
      alert('Lütfen önce açık olan İSG-KATİP sekmesine geçiniz.');
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const dlBtn = document.getElementById('isgpro-btn-download-all');
        if (dlBtn) dlBtn.click();
        else alert('İSG-KATİP sayfası henüz tam yüklenmedi.');
      }
    });
    window.close();
  });

  btnExport.addEventListener('click', () => {
    chrome.storage.local.get(['lastKatipData'], (result) => {
      if (!result.lastKatipData) {
        alert('Henüz çekilmiş veri bulunamadı. Lütfen önce İSG-KATİP sayfasındayken "Firmaları Tara & Seç" butonunu kullanınız.');
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result.lastKatipData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `isgpro_katip_firmalar_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  });
});
