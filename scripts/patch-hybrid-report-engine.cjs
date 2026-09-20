const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> STARTING HYBRID REPORT ENGINE PATCH (All 5 Plans Combined) <<<');

// 1. REPORT PHOTO CELL: FLEX PHOTO CONSTRAINT (Plan 4)
const oldPhotoContainer = `    <div
      className={\`report-photo-cell-container group relative mx-auto overflow-hidden rounded bg-slate-50 border border-slate-200 transition-all \${className}\`}
      style={{
        height: currentFit === 'full_width' ? 'auto' : \`\${currentHeight}px\`,
        maxHeight: currentFit === 'full_width' ? '280px' : \`\${currentHeight}px\`,
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        alignItems: currentAlign === 'top' ? 'flex-start' : currentAlign === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        marginBottom: '2px'
      }}
    >
      <img
        src={cleanSrc}
        alt={label}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: currentFit === 'full_width' ? 'auto' : '100%',
          maxHeight: currentFit === 'full_width' ? '260px' : '100%',
          objectFit: currentFit === 'full_width' ? 'contain' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          display: 'block'
        }}
      />`;

const newPhotoContainer = `    <div
      className={\`report-photo-cell-container group relative mx-auto overflow-hidden rounded bg-slate-50 border border-slate-200 transition-all \${className}\`}
      style={{
        height: currentFit === 'full_width' ? 'auto' : \`\${currentHeight}px\`,
        maxHeight: currentFit === 'full_width' ? '240px' : \`\${currentHeight}px\`,
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

if (content.includes(oldPhotoContainer)) {
  content = content.replace(oldPhotoContainer, newPhotoContainer);
  console.log('✔ [1/4] ReportPhotoCell flex constraint & anti-clip applied');
} else {
  console.error('❌ Could not match oldPhotoContainer');
}

// 2. WEBREPORTEDITOR: SİMBİYOTİK DENGELEME & MİKRO-ÖLÇEKLEME (Plans 1, 2, 4)
// Replace WebReport page bar & calculation in WebReportEditor
const oldWebCalcStart = `              const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
              const isOverflow = capPercent > 102;
              const isTight = capPercent >= 95 && capPercent <= 102;`;

const newWebCalcStart = `              const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
              // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
              // Küçük taşmalarda (%100-%118) elemanları mikro oranda ölçekleyerek taşmayı otomatik yok et
              const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
              const isAutoFitted = autoFitScale < 1;
              const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
              const isOverflow = effectivePercent > 102;
              const isTight = effectivePercent >= 94 && effectivePercent <= 102;`;

if (content.includes(oldWebCalcStart)) {
  content = content.replace(oldWebCalcStart, newWebCalcStart);
  console.log('✔ [2a/4] WebReportEditor autoFitScale calculation added');
} else {
  console.error('❌ Could not match oldWebCalcStart');
}

// Replace badge text in WebReportEditor
const oldWebBadgeText = `                      <span>
                        %{capPercent} {isOverflow ? '(A4 Taşıyor!)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                      </span>`;

const newWebBadgeText = `                      <span>
                        %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                      </span>`;

if (content.includes(oldWebBadgeText)) {
  content = content.replace(oldWebBadgeText, newWebBadgeText);
  console.log('✔ [2b/4] WebReportEditor badge label updated');
} else {
  console.error('❌ Could not match oldWebBadgeText');
}

// Update WebReportEditor row mapping to apply symbiosis (Plan 1)
const oldWebRowStart = `                    {pageRisks.map((r, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const level = getDynamicRiskLevel(r.score, methodKey);
                      const postLevel = r.postScore ? getDynamicRiskLevel(r.postScore, methodKey) : null;
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';`;

const newWebRowStart = `                    {pageRisks.map((r, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const level = getDynamicRiskLevel(r.score, methodKey);
                      const postLevel = r.postScore ? getDynamicRiskLevel(r.postScore, methodKey) : null;
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';

                      // Plan 1: Simbiyotik Dengeleyici (Metin yoğunluğuna göre fotoğraf ve font ölçekleme)
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

if (content.includes(oldWebRowStart)) {
  content = content.replace(oldWebRowStart, newWebRowStart);
  console.log('✔ [2c/4] WebReportEditor symbiotic variables added');
} else {
  console.error('❌ Could not match oldWebRowStart');
}

// Replace photoHeight in WebReport beforePhoto
content = content.replace(
  'defaultHeight={photoHeight || 45}',
  'defaultHeight={effectivePhotoH}'
);
// Replace photoHeight in WebReport afterPhoto
content = content.replace(
  'defaultHeight={photoHeight || 45}',
  'defaultHeight={effectivePhotoH}'
);
console.log('✔ [2d/4] WebReportEditor photo calls updated with effectivePhotoH');

// Replace defaultFontSize in WebReport description, hazard, precaution
content = content.replace(
  'cellKey={`web-desc-${r.id || itemNumber}`}\n                                defaultFontSize={reportFontSize}',
  'cellKey={`web-desc-${r.id || itemNumber}`}\n                                defaultFontSize={symbioticTextFont}'
);
content = content.replace(
  'cellKey={`web-hazard-${r.id || itemNumber}`}\n                                defaultFontSize={reportFontSize}',
  'cellKey={`web-hazard-${r.id || itemNumber}`}\n                                defaultFontSize={symbioticTextFont}'
);
content = content.replace(
  'cellKey={`web-prec-${r.id || itemNumber}`}\n                                defaultFontSize={reportFontSize}',
  'cellKey={`web-prec-${r.id || itemNumber}`}\n                                defaultFontSize={symbioticTextFont}'
);
console.log('✔ [2e/4] WebReportEditor text cells updated with symbioticTextFont');

// 3. SAHA ZİYARET EDİTOR: SİMBİYOTİK DENGELEME & MİKRO-ÖLÇEKLEME
const oldSahaCalcStart = `                const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
                const isOverflow = capPercent > 102;
                const isTight = capPercent >= 95 && capPercent <= 102;`;

const newSahaCalcStart = `                const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
                // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
                const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
                const isAutoFitted = autoFitScale < 1;
                const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
                const isOverflow = effectivePercent > 102;
                const isTight = effectivePercent >= 94 && effectivePercent <= 102;`;

if (content.includes(oldSahaCalcStart)) {
  content = content.replace(oldSahaCalcStart, newSahaCalcStart);
  console.log('✔ [3a/4] SahaZiyaretEditor autoFitScale calculation added');
} else {
  console.error('❌ Could not match oldSahaCalcStart');
}

const oldSahaBadgeText = `                        <span>
                          %{capPercent} {isOverflow ? '(A4 Taşıyor!)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                        </span>`;

const newSahaBadgeText = `                        <span>
                          %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                        </span>`;

if (content.includes(oldSahaBadgeText)) {
  content = content.replace(oldSahaBadgeText, newSahaBadgeText);
  console.log('✔ [3b/4] SahaZiyaretEditor badge label updated');
} else {
  console.error('❌ Could not match oldSahaBadgeText');
}

const oldSahaRowStart = `                    {pageRisks.map((risk, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const initialStatus = risk.postScore ? { text: 'TAMAMLANDI', class: 'status-tamam' } : { text: 'İVEDİ', class: 'status-ivedi' };
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';`;

const newSahaRowStart = `                    {pageRisks.map((risk, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const initialStatus = risk.postScore ? { text: 'TAMAMLANDI', class: 'status-tamam' } : { text: 'İVEDİ', class: 'status-ivedi' };
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';

                      // Plan 1: Simbiyotik Dengeleyici
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

if (content.includes(oldSahaRowStart)) {
  content = content.replace(oldSahaRowStart, newSahaRowStart);
  console.log('✔ [3c/4] SahaZiyaretEditor symbiotic variables added');
} else {
  console.error('❌ Could not match oldSahaRowStart');
}

// Replace photoHeight in SahaZiyaret beforePhoto & afterPhoto
content = content.replace(
  'defaultHeight={photoHeight || 80}',
  'defaultHeight={effectivePhotoH}'
);
content = content.replace(
  'defaultHeight={photoHeight || 80}',
  'defaultHeight={effectivePhotoH}'
);
console.log('✔ [3d/4] SahaZiyaretEditor photo calls updated with effectivePhotoH');

// Replace defaultFontSize in SahaZiyaret text cells
content = content.replace(
  'cellKey={`saha-hazard-${risk.id || itemNumber}`}\n                                defaultFontSize={reportFontSize}',
  'cellKey={`saha-hazard-${risk.id || itemNumber}`}\n                                defaultFontSize={symbioticTextFont}'
);
content = content.replace(
  'cellKey={`saha-prec-${risk.id || itemNumber}`}\n                                defaultFontSize={reportFontSize}',
  'cellKey={`saha-prec-${risk.id || itemNumber}`}\n                                defaultFontSize={symbioticTextFont}'
);
console.log('✔ [3e/4] SahaZiyaretEditor text cells updated with symbioticTextFont');

// 4. ADVANCED REPORT MODAL: SMART AUTO-PACK V2 WITH SAFETY HEADROOM & AUTO-BALANCER (Plans 3 & 5)
const oldAutoPackMethod = `  // --- AKILLI A4 DAĞITICI FONKSİYONU ---
  const handleSmartAutoPack = () => {
    const risksList = risksToUse;
    if (!risksList || risksList.length === 0) {
      alert("Dağıtılacak risk/madde bulunamadı.");
      return;
    }

    const isWeb = reportType === 'web';
    const isSaha = reportType === 'ziyaret';

    if (!isWeb && !isSaha) {
      alert("Akıllı dağıtıcı sadece Web Raporu (A4 Yatay) ve Saha Takip Raporu (A4 Dikey) için geçerlidir.");
      return;
    }

    // A4 sayfa yükseklik bütçeleri (piksel cinsinden)
    // Web (Yatay): Sayfa 1 firma başlığıyla ~475px, Sonraki sayfalar ~565px
    // Saha (Dikey): Tüm sayfalar ~740px
    const budgetPage1 = isWeb ? 475 : 740;
    const budgetOtherPages = isWeb ? 565 : 740;

    const fontPt = parseFloat(reportFontSize) || 8;
    const fontPx = fontPt * 1.33;
    const lineH = fontPx * 1.2;

    const getRowEstimatedH = (r, idx) => {
      const hasBefore = Boolean(r.beforePhoto);
      const hasAfter = Boolean(r.afterPhoto);
      const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
      const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;
      const curDefaultPhotoH = photoHeight || (isWeb ? 45 : 80);
      const beforeH = hasBefore ? (photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH) : 0;
      const afterH = hasAfter ? (photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH) : 0;
      const pH = Math.max(beforeH, afterH);

      const charsPerCol = isWeb ? 28 : 26;
      const maxChars = Math.max(
        (r.hazard?.length || 0),
        (r.risk?.length || 0),
        (r.precaution?.length || 0),
        (r.description?.length || 0)
      );
      const estLines = Math.max(1, Math.ceil(maxChars / charsPerCol));
      const textH = estLines * lineH;

      return Math.max(pH > 0 ? (pH + (isWeb ? 18 : 20)) : (isWeb ? 28 : 32), textH + (isWeb ? 14 : 16));
    };

    const newSizes = [];
    let currentPageItemsCount = 0;
    let currentAccumulatedH = 0;
    let currentPageBudget = budgetPage1;

    for (let i = 0; i < risksList.length; i++) {
      const r = risksList[i];
      const rowH = getRowEstimatedH(r, i);

      // Eğer mevcut sayfada en az 1 madde varsa ve bir sonraki madde bütçeyi aşıyorsa:
      if (currentPageItemsCount > 0 && (currentAccumulatedH + rowH) > currentPageBudget) {
        newSizes.push(currentPageItemsCount);
        currentPageItemsCount = 1;
        currentAccumulatedH = rowH;
        currentPageBudget = budgetOtherPages;
      } else {
        currentPageItemsCount++;
        currentAccumulatedH += rowH;
      }
    }

    if (currentPageItemsCount > 0) {
      newSizes.push(currentPageItemsCount);
    }

    if (isWeb) {
      setWebPageSizes(newSizes);
    } else {
      setSahaPageSizes(newSizes);
    }
    setIsCustomPagination(true);

    const summaryStr = newSizes.map((s, idx) => \`Sayfa \${idx + 1}: \${s} madde\`).join(', ');
    alert(\`⚡ A4'e Akıllı Dağıtım Tamamlandı!\\n\\nToplam \${risksList.length} madde, A4 sayfalarında taşma olmayacak şekilde \${newSizes.length} sayfaya paylaştırıldı:\\n[ \${summaryStr} ]\`);
  };`;

const newAutoPackMethod = `  // --- HİBRİT AKILLI A4 DAĞITICI & DENGELEYİCİ (PLANS 1, 2, 3, 4, 5) ---
  const handleSmartAutoPack = () => {
    const risksList = risksToUse;
    if (!risksList || risksList.length === 0) {
      alert("Dağıtılacak risk/madde bulunamadı.");
      return;
    }

    const isWeb = reportType === 'web';
    const isSaha = reportType === 'ziyaret';

    if (!isWeb && !isSaha) {
      alert("Akıllı dağıtıcı sadece Web Raporu (A4 Yatay) ve Saha Takip Raporu (A4 Dikey) için geçerlidir.");
      return;
    }

    // Plan 3 & Safety Headroom: %14 güvenlik marjı bırakılarak hiçbir sayfa %100 sınırına dayanmaz.
    // Web (Yatay): Sayfa 1 net güvenli bütçe ~415px, Sonraki sayfalar ~500px
    // Saha (Dikey): Tüm sayfalar net güvenli bütçe ~650px
    const budgetPage1 = isWeb ? 415 : 650;
    const budgetOtherPages = isWeb ? 500 : 650;

    const fontPt = parseFloat(reportFontSize) || 8;
    const fontPx = fontPt * 1.33;
    const lineH = fontPx * 1.2;

    // Plan 1: Simbiyotik Satır Yüksekliği Hesabı
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
    };

    const newSizes = [];
    let currentPageItemsCount = 0;
    let currentAccumulatedH = 0;
    let currentPageBudget = budgetPage1;

    for (let i = 0; i < risksList.length; i++) {
      const r = risksList[i];
      const rowH = getRowEstimatedH(r, i);

      // Güvenli bütçe aşıldığında bir sonraki sayfaya aktar
      if (currentPageItemsCount > 0 && (currentAccumulatedH + rowH) > currentPageBudget) {
        newSizes.push(currentPageItemsCount);
        currentPageItemsCount = 1;
        currentAccumulatedH = rowH;
        currentPageBudget = budgetOtherPages;
      } else {
        currentPageItemsCount++;
        currentAccumulatedH += rowH;
      }
    }

    if (currentPageItemsCount > 0) {
      newSizes.push(currentPageItemsCount);
    }

    // Plan 5: Akıllı Sayfa Dengeleyici (Auto-Balancer)
    // Son sayfada yalnızca 1 madde kalıp önceki sayfalar aşırı doluysa, sayfalar arası yükü dengeli paylaştır
    if (newSizes.length >= 2) {
      const lastIdx = newSizes.length - 1;
      if (newSizes[lastIdx] === 1 && newSizes[lastIdx - 1] >= 3) {
        newSizes[lastIdx - 1] -= 1;
        newSizes[lastIdx] += 1;
      }
    }

    if (isWeb) {
      setWebPageSizes(newSizes);
    } else {
      setSahaPageSizes(newSizes);
    }
    setIsCustomPagination(true);

    const summaryStr = newSizes.map((s, idx) => \`Sayfa \${idx + 1}: \${s} madde\`).join(', ');
    alert(\`⚡ Hibrit A4 Akıllı Dağıtım Tamamlandı!\\n\\n• Metin-Fotoğraf Simbiyotik Dengelemesi devrede\\n• Güvenlik payı ve Sayfa Dengeleyicisi uygulandı\\n\\nToplam \${risksList.length} madde \${newSizes.length} sayfaya kusursuz paylaştırıldı:\\n[ \${summaryStr} ]\`);
  };`;

if (content.includes(oldAutoPackMethod)) {
  content = content.replace(oldAutoPackMethod, newAutoPackMethod);
  console.log('✔ [4/4] AdvancedReportModal handleSmartAutoPack upgraded with Hybrid Plans 1-5');
} else {
  console.error('❌ Could not match oldAutoPackMethod');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> ALL HYBRID UPGRADES APPLIED AND SAVED! <<<');
