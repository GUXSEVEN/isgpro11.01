const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/IsgEducationTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Helper function: getEmployeeTitle and improved isSameEmployee
const getEmployeeTitleMarker = "export const getEmployeeFullName = (emp) => {";
if (!content.includes("export const getEmployeeTitle =")) {
  const getEmployeeTitleCode = `export const getEmployeeTitle = (emp) => {
  if (!emp) return 'Çalışan';
  return emp.professionTitle || emp.jobTitle || emp.title || emp.department || (emp.professionCode ? \`Meslek Kodu: \${emp.professionCode}\` : 'Çalışan');
};

`;
  content = content.replace(getEmployeeTitleMarker, getEmployeeTitleCode + getEmployeeTitleMarker);
  console.log("✓ Added getEmployeeTitle helper");
}

// Replace isSameEmployee with Turkish-safe normalization
const oldIsSameEmployeeMarker = `export const isSameEmployee = (emp1, emp2) => {
  if (!emp1 || !emp2) return false;
  // 1. TC Kimlik No ile kesin eşleşme
  if (emp1.tcNo && emp2.tcNo) {
    const t1 = String(emp1.tcNo).replace(/\\D/g, '').trim();
    const t2 = String(emp2.tcNo).replace(/\\D/g, '').trim();
    if (t1.length >= 11 && t2.length >= 11 && t1 === t2) return true;
  }
  // 2. İsim & Soyisim ile eşleşme
  const n1 = getEmployeeFullName(emp1).toLowerCase().replace(/\\s+/g, ' ').trim();
  const n2 = getEmployeeFullName(emp2).toLowerCase().replace(/\\s+/g, ' ').trim();
  if (n1 && n2 && n1 === n2) return true;
  return false;
};`;

const newIsSameEmployee = `export const isSameEmployee = (emp1, emp2) => {
  if (!emp1 || !emp2) return false;
  // 1. TC Kimlik No ile kesin eşleşme
  if (emp1.tcNo && emp2.tcNo) {
    const t1 = String(emp1.tcNo).replace(/\\D/g, '').trim();
    const t2 = String(emp2.tcNo).replace(/\\D/g, '').trim();
    if (t1.length >= 11 && t2.length >= 11 && t1 === t2) return true;
  }
  // 2. İsim & Soyisim ile eşleşme (Türkçe karakter ve boşluk duyarlı)
  const norm = (s) => String(s || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().replace(/\\s+/g, ' ').trim();
  const n1 = norm(getEmployeeFullName(emp1));
  const n2 = norm(getEmployeeFullName(emp2));
  if (n1 && n2 && n1 === n2) return true;
  return false;
};`;

if (content.includes(oldIsSameEmployeeMarker)) {
  content = content.replace(oldIsSameEmployeeMarker, newIsSameEmployee);
  console.log("✓ Updated isSameEmployee with Turkish-safe normalization");
}

// 2. Replace rawCompanyEmployees logic to merge company.employees and company.info.employees
const oldEmployeesMarker = `  const rawCompanyEmployees = Array.isArray(company?.employees) ? company.employees : (Array.isArray(company?.info?.employees) ? company.info.employees : []);
  const companyEmployees = useMemo(() => {
    return rawCompanyEmployees.filter(e => e && (e.name || e.fullName || e.tcNo) && e.status !== 'passive');
  }, [rawCompanyEmployees]);`;

