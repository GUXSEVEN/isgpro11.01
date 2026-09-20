const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [PHASE 1] APPLYING PROFESSIONAL PAGED MEDIA PRINT ARCHITECTURE <<<');

// 1. ADD CLASS TO OUTER WRAPPER IN openWebReport
const oldOpenWebOuter = `      <div style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
        \${reportHTML}
      </div>`;

const newOpenWebOuter = `      <div class="web-report-outer-container" style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
        \${cleanedHTML}
      </div>`;

if (content.includes(oldOpenWebOuter)) {
  content = content.replace(oldOpenWebOuter, newOpenWebOuter);
  console.log('✔ [1/5] openWebReport outer container class updated');
} else {
  console.error('❌ Could not match oldOpenWebOuter');
}

// 2. CLEAN CLONE IN openWebReport (strip contenteditable for pure print)
const oldOpenWebClone = `  const reportHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');`;
const newOpenWebClone = `  const reportHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');
  const cleanedHTML = reportHTML ? reportHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"') : '';`;

if (content.includes(oldOpenWebClone)) {
  content = content.replace(oldOpenWebClone, newOpenWebClone);
  console.log('✔ [2/5] openWebReport clean clone with disabled contenteditable applied');
} else {
  console.error('❌ Could not match oldOpenWebClone');
}

// 3. UPGRADE CSS IN openWebReport WITH ZERO-LEAK PAGED MEDIA STYLES
const oldOpenWebStyleBlock = `        @media print {
          .no-print { display: none !important; }
          .web-report-page {
            box-shadow: none !important;
            margin: 0 !important;
            height: 209mm !important;
            min-height: 209mm !important;
            max-height: 209mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .web-report-page table td { padding: 2px !important; }
          .web-report-page table th { padding: 1px !important; }
          .web-report-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .web-report-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .web-report-header { flex-shrink: 0 !important; }
          .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
          .web-report-page tr, .web-report-page td, .web-report-page th, .report-photo-cell-container, .print-cell-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }`;

const newOpenWebStyleBlock = `        @media print {
          @page {
            size: 297mm 210mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .web-report-outer-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 297mm !important;
          }
          .web-report-page-wrapper, .mb-8 {
            margin: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .web-report-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            width: 297mm !important;
            min-width: 297mm !important;
            max-width: 297mm !important;
            height: 209mm !important;
            min-height: 209mm !important;
            max-height: 209mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .web-report-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .web-report-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .web-report-header { flex-shrink: 0 !important; }
          .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
          .web-report-table-container { flex: 1 1 auto !important; overflow: hidden !important; }
          .web-report-page table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .web-report-page table td, .web-report-page table th {
            padding: 2px !important;
            hyphens: auto !important;
            -webkit-hyphens: auto !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
          .report-photo-cell-container {
            max-height: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .report-photo-cell-container img {
            max-height: 100% !important;
            max-width: 100% !important;
            object-fit: contain !important;
          }
        }`;

if (content.includes(oldOpenWebStyleBlock)) {
  content = content.replace(oldOpenWebStyleBlock, newOpenWebStyleBlock);
  console.log('✔ [3/5] openWebReport CSS updated with zero-leak paged media styles');
} else {
  console.error('❌ Could not match oldOpenWebStyleBlock');
}

// 4. UPGRADE WebReportEditor IN-APP STYLES (Add hyphens: auto, zero print margins)
const oldWebEditorStyleBlock = `        td, th { overflow-wrap: break-word; word-wrap: break-word; }`;
const newWebEditorStyleBlock = `        td, th { 
            overflow-wrap: break-word; 
            word-wrap: break-word; 
            word-break: break-word;
            hyphens: auto; 
            -webkit-hyphens: auto; 
        }`;

if (content.includes(oldWebEditorStyleBlock)) {
  content = content.replace(oldWebEditorStyleBlock, newWebEditorStyleBlock);
  console.log('✔ [4/5] WebReportEditor hyphens: auto and word-break added');
} else {
  console.error('❌ Could not match oldWebEditorStyleBlock');
}

// Add page wrapper class to WebReportEditor
content = content.replace(
  '          <div key={pageIdx} className="mb-8">',
  '          <div key={pageIdx} className="web-report-page-wrapper mb-8">'
);

// Add zero-leak print styles to WebReportEditor style block
const oldWebEditorPrintStyle = `        @media print {
            .web-report-page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: \${reportPadding} !important;
                height: 209mm !important;
                min-height: 209mm !important;
                max-height: 209mm !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                break-inside: avoid-page !important;
                page-break-inside: avoid !important;
                box-sizing: border-box !important;
            }`;

const newWebEditorPrintStyle = `        @media print {
            @page {
                size: 297mm 210mm;
                margin: 0;
            }
            .web-report-page-wrapper {
                margin: 0 !important;
                margin-bottom: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
            .web-report-page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 6mm 8mm !important;
                height: 209mm !important;
                min-height: 209mm !important;
                max-height: 209mm !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                break-inside: avoid-page !important;
                page-break-inside: avoid !important;
                box-sizing: border-box !important;
            }`;

if (content.includes(oldWebEditorPrintStyle)) {
  content = content.replace(oldWebEditorPrintStyle, newWebEditorPrintStyle);
  console.log('✔ [5/5] WebReportEditor print zero-margin wrapper applied');
} else {
  console.error('❌ Could not match oldWebEditorPrintStyle');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> ALL PHASE 1 ARCHITECTURAL UPDATES COMPLETED SUCCESSFULLY! <<<');
