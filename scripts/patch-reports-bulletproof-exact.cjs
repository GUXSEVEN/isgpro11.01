const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
let lines = content.split(/\r?\n/);

console.log('App.jsx total lines:', lines.length);

// 1. Locate ReportPhotoCell
const rpcStart = lines.findIndex(l => l.startsWith('function ReportPhotoCell({'));
const rtcStart = lines.findIndex(l => l.startsWith('function ReportTextCell({'));
let rpcEnd = rtcStart - 1;
while (rpcEnd > rpcStart && lines[rpcEnd].trim() !== '}') {
  rpcEnd--;
}
console.log(`ReportPhotoCell lines: ${rpcStart + 1} to ${rpcEnd + 1}`);

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

lines.splice(rpcStart, rpcEnd - rpcStart + 1, ...newReportPhotoCell.split('\n'));
console.log('ReportPhotoCell replaced successfully.');

// 2. Insert calcAccurateRowHeight & calcSmartWebPageSizes right before WebReportEditor
const webEditorLine = lines.findIndex(l => l.startsWith('const WebReportEditor = ({'));
console.log(`WebReportEditor starts at line ${webEditorLine + 1}`);

const calcEngineCode = `
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

lines.splice(webEditorLine, 0, ...calcEngineCode.split('\n'));
console.log('Inserted calc engine before WebReportEditor.');

let wholeCode = lines.join(eol);

// 3. WebReportEditor: update useEffect and adjustPageSizes
const oldWebPaginationBlock = `  useEffect(() => {
    if (isCustomPagination) return; // Do not overwrite custom per-page sizes!
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    const sizes = [];
    let remaining = totalItems;
    while (remaining > 0) {
      sizes.push(Math.min(remaining, itemsPerPage));
      remaining -= itemsPerPage;
    }
    updatePageSizes(sizes);
  }, [assessment?.risks?.length, itemsPerPage, isCustomPagination]);

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
    const currentVal = newSizes[index];
    const newVal = currentVal + delta;

    if (newVal < 1) return;

    let sumBefore = 0;
    for (let i = 0; i < index; i++) {
      sumBefore += newSizes[i];
    }

    const totalItems = assessment?.risks?.length || 0;
    if (sumBefore + newVal > totalItems) return;

    newSizes[index] = newVal;

    let remaining = totalItems - (sumBefore + newVal);
    let nextIdx = index + 1;
    while (remaining > 0) {
      if (nextIdx < newSizes.length) {
        newSizes[nextIdx] = Math.min(remaining, itemsPerPage);
        remaining -= newSizes[nextIdx];
        nextIdx++;
      } else {
        const newPageSize = Math.min(remaining, itemsPerPage);
        newSizes.push(newPageSize);
        remaining -= newPageSize;
      }
    }
    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

const newWebPaginationBlock = `  useEffect(() => {
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
      // Madde Eksiltme: Kalan madde sıradaki veya yeni açılan sayfaya aktarılır (asla silinmez!)
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
  };`;

if (!wholeCode.includes(oldWebPaginationBlock)) {
  console.error('Could not find oldWebPaginationBlock');
  process.exit(1);
}
wholeCode = wholeCode.replace(oldWebPaginationBlock, newWebPaginationBlock);
console.log('WebReportEditor pagination block updated.');

// 4. WebReportEditor: update pages slicing (guarantee all items)
const oldWebPagesBlock = `  const pages = [];
  let startIndex = 0;
  if (pageSizes && pageSizes.length > 0) {
    pageSizes.forEach(size => {
      pages.push(assessment.risks.slice(startIndex, startIndex + size));
      startIndex += size;
    });
  } else {
    const limit = Number(itemsPerPage) || 3;
    for (let i = 0; i < assessment.risks.length; i += limit) {
      pages.push(assessment.risks.slice(i, i + limit));
    }
  }
  const totalPages = pages.length;`;

