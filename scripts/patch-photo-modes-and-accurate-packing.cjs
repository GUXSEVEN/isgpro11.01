const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Determine line endings
const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = content.split(/\r?\n/);

console.log('Total lines in App.jsx:', lines.length);

// =========================================================================
// 1. UPDATE ReportPhotoCell: distinct visual styles for contain, cover, full_width
// =========================================================================
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

  // Hem onUpdateCustomStyle hem onUpdatePhotoStyle desteklenir
  const updateFn = onUpdateCustomStyle || onUpdatePhotoStyle;

  const custom = customStyles?.[photoKey] || {};
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');
  const currentAlignX = custom.alignX !== undefined ? custom.alignX : (photoAlignX || 'center');

  // Kullanıcı manuel düzenlemelerinde 30px ile 260px arasında tam serbesttir
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

  // Modlara göre belirgin görsel stiller
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
        overflow: 'visible', // Araç çubuğunun kesilmesini önler
        boxSizing: 'border-box',
        marginBottom: '2px'
      }}
    >
      {/* Görsel Kutusu */}
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
            // Tam Geniş: Hücrenin tüm genişliğini kaplar, yükseklik doğal orantıyla uzar
            // Doldur: Kutunun tüm alanını kenardan kenara kaplar
            // Sığdır: Orijinal en-boy oranını bozmadan kutuya tam sığar
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

      {/* CANLI DÜZENLEME ARAÇ ÇUBUĞU (Hover Anında Açılır, Çıktılarda no-print İle Gizlenir) */}
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

        {/* 3 Görünüm Modu Butonu: Sığdır / Doldur / Tam Geniş */}
        <button
          type="button"
          onClick={(e) => handleSetFit('contain', e)}
          className={\`px-1 py-0.5 rounded font-bold text-[8px] transition-colors cursor-pointer \${isContain ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
          title="Sığdır: En-boy oranını koruyarak kutuya sığdırır"
        >
          ⊡ Sığdır
        </button>

        <button
          type="button"
          onClick={(e) => handleSetFit('cover', e)}
          className={\`px-1 py-0.5 rounded font-bold text-[8px] transition-colors cursor-pointer \${isCover ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
          title="Doldur: Hücre kutusunu tam kaplar"
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

        {/* Dikey & Yatay Hizalama */}
        <button
          type="button"
          onClick={handleToggleAlignY}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-amber-300 transition-colors cursor-pointer"
          title={\`Dikey Hizalama: \${currentAlign === 'top' ? 'Üste Yasla' : currentAlign === 'bottom' ? 'Alta Yasla' : 'Ortala'}\`}
        >
          {currentAlign === 'top' ? '⬆ Üst' : currentAlign === 'bottom' ? '⬇ Alt' : '⏺ Dikey'}
        </button>

        <button
          type="button"
          onClick={handleToggleAlignX}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold text-[8px] text-cyan-300 transition-colors cursor-pointer"
          title={\`Yatay Hizalama: \${currentAlignX === 'left' ? 'Sola Yasla' : currentAlignX === 'right' ? 'Sağa Yasla' : 'Ortala'}\`}
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
          title="Bu fotoğrafı sıfırla (Geri Al)"
        >
          ↺ Sıfırla
        </button>
      </div>

      {/* Alt Bilgi Rozeti (Hover Anında) */}
      <div className="no-print absolute bottom-0.5 left-1 z-10 opacity-0 group-hover:opacity-85 transition-opacity text-[7px] text-slate-700 bg-white/95 px-1 rounded shadow-xs pointer-events-none font-mono">
        {currentFit} • {isFullWidth ? 'Tam Geniş' : \`\${currentHeight}px\`} {currentRotate ? \`• \${currentRotate}°\` : ''}
      </div>
    </div>
  );
}`;

lines.splice(rpcStart, rpcEnd - rpcStart + 1, ...newReportPhotoCellCode.split('\n'));
console.log('ReportPhotoCell replaced successfully with 3 distinct modes.');

let updatedContent = lines.join(eol);

// =========================================================================
// 2. UPDATE calcAccurateRowHeight: realistic charsPerLine and column heights
// =========================================================================
const oldRowCalcPattern = /export const calcAccurateRowHeight = \(r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt'\) => {[\s\S]*?return Math\.max\(col3H, col5H, col9H, col12H, 36\);\s*};/;

const newRowCalcCode = `export const calcAccurateRowHeight = (r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt') => {
  const fontPt = parseFloat(reportFontSize) || 8;
  const fontPx = fontPt * 1.33;
  const lineH = fontPx * 1.15;
  // A4 Yatay tabloda 14% sütun genişliği (~150px) 8pt font ile ~32 karakter alır. Saha raporunda (~210px) ~38 karakter alır.
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

  // Sütun 3: Mevcut Durum (Konu başlığı + Fotoğraf + Açıklama)
  const topicH = r.topic ? (fontPx + 6) : 0;
  const descChars = (r.description || '').trim().length;
  const descLines = descChars > 0 ? Math.max(1, Math.ceil(descChars / charsPerLine)) : 0;
  const descH = descLines * lineH;
  const col3H = topicH + beforePhotoH + descH + (beforePhotoH > 0 && descH > 0 ? 8 : 4);

  // Sütun 5: Tehlike ve Risk
  const hazardChars = (r.hazard || '').trim().length;
  const riskChars = (r.risk || '').trim().length;
  const hazardLines = hazardChars > 0 ? Math.max(1, Math.ceil(hazardChars / charsPerLine)) : 0;
  const riskLines = riskChars > 0 ? Math.max(1, Math.ceil(riskChars / charsPerLine)) : 0;
  const col5H = ((hazardLines + riskLines) * lineH) + 10;

  // Sütun 9: Önlemler
  const precChars = (r.precaution || '').trim().length;
  const precLines = precChars > 0 ? Math.max(1, Math.ceil(precChars / charsPerLine)) : 0;
  const col9H = (precLines * lineH) + 8;

  // Sütun 12: DÖF Sonrası
  const col12H = afterPhotoH + (r.postScore ? 20 : 0) + 6;

  // Satır yüksekliği: En yüksek hücre belirler (Gerçekçi A4 boyutu)
  return Math.max(col3H, col5H, col9H, col12H, 32);
};`;

if (!oldRowCalcPattern.test(updatedContent)) {
  console.error('Could not match oldRowCalcPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldRowCalcPattern, newRowCalcCode);
console.log('calcAccurateRowHeight updated successfully.');

// =========================================================================
// 3. UPDATE calcSmartWebPageSizes: realistic budgets and maximum page packing
// =========================================================================
const oldSmartSizesPattern = /export const calcSmartWebPageSizes = \(risksList, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt', isWeb = true\) => {[\s\S]*?return sizes;\s*};/;

const newSmartSizesCode = `export const calcSmartWebPageSizes = (risksList, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt', isWeb = true) => {
  if (!risksList || risksList.length === 0) return [];

  // A4 Net Doğru Bütçeleri:
  // Web (A4 Yatay, 794px): Sayfa 1 net tablo bütçesi: 560px. Ara Sayfalar net tablo bütçesi: 645px.
  // Son Sayfa Lejant Tablosu: 85px.
  // Saha (A4 Dikey, 1123px): Sayfa 1 net tablo bütçesi: 890px. Ara Sayfalar net tablo bütçesi: 960px.
  const budgetPage1 = isWeb ? 560 : 890;
  const budgetOtherPages = isWeb ? 645 : 960;
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
  // Son sayfadaki maddelerin toplam yüksekliği + 85px lejant bütçesini aşıyorsa,
  // sadece gereken minimum maddeyi bir sonraki sayfaya aktar.
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
};`;

if (!oldSmartSizesPattern.test(updatedContent)) {
  console.error('Could not match oldSmartSizesPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldSmartSizesPattern, newSmartSizesCode);
console.log('calcSmartWebPageSizes updated successfully.');

// =========================================================================
// 4. UPDATE WebReportEditor pageBudget & capacity indicator calculation
// =========================================================================
const oldWebBudgetPattern = /const isPage1 = pageIdx === 0;\s*const isLastPage = pageIdx === totalPages - 1;\s*const headerH = isPage1 \? 130 : 35;\s*const footerH = signatureStyle === 'hide' \? 20 : \(signatureStyle === 'standard' \? 70 : 55\);\s*const legendH = isLastPage \? 145 : 0;[\s\S]*?const pageBudget = 794 - \(headerH \+ footerH \+ paddingH \+ theadH \+ legendH\);/;

const newWebBudgetCode = `const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 110 : 25;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 60 : 45);
        const legendH = isLastPage ? 85 : 0; // Son Sayfa Metodoloji Lejantı Bütçesi
        const paddingH = 45; // 6mm üst + 6mm alt = 12mm = 45px
        const theadH = 24;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH + legendH);`;

if (!oldWebBudgetPattern.test(updatedContent)) {
  console.error('Could not match oldWebBudgetPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldWebBudgetPattern, newWebBudgetCode);
console.log('WebReportEditor pageBudget updated successfully.');

// =========================================================================
// 5. UPDATE SahaZiyaretEditor pageBudget & capacity indicator calculation
// =========================================================================
const oldSahaBudgetPattern = /\/\/ Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı \(Saha - A4 Dikey\)\s*const pageBudget = 750;[\s\S]*?let totalH = 0;\s*pageRisks\.forEach\(\(r, idx\) => {[\s\S]*?const rowH = Math\.max\(pH > 0 \? \(pH \+ 20\) : 32, textH \+ 16\);\s*totalH \+= rowH;\s*\}\);/;

const newSahaBudgetCode = `// Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
          const isPage1 = pageIdx === 0;
          const headerH = isPage1 ? 105 : 30;
          const footerH = 45;
          const paddingH = 45;
          const theadH = 26;
          const pageBudget = 1123 - (headerH + footerH + paddingH + theadH); // 885px - 960px net kullanılabilir alan
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
console.log('SahaZiyaretEditor pageBudget updated successfully.');

// =========================================================================
// 6. UPDATE handleSmartAutoPack budgets
// =========================================================================
const oldHandleSmartBudgetPattern = /const budgetPage1 = isWeb \? 420 : 650;\s*const budgetOtherPages = isWeb \? 510 : 650;\s*const legendBudgetH = isWeb \? 145 : 0;/;
const newHandleSmartBudgetCode = `const budgetPage1 = isWeb ? 560 : 890;
    const budgetOtherPages = isWeb ? 645 : 960;
    const legendBudgetH = isWeb ? 85 : 0;`;

if (!oldHandleSmartBudgetPattern.test(updatedContent)) {
  console.error('Could not match oldHandleSmartBudgetPattern');
  process.exit(1);
}
updatedContent = updatedContent.replace(oldHandleSmartBudgetPattern, newHandleSmartBudgetCode);
console.log('handleSmartAutoPack budgets updated successfully.');

fs.writeFileSync(appPath, updatedContent, 'utf8');
console.log('ALL PATCHES APPLIED SUCCESSFULLY!');
