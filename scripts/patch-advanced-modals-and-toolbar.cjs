const fs = require('fs');

const hubPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(hubPath, 'utf8');

// 1. Update Step 2 Toolbar with Library & Save buttons
const updatedToolbarButtons = `
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAiSuggestedTopicsList([]);
                          setSelectedAiTopicIds(new Set());
                          setAiCustomTopicPrompt('');
                          setShowAiTopicModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition active:scale-95 cursor-pointer shadow-2xs"
                        title="Elle girdiğiniz özel metne göre yapay zekadan konu önerileri alıp seçerek ekleyin"
                      >
                        <Bot size={13} />
                        <span>🤖 AI Konu Öner (İnteraktif)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiGeneratedCurriculumPreview(null);
                          setAiCustomTemplatePrompt('');
                          setShowAiTemplateModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                        title="Özel talep veya senaryonuza göre sıfırdan komple müfredat şablonu oluşturun"
                      >
                        <Sparkles size={13} />
                        <span>✨ AI Şablon Üret</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          refreshLibraryData();
                          setShowLibraryModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-2xs"
                        title="Tüm kayıtlı şablonları ve konuları inceleyin, tek tıkla içeriğe ekleyin veya çıkarın"
                      >
                        <FolderOpen size={13} />
                        <span>📚 Şablon & Konu Kütüphanesi</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 dark:bg-indigo-800 text-[10px] font-black">
                          {savedTemplatesList.length + savedTopicsList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewTemplateForm({
                            name: \`\${company?.name || 'Özel'} - \${wizardForm.title}\`,
                            description: 'Eğitim sihirbazından kaydedilen özel müfredat şablonu',
                            scope: 'all',
                            targetCompanyIds: []
                          });
                          setShowSaveAsTemplateModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                        title="Şu anda oluşturduğunuz bu eğitimi gelecekte tüm firmalarda veya bu firmada kullanmak üzere şablon olarak kaydeder"
                      >
                        <Save size={13} />
                        <span>💾 Şablon Olarak Kaydet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 transition cursor-pointer"
                      >
                        <BookOpen size={13} />
                        <span>Mevzuat Şablonları</span>
                      </button>
                    </div>
`;

content = content.replace(
  /<div className="flex items-center gap-1\.5 flex-wrap">\s*<button[\s\S]*?onClick=\{\(\) => setShowTemplateModal\(true\)\}[\s\S]*?<\/div>\s*<\/div>/m,
  `${updatedToolbarButtons}\n                  </div>`
);

