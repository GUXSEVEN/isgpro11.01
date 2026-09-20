/**
 * patch-fix-webreport-and-controls.cjs
 * 
 * 1. WebReportEditor & SahaZiyaretEditor:
 *    - Removes all hardcoded font size overrides (text-[6.5px], text-[7.5px], fontSize: 5.8px)
 *      so toolbar 'Yazı Boyutu' directly scales every text in the table!
 *    - Adds tableVerticalAlign ('top', 'middle', 'bottom') support to rows and cells.
 *    - Adds tableTextAlign ('left', 'center') support to text cells.
 *    - Photo alignment support (photoAlign).
 * 
 * 2. ReportPhotoCell:
 *    - Adds vertical alignment: 'top', 'center', 'bottom' (objectPosition, alignItems).
 *    - Landscape/horizontal images can be centered, top-aligned, or bottom-aligned.
 *    - Adds an on-hover 1-click alignment toggle button (Üst / Orta / Alt).
 * 
 * 3. Custom Pagination (Sayfa Başı Maddeyi Devre Dışı Bırakma):
 *    - Adds isCustomPagination state in AdvancedReportModal.
 *    - When user adjusts any page (+ / -), isCustomPagination is automatically activated,
 *      and global itemsPerPage is DEACTIVATED (devre dışı).
 *    - Per-page custom distribution (e.g. Page 1: 1 item, Page 2: 3 items) is locked in.
 *    - Toolbar shows "Özel Sayfalama Aktif (Sayfa Başı Devre Dışı)" with a "↺ Sabit'e Dön" button.
 * 
 * 4. Toolbar Enhancements:
 *    - A- / A+ quick font size adjustment buttons.
 *    - Dikey Hizalama: [Üst] [Orta] [Alt] buttons.
 *    - Metin Hizalama: [Sola] [Ortala] buttons.
 *    - Görsel Hizalama: [Üst] [Orta] [Alt] buttons.
 */

const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/4] Updating ReportPhotoCell with vertical alignment...');

