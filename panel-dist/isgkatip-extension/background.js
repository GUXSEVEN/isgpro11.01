// background.js - İSGPRO İSG-KATİP Asistanı Service Worker
console.log('İSGPRO İSG-KATİP Arka Plan Servisi devrede.');

// Mesaj dinleyici
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'DOWNLOAD_FILE') {
    handleDownloadFile(message.payload, sendResponse);
    return true; // Asenkron yanıt için
  }

  if (message.action === 'SAVE_KATIP_DATA') {
    chrome.storage.local.set({ lastKatipData: message.payload }, () => {
      sendResponse({ success: true, message: 'Veriler eklenti belleğine kaydedildi.' });
    });
    return true;
  }

  if (message.action === 'GET_KATIP_DATA') {
    chrome.storage.local.get(['lastKatipData'], (result) => {
      sendResponse({ success: true, data: result.lastKatipData || null });
    });
    return true;
  }
});

// Güvenli ve sıralı dosya indirme yöneticisi
async function handleDownloadFile({ url, filename }, sendResponse) {
  try {
    chrome.downloads.download({
      url: url,
      filename: filename || 'isg_katip_belge.pdf',
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('İndirme hatası:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}
