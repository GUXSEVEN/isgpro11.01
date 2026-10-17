const fs = require('fs');

const cleanSource = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyDrillTab.jsx.clean';
const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyDrillTab.jsx';

let content = fs.readFileSync(cleanSource, 'utf8');

// 1. UPDATE IMPORTS
const oldImportStr = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, ShieldAlert, AlertTriangle, FileText, Calendar, Clock, Sparkles, 
  Upload, Trash2, CheckCircle2, Bookmark, UserCog, Printer, ArrowLeft, Search, 
  PlusCircle, Users, CheckSquare, Square, Download, Activity, Stethoscope, 
  ShieldCheck, UserCheck, Layers, FileCheck, Camera, Image as ImageIcon, 
  XCircle, Type, Phone, Eye, Edit3, RefreshCw
} from 'lucide-react';`;

const newImports = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, ShieldAlert, AlertTriangle, FileText, Calendar, Clock, Sparkles, 
  Upload, Trash2, CheckCircle2, Bookmark, UserCog, Printer, ArrowLeft, Search, 
  PlusCircle, Users, CheckSquare, Square, Download, Activity, Stethoscope, 
  ShieldCheck, UserCheck, Layers, FileCheck, Camera, Image as ImageIcon, 
  XCircle, Type, Phone, Eye, Edit3, RefreshCw, Save, Plus, X, ChevronDown, Check, Zap, Wand2, FolderHeart, Info
} from 'lucide-react';
import {
  DEFAULT_FIRE_TRAINING_TOPICS,
  PRESET_EMERGENCY_TEMPLATES,
  getSavedEmergencyTemplates,
  saveCustomEmergencyTemplate,
  deleteCustomEmergencyTemplate,
  generateAiEmergencyTopics,
  formatTopicsToText,
  parseTopicsFromText
} from '../../utils/emergencyTrainingHelper';`;

if (!content.includes(oldImportStr)) {
  console.error("Could not find oldImportStr");
  process.exit(1);
}
content = content.replace(oldImportStr, newImports);

// 2. UPDATE STATE AND HELPER FUNCTIONS
const oldStateStr = `  // Acil Durum Eğitim Tutanağı Form State'leri
  const [trainingTitle, setTrainingTitle] = useState('Acil Durum, Yangın Önleme ve Tahliye Eğitimi');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainingHours, setTrainingHours] = useState('2');
  const [trainingTopics, setTrainingTopics] = useState('6331 Sayılı Kanun Kapsamında Acil Durumlar, Yangın Güvenliği ve Söndürme Cihazları Kullanımı, Tahliye Güzergahları, Toplanma Alanı Disiplini, İlkyardım Temel İlkeleri');`;

