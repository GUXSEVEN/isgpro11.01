const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\IsgEducationTab.jsx';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original length:', content.length);

// 1. Ensure ChevronLeft, ChevronRight are imported from lucide-react
if (!content.includes('ChevronLeft')) {
  content = content.replace(
    /from 'lucide-react';/,
    `  ChevronLeft,\n  ChevronRight\n} from 'lucide-react';`
  );
  // Also clean up any extra closing brace if replaced into an existing list
  content = content.replace(/}\s*,\s*ChevronLeft,\s*ChevronRight\s*}\s*from 'lucide-react';/, '  ChevronLeft,\n  ChevronRight\n} from \'lucide-react\';');
}

// 2. Add mobile states right after activeTab state (around line 625)
const stateTarget = `const [activeTab, setActiveTab] = useState(initialActiveTab || 'form'); // 'form' | 'records' | 'templates' | 'quiz' | 'print_tutanak' | 'print_certificates'`;
const mobileStatesCode = `${stateTarget}

  // ══════════════════════════════════════════════════════════════════════════
  // SADECE MOBİL (< lg) ÖZEL: 5 ADIMLI SADE VE PRATİK EĞİTİM SİHİRBAZI STATE'LERİ
  // ══════════════════════════════════════════════════════════════════════════
  const [mobileStep, setMobileStep] = useState(1); // 1..5
  const [mobileEmpSearch, setMobileEmpSearch] = useState('');
  const [mobileCurriculumCat, setMobileCurriculumCat] = useState('all');
  const [mobileParticipantFilter, setMobileParticipantFilter] = useState('');
  const [mobileEmpPickerOpen, setMobileEmpPickerOpen] = useState(false);

  const MOBILE_5_STEPS = useMemo(() => [
    {
      stepNo: 1,
      title: 'Künye & Rejim',
      subtitle: 'Mevzuat Türü, Tarih & Eğitici Kadrosu',
      icon: GraduationCap,
      isDone: Boolean(educationTitle && educationTitle.trim().length > 0)
    },
    {
      stepNo: 2,
      title: 'Müfredat',
      subtitle: '4 Ana Kategori & Ders Saatleri Dağılımı',
      icon: Layers,
      isDone: selectedTopics && selectedTopics.length > 0
    },
    {
      stepNo: 3,
      title: 'Katılımcılar',
      subtitle: \`\${participants.length} Personel Seçildi\`,
      icon: Users,
      isDone: participants && participants.length > 0
    },
    {
      stepNo: 4,
      title: 'Sınav & Not',
      subtitle: 'Madde 16 Ölçme ve Değerlendirme',
      icon: Award,
      isDone: participants.length > 0 && participants.every(p => p.score !== undefined && p.score !== null && p.score !== '')
    },
    {
      stepNo: 5,
      title: 'Onay & Çıktı',
      subtitle: 'Kaydet, A4 Tutanak & Sertifikalar',
      icon: CheckCircle2,
      isDone: Boolean(editingRecordId) || (participants.length > 0 && selectedTopics.length > 0)
    }
  ], [educationTitle, selectedTopics, participants, editingRecordId]);

  const overallReadinessPercent = useMemo(() => {
    const doneCount = MOBILE_5_STEPS.filter(s => s.isDone).length;
    return Math.round((doneCount / MOBILE_5_STEPS.length) * 100);
  }, [MOBILE_5_STEPS]);`;

if (!content.includes('const [mobileStep, setMobileStep]')) {
  if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, mobileStatesCode);
    console.log('Mobile states successfully added.');
  } else {
    console.error('State target not found!');
  }
}

// 3. Update top nav: wrap existing nav in hidden lg:flex and prepend mobile nav
const topNavTarget = `{/* ÜST MENÜ SEKMELERİ & CANLI TAKİP DÖKÜMLERİ & EXCEL RAPORLARI */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 flex-wrap">`;

