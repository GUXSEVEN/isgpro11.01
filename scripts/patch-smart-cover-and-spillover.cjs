const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> APPLYING SMART PHOTO COVER, AUTO-SPILLOVER & SPACE-FILL BALANCING <<<');

// 1. UPDATE handleSmartAutoPack IN AdvancedReportModal TO RESPECT photoFit === 'cover'
const oldAutoPackEstimate = `    // Plan 1: Simbiyotik Satır Yüksekliği Hesabı
    const getRowEstimatedH = (r, idx) => {
      const hasBefore = Boolean(r.beforePhoto);
      const hasAfter = Boolean(r.afterPhoto);
      const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
      const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;
      const maxChars = Math.max(
        (r.hazard?.length || 0),
        (r.risk?.length || 0),
        (r.precaution?.length || 0),
        (r.description?.length || 0)
      );

      let curDefaultPhotoH = photoHeight || (isWeb ? 45 : 80);
      // Metin uzunsa fotoğraf yüksekliğini hücreye akıllıca sığdır
      if (maxChars > 350) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 36 : 58);
      else if (maxChars > 220) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 42 : 68);

      const beforeH = hasBefore ? (photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH) : 0;
      const afterH = hasAfter ? (photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH) : 0;
      const pH = Math.max(beforeH, afterH);

      const charsPerCol = isWeb ? 27 : 25;
      const estLines = Math.max(1, Math.ceil(maxChars / charsPerCol));
      const textH = estLines * lineH;

      return Math.max(pH > 0 ? (pH + (isWeb ? 18 : 20)) : (isWeb ? 28 : 32), textH + (isWeb ? 14 : 16));
    };`;

const newAutoPackEstimate = `    // Plan 1: Simbiyotik ve "Doldur" Uyumlu Satır Yüksekliği Hesabı
    const isCover = photoFit === 'cover' || photoFit === 'full_width';
    const getRowEstimatedH = (r, idx) => {
      const hasBefore = Boolean(r.beforePhoto);
      const hasAfter = Boolean(r.afterPhoto);
      const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
      const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;
      const maxChars = Math.max(
        (r.hazard?.length || 0),
        (r.risk?.length || 0),
        (r.precaution?.length || 0),
        (r.description?.length || 0)
      );

      // Eğer kullanıcı "Doldur" seçtiyse fotoğrafın gerçek dolu yüksekliğini baz al
      let curDefaultPhotoH = photoHeight || (isCover ? (isWeb ? 72 : 95) : (isWeb ? 55 : 85));
      if (isCover) {
        curDefaultPhotoH = Math.max(isWeb ? 68 : 88, curDefaultPhotoH);
      } else {
        if (maxChars > 350) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 45 : 68);
        else if (maxChars > 220) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 52 : 78);
      }

      const beforeH = hasBefore ? (photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH) : 0;
      const afterH = hasAfter ? (photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH) : 0;
      const pH = Math.max(beforeH, afterH);

      const charsPerCol = isWeb ? 27 : 25;
      const estLines = Math.max(1, Math.ceil(maxChars / charsPerCol));
      const textH = estLines * lineH;

      return Math.max(pH > 0 ? (pH + (isWeb ? 18 : 20)) : (isWeb ? 28 : 32), textH + (isWeb ? 14 : 16));
    };`;

if (content.includes(oldAutoPackEstimate)) {
  content = content.replace(oldAutoPackEstimate, newAutoPackEstimate);
  console.log('✔ [1/4] handleSmartAutoPack now accounts for Doldur (cover) photo sizing');
} else {
  console.error('❌ Could not match oldAutoPackEstimate');
}

// 2. ADD spillOverToNextPage TO WebReportEditor
const oldWebAdjust = `  const adjustPageSizes = (index, delta) => {`;
const newWebAdjust = `  const spillOverToNextPage = (pageIndex) => {
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

  const adjustPageSizes = (index, delta) => {`;

if (content.includes(oldWebAdjust)) {
  content = content.replace(oldWebAdjust, newWebAdjust);
  console.log('✔ [2a/4] spillOverToNextPage added to WebReportEditor');
} else {
  console.error('❌ Could not match oldWebAdjust in WebReportEditor');
}

// 3. UPDATE WebReportEditor SPACE-FILL BALANCE AND SPILLOVER BUTTON
const oldWebRowSymbiosis = `                      // Plan 1: Simbiyotik Dengeleyici (Metin yoğunluğuna göre fotoğraf ve font ölçekleme)
                      const maxRowChars = Math.max(
                        (r.hazard?.length || 0),
                        (r.risk?.length || 0),
                        (r.precaution?.length || 0),
                        (r.description?.length || 0)
                      );
                      let symbioticPhotoH = photoHeight || 45;
                      if (maxRowChars > 350) symbioticPhotoH = Math.min(symbioticPhotoH, 36);
                      else if (maxRowChars > 220) symbioticPhotoH = Math.min(symbioticPhotoH, 42);
                      const effectivePhotoH = Math.max(25, Math.round(symbioticPhotoH * autoFitScale));

                      let symbioticTextFont = reportFontSize;
                      if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.75pt)\`;
                      } else if (maxRowChars > 220) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.4pt)\`;
                      }`;

