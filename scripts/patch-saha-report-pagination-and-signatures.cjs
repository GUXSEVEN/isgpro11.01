const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// =========================================================================
// 1. UPDATE calcAccurateRowHeight: tailored for both Web and Saha columns
// =========================================================================
const oldRowCalcPattern = /export const calcAccurateRowHeight = \(r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt'\) => {[\s\S]*?return Math\.max\(col3H, col5H, col9H, col12H, 32\);\s*};/;

const newRowCalcCode = `export const calcAccurateRowHeight = (r, idx, isWeb = true, fitToUse = 'contain', photoCustomStyles = {}, photoHeight = 45, reportFontSize = '8pt') => {
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
    // Sütun 3 = Fotoğraf + İlgili Kişiler (processOwner + affectedPersons)
    const ownerH = r.processOwner ? (fontPx + 6) : 0;
    const affectedH = r.affectedPersons ? (fontPx + 4) : 0;
    col3H = beforePhotoH + ownerH + affectedH + (beforePhotoH > 0 ? 8 : 4);

    // Sütun 4 = Uygunsuzluk / Tespit (Konu + Tehlike + Risk)
    const topicH = r.topic ? (fontPx + 6) : 0;
    const hazardChars = (r.hazard || '').trim().length;
    const riskChars = (r.risk || '').trim().length;
    const hazardLines = hazardChars > 0 ? Math.max(1, Math.ceil(hazardChars / charsPerLine)) : 0;
    const riskLines = riskChars > 0 ? Math.max(1, Math.ceil(riskChars / charsPerLine)) : 0;
    col4H = topicH + ((hazardLines + riskLines) * lineH) + 10;

    // Sütun 5 = Öneri / İlgili Yönetmelik
    const precChars = (r.precaution || '').trim().length;
    const precLines = precChars > 0 ? Math.max(1, Math.ceil(precChars / charsPerLine)) : 0;
    col5H = (precLines * lineH) + 8;

    // Sütun 6 = Giderilen Durum Fotoğrafı + Kontrol Tarihi
    const dateH = r.controlDate ? (fontPx + 6) : 0;
    col6H = afterPhotoH + dateH + (afterPhotoH > 0 ? 8 : 4);
  }

  // Satır yüksekliği: En yüksek hücre belirler (Gerçekçi A4 boyutu)
  return Math.max(col3H, col4H, col5H, col6H, 36);
};`;

if (!oldRowCalcPattern.test(content)) {
  console.error('Could not match oldRowCalcPattern');
  process.exit(1);
}
content = content.replace(oldRowCalcPattern, newRowCalcCode);
console.log('calcAccurateRowHeight updated successfully.');

// =========================================================================
// 2. UPDATE calcSmartWebPageSizes: budget for Saha report = 860px
// =========================================================================
const oldSmartSizesBudget = /const budgetPage1 = isWeb \? 560 : 890;\s*const budgetOtherPages = isWeb \? 645 : 960;/;
const newSmartSizesBudget = `const budgetPage1 = isWeb ? 560 : 860;
  const budgetOtherPages = isWeb ? 645 : 860;`;

if (!oldSmartSizesBudget.test(content)) {
  console.error('Could not match oldSmartSizesBudget');
  process.exit(1);
}
content = content.replace(oldSmartSizesBudget, newSmartSizesBudget);
console.log('calcSmartWebPageSizes budgets updated.');

// =========================================================================
// 3. UPDATE handleSmartAutoPack: budget for Saha report = 860px
// =========================================================================
const oldHandleSmartBudget = /const budgetPage1 = isWeb \? 560 : 890;\s*const budgetOtherPages = isWeb \? 645 : 960;/;
if (!oldHandleSmartBudget.test(content)) {
  console.error('Could not match oldHandleSmartBudget');
  process.exit(1);
}
content = content.replace(oldHandleSmartBudget, newSmartSizesBudget);
console.log('handleSmartAutoPack budgets updated.');

// =========================================================================
// 4. UPDATE SahaZiyaretEditor: State, Smart Sizing, and Seamless adjustPageSizes
// =========================================================================
const oldSahaStatePattern = /useEffect\(\(\) => \{[\s\S]*?updatePageSizes\(sizes\);\s*\}, \[assessment\?\.risks\?\.length, itemsPerPage, isCustomPagination\]\);[\s\S]*?const adjustPageSizes = \(index, delta\) => \{[\s\S]*?updatePageSizes\(newSizes\);[\s\S]*?\};\s*const pages = \[\];\s*let startIndex = 0;\s*if \(pageSizes && pageSizes\.length > 0\) \{[\s\S]*?pages\.push\(assessment\.risks\.slice\(i, i \+ limit\)\);\s*\}\s*\}/;