const newWebPagesBlock = `  // --- BÜTÜN MADDELERİN KUSURSUZ SIRALANMASI VE GÖRÜNTÜLENMESİ GARANTİSİ ---
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

if (!wholeCode.includes(oldWebPagesBlock)) {
  console.error('Could not find oldWebPagesBlock');
  process.exit(1);
}
wholeCode = wholeCode.replace(oldWebPagesBlock, newWebPagesBlock);
console.log('WebReportEditor pages slicing updated.');

// 5. WebReportEditor: update pageBudget & row calculation
const oldWebBudgetBlock = `        const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 130 : 35;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 70 : 55);
        const paddingH = 85;
        const theadH = 30;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH); // Net bütçe`;

const newWebBudgetBlock = `        const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 110 : 25;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 60 : 45);
        const legendH = isLastPage ? 85 : 0;
        const paddingH = 45;
        const theadH = 24;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH + legendH);`;

if (wholeCode.includes(oldWebBudgetBlock)) {
  wholeCode = wholeCode.replace(oldWebBudgetBlock, newWebBudgetBlock);
  console.log('WebReportEditor pageBudget updated.');
}

const oldWebRowHCalc = `totalH += (topicH + photoH + descH + hazardH + precH + 40);`;
if (wholeCode.includes(oldWebRowHCalc)) {
  wholeCode = wholeCode.replace(oldWebRowHCalc, `totalH += calcAccurateRowHeight(r, itemNum - 1, true, photoFit, photoCustomStyles, photoHeight, reportFontSize);`);
  console.log('WebReportEditor row calculation updated to calcAccurateRowHeight.');
}

