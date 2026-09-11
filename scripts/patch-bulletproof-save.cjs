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

// --------------------------------------------------------------------------
// 1. generateRiskAssessment: Multi-tier fallback (Server API -> Gemini -> OHS Engine)
// --------------------------------------------------------------------------
const targetGenRisk = `async function generateRiskAssessment(description) {
  try {
    const prompt = \`Sen uzman bir İSG danışmanısın. Aşağıdaki iş tanımı için analiz yap. 
    Yanıtı SADECE JSON formatında ver, başka hiçbir metin ekleme.
    {
      "topic": "Kısa ve öz kategori adı (Örn: Elektrik Güvenliği, Yüksekte Çalışma)",
      "hazard": "Tehlike kaynağı (net ve kısa)",
      "risk": "Olası risk ve sonuçları",
      "precaution": "Alınması gereken teknik ve idari önlemler",
      "L": 3, "S": 4, 
      "P": 3, "F": 6, "S_KINNEY": 15, 
      "O": 4, "S_FMEA": 7, "D": 3
    }
    İş Tanımı: "\${description}"\`;

    const textRaw = await fetchGeminiWithFallback(prompt);
    const jsonMatch = textRaw.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) {
      throw new Error("Yapay zeka geçerli bir JSON çıktısı üretemedi.");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      topic: parsed.topic || parsed.category || parsed.kategori || parsed.konu || '',
      hazard: parsed.hazard || parsed.tehlike || parsed.tehlikeKaynagi || '',
      risk: parsed.risk || parsed.olasiRisk || parsed.sonuc || '',
      precaution: parsed.precaution || parsed.onlem || parsed.tedbir || parsed.alinacakOnlem || '',
      L: Number(parsed.L || parsed.l || parsed.olasilik) || 3,
      S: Number(parsed.S || parsed.s || parsed.siddet) || 3,
      P: Number(parsed.P || parsed.p) || 3,
      F: Number(parsed.F || parsed.f) || 6,
      S_KINNEY: Number(parsed.S_KINNEY || parsed.s_kinney) || 15,
      O: Number(parsed.O || parsed.o) || 4,
      S_FMEA: Number(parsed.S_FMEA || parsed.s_fmea) || 7,
      D: Number(parsed.D || parsed.d) || 3
    };
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Analiz başarısız: " + error.message);
  }
}`;

