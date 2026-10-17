const fs = require('fs');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. STEP 1: Add Multi-Company Selector right under `{wizardStep === 1 && (`
const multiCompanySelectorJSX = `
              {/* FİRMA KAPSAMI SEÇİMİ: TEK FİRMA VEYA TOPLU ÇOKLU FİRMA */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        Eğitim Verilecek Firma / Şube Kapsamı
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isMultiCompanyMode ? 'Seçtiğiniz tüm firmalar için tehlike sınıflarına uygun süreler otomatik hesaplanır.' : 'Sadece aktif seçili firma için eğitim oluşturulur.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMultiCompanyMode(false);
                        setSelectedCompanyIds([company?.id].filter(Boolean));
                      }}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition \${
                        !isMultiCompanyMode ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                      }\`}
                    >
                      Tek Firma ({company?.name || 'Aktif'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMultiCompanyMode(true)}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                        isMultiCompanyMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
                      }\`}
                    >
                      <Building2 size={13} />
                      <span>🏢 Toplu Firma Seçimi ({selectedCompanyIds.length} Firma)</span>
                    </button>
                  </div>
                </div>

                {/* ÇOKLU FİRMA SEÇİM LİSTESİ */}
                {isMultiCompanyMode && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyIds(availableCompanies.map(c => c.id))}
                          className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 text-[10px] font-bold border border-indigo-200 cursor-pointer"
                        >
                          Tümünü Seç ({availableCompanies.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyIds([company?.id].filter(Boolean))}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 text-[10px] font-bold border border-slate-200 cursor-pointer"
                        >
                          Seçimi Sıfırla
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyIds(availableCompanies.filter(c => (c.info?.hazardClass || c.hazardClass) === 'Çok Tehlikeli').map(c => c.id))}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 cursor-pointer"
                        >
                          Sadece Çok Tehlikeliler
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyIds(availableCompanies.filter(c => (c.info?.hazardClass || c.hazardClass) === 'Tehlikeli').map(c => c.id))}
                          className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 cursor-pointer"
                        >
                          Sadece Tehlikeliler
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyIds(availableCompanies.filter(c => (c.info?.hazardClass || c.hazardClass) === 'Az Tehlikeli').map(c => c.id))}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 cursor-pointer"
                        >
                          Sadece Az Tehlikeliler
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Firma filtrele..."
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg w-44 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                      {availableCompanies
                        .filter(c => !companySearchQuery.trim() || c.name?.toLowerCase().includes(companySearchQuery.toLowerCase()))
                        .map(compItem => {
                          const isChecked = selectedCompanyIds.includes(compItem.id);
                          const compH = compItem.info?.hazardClass || compItem.hazardClass || 'Tehlikeli';
                          const empCount = (compItem.employees || compItem.personnel || compItem.info?.employees || []).length;
                          return (
                            <div
                              key={compItem.id}
                              onClick={() => {
                                setSelectedCompanyIds(prev => 
                                  prev.includes(compItem.id) 
                                    ? prev.filter(id => id !== compItem.id) 
                                    : [...prev, compItem.id]
                                );
                              }}
                              className={\`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 transition \${
                                isChecked
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 font-bold shadow-xs ring-1 ring-indigo-500/20'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }\`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                                />
                                <div className="truncate">
                                  <div className="truncate text-slate-800 dark:text-slate-200">{compItem.name}</div>
                                  <div className="text-[9px] text-slate-400">{empCount} Personel</div>
                                </div>
                              </div>
                              <span className={\`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 \${
                                compH === 'Çok Tehlikeli' ? 'bg-rose-100 text-rose-700' :
                                compH === 'Tehlikeli' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }\`}>
                                {compH === 'Çok Tehlikeli' ? 'Çok Tehlikeli (16s)' : compH === 'Tehlikeli' ? 'Tehlikeli (12s)' : 'Az Tehlikeli (8s)'}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200">
                      ⚖️ <strong>Yasal Otomatik Süre Kuralı:</strong> Seçilen <strong>{selectedCompanyIds.length} firmanın</strong> her birine ait eğitim kaydı; o firmanın kendi tehlike sınıfına göre (Az Tehlikeli: 8 saat / 360 dk, Tehlikeli: 12 saat / 540 dk, Çok Tehlikeli: 16 saat / 720 dk) ve o firmanın kayıtlı personelleriyle otomatik oluşturulacaktır.
                    </div>
                  </div>
                )}
              </div>
`;