const newStateStr = `  // Acil Durum Eğitim Tutanağı Form State'leri
  const [trainingTitle, setTrainingTitle] = useState('Acil Durum, Yangın Önleme ve Söndürme Cihazları Kullanım Eğitimi');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainingHours, setTrainingHours] = useState('2');
  const [trainingDrillType, setTrainingDrillType] = useState('Yangın ve Söndürme');
  const [trainingAiPrompt, setTrainingAiPrompt] = useState('');
  const [isAiGeneratingTrainingTopics, setIsAiGeneratingTrainingTopics] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl_emg_yangin');
  const [customTemplateRevision, setCustomTemplateRevision] = useState(0);

  // İnteraktif Konu Listesi State'i (Kullanıcının talep ettiği 13 konu varsayılan taslaktır)
  const [trainingTopicList, setTrainingTopicList] = useState(() => 
    DEFAULT_FIRE_TRAINING_TOPICS.map((t, idx) => ({ id: \`top_\${idx}\`, name: t, selected: true }))
  );
  const [newCustomTopicInput, setNewCustomTopicInput] = useState('');

  // Şablon Kaydetme Modal State'i
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateScope, setNewTemplateScope] = useState('all');

  // Metin alanı senkronizasyonu
  const [trainingTopics, setTrainingTopics] = useState(() => formatTopicsToText(DEFAULT_FIRE_TRAINING_TOPICS));

  // Arşiv filtre state'i ('all' | 'drills' | 'trainings')
  const [archiveFilter, setArchiveFilter] = useState('all');

  // Şablon Listesi (Hazır Şablonlar + Kullanıcının Kaydettiği Şablonlar)
  const availableEmergencyTemplates = useMemo(() => {
    return getSavedEmergencyTemplates(company?.id);
  }, [company?.id, customTemplateRevision]);

  const updateTopicsFromList = (list) => {
    setTrainingTopicList(list);
    const active = list.filter(t => t.selected !== false).map(t => t.name);
    setTrainingTopics(formatTopicsToText(active));
  };

  // Şablon Uygulama
  const handleApplyEmergencyTemplate = (tmpl, mode = 'replace') => {
    setSelectedTemplateId(tmpl.id);
    if (tmpl.title) setTrainingTitle(tmpl.title);
    if (tmpl.hours) setTrainingHours(String(tmpl.hours));
    if (tmpl.drillType) setTrainingDrillType(tmpl.drillType);

    const tmplTopics = Array.isArray(tmpl.topics) ? tmpl.topics : [];
    if (mode === 'replace') {
      const newList = tmplTopics.map((t, idx) => ({
        id: \`top_\${Date.now()}_\${idx}\`,
        name: typeof t === 'string' ? t : (t.name || String(t)),
        selected: true
      }));
      updateTopicsFromList(newList);
      showToast(\`✓ "\${tmpl.name}" şablonu yüklendi.\`);
    } else {
      const existingNames = new Set(trainingTopicList.map(t => t.name.trim().toLowerCase()));
      const toAdd = tmplTopics
        .filter(t => !existingNames.has((typeof t === 'string' ? t : t.name).trim().toLowerCase()))
        .map((t, idx) => ({
          id: \`top_add_\${Date.now()}_\${idx}\`,
          name: typeof t === 'string' ? t : (t.name || String(t)),
          selected: true
        }));
      const combined = [...trainingTopicList, ...toAdd];
      updateTopicsFromList(combined);
      showToast(\`✓ \${toAdd.length} yeni konu listeye eklendi.\`);
    }
  };

  // Yapay Zeka (AI) Konu Öneri Motoru
  const handleGenerateAiTrainingTopics = async () => {
    setIsAiGeneratingTrainingTopics(true);
    try {
      const result = await generateAiEmergencyTopics({
        promptText: trainingAiPrompt,
        drillType: trainingDrillType,
        sector: company?.info?.sector || company?.info?.naceCode || 'Genel Sanayi & Üretim',
        companyName: company?.name || 'İşletme',
        hazardClass: company?.info?.hazardClass || 'Tehlikeli'
      });

      if (result && Array.isArray(result.topics) && result.topics.length > 0) {
        if (result.trainingTitle) setTrainingTitle(result.trainingTitle);
        if (result.suggestedHours) setTrainingHours(String(result.suggestedHours));
        if (result.drillCategory) setTrainingDrillType(result.drillCategory);

        const newList = result.topics.map((t, idx) => ({
          id: \`ai_top_\${Date.now()}_\${idx}\`,
          name: t,
          selected: true
        }));
        updateTopicsFromList(newList);
        showToast(\`✨ Yapay zeka "\${result.trainingTitle}" için \${result.topics.length} adet konu hazırladı!\`);
      }
    } catch (err) {
      console.error('AI topic error:', err);
      showToast('Konu önerileri hazırlandı.');
    } finally {
      setIsAiGeneratingTrainingTopics(false);
    }
  };

  // Konu Checkbox Aç/Kapa
  const handleToggleTopic = (topicId) => {
    const updated = trainingTopicList.map(t => t.id === topicId ? { ...t, selected: !t.selected } : t);
    updateTopicsFromList(updated);
  };

  // Konu Sil
  const handleRemoveTopic = (topicId) => {
    const updated = trainingTopicList.filter(t => t.id !== topicId);
    updateTopicsFromList(updated);
  };

  // Yeni Özel Konu Ekle
  const handleAddCustomTopic = (e) => {
    if (e) e.preventDefault();
    if (!newCustomTopicInput.trim()) return;
    const newTopic = {
      id: \`top_c_\${Date.now()}\`,
      name: newCustomTopicInput.trim().toUpperCase(),
      selected: true
    };
    const updated = [...trainingTopicList, newTopic];
    updateTopicsFromList(updated);
    setNewCustomTopicInput('');
    showToast('Yeni konu listeye eklendi.');
  };

  // Tümünü Seç / Kaldır
  const handleSelectAllTopics = (select = true) => {
    const updated = trainingTopicList.map(t => ({ ...t, selected: select }));
    updateTopicsFromList(updated);
  };

  // Varsayılan Yangın Taslağına Dön
  const handleResetToDefaultFireTopics = () => {
    setTrainingTitle('Acil Durum, Yangın Önleme ve Söndürme Cihazları Kullanım Eğitimi');
    setTrainingDrillType('Yangın ve Söndürme');
    setTrainingHours('2');
    setSelectedTemplateId('tmpl_emg_yangin');
    const defaultList = DEFAULT_FIRE_TRAINING_TOPICS.map((t, idx) => ({ id: \`top_def_\${idx}\`, name: t, selected: true }));
    updateTopicsFromList(defaultList);
    showToast('Varsayılan yangın eğitimi taslağı ve 13 konu yüklendi.');
  };

  // Özel Şablon Olarak Kaydet
  const handleSaveCustomTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const activeTopics = trainingTopicList.filter(t => t.selected !== false).map(t => t.name);
    if (activeTopics.length === 0) {
      alert('Lütfen şablon olarak kaydetmek için en az 1 konu belirleyin.');
      return;
    }

    const saved = saveCustomEmergencyTemplate({
      name: newTemplateName.trim(),
      drillType: trainingDrillType,
      title: trainingTitle,
      hours: trainingHours,
      badge: '⭐ Özel',
      scope: newTemplateScope,
      companyId: company?.id,
      companyName: company?.name,
      topics: activeTopics
    });

    if (saved) {
      setCustomTemplateRevision(r => r + 1);
      setSelectedTemplateId(saved.id);
      setIsSaveTemplateModalOpen(false);
      setNewTemplateName('');
      showToast(\`💾 "\${saved.name}" şablon kütüphanesine kaydedildi!\`);
    }
  };

  // Özel Şablon Sil
  const handleDeleteCustomTemplate = (tmplId, tmplName) => {
    if (!window.confirm(\`"\${tmplName}" şablonunu kütüphaneden silmek istediğinize emin misiniz?\`)) return;
    deleteCustomEmergencyTemplate(tmplId);
    setCustomTemplateRevision(r => r + 1);
    showToast('Şablon kütüphaneden silindi.');
  };

  // Arşivden Eğitim Tutanağı Sil
  const handleDeleteTrainingRecord = (recordId) => {
    if (!window.confirm('Bu acil durum eğitim tutanağını silmek istediğinize emin misiniz?')) return;
    const updated = emergencyTrainingRecords.filter(r => r.id !== recordId);
    if (typeof onUpdateCompany === 'function') {
      onUpdateCompany({ emergencyTrainingRecords: updated });
    }
    showToast('Eğitim tutanağı silindi.');
  };`;