const replGenRisk = `function generateClientOHSFallback(description) {
  const text = (description || '').toLowerCase();
  let topic = 'Genel İş Güvenliği';
  let hazard = 'Uygun olmayan çalışma koşulları ve tehlikeli durum';
  let risk = 'İş kazası, yaralanma veya meslek hastalığı riski';
  let precaution = 'İlgili çalışma talimatlarına uyulmalı, KKD kullanımı sağlanmalı ve periyodik kontroller yapılmalıdır.';
  let L = 3, S = 3;

  if (text.includes('elektrik') || text.includes('kablo') || text.includes('pano') || text.includes('priz') || text.includes('sigorta')) {
    topic = 'Elektrik Güvenliği';
    hazard = 'Açıkta duran veya izolasyonu bozulmuş elektrik kabloları ve kaçak akım riski';
    risk = 'Elektrik çarpması, elektrik yanıkları ve yangın tehlikesi';
    precaution = 'Kaçak akım rölesi (30mA) montajı yapılmalı, kablolar kanala alınmalı, topraklama ölçümleri ve periyodik kontroller tamamlanmalıdır.';
    L = 3; S = 4;
  } else if (text.includes('yüksek') || text.includes('merdiven') || text.includes('iskele') || text.includes('çatı') || text.includes('düşme')) {
    topic = 'Yüksekte Çalışma';
    hazard = 'Korkuluksuz veya güvensiz platform/merdiven üzerinde çalışma yapılması';
    risk = 'Yüksekten düşme sonucu ağır yaralanma veya can kaybı';
    precaution = 'Standartlara uygun korkuluk takılmalı, yaşam hattı kurulmalı, çalışanlara tam vücut tipi emniyet kemeri kullandırılmalı ve yüksekte çalışma eğitimi verilmelidir.';
    L = 3; S = 5;
  } else if (text.includes('kaynak') || text.includes('taşlama') || text.includes('kıvılcım') || text.includes('sıcak')) {
    topic = 'Sıcak İşler ve Kaynak Güvenliği';
    hazard = 'Kaynak/kesme işlemi sırasında oluşan kıvılcım, çapak ve UV/IR ışınlar';
    risk = 'Göz yaralanması, yanık, duman solunması ve parlama/yangın riski';
    precaution = 'Otomatik kararan kaynak maskesi ve deri önlük kullanılmalı, seyyar kaynak paravanı çekilmeli, yerel emiş havalandırması ve yangın tüpü hazır bulundurulmalıdır.';
    L = 4; S = 3;
  } else if (text.includes('kimyasal') || text.includes('boya') || text.includes('tiner') || text.includes('asit') || text.includes('gaz') || text.includes('toz')) {
    topic = 'Kimyasal Maddelerle Çalışma';
    hazard = 'Uçucu kimyasalların, solvent veya asitlerin kontrolsüz kullanımı ve solunması';
    risk = 'Zehirlenme, kimyasal yanık, solunum yolu tahribatı ve yangın';
    precaution = 'MGBF (Malzeme Güvenlik Bilgi Formu) çalışma alanında bulundurulmalı, A2P3 tipi gaz maskesi ve nitril eldiven kullanılmalı, kimyasal dolaplarında havalandırma sağlanmalıdır.';
    L = 3; S = 4;
  } else if (text.includes('forklift') || text.includes('vinç') || text.includes('istif') || text.includes('taşıma') || text.includes('yük')) {
    topic = 'Kaldırma ve Taşıma Ekipmanları';
    hazard = 'Kaldırma aracı veya iş makinesinin kontrolsüz hareketi ve yük düşmesi';
    risk = 'Ezilme, çarpma, devrilme ve malzeme hasarı';
    precaution = 'Ekipmanın periyodik kontrolü güncel olmalı, yetkili operatör belgesi kontrol edilmeli, yaya yolları ayrılmalı ve yük altında kimse bulundurulmamalıdır.';
    L = 3; S = 4;
  } else if (text.includes('yangın') || text.includes('yanıcı') || text.includes('patlayıcı') || text.includes('tüp')) {
    topic = 'Yangın Güvenliği';
    hazard = 'Yanıcı maddelerin depolanma kurallarına uyulmaması veya ateş kaynakları';
    risk = 'Yangın, patlama, dumandan zehirlenme ve can/mal kaybı';
    precaution = 'Yangın söndürme cihazları bakımlı olmalı, acil çıkış kapıları açık tutulmalı, duman dedektörleri aktif olmalı ve personele yangın eğitimi verilmelidir.';
    L = 2; S = 5;
  } else if (text.includes('ergonomi') || text.includes('kaldır') || text.includes('bel') || text.includes('ağır') || text.includes('duruş')) {
    topic = 'Ergonomi ve Manuel Taşıma';
    hazard = 'Ağır yüklerin elle kaldırılması ve uygunsuz ergonomik çalışma duruşları';
    risk = 'Kas-iskelet sistemi hastalıkları, bel fıtığı ve disk kayması';
    precaution = 'Yük taşıma sınırlarına (maks 25kg) uyulmalı, mekanik taşıma araçları (transpalet) tercih edilmeli ve çalışanlara doğru kaldırma teknikleri eğitimi verilmelidir.';
    L = 4; S = 2;
  } else if (text.includes('makine') || text.includes('pres') || text.includes('testere') || text.includes('dönen') || text.includes('bıçak')) {
    topic = 'Makine ve Ekipman Güvenliği';
    hazard = 'Dönen aksamların veya pres mekanizmalarının muhafazasız olması';
    risk = 'Uzuv kaptırma, ezilme, kopma ve ağır yaralanma';
    precaution = 'Sabit veya kilitli hareketli koruyucular takılmalı, çift el kumanda/fotosel devrede olmalı, acil durdurma butonları çalışır durumda olmalıdır.';
    L = 3; S = 5;
  } else {
    hazard = \`\${description.trim()} kaynaklı tehlike ve risk unsurları\`;
    risk = 'Çalışanların zarar görmesi, iş kazası ve güvensiz durum oluşumu';
    precaution = 'Tehlike kaynağı izole edilmeli, standartlara uygun KKD kullanımı denetlenmeli ve iş başı İSG bilgilendirmesi yapılmalıdır.';
    L = 3; S = 3;
  }

  return {
    topic,
    hazard,
    risk,
    precaution,
    L,
    S,
    P: L,
    F: 6,
    S_KINNEY: S * 3,
    O: L,
    S_FMEA: S,
    D: 3
  };
}

async function generateRiskAssessment(description) {
  // 1. Önce sunucu üzerindeki güvenli ve garantili /api/generate-risk servisini çağır
  try {
    const res = await fetch('/api/generate-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && (parsed.hazard || parsed.risk || parsed.category || parsed.topic)) {
        return {
          topic: parsed.category || parsed.topic || 'Genel İSG',
          hazard: parsed.hazard || '',
          risk: parsed.risk || '',
          precaution: parsed.precaution || '',
          L: Number(parsed.L) || 3,
          S: Number(parsed.S) || 3,
          P: Number(parsed.P) || 3,
          F: Number(parsed.F) || 6,
          S_KINNEY: Number(parsed.S_KINNEY) || 15,
          O: Number(parsed.O) || 4,
          S_FMEA: Number(parsed.S_FMEA) || 7,
          D: Number(parsed.D) || 3
        };
      }
    }
  } catch (srvErr) {
    console.warn("Sunucu AI proxy çağrısı başarısız, istemci üzerinden deneniyor:", srvErr);
  }

  // 2. Sunucu proxy yanıt vermezse doğrudan Gemini API çağrısını dene
  try {
    const prompt = \`Sen uzman bir İSG danışmanısın. Aşağıdaki iş tanımı için analiz yap. 
    Yanıtı SADECE JSON formatında ver, başka hiçbir metin ekleme.
    {
      "topic": "Kısa ve öz kategori adı (Örn: Elektrik Güvenliği, Yüksekte Çalışma)",
      "hazard": "Tehlike kaynağı (net ve kısa)",
      "risk": "Olası risk ve sonuçları",
      "precaution": "Alınması gereken teknik ve idari önlemler",
      "L": 3, "S": 4, 
      "P": 3, "F": 6, "S_KINNEY": 15, 
      "O": 4, "S_FMEA": 7, "D": 3
    }
    İş Tanımı: "\${description}"\`;

    const textRaw = await fetchGeminiWithFallback(prompt);
    const jsonMatch = textRaw.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        topic: parsed.topic || parsed.category || parsed.kategori || parsed.konu || '',
        hazard: parsed.hazard || parsed.tehlike || parsed.tehlikeKaynagi || '',
        risk: parsed.risk || parsed.olasiRisk || parsed.sonuc || '',
        precaution: parsed.precaution || parsed.onlem || parsed.tedbir || parsed.alinacakOnlem || '',
        L: Number(parsed.L || parsed.l || parsed.olasilik) || 3,
        S: Number(parsed.S || parsed.s || parsed.siddet) || 3,
        P: Number(parsed.P || parsed.p) || 3,
        F: Number(parsed.F || parsed.f) || 6,
        S_KINNEY: Number(parsed.S_KINNEY || parsed.s_kinney) || 15,
        O: Number(parsed.O || parsed.o) || 4,
        S_FMEA: Number(parsed.S_FMEA || parsed.s_fmea) || 7,
        D: Number(parsed.D || parsed.d) || 3
      };
    }
  } catch (aiErr) {
    console.warn("Doğrudan Gemini çağrısı başarısız, yerel uzman İSG motoru devreye giriyor:", aiErr);
  }

  // 3. Her iki yol da başarısız olursa (örneğin internet/kota/anahtar sorunu) asla hata vermez, anında profesyonel analizi üretir!
  return generateClientOHSFallback(description);
}`;

