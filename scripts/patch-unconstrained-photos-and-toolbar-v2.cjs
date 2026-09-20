const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Determine line ending
const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = content.split(/\r?\n/);

console.log('Total lines in App.jsx:', lines.length);

// 1. Locate ReportPhotoCell
let rpcStart = -1;
let rpcEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('function ReportPhotoCell({')) {
    rpcStart = i;
  }
  if (rpcStart !== -1 && i > rpcStart && lines[i].trim() === '}' && lines.slice(i, i + 10).some(l => l.includes('function ReportTextCell'))) {
    rpcEnd = i;
    break;
  }
}

if (rpcStart === -1 || rpcEnd === -1) {
  console.error('Could not find ReportPhotoCell bounds! rpcStart:', rpcStart, 'rpcEnd:', rpcEnd);
  process.exit(1);
}
console.log(`Found ReportPhotoCell lines ${rpcStart + 1} to ${rpcEnd + 1}`);

const newReportPhotoCellCode = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 75,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  onUpdatePhotoStyle,
  label = 'Fotoğraf',
  className = '',
  photoAlign = 'center',
  photoAlignX = 'center'
}) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = useMemo(() => sanitizePhotoUrl(src), [src]);

  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  // Hem onUpdateCustomStyle hem onUpdatePhotoStyle desteklenir
  const updateFn = onUpdateCustomStyle || onUpdatePhotoStyle;

  const custom = customStyles?.[photoKey] || {};
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');
  const currentAlignX = custom.alignX !== undefined ? custom.alignX : (photoAlignX || 'center');

  // Kullanıcı manuel düzenlemelerinde 30px ile 260px arasında tam serbesttir (80px kısıtlaması kaldırıldı)
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;

  if (!cleanSrc || hasError) {
    return <span className="text-gray-400 italic text-center text-[6px]">-</span>;
  }

  const handleAdjustHeight = (delta, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const newHeight = Math.max(30, Math.min(260, currentHeight + delta));
    if (updateFn) {
      updateFn(photoKey, { ...custom, height: newHeight });
    }
  };

  const handleToggleFit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'full_width' : 'contain';
    if (updateFn) {
      updateFn(photoKey, { ...custom, fit: nextFit });
    }
  };

  const handleToggleAlignY = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextAlign = currentAlign === 'top' ? 'center' : currentAlign === 'center' ? 'bottom' : 'top';
    if (updateFn) {
      updateFn(photoKey, { ...custom, align: nextAlign });
    }
  };

  const handleToggleAlignX = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextAlignX = currentAlignX === 'left' ? 'center' : currentAlignX === 'center' ? 'right' : 'left';
    if (updateFn) {
      updateFn(photoKey, { ...custom, alignX: nextAlignX });
    }
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextRotate = (currentRotate + 90) % 360;
    if (updateFn) {
      updateFn(photoKey, { ...custom, rotate: nextRotate });
    }
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (updateFn) {
      updateFn(photoKey, null);
    }
  };

  return (
    <div
      className={\`report-photo-cell-container group relative mx-auto rounded transition-all \${className}\`}
      style={{
        height: currentFit === 'full_width' ? 'auto' : \`\${currentHeight}px\`,
        maxHeight: \`\${Math.max(currentHeight, 260)}px\`,
        minHeight: '28px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'visible', // Araç çubuğunun ve menünün kesilmesini engeller
        boxSizing: 'border-box',
        marginBottom: '2px'
      }}
    >
      {/* Görsel Kutusu: Kırpma Kesinlikle Yapılmaz (object-fit: contain), En-Boy Oranı Korunur */}
      <div
        className="w-full h-full rounded overflow-hidden bg-slate-50 border border-slate-200 flex"
        style={{
          height: \`\${currentHeight}px\`,
          maxHeight: \`\${Math.max(currentHeight, 260)}px\`,
          justifyContent: currentAlignX === 'left' ? 'flex-start' : currentAlignX === 'right' ? 'flex-end' : 'center',
          alignItems: currentAlign === 'top' ? 'flex-start' : currentAlign === 'bottom' ? 'flex-end' : 'center',
        }}
      >
        <img
          src={cleanSrc}
          alt={label}
          onError={() => setHasError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: currentFit === 'full_width' ? '100%' : 'auto',
            height: currentFit === 'cover' ? '100%' : 'auto',
            objectFit: 'contain', // KIRPMA YOK: Fotoğrafın tamamı her modda eksiksiz görünür
            objectPosition: \`\${currentAlignX === 'left' ? 'left' : currentAlignX === 'right' ? 'right' : 'center'} \${currentAlign === 'top' ? 'top' : currentAlign === 'bottom' ? 'bottom' : 'center'}\`,
            transform: \`rotate(\${currentRotate}deg)\`,
            transition: 'transform 0.2s ease, height 0.15s ease',
            display: 'block'
          }}
        />
      </div>

      {/* CANLI DÜZENLEME ARAÇ ÇUBUĞU (Hover Anında Açılır, Asla Kesilmez, Çıktılarda no-print İle Gizlenir) */}
      <div
        className="no-print absolute -top-3 right-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/95 text-white rounded-md p-1 shadow-2xl flex flex-wrap items-center justify-end gap-1 text-[8.5px] select-none max-w-[280px] border border-slate-600 pointer-events-auto"
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

        {/* Dikey Hizalama */}
        <button
          type="button"
          onClick={handleToggleAlignY}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-amber-300 transition-colors cursor-pointer"
          title={\`Dikey Hizalama: \${currentAlign === 'top' ? 'Üste Yasla' : currentAlign === 'bottom' ? 'Alta Yasla' : 'Ortala'}\`}
        >
          {currentAlign === 'top' ? '⬆ Üst' : currentAlign === 'bottom' ? '⬇ Alt' : '⏺ Orta'}
        </button>

        {/* Yatay Hizalama */}
        <button
          type="button"
          onClick={handleToggleAlignX}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-cyan-300 transition-colors cursor-pointer"
          title={\`Yatay Hizalama: \${currentAlignX === 'left' ? 'Sola Yasla' : currentAlignX === 'right' ? 'Sağa Yasla' : 'Ortala'}\`}
        >
          {currentAlignX === 'left' ? '⬅ Sol' : currentAlignX === 'right' ? '➡ Sağ' : '⏹ Orta'}
        </button>

        {/* Mod: Sığdır / Doldur / Tam Geniş */}
        <button
          type="button"
          onClick={handleToggleFit}
          className="px-1 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-[8px] text-white transition-colors cursor-pointer"
          title={\`Görünüm: \${currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam Geniş'} (Kırpmasız)\`}
        >
          {currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam Geniş'}
        </button>

        <button
          type="button"
          onClick={handleRotate}
          className="w-4 h-4 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
          title="90° Döndür"
        >
          ↻
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-1 py-0.5 rounded bg-rose-700 hover:bg-rose-600 flex items-center justify-center font-bold text-[8px] text-white transition-colors cursor-pointer"
          title="Bu fotoğrafı sıfırla (Geri Al)"
        >
          ↺ Geri Al
        </button>
      </div>

      {/* Alt Bilgi Rozeti (Hover Anında) */}
      <div className="no-print absolute bottom-0.5 left-1 z-10 opacity-0 group-hover:opacity-85 transition-opacity text-[7px] text-slate-700 bg-white/95 px-1 rounded shadow-xs pointer-events-none font-mono">
        {currentFit} • {currentHeight}px {currentRotate ? \`• \${currentRotate}°\` : ''}
      </div>
    </div>
  );
}`;

lines.splice(rpcStart, rpcEnd - rpcStart + 1, ...newReportPhotoCellCode.split('\n'));
console.log('ReportPhotoCell successfully replaced.');

let updatedContent = lines.join(eol);

// 2. calcAccurateRowHeight: remove clamp on custom photo heights
const oldAccurateRowPattern = /const maxPhotoClamp = isWeb \? 80 : 110;[\s\S]*?const afterPhotoH = hasAfter \? Math\.min\(photoCustomStyles\?\.\[afterKey\]\?\.height \|\| curDefaultPhotoH, maxPhotoClamp\) : 0;/;

const newAccurateRowCode = `let basePhotoH = 48;
  if (fitToUse === 'full_width') basePhotoH = isWeb ? 80 : 110;
  else if (fitToUse === 'cover') basePhotoH = isWeb ? 75 : 95;
  else basePhotoH = isWeb ? 50 : 80;

  let curDefaultPhotoH = photoHeight || basePhotoH;
  if (fitToUse === 'cover' || fitToUse === 'full_width') {
    curDefaultPhotoH = Math.max(isWeb ? 65 : 85, curDefaultPhotoH);
  }

  const customBeforeH = photoCustomStyles?.[beforeKey]?.height;
  const customAfterH = photoCustomStyles?.[afterKey]?.height;

  // Kullanıcının elle büyüttüğü tam fotoğraf boyutu doğrudan hesaba katılır (80px kısıtlaması yok)
  const beforePhotoH = hasBefore ? (customBeforeH !== undefined ? customBeforeH : curDefaultPhotoH) : 0;
  const afterPhotoH = hasAfter ? (customAfterH !== undefined ? customAfterH : curDefaultPhotoH) : 0;`;

if (!oldAccurateRowPattern.test(updatedContent)) {
  console.error('Could not match oldAccurateRowPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldAccurateRowPattern, newAccurateRowCode);
console.log('calcAccurateRowHeight updated successfully.');

// 3. WebReportEditor: Symbiotic font scaling when photo grows
const oldWebSymbioticPattern = /\/\/ Plan 1: Simbiyotik Dengeleyici & Az Maddeli Sayfaları Doldurma[\s\S]*?const effectivePhotoH = Math\.max\(35, Math\.round\(symbioticPhotoH \* autoFitScale\)\);[\s\S]*?symbioticTextFont = `calc\(\$\{reportFontSize\} - 0\.5pt\)`;\s*\}/;

const newWebSymbioticCode = `const maxRowChars = Math.max(
                        (r.hazard?.length || 0),
                        (r.risk?.length || 0),
                        (r.precaution?.length || 0),
                        (r.description?.length || 0)
                      );
                      const beforeKey = \`web-before-\${r.id || itemNumber}\`;
                      const afterKey = \`web-after-\${r.id || itemNumber}\`;
                      const customH = Math.max(photoCustomStyles?.[beforeKey]?.height || 0, photoCustomStyles?.[afterKey]?.height || 0);

                      let effectivePhotoH = customH || photoHeight || (photoFit === 'full_width' ? 85 : (photoFit === 'cover' ? 75 : 50));

                      // Seyrek sayfa doldurma bonusu
                      if (!customH) {
                        if (pageRisks.length === 1) effectivePhotoH = Math.min(130, effectivePhotoH + 35);
                        else if (pageRisks.length === 2) effectivePhotoH = Math.min(105, effectivePhotoH + 18);
                      }

                      // Hücre büyürse metin fontunu orantılı büyüt (sayfa ve hücre boş görünmesin)
                      let symbioticTextFont = reportFontSize;
                      if (effectivePhotoH >= 110 && maxRowChars < 220) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.5pt)\`;
                      } else if (effectivePhotoH >= 85 && maxRowChars < 260) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.8pt)\`;
                      } else if (pageRisks.length === 1 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.2pt)\`;
                      } else if (pageRisks.length === 2 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.6pt)\`;
                      } else if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.5pt)\`;
                      }`;

if (!oldWebSymbioticPattern.test(updatedContent)) {
  console.error('Could not match oldWebSymbioticPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldWebSymbioticPattern, newWebSymbioticCode);
console.log('WebReportEditor symbiotic scaling updated.');

// 4. SahaZiyaretEditor: Symbiotic font scaling and photo height
const oldSahaSymbioticPattern = /\/\/ Plan 1: Simbiyotik Dengeleyici & Az Maddeli Sayfaları Doldurma[\s\S]*?const effectivePhotoH = Math\.max\(45, Math\.round\(symbioticPhotoH \* autoFitScale\)\);[\s\S]*?symbioticTextFont = `calc\(\$\{reportFontSize\} - 0\.5pt\)`;\s*\}/;

const newSahaSymbioticCode = `const maxRowChars = Math.max((risk.hazard?.length || 0), (risk.precaution?.length || 0), (risk.description?.length || 0));
                      const beforeKey = \`saha-before-\${risk.id || itemNumber}\`;
                      const afterKey = \`saha-after-\${risk.id || itemNumber}\`;
                      const customH = Math.max(photoCustomStyles?.[beforeKey]?.height || 0, photoCustomStyles?.[afterKey]?.height || 0);

                      let effectivePhotoH = customH || photoHeight || (photoFit === 'full_width' ? 110 : (photoFit === 'cover' ? 100 : 75));

                      if (!customH) {
                        if (pageRisks.length === 1) effectivePhotoH = Math.min(155, effectivePhotoH + 40);
                        else if (pageRisks.length === 2) effectivePhotoH = Math.min(125, effectivePhotoH + 20);
                      }

                      // Hücre büyürse metin fontunu orantılı büyüt
                      let symbioticTextFont = reportFontSize;
                      if (effectivePhotoH >= 120 && maxRowChars < 220) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.6pt)\`;
                      } else if (effectivePhotoH >= 95 && maxRowChars < 260) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.8pt)\`;
                      } else if (pageRisks.length === 1 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.2pt)\`;
                      } else if (pageRisks.length === 2 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.6pt)\`;
                      } else if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.5pt)\`;
                      }`;

if (!oldSahaSymbioticPattern.test(updatedContent)) {
  console.error('Could not match oldSahaSymbioticPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldSahaSymbioticPattern, newSahaSymbioticCode);
console.log('SahaZiyaretEditor symbiotic scaling updated.');

// 5. SahaZiyaretEditor: pass symbioticTextFont to ReportTextCell for desc and prec
updatedContent = updatedContent.replace(
  /cellKey=\{`saha-desc-\${risk\.id \|\| itemNumber}`\}\s+defaultFontSize=\{reportFontSize\}/g,
  'cellKey={`saha-desc-${risk.id || itemNumber}`}\n                              defaultFontSize={symbioticTextFont}'
);
updatedContent = updatedContent.replace(
  /cellKey=\{`saha-prec-\${risk\.id \|\| itemNumber}`\}\s+defaultFontSize=\{reportFontSize\}/g,
  'cellKey={`saha-prec-${risk.id || itemNumber}`}\n                              defaultFontSize={symbioticTextFont}'
);
console.log('SahaZiyaretEditor ReportTextCell defaultFontSize updated to symbioticTextFont.');

// 6. Remove maxClampHeight={80} from WebReportEditor
updatedContent = updatedContent.replace(/\s*maxClampHeight=\{80\}/g, '');
console.log('maxClampHeight={80} removed.');

fs.writeFileSync(appPath, updatedContent, 'utf8');
console.log('ALL DONE! App.jsx successfully updated.');