if (!content.includes('Eğitim Verilecek Firma / Şube Kapsamı')) {
  content = content.replace(
    /\{wizardStep === 1 && \(\s*<div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-200\/80 dark:border-slate-800 shadow-sm space-y-6">/,
    `{wizardStep === 1 && (\n            <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">\n${multiCompanySelectorJSX}`
  );
}

// 2. STEP 2: Replace Instructor and Doctor inputs with the enhanced Dual-Box & Registered Picker
const instructorAndDoctorJSX = `
                {/* EĞİTMEN VE İŞYERİ HEKİMİ BİLGİLERİ */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-600" />
                      Eğitici Kadrosu (İSG Uzmanı & İşyeri Hekimi)
                    </span>

                    {/* Kayıtlı personellerden hızlı doldurma */}
                    {availableStaff.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-slate-500 font-bold">Kayıtlı Kişilerden Doldur:</span>
                        <select
                          onChange={(e) => {
                            const selected = availableStaff.find(s => s.name === e.target.value);
                            if (selected) {
                              if (selected.role.includes('Hekim')) {
                                setWizardForm(prev => ({
                                  ...prev,
                                  secondInstructorName: selected.name,
                                  secondInstructorCertNo: selected.certificateNo || '',
                                  secondInstructorTitle: 'İşyeri Hekimi'
                                }));
                              } else {
                                setWizardForm(prev => ({
                                  ...prev,
                                  instructorName: selected.name,
                                  instructorCertNo: selected.certificateNo || '',
                                  instructorTitle: selected.role || 'İş Güvenliği Uzmanı'
                                }));
                              }
                            }
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Uzman veya Hekim Seç --</option>
                          {availableStaff.map((staff, idx) => (
                            <option key={idx} value={staff.name}>
                              {staff.name} ({staff.role} - {staff.source})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 1. İSG Uzmanı Kutusu */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <GraduationCap size={13} />
                        İş Güvenliği Uzmanı (Eğitici)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Adı Soyadı</label>
                          <input
                            type="text"
                            placeholder="Uzman Adı Soyadı"
                            value={wizardForm.instructorName}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, instructorName: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Belge / Sertifika No</label>
                          <input
                            type="text"
                            placeholder="Örn: 145892"
                            value={wizardForm.instructorCertNo}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, instructorCertNo: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. İşyeri Hekimi Kutusu (YENİ İSTENEN KUTUCUK) */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2">
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Stethoscope size={13} />
                        İşyeri Hekimi (Eğitici)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Hekim Adı Soyadı</label>
                          <input
                            type="text"
                            placeholder="Dr. Ad Soyad"
                            value={wizardForm.secondInstructorName}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, secondInstructorName: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Diploma / Belge No</label>
                          <input
                            type="text"
                            placeholder="Örn: 98452"
                            value={wizardForm.secondInstructorCertNo}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, secondInstructorCertNo: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
`;

// Replace old instructor fields
content = content.replace(
  /<div>\s*<label className="block text-\[11px\] font-bold text-slate-500 mb-1">Eğitmen \(İSG Uzmanı \/ Eğitici\)<\/label>[\s\S]*?className="w-full px-3\.5 py-2\.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"\s*\/>\s*<\/div>/m,
  instructorAndDoctorJSX
);

// 3. STEP 2: Add AI Topic and AI Template buttons in the Topics Toolbar
const aiTopicAndTemplateButtons = `
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAiSectorInput(company?.info?.sector || company?.name || '');
                          setShowAiTopicModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition active:scale-95 cursor-pointer"
                        title="İşletmenin sektörüne ve risklerine göre yapay zekadan yeni konu önerileri alır"
                      >
                        <Bot size={13} />
                        <span>🤖 AI Konu Öner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiSectorInput(company?.info?.sector || company?.name || '');
                          setShowAiTemplateModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                        title="Tehlike sınıfı ve sektöre göre komple 0'dan yapay zeka müfredat şablonu oluşturur"
                      >
                        <Sparkles size={13} />
                        <span>✨ AI Şablon Üret</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 transition cursor-pointer"
                      >
                        <FolderOpen size={13} />
                        <span>Mevzuat Şablonları</span>
                      </button>
                    </div>
`;

content = content.replace(
  /<div className="flex items-center gap-2">\s*<button\s*type="button"\s*onClick=\{\(\) => setShowTemplateModal\(true\)\}[\s\S]*?<\/button>\s*<\/div>/m,
  aiTopicAndTemplateButtons
);

// 4. STEP 2: Enhance topics table rows with category selector, inline editing, and add row at bottom
const enhancedTopicRow = `
                        <div
                          key={topic.id || index}
                          className={\`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs \${
                            isRiskCategory
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60'
                          }\`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={\`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 \${
                              isRiskCategory 
                                ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200' 
                                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                            }\`}>
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <input
                                type="text"
                                value={topic.name || topic.title || ''}
                                onChange={(e) => handleUpdateTopic(topic.id, 'name', e.target.value)}
                                className="bg-transparent border-0 font-semibold text-slate-800 dark:text-slate-200 focus:ring-0 focus:outline-none w-full text-xs"
                                placeholder="Konu başlığı..."
                              />
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={topic.category || 'Genel Konular'}
                                  onChange={(e) => handleUpdateTopic(topic.id, 'category', e.target.value)}
                                  className="text-[9px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                                >
                                  <option value="Genel Konular">Genel Konular</option>
                                  <option value="Sağlık Konuları">Sağlık Konuları</option>
                                  <option value="Teknik Konular">Teknik Konular</option>
                                  <option value="İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular">İşe ve İşyerine Özgü Riskler</option>
                                  <option value="İşletme Genel Kuralları">İşletme Genel Kuralları</option>
                                  <option value="Özel Konu">Özel Konu</option>
                                </select>
                                {topic.isAiGenerated && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                    🤖 AI
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Süre Düzenleme (Dakika ve Ders Saati Göstergeli) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                max="720"
                                step="15"
                                value={tMinutes}
                                onChange={(e) => handleUpdateTopic(topic.id, 'minutes', Number(e.target.value))}
                                className="w-9 text-center text-xs font-bold border-0 p-0 focus:outline-none bg-transparent"
                              />
                              <span className="text-[10px] text-slate-400 font-bold ml-1">dk</span>
                            </div>

                            <span className="text-[9px] font-bold text-slate-400">
                              ({(tMinutes / LESSON_MINUTES).toFixed(1)} ders)
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(topic.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                              title="Konuyu Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
`;

content = content.replace(
  /<div\s*key=\{topic\.id \|\| index\}\s*className=\{\`p-2\.5 rounded-2xl border flex items-center justify-between gap-3 text-xs[\s\S]*?<\/div>\s*\);\s*\}\)/m,
  enhancedTopicRow.trim() + '\n                      ); \n                    })'
);

// 5. Add inline new topic adder form at bottom of topics list
const inlineTopicAdderRow = `
                    {/* YENİ KONU EKLEME FORMU (INLINE) */}
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <Plus size={13} />
                        Yeni Eğitim Konusu Ekle (Elle Serbest Giriş):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            placeholder="Yeni konu başlığı yazın..."
                            value={inlineNewTopic.name}
                            onChange={(e) => setInlineNewTopic(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={inlineNewTopic.category}
                            onChange={(e) => setInlineNewTopic(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                          >
                            <option value="Genel Konular">Genel Konular</option>
                            <option value="Sağlık Konuları">Sağlık Konuları</option>
                            <option value="Teknik Konular">Teknik Konular</option>
                            <option value="İşe ve İş Yerine Özgü Riskler ve Risk Değerlendirmesine Dayalı Konular">İşe Özgü Riskler</option>
                            <option value="Özel Konu">Özel Konu</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <input
                            type="number"
                            step="15"
                            min="15"
                            max="360"
                            value={inlineNewTopic.minutes}
                            onChange={(e) => setInlineNewTopic(prev => ({ ...prev, minutes: Number(e.target.value) }))}
                            className="w-14 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                          <span className="text-[10px] text-slate-500 font-bold">dk</span>
                        </div>
                        <div className="sm:col-span-1">
                          <button
                            type="button"
                            onClick={handleAddInlineCustomTopic}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
                            title="Konuyu Listeye Ekle"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
`;

if (!content.includes('Yeni Eğitim Konusu Ekle (Elle Serbest Giriş)')) {
  content = content.replace(
    /\{\/\* Konu Listesi \*\/\}\s*<div className="space-y-2 max-h-\[380px\] overflow-y-auto pr-1">([\s\S]*?)<\/div>\s*<\/div>/m,
    `{/* Konu Listesi */}\n                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">$1</div>\n${inlineTopicAdderRow}\n                </div>`
  );
}

// 6. STEP 3: Add Multi-Company summary banner if isMultiCompanyMode
const multiCompanyStep3Summary = `
                {/* ÇOKLU FİRMA TOPLU OLUŞTURMA ÖZETİ */}
                {isMultiCompanyMode && (
                  <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Building2 size={15} />
                        Seçilen Firmalar ve Otomatik Yasal Süre Dağıtım Özeti ({selectedCompaniesList.length} Firma)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                        Toplu Dağıtım Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedCompaniesList.map(c => {
                        const hClass = c.info?.hazardClass || c.hazardClass || 'Tehlikeli';
                        const empCount = (c.employees || c.personnel || c.info?.employees || []).length;
                        const reqHours = hClass === 'Çok Tehlikeli' ? 16 : hClass === 'Tehlikeli' ? 12 : 8;
                        return (
                          <div key={c.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{empCount} Kayıtlı Personel</div>
                            <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
                              <span className={hClass === 'Çok Tehlikeli' ? 'text-rose-600' : hClass === 'Tehlikeli' ? 'text-amber-600' : 'text-emerald-600'}>
                                {hClass}
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {wizardForm.trainingType === 'ise_baslama' ? '2 Saat (Madde 7)' : \`\${reqHours} Ders (\${reqHours * 45} Dk)\`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
`;

if (!content.includes('Seçilen Firmalar ve Otomatik Yasal Süre Dağıtım Özeti')) {
  content = content.replace(
    /\{\/\* Step 3 İçerik Kartı \*\/\}[\s\S]*?<div className="space-y-4">/,
    `$&\n${multiCompanyStep3Summary}`
  );
}

// 7. Inject AI Modals before the closing `</div>` of the component
const aiModalsJSX = `
      {/* ========================================================================= */}
      {/* 🤖 AI İLE YENİ KONU ÖNERİ MODALI */}
      {/* ========================================================================= */}
      {showAiTopicModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-600">
                <Bot size={20} />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Yapay Zeka ile İSG Konusu Öner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiTopicModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              İşletmenin sektörü ve sahadaki özel riskler doğrultusunda mevzuatın 4. kategorisine uygun pratik konular üretilir.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sektör / Faaliyet Alanı</label>
                <input
                  type="text"
                  value={aiSectorInput}
                  onChange={(e) => setAiSectorInput(e.target.value)}
                  placeholder="Örn: Metal İşleme, İnşaat, Kimya, Depolama..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">İşyerindeki Özel Riskler / Ekipmanlar</label>
                <textarea
                  rows={2}
                  value={aiRisksInput}
                  onChange={(e) => setAiRisksInput(e.target.value)}
                  placeholder="Örn: Forklift trafiği, tavan vinci, pres makineleri, kimyasal tanklar..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAiTopicModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleAiGenerateWizardTopics}
                disabled={isAiGeneratingTopics}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isAiGeneratingTopics ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Konular Üretiliyor...</span>
                  </>
                ) : (
                  <>
                    <Bot size={14} />
                    <span>Konuları Üret ve Ekle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✨ AI İLE SIFIRDAN KOMPLE MÜFREDAT ŞABLONU ÜRETME MODALI */}
      {/* ========================================================================= */}
      {showAiTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles size={20} />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Yapay Zeka ile Komple Müfredat Şablonu Üret
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Yönetmelik Ek-1’deki 4 ana kategoriye ve firmanın tehlike sınıfına göre tam ders saatli (45 dk kuralı) özel bir eğitim şablonu oluşturulur.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tehlike Sınıfı Hedefi</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { h: 'Az Tehlikeli', l: 8, m: 360 },
                    { h: 'Tehlikeli', l: 12, m: 540 },
                    { h: 'Çok Tehlikeli', l: 16, m: 720 }
                  ].map(cls => (
                    <button
                      key={cls.h}
                      type="button"
                      onClick={() => setWizardForm(prev => ({ ...prev, hazardClass: cls.h }))}
                      className={\`p-2 rounded-xl text-center border text-xs font-bold transition cursor-pointer \${
                        (wizardForm.hazardClass || companyHazardClass) === cls.h
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600'
                      }\`}
                    >
                      <div>{cls.h}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cls.l} Ders ({cls.m} Dk)</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sektör / İş Kolu</label>
                <input
                  type="text"
                  value={aiSectorInput}
                  onChange={(e) => setAiSectorInput(e.target.value)}
                  placeholder="Örn: Tekstil Fabrikası, Gıda Üretim, Lojistik..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAiTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => handleAiGenerateWizardTemplate()}
                disabled={isAiGeneratingTemplate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white flex items-center gap-1.5 shadow-md shadow-orange-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isAiGeneratingTemplate ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Şablon Üretiliyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Müfredatı Üret ve Uygula</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('AI İLE YENİ KONU ÖNERİ MODALI')) {
  content = content.replace(
    /\{\/\* ========================================================================= \*\/\}\s*\{\/\* 📜 KATILIMCI SERTİFİKALARI PORTALI/,
    `${aiModalsJSX}\n\n      {/* ========================================================================= */}\n      {/* 📜 KATILIMCI SERTİFİKALARI PORTALI`
  );
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('>>> EducationHubTab UI patch successfully applied!');
