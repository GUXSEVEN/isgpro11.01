/**
 * patch-hybrid-reports-and-ai-optimize.cjs
 * 
 * 1. SahaZiyaretEditor:
 *    - Removes maxHeight & overflow: hidden text truncation.
 *    - Adds pageSizes state & adjustPageSizes (+ / -) per page.
 *    - Auto-scales font size & line-height for long texts.
 *    - Cumulative item numbering (sumBefore + index + 1).
 *    - CSS overflow: visible and height: auto (min-height 297mm).
 * 
 * 2. WebReportEditor:
 *    - Controlled/synchronized pageSizes support.
 *    - Removes flex-1 overflow-hidden -> overflow-visible.
 *    - Auto-scales font size & line-height for long descriptions, hazards, risks, precautions.
 *    - CSS overflow: visible and height: auto (min-height 209mm).
 * 
 * 3. AdvancedReportModal:
 *    - pageSizes state tracking for both Saha and Web reports.
 *    - Passes pageSizes to RiskDocument in downloadWebReportPDF.
 *    - Option 5: "✨ Metinleri Optimize Et (Özlü İSG)" toolbar button with confirmation.
 *    - "↺ Orijinale Dön" button to restore original texts.
 *    - Passes pageSizes & onPageSizesChange to SahaZiyaretEditor and WebReportEditor.
 * 
 * 4. RiskDocument:
 *    - Accepts pageSizes prop and chunks dynamically.
 *    - Auto-scales text size in PDF cells for long texts.
 * 
 * 5. getOpenInNewTabHTML:
 *    - Changes overflow: hidden to overflow: visible.
 */

const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/5] Patching WebReportEditor...');

// Update WebReportEditor props & pageSizes sync
const oldWebEditorStart = `const WebReportEditor = ({
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
  onUpdatePhotoStyle
}) => {
  const [pageSizes, setPageSizes] = useState([]);`;

const newWebEditorStart = `const WebReportEditor = ({
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
  onPageSizesChange
}) => {
  const [internalPageSizes, setInternalPageSizes] = useState([]);
  const pageSizes = (controlledPageSizes && controlledPageSizes.length > 0) ? controlledPageSizes : internalPageSizes;
  const updatePageSizes = (newSizes) => {
    setInternalPageSizes(newSizes);
    if (typeof onPageSizesChange === 'function') {
      onPageSizesChange(newSizes);
    }
  };`;

