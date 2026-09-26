const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update getProcedurePageHTML
const oldGetProcedureTarget = `const getProcedurePageHTML = (company, assessment) => {
  const container = document.getElementById('report-preview-container');
  const reportHTML = container ? container.innerHTML : '';
  return \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Prosedür - \${company?.name || ''}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print { .no-print { display: none !important; } }
        .saha-report-page, .acil-durum-page, .procedure-page {
            margin: 0 !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
            height: 295.5mm !important;
            max-height: 295.5mm !important;
            min-height: 295.5mm !important;
            overflow: hidden !important;
            background: white !important;
            box-sizing: border-box;
        }
        .saha-report-page:not(:last-child), .acil-durum-page:not(:last-child), .procedure-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
        }
        .saha-report-page:last-child, .acil-durum-page:last-child, .procedure-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
      </style>
    </head>
    <body>
      \${reportHTML}
    </body>
    </html>
  \`;
};`;

const newGetProcedureTarget = `const getProcedurePageHTML = (company, assessment) => {
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const rawHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');
  const cleanedHTML = rawHTML ? rawHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"') : '';

  return \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Risk Değerlendirme Prosedürü - \${company?.name || ''}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4 portrait; margin: 0; }
        body { 
          margin: 0; 
          padding: 0; 
          background: #f1f5f9; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .no-print { display: none !important; }
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .procedure-outer-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
            width: 210mm !important;
          }
          .procedure-page {
            box-shadow: none !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: white !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .procedure-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .procedure-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          table {
            border-collapse: collapse !important;
          }
          tr, td, th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }
        .procedure-page {
          width: 210mm;
          min-width: 210mm;
          max-width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          background: white;
          box-sizing: border-box;
          margin-bottom: 24px;
          break-inside: avoid-page !important;
          page-break-inside: avoid !important;
          overflow: hidden !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .procedure-page tr, .procedure-page td, .procedure-page th {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">📄 Risk Analiz Prosedürü (A4 Dikey)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>
      <div class="procedure-outer-container" style="padding: 20px 10px; display: flex; flex-direction: column; align-items: center;">
        \${cleanedHTML}
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => { window.print(); }, 900);
        };
      </script>
    </body>
    </html>
  \`;
};`;

if (!content.includes(oldGetProcedureTarget)) {
  console.error("Could not find oldGetProcedureTarget!");
  process.exit(1);
}

content = content.replace(oldGetProcedureTarget, newGetProcedureTarget);
console.log("Updated getProcedurePageHTML successfully.");

// 2. Update openProcedurePage
const oldOpenProcedure = `// --- PROSEDÜR YENİ SEKMEDE YAZDIRMA ---
const openProcedurePage = (company, assessment) => {
  const html = getProcedurePageHTML(company, assessment);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};`;

const newOpenProcedure = `// --- PROSEDÜR YENİ SEKMEDE / PDF OFİS BASKI MODUNDA AÇMA (BİREBİR ÖNİZLEME DÜZENİ) ---
const openProcedurePage = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const html = getProcedurePageHTML(company, assessment);
  try {
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error("Prosedür penceresi oluşturma hatası:", err);
    alert("Rapor penceresi oluşturulurken hata: " + err.message);
  }
};`;

if (!content.includes(oldOpenProcedure)) {
  console.error("Could not find oldOpenProcedure!");
  process.exit(1);
}

content = content.replace(oldOpenProcedure, newOpenProcedure);
console.log("Updated openProcedurePage successfully.");

// 3. Update filename in loadHtml2pdfAndRun
const oldFilenameTarget = `          const pdfBlob = pdf.output('blob');
          const filename = \`Rapor_\${Date.now()}.pdf\`;
          await handleMobilePDF(pdfBlob, filename, action);`;

const newFilenameTarget = `          const pdfBlob = pdf.output('blob');
          const filename = reportType === 'prosedur'
            ? \`Prosedur_\${(company?.name || 'Firma').replace(/\\s+/g, '_')}_\${Date.now()}.pdf\`
            : \`Rapor_\${Date.now()}.pdf\`;
          await handleMobilePDF(pdfBlob, filename, action);`;

if (!content.includes(oldFilenameTarget)) {
  console.error("Could not find oldFilenameTarget!");
  process.exit(1);
}

content = content.replace(oldFilenameTarget, newFilenameTarget);
console.log("Updated filename logic in loadHtml2pdfAndRun successfully.");

fs.writeFileSync(targetFile, content, 'utf8');
console.log("All updates written to App.jsx successfully!");
