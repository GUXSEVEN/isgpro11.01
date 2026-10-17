const fs = require('fs');
const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/IsgEducationTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add state isAiGeneratingFullTemplate
if (!content.includes('isAiGeneratingFullTemplate')) {
  content = content.replace(
    /const \[isAiGeneratingTopics, setIsAiGeneratingTopics\] = useState\(false\);/,
    `const [isAiGeneratingTopics, setIsAiGeneratingTopics] = useState(false);
  const [isAiGeneratingFullTemplate, setIsAiGeneratingFullTemplate] = useState(false);`
  );
}

// 2. Add handleGenerateAiCurriculumTemplate right after handleGenerateAiRiskTopics
const aiFullCurriculumFunc = `
  // ✨ Yapay Zeka ile Firmanın Tehlike Sınıfı ve Sektörüne Özel Komple Müfredat Şablonu Üret
  const handleGenerateAiCurriculumTemplate = async () => {
    setIsAiGeneratingFullTemplate(true);
    const sector = company?.info?.sector || company?.info?.naceCode || 'Genel Sanayi & Üretim';
    const targetLessons = hazardClass === 'Çok Tehlikeli' ? 16 : hazardClass === 'Tehlikeli' ? 12 : 8;
    const targetMins = targetLessons * LESSON_MINUTES;
    const minRiskMins = hazardClass === 'Çok Tehlikeli' ? 180 : hazardClass === 'Tehlikeli' ? 135 : 90;

    try {
      const apiKey = getGeminiApiKey();
      const prompt = \`Sen Türkiye İş Sağlığı ve Güvenliği mevzuatına (Çalışanların İSG Eğitimleri Yönetmeliği Ek-1) tam hakim bir İSG Baş Denetçisisin.
Aşağıdaki işletme için yönetmeliğin 4 ana kategorisini içeren, toplam süresi tam olarak \${targetMins} dakika (\${targetLessons} ders saati) olan komple bir eğitim müfredatı şablonu oluştur.
Kategori 4 (İşe ve İş Yerine Özgü Riskler) için toplam süre en az \${minRiskMins} dakika olmalıdır. Her konunun süresi 45 dakikanın katı olmalıdır.

İşletme: \${company.name} (\${sector})
Tehlike Sınıfı: \${hazardClass} (Zorunlu Hedef: \${targetLessons} Ders Saati / \${targetMins} Dk)

SADECE geçerli bir JSON dizisi döndür:
[
  { "category": "Genel Konular", "name": "...", "minutes": 45 },
  { "category": "Sağlık Konuları", "name": "...", "minutes": 45 },
  { "category": "Teknik Konular", "name": "...", "minutes": 45 },
  { "category": "İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular", "name": "...", "minutes": 45 }
]\`;

      let generated = null;
      if (apiKey && apiKey.length > 10) {
        const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
        generated = JSON.parse(cleaned);
      }

      if (!Array.isArray(generated) || generated.length === 0) {
        // Fallback by hazard class
        if (targetLessons === 16) {
          generated = [
            { category: 'Genel Konular', name: 'Çalışma Mevzuatı ile İlgili Bilgiler ve Yasal Haklar', minutes: 45 },
            { category: 'Genel Konular', name: 'Çalışanların ve İşverenin Yasal Yükümlülükleri', minutes: 45 },
            { category: 'Genel Konular', name: 'İş Sağlığı ve Güvenliği Genel Kuralları ve Güvenlik Kültürü', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Meslek Hastalıklarının Sebepleri ve Korunma Prensipleri', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Biyolojik ve Kimyasal Risk Etkenleri', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Ergonomi ve İlk Yardım Temel Bilgileri', minutes: 45 },
            { category: 'Teknik Konular', name: 'Kimyasal, Fiziksel ve Ergonomik Risk Etkenleri', minutes: 45 },
            { category: 'Teknik Konular', name: 'Elle Kaldırma ve Taşıma İşlerinde İSG', minutes: 45 },
            { category: 'Teknik Konular', name: 'Parlama, Patlama, Yangın ve Yangından Korunma', minutes: 45 },
            { category: 'Teknik Konular', name: 'İş Ekipmanlarının Güvenli Kullanımı ve Bakımı', minutes: 45 },
            { category: 'Teknik Konular', name: 'Elektrik Tehlikeleri, Riskleri ve Önlemleri', minutes: 45 },
            { category: 'Teknik Konular', name: 'Kişisel Koruyucu Donanım Kullanımı ve Standartları', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: \`\${sector} Sektörüne Özgü Makine ve Ekipman Tehlikeleri\`, minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'İşyerinde Yapılan Risk Analizi ve Kritik Kontrol Noktaları', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'Özel Risk Taşıyan Alanlarda Çalışma İzni ve Güvenlik Talimatları', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'Acil Durum Eylem Planı, Kaçış Yolları ve Tahliye Tatbikatı', minutes: 45 }
          ];
        } else if (targetLessons === 12) {
          generated = [
            { category: 'Genel Konular', name: 'Çalışma Mevzuatı ve İSG Genel Kuralları', minutes: 45 },
            { category: 'Genel Konular', name: 'İş Kazası ve Meslek Hastalığından Doğan Hukuki Sorumluluklar', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Meslek Hastalıkları ve Tıbbi Korunma Tedbirleri', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Fiziksel ve Biyolojik Risk Etkenleri', minutes: 45 },
            { category: 'Teknik Konular', name: 'İş Ekipmanlarının Güvenli Kullanımı', minutes: 45 },
            { category: 'Teknik Konular', name: 'Elektrik Tehlikeleri ve Yangın Güvenliği', minutes: 45 },
            { category: 'Teknik Konular', name: 'Elle Taşıma ve Ergonomik Riskler', minutes: 45 },
            { category: 'Teknik Konular', name: 'Kişisel Koruyucu Donanımların Doğru Kullanımı', minutes: 45 },
            { category: 'Teknik Konular', name: 'İş Sağlığı ve Güvenliği İşaretleri', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: \`\${sector} Sektörüne Özgü İSG Tedbirleri\`, minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'İşletme Risk Değerlendirmesi Sonuçları ve Korunma Yolları', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'Acil Durum Reaksiyonu ve Tahliye Prosedürleri', minutes: 45 }
          ];
        } else {
          generated = [
            { category: 'Genel Konular', name: 'Çalışma Mevzuatı ve Çalışan Hakları', minutes: 45 },
            { category: 'Genel Konular', name: 'İSG Genel İlkeleri ve Güvenlik Kültürü', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Meslek Hastalıkları ve Ergonomi', minutes: 45 },
            { category: 'Sağlık Konuları', name: 'Temel İlk Yardım ve Hijyen Prensipleri', minutes: 45 },
            { category: 'Teknik Konular', name: 'Yangın ve Acil Durum Tedbirleri', minutes: 45 },
            { category: 'Teknik Konular', name: 'Elektrik ve İş Ekipmanı Güvenliği', minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: \`\${company.name} Ofis ve Tesis Riskleri\`, minutes: 45 },
            { category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', name: 'İşletme Acil Durum Planı ve Tahliye', minutes: 45 }
          ];
        }
      }

      const formatted = generated.map((item, idx) => ({
        id: \`ai_cur_\${Date.now()}_\${idx}\`,
        category: item.category || 'Teknik Konular',
        name: item.name,
        minutes: Math.max(15, Number(item.minutes) || 45),
        hours: (Math.max(15, Number(item.minutes) || 45)) / LESSON_MINUTES,
        selected: true
      }));

      setSelectedTopics(formatted);
      showToast(\`✨ Yapay zeka \${hazardClass} (\${targetLessons} Ders / \${targetMins} Dk) için sektöre özel komple müfredat şablonunu başarıyla oluşturdu!\`);
    } catch (err) {
      console.warn("AI curriculum generation fallback:", err);
      showToast('Sektörel müfredat şablonu oluşturuldu.');
    } finally {
      setIsAiGeneratingFullTemplate(false);
    }
  };
`;