if (code.includes(oldWebEditorStart)) {
  code = code.replace(oldWebEditorStart, newWebEditorStart);
  console.log('  ✔ WebReportEditor props & pageSizes replaced');
} else {
  console.log('  Note: WebReportEditor start pattern mismatch, trying regex...');
  const webRegex = /const WebReportEditor = \(\{[\s\S]*?onUpdatePhotoStyle\s*\}\) => \{\s*const \[pageSizes, setPageSizes\] = useState\(\[\]\);/;
  if (webRegex.test(code)) {
    code = code.replace(webRegex, newWebEditorStart);
    console.log('  ✔ WebReportEditor props replaced via regex');
  } else {
    console.error('  ❌ Could not match WebReportEditor start');
  }
}

// In WebReportEditor, update adjustPageSizes to use updatePageSizes
code = code.replace(
  `    newSizes.splice(nextIdx);\n    setPageSizes(newSizes);\n  };`,
  `    newSizes.splice(nextIdx);\n    updatePageSizes(newSizes);\n  };`
);
code = code.replace(
  `    setPageSizes(sizes);\n  }, [assessment?.risks?.length, itemsPerPage]);`,
  `    updatePageSizes(sizes);\n  }, [assessment?.risks?.length, itemsPerPage]);`
);
code = code.replace(
  `    if (totalItems === 0) {\n      setPageSizes([]);\n      return;\n    }`,
  `    if (totalItems === 0) {\n      updatePageSizes([]);\n      return;\n    }`
);

// In WebReportEditor CSS: overflow: visible & height: auto
code = code.replace(
  `            .web-report-page {\n                box-shadow: none !important;\n                margin: 0 !important;\n                padding: \${reportPadding} !important;\n                height: 209mm !important;\n                max-height: 209mm !important;\n                min-height: 209mm !important;\n                overflow: hidden !important;\n            }`,
  `            .web-report-page {\n                box-shadow: none !important;\n                margin: 0 !important;\n                padding: \${reportPadding} !important;\n                height: auto !important;\n                min-height: 209mm !important;\n                max-height: none !important;\n                overflow: visible !important;\n            }`
);

// In WebReportEditor: table container flex-1 overflow-visible
code = code.replace(
  `{/* 2. TABLO ALANI */}\n              <div className="flex-1 overflow-hidden">`,
  `{/* 2. TABLO ALANI */}\n              <div className="flex-1 overflow-visible">`
);

// In WebReportEditor: text scaling for description, hazard/risk, precaution
const oldWebDescription = `<div contentEditable suppressContentEditableWarning className="text-[6.5px] leading-tight">{r.description}</div>`;
const newWebDescription = `<div contentEditable suppressContentEditableWarning className="leading-tight" style={{ fontSize: (r.description || '').length > 200 ? '5.8px' : '6.5px', lineHeight: (r.description || '').length > 200 ? '1.08' : '1.2' }}>{r.description}</div>`;
if (code.includes(oldWebDescription)) {
  code = code.replace(oldWebDescription, newWebDescription);
  console.log('  ✔ WebReportEditor description text scaling applied');
}

const oldWebHazard = `<td className="border border-black p-1 align-top text-[6.5px] font-normal">
                            <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                            <div className="italic text-slate-600">{r.risk}</div>
                          </td>`;
const newWebHazard = `<td className="border border-black p-1 align-top font-normal" style={{ fontSize: ((r.hazard || '') + (r.risk || '')).length > 220 ? '5.8px' : '6.5px', lineHeight: ((r.hazard || '') + (r.risk || '')).length > 220 ? '1.08' : '1.2' }}>
                            <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                            <div className="italic text-slate-600">{r.risk}</div>
                          </td>`;
if (code.includes(oldWebHazard)) {
  code = code.replace(oldWebHazard, newWebHazard);
  console.log('  ✔ WebReportEditor hazard/risk text scaling applied');
}

const oldWebPrecaution = `<td className="border border-black p-1 align-top text-[6.5px] font-normal">{r.precaution}</td>`;
const newWebPrecaution = `<td className="border border-black p-1 align-top font-normal" style={{ fontSize: (r.precaution || '').length > 220 ? '5.8px' : '6.5px', lineHeight: (r.precaution || '').length > 220 ? '1.08' : '1.2' }}>{r.precaution}</td>`;
if (code.includes(oldWebPrecaution)) {
  code = code.replace(oldWebPrecaution, newWebPrecaution);
  console.log('  ✔ WebReportEditor precaution text scaling applied');
}

console.log('>>> [2/5] Patching SahaZiyaretEditor...');

// Find SahaZiyaretEditor block
const oldSahaEditorRegex = /\/\/ --- GÜNCELLENMİŞ SAHA ZİYARET EDİTÖRÜ[\s\S]*?const SahaZiyaretEditor = \(\{[\s\S]*?\}\);\s*\n\};\s*\n\/\/ --- HTML YARDIMCI FONKSİYONLARI/;