// 2. Full Modals JSX: AI Topic Modal, AI Template Modal, Library Modal, Save Template Modal
const allModalsJSX = `
      {/* ========================================================================= */}
      {/* 🤖 1. İNTERAKTİF AI KONU ÖNERİ VE ÇOKLU SEÇİM MODALI */}
      {/* ========================================================================= */}
      {showAiTopicModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-purple-600">
                <Bot size={22} />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Yapay Zeka ile Özel Konu Önerileri (İnteraktif Seçim)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kendi girdiğiniz özel konu veya tehlike metnine göre AI alternatif konular üretir; istediklerinizi seçip eklersiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiTopicModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* AŞAMA 1: KULLANICI GİRDİSİ */}
            <div className="space-y-3 shrink-0">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ✍️ Eklemek İstediğiniz Konu, Risk veya Özel Odak Alanı:
                </label>
                <textarea
                  rows={2}
                  value={aiCustomTopicPrompt}
                  onChange={(e) => setAiCustomTopicPrompt(e.target.value)}
                  placeholder="Örn: Depoda forklift kazaları, kör noktalar, aşırı hız ve yaya emniyet yolları güvenliği..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  İşletme Sektörü: <strong>{company?.info?.sector || company?.name || 'Sanayi'}</strong>
                </span>

                <button
                  type="button"
                  onClick={handleFetchInteractiveAiTopics}
                  disabled={isAiGeneratingTopics || !aiCustomTopicPrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isAiGeneratingTopics ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Yapay Zeka Konuları Hazırlıyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Alternatif Konuları Üret</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AŞAMA 2: ÖNERİLEN KONULAR LİSTESİ VE ÇOKLU SEÇİM */}
            {aiSuggestedTopicsList.length > 0 && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-purple-600" />
                    Önerilen Konular ({selectedAiTopicIds.size} / {aiSuggestedTopicsList.length} Seçildi):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAiTopicIds.size === aiSuggestedTopicsList.length) {
                        setSelectedAiTopicIds(new Set());
                      } else {
                        setSelectedAiTopicIds(new Set(aiSuggestedTopicsList.map(t => t.id)));
                      }
                    }}
                    className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    {selectedAiTopicIds.size === aiSuggestedTopicsList.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                  </button>
                </div>

                <div className="space-y-2">
                  {aiSuggestedTopicsList.map((item, idx) => {
                    const isChecked = selectedAiTopicIds.has(item.id);
                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          setSelectedAiTopicIds(prev => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                        }}
                        className={\`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between gap-3 transition \${
                          isChecked
                            ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 shadow-xs ring-1 ring-purple-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }\`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.category}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shrink-0">
                          {item.minutes} dk
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Kütüphaneye de Kaydetme Seçeneği */}
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-2 text-xs">
                  <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiAlsoSaveToLibrary}
                      onChange={(e) => setAiAlsoSaveToLibrary(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span>💾 Seçilen konuları kalıcı kütüphaneme de kaydet (Diğer eğitimlerde hazır kullanmak için)</span>
                  </label>

                  {aiAlsoSaveToLibrary && (
                    <div className="pl-6 flex items-center gap-3 text-[11px]">
                      <span className="text-slate-500 font-bold">Kapsam:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="aiTopicSaveScope"
                          checked={aiTopicSaveScope === 'all'}
                          onChange={() => setAiTopicSaveScope('all')}
                        />
                        <span>🌐 Tüm Firmalar İçin Ortak</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="aiTopicSaveScope"
                          checked={aiTopicSaveScope === 'current'}
                          onChange={() => setAiTopicSaveScope('current')}
                        />
                        <span>🏢 Sadece Bu Firmaya Özel ({company?.name})</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BUTONLAR */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiTopicModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Kapat
              </button>

              {aiSuggestedTopicsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplySelectedAiTopics}
                  disabled={selectedAiTopicIds.size === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-lg shadow-purple-600/25 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Seçilenleri Eğitime Ekle ({selectedAiTopicIds.size} Konu)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✨ 2. İNTERAKTİF AI ŞABLON ÜRETİM MODALI (Özel Senaryo & İnceleme) */}
      {/* ========================================================================= */}
      {showAiTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles size={22} />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Yapay Zeka ile Özel Müfredat Şablonu Üret
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Yazacağınız senaryo ve odak alanına göre 4 kategorili tam mevzuat müfredatı oluşturulur.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Girdi Alanları */}
            <div className="space-y-3 shrink-0">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎯 Şablonun Odaklanacağı Konu veya İşyeri Senaryosu:
                </label>
                <textarea
                  rows={2}
                  value={aiCustomTemplatePrompt}
                  onChange={(e) => setAiCustomTemplatePrompt(e.target.value)}
                  placeholder="Örn: Tekstil boyahanesinde kimyasal maruziyet, buhar kazanları, yüksek basınç ve statik elektrik önlemleri..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Hedef:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                    {wizardForm.hazardClass || companyHazardClass}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateInteractiveAiTemplate}
                  disabled={isAiGeneratingTemplate || !aiCustomTemplatePrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isAiGeneratingTemplate ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Şablon Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Şablonu Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Üretilen Şablon Önizleme ve İnceleme */}
            {aiGeneratedCurriculumPreview && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={aiGeneratedCurriculumPreview.name}
                    onChange={(e) => setAiGeneratedCurriculumPreview(prev => ({ ...prev, name: e.target.value }))}
                    className="font-black text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md"
                  />
                  <span className="text-xs font-black text-amber-600">
                    {aiGeneratedCurriculumPreview.totalHours} Ders ({aiGeneratedCurriculumPreview.totalMinutes} Dk)
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {aiGeneratedCurriculumPreview.topics.map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAiGeneratedCurriculumPreview(prev => ({
                              ...prev,
                              topics: prev.topics.map((item, i) => i === idx ? { ...item, name: val } : item)
                            }));
                          }}
                          className="bg-transparent border-0 font-bold text-slate-800 dark:text-slate-100 w-full text-xs p-0 focus:outline-none"
                        />
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.category}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="15"
                          value={t.minutes}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAiGeneratedCurriculumPreview(prev => ({
                              ...prev,
                              topics: prev.topics.map((item, i) => i === idx ? { ...item, minutes: val, hours: val / 45 } : item)
                            }));
                          }}
                          className="w-12 text-center text-xs font-bold bg-slate-50 dark:bg-slate-800 border rounded px-1 py-0.5"
                        />
                        <span className="text-[10px] text-slate-400">dk</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kütüphaneye Kaydetme Kapsamı */}
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">💾 Şablon Kayıt Kapsamı:</span>
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="aiTemplateSaveScope"
                        checked={aiTemplateSaveScope === 'all'}
                        onChange={() => setAiTemplateSaveScope('all')}
                      />
                      <span>🌐 Tüm Firmalar İçin Ortak (Genel Kütüphane)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="aiTemplateSaveScope"
                        checked={aiTemplateSaveScope === 'current'}
                        onChange={() => setAiTemplateSaveScope('current')}
                      />
                      <span>🏢 Sadece Bu Firma ({company?.name})</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Kapat
              </button>

              {aiGeneratedCurriculumPreview && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyAiGeneratedCurriculum(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    Sadece Eğitime Uygula
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyAiGeneratedCurriculum(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Kütüphaneye Kaydet & Uygula</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 3. MERKEZİ ŞABLON & KONU KÜTÜPHANESİ PORTALI (Ekle / Çıkar / Düzenle) */}
      {/* ========================================================================= */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            {/* Başlık ve Sekmeler */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Merkezi Şablon & Konu Kütüphanesi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tüm firmalar veya seçili firmanıza ait kayıtlı şablonları tek tıkla içeriğe ekleyin veya kaldırın.
                  </p>
                </div>
              </div>

              {/* Sekme Butonları */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLibraryActiveTab('templates')}
                  className={\`px-3 py-1.5 rounded-lg transition \${
                    libraryActiveTab === 'templates' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }\`}
                >
                  📂 Şablonlar ({savedTemplatesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryActiveTab('topics')}
                  className={\`px-3 py-1.5 rounded-lg transition \${
                    libraryActiveTab === 'topics' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                  }\`}
                >
                  📌 Özel Konular ({savedTopicsList.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Arama ve Filtre Çubuğu */}
            <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Filtrele:</span>
                <button
                  type="button"
                  onClick={() => setLibraryFilterScope('all')}
                  className={\`px-2.5 py-1 rounded-lg text-xs font-bold \${
                    libraryFilterScope === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }\`}
                >
                  Tüm Kayıtlar
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilterScope('company')}
                  className={\`px-2.5 py-1 rounded-lg text-xs font-bold \${
                    libraryFilterScope === 'company' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }\`}
                >
                  Sadece Bu Firma ({company?.name || 'Mevcut'})
                </button>
              </div>

              <input
                type="text"
                placeholder="Şablon veya konu ara..."
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl w-48 font-medium"
              />
            </div>

            {/* SEKME 1: ŞABLONLAR */}
            {libraryActiveTab === 'templates' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {savedTemplatesList
                  .filter(tmpl => {
                    if (libraryFilterScope === 'company' && tmpl.scope === 'current' && String(tmpl.companyId) !== String(company?.id)) return false;
                    if (!librarySearchQuery.trim()) return true;
                    return (tmpl.name || '').toLowerCase().includes(librarySearchQuery.toLowerCase());
                  })
                  .map((tmpl) => {
                    // Bu şablonun konularının kaç tanesi şu an eğitimde var?
                    const tmplTopics = Array.isArray(tmpl.topics) ? tmpl.topics : [];
                    const includedCount = tmplTopics.filter(tt => 
                      wizardForm.topics.some(wt => (wt.name || wt.title || '').trim().toLowerCase() === (tt.name || tt.title || '').trim().toLowerCase())
                    ).length;
                    const isFullyIncluded = tmplTopics.length > 0 && includedCount === tmplTopics.length;
                    const isPartiallyIncluded = includedCount > 0 && !isFullyIncluded;

                    return (
                      <div
                        key={tmpl.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {tmpl.name}
                              </h4>
                              <span className={\`text-[9px] px-2 py-0.5 rounded-full font-bold \${
                                tmpl.scope === 'all' 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }\`}>
                                {tmpl.scope === 'all' ? '🌐 Tüm Firmalar' : \`🏢 \${tmpl.companyName || 'Bu Firma'}\`}
                              </span>
                              {tmpl.isAiGenerated && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                  🤖 AI
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {tmpl.hazardClass} • {tmpl.totalHours} Ders ({tmpl.totalMinutes} Dk) • {tmplTopics.length} Konu
                            </p>
                          </div>

                          {/* AKSIYON BUTONLARI (İÇERİĞE EKLE / İÇERİKTEN KALDIR) */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isFullyIncluded || isPartiallyIncluded ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveTemplateFromTraining(tmpl)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1 transition cursor-pointer"
                                title="Bu şablonun konularını mevcut eğitimden kaldırır"
                              >
                                <Trash2 size={13} />
                                <span>➖ İçerikten Çıkar ({includedCount} Konu)</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleAddTemplateToTraining(tmpl)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Bu şablonun tüm konularını mevcut eğitime ekler"
                            >
                              <Plus size={13} />
                              <span>➕ İçeriğe Ekle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingTemplateItem(tmpl)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                              title="Şablonu Düzenle / Yeni Konu Ekle"
                            >
                              <Edit3 size={14} />
                            </button>

                            {!tmpl.id.startsWith('tmpl_std_') && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(\`"\${tmpl.name}" şablonunu silmek istediğinize emin misiniz?\`)) {
                                    deleteCustomTemplate(tmpl.id);
                                    refreshLibraryData();
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                                title="Şablonu Kütüphaneden Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Konu Başlıkları Hapları */}
                        <div className="flex flex-wrap gap-1">
                          {tmplTopics.slice(0, 6).map((tp, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {tp.name || tp.title} ({tp.minutes} dk)
                            </span>
                          ))}
                          {tmplTopics.length > 6 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-bold">
                              +{tmplTopics.length - 6} konu daha
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* SEKME 2: ÖZEL KONULAR HAVUZU */}
            {libraryActiveTab === 'topics' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {savedTopicsList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Henüz kayıtlı özel konu bulunmuyor. AI ile konu önerildiğinde veya kendiniz eklediğinizde "Kütüphaneye Kaydet" seçeneğiyle burada depolayabilirsiniz.
                  </div>
                ) : (
                  savedTopicsList
                    .filter(top => {
                      if (libraryFilterScope === 'company' && top.scope === 'current' && String(top.companyId) !== String(company?.id)) return false;
                      if (!librarySearchQuery.trim()) return true;
                      return (top.name || '').toLowerCase().includes(librarySearchQuery.toLowerCase());
                    })
                    .map((top) => {
                      const isAdded = wizardForm.topics.some(wt => (wt.name || wt.title || '').trim().toLowerCase() === (top.name || '').trim().toLowerCase());
                      return (
                        <div
                          key={top.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{top.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-bold">
                                {top.category}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                                {top.minutes} dk
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {top.scope === 'all' ? '🌐 Tüm Firmalar İçin Kayıtlı' : \`🏢 \${top.companyName || 'Bu Firma'}\`}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTopicInTraining(top)}
                              className={\`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer \${
                                isAdded
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }\`}
                            >
                              {isAdded ? (
                                <>
                                  <Trash2 size={13} />
                                  <span>İçerikten Kaldır</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={13} />
                                  <span>İçeriğe Ekle</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteCustomTopic(top.id);
                                refreshLibraryData();
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                              title="Konuyu Kütüphaneden Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Alt Kapat Butonu */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💾 4. MEVCUT EĞİTİMİ ŞABLON OLARAK KAYDETME MODALI */}
      {/* ========================================================================= */}
      {showSaveAsTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleSaveActiveTrainingAsTemplate}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <Save size={20} />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Müfredatı Şablon Olarak Kaydet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveAsTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Şu anki {wizardForm.topics.length} konuyu ve süre dağılımını gelecekte tek tıkla kullanmak üzere kütüphanenize kaydedin.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Şablon Adı
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateForm.name}
                  onChange={(e) => setNewTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: 2026 Metal İmalat Temel İSG Şablonu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Şablon Açıklaması
                </label>
                <input
                  type="text"
                  value={newTemplateForm.description}
                  onChange={(e) => setNewTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Örn: Pres ve talaşlı imalat personeli için özel müfredat"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">Kayıt Kapsamı:</span>
                <div className="space-y-1.5 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="saveTemplateScope"
                      checked={newTemplateForm.scope === 'all'}
                      onChange={() => setNewTemplateForm(prev => ({ ...prev, scope: 'all' }))}
                    />
                    <span>🌐 <strong>Tüm Firmalar İçin Ortak:</strong> Başka bir firmaya geçtiğinizde de hazır listelensin.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="saveTemplateScope"
                      checked={newTemplateForm.scope === 'current'}
                      onChange={() => setNewTemplateForm(prev => ({ ...prev, scope: 'current' }))}
                    />
                    <span>🏢 <strong>Sadece Bu Firmaya Özel:</strong> Yalnızca {company?.name} için görünsün.</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveAsTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Save size={14} />
                <span>Kütüphaneye Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ 5. ŞABLON DÜZENLEME & YENİ KONU EKLEME MODALI */}
      {/* ========================================================================= */}
      {editingTemplateItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <Edit3 size={20} />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Şablonu Düzenle ve Konu Ekle: {editingTemplateItem.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bu şablonun üzerine yeni konular ekleyebilir, süreleri ve kategorileri güncelleyebilirsiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplateItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Yeni Konu Ekleme Satırı */}
            <form onSubmit={handleAddTopicToEditingTemplate} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border space-y-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ➕ Şablona Yeni Konu İlave Et:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    placeholder="Konu başlığı..."
                    value={editingTopicInput.name}
                    onChange={(e) => setEditingTopicInput(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border rounded-lg font-medium"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={editingTopicInput.category}
                    onChange={(e) => setEditingTopicInput(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border rounded-lg"
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
                    value={editingTopicInput.minutes}
                    onChange={(e) => setEditingTopicInput(prev => ({ ...prev, minutes: Number(e.target.value) }))}
                    className="w-12 text-center text-xs font-bold bg-white dark:bg-slate-900 border rounded py-1"
                  />
                  <span className="text-[10px] text-slate-400">dk</span>
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </form>

            {/* Şablon Konuları Listesi */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {(editingTemplateItem.topics || []).map((t, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={t.name || t.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = editingTemplateItem.topics.map((item, i) => i === idx ? { ...item, name: val } : item);
                        const updatedTmpl = { ...editingTemplateItem, topics: updated };
                        updateCustomTemplate(editingTemplateItem.id, updatedTmpl);
                        setEditingTemplateItem(updatedTmpl);
                        refreshLibraryData();
                      }}
                      className="bg-transparent border-0 font-bold text-slate-800 dark:text-slate-100 w-full text-xs p-0 focus:outline-none"
                    />
                    <div className="text-[10px] text-slate-400">{t.category}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="15"
                      value={t.minutes}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = editingTemplateItem.topics.map((item, i) => i === idx ? { ...item, minutes: val } : item);
                        const totalM = updated.reduce((s, it) => s + (Number(it.minutes) || 0), 0);
                        const updatedTmpl = { ...editingTemplateItem, topics: updated, totalMinutes: totalM, totalHours: Number((totalM / 45).toFixed(1)) };
                        updateCustomTemplate(editingTemplateItem.id, updatedTmpl);
                        setEditingTemplateItem(updatedTmpl);
                        refreshLibraryData();
                      }}
                      className="w-12 text-center text-xs font-bold bg-slate-50 dark:bg-slate-800 border rounded px-1 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">dk</span>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingTemplateItem.topics.filter((_, i) => i !== idx);
                        const totalM = updated.reduce((s, it) => s + (Number(it.minutes) || 0), 0);
                        const updatedTmpl = { ...editingTemplateItem, topics: updated, totalMinutes: totalM, totalHours: Number((totalM / 45).toFixed(1)) };
                        updateCustomTemplate(editingTemplateItem.id, updatedTmpl);
                        setEditingTemplateItem(updatedTmpl);
                        refreshLibraryData();
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setEditingTemplateItem(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tamamla ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}
`;

// Insert allModalsJSX right before the closing `</div>\n  );\n}`
content = content.replace(
  /\n\s*<\/div>\s*\n\s*\);\s*\n\}\s*$/m,
  `\n${allModalsJSX}\n    </div>\n  );\n}\n`
);

fs.writeFileSync(hubPath, content, 'utf8');
console.log('>>> Toolbar and All Modals successfully inserted into EducationHubTab!');