if (!content.includes(oldStateStr)) {
  console.error("Could not find oldStateStr");
  process.exit(1);
}
content = content.replace(oldStateStr, newStateStr);

// 3. UPDATE handleSaveTrainingRecord
const oldSaveTrainingStr = `  // ── 6. ACİL DURUM EĞİTİM TUTANAĞI KAYDETME ──
  const handleSaveTrainingRecord = (e) => {
    e.preventDefault();

    const selectedIguUser = safeUsers.find(u => u.id === selectedIguId || u.username === selectedIguId) || defaultIgu;

    const newTraining = {
      id: \`edutrain-\${Date.now()}\`,
      title: trainingTitle,
      date: trainingDate,
      hours: trainingHours,
      topics: trainingTopics,
      employerName,
      iguName: selectedIguUser.name || selectedIguUser.username || currentUser?.name || 'İSG Uzmanı',
      participants,
      createdAt: new Date().toISOString()
    };

    const updated = [newTraining, ...emergencyTrainingRecords];
    if (typeof onUpdateCompany === 'function') {
      onUpdateCompany({ emergencyTrainingRecords: updated });
    }

    showToast('Acil Durum Eğitim Katılım Tutanağı kaydedildi!');
    setSelectedRecordForPrint(newTraining);
    setReportSettings(prev => ({ ...prev, reportDate: newTraining.date }));
    setActiveTab('print_training');
  };`;

