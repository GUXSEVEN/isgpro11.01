const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/4] PATCHING WebReportEditor CSS ZIRHI & LIVE A4 CAPACITY GAUGE...');

// 1. WebReportEditor CSS Armor
const oldWebEditorStyle = `      <style>{\`
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .web-report-page {
            width: 297mm;
            min-width: 297mm;
            height: 210mm;
            min-height: 210mm;
            background: white;
            padding: \${reportPadding};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: black;
            box-sizing: border-box;
        }
        .vertical-text {
            writing-mode: vertical-rl;
            margin: 0 auto;
            white-space: nowrap;
            font-size: 7px;
            font-weight: bold;
        }
        td, th { overflow-wrap: break-word; word-wrap: break-word; }
        .metod-table { width: 100%; border-collapse: collapse; font-size: 7px; margin-top: 5px; }
        .metod-table th { background-color: #f3f4f6; border: 1px solid black; padding: 2px; text-align: center; }
        .metod-table td { border: 1px solid black; padding: 2px; text-align: center; }
        @media print {
            .web-report-page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: \${reportPadding} !important;
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
            .no-print { display: none !important; }
        }
      \`}</style>`;

const newWebEditorStyle = `      <style>{\`
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .web-report-page {
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
        }
        .vertical-text {
            writing-mode: vertical-rl;
            margin: 0 auto;
            white-space: nowrap;
            font-size: 7px;
            font-weight: bold;
        }
        td, th { overflow-wrap: break-word; word-wrap: break-word; }
        .metod-table { width: 100%; border-collapse: collapse; font-size: 7px; margin-top: 5px; }
        .metod-table th { background-color: #f3f4f6; border: 1px solid black; padding: 2px; text-align: center; }
        .metod-table td { border: 1px solid black; padding: 2px; text-align: center; }
        @media print {
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
            .no-print { display: none !important; }
        }
      \`}</style>`;

if (content.includes(oldWebEditorStyle)) {
  content = content.replace(oldWebEditorStyle, newWebEditorStyle);
  console.log('  ✔ WebReportEditor CSS Zırhı replaced');
} else {
  console.error('  ❌ Could not match oldWebEditorStyle');
}

// 2. WebReportEditor Page Bar with Live Capacity Gauge
const oldWebPageBar = `            {/* Page Adjuster Control - Screen Only */}
            <div className="w-[297mm] min-w-[297mm] mx-auto flex items-center justify-between bg-slate-800 text-white p-2 rounded-t-lg text-xs no-print font-sans select-none">
              <span className="font-bold">Sayfa {pageIdx + 1} ({pageRisks.length} Madde)</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-300">Madde Sayısını Ayarla:</span>
                <button
                  onClick={() => adjustPageSizes(pageIdx, -1)}
                  disabled={pageRisks.length <= 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                  title="Bu sayfadan 1 madde eksilt"
                >
                  -
                </button>
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded font-bold">{pageRisks.length}</span>
                <button
                  onClick={() => adjustPageSizes(pageIdx, 1)}
                  disabled={pageIdx === pageSizes.length - 1 || pageRisks.length >= assessment.risks.length}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                  title="Bu sayfaya 1 madde ekle"
                >
                  +
                </button>
              </div>
            </div>`;

