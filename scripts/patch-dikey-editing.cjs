const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyTeamsTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add date input to Toolbar and Banner when isEditable is active
const oldToolbarSettings = `                {/* Tıklayarak Düzenle Modu */}
                <button
                  type="button"
                  onClick={() => setReportSettings({ ...reportSettings, isEditable: !reportSettings.isEditable })}
                  className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 \${
                    reportSettings.isEditable
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }\`}
                >
                  <Edit3 size={12} /> {reportSettings.isEditable ? 'Düzenleme Açık' : 'Düzenle'}
                </button>`;

const newToolbarSettings = `                {/* Hızlı Tarih Düzenleme Inputu */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <Calendar size={13} className="text-rose-400" />
                  <span className="text-[10px] text-slate-400">Tarih:</span>
                  <input
                    type="text"
                    value={reportSettings.protocolDate}
                    onChange={e => setReportSettings({ ...reportSettings, protocolDate: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-white font-bold px-1.5 py-0.5 rounded text-[11px] w-24 text-center outline-none focus:border-rose-500"
                    placeholder="GG.AA.YYYY"
                    title="Tarihi buradan hızlıca değiştirebilir veya doğrudan belge üzerindeki tarihlere tıklayarak da düzenleyebilirsiniz"
                  />
                </div>

                {/* Tıklayarak Düzenle Modu Butonu */}
                <button
                  type="button"
                  onClick={() => setReportSettings({ ...reportSettings, isEditable: !reportSettings.isEditable })}
                  className={\`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm \${
                    reportSettings.isEditable
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }\`}
                >
                  <Edit3 size={13} className={reportSettings.isEditable ? 'text-slate-950' : 'text-amber-400'} />
                  {reportSettings.isEditable ? '✓ Düzenleme Aktif (Metinlere Tıkla)' : 'Metinleri Düzenle'}
                </button>`;

content = content.replace(oldToolbarSettings, newToolbarSettings);

// 2. Add an info banner right above the preview document when isEditable is true
const targetBeforePreview = `            {/* DÖKÜMAN ÖNİZLEME ALANI (A4 ORANLI & İMZA EN ALTA YASLI) */}`;

const newInfoBanner = `            {/* Düzenleme Modu Bilgi ve Hızlı Sıfırlama Şeridi */}
            {reportSettings.isEditable && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <strong>✏️ METİN VE TARİH DÜZENLEME AÇIK:</strong> Belge üzerindeki tüm tarihleri, şirket adını, yetkili isimlerini ve tablo hücrelerini doğrudan üzerlerine tıklayarak serbestçe yazıp düzenleyebilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={() => setReportSettings(prev => ({
                    ...prev,
                    protocolDate: new Date().toLocaleDateString('tr-TR'),
                    employerName: company?.info?.official || 'İşveren / İşveren Vekili',
                    protocolNoticeText: 'İşyerlerinde Acil Durumlar Hakkında Yönetmelik Madde 11 uyarınca; işyerimizde meydana gelebilecek yangın, patlama, deprem ve kaza gibi durumlarda müdahale etmek üzere aşağıda kimlik ve iletişim bilgileri yer alan personeller acil durum ekiplerinde görevlendirilmiş ve kendilerine gerekli tebligat yapılmıştır.'
                  }))}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[11px] font-semibold border border-amber-400/40 transition"
                >
                  ↺ Varsayılan Tarih ve Metne Dön
                </button>
              </div>
            )}

            {/* DÖKÜMAN ÖNİZLEME ALANI (A4 ORANLI & İMZA EN ALTA YASLI) */}`;

content = content.replace(targetBeforePreview, newInfoBanner);

// 3. Make all dates and texts contentEditable with visual feedback in Dikey A4 document
const oldHeaderRight = `                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-400 block mb-1">
                        DİKEY A4 TUTANAK
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 block">
                        Tarih: {reportSettings.protocolDate}
                      </span>
                    </div>`;

const newHeaderRight = `                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-400 block mb-1">
                        DİKEY A4 TUTANAK
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 block">
                        Tarih: <span
                          contentEditable={reportSettings.isEditable}
                          suppressContentEditableWarning
                          className={reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1.5 py-0.5 rounded cursor-text font-black text-rose-700' : ''}
                          title="Tarihi düzenlemek için tıklayınız"
                        >
                          {reportSettings.protocolDate}
                        </span>
                      </span>
                    </div>`;