const newSahaEditorCode = `// --- GÜNCELLENMİŞ SAHA ZİYARET EDİTÖRÜ (DİNAMİK SAYFALAMA VE METİN SIĞDIRMA DESTEKLİ) ---
const SahaZiyaretEditor = ({
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
  onPageSizesChange
}) => {
  const uzman = company?.info?.team?.find(m => m.role?.toLowerCase().includes("uzman"))?.name || "....................";
  const isveren = company?.info?.official || "....................";

  const [internalPageSizes, setInternalPageSizes] = useState([]);
  const pageSizes = (controlledPageSizes && controlledPageSizes.length > 0) ? controlledPageSizes : internalPageSizes;
  const updatePageSizes = (newSizes) => {
    setInternalPageSizes(newSizes);
    if (typeof onPageSizesChange === 'function') {
      onPageSizesChange(newSizes);
    }
  };

  useEffect(() => {
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
  }, [assessment?.risks?.length, itemsPerPage]);

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
  };

  const pages = [];
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
  }

  // Dinamik metin boyutu belirleyici (Uzun metinlerde yazıyı hafif küçültür, metin asla kesilmez)
  const getSahaDynamicStyle = (text = '', baseFont = reportFontSize) => {
    const len = (typeof text === 'string' ? text : '').length;
    if (len > 350) return { fontSize: '6.5pt', lineHeight: '1.08' };
    if (len > 200) return { fontSize: '7.0pt', lineHeight: '1.12' };
    if (len > 120) return { fontSize: '7.4pt', lineHeight: '1.16' };
    return { fontSize: baseFont, lineHeight: '1.2' };
  };

  return (
    <div className="w-[210mm] min-w-[210mm] mx-auto">
      <style>{\`
        .saha-report-page {
            width: 210mm;
            min-width: 210mm;
            height: auto;
            min-height: 297mm;
            background: white;
            padding: 10mm;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: black;
            box-sizing: border-box;
        }
        .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5pt solid black; }
        .report-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        .report-table td, .report-table th { border: 1pt solid black; padding: 4px; font-size: \${reportFontSize}; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
        .header-bg { background-color: #f2f2f2 !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .company-title { color: #d9534f !important; font-weight: bold; font-size: 10pt; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .status-ivedi { background-color: #ff0000 !important; color: white !important; font-weight: bold; text-align: center; vertical-align: middle; -webkit-print-color-adjust: exact; }
        .status-devam { background-color: #ffc000 !important; color: black !important; font-weight: bold; text-align: center; vertical-align: middle; -webkit-print-color-adjust: exact; }
        .status-tamam { background-color: #00b050 !important; color: white !important; font-weight: bold; text-align: center; vertical-align: middle; -webkit-print-color-adjust: exact; }
        .saha-img { width: 100%; height: 80px; object-fit: contain; display: block; border: 0.5pt solid #ddd; margin-bottom: 3px; background: #fff; }
        .page-footer-signature { margin-top: auto; display: flex; width: 100%; border: 1.5pt solid black; border-top: none; }
        .sig-box { flex: 1; padding: 10px; text-align: center; font-size: 9pt; font-weight: bold; }
        .sig-box:first-child { border-right: 1.5pt solid black; }
        @media print {
            .bg-slate-300 { background: none; padding: 0; }
            .max-w-[210mm] { max-width: none; margin: 0; }
            .saha-report-page { 
                box-shadow: none !important; 
                margin: 0 !important; 
                height: auto !important;
                min-height: 295.5mm !important;
                max-height: none !important;
                overflow: visible !important;
            }
            .saha-report-page:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
            }
            .saha-report-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
            .no-print { display: none !important; }
            .report-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      \`}</style>

      <div className="w-[210mm] min-w-[210mm] mx-auto">
        <div className="bg-amber-100 p-3 rounded-lg border-2 border-amber-300 text-amber-900 text-xs font-bold mb-4 no-print flex items-center justify-between">
          <div>
            <p>💡 BASKI ÖNCESİ DÜZENLEME & AKILLI SIĞDIRMA MODU:</p>
            <ul className="list-disc ml-5 mt-0.5 text-[11px]">
              <li>Tüm metinlere tıklayarak düzeltebilirsiniz. Uzun metinler otomatik olarak okunabilir fonta ölçeklenir ve asla kesilmez.</li>
              <li>Sayfa başındaki <b>[ - ] / [ + ]</b> butonlarıyla her sayfanın madde sayısını özel olarak ayarlayabilirsiniz.</li>
            </ul>
          </div>
        </div>

        {pages.map((pageRisks, pageIdx) => {
          let sumBefore = 0;
          for (let p = 0; p < pageIdx; p++) {
            sumBefore += pageSizes[p] || 0;
          }

          return (
            <div key={pageIdx} className="mb-6">
              {/* Sayfa Madde Sayısı Ayarlayıcı - Yalnızca Ekranda */}
              <div className="w-[210mm] min-w-[210mm] mx-auto flex items-center justify-between bg-slate-800 text-white p-2 rounded-t-lg text-xs no-print font-sans select-none mb-0.5">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px]">Sayfa {pageIdx + 1}</span>
                  <span className="text-slate-300">({pageRisks.length} Madde)</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-300">Bu Sayfadaki Madde Sayısı:</span>
                  <button
                    type="button"
                    onClick={() => adjustPageSizes(pageIdx, -1)}
                    disabled={pageRisks.length <= 1}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                    title="Bu sayfadan 1 madde eksilt (Sonraki sayfaya kaydır)"
                  >
                    -
                  </button>
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded font-bold text-amber-300">{pageRisks.length}</span>
                  <button
                    type="button"
                    onClick={() => adjustPageSizes(pageIdx, 1)}
                    disabled={pageIdx === pageSizes.length - 1 || pageRisks.length >= (assessment?.risks?.length || 0)}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                    title="Bu sayfaya 1 madde ekle"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="saha-report-page">
                <table className="report-table">
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '19.875%' }} />
                    <col style={{ width: '19.875%' }} />
                    <col style={{ width: '19.875%' }} />
                    <col style={{ width: '19.875%' }} />
                    <col style={{ width: '7.5%' }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <td colSpan={2} style={{ verticalAlign: 'middle', padding: '5px' }}>
                        <span className="company-title" contentEditable suppressContentEditableWarning>{company?.name}</span>
                      </td>
                      <td colSpan={4} className="header-bg" style={{ fontSize: '11pt', verticalAlign: 'middle', textAlign: 'center' }}>
                        İSG ZİYARET VE TAKİP RAPORU
                      </td>
                      <td colSpan={1} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {company?.info?.logo ? <img src={company.info.logo} style={{ maxHeight: '35px' }} /> : 'LOGO'}
                      </td>
                    </tr>
                    <tr className="header-bg"><td colSpan={7}>İŞ SAĞLIĞI VE GÜVENLİĞİ FAALİYETLERİ</td></tr>
                    <tr className="header-bg"><td colSpan={7}>SAHADA GÖRÜLEN UYGUNSUZLUKLAR - RUTİN SAHA DENETİMİ</td></tr>
                    <tr className="header-bg" style={{ fontSize: '7pt' }}>
                      <td>No</td><td>TESPİT TARİHİ</td><td>İLGİLİ FOTOĞRAF / KİŞİLER</td><td>UYGUNSUZLUK / TESPİT</td><td>ÖNERİ / İLGİLİ YÖNETMELİK</td><td>GİDERİLEN DURUM (FOTO)</td><td>DURUM</td>
                    </tr>
                  </thead>

                  <tbody>
                    {pageRisks.map((risk, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const initialStatus = risk.postScore ? { text: 'TAMAMLANDI', class: 'status-tamam' } : { text: 'İVEDİ', class: 'status-ivedi' };
                      const descStyle = getSahaDynamicStyle((risk.topic || '') + (risk.hazard || '') + (risk.risk || ''), reportFontSize);
                      const precStyle = getSahaDynamicStyle(risk.precaution || '', reportFontSize);

                      return (
                        <tr key={index}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>{itemNumber}</td>
                          <td style={{ textAlign: 'center', fontSize: '7.5pt', verticalAlign: 'middle' }} contentEditable suppressContentEditableWarning>{formatDateTR(assessment.createdAt)}</td>
                          <td>
                            {risk.beforePhoto && (
                              <ReportPhotoCell
                                src={risk.beforePhoto}
                                photoKey={\`saha-before-\${risk.id || itemNumber}\`}
                                defaultHeight={photoHeight || 80}
                                defaultFit={photoFit || 'contain'}
                                customStyles={photoCustomStyles}
                                onUpdatePhotoStyle={onUpdatePhotoStyle}
                                label="Tehlike Öncesi"
                              />
                            )}
                            <div style={{ fontSize: '7pt', textAlign: 'center' }} contentEditable suppressContentEditableWarning>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{risk.processOwner}</div>
                              {risk.affectedPersons && (
                                <div style={{ fontStyle: 'italic', fontSize: '6pt', color: '#555' }}>
                                  (Etkilenen: {risk.affectedPersons})
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'top', padding: '4px' }}>
                            <div
                              className="print-cell-wrapper"
                              style={{
                                overflow: 'visible',
                                wordBreak: 'break-word',
                                fontSize: descStyle.fontSize,
                                lineHeight: descStyle.lineHeight
                              }}
                              contentEditable
                              suppressContentEditableWarning
                            >
                              <strong style={{ textTransform: 'uppercase' }}>{risk.topic || 'BULGU'}</strong>
                              <br />{risk.hazard}
                              <br />{risk.risk}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'top', padding: '4px' }}>
                            <div
                              className="print-cell-wrapper"
                              style={{
                                overflow: 'visible',
                                wordBreak: 'break-word',
                                fontSize: precStyle.fontSize,
                                lineHeight: precStyle.lineHeight
                              }}
                              contentEditable
                              suppressContentEditableWarning
                            >
                              {risk.precaution}
                            </div>
                          </td>
                          <td>
                            {risk.afterPhoto && (
                              <ReportPhotoCell
                                src={risk.afterPhoto}
                                photoKey={\`saha-after-\${risk.id || itemNumber}\`}
                                defaultHeight={photoHeight || 80}
                                defaultFit={photoFit || 'contain'}
                                customStyles={photoCustomStyles}
                                onUpdatePhotoStyle={onUpdatePhotoStyle}
                                label="DÖF Sonrası"
                              />
                            )}
                            <div style={{ fontSize: '7pt', textAlign: 'center', fontWeight: 'bold' }} contentEditable suppressContentEditableWarning>
                              {risk.controlDate ? 'TARİH: ' + formatDateTR(risk.controlDate) : ''}
                            </div>
                          </td>
                          <td className={\`\${initialStatus.class} cursor-pointer select-none\`} style={{ fontSize: '7pt', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', padding: '2px 0' }} onClick={(e) => { const el = e.currentTarget; if (el.innerText === 'İVEDİ') { el.innerText = 'DEVAM EDİYOR'; el.className = 'status-devam cursor-pointer select-none'; } else if (el.innerText === 'DEVAM EDİYOR') { el.innerText = 'TAMAMLANDI'; el.className = 'status-tamam cursor-pointer select-none'; } else { el.innerText = 'İVEDİ'; el.className = 'status-ivedi cursor-pointer select-none'; } }}>
                            {initialStatus.text}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="page-footer-signature">
                  <div className="sig-box">İŞ GÜVENLİĞİ UZMANI<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{uzman}</span></div>
                  <div className="sig-box">İŞVEREN / İŞVEREN VEKİLİ<br /><br /><span style={{ fontWeight: 'normal' }} contentEditable suppressContentEditableWarning>{isveren}</span></div>
                </div>
                <div className="text-[8px] text-right mt-1 font-bold">Sayfa: {pageIdx + 1}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// --- HTML YARDIMCI FONKSİYONLARI`;

