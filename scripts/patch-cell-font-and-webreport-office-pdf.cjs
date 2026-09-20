/**
 * patch-cell-font-and-webreport-office-pdf.cjs
 * 
 * 1. Defines ReportTextCell component for per-cell font size adjustment (A- / A+ / reset on hover).
 * 2. Adds cellCustomStyles state & handler to AdvancedReportModal.
 * 3. Integrates ReportTextCell into WebReportEditor and SahaZiyaretEditor for all main text cells.
 * 4. Adds openWebReport function (A4 landscape clean vector HTML print/PDF window).
 * 5. Hooks openWebReport into PDF/OFİS AÇ and triggerPrint so Web Report exports the EXACT live view:
 *    custom photos, alignments, custom page splits, and per-cell font sizes!
 */

const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/5] Adding ReportTextCell component...');

const reportTextCellCode = `
// ==========================================================================================
// CANLI RAPOR HÜCRE YAZI BOYUTLANDIRMA BİLEŞENİ (HÜCRE BAŞI SPESİFİK FONT KONTROLLERİ)
// ==========================================================================================
function ReportTextCell({
  cellKey,
  children,
  defaultFontSize = '8pt',
  customStyles = {},
  onUpdateCustomStyle,
  style = {},
  className = '',
  contentEditable = true
}) {
  const custom = customStyles?.[cellKey] || {};
  const currentFontSize = custom.fontSize || defaultFontSize;

  const fontSizes = ['5pt', '5.5pt', '6pt', '6.5pt', '7pt', '7.5pt', '8pt', '8.5pt', '9pt', '9.5pt', '10pt', '11pt', '12pt', '13pt', '14pt'];

  const handleDelta = (delta, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    const idx = fontSizes.indexOf(currentFontSize);
    let nextIdx = idx !== -1 ? idx + delta : 6;
    nextIdx = Math.max(0, Math.min(fontSizes.length - 1, nextIdx));
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(cellKey, { ...custom, fontSize: fontSizes[nextIdx] });
    }
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (onUpdateCustomStyle) {
      onUpdateCustomStyle(cellKey, null);
    }
  };

  return (
    <div className={\`group/cell relative w-full \${className}\`}>
      {/* Hücre Başı Canlı Yazı Boyutu Kontrolü (Hover'da görünür, baskıda no-print ile gizlenir) */}
      <div
        className="no-print absolute -top-1 -right-1 z-20 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-slate-900/95 text-white rounded px-1 py-0.5 shadow flex items-center gap-0.5 text-[8px] select-none border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => handleDelta(-1, e)}
          className="w-3.5 h-3.5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white cursor-pointer"
          title="Bu hücrenin yazısını küçült (A-)"
        >
          -
        </button>
        <span className="font-mono text-[7.5px] px-0.5 text-amber-300 font-bold" title="Bu hücrenin yazı boyutu">
          {currentFontSize}
        </span>
        <button
          type="button"
          onClick={(e) => handleDelta(1, e)}
          className="w-3.5 h-3.5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-white cursor-pointer"
          title="Bu hücrenin yazısını büyüt (A+)"
        >
          +
        </button>
        {custom.fontSize && (
          <button
            type="button"
            onClick={handleReset}
            className="text-rose-400 hover:text-rose-200 ml-0.5 text-[7.5px] font-bold px-0.5 cursor-pointer"
            title="Hücre fontunu sıfırla (Standarta dön)"
          >
            ✕
          </button>
        )}
      </div>

      <div
        contentEditable={contentEditable}
        suppressContentEditableWarning
        style={{
          ...style,
          fontSize: currentFontSize
        }}
      >
        {children}
      </div>
    </div>
  );
}
`;

// Insert ReportTextCell right before WebReportEditor
const webReportEditorMarker = 'const WebReportEditor = ({';
if (code.includes(webReportEditorMarker) && !code.includes('function ReportTextCell')) {
  code = code.replace(webReportEditorMarker, reportTextCellCode + '\n' + webReportEditorMarker);
  console.log('  ✔ ReportTextCell component inserted');
} else if (code.includes('function ReportTextCell')) {
  console.log('  ✔ ReportTextCell already exists');
} else {
  console.error('  ❌ Could not find webReportEditorMarker');
}

console.log('>>> [2/5] Adding openWebReport helper function...');

