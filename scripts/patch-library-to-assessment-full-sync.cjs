const fs = require('fs');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(targetPath)) {
  console.error('Target file not found:', targetPath);
  process.exit(1);
}

// 1. Create a timestamped backup
const backupPath = targetPath + '.bak_library_sync_' + Date.now();
fs.copyFileSync(targetPath, backupPath);
console.log('✔ Backup created at:', backupPath);

let content = fs.readFileSync(targetPath, 'utf8');

// =========================================================================
// 1. UPDATE Select COMPONENT TO PRESERVE VALUES NOT IN OPTIONS
// =========================================================================
const oldSelect = `const Select = ({ label, value, onChange, options, placeholder = "Seçiniz" }) => (<div className="w-full"> <label className="text-xs font-bold text-slate-500 uppercase">{label}</label> <select className="w-full mt-1 p-2 border rounded-lg text-sm bg-white outline-none focus:border-indigo-500" value={value} onChange={e => onChange(e.target.value)}> <option value="">{placeholder}</option> {options.map((o, i) => <option key={i} value={o}>{o}</option>)} </select> </div>);`;

const newSelect = `const Select = ({ label, value, onChange, options = [], placeholder = "Seçiniz" }) => {
  const opts = Array.isArray(options) ? options : [];
  const allOpts = (value && !opts.includes(value)) ? [value, ...opts] : opts;
  return (
    <div className="w-full">
      {label && <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>}
      <select className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 outline-none focus:border-indigo-500" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {allOpts.map((o, i) => <option key={i} value={o}>{o}</option>)}
      </select>
    </div>
  );
};`;

if (content.includes(oldSelect)) {
  content = content.replace(oldSelect, newSelect);
  console.log('✔ 1. Select component updated to preserve imported department values');
} else {
  console.warn('⚠ 1. oldSelect pattern not found exactly, skipping Select replace');
}

// =========================================================================
// 2. UPDATE ImportModal COMPONENT (Using exact boundary markers)
// =========================================================================
const importModalStartMarker = 'function ImportModal({ library, currentRisks, onClose, onImport }) {';
const nextFunctionMarker = 'function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {';

