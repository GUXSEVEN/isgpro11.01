const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  return isCRLF ? str.replace(/\r?\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
}

// analyzeRiskFromImage içindeki promptu bul ve güncelle
const startMarkerAnalyze = "async function analyzeRiskFromImage(base64Image) {";
const endMarkerAnalyze = "async function improvePrecaution(";

const startIndexAnalyze = content.indexOf(startMarkerAnalyze);
const endIndexAnalyze = content.indexOf(endMarkerAnalyze);

if (startIndexAnalyze === -1 || endIndexAnalyze === -1 || startIndexAnalyze >= endIndexAnalyze) {
  console.error("ERROR: Could not locate analyzeRiskFromImage boundaries!");
  process.exit(1);
}

const newAnalyzeRiskFromImage = `async function analyzeRiskFromImage(base64Image) {
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

  const activeKey = getGeminiApiKey() || apiKey;

  // 1. Önce sunucu API üzerinden güvenli ve çoklu modelli görsel analizi dene
  try {
    const apiRes = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: cleanImage, apiKey: activeKey })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.hazard || data.precaution)) {
        return {
          topic: data.topic || data.category || 'Saha Güvenliği',
          hazard: data.hazard || 'Fotoğrafta tespit edilen somut tehlike kaynağı',
          risk: data.risk || 'Olası kaza ve yaralanma riski',
          precaution: data.precaution || 'Alınması gereken teknik ve idari önlemler',
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
    } else {
      const errJson = await apiRes.json().catch(() => ({}));
      if (errJson.error === 'AI_KEY_REQUIRED' || errJson.error === 'AI_KEY_INVALID') {
        if (!activeKey || activeKey.includes('AIzaSyBEBqs')) {
          throw new Error("AI_KEY_REQUIRED");
        }
      }
    }
  } catch (apiErr) {
    if (apiErr.message === 'AI_KEY_REQUIRED' || apiErr.message === 'AI_KEY_INVALID') {
      throw apiErr;
    }
    console.warn("Sunucu görsel analiz API'sine ulaşılamadı, doğrudan istemci çağrısı deneniyor:", apiErr);
  }

  // 2. Doğrudan Gemini İstemci Çağrısı (Detaylı A Sınıfı İSG Baş Denetçisi Analizi - Rapora Uygun Dengeli Uzunluk)
  if (!activeKey || activeKey.includes('AIzaSyBEBqs')) {
    throw new Error("AI_KEY_REQUIRED");
  }

  const cleanBase64 = String(cleanImage).includes(',') ? String(cleanImage).split(',')[1] : cleanImage;
  const prompt = \`Sen Türkiye İş Sağlığı ve Güvenliği mevzuatına (6331 sayılı İSG Kanunu) ve uluslararası standartlara (ISO 45001) son derece hakim, kıdemli bir A Sınıfı İSG Baş Denetçisi ve Saha Güvenlik Uzmanısın.
Sana verilen fotoğrafı dikkatle incele. Fotoğraftaki fiziksel ortamı, çalışma koşullarını, yapıları, zemin durumunu, makineleri, ekipmanları, el aletlerini, kabloları/elektrik unsurlarını, kimyasal kapları, yükseklik durumunu ve personelin çalışma şeklini/duruşunu tara.

ÖNEMLİ FORMAT VE UZUNLUK KURALLARI (RAPORA VE TABLO HÜCRELERİNE UYGUN DENGELİ ÖZET):
- Kapsamlı ve teknik derinliği koru, ancak aşırı uzun veya destansı paragraflar yazma. Metinler resmi İSG raporlarına ve tablo hücrelerine tam sığacak şekilde ortalama uzunlukta, sade, net ve maddeli olmalıdır (ne çok kısa ne çok uzun).
- ASLA "genel güvensiz durum", "tertip düzen eksikliği", "saha uygunsuzluğu" gibi genelleyici yuvarlak klişeler KULLANMA.

ALANLARIN YAPISI:
1. "topic" (İlgili Konu / Kategori): Kısa, vurucu ve net mevzuat başlığı (ortalama 2-5 kelime).
   Örnek: "Dış Cephe İskelelerinde Düşme Güvenliği", "Seyyar Elektrik Tesisatı ve Kaçak Akım", "Makine Döner Aksam Koruyucuları".

2. "hazard" (Spesifik Tehlike Kaynağı): Fotoğrafta görülen somut kusuru ve tehlike kaynağını doğrudan belirten 1-2 cümlelik net tanım.
   Örnek: "İskele çalışma platformunda zorunlu ana korkuluk, ara korkuluk ve tekmeleğin takılmamış olması."

3. "risk" (Olası Kaza ve Sonuç): Tehlikenin yol açabileceği kazayı ve fiziksel hasarı belirten 1-2 cümlelik net etki.
   Örnek: "Yüksekten sert zemine düşme sonucu kafa travması, uzuv kırığı veya ölümcül yaralanma riski."

4. "precaution" (Alınması Gereken Önlemler): Rapora sığacak şekilde 2 veya 3 kısa, net ve numaralandırılmış teknik/idari madde yaz.
   Örnek: "1. TS EN 12811 standardına uygun 1m ana ve 50cm ara korkuluk takılmalıdır.\\n2. Tam vücut tipi emniyet kemeri şok emicili lanyard ile yaşam hattına bağlanmalıdır.\\n3. İskele yeşil etiket denetimi tamamlanmadan çalışma başlatılmamalıdır."

5. Risk Skorları (L, S, Kinney, FMEA):
   Fotoğraftaki tehlikenin ciddiyetine ve frekansına göre dinamik ve gerçekçi puanlar ver:
   - L (Olasılık 1-5): 1: Çok Düşük, 2: Düşük, 3: Orta, 4: Yüksek, 5: Çok Yüksek
   - S (Şiddet 1-5): 1: Hafif ilk yardım, 2: Tıbbi müdahale, 3: Uzuv kırığı/iş görmezlik, 4: Kalıcı sakatlık, 5: Can kaybı
   - Fine-Kinney: P (0.2-10), F (0.5-10), S_KINNEY (1-100)
   - FMEA: O (1-10), S_FMEA (1-10), D (1-10)

Lütfen SADECE aşağıdaki JSON formatında yanıt ver, markdown tırnağı veya başka metin ekleme:
{
  "topic": "Spesifik İSG Konusu",
  "hazard": "Somut tehlike kaynağı (1-2 net cümle)",
  "risk": "Olası kaza ve fiziksel zarar (1-2 net cümle)",
  "precaution": "1. Birinci somut önlem\\n2. İkinci somut önlem\\n3. Üçüncü somut önlem",
  "L": 4,
  "S": 5,
  "P": 6,
  "F": 6,
  "S_KINNEY": 15,
  "O": 6,
  "S_FMEA": 8,
  "D": 4
}\`;

  const textRaw = await fetchGeminiWithFallback(prompt, cleanBase64);
  const cleanJsonText = textRaw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  const parsed = JSON.parse(cleanJsonText);

  return {
    topic: parsed.topic || parsed.category || 'Saha Güvenliği',
    hazard: parsed.hazard || 'Fotoğrafta tespit edilen somut tehlike kaynağı',
    risk: parsed.risk || 'Olası kaza ve yaralanma riski',
    precaution: parsed.precaution || 'Alınması gereken teknik ve idari önlemler',
    L: Number(parsed.L) || 3,
    S: Number(parsed.S) || 4,
    P: Number(parsed.P) || 3,
    F: Number(parsed.F) || 6,
    S_KINNEY: Number(parsed.S_KINNEY) || 15,
    O: Number(parsed.O) || 4,
    S_FMEA: Number(parsed.S_FMEA) || 7,
    D: Number(parsed.D) || 3
  };
}

`;

content = content.substring(0, startIndexAnalyze) + normalizeNewlines(newAnalyzeRiskFromImage) + content.substring(endIndexAnalyze);
console.log("SUCCESS: Replaced analyzeRiskFromImage with balanced report-ready prompt!");

fs.writeFileSync(path, content, 'utf8');
console.log("ALL PATCHES APPLIED TO App.jsx!");
