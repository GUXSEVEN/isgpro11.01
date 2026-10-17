const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/IsgEducationTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add formatDateTR helper if not present
if (!content.includes('export const formatDateTR =')) {
  const formatDateCode = `export const formatDateTR = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return \`\${day}/\${month}/\${year}\`;
    }
  } catch (e) {}
  return String(dateStr);
};

`;
  const insertMarker = 'export const formatDurationDetails =';
  content = content.replace(insertMarker, formatDateCode + insertMarker);
  console.log("✓ Added formatDateTR helper");
}

// 2. Add trainingType and certificateIssueDate states in IsgEducationTab
const stateHookMarker = "const [validityYears, setValidityYears] = useState(defaults.validityYears);";
if (!content.includes("const [trainingType, setTrainingType]")) {
  const newStates = `const [validityYears, setValidityYears] = useState(defaults.validityYears);
  const [trainingType, setTrainingType] = useState('initial'); // 'initial' (İlk defa verilen) | 'renewal' (Tekrar verilen)
  const [certificateIssueDate, setCertificateIssueDate] = useState(() => new Date().toISOString().split('T')[0]);`;
  content = content.replace(stateHookMarker, newStates);
  console.log("✓ Added trainingType and certificateIssueDate states");
}

// 3. Update handleStartEditRecord to load trainingType and certificateIssueDate
const editLoadMarker = "setValidityYears(rec.validityYears || defaults.validityYears);";
if (!content.includes("setTrainingType(rec.trainingType")) {
  content = content.replace(editLoadMarker, `${editLoadMarker}
    setTrainingType(rec.trainingType || 'initial');
    setCertificateIssueDate(rec.certificateIssueDate || rec.date || new Date().toISOString().split('T')[0]);`);
  console.log("✓ Updated handleStartEditRecord with trainingType & certificateIssueDate");
}

// 4. Update handleSaveEducation to include trainingType and certificateIssueDate in updatedRecord and newRecord
content = content.replace(
  "validityYears: Number(validityYears),",
  "validityYears: Number(validityYears),\n        trainingType,\n        certificateIssueDate: certificateIssueDate || educationDate,"
);
content = content.replace(
  "validityYears: Number(validityYears),",
  "validityYears: Number(validityYears),\n      trainingType,\n      certificateIssueDate: certificateIssueDate || educationDate,"
);
console.log("✓ Updated handleSaveEducation with trainingType & certificateIssueDate");