const newSaveTrainingStr = `  // ── 6. ACİL DURUM EĞİTİM TUTANAĞI KAYDETME ──
  const handleSaveTrainingRecord = (e) => {
    e.preventDefault();

    const selectedIguUser = safeUsers.find(u => u.id === selectedIguId || u.username === selectedIguId) || defaultIgu;

    const activeTopicsList = trainingTopicList.filter(t => t.selected !== false).map(t => t.name);
    const finalTopics = activeTopicsList.length > 0 ? formatTopicsToText(activeTopicsList) : trainingTopics;

    const newTraining = {
      id: \`edutrain-\${Date.now()}\`,
      title: trainingTitle,
      drillType: trainingDrillType,
      date: trainingDate,
      hours: trainingHours,
      topics: finalTopics,
      topicItems: activeTopicsList,
      employerName,
      iguName: selectedIguUser.name || selectedIguUser.username || currentUser?.name || 'İSG Uzmanı',
      participants,
      createdAt: new Date().toISOString()
    };

    const updated = [newTraining, ...emergencyTrainingRecords];
    if (typeof onUpdateCompany === 'function') {
      onUpdateCompany({ emergencyTrainingRecords: updated });
    }

    showToast('Acil Durum Eğitim Katılım Tutanağı kaydedildi!');
    setSelectedRecordForPrint(newTraining);
    setReportSettings(prev => ({ ...prev, reportDate: newTraining.date }));
    setActiveTab('print_training');
  };`;

if (!content.includes(oldSaveTrainingStr)) {
  console.error("Could not find oldSaveTrainingStr");
  process.exit(1);
}
content = content.replace(oldSaveTrainingStr, newSaveTrainingStr);

// 4. UPDATE TAB BUTTON (Arşiv Sayısı)
content = content.replace(
  '<span>Rapor Arşivi ({drillRecords.length})</span>',
  '<span>Rapor Arşivi ({drillRecords.length + emergencyTrainingRecords.length})</span>'
);

// 5. UPDATE TRAINING FORM (activeTab === 'training_form')
const oldTrainingFormStr = `{activeTab === 'training_form' && (
        <form onSubmit={handleSaveTrainingRecord} className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
            <h1 className="text-xl font-extrabold text-white">Acil Durum Eğitim Katılım Tutanağı Düzenleme</h1>
            <p className="text-xs text-slate-400 mt-1">Acil durum planı, yangın söndürme ve tahliye eğitimlerinin resmi ıslak imzalı katılım tutanağı.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Eğitim Konusu / Başlığı *</label>
                <input
                  type="text"
                  required
                  value={trainingTitle}
                  onChange={e => setTrainingTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Eğitim Tarihi</label>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={e => setTrainingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Eğitim Süresi (Saat)</label>
                <input
                  type="number"
                  value={trainingHours}
                  onChange={e => setTrainingHours(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Eğitim İçeriği ve Yasal Konuları</label>
              <textarea
                rows={3}
                value={trainingTopics}
                onChange={e => setTrainingTopics(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-xs leading-relaxed"
              ></textarea>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
              <span className="text-xs text-slate-500 font-bold">
                Eğitime Katılan Personel Sayısı: {participants.length} Kişi
              </span>
              <button
                type="button"
                onClick={handleImportEmployeesFromHR}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Users size={14} /> İK'dan Personelleri Listeye Ekle
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition"
            >
              <CheckCircle2 size={18} />
              <span>Acil Durum Eğitim Tutanağını Kaydet ve PDF Çıkar</span>
            </button>
          </div>
        </form>
      )}`;