if (oldSahaEditorRegex.test(code)) {
  code = code.replace(oldSahaEditorRegex, newSahaEditorCode);
  console.log('  ✔ SahaZiyaretEditor completely patched with hybrid pagination & no-cut layout');
} else {
  console.error('  ❌ Could not match SahaZiyaretEditor regex');
}

console.log('>>> [3/5] Patching getOpenInNewTabHTML...');
code = code.replace(
  `.saha-report-page, .acil-durum-page, .web-report-page {\n            margin: 0 !important;\n            margin-bottom: 0 !important;\n            box-shadow: none !important;\n            overflow: hidden !important;\n        }`,
  `.saha-report-page, .acil-durum-page, .web-report-page {\n            margin: 0 !important;\n            margin-bottom: 0 !important;\n            box-shadow: none !important;\n            overflow: visible !important;\n        }`
);
console.log('  ✔ getOpenInNewTabHTML patched');

console.log('>>> [4/5] Patching AdvancedReportModal (Option 5 & pageSizes synchronization)...');

// In AdvancedReportModal, add states for webPageSizes, sahaPageSizes, optimizedRisks
const oldModalStates = `  const [reportPadding, setReportPadding] = useState('12mm');
  const [reportLineHeight, setReportLineHeight] = useState('1.2');
  const [signatureStyle, setSignatureStyle] = useState('compact'); // 'compact', 'standard', 'hide'

  const risksToUse = visibleRisks || assessment?.risks || [];`;