const newWebPageBar = `            {(() => {
              // Canlı A4 Kapasite Göstergesi Hesabı (Web - A4 Yatay)
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
              });

              const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
              const isOverflow = capPercent > 102;
              const isTight = capPercent >= 95 && capPercent <= 102;

              return (
                <div className="w-[297mm] min-w-[297mm] mx-auto flex items-center justify-between bg-slate-800 text-white p-2 rounded-t-lg text-xs no-print font-sans select-none">
                  <div className="flex items-center gap-3">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px]">Sayfa {pageIdx + 1}</span>
                      <span className="text-slate-300">({pageRisks.length} Madde)</span>
                    </span>

                    {/* Canlı Doluluk Göstergesi Rozeti */}
                    <div
                      className={\`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1.5 shadow-sm transition-all \${
                        isOverflow
                          ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                          : isTight
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-emerald-600 text-white'
                      }\`}
                      title={
                        isOverflow
                          ? '⚠️ Bu sayfadaki içerik A4 sınırını aşıyor! 1 Madde Kaydır veya A4\\'e Akıllı Dağıt ile taşmayı önleyin.'
                          : isTight
                          ? 'Sınırda (%95 - %102). A4 sayfasına tam sığıyor.'
                          : 'İdeal doluluk. A4 sayfasına ferahça sığıyor.'
                      }
                    >
                      <span>{isOverflow ? '🔴' : isTight ? '🟡' : '🟢'}</span>
                      <span>
                        %{capPercent} {isOverflow ? '(A4 Taşıyor!)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                      </span>
                    </div>

                    {/* Taşma Halinde Hızlı Düzeltme Butonu */}
                    {isOverflow && (
                      <button
                        type="button"
                        onClick={() => adjustPageSizes(pageIdx, -1)}
                        disabled={pageRisks.length <= 1}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                        title="Bu sayfadan 1 maddeyi sonraki sayfaya aktararak taşmayı anında gider"
                      >
                        <span>⚡ 1 Madde Kaydır</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-300">Madde Sayısını Ayarla:</span>
                    <button
                      type="button"
                      onClick={() => adjustPageSizes(pageIdx, -1)}
                      disabled={pageRisks.length <= 1}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                      title="Bu sayfadan 1 madde eksilt"
                    >
                      -
                    </button>
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded font-bold text-amber-300">{pageRisks.length}</span>
                    <button
                      type="button"
                      onClick={() => adjustPageSizes(pageIdx, 1)}
                      disabled={pageIdx === pageSizes.length - 1 || pageRisks.length >= assessment.risks.length}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                      title="Bu sayfaya 1 madde ekle"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })()}`;

if (content.includes(oldWebPageBar)) {
  content = content.replace(oldWebPageBar, newWebPageBar);
  console.log('  ✔ WebReportEditor Live A4 Capacity Gauge & Quick-Fix added');
} else {
  console.error('  ❌ Could not match oldWebPageBar');
}

// 3. WebReportEditor Header & Footer flex tags
content = content.replace(
  '              {pageIdx === 0 ? (\n                <div className="border-2 border-black mb-2">',
  '              {pageIdx === 0 ? (\n                <div className="web-report-header border-2 border-black mb-2 flex-shrink-0">'
);
content = content.replace(
  '              ) : (\n                <div className="border border-black mb-2 px-2 py-1 bg-gray-50 flex justify-between items-center text-[7.5px] font-bold">',
  '              ) : (\n                <div className="web-report-header border border-black mb-2 px-2 py-1 bg-gray-50 flex justify-between items-center text-[7.5px] font-bold flex-shrink-0">'
);
content = content.replace(
  '              {/* 2. TABLO ALANI */}\n              <div className="flex-1 overflow-visible">',
  '              {/* 2. TABLO ALANI */}\n              <div className="web-report-table-container flex-1 overflow-hidden">'
);
content = content.replace(
  '              {/* 3. ALT BİLGİ ALANI (Hizalanmış Alt Bilgi ve Sayfa Numarası) */}\n              <div className="mt-auto pt-1 flex flex-col justify-end">',
  '              {/* 3. ALT BİLGİ ALANI (Hizalanmış Alt Bilgi ve Sayfa Numarası) */}\n              <div className="web-report-footer mt-auto pt-1 flex flex-col justify-end flex-shrink-0">'
);
console.log('  ✔ WebReportEditor flexbox pinning tags applied');

console.log('>>> [2/4] PATCHING SahaZiyaretEditor CSS ZIRHI & LIVE A4 CAPACITY GAUGE...');

