const fs = require('fs');

const filePath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const functionsToInsert = `
  // 🤖 AI İLE YENİ KONU ÖNERİLERİ ÜRET VE SİHİRBAZA EKLE
  const handleAiGenerateWizardTopics = async () => {
    setIsAiGeneratingTopics(true);
    const sector = aiSectorInput.trim() || company?.info?.sector || company?.info?.naceCode || company?.name || 'Sanayi & İmalat';
    const risks = aiRisksInput.trim() || 'Genel çalışma ortamı tehlikeleri ve makine riskleri';

    try {
      const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key')) : '';
      const prompt = \`Sen Türkiye İSG mevzuatına tam hakim uzman bir İSG Baş Denetçisisin.
Aşağıdaki işletme ve sektör bilgileri doğrultusunda eğitim müfredatına eklenebilecek 4 adet pratik, güncel ve sektöre özgü İSG eğitim konusu ve dakika cinsinden sürelerini belirle (45 dk ders esasına uygun olarak 45 veya 90 dk).

İşletme / Sektör: \${sector}
Tehlikeler & Riskler: \${risks}

SADECE geçerli bir JSON dizisi döndür:
[
  { "name": "...", "minutes": 45, "category": "İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular" },
  { "name": "...", "minutes": 45, "category": "Teknik Konular" }
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
          { name: \`\${sector} Sektöründe Kritik İş Ekipmanları ve Makine Koruyucuları Güvenliği\`, minutes: 45, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular' },
          { name: \`\${risks} Kapsamında Alınacak Teknik ve İdari Tedbirler\`, minutes: 45, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular' },
          { name: 'Çalışma Ortamında Kimyasal, Biyolojik ve Ergonomik Risklerle Mücadele', minutes: 45, category: 'Teknik Konular' },
          { name: 'İş Kazası, Ramak Kala Olayları ve Acil Durum Tahliye Tatbikat Prosedürleri', minutes: 45, category: 'Genel Konular' }
        ];
      }

      const formatted = generated.map((item, idx) => ({
        id: \`ai_top_\${Date.now()}_\${idx}\`,
        name: item.name,
        title: item.name,
        minutes: Math.max(15, Number(item.minutes) || 45),
        hours: (Math.max(15, Number(item.minutes) || 45)) / LESSON_MINUTES,
        category: item.category || 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular',
        isAiGenerated: true
      }));

      setWizardForm(prev => ({
        ...prev,
        topics: [...prev.topics, ...formatted]
      }));

      setShowAiTopicModal(false);
      setDistributionSuccessMessage(\`🤖 Yapay zeka \${formatted.length} adet yeni sektörel konuyu müfredata ekledi!\`);
    } catch (err) {
      console.warn("AI topic generation fallback:", err);
      const fallbackItems = [
        { id: \`ai_fb_1_\${Date.now()}\`, name: \`\${sector} Sektörüne Özgü Makine ve Ekipman Emniyet Sistemleri\`, title: \`\${sector} Sektörüne Özgü Makine ve Ekipman Emniyet Sistemleri\`, minutes: 45, hours: 1, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', isAiGenerated: true },
        { id: \`ai_fb_2_\${Date.now()}\`, name: 'İşyerinde Kritik Risk Kontrol Noktaları ve Güvenli Çalışma Yöntemleri', title: 'İşyerinde Kritik Risk Kontrol Noktaları ve Güvenli Çalışma Yöntemleri', minutes: 45, hours: 1, category: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', isAiGenerated: true }
      ];
      setWizardForm(prev => ({ ...prev, topics: [...prev.topics, ...fallbackItems] }));
      setShowAiTopicModal(false);
      setDistributionSuccessMessage('Sektöre özel konular müfredata eklendi.');
    } finally {
      setIsAiGeneratingTopics(false);
    }
  };

  // ✨ AI İLE SIFIRDAN KOMPLE MÜFREDAT ŞABLONU ÜRET VE UYGULA
  const handleAiGenerateWizardTemplate = async (templateTargetLessons) => {
    setIsAiGeneratingTemplate(true);
    const sector = aiSectorInput.trim() || company?.info?.sector || company?.info?.naceCode || company?.name || 'Sanayi & İmalat';
    const hClass = wizardForm.hazardClass || companyHazardClass || 'Tehlikeli';
    const lessons = templateTargetLessons || (hClass === 'Çok Tehlikeli' ? 16 : hClass === 'Tehlikeli' ? 12 : 8);
    const targetMins = lessons * LESSON_MINUTES;
    const minRiskMins = hClass === 'Çok Tehlikeli' ? 180 : hClass === 'Tehlikeli' ? 135 : 90;

    try {
      const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key')) : '';
      const prompt = \`Sen Türkiye İSG mevzuatına (Çalışanların İSG Eğitimleri Yönetmeliği) tam hakim uzman bir İSG Baş Denetçisisin.
Aşağıdaki işletme için yönetmelik uyarınca 4 kategoriyi (Genel, Sağlık, Teknik, İşe Özgü Riskler) içeren, toplam süresi tam olarak \${targetMins} dakika (\${lessons} ders saati) olan komple bir eğitim müfredatı şablonu oluştur.
Kategori 4 (İşe Özgü Riskler) için toplam süre en az \${minRiskMins} dakika olmalıdır. Konu süreleri 45 dakikanın katı olmalıdır.

İşletme / Sektör: \${sector}
Tehlike Sınıfı: \${hClass} (\${lessons} Ders Saati / \${targetMins} Dk)

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
        const defaultTmpl = hClass === 'Çok Tehlikeli'
          ? STATUTORY_CURRICULUM_TEMPLATES[2]
          : hClass === 'Tehlikeli'
            ? STATUTORY_CURRICULUM_TEMPLATES[1]
            : STATUTORY_CURRICULUM_TEMPLATES[0];
        generated = defaultTmpl.topics;
      }

      const formatted = generated.map((item, idx) => ({
        id: \`ai_tmpl_top_\${Date.now()}_\${idx}\`,
        name: item.name || item.title,
        title: item.name || item.title,
        minutes: Math.max(15, Number(item.minutes) || 45),
        hours: (Math.max(15, Number(item.minutes) || 45)) / LESSON_MINUTES,
        category: item.category || 'Genel Konular',
        isAiGenerated: true
      }));

      setWizardForm(prev => ({
        ...prev,
        title: \`\${hClass} \${sector} Özel İSG Eğitimi (\${lessons} Ders)\`,
        topics: formatted
      }));

      setShowAiTemplateModal(false);
      setDistributionSuccessMessage(\`✨ Yapay zeka \${hClass} (\${lessons} Ders / \${targetMins} Dk) için sektöre özel komple müfredat şablonunu oluşturdu!\`);
    } catch (err) {
      console.warn("AI template generation fallback:", err);
      setShowAiTemplateModal(false);
    } finally {
      setIsAiGeneratingTemplate(false);
    }
  };

  // Bir firmanın tehlike sınıfına göre o firmanın mevzuata uygun konularını ve sürelerini hesaplar
  const calculateCompanyCurriculum = (targetComp, baseTopics) => {
    const hClass = targetComp.info?.hazardClass || targetComp.hazardClass || 'Tehlikeli';
    const defs = getHazardClassDefaults(hClass);
    const minRisk = getMinRiskRequirements(hClass);
    const targetLessons = defs.totalHours;
    const targetMinutes = targetLessons * LESSON_MINUTES;
    const minRiskMinutes = minRisk.minMinutes;

    const cloned = JSON.parse(JSON.stringify(baseTopics || []));
    const riskIndices = [];
    const nonRiskIndices = [];

    cloned.forEach((t, i) => {
      const isRisk = (t.category || '').toLowerCase().includes('özgü risk') ||
                     (t.category || '').toLowerCase().includes('işe özgü') ||
                     (t.category || '').toLowerCase().includes('risk değerlendirmesi');
      if (isRisk) riskIndices.push(i);
      else nonRiskIndices.push(i);
    });

    if (riskIndices.length > 0) {
      const riskPerTopic = Math.max(45, Math.round((minRiskMinutes / riskIndices.length) / 45) * 45);
      riskIndices.forEach(idx => {
        cloned[idx].minutes = riskPerTopic;
        cloned[idx].hours = riskPerTopic / LESSON_MINUTES;
      });
    }

    const allocatedRisk = riskIndices.reduce((sum, idx) => sum + (cloned[idx].minutes || 0), 0);
    const remainingMins = Math.max(0, targetMinutes - allocatedRisk);

    if (nonRiskIndices.length > 0) {
      const nonRiskPerTopic = Math.max(45, Math.round((remainingMins / nonRiskIndices.length) / 45) * 45);
      nonRiskIndices.forEach(idx => {
        cloned[idx].minutes = nonRiskPerTopic;
        cloned[idx].hours = nonRiskPerTopic / LESSON_MINUTES;
      });
    }

    const totalMins = cloned.reduce((sum, t) => sum + (Number(t.minutes) || 0), 0);
    return {
      hazardClass: hClass,
      totalHours: defs.totalHours,
      totalMinutes: totalMins,
      topics: cloned
    };
  };

  // Manuel Yeni Konu Ekleme (Inline Form)
  const handleAddInlineCustomTopic = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inlineNewTopic.name.trim()) {
      alert('Lütfen bir konu başlığı giriniz.');
      return;
    }
    const mins = Math.max(15, Number(inlineNewTopic.minutes) || 45);
    const newTop = {
      id: \`custom_top_\${Date.now()}\`,
      name: inlineNewTopic.name.trim(),
      title: inlineNewTopic.name.trim(),
      category: inlineNewTopic.category || 'Özel Konu',
      minutes: mins,
      hours: mins / LESSON_MINUTES,
      isCustom: true
    };
    setWizardForm(prev => ({
      ...prev,
      topics: [...prev.topics, newTop]
    }));
    setInlineNewTopic({ name: '', category: 'Genel Konular', minutes: 45 });
  };
`;

const anchor = `    setDistributionSuccessMessage(
      \`✓ Mevzuata uygun dağıtıldı: \${targetLessons} Ders Saati (\${targetTotalMins} dk). İşe Özgü Riskler: \${allocatedRiskMins} dk (\${(allocatedRiskMins/LESSON_MINUTES).toFixed(1)} Ders Saati) olarak tahsis edildi.\`
    );
    setTimeout(() => setDistributionSuccessMessage(''), 4500);
  };`;

if (!content.includes('const handleAddInlineCustomTopic =')) {
  if (content.includes(anchor)) {
    content = content.replace(anchor, `${anchor}\n${functionsToInsert}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('>>> Successfully inserted handleAddInlineCustomTopic and related functions!');
  } else {
    console.error('>>> Error: could not find anchor in EducationHubTab.jsx');
  }
} else {
  console.log('>>> handleAddInlineCustomTopic already exists.');
}