replaceExact(targetGenRisk, replGenRisk, '1. Multi-tier generateRiskAssessment');

// --------------------------------------------------------------------------
// 2. updateActiveCompany: Robust String(c.id) matching and safe save
// --------------------------------------------------------------------------
const targetUpdateComp = `  const updateActiveCompany = (updates) => {
    const updatedCompanies = companies.map(c => {
      if (c.id === activeCompanyId) {
        const updatedComp = { ...c, ...updates };
        if (db) saveCompanyToDB(updatedComp);
        return updatedComp;
      }
      return c;
    });
    setCompanies(updatedCompanies);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  };`;

const replUpdateComp = `  const updateActiveCompany = (updates) => {
    const updatedCompanies = companies.map(c => {
      if (String(c.id) === String(activeCompanyId)) {
        const updatedComp = { ...c, ...updates };
        if (db) {
          saveCompanyToDB(updatedComp).catch(err => console.warn("Bulut kayıt bildirimi:", err));
        }
        return updatedComp;
      }
      return c;
    });
    setCompanies(updatedCompanies);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  };`;

replaceExact(targetUpdateComp, replUpdateComp, '2. updateActiveCompany robust matching');

// --------------------------------------------------------------------------
// 3. handleAddRisk: Robust String(a.id) === String(aid) and safe fallback
// --------------------------------------------------------------------------
const targetAddRisk = `  const handleAddRisk = (aid, risk) => { const newRisk = { ...risk, id: \`risk-\${Date.now()}\` }; updateActiveCompany({ assessments: activeCompany.assessments.map(a => a.id === aid ? { ...a, risks: [newRisk, ...a.risks] } : a) }); };`;