// 4. SahaZiyaretEditor CSS Armor
const oldSahaEditorStyle = `      <style>{\`
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
      \`}</style>`;

const newSahaEditorStyle = `      <style>{\`
        .saha-report-page {
            width: 210mm;
            min-width: 210mm;
            height: 295.5mm;
            min-height: 295.5mm;
            max-height: 295.5mm;
            background: white;
            padding: 10mm;
            margin-bottom: 20px;
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
        .saha-report-header { flex-shrink: 0 !important; }
        .saha-report-table-container { flex: 1 1 auto !important; overflow: hidden !important; }
        .saha-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
        .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5pt solid black; }
        .report-table tr, .report-table td, .report-table th, .report-photo-cell-container, .print-cell-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
        }
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
                height: 295.5mm !important;
                min-height: 295.5mm !important;
                max-height: 295.5mm !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                break-inside: avoid-page !important;
                page-break-inside: avoid !important;
                box-sizing: border-box !important;
            }
            .saha-report-page:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
            }
            .saha-report-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
            .saha-report-header { flex-shrink: 0 !important; }
            .saha-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
            .report-table tr, .report-table td, .report-table th, .report-photo-cell-container, .print-cell-wrapper {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
            }
            .no-print { display: none !important; }
        }
      \`}</style>`;

if (content.includes(oldSahaEditorStyle)) {
  content = content.replace(oldSahaEditorStyle, newSahaEditorStyle);
  console.log('  ✔ SahaZiyaretEditor CSS Zırhı replaced');
} else {
  console.error('  ❌ Could not match oldSahaEditorStyle');
}

// 5. SahaZiyaretEditor Page Bar with Live Capacity Gauge
const oldSahaPageBar = `              {/* Sayfa Madde Sayısı Ayarlayıcı - Yalnızca Ekranda */}
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
              </div>`;

const newSahaPageBar = `              {(() => {
                // Canlı A4 Kapasite Göstergesi Hesabı (Saha - A4 Dikey)
                const pageBudget = 750; // Total 1122px - header 135px - sigs 85px - pad 76px - thead 35px
                const fontPt = parseFloat(reportFontSize) || 8;
                const fontPx = fontPt * 1.33;
                const lineH = fontPx * 1.2;

                let totalH = 0;
                pageRisks.forEach((r, idx) => {
                  const itemNum = sumBefore + idx + 1;
                  const beforeKey = \`saha-before-\${r.id || itemNum}\`;
                  const afterKey = \`saha-after-\${r.id || itemNum}\`;
                  const hasB = Boolean(r.beforePhoto);
                  const hasA = Boolean(r.afterPhoto);
                  const bH = hasB ? (photoCustomStyles?.[beforeKey]?.height || photoHeight || 80) : 0;
                  const aH = hasA ? (photoCustomStyles?.[afterKey]?.height || photoHeight || 80) : 0;
                  const pH = Math.max(bH, aH);

                  const maxChars = Math.max((r.hazard?.length || 0), (r.precaution?.length || 0), (r.description?.length || 0));
                  const estLines = Math.max(1, Math.ceil(maxChars / 26));
                  const textH = estLines * lineH;

                  const rowH = Math.max(pH > 0 ? (pH + 20) : 32, textH + 16);
                  totalH += rowH;
                });

                const capPercent = Math.min(250, Math.round((totalH / pageBudget) * 100));
                const isOverflow = capPercent > 102;
                const isTight = capPercent >= 95 && capPercent <= 102;

                return (
                  <div className="w-[210mm] min-w-[210mm] mx-auto flex items-center justify-between bg-slate-800 text-white p-2 rounded-t-lg text-xs no-print font-sans select-none mb-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px]">Sayfa {pageIdx + 1}</span>
                        <span className="text-slate-300">({pageRisks.length} Madde)</span>
                      </span>

                      {/* Canlı Doluluk Göstergesi Rozeti */}
                      <div
                        className={\`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1.5 shadow-sm transition-all \${
                          isOverflow
                            ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                            : isTight
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-emerald-600 text-white'
                        }\`}
                        title={
                          isOverflow
                            ? '⚠️ Bu sayfadaki içerik A4 sınırını aşıyor! 1 Madde Kaydır veya A4\\'e Akıllı Dağıt ile taşmayı önleyin.'
                            : isTight
                            ? 'Sınırda (%95 - %102). A4 sayfasına tam sığıyor.'
                            : 'İdeal doluluk. A4 sayfasına ferahça sığıyor.'
                        }
                      >
                        <span>{isOverflow ? '🔴' : isTight ? '🟡' : '🟢'}</span>
                        <span>
                          %{capPercent} {isOverflow ? '(A4 Taşıyor!)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
                        </span>
                      </div>

                      {/* Taşma Halinde Hızlı Düzeltme Butonu */}
                      {isOverflow && (
                        <button
                          type="button"
                          onClick={() => adjustPageSizes(pageIdx, -1)}
                          disabled={pageRisks.length <= 1}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md font-black text-[10.5px] flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer border border-amber-200 animate-bounce"
                          title="Bu sayfadan 1 maddeyi sonraki sayfaya aktararak taşmayı anında gider"
                        >
                          <span>⚡ 1 Madde Kaydır</span>
                        </button>
                      )}
                    </div>

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
                );
              })()}`;

