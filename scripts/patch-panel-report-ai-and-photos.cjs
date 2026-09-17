const fs = require('fs');
const path = require('path');

const appJsxPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
const accidentTabPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/tabs/AccidentManagementTab.jsx';
const kkdTabPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/tabs/KKDRiskMatrixTab.jsx';
const mobileAuditTabPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/tabs/MobileAuditTab.jsx';

console.log('--- 1. CLEANING AI PHRASES IN ACCIDENT & KKD TABS ---');
if (fs.existsSync(accidentTabPath)) {
  let accContent = fs.readFileSync(accidentTabPath, 'utf8');
  accContent = accContent.replace(
    'Yapay Zeka Destekli Kaza Bildirimi, Kök Neden Analizi',
    'Kaza Bildirimi, Kök Neden Analizi'
  );
  fs.writeFileSync(accidentTabPath, accContent, 'utf8');
  console.log('  -> AccidentManagementTab.jsx updated');
}

if (fs.existsSync(kkdTabPath)) {
  let kkdContent = fs.readFileSync(kkdTabPath, 'utf8');
  kkdContent = kkdContent.replace(
    'Bölüm Bazlı Manuel & AI Destekli Donanım Eşleştirme Matrisi',
    'Bölüm Bazlı Donanım Eşleştirme Matrisi'
  );
  fs.writeFileSync(kkdTabPath, kkdContent, 'utf8');
  console.log('  -> KKDRiskMatrixTab.jsx updated');
}

console.log('--- 2. CLEANING AI PHRASES IN APP.JSX ---');
let appContent = fs.readFileSync(appJsxPath, 'utf8');

// Emergency report procedures heading
appContent = appContent.replace(
  `{pageDef.showInfo ? '4. Detaylı Acil Durum Prosedürleri (Yapay Zeka Destekli)' : 'Detaylı Acil Durum Prosedürleri (Yapay Zeka Destekli) - Devam'}`,
  `{pageDef.showInfo ? '4. Detaylı Acil Durum Prosedürleri' : 'Detaylı Acil Durum Prosedürleri - Devam'}`
);

// Emergency step 3 label & placeholders
appContent = appContent.replace(
  `<label className="block text-sm font-medium text-gray-700">Yapay Zeka Destekli Detaylı Acil Durum Prosedürleri</label>`,
  `<label className="block text-sm font-medium text-gray-700">Detaylı Acil Durum Prosedürleri</label>`
);

appContent = appContent.replace(
  `placeholder="Seçilen acil durumlara göre detaylı prosedürler yapay zeka tarafından bu alana yazılacaktır."`,
  `placeholder="Seçilen acil durumlara göre detaylı prosedürler bu alana yazılacaktır."`
);

appContent = appContent.replace(
  `Seçtiğiniz durumlarla ilgili yapay zeka ile otomatik acil durum prosedürü hazırlayabilirsiniz.`,
  `Seçtiğiniz durumlarla ilgili otomatik acil durum prosedürü hazırlayabilirsiniz.`
);

appContent = appContent.replace(
  `title="Bu acil durum için yapay zeka ile detaylı prosedür şablonu oluştur"`,
  `title="Bu acil durum için detaylı prosedür şablonu oluştur"`
);

// A4 button in report preview
appContent = appContent.replace(
  `<span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Yapay Zeka Destekli A4'e Sığdır</span>`,
  `<span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Akıllı A4'e Sığdır</span>`
);

appContent = appContent.replace(
  `Yapay Zeka Rapor Denetimi`,
  `Rapor Denetimi`
);

appContent = appContent.replace(
  `<p><strong>Sistem:</strong> İSG Pro Yapay Zeka Destekli Portalı</p>`,
  `<p><strong>Sistem:</strong> İSG Pro Profesyonel İSG Portalı</p>`
);

console.log('  -> AI phrases cleaned in App.jsx');

