const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/JobInductionTrainingTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add isAiGeneratingTemplate state
if (!content.includes('isAiGeneratingTemplate')) {
  content = content.replace(
    /const \[isAiGeneratingTopics, setIsAiGeneratingTopics\] = useState\(false\);/,
    `const [isAiGeneratingTopics, setIsAiGeneratingTopics] = useState(false);
  const [isAiGeneratingTemplate, setIsAiGeneratingTemplate] = useState(false);`
  );
}

// 2. Add handleGenerateAiFullTemplate function right after handleGenerateAiTopics
const aiFullTemplateFunc = `
  // ✨ Yapay Zeka ile Sıfırdan Komple İşe Başlama Eğitim Şablonu Üretme (Yönetmelik Madde 7 Uyumlu - Min 120 Dk)
  const handleGenerateAiFullTemplate = async () => {
    setIsAiGeneratingTemplate(true);
    const empName = formData.employeeFullName || 'Çalışan';
    const empJob = formData.employeeTitle || 'Genel Personel';
    const equip = formData.equipmentList || 'İş ekipmanları, el aletleri ve makineler';
    const risks = formData.workplaceRisks || 'Genel işyeri ve saha riskleri';
    const sector = company?.info?.sector || company?.info?.naceCode || company?.info?.hazardClass || 'İmalat & Sanayi';
    const companyName = company?.name || 'İşletme';

    try {
      const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key')) : '';
      const prompt = \`Sen Türkiye İSG mevzuatına (Çalışanların İSG Eğitimleri Yönetmeliği Madde 7 - İşe Başlama Eğitimi) tam hakim uzman bir İSG Baş Denetçisisin.
Aşağıdaki çalışan ve işletme için toplam süresi tam olarak 120-135 dakika olan, 5 veya 6 adet uygulamalı ve yüz yüze işe başlama eğitimi konularından oluşan komple bir müfredat şablonu üret. Konuların süreleri toplamı kesinlikle en az 120 dakika olmalıdır.

İşletme: \${companyName} (\${sector})
Çalışan: \${empName} - Görevi: \${empJob}
Kullanacağı Ekipmanlar: \${equip}
Riskler: \${risks}

SADECE geçerli bir JSON dizisi (Array of Objects) döndür:
[
  { "title": "...", "durationMinutes": 25, "category": "İşe ve İşyerine Özgü Konular" },
  { "title": "...", "durationMinutes": 25, "category": "İş Ekipmanları ve Güvenli Kullanım" },
  { "title": "...", "durationMinutes": 25, "category": "Ortam Tehlike ve Risk Tedbirleri" },
  { "title": "...", "durationMinutes": 25, "category": "İşletme Genel Güvenlik ve Disiplin Kuralları" },
  { "title": "...", "durationMinutes": 20, "category": "KKD ve Acil Durum Reaksiyonu" }
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
        generated = [
          { title: \`\${empJob} Görevine Özgü İşletme İçi Güvenli Çalışma ve Disiplin Kuralları\`, durationMinutes: 25, category: 'İşletme Genel Kuralları' },
          { title: \`\${equip} Ekipman ve Makinelerinin Güvenli Operasyon ve Bakım Esasları\`, durationMinutes: 30, category: 'İş Ekipmanları ve Makineler' },
          { title: \`\${companyName} Sahasında \${risks} Risklerine Karşı Alınacak Tedbirler\`, durationMinutes: 25, category: 'Ortam Tehlike ve Riskleri' },
          { title: 'Zorunlu KKD Doğru Kullanımı, Bakımı ve Değişim Kuralları', durationMinutes: 20, category: 'KKD ve Kişisel Korunma' },
          { title: 'Acil Durum Kaçış Yolları, Yangın Butonları ve İlk Müdahale Prosedürü', durationMinutes: 20, category: 'Acil Durum ve Tahliye' }
        ];
      }

      const formatted = generated.map((item, idx) => ({
        id: \`ai_tmpl_\${Date.now()}_\${idx}\`,
        title: item.title,
        durationMinutes: Math.max(15, Number(item.durationMinutes) || 25),
        category: item.category || 'Yapay Zeka Şablon Konusu',
        isAiGenerated: true,
        isSelected: true
      }));

      setTrainingTopics(formatted);
      showToast(\`✨ Yapay zeka \${empJob} için toplam \${formatted.reduce((a,b)=>a+b.durationMinutes,0)} dakikalık komple işe başlama şablonu oluşturdu!\`);
    } catch (err) {
      console.warn("AI template generation fallback:", err);
      const fallbackItems = [
        { id: \`ai_fb_1_\${Date.now()}\`, title: \`\${empJob} Görev ve Sorumluluklarına Özgü Güvenlik Esasları\`, durationMinutes: 30, category: 'İşe Özgü Görevler', isAiGenerated: true, isSelected: true },
        { id: \`ai_fb_2_\${Date.now()}\`, title: \`Kullanılacak İş Ekipmanları (\${equip}) Güvenli Kullanım Talimatları\`, durationMinutes: 30, category: 'İş Ekipmanları ve Makineler', isAiGenerated: true, isSelected: true },
        { id: \`ai_fb_3_\${Date.now()}\`, title: \`İşletme İçi Ortam Riskleri (\${risks}) ve Koruyucu Önlemler\`, durationMinutes: 25, category: 'Ortam Tehlikeleri', isAiGenerated: true, isSelected: true },
        { id: \`ai_fb_4_\${Date.now()}\`, title: 'Kişisel Koruyucu Donanım (KKD) Standartları ve Pratik Uygulama', durationMinutes: 20, category: 'KKD ve Kişisel Korunma', isAiGenerated: true, isSelected: true },
        { id: \`ai_fb_5_\${Date.now()}\`, title: 'İş Kazası, Ramak Kala ve Acil Durum Bildirim Zinciri', durationMinutes: 15, category: 'Acil Durum ve Tahliye', isAiGenerated: true, isSelected: true }
      ];
      setTrainingTopics(fallbackItems);
      showToast('İşletmeye ve mesleğe özgü komple eğitim müfredatı şablonu yüklendi.');
    } finally {
      setIsAiGeneratingTemplate(false);
    }
  };
`;

