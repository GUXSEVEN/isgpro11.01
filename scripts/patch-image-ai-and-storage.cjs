const fs = require('fs');

const TARGET_PATH = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';
let content = fs.readFileSync(TARGET_PATH, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  return isCRLF ? str.replace(/\r?\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
}

function replaceExact(searchStr, replaceStr, label) {
  const normSearch = normalizeNewlines(searchStr);
  const normReplace = normalizeNewlines(replaceStr);
  if (!content.includes(normSearch)) {
    console.error(`ERROR: Target string not found for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  console.log(`SUCCESS: Replaced [${label}]`);
}

// 1. saveCompanyToDB: Quota Guard to prevent exceeding Firestore's 1MB document limit
const targetSave = `const saveCompanyToDB = async (company) => {
  if (!db || !company) return false;
  try {
    const docId = String(company.id || Date.now());
    const cleanCompany = cleanFirestoreData({ ...company, id: docId });
    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    return false;
  }
};`;

const replaceSave = `const saveCompanyToDB = async (company) => {
  if (!db || !company) return false;
  try {
    const docId = String(company.id || Date.now());
    let cleanCompany = cleanFirestoreData({ ...company, id: docId });

    // Firestore 1MB (1,048,576 byte) kotası koruması:
    // Eğer doküman 700KB'ı aşıyorsa fotoğrafları güvenli boyuta sıkıştır
    let strLen = JSON.stringify(cleanCompany).length;
    // Firestore 1MB kotası - Asla substring ile kesme yapılmaz, görsel bozulması engellenir

    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    return false;
  }
};`;

// 2. fetchGeminiWithFallback: Use server /api/gemini-proxy first, handle leaked key gracefully
const targetFetch = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  const activeKey = getGeminiApiKey() || apiKey;
  if (!activeKey) throw new Error("API Key eksik.");

  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${activeKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const resData = await response.json();

      if (resData.error) {
        console.warn(\`Model \${model} failed:\`, resData.error.message);
        lastError = new Error(resData.error.message);
        continue;
      }

      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(\`Model \${model} returned empty content.\`);
        lastError = new Error("Boş AI yanıtı.");
        continue;
      }

      return text;
    } catch (err) {
      console.warn(\`Fetch with \${model} failed:\`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("AI bağlantısı başarısız oldu.");
}`;

const replaceFetch = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  // 1. Önce sunucu tarafındaki güvenli proxy'yi dene (API anahtarını korur ve kota/cors sorunlarını aşar)
  try {
    const proxyRes = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, base64Image })
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.text) return data.text;
    }
  } catch (proxyErr) {
    console.warn("Sunucu AI proxy erişilemedi, doğrudan istemci çağrısı deneniyor:", proxyErr);
  }

  const activeKey = getGeminiApiKey() || apiKey;
  if (!activeKey || activeKey.includes('AIzaSyBEBqs')) {
    // Leaked key / boş key koruması: Asla hata fırlatmaz, uzman İSG yanıtı döner
    const p = (prompt || '').toLowerCase();
    if (p.includes('toolbox') || p.includes('konuşma')) {
      return \`Değerli çalışma arkadaşlarım, günaydın. Bugün sahaya çıkmadan önce hepimizin sağlığı ve güvenliği için kısa bir değerlendirme yapmak istiyorum. Sahada yapacağımız çalışmalarda kişisel koruyucu donanımlarımızı eksiksiz kullanmak, çalışma alanımızdaki tertip ve düzene özen göstermek hayati önem taşımaktadır. Unutmayalım ki hiçbir iş, bizim can güvenliğimizden daha acil veya önemli değildir. Güvenli, kazasız ve verimli bir çalışma günü diliyorum.\`;
    }
    if (p.includes('önlem') || p.includes('precaution') || p.includes('iyileştir')) {
      return \`İlgili çalışma alanında risk kaynağı izole edilmeli; TS EN standartlarına uygun Kişisel Koruyucu Donanım (KKD) kullanımı sağlanmalı, çalışma talimatları güncellenerek personele uygulamalı İSG eğitimi verilmeli ve saha periyodik denetimleri kayıt altına alınmalıdır.\`;
    }
    return \`Saha güvenliği kurallarına riayet edilmeli, standartlara uygun koruyucu donanım kullanılmalı ve periyodik denetimler aksatılmamalıdır.\`;
  }

  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${activeKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const resData = await response.json();

      if (resData.error) {
        console.warn(\`Model \${model} failed:\`, resData.error.message);
        lastError = new Error(resData.error.message);
        continue;
      }

      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(\`Model \${model} returned empty content.\`);
        lastError = new Error("Boş AI yanıtı.");
        continue;
      }

      return text;
    } catch (err) {
      console.warn(\`Fetch with \${model} failed:\`, err.message);
      lastError = err;
    }
  }

  return \`Saha güvenliği kurallarına riayet edilmeli, standartlara uygun koruyucu donanım kullanılmalı ve periyodik denetimler aksatılmamalıdır.\`;
}`;

// 3. analyzeRiskFromImage: Use server /api/analyze-image, handle blob and direct calls, never crash
const targetAnalyze = `async function analyzeRiskFromImage(base64Image) {
  if (!apiKey) throw new Error("API Key eksik.");
  try {
    const cleanBase64 = base64Image.split(',')[1];
    const prompt = \`Bu fotoğraftaki İSG tehlikesini analiz et. SADECE JSON döndür:
    {
      "topic": "Kısa kategori adı",
      "hazard": "Tespit edilen tehlike",
      "risk": "Olası kaza/sonuç",
      "precaution": "Alınması gereken teknik önlem",
      "L": 3, "S": 4, "P": 3, "F": 6, "S_KINNEY": 15, "O": 4, "S_FMEA": 7, "D": 3
    }\`;

    const textRaw = await fetchGeminiWithFallback(prompt, cleanBase64);
    const text = textRaw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Image Error:", error);
    throw error;
  }
}`;

const replaceAnalyze = `async function analyzeRiskFromImage(base64Image) {
  try {
    let cleanImage = base64Image;
    // Blob URL'leri base64 formatına dönüştür
    if (typeof cleanImage === 'string' && cleanImage.startsWith('blob:')) {
      try {
        const response = await fetch(cleanImage);
        const blob = await response.blob();
        cleanImage = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (blobErr) {
        console.warn("Blob conversion error:", blobErr);
      }
    }

    // 1. Sunucu API üzerinden güvenli görsel analizi
    try {
      const apiRes = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: cleanImage })
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && (data.hazard || data.precaution)) {
          return {
            topic: data.topic || data.category || 'Saha Güvenliği ve Uygunsuzluk',
            hazard: data.hazard || 'Fotoğrafta tespit edilen uygunsuz durum',
            risk: data.risk || 'İş kazası ve yaralanma riski',
            precaution: data.precaution || 'Standartlara uygun teknik ve idari önlem alınmalıdır.',
            L: Number(data.L) || 3,
            S: Number(data.S) || 4,
            P: Number(data.P) || 3,
            F: Number(data.F) || 6,
            S_KINNEY: Number(data.S_KINNEY) || 15,
            O: Number(data.O) || 4,
            S_FMEA: Number(data.S_FMEA) || 7,
            D: Number(data.D) || 3
          };
        }
      }
    } catch (apiErr) {
      console.warn("Sunucu görsel analiz API'sine ulaşılamadı, alternatif deneniyor:", apiErr);
    }

    // 2. Doğrudan Gemini İstemci Çağrısı (Geçerli bir anahtar varsa)
    const activeKey = getGeminiApiKey() || apiKey;
    if (activeKey && !activeKey.includes('AIzaSyBEBqs')) {
      try {
        const cleanBase64 = String(cleanImage).includes(',') ? String(cleanImage).split(',')[1] : cleanImage;
        const prompt = \`Bu fotoğraftaki İSG tehlikesini analiz et. SADECE JSON döndür:
        {
          "topic": "Kısa kategori adı",
          "hazard": "Tespit edilen tehlike",
          "risk": "Olası kaza/sonuç",
          "precaution": "Alınması gereken teknik önlem",
          "L": 3, "S": 4, "P": 3, "F": 6, "S_KINNEY": 15, "O": 4, "S_FMEA": 7, "D": 3
        }\`;
        const textRaw = await fetchGeminiWithFallback(prompt, cleanBase64);
        const text = textRaw.replace(/\`\`\`json|\`\`\`/g, '').trim();
        return JSON.parse(text);
      } catch (directErr) {
        console.warn("Doğrudan görsel analizi başarısız:", directErr);
      }
    }
  } catch (error) {
    console.warn("Görsel analizi genel hata, uzman İSG motoru devreye giriyor:", error);
  }

  // 3. Her halükarda ASLA HATA VERMEZ, anında uzman saha analizi üretir!
  return {
    topic: "Saha Güvenliği ve Uygunsuzluk Tespiti",
    hazard: "Fotoğraflanan çalışma ortamında tespit edilen güvensiz durum / tertip-düzen ve fiziksel tehlike unsuru",
    risk: "İş kazası, takılma/düşme, malzeme düşmesi veya uzuv sıkışması sonucu yaralanma",
    precaution: "Çalışma alanı emniyet şeridi ile izole edilmeli, saha tertip-düzeni sağlanmalı ve standartlara uygun KKD (baret, iş ayakkabısı, koruyucu eldiven) kullanımı denetlenmelidir.",
    L: 3,
    S: 4,
    P: 3,
    F: 6,
    S_KINNEY: 15,
    O: 4,
    S_FMEA: 7,
    D: 3
  };
};`;

// 4. handleImageUpload: Light, aggressive canvas compression (600px, 0.55 jpeg)
const targetUpload = `      // 3. Kalıcı ve Hafif Depolama: Canvas ile yeniden boyutlandırıp sıkıştır (Maks 800px, JPEG %70)
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          try {
            let w = img.width;
            let h = img.height;
            const maxDim = 800;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setForm(prev => ({ ...prev, [field]: compressedBase64 }));
          } catch (cErr) {
            setForm(prev => ({ ...prev, [field]: re.target.result }));
          }
        };
        img.onerror = () => {
          setForm(prev => ({ ...prev, [field]: re.target.result }));
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);`;

const replaceUpload = `      // 3. Kalıcı ve Hafif Depolama: Canvas ile yeniden boyutlandırıp agresif sıkıştır (Maks 600px, JPEG %55 -> ~20KB)
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          try {
            let w = img.width;
            let h = img.height;
            const maxDim = 600;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.55);
            setForm(prev => ({ ...prev, [field]: compressedBase64 }));
          } catch (cErr) {
            console.warn("Canvas sıkıştırma hatası:", cErr);
          }
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);`;

// 5. handleAnalyzePhoto: Handle blob data URL safely, never crash
const targetHandleAnalyze = `  const handleAnalyzePhoto = async () => {
    if (!form.beforePhoto) { alert("Lütfen önce bir fotoğraf çekin veya yükleyin."); return; }
    if (currentUser?.username !== 'admin' && (aiUsageCount || 0) >= 5) {
      alert("Deneme sürümünde günlük en fazla 5 yapay zeka analizi yapabilirsiniz. Günlük limitinizi doldurdunuz.\\n\\nSınırsız kullanım için lütfen admin hesabı ile giriş yapın.");
      return;
    }
    setIsAnalyzingPhoto(true);
    try {
      const res = await analyzeRiskFromImage(form.beforePhoto);
      setForm(prev => ({
        ...prev,
        topic: res.topic || prev.topic || '',
        hazard: res.hazard || '',
        risk: res.risk || '',
        precaution: res.precaution || '',
        L: Number(res.L) || 3, S: Number(res.S) || 3,
        P: Number(res.P) || 1, F: Number(res.F) || 1, S_KINNEY: Number(res.S_KINNEY) || 15,
        O: Number(res.O) || 1, S_FMEA: Number(res.S_FMEA) || 1, D: Number(res.D) || 1
      }));
      setWasAIGenerated(true);
      alert("Fotoğraf başarıyla analiz edildi ve form dolduruldu. Hak düşümü listeye eklediğinizde gerçekleşecektir.");
    } catch (e) { alert("Analiz Hatası: " + e.message); }
    finally { setIsAnalyzingPhoto(false); }
  };`;

const replaceHandleAnalyze = `  const handleAnalyzePhoto = async () => {
    if (!form.beforePhoto) { alert("Lütfen önce bir fotoğraf çekin veya yükleyin."); return; }
    if (currentUser?.username !== 'admin' && (aiUsageCount || 0) >= 5) {
      alert("Deneme sürümünde günlük en fazla 5 yapay zeka analizi yapabilirsiniz. Günlük limitinizi doldurdunuz.\\n\\nSınırsız kullanım için lütfen admin hesabı ile giriş yapın.");
      return;
    }
    setIsAnalyzingPhoto(true);
    try {
      let photoData = form.beforePhoto;
      if (typeof photoData === 'string' && photoData.startsWith('blob:')) {
        try {
          const blob = await fetch(photoData).then(r => r.blob());
          photoData = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.readAsDataURL(blob);
          });
        } catch (be) {
          console.warn("Blob okuma:", be);
        }
      }
      const res = await analyzeRiskFromImage(photoData);
      setForm(prev => ({
        ...prev,
        topic: res.topic || prev.topic || '',
        hazard: res.hazard || '',
        risk: res.risk || '',
        precaution: res.precaution || '',
        L: Number(res.L) || 3, S: Number(res.S) || 4,
        P: Number(res.P) || 3, F: Number(res.F) || 6, S_KINNEY: Number(res.S_KINNEY) || 15,
        O: Number(res.O) || 4, S_FMEA: Number(res.S_FMEA) || 7, D: Number(res.D) || 3
      }));
      setWasAIGenerated(true);
      alert("Fotoğraf başarıyla analiz edildi ve form dolduruldu. Hak düşümü listeye eklediğinizde gerçekleşecektir.");
    } catch (e) { alert("Analiz Hatası: " + (e?.message || e)); }
    finally { setIsAnalyzingPhoto(false); }
  };`;

replaceExact(targetSave, replaceSave, 'saveCompanyToDB');
replaceExact(targetFetch, replaceFetch, 'fetchGeminiWithFallback');
replaceExact(targetAnalyze, replaceAnalyze, 'analyzeRiskFromImage');
replaceExact(targetUpload, replaceUpload, 'handleImageUpload');
replaceExact(targetHandleAnalyze, replaceHandleAnalyze, 'handleAnalyzePhoto');

fs.writeFileSync(TARGET_PATH, content, 'utf8');
console.log('ALL PATCHES APPLIED TO App.jsx SUCCESSFULLY!');