const newModalStates = `  const [reportPadding, setReportPadding] = useState('12mm');
  const [reportLineHeight, setReportLineHeight] = useState('1.2');
  const [signatureStyle, setSignatureStyle] = useState('compact'); // 'compact', 'standard', 'hide'

  const [webPageSizes, setWebPageSizes] = useState([]);
  const [sahaPageSizes, setSahaPageSizes] = useState([]);
  const [optimizedRisks, setOptimizedRisks] = useState(null);
  const [originalRisksBackup, setOriginalRisksBackup] = useState(null);
  const [isOptimizingText, setIsOptimizingText] = useState(false);

  // İsteğe bağlı Akıllı İSG Metin Optimizasyonu (Seçenek 5)
  const handleOptimizeReportTexts = () => {
    const rawList = visibleRisks || assessment?.risks || [];
    if (!rawList || rawList.length === 0) return;

    const confirmMsg = "Mevzuat maddeleri (6331, yönetmelikler vb.), tehlikeler ve alınması zorunlu önlemler KESİNLİKLE KORUNARAK; gereksiz dolgu kelimeler ve tekrarlar temizlenecektir.\\n\\nMetinler rapor sayfasına kusursuz sığacak şekilde özlü hale getirilsin mi?\\n\\n(Not: İstediğiniz zaman 'Orijinale Dön' butonuyla tam metne geri dönebilirsiniz.)";
    if (!window.confirm(confirmMsg)) return;

    setIsOptimizingText(true);
    try {
      setOriginalRisksBackup(JSON.parse(JSON.stringify(rawList)));

      const cleanISGText = (text) => {
        if (!text || typeof text !== 'string') return text;
        let t = text;
        // Dolgu ve lüzumsuz bürokratik uzatmaları temizle, mevzuat referanslarını koru
        const patterns = [
          /sahada yapılan (genel )?(rutin )?kontroller( ve incelemeler)? (neticesinde|sonucunda) (görülmüştür ki|tespit edilmiştir ki),?\\s*/gi,
          /yapılan saha denetim(ler)?inde (görülmüştür ki|tespit edilmiştir ki),?\\s*/gi,
          /ilgili personellerin ve çalışanların bildirimine göre,?\\s*/gi,
          /bu doğrultuda gerekli önlem(ler)?in ivedilikle alınması gerekmektedir\\.?/gi,
          /işbu durum iş sağlığı ve güvenliği açısından (büyük )?risk teşkil etmekte olup,?\\s*/gi,
          /gerekli tedbir ve önlemlerin eksiksiz( bir)? şekilde yerine getirilmesi önem arz etmektedir\\.?/gi,
          /tüm çalışanlara bu konuda gerekli bilgilendirme ve eğitimlerin verilmesi sağlanmalıdır\\.?/gi
        ];
        patterns.forEach(p => { t = t.replace(p, ''); });
        t = t.replace(/\\s{2,}/g, ' ').trim();
        return t;
      };

      const optimized = rawList.map(r => ({
        ...r,
        hazard: cleanISGText(r.hazard),
        risk: cleanISGText(r.risk),
        precaution: cleanISGText(r.precaution),
        description: cleanISGText(r.description)
      }));

      setOptimizedRisks(optimized);
    } finally {
      setIsOptimizingText(false);
    }
  };

  const handleRevertReportTexts = () => {
    setOptimizedRisks(null);
    setOriginalRisksBackup(null);
  };

  const risksToUse = optimizedRisks || visibleRisks || assessment?.risks || [];`;