const mobileTopNavCode = `{/* ══════════════════════════════════════════════════════════════════════════
          SADECE MOBİL (< lg) ÖZEL: KOMPAKT ÜST BAR & YATAY MOD SEÇİCİ
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-2.5">
        {/* 1. KOMPAKT MOBİL ÜST BAR */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {company?.name || 'Temel İSG Eğitimi'}
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[9px] font-black shrink-0">
                  {hazardClass}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Hedef: {totalHours} Ders Saati • {companyEmployees.length} Firma Çalışanı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (basicRecords.length > 0) {
                  setActiveRecordForPrint(basicRecords[0]);
                  setActiveTab('print_tutanak');
                } else {
                  showToast('Yazdırılacak kayıtlı temel İSG eğitimi bulunamadı.');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              title="Son Eğitimin Tutanak Baskısını Aç"
            >
              <Printer size={13} />
              <span>Tutanak</span>
            </button>
          </div>
        </div>

        {/* 2. YATAY KAYDIRMALI MOD SEÇİCİ */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-pan-x">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer \${
              activeTab === 'form'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <GraduationCap size={14} />
            <span>Eğitim Sihirbazı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer \${
              activeTab === 'records'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <FileText size={14} />
            <span>Kayıtlar ({basicRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed_list')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer \${
              activeTab === 'completed_list'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <UserCheck size={14} />
            <span>Eğitim Alanlar ({trainedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('uncompleted_list')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative \${
              activeTab === 'uncompleted_list'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <UserX size={14} />
            <span>Eksik / 3 Ay ({untrainedList.length})</span>
            {statsSummary.urgentCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('additional_trainings')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer \${
              activeTab === 'additional_trainings'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <Layers size={14} />
            <span>M.18/19 İlave</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={\`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer \${
              activeTab === 'quiz'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }\`}
          >
            <Sparkles size={14} />
            <span>Soru Bankası</span>
          </button>
        </div>
      </div>

      {/* ── PC GÖRÜNÜMÜ: ÜST MENÜ SEKMELERİ (Sadece PC: hidden lg:flex — Mevcut Yapı Korunur) ── */}
      <div className="hidden lg:flex bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm items-center justify-between gap-3 flex-wrap">`;

if (!content.includes('SADECE MOBİL (< lg) ÖZEL: KOMPAKT ÜST BAR')) {
  if (content.includes(topNavTarget)) {
    content = content.replace(topNavTarget, mobileTopNavCode);
    console.log('Top nav updated for mobile/desktop.');
  } else {
    console.error('topNavTarget not found!');
  }
}

// 4. Wrap form content:
// Find form start: `<form onSubmit={handleSaveEducation} className="space-y-6">`
// and line right after: `\n\n          {/* DÜZENLEME MODU BİLGİLENDİRME BANNERI */}`
const formStart = `<form onSubmit={handleSaveEducation} className="space-y-6">`;
const formEditBanner = `{/* DÜZENLEME MODU BİLGİLENDİRME BANNERI */}`;

// Find form submit button end:
// `            </button>\n          </div>\n\n        </form>`
const submitEndTarget = `            </button>
          </div>

        </form>`;

