const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Ensure required icons are imported
const iconsToAdd = ['Building2', 'Stethoscope', 'Sparkles', 'Bot', 'Loader2', 'Plus', 'Filter', 'CheckSquare', 'Square', 'RefreshCw'];
iconsToAdd.forEach(icon => {
  if (!content.includes(icon + ',')) {
    content = content.replace('import {', `import {\n  ${icon},`);
  }
});

// 2. Add props to EducationHubTab if not present
content = content.replace(
  /export default function EducationHubTab\(\{[\s\S]*?onNavigateToModule\s*\}\) \{/,
  `export default function EducationHubTab({
  company,
  currentUser,
  users = [],
  companies = [],
  osgbs = [],
  employees = [],
  onUpdateCompany,
  setActiveTab,
  onNavigateToModule,
  onUpdateAnyCompany
}) {`
);

// 3. Inject new states after `const [newEmpForm, setNewEmpForm] = useState...`
const newStates = `
  // MULTI-COMPANY (TOPLU FİRMA) SEÇİM MODU
  const [isMultiCompanyMode, setIsMultiCompanyMode] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(() => [company?.id].filter(Boolean));
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyHazardFilter, setCompanyHazardFilter] = useState('all');

  // TÜM ERİŞİLEBİLİR FİRMALAR
  const availableCompanies = useMemo(() => {
    let list = Array.isArray(companies) && companies.length > 0 ? [...companies] : [];
    if (list.length === 0 && typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('isg_companies') || '[]');
        if (Array.isArray(local) && local.length > 0) list = local;
      } catch (e) {}
    }
    if (company && !list.some(c => String(c.id) === String(company.id))) {
      list = [company, ...list];
    }
    return list;
  }, [companies, company]);

  // FİRMA VE OSGB'YE KAYITLI TÜM UZMANLAR & İŞYERİ HEKİMLERİ (Hızlı Seçim Listesi)
  const availableStaff = useMemo(() => {
    const staff = [];
    const seen = new Set();

    if (company?.info?.team && Array.isArray(company.info.team)) {
      company.info.team.forEach(m => {
        if (m?.name && !seen.has(m.name.toLowerCase())) {
          seen.add(m.name.toLowerCase());
          staff.push({
            name: m.name,
            role: m.role || 'İSG Uzmanı',
            certificateNo: m.certificateNo || '',
            source: \`\${company.name} Ekibi\`
          });
        }
      });
    }
    if (company?.info?.preparer?.name && !seen.has(company.info.preparer.name.toLowerCase())) {
      seen.add(company.info.preparer.name.toLowerCase());
      staff.push({
        name: company.info.preparer.name,
        role: company.info.preparer.role || 'İş Güvenliği Uzmanı',
        certificateNo: company.info.preparer.certificateNo || '',
        source: 'Hazırlayan'
      });
    }
    if (company?.isgUzmani && !seen.has(company.isgUzmani.toLowerCase())) {
      seen.add(company.isgUzmani.toLowerCase());
      staff.push({
        name: company.isgUzmani,
        role: 'İş Güvenliği Uzmanı',
        certificateNo: company.isgUzmaniBelgeNo || '',
        source: 'Firma İSG Uzmanı'
      });
    }
    if (company?.isyeriHekimi && !seen.has(company.isyeriHekimi.toLowerCase())) {
      seen.add(company.isyeriHekimi.toLowerCase());
      staff.push({
        name: company.isyeriHekimi,
        role: 'İşyeri Hekimi',
        certificateNo: company.isyeriHekimiBelgeNo || '',
        source: 'Firma İşyeri Hekimi'
      });
    }

    if (Array.isArray(users)) {
      users.forEach(u => {
        const uName = u.name || u.displayName || u.username;
        if (uName && !seen.has(uName.toLowerCase())) {
          const isDoc = u.role === 'hekim' || u.role === 'doktor' || (u.title || '').toLowerCase().includes('hekim');
          const isExp = u.role === 'uzman' || (u.title || '').toLowerCase().includes('uzman');
          const isDsp = u.role === 'dsp';
          if (isDoc || isExp || isDsp) {
            seen.add(uName.toLowerCase());
            staff.push({
              name: uName,
              role: isDoc ? 'İşyeri Hekimi' : (isDsp ? 'Diğer Sağlık Personeli' : 'İş Güvenliği Uzmanı'),
              certificateNo: u.certificateNo || u.certificateNumber || '',
              source: u.osgb?.name ? \`\${u.osgb.name} OSGB\` : 'OSGB / Sistem Görevlisi'
            });
          }
        }
      });
    }

    if (currentUser?.name && !seen.has(currentUser.name.toLowerCase())) {
      seen.add(currentUser.name.toLowerCase());
      staff.push({
        name: currentUser.name,
        role: currentUser.role === 'hekim' ? 'İşyeri Hekimi' : 'İş Güvenliği Uzmanı',
        certificateNo: currentUser.certificateNo || '',
        source: 'Giriş Yapan Kullanıcı'
      });
    }

    return staff;
  }, [company, users, currentUser]);

  // AI KONU VE ŞABLON MODAL STATE'LERİ
  const [showAiTopicModal, setShowAiTopicModal] = useState(false);
  const [showAiTemplateModal, setShowAiTemplateModal] = useState(false);
  const [aiSectorInput, setAiSectorInput] = useState('');
  const [aiRisksInput, setAiRisksInput] = useState('');
  const [isAiGeneratingTopics, setIsAiGeneratingTopics] = useState(false);
  const [isAiGeneratingTemplate, setIsAiGeneratingTemplate] = useState(false);

  // MANUEL KONU EKLEME INPUTU
  const [inlineNewTopic, setInlineNewTopic] = useState({
    name: '',
    category: 'Genel Konular',
    minutes: 45
  });
`;

if (!content.includes('isMultiCompanyMode')) {
  content = content.replace(
    /const \[newEmpForm, setNewEmpForm\] = useState\(\{[\s\S]*?\}\);/,
    `$& \n${newStates}`
  );
}

// 4. Inject AI Topic & Template generation functions and Multi-Company Curriculum calculator
const aiAndMultiCompFuncs = `
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
    const targetLessons = defs.totalHours; // 8, 12 veya 16 ders saati
    const targetMinutes = targetLessons * LESSON_MINUTES; // 360, 540 veya 720 dk
    const minRiskMinutes = minRisk.minMinutes; // 90, 135 veya 180 dk

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

  // Manuel Yeni Konu Ekle
  const handleAddInlineCustomTopic = (e) => {
    e.preventDefault();
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

if (!content.includes('handleAiGenerateWizardTopics')) {
  content = content.replace(
    /const handleStatutoryAutoDistribute = \(hoursToTarget\) => \{[\s\S]*?\n  \};\n/m,
    `$& \n${aiAndMultiCompFuncs}`
  );
}

// 5. Replace handleSaveTraining with the enhanced multi-company and single-company save
const upgradedHandleSaveTraining = `  // SAVE Training (Multi-Company & Single Company) and OPEN IN ORIGINAL MODULE FORMAT IMMEDIATELY
  const handleSaveTraining = () => {
    if (!wizardForm.title.trim()) {
      alert('Lütfen bir eğitim başlığı giriniz.');
      return;
    }

    // TOPLU FİRMA MODU (Seçilen tüm firmalar için tehlike sınıflarına göre otomatik dağıtım)
    if (isMultiCompanyMode) {
      const selectedComps = availableCompanies.filter(c => selectedCompanyIds.includes(c.id));
      if (selectedComps.length === 0) {
        alert('Lütfen en az bir firma seçiniz.');
        return;
      }

      let totalCreated = 0;
      let totalAssignedEmployees = 0;
      const allCompaniesCopy = [...availableCompanies];

      selectedComps.forEach(comp => {
        const compHClass = comp.info?.hazardClass || comp.hazardClass || 'Tehlikeli';
        const isTemel = wizardForm.trainingType === 'temel';
        
        // Her firmanın kendi tehlike sınıfına göre hesaplanmış müfredat
        const calculated = isTemel 
          ? calculateCompanyCurriculum(comp, wizardForm.topics)
          : {
              hazardClass: compHClass,
              totalHours: wizardForm.trainingType === 'ise_baslama' ? 2 : totalWizardDuration.hours,
              totalMinutes: wizardForm.trainingType === 'ise_baslama' ? 120 : totalWizardDuration.totalMinutes,
              topics: wizardForm.topics
            };

        // Bu firmanın kayıtlı personelleri (İnsan Kaynakları)
        const compEmployees = comp.employees || comp.personnel || comp.info?.employees || [];
        const compParticipants = compEmployees.length > 0 
          ? compEmployees.map(p => ({
              id: p.id || \`emp_\${Date.now()}_\${Math.random()}\`,
              name: p.fullName || \`\${p.name || ''} \${p.surname || ''}\`.trim() || 'Çalışan',
              tcNo: p.tcNo || p.tc || '',
              title: p.jobTitle || p.department || 'Çalışan',
              score: 85,
              passedTest: true
            }))
          : wizardForm.selectedParticipants.map(p => ({
              id: p.id,
              name: p.fullName || \`\${p.name} \${p.surname || ''}\`.trim(),
              tcNo: p.tcNo || '',
              title: p.jobTitle || p.department || 'Çalışan',
              score: 85,
              passedTest: true
            }));

        const newRecordId = \`edu_\${Date.now()}_\${comp.id}\`;
        const newRecord = {
          id: newRecordId,
          trainingType: wizardForm.trainingType,
          subType: wizardForm.subType,
          title: \`\${comp.name} - \${calculated.hazardClass} \${wizardForm.subType}\`,
          hazardClass: calculated.hazardClass,
          trainingCategory: wizardForm.trainingCategory,
          date: wizardForm.date,
          startTime: wizardForm.startTime,
          endTime: wizardForm.endTime,
          location: wizardForm.location,
          instructorName: wizardForm.instructorName,
          instructorTitle: wizardForm.instructorTitle,
          instructorCertNo: wizardForm.instructorCertNo,
          secondInstructorName: wizardForm.secondInstructorName,
          secondInstructorTitle: wizardForm.secondInstructorTitle,
          secondInstructorCertNo: wizardForm.secondInstructorCertNo,
          notes: wizardForm.notes,
          incidentSummary: wizardForm.incidentSummary,
          topics: calculated.topics.map(t => ({
            ...t,
            title: t.name || t.title,
            minutes: t.minutes || 45,
            hours: t.hours || (t.minutes ? t.minutes / LESSON_MINUTES : 1)
          })),
          totalDurationHours: calculated.totalHours,
          totalDurationMinutes: calculated.totalMinutes,
          totalMinutes: calculated.totalMinutes,
          participants: compParticipants,
          companyId: comp.id,
          companyName: comp.name,
          createdAt: new Date().toISOString()
        };

        let updatedCompData = {};
        if (wizardForm.trainingType === 'ise_baslama') {
          const currentInductions = Array.isArray(comp.jobInductionTrainings) ? comp.jobInductionTrainings : [];
          const newInductions = compParticipants.map(p => ({
            id: \`ind_\${Date.now()}_\${p.id || Math.random()}\`,
            employeeId: p.id,
            employeeFullName: p.name,
            employeeTcNo: p.tcNo,
            employeeTitle: p.title,
            employeeType: 'yeni_ise_giren',
            trainingDate: wizardForm.date,
            durationHours: 2,
            durationMinutes: 120,
            instructorName: wizardForm.instructorName,
            instructorTitle: wizardForm.instructorTitle,
            employerName: comp.info?.employerName || comp.name || '',
            employerTitle: 'İşveren Yetkilisi',
            topics: calculated.topics,
            status: 'completed',
            createdAt: new Date().toISOString()
          }));
          const currentRecords = Array.isArray(comp.educationRecords) ? comp.educationRecords : [];
          updatedCompData = {
            jobInductionTrainings: [...newInductions, ...currentInductions],
            induction_trainings: [...newInductions, ...currentInductions],
            educationRecords: [newRecord, ...currentRecords]
          };
        } else {
          const currentRecords = Array.isArray(comp.educationRecords) ? comp.educationRecords : [];
          updatedCompData = {
            educationRecords: [newRecord, ...currentRecords]
          };
        }

        if (String(comp.id) === String(company?.id) && typeof onUpdateCompany === 'function') {
          onUpdateCompany(updatedCompData);
        }

        if (typeof onUpdateAnyCompany === 'function') {
          onUpdateAnyCompany(comp.id, updatedCompData);
        }

        const targetIndex = allCompaniesCopy.findIndex(c => String(c.id) === String(comp.id));
        if (targetIndex >= 0) {
          allCompaniesCopy[targetIndex] = { ...allCompaniesCopy[targetIndex], ...updatedCompData };
        }

        totalCreated++;
        totalAssignedEmployees += compParticipants.length;
      });

      try {
        localStorage.setItem('isg_companies', JSON.stringify(allCompaniesCopy));
      } catch (e) {}

      alert(\`🎉 Başarılı! Seçilen \${totalCreated} firmanın eğitimi, her firmanın yasal tehlike sınıfına uygun sürelerle ve toplam \${totalAssignedEmployees} kayıtlı personeliyle başarıyla oluşturuldu!\`);
      setCurrentView('dashboard');
      return;
    }

    // TEK FİRMA MODU (Mevcut Mantık Devam Eder)
    if (wizardForm.selectedParticipants.length === 0) {
      alert('Lütfen en az bir katılımcı seçiniz.');
      return;
    }

    const newRecordId = \`edu_\${Date.now()}\`;
    const newRecord = {
      id: newRecordId,
      trainingType: wizardForm.trainingType,
      subType: wizardForm.subType,
      title: wizardForm.title,
      hazardClass: wizardForm.hazardClass,
      trainingCategory: wizardForm.trainingCategory,
      date: wizardForm.date,
      startTime: wizardForm.startTime,
      endTime: wizardForm.endTime,
      location: wizardForm.location,
      instructorName: wizardForm.instructorName,
      instructorTitle: wizardForm.instructorTitle,
      instructorCertNo: wizardForm.instructorCertNo,
      secondInstructorName: wizardForm.secondInstructorName,
      secondInstructorTitle: wizardForm.secondInstructorTitle,
      secondInstructorCertNo: wizardForm.secondInstructorCertNo,
      notes: wizardForm.notes,
      incidentSummary: wizardForm.incidentSummary,
      topics: wizardForm.topics.map(t => ({
        ...t,
        title: t.name || t.title,
        minutes: t.minutes || 45,
        hours: t.hours || (t.minutes ? t.minutes / LESSON_MINUTES : 1)
      })),
      totalDurationHours: totalWizardDuration.hours,
      totalDurationMinutes: totalWizardDuration.minutes,
      totalMinutes: totalWizardDuration.totalMinutes,
      participants: wizardForm.selectedParticipants.map(p => ({
        id: p.id,
        name: p.fullName || \`\${p.name} \${p.surname || ''}\`.trim(),
        tcNo: p.tcNo || '',
        title: p.jobTitle || p.department || 'Çalışan',
        score: 85,
        passedTest: true
      })),
      createdAt: new Date().toISOString()
    };

    if (wizardForm.trainingType === 'ise_baslama') {
      const currentInductions = Array.isArray(company?.jobInductionTrainings) ? company.jobInductionTrainings : [];
      const newInductions = wizardForm.selectedParticipants.map(p => ({
        id: \`ind_\${Date.now()}_\${p.id || Math.random()}\`,
        employeeId: p.id,
        employeeFullName: p.fullName || \`\${p.name} \${p.surname || ''}\`.trim(),
        employeeTcNo: p.tcNo || '',
        employeeTitle: p.jobTitle || 'Çalışan',
        employeeType: 'yeni_ise_giren',
        trainingDate: wizardForm.date,
        durationHours: 2,
        durationMinutes: 120,
        instructorName: wizardForm.instructorName,
        instructorTitle: wizardForm.instructorTitle,
        employerName: company?.info?.employerName || company?.name || '',
        employerTitle: 'İşveren Yetkilisi',
        topics: wizardForm.topics,
        status: 'completed',
        createdAt: new Date().toISOString()
      }));

      const updatedInductions = [...newInductions, ...currentInductions];
      const currentRecords = Array.isArray(company?.educationRecords) ? company.educationRecords : [];
      const updatedRecords = [newRecord, ...currentRecords];

      if (typeof onUpdateCompany === 'function') {
        onUpdateCompany({
          jobInductionTrainings: updatedInductions,
          induction_trainings: updatedInductions,
          educationRecords: updatedRecords
        });
      }

      setCurrentView('dashboard');
      setEmbeddedView({
        type: 'job_induction',
        subTab: 'print',
        record: newInductions[0] || newRecord
      });
    } else {
      const currentRecords = Array.isArray(company?.educationRecords) ? company.educationRecords : [];
      const updatedRecords = [newRecord, ...currentRecords];

      if (typeof onUpdateCompany === 'function') {
        onUpdateCompany({
          educationRecords: updatedRecords
        });
      }

      setCurrentView('dashboard');
      setEmbeddedView({
        type: 'isg_education',
        subTab: 'print_certificates',
        record: newRecord
      });
    }
  };`;

content = content.replace(
  /\/\/ SAVE Training and OPEN IN ORIGINAL MODULE FORMAT IMMEDIATELY[\s\S]*?setEmbeddedView\(\{[\s\S]*?record: newRecord\s*\}\);\s*\}\s*;/m,
  upgradedHandleSaveTraining
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('>>> Step 2 (state & save logic) applied.');