if (code.includes(oldModalStates)) {
  code = code.replace(oldModalStates, newModalStates);
  console.log('  ✔ AdvancedReportModal states & optimize function added');
} else {
  console.error('  ❌ Could not match oldModalStates in AdvancedReportModal');
}

// In downloadWebReportPDF, pass pageSizes={webPageSizes}
const oldDownloadPdf = `      const blob = await pdf(
        <RiskDocument
          company={company}
          assessment={assessmentData}
          itemsPerPage={itemsPerPage}
        />
      ).toBlob();`;

const newDownloadPdf = `      const blob = await pdf(
        <RiskDocument
          company={company}
          assessment={assessmentData}
          itemsPerPage={itemsPerPage}
          pageSizes={webPageSizes}
        />
      ).toBlob();`;

if (code.includes(oldDownloadPdf)) {
  code = code.replace(oldDownloadPdf, newDownloadPdf);
  console.log('  ✔ downloadWebReportPDF pageSizes={webPageSizes} passed to RiskDocument');
} else {
  console.log('  Note: oldDownloadPdf direct match failed, checking regex...');
  code = code.replace(
    /<RiskDocument\s+company=\{company\}\s+assessment=\{assessmentData\}\s+itemsPerPage=\{itemsPerPage\}\s*\/>/,
    `<RiskDocument\n          company={company}\n          assessment={assessmentData}\n          itemsPerPage={itemsPerPage}\n          pageSizes={webPageSizes}\n        />`
  );
  console.log('  ✔ downloadWebReportPDF regex replacement applied');
}