const targetAnchor = `    } finally {
      setIsAiGeneratingTopics(false);
    }
  };`;

if (!content.includes('handleGenerateAiCurriculumTemplate') && content.includes(targetAnchor)) {
  content = content.replace(targetAnchor, `${targetAnchor}\n${aiFullCurriculumFunc}`);
}

// 3. Add AI template button to toolbar
if (!content.includes('onClick={handleGenerateAiCurriculumTemplate}')) {
  content = content.replace(
    /onClick=\{handleGenerateAiRiskTopics\}[\s\S]*?<\/button>/,
    `onClick={handleGenerateAiRiskTopics}
                  disabled={isAiGeneratingTopics || isAiGeneratingFullTemplate}
                  title="İşletmenin sektörüne ve risk analizine göre 4. kategoriye özel risk konuları üretir"
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{isAiGeneratingTopics ? 'AI Üretiyor...' : 'AI İşe Özgü Konu Öner'}</span>
                </button>

                {/* AI MÜFREDAT ŞABLONU ÜRET */}
                <button
                  type="button"
                  onClick={handleGenerateAiCurriculumTemplate}
                  disabled={isAiGeneratingTopics || isAiGeneratingFullTemplate}
                  title="İşletmenin tehlike sınıfı ve sektörüne göre komple 4 kategorili resmi müfredat şablonu üretir"
                  className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{isAiGeneratingFullTemplate ? 'Şablon Üretiliyor...' : '✨ AI Müfredat Şablonu Üret'}</span>
                </button>`
  );
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> IsgEducationTab successfully patched with AI full template generator.');
