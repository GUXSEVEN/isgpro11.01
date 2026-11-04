// injected.js - İSGPRO Katip Asistanı Sayfa İçi API & Network Dinleyicisi (MAIN World)
// İSG-KATİP Bakanlık REST API / XHR / Fetch İsteklerini Doğrudan Yakalar & Orijinal JSON Verisini Çeker
(function() {
  if (window.__isgproInjectedLoaded) return;
  window.__isgproInjectedLoaded = true;

  console.log('[İSGPRO Injected] Sistem API Dinleyici Devreye Girdi.');

  let lastAuthHeader = '';
  let lastContractEndpoint = null;
  let cachedContractsByMode = {
    DEVAM_EDEN: [],
    ONAY_BEKLEYEN: []
  };

  // 1. Gelen Verinin Sözleşme Listesi Olup Olmadığını Kontrol Et
  function extractContractsArray(data) {
    if (!data) return null;

    // Eğer doğrudan dizi ise
    if (Array.isArray(data)) {
      if (data.length > 0 && isContractObject(data[0])) return data;
      return null;
    }

    // Eğer sarmalayıcı nesne ise ({ data: [...], content: [...], items: [...], result: [...] })
    const candidateKeys = ['data', 'content', 'items', 'result', 'list', 'sozlesmeler', 'records', 'value'];
    for (const k of candidateKeys) {
      if (Array.isArray(data[k]) && data[k].length > 0 && isContractObject(data[k][0])) {
        return data[k];
      }
    }

    // İç içe arama
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        for (const subK of candidateKeys) {
          if (Array.isArray(data[key][subK]) && data[key][subK].length > 0 && isContractObject(data[key][subK][0])) {
            return data[key][subK];
          }
        }
      }
    }

    return null;
  }

  function isContractObject(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const str = JSON.stringify(obj).toLowerCase();
    // Sözleşme nesnesine özgü anahtar kelimeler
    const hasContractSigns = str.includes('sozlesme') || str.includes('surec') || str.includes('hizmet') || str.includes('calisan') || str.includes('sigortali') || str.includes('detsis') || str.includes('sicil');
    return hasContractSigns;
  }

  // 2. Sözleşme Verisini Yakalama & Content Script'e Gönderme
  function handlePotentialContractResponse(url, data, requestInfo) {
    try {
      const items = extractContractsArray(data);
      if (items && items.length > 0) {
        console.log(`[İSGPRO Injected] 🎯 ${items.length} adet sözleşme API yanıtından doğrudan yakalandı! URL:`, url);

        // İstek bilgisini sakla (Direct Fetch için)
        if (requestInfo) {
          lastContractEndpoint = {
            url,
            method: requestInfo.method || 'GET',
            headers: requestInfo.headers || {},
            body: requestInfo.body || null
          };
        }

        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_API_CONTRACTS',
          url,
          totalCount: items.length,
          contracts: items
        }, '*');
      } else if (Array.isArray(data) && data.length === 0) {
        // Boş liste yakalandı (örn: Onay bekleyen sözleşme yok)
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('onay') || lowerUrl.includes('pending') || lowerUrl.includes('sozlesme')) {
          console.log('[İSGPRO Injected] ℹ️ Boş sözleşme listesi (0 kayıt) yakalandı. URL:', url);
          window.postMessage({
            source: 'ISGPRO_INJECTED',
            type: 'KATIP_API_EMPTY_CONTRACTS',
            url
          }, '*');
        }
      }
    } catch (e) {
      console.warn('[İSGPRO Injected] Veri işleme hatası:', e);
    }
  }

  // 3. FETCH MONKEY-PATCH
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const resource = args[0];
    const config = args[1] || {};
    const url = typeof resource === 'string' ? resource : (resource ? resource.url : '');

    // Header ve Auth yakalama
    try {
      if (config.headers) {
        let authVal = '';
        if (typeof config.headers.get === 'function') {
          authVal = config.headers.get('Authorization') || config.headers.get('authorization');
        } else if (typeof config.headers === 'object') {
          authVal = config.headers['Authorization'] || config.headers['authorization'];
        }
        if (authVal) lastAuthHeader = authVal;
      }
    } catch (e) {}

    const response = await originalFetch.apply(this, args);

    try {
      const clone = response.clone();
      const contentType = clone.headers.get('content-type') || '';
      if (contentType.includes('json') || (url && (url.includes('/api/') || url.includes('sozlesme') || url.includes('surec')))) {
        clone.json().then(data => {
          handlePotentialContractResponse(url, data, {
            method: config.method || 'GET',
            headers: config.headers,
            body: config.body
          });
        }).catch(() => {});
      }
    } catch (e) {}

    return response;
  };

  // 4. XHR (XMLHttpRequest) MONKEY-PATCH
  const origOpen = XMLHttpRequest.prototype.open;
  const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._isgproUrl = url;
    this._isgproMethod = method;
    this._isgproHeaders = {};
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (!this._isgproHeaders) this._isgproHeaders = {};
    this._isgproHeaders[header] = value;
    if (header.toLowerCase() === 'authorization') {
      lastAuthHeader = value;
    }
    return origSetRequestHeader.apply(this, [header, value]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this._isgproBody = body;
    this.addEventListener('load', function() {
      try {
        const ct = this.getResponseHeader('content-type') || '';
        const url = this._isgproUrl || '';
        if (ct.includes('json') || (url && (url.includes('/api/') || url.includes('sozlesme') || url.includes('surec')))) {
          if (this.responseText && (this.responseText.startsWith('{') || this.responseText.startsWith('['))) {
            const data = JSON.parse(this.responseText);
            handlePotentialContractResponse(url, data, {
              method: this._isgproMethod,
              headers: this._isgproHeaders,
              body: this._isgproBody
            });
          }
        }
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };

  // 5. DOĞRUDAN API & ANGULAR HAFIZASINDAN VERİ OKUMA (TÜM SAYFALARI TEK SEFERDE ÇEKME)
  function readContractsFromAngularMemory() {
    try {
      // 1. PrimeNG p-table bileşenleri
      const tables = document.querySelectorAll('p-table, .p-datatable');
      for (const t of tables) {
        if (window.ng && typeof window.ng.getComponent === 'function') {
          const comp = window.ng.getComponent(t);
          if (comp) {
            const rawVal = comp.value || comp._value || comp.data || comp._data;
            if (Array.isArray(rawVal) && rawVal.length > 0 && isContractObject(rawVal[0])) {
              console.log(`[İSGPRO Injected] 🎯 Angular Component (p-table) üzerinden ${rawVal.length} sözleşme doğrudan RAM'den çekildi!`);
              return rawVal;
            }
          }
        }
      }

      // 2. Global nesneler ve ng context
      if (typeof window.getAllAngularRootElements === 'function') {
        const roots = window.getAllAngularRootElements();
        for (const r of roots) {
          if (window.ng && typeof window.ng.getContext === 'function') {
            const ctx = window.ng.getContext(r);
            if (ctx) {
              for (const k of Object.keys(ctx)) {
                if (Array.isArray(ctx[k]) && ctx[k].length > 0 && isContractObject(ctx[k][0])) {
                  return ctx[k];
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[İSGPRO Injected] Angular memory okuma hatası:', e);
    }
    return null;
  }

  async function performDirectFetchAll(mode) {
    // Önce Angular bileşen hafızasına bak
    const memContracts = readContractsFromAngularMemory();
    if (memContracts && memContracts.length > 0) {
      window.postMessage({
        source: 'ISGPRO_INJECTED',
        type: 'KATIP_DIRECT_FETCH_SUCCESS',
        mode,
        contracts: memContracts
      }, '*');
      return;
    }

    if (!lastContractEndpoint || !lastContractEndpoint.url) {
      console.log('[İSGPRO Injected] Henüz yakalanmış bir API uç noktası yok.');
      window.postMessage({
        source: 'ISGPRO_INJECTED',
        type: 'KATIP_DIRECT_FETCH_FAILED',
        reason: 'NO_ENDPOINT_CAPTURED'
      }, '*');
      return;
    }

    try {
      let targetUrl = lastContractEndpoint.url;

      // Sayfa boyutu parametrelerini maksimuma çıkar (Örn: size=1000, pageSize=1000, rows=1000)
      if (targetUrl.includes('size=')) {
        targetUrl = targetUrl.replace(/size=\d+/, 'size=1000');
      } else if (targetUrl.includes('pageSize=')) {
        targetUrl = targetUrl.replace(/pageSize=\d+/, 'pageSize=1000');
      } else if (targetUrl.includes('rows=')) {
        targetUrl = targetUrl.replace(/rows=\d+/, 'rows=1000');
      } else {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'size=1000&pageSize=1000&rows=1000';
      }

      // Sayfa numarasını 0 veya 1 yap
      targetUrl = targetUrl.replace(/page=\d+/, 'page=0').replace(/pageIndex=\d+/, 'pageIndex=0');

      console.log(`[İSGPRO Injected] 🚀 Doğrudan API çağrısı yapılıyor: ${targetUrl}`);

      const headers = Object.assign({}, lastContractEndpoint.headers);
      if (lastAuthHeader && !headers['Authorization'] && !headers['authorization']) {
        headers['Authorization'] = lastAuthHeader;
      }

      const res = await originalFetch(targetUrl, {
        method: lastContractEndpoint.method || 'GET',
        headers: headers,
        body: lastContractEndpoint.body
      });

      if (res.ok) {
        const data = await res.json();
        const items = extractContractsArray(data);
        if (items) {
          console.log(`[İSGPRO Injected] 🎉 Doğrudan API'den ${items.length} sözleşme tek seferde çekildi!`);
          window.postMessage({
            source: 'ISGPRO_INJECTED',
            type: 'KATIP_DIRECT_FETCH_SUCCESS',
            mode,
            contracts: items
          }, '*');
          return;
        }
      }
    } catch (err) {
      console.warn('[İSGPRO Injected] Direct fetch hatası:', err);
    }

    window.postMessage({
      source: 'ISGPRO_INJECTED',
      type: 'KATIP_DIRECT_FETCH_FAILED',
      reason: 'FETCH_ERROR'
    }, '*');
  }

  // 6. CONTENT SCRIPT'TEN GELEN MESAJLARI DİNLE
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'ISGPRO_CONTENT') return;

    if (event.data.type === 'TRIGGER_DIRECT_FETCH') {
      performDirectFetchAll(event.data.mode || 'DEVAM_EDEN');
    }
  });

  console.log('[İSGPRO Injected] Hazır ve dinliyor.');
})();