// 6. SahaZiyaretEditor: update pagination block
const oldSahaPaginationBlock = `  useEffect(() => {
    if (isCustomPagination) return; // Do not overwrite custom per-page sizes!
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    const sizes = [];
    let remaining = totalItems;
    const limit = Number(itemsPerPage) || 5;
    while (remaining > 0) {
      sizes.push(Math.min(remaining, limit));
      remaining -= limit;
    }
    updatePageSizes(sizes);
  }, [assessment?.risks?.length, itemsPerPage, isCustomPagination]);

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
    const currentVal = newSizes[index];
    const newVal = currentVal + delta;

    if (newVal < 1) return;

    let sumBefore = 0;
    for (let i = 0; i < index; i++) {
      sumBefore += newSizes[i];
    }

    const totalItems = assessment?.risks?.length || 0;
    if (sumBefore + newVal > totalItems) return;

    newSizes[index] = newVal;

    const limit = Number(itemsPerPage) || 5;
    let remaining = totalItems - (sumBefore + newVal);
    let nextIdx = index + 1;
    while (remaining > 0) {
      if (nextIdx < newSizes.length) {
        newSizes[nextIdx] = Math.min(remaining, limit);
        remaining -= newSizes[nextIdx];
        nextIdx++;
      } else {
        const newPageSize = Math.min(remaining, limit);
        newSizes.push(newPageSize);
        remaining -= newPageSize;
      }
    }
    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

const newSahaPaginationBlock = `  useEffect(() => {
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
      // Madde Eksiltme: Kalan madde sıradaki veya yeni açılan sayfaya aktarılır (asla silinmez!)
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
  };`;

if (!wholeCode.includes(oldSahaPaginationBlock)) {
  console.error('Could not find oldSahaPaginationBlock');
  process.exit(1);
}
wholeCode = wholeCode.replace(oldSahaPaginationBlock, newSahaPaginationBlock);
console.log('SahaZiyaretEditor pagination block updated.');

// 7. SahaZiyaretEditor: update pages slicing (guarantee all items)
const oldSahaPagesBlock = `  const pages = [];
  let startIndex = 0;
  if (pageSizes && pageSizes.length > 0) {
    pageSizes.forEach(size => {
      pages.push(assessment.risks.slice(startIndex, startIndex + size));
      startIndex += size;
    });
  } else {
    const limit = Number(itemsPerPage) || 5;
    for (let i = 0; i < (assessment?.risks?.length || 0); i += limit) {
      pages.push(assessment.risks.slice(i, i + limit));
    }
  }`;

const newSahaPagesBlock = `  // --- BÜTÜN MADDELERİN KUSURSUZ SIRALANMASI VE GÖRÜNTÜLENMESİ GARANTİSİ ---
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

if (!wholeCode.includes(oldSahaPagesBlock)) {
  console.error('Could not find oldSahaPagesBlock');
  process.exit(1);
}
wholeCode = wholeCode.replace(oldSahaPagesBlock, newSahaPagesBlock);
console.log('SahaZiyaretEditor pages slicing updated.');

// 8. SahaZiyaretEditor: update pageBudget & row calculation
const oldSahaBudgetBlock = `          // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
          const pageBudget = 750; // Total 1122px - header 135px - sigs 85px - pad 76px - thead 35px
          const fontPt = parseFloat(reportFontSize) || 8;
          const fontPx = fontPt * 1.33;
          const lineH = fontPx * 1.2;

          let totalH = 0;
          pageRisks.forEach((r, idx) => {
            const itemNum = sumBefore + idx + 1;
            const beforeKey = \`saha-before-\${r.id || itemNum}\`;
            const afterKey = \`saha-after-\${r.id || itemNum}\`;
            const hasB = Boolean(r.beforePhoto);
            const hasA = Boolean(r.afterPhoto);
            const bH = hasB ? (photoCustomStyles?.[beforeKey]?.height || photoHeight || 80) : 0;
            const aH = hasA ? (photoCustomStyles?.[afterKey]?.height || photoHeight || 80) : 0;
            const pH = Math.max(bH, aH);

            const maxChars = Math.max((r.hazard?.length || 0), (r.precaution?.length || 0), (r.description?.length || 0));
            const estLines = Math.max(1, Math.ceil(maxChars / 26));
            const textH = estLines * lineH;

            const rowH = Math.max(pH > 0 ? (pH + 20) : 32, textH + 16);
            totalH += rowH;
          });`;

const newSahaBudgetBlock = `          // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
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

if (wholeCode.includes(oldSahaBudgetBlock)) {
  wholeCode = wholeCode.replace(oldSahaBudgetBlock, newSahaBudgetBlock);
  console.log('SahaZiyaretEditor pageBudget updated.');
}

// 9. SahaZiyaretEditor: table wrapper & persistent signature footer
const oldSahaTableJSX = `<div className="saha-report-page">
                <table className="report-table">`;

const newSahaTableJSX = `<div className="saha-report-page">
                {/* 1. ÜST KISIM & TABLO ALANI (Her sayfada üst başlık tam yer alır) */}
                <div className="saha-report-table-container flex-1 overflow-hidden">
                  <table className="report-table">`;

if (wholeCode.includes(oldSahaTableJSX)) {
  wholeCode = wholeCode.replace(oldSahaTableJSX, newSahaTableJSX);
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

if (wholeCode.includes(oldSahaFooterJSX)) {
  wholeCode = wholeCode.replace(oldSahaFooterJSX, newSahaFooterJSX);
  console.log('Saha table container and persistent signature footer updated.');
}

// 10. Update handleSmartAutoPack budgets
const oldHandleSmartBudget = `    const budgetPage1 = isWeb ? 420 : 650;
    const budgetOtherPages = isWeb ? 510 : 650;
    const legendBudgetH = isWeb ? 145 : 0;`;

const newHandleSmartBudget = `    const budgetPage1 = isWeb ? 560 : 860;
    const budgetOtherPages = isWeb ? 645 : 860;
    const legendBudgetH = isWeb ? 85 : 0;`;

if (wholeCode.includes(oldHandleSmartBudget)) {
  wholeCode = wholeCode.replace(oldHandleSmartBudget, newHandleSmartBudget);
  console.log('handleSmartAutoPack budgets updated.');
}

fs.writeFileSync(appPath, wholeCode, 'utf8');
console.log('EXACT BULLETPROOF PATCH COMPLETE! New length:', wholeCode.length);