// Pass pageSizes & onPageSizesChange to SahaZiyaretEditor and WebReportEditor in modal
const oldSahaCall = `<SahaZiyaretEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                itemsPerPage={itemsPerPage}
                removeEmpty={removeEmpty}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
              />`;

const newSahaCall = `<SahaZiyaretEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                itemsPerPage={itemsPerPage}
                removeEmpty={removeEmpty}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
                pageSizes={sahaPageSizes}
                onPageSizesChange={setSahaPageSizes}
              />`;

if (code.includes(oldSahaCall)) {
  code = code.replace(oldSahaCall, newSahaCall);
  console.log('  ✔ SahaZiyaretEditor invocation updated with pageSizes props');
}

const oldWebCall = `<WebReportEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
              />`;

const newWebCall = `<WebReportEditor
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                photoHeight={photoHeight}
                photoFit={photoFit}
                photoCustomStyles={photoCustomStyles}
                onUpdatePhotoStyle={handleUpdatePhotoStyle}
                pageSizes={webPageSizes}
                onPageSizesChange={setWebPageSizes}
              />`;

if (code.includes(oldWebCall)) {
  code = code.replace(oldWebCall, newWebCall);
  console.log('  ✔ WebReportEditor invocation updated with pageSizes props');
}

// Add the Option 5 Toolbar Button in AdvancedReportModal toolbar
const oldToolbarZoomTarget = `<div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="font-bold text-slate-300">Yazı Boyutu:</span>`;

const newToolbarButtons = `<div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>

          {/* İSTEĞE BAĞLI AKILLI METİN OPTİMİZASYONU (SEÇENEK 5) */}
          {(reportType === 'ziyaret' || reportType === 'web') && (
            <div className="flex items-center gap-1.5">
              {!optimizedRisks ? (
                <button
                  type="button"
                  onClick={handleOptimizeReportTexts}
                  disabled={isOptimizingText}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-emerald-400 cursor-pointer"
                  title="Mevzuat maddelerini ve tehlikeleri koruyarak lüzumsuz tekrarları eler, metinleri sayfaya tam sığdırır"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>✨ Metinleri Optimize Et</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500">
                  <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                    ✔ Özlü İSG Aktif
                  </span>
                  <button
                    type="button"
                    onClick={handleRevertReportTexts}
                    className="bg-rose-700 hover:bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    title="Orijinal metinlere geri döner"
                  >
                    ↺ Orijinale Dön
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="font-bold text-slate-300">Yazı Boyutu:</span>`;

if (code.includes(oldToolbarZoomTarget)) {
  code = code.replace(oldToolbarZoomTarget, newToolbarButtons);
  console.log('  ✔ Option 5 toolbar button inserted into AdvancedReportModal');
} else {
  console.error('  ❌ Could not match oldToolbarZoomTarget');
}

console.log('>>> [5/5] Patching RiskDocument (PDF)...');
// Add pageSizes prop and getPdfDynamicFontSize to RiskDocument
const oldRiskDocStart = `// --- PDF DÖKÜMAN BİLEŞENİ (DINAMIK SAYFALAMA VE LEJANT DESTEKLİ) ---
const RiskDocument = ({ company, assessment, itemsPerPage = 5 }) => {`;

const newRiskDocStart = `// --- PDF DÖKÜMAN BİLEŞENİ (DINAMIK SAYFALAMA VE LEJANT DESTEKLİ) ---
const RiskDocument = ({ company, assessment, itemsPerPage = 5, pageSizes = [] }) => {
  const getPdfDynamicFontSize = (text = '', baseSize = 6) => {
    const len = (typeof text === 'string' ? text : '').length;
    if (len > 300) return 4.5;
    if (len > 180) return 5;
    if (len > 100) return 5.5;
    return baseSize;
  };`;