const newEmployeesCode = `  const rawCompanyEmployees = useMemo(() => {
    const list1 = Array.isArray(company?.employees) && company.employees.length > 0 ? company.employees : [];
    const list2 = Array.isArray(company?.info?.employees) && company.info.employees.length > 0 ? company.info.employees : [];
    if (list1.length === 0 && list2.length === 0) return [];
    if (list1.length > 0 && list2.length === 0) return list1;
    if (list2.length > 0 && list1.length === 0) return list2;
    // İK modülünden ve şirket bilgilerinden gelen personelleri birleştirip tekilleştir
    const map = new Map();
    [...list1, ...list2].forEach(emp => {
      if (!emp) return;
      const tc = emp.tcNo ? String(emp.tcNo).replace(/\\D/g, '').trim() : '';
      const nameKey = getEmployeeFullName(emp).toLowerCase().trim();
      const key = (tc && tc.length >= 11) ? tc : (emp.id || nameKey);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, emp);
      } else {
        map.set(key, { ...map.get(key), ...emp });
      }
    });
    return Array.from(map.values());
  }, [company?.employees, company?.info?.employees]);

  const companyEmployees = useMemo(() => {
    return rawCompanyEmployees.filter(e => e && (e.name || e.fullName || e.tcNo) && e.status !== 'passive');
  }, [rawCompanyEmployees]);`;

if (content.includes(oldEmployeesMarker)) {
  content = content.replace(oldEmployeesMarker, newEmployeesCode);
  console.log("✓ Updated rawCompanyEmployees to cleanly merge HR employees");
}

// 3. Add editingRecordId and selectedUntrainedIds state
const stateHookMarker = "const [validityYears, setValidityYears] = useState(defaults.validityYears);";
if (!content.includes("const [editingRecordId, setEditingRecordId]")) {
  const newStates = `const [validityYears, setValidityYears] = useState(defaults.validityYears);
  const [editingRecordId, setEditingRecordId] = useState(null); // Düzenlenen mevcut eğitim kaydı ID'si
  const [selectedUntrainedIds, setSelectedUntrainedIds] = useState([]); // Eğitimi eksik seçilen çalışanlar`;
  content = content.replace(stateHookMarker, newStates);
  console.log("✓ Added editingRecordId and selectedUntrainedIds states");
}

// 4. Update handleAddEmployeeToTraining and handleAddAllUntrainedToTraining to use getEmployeeTitle
const oldAddEmpMarker = `  // Tekil Çalışanı Eğitime Ekle
  const handleAddEmployeeToTraining = (emp) => {
    if (!emp) return;
    const name = getEmployeeFullName(emp);
    const tcNo = emp.tcNo || '';
    const title = emp.jobTitle || emp.title || emp.department || 'Çalışan';

    if (participants.some(p => isSameEmployee(p, emp))) {
      showToast(\`\${name} zaten bu eğitime eklenmiş.\`);
      setActiveTab('form');
      return;
    }

    setParticipants(prev => [
      ...prev,
      {
        id: \`p-\${emp.id || Date.now()}\`,
        tcNo,
        name,
        title,
        passedTest: true
      }
    ]);
    showToast(\`✓ \${name} eğitim katılımcı listesine eklendi.\`);
    setActiveTab('form');
  };`;

const newAddEmpCode = `  // Tekil Çalışanı Eğitime Ekle
  const handleAddEmployeeToTraining = (emp) => {
    if (!emp) return;
    const name = getEmployeeFullName(emp);
    const tcNo = emp.tcNo || '';
    const title = getEmployeeTitle(emp);

    if (participants.some(p => isSameEmployee(p, emp))) {
      showToast(\`\${name} zaten bu eğitime eklenmiş.\`);
      setActiveTab('form');
      return;
    }

    setParticipants(prev => [
      ...prev,
      {
        id: \`p-\${emp.id || Date.now()}\`,
        tcNo,
        name,
        title,
        passedTest: true
      }
    ]);
    showToast(\`✓ \${name} eğitim katılımcı listesine eklendi. Bilgileri onaylayıp kaydet butonuna basabilirsiniz.\`);
    setActiveTab('form');
  };

  // Seçilen veya Tüm Eğitimsiz Çalışanlarla Eğitim Kaydı Oluşturma Formuna Aktar
  const handleAddSelectedUntrainedToTraining = () => {
    const listToProcess = selectedUntrainedIds.length > 0
      ? untrainedList.filter(u => selectedUntrainedIds.includes(u.employee.id || u.employee.tcNo))
      : untrainedList;

    if (listToProcess.length === 0) {
      alert('Eğitimi eksik olan çalışan bulunmuyor.');
      return;
    }

    const newItems = listToProcess
      .filter(u => !participants.some(p => isSameEmployee(p, u.employee)))
      .map(u => ({
        id: \`p-\${u.employee.id || Math.random()}-\${Date.now()}\`,
        tcNo: u.employee.tcNo || '',
        name: getEmployeeFullName(u.employee),
        title: getEmployeeTitle(u.employee),
        passedTest: true
      }));

    if (newItems.length === 0) {
      showToast('Seçilen tüm çalışanlar zaten katılımcı listesinde yer alıyor.');
      setActiveTab('form');
      return;
    }

    setParticipants(prev => [...prev, ...newItems]);
    setSelectedUntrainedIds([]);
    showToast(\`✓ \${newItems.length} çalışan eğitim formuna aktarıldı. Bilgileri kontrol edip 'Eğitim Kaydı Oluştur / Kaydet' butonuna basınız.\`);
    setActiveTab('form');
  };`;

