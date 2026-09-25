const fs = require('fs');

const files = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Update fetchGeminiWithFallback models to real working models
  const oldModelsPattern = /const models = \[\s*'gemini-2\.5-flash-lite'[\s\S]*?'gemini-flash-latest'\s*\];/;
  const newModels = `const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest'
  ];`;
  if (oldModelsPattern.test(code)) {
    code = code.replace(oldModelsPattern, newModels);
    modified = true;
  }

  // 2. Update prompt in analyzeRiskFromImage to environment-aware, zero-hallucination prompt
  const promptRegex = /const prompt = `Sen (?:Türkiye İş Sağlığı ve Güvenliği|İş Sağlığı ve Güvenliği)[\s\S]*?"D": 4\s*\}`/g;
  const newPrompt = `const prompt = \`Sen İş Sağlığı ve Güvenliği (İSG), Çevre Güvenliği ve Yapı Denetimi konularında uzman, kıdemli bir Baş Denetçi ve Saha Uzmanısın.
Sana verilen fotoğrafı TÜM DETAYLARIYLA (arka plan, çevre, zemin, tabelalar, bina/yapı durumu, nesneler, yazılar ve ortam şartları) titizlikle analiz et.

ÇOK KRİTİK GÖRSEL UYUM VE DOĞRULUK KURALLARI (HALÜSİNASYON GÖRMEYİ KESİNLİKLE ENGELLE):
1. GERÇEKÇİ ÇEVRE VE MEKAN TESPİTİ:
   - Fotoğrafın çekildiği gerçek ortamı DOĞRU tespit et:
     * Burası aktif bir şantiye mi?
     * Yoksa bir harabe, metruk bina, terk edilmiş yapı, yıkıntı veya eski bir bina mı?
     * Bir sokak, cadde, kaldırım, otopark veya açık alan mı?
     * Bir fabrika, imalathane, atölye, depo mu?
     * Yoksa sadece bir uyarı levhası, duvar yazısı, elektrik unsuru veya zemin mi?
   - ASLA ortamda olmayan şeyleri VARMIŞ GİBİ UYDURMA!
   - Ortada şantiye, inşaat iskelesi veya kazı makinesi YOKSA; kesinlikle "şantiye alanı", "kazı alanı", "inşaat sahası", "iskele" gibi ezbere kalıplar KULLANMA!
   - Fotoğrafta bir "Yıkılma Tehlikesi" yazısı, çatlak duvar, harabe veya metruk bir yapı varsa analizi doğrudan bunun üzerine kur (Örn: Konu: "Metruk Yapı ve Yıkılma Tehlikesi", Tehlike: "Terk edilmiş metruk yapının taşıyıcı duvarlarındaki derin çatlaklar ve göçme riski").

2. FOTOĞRAFTAKİ YAZILARI VE TABELALARI OKU:
   - Fotoğrafta herhangi bir uyarı levhası, duvar yazısı, tabela (örn. "Yıkılma Tehlikesi", "Girilemez", "Dikkat") varsa bunu mutlaka dikkate al ve analize doğru şekilde entegre et.

3. TABLO HÜCRELERİNİ TAŞIRMAYACAK DENGELİ ALANLAR:
   - "topic" (İlgili Konu / Kategori): Fotoğraftaki GERÇEK duruma tam uyan kısa başlık (2-4 kelime).
   - "description" (Mevcut Durum - ÖZETİN ÖZETİ):
     * Fotoğrafta görülen durumu en kısa ve öz haliyle anlatan TEK BİR KISA CÜMLE.
     * ASLA "bu fotoğraf", "görselde", "resimde" deme! Doğrudan sahadaki mevcut şartı yaz.
   - "hazard" (Tehlike Kaynağı - ÖZET VE NET):
     * Fotoğrafta tespit edilen somut fiziksel tehlikeyi belirten 1-2 cümlelik net özet.
   - "risk" (Olası Kaza ve Sonuç - SOMUT KAZA ODAKLI):
     * Somut kaza ve fiziksel zarar (ölüm, ağır yaralanma, göçük altında kalma, uzuv kırığı vb.) belirten net etki.
   - "precaution" (Alınacak Önlemler - BİRAZ DETAYLI VE TEKNİK):
     * Gerçek ortama tam uygun 2-3 maddeli somut önlemler.

4. Risk Skorları (L, S, Kinney, FMEA):
   Görseldeki riskin ciddiyetine uygun dinamik puanlar ver:
   - L (Olasılık 1-5): 1: Çok Düşük, 2: Düşük, 3: Orta, 4: Yüksek, 5: Çok Yüksek
   - S (Şiddet 1-5): 1: Hafif ilk yardım, 2: Tıbbi müdahale, 3: Uzuv kırığı/iş görmezlik, 4: Kalıcı sakatlık, 5: Can kaybı / Ölüm
   - Fine-Kinney: P (0.2-10), F (0.5-10), S_KINNEY (1-100)
   - FMEA: O (1-10), S_FMEA (1-10), D (1-10)

Lütfen SADECE aşağıdaki JSON formatında yanıt ver, markdown tırnağı veya başka metin ekleme:
{
  "topic": "Fotoğrafa Birebir Uygun İSG Konusu",
  "description": "Özetin özeti kısa mevcut durum (ASLA 'bu fotoğraf' vb. deme)",
  "hazard": "Somut tehlike kaynağı özeti (fotoğraftaki gerçek tehlikeyi yansıtan net özet)",
  "risk": "Ölüm, yaralanma vb. somut kaza ve zarar riski",
  "precaution": "1. Birinci somut önlem\\n2. İkinci somut önlem\\n3. Üçüncü somut önlem",
  "L": 4,
  "S": 5,
  "P": 6,
  "F": 6,
  "S_KINNEY": 15,
  "O": 6,
  "S_FMEA": 8,
  "D": 4
}\``;

  if (promptRegex.test(code)) {
    code = code.replace(promptRegex, newPrompt);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched:', filePath);
  } else {
    console.log('No replacement needed or pattern not matched for:', filePath);
  }
});