const newWebRowSymbiosis = `                      // Plan 1: Simbiyotik Dengeleyici & Az Maddeli Sayfaları Doldurma
                      const maxRowChars = Math.max(
                        (r.hazard?.length || 0),
                        (r.risk?.length || 0),
                        (r.precaution?.length || 0),
                        (r.description?.length || 0)
                      );
                      const isCover = photoFit === 'cover' || photoFit === 'full_width';
                      let symbioticPhotoH = photoHeight || (isCover ? 72 : 52);
                      if (isCover) {
                        symbioticPhotoH = Math.max(65, symbioticPhotoH);
                      } else {
                        if (maxRowChars > 350) symbioticPhotoH = Math.min(symbioticPhotoH, 46);
                        else if (maxRowChars > 220) symbioticPhotoH = Math.min(symbioticPhotoH, 50);
                      }

                      // Seyrek sayfa doldurma bonusu (sayfa boş kalmasın)
                      if (pageRisks.length === 1) symbioticPhotoH = Math.min(125, symbioticPhotoH + 35);
                      else if (pageRisks.length === 2) symbioticPhotoH = Math.min(100, symbioticPhotoH + 18);

                      const effectivePhotoH = Math.max(35, Math.round(symbioticPhotoH * autoFitScale));

                      let symbioticTextFont = reportFontSize;
                      if (pageRisks.length === 1 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.2pt)\`;
                      } else if (pageRisks.length === 2 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.6pt)\`;
                      } else if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.5pt)\`;
                      }`;

if (content.includes(oldWebRowSymbiosis)) {
  content = content.replace(oldWebRowSymbiosis, newWebRowSymbiosis);
  console.log('✔ [2b/4] WebReportEditor space-fill balance & cover photo sizing applied');
} else {
  console.error('❌ Could not match oldWebRowSymbiosis');
}

// Replace WebReportEditor spillover button
const oldWebSpillBtn = `                {/* Taşma Halinde Hızlı Düzeltme Butonu */}
                {isOverflow && (
                  <button
                    type="button"
                    onClick={() => adjustPageSizes(pageIdx, -1)}
                    disabled={pageRisks.length <= 1}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                    title="Bu sayfadan 1 maddeyi sonraki sayfaya aktararak taşmayı anında gider"
                  >
                    <span>⚡ 1 Madde Kaydır</span>
                  </button>
                )}`;

const newWebSpillBtn = `                {/* Taşma Halinde Hızlı Düzeltme & Yeni Sayfaya Aktarma Butonu */}
                {isOverflow && (
                  <button
                    type="button"
                    onClick={() => spillOverToNextPage(pageIdx)}
                    disabled={pageRisks.length <= 1}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                    title={pageIdx === pageSizes.length - 1 ? "Taşan son maddeyi yeni sayfaya aktararak sıralamayı korur" : "Taşan maddeyi sonraki sayfaya aktar"}
                  >
                    <span>⚡ {pageIdx === pageSizes.length - 1 ? 'Yeni Sayfaya Aktar' : '1 Madde Kaydır'}</span>
                  </button>
                )}`;

if (content.includes(oldWebSpillBtn)) {
  content = content.replace(oldWebSpillBtn, newWebSpillBtn);
  console.log('✔ [2c/4] WebReportEditor spillover button updated with new page creation support');
} else {
  console.error('❌ Could not match oldWebSpillBtn');
}

// 4. UPDATE SahaZiyaretEditor WITH spillOverToNextPage & SPACE-FILL
const oldSahaAdjust = `const SahaZiyaretEditor = ({`;
const targetInsideSaha = `  const adjustPageSizes = (index, delta) => {`;
const sahaIdx = content.indexOf(targetInsideSaha, content.indexOf(oldSahaAdjust));

if (sahaIdx !== -1) {
  const sahaSpillCode = `  const spillOverToNextPage = (pageIndex) => {
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

`;
  content = content.slice(0, sahaIdx) + sahaSpillCode + content.slice(sahaIdx);
  console.log('✔ [3a/4] spillOverToNextPage added to SahaZiyaretEditor');
} else {
  console.error('❌ Could not match adjustPageSizes in SahaZiyaretEditor');
}

const oldSahaRowSymbiosis = `                      // Plan 1: Simbiyotik Dengeleyici
                      const maxRowChars = Math.max((risk.hazard?.length || 0), (risk.precaution?.length || 0), (risk.description?.length || 0));
                      let symbioticPhotoH = photoHeight || 80;
                      if (maxRowChars > 350) symbioticPhotoH = Math.min(symbioticPhotoH, 55);
                      else if (maxRowChars > 200) symbioticPhotoH = Math.min(symbioticPhotoH, 68);
                      const effectivePhotoH = Math.max(35, Math.round(symbioticPhotoH * autoFitScale));

                      let symbioticTextFont = reportFontSize;
                      if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.75pt)\`;
                      } else if (maxRowChars > 200) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.4pt)\`;
                      }`;