const mobileWizardJSX = `
          {/* ══════════════════════════════════════════════════════════════════════════
              SADECE MOBİL (< lg) ÖZEL: 5 ADIMLI SADE VE PRATİK EĞİTİM SİHİRBAZI
              (Acil Durum Yeni Menüsü Mimarisiyle Sıralı Aşama Akışı)
             ══════════════════════════════════════════════════════════════════════════ */}
          <div className="lg:hidden space-y-4">

            {/* 1. 5 ADIMLI SADE MOBİL SİHİRBAZ SEKME ÇUBUĞU */}
            <div className="sticky top-2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-md space-y-2">
              <div className="grid grid-cols-5 gap-1">
                {MOBILE_5_STEPS.map((st) => {
                  const isActive = mobileStep === st.stepNo;
                  return (
                    <button
                      key={st.stepNo}
                      type="button"
                      onClick={() => {
                        setMobileStep(st.stepNo);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={\`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer \${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                          : st.isDone
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold'
                      }\`}
                    >
                      <span className={\`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center \${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : st.isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }\`}>
                        {st.isDone && !isActive ? '✓' : st.stepNo}
                      </span>
                      <span className="text-[10px] leading-tight line-clamp-1">{st.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="font-bold text-slate-600 dark:text-slate-300 truncate">
                  <strong className="text-amber-600 dark:text-amber-400">Adım {mobileStep}/5:</strong> {MOBILE_5_STEPS[mobileStep - 1]?.subtitle}
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                  %{overallReadinessPercent} Hazır
                </span>
              </div>
            </div>

            {/* DÜZENLEME MODU BİLGİLENDİRMESİ (Mobilde) */}
            {editingRecordId && (
              <div className="p-3 bg-sky-950 border border-sky-500/50 rounded-2xl text-white flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2 min-w-0">
                  <Edit3 size={16} className="text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-black tracking-wider text-sky-300 block">Eğitim Düzenleniyor</span>
                    <span className="text-xs font-bold truncate block">{educationTitle}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  İptal
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADIM 1: KÜNYE, MEVZUAT REJİMİ & EĞİTİCİLER
               ══════════════════════════════════════════════════════════════════ */}
            {mobileStep === 1 && (
              <div className="space-y-3.5">
                {/* 1.1 Mevzuat Rejimi Seçimi */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-amber-500" />
                      Eğitim Mevzuat Rejimi
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {trainingCategory === 'basic' ? 'M.13/14' : trainingCategory === 'madde19_additional' ? 'M.19' : 'M.18'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchTrainingCategory('basic')}
                      className={\`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer \${
                        trainingCategory === 'basic'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 font-black ring-1 ring-amber-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }\`}
                    >
                      <GraduationCap size={18} className={trainingCategory === 'basic' ? 'text-amber-600' : 'text-slate-400'} />
                      <span className="text-[11px] leading-tight">Temel İSG (M.13/14)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchTrainingCategory('madde19_additional', additionalTrainingSubtype === 'madde18_refresher' ? 'accident' : additionalTrainingSubtype)}
                      className={\`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer \${
                        trainingCategory === 'madde19_additional'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-950 dark:text-rose-200 font-black ring-1 ring-rose-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }\`}
                    >
                      <AlertTriangle size={18} className={trainingCategory === 'madde19_additional' ? 'text-rose-600' : 'text-slate-400'} />
                      <span className="text-[11px] leading-tight">İlave Eğitim (M.19)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchTrainingCategory('madde18_refresher')}
                      className={\`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer \${
                        trainingCategory === 'madde18_refresher'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-950 dark:text-purple-200 font-black ring-1 ring-purple-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }\`}
                    >
                      <Clock size={18} className={trainingCategory === 'madde18_refresher' ? 'text-purple-600' : 'text-slate-400'} />
                      <span className="text-[11px] leading-tight">Bilgi Yenileme (M.18)</span>
                    </button>
                  </div>

                  {trainingCategory === 'madde18_refresher' && (
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] text-purple-900 dark:text-purple-200">
                      ℹ️ <strong>Yönetmelik Madde 18:</strong> 6+ ay işten uzak kalan çalışanlar için sadece 4. Konu Başlığı (İşe Özgü Riskler) müfredatı uygulanır.
                    </div>
                  )}

                  {trainingCategory === 'madde19_additional' && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] text-rose-900 dark:text-rose-200 space-y-1.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle size={13} />
                        <span>İş Kazası / Meslek Hastalığı Sonrası İşe Dönüş Eğitimi</span>
                      </div>
                      <input
                        type="text"
                        value={incidentSummary}
                        onChange={e => setIncidentSummary(e.target.value)}
                        placeholder="Olay / Kaza Özeti veya Kök Nedeni Giriniz..."
                        className="w-full bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-lg p-2 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 1.2 Genel Künye Formu */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={15} className="text-amber-500" />
                      Eğitim Künyesi
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                      {hazardClass} • {totalHours} Ders Saati
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Eğitim Başlığı</label>
                    <input
                      type="text"
                      value={educationTitle}
                      onChange={e => setEducationTitle(e.target.value)}
                      placeholder="Örn: 2026 Yılı Çok Tehlikeli Sınıf Temel İSG Eğitimi"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Eğitim Tarihi</label>
                      <input
                        type="date"
                        value={educationDate}
                        onChange={e => setEducationDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Eğitim Türü</label>
                      <select
                        value={trainingType}
                        onChange={e => handleTrainingTypeChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="initial">İlk Defa Verilen</option>
                        <option value="renewal">Yenileme / Tekrar</option>
                      </select>
                    </div>
                  </div>

                  {/* Harmanlanmış / Uzaktan Eğitim Toggle */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Harmanlanmış / Uzaktan Eğitim</span>
                      <span className="text-[10px] text-slate-500 block">Genel ve sağlık konuları uzaktan verilebilir</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRemoteEducation(!isRemoteEducation)}
                      className={\`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer \${
                        isRemoteEducation ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }\`}
                    >
                      <div className={\`w-5 h-5 rounded-full bg-white transition-transform \${
                        isRemoteEducation ? 'translate-x-5' : 'translate-x-0'
                      }\`} />
                    </button>
                  </div>
                </div>

                {/* 1.3 Eğitici Kadrosu */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCog size={15} className="text-amber-500" />
                    Eğitici & Onay Kadrosu
                  </span>

                  {/* İGU */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-500" /> İş Güvenliği Uzmanı
                      </span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setIguMode('select')}
                          className={\`px-2 py-0.5 rounded \${iguMode === 'select' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}\`}
                        >
                          Seç
                        </button>
                        <button
                          type="button"
                          onClick={() => setIguMode('manual')}
                          className={\`px-2 py-0.5 rounded \${iguMode === 'manual' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}\`}
                        >
                          Manuel
                        </button>
                      </div>
                    </div>

                    {iguMode === 'select' ? (
                      <select
                        value={selectedIguId}
                        onChange={e => setSelectedIguId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">-- Uzman Seçiniz --</option>
                        {iguList.map(u => (
                          <option key={u.id || u.username} value={u.id || u.username}>
                            {u.name || u.displayName || u.username} ({u.role || 'İGU'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Uzman Adı Soyadı"
                          value={manualIguName}
                          onChange={e => setManualIguName(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Belge No"
                          value={manualIguCertNo}
                          onChange={e => setManualIguCertNo(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* İYH */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Stethoscope size={14} className="text-emerald-500" /> İşyeri Hekimi
                      </span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setIyhMode('select')}
                          className={\`px-2 py-0.5 rounded \${iyhMode === 'select' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500'}\`}
                        >
                          Seç
                        </button>
                        <button
                          type="button"
                          onClick={() => setIyhMode('manual')}
                          className={\`px-2 py-0.5 rounded \${iyhMode === 'manual' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500'}\`}
                        >
                          Manuel
                        </button>
                      </div>
                    </div>

                    {iyhMode === 'select' ? (
                      <select
                        value={selectedIyhId}
                        onChange={e => setSelectedIyhId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">-- Hekim Seçiniz --</option>
                        {iyhList.map(d => (
                          <option key={d.id || d.username} value={d.id || d.username}>
                            {d.name || d.displayName || d.username} ({d.role || 'Hekim'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dr. Hekim Adı Soyadı"
                          value={manualIyhName}
                          onChange={e => setManualIyhName(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Diploma / Belge No"
                          value={manualIyhCertNo}
                          onChange={e => setManualIyhCertNo(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* İşveren / Vekili */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Building2 size={14} className="text-amber-500" /> İşveren / İşveren Vekili Onayı
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Yetkili Adı Soyadı"
                        value={employerName}
                        onChange={e => setEmployerName(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Unvan (Örn: İşveren Vekili)"
                        value={employerTitle}
                        onChange={e => setEmployerTitle(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADIM 2: MÜFREDAT & SÜRELER
               ══════════════════════════════════════════════════════════════════ */}
            {mobileStep === 2 && (
              <div className="space-y-3.5">
                {/* Süre Özeti & İlerleme Kartı */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                        Ders Saati İlerlemesi
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Hedef: {totalHours} Ders Saati ({totalHours * LESSON_MINUTES} Dk Net)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={\`text-xs font-black block \${
                        Math.abs(totalSelectedTopicMinutes - (Number(totalHours) * LESSON_MINUTES)) <= 15
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }\`}>
                        {formatDurationDetails(totalSelectedTopicMinutes).displayFull}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({formatDurationDetails(totalSelectedTopicMinutes).breakMinutes} dk mola)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={\`h-full transition-all duration-300 \${
                        totalSelectedTopicMinutes >= totalHours * LESSON_MINUTES ? 'bg-emerald-500' : 'bg-amber-500'
                      }\`}
                      style={{ width: \`\${Math.min(100, (totalSelectedTopicMinutes / (totalHours * LESSON_MINUTES)) * 100)}%\` }}
                    />
                  </div>

                  {/* 4. Kategori Yasal Süre Uyarısı */}
                  <div className={\`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 \${
                    riskCategoryMinutes >= minRisk.minMinutes
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  }\`}>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="shrink-0" />
                      <span>İşe Özgü Riskler: <strong>{formatDurationDetails(riskCategoryMinutes).displayFull}</strong> (Yasal Min: {minRisk.minTotalHoursText})</span>
                    </div>
                    {riskCategoryMinutes >= minRisk.minMinutes ? <span>✓ Uygun</span> : <span>⚠️ Eksik</span>}
                  </div>
                </div>

                {/* Hızlı Aksiyon Butonları (Grid) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDistributeHours}
                    className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Zap size={14} className="text-amber-600" />
                    <span>Süreleri Dağıt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAiRiskTopics}
                    disabled={isAiGeneratingTopics}
                    className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 dark:text-purple-200 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-purple-600" />
                    <span>{isAiGeneratingTopics ? 'Üretiliyor...' : 'AI Risk Öner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddTopicModal(true)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    <span>Yeni Konu Ekle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Bookmark size={14} />
                    <span>Şablon Kaydet</span>
                  </button>
                </div>

                {/* Kategori Filtre Çipleri */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-pan-x">
                  {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'Genel Konular', label: '1. Genel' },
                    { id: 'Sağlık Konuları', label: '2. Sağlık' },
                    { id: 'Teknik Konular', label: '3. Teknik' },
                    { id: 'İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular', label: '4. İşe Özgü Riskler' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMobileCurriculumCat(cat.id)}
                      className={\`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 \${
                        mobileCurriculumCat === cat.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }\`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Mobil Konu Kartları */}
                <div className="space-y-2">
                  {selectedTopics
                    .filter(t => mobileCurriculumCat === 'all' || t.category === mobileCurriculumCat)
                    .map((topic) => {
                      const m = topic.minutes || (Number(topic.hours || 0) * LESSON_MINUTES);
                      const isSelected = Boolean(topic.selected);
                      return (
                        <div
                          key={topic.id}
                          className={\`p-3 rounded-2xl border transition-all \${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 border-amber-500/40 shadow-xs'
                              : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          }\`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTopic(topic.id)}
                              className="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={\`text-xs font-bold leading-snug \${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}\`}>
                                  {topic.name}
                                </span>
                                {topic.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1 shrink-0"
                                    title="Konuyu Sil"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                {topic.category}
                              </span>

                              {isSelected && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTopicDuration(topic.id, Math.max(0, m - 15))}
                                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold"
                                    >
                                      -15 dk
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTopicDuration(topic.id, m + 15)}
                                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold"
                                    >
                                      +15 dk
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTopicDuration(topic.id, 45)}
                                      className="px-2 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-bold"
                                    >
                                      45 Dk (1 Ders)
                                    </button>
                                  </div>
                                  <span className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400">
                                    {m} Dk ({Math.floor(m / LESSON_MINUTES)} Ders)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADIM 3: KATILIMCI PERSONEL SEÇİMİ
               ══════════════════════════════════════════════════════════════════ */}
            {mobileStep === 3 && (
              <div className="space-y-3.5">
                {/* Hızlı Aksiyonlar */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={15} className="text-amber-500" />
                      Katılımcı Seçim Merkezi
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                      {participants.length} Seçildi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={handleAddAllUntrainedToTraining}
                      className="p-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center justify-between transition active:scale-95 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600" />
                        <span>Eğitimi Eksik / 3 Ayı Dolanları Ekle</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">
                        +{untrainedList.length} Kişi
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleImportAllCompanyEmployees}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-between transition active:scale-95 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-slate-600 dark:text-slate-400" />
                        <span>Tüm Firma Çalışanlarını Forma Ekle</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">
                        {companyEmployees.length} Kişi
                      </span>
                    </button>
                  </div>
                </div>

                {/* İK'dan Tekil Personel Ekleme Kartı */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      İK Listesinden Tek Tek Seçip Ekle:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuickEmpModal(true)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5"
                    >
                      <PlusCircle size={12} /> Hızlı Yeni Çalışan
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Personel ara (İsim veya TC)..."
                      value={mobileEmpSearch}
                      onChange={e => setMobileEmpSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    />

                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-slate-100 dark:border-slate-700/60 rounded-xl p-1.5">
                      {companyEmployees
                        .filter(emp => {
                          if (!mobileEmpSearch.trim()) return true;
                          const term = mobileEmpSearch.toLowerCase();
                          const fn = getEmployeeFullName(emp).toLowerCase();
                          const tc = String(emp.tcNo || '');
                          return fn.includes(term) || tc.includes(term);
                        })
                        .slice(0, 15)
                        .map((emp, idx) => {
                          const isAlreadyAdded = participants.some(p => isSameEmployee(p, emp));
                          const fn = getEmployeeFullName(emp);
                          const tc = emp.tcNo ? \`TC: \${emp.tcNo}\` : '';
                          const title = getEmployeeTitle(emp);
                          return (
                            <div
                              key={emp.id || idx}
                              className={\`p-2 rounded-xl flex items-center justify-between gap-2 text-xs \${
                                isAlreadyAdded
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-500'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                              }\`}
                            >
                              <div className="min-w-0">
                                <span className="font-bold block truncate text-slate-800 dark:text-slate-100">{fn}</span>
                                <span className="text-[10px] text-slate-400 block">{tc} • {title}</span>
                              </div>
                              <button
                                type="button"
                                disabled={isAlreadyAdded}
                                onClick={() => {
                                  const pObj = {
                                    id: \`p-\${emp.id || Math.random()}-\${Date.now()}\`,
                                    tcNo: emp.tcNo || '',
                                    name: fn,
                                    title: title,
                                    preTestScore: 50,
                                    examMethod: isRemoteEducation ? 'hybrid' : 'face_to_face',
                                    score: 75,
                                    attemptCount: 1,
                                    passedTest: true,
                                    evaluationStatus: 'passed'
                                  };
                                  setParticipants(prev => [...prev, pObj]);
                                  showToast(\`✓ \${fn} eğitime eklendi!\`);
                                }}
                                className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 \${
                                  isAlreadyAdded
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95 cursor-pointer'
                                }\`}
                              >
                                {isAlreadyAdded ? '✓ Eklendi' : '+ Ekle'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Seçilen Katılımcılar Listesi */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Seçilen Katılımcılar ({participants.length})
                    </span>
                    {participants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Tüm katılımcı listesini temizlemek istediğinize emin misiniz?')) {
                            setParticipants([]);
                          }
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                      >
                        Tümünü Temizle
                      </button>
                    )}
                  </div>

                  {participants.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                      <Users size={24} className="text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Henüz Katılımcı Eklenmedi</p>
                      <p className="text-[10px] text-slate-400">Yukarıdaki butonlardan eksik olanları veya tüm çalışanları ekleyebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {participants.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{p.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{p.tcNo ? \`TC: \${p.tcNo}\` : 'TC Yok'} • {p.title || 'Çalışan'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(p.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 shrink-0"
                            title="Listeden Çıkar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADIM 4: SINAV & ÖLÇME DEĞERLENDİRME (MADDE 16)
               ══════════════════════════════════════════════════════════════════ */}
            {mobileStep === 4 && (
              <div className="space-y-3.5">
                {/* Genel Sınav Ayarları & Toplu Not Verme */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={15} className="text-amber-500" />
                      Yönetmelik Madde 16 Sınavı
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                      Baraj: 60 Puan
                    </span>
                  </div>

                  {/* Toplu Not Butonları */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      ⚡ Hızlı Toplu Not Dağıtımı:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBatchSetScores(75)}
                        className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-center text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        ✓ Tümüne 75
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetScores(85)}
                        className="py-2 px-1 bg-amber-500 text-slate-950 font-black rounded-xl text-center text-xs transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        ✓ Tümüne 85
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomizeScores(65, 95)}
                        className="py-2 px-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-center text-[11px] font-bold transition active:scale-95 cursor-pointer"
                      >
                        🎲 65-95 Dağıt
                      </button>
                    </div>
                  </div>
                </div>

                {/* Katılımcı Not Kartları */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Katılımcı Sınav Notları ({participants.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Başarılı: {participants.filter(p => Number(p.score) >= 60).length} / {participants.length}
                    </span>
                  </div>

                  {participants.length === 0 ? (
                    <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Önce 3. Adımdan katılımcı ekleyiniz.</p>
                    </div>
                  ) : (
                    participants.map((p, idx) => {
                      const isPassed = Number(p.score) >= 60;
                      return (
                        <div
                          key={p.id || idx}
                          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{p.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{p.tcNo ? \`TC: \${p.tcNo}\` : ''} • {p.title || 'Çalışan'}</span>
                            </div>
                            <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 \${
                              isPassed
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            }\`}>
                              {isPassed ? '✓ GEÇTİ' : '✕ KALDI'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Ön Test (0-100)</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={p.preTestScore ?? 50}
                                onChange={e => handleUpdateParticipantPreTest(p.id, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sınav Notu (0-100)</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={p.score ?? 75}
                                onChange={e => handleUpdateParticipantScore(p.id, e.target.value)}
                                className={\`w-full border rounded-xl p-2 text-xs font-mono font-black text-center \${
                                  isPassed
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                                }\`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADIM 5: ONAY, KAYIT & RESMİ ÇIKTI MERKEZİ
               ══════════════════════════════════════════════════════════════════ */}
            {mobileStep === 5 && (
              <div className="space-y-3.5">
                {/* Onay Özeti Kartı */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Award size={15} />
                      Eğitim Onay Özeti
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-bold">
                      Adım 5/5
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Eğitim Başlığı:</span>
                      <span className="font-bold truncate max-w-[200px]">{educationTitle}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Eğitim Tarihi:</span>
                      <span className="font-bold">{educationDate}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Hedef & Toplam Süre:</span>
                      <span className="font-black text-amber-400">{formatDurationDetails(totalSelectedTopicMinutes).displayFull}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Katılımcı Sayısı:</span>
                      <span className="font-bold">{participants.length} Kişi ({participants.filter(p => Number(p.score) >= 60).length} Başarılı)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Eğitici Uzman:</span>
                      <span className="font-bold truncate max-w-[180px]">
                        {iguMode === 'select' ? (iguList.find(u => (u.id || u.username) === selectedIguId)?.name || 'Seçildi') : (manualIguName || 'Uzman')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Eğitici Hekim:</span>
                      <span className="font-bold truncate max-w-[180px]">
                        {iyhMode === 'select' ? (iyhList.find(d => (d.id || d.username) === selectedIyhId)?.name || 'Seçildi') : (manualIyhName || 'Hekim')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Büyük Kaydet Butonu */}
                <button
                  type="submit"
                  className={\`w-full p-4 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer \${
                    editingRecordId
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-600/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                  }\`}
                >
                  {editingRecordId ? (
                    <>
                      <RefreshCw size={20} />
                      <span className="text-sm">Değişiklikleri Kaydet & Sertifikaları Güncelle</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span className="text-sm">Eğitimi Kaydet & Sertifikaları Hazırla</span>
                    </>
                  )}
                </button>

                {/* Resmi Çıktılar */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                    Resmi Çıktı & Belge Merkezi
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('records')}
                      className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Printer size={15} className="text-amber-500" />
                        <span>Kayıtlar Listesi & Tutanak Yazdır</span>
                      </span>
                      <ChevronRight size={15} className="text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCompletedToExcel}
                      className="p-3 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Eğitimi Tamamlananlar Resmi Excel Listesi</span>
                      </span>
                      <Download size={14} className="text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SABİT ALT GEZİNME BARI (STICKY BOTTOM NAVIGATION)
               ══════════════════════════════════════════════════════════════════ */}
            <div className="sticky bottom-2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileStep(prev => Math.max(1, prev - 1));
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={mobileStep <= 1}
                className={\`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer \${
                  mobileStep <= 1
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95'
                }\`}
              >
                <ChevronLeft size={16} />
                <span>Geri</span>
              </button>

              <button
                type="submit"
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <Save size={15} />
                <span>Kaydet ({mobileStep}/5)</span>
              </button>

              {mobileStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileStep(prev => Math.min(5, prev + 1));
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>İleri</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Tamamla</span>
                </button>
              )}
            </div>

          </div>`;

