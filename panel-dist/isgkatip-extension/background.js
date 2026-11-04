// background.js - İSGPRO İSG-KATİP Manifest V3 Service Worker (v5.5.0)
// İSG-KATİP Sekmesi ile Kendi Uygulamanız Arasında Canlı Veri Aktarım Köprüsü (Sekmeler Arası + Iframe + REST API POST)

const DEFAULT_SYNC_ENDPOINT = 'https://app.isgpro.com.tr/api/v1/katip/live-sync';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[İSGPRO Background v5.5.0] Otomatik Firma Aktarım Köprüsü hazır.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  if (message.action === 'SAVE_KATIP_DATA') {
    chrome.storage.local.set({
      isgpro_last_export: message.payload,
      isgpro_live_sync_payload: message.payload,
      isgpro_updated_at: new Date().toISOString()
    }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.action === 'LIVE_SYNC_ISGPRO') {
    const endpoint = message.endpoint || DEFAULT_SYNC_ENDPOINT;
    const token = message.token || 'ISGPRO-LIVE-SYNC-2026-TOKEN';
    const payload = message.payload;

    // 1) Chrome yerel depolamaya kaydet (Açık olan tüm uygulama sekmeleri ve iframe'ler storage.onChanged ile anında yakalar)
    chrome.storage.local.set({
      isgpro_live_sync_payload: payload,
      isgpro_last_sync_time: new Date().toISOString()
    });

    // 2) Tarayıcıda açık olan kendi uygulama sekmelerinize doğrudan mesaj gönder
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && (!tab.url || !tab.url.includes('csgb.gov.tr'))) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ISGPRO_EXTENSION_LIVE_SYNC',
            payload
          }).catch(() => {});
        }
      });
    });

    // 3) Kendi uygulamanızın Backend API / Webhook adresine HTTP POST isteği at
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-ISGPRO-Extension-Version': '5.5.0'
      },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        sendResponse({ ok: res.ok, status: res.status, data, bridgeDelivered: true });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message, fallbackSavedToLocal: true, bridgeDelivered: true });
      });

    return true;
  }

  return false;
});
