const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let code = fs.readFileSync(appPath, 'utf8');

console.log('Current code length:', code.length);

// 1. Update ReportPhotoCell to NEVER crop (objectFit: contain), support align toggle & always allow Geri Al
const oldReportPhotoCellBody = `  const handleToggleFit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'full_width' : 'contain';
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
        height: \`\${clampedHeight}px\`,
        maxHeight: \`\${effectiveMaxH}px\`,
        minHeight: '24px',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: currentAlign === 'top' ? 'flex-start' : currentAlign === 'bottom' ? 'flex-end' : 'center',
        boxSizing: 'border-box',
        marginBottom: '2px'
      }}
    >
      <img
        src={cleanSrc}
        alt={label}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          maxHeight: \`\${effectiveMaxH}px\`,
          objectFit: currentFit === 'full_width' ? 'cover' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
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
      </div>`;

const newReportPhotoCellBody = `  const handleToggleFit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextFit = currentFit === 'contain' ? 'cover' : currentFit === 'cover' ? 'full_width' : 'contain';
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, { ...custom, fit: nextFit });
    }
  };

  const handleToggleAlign = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextAlign = currentAlign === 'top' ? 'center' : currentAlign === 'center' ? 'bottom' : 'top';
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(photoKey, { ...custom, align: nextAlign });
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
        height: \`\${clampedHeight}px\`,
        maxHeight: \`\${effectiveMaxH}px\`,
        minHeight: '24px',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: currentAlign === 'top' ? 'flex-start' : currentAlign === 'bottom' ? 'flex-end' : 'center',
        boxSizing: 'border-box',
        marginBottom: '2px'
      }}
    >
      <img
        src={cleanSrc}
        alt={label}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          maxHeight: \`\${effectiveMaxH}px\`,
          objectFit: 'contain', // Kırpma Asla Yapılmaz: Fotoğrafın tam hali 100% görünür
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
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
          onClick={handleToggleAlign}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-amber-300 transition-colors cursor-pointer"
          title={\`Dikey Hizalama: \${currentAlign === 'top' ? 'Üste Yasla' : currentAlign === 'bottom' ? 'Alta Yasla' : 'Ortala'}\`}
        >
          {currentAlign === 'top' ? '⬆ Üst' : currentAlign === 'bottom' ? '⬇ Alt' : '⏺ Orta'}
        </button>

        <button
          type="button"
          onClick={handleToggleFit}
          className="px-1 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-[8px] text-white transition-colors cursor-pointer"
          title={\`Görünüm: \${currentFit === 'contain' ? 'Sığdır' : currentFit === 'cover' ? 'Doldur' : 'Tam Geniş'} (Kırpmasız Tam Görünüm)\`}
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
          title="Bu fotoğrafı varsayılana geri al (Sıfırla)"
        >
          ↺ Geri Al
        </button>
      </div>`;

if (!code.includes(oldReportPhotoCellBody)) {
  console.error('Could not find oldReportPhotoCellBody');
  process.exit(1);
}
code = code.replace(oldReportPhotoCellBody, newReportPhotoCellBody);
console.log('ReportPhotoCell uncropped & align toggle successfully applied');

// 2. Update WebReportEditor cells to apply photoAlign to flex container
const oldCellCol3 = `<td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: 'top', textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1">`;

const newCellCol3 = `<td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: 'top', textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1 h-full" style={{ justifyContent: photoAlign === 'top' ? 'flex-start' : photoAlign === 'bottom' ? 'flex-end' : 'center' }}>`;

if (!code.includes(oldCellCol3)) {
  console.error('Could not find oldCellCol3');
  process.exit(1);
}
code = code.replace(oldCellCol3, newCellCol3);

const oldCellCol12 = `<td className="border border-black p-1 bg-white" style={{ verticalAlign: 'top' }}>
                            <div className="flex flex-col gap-1">`;

const newCellCol12 = `<td className="border border-black p-1 bg-white" style={{ verticalAlign: 'top' }}>
                            <div className="flex flex-col gap-1 h-full" style={{ justifyContent: photoAlign === 'top' ? 'flex-start' : photoAlign === 'bottom' ? 'flex-end' : 'center' }}>`;

if (!code.includes(oldCellCol12)) {
  console.error('Could not find oldCellCol12');
  process.exit(1);
}
code = code.replace(oldCellCol12, newCellCol12);
console.log('WebReportEditor photoAlign flex container applied');

// 3. Update the Top Toolbar to provide an ALWAYS VISIBLE "Tümünü Geri Al (Sıfırla)" button
const oldToolbarResetBlock = `                {/* Tüm Özel Ayarları Sıfırla */}
                {Object.keys(photoCustomStyles).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotoCustomStyles({})}
                    className="px-1.5 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-rose-700"
                    title="Tek tek elle yapılan tüm özel fotoğraf boyutlandırmalarını sıfırlar"
                  >
                    ↺ Sıfırla
                  </button>
                )}`;

const newToolbarResetBlock = `                {/* Tüm Özel Ayarları ve Modu Geri Al (Sıfırla) */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('contain');
                    setPhotoHeight(45);
                    setPhotoAlign('center');
                    setPhotoCustomStyles({});
                    setIsCustomPagination(false);
                    setWebPageSizes([]);
                    setSahaPageSizes([]);
                  }}
                  className="px-2 py-0.5 bg-rose-950/90 hover:bg-rose-800 text-rose-200 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-rose-600 flex items-center gap-1 shadow-sm active:scale-95"
                  title="Tüm fotoğraf boyutlarını, modlarını (Sığdır/Doldur/Tam Geniş), hizalamaları ve sayfalamayı sıfırlayıp fabrika ayarlarına geri döndürür"
                >
                  ↺ Tümünü Geri Al (Sıfırla)
                </button>`;

if (!code.includes(oldToolbarResetBlock)) {
  console.error('Could not find oldToolbarResetBlock');
  process.exit(1);
}
code = code.replace(oldToolbarResetBlock, newToolbarResetBlock);
console.log('Top toolbar Geri Al button successfully updated');

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully wrote updated App.jsx! New length:', code.length);
