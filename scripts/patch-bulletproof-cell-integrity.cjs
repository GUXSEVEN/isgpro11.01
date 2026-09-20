const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let code = fs.readFileSync(appPath, 'utf8');

console.log('Current code length:', code.length);

// 1. Insert calcAccurateRowHeight and calcSmartWebPageSizes right before WebReportEditor
const targetBeforeEditor = `const WebReportEditor = ({`;

const smartHelpers = `// ==========================================================================================
// HÜCRE BÜTÜNLÜĞÜ VE A4 SAYFA KAPASİTE HESAPLAMA MOTORU (HİÇBİR HÜCRE KESİLEMEZ)
// ==========================================================================================
export const calcAccurateRowHeight = (r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt') => {
  const fontPt = parseFloat(reportFontSize) || 8;
  const fontPx = fontPt * 1.33;
  const lineH = fontPx * 1.25;
  const charsPerLine = isWeb ? 22 : 24;

  const hasBefore = Boolean(r.beforePhoto);
  const hasAfter = Boolean(r.afterPhoto);
  const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
  const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;

  const maxPhotoClamp = isWeb ? 80 : 110;
  let basePhotoH = 48;
  if (fitToUse === 'full_width') basePhotoH = 75;
  else if (fitToUse === 'cover') basePhotoH = 70;
  else basePhotoH = 48;

  let curDefaultPhotoH = photoHeight || basePhotoH;
  if (fitToUse === 'cover' || fitToUse === 'full_width') {
    curDefaultPhotoH = Math.max(isWeb ? 65 : 85, curDefaultPhotoH);
  }
  curDefaultPhotoH = Math.min(curDefaultPhotoH, maxPhotoClamp);

  const beforePhotoH = hasBefore ? Math.min(photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH, maxPhotoClamp) : 0;
  const afterPhotoH = hasAfter ? Math.min(photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH, maxPhotoClamp) : 0;

  // Sütun 3: Mevcut Durum (Konu başlığı + Fotoğraf + Açıklama dikey alt alta!)
  const topicH = r.topic ? 20 : 0;
  const descChars = r.description?.length || 0;
  const descLines = descChars > 0 ? Math.max(1, Math.ceil(descChars / charsPerLine)) : 0;
  const descH = descLines * lineH;
  const col3H = topicH + beforePhotoH + descH + (beforePhotoH > 0 && descH > 0 ? 12 : 6);

  // Sütun 5: Tehlike ve Risk (Tehlike başlığı + Risk metni alt alta!)
  const hazardChars = r.hazard?.length || 0;
  const riskChars = r.risk?.length || 0;
  const hazardLines = hazardChars > 0 ? Math.max(1, Math.ceil(hazardChars / charsPerLine)) : 0;
  const riskLines = riskChars > 0 ? Math.max(1, Math.ceil(riskChars / charsPerLine)) : 0;
  const col5H = ((hazardLines + riskLines) * lineH) + 16;

  // Sütun 9: Önlemler
  const precChars = r.precaution?.length || 0;
  const precLines = precChars > 0 ? Math.max(1, Math.ceil(precChars / charsPerLine)) : 0;
  const col9H = (precLines * lineH) + 14;

  // Sütun 12: DÖF Sonrası
  const col12H = afterPhotoH + (r.postScore ? 22 : 0) + 8;

  // Satır yüksekliği: En yüksek hücre belirler (Hücre kesilmesini önleyen tavan koruması)
  return Math.max(col3H, col5H, col9H, col12H, 36);
};

export const calcSmartWebPageSizes = (risksList, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt', isWeb = true) => {
  if (!risksList || risksList.length === 0) return [];

  // A4 Yatay Bütçeleri (Net Güvenli Sınırlar)
  // Sayfa 1: 410px (Başlık 130px + İmza 55px + Padding 85px + Thead 30px = 300px, Kalan: 494px, Güvenli: 410px)
  // Ara Sayfalar: 480px (Başlık 35px + İmza 55px + Padding 85px + Thead 30px = 205px, Kalan: 589px, Güvenli: 480px)
  // Son Sayfa (Metodoloji Tablosu Olan Sayfa): 330px (145px Lejant Tablosu Düşülür!)
  const budgetPage1 = isWeb ? 410 : 650;
  const budgetOtherPages = isWeb ? 480 : 650;
  const legendBudgetH = isWeb ? 145 : 0;

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

  // Son Sayfa Metodoloji Lejantı Güvenlik Kontrolü:
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

  // Son sayfada tek madde kalıp bir önceki sayfa 3+ ise dengele
  if (sizes.length >= 2) {
    const lastIdx = sizes.length - 1;
    if (sizes[lastIdx] === 1 && sizes[lastIdx - 1] >= 3) {
      sizes[lastIdx - 1] -= 1;
      sizes[lastIdx] += 1;
    }
  }

  return sizes;
};

const WebReportEditor = ({`;