// Check if form is already wrapped
if (!content.includes('PC GÖRÜNÜMÜ: FORM BİLEŞENİ (Sadece PC: hidden lg:block')) {
  // We want to insert `<div className="hidden lg:block space-y-6">` right after `<form onSubmit={handleSaveEducation} className="space-y-6">`
  // and close it before `</form>` while adding `mobileWizardJSX`
  const formTagIdx = content.indexOf(formStart);
  if (formTagIdx !== -1) {
    const afterFormTag = formTagIdx + formStart.length;
    
    // Find where the submit button ends before </form>
    const submitIdx = content.indexOf(submitEndTarget, afterFormTag);
    if (submitIdx !== -1) {
      const beforeSubmitEnd = content.slice(0, submitIdx + submitEndTarget.length - `\n\n        </form>`.length);
      const afterSubmitEnd = content.slice(submitIdx + submitEndTarget.length - `\n\n        </form>`.length);

      // Now assemble:
      // content[0..afterFormTag]
      // + '\n\n          {/* ── PC GÖRÜNÜMÜ: FORM BİLEŞENİ (Sadece PC: hidden lg:block) ── */}\n          <div className="hidden lg:block space-y-6">'
      // + content[afterFormTag..submitEnd]
      // + '\n          </div>'
      // + mobileWizardJSX
      // + afterSubmitEnd
      
      const part1 = content.slice(0, afterFormTag);
      const part2 = content.slice(afterFormTag, submitIdx + submitEndTarget.length - `\n\n        </form>`.length);
      
      content = part1 + `\n\n          {/* ══════════════════════════════════════════════════════════════════════════
              PC GÖRÜNÜMÜ: FORM BİLEŞENİ (Sadece PC: hidden lg:block — Mevcut Yapı Korunur)
             ══════════════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block space-y-6">`
        + part2
        + `\n          </div>`
        + mobileWizardJSX
        + afterSubmitEnd;

      console.log('Form successfully wrapped with hidden lg:block and mobile wizard added!');
    } else {
      console.error('submitEndTarget not found!');
    }
  } else {
    console.error('formStart not found!');
  }
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Finished writing updated IsgEducationTab.jsx. New size:', content.length);