console.log('--- 3. ADDING ReportPhotoCell TO APP.JSX ---');
const reportPhotoCellCode = `
// ==========================================================================================
// CANLI RAPOR FOTOĞRAF HÜCRESİ (MANUEL BOYUTLANDIRMA & HÜCREYE SIĞDIRMA / DOLDURMA KONTROLLERİ)
// ==========================================================================================
function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = ''
}) {
  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;

  if (!src) {
    return <span className="text-gray-400 italic text-center text-[6px]">-</span>;
  }

  const handleAdjustHeight = (delta, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const newHeight = Math.max(30, Math.min(300, currentHeight + delta));
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, { ...custom, height: newHeight });
    }
  };

  const handleToggleFit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'fill' : 'contain';
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, { ...custom, fit: nextFit });
    }
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextRotate = (currentRotate + 90) % 360;
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, { ...custom, rotate: nextRotate });
    }
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, null);
    }
  };

  return (
    <div
      className={\`report-photo-cell-container group relative mx-auto overflow-hidden rounded bg-slate-50 border border-slate-200 transition-all \${className}\`}
      style={{
        height: \`\${currentHeight}px\`,
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2px'
      }}
    >
      <img
        src={src}
        alt={label}
        style={{
          width: '100%',
          height: '100%',
          objectFit: currentFit,
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          display: 'block'
        }}
      />

      {/* CANLI DÜZENLEME ARAÇ ÇUBUĞU (Yazdırma ve PDF çıktılarında no-print ile gizlenir) */}
      <div
        className="no-print absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white rounded p-1 shadow-lg flex items-center gap-1 text-[9px] select-none"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => handleAdjustHeight(-10, e)}
          className="w-4 h-4 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
          title="Fotoğrafı Küçült (-10px)"
        >
          -
        </button>

        <span className="font-mono text-[8px] px-0.5 text-amber-300 font-bold" title="Mevcut Yükseklik">
          {currentHeight}px
        </span>

        <button
          type="button"
          onClick={(e) => handleAdjustHeight(10, e)}
          className="w-4 h-4 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
          title="Fotoğrafı Büyüt (+10px)"
        >
          +
        </button>

        <div className="w-px h-3 bg-slate-600 mx-0.5"></div>

        <button
          type="button"
          onClick={handleToggleFit}
          className="px-1 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-[8px] text-white transition-colors cursor-pointer"
          title={\`Sığdırma Modu: \${currentFit === 'contain' ? 'Sığdır (contain)' : currentFit === 'cover' ? 'Doldur (cover)' : 'Tam (fill)'}\`}
        >
          {currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam'}
        </button>

        <button
          type="button"
          onClick={handleRotate}
          className="w-4 h-4 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
          title="90° Döndür"
        >
          ↻
        </button>

        {(custom.height !== undefined || custom.fit !== undefined || custom.rotate !== undefined) && (
          <button
            type="button"
            onClick={handleReset}
            className="w-4 h-4 rounded bg-rose-700 hover:bg-rose-600 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
            title="Sıfırla"
          >
            ×
          </button>
        )}
      </div>

      {/* Alt Bilgi Rozeti (Hover Anında) */}
      <div className="no-print absolute bottom-0.5 left-1 z-10 opacity-0 group-hover:opacity-85 transition-opacity text-[7px] text-slate-700 bg-white/95 px-1 rounded shadow-xs pointer-events-none font-mono">
        {currentFit} • {currentHeight}px {currentRotate ? \`• \${currentRotate}°\` : ''}
      </div>
    </div>
  );
}
`;

// Insert ReportPhotoCell before WebReportEditor
const targetBeforeWebReportEditor = 'const WebReportEditor = ({';
if (appContent.includes(targetBeforeWebReportEditor)) {
  appContent = appContent.replace(targetBeforeWebReportEditor, reportPhotoCellCode + '\n' + targetBeforeWebReportEditor);
  console.log('  -> ReportPhotoCell inserted before WebReportEditor');
} else {
  console.error('  -> Could not locate targetBeforeWebReportEditor');
}

console.log('--- 4. UPDATING WebReportEditor TO USE ReportPhotoCell ---');
// Update WebReportEditor props
appContent = appContent.replace(
  `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 5
}) => {`,
  `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 5,
  photoHeight = 45,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle
}) => {`
);