const newSahaStateCode = `useEffect(() => {
    if (isCustomPagination) return; // Kullanıcının elle yaptığı sayfalama korunur
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) {
      updatePageSizes([]);
      return;
    }
    // Web raporundaki gibi akıllı hesaplayıcıyla A4 dikey sayfa sınırlarını tam doldurur
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
      // Madde Eksiltme: Asla madde silinmez! Kalan madde sıradaki veya yeni açılan sayfaya aktarılır.
      if (newSizes[index] <= 1) return; // Sayfada en az 1 madde kalmalı!
      newSizes[index] -= 1;
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] += 1;
      } else {
        // Son sayfadan eksiltildiyse yeni sayfa aç ve son maddeyi oraya aktar
        newSizes.push(1);
      }
    } else if (delta === 1) {
      // Madde Artırma: Sıradaki sayfadan 1 madde alıp bu sayfaya çeker
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
    // Güvenlik Kilidi: Toplam madde sayısı daima tam korunur (hiçbir madde kaybolamaz!)
    const currentSum = cleaned.reduce((a, b) => a + b, 0);
    if (currentSum < totalItems) {
      cleaned[cleaned.length - 1] += (totalItems - currentSum);
    }

    updatePageSizes(cleaned);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  const pages = [];
  let startIndex = 0;
  let activeSizes = (pageSizes && pageSizes.length > 0)
    ? pageSizes
    : calcSmartWebPageSizes(assessment?.risks || [], photoFit, photoCustomStyles, photoHeight, reportFontSize, false);
  if (activeSizes && activeSizes.length > 0) {
    activeSizes.forEach(size => {
      pages.push(assessment.risks.slice(startIndex, startIndex + size));
      startIndex += size;
    });
  }`;

if (!oldSahaStatePattern.test(content)) {
  console.error('Could not match oldSahaStatePattern');
  process.exit(1);
}
content = content.replace(oldSahaStatePattern, newSahaStateCode);
console.log('SahaZiyaretEditor state & pagination functions updated.');

// =========================================================================
// 5. UPDATE SahaZiyaretEditor: pageBudget, table container, and persistent signatures
// =========================================================================
const oldSahaPageBudget = /\/\/ Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı \(Saha - A4 Dikey\)[\s\S]*?const pageBudget = 1123 - \(headerH \+ footerH \+ paddingH \+ theadH\); \/\/ 885px - 960px net kullanılabilir alan/;

const newSahaPageBudget = `// Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
          // Her sayfada tam üst başlık (~104px) ve imza alanı (~75px) sabit kaldığından net bütçe: 860px
          const headerH = 104;
          const footerH = 75;
          const paddingH = 75; // 10mm üst + 10mm alt = 20mm = ~75px
          const pageBudget = 1123 - (headerH + footerH + paddingH); // 864px net kullanılabilir alan`;

if (!oldSahaPageBudget.test(content)) {
  console.error('Could not match oldSahaPageBudget');
  process.exit(1);
}
content = content.replace(oldSahaPageBudget, newSahaPageBudget);
console.log('SahaZiyaretEditor pageBudget updated to exact persistent header & footer dimensions.');

// =========================================================================
// 6. WRAP <table className="report-table"> with <div className="saha-report-table-container flex-1 overflow-hidden">
// and update footer with page X / Y
// =========================================================================
const oldSahaTableJSX = `<div className="saha-report-page">
                <table className="report-table">`;

const newSahaTableJSX = `<div className="saha-report-page">
                {/* 1. ÜST KISIM & TABLO ALANI (Her sayfada üst başlık tam yer alır) */}
                <div className="saha-report-table-container flex-1 overflow-hidden">
                  <table className="report-table">`;

if (!content.includes(oldSahaTableJSX)) {
  console.error('Could not find oldSahaTableJSX');
  process.exit(1);
}
content = content.replace(oldSahaTableJSX, newSahaTableJSX);

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

if (!content.includes(oldSahaFooterJSX)) {
  console.error('Could not find oldSahaFooterJSX');
  process.exit(1);
}
content = content.replace(oldSahaFooterJSX, newSahaFooterJSX);
console.log('Saha table container and persistent signature footer updated.');

fs.writeFileSync(appPath, content, 'utf8');
console.log('ALL SAHA PAGINATION & PERSISTENT SIGNATURE FIXES APPLIED SUCCESSFULLY!');