if (content.includes(oldSahaPageBar)) {
  content = content.replace(oldSahaPageBar, newSahaPageBar);
  console.log('  ✔ SahaZiyaretEditor Live A4 Capacity Gauge & Quick-Fix added');
} else {
  console.error('  ❌ Could not match oldSahaPageBar');
}

// 6. SahaZiyaretEditor Footer wrapping
content = content.replace(
  '                <div className="page-footer-signature">\n                  <div className="sig-box">İŞ GÜVENLİĞİ UZMANI<br /><br /><span style={{ fontWeight: \'normal\' }} contentEditable suppressContentEditableWarning>{uzman}</span></div>\n                  <div className="sig-box">İŞVEREN / İŞVEREN VEKİLİ<br /><br /><span style={{ fontWeight: \'normal\' }} contentEditable suppressContentEditableWarning>{isveren}</span></div>\n                </div>\n                <div className="text-[8px] text-right mt-1 font-bold">Sayfa: {pageIdx + 1}</div>',
  '                <div className="saha-report-footer mt-auto flex-shrink-0">\n                  <div className="page-footer-signature">\n                    <div className="sig-box">İŞ GÜVENLİĞİ UZMANI<br /><br /><span style={{ fontWeight: \'normal\' }} contentEditable suppressContentEditableWarning>{uzman}</span></div>\n                    <div className="sig-box">İŞVEREN / İŞVEREN VEKİLİ<br /><br /><span style={{ fontWeight: \'normal\' }} contentEditable suppressContentEditableWarning>{isveren}</span></div>\n                  </div>\n                  <div className="text-[8px] text-right mt-1 font-bold">Sayfa: {pageIdx + 1}</div>\n                </div>'
);
console.log('  ✔ SahaZiyaretEditor footer flexbox pinning tags applied');

console.log('>>> [3/4] ADDING handleSmartAutoPack IN AdvancedReportModal...');