// Replace beforePhoto in WebReportEditor
const oldWebBeforePhoto = `{r.beforePhoto ? <img src={r.beforePhoto} className="h-10 w-auto mx-auto border object-contain" /> : <span className="text-gray-400 italic text-center text-[6px]">-</span>}`;
const newWebBeforePhoto = `{r.beforePhoto ? (
                                <ReportPhotoCell
                                  src={r.beforePhoto}
                                  photoKey={\`web-before-\${r.id || itemNumber}\`}
                                  defaultHeight={photoHeight || 45}
                                  defaultFit={photoFit || 'contain'}
                                  customStyles={photoCustomStyles}
                                  onUpdateCustomStyle={onUpdatePhotoStyle}
                                  label="Tehlike Öncesi"
                                />
                              ) : <span className="text-gray-400 italic text-center text-[6px]">-</span>}`;

if (appContent.includes(oldWebBeforePhoto)) {
  appContent = appContent.replace(oldWebBeforePhoto, newWebBeforePhoto);
  console.log('  -> WebReportEditor beforePhoto updated with ReportPhotoCell');
} else {
  console.warn('  -> Could not match oldWebBeforePhoto directly');
}

// Replace afterPhoto in WebReportEditor
const oldWebAfterPhoto = `{r.afterPhoto ? <img src={r.afterPhoto} className="h-10 w-auto mx-auto border object-contain" /> : <span className="text-gray-400 italic text-center text-[6px]">-</span>}`;
const newWebAfterPhoto = `{r.afterPhoto ? (
                                <ReportPhotoCell
                                  src={r.afterPhoto}
                                  photoKey={\`web-after-\${r.id || itemNumber}\`}
                                  defaultHeight={photoHeight || 45}
                                  defaultFit={photoFit || 'contain'}
                                  customStyles={photoCustomStyles}
                                  onUpdateCustomStyle={onUpdatePhotoStyle}
                                  label="DÖF Sonrası"
                                />
                              ) : <span className="text-gray-400 italic text-center text-[6px]">-</span>}`;

if (appContent.includes(oldWebAfterPhoto)) {
  appContent = appContent.replace(oldWebAfterPhoto, newWebAfterPhoto);
  console.log('  -> WebReportEditor afterPhoto updated with ReportPhotoCell');
} else {
  console.warn('  -> Could not match oldWebAfterPhoto directly');
}

console.log('--- 5. UPDATING SahaZiyaretEditor TO USE ReportPhotoCell ---');
// Update SahaZiyaretEditor props
appContent = appContent.replace(
  `const SahaZiyaretEditor = ({ company, assessment, reportFontSize = '8pt', itemsPerPage = 5, removeEmpty = false }) => {`,
  `const SahaZiyaretEditor = ({ company, assessment, reportFontSize = '8pt', itemsPerPage = 5, removeEmpty = false, photoHeight = 80, photoFit = 'contain', photoCustomStyles = {}, onUpdatePhotoStyle }) => {`
);

// Replace beforePhoto in SahaZiyaretEditor
const oldSahaBeforePhoto = `{risk.beforePhoto && <img src={risk.beforePhoto} className="saha-img" />}`;
const newSahaBeforePhoto = `{risk.beforePhoto && (
                          <ReportPhotoCell
                            src={risk.beforePhoto}
                            photoKey={\`saha-before-\${risk.id || index}\`}
                            defaultHeight={photoHeight || 80}
                            defaultFit={photoFit || 'contain'}
                            customStyles={photoCustomStyles}
                            onUpdateCustomStyle={onUpdatePhotoStyle}
                            label="Tehlike Öncesi"
                          />
                        )}`;

if (appContent.includes(oldSahaBeforePhoto)) {
  appContent = appContent.replace(oldSahaBeforePhoto, newSahaBeforePhoto);
  console.log('  -> SahaZiyaretEditor beforePhoto updated with ReportPhotoCell');
} else {
  console.warn('  -> Could not match oldSahaBeforePhoto directly');
}

// Replace afterPhoto in SahaZiyaretEditor
const oldSahaAfterPhoto = `{risk.afterPhoto && <img src={risk.afterPhoto} className="saha-img" />}`;
const newSahaAfterPhoto = `{risk.afterPhoto && (
                          <ReportPhotoCell
                            src={risk.afterPhoto}
                            photoKey={\`saha-after-\${risk.id || index}\`}
                            defaultHeight={photoHeight || 80}
                            defaultFit={photoFit || 'contain'}
                            customStyles={photoCustomStyles}
                            onUpdateCustomStyle={onUpdatePhotoStyle}
                            label="DÖF Sonrası"
                          />
                        )}`;