const startIndex = content.indexOf(importModalStartMarker);
const endIndex = content.indexOf(nextFunctionMarker);

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  const newImportModal = `function ImportModal({ library, currentRisks, onClose, onImport }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // 1. Mevcut risklerin köken ID'lerini (originId) bir kümeye (Set) alıyoruz.
  const existingOriginIds = new Set(currentRisks.map(r => r.originId).filter(Boolean));
  const existingIds = new Set(currentRisks.map(r => r.id));

  // Mevcut kütüphanedeki tüm benzersiz bölümler
  const availableDepts = useMemo(() => {
    const depts = new Set();
    (library || []).forEach(item => {
      if (item.department && typeof item.department === 'string' && item.department.trim()) {
        depts.add(item.department.trim());
      }
    });
    return Array.from(depts);
  }, [library]);

  const toggle = (id) => {
    if (existingOriginIds.has(id) || existingIds.has(id)) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredLibrary = useMemo(() => {
    return (library || []).filter(item => {
      const matchDept = deptFilter === 'ALL' || item.department === deptFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || [
        item.hazard, item.risk, item.precaution, item.category,
        item.department, item.activity, item.description
      ].some(t => t && String(t).toLowerCase().includes(q));
      return matchDept && matchSearch;
    });
  }, [library, search, deptFilter]);

  // Henüz eklenmemiş olan filtrelenmiş maddeler
  const availableItems = filteredLibrary.filter(item => !existingOriginIds.has(item.id) && !existingIds.has(item.id));
  const isAllAvailableSelected = availableItems.length > 0 && availableItems.every(i => selected.includes(i.id));

  const toggleSelectAll = () => {
    if (isAllAvailableSelected) {
      const idsToRemove = new Set(availableItems.map(i => i.id));
      setSelected(prev => prev.filter(id => !idsToRemove.has(id)));
    } else {
      const newSelected = new Set([...selected, ...availableItems.map(i => i.id)]);
      setSelected(Array.from(newSelected));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Library className="text-blue-600" size={20} /> Kütüphaneden Analize Aktar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kütüphaneden seçtiğiniz maddeler; faaliyet, bölüm, tehlike, risk ve tüm puanlarıyla eksiksiz aktarılır.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={20} /></button>
        </div>

        {/* Arama & Filtre & Toplu Seçim Çubuğu */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tehlike, risk, bölüm veya faaliyet ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {availableDepts.length > 0 && (
              <select
                className="py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="ALL">Tüm Bölümler ({availableDepts.length})</option>
                {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            {availableItems.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <CheckSquare size={14} className={isAllAvailableSelected ? "text-blue-600" : "text-slate-400"} />
                {isAllAvailableSelected ? "Seçimi Kaldır" : \`Tümünü Seç (\${availableItems.length})\`}
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {filteredLibrary.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <Library size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Eşleşen kütüphane maddesi bulunamadı.</p>
            </div>
          ) : (
            filteredLibrary.map(item => {
              const isAdded = existingOriginIds.has(item.id) || existingIds.has(item.id);
              const isSelected = selected.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={\`p-3.5 border rounded-xl flex gap-3 transition-all relative select-none \${
                    isAdded
                      ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 cursor-not-allowed opacity-75'
                      : isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-sm ring-1 ring-blue-500 cursor-pointer'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer'
                  }\`}
                >
                  {/* Sol İkon (Checkbox veya Onay) */}
                  <div className={\`w-5 h-5 mt-0.5 border-2 rounded-md flex items-center justify-center flex-shrink-0 transition-colors \${
                    isAdded
                      ? 'border-green-500 bg-green-500 text-white'
                      : isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }\`}>
                    {isAdded ? <Check size={12} /> : isSelected && <CheckSquare size={12} />}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded uppercase">
                          {item.category || 'Genel'}
                        </span>

                        {item.department && (
                          <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-900/40 flex items-center gap-1">
                            <Layers size={10} /> Bölüm: {item.department}
                          </span>
                        )}

                        {item.activity && (
                          <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 flex items-center gap-1">
                            <Hammer size={10} /> Faaliyet: {item.activity}
                          </span>
                        )}

                        {isAdded && (
                          <span className="text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-900/50 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Aktarıldı
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={\`font-bold text-xs md:text-sm mb-1 \${isAdded ? 'text-green-950 dark:text-green-200' : 'text-slate-800 dark:text-slate-100'}\`}>
                      {item.hazard}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {item.risk}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-800 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Mevcut Durum: </span>{item.description}
                      </div>
                    )}
                    {item.precaution && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <span className="font-bold">Önlem: </span>{item.precaution}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {selected.length > 0 ? (
              <span className="text-blue-600 dark:text-blue-400 font-bold">{selected.length} madde seçildi</span>
            ) : (
              <span>Aktarmak istediğiniz maddeleri işaretleyin</span>
            )}
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">İptal</button>
            <button
              onClick={() => onImport(library.filter(i => selected.includes(i.id)))}
              disabled={selected.length === 0}
              className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
            >
              <CopyPlus size={16} /> Seçilenleri Analize Aktar ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}\n`;

  content = content.slice(0, startIndex) + newImportModal + content.slice(endIndex);
  console.log('✔ 2. ImportModal upgraded precisely using exact markers');
} else {
  console.error('❌ 2. Boundary markers for ImportModal not found!', startIndex, endIndex);
  process.exit(1);
}

// =========================================================================
// 3. UPDATE handleBatchAddToLibrary TO PRESERVE DEPARTMENT & ACTIVITY
// =========================================================================
const oldBatchAdd = `  const handleBatchAddToLibrary = () => {
    const selectedRisks = risks.filter(r => selectedIds.includes(r.id));
    const itemsToAdd = selectedRisks.map(r => ({
      folderId: null,
      category: r.topic || r.department || 'Genel',
      description: r.description || '',
      hazard: r.hazard, risk: r.risk, precaution: r.precaution,
      defaultL: r.L || 1, defaultS: r.S || 1
    }));

    onAddToLibrary(itemsToAdd);
    setSelectedIds([]);
  };`;

const newBatchAdd = `  const handleBatchAddToLibrary = () => {
    const selectedRisks = risks.filter(r => selectedIds.includes(r.id));
    const itemsToAdd = selectedRisks.map(r => ({
      folderId: null,
      category: r.topic || 'Genel',
      department: r.department || '',
      activity: r.activity || '',
      description: r.description || '',
      hazard: r.hazard || '',
      risk: r.risk || '',
      precaution: r.precaution || '',
      defaultL: Number(r.L || 1),
      defaultS: Number(r.S || 1),
      P: Number(r.P || 0.5),
      F: Number(r.F || 1),
      S: Number(r.S_KINNEY || r.S || 1),
      O: Number(r.O || 1),
      S_FMEA: Number(r.S_FMEA || 1),
      D: Number(r.D || 1),
      processOwner: r.processOwner || '',
      affectedPersons: r.affectedPersons || '',
      deadline: r.deadline || '',
      controlDate: r.controlDate || ''
    }));

    onAddToLibrary(itemsToAdd);
    setSelectedIds([]);
  };`;