const openWebReportCode = `
// --- WEB RAPORU YENİ SEKMEDE / PDF OFİS BASKI MODUNDA AÇMA (BİREBİR ÖNİZLEME DÜZENİ) ---
const openWebReport = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const reportHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');

  const html = \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Risk Değerlendirme Raporu - \${company?.name || ''}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { 
          margin: 0; 
          padding: 0; 
          background: white; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .no-print { display: none !important; }
        @media print {
          .no-print { display: none !important; }
          .web-report-page {
            box-shadow: none !important;
            margin: 0 !important;
            height: auto !important;
            min-height: 209mm !important;
            max-height: none !important;
            overflow: visible !important;
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
        }
        .web-report-page {
          width: 297mm;
          min-width: 297mm;
          background: white;
          box-sizing: border-box;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">📄 Risk Değerlendirme Raporu (A4 Yatay)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>
      <div style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
        \${reportHTML}
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => { window.print(); }, 900);
        };
      </script>
    </body>
    </html>
  \`;

  printWindow.document.write(html);
  printWindow.document.close();
};
`;

const openSahaMarker = 'const openSahaZiyaretiReport = (company, assessment) => {';
if (code.includes(openSahaMarker) && !code.includes('const openWebReport =')) {
  code = code.replace(openSahaMarker, openWebReportCode + '\n' + openSahaMarker);
  console.log('  ✔ openWebReport function added');
} else if (code.includes('const openWebReport =')) {
  console.log('  ✔ openWebReport already exists');
} else {
  console.error('  ❌ Could not find openSahaMarker');
}

console.log('>>> [3/5] Updating WebReportEditor to use ReportTextCell for cell-by-cell font sizing...');

// Update WebReportEditor props to accept cellCustomStyles, onUpdateCellStyle
const oldWebEditorProps = `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 3,
  photoHeight = 45,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle,
  pageSizes: controlledPageSizes,
  onPageSizesChange,
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left',
  photoAlign = 'center',
  isCustomPagination = false,
  onCustomPaginationTrigger
}) => {`;

const newWebEditorProps = `const WebReportEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '12mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  itemsPerPage = 3,
  photoHeight = 45,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle,
  pageSizes: controlledPageSizes,
  onPageSizesChange,
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left',
  photoAlign = 'center',
  isCustomPagination = false,
  onCustomPaginationTrigger,
  cellCustomStyles = {},
  onUpdateCellStyle
}) => {`;

if (code.includes(oldWebEditorProps)) {
  code = code.replace(oldWebEditorProps, newWebEditorProps);
  console.log('  ✔ WebReportEditor props updated with cellCustomStyles');
}

// In WebReportEditor, wrap description, hazard/risk, precaution with ReportTextCell
// Description:
const oldWebDescCell = `<div contentEditable suppressContentEditableWarning className="leading-tight" style={{ fontSize: reportFontSize, textAlign: cellTAlign }}>{r.description}</div>`;
const newWebDescCell = `<ReportTextCell
                                cellKey={\`web-desc-\${r.id || itemNumber}\`}
                                defaultFontSize={reportFontSize}
                                customStyles={cellCustomStyles}
                                onUpdateCustomStyle={onUpdateCellStyle}
                                style={{ textAlign: cellTAlign, lineHeight: '1.2' }}
                              >
                                {r.description}
                              </ReportTextCell>`;
if (code.includes(oldWebDescCell)) {
  code = code.replace(oldWebDescCell, newWebDescCell);
  console.log('  ✔ WebReportEditor description wrapped with ReportTextCell');
}

// Hazard / Risk:
const oldWebHazardCell = `<td className="border border-black p-1 font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                            <div className="italic text-slate-600">{r.risk}</div>
                          </td>`;