if (appContent.includes(oldSahaAfterPhoto)) {
  appContent = appContent.replace(oldSahaAfterPhoto, newSahaAfterPhoto);
  console.log('  -> SahaZiyaretEditor afterPhoto updated with ReportPhotoCell');
} else {
  console.warn('  -> Could not match oldSahaAfterPhoto directly');
}

console.log('--- 6. ADDING PHOTO CONTROLS TO AdvancedReportModal ---');
// Add photoHeight, photoFit, photoCustomStyles state to AdvancedReportModal
const targetAdvModalState = `  const [previewZoom, setPreviewZoom] = useState(1.0);`;
const newAdvModalState = `  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [photoHeight, setPhotoHeight] = useState(80);
  const [photoFit, setPhotoFit] = useState('contain');
  const [photoCustomStyles, setPhotoCustomStyles] = useState({});

  const handleUpdatePhotoStyle = (photoKey, updates) => {
    setPhotoCustomStyles(prev => {
      if (!updates) {
        const next = { ...prev };
        delete next[photoKey];
        return next;
      }
      return {
        ...prev,
        [photoKey]: { ...(prev[photoKey] || {}), ...updates }
      };
    });
  };`;

if (appContent.includes(targetAdvModalState)) {
  appContent = appContent.replace(targetAdvModalState, newAdvModalState);
  console.log('  -> Photo states added to AdvancedReportModal');
} else {
  console.error('  -> Could not locate targetAdvModalState');
}

// Pass photo props to SahaZiyaretEditor & WebReportEditor
const oldSahaCall = `<SahaZiyaretEditor company={company} assessment={assessmentData} reportFontSize={reportFontSize} itemsPerPage={itemsPerPage} removeEmpty={removeEmpty} />`;
const newSahaCall = `<SahaZiyaretEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                itemsPerPage={itemsPerPage}
                removeEmpty={removeEmpty}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
              />`;

if (appContent.includes(oldSahaCall)) {
  appContent = appContent.replace(oldSahaCall, newSahaCall);
  console.log('  -> SahaZiyaretEditor call updated with photo props');
} else {
  console.warn('  -> Could not match oldSahaCall directly');
}

const oldWebCall = `<WebReportEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
              />`;

const newWebCall = `<WebReportEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                photoHeight={photoHeight === 80 ? 45 : photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
              />`;

if (appContent.includes(oldWebCall)) {
  appContent = appContent.replace(oldWebCall, newWebCall);
  console.log('  -> WebReportEditor call updated with photo props');
} else {
  console.warn('  -> Could not match oldWebCall directly');
}

// Add Photo Toolbar controls in AdvancedReportModal top bar
const targetZoomBar = `{(reportType === 'ziyaret' || reportType === 'web') && (
            <>
              <div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="font-bold text-slate-300">Sayfa Başına Madde:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-700 text-white font-bold px-2 py-1 rounded border border-slate-600 outline-none cursor-pointer"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </>
          )}`;

