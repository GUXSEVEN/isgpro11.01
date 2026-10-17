const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyTeamsTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add windowWidth hook and scale states
const targetBeforeLandscapeSettings = `  // Yatay A4 Rapor Gelişmiş Düzenleme State'leri`;

const scaleStatesCode = `  // Ekrana Sığdırma (Fit to Screen) ve Responsive Ölçekleme State'leri
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [portraitScaleMode, setPortraitScaleMode] = useState('fit'); // 'fit' | '1' | '0.8' | '0.6'
  const [landscapeScaleMode, setLandscapeScaleMode] = useState('fit'); // 'fit' | '1' | '0.8' | '0.6'

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dikey A4 (190mm ~ 720px) Gerçek Ekran Ölçeği
  const effectivePortraitScale = useMemo(() => {
    if (portraitScaleMode !== 'fit') return parseFloat(portraitScaleMode) || 1;
    if (windowWidth < 640) return Math.min(0.95, Math.max(0.38, (windowWidth - 28) / 725));
    if (windowWidth < 900) return Math.min(1, (windowWidth - 50) / 740);
    return 1;
  }, [portraitScaleMode, windowWidth]);

  // Yatay A4 (280mm ~ 1060px) Gerçek Ekran Ölçeği
  const effectiveLandscapeScale = useMemo(() => {
    if (landscapeScaleMode !== 'fit') return parseFloat(landscapeScaleMode) || 1;
    if (windowWidth < 640) return Math.min(0.95, Math.max(0.32, (windowWidth - 28) / 1065));
    if (windowWidth < 1024) return Math.min(0.9, (windowWidth - 50) / 1070);
    if (windowWidth < 1280) return Math.min(1, (windowWidth - 70) / 1080);
    return 1;
  }, [landscapeScaleMode, windowWidth]);

  // Yatay A4 Rapor Gelişmiş Düzenleme State'leri`;

content = content.replace(targetBeforeLandscapeSettings, scaleStatesCode);

// 2. In Dikey A4 Toolbar add Ekrana Sığdır control
const targetDikeyToolbarFirst = `<div className="flex items-center gap-2 flex-wrap text-xs">`;

const replacementDikeyToolbarFirst = `<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                {/* Ekrana Sığdır / Görünüm Seçici */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Görünüm:</span>
                  <select
                    value={portraitScaleMode}
                    onChange={e => setPortraitScaleMode(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none text-[11px]"
                    title="Mobilde ve masaüstünde ekrana tam sığdırır"
                  >
                    <option value="fit" className="bg-slate-800 text-white">📱 Ekrana Sığdır</option>
                    <option value="1" className="bg-slate-800 text-white">%100 (Gerçek)</option>
                    <option value="0.8" className="bg-slate-800 text-white">%80</option>
                    <option value="0.6" className="bg-slate-800 text-white">%60</option>
                    <option value="0.45" className="bg-slate-800 text-white">%45 (Kompakt)</option>
                  </select>
                </div>`;

content = content.replace(targetDikeyToolbarFirst, replacementDikeyToolbarFirst);

// 3. Make Dikey A4 Modal Responsive Container
content = content.replace(
  `<div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[95vh]">`,
  `<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-3 md:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-[98vw] sm:max-w-4xl h-[98dvh] sm:h-[95vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">`
);

// 4. Wrap Dikey A4 Document in responsive scaling wrapper
const oldDikeyDocContainer = `            {/* DÖKÜMAN ÖNİZLEME ALANI (A4 ORANLI & İMZA EN ALTA YASLI) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200 dark:bg-slate-900 flex justify-center">
              <div
                id="dikey-a4-printable-document"
                className="bg-white text-slate-900 shadow-2xl p-6 sm:p-8 flex flex-col justify-between border-2 border-slate-900"
                style={{
                  width: '190mm',
                  minHeight: '270mm',
                  height: '270mm',
                  boxSizing: 'border-box',
                  fontSize: reportSettings.fontSize,
                  lineHeight: reportSettings.lineHeight
                }}
              >`;

const newDikeyDocContainer = `            {/* DÖKÜMAN ÖNİZLEME ALANI (MOBİL VE MASAÜSTÜ TAM SIĞDIRMA) */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto bg-slate-200 dark:bg-slate-900 flex justify-center items-start">
              <div
                style={{
                  width: \`\${190 * 3.7795 * effectivePortraitScale}px\`,
                  minHeight: \`\${270 * 3.7795 * effectivePortraitScale}px\`,
                  height: \`\${270 * 3.7795 * effectivePortraitScale}px\`
                }}
                className="shrink-0 transition-all duration-150 origin-top flex justify-center"
              >
                <div
                  id="dikey-a4-printable-document"
                  className="bg-white text-slate-900 shadow-2xl p-6 sm:p-8 flex flex-col justify-between border-2 border-slate-900 origin-top"
                  style={{
                    width: '190mm',
                    minHeight: '270mm',
                    height: '270mm',
                    boxSizing: 'border-box',
                    fontSize: reportSettings.fontSize,
                    lineHeight: reportSettings.lineHeight,
                    transform: \`scale(\${effectivePortraitScale})\`,
                    transformOrigin: 'top center'
                  }}
                >`;

