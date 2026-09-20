const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. WebReportEditor pageBudget & row calculation
const oldWebBudgetBlock = `        // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Web - A4 Yatay)
        const isPage1 = pageIdx === 0;
        const headerH = isPage1 ? 130 : 35;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 70 : 55);
        const paddingH = 85;
        const theadH = 30;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH); // ~494px on page 1, ~589px on page 2+

        const fontPt = parseFloat(reportFontSize) || 8;
        const fontPx = fontPt * 1.33;
        const lineH = fontPx * 1.2;

        let totalH = 0;
        pageRisks.forEach((r, idx) => {
          const itemNum = sumBefore + idx + 1;
          const beforeKey = \`web-before-\${r.id || itemNum}\`;
          const afterKey = \`web-after-\${r.id || itemNum}\`;
          const hasB = Boolean(r.beforePhoto);
          const hasA = Boolean(r.afterPhoto);
          const bH = hasB ? (photoCustomStyles?.[beforeKey]?.height || photoHeight || 45) : 0;
          const aH = hasA ? (photoCustomStyles?.[afterKey]?.height || photoHeight || 45) : 0;
          const pH = Math.max(bH, aH);

          const maxChars = Math.max(
            (r.hazard?.length || 0),
            (r.risk?.length || 0),
            (r.precaution?.length || 0),
            (r.description?.length || 0)
          );
          const estLines = Math.max(1, Math.ceil(maxChars / 28));
          const textH = estLines * lineH;
          const rowH = Math.max(pH > 0 ? (pH + 18) : 28, textH + 14);
          totalH += rowH;
        });`;

const newWebBudgetBlock = `        // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Web - A4 Yatay)
        const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 110 : 25;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 60 : 45);
        const legendH = isLastPage ? 85 : 0;
        const paddingH = 45;
        const theadH = 24;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH + legendH);

        const fontPt = parseFloat(reportFontSize) || 8;
        const fontPx = fontPt * 1.33;
        const lineH = fontPx * 1.15;

        let totalH = 0;
        pageRisks.forEach((r, idx) => {
          const itemNum = sumBefore + idx + 1;
          totalH += calcAccurateRowHeight(r, itemNum - 1, true, photoFit, photoCustomStyles, photoHeight, reportFontSize);
        });`;

if (!content.includes(oldWebBudgetBlock)) {
  console.error('Could not find oldWebBudgetBlock');
  process.exit(1);
}
content = content.replace(oldWebBudgetBlock, newWebBudgetBlock);
console.log('WebReportEditor pageBudget & row height calculation updated.');

// 2. handleSmartAutoPack budgets
const oldHandleSmartBudget = `    const budgetPage1 = isWeb ? 420 : 650;
    const budgetOtherPages = isWeb ? 510 : 650;
    const legendBudgetH = isWeb ? 145 : 0;`;

const newHandleSmartBudget = `    const budgetPage1 = isWeb ? 560 : 860;
    const budgetOtherPages = isWeb ? 645 : 860;
    const legendBudgetH = isWeb ? 85 : 0;`;

if (content.includes(oldHandleSmartBudget)) {
  content = content.replace(oldHandleSmartBudget, newHandleSmartBudget);
  console.log('handleSmartAutoPack budgets updated.');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Tuning complete!');
