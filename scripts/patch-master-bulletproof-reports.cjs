const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = content.split(/\r?\n/);

console.log('App.jsx total lines:', lines.length);

// Verify key anchor points
const rpcLine = lines.findIndex(l => l.startsWith('function ReportPhotoCell({'));
const rtcLine = lines.findIndex(l => l.startsWith('function ReportTextCell({'));
const webLine = lines.findIndex(l => l.startsWith('const WebReportEditor = ({'));
const sahaLine = lines.findIndex(l => l.startsWith('const SahaZiyaretEditor = ({'));
const autoPackLine = lines.findIndex(l => l.includes('const handleSmartAutoPack ='));

console.log('Found anchors:', { rpcLine: rpcLine + 1, rtcLine: rtcLine + 1, webLine: webLine + 1, sahaLine: sahaLine + 1, autoPackLine: autoPackLine + 1 });

if (rpcLine === -1 || rtcLine === -1 || webLine === -1 || sahaLine === -1) {
  console.error('Missing key anchors in App.jsx!');
  process.exit(1);
}

// 1. New ReportPhotoCell code
const newReportPhotoCell = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 70,
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

  const updateFn = onUpdateCustomStyle || onUpdatePhotoStyle;

  const custom = customStyles?.[photoKey] || {};
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');
  const currentAlignX = custom.alignX !== undefined ? custom.alignX : (photoAlignX || 'center');

  // 30px ile 260px arasında tam serbest manuel yükseklik
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

  const handleSetFit = (newFit, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (updateFn) {
      updateFn(photoKey, { ...custom, fit: newFit });
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

  const isFullWidth = currentFit === 'full_width';
  const isCover = currentFit === 'cover';
  const isContain = !isFullWidth && !isCover;

  return (
    <div
      className={\`report-photo-cell-container group relative mx-auto rounded transition-all \${className}\`}
      style={{
        height: isFullWidth ? 'auto' : \`\${isCover ? Math.max(currentHeight, 85) : currentHeight}px\`,
        maxHeight: isFullWidth ? 'none' : \`\${Math.max(currentHeight, 260)}px\`,
        minHeight: '28px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'visible',
        boxSizing: 'border-box',
        marginBottom: '2px'
      }}
    >
      <div
        className="w-full rounded overflow-hidden bg-slate-50 border border-slate-200 flex"
        style={{
          height: isFullWidth ? 'auto' : \`\${isCover ? Math.max(currentHeight, 85) : currentHeight}px\`,
          minHeight: '28px',
          maxHeight: isFullWidth ? 'none' : \`\${Math.max(currentHeight, 260)}px\`,
          justifyContent: currentAlignX === 'left' ? 'flex-start' : currentAlignX === 'right' ? 'flex-end' : 'center',
          alignItems: currentAlign === 'top' ? 'flex-start' : currentAlign === 'bottom' ? 'flex-end' : 'center',
          padding: isContain ? '2px' : '0px',
        }}
      >
        <img
          src={cleanSrc}
          alt={label}
          onError={() => setHasError(true)}
          style={{
            width: isFullWidth ? '100%' : (isCover ? '100%' : 'auto'),
            height: isFullWidth ? 'auto' : (isCover ? '100%' : 'auto'),
            maxWidth: isFullWidth ? '100%' : (isCover ? '100%' : '96%'),
            maxHeight: isFullWidth ? '260px' : (isCover ? '100%' : '96%'),
            objectFit: isCover ? 'cover' : 'contain',
            objectPosition: \`\${currentAlignX === 'left' ? 'left' : currentAlignX === 'right' ? 'right' : 'center'} \${currentAlign === 'top' ? 'top' : currentAlign === 'bottom' ? 'bottom' : 'center'}\`,
            transform: \`rotate(\${currentRotate}deg)\`,
            transition: 'transform 0.2s ease, height 0.15s ease, width 0.15s ease',
            display: 'block'
          }}
        />
      </div>

      {/* CANLI DÜZENLEME ARAÇ ÇUBUĞU */}
      <div
        className="no-print absolute -top-3.5 right-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/95 text-white rounded-md p-1 shadow-2xl flex flex-wrap items-center justify-end gap-1 text-[8.5px] select-none max-w-[300px] border border-slate-600 pointer-events-auto"
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
          {isFullWidth ? 'Oto' : \`\${currentHeight}px\`}
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

        {/* 3 Görünüm Modu: Sığdır / Doldur / Tam Geniş */}
        <button
          type="button"
          onClick={(e) => handleSetFit('contain', e)}
          className={\`px-1 py-0.5 rounded font-bold text-[8px] transition-colors cursor-pointer \${isContain ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
          title="Sığdır: Kırpma yapmadan kutuya sığdırır"
        >
          ⊡ Sığdır
        </button>

        <button
          type="button"
          onClick={(e) => handleSetFit('cover', e)}
          className={\`px-1 py-0.5 rounded font-bold text-[8px] transition-colors cursor-pointer \${isCover ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
          title="Doldur: Kutuyu tam kaplar"
        >
          ▨ Doldur
        </button>

        <button
          type="button"
          onClick={(e) => handleSetFit('full_width', e)}
          className={\`px-1 py-0.5 rounded font-bold text-[8px] transition-colors cursor-pointer \${isFullWidth ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
          title="Tam Geniş: Hücre sütununun tüm genişliğine yayılır"
        >
          ↔ Tam Geniş
        </button>

        <div className="w-px h-3 bg-slate-600 mx-0.5"></div>

        <button
          type="button"
          onClick={handleToggleAlignY}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-amber-300 transition-colors cursor-pointer"
          title={\`Dikey: \${currentAlign === 'top' ? 'Üst' : currentAlign === 'bottom' ? 'Alt' : 'Orta'}\`}
        >
          {currentAlign === 'top' ? '⬆ Üst' : currentAlign === 'bottom' ? '⬇ Alt' : '⏺ Dikey'}
        </button>

        <button
          type="button"
          onClick={handleToggleAlignX}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-cyan-300 transition-colors cursor-pointer"
          title={\`Yatay: \${currentAlignX === 'left' ? 'Sol' : currentAlignX === 'right' ? 'Sağ' : 'Orta'}\`}
        >
          {currentAlignX === 'left' ? '⬅ Sol' : currentAlignX === 'right' ? '➡ Sağ' : '⏹ Yatay'}
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
          title="Bu fotoğrafı sıfırla"
        >
          ↺ Sıfırla
        </button>
      </div>

      <div className="no-print absolute bottom-0.5 left-1 z-10 opacity-0 group-hover:opacity-85 transition-opacity text-[7px] text-slate-700 bg-white/95 px-1 rounded shadow-xs pointer-events-none font-mono">
        {currentFit} • {isFullWidth ? 'Tam Geniş' : \`\${currentHeight}px\`} {currentRotate ? \`• \${currentRotate}°\` : ''}
      </div>
    </div>
  );
}`;

// Find end of ReportPhotoCell (just before function ReportTextCell)
let rpcEnd = rtcLine - 1;
while (rpcEnd > rpcLine && lines[rpcEnd].trim() !== '}') {
  rpcEnd--;
}
console.log(`Replacing ReportPhotoCell lines ${rpcLine + 1} to ${rpcEnd + 1}`);
lines.splice(rpcLine, rpcEnd - rpcLine + 1, ...newReportPhotoCell.split('\n'));

// Recalculate anchors after splicing ReportPhotoCell
const rtcLine2 = lines.findIndex(l => l.startsWith('function ReportTextCell({'));
let rtcEnd = lines.findIndex(l => l.startsWith('const WebReportEditor = ({')) - 1;
while (rtcEnd > rtcLine2 && lines[rtcEnd].trim() !== '}') {
  rtcEnd--;
}
console.log(`ReportTextCell ends at line ${rtcEnd + 1}`);

// 2. Insert calcAccurateRowHeight and calcSmartWebPageSizes right after ReportTextCell
const calcCode = `
// ==========================================================================================
// HÜCRE BÜTÜNLÜĞÜ VE A4 SAYFA KAPASİTE HESAPLAMA MOTORU (HİÇBİR HÜCRE KESİLEMEZ)
// ==========================================================================================
export const calcAccurateRowHeight = (r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt') => {
  const fontPt = parseFloat(reportFontSize) || 8;
  const fontPx = fontPt * 1.33;
  const lineH = fontPx * 1.15;
  const charsPerLine = isWeb ? 32 : 38;

  const hasBefore = Boolean(r.beforePhoto);
  const hasAfter = Boolean(r.afterPhoto);
  const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
  const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;

  let basePhotoH = 48;
  if (fitToUse === 'full_width') basePhotoH = isWeb ? 80 : 105;
  else if (fitToUse === 'cover') basePhotoH = isWeb ? 70 : 90;
  else basePhotoH = isWeb ? 50 : 70;

  let curDefaultPhotoH = photoHeight || basePhotoH;
  if (fitToUse === 'cover') {
    curDefaultPhotoH = Math.max(isWeb ? 70 : 90, curDefaultPhotoH);
  } else if (fitToUse === 'full_width') {
    curDefaultPhotoH = Math.max(isWeb ? 80 : 105, curDefaultPhotoH);
  }

  const customBeforeH = photoCustomStyles?.[beforeKey]?.height;
  const customAfterH = photoCustomStyles?.[afterKey]?.height;
  const customBeforeFit = photoCustomStyles?.[beforeKey]?.fit;
  const customAfterFit = photoCustomStyles?.[afterKey]?.fit;

  let beforePhotoH = 0;
  if (hasBefore) {
    if (customBeforeH !== undefined) beforePhotoH = customBeforeH;
    else if (customBeforeFit === 'full_width') beforePhotoH = isWeb ? 85 : 110;
    else if (customBeforeFit === 'cover') beforePhotoH = isWeb ? 75 : 95;
    else beforePhotoH = curDefaultPhotoH;
  }

  let afterPhotoH = 0;
  if (hasAfter) {
    if (customAfterH !== undefined) afterPhotoH = customAfterH;
    else if (customAfterFit === 'full_width') afterPhotoH = isWeb ? 85 : 110;
    else if (customAfterFit === 'cover') afterPhotoH = isWeb ? 75 : 95;
    else afterPhotoH = curDefaultPhotoH;
  }

  let col3H = 0;
  let col4H = 0;
  let col5H = 0;
  let col6H = 0;

  if (isWeb) {
    // Web Raporu (A4 Yatay): Sütun 3 = Konu + Foto + Açıklama dikey alt alta
    const topicH = r.topic ? (fontPx + 6) : 0;
    const descChars = (r.description || '').trim().length;
    const descLines = descChars > 0 ? Math.max(1, Math.ceil(descChars / charsPerLine)) : 0;
    const descH = descLines * lineH;
    col3H = topicH + beforePhotoH + descH + (beforePhotoH > 0 && descH > 0 ? 8 : 4);

    // Sütun 5 = Tehlike ve Risk
    const hazardChars = (r.hazard || '').trim().length;
    const riskChars = (r.risk || '').trim().length;
    const hazardLines = hazardChars > 0 ? Math.max(1, Math.ceil(hazardChars / charsPerLine)) : 0;
    const riskLines = riskChars > 0 ? Math.max(1, Math.ceil(riskChars / charsPerLine)) : 0;
    col4H = ((hazardLines + riskLines) * lineH) + 10;

    // Sütun 9 = Önlemler
    const precChars = (r.precaution || '').trim().length;
    const precLines = precChars > 0 ? Math.max(1, Math.ceil(precChars / charsPerLine)) : 0;
    col5H = (precLines * lineH) + 8;

    // Sütun 12 = DÖF Sonrası
    col6H = afterPhotoH + (r.postScore ? 20 : 0) + 6;
  } else {
    // Saha Raporu (A4 Dikey):
    const ownerH = r.processOwner ? (fontPx + 6) : 0;
    const affectedH = r.affectedPersons ? (fontPx + 4) : 0;
    col3H = beforePhotoH + ownerH + affectedH + (beforePhotoH > 0 ? 8 : 4);

    const topicH = r.topic ? (fontPx + 6) : 0;
    const hazardChars = (r.hazard || '').trim().length;
    const riskChars = (r.risk || '').trim().length;
    const hazardLines = hazardChars > 0 ? Math.max(1, Math.ceil(hazardChars / charsPerLine)) : 0;
    const riskLines = riskChars > 0 ? Math.max(1, Math.ceil(riskChars / charsPerLine)) : 0;
    col4H = topicH + ((hazardLines + riskLines) * lineH) + 10;

    const precChars = (r.precaution || '').trim().length;
    const precLines = precChars > 0 ? Math.max(1, Math.ceil(precChars / charsPerLine)) : 0;
    col5H = (precLines * lineH) + 8;

    const dateH = r.controlDate ? (fontPx + 6) : 0;
    col6H = afterPhotoH + dateH + (afterPhotoH > 0 ? 8 : 4);
  }

  return Math.max(col3H, col4H, col5H, col6H, 36);
};

export const calcSmartWebPageSizes = (risksList, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt', isWeb = true) => {
  if (!risksList || risksList.length === 0) return [];

  // A4 Net Doğru Bütçeleri
  const budgetPage1 = isWeb ? 560 : 860;
  const budgetOtherPages = isWeb ? 645 : 860;
  const legendBudgetH = isWeb ? 85 : 0;

  const sizes = [];
  let currentItems = 0;
  let currentH = 0;
  let pageIdx = 0;

  for (let i = 0; i < risksList.length; i++) {
    const r = risksList[i];
    const rowH = calcAccurateRowHeight(r, i, isWeb, fitToUse, photoCustomStyles, photoHeight, reportFontSize);
    const limit = pageIdx === 0 ? budgetPage1 : budgetOtherPages;

    if (currentItems > 0 && (currentH + rowH) > limit) {
      sizes.push(currentItems);
      currentItems = 1;
      currentH = rowH;
      pageIdx++;
    } else {
      currentItems++;
      currentH += rowH;
    }
  }
  if (currentItems > 0) {
    sizes.push(currentItems);
  }

  // Son Sayfa Metodoloji Lejantı Kontrolü (Web Raporu için):
  if (isWeb && sizes.length > 0) {
    let startIndex = 0;
    for (let p = 0; p < sizes.length - 1; p++) {
      startIndex += sizes[p];
    }
    const lastPageRisks = risksList.slice(startIndex);
    let lastPageH = 0;
    lastPageRisks.forEach((r, idx) => {
      lastPageH += calcAccurateRowHeight(r, startIndex + idx, isWeb, fitToUse, photoCustomStyles, photoHeight, reportFontSize);
    });
    const lastPageMaxBudget = (sizes.length === 1 ? budgetPage1 : budgetOtherPages) - legendBudgetH;

    if (lastPageH > lastPageMaxBudget && sizes[sizes.length - 1] > 1) {
      let itemsOnLast = sizes[sizes.length - 1];
      while (lastPageH > lastPageMaxBudget && itemsOnLast > 1) {
        itemsOnLast--;
        const poppedRisk = risksList[startIndex + itemsOnLast];
        lastPageH -= calcAccurateRowHeight(poppedRisk, startIndex + itemsOnLast, isWeb, fitToUse, photoCustomStyles, photoHeight, reportFontSize);
      }
      const spilled = sizes[sizes.length - 1] - itemsOnLast;
      if (spilled > 0) {
        sizes[sizes.length - 1] = itemsOnLast;
        sizes.push(spilled);
      }
    }
  }

  return sizes;
};
`;

lines.splice(rtcEnd + 1, 0, ...calcCode.split('\n'));
console.log('Inserted calcAccurateRowHeight and calcSmartWebPageSizes.');

let updatedContent = lines.join(eol);

// 3. Update WebReportEditor pagination & guaranteed all items & spillover
const oldWebReportStatePattern = /const \[internalPageSizes, setInternalPageSizes\] = useState\(\[\]\);[\s\S]*?const pages = \[\];\s*let startIndex = 0;\s*if \(pageSizes && pageSizes\.length > 0\) \{[\s\S]*?const totalPages = pages\.length;/;

const newWebReportStateCode = `const [internalPageSizes, setInternalPageSizes] = useState([]);
  const pageSizes = (controlledPageSizes && controlledPageSizes.length > 0) ? controlledPageSizes : internalPageSizes;
  const updatePageSizes = (newSizes) => {
    setInternalPageSizes(newSizes);
    if (typeof onPageSizesChange === 'function') {
      onPageSizesChange(newSizes);
    }
  };

  useEffect(() => {
    if (isCustomPagination) return;
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    const smartSizes = calcSmartWebPageSizes(assessment.risks, photoFit, photoCustomStyles, photoHeight, reportFontSize, true);
    updatePageSizes(smartSizes);
  }, [assessment?.risks?.length, photoFit, photoHeight, reportFontSize, isCustomPagination]);

  const spillOverToNextPage = (pageIndex) => {
    const newSizes = [...pageSizes];
    if (newSizes[pageIndex] <= 1) return;
    newSizes[pageIndex] -= 1;
    if (pageIndex + 1 < newSizes.length) {
      newSizes[pageIndex + 1] += 1;
    } else {
      newSizes.push(1);
    }
    updatePageSizes(newSizes.filter(s => s > 0));
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) return;

    if (delta === -1) {
      // Madde Eksiltme: Kalan madde sıradaki veya yeni açılan sayfaya aktarılır (hiçbir madde kaybolamaz!)
      if (newSizes[index] <= 1) return;
      newSizes[index] -= 1;
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] += 1;
      } else {
        newSizes.push(1);
      }
    } else if (delta === 1) {
      // Madde Artırma: Sıradaki sayfadan 1 madde alır
      if (index + 1 < newSizes.length) {
        newSizes[index] += 1;
        newSizes[index + 1] -= 1;
        if (newSizes[index + 1] <= 0) {
          newSizes.splice(index + 1, 1);
        }
      } else {
        return;
      }
    }

    const cleaned = newSizes.filter(s => s > 0);
    // Güvenlik Kilidi: Toplam madde sayısı daima tam korunur
    const currentSum = cleaned.reduce((a, b) => a + b, 0);
    if (currentSum < totalItems) {
      cleaned[cleaned.length - 1] += (totalItems - currentSum);
    }

    updatePageSizes(cleaned);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  const calculatedValidity = calculateValidityDate(assessment.createdAt, company.info.hazardClass);

  // Metot Ayarları
  const methodKey = assessment.method || 'MATRIX_L';
  const methodConfig = RISK_METHODS[methodKey] || RISK_METHODS['MATRIX_L'];
  const paramCount = methodConfig.fields.length;

  // --- SÜTUN GENİŞLİK HESAPLAMASI ---
  const widthNo = 1.5;
  const widthDept = 2.0;
  const widthAct = 3.0;
  const widthParam = 1.2;
  const widthScore = 1.5;
  const widthAff = 2.0;
  const widthResp = 4.0;
  const widthDate = 3.5;

  const totalFixed = widthNo + widthDept + widthAct + (widthParam * paramCount * 2) + (widthScore * 2) + widthAff + widthResp + widthDate;
  const remainingSpace = 100 - totalFixed;
  const textColWidth = (remainingSpace / 4);

  // --- BÜTÜN MADDELERİN KUSURSUZ SIRALANMASI VE GÖRÜNTÜLENMESİ GARANTİSİ ---
  const allRisks = assessment?.risks || [];
  const totalItemsCount = allRisks.length;

  let activeSizes = (pageSizes && pageSizes.length > 0)
    ? [...pageSizes]
    : calcSmartWebPageSizes(allRisks, photoFit, photoCustomStyles, photoHeight, reportFontSize, true);

  activeSizes = activeSizes.filter(s => typeof s === 'number' && s > 0);
  if (activeSizes.length === 0 && totalItemsCount > 0) activeSizes = [totalItemsCount];

  let sumSizes = activeSizes.reduce((a, b) => a + b, 0);
  if (sumSizes < totalItemsCount) {
    activeSizes[activeSizes.length - 1] += (totalItemsCount - sumSizes);
  } else if (sumSizes > totalItemsCount) {
    let excess = sumSizes - totalItemsCount;
    for (let i = activeSizes.length - 1; i >= 0 && excess > 0; i--) {
      const deduct = Math.min(activeSizes[i] - 1, excess);
      activeSizes[i] -= deduct;
      excess -= deduct;
    }
    activeSizes = activeSizes.filter(s => s > 0);
  }

  const pages = [];
  let startIndex = 0;
  for (let i = 0; i < activeSizes.length; i++) {
    const size = activeSizes[i];
    pages.push(allRisks.slice(startIndex, startIndex + size));
    startIndex += size;
  }
  if (startIndex < totalItemsCount) {
    if (pages.length > 0) pages[pages.length - 1] = pages[pages.length - 1].concat(allRisks.slice(startIndex));
    else pages.push(allRisks.slice(startIndex));
  }
  const totalPages = pages.length;`;

if (!oldWebReportStatePattern.test(updatedContent)) {
  console.error('Could not match oldWebReportStatePattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldWebReportStatePattern, newWebReportStateCode);
console.log('WebReportEditor bulletproof pagination updated.');

// 4. Update WebReportEditor pageBudget & capacity indicator calculation
const oldWebBudgetPattern = /const isPage1 = pageIdx === 0;\s*const isLastPage = pageIdx === totalPages - 1;\s*const headerH = isPage1 \? 130 : 35;[\s\S]*?const pageBudget = 794 - \(headerH \+ footerH \+ paddingH \+ theadH \+ legendH\);/;

const newWebBudgetCode = `const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 110 : 25;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 60 : 45);
        const legendH = isLastPage ? 85 : 0; // Son Sayfa Metodoloji Lejantı Bütçesi
        const paddingH = 45; // 6mm üst + 6mm alt = 12mm = 45px
        const theadH = 24;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH + legendH);`;

if (oldWebBudgetPattern.test(updatedContent)) {
  updatedContent = updatedContent.replace(oldWebBudgetPattern, newWebBudgetCode);
  console.log('WebReportEditor pageBudget updated.');
}

// 5. Update WebReportEditor row calculation to use calcAccurateRowHeight & update symbiotic scaling
const oldWebRowH = /totalH \+= \(topicH \+ photoH \+ descH \+ hazardH \+ precH \+ 40\);/;
if (oldWebRowH.test(updatedContent)) {
  updatedContent = updatedContent.replace(oldWebRowH, `totalH += calcAccurateRowHeight(r, itemNum - 1, true, photoFit, photoCustomStyles, photoHeight, reportFontSize);`);
  console.log('WebReportEditor totalH row calc updated to calcAccurateRowHeight.');
}

// 6. Update SahaZiyaretEditor: Bulletproof pagination, all items guarantee, persistent headers and signatures
const oldSahaStatePattern = /const \[internalPageSizes, setInternalPageSizes\] = useState\(\[\]\);[\s\S]*?const pages = \[\];\s*let startIndex = 0;\s*if \(pageSizes && pageSizes\.length > 0\) \{[\s\S]*?pages\.push\(assessment\.risks\.slice\(i, i \+ limit\)\);\s*\}\s*\}/;

const newSahaStateCode = `const [internalPageSizes, setInternalPageSizes] = useState([]);
  const pageSizes = (controlledPageSizes && controlledPageSizes.length > 0) ? controlledPageSizes : internalPageSizes;
  const updatePageSizes = (newSizes) => {
    setInternalPageSizes(newSizes);
    if (typeof onPageSizesChange === 'function') {
      onPageSizesChange(newSizes);
    }
  };

  useEffect(() => {
    if (isCustomPagination) return;
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    const smartSizes = calcSmartWebPageSizes(assessment.risks, photoFit, photoCustomStyles, photoHeight, reportFontSize, false);
    updatePageSizes(smartSizes);
  }, [assessment?.risks?.length, photoFit, photoHeight, reportFontSize, isCustomPagination]);

  const spillOverToNextPage = (pageIndex) => {
    const newSizes = [...pageSizes];
    if (newSizes[pageIndex] <= 1) return;
    newSizes[pageIndex] -= 1;
    if (pageIndex + 1 < newSizes.length) {
      newSizes[pageIndex + 1] += 1;
    } else {
      newSizes.push(1);
    }
    updatePageSizes(newSizes.filter(s => s > 0));
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) return;

    if (delta === -1) {
      // Madde Eksiltme: Kalan madde sıradaki veya yeni açılan sayfaya aktarılır (hiçbir madde kaybolamaz!)
      if (newSizes[index] <= 1) return;
      newSizes[index] -= 1;
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] += 1;
      } else {
        newSizes.push(1);
      }
    } else if (delta === 1) {
      // Madde Artırma: Sıradaki sayfadan 1 madde alır
      if (index + 1 < newSizes.length) {
        newSizes[index] += 1;
        newSizes[index + 1] -= 1;
        if (newSizes[index + 1] <= 0) {
          newSizes.splice(index + 1, 1);
        }
      } else {
        return;
      }
    }

    const cleaned = newSizes.filter(s => s > 0);
    // Güvenlik Kilidi: Toplam madde sayısı daima tam korunur
    const currentSum = cleaned.reduce((a, b) => a + b, 0);
    if (currentSum < totalItems) {
      cleaned[cleaned.length - 1] += (totalItems - currentSum);
    }

    updatePageSizes(cleaned);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  // --- BÜTÜN MADDELERİN KUSURSUZ SIRALANMASI VE GÖRÜNTÜLENMESİ GARANTİSİ ---
  const allRisks = assessment?.risks || [];
  const totalItemsCount = allRisks.length;

  let activeSizes = (pageSizes && pageSizes.length > 0)
    ? [...pageSizes]
    : calcSmartWebPageSizes(allRisks, photoFit, photoCustomStyles, photoHeight, reportFontSize, false);

  activeSizes = activeSizes.filter(s => typeof s === 'number' && s > 0);
  if (activeSizes.length === 0 && totalItemsCount > 0) activeSizes = [totalItemsCount];

  let sumSizes = activeSizes.reduce((a, b) => a + b, 0);
  if (sumSizes < totalItemsCount) {
    activeSizes[activeSizes.length - 1] += (totalItemsCount - sumSizes);
  } else if (sumSizes > totalItemsCount) {
    let excess = sumSizes - totalItemsCount;
    for (let i = activeSizes.length - 1; i >= 0 && excess > 0; i--) {
      const deduct = Math.min(activeSizes[i] - 1, excess);
      activeSizes[i] -= deduct;
      excess -= deduct;
    }
    activeSizes = activeSizes.filter(s => s > 0);
  }

  const pages = [];
  let startIndex = 0;
  for (let i = 0; i < activeSizes.length; i++) {
    const size = activeSizes[i];
    pages.push(allRisks.slice(startIndex, startIndex + size));
    startIndex += size;
  }
  if (startIndex < totalItemsCount) {
    if (pages.length > 0) pages[pages.length - 1] = pages[pages.length - 1].concat(allRisks.slice(startIndex));
    else pages.push(allRisks.slice(startIndex));
  }`;

if (!oldSahaStatePattern.test(updatedContent)) {
  console.error('Could not match oldSahaStatePattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldSahaStatePattern, newSahaStateCode);
console.log('SahaZiyaretEditor bulletproof pagination updated.');

// 7. Update SahaZiyaretEditor pageBudget & capacity indicator calculation
const oldSahaBudgetPattern = /\/\/ Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı \(Saha - A4 Dikey\)[\s\S]*?const pageBudget = 750;[\s\S]*?let totalH = 0;\s*pageRisks\.forEach\(\(r, idx\) => {[\s\S]*?const rowH = Math\.max\(pH > 0 \? \(pH \+ 20\) : 32, textH \+ 16\);\s*totalH \+= rowH;\s*\}\);/;

const newSahaBudgetCode = `// Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
          // Her sayfada tam üst başlık (~104px) ve imza alanı (~75px) sabit kaldığından net bütçe: 860px
          const headerH = 104;
          const footerH = 75;
          const paddingH = 75; // 10mm üst + 10mm alt = 20mm = ~75px
          const pageBudget = 1123 - (headerH + footerH + paddingH); // 864px net kullanılabilir alan
          const fontPt = parseFloat(reportFontSize) || 8;
          const fontPx = fontPt * 1.33;
          const lineH = fontPx * 1.15;

          let totalH = 0;
          pageRisks.forEach((r, idx) => {
            const itemNum = sumBefore + idx + 1;
            totalH += calcAccurateRowHeight(r, itemNum - 1, false, photoFit, photoCustomStyles, photoHeight, reportFontSize);
          });`;

if (!oldSahaBudgetPattern.test(updatedContent)) {
  console.error('Could not match oldSahaBudgetPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldSahaBudgetPattern, newSahaBudgetCode);
console.log('SahaZiyaretEditor pageBudget updated.');

// 8. Wrap <table className="report-table"> with <div className="saha-report-table-container flex-1 overflow-hidden">
const oldSahaTableJSX = `<div className="saha-report-page">
                <table className="report-table">`;

const newSahaTableJSX = `<div className="saha-report-page">
                {/* 1. ÜST KISIM & TABLO ALANI (Her sayfada üst başlık tam yer alır) */}
                <div className="saha-report-table-container flex-1 overflow-hidden">
                  <table className="report-table">`;

if (updatedContent.includes(oldSahaTableJSX)) {
  updatedContent = updatedContent.replace(oldSahaTableJSX, newSahaTableJSX);
}

const oldSahaFooterJSX = `                </table>
                <div className="saha-report-footer mt-auto flex-shrink-0">
                  <div className="page-footer-signature">
                    <div className="sig-box">İŞ GÜVENLİĞİ UZMANI<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{uzman}</span></div>
                    <div className="sig-box">İŞVEREN / İŞVEREN VEKİLİ<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{isveren}</span></div>
                  </div>
                  <div className="text-[8px] text-right mt-1 font-bold">Sayfa: {pageIdx + 1}</div>
                </div>`;

const newSahaFooterJSX = `                  </table>
                </div>
                {/* 2. HER SAYFADA SABİT VE NİZAMİ KALAN İMZA ALANI (En altta sabit, asla kesilmez) */}
                <div className="saha-report-footer mt-auto flex-shrink-0">
                  <div className="page-footer-signature">
                    <div className="sig-box">İŞ GÜVENLİĞİ UZMANI<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{uzman}</span></div>
                    <div className="sig-box">İŞVEREN / İŞVEREN VEKİLİ<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{isveren}</span></div>
                  </div>
                  <div className="text-[8px] text-right mt-1 font-bold">Sayfa: {pageIdx + 1} / {pages.length}</div>
                </div>`;

if (updatedContent.includes(oldSahaFooterJSX)) {
  updatedContent = updatedContent.replace(oldSahaFooterJSX, newSahaFooterJSX);
  console.log('Saha table container and persistent signature footer updated.');
}

// 9. Update handleSmartAutoPack budgets
const oldHandleSmartBudget = /const budgetPage1 = isWeb \? 420 : 650;\s*const budgetOtherPages = isWeb \? 510 : 650;\s*const legendBudgetH = isWeb \? 145 : 0;/;
const newHandleSmartBudget = `const budgetPage1 = isWeb ? 560 : 860;
    const budgetOtherPages = isWeb ? 645 : 860;
    const legendBudgetH = isWeb ? 85 : 0;`;

if (oldHandleSmartBudget.test(updatedContent)) {
  updatedContent = updatedContent.replace(oldHandleSmartBudget, newHandleSmartBudget);
  console.log('handleSmartAutoPack budgets updated.');
}

fs.writeFileSync(appPath, updatedContent, 'utf8');
console.log('MASTER BULLETPROOF PATCH APPLIED SUCCESSFULLY!');