if (content.includes(oldBatchAdd)) {
  content = content.replace(oldBatchAdd, newBatchAdd);
  console.log('✔ 3. handleBatchAddToLibrary updated to save department and activity');
} else {
  console.warn('⚠ 3. oldBatchAdd not found exactly');
}

// =========================================================================
// 4. UPDATE SINGLE ADD TO LIBRARY IN AssessmentView
// =========================================================================
const oldSingleAdd = `onAddToLibrary({ folderId: null, category: risk.topic || risk.department || 'Genel', hazard: risk.hazard, risk: risk.risk, precaution: risk.precaution, defaultL: risk.L, defaultS: risk.S });`;
const newSingleAdd = `onAddToLibrary({ folderId: null, category: risk.topic || 'Genel', department: risk.department || '', activity: risk.activity || '', description: risk.description || '', hazard: risk.hazard || '', risk: risk.risk || '', precaution: risk.precaution || '', defaultL: Number(risk.L || 1), defaultS: Number(risk.S || 1), P: Number(risk.P || 0.5), F: Number(risk.F || 1), S: Number(risk.S_KINNEY || risk.S || 1), O: Number(risk.O || 1), S_FMEA: Number(risk.S_FMEA || 1), D: Number(risk.D || 1) });`;

if (content.includes(oldSingleAdd)) {
  content = content.replace(oldSingleAdd, newSingleAdd);
  console.log('✔ 4. Single onAddToLibrary updated with department and activity');
} else {
  console.warn('⚠ 4. oldSingleAdd not found');
}

// =========================================================================
// 5. UPDATE AssessmentView CARD BADGE TO SHOW ACTIVITY
// =========================================================================
const oldCardBadges = `{risk.department && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase border border-slate-200"><Layers size={10} /> {risk.department}</span>}
                              {risk.topic && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase border border-indigo-100"><Folder size={10} /> {risk.topic}</span>}`;

const newCardBadges = `{risk.department && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase border border-slate-200"><Layers size={10} /> {risk.department}</span>}
                              {risk.activity && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase border border-amber-200"><Hammer size={10} /> {risk.activity}</span>}
                              {risk.topic && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase border border-indigo-100"><Folder size={10} /> {risk.topic}</span>}`;

if (content.includes(oldCardBadges)) {
  content = content.replace(oldCardBadges, newCardBadges);
  console.log('✔ 5. AssessmentView card badges updated to display activity');
} else {
  console.warn('⚠ 5. oldCardBadges not found');
}

// =========================================================================
// 6. UPDATE Workspace onImportRisks HANDLER
// =========================================================================
const oldWorkspaceImportRisks = `              // MEVCUT IMPORT RISKS FONKSIYONU
              onImportRisks={(items) => {
                if (activeAssessmentId) {
                  onImportRisks(activeAssessmentId, items);
                  alert(\`\${items.length} madde '\${company.assessments.find(a => a.id === activeAssessmentId)?.name}' analizine eklendi.\`);
                } else {
                  alert("Lütfen önce bir risk analizi dosyası açın.");
                }
              }}`;

const newWorkspaceImportRisks = `              // MEVCUT IMPORT RISKS FONKSIYONU
              onImportRisks={(items) => {
                if (activeAssessmentId) {
                  onImportRisks(activeAssessmentId, items);
                } else if (company.assessments && company.assessments.length === 1) {
                  onImportRisks(company.assessments[0].id, items);
                } else {
                  alert("Lütfen önce bir risk analizi dosyası açın veya seçin.");
                }
              }}`;

if (content.includes(oldWorkspaceImportRisks)) {
  content = content.replace(oldWorkspaceImportRisks, newWorkspaceImportRisks);
  console.log('✔ 6. Workspace onImportRisks streamlined');
} else {
  console.warn('⚠ 6. oldWorkspaceImportRisks not found');
}