content = content.replace(oldHeaderRight, newHeaderRight);

// 4. Tebliğ Eden box inside metadata
const oldTebligEdenBox = `                  {/* 2. TEBLİĞ EDEN VE ACİL DURUM YÖNETİCİSİ BİLGİ ŞERİDİ */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 border border-slate-300 rounded text-[10px]">
                    <div>
                      <span className="font-bold text-slate-500 block text-[8.5px] uppercase">TEBLİĞ EDEN (İŞVEREN / İŞVEREN VEKİLİ):</span>
                      <span
                        className="font-extrabold text-slate-900 block"
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        İşveren: {reportSettings.employerName}
                      </span>
                      <span className="text-[8.5px] text-slate-500">
                        Tebliğ Tarihi: {reportSettings.protocolDate}
                      </span>
                    </div>`;

const newTebligEdenBox = `                  {/* 2. TEBLİĞ EDEN VE ACİL DURUM YÖNETİCİSİ BİLGİ ŞERİDİ */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 border border-slate-300 rounded text-[10px]">
                    <div>
                      <span className="font-bold text-slate-500 block text-[8.5px] uppercase">TEBLİĞ EDEN (İŞVEREN / İŞVEREN VEKİLİ):</span>
                      <span
                        className={\`font-extrabold text-slate-900 block \${
                          reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text' : ''
                        }\`}
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                        title="İşveren adını düzenlemek için tıklayınız"
                      >
                        İşveren: {reportSettings.employerName}
                      </span>
                      <span className="text-[8.5px] text-slate-600 block mt-0.5">
                        Tebliğ Tarihi: <span
                          contentEditable={reportSettings.isEditable}
                          suppressContentEditableWarning
                          className={reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text font-bold text-rose-700' : 'font-semibold'}
                          title="Tebliğ tarihini düzenlemek için tıklayınız"
                        >
                          {reportSettings.protocolDate}
                        </span>
                      </span>
                    </div>`;

content = content.replace(oldTebligEdenBox, newTebligEdenBox);

// 5. Manager box inside metadata
const oldManagerBox = `                    <div>
                      <span className="font-bold text-slate-500 block text-[8.5px] uppercase">İŞYERİ ACİL DURUM YÖNETİCİSİ:</span>
                      <span
                        className="font-extrabold text-indigo-900 block"
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        {emergencyManager?.name ? \`\${emergencyManager.name} (\${emergencyManager.phone || 'Tel Yok'})\` : 'İşveren Tarafından Koordine Edilmektedir'}
                      </span>
                      <span className="text-[8.5px] text-slate-500">
                        {emergencyManager?.title || 'Acil Durum Yönetim Koordinatörü'}
                      </span>
                    </div>`;

const newManagerBox = `                    <div>
                      <span className="font-bold text-slate-500 block text-[8.5px] uppercase">İŞYERİ ACİL DURUM YÖNETİCİSİ:</span>
                      <span
                        className={\`font-extrabold text-indigo-900 block \${
                          reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text' : ''
                        }\`}
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                        title="Yönetici adını düzenlemek için tıklayınız"
                      >
                        {emergencyManager?.name ? \`\${emergencyManager.name} (\${emergencyManager.phone || 'Tel Yok'})\` : 'İşveren Tarafından Koordine Edilmektedir'}
                      </span>
                      <span
                        className={\`text-[8.5px] text-slate-500 block \${
                          reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text' : ''
                        }\`}
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                        title="Yönetici ünvanını düzenlemek için tıklayınız"
                      >
                        {emergencyManager?.title || 'Acil Durum Yönetim Koordinatörü'}
                      </span>
                    </div>`;

content = content.replace(oldManagerBox, newManagerBox);

// 6. Table cells contentEditable for each member
const oldMemberRows = `                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-1 font-bold text-center border-r border-slate-400">{seqNum}</td>
                            <td className="p-1 font-bold border-r border-slate-400">{m.name} {m.surname}</td>
                            <td className="p-1 font-mono text-center border-r border-slate-400">{m.tcNo || '-'}</td>
                            {reportSettings.showPhones && (
                              <td className="p-1 font-mono text-center border-r border-slate-400">{m.phone || '-'}</td>
                            )}
                            <td className="p-1 border-r border-slate-400">{m.jobTitle || 'Personel'}</td>
                            <td className="p-1 font-bold border-r border-slate-400">{teamObj?.title || m.teamId}</td>
                            <td className="p-1 text-center font-medium border-r border-slate-400">{m.role || 'Ekip Üyesi'}</td>`;