if (!code.includes(targetBeforeEditor)) {
  console.error('Could not find targetBeforeEditor');
  process.exit(1);
}
code = code.replace(targetBeforeEditor, smartHelpers);
console.log('Smart helpers inserted');

// 2. Update WebReportEditor useEffect to use calcSmartWebPageSizes by default
const oldWebEditorEffect = `  useEffect(() => {
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
  }, [assessment?.risks?.length, itemsPerPage, isCustomPagination]);`;

const newWebEditorEffect = `  useEffect(() => {
    if (isCustomPagination) return; // Do not overwrite custom per-page sizes!
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    // Otomatik Hücre Koruyucu: İlk açılışta veya değişiklikte sayfaları taşma yapmayacak şekilde akıllı dağıt
    const smartSizes = calcSmartWebPageSizes(assessment.risks, photoFit, photoCustomStyles, photoHeight, reportFontSize, true);
    updatePageSizes(smartSizes);
  }, [assessment?.risks?.length, photoFit, photoHeight, reportFontSize, isCustomPagination]);`;

if (!code.includes(oldWebEditorEffect)) {
  console.error('Could not find oldWebEditorEffect');
  process.exit(1);
}
code = code.replace(oldWebEditorEffect, newWebEditorEffect);
console.log('WebReportEditor useEffect updated');

// 3. Update fallback page calculation in WebReportEditor
const oldFallbackPages = `  const pages = [];
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
  }`;

const newFallbackPages = `  const pages = [];
  let startIndex = 0;
  let activeSizes = (pageSizes && pageSizes.length > 0) ? pageSizes : calcSmartWebPageSizes(assessment?.risks || [], photoFit, photoCustomStyles, photoHeight, reportFontSize, true);
  if (activeSizes && activeSizes.length > 0) {
    activeSizes.forEach(size => {
      pages.push(assessment.risks.slice(startIndex, startIndex + size));
      startIndex += size;
    });
  }`;

if (!code.includes(oldFallbackPages)) {
  console.error('Could not find oldFallbackPages');
  process.exit(1);
}
code = code.replace(oldFallbackPages, newFallbackPages);
console.log('Fallback pages calculation updated');

// 4. Update CSS in WebReportEditor so table container is overflow: visible and never slices rows
const oldWebEditorCss = `        .web-report-page {
            width: 297mm;
            min-width: 297mm;
            height: 209mm;
            min-height: 209mm;
            max-height: 209mm;
            background: white;
            padding: \${reportPadding};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: black;
            box-sizing: border-box !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
        }
        .web-report-header { flex-shrink: 0 !important; }
        .web-report-table-container { flex: 1 1 auto !important; overflow: hidden !important; }
        .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
        .web-report-page tr, .web-report-page td, .web-report-page th, .report-photo-cell-container, .print-cell-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
        }`;

const newWebEditorCss = `        .web-report-page {
            width: 297mm;
            min-width: 297mm;
            min-height: 209mm;
            background: white;
            padding: \${reportPadding};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: black;
            box-sizing: border-box !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
        }
        .web-report-header { flex-shrink: 0 !important; }
        .web-report-table-container { flex: 1 1 auto !important; overflow: visible !important; }
        .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
        .web-report-page table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .web-report-page tr, .web-report-page td, .web-report-page th, .report-photo-cell-container, .print-cell-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
        }`;

if (!code.includes(oldWebEditorCss)) {
  console.error('Could not find oldWebEditorCss');
  process.exit(1);
}
code = code.replace(oldWebEditorCss, newWebEditorCss);
console.log('CSS updated for cell integrity');

// 5. Update WebReportEditor totalH loop to use calcAccurateRowHeight
const oldTotalHLoop = `        let totalH = 0;
        pageRisks.forEach((r, idx) => {
          const itemNum = sumBefore + idx + 1;
          const beforeKey = \`web-before-\${r.id || itemNum}\`;
          const afterKey = \`web-after-\${r.id || itemNum}\`;
          const hasB = Boolean(r.beforePhoto);
          const hasA = Boolean(r.afterPhoto);

          // Fotoğraf moduna göre gerçekçi yükseklik
          const defaultH = photoHeight || (photoFit === 'full_width' ? 75 : (photoFit === 'cover' ? 70 : 48));
          let bH = hasB ? Math.min(80, (photoCustomStyles?.[beforeKey]?.height || defaultH)) : 0;
          let aH = hasA ? Math.min(80, (photoCustomStyles?.[afterKey]?.height || defaultH)) : 0;
          const pH = Math.max(bH, aH);

          const maxChars = Math.max(
            (r.hazard?.length || 0),
            (r.risk?.length || 0),
            (r.precaution?.length || 0),
            (r.description?.length || 0)
          );
          const estLines = Math.max(1, Math.ceil(maxChars / 28));
          const textH = estLines * lineH;
          const rowH = Math.max(pH > 0 ? (pH + 16) : 26, textH + 12);
          totalH += rowH;
        });`;