const newTrainingFormStr = `{activeTab === 'training_form' && (
        <form onSubmit={handleSaveTrainingRecord} className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                    <FileCheck size={14} /> İşyerlerinde Acil Durumlar Hk. Yönetmelik Md. 19
                  </span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/30">
                    Çalışanların İSG Eğitimleri Yönetmeliği
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-white mt-2">Acil Durum & Tatbikat Eğitim Katılım Tutanağı</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Yapay zeka ile tatbikat türüne ve işletmeye özel konu önerisi, hazır şablon kütüphanesi ve resmi ıslak imzalı katılım tutanağı.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetToDefaultFireTopics}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
                  title="Kullanıcının talep ettiği 13 temel yangın eğitimi konusunu yükler"
                >
                  <RefreshCw size={14} />
                  <span>Varsayılan Yangın Taslağı</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition"
                >
                  <Save size={14} />
                  <span>Şablon Olarak Kaydet</span>
                </button>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 1. YAPAY ZEKA (AI) SENARYO VE TATBİKAT KONU ÖNERİ MOTORU */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/40 text-indigo-300">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    Yapay Zeka (AI) Tatbikat Eğitim Konuları ve Şablon Motoru
                    <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">Akıllı Öneri</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Özel senaryonuzu veya odak alanınızı yazın, yapay zeka ne tatbikatı olduğunu belirleyerek resmi eğitim konularını otomatik üretsin.
                  </p>
                </div>
              </div>

              {/* Hızlı Tür Butonları */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: '🔥 Yangın & Söndürme', type: 'Yangın ve Söndürme' },
                  { label: '🏃‍♂️ Acil Tahliye', type: 'Acil Tahliye' },
                  { label: '🌍 Deprem', type: 'Deprem' },
                  { label: '⚗️ Kimyasal Sızıntı', type: 'Kimyasal Sızıntı' },
                  { label: '⛑️ İlkyardım & Kurtarma', type: 'İlkyardım ve Kurtarma' },
                  { label: '🌊 Sel & Afet', type: 'Sel ve Su Baskını' },
                  { label: '⚡ Parlama & ATEX', type: 'Parlama ve Patlama' }
                ].map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setTrainingDrillType(item.type);
                      setTrainingAiPrompt(item.type + ' kapsamında acil durum eğitimi ve tatbikatı');
                    }}
                    className={\`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition border \${
                      trainingDrillType === item.type
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }\`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manuel Senaryo / İstek Yazma Inputu */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trainingAiPrompt}
                  onChange={e => setTrainingAiPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateAiTrainingTopics();
                    }
                  }}
                  placeholder="Manuel senaryo yazın (Örn: Kazan dairesi doğalgaz yangını, boyahane tiner döküntüsü, lityum batarya alev alması, yüksek depoda yangın)..."
                  className="w-full bg-slate-950/80 border border-indigo-500/40 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none pr-10 shadow-inner"
                />
                {trainingAiPrompt && (
                  <button
                    type="button"
                    onClick={() => setTrainingAiPrompt('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateAiTrainingTopics}
                disabled={isAiGeneratingTrainingTopics}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition shrink-0"
              >
                {isAiGeneratingTrainingTopics ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>AI Konuları Hazırlıyor...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>✨ AI Konuları Öner & Şablon Hazırla</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 2. ŞABLON KÜTÜPHANESİ ARAÇ ÇUBUĞU (EĞİTİM MODÜLÜNDEKİ GİBİ) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  Acil Durum & Tatbikat Eğitim Şablonları Kütüphanesi
                </span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {availableEmergencyTemplates.length} Hazır Şablon
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaultFireTopics}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                >
                  <RefreshCw size={13} /> Varsayılan Yangın Taslağı
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                >
                  <Save size={13} /> Şablon Olarak Kaydet
                </button>
              </div>
            </div>

            {/* Şablon Kartları / Hapları */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap sm:flex-nowrap">
              {availableEmergencyTemplates.map(tmpl => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={\`shrink-0 p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 \${
                      isSelected
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm ring-1 ring-amber-400/30'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }\`}
                    style={{ minWidth: '220px', maxWidth: '280px' }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                          {tmpl.badge || '📌 Şablon'} • {tmpl.hours || '2'} Saat
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={tmpl.name}>
                          {tmpl.name}
                        </h4>
                      </div>

                      {tmpl.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomTemplate(tmpl.id, tmpl.name);
                          }}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          title="Özel şablonu sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {tmpl.topics?.length || 0} Konu Maddesi
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleApplyEmergencyTemplate(tmpl, 'replace')}
                        className="flex-1 py-1 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] text-center transition"
                      >
                        {isSelected ? '✓ Seçili Şablon' : 'Şablonu Yükle'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyEmergencyTemplate(tmpl, 'append')}
                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] transition"
                        title="Bu şablonun konularını mevcut listenin sonuna ekler"
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 3. TEMEL EĞİTİM BİLGİLERİ VE FORMU */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-100">
                1. Temel Eğitim ve Tatbikat Bilgileri
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Eğitim Konusu / Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={trainingTitle}
                  onChange={e => setTrainingTitle(e.target.value)}
                  placeholder="Örn: Acil Durum, Yangın Önleme ve Söndürme Cihazları Kullanım Eğitimi"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tatbikat / Eğitim Türü *
                </label>
                <select
                  value={trainingDrillType}
                  onChange={e => setTrainingDrillType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Yangın ve Söndürme">🔥 Yangın ve Söndürme Eğitimi</option>
                  <option value="Acil Tahliye">🏃‍♂️ Acil Tahliye ve Kaçış Eğitimi</option>
                  <option value="Deprem">🌍 Deprem ve Doğal Afet Eğitimi</option>
                  <option value="Kimyasal Sızıntı">⚗️ Tehlikeli Kimyasal Sızıntı ve KBRN</option>
                  <option value="İlkyardım ve Kurtarma">⛑️ Arama Kurtarma ve İlkyardım</option>
                  <option value="Sel ve Su Baskını">🌊 Sel ve Su Baskını Eğitimi</option>
                  <option value="Parlama ve Patlama">⚡ Parlama, Patlama ve ATEX Eğitimi</option>
                  <option value="Özel Acil Durum">⭐ Özel Acil Durum / Senaryo Eğitimi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Tarih</label>
                  <input
                    type="date"
                    value={trainingDate}
                    onChange={e => setTrainingDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Süre (Saat)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={trainingHours}
                    onChange={e => setTrainingHours(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 4. İNTERAKTİF KONU LİSTESİ VE DÜZENLEME (EĞİTİM MODÜLÜ GİBİ) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-100">
                  2. Eğitim Konuları ({trainingTopicList.filter(t => t.selected !== false).length} / {trainingTopicList.length} Konu Seçili)
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleSelectAllTopics(true)}
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <CheckSquare size={13} /> Tümünü Seç
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllTopics(false)}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <Square size={13} /> Temizle
                </button>
              </div>
            </div>

            {/* Yeni Konu Ekle Barı */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomTopicInput}
                onChange={e => setNewCustomTopicInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTopic();
                  }
                }}
                placeholder="Listeye yeni eğitim konusu ekleyin (Örn: YANGIN TÜRLERİNE GÖRE SÖNDÜRME MADDELERİ)..."
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTopic}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <Plus size={14} /> Konu Ekle
              </button>
            </div>

            {/* Konu Kartları Listesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {trainingTopicList.map((item, idx) => {
                const isChecked = item.selected !== false;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => handleToggleTopic(item.id)}
                    className={\`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer select-none \${
                      isChecked
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-600/50 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                    }\`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="pt-0.5 text-amber-600 dark:text-amber-400 shrink-0">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Madde {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTopic(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded shrink-0 transition"
                      title="Konuyu Çıkar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Doğrudan Metin Alanı Önizleme / Düzenleme */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Resmi Tutanağa Yazdırılacak Metin (Otomatik Senkronize):
              </label>
              <textarea
                rows={4}
                value={trainingTopics}
                onChange={e => setTrainingTopics(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-xs leading-relaxed font-mono text-slate-700 dark:text-slate-300"
              ></textarea>
            </div>

            {/* Katılımcı Durumu */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 flex-wrap gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Users size={15} className="text-blue-500" />
                Eğitime Katılan Personel Sayısı: {participants.length} Kişi
              </span>
              <button
                type="button"
                onClick={handleImportEmployeesFromHR}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <Users size={14} /> İK'dan Personelleri Listeye Ekle
              </button>
            </div>
          </div>

          {/* Form Submit Butonu */}
          <div className="flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDefaultFireTopics}
              className="px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Varsayılana Sıfırla
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition"
            >
              <CheckCircle2 size={18} />
              <span>Acil Durum Eğitim Tutanağını Kaydet ve PDF Çıkar</span>
            </button>
          </div>
        </form>
      )}`;

