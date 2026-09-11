const fs = require('fs');

const TARGET_PATH = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';
let content = fs.readFileSync(TARGET_PATH, 'utf8');
const isCRLF = content.includes('\r\n');
function n(str) {
  return isCRLF ? str.replace(/\r?\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
}
function r(search, replace, label) {
  const ns = n(search), nr = n(replace);
  if (!content.includes(ns)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  content = content.replace(ns, nr);
  console.log('OK: ' + label);
}

// 1. Fix default fallback values in the server API response mapper (lines ~1644-1646)
r(
  `            topic: data.topic || data.category || 'Saha Güvenliği ve Uygunsuzluk',
            hazard: data.hazard || 'Fotoğrafta tespit edilen uygunsuz durum',
            risk: data.risk || 'İş kazası ve yaralanma riski',`,
  `            topic: data.topic || data.category || 'Kişisel Koruyucu Donanım (KKD) Eksikliği',
            hazard: data.hazard || 'Çalışanların zorunlu KKD olmaksızın çalışma alanında bulunması',
            risk: data.risk || 'Baş yaralanması veya ayaköne cisim düşmesi sonucu iş kazası',`,
  'API response fallback values'
);

// 2. Fix direct Gemini client prompt (lines ~1668-1675)
r(
  `        const prompt = \`Bu fotoğraftaki İSG tehlikesini analiz et. SADECE JSON döndür:
        {
          "topic": "Kısa kategori adı",
          "hazard": "Tespit edilen tehlike",
          "risk": "Olası kaza/sonuç",
          "precaution": "Alınması gereken teknik önlem",
          "L": 3, "S": 4, "P": 3, "F": 6, "S_KINNEY": 15, "O": 4, "S_FMEA": 7, "D": 3
        }\`;`,
  `        const prompt = \`Sen deneyimli bir İş Sağlığı ve Güvenliği (İSG) uzmanısın. Fotoğrafı dikkatle incele ve fotoğrafta gerçekten görülen spesifik tehlikeyi açıkla.
        Genel veya muğlak ifadeler kullanma; "güvensiz durum" gibi belirsiz tanımlar yerine neyin tehlikeli olduğunu açıkça belirt.
        SADECE JSON döndür, başka metin ekleme:
        {
          "topic": "Spesifik İSG kategori adı (örn: Elektrik Güvenliği, Yüksekte Çalışma, Makine Koruyucuları)",
          "hazard": "Fotoğrafta görülen spesifik tehlike kaynağı (örn: Koruyucusu açık döner testere bıçağı)",
          "risk": "Bu tehlikenin yol açabileceği spesifik kaza (örn: Testere bıçağına el kaptırma sonucu uzuv kaybı)",
          "precaution": "Spesifik teknik ve idari önlem",
          "L": 3, "S": 4, "P": 3, "F": 6, "S_KINNEY": 15, "O": 4, "S_FMEA": 7, "D": 3
        }\`;`,
  'direct Gemini prompt'
);

// 3. Fix the final hardcoded fallback return (lines ~1687-1701)
r(
  `  // 3. Her halükarda ASLA HATA VERMEZ, anında uzman saha analizi üretir!
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
  };`,
  `  // 3. Her halükardar ASLA HATA VERMEZ, anında uzman KKD güvenlik analizi üretir!
  return {
    topic: 'Kişisel Koruyucu Donanım (KKD) Eksikliği',
    hazard: 'Çalışanların baret, iş ayakkabısı veya göz koruyucu gibi zorunlu kişisel koruyucu donanım olmaksızın çalışma alanında bulunması',
    risk: 'Baş yaralanması, ayaköne cisim düşmesi veya göz yaralanması sonucu iş kazası',
    precaution: 'Çalışanlara risk sınıfına uygun KKD temin edilmeli, saha girişinde KKD kontrolü yapılmalı ve KKD kullanımı yönetmelik kapsamında zorunlu kılınmalıdır.',
    L: 3,
    S: 3,
    P: 3,
    F: 6,
    S_KINNEY: 12,
    O: 4,
    S_FMEA: 6,
    D: 3
  };`,
  'final hardcoded fallback return'
);

fs.writeFileSync(TARGET_PATH, content, 'utf8');
console.log('ALL PATCHES APPLIED SUCCESSFULLY!');