// =========================================================================
// 7. THE MAIN FIX: UPDATE handleImportRisks IN App.jsx
// =========================================================================
const oldHandleImportRisks = `  const handleImportRisks = (assessmentId, selectedLibItems) => {
    const targetAssessment = activeCompany.assessments.find(a => a.id === assessmentId);
    if (!targetAssessment) return;
    const existingOriginIds = new Set(targetAssessment.risks.map(r => r.originId).filter(Boolean));
    const existingIds = new Set(targetAssessment.risks.map(r => r.id));
    const itemsToAdd = selectedLibItems.filter(libItem => {
      if (existingOriginIds.has(libItem.id)) return false;
      if (existingIds.has(libItem.id)) return false;
      return true;
    });
    if (itemsToAdd.length === 0) { alert("Seçilenlerin hepsi zaten mevcut."); return; }
    const newRisks = itemsToAdd.map(item => {
      const valL = Number(item.defaultL || item.L || 1);
      const valS = Number(item.defaultS || item.S || 1);
      const valP = Number(item.P || item.defaultP || 0.5);
      const valF = Number(item.F || item.defaultF || 1);
      const valSK = Number(item.S_KINNEY || item.defaultS_KINNEY || 1);
      const valO = Number(item.O || item.defaultO || 1);
      const valSF = Number(item.S_FMEA || item.defaultS_FMEA || 1);
      const valD = Number(item.D || item.defaultD || 1);
      const method = targetAssessment.method || 'MATRIX_L';
      let calculatedScore = 0;
      if (method === 'FINE_KINNEY') calculatedScore = valP * valF * valSK;
      else if (method === 'FMEA') calculatedScore = valO * valSF * valD;
      else calculatedScore = valL * valS;
      return {
        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`, originId: item.id,
        topic: item.category || '', description: item.description || '', hazard: item.hazard || '', risk: item.risk || '', precaution: item.precaution || '',
        department: targetAssessment.department || 'Genel', activity: targetAssessment.activity || '',
        L: valL, S: valS, P: valP, F: valF, S_KINNEY: valSK, O: valO, S_FMEA: valSF, D: valD,
        score: Number(calculatedScore).toFixed(1), status: 'Açık',
        postL: 1, postS: 1, postP: 0.5, postF: 1, postO: 1, postD: 1, createdAt: new Date().toISOString()
      };
    });
    updateActiveCompany({ assessments: activeCompany.assessments.map(a => a.id === assessmentId ? { ...a, risks: [...newRisks, ...a.risks] } : a) });
    alert(\`\${newRisks.length} madde eklendi.\`);
  };`;

const newHandleImportRisks = `  const handleImportRisks = (assessmentId, selectedLibItems) => {
    const targetAssessment = activeCompany.assessments.find(a => a.id === assessmentId);
    if (!targetAssessment) return;
    const existingOriginIds = new Set(targetAssessment.risks.map(r => r.originId).filter(Boolean));
    const existingIds = new Set(targetAssessment.risks.map(r => r.id));
    const itemsToAdd = selectedLibItems.filter(libItem => {
      if (existingOriginIds.has(libItem.id)) return false;
      if (existingIds.has(libItem.id)) return false;
      return true;
    });
    if (itemsToAdd.length === 0) { alert("Seçilenlerin hepsi bu analizde zaten mevcut."); return; }

    const newRisks = itemsToAdd.map((item, index) => {
      const valL = Number(item.defaultL || item.L || 1);
      const valS = Number(item.defaultS || item.S || 1);
      const valP = Number(item.P || item.defaultP || 0.5);
      const valF = Number(item.F || item.defaultF || 1);
      const valSK = Number(item.S_KINNEY || item.defaultS_KINNEY || item.S || 1);
      const valO = Number(item.O || item.defaultO || 1);
      const valSF = Number(item.S_FMEA || item.defaultS_FMEA || 1);
      const valD = Number(item.D || item.defaultD || 1);
      const method = targetAssessment.method || 'MATRIX_L';
      let calculatedScore = 0;
      if (method === 'FINE_KINNEY') calculatedScore = valP * valF * valSK;
      else if (method === 'FMEA') calculatedScore = valO * valSF * valD;
      else calculatedScore = valL * valS;

      // Kütüphaneden gelen bölüm ve faaliyet bilgilerini ÖNCELİKLİ olarak al
      // Kütüphanedeki maddede tanımlıysa doğrudan onu kullan; boş ise analizin genel değerini varsayılan al
      const itemDept = (item.department && typeof item.department === 'string' && item.department.trim())
        ? item.department.trim()
        : (targetAssessment.department || 'Genel');

      const itemAct = (item.activity && typeof item.activity === 'string' && item.activity.trim())
        ? item.activity.trim()
        : (targetAssessment.activity || '');

      const itemTopic = item.category || item.topic || 'Genel';
      const itemDesc = item.description !== undefined && item.description !== null ? String(item.description) : '';
      const itemHazard = item.hazard || '';
      const itemRisk = item.risk || '';
      const itemPrecaution = item.precaution || '';

      return {
        ...item,
        id: \`risk-\${Date.now()}-\${index}-\${Math.random().toString(36).substr(2, 9)}\`,
        originId: item.id || item.originId || null,
        topic: itemTopic,
        description: itemDesc,
        hazard: itemHazard,
        risk: itemRisk,
        precaution: itemPrecaution,
        department: itemDept,
        activity: itemAct,
        L: valL,
        S: valS,
        P: valP,
        F: valF,
        S_KINNEY: valSK,
        O: valO,
        S_FMEA: valSF,
        D: valD,
        score: item.score ? Number(item.score).toFixed(1) : Number(calculatedScore).toFixed(1),
        status: item.status || 'Açık',
        processOwner: item.processOwner || '',
        affectedPersons: item.affectedPersons || item.affectedGroups || '',
        deadline: item.deadline || '',
        controlDate: item.controlDate || '',
        beforePhoto: item.beforePhoto || null,
        afterPhoto: item.afterPhoto || null,
        postL: (item.postL !== undefined && item.postL !== null) ? Number(item.postL) : 1,
        postS: (item.postS !== undefined && item.postS !== null) ? Number(item.postS) : 1,
        postP: (item.postP !== undefined && item.postP !== null) ? Number(item.postP) : 0.5,
        postF: (item.postF !== undefined && item.postF !== null) ? Number(item.postF) : 1,
        postS_KINNEY: (item.postS_KINNEY !== undefined && item.postS_KINNEY !== null) ? Number(item.postS_KINNEY) : ((item.postSK !== undefined && item.postSK !== null) ? Number(item.postSK) : 1),
        postO: (item.postO !== undefined && item.postO !== null) ? Number(item.postO) : 1,
        postS_FMEA: (item.postS_FMEA !== undefined && item.postS_FMEA !== null) ? Number(item.postS_FMEA) : ((item.postSF !== undefined && item.postSF !== null) ? Number(item.postSF) : 1),
        postD: (item.postD !== undefined && item.postD !== null) ? Number(item.postD) : 1,
        postScore: (item.postScore !== undefined && item.postScore !== null) ? item.postScore : null,
        createdAt: new Date().toISOString()
      };
    });

    // Yeni aktarılan maddelerdeki bölümleri firmanın bölüm listesine de otomatik dahil et
    const existingCompanyDepts = Array.isArray(activeCompany.info?.departments) ? activeCompany.info.departments : [];
    const newDeptsToAdd = newRisks
      .map(r => r.department)
      .filter(d => d && typeof d === 'string' && d.trim() !== '' && d !== 'Genel' && !existingCompanyDepts.includes(d.trim()))
      .map(d => d.trim());
    const uniqueNewDepts = [...new Set(newDeptsToAdd)];

    const updatedCompanyPayload = {
      assessments: activeCompany.assessments.map(a => a.id === assessmentId ? { ...a, risks: [...newRisks, ...a.risks] } : a)
    };
    if (uniqueNewDepts.length > 0) {
      updatedCompanyPayload.info = {
        ...activeCompany.info,
        departments: [...existingCompanyDepts, ...uniqueNewDepts]
      };
    }
    updateActiveCompany(updatedCompanyPayload);
    alert(\`\${newRisks.length} madde kütüphanedeki tüm verileriyle (Bölüm, Faaliyet, Puanlar vb.) analize başarıyla aktarıldı.\`);
  };`;

if (content.includes(oldHandleImportRisks)) {
  content = content.replace(oldHandleImportRisks, newHandleImportRisks);
  console.log('✔ 7. handleImportRisks successfully updated to pull ALL data (department, activity, scores, etc.) from library items!');
} else {
  console.error('❌ 7. oldHandleImportRisks exact match failed!');
  process.exit(1);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('🎉 ALL PATCHES SUCCESSFULLY APPLIED to:', targetPath);