const smartAutoPackFunction = `  // --- AKILLI A4 DAĞITICI FONKSİYONU ---
  const handleSmartAutoPack = () => {
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

    // A4 sayfa yükseklik bütçeleri (piksel cinsinden)
    // Web (Yatay): Sayfa 1 firma başlığıyla ~475px, Sonraki sayfalar ~565px
    // Saha (Dikey): Tüm sayfalar ~740px
    const budgetPage1 = isWeb ? 475 : 740;
    const budgetOtherPages = isWeb ? 565 : 740;

    const fontPt = parseFloat(reportFontSize) || 8;
    const fontPx = fontPt * 1.33;
    const lineH = fontPx * 1.2;

    const getRowEstimatedH = (r, idx) => {
      const hasBefore = Boolean(r.beforePhoto);
      const hasAfter = Boolean(r.afterPhoto);
      const beforeKey = \`\${isWeb ? 'web' : 'saha'}-before-\${r.id || idx + 1}\`;
      const afterKey = \`\${isWeb ? 'web' : 'saha'}-after-\${r.id || idx + 1}\`;
      const curDefaultPhotoH = photoHeight || (isWeb ? 45 : 80);
      const beforeH = hasBefore ? (photoCustomStyles?.[beforeKey]?.height || curDefaultPhotoH) : 0;
      const afterH = hasAfter ? (photoCustomStyles?.[afterKey]?.height || curDefaultPhotoH) : 0;
      const pH = Math.max(beforeH, afterH);

      const charsPerCol = isWeb ? 28 : 26;
      const maxChars = Math.max(
        (r.hazard?.length || 0),
        (r.risk?.length || 0),
        (r.precaution?.length || 0),
        (r.description?.length || 0)
      );
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

      // Eğer mevcut sayfada en az 1 madde varsa ve bir sonraki madde bütçeyi aşıyorsa:
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

    if (isWeb) {
      setWebPageSizes(newSizes);
    } else {
      setSahaPageSizes(newSizes);
    }
    setIsCustomPagination(true);

    const summaryStr = newSizes.map((s, idx) => \`Sayfa \${idx + 1}: \${s} madde\`).join(', ');
    alert(\`⚡ A4'e Akıllı Dağıtım Tamamlandı!\\n\\nToplam \${risksList.length} madde, A4 sayfalarında taşma olmayacak şekilde \${newSizes.length} sayfaya paylaştırıldı:\\n[ \${summaryStr} ]\`);
  };
`;

const targetBeforeAutoPack = '  const handleRevertReportTexts = () => {\n    setOptimizedRisks(null);\n    setOriginalRisksBackup(null);\n  };';

if (content.includes(targetBeforeAutoPack)) {
  content = content.replace(targetBeforeAutoPack, targetBeforeAutoPack + '\n\n' + smartAutoPackFunction);
  console.log('  ✔ handleSmartAutoPack inserted into AdvancedReportModal');
} else {
  console.error('  ❌ Could not match targetBeforeAutoPack');
}

console.log(">>> [4/4] ADDING ⚡ A4'e Akıllı Dağıt BUTTON TO MODAL TOOLBAR...");

const smartAutoPackBtnJSX = `
          {/* ⚡ A4'E AKILLI DAĞITICI BUTONU */}
          {(reportType === 'ziyaret' || reportType === 'web') && (
            <button
              type="button"
              onClick={handleSmartAutoPack}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-indigo-400 cursor-pointer"
              title="Maddelerin metin ve fotoğraf boyutlarını analiz eder, her sayfayı A4 boyutuna taşma yapmayacak şekilde otomatik dağıtır"
            >
              <Zap size={14} className="text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>⚡ A4'e Akıllı Dağıt</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>
`;

const targetBeforeToolbarBtn = '<div className="h-5 w-px bg-slate-600 mx-2 hidden sm:block"></div>\n\n          {/* İSTEĞE BAĞLI AKILLI METİN OPTİMİZASYONU (SEÇENEK 5) */}';

if (content.includes(targetBeforeToolbarBtn)) {
  content = content.replace(targetBeforeToolbarBtn, smartAutoPackBtnJSX + targetBeforeToolbarBtn);
  console.log('  ✔ ⚡ A4\'e Akıllı Dağıt button added to toolbar');
} else {
  console.error('  ❌ Could not match targetBeforeToolbarBtn');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> ALL PATCHES APPLIED AND SAVED SUCCESSFULLY! <<<');
