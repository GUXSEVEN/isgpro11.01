const fs = require('fs');

const hubPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(hubPath, 'utf8');

// 1. Import library functions
if (!content.includes('trainingTemplateLibrary')) {
  content = content.replace(
    /import React, \{ useState, useMemo, useRef, useEffect \} from 'react';/,
    `import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  getSavedTemplates,
  saveCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  getSavedCustomTopics,
  saveCustomTopic,
  deleteCustomTopic
} from '../../utils/trainingTemplateLibrary';`
  );
}

// 2. Add library and interactive AI states
const advancedStatesJSX = `
  // =========================================================================
  // GELİŞMİŞ ŞABLON & KONU KÜTÜPHANESİ STATE'LERİ
  // =========================================================================
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryActiveTab, setLibraryActiveTab] = useState('templates'); // 'templates' | 'topics'
  const [libraryFilterScope, setLibraryFilterScope] = useState('all'); // 'all' | 'company'
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [savedTemplatesList, setSavedTemplatesList] = useState(() => getSavedTemplates(company?.id));
  const [savedTopicsList, setSavedTopicsList] = useState(() => getSavedCustomTopics(company?.id));

  // Eğitimi Şablon Olarak Kaydetme Modalı
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    description: '',
    scope: 'all', // 'all' | 'current' | 'selected'
    targetCompanyIds: []
  });

  // Şablon Düzenleme Modu
  const [editingTemplateItem, setEditingTemplateItem] = useState(null);
  const [editingTopicInput, setEditingTopicInput] = useState({ name: '', category: 'Genel Konular', minutes: 45 });

  // İnteraktif AI Konu Öneri State'leri (Kullanıcının Elle Yazdığı Metne Göre Çoklu Seçim)
  const [aiCustomTopicPrompt, setAiCustomTopicPrompt] = useState('');
  const [aiSuggestedTopicsList, setAiSuggestedTopicsList] = useState([]);
  const [selectedAiTopicIds, setSelectedAiTopicIds] = useState(new Set());
  const [aiAlsoSaveToLibrary, setAiAlsoSaveToLibrary] = useState(false);
  const [aiTopicSaveScope, setAiTopicSaveScope] = useState('all'); // 'all' | 'current'

  // İnteraktif AI Şablon Üretim State'leri
  const [aiCustomTemplatePrompt, setAiCustomTemplatePrompt] = useState('');
  const [aiGeneratedCurriculumPreview, setAiGeneratedCurriculumPreview] = useState(null);
  const [aiTemplateSaveScope, setAiTemplateSaveScope] = useState('all');

  // Kütüphane listesini yenile
  const refreshLibraryData = () => {
    setSavedTemplatesList(getSavedTemplates(company?.id));
    setSavedTopicsList(getSavedCustomTopics(company?.id));
  };
`;

if (!content.includes('showLibraryModal')) {
  content = content.replace(
    /const \[inlineNewTopic, setInlineNewTopic\] = useState\(\{[\s\S]*?\}\);/,
    `$&\n${advancedStatesJSX}`
  );
}