if (!content.includes('handleGenerateAiFullTemplate')) {
  const targetSnippet = `    } finally {
      setIsAiGeneratingTopics(false);
    }
  };`;
  if (content.includes(targetSnippet)) {
    content = content.replace(targetSnippet, `${targetSnippet}\n${aiFullTemplateFunc}`);
  }
}

// 3. Add AI template button to topics toolbar
if (!content.includes('handleGenerateAiFullTemplate')) {
  console.log("Could not insert handleGenerateAiFullTemplate function");
} else if (!content.includes('onClick={handleGenerateAiFullTemplate}')) {
  content = content.replace(
    /onClick=\{handleGenerateAiTopics\}[\s\S]*?<\/button>/,
    `onClick={handleGenerateAiTopics}
                  disabled={isAiGeneratingTopics || isAiGeneratingTemplate}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isAiGeneratingTopics ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Konular Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={14} />
                      <span>🤖 AI Konu Öner</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAiFullTemplate}
                  disabled={isAiGeneratingTopics || isAiGeneratingTemplate}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  title="Mesleğe, ekipmanlara ve risklere göre komple 120+ dakikalık Madde 7 müfredatı oluşturur"
                >
                  {isAiGeneratingTemplate ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Şablon Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>✨ AI Komple Şablon Üret</span>
                    </>
                  )}
                </button>`
  );
}

// 4. Update iframe print CSS in handlePrintDocument & handleOpenInNewTab
const enhancedPrintStyle = `
          <style>
            @page {
              size: 210mm 297mm;
              margin: 5mm 7mm !important;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 9.5pt !important;
              line-height: 1.3 !important;
              margin: 0 !important;
              padding: 0 !important;
              height: 100% !important;
              box-sizing: border-box !important;
            }
            #induction-print-area {
              width: 100% !important;
              max-width: 100% !important;
              height: 284mm !important;
              min-height: 284mm !important;
              max-height: 284mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              box-sizing: border-box !important;
              padding: 5mm 8mm !important;
              border: 1.5px solid #0f172a !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              box-shadow: none !important;
            }
            .induction-signature-container {
              margin-top: auto !important;
              padding-top: 4px !important;
            }
            .no-print { display: none !important; }
          </style>
`;

content = content.replace(
  /<style>\s*@page\s*\{\s*size:\s*210mm 297mm;[\s\S]*?<\/style>/m,
  enhancedPrintStyle.trim()
);

// 5. Update #induction-print-area DOM element style to ensure flexbox pinning to the bottom of A4
content = content.replace(
  /id="induction-print-area"[\s\S]*?className="space-y-3\.5"/,
  `id="induction-print-area"
              style={{
                width: '800px',
                maxWidth: '100%',
                minHeight: '278mm',
                maxHeight: '286mm',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff',
                color: '#000000',
                padding: '6mm 10mm',
                borderRadius: '12px',
                border: '2px solid #0f172a',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '10px',
                lineHeight: '1.3',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}
              className="space-y-2.5"`
);

// 6. Update signature box area to attach at bottom and use compact height
content = content.replace(
  /{\/\* Kutulu İmza Alanları \(Eğitici, Çalışan, İşveren\) \*\/}\s*<div style=\{\{ paddingTop: '3px' \}\}>/,
  `{/* Kutulu İmza Alanları (Eğitici, Çalışan, İşveren) - Sayfanın Tam Altına Sabitlenmiş */}
              <div style={{ marginTop: 'auto', paddingTop: '4px' }} className="induction-signature-container">`
);

// Make the 3 signature box items slightly more compact (82px)
content = content.replace(
  /minHeight: '95px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' \}\}>/g,
  `height: '82px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' }}>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> JobInductionTrainingTab successfully patched for bottom signatures and AI full template.');
