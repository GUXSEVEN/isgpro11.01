const fs = require('fs');
const path = require('path');

const targetBase = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile';
const appJsxPath = path.join(targetBase, 'src', 'App.jsx');
const indexCssPath = path.join(targetBase, 'src', 'index.css');
const indexHtmlPath = path.join(targetBase, 'index.html');

console.log('>>> [1/3] Updating index.css with mobile touch & scrolling rules...');
let cssContent = fs.readFileSync(indexCssPath, 'utf8');

// Ensure html, body, #root, #panel-root-scroll-viewport and no-scrollbar exist
const cssMobileRules = `
/* Global Mobile Scrolling & Touch Optimization */
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overscroll-behavior-y: auto;
  -webkit-overflow-scrolling: touch;
}

#root {
  height: 100%;
  width: 100%;
}

#panel-root-scroll-viewport {
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-y !important;
  overscroll-behavior-y: auto !important;
}

.touch-pan-y {
  touch-action: pan-y !important;
}

.touch-pan-x {
  touch-action: pan-x !important;
}

/* Hide scrollbar while maintaining full touch swiping on mobile ribbons */
.no-scrollbar::-webkit-scrollbar {
  display: none !important;
}
.no-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;

if (!cssContent.includes('#panel-root-scroll-viewport')) {
  cssContent = cssContent + '\n' + cssMobileRules;
  fs.writeFileSync(indexCssPath, cssContent, 'utf8');
  console.log('✓ index.css updated successfully.');
} else {
  console.log('ℹ index.css already has panel-root-scroll-viewport rules.');
}

console.log('>>> [2/3] Cleaning index.html (removing render-blocking Stimulsoft CDN scripts)...');
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const hadStimulsoft = htmlContent.includes('stimulsoft');
if (hadStimulsoft) {
  htmlContent = htmlContent
    .replace(/<!-- STIMULSOFT CSS -->[\s\S]*?<!-- STIMULSOFT JS \(Sıralama Önemli\) -->/g, '')
    .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/stimulsoft-reports-js@[^"]+"><\/script>\s*/g, '')
    .replace(/<link href="https:\/\/cdn\.jsdelivr\.net\/npm\/stimulsoft-reports-js@[^"]+" rel="stylesheet">\s*/g, '')
    .replace(/<!-- STIMULSOFT BLOCKLY \(Designer için gerekli olabilir\) -->[\s\S]*?<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/stimulsoft-reports-js@[^"]+"><\/script>\s*/g, '');
  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
  console.log('✓ index.html cleaned (Stimulsoft blockage removed).');
} else {
  console.log('ℹ index.html was already clean.');
}

console.log('>>> [3/3] Patching App.jsx...');
let appContent = fs.readFileSync(appJsxPath, 'utf8');
const originalLength = appContent.length;

// A. Update previewZoom initial state in AdvancedReportModal to fit mobile screen automatically
const zoomSearch = `  const [previewZoom, setPreviewZoom] = useState(1.0);`;
const zoomReplace = `  const [previewZoom, setPreviewZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return Math.max(0.4, Math.min(1.0, parseFloat(((window.innerWidth - 20) / 820).toFixed(2))));
    }
    return 1.0;
  });
  const [showToolbarSettings, setShowToolbarSettings] = useState(false);`;

if (appContent.includes(zoomSearch)) {
  appContent = appContent.replace(zoomSearch, zoomReplace);
  console.log('✓ [A] previewZoom responsive initial state added.');
} else {
  console.warn('⚠️ [A] zoomSearch not found or already replaced.');
}

// B. Replace the huge flex-wrap secondary toolbar in AdvancedReportModal (lines 8238 to 8688)
// with the sleek single-row horizontally swipeable ribbon + modal drawer for advanced settings
const toolbarStartMarker = `{/* ZOOM KONTROLLERI ÇUBUĞU */}`;
const toolbarEndMarker = `{/* Scroll Container: Mobilde ve masaüstünde taşmayı yönetir */}`;

const startIdx = appContent.indexOf(toolbarStartMarker);
const endIdx = appContent.indexOf(toolbarEndMarker);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  const newToolbarCode = `{/* ── YENİLENMİŞ ULTRA-KOMPAKT TEK SATIR KAYDIRILABİLİR KONTROL ŞERİDİ ── */}
        <div className="no-print bg-slate-900/95 backdrop-blur-md border-b border-slate-750 px-2.5 py-1.5 shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch-smooth flex-nowrap py-0.5">

            {/* 1. ZOOM KONTROLLERİ PİLL */}
            <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewZoom(z => Math.max(0.3, parseFloat((z - 0.1).toFixed(1))))}
                className="bg-slate-700 hover:bg-slate-600 text-white w-6 h-6 rounded-lg font-bold text-sm flex items-center justify-center transition-colors active:scale-95"
                title="Uzaklaştır"
              >-</button>
              <span className="text-white text-xs font-mono w-10 text-center font-bold">{Math.round(previewZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(1))))}
                className="bg-slate-700 hover:bg-slate-600 text-white w-6 h-6 rounded-lg font-bold text-sm flex items-center justify-center transition-colors active:scale-95"
                title="Yakınlaştır"
              >+</button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setPreviewZoom(parseFloat(((window.innerWidth - 20) / 820).toFixed(2)));
                  } else {
                    setPreviewZoom(1.0);
                  }
                }}
                className="text-indigo-400 hover:text-indigo-200 text-[10.5px] font-bold px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 transition-colors ml-0.5"
                title="Sayfayı ekrana tam sığdır"
              >
                Sığdır
              </button>
            </div>

            {/* 2. ⚡ A4'E AKILLI DAĞITICI BUTONU */}
            {(reportType === 'ziyaret' || reportType === 'web') && (
              <button
                type="button"
                onClick={handleSmartAutoPack}
                className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-indigo-400/80 cursor-pointer"
                title="Maddelerin metin ve fotoğraf boyutlarını analiz eder, her sayfayı A4 boyutuna taşma yapmayacak şekilde otomatik dağıtır"
              >
                <Zap size={14} className="text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
                <span className="whitespace-nowrap font-extrabold">⚡ A4'e Akıllı Dağıt</span>
              </button>
            )}

            {/* 3. ✨ METİNLERİ OPTİMİZE ET BUTONU */}
            {(reportType === 'ziyaret' || reportType === 'web') && (
              <div className="shrink-0">
                {!optimizedRisks ? (
                  <button
                    type="button"
                    onClick={handleOptimizeReportTexts}
                    disabled={isOptimizingText}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-emerald-400/80 cursor-pointer shrink-0"
                    title="Mevzuat maddelerini ve tehlikeleri koruyarak lüzumsuz tekrarları eler, metinleri sayfaya tam sığdırır"
                  >
                    <Sparkles size={13} className="text-amber-300 shrink-0" />
                    <span className="whitespace-nowrap">✨ Optimize Et</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-emerald-950/90 px-2 py-1 rounded-xl border border-emerald-500 shrink-0">
                    <span className="text-emerald-300 font-bold text-[11px] whitespace-nowrap">✔ Özlü İSG</span>
                    <button
                      type="button"
                      onClick={handleRevertReportTexts}
                      className="bg-rose-700 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                      title="Orijinal metinlere geri döner"
                    >
                      ↺ Geri Al
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. YAZI BOYUTU (A- / A+ VE SEÇİCİ) */}
            <div className="flex items-center gap-1 text-xs text-white bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shrink-0">
              <span className="font-bold text-slate-300 text-[10.5px]">Yazı:</span>
              <button
                type="button"
                onClick={() => {
                  const sizes = ['5.5pt','6pt','6.5pt','7pt','7.5pt','8pt','8.5pt','9pt','9.5pt','10pt','11pt','12pt','13pt','14pt'];
                  const curIdx = sizes.indexOf(reportFontSize);
                  if (curIdx > 0) setReportFontSize(sizes[curIdx - 1]);
                  else setReportFontSize('6pt');
                }}
                className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-600 text-slate-200 active:scale-95"
                title="Yazı boyutunu küçült (A-)"
              >A-</button>
              <select
                value={reportFontSize}
                onChange={(e) => setReportFontSize(e.target.value)}
                className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 outline-none cursor-pointer text-xs"
              >
                <option value="5.5pt">5.5pt</option>
                <option value="6pt">6pt</option>
                <option value="6.5pt">6.5pt</option>
                <option value="7pt">7pt</option>
                <option value="7.5pt">7.5pt</option>
                <option value="8pt">8pt</option>
                <option value="8.5pt">8.5pt</option>
                <option value="9pt">9pt</option>
                <option value="9.5pt">9.5pt</option>
                <option value="10pt">10pt</option>
                <option value="11pt">11pt</option>
                <option value="12pt">12pt</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const sizes = ['5.5pt','6pt','6.5pt','7pt','7.5pt','8pt','8.5pt','9pt','9.5pt','10pt','11pt','12pt','13pt','14pt'];
                  const curIdx = sizes.indexOf(reportFontSize);
                  if (curIdx !== -1 && curIdx < sizes.length - 1) setReportFontSize(sizes[curIdx + 1]);
                  else setReportFontSize('9pt');
                }}
                className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-600 text-slate-200 active:scale-95"
                title="Yazı boyutunu büyüt (A+)"
              >A+</button>
            </div>

            {/* 5. FOTOĞRAF MODU & BOYUTU */}
            {(reportType === 'ziyaret' || reportType === 'web') && (
              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shrink-0 text-xs">
                <span className="font-bold text-cyan-300 text-[10.5px]">Foto:</span>
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
                  className={\`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer border \${photoFit === 'contain' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'}\`}
                  title="Fotoğrafın tamamını kırpmadan sığdırır"
                >
                  ⊡ Sığdır
                </button>
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
                  className={\`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer border \${photoFit === 'cover' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'}\`}
                  title="Fotoğrafı hücreye doldurur (kırpma yapabilir)"
                >
                  ▨ Doldur
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('full-width');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer border \${photoFit === 'full-width' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'}\`}
                  title="Fotoğrafı sütun genişliğine %100 yayar"
                >
                  ⬌ Geniş
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
                {/* Foto Boyut +/- */}
                <button
                  type="button"
                  onClick={() => {
                    const newH = Math.max(30, photoHeight - 10);
                    setPhotoHeight(newH);
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].height; });
                      return updated;
                    });
                  }}
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold border border-slate-600 active:scale-95"
                  title="Fotoğraf yüksekliğini azalt (-10px)"
                >-</button>
                <span className="text-amber-200 text-[10.5px] font-bold font-mono px-0.5">{photoHeight}px</span>
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
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold border border-slate-600 active:scale-95"
                  title="Fotoğraf yüksekliğini artır (+10px)"
                >+</button>
              </div>
            )}

            {/* 6. SAYFALAMA KONTROLÜ */}
            {(reportType === 'ziyaret' || reportType === 'web') && (
              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shrink-0 text-xs">
                <span className="font-bold text-slate-300 text-[10.5px]">Sayfa Başı:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItemsPerPage(val);
                    setIsCustomPagination(false);
                  }}
                  className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded border border-slate-700 outline-none cursor-pointer text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} Madde</option>
                  ))}
                </select>
              </div>
            )}

            {/* 7. HİZALAMA KONTROLÜ */}
            <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shrink-0 text-xs">
              <span className="font-bold text-sky-300 text-[10.5px]">Hizalama:</span>
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTableVerticalAlign('top')}
                  className={\`px-1.5 py-0.5 rounded text-[10px] font-bold \${tableVerticalAlign === 'top' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}\`}
                  title="Hücreleri yukarı hizala"
                >Üst</button>
                <button
                  type="button"
                  onClick={() => setTableVerticalAlign('middle')}
                  className={\`px-1.5 py-0.5 rounded text-[10px] font-bold \${tableVerticalAlign === 'middle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}\`}
                  title="Hücreleri ortala"
                >Orta</button>
                <button
                  type="button"
                  onClick={() => setTableVerticalAlign('bottom')}
                  className={\`px-1.5 py-0.5 rounded text-[10px] font-bold \${tableVerticalAlign === 'bottom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}\`}
                  title="Hücreleri aşağı hizala"
                >Alt</button>
              </div>
            </div>

            {/* 8. GELİŞMİŞ AYARLAR BUTONU */}
            <button
              type="button"
              onClick={() => setShowToolbarSettings(prev => !prev)}
              className={\`shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer \${
                showToolbarSettings 
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }\`}
              title="Tüm sayfa ve kenar boşluğu ayarlarını aç"
            >
              <span>⚙️ Gelişmiş Ayarlar</span>
            </button>

          </div>
        </div>

        {/* GELİŞMİŞ AYARLAR DİYALOGU (Açıldığında sayfanın üzerine biner, asla A4'ü kapatmaz) */}
        {showToolbarSettings && (
          <div className="no-print bg-slate-900/95 border-b border-indigo-500/40 p-3.5 z-30 shadow-2xl animate-fade-in shrink-0">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-white">
              
              {/* Kenar Boşluğu */}
              {(reportType === 'acil-durum' || reportType === 'web') && (
                <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-slate-300">Kenar Boşluğu:</span>
                  <select
                    value={reportPadding}
                    onChange={(e) => setReportPadding(e.target.value)}
                    className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="5mm">5mm</option>
                    <option value="8mm">8mm</option>
                    <option value="10mm">10mm</option>
                    <option value="12mm">12mm</option>
                    <option value="15mm">15mm</option>
                    <option value="20mm">20mm</option>
                  </select>
                </div>
              )}

              {/* Satır Aralığı */}
              {(reportType === 'acil-durum' || reportType === 'web') && (
                <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-slate-300">Satır Aralığı:</span>
                  <select
                    value={reportLineHeight}
                    onChange={(e) => setReportLineHeight(e.target.value)}
                    className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="1.1">1.1 (Sıkı)</option>
                    <option value="1.2">1.2 (Standart)</option>
                    <option value="1.3">1.3 (Geniş)</option>
                    <option value="1.4">1.4 (Ferah)</option>
                    <option value="1.5">1.5 (Çok Geniş)</option>
                  </select>
                </div>
              )}

              {/* İmza Alanı */}
              {(reportType === 'acil-durum' || reportType === 'web') && (
                <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-slate-300">İmza Alanı:</span>
                  <select
                    value={signatureStyle}
                    onChange={(e) => setSignatureStyle(e.target.value)}
                    className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="compact">Kompakt (Alt Bilgi)</option>
                    <option value="standard">Kutulu (Geniş)</option>
                    <option value="hide">Gizle</option>
                  </select>
                </div>
              )}

              {/* Metin Yatay Hizalama */}
              <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
                <span className="font-bold text-slate-300">Metin Hizalama:</span>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTableTextAlign('left')}
                    className={\`px-2 py-0.5 rounded text-xs font-bold \${tableTextAlign === 'left' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300'}\`}
                  >Sola</button>
                  <button
                    type="button"
                    onClick={() => setTableTextAlign('center')}
                    className={\`px-2 py-0.5 rounded text-xs font-bold \${tableTextAlign === 'center' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300'}\`}
                  >Ortala</button>
                </div>
              </div>

              {/* Özel Fotoğraf Ayarlarını Sıfırla */}
              {Object.keys(photoCustomStyles).length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotoCustomStyles({})}
                  className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-xl text-xs font-bold border border-rose-700 cursor-pointer shadow-sm"
                  title="Manuel yapılan tüm özel fotoğraf boyutlandırmalarını sıfırlar"
                >
                  ↺ Fotoğraf Ayarlarını Sıfırla
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowToolbarSettings(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer ml-auto"
              >
                Kapat (✓)
              </button>
            </div>
          </div>
        )}
        
        `;

  appContent = appContent.slice(0, startIdx) + newToolbarCode + appContent.slice(endIdx);
  console.log('✓ [B] Single-row swipeable control ribbon & settings modal successfully installed.');
} else {
  console.error('❌ [B] Could not locate toolbar markers in App.jsx');
}

// C. Update the report preview scroll container with smooth touch scrolling
const previewContainerSearch = `<div className="flex-1 overflow-auto p-2 md:p-8 w-full h-full">`;
const previewContainerReplace = `<div className="flex-1 overflow-auto p-2 md:p-8 w-full h-full touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>`;

if (appContent.includes(previewContainerSearch)) {
  appContent = appContent.replace(previewContainerSearch, previewContainerReplace);
  console.log('✓ [C] Report preview container touch scrolling added.');
} else {
  console.warn('ℹ [C] previewContainerSearch not found or already updated.');
}

// D. Update root container & viewport touch scrolling in main workspace (lines 22688 to 22810)
const rootDivSearch = `className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden"`;
const rootDivReplace = `className="h-screen h-[100dvh] max-h-[100dvh] bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden"`;

if (appContent.includes(rootDivSearch)) {
  appContent = appContent.replace(rootDivSearch, rootDivReplace);
  console.log('✓ [D] Root container height bounded to 100dvh for mobile address bar stability.');
}

const mainDivSearch = `className={\`flex-1 flex flex-col h-full md:h-screen overflow-hidden pt-0 md:pt-[max(0.5rem,env(safe-area-inset-top))] pb-0 md:pb-[max(0.5rem,env(safe-area-inset-bottom))] \${isCompactMode ? 'panel-compact-mode' : ''}\`}`;
const mainDivReplace = `className={\`flex-1 flex flex-col h-full max-h-full overflow-hidden pt-0 md:pt-[max(0.5rem,env(safe-area-inset-top))] pb-0 md:pb-[max(0.5rem,env(safe-area-inset-bottom))] \${isCompactMode ? 'panel-compact-mode' : ''}\`}`;

if (appContent.includes(mainDivSearch)) {
  appContent = appContent.replace(mainDivSearch, mainDivReplace);
  console.log('✓ [E] Main content area bounded to max-h-full.');
}

// E. Update #panel-root-scroll-viewport
const viewportSearch = `<div 
          id="panel-root-scroll-viewport" 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-panel-scrollbar relative"
          style={{ zoom: panelZoom / 100 }}
        >`;

const viewportReplace = `<div 
          id="panel-root-scroll-viewport" 
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto custom-panel-scrollbar relative touch-pan-y"
          style={{
            zoom: (typeof window !== 'undefined' && window.innerWidth <= 768) ? undefined : (panelZoom / 100),
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >`;

if (appContent.includes(viewportSearch)) {
  appContent = appContent.replace(viewportSearch, viewportReplace);
  console.log('✓ [F] #panel-root-scroll-viewport touch & zoom-disable on mobile installed.');
} else {
  console.warn('⚠️ [F] viewportSearch exact string not matched, attempting regex replacement...');
  const vpRegex = /<div\s+id="panel-root-scroll-viewport"[\s\S]*?style=\{\{\s*zoom:\s*panelZoom\s*\/\s*100\s*\}\}\s*>/;
  if (vpRegex.test(appContent)) {
    appContent = appContent.replace(vpRegex, viewportReplace);
    console.log('✓ [F] #panel-root-scroll-viewport updated via regex.');
  }
}

// F. Update handleTouchStart & handleTouchEnd to NEVER block vertical scrolling
const touchStartSearch = `  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch.clientX < 50 || isDrawerOpen) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    if (Math.abs(deltaY) < 100 && deltaTime < 300) {
      if (deltaX > 50 && !isDrawerOpen) {
        setIsDrawerOpen(true);
      } else if (deltaX < -50 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }
    touchStartRef.current = null;
  };`;

const touchStartReplace = `  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch.clientX < 40 || isDrawerOpen) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Dikey hareket yataydan fazlaysa veya bariz yukarı/aşağı kaydırılıyorsa çekmeceyi asla tetikleme!
    if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaY) > 35) {
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(deltaY) < 35 && deltaTime < 300) {
      if (deltaX > 50 && !isDrawerOpen) {
        setIsDrawerOpen(true);
      } else if (deltaX < -50 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }
    touchStartRef.current = null;
  };`;

if (appContent.includes(touchStartSearch)) {
  appContent = appContent.replace(touchStartSearch, touchStartReplace);
  console.log('✓ [G] handleTouchStart / handleTouchEnd updated to eliminate vertical scroll blockage.');
}

fs.writeFileSync(appJsxPath, appContent, 'utf8');
console.log(`>>> App.jsx written successfully (size: ${appContent.length}, changed: ${appContent.length !== originalLength})`);