const newZoomBar = `{(reportType === 'ziyaret' || reportType === 'web') && (
            <>
              <div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="font-bold text-slate-300">Sayfa Başı:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-700 text-white font-bold px-2 py-1 rounded border border-slate-600 outline-none cursor-pointer text-xs"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>
              
              {/* FOTOĞRAF BOYUTU VE HÜCREYE SIĞDIRMA KONTROLLERİ */}
              <div className="flex items-center gap-1.5 text-xs text-white bg-slate-700/60 px-2 py-1 rounded-lg border border-slate-600/60">
                <span className="font-bold text-amber-300">Foto Boyut:</span>
                <button
                  type="button"
                  onClick={() => setPhotoHeight(h => Math.max(30, h - 10))}
                  className="bg-slate-700 hover:bg-slate-600 text-white w-5 h-5 rounded font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                  title="Tüm fotoğrafları küçült (-10px)"
                >
                  -
                </button>
                <select
                  value={photoHeight}
                  onChange={(e) => setPhotoHeight(Number(e.target.value))}
                  className="bg-slate-800 text-white font-bold px-1.5 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
                >
                  <option value={40}>40px (Kompakt)</option>
                  <option value={55}>55px (Küçük)</option>
                  <option value={70}>70px (Orta)</option>
                  <option value={85}>85px (Standart)</option>
                  <option value={100}>100px (Geniş)</option>
                  <option value={120}>120px (Büyük)</option>
                  <option value={150}>150px (Maksimum)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPhotoHeight(h => Math.min(250, h + 10))}
                  className="bg-slate-700 hover:bg-slate-600 text-white w-5 h-5 rounded font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                  title="Tüm fotoğrafları büyüt (+10px)"
                >
                  +
                </button>

                <div className="h-4 w-px bg-slate-600 mx-1"></div>

                <span className="font-bold text-indigo-300">Sığdır:</span>
                <select
                  value={photoFit}
                  onChange={(e) => setPhotoFit(e.target.value)}
                  className="bg-slate-800 text-white font-bold px-1.5 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
                  title="Fotoğrafların hücre içine nasıl oturacağını belirler"
                >
                  <option value="contain">Sığdır (Orantılı)</option>
                  <option value="cover">Doldur (Kırp)</option>
                  <option value="fill">Tam Doldur (Esneme)</option>
                </select>
              </div>
            </>
          )}`;

if (appContent.includes(targetZoomBar)) {
  appContent = appContent.replace(targetZoomBar, newZoomBar);
  console.log('  -> Photo toolbar controls added to AdvancedReportModal');
} else {
  console.warn('  -> Could not locate targetZoomBar directly');
}

fs.writeFileSync(appJsxPath, appContent, 'utf8');
console.log('App.jsx successfully updated!');