if (content.includes(oldAddEmpMarker)) {
  content = content.replace(oldAddEmpMarker, newAddEmpCode);
  console.log("✓ Updated handleAddEmployeeToTraining and added handleAddSelectedUntrainedToTraining");
}

// 5. Add handleStartEditRecord and handleCancelEdit before handleSaveEducation
const saveEducationMarker = "  // EĞİTİM KAYDINI VERİTABANINA KAYDETME\n  const handleSaveEducation = (e) => {";

const editHandlersCode = `  // ===========================================================================
  // EĞİTİM KAYDINI DÜZENLEME VE FORMA YÜKLEME
  // ===========================================================================
  const handleStartEditRecord = (rec) => {
    if (!rec) return;
    setEditingRecordId(rec.id);
    setEducationTitle(rec.title || \`\${hazardClass} İşyeri Temel İSG Eğitimi\`);
    setEducationDate(rec.date || new Date().toISOString().split('T')[0]);
    setTotalHours(rec.totalHours || defaults.totalHours);
    setValidityYears(rec.validityYears || defaults.validityYears);
    setIsRemoteEducation(Boolean(rec.isRemoteEducation));
    setRemoteEducationDetails(rec.remoteEducationDetails || 'LMS Uzaktan Eğitim Sistemi (2 Ders Saati)');
    setEmployerName(rec.employerName || company?.info?.official || 'İşveren Yetkilisi');
    setEmployerTitle(rec.employerTitle || 'İşveren Vekili');

    // Eğitici Uzman
    if (rec.iguName) {
      setIguMode('manual');
      setManualIguName(rec.iguName);
      setManualIguCertNo(rec.iguCertNo || '');
    }
    // Eğitici Hekim
    if (rec.iyhName) {
      setIyhMode('manual');
      setManualIyhName(rec.iyhName);
      setManualIyhCertNo(rec.iyhCertNo || '');
    }

    // Katılımcılar
    setParticipants(Array.isArray(rec.participants) ? rec.participants.map(p => ({ ...p })) : []);

    // Soru Bankası
    if (Array.isArray(rec.quizQuestions) && rec.quizQuestions.length > 0) {
      setQuizQuestions(rec.quizQuestions);
    }

    // Konular ve Süreleri Yükle
    const recordTopics = Array.isArray(rec.topics) ? rec.topics : [];
    const mergedTopics = DEFAULT_TOPICS.map(defTopic => {
      const match = recordTopics.find(t => t.id === defTopic.id || t.name === defTopic.name);
      if (match) {
        const m = Number(match.minutes) || (Number(match.hours) * LESSON_MINUTES) || defTopic.defaultMinutes || 45;
        return {
          ...defTopic,
          ...match,
          selected: true,
          minutes: m,
          hours: m / LESSON_MINUTES
        };
      }
      return {
        ...defTopic,
        selected: false,
        minutes: defTopic.defaultMinutes || 45,
        hours: (defTopic.defaultMinutes || 45) / LESSON_MINUTES
      };
    });

    // Özel veya AI üretimi olup standart listede olmayan konuları da ekle
    recordTopics.forEach(recTopic => {
      const alreadyIn = mergedTopics.some(t => t.id === recTopic.id || t.name === recTopic.name);
      if (!alreadyIn) {
        const m = Number(recTopic.minutes) || (Number(recTopic.hours) * LESSON_MINUTES) || 45;
        mergedTopics.push({
          ...recTopic,
          id: recTopic.id || \`custom-\${Date.now()}-\${Math.random()}\`,
          selected: true,
          minutes: m,
          hours: m / LESSON_MINUTES
        });
      }
    });

    setSelectedTopics(mergedTopics);
    setActiveTab('form');
    showToast(\`✏️ "\${rec.title}" eğitimi düzenleme için forma yüklendi. Değişiklikleri yapıp 'Kaydet' butonuna basınız.\`);
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEducationTitle(\`\${hazardClass} İşyeri Temel İSG Eğitimi\`);
    setEducationDate(new Date().toISOString().split('T')[0]);
    setTotalHours(defaults.totalHours);
    setValidityYears(defaults.validityYears);
    setIsRemoteEducation(false);
    setParticipants([]);
    setSelectedTopics(DEFAULT_TOPICS.map(t => ({
      ...t,
      selected: true,
      minutes: t.defaultMinutes || 45,
      hours: (t.defaultMinutes || 45) / LESSON_MINUTES
    })));
    showToast('Eğitim düzenleme işlemi iptal edildi.');
  };

`;