// Find ReportPhotoCell start
const oldPhotoCellSig = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = ''
}) {`;

const newPhotoCellSig = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = '',
  photoAlign = 'center'
}) {`;

if (code.includes(oldPhotoCellSig)) {
  code = code.replace(oldPhotoCellSig, newPhotoCellSig);
  console.log('  ✔ ReportPhotoCell signature updated');
}

// In ReportPhotoCell, get currentAlign
const oldPhotoCellCustom = `  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;`;

const newPhotoCellCustom = `  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');`;

if (code.includes(oldPhotoCellCustom)) {
  code = code.replace(oldPhotoCellCustom, newPhotoCellCustom);
  console.log('  ✔ currentAlign added to ReportPhotoCell');
}

// Update container style in ReportPhotoCell
const oldPhotoCellContainer = `    <div
      className={\`report-photo-cell-container group relative mx-auto overflow-hidden rounded bg-slate-50 border border-slate-200 transition-all \${className}\`}
      style={{
        height: currentFit === 'full_width' ? 'auto' : \`\${currentHeight}px\`,
        maxHeight: currentFit === 'full_width' ? '280px' : \`\${currentHeight}px\`,
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
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
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          display: 'block'
        }}
      />`;

const newPhotoCellContainer = `    <div
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

if (code.includes(oldPhotoCellContainer)) {
  code = code.replace(oldPhotoCellContainer, newPhotoCellContainer);
  console.log('  ✔ ReportPhotoCell container & image alignment applied');
}

// In ReportPhotoCell hover toolbar, add align toggle button
const oldPhotoToolbarReset = `<button
          type="button"
          onClick={handleReset}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[8px] text-slate-300 transition-colors cursor-pointer"
          title="Sıfırla"
        >
          ↺
        </button>`;

const newPhotoToolbarReset = `<button
          type="button"
          onClick={(e) => {
            e?.stopPropagation();
            e?.preventDefault();
            const nextAlign = currentAlign === 'top' ? 'center' : currentAlign === 'center' ? 'bottom' : 'top';
            if (onUpdateCustomStyle) {
              onUpdateCustomStyle(photoKey, { ...custom, align: nextAlign });
            }
          }}
          className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[8px] font-bold text-sky-300 transition-colors cursor-pointer"
          title={\`Dikey Konum: \${currentAlign === 'top' ? 'Üst' : currentAlign === 'bottom' ? 'Alt' : 'Orta'} (Tıkla Değiştir)\`}
        >
          {currentAlign === 'top' ? '⬆ Üst' : currentAlign === 'bottom' ? '⬇ Alt' : '↕ Orta'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-1 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[8px] text-slate-300 transition-colors cursor-pointer"
          title="Sıfırla"
        >
          ↺
        </button>`;

if (code.includes(oldPhotoToolbarReset)) {
  code = code.replace(oldPhotoToolbarReset, newPhotoToolbarReset);
  console.log('  ✔ ReportPhotoCell hover align toggle button added');
}

console.log('>>> [2/4] Patching WebReportEditor font size reactivity & alignment...');

// Update WebReportEditor props to receive tableVerticalAlign, tableTextAlign, photoAlign, isCustomPagination, onSetCustomPagination
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
  onPageSizesChange
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
  onCustomPaginationTrigger
}) => {`;

if (code.includes(oldWebEditorProps)) {
  code = code.replace(oldWebEditorProps, newWebEditorProps);
  console.log('  ✔ WebReportEditor signature updated with alignment & custom pagination props');
}

// In WebReportEditor, don't wipe out pageSizes in useEffect if isCustomPagination is true
const oldWebUseEffect = `  useEffect(() => {
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
  }, [assessment?.risks?.length, itemsPerPage]);`;

const newWebUseEffect = `  useEffect(() => {
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

if (code.includes(oldWebUseEffect)) {
  code = code.replace(oldWebUseEffect, newWebUseEffect);
  console.log('  ✔ WebReportEditor useEffect guard for isCustomPagination added');
}

// In WebReportEditor adjustPageSizes, call onCustomPaginationTrigger
const oldWebAdjust = `    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
  };`;

const newWebAdjust = `    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

if (code.includes(oldWebAdjust)) {
  code = code.replace(oldWebAdjust, newWebAdjust);
  console.log('  ✔ onCustomPaginationTrigger hooked into WebReportEditor adjustPageSizes');
}

// Now remove all hardcoded font size classes from WebReportEditor table rows and cells!
// Replace the tbody rendering in WebReportEditor
const oldWebTbodyRegex = /<tbody>\s*\{pageRisks\.map\(\(r, index\) => \{[\s\S]*?return \(\s*<tr key=\{index\} className="align-middle hover:bg-slate-50">[\s\S]*?<\/tr>\s*\);\s*\}\)\}\s*<\/tbody>/;

const newWebTbody = `<tbody>
                    {pageRisks.map((r, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const level = getDynamicRiskLevel(r.score, methodKey);
                      const postLevel = r.postScore ? getDynamicRiskLevel(r.postScore, methodKey) : null;
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';

                      return (
                        <tr key={index} className="hover:bg-slate-50" style={{ verticalAlign: cellVAlign }}>
                          <td className="border border-black text-center py-0.5 font-bold" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>{itemNumber}</td>
                          <td className="border border-black p-0 text-center bg-slate-50" style={{ verticalAlign: cellVAlign }}><div className="vertical-text font-bold" style={{ fontSize: reportFontSize }}>{r.department}</div></td>
                          <td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1">
                              {r.topic && <div className="font-bold bg-yellow-50 p-0.5 border-b border-gray-100 text-center" style={{ fontSize: reportFontSize }}>{r.topic}</div>}
                              {r.beforePhoto ? (
                                <ReportPhotoCell
                                  src={r.beforePhoto}
                                  photoKey={\`web-before-\${r.id || itemNumber}\`}
                                  defaultHeight={photoHeight || 45}
                                  defaultFit={photoFit || 'contain'}
                                  photoAlign={photoAlign}
                                  customStyles={photoCustomStyles}
                                  onUpdateCustomStyle={onUpdatePhotoStyle}
                                  label="Tehlike Öncesi"
                                />
                              ) : <span className="text-gray-400 italic text-center" style={{ fontSize: \`calc(\${reportFontSize} - 2pt)\` }}>-</span>}
                              <div contentEditable suppressContentEditableWarning className="leading-tight" style={{ fontSize: reportFontSize, textAlign: cellTAlign }}>{r.description}</div>
                            </div>
                          </td>
                          <td className="border border-black text-center font-bold bg-slate-50" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>{r.activity || '-'}</td>
                          <td className="border border-black p-1 font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                            <div className="italic text-slate-600">{r.risk}</div>
                          </td>

                          {methodConfig.fields.map(field => (
                            <td key={field} className="border border-black text-center font-bold bg-gray-50 p-0" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                              {r[field] !== undefined ? r[field] : '-'}
                            </td>
                          ))}

                          <td className="border border-black text-center font-bold text-white p-0" style={{ backgroundColor: level.bgPrint, color: level.textPrint, fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                            {r.score}
                          </td>

                          <td className="border border-black p-1 font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>{r.precaution}</td>
                          <td className="border border-black p-0 text-center" style={{ verticalAlign: cellVAlign }}><div className="vertical-text" style={{ fontSize: reportFontSize }}>{r.affectedPersons || 'Tümü'}</div></td>
                          <td className="border border-black p-1 text-center" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                            <div className="font-bold mb-0.5 border-b border-gray-100 pb-0.5">{r.processOwner || '-'}</div>
                            <div>{r.deadline ? formatDateTR(r.deadline) : '-'}</div>
                          </td>

                          <td className="border border-black p-1 bg-white" style={{ verticalAlign: cellVAlign }}>
                            <div className="flex flex-col gap-1">
                              {r.afterPhoto ? (
                                <ReportPhotoCell
                                  src={r.afterPhoto}
                                  photoKey={\`web-after-\${r.id || itemNumber}\`}
                                  defaultHeight={photoHeight || 45}
                                  defaultFit={photoFit || 'contain'}
                                  photoAlign={photoAlign}
                                  customStyles={photoCustomStyles}
                                  onUpdatePhotoStyle={onUpdatePhotoStyle}
                                  label="DÖF Sonrası"
                                />
                              ) : <span className="text-gray-400 italic text-center" style={{ fontSize: \`calc(\${reportFontSize} - 2pt)\` }}>-</span>}
                              {r.postScore && <div className="font-bold text-green-700 text-center mt-0.5" style={{ fontSize: \`calc(\${reportFontSize} - 1.5pt)\` }}>Tamamlandı</div>}
                            </div>
                          </td>
                          <td className="border border-black p-0 text-center" style={{ verticalAlign: cellVAlign }}><div className="vertical-text font-bold" style={{ fontSize: reportFontSize }}>{r.controlDate ? formatDateTR(r.controlDate) : '-'}</div></td>

                          {methodConfig.fields.map(field => (
                            <td key={\`post-\${field}\`} className="border border-black text-center font-bold bg-gray-50 p-0" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                              {r['post' + field] !== undefined ? r['post' + field] : '-'}
                            </td>
                          ))}

                          <td className="border border-black text-center font-bold p-0" style={{ backgroundColor: postLevel?.bgPrint || 'white', color: postLevel?.textPrint || 'black', fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                            {r.postScore || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>`;

if (oldWebTbodyRegex.test(code)) {
  code = code.replace(oldWebTbodyRegex, newWebTbody);
  console.log('  ✔ WebReportEditor tbody fully updated to use dynamic reportFontSize & alignments');
} else {
  console.error('  ❌ oldWebTbodyRegex match failed');
}

console.log('>>> [3/4] Patching SahaZiyaretEditor with alignment and custom pagination...');

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
  onPageSizesChange
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
  onCustomPaginationTrigger
}) => {`;

if (code.includes(oldSahaEditorProps)) {
  code = code.replace(oldSahaEditorProps, newSahaEditorProps);
  console.log('  ✔ SahaZiyaretEditor signature updated with alignment & custom pagination props');
}

// In SahaZiyaretEditor, guard useEffect with isCustomPagination
const oldSahaUseEffect = `  useEffect(() => {
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
  }, [assessment?.risks?.length, itemsPerPage]);`;

const newSahaUseEffect = `  useEffect(() => {
    if (isCustomPagination) return; // Do not overwrite custom per-page sizes!
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
  }, [assessment?.risks?.length, itemsPerPage, isCustomPagination]);`;

if (code.includes(oldSahaUseEffect)) {
  code = code.replace(oldSahaUseEffect, newSahaUseEffect);
  console.log('  ✔ SahaZiyaretEditor useEffect guard for isCustomPagination added');
}

// In SahaZiyaretEditor adjustPageSizes, call onCustomPaginationTrigger
const oldSahaAdjust = `    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
  };

  const pages = [];`;

const newSahaAdjust = `    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };

  const pages = [];`;

if (code.includes(oldSahaAdjust)) {
  code = code.replace(oldSahaAdjust, newSahaAdjust);
  console.log('  ✔ onCustomPaginationTrigger hooked into SahaZiyaretEditor adjustPageSizes');
}

// Update SahaZiyaretEditor tbody to use tableVerticalAlign & tableTextAlign
const oldSahaTbodyRegex = /<tbody>\s*\{pageRisks\.map\(\(risk, index\) => \{[\s\S]*?return \(\s*<tr key=\{index\}>[\s\S]*?<\/tr>\s*\);\s*\}\)\}\s*<\/tbody>/;

const newSahaTbody = `<tbody>
                    {pageRisks.map((risk, index) => {
                      const itemNumber = sumBefore + index + 1;
                      const initialStatus = risk.postScore ? { text: 'TAMAMLANDI', class: 'status-tamam' } : { text: 'İVEDİ', class: 'status-ivedi' };
                      const cellVAlign = tableVerticalAlign || 'middle';
                      const cellTAlign = tableTextAlign || 'left';

                      return (
                        <tr key={index} style={{ verticalAlign: cellVAlign }}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', verticalAlign: cellVAlign, fontSize: reportFontSize }}>{itemNumber}</td>
                          <td style={{ textAlign: 'center', fontSize: reportFontSize, verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{formatDateTR(assessment.createdAt)}</td>
                          <td style={{ verticalAlign: cellVAlign }}>
                            {risk.beforePhoto && (
                              <ReportPhotoCell
                                src={risk.beforePhoto}
                                photoKey={\`saha-before-\${risk.id || itemNumber}\`}
                                defaultHeight={photoHeight || 80}
                                defaultFit={photoFit || 'contain'}
                                photoAlign={photoAlign}
                                customStyles={photoCustomStyles}
                                onUpdatePhotoStyle={onUpdatePhotoStyle}
                                label="Tehlike Öncesi"
                              />
                            )}
                            <div style={{ fontSize: reportFontSize, textAlign: 'center' }} contentEditable suppressContentEditableWarning>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{risk.processOwner}</div>
                              {risk.affectedPersons && (
                                <div style={{ fontStyle: 'italic', fontSize: \`calc(\${reportFontSize} - 1.5pt)\`, color: '#555' }}>
                                  (Etkilenen: {risk.affectedPersons})
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
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
                          </td>
                          <td style={{ verticalAlign: cellVAlign, padding: '4px', textAlign: cellTAlign }}>
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
                          </td>
                          <td style={{ verticalAlign: cellVAlign }}>
                            {risk.afterPhoto && (
                              <ReportPhotoCell
                                src={risk.afterPhoto}
                                photoKey={\`saha-after-\${risk.id || itemNumber}\`}
                                defaultHeight={photoHeight || 80}
                                defaultFit={photoFit || 'contain'}
                                photoAlign={photoAlign}
                                customStyles={photoCustomStyles}
                                onUpdatePhotoStyle={onUpdatePhotoStyle}
                                label="DÖF Sonrası"
                              />
                            )}
                            <div style={{ fontSize: reportFontSize, textAlign: 'center', fontWeight: 'bold' }} contentEditable suppressContentEditableWarning>
                              {risk.controlDate ? 'TARİH: ' + formatDateTR(risk.controlDate) : ''}
                            </div>
                          </td>
                          <td className={\`\${initialStatus.class} cursor-pointer select-none\`} style={{ fontSize: reportFontSize, textAlign: 'center', verticalAlign: cellVAlign, fontWeight: 'bold', padding: '4px 2px' }} onClick={(e) => { const el = e.currentTarget; if (el.innerText === 'İVEDİ') { el.innerText = 'DEVAM EDİYOR'; el.className = 'status-devam cursor-pointer select-none'; } else if (el.innerText === 'DEVAM EDİYOR') { el.innerText = 'TAMAMLANDI'; el.className = 'status-tamam cursor-pointer select-none'; } else { el.innerText = 'İVEDİ'; el.className = 'status-ivedi cursor-pointer select-none'; } }}>
                            {initialStatus.text}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>`;

if (oldSahaTbodyRegex.test(code)) {
  code = code.replace(oldSahaTbodyRegex, newSahaTbody);
  console.log('  ✔ SahaZiyaretEditor tbody updated with alignments and direct reportFontSize');
} else {
  console.error('  ❌ oldSahaTbodyRegex match failed');
}

console.log('>>> [4/4] Updating AdvancedReportModal states, toolbar & component invocations...');

// Add new states in AdvancedReportModal
const oldModalNewStatesTarget = `  const [webPageSizes, setWebPageSizes] = useState([]);
  const [sahaPageSizes, setSahaPageSizes] = useState([]);
  const [optimizedRisks, setOptimizedRisks] = useState(null);
  const [originalRisksBackup, setOriginalRisksBackup] = useState(null);
  const [isOptimizingText, setIsOptimizingText] = useState(false);`;

const newModalNewStates = `  const [webPageSizes, setWebPageSizes] = useState([]);
  const [sahaPageSizes, setSahaPageSizes] = useState([]);
  const [isCustomPagination, setIsCustomPagination] = useState(false);
  const [tableVerticalAlign, setTableVerticalAlign] = useState('middle'); // 'top', 'middle', 'bottom'
  const [tableTextAlign, setTableTextAlign] = useState('left'); // 'left', 'center'
  const [photoAlign, setPhotoAlign] = useState('center'); // 'top', 'center', 'bottom'
  const [optimizedRisks, setOptimizedRisks] = useState(null);
  const [originalRisksBackup, setOriginalRisksBackup] = useState(null);
  const [isOptimizingText, setIsOptimizingText] = useState(false);`;

if (code.includes(oldModalNewStatesTarget)) {
  code = code.replace(oldModalNewStatesTarget, newModalNewStates);
  console.log('  ✔ AdvancedReportModal alignment & isCustomPagination states added');
}

// Pass new props to SahaZiyaretEditor invocation
const oldSahaModalCall = `<SahaZiyaretEditor
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

const newSahaModalCall = `<SahaZiyaretEditor
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
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                photoAlign={photoAlign}
                isCustomPagination={isCustomPagination}
                onCustomPaginationTrigger={setIsCustomPagination}
              />`;

if (code.includes(oldSahaModalCall)) {
  code = code.replace(oldSahaModalCall, newSahaModalCall);
  console.log('  ✔ SahaZiyaretEditor invocation updated with new alignment and pagination props');
}

// Pass new props to WebReportEditor invocation
const oldWebModalCall = `<WebReportEditor
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

const newWebModalCall = `<WebReportEditor
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
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                photoAlign={photoAlign}
                isCustomPagination={isCustomPagination}
                onCustomPaginationTrigger={setIsCustomPagination}
              />`;

if (code.includes(oldWebModalCall)) {
  code = code.replace(oldWebModalCall, newWebModalCall);
  console.log('  ✔ WebReportEditor invocation updated with new alignment and pagination props');
}

// Replace Toolbar section with font controls, alignment controls, and pagination toggle
const oldToolbarFontAndItemsRegex = /<div className="flex items-center gap-1\.5 text-xs text-white">\s*<span className="font-bold text-slate-300">Yazı Boyutu:<\/span>[\s\S]*?<\/select>\s*<\/div>\s*\{\(reportType === 'ziyaret' \|\| reportType === 'web'\) && \(\s*<>\s*<div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"><\/div>\s*<div className="flex items-center gap-1\.5 text-xs text-white">\s*<span className="font-bold text-slate-300">Sayfa Başı:<\/span>[\s\S]*?<\/select>\s*<\/div>/;

const newToolbarControls = `{/* YAZI BOYUTU (A- / A+ VE SEÇİCİ) */}
          <div className="flex items-center gap-1.5 text-xs text-white bg-slate-700/80 px-2 py-1 rounded-xl border border-slate-600">
            <span className="font-bold text-slate-200 text-[11px]">Yazı Boyutu:</span>
            <button
              type="button"
              onClick={() => {
                const sizes = ['5.5pt','6pt','6.5pt','7pt','7.5pt','8pt','8.5pt','9pt','9.5pt','10pt','11pt','12pt','13pt','14pt'];
                const curIdx = sizes.indexOf(reportFontSize);
                if (curIdx > 0) setReportFontSize(sizes[curIdx - 1]);
                else setReportFontSize('6pt');
              }}
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-600"
              title="Yazı boyutunu küçült (A-)"
            >
              A-
            </button>
            <select
              value={reportFontSize}
              onChange={(e) => setReportFontSize(e.target.value)}
              className="bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
            >
              <option value="5.5pt">5.5pt</option>
              <option value="6pt">6pt</option>
              <option value="6.5pt">6.5pt</option>
              <option value="7pt">7pt</option>
              <option value="7.5pt">7.5pt</option>
              <option value="8pt">8pt</option>
              <option value="8.5pt">8.5pt</option>
              <option value="9pt">9pt</option>
              <option value="9.5pt">9.5pt</option>
              <option value="10pt">10pt</option>
              <option value="11pt">11pt</option>
              <option value="12pt">12pt</option>
              <option value="13pt">13pt</option>
              <option value="14pt">14pt</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const sizes = ['5.5pt','6pt','6.5pt','7pt','7.5pt','8pt','8.5pt','9pt','9.5pt','10pt','11pt','12pt','13pt','14pt'];
                const curIdx = sizes.indexOf(reportFontSize);
                if (curIdx !== -1 && curIdx < sizes.length - 1) setReportFontSize(sizes[curIdx + 1]);
                else setReportFontSize('9pt');
              }}
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-600"
              title="Yazı boyutunu büyüt (A+)"
            >
              A+
            </button>
          </div>

          <div className="h-5 w-px bg-slate-600 mx-1 hidden sm:block"></div>

          {/* DİKEY VE YATAY HİZALAMA KONTROLLERİ */}
          <div className="flex items-center gap-2 bg-slate-700/80 px-2 py-1 rounded-xl border border-slate-600 text-xs text-white">
            <span className="font-bold text-sky-300 text-[11px]">Hizalama:</span>
            {/* Dikey Hizalama */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-600">
              <button
                type="button"
                onClick={() => setTableVerticalAlign('top')}
                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors \${tableVerticalAlign === 'top' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Hücreleri ve yazıları yukarı hizala"
              >
                Üst
              </button>
              <button
                type="button"
                onClick={() => setTableVerticalAlign('middle')}
                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors \${tableVerticalAlign === 'middle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Hücreleri ve yazıları dikeyde ortala"
              >
                Orta
              </button>
              <button
                type="button"
                onClick={() => setTableVerticalAlign('bottom')}
                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors \${tableVerticalAlign === 'bottom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Hücreleri ve yazıları aşağı hizala"
              >
                Alt
              </button>
            </div>

            {/* Metin Yatay Hizalama */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-600">
              <button
                type="button"
                onClick={() => setTableTextAlign('left')}
                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors \${tableTextAlign === 'left' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Metinleri sola hizala"
              >
                Sola
              </button>
              <button
                type="button"
                onClick={() => setTableTextAlign('center')}
                className={\`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors \${tableTextAlign === 'center' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Metinleri ortala"
              >
                Ortala
              </button>
            </div>

            {/* Görsel Dikey Konumu */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-600">
              <span className="text-[10px] text-slate-400 mr-1 ml-0.5">Foto:</span>
              <button
                type="button"
                onClick={() => setPhotoAlign('top')}
                className={\`px-1 py-0.5 rounded text-[10px] font-bold transition-colors \${photoAlign === 'top' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Fotoğrafları yukarı sabitle"
              >
                Üst
              </button>
              <button
                type="button"
                onClick={() => setPhotoAlign('center')}
                className={\`px-1 py-0.5 rounded text-[10px] font-bold transition-colors \${photoAlign === 'center' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Fotoğrafları dikeyde ortala"
              >
                Orta
              </button>
              <button
                type="button"
                onClick={() => setPhotoAlign('bottom')}
                className={\`px-1 py-0.5 rounded text-[10px] font-bold transition-colors \${photoAlign === 'bottom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'}\`}
                title="Fotoğrafları aşağı hizala"
              >
                Alt
              </button>
            </div>
          </div>

          {(reportType === 'ziyaret' || reportType === 'web') && (
            <>
              <div className="h-5 w-px bg-slate-600 mx-1 hidden sm:block"></div>
              {/* SAYFALAMA KONTROLÜ: SABİT SAYFA BAŞI vs ÖZEL SAYFALAMA */}
              <div className="flex items-center gap-1.5 text-xs text-white bg-slate-700/80 px-2 py-1 rounded-xl border border-slate-600">
                {!isCustomPagination ? (
                  <>
                    <span className="font-bold text-slate-300 text-[11px]">Sayfa Başı:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItemsPerPage(val);
                        setIsCustomPagination(false);
                      }}
                      className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
                      title="Her sayfaya standart madde sayısı belirler"
                    >
                      <option value={1}>1 Madde</option>
                      <option value={2}>2 Madde</option>
                      <option value={3}>3 Madde</option>
                      <option value={4}>4 Madde</option>
                      <option value={5}>5 Madde</option>
                    </select>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1" title="Sayfalara özel madde sayısı atandı. Genel sayfa başı özelliği devre dışı bırakıldı.">
                      ⚡ Özel Sayfalama Aktif (Sayfa Başı Devre Dışı)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPagination(false);
                        setWebPageSizes([]);
                        setSahaPageSizes([]);
                      }}
                      className="bg-purple-800 hover:bg-purple-700 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border border-purple-400"
                      title="Tüm sayfalara standart eşit madde sayısını geri yükler"
                    >
                      ↺ Sabit'e Dön
                    </button>
                  </div>
                )}
              </div>`;

if (oldToolbarFontAndItemsRegex.test(code)) {
  code = code.replace(oldToolbarFontAndItemsRegex, newToolbarControls);
  console.log('  ✔ AdvancedReportModal toolbar fully updated with font A-/A+, alignments, and custom pagination toggle');
} else {
  console.error('  ❌ oldToolbarFontAndItemsRegex match failed');
}

// Write back
fs.writeFileSync(targetFile, code, 'utf8');
console.log('>>> [DONE] App.jsx successfully patched!');
