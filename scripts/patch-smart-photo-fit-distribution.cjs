const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let code = fs.readFileSync(appPath, 'utf8');

console.log('Original code length:', code.length);

// 1. Patch ReportPhotoCell to add maxClampHeight = 82, clamp raw height and container/img maxHeight
const oldReportPhotoCellSignature = `function ReportPhotoCell({
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

const newReportPhotoCellSignature = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = '',
  photoAlign = 'center',
  maxClampHeight = 82
}) {`;

if (!code.includes(oldReportPhotoCellSignature)) {
  console.error('Could not find oldReportPhotoCellSignature');
  process.exit(1);
}

code = code.replace(oldReportPhotoCellSignature, newReportPhotoCellSignature);

// Update ReportPhotoCell clamping logic
const oldPhotoClampBlock = `  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');`;

const newPhotoClampBlock = `  const custom = customStyles?.[photoKey] || {};
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;
  const currentAlign = custom.align !== undefined ? custom.align : (photoAlign || 'center');

  // Akıllı Tavan Koruması (Smart Clamp): A4 Yatay tabloda dikey fotoğraf kontrolsüz şişemez
  const effectiveMaxH = maxClampHeight || 82;
  const rawHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const clampedHeight = Math.min(rawHeight, effectiveMaxH);
  const currentHeight = clampedHeight;`;

if (!code.includes(oldPhotoClampBlock)) {
  console.error('Could not find oldPhotoClampBlock');
  process.exit(1);
}
code = code.replace(oldPhotoClampBlock, newPhotoClampBlock);

// Update ReportPhotoCell container & img styles to respect clampedHeight and effectiveMaxH
const oldPhotoContainerStyle = `      style={{
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
          maxHeight: currentFit === 'full_width' ? '280px' : '100%',
          objectFit: currentFit === 'full_width' ? 'cover' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
          display: 'block'
        }}
      />`;

const newPhotoContainerStyle = `      style={{
        height: \`\${clampedHeight}px\`,
        maxHeight: \`\${effectiveMaxH}px\`,
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
          height: '100%',
          maxHeight: \`\${effectiveMaxH}px\`,
          objectFit: currentFit === 'full_width' ? 'cover' : currentFit,
          objectPosition: currentAlign === 'top' ? 'top center' : currentAlign === 'bottom' ? 'bottom center' : 'center center',
          transform: \`rotate(\${currentRotate}deg)\`,
          transition: 'transform 0.2s ease, height 0.15s ease',
          flexShrink: 1,
          display: 'block'
        }}
      />`;

if (!code.includes(oldPhotoContainerStyle)) {
  console.error('Could not find oldPhotoContainerStyle');
  process.exit(1);
}
code = code.replace(oldPhotoContainerStyle, newPhotoContainerStyle);

console.log('ReportPhotoCell successfully updated');

// 2. Patch WebReportEditor capacity calculation & legend height deduction on the last page
const oldWebEditorBudget = `        // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Web - A4 Yatay)
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

const newWebEditorBudget = `        // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Web - A4 Yatay)
        const isPage1 = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const headerH = isPage1 ? 130 : 35;
        const footerH = signatureStyle === 'hide' ? 20 : (signatureStyle === 'standard' ? 70 : 55);
        const legendH = isLastPage ? 145 : 0; // Son Sayfa Metodoloji Lejantı Bütçesi!
        const paddingH = 85;
        const theadH = 30;
        const pageBudget = 794 - (headerH + footerH + paddingH + theadH + legendH); // Son sayfada ~444px net bütçe

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

if (!code.includes(oldWebEditorBudget)) {
  console.error('Could not find oldWebEditorBudget');
  process.exit(1);
}
code = code.replace(oldWebEditorBudget, newWebEditorBudget);
console.log('WebEditor budget & legend deduction updated');