if (!content.includes("const handleStartEditRecord =")) {
  content = content.replace(saveEducationMarker, editHandlersCode + saveEducationMarker);
  console.log("✓ Added handleStartEditRecord and handleCancelEdit");
}

// 6. Update handleSaveEducation to support editingRecordId (updating existing record and reflecting to certificates)
const oldSaveEducationBodyMarker = `    const newRecord = {
      id: \`edu-\${Date.now()}\`,
      title: educationTitle,
      date: educationDate,
      expiryDate: calculatedExpiryDate(),
      totalHours: Number(totalHours), // Ders saati (8, 12, 16)
      totalLessons: totalSelectedTopicLessons,
      totalMinutes: totalSelectedTopicMinutes,
      validityYears: Number(validityYears),
      hazardClass,

      // Uzaktan Eğitim
      isRemoteEducation,
      remoteEducationDetails: isRemoteEducation ? remoteEducationDetails : '',

      // İşveren Yetkilisi ve Eğiticiler
      employerName,
      employerTitle,
      iguName: resolvedIgu.name,
      iguCertNo: resolvedIgu.certNo,
      iyhName: resolvedIyh.name,
      iyhCertNo: resolvedIyh.certNo,

      // Konular ve Katılımcılar
      topics: activeSelectedTopics.map(t => {
        const m = Number(t.minutes) || (Number(t.hours) * LESSON_MINUTES) || 45;
        const dur = formatDurationDetails(m);
        return {
          ...t,
          minutes: m,
          hours: m / LESSON_MINUTES,
          hoursPart: dur.hours,
          minutesPart: dur.remMins,
          timeStr: dur.timeStr,
          lessonsFormatted: dur.lessonsFormatted
        };
      }),
      participants,
      quizQuestions,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [newRecord, ...educationRecords];
    if (typeof onUpdateCompany === 'function') {
      onUpdateCompany({ educationRecords: updatedRecords });
    }

    showToast('Temel İSG Eğitimi kaydı, tutanak ve sertifikalar başarıyla kaydedildi!');
    setActiveRecordForPrint(newRecord);
    setActiveSingleParticipantId(null);
    setActiveTab('print_tutanak');`;

