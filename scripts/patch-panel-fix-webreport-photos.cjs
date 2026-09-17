/**
 * patch-panel-fix-webreport-photos.cjs
 * Fixes ReferenceError: photoHeight is not defined in WebReportEditor
 * and fixes the top toolbar photo controls (shrink, enlarge, full width, fit)
 * in AdvancedReportModal in isg-projesi - Copy/src/App.jsx.
 */

const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/3] Fixing WebReportEditor props to receive photoHeight, photoFit, photoCustomStyles, onUpdatePhotoStyle...');
const oldWebReportSig = `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 3
}) => {`;

const newWebReportSig = `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 3,
  photoHeight = 45,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle
}) => {`;

if (content.includes(oldWebReportSig)) {
  content = content.replace(oldWebReportSig, newWebReportSig);
  console.log('✔ WebReportEditor props signature fixed.');
} else {
  console.log('Note: oldWebReportSig not matched exactly, checking regex...');
  content = content.replace(/const WebReportEditor = \(\{[\s\S]*?itemsPerPage = 3\s*\}\) => \{/, newWebReportSig);
  console.log('✔ WebReportEditor regex replace applied.');
}

console.log('>>> [2/3] Enhancing ReportPhotoCell to support full_width fit mode and responsive heights...');
const oldPhotoCellReturn = `    <div
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
      />`;

const newPhotoCellReturn = `    <div
      className={\`report-photo-cell-container group relative mx-auto overflow-hidden rounded bg-slate-50 border border-slate-200 transition-all \${className}\`}
      style={{
        height: currentFit === 'full_width' ? 'auto' : \`\${currentHeight}px\`,
        maxHeight: currentFit === 'full_width' ? '280px' : \`\${currentHeight}px\`,
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
          height: currentFit === 'full_width' ? 'auto' : '100%',
          maxHeight: currentFit === 'full_width' ? '260px' : '100%',
          objectFit: currentFit === 'full_width' ? 'contain' : currentFit,
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          display: 'block'
        }}
      />`;

if (content.includes(oldPhotoCellReturn)) {
  content = content.replace(oldPhotoCellReturn, newPhotoCellReturn);
  console.log('✔ ReportPhotoCell full_width rendering support added.');
}

// Update handleToggleFit to cycle contain -> cover -> full_width -> contain
const oldToggleFit = `    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'fill' : 'contain';`;
const newToggleFit = `    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'full_width' : 'contain';`;
if (content.includes(oldToggleFit)) {
  content = content.replace(oldToggleFit, newToggleFit);
  console.log('✔ handleToggleFit cycle updated with full_width.');
}

// Update button label inside ReportPhotoCell toolbar
const oldFitBtnText = `{currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam'}`;
const newFitBtnText = `{currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam Geniş'}`;
if (content.includes(oldFitBtnText)) {
  content = content.replace(oldFitBtnText, newFitBtnText);
  console.log('✔ ReportPhotoCell fit button label updated.');
}

console.log('>>> [3/3] Fixing modal top toolbar photo controls and WebReportEditor call...');
// Replace WebReportEditor call in AdvancedReportModal
const oldWebEditorCall = `            {reportType === 'web' && assessmentData && (
              <WebReportEditor
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
              />
            )}`;

const newWebEditorCall = `            {reportType === 'web' && assessmentData && (
              <WebReportEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
              />
            )}`;

if (content.includes(oldWebEditorCall)) {
  content = content.replace(oldWebEditorCall, newWebEditorCall);
  console.log('✔ WebReportEditor call in modal updated to pass photoHeight directly.');
}

// Replace the toolbar photo controls block in AdvancedReportModal
const oldToolbarPhotoBlock = `              {/* FOTOĞRAF BOYUTU VE HÜCREYE SIĞDIRMA KONTROLLERİ */}
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
              </div>`;

const newToolbarPhotoBlock = `              {/* FOTOĞRAF BOYUTU VE HÜCREYE SIĞDIRMA KONTROLLERİ */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-white bg-slate-700/80 px-2 py-1 rounded-xl border border-slate-600/80 shadow-inner">
                <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                  📷 Fotoğraflar:
                </span>
                
                {/* Küçült (-) Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    const newH = Math.max(30, photoHeight - 10);
                    setPhotoHeight(newH);
                    // Clear custom individual heights so top button affects all photos
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].height; });
                      return updated;
                    });
                  }}
                  className="bg-slate-800 hover:bg-slate-600 text-white w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-600 active:scale-95 shadow-sm"
                  title="Tüm fotoğrafları küçült (-10px)"
                >
                  -
                </button>

                {/* Yükseklik Seçici */}
                <select
                  value={photoHeight}
                  onChange={(e) => {
                    const newH = Number(e.target.value);
                    setPhotoHeight(newH);
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].height; });
                      return updated;
                    });
                  }}
                  className="bg-slate-800 text-amber-200 font-bold px-2 py-0.5 rounded-lg border border-slate-600 outline-none cursor-pointer text-xs"
                >
                  <option value={35}>35px (Kompakt)</option>
                  <option value={45}>45px (Küçük)</option>
                  <option value={60}>60px (Orta)</option>
                  <option value={80}>80px (Standart)</option>
                  <option value={100}>100px (Geniş)</option>
                  <option value={130}>130px (Büyük)</option>
                  <option value={160}>160px (Maksimum)</option>
                </select>

                {/* Büyüt (+) Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    const newH = Math.min(250, photoHeight + 10);
                    setPhotoHeight(newH);
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].height; });
                      return updated;
                    });
                  }}
                  className="bg-slate-800 hover:bg-slate-600 text-white w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-600 active:scale-95 shadow-sm"
                  title="Tüm fotoğrafları büyüt (+10px)"
                >
                  +
                </button>

                <div className="h-4 w-px bg-slate-600 mx-1"></div>

                {/* Tam Geniş Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('full_width');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'full_width' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre genişliğine tam oturtur (Tam Geniş)"
                >
                  ↔ Tam Geniş
                </button>

                {/* Hücreye Sığdır Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('contain');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'contain' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre içine orantılı sığdırır"
                >
                  ⊡ Sığdır
                </button>

                {/* Doldur (Kırp) Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('cover');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'cover' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücreyi tam dolduracak şekilde kırpar"
                >
                  ▨ Doldur
                </button>

                {/* Tüm Özel Ayarları Sıfırla */}
                {Object.keys(photoCustomStyles).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotoCustomStyles({})}
                    className="px-1.5 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-rose-700"
                    title="Tek tek elle yapılan tüm özel fotoğraf boyutlandırmalarını sıfırlar"
                  >
                    ↺ Sıfırla
                  </button>
                )}
              </div>`;

if (content.includes(oldToolbarPhotoBlock)) {
  content = content.replace(oldToolbarPhotoBlock, newToolbarPhotoBlock);
  console.log('✔ Modal top toolbar photo controls replaced successfully.');
} else {
  console.log('Note: oldToolbarPhotoBlock not matched exactly, replacing via regex...');
  content = content.replace(/\{\/\* FOTOĞRAF BOYUTU VE HÜCREYE SIĞDIRMA KONTROLLERİ \*\/\}[\s\S]*?<\/div>\s*<\/div>/, newToolbarPhotoBlock);
  console.log('✔ Modal top toolbar regex replace applied.');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✔ isg-projesi - Copy/src/App.jsx successfully patched and saved!');
