// injected.js - İSGPRO Katip Asistanı Sayfa İçi API & Network Dinleyicisi (MAIN World - v5.5.2)
// İSG-KATİP Bakanlık REST API / XHR / Fetch İsteklerini Doğrudan Yakalar & Orijinal JSON Verisini Çeker
// + Çoklu Sayfa (Örn: Sayfa 1: 100 + Sayfa 2: 74 = 174 Sözleşme) Otomatik Birleştirici
// + "Sözleşme Devam Ediyor" ve "Sözleşme Teklif Durumunda" Statü Doğrulayıcı
// + İşlemler > Detay Görüntüle API & PDF / Detay Verisi Yakalayıcı
(function() {
  if (window.__isgproInjectedLoaded) return;
  window.__isgproInjectedLoaded = true;

  console.log('[İSGPRO Injected v5.5.2] Sistem API, Çoklu Sayfa, Statü & Detay Görüntüle Dinleyici Devrede.');

  let lastAuthHeader = '';
  let lastContractEndpoint = null;
  let lastPersonnelContractEndpoint = null;
  let lastEmployeeEndpoint = null;
  let cachedEmployees = [];
  let capturedContractDetailsByProcessId = {};

  function isPersonnelContractObject(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const str = JSON.stringify(obj).toLowerCase();
    const hasClientFields =
      str.includes('hizmetalansgk') ||
      str.includes('hizmetalanisyeri') ||
      str.includes('isyeriunvan') ||
      str.includes('detsis') ||
      str.includes('nacekodu') ||
      str.includes('calisansayisi') ||
      str.includes('sigortalisayisi');
    if (hasClientFields) return false;

    const hasPersonnelCertOrDuration =
      str.includes('sertifikano') ||
      str.includes('sertifikatipi') ||
      str.includes('belgeno') ||
      str.includes('atanansure') ||
      str.includes('calismasuresi') ||
      str.includes('sorumlumudur') ||
      str.includes('icgorevlendirme');
    const hasPersonIdentity =
      str.includes('tckimlik') ||
      str.includes('kimlikno') ||
      str.includes('adsoyad') ||
      str.includes('kisi') ||
      str.includes('personel');
    return hasPersonnelCertOrDuration && hasPersonIdentity;
  }

  function isServiceContractObject(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (isPersonnelContractObject(obj)) return false;
    const str = JSON.stringify(obj).toLowerCase();
    const hasContractSigns =
      str.includes('sozlesme') ||
      str.includes('surec') ||
      str.includes('hizmet') ||
      str.includes('calisan') ||
      str.includes('sigortali') ||
      str.includes('detsis') ||
      str.includes('sicil') ||
      str.includes('isyeri') ||
      str.includes('unvan');
    return hasContractSigns;
  }

  function isContractObject(obj) {
    return isServiceContractObject(obj);
  }

  // 1. Gelen Verinin Hizmet Sözleşmesi Listesi Olup Olmadığını Kontrol Et
  function extractContractsArray(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
      if (data.length > 0 && isServiceContractObject(data[0])) return data;
      return null;
    }

    const candidateKeys = ['data', 'content', 'items', 'result', 'list', 'sozlesmeler', 'records', 'value', 'rows'];
    for (const k of candidateKeys) {
      if (Array.isArray(data[k]) && data[k].length > 0 && isServiceContractObject(data[k][0])) {
        return data[k];
      }
    }

    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        for (const subK of candidateKeys) {
          if (Array.isArray(data[key][subK]) && data[key][subK].length > 0 && isServiceContractObject(data[key][subK][0])) {
            return data[key][subK];
          }
        }
      }
    }

    return null;
  }

  // Tekil Sözleşme Detay Yanıtı Kontrolü (İşlemler > Detay Görüntüle tıklandığında dönen veri)
  function extractSingleContractDetail(url, data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const payload = data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : (data.result && typeof data.result === 'object' && !Array.isArray(data.result) ? data.result : data);
    if (!payload || Array.isArray(payload)) return null;

    const lowerUrl = (url || '').toLowerCase();
    const isDetailUrl = lowerUrl.includes('detay') || lowerUrl.includes('detail') || lowerUrl.includes('goruntule') || lowerUrl.includes('sozlesme/') || lowerUrl.includes('surec/');
    if (isDetailUrl && (isServiceContractObject(payload) || isPersonnelContractObject(payload))) {
      return payload;
    }
    return null;
  }

  function extractTotalElementsCount(data) {
    if (!data || typeof data !== 'object') return null;
    const keys = ['totalElements', 'totalRecords', 'totalCount', 'total', 'count', 'recordsTotal'];
    for (const k of keys) {
      if (typeof data[k] === 'number' && data[k] >= 0) return data[k];
      if (data.data && typeof data.data[k] === 'number') return data.data[k];
      if (data.result && typeof data.result[k] === 'number') return data.result[k];
    }
    return null;
  }

  function extractEmployeesArray(data) {
    if (!data) return null;
    const candidateKeys = ['data', 'content', 'items', 'result', 'list', 'calisanlar', 'sigortalilar', 'personeller', 'records'];
    const arr = Array.isArray(data) ? data : candidateKeys.map(k => data[k]).find(v => Array.isArray(v));
    if (!arr || arr.length === 0) return null;
    const sample = JSON.stringify(arr[0] || {}).toLowerCase();
    const isEmp = (sample.includes('tckimlik') || sample.includes('kimlikno') || sample.includes('isegiris') || sample.includes('sigortali')) && !sample.includes('sozlesmedurumu') && !sample.includes('sertifikano');
    return isEmp ? arr : null;
  }

  // Personel Sözleşmeleri ve Sorumlu Müdür Sözleşmeleri API Yanıtı Kontrolü
  function extractPersonnelContractsArray(url, data) {
    if (!data) return null;
    const candidateKeys = ['data', 'content', 'items', 'result', 'list', 'personelSozlesmeleri', 'sorumluMudurSozlesmeleri', 'records', 'rows', 'value'];
    let arr = Array.isArray(data) ? data : candidateKeys.map(k => data[k]).find(v => Array.isArray(v));
    if (!arr) {
      for (const key of Object.keys(data)) {
        if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
          for (const subK of candidateKeys) {
            if (Array.isArray(data[key][subK]) && data[key][subK].length > 0) {
              arr = data[key][subK];
              break;
            }
          }
        }
        if (arr) break;
      }
    }
    if (!arr || arr.length === 0) return null;
    const lowerUrl = (url || '').toLowerCase();
    if (isPersonnelContractObject(arr[0])) return arr;
    if ((lowerUrl.includes('personel') || lowerUrl.includes('sorumlumudur') || lowerUrl.includes('icgorevlendirme')) && !isServiceContractObject(arr[0])) {
      return arr;
    }
    return null;
  }

  // 2. Sözleşme Listesi, Tekil Sözleşme Detayı, Personel Sözleşmeleri ve Çalışan Verisini Yakalama
  function handlePotentialContractResponse(url, data, requestInfo) {
    try {
      // A) Tekil Sözleşme Detayı (İşlemler -> Detay Görüntüle)
      const singleDetail = extractSingleContractDetail(url, data);
      if (singleDetail) {
        const pid = String(singleDetail.surecNo || singleDetail.surecId || singleDetail.sozlesmeNo || singleDetail.id || '');
        if (pid) capturedContractDetailsByProcessId[pid] = singleDetail;
        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_CONTRACT_DETAIL_CAPTURED',
          url,
          processId: pid,
          detail: singleDetail
        }, '*');
      }

      // B) Personel Sözleşmeleri & Sorumlu Müdür Sözleşmeleri
      const personnelContractItems = extractPersonnelContractsArray(url, data);
      if (personnelContractItems && personnelContractItems.length > 0) {
        if (requestInfo) {
          lastPersonnelContractEndpoint = {
            url,
            method: requestInfo.method || 'GET',
            headers: requestInfo.headers || {},
            body: requestInfo.body || null
          };
        }
        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_API_PERSONNEL_CONTRACTS',
          url,
          totalCount: personnelContractItems.length,
          personnelContracts: personnelContractItems
        }, '*');
        return;
      }

      // C) Çalışan Listesi
      const empItems = extractEmployeesArray(data);
      if (empItems && empItems.length > 0) {
        cachedEmployees = empItems;
        if (requestInfo) {
          lastEmployeeEndpoint = { url, method: requestInfo.method || 'GET', headers: requestInfo.headers || {}, body: requestInfo.body || null };
        }
        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_API_EMPLOYEES',
          url,
          totalCount: empItems.length,
          employees: empItems
        }, '*');
        return;
      }

      // D) Sözleşme Listesi
      const items = extractContractsArray(data);
      const totalReported = extractTotalElementsCount(data);

      if (items && items.length > 0) {
        console.log(`[İSGPRO Injected] 🎯 Bu sayfada ${items.length} sözleşme API yanıtından yakalandı (Toplam Kayıt: ${totalReported ?? 'Bilinmiyor'}). URL:`, url);

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
          pageCount: items.length,
          totalElements: totalReported || items.length,
          contracts: items
        }, '*');
      } else if (Array.isArray(data) && data.length === 0) {
        const lowerUrl = (url || '').toLowerCase();
        if (lowerUrl.includes('onay') || lowerUrl.includes('pending') || lowerUrl.includes('sozlesme') || lowerUrl.includes('teklif')) {
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
    const configObj = args[1] || {};
    const url = typeof resource === 'string' ? resource : (resource ? resource.url : '');

    try {
      if (configObj.headers) {
        let authVal = '';
        if (typeof configObj.headers.get === 'function') {
          authVal = configObj.headers.get('Authorization') || configObj.headers.get('authorization');
        } else if (typeof configObj.headers === 'object') {
          authVal = configObj.headers['Authorization'] || configObj.headers['authorization'];
        }
        if (authVal) lastAuthHeader = authVal;
      }
    } catch (e) {}

    const response = await originalFetch.apply(this, args);

    try {
      const clone = response.clone();
      const contentType = clone.headers.get('content-type') || '';
      if (contentType.includes('json') || (url && (url.includes('/api/') || url.includes('sozlesme') || url.includes('surec') || url.includes('calisan') || url.includes('detay')))) {
        clone.json().then(data => {
          handlePotentialContractResponse(url, data, {
            method: configObj.method || 'GET',
            headers: configObj.headers,
            body: configObj.body
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
        if (ct.includes('json') || (url && (url.includes('/api/') || url.includes('sozlesme') || url.includes('surec') || url.includes('calisan') || url.includes('detay')))) {
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
  function readContractsFromAngularMemory(targetType = 'SERVICE') {
    const matcher = targetType === 'PERSONNEL' ? isPersonnelContractObject : isServiceContractObject;
    try {
      const tables = document.querySelectorAll('p-table, .p-datatable, table');
      for (const t of tables) {
        if (window.ng) {
          const comp =
            (typeof window.ng.getComponent === 'function' && window.ng.getComponent(t)) ||
            (typeof window.ng.getOwningComponent === 'function' && window.ng.getOwningComponent(t)) ||
            (typeof window.ng.getContext === 'function' && window.ng.getContext(t));
          if (comp) {
            const candidates = [comp.value, comp._value, comp.filteredValue, comp.dataToRender, comp.data, comp._data, comp.items, comp.rows];
            for (const rawVal of candidates) {
              if (Array.isArray(rawVal) && rawVal.length > 0 && matcher(rawVal[0])) {
                console.log(`[İSGPRO Injected] 🎯 Angular Component (p-table) üzerinden ${rawVal.length} ${targetType} sözleşmesi doğrudan RAM'den çekildi!`);
                return rawVal;
              }
            }
          }
        }
      }

      if (typeof window.getAllAngularRootElements === 'function') {
        const roots = window.getAllAngularRootElements();
        for (const r of roots) {
          if (window.ng && typeof window.ng.getContext === 'function') {
            const ctx = window.ng.getContext(r);
            if (ctx) {
              for (const k of Object.keys(ctx)) {
                if (Array.isArray(ctx[k]) && ctx[k].length > 0 && matcher(ctx[k][0])) {
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

  async function fetchAllFromEndpoint(endpointObj, arrayExtractor) {
    if (!endpointObj || !endpointObj.url) return [];
    const headers = Object.assign({}, endpointObj.headers);
    if (lastAuthHeader && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = lastAuthHeader;
    }

    const maxRows = 2000;
    let allCollected = [];
    let pageIndex = 0;
    let keepFetching = true;

    while (keepFetching && pageIndex < 50) {
      let targetUrl = endpointObj.url;

      if (targetUrl.includes('size=')) {
        targetUrl = targetUrl.replace(/size=\d+/, 'size=' + maxRows);
      } else if (targetUrl.includes('pageSize=')) {
        targetUrl = targetUrl.replace(/pageSize=\d+/, 'pageSize=' + maxRows);
      } else if (targetUrl.includes('rows=')) {
        targetUrl = targetUrl.replace(/rows=\d+/, 'rows=' + maxRows);
      } else {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + `size=${maxRows}&pageSize=${maxRows}&rows=${maxRows}`;
      }

      if (targetUrl.includes('page=')) {
        targetUrl = targetUrl.replace(/page=\d+/, 'page=' + pageIndex);
      } else if (targetUrl.includes('pageIndex=')) {
        targetUrl = targetUrl.replace(/pageIndex=\d+/, 'pageIndex=' + pageIndex);
      } else {
        targetUrl += `&page=${pageIndex}&pageIndex=${pageIndex}`;
      }

      let requestBody = endpointObj.body;
      if (requestBody && typeof requestBody === 'string' && requestBody.startsWith('{')) {
        try {
          const parsedBody = JSON.parse(requestBody);
          const effectivePageSize = parsedBody.pageSize || parsedBody.size || parsedBody.rows || maxRows;
          if ('pageSize' in parsedBody) parsedBody.pageSize = maxRows;
          if ('size' in parsedBody) parsedBody.size = maxRows;
          if ('rows' in parsedBody) parsedBody.rows = maxRows;
          if ('page' in parsedBody) parsedBody.page = pageIndex;
          if ('pageNumber' in parsedBody) parsedBody.pageNumber = pageIndex;
          if ('first' in parsedBody) parsedBody.first = pageIndex * effectivePageSize;
          if ('offset' in parsedBody) parsedBody.offset = pageIndex * effectivePageSize;
          requestBody = JSON.stringify(parsedBody);
        } catch (e) {}
      }

      const res = await originalFetch(targetUrl, {
        method: endpointObj.method || 'GET',
        headers: headers,
        body: requestBody
      });

      if (!res.ok) break;

      const data = await res.json();
      const pageItems = arrayExtractor(targetUrl, data) || [];
      const totalExpected = extractTotalElementsCount(data);

      if (pageItems.length === 0) {
        keepFetching = false;
        break;
      }

      allCollected = allCollected.concat(pageItems);
      console.log(`[İSGPRO Injected] 📄 Doğrudan API Sayfa ${pageIndex + 1}: ${pageItems.length} kayıt çekildi (Biriken Toplam: ${allCollected.length})`);

      if (totalExpected && allCollected.length >= totalExpected) {
        keepFetching = false;
      } else if (pageItems.length < 10) {
        keepFetching = false;
      } else {
        pageIndex++;
      }
    }

    return allCollected;
  }

  async function performDirectFetchAll(mode) {
    // 1. Önce Angular bileşen hafızasına bak (p-table veritabanı)
    const memContracts = readContractsFromAngularMemory('SERVICE');
    if (memContracts && memContracts.length > 0) {
      window.postMessage({
        source: 'ISGPRO_INJECTED',
        type: 'KATIP_DIRECT_FETCH_SUCCESS',
        mode,
        contracts: memContracts
      }, '*');
    }

    if (!lastContractEndpoint || !lastContractEndpoint.url) {
      if (!memContracts || memContracts.length === 0) {
        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_DIRECT_FETCH_FAILED',
          reason: 'NO_ENDPOINT_CAPTURED'
        }, '*');
      }
      return;
    }

    try {
      const allCollected = await fetchAllFromEndpoint(lastContractEndpoint, (_u, d) => extractContractsArray(d));
      if (allCollected.length > 0) {
        window.postMessage({
          source: 'ISGPRO_INJECTED',
          type: 'KATIP_DIRECT_FETCH_SUCCESS',
          mode,
          contracts: allCollected
        }, '*');
        return;
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

  async function performPersonnelDirectFetchAll() {
    // 1. Önce Angular p-table hafızasından personel sözleşmelerini oku
    const memPersonnel = readContractsFromAngularMemory('PERSONNEL');
    if (memPersonnel && memPersonnel.length > 0) {
      window.postMessage({
        source: 'ISGPRO_INJECTED',
        type: 'KATIP_API_PERSONNEL_CONTRACTS',
        url: 'angular-memory://p-table',
        totalCount: memPersonnel.length,
        personnelContracts: memPersonnel
      }, '*');
    }

    // 2. Yakalanmış Personel Sözleşmeleri REST API uç noktası varsa tüm kayıtları (size=2000) çek
    if (lastPersonnelContractEndpoint && lastPersonnelContractEndpoint.url) {
      try {
        const apiPersonnel = await fetchAllFromEndpoint(
          lastPersonnelContractEndpoint,
          (u, d) => extractPersonnelContractsArray(u, d)
        );
        if (apiPersonnel.length > 0) {
          window.postMessage({
            source: 'ISGPRO_INJECTED',
            type: 'KATIP_API_PERSONNEL_CONTRACTS',
            url: lastPersonnelContractEndpoint.url,
            totalCount: apiPersonnel.length,
            personnelContracts: apiPersonnel
          }, '*');
        }
      } catch (err) {
        console.warn('[İSGPRO Injected] Personel direct fetch hatası:', err);
      }
    }
  }

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'ISGPRO_CONTENT') return;

    if (event.data.type === 'TRIGGER_DIRECT_FETCH') {
      performDirectFetchAll(event.data.mode || 'DEVAM_EDEN');
    } else if (event.data.type === 'TRIGGER_PERSONNEL_DIRECT_FETCH') {
      performPersonnelDirectFetchAll();
    } else if (event.data.type === 'TRIGGER_EMPLOYEE_FETCH') {
      window.postMessage({
        source: 'ISGPRO_INJECTED',
        type: 'KATIP_API_EMPLOYEES',
        totalCount: cachedEmployees.length,
        employees: cachedEmployees
      }, '*');
    }
  });

  console.log('[İSGPRO Injected v5.5.2] Hazır ve dinliyor.');
})();