const newWebHazardCell = `<td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`web-hazard-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                              <div className="italic text-slate-600">{r.risk}</div>
                            </ReportTextCell>
                          </td>`;
if (code.includes(oldWebHazardCell)) {
  code = code.replace(oldWebHazardCell, newWebHazardCell);
  console.log('  ✔ WebReportEditor hazard/risk wrapped with ReportTextCell');
}

// Precaution:
const oldWebPrecCell = `<td className="border border-black p-1 font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>{r.precaution}</td>`;
const newWebPrecCell = `<td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`web-prec-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              {r.precaution}
                            </ReportTextCell>
                          </td>`;
if (code.includes(oldWebPrecCell)) {
  code = code.replace(oldWebPrecCell, newWebPrecCell);
  console.log('  ✔ WebReportEditor precaution wrapped with ReportTextCell');
}

console.log('>>> [4/5] Updating SahaZiyaretEditor to use ReportTextCell for cell-by-cell font sizing...');

// Update SahaZiyaretEditor props
const oldSahaEditorProps = `const SahaZiyaretEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  itemsPerPage = 5,
  removeEmpty = false,
  photoHeight = 80,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle,
  pageSizes: controlledPageSizes,
  onPageSizesChange,
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left',
  photoAlign = 'center',
  isCustomPagination = false,
  onCustomPaginationTrigger
}) => {`;

const newSahaEditorProps = `const SahaZiyaretEditor = ({
  company,
  assessment,
  reportFontSize = '8pt',
  itemsPerPage = 5,
  removeEmpty = false,
  photoHeight = 80,
  photoFit = 'contain',
  photoCustomStyles = {},
  onUpdatePhotoStyle,
  pageSizes: controlledPageSizes,
  onPageSizesChange,
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left',
  photoAlign = 'center',
  isCustomPagination = false,
  onCustomPaginationTrigger,
  cellCustomStyles = {},
  onUpdateCellStyle
}) => {`;

if (code.includes(oldSahaEditorProps)) {
  code = code.replace(oldSahaEditorProps, newSahaEditorProps);
  console.log('  ✔ SahaZiyaretEditor props updated with cellCustomStyles');
}

// In SahaZiyaretEditor, wrap tespit and oneri cells with ReportTextCell
const oldSahaDescCell = `<td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
                            <div
                              className="print-cell-wrapper"
                              style={{
                                overflow: 'visible',
                                wordBreak: 'break-word',
                                fontSize: reportFontSize,
                                textAlign: cellTAlign
                              }}
                              contentEditable
                              suppressContentEditableWarning
                            >
                              <strong style={{ textTransform: 'uppercase' }}>{risk.topic || 'BULGU'}</strong>
                              <br />{risk.hazard}
                              <br />{risk.risk}
                            </div>
                          </td>`;

const newSahaDescCell = `<td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`saha-desc-\${risk.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              <strong style={{ textTransform: 'uppercase' }}>{risk.topic || 'BULGU'}</strong>
                              <br />{risk.hazard}
                              <br />{risk.risk}
                            </ReportTextCell>
                          </td>`;

if (code.includes(oldSahaDescCell)) {
  code = code.replace(oldSahaDescCell, newSahaDescCell);
  console.log('  ✔ SahaZiyaretEditor tespit wrapped with ReportTextCell');
}

const oldSahaPrecCell = `<td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
                            <div
                              className="print-cell-wrapper"
                              style={{
                                overflow: 'visible',
                                wordBreak: 'break-word',
                                fontSize: reportFontSize,
                                textAlign: cellTAlign
                              }}
                              contentEditable
                              suppressContentEditableWarning
                            >
                              {risk.precaution}
                            </div>
                          </td>`;

const newSahaPrecCell = `<td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`saha-prec-\${risk.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              {risk.precaution}
                            </ReportTextCell>
                          </td>`;

if (code.includes(oldSahaPrecCell)) {
  code = code.replace(oldSahaPrecCell, newSahaPrecCell);
  console.log('  ✔ SahaZiyaretEditor oneri wrapped with ReportTextCell');
}

console.log('>>> [5/5] Hooking openWebReport into PDF/OFİS AÇ and adding cellCustomStyles to AdvancedReportModal...');

// Add cellCustomStyles state to AdvancedReportModal
const oldModalStatesHook = `  const [tableVerticalAlign, setTableVerticalAlign] = useState('middle'); // 'top', 'middle', 'bottom'
  const [tableTextAlign, setTableTextAlign] = useState('left'); // 'left', 'center'
  const [photoAlign, setPhotoAlign] = useState('center'); // 'top', 'center', 'bottom'`;

const newModalStatesHook = `  const [tableVerticalAlign, setTableVerticalAlign] = useState('middle'); // 'top', 'middle', 'bottom'
  const [tableTextAlign, setTableTextAlign] = useState('left'); // 'left', 'center'
  const [photoAlign, setPhotoAlign] = useState('center'); // 'top', 'center', 'bottom'
  const [cellCustomStyles, setCellCustomStyles] = useState({});

  const handleUpdateCellStyle = (cellKey, updates) => {
    setCellCustomStyles(prev => {
      if (!updates) {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      }
      return {
        ...prev,
        [cellKey]: { ...(prev[cellKey] || {}), ...updates }
      };
    });
  };`;

if (code.includes(oldModalStatesHook)) {
  code = code.replace(oldModalStatesHook, newModalStatesHook);
  console.log('  ✔ cellCustomStyles state & handler added to AdvancedReportModal');
}

// Pass cellCustomStyles & onUpdateCellStyle to SahaZiyaretEditor invocation
code = code.replace(
  `onCustomPaginationTrigger={setIsCustomPagination}\n              />`,
  `onCustomPaginationTrigger={setIsCustomPagination}\n                cellCustomStyles={cellCustomStyles}\n                onUpdateCellStyle={handleUpdateCellStyle}\n              />`
);

// Pass cellCustomStyles & onUpdateCellStyle to WebReportEditor invocation
code = code.replace(
  `onCustomPaginationTrigger={setIsCustomPagination}\n              />`,
  `onCustomPaginationTrigger={setIsCustomPagination}\n                cellCustomStyles={cellCustomStyles}\n                onUpdateCellStyle={handleUpdateCellStyle}\n              />`
);

// Update triggerPrint for web report: call openWebReport(company, assessmentData)
code = code.replace(
  `    } else if (reportType === 'web') {\n      // Web raporu: tarayıcı sekmesi açma, doğrudan PDF indir\n      downloadWebReportPDF();`,
  `    } else if (reportType === 'web') {\n      openWebReport(company, assessmentData);`
);

// In showPrintPrompt: when reportType === 'web'
const oldPrintPromptWebCall = `                  if (reportType === 'web') {
                    // Ekran görüntüsü almak yerine doğrudan vektörel ve mobil uyumlu PDF indir/aç
                    downloadWebReportPDF(printAction || 'open');
                  } else {`;

const newPrintPromptWebCall = `                  if (reportType === 'web') {
                    if (printAction === 'open') {
                      openWebReport(company, assessmentData);
                    } else {
                      openWebReport(company, assessmentData);
                    }
                  } else {`;

if (code.includes(oldPrintPromptWebCall)) {
  code = code.replace(oldPrintPromptWebCall, newPrintPromptWebCall);
  console.log('  ✔ showPrintPrompt for web report now calls openWebReport for live WYSIWYG print/PDF');
}

// In downloadWebReportPDF: if action === 'open', also call openWebReport so OPF AÇ / PDF AÇ shows exact live view
const oldDownloadWebReportPDFStart = `  const downloadWebReportPDF = async (action = 'open') => {
    if (!assessmentData || !company) {
      alert('Rapor verileri hazır değil.');
      return;
    }
    setIsGeneratingPDF(true);
    try {
      const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();`;

const newDownloadWebReportPDFStart = `  const downloadWebReportPDF = async (action = 'open') => {
    if (!assessmentData || !company) {
      alert('Rapor verileri hazır değil.');
      return;
    }
    const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();
    if (!isNative && action === 'open') {
      openWebReport(company, assessmentData);
      return;
    }
    setIsGeneratingPDF(true);
    try {`;

if (code.includes(oldDownloadWebReportPDFStart)) {
  code = code.replace(oldDownloadWebReportPDFStart, newDownloadWebReportPDFStart);
  console.log('  ✔ downloadWebReportPDF updated to route desktop action=open to openWebReport');
}

// In toolbar, add reset cell fonts button if cellCustomStyles has keys
const oldToolbarCustomPaginationReset = `↺ Sabit'e Dön
                    </button>
                  </div>
                )}`;

const newToolbarCustomPaginationReset = `↺ Sabit'e Dön
                    </button>
                  </div>
                )}
                {Object.keys(cellCustomStyles).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCellCustomStyles({})}
                    className="ml-1 px-1.5 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded text-[10px] font-bold transition-colors cursor-pointer border border-rose-600"
                    title="Hücrelere elle yapılan tüm özel font boyutlandırmalarını sıfırlar"
                  >
                    ↺ Hücre Fontlarını Sıfırla
                  </button>
                )}`;

if (code.includes(oldToolbarCustomPaginationReset)) {
  code = code.replace(oldToolbarCustomPaginationReset, newToolbarCustomPaginationReset);
  console.log('  ✔ Reset custom cell fonts button added to toolbar');
}

// Write back
fs.writeFileSync(targetFile, code, 'utf8');
console.log('>>> [DONE] App.jsx successfully updated with per-cell font sizing and openWebReport!');