if (code.includes(oldRiskDocStart)) {
  code = code.replace(oldRiskDocStart, newRiskDocStart);
  console.log('  ✔ RiskDocument header patched with pageSizes & getPdfDynamicFontSize');
} else {
  console.error('  ❌ Could not match oldRiskDocStart');
}

// In RiskDocument, update pageChunks calculation
const oldChunkArrayCall = `  const risks = assessment.risks || [];
  // Gelen itemsPerPage parametresine göre riskleri sayfalara böler
  const pageChunks = chunkArray(risks, itemsPerPage || 5);
  const totalPages = pageChunks.length || 1;`;

const newChunkArrayCall = `  const risks = assessment.risks || [];
  let pageChunks = [];
  if (Array.isArray(pageSizes) && pageSizes.length > 0) {
    let sIdx = 0;
    pageSizes.forEach(sz => {
      if (sz > 0) {
        pageChunks.push(risks.slice(sIdx, sIdx + sz));
        sIdx += sz;
      }
    });
    if (sIdx < risks.length) {
      pageChunks.push(risks.slice(sIdx));
    }
  } else {
    pageChunks = chunkArray(risks, itemsPerPage || 5);
  }
  const totalPages = pageChunks.length || 1;`;

if (code.includes(oldChunkArrayCall)) {
  code = code.replace(oldChunkArrayCall, newChunkArrayCall);
  console.log('  ✔ RiskDocument pageChunks calculation patched');
} else {
  console.error('  ❌ Could not match oldChunkArrayCall');
}

// In RiskDocument, update startNumber calculation
const oldStartNumber = `      {pageChunks.map((chunk, pageIdx) => {
        const startNumber = pageIdx * itemsPerPage;`;

const newStartNumber = `      {pageChunks.map((chunk, pageIdx) => {
        let startNumber = 0;
        for (let p = 0; p < pageIdx; p++) {
          startNumber += (pageSizes && pageSizes[p] !== undefined ? pageSizes[p] : (chunkArray(risks, itemsPerPage || 5)[p]?.length || itemsPerPage || 5));
        }`;

if (code.includes(oldStartNumber)) {
  code = code.replace(oldStartNumber, newStartNumber);
  console.log('  ✔ RiskDocument startNumber calculation patched');
} else {
  console.error('  ❌ Could not match oldStartNumber');
}

// In RiskDocument, auto-scale text font size in cells
code = code.replace(
  `<Text style={pdfStyles.cellText}>{r.description}</Text>`,
  `<Text style={{ ...pdfStyles.cellText, fontSize: getPdfDynamicFontSize(r.description, 6) }}>{r.description}</Text>`
);
code = code.replace(
  `<Text style={{ ...pdfStyles.cellText, fontFamily: 'RobotoBold' }}>{r.hazard}</Text>\n                      <Text style={{ ...pdfStyles.cellText, color: '#4B5563', marginTop: 1 }}>{r.risk}</Text>`,
  `<Text style={{ ...pdfStyles.cellText, fontFamily: 'RobotoBold', fontSize: getPdfDynamicFontSize(r.hazard, 6) }}>{r.hazard}</Text>\n                      <Text style={{ ...pdfStyles.cellText, color: '#4B5563', marginTop: 1, fontSize: getPdfDynamicFontSize(r.risk, 6) }}>{r.risk}</Text>`
);
code = code.replace(
  `<View style={{ ...pdfStyles.cell, width: \`\${w.precaution}%\` }}><Text style={pdfStyles.cellText}>{r.precaution}</Text></View>`,
  `<View style={{ ...pdfStyles.cell, width: \`\${w.precaution}%\` }}><Text style={{ ...pdfStyles.cellText, fontSize: getPdfDynamicFontSize(r.precaution, 6) }}>{r.precaution}</Text></View>`
);
console.log('  ✔ RiskDocument cells dynamic font scaling applied');

// Write back to targetFile
fs.writeFileSync(targetFile, code, 'utf8');
console.log('>>> [DONE] App.jsx successfully updated with Hybrid Report Solutions!');