const newSahaRowSymbiosis = `                      // Plan 1: Simbiyotik Dengeleyici & Az Maddeli Sayfaları Doldurma
                      const maxRowChars = Math.max((risk.hazard?.length || 0), (risk.precaution?.length || 0), (risk.description?.length || 0));
                      const isCover = photoFit === 'cover' || photoFit === 'full_width';
                      let symbioticPhotoH = photoHeight || (isCover ? 95 : 75);
                      if (isCover) {
                        symbioticPhotoH = Math.max(85, symbioticPhotoH);
                      } else {
                        if (maxRowChars > 350) symbioticPhotoH = Math.min(symbioticPhotoH, 68);
                        else if (maxRowChars > 200) symbioticPhotoH = Math.min(symbioticPhotoH, 75);
                      }

                      if (pageRisks.length === 1) symbioticPhotoH = Math.min(145, symbioticPhotoH + 40);
                      else if (pageRisks.length === 2) symbioticPhotoH = Math.min(115, symbioticPhotoH + 20);

                      const effectivePhotoH = Math.max(45, Math.round(symbioticPhotoH * autoFitScale));

                      let symbioticTextFont = reportFontSize;
                      if (pageRisks.length === 1 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 1.2pt)\`;
                      } else if (pageRisks.length === 2 && !isOverflow) {
                        symbioticTextFont = \`calc(\${reportFontSize} + 0.6pt)\`;
                      } else if (maxRowChars > 350) {
                        symbioticTextFont = \`calc(\${reportFontSize} - 0.5pt)\`;
                      }`;

if (content.includes(oldSahaRowSymbiosis)) {
  content = content.replace(oldSahaRowSymbiosis, newSahaRowSymbiosis);
  console.log('✔ [3b/4] SahaZiyaretEditor space-fill balance & cover photo sizing applied');
} else {
  console.error('❌ Could not match oldSahaRowSymbiosis');
}

// Replace Saha spillover button
const oldSahaSpillBtn = `                  {/* Taşma Halinde Hızlı Düzeltme Butonu */}
                  {isOverflow && (
                    <button
                      type="button"
                      onClick={() => adjustPageSizes(pageIdx, -1)}
                      disabled={pageRisks.length <= 1}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                      title="Bu sayfadan 1 maddeyi sonraki sayfaya aktararak taşmayı anında gider"
                    >
                      <span>⚡ 1 Madde Kaydır</span>
                    </button>
                  )}`;

const newSahaSpillBtn = `                  {/* Taşma Halinde Hızlı Düzeltme & Yeni Sayfaya Aktarma Butonu */}
                  {isOverflow && (
                    <button
                      type="button"
                      onClick={() => spillOverToNextPage(pageIdx)}
                      disabled={pageRisks.length <= 1}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                      title={pageIdx === pageSizes.length - 1 ? "Taşan son maddeyi yeni sayfaya aktararak sıralamayı korur" : "Taşan maddeyi sonraki sayfaya aktar"}
                    >
                      <span>⚡ {pageIdx === pageSizes.length - 1 ? 'Yeni Sayfaya Aktar' : '1 Madde Kaydır'}</span>
                    </button>
                  )}`;

if (content.includes(oldSahaSpillBtn)) {
  content = content.replace(oldSahaSpillBtn, newSahaSpillBtn);
  console.log('✔ [3c/4] SahaZiyaretEditor spillover button updated with new page creation support');
} else {
  console.error('❌ Could not match oldSahaSpillBtn');
}

// 4. UPDATE ReportPhotoCell FOR BEAUTIFUL COVER AND FILL
const oldPhotoCellImg = `      <img
        src={cleanSrc}
        alt={label}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: currentFit === 'full_width' ? 'auto' : '100%',
          maxHeight: '100%',
          objectFit: currentFit === 'full_width' ? 'contain' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
          display: 'block'
        }}
      />`;

const newPhotoCellImg = `      <img
        src={cleanSrc}
        alt={label}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: currentFit === 'full_width' ? 'auto' : '100%',
          maxHeight: currentFit === 'full_width' ? '280px' : '100%',
          objectFit: currentFit === 'full_width' ? 'cover' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
          display: 'block'
        }}
      />`;

if (content.includes(oldPhotoCellImg)) {
  content = content.replace(oldPhotoCellImg, newPhotoCellImg);
  console.log('✔ [4/4] ReportPhotoCell image fit updated for crisp cover rendering');
} else {
  console.error('❌ Could not match oldPhotoCellImg');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> ALL UPGRADES COMPLETED SUCCESSFULLY! <<<');