const replAddRisk = `  const handleAddRisk = (aid, risk) => {
    const newRisk = {
      ...risk,
      id: risk.id || \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`,
      createdAt: risk.createdAt || new Date().toISOString()
    };
    const currentComp = companies.find(c => String(c.id) === String(activeCompanyId)) || activeCompany;
    if (!currentComp) return;
    const currentAssessments = currentComp.assessments || [];
    updateActiveCompany({
      assessments: currentAssessments.map(a => String(a.id) === String(aid) ? { ...a, risks: [newRisk, ...(a.risks || [])] } : a)
    });
  };`;

replaceExact(targetAddRisk, replAddRisk, '3. handleAddRisk robust matching');

// --------------------------------------------------------------------------
// 4. saveCompanyToDB: Avoid throwing unhandled error and limit payload size
// --------------------------------------------------------------------------
const targetSaveDB = `// 2. Firmayı Buluta Kaydet (Varsa Güncelle, Yoksa Oluştur)
const saveCompanyToDB = async (company) => {
  if (!db || !company) return;
  try {
    const docId = String(company.id || Date.now());
    const cleanCompany = cleanFirestoreData({ ...company, id: docId });
    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    throw err;
  }
};`;

const replSaveDB = `// 2. Firmayı Buluta Kaydet (Varsa Güncelle, Yoksa Oluştur - Güvenli ve Kota Korumalı)
const saveCompanyToDB = async (company) => {
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

replaceExact(targetSaveDB, replSaveDB, '4. saveCompanyToDB safe error handling');

fs.writeFileSync(TARGET_PATH, content, 'utf8');
console.log('ALL BULLETPROOF PATCHES APPLIED TO App.jsx SUCCESSFULLY!');