const newTotalHLoop = `        let totalH = 0;
        pageRisks.forEach((r, idx) => {
          const itemNum = sumBefore + idx + 1;
          totalH += calcAccurateRowHeight(r, itemNum - 1, true, photoFit, photoCustomStyles, photoHeight, reportFontSize);
        });`;

if (!code.includes(oldTotalHLoop)) {
  console.error('Could not find oldTotalHLoop');
  process.exit(1);
}
code = code.replace(oldTotalHLoop, newTotalHLoop);
console.log('totalH loop updated with calcAccurateRowHeight');

// 6. Update handleSmartAutoPack to directly call calcSmartWebPageSizes
const oldAutoPackBody = `    const newSizes = [];
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

    // Son Sayfa Metodoloji Kontrolü:
    // Web raporunda son sayfada 145px'lik metodoloji tablosu olacağı için, son sayfadaki maddeler
    // (budgetOtherPages - legendBudgetH)'ı aşıyorsa fazla maddeleri yeni sayfaya aktar!
    if (isWeb && newSizes.length > 0) {
      let startIndex = 0;
      for (let p = 0; p < newSizes.length - 1; p++) {
        startIndex += newSizes[p];
      }
      const lastPageRisks = risksList.slice(startIndex);
      let lastPageH = 0;
      lastPageRisks.forEach((r, idx) => {
        lastPageH += getRowEstimatedH(r, startIndex + idx);
      });
      const lastPageMaxBudget = (newSizes.length === 1 ? budgetPage1 : budgetOtherPages) - legendBudgetH;
      
      if (lastPageH > lastPageMaxBudget && newSizes[newSizes.length - 1] > 1) {
        let itemsOnLast = newSizes[newSizes.length - 1];
        while (lastPageH > lastPageMaxBudget && itemsOnLast > 1) {
          itemsOnLast--;
          const poppedRisk = risksList[startIndex + itemsOnLast];
          lastPageH -= getRowEstimatedH(poppedRisk, startIndex + itemsOnLast);
        }
        const spilled = newSizes[newSizes.length - 1] - itemsOnLast;
        if (spilled > 0) {
          newSizes[newSizes.length - 1] = itemsOnLast;
          newSizes.push(spilled);
        }
      }
    }

    // Akıllı Sayfa Dengeleyici (Auto-Balancer)
    if (newSizes.length >= 2) {
      const lastIdx = newSizes.length - 1;
      if (newSizes[lastIdx] === 1 && newSizes[lastIdx - 1] >= 3) {
        newSizes[lastIdx - 1] -= 1;
        newSizes[lastIdx] += 1;
      }
    }`;

const newAutoPackBody = `    const newSizes = calcSmartWebPageSizes(risksList, fitToUse, photoCustomStyles, photoHeight, reportFontSize, isWeb);`;

if (!code.includes(oldAutoPackBody)) {
  console.error('Could not find oldAutoPackBody');
  process.exit(1);
}
code = code.replace(oldAutoPackBody, newAutoPackBody);

// Also remove unused getRowEstimatedH inside handleSmartAutoPack if needed
const oldGetRowEstimatedH = `    const getRowEstimatedH = (r, idx) => {
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

      let curDefaultPhotoH = photoHeight || basePhotoH;
      if (fitToUse === 'cover' || fitToUse === 'full_width') {
        curDefaultPhotoH = Math.max(isWeb ? 65 : 85, curDefaultPhotoH);
      }
      curDefaultPhotoH = Math.min(curDefaultPhotoH, maxPhotoClamp);

      const beforeH = hasBefore ? Math.min(photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH, maxPhotoClamp) : 0;
      const afterH = hasAfter ? Math.min(photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH, maxPhotoClamp) : 0;
      const pH = Math.max(beforeH, afterH);

      const charsPerCol = isWeb ? 28 : 25;
      const estLines = Math.max(1, Math.ceil(maxChars / charsPerCol));
      const textH = estLines * lineH;

      return Math.max(pH > 0 ? (pH + (isWeb ? 16 : 20)) : (isWeb ? 26 : 30), textH + (isWeb ? 12 : 16));
    };`;

if (code.includes(oldGetRowEstimatedH)) {
  code = code.replace(oldGetRowEstimatedH, '// getRowEstimatedH replaced by calcAccurateRowHeight');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully updated App.jsx with bulletproof cell integrity engine! Length:', code.length);