// 3. Patch WebReportEditor table row and cells to use verticalAlign: 'top' for content cells
const oldWebRowReturn = `                      return (
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
                                  defaultHeight={effectivePhotoH}
                                  defaultFit={photoFit || 'contain'}
                                  photoAlign={photoAlign}
                                  customStyles={photoCustomStyles}
                                  onUpdateCustomStyle={onUpdatePhotoStyle}
                                  label="Tehlike Öncesi"
                                />
                              ) : <span className="text-gray-400 italic text-center" style={{ fontSize: \`calc(\${reportFontSize} - 2pt)\` }}>-</span>}
                              <ReportTextCell
                                cellKey={\`web-desc-\${r.id || itemNumber}\`}
                                defaultFontSize={symbioticTextFont}
                                customStyles={cellCustomStyles}
                                onUpdateCustomStyle={onUpdateCellStyle}
                                style={{ textAlign: cellTAlign, lineHeight: '1.2' }}
                              >
                                {r.description}
                              </ReportTextCell>
                            </div>
                          </td>
                          <td className="border border-black text-center font-bold bg-slate-50" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>{r.activity || '-'}</td>
                          <td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>
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
                          </td>

                          {methodConfig.fields.map(field => (
                            <td key={field} className="border border-black text-center font-bold bg-gray-50 p-0" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                              {r[field] !== undefined ? r[field] : '-'}
                            </td>
                          ))}

                          <td className="border border-black text-center font-bold text-white p-0" style={{ backgroundColor: level.bgPrint, color: level.textPrint, fontSize: reportFontSize, verticalAlign: cellVAlign }}>
                            {r.score}
                          </td>

                          <td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`web-prec-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              {r.precaution}
                            </ReportTextCell>
                          </td>
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
                                  defaultHeight={effectivePhotoH}
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
                      );`;

const newWebRowReturn = `                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="border border-black text-center py-0.5 font-bold" style={{ fontSize: reportFontSize, verticalAlign: 'middle' }}>{itemNumber}</td>
                          <td className="border border-black p-0 text-center bg-slate-50" style={{ verticalAlign: 'middle' }}><div className="vertical-text font-bold" style={{ fontSize: reportFontSize }}>{r.department}</div></td>
                          <td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: 'top', textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1">
                              {r.topic && <div className="font-bold bg-yellow-50 p-0.5 border-b border-gray-100 text-center" style={{ fontSize: reportFontSize }}>{r.topic}</div>}
                              {r.beforePhoto ? (
                                <ReportPhotoCell
                                  src={r.beforePhoto}
                                  photoKey={\`web-before-\${r.id || itemNumber}\`}
                                  defaultHeight={effectivePhotoH}
                                  defaultFit={photoFit || 'contain'}
                                  photoAlign={photoAlign}
                                  customStyles={photoCustomStyles}
                                  onUpdateCustomStyle={onUpdatePhotoStyle}
                                  label="Tehlike Öncesi"
                                  maxClampHeight={80}
                                />
                              ) : <span className="text-gray-400 italic text-center" style={{ fontSize: \`calc(\${reportFontSize} - 2pt)\` }}>-</span>}
                              <ReportTextCell
                                cellKey={\`web-desc-\${r.id || itemNumber}\`}
                                defaultFontSize={symbioticTextFont}
                                customStyles={cellCustomStyles}
                                onUpdateCustomStyle={onUpdateCellStyle}
                                style={{ textAlign: cellTAlign, lineHeight: '1.2' }}
                              >
                                {r.description}
                              </ReportTextCell>
                            </div>
                          </td>
                          <td className="border border-black p-1 text-center font-bold bg-slate-50" style={{ fontSize: reportFontSize, verticalAlign: 'top' }}>{r.activity || '-'}</td>
                          <td className="border border-black p-1 font-normal" style={{ verticalAlign: 'top', textAlign: cellTAlign }}>
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
                          </td>

                          {methodConfig.fields.map(field => (
                            <td key={field} className="border border-black text-center font-bold bg-gray-50 p-0" style={{ fontSize: reportFontSize, verticalAlign: 'middle' }}>
                              {r[field] !== undefined ? r[field] : '-'}
                            </td>
                          ))}

                          <td className="border border-black text-center font-bold text-white p-0" style={{ backgroundColor: level.bgPrint, color: level.textPrint, fontSize: reportFontSize, verticalAlign: 'middle' }}>
                            {r.score}
                          </td>

                          <td className="border border-black p-1 font-normal" style={{ verticalAlign: 'top', textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`web-prec-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              {r.precaution}
                            </ReportTextCell>
                          </td>
                          <td className="border border-black p-0 text-center" style={{ verticalAlign: 'top' }}><div className="vertical-text" style={{ fontSize: reportFontSize, marginTop: '4px' }}>{r.affectedPersons || 'Tümü'}</div></td>
                          <td className="border border-black p-1 text-center" style={{ fontSize: reportFontSize, verticalAlign: 'top' }}>
                            <div className="font-bold mb-0.5 border-b border-gray-100 pb-0.5">{r.processOwner || '-'}</div>
                            <div>{r.deadline ? formatDateTR(r.deadline) : '-'}</div>
                          </td>

                          <td className="border border-black p-1 bg-white" style={{ verticalAlign: 'top' }}>
                            <div className="flex flex-col gap-1">
                              {r.afterPhoto ? (
                                <ReportPhotoCell
                                  src={r.afterPhoto}
                                  photoKey={\`web-after-\${r.id || itemNumber}\`}
                                  defaultHeight={effectivePhotoH}
                                  defaultFit={photoFit || 'contain'}
                                  photoAlign={photoAlign}
                                  customStyles={photoCustomStyles}
                                  onUpdatePhotoStyle={onUpdatePhotoStyle}
                                  label="DÖF Sonrası"
                                  maxClampHeight={80}
                                />
                              ) : <span className="text-gray-400 italic text-center" style={{ fontSize: \`calc(\${reportFontSize} - 2pt)\` }}>-</span>}
                              {r.postScore && <div className="font-bold text-green-700 text-center mt-0.5" style={{ fontSize: \`calc(\${reportFontSize} - 1.5pt)\` }}>Tamamlandı</div>}
                            </div>
                          </td>
                          <td className="border border-black p-0 text-center" style={{ verticalAlign: 'top' }}><div className="vertical-text font-bold" style={{ fontSize: reportFontSize, marginTop: '4px' }}>{r.controlDate ? formatDateTR(r.controlDate) : '-'}</div></td>

                          {methodConfig.fields.map(field => (
                            <td key={\`post-\${field}\`} className="border border-black text-center font-bold bg-gray-50 p-0" style={{ fontSize: reportFontSize, verticalAlign: 'middle' }}>
                              {r['post' + field] !== undefined ? r['post' + field] : '-'}
                            </td>
                          ))}

                          <td className="border border-black text-center font-bold p-0" style={{ backgroundColor: postLevel?.bgPrint || 'white', color: postLevel?.textPrint || 'black', fontSize: reportFontSize, verticalAlign: 'middle' }}>
                            {r.postScore || '-'}
                          </td>
                        </tr>
                      );`;

if (!code.includes(oldWebRowReturn)) {
  console.error('Could not find oldWebRowReturn');
  process.exit(1);
}
code = code.replace(oldWebRowReturn, newWebRowReturn);
console.log('WebReportEditor verticalAlign: top successfully applied');

// 4. Update handleSmartAutoPack to support photoFit modes (Tam Geniş, Doldur, Sığdır) & legend budget
const oldHandleSmartAutoPack = `  const handleSmartAutoPack = () => {
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

    // Plan 1: Simbiyotik ve "Doldur" Uyumlu Satır Yüksekliği Hesabı
    const isCover = photoFit === 'cover' || photoFit === 'full_width';
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

      // Eğer kullanıcı "Doldur" seçtiyse fotoğrafın gerçek dolu yüksekliğini baz al
      let curDefaultPhotoH = photoHeight || (isCover ? (isWeb ? 72 : 95) : (isWeb ? 55 : 85));
      if (isCover) {
        curDefaultPhotoH = Math.max(isWeb ? 68 : 88, curDefaultPhotoH);
      } else {
        if (maxChars > 350) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 45 : 68);
        else if (maxChars > 220) curDefaultPhotoH = Math.min(curDefaultPhotoH, isWeb ? 52 : 78);
      }

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

const newHandleSmartAutoPack = `  const handleSmartAutoPack = (targetFit) => {
    const risksList = risksToUse;
    if (!risksList || risksList.length === 0) {
      alert("Dağıtılacak risk/madde bulunamadı.");
      return;
    }

    const fitToUse = targetFit || photoFit || 'contain';
    if (targetFit && targetFit !== photoFit) {
      setPhotoFit(targetFit);
    }

    const isWeb = reportType === 'web';
    const isSaha = reportType === 'ziyaret';

    if (!isWeb && !isSaha) {
      alert("Akıllı dağıtıcı sadece Web Raporu (A4 Yatay) ve Saha Takip Raporu (A4 Dikey) için geçerlidir.");
      return;
    }

    // Güvenlik marjı (A4 Yatay: Toplam yükseklik 794px)
    // Sayfa 1: Başlık (130px) + İmza (55px) + Padding (85px) + Thead (30px) => Net: 494px, Güvenli Bütçe: 420px
    // Ara Sayfalar: Başlık (35px) + İmza (55px) + Padding (85px) + Thead (30px) => Net: 589px, Güvenli Bütçe: 510px
    // Son Sayfa (Metodoloji Lejantı olan sayfa): Ekstra 145px Lejant Tablosu düşülür! Net: 444px, Güvenli Bütçe: 365px!
    const budgetPage1 = isWeb ? 420 : 650;
    const budgetOtherPages = isWeb ? 510 : 650;
    const legendBudgetH = isWeb ? 145 : 0;

    const fontPt = parseFloat(reportFontSize) || 8;
    const fontPx = fontPt * 1.33;
    const lineH = fontPx * 1.2;

    // Fotoğraf Moduna Göre (contain, cover, full_width) Satır Yüksekliği Hesabı
    const maxPhotoClamp = isWeb ? 80 : 110;
    let basePhotoH = 48;
    if (fitToUse === 'full_width') basePhotoH = 75;
    else if (fitToUse === 'cover') basePhotoH = 70;
    else basePhotoH = 48; // contain

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
    }

    if (isWeb) {
      setWebPageSizes(newSizes);
    } else {
      setSahaPageSizes(newSizes);
    }
    setIsCustomPagination(true);

    const fitLabel = fitToUse === 'full_width' ? 'Tam Geniş' : fitToUse === 'cover' ? 'Doldur' : 'Sığdır';
    const summaryStr = newSizes.map((s, idx) => \`Sayfa \${idx + 1}: \${s} madde\`).join(', ');
    alert(\`⚡ A4 Akıllı Dağıtım Tamamlandı! (\${fitLabel} Modu)\\n\\n• Metinler üstten hizalandı (vertical-align: top)\\n• Dikey fotoğraflar tavan sınırına (max 80px) uyarlandı\\n• Son sayfa metodoloji bütçesi (145px) korundu\\n\\nToplam \${risksList.length} madde \${newSizes.length} sayfaya paylaştırıldı:\\n[ \${summaryStr} ]\`);
  };`;

if (!code.includes(oldHandleSmartAutoPack)) {
  console.error('Could not find oldHandleSmartAutoPack');
  process.exit(1);
}
code = code.replace(oldHandleSmartAutoPack, newHandleSmartAutoPack);
console.log('handleSmartAutoPack successfully updated');

// 5. Update the Toolbar UI buttons to show mode & trigger smart auto pack on mode click
const oldFitButtons = `                {/* Tam Geniş Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('full_width');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'full_width' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre genişliğine tam oturtur (Tam Geniş)"
                >
                  ↔ Tam Geniş
                </button>

                {/* Hücreye Sığdır Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('contain');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'contain' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre içine orantılı sığdırır"
                >
                  ⊡ Sığdır
                </button>

                {/* Doldur (Kırp) Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('cover');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'cover' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücreyi tam dolduracak şekilde kırpar"
                >
                  ▨ Doldur
                </button>`;

const newFitButtons = `                {/* Tam Geniş Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('full_width');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                    handleSmartAutoPack('full_width');
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'full_width' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre genişliğine yayar ve sayfaları Tam Geniş moduna göre A4'e akıllı dağıtır"
                >
                  ↔ Tam Geniş
                </button>

                {/* Hücreye Sığdır Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('contain');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                    handleSmartAutoPack('contain');
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'contain' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücre içine orantılı sığdırır ve sayfaları Sığdır moduna göre A4'e akıllı dağıtır"
                >
                  ⊡ Sığdır
                </button>

                {/* Doldur (Kırp) Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFit('cover');
                    setPhotoCustomStyles(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => { if (updated[k]) delete updated[k].fit; });
                      return updated;
                    });
                    handleSmartAutoPack('cover');
                  }}
                  className={\`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border \${photoFit === 'cover' ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'}\`}
                  title="Fotoğrafları hücreyi tam dolduracak şekilde kırpar ve sayfaları Doldur moduna göre A4'e akıllı dağıtır"
                >
                  ▨ Doldur
                </button>`;

if (!code.includes(oldFitButtons)) {
  console.error('Could not find oldFitButtons');
  process.exit(1);
}
code = code.replace(oldFitButtons, newFitButtons);
console.log('FitButtons click handlers updated');

// 6. Update the main "A4'e Akıllı Dağıt" button label to display current mode
const oldPackBtn = `<button
              type="button"
              onClick={handleSmartAutoPack}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-indigo-400 cursor-pointer"
              title="Maddelerin metin ve fotoğraf boyutlarını analiz eder, her sayfayı A4 boyutuna taşma yapmayacak şekilde otomatik dağıtır"
            >
              <Zap size={14} className="text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>⚡ A4'e Akıllı Dağıt</span>
            </button>`;

const newPackBtn = `<button
              type="button"
              onClick={() => handleSmartAutoPack(photoFit)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-indigo-400 cursor-pointer"
              title={\`Maddelerin metinlerini ve fotoğraflarını seçili (\${photoFit === 'full_width' ? 'Tam Geniş' : photoFit === 'cover' ? 'Doldur' : 'Sığdır'}) moduna göre analiz eder, A4 sayfalarına taşma yapmayacak şekilde otomatik dağıtır\`}
            >
              <Zap size={14} className="text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>⚡ A4'e Akıllı Dağıt ({photoFit === 'full_width' ? 'Tam Geniş' : photoFit === 'cover' ? 'Doldur' : 'Sığdır'})</span>
            </button>`;

if (!code.includes(oldPackBtn)) {
  console.error('Could not find oldPackBtn');
  process.exit(1);
}
code = code.replace(oldPackBtn, newPackBtn);
console.log('Main pack button label updated');

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully wrote updated App.jsx! New length:', code.length);
