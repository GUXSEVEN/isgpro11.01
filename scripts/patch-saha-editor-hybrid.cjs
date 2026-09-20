const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let code = fs.readFileSync(targetFile, 'utf8');

const startMarker = '// --- GÜNCELLENMİŞ SAHA ZİYARET EDİTÖRÜ (ETKİLENEN KİŞİLER DAHİL) ---';
const endMarker = '// --- HTML YARDIMCI FONKSİYONLARI (MOBİL PDF DÖNÜŞTÜRÜCÜ VE YAZDIRMA İÇİN) ---';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate start or end marker for SahaZiyaretEditor!', { startIdx, endIdx });
  process.exit(1);
}

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
`;

code = code.substring(0, startIdx) + newSahaEditorCode + code.substring(endIdx);
fs.writeFileSync(targetFile, code, 'utf8');
console.log('✔ SahaZiyaretEditor successfully replaced!');