content = content.replace(oldDikeyDocContainer, newDikeyDocContainer);

// Close the inner wrapper for Dikey
const oldDikeyDocEnd = `              </div>
            </div>

            {/* Modal Alt Kapatma Çubuğu */}`;

const newDikeyDocEnd = `                </div>
              </div>
            </div>

            {/* Modal Alt Kapatma Çubuğu */}`;

content = content.replace(oldDikeyDocEnd, newDikeyDocEnd);

// 5. In Yatay A4 Toolbar add Ekrana Sığdır control
const targetYatayToolbarFirst = `<div className="flex items-center gap-2 flex-wrap text-xs">`;

const replacementYatayToolbarFirst = `<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                {/* Ekrana Sığdır / Görünüm Seçici */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Görünüm:</span>
                  <select
                    value={landscapeScaleMode}
                    onChange={e => setLandscapeScaleMode(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none text-[11px]"
                    title="Mobilde ve masaüstünde ekrana tam sığdırır"
                  >
                    <option value="fit" className="bg-slate-800 text-white">📱 Ekrana Sığdır</option>
                    <option value="1" className="bg-slate-800 text-white">%100 (Gerçek)</option>
                    <option value="0.8" className="bg-slate-800 text-white">%80</option>
                    <option value="0.6" className="bg-slate-800 text-white">%60</option>
                    <option value="0.45" className="bg-slate-800 text-white">%45 (Kompakt)</option>
                  </select>
                </div>`;

content = content.replace(targetYatayToolbarFirst, replacementYatayToolbarFirst);

// 6. Make Yatay A4 Modal Responsive Container
content = content.replace(
  `<div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[96vh]">`,
  `<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-3 md:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-[98vw] sm:max-w-6xl h-[98dvh] sm:h-[95vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">`
);

// 7. Wrap Yatay A4 Document in responsive scaling wrapper
const oldYatayDocContainer = `            {/* DÖKÜMAN ÖNİZLEME ALANI (YATAY A4 ORANLI & İMZA EN ALTA YASLI) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200 dark:bg-slate-900 flex justify-center">
              <div
                id="yatay-a4-printable-document"
                className="bg-white text-slate-900 shadow-2xl p-6 sm:p-7 flex flex-col justify-between border-2 border-slate-900"
                style={{
                  width: '280mm',
                  minHeight: '194mm',
                  height: '194mm',
                  boxSizing: 'border-box',
                  fontSize: landscapeSettings.fontSize,
                  lineHeight: landscapeSettings.lineHeight
                }}
              >`;

const newYatayDocContainer = `            {/* DÖKÜMAN ÖNİZLEME ALANI (MOBİL VE MASAÜSTÜ TAM SIĞDIRMA) */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto bg-slate-200 dark:bg-slate-900 flex justify-center items-start">
              <div
                style={{
                  width: \`\${280 * 3.7795 * effectiveLandscapeScale}px\`,
                  minHeight: \`\${194 * 3.7795 * effectiveLandscapeScale}px\`,
                  height: \`\${194 * 3.7795 * effectiveLandscapeScale}px\`
                }}
                className="shrink-0 transition-all duration-150 origin-top flex justify-center"
              >
                <div
                  id="yatay-a4-printable-document"
                  className="bg-white text-slate-900 shadow-2xl p-6 sm:p-7 flex flex-col justify-between border-2 border-slate-900 origin-top"
                  style={{
                    width: '280mm',
                    minHeight: '194mm',
                    height: '194mm',
                    boxSizing: 'border-box',
                    fontSize: landscapeSettings.fontSize,
                    lineHeight: landscapeSettings.lineHeight,
                    transform: \`scale(\${effectiveLandscapeScale})\`,
                    transformOrigin: 'top center'
                  }}
                >`;

content = content.replace(oldYatayDocContainer, newYatayDocContainer);

// Close the inner wrapper for Yatay
const oldYatayDocEnd = `              </div>
            </div>

            {/* Modal Alt Kapatma Çubuğu */}`;

const newYatayDocEnd = `                </div>
              </div>
            </div>

            {/* Modal Alt Kapatma Çubuğu */}`;

content = content.replace(oldYatayDocEnd, newYatayDocEnd);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('EmergencyTeamsTab.jsx successfully patched with auto fit-to-screen for mobile & desktop!');