// 3. Add Advanced Interactive AI and Library functions
const advancedFunctionsJSX = `
  // 🤖 1. İNTERAKTİF AI KONU ÖNERİLERİ AL (Kullanıcının Serbest Elle Yazdığı Metne Göre)
  const handleFetchInteractiveAiTopics = async () => {
    if (!aiCustomTopicPrompt.trim()) {
      alert('Lütfen önermek istediğiniz konu, tehlike veya odak alanını yazınız.');
      return;
    }
    setIsAiGeneratingTopics(true);
    const sector = company?.info?.sector || company?.name || 'Sanayi & İmalat';
    const userPrompt = aiCustomTopicPrompt.trim();

    try {
      const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key')) : '';
      const prompt = \`Sen Türkiye İSG mevzuatına tam hakim kıdemli bir İSG Baş Denetçisisin.
Kullanıcı şu özel konuyu veya odak alanını girdi: "\${userPrompt}"
İşletme Sektörü: \${sector}

Bu girdiye tam olarak odaklanan, 5 ila 8 adet farklı, pratik, yasal mevzuata uygun eğitim konusu ve dakika cinsinden sürelerini belirle (15, 30, 45 veya 90 dk).
Konuları çeşitlendir: hem teknik güvenlik kuralları, hem acil durum, hem çalışan davranışları, hem kontrol önlemleri içersin.

SADECE geçerli bir JSON dizisi (Array of Objects) döndür:
[
  { "name": "...", "minutes": 45, "category": "İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular" },
  { "name": "...", "minutes": 30, "category": "Teknik Konular" }
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
          { name: \`\${userPrompt}: Kritik Riskler ve Güvenli Çalışma Yöntemleri\`, minutes: 45, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular' },
          { name: \`\${userPrompt} Kapsamında Kullanılacak Zorunlu KKD ve Standartlar\`, minutes: 30, category: 'Teknik Konular' },
          { name: \`\${userPrompt} Alanında Acil Durum Reaksiyonu ve İlk Müdahale\`, minutes: 30, category: 'Genel Konular' },
          { name: \`\${userPrompt} ile İlgili Yasal Sorumluluklar ve Çalışan Hakları\`, minutes: 30, category: 'Genel Konular' },
          { name: \`\${userPrompt} Sahasında Bakım-Onarım ve Kilitleme-Etiketleme (LOTO)\`, minutes: 45, category: 'Teknik Konular' }
        ];
      }

      const formatted = generated.map((item, idx) => ({
        id: \`ai_sug_\${Date.now()}_\${idx}\`,
        name: item.name,
        minutes: Math.max(15, Number(item.minutes) || 45),
        hours: (Math.max(15, Number(item.minutes) || 45)) / LESSON_MINUTES,
        category: item.category || 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular'
      }));

      setAiSuggestedTopicsList(formatted);
      // Varsayılan olarak tümünü seçili yap
      setSelectedAiTopicIds(new Set(formatted.map(f => f.id)));
    } catch (err) {
      console.warn("AI prompt topics fallback:", err);
      const fallbackList = [
        { id: \`ai_sug_fb_1_\${Date.now()}\`, name: \`\${userPrompt} Alanında Güvenli Çalışma ve Saha Denetimi\`, minutes: 45, hours: 1, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular' },
        { id: \`ai_sug_fb_2_\${Date.now()}\`, name: \`\${userPrompt} Odaklı Risk Analizi Bulguları ve Alınacak Tedbirler\`, minutes: 45, hours: 1, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular' },
        { id: \`ai_sug_fb_3_\${Date.now()}\`, name: \`\${userPrompt} Kapsamında Kişisel Koruyucu Donanımlar\`, minutes: 30, hours: 0.67, category: 'Teknik Konular' }
      ];
      setAiSuggestedTopicsList(fallbackList);
      setSelectedAiTopicIds(new Set(fallbackList.map(f => f.id)));
    } finally {
      setIsAiGeneratingTopics(false);
    }
  };

  // 🤖 2. SEÇİLEN AI KONULARINI EĞİTİME VE/VEYA KÜTÜPHANEYE EKLE
  const handleApplySelectedAiTopics = () => {
    const selectedItems = aiSuggestedTopicsList.filter(item => selectedAiTopicIds.has(item.id));
    if (selectedItems.length === 0) {
      alert('Lütfen en az bir konu seçiniz.');
      return;
    }

    // 1. Eğitime Ekle
    const newWizardTopics = selectedItems.map(item => ({
      id: \`topic_ai_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
      name: item.name,
      title: item.name,
      minutes: item.minutes,
      hours: item.hours,
      category: item.category,
      isAiGenerated: true
    }));

    setWizardForm(prev => ({
      ...prev,
      topics: [...prev.topics, ...newWizardTopics]
    }));

    // 2. Kütüphaneye de Kaydet (Seçildiyse)
    if (aiAlsoSaveToLibrary) {
      selectedItems.forEach(item => {
        saveCustomTopic({
          name: item.name,
          category: item.category,
          minutes: item.minutes,
          scope: aiTopicSaveScope,
          companyId: aiTopicSaveScope === 'current' ? company?.id : null,
          companyName: aiTopicSaveScope === 'current' ? company?.name : 'Genel',
          isAiGenerated: true
        });
      });
      refreshLibraryData();
    }

    setShowAiTopicModal(false);
    setAiSuggestedTopicsList([]);
    setSelectedAiTopicIds(new Set());
    setAiCustomTopicPrompt('');
    setDistributionSuccessMessage(\`✓ Seçtiğiniz \${selectedItems.length} konu eğitime başarıyla eklendi!\`);
    setTimeout(() => setDistributionSuccessMessage(''), 4500);
  };

  // ✨ 3. İNTERAKTİF AI ŞABLON ÜRETİMİ (Elle Girilen Senaryoya Göre)
  const handleGenerateInteractiveAiTemplate = async () => {
    if (!aiCustomTemplatePrompt.trim()) {
      alert('Lütfen şablonun odaklanacağı senaryoyu veya açıklamayı giriniz.');
      return;
    }
    setIsAiGeneratingTemplate(true);
    const sector = company?.info?.sector || company?.name || 'Sanayi & İmalat';
    const hClass = wizardForm.hazardClass || companyHazardClass || 'Tehlikeli';
    const lessons = hClass === 'Çok Tehlikeli' ? 16 : hClass === 'Tehlikeli' ? 12 : 8;
    const targetMins = lessons * LESSON_MINUTES;
    const minRiskMins = hClass === 'Çok Tehlikeli' ? 180 : hClass === 'Tehlikeli' ? 135 : 90;
    const promptText = aiCustomTemplatePrompt.trim();

    try {
      const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key')) : '';
      const prompt = \`Sen Türkiye İSG mevzuatına tam hakim bir İSG Baş Denetçisisin.
Kullanıcı şu özel şablon talebini girdi: "\${promptText}"
İşletme Sektörü: \${sector}
Tehlike Sınıfı: \${hClass} (\${lessons} Ders Saati / \${targetMins} Dk)

Bu talebe göre 4 ana kategoriyi (Genel, Sağlık, Teknik, İşe Özgü Riskler) içeren, toplam süresi TAM \${targetMins} dakika olan komple bir müfredat şablonu oluştur.
Kategori 4 (İşe Özgü Riskler) en az \${minRiskMins} dakika olmalı ve kullanıcının talebine doğrudan odaklanmalıdır. Her konunun süresi 45 dakikanın katı olmalıdır.

SADECE geçerli bir JSON objesi döndür:
{
  "name": "Şablon Başlığı",
  "topics": [
    { "name": "...", "minutes": 45, "category": "Genel Konular" },
    { "name": "...", "minutes": 45, "category": "Sağlık Konuları" },
    { "name": "...", "minutes": 45, "category": "Teknik Konular" },
    { "name": "...", "minutes": 45, "category": "İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular" }
  ]
}\`;

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

      if (!generated || !Array.isArray(generated.topics) || generated.topics.length === 0) {
        const fallbackTmpl = hClass === 'Çok Tehlikeli' 
          ? STATUTORY_CURRICULUM_TEMPLATES[2] 
          : hClass === 'Tehlikeli' 
            ? STATUTORY_CURRICULUM_TEMPLATES[1] 
            : STATUTORY_CURRICULUM_TEMPLATES[0];
        generated = {
          name: \`\${hClass} - \${promptText} Özel Müfredatı\`,
          topics: fallbackTmpl.topics
        };
      }

      setAiGeneratedCurriculumPreview({
        name: generated.name || \`\${hClass} \${promptText} Şablonu\`,
        hazardClass: hClass,
        totalHours: lessons,
        totalMinutes: targetMins,
        topics: generated.topics.map((t, idx) => ({
          id: \`ai_tmpl_top_\${Date.now()}_\${idx}\`,
          name: t.name || t.title,
          category: t.category || 'Teknik Konular',
          minutes: Number(t.minutes) || 45,
          hours: (Number(t.minutes) || 45) / LESSON_MINUTES,
          selected: true
        }))
      });
    } catch (err) {
      console.warn("AI curriculum generation fallback:", err);
      alert('Yapay zeka şablonu oluştururken bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsAiGeneratingTemplate(false);
    }
  };

  // ✨ 4. ÜRETİLEN AI ŞABLONUNU EĞİTİME UYGULA VE/VEYA KÜTÜPHANEYE KAYDET
  const handleApplyAiGeneratedCurriculum = (saveToLib = false) => {
    if (!aiGeneratedCurriculumPreview) return;

    const finalTopics = aiGeneratedCurriculumPreview.topics.filter(t => t.selected !== false);
    if (finalTopics.length === 0) {
      alert('Lütfen şablonda en az bir konu bırakın.');
      return;
    }

    // Eğitime Uygula
    setWizardForm(prev => ({
      ...prev,
      title: aiGeneratedCurriculumPreview.name,
      topics: finalTopics.map(t => ({
        id: \`topic_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
        name: t.name,
        title: t.name,
        category: t.category,
        minutes: t.minutes,
        hours: t.hours,
        isAiGenerated: true
      }))
    }));

    // Kütüphaneye de Kaydet
    if (saveToLib) {
      saveCustomTemplate({
        name: aiGeneratedCurriculumPreview.name,
        scope: aiTemplateSaveScope,
        companyId: aiTemplateSaveScope === 'current' ? company?.id : null,
        companyName: aiTemplateSaveScope === 'current' ? company?.name : 'Genel',
        hazardClass: aiGeneratedCurriculumPreview.hazardClass,
        totalHours: aiGeneratedCurriculumPreview.totalHours,
        totalMinutes: aiGeneratedCurriculumPreview.totalMinutes,
        topics: finalTopics,
        isAiGenerated: true
      });
      refreshLibraryData();
    }

    setShowAiTemplateModal(false);
    setAiGeneratedCurriculumPreview(null);
    setAiCustomTemplatePrompt('');
    setDistributionSuccessMessage(\`✨ "\${aiGeneratedCurriculumPreview.name}" müfredatı eğitime uygulandı!\`);
    setTimeout(() => setDistributionSuccessMessage(''), 4500);
  };

  // 📂 5. MEVCUT EĞİTİMİ ŞABLON OLARAK KAYDET
  const handleSaveActiveTrainingAsTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateForm.name.trim()) {
      alert('Lütfen şablon için bir ad giriniz.');
      return;
    }

    const saved = saveCustomTemplate({
      name: newTemplateForm.name.trim(),
      description: newTemplateForm.description.trim(),
      scope: newTemplateForm.scope,
      companyId: newTemplateForm.scope === 'current' ? company?.id : null,
      companyName: newTemplateForm.scope === 'current' ? company?.name : 'Genel',
      targetCompanyIds: newTemplateForm.scope === 'selected' ? newTemplateForm.targetCompanyIds : [],
      hazardClass: wizardForm.hazardClass || companyHazardClass || 'Tehlikeli',
      totalHours: totalWizardDuration.hours,
      totalMinutes: totalWizardDuration.totalMinutes,
      topics: wizardForm.topics
    });

    if (saved) {
      refreshLibraryData();
      setShowSaveAsTemplateModal(false);
      setNewTemplateForm({ name: '', description: '', scope: 'all', targetCompanyIds: [] });
      setDistributionSuccessMessage(\`💾 "\${saved.name}" şablonu kütüphaneye başarıyla kaydedildi!\`);
      setTimeout(() => setDistributionSuccessMessage(''), 4500);
    }
  };

  // 📂 6. ŞABLONU TEK TIKLA İÇERİĞE EKLE
  const handleAddTemplateToTraining = (tmpl) => {
    if (!tmpl || !Array.isArray(tmpl.topics)) return;
    
    // Zaten ekli olmayanları filtrele veya doğrudan ekle
    const newItems = tmpl.topics.map(t => ({
      id: \`topic_tmpl_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
      name: t.name || t.title,
      title: t.name || t.title,
      category: t.category || 'Genel Konular',
      minutes: Number(t.minutes) || 45,
      hours: (Number(t.minutes) || 45) / LESSON_MINUTES
    }));

    setWizardForm(prev => ({
      ...prev,
      topics: [...prev.topics, ...newItems]
    }));

    setDistributionSuccessMessage(\`✓ "\${tmpl.name}" şablonundaki \${newItems.length} konu eğitime eklendi!\`);
    setTimeout(() => setDistributionSuccessMessage(''), 4500);
  };

  // 📂 7. ŞABLONU TEK TIKLA İÇERİKTEN KALDIR
  const handleRemoveTemplateFromTraining = (tmpl) => {
    if (!tmpl || !Array.isArray(tmpl.topics)) return;
    const topicNamesToRemove = new Set(tmpl.topics.map(t => (t.name || t.title || '').trim().toLowerCase()));

    setWizardForm(prev => ({
      ...prev,
      topics: prev.topics.filter(wt => !topicNamesToRemove.has((wt.name || wt.title || '').trim().toLowerCase()))
    }));

    setDistributionSuccessMessage(\`✓ "\${tmpl.name}" şablonunun konuları içerikten kaldırıldı.\`);
    setTimeout(() => setDistributionSuccessMessage(''), 4500);
  };

  // 📌 8. TEKİL KONUYU İÇERİĞE EKLE / KALDIR
  const handleToggleTopicInTraining = (topicItem) => {
    const topicName = (topicItem.name || topicItem.title || '').trim().toLowerCase();
    const isAlreadyIn = wizardForm.topics.some(wt => (wt.name || wt.title || '').trim().toLowerCase() === topicName);

    if (isAlreadyIn) {
      // Çıkar
      setWizardForm(prev => ({
        ...prev,
        topics: prev.topics.filter(wt => (wt.name || wt.title || '').trim().toLowerCase() !== topicName)
      }));
      setDistributionSuccessMessage(\`Konu eğitimden çıkarıldı: \${topicItem.name}\`);
    } else {
      // Ekle
      const newTop = {
        id: \`top_lib_\${Date.now()}\`,
        name: topicItem.name,
        title: topicItem.name,
        category: topicItem.category || 'Genel Konular',
        minutes: Number(topicItem.minutes) || 45,
        hours: (Number(topicItem.minutes) || 45) / LESSON_MINUTES
      };
      setWizardForm(prev => ({
        ...prev,
        topics: [...prev.topics, newTop]
      }));
      setDistributionSuccessMessage(\`✓ Konu eğitime eklendi: \${topicItem.name}\`);
    }
    setTimeout(() => setDistributionSuccessMessage(''), 4000);
  };

  // 📂 9. ŞABLON DÜZENLEME (Yeni Konu Ekle / Sil / Süre Değiştir)
  const handleAddTopicToEditingTemplate = (e) => {
    e.preventDefault();
    if (!editingTopicInput.name.trim() || !editingTemplateItem) return;

    const updatedTopics = [
      ...editingTemplateItem.topics,
      {
        name: editingTopicInput.name.trim(),
        category: editingTopicInput.category || 'Genel Konular',
        minutes: Number(editingTopicInput.minutes) || 45
      }
    ];

    const totalM = updatedTopics.reduce((s, t) => s + (Number(t.minutes) || 0), 0);
    const updatedTmpl = {
      ...editingTemplateItem,
      topics: updatedTopics,
      totalMinutes: totalM,
      totalHours: Number((totalM / 45).toFixed(1))
    };

    updateCustomTemplate(editingTemplateItem.id, updatedTmpl);
    setEditingTemplateItem(updatedTmpl);
    refreshLibraryData();
    setEditingTopicInput({ name: '', category: 'Genel Konular', minutes: 45 });
  };
`;

if (!content.includes('handleFetchInteractiveAiTopics')) {
  content = content.replace(
    /const handleAddInlineCustomTopic =[\s\S]*?\n  \};\n/m,
    `$&\n${advancedFunctionsJSX}`
  );
}

fs.writeFileSync(hubPath, content, 'utf8');
console.log('>>> Step 1 of advanced AI & library features applied.');