const newSaveEducationBody = `    // Konu ve Süreleri Hazırla
    const formattedTopics = activeSelectedTopics.map(t => {
      const m = Number(t.minutes) || (Number(t.hours) * LESSON_MINUTES) || 45;
      const dur = formatDurationDetails(m);
      return {
        ...t,
        minutes: m,
        hours: m / LESSON_MINUTES,
        hoursPart: dur.hours,
        minutesPart: dur.remMins,
        timeStr: dur.timeStr,
        lessonsFormatted: dur.lessonsFormatted
      };
    });

    if (editingRecordId) {
      // DÜZENLEME MODU: Mevcut kaydı güncelle ve sertifikaya yeni konuları/süreleri aktar
      const existing = educationRecords.find(r => r.id === editingRecordId) || {};
      const updatedRecord = {
        ...existing,
        id: editingRecordId,
        title: educationTitle,
        date: educationDate,
        expiryDate: calculatedExpiryDate(),
        totalHours: Number(totalHours),
        totalLessons: totalSelectedTopicLessons,
        totalMinutes: totalSelectedTopicMinutes,
        validityYears: Number(validityYears),
        hazardClass,
        isRemoteEducation,
        remoteEducationDetails: isRemoteEducation ? remoteEducationDetails : '',
        employerName,
        employerTitle,
        iguName: resolvedIgu.name,
        iguCertNo: resolvedIgu.certNo,
        iyhName: resolvedIyh.name,
        iyhCertNo: resolvedIyh.certNo,
        topics: formattedTopics,
        participants,
        quizQuestions,
        updatedAt: new Date().toISOString()
      };

      const updatedRecords = educationRecords.map(r => r.id === editingRecordId ? updatedRecord : r);
      if (typeof onUpdateCompany === 'function') {
        onUpdateCompany({ educationRecords: updatedRecords });
      }

      setEditingRecordId(null);
      setActiveRecordForPrint(updatedRecord);
      setActiveSingleParticipantId(null);
      showToast('✓ Eğitim kaydı başarıyla güncellendi! Yeni konular, süreler ve katılımcı bilgileri sertifikaya aktarıldı.');
      setActiveTab('print_certificates');
      return;
    }

    // YENİ KAYIT MODU
    const newRecord = {
      id: \`edu-\${Date.now()}\`,
      title: educationTitle,
      date: educationDate,
      expiryDate: calculatedExpiryDate(),
      totalHours: Number(totalHours), // Ders saati (8, 12, 16)
      totalLessons: totalSelectedTopicLessons,
      totalMinutes: totalSelectedTopicMinutes,
      validityYears: Number(validityYears),
      hazardClass,

      // Uzaktan Eğitim
      isRemoteEducation,
      remoteEducationDetails: isRemoteEducation ? remoteEducationDetails : '',

      // İşveren Yetkilisi ve Eğiticiler
      employerName,
      employerTitle,
      iguName: resolvedIgu.name,
      iguCertNo: resolvedIgu.certNo,
      iyhName: resolvedIyh.name,
      iyhCertNo: resolvedIyh.certNo,

      // Konular ve Katılımcılar
      topics: formattedTopics,
      participants,
      quizQuestions,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [newRecord, ...educationRecords];
    if (typeof onUpdateCompany === 'function') {
      onUpdateCompany({ educationRecords: updatedRecords });
    }

    showToast('✓ Temel İSG Eğitimi kaydı oluşturuldu! Çalışanlar eğitim alanlara aktarıldı ve sertifikalar üretildi.');
    setActiveRecordForPrint(newRecord);
    setActiveSingleParticipantId(null);
    setActiveTab('print_certificates');`;

if (content.includes(oldSaveEducationBodyMarker)) {
  content = content.replace(oldSaveEducationBodyMarker, newSaveEducationBody);
  console.log("✓ Updated handleSaveEducation to seamlessly handle both edit update & new save");
}