if (!content.includes(oldTrainingFormStr)) {
  console.error("Could not find oldTrainingFormStr");
  process.exit(1);
}
content = content.replace(oldTrainingFormStr, newTrainingFormStr);

// 6. UPDATE ARCHIVE LIST (activeTab === 'drill_records')
const oldArchiveStr = `{activeTab === 'drill_records' && (
        <div className="space-y-4">
          {drillRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Flame className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Kayıtlı Tatbikat Raporu Bulunamadı</h3>
              <p className="text-xs text-slate-500">Bu işletme için verilmiş acil durum tatbikat raporu henüz yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drillRecords.map(rec => (
                <div key={rec.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded border border-red-300">
                          {rec.type}
                        </span>
                        {rec.photos && rec.photos.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <Camera size={11} /> {rec.photos.length} Fotoğraf
                          </span>
                        )}
                      </div>
                      <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1.5">{rec.title}</h2>
                      <div className="text-xs text-slate-500 mt-0.5">Tarih: {rec.date} ({rec.time}) — Konum: {rec.location} — {rec.participants?.length || 0} Katılımcı</div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRecordForPrint(rec);
                        setReportSettings(prev => ({ ...prev, reportDate: rec.date }));
                        setActiveTab('print_drill');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
                    >
                      <Printer size={15} /> Resmi Çok Sayfalı Rapor (PDF)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}`;