// --- 7. UPDATING MobileAuditTab.jsx FOR PRINT PREVIEW & PHOTO SIZING ---
console.log('--- 7. UPDATING MobileAuditTab.jsx FOR PRINT PREVIEW & PHOTO SIZING ---');
if (fs.existsSync(mobileAuditTabPath)) {
  let auditContent = fs.readFileSync(mobileAuditTabPath, 'utf8');
  
  // Add modal state & photo sizing controls for print preview
  if (!auditContent.includes('auditPhotoHeight')) {
    auditContent = auditContent.replace(
      `const [selectedAuditForPrint, setSelectedAuditForPrint] = useState(null);`,
      `const [selectedAuditForPrint, setSelectedAuditForPrint] = useState(null);
  const [auditPhotoHeight, setAuditPhotoHeight] = useState(160);
  const [auditPhotoFit, setAuditPhotoFit] = useState('contain');
  const [auditPhotoRotate, setAuditPhotoRotate] = useState(0);`
    );
  }

  // Add the print modal before the last closing </div>
  const printModalJsx = `
      {/* SAHA DENETİM VE DÖF RAPORU YAZDIRMA / ÖNİZLEME MODALI */}
      {showPrintModal && selectedAuditForPrint && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-rose-400" />
                <h3 className="font-extrabold text-sm">Saha Denetim & DÖF Rapor Önizleme</h3>
              </div>

              {/* Fotoğraf Ayarları Çubuğu */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-300 font-bold">Foto Boyut:</span>
                <button
                  type="button"
                  onClick={() => setAuditPhotoHeight(h => Math.max(60, h - 20))}
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white"
                  title="Küçült"
                >-</button>
                <span className="font-mono text-[11px] text-amber-300 font-bold">{auditPhotoHeight}px</span>
                <button
                  type="button"
                  onClick={() => setAuditPhotoHeight(h => Math.min(400, h + 20))}
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white"
                  title="Büyüt"
                >+</button>

                <div className="h-4 w-px bg-slate-700 mx-1"></div>

                <span className="text-slate-300 font-bold">Sığdır:</span>
                <select
                  value={auditPhotoFit}
                  onChange={(e) => setAuditPhotoFit(e.target.value)}
                  className="bg-slate-700 text-white font-bold px-1.5 py-0.5 rounded text-xs outline-none cursor-pointer"
                >
                  <option value="contain">Sığdır (Orantılı)</option>
                  <option value="cover">Doldur (Kırp)</option>
                  <option value="fill">Tam Doldur</option>
                </select>

                <button
                  type="button"
                  onClick={() => setAuditPhotoRotate(r => (r + 90) % 360)}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white"
                  title="90° Döndür"
                >
                  ↻ {auditPhotoRotate}°
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Printer size={14} /> Yazdır / PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* Önizleme Sayfası (A4 Kağıt Düzeni) */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-900 flex justify-center">
              <div
                id="audit-print-document"
                className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[148mm] p-6 rounded-2xl shadow-xl border border-slate-300 space-y-4 print:shadow-none print:border-none print:p-0"
              >
                {/* Antet */}
                <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">FOTOĞRAFLI SAHA DENETİM VE DÖF BİLDİRİM FORMU</h2>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">{company?.name || 'Firma Adı'}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-mono text-slate-500">Tarih: {new Date(selectedAuditForPrint.auditDate || Date.now()).toLocaleDateString('tr-TR')}</span>
                    <span className={\`block mt-1 font-extrabold px-2 py-0.5 rounded text-[10px] inline-block \${selectedAuditForPrint.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}\`}>
                      {selectedAuditForPrint.status === 'closed' ? 'DÖF KAPATILDI' : 'DÖF AÇIK (İŞLEMDE)'}
                    </span>
                  </div>
                </div>

                {/* Bilgi Izgarası */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Denetim Bölgesi</span>
                    <span className="font-bold text-slate-800">{selectedAuditForPrint.location || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Denetçi / Uzman</span>
                    <span className="font-bold text-slate-800">{selectedAuditForPrint.auditorName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Risk Derecesi</span>
                    <span className="font-bold text-rose-600">{selectedAuditForPrint.severity || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Sorumlu Kişi</span>
                    <span className="font-bold text-indigo-700">{selectedAuditForPrint.assignedPerson || 'Saha Sorumlusu'}</span>
                  </div>
                </div>

                {/* Tespit ve Açıklama */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Tespit Edilen Tehlike / Uygunsuzluk Tanımı</span>
                  <p className="font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedAuditForPrint.description}</p>
                </div>

                {/* Fotoğraf Hücresi (Manuel Boyutlandırılabilir ve Hücreye Sığdırılabilir) */}
                {selectedAuditForPrint.photoData ? (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Saha Fotoğrafı & İhlal Tespiti</span>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center mx-auto"
                      style={{ height: \`\${auditPhotoHeight}px\`, width: '100%' }}
                    >
                      <img
                        src={selectedAuditForPrint.photoData}
                        alt="Saha Denetim Fotoğrafı"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: auditPhotoFit,
                          transform: \`rotate(\${auditPhotoRotate}deg)\`,
                          display: 'block'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border text-center text-slate-400 text-xs italic">
                    Bu saha denetimi için fotoğraf yüklenmemiştir.
                  </div>
                )}

                {/* İmzalar */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200 mt-6">
                  <div>
                    <p className="font-bold text-slate-700">Tespiti Yapan İSG Profesyoneli</p>
                    <div className="h-12 flex items-center justify-center text-slate-400 text-[11px] italic">İmza</div>
                    <p className="text-slate-600 font-semibold">{selectedAuditForPrint.auditorName || 'İş Güvenliği Uzmanı'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Saha / İşyeri Yetkilisi</p>
                    <div className="h-12 flex items-center justify-center text-slate-400 text-[11px] italic">İmza</div>
                    <p className="text-slate-600 font-semibold">{selectedAuditForPrint.assignedPerson || 'İşveren / Saha Sorumlusu'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

  if (!auditContent.includes('SAHA DENETİM VE DÖF RAPORU YAZDIRMA')) {
    const lastDivIndex = auditContent.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      auditContent = auditContent.slice(0, lastDivIndex) + printModalJsx + '\n</div>' + auditContent.slice(lastDivIndex + 6);
      fs.writeFileSync(mobileAuditTabPath, auditContent, 'utf8');
      console.log('  -> MobileAuditTab.jsx print modal added successfully!');
    }
  }
}