// 7. Add Edit Banner and update submit button in activeTab === 'form'
const formStartMarker = "{activeTab === 'form' && (\n        <form onSubmit={handleSaveEducation} className=\"space-y-6\">";
const newFormStart = `{activeTab === 'form' && (
        <form onSubmit={handleSaveEducation} className="space-y-6">

          {/* DÜZENLEME MODU BİLGİLENDİRME BANNERI */}
          {editingRecordId && (
            <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border-2 border-sky-500 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Edit3 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded text-[10px] font-black uppercase tracking-wider">
                      Eğitim Kaydı Düzenleme Modu
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {editingRecordId}</span>
                  </div>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    "{educationTitle}" kaydı düzenleniyor
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Konuları, süreleri veya personelleri değiştirdikten sonra alttaki "Değişiklikleri Kaydet & Sertifikaları Otomatik Güncelle" butonuna basınız.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                Düzenlemeyi İptal Et
              </button>
            </div>
          )}`;

if (content.includes(formStartMarker)) {
  content = content.replace(formStartMarker, newFormStart);
  console.log("✓ Added Edit Banner to form");
}

// Update form submit button
const oldSubmitMarker = `          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>Eğitimi Kaydet, Tutanak ve Sertifikaları Oluştur</span>
            </button>
          </div>`;

const newSubmitCode = `          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2 flex-wrap">
            {editingRecordId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                İptal Et
              </button>
            )}
            <button
              type="submit"
              className={\`px-8 py-3.5 font-black rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition-transform cursor-pointer \${
                editingRecordId
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sky-600/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/20'
              }\`}
            >
              {editingRecordId ? (
                <>
                  <RefreshCw size={18} />
                  <span>Değişiklikleri Kaydet & Sertifikaları Otomatik Güncelle</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Eğitim Kaydı Oluştur / Kaydet & Sertifikaları Hazırla</span>
                </>
              )}
            </button>
          </div>`;

if (content.includes(oldSubmitMarker)) {
  content = content.replace(oldSubmitMarker, newSubmitCode);
  console.log("✓ Updated Form Submit Button with dynamic edit state");
}

// 8. Add "Düzenle" button to each card in activeTab === 'records'
const oldRecordActionsMarker = `                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRecordForPrint(rec);
                            setReportFontSize('8pt');
                            setReportLineHeight('1.2');
                            setReportPadding('8mm');
                            setSignatureStyle('compact');
                            setReportZoom(1.0);
                            setActiveTab('print_tutanak');
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <FileText size={14} /> Resmi Tutanak
                        </button>`;

const newRecordActionsCode = `                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleStartEditRecord(rec)}
                          className="bg-sky-600 hover:bg-sky-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          title="Eğitimin konularını, sürelerini, tarihini ve katılımcılarını düzenle"
                        >
                          <Edit3 size={14} /> Düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveRecordForPrint(rec);
                            setReportFontSize('8pt');
                            setReportLineHeight('1.2');
                            setReportPadding('8mm');
                            setSignatureStyle('compact');
                            setReportZoom(1.0);
                            setActiveTab('print_tutanak');
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <FileText size={14} /> Resmi Tutanak
                        </button>`;

if (content.includes(oldRecordActionsMarker)) {
  content = content.replace(oldRecordActionsMarker, newRecordActionsCode);
  console.log("✓ Added 'Düzenle' button to cards in records tab");
}

// 9. Add "Eğitimi Düzenle" to renderReportingToolbar
const toolbarActionsMarker = `          {/* Sağ Aksiyon Butonları: Yazdır / PDF Kaydet & Yeni Sekmede Aç */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenInNewTab(orientation)}`;

const newToolbarActionsCode = `          {/* Sağ Aksiyon Butonları: Eğitimi Düzenle & Yazdır / PDF Kaydet & Yeni Sekmede Aç */}
          <div className="flex items-center gap-2">
            {activeRecordForPrint && (
              <button
                type="button"
                onClick={() => handleStartEditRecord(activeRecordForPrint)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                title="Eğitim konularını, sürelerini ve katılımcılarını düzenle"
              >
                <Edit3 size={14} />
                <span>Eğitimi Düzenle</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenInNewTab(orientation)}`;