const newArchiveStr = `{activeTab === 'drill_records' && (
        <div className="space-y-4">
          
          {/* Arşiv Filtre Barı */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Acil Durum Rapor ve Tutanak Arşivi
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setArchiveFilter('all')}
                className={\`px-3 py-1 rounded-lg text-xs font-bold transition \${
                  archiveFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }\`}
              >
                Tümü ({drillRecords.length + emergencyTrainingRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter('drills')}
                className={\`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 \${
                  archiveFilter === 'drills'
                    ? 'bg-white dark:bg-slate-800 text-red-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }\`}
              >
                <Flame size={12} /> Tatbikat Raporları ({drillRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter('trainings')}
                className={\`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 \${
                  archiveFilter === 'trainings'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }\`}
              >
                <FileCheck size={12} /> Eğitim Tutanakları ({emergencyTrainingRecords.length})
              </button>
            </div>
          </div>

          {/* Boş Durum Kontrolü */}
          {drillRecords.length === 0 && emergencyTrainingRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Flame className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Kayıtlı Rapor veya Tutanak Bulunamadı</h3>
              <p className="text-xs text-slate-500">Bu işletme için verilmiş acil durum tatbikat raporu veya eğitim tutanağı henüz yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* 1. ACİL DURUM EĞİTİM TUTANAKLARI */}
              {(archiveFilter === 'all' || archiveFilter === 'trainings') && emergencyTrainingRecords.map(rec => (
                <div key={rec.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                          <FileCheck size={12} /> Acil Durum Eğitim Tutanağı
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {rec.drillType || 'Yangın & Acil Durum'}
                        </span>
                      </div>
                      <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1.5">{rec.title}</h2>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tarih: {rec.date} — Süre: {rec.hours} Saat — {rec.participants?.length || 0} Katılımcı — İSG Uzmanı: {rec.iguName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteTrainingRecord(rec.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Tutanağı Sil"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRecordForPrint(rec);
                          setReportSettings(prev => ({ ...prev, reportDate: rec.date }));
                          setActiveTab('print_training');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <Printer size={15} /> Resmi Eğitim Tutanağı (PDF)
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 2. TATBİKAT RAPORLARI */}
              {(archiveFilter === 'all' || archiveFilter === 'drills') && drillRecords.map(rec => (
                <div key={rec.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded border border-red-300">
                          {rec.type}
                        </span>
                        {rec.photos && rec.photos.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <Camera size={11} /> {rec.photos.length} Fotoğraf
                          </span>
                        )}
                      </div>
                      <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1.5">{rec.title}</h2>
                      <div className="text-xs text-slate-500 mt-0.5">Tarih: {rec.date} ({rec.time}) — Konum: {rec.location} — {rec.participants?.length || 0} Katılımcı</div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRecordForPrint(rec);
                        setReportSettings(prev => ({ ...prev, reportDate: rec.date }));
                        setActiveTab('print_drill');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
                    >
                      <Printer size={15} /> Resmi Çok Sayfalı Rapor (PDF)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}`;