// 5. In form, add Training Type & Certificate Issue Date inputs
const formParamsMarker = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">`;
const newFormParams = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Eğitim Türü</label>
                <select
                  value={trainingType}
                  onChange={e => setTrainingType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="initial">İlk Defa Verilen Temel Eğitim</option>
                  <option value="renewal">Tekrar Verilen Temel Eğitim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Belge Düzenlenme Tarihi</label>
                <input
                  type="date"
                  value={certificateIssueDate}
                  onChange={e => setCertificateIssueDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>`;

if (!content.includes('value={trainingType}')) {
  content = content.replace(formParamsMarker, newFormParams);
  console.log("✓ Added Training Type & Certificate Issue Date inputs to form");
}

// 6. REVISE SAYFA 1: YATAY TEMEL İSG EĞİTİM BELGESİ (ÖN YÜZ)
const oldPage1Start = `{/* ========================================================================= */}
                      {/* SAYFA 1: YATAY TEMEL İSG EĞİTİM BELGESİ */}`;

const oldPage1End = `{/* ========================================================================= */}
                      {/* SAYFA 2: YATAY SERTİFİKA 2. SAYFASI - KONULAR VE SÜRELER DÖKÜMÜ`;

const p1StartIdx = content.indexOf(oldPage1Start);
const p1EndIdx = content.indexOf(oldPage1End);

if (p1StartIdx === -1 || p1EndIdx === -1) {
  console.error("Could not find Page 1 boundaries in IsgEducationTab.jsx! (start:", p1StartIdx, "end:", p1EndIdx, ")");
  process.exit(1);
}

const revisedPage1Code = [
  '{/* ========================================================================= */}',
  '                      {/* SAYFA 1: YATAY TEMEL İSG EĞİTİM BELGESİ (ÖN YÜZ - YÖNETMELİK FORMATI) */}',
  '                      {/* ========================================================================= */}',
  '                      <div',
  '                        style={{ padding: reportPadding }}',
  '                        className="print-page-wrapper bg-white text-slate-900 rounded-2xl border-4 border-slate-800 text-xs leading-relaxed shadow-xl min-h-[580px] flex flex-col justify-between"',
  '                      >',
  '                        <div className="print-page-sheet flex flex-col justify-between h-full space-y-3">',
  '                          ',
  '                          {/* Üst Bant: Bakanlık Uyarısı & (ÖN YÜZ) */}',
  '                          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">',
  '                            <span>T.C. ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI MEVZUATINA UYGUN</span>',
  '                            <span className="px-3 py-0.5 bg-slate-100 border border-slate-400 rounded-md font-black text-slate-900 tracking-widest text-[11px]">',
  '                              (ÖN YÜZ)',
  '                            </span>',
  '                          </div>',
  '',
  '                          {/* Başlık */}',
  '                          <div className="text-center py-1">',
  '                            <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-wider">',
  '                              TEMEL EĞİTİM BELGESİ',
  '                            </h1>',
  '                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mt-0.5">',
  '                              Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik Kapsamında',
  '                            </p>',
  '                          </div>',
  '',
  '                          {/* Metin Gövdesi (İşbu belge... adına...) */}',
  '                          <div className="p-3.5 bg-slate-50/90 border border-slate-300 rounded-xl leading-relaxed text-slate-800 space-y-1">',
  '                            <p className="text-xs font-semibold text-slate-600">İşbu belge,</p>',
  '                            <div className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">',
  '                              {participant.name}',
  '                            </div>',
  '                            <div className="text-xs text-slate-700 font-medium">',
  '                              ({participant.title || \'Çalışan\'}{participant.tcNo ? `, T.C. Kimlik No: ${participant.tcNo}` : \'\'}) adına',
  '                            </div>',
  '                            <p className="text-[11px] text-slate-700 pt-1">',
  '                              <strong>Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik</strong> kapsamında ',
  '                              işyerinde görevli iş güvenliği uzmanı ve işyeri hekimi <em>(Eğitimi veren kişi/kurum/kuruluş)</em> tarafından <strong>{formatDateTR(activeRecordForPrint.date)}</strong> tarihinde gerçekleştirilen temel eğitim sonunda düzenlenmiştir.',
  '                            </p>',
  '                          </div>',
  '',
  '                          {/* Belge ve Eğitim Bilgileri Kutucukları (2 Kolon) */}',
  '                          <div className="grid grid-cols-2 gap-3 text-[11px]">',
  '                            {/* Sol Kolon: Tarihler, Süre ve İşyeri */}',
  '                            <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2 shadow-2xs">',
  '                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">',
  '                                <span className="text-slate-600 font-medium">Belge düzenlenme tarihi:</span>',
  '                                <strong className="text-slate-900 font-bold">{formatDateTR(activeRecordForPrint.certificateIssueDate || activeRecordForPrint.date)}</strong>',
  '                              </div>',
  '                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">',
  '                                <span className="text-slate-600 font-medium">Eğitimin süresi:</span>',
  '                                <strong className="text-amber-900 font-black">',
  '                                  {totalDurInfo.timeStr} ({totalDurInfo.lessonsFormatted} Ders Saati)',
  '                                </strong>',
  '                              </div>',
  '                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">',
  '                                <span className="text-slate-600 font-medium">Çalışanın işyerinin unvanı:</span>',
  '                                <strong className="text-slate-900 truncate max-w-[220px]" title={company?.name}>{company?.name}</strong>',
  '                              </div>',
  '                              <div className="flex justify-between items-center">',
  '                                <span className="text-slate-600 font-medium">İşyeri SGK Sicil No:</span>',
  '                                <strong className="text-slate-900 font-mono text-[10.5px]">{company?.info?.sgkNo || \'-\'}</strong>',
  '                              </div>',
  '                            </div>',
  '',
  '                            {/* Sağ Kolon: Eğitimin Türü & Eğitimin Şekli (Checkboxes) */}',
  '                            <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2 shadow-2xs">',
  '                              <div className="border-b border-slate-100 pb-1.5">',
  '                                <span className="text-slate-600 font-medium block text-[10.5px]">Eğitimin türü:</span>',
  '                                <div className="flex items-center gap-4 mt-0.5 pl-1">',
  '                                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">',
  '                                    <span className="text-base font-black leading-none">{activeRecordForPrint.trainingType === \'renewal\' ? \'☐\' : \'☒\'}</span>',
  '                                    <span className={activeRecordForPrint.trainingType !== \'renewal\' ? \'text-slate-950 font-black\' : \'text-slate-500 font-normal\'}>',
  '                                      İlk defa verilen temel eğitim',
  '                                    </span>',
  '                                  </span>',
  '                                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">',
  '                                    <span className="text-base font-black leading-none">{activeRecordForPrint.trainingType === \'renewal\' ? \'☒\' : \'☐\'}</span>',
  '                                    <span className={activeRecordForPrint.trainingType === \'renewal\' ? \'text-slate-950 font-black\' : \'text-slate-500 font-normal\'}>',
  '                                      Tekrar verilen temel eğitim',
  '                                    </span>',
  '                                  </span>',
  '                                </div>',
  '                              </div>',
  '',
  '                              <div>',
  '                                <span className="text-slate-600 font-medium block text-[10.5px]">Eğitimin şekli:</span>',
  '                                <div className="space-y-1 mt-0.5 pl-1 text-[10.5px]">',
  '                                  <div className="flex items-center gap-1.5">',
  '                                    <span className="text-base font-black text-slate-900 leading-none">{activeRecordForPrint.isRemoteEducation ? \'☒\' : \'☐\'}</span>',
  '                                    <span className={activeRecordForPrint.isRemoteEducation ? \'font-bold text-slate-900\' : \'text-slate-600\'}>',
  '                                      Uzaktan {activeRecordForPrint.isRemoteEducation ? `(Başlık: ${activeRecordForPrint.remoteEducationDetails || \'Genel LMS İSG Modülleri\'})` : \'(Başlık: ............................)\'}',
  '                                    </span>',
  '                                  </div>',
  '                                  <div className="flex items-center gap-1.5">',
  '                                    <span className="text-base font-black text-slate-900 leading-none">☒</span>',
  '                                    <span className="font-bold text-slate-900">',
  '                                      Yüz yüze (Başlık: İşe ve İş Yerine Özgü Riskler, Uygulamalı İSG Eğitimi)',
  '                                    </span>',
  '                                  </div>',
  '                                </div>',
  '                              </div>',
  '                            </div>',
  '                          </div>',
  '',
  '                          {/* İMZA ALANLARI (ALT KISIMDA KUTUCUK ŞEKLİNDE) */}',
  '                          <div className="space-y-1.5 pt-1">',
  '                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">',
  '                              YETKİLİ VE EĞİTİCİ İMZA / ONAY ALANLARI',
  '                            </div>',
  '                            <div className="grid grid-cols-3 gap-3">',
  '                              {/* Kutu 1: Eğitici İş Güvenliği Uzmanı */}',
  '                              <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 flex flex-col justify-between min-h-[110px] text-center shadow-xs">',
  '                                <div className="border-b border-slate-200 pb-1">',
  '                                  <div className="text-[9.5px] font-bold text-slate-500 uppercase">Eğiticilerin Adı Soyadı ve Unvanı</div>',
  '                                  <div className="font-black text-slate-950 text-xs mt-0.5">{activeRecordForPrint.iguName}</div>',
  '                                  <div className="text-[9.5px] text-slate-600 font-medium">İş Güvenliği Uzmanı {activeRecordForPrint.iguCertNo ? `(${activeRecordForPrint.iguCertNo})` : \'\'}</div>',
  '                                </div>',
  '                                <div className="pt-2 pb-0.5 flex flex-col items-center justify-end">',
  '                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Eğiticilerin İmzası</div>',
  '                                  <div className="w-28 border-b-2 border-dashed border-slate-400 mt-2"></div>',
  '                                </div>',
  '                              </div>',
  '',
  '                              {/* Kutu 2: Eğitici İşyeri Hekimi */}',
  '                              <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 flex flex-col justify-between min-h-[110px] text-center shadow-xs">',
  '                                <div className="border-b border-slate-200 pb-1">',
  '                                  <div className="text-[9.5px] font-bold text-slate-500 uppercase">Eğiticilerin Adı Soyadı ve Unvanı</div>',
  '                                  <div className="font-black text-slate-950 text-xs mt-0.5">{activeRecordForPrint.iyhName || \'-\'}</div>',
  '                                  <div className="text-[9.5px] text-slate-600 font-medium">İşyeri Hekimi {activeRecordForPrint.iyhCertNo ? `(${activeRecordForPrint.iyhCertNo})` : \'\'}</div>',
  '                                </div>',
  '                                <div className="pt-2 pb-0.5 flex flex-col items-center justify-end">',
  '                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Eğiticilerin İmzası</div>',
  '                                  <div className="w-28 border-b-2 border-dashed border-slate-400 mt-2"></div>',
  '                                </div>',
  '                              </div>',
  '',
  '                              {/* Kutu 3: İşveren / İşveren Vekili */}',
  '                              <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 flex flex-col justify-between min-h-[110px] text-center shadow-xs">',
  '                                <div className="border-b border-slate-200 pb-1">',
  '                                  <div className="text-[9.5px] font-bold text-slate-500 uppercase">İşverenin / İşveren Vekilinin Adı Soyadı</div>',
  '                                  <div className="font-black text-slate-950 text-xs mt-0.5">{activeRecordForPrint.employerName}</div>',
  '                                  <div className="text-[9.5px] text-slate-600 font-medium truncate">{activeRecordForPrint.employerTitle || \'İşveren Yetkilisi\'}</div>',
  '                                </div>',
  '                                <div className="pt-2 pb-0.5 flex flex-col items-center justify-end">',
  '                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">İşveren / İşveren Vekili İmzası & Kaşe</div>',
  '                                  <div className="w-28 border-b-2 border-dashed border-slate-400 mt-2"></div>',
  '                                </div>',
  '                              </div>',
  '                            </div>',
  '                          </div>',
  '',
  '                          {/* Dipnot / Sayfa İndikatörü */}',
  '                          <div className="text-[9px] text-slate-400 text-center pt-1.5 border-t border-slate-200 flex items-center justify-between">',
  '                            <span>Belge Sıra No: ISG-EDU-{activeRecordForPrint.id.replace(\'edu-\', \'\')}-{index + 1}</span>',
  '                            <span>* 45 dk ders + 15 dk mola standardı uygulanmıştır. Yönetmelik Ek-1 Konu ve Süreleri arka yüzde (Sayfa 2) yer almaktadır.</span>',
  '                            <span className="font-bold text-slate-600">Sayfa 1 / 2 (Ön Yüz)</span>',
  '                          </div>',
  '                        </div>',
  '                      </div>',
  '',
  '                      '
].join('\n');

content = content.substring(0, p1StartIdx) + revisedPage1Code + content.substring(p1EndIdx);
console.log("✓ Replaced Page 1 with revised official regulatory template & boxed signatures");

fs.writeFileSync(targetFile, content, 'utf8');
console.log("✓ IsgEducationTab.jsx successfully written!");