const newMemberRows = `                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-1 font-bold text-center border-r border-slate-400">{seqNum}</td>
                            <td 
                              className={\`p-1 font-bold border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={reportSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.name} {m.surname}
                            </td>
                            <td 
                              className={\`p-1 font-mono text-center border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={reportSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.tcNo || '-'}
                            </td>
                            {reportSettings.showPhones && (
                              <td 
                                className={\`p-1 font-mono text-center border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                                contentEditable={reportSettings.isEditable}
                                suppressContentEditableWarning
                              >
                                {m.phone || '-'}
                              </td>
                            )}
                            <td 
                              className={\`p-1 border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={reportSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.jobTitle || 'Personel'}
                            </td>
                            <td 
                              className={\`p-1 font-bold border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={reportSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {teamObj?.title || m.teamId}
                            </td>
                            <td 
                              className={\`p-1 text-center font-medium border-r border-slate-400 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400/70 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={reportSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.role || 'Ekip Üyesi'}
                            </td>`;

content = content.replace(oldMemberRows, newMemberRows);

// 7. Bottom signatures date and names contentEditable
const oldBottomSignatures = `                    {/* Düzenleyen: İş Güvenliği Uzmanı */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-800">DÜZENLEYEN</p>
                      <p className="text-[9px] text-slate-500 font-semibold">İş Güvenliği Uzmanı</p>
                      <p className="font-bold text-slate-900 mt-1">{currentUser?.name || 'İSG Uzmanı'}</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza</p>
                    </div>

                    {/* Tebliğ Eden: İşveren / İşveren Vekili */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-900">TEBLİĞ EDEN</p>
                      <p className="text-[9px] text-slate-600 font-bold">İşveren / İşveren Vekili</p>
                      <p className="font-extrabold text-slate-900 mt-1">{reportSettings.employerName}</p>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">Tarih: {reportSettings.protocolDate}</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza / Kaşe</p>
                    </div>`;

const newBottomSignatures = `                    {/* Düzenleyen: İş Güvenliği Uzmanı */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-800">DÜZENLEYEN</p>
                      <p className="text-[9px] text-slate-500 font-semibold">İş Güvenliği Uzmanı</p>
                      <p 
                        className={\`font-bold text-slate-900 mt-1 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                        title="İSG Uzmanı adını düzenlemek için tıklayınız"
                      >
                        {currentUser?.name || 'İSG Uzmanı'}
                      </p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza</p>
                    </div>

                    {/* Tebliğ Eden: İşveren / İşveren Vekili */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-900">TEBLİĞ EDEN</p>
                      <p className="text-[9px] text-slate-600 font-bold">İşveren / İşveren Vekili</p>
                      <p 
                        className={\`font-extrabold text-slate-900 mt-1 \${reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={reportSettings.isEditable}
                        suppressContentEditableWarning
                        title="İşveren yetkilisini düzenlemek için tıklayınız"
                      >
                        {reportSettings.employerName}
                      </p>
                      <p className="text-[8.5px] text-slate-600 font-mono mt-0.5">
                        Tarih: <span
                          contentEditable={reportSettings.isEditable}
                          suppressContentEditableWarning
                          className={reportSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text font-bold text-rose-700' : 'font-bold'}
                          title="Tebliğ tarihini düzenlemek için tıklayınız"
                        >
                          {reportSettings.protocolDate}
                        </span>
                      </p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza / Kaşe</p>
                    </div>`;

content = content.replace(oldBottomSignatures, newBottomSignatures);

// 8. In handlePrintPortraitA4 clean editable outline artifacts before printing
content = content.replace(
  `        <div class="dikey-a4-page">
          \${printableElement.innerHTML}
        </div>`,
  `        <div class="dikey-a4-page">
          \${printableElement.innerHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"').replace(/outline-dashed/gi, '').replace(/bg-amber-50/gi, '')}
        </div>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('EmergencyTeamsTab.jsx successfully patched with complete interactive text & date editing in Dikey A4!');