if (content.includes(toolbarActionsMarker)) {
  content = content.replace(toolbarActionsMarker, newToolbarActionsCode);
  console.log("✓ Added 'Eğitimi Düzenle' to Certificate/Tutanak toolbar");
}

// 10. Update activeTab === 'uncompleted_list' table & actions
const oldUncompletedActionsMarker = `            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleAddAllUntrainedToTraining}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Eğitimi eksik tüm personelleri yeni eğitim formuna aktarır"
              >
                <PlusCircle size={15} />
                <span>Tümünü Eğitime Aktar ({untrainedList.length})</span>
              </button>`;

const newUncompletedActionsCode = `            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleAddSelectedUntrainedToTraining}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
                title="Seçilen personellerle doğrudan eğitim kaydı formu açar"
              >
                <GraduationCap size={16} />
                <span>
                  {selectedUntrainedIds.length > 0
                    ? \`Seçilenlerle Eğitim Kaydı Oluştur (\${selectedUntrainedIds.length})\`
                    : \`Tümüyle Eğitim Kaydı Oluştur (\${untrainedList.length})\`}
                </span>
              </button>`;

if (content.includes(oldUncompletedActionsMarker)) {
  content = content.replace(oldUncompletedActionsMarker, newUncompletedActionsCode);
  console.log("✓ Updated top action button in uncompleted_list");
}

// Also in uncompleted_list table headers and rows, add checkbox and update row action
const oldTableHeadMarker = `                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-10">No</th>`;

const newTableHeadCode = `                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={untrainedList.length > 0 && selectedUntrainedIds.length === untrainedList.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUntrainedIds(untrainedList.map(u => u.employee.id || u.employee.tcNo));
                            } else {
                              setSelectedUntrainedIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                          title="Tümünü Seç / Kaldır"
                        />
                      </th>
                      <th className="p-3 w-10">No</th>`;

if (content.includes(oldTableHeadMarker)) {
  content = content.replace(oldTableHeadMarker, newTableHeadCode);
  console.log("✓ Added select-all checkbox to table header in uncompleted_list");
}

// Update table rows in uncompleted_list
const oldTableRowStartMarker = `                          <tr key={u.employee.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <td className="p-3 text-slate-400">{idx + 1}</td>`;

const newTableRowStartCode = `                          <tr key={u.employee.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedUntrainedIds.includes(u.employee.id || u.employee.tcNo)}
                                onChange={(e) => {
                                  const id = u.employee.id || u.employee.tcNo;
                                  setSelectedUntrainedIds(prev => 
                                    e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
                                  );
                                }}
                                className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-slate-400">{idx + 1}</td>`;

if (content.includes(oldTableRowStartMarker)) {
  content = content.replace(oldTableRowStartMarker, newTableRowStartCode);
  console.log("✓ Added row checkbox to uncompleted_list table");
}

// Update row action button from "Eğitime Ekle" to "Eğitim Kaydı Oluştur"
const oldRowBtnMarker = `                              <button
                                type="button"
                                onClick={() => handleAddEmployeeToTraining(u.employee)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
                                title="Bu çalışanı doğrudan eğitime katılımcı olarak ekle"
                              >
                                <GraduationCap size={13} />
                                <span>Eğitime Ekle</span>
                              </button>`;

const newRowBtnCode = `                              <button
                                type="button"
                                onClick={() => handleAddEmployeeToTraining(u.employee)}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
                                title="Bu çalışanı katılımcı olarak ekleyip eğitim kaydı oluşturma ekranına geçer"
                              >
                                <GraduationCap size={13} />
                                <span>Eğitim Kaydı Oluştur</span>
                              </button>`;

if (content.includes(oldRowBtnMarker)) {
  content = content.replace(oldRowBtnMarker, newRowBtnCode);
  console.log("✓ Updated row button in uncompleted_list to 'Eğitim Kaydı Oluştur'");
}

// Write back
fs.writeFileSync(targetFile, content, 'utf8');
console.log("✓ IsgEducationTab.jsx successfully patched!");