if (!content.includes(oldArchiveStr)) {
  console.error("Could not find oldArchiveStr");
  process.exit(1);
}
content = content.replace(oldArchiveStr, newArchiveStr);

// 7. UPDATE PRINT VIEW TITLE
const oldPrintH1 = `<h1
                            className="text-sm font-black uppercase text-emerald-800 tracking-wide mt-0.5"
                            contentEditable={reportSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            ACİL DURUM, YANGIN VE TAHLİYE EĞİTİMİ KATILIM TUTANAĞI
                          </h1>`;

const newPrintH1 = `<h1
                            className="text-sm font-black uppercase text-emerald-800 tracking-wide mt-0.5"
                            contentEditable={reportSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            {(selectedRecordForPrint?.title ? selectedRecordForPrint.title.replace(/eğitimi$/i, '').trim() + ' EĞİTİMİ' : 'ACİL DURUM, YANGIN VE TAHLİYE EĞİTİMİ').toUpperCase()} KATILIM TUTANAĞI
                          </h1>`;

if (!content.includes(oldPrintH1)) {
  console.error("Could not find oldPrintH1");
  process.exit(1);
}
content = content.replace(oldPrintH1, newPrintH1);

// 8. UPDATE PRINT VIEW TOPICS DISPLAY
const oldPrintTopics = `<strong>Eğitimin Yasal Dayanağı ve İçeriği:</strong> {selectedRecordForPrint.topics}`;
const newPrintTopics = `<strong className="text-slate-900 block mb-1">Eğitimin Yasal Dayanağı ve Konu Başlıkları:</strong>
                            <div className="whitespace-pre-line text-slate-800 leading-snug">
                              {selectedRecordForPrint.topics}
                            </div>`;

if (!content.includes(oldPrintTopics)) {
  console.error("Could not find oldPrintTopics");
  process.exit(1);
}
content = content.replace(oldPrintTopics, newPrintTopics);

// 9. INSERT SAVE TEMPLATE MODAL BEFORE FINAL CLOSING
const finalClosing = `    </div>
  );
}

export default EmergencyDrillTab;`;

const modalInsert = `      {/* ───────────────────────────────────────────────────────────── */}
      {/* ŞABLON KAYDETME MODALI */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Özel Eğitim Şablonu Olarak Kaydet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Şablon Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Örn: Kazan Dairesi Yangın ve Tahliye Şablonu"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Kullanım Kapsamı
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={\`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer \${
                    newTemplateScope === 'all'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }\`}>
                    <input
                      type="radio"
                      name="templateScope"
                      checked={newTemplateScope === 'all'}
                      onChange={() => setNewTemplateScope('all')}
                      className="hidden"
                    />
                    <span>🌐 Tüm İşletmeler</span>
                  </label>

                  <label className={\`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer \${
                    newTemplateScope === 'current'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }\`}>
                    <input
                      type="radio"
                      name="templateScope"
                      checked={newTemplateScope === 'current'}
                      onChange={() => setNewTemplateScope('current')}
                      className="hidden"
                    />
                    <span>🏢 Sadece Bu İşletme</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1 text-slate-500">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  Kaydedilecek Konular:
                </div>
                <div>
                  Seçili {trainingTopicList.filter(t => t.selected !== false).length} adet eğitim konusu şablona kaydedilecek ve ileride tek tıkla kullanılabilecektir.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Save size={14} /> Şablonu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

if (content.includes(finalClosing)) {
  content = content.replace(finalClosing, modalInsert + '\n' + finalClosing);
} else {
  // Try finding end of component
  const lastReturnDiv = content.lastIndexOf('    </div>\n  );');
  if (lastReturnDiv !== -1) {
    content = content.slice(0, lastReturnDiv) + modalInsert + '\n' + content.slice(lastReturnDiv);
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("SUCCESS: EmergencyDrillTab.jsx patched cleanly and completely!");
