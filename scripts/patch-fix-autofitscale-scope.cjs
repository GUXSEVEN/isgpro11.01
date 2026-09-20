const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [1/2] FIXING WebReportEditor autoFitScale SCOPE...');

const oldWebSection = `      {pages.map((pageRisks, pageIdx) => {
        let sumBefore = 0;
        for (let p = 0; p < pageIdx; p++) {
          sumBefore += pageSizes[p] || 0;
        }

        return (
          <div key={pageIdx} className="mb-8">
            {(() => {
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
              // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
              // Küçük taşmalarda (%100-%118) elemanları mikro oranda ölçekleyerek taşmayı otomatik yok et
              const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
              const isAutoFitted = autoFitScale < 1;
              const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
              const isOverflow = effectivePercent > 102;
              const isTight = effectivePercent >= 94 && effectivePercent <= 102;

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
                        %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
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
            })()}

            {/* A4 Landscape Page Container */}
            <div className="web-report-page">`;

const newWebSection = `      {pages.map((pageRisks, pageIdx) => {
        let sumBefore = 0;
        for (let p = 0; p < pageIdx; p++) {
          sumBefore += pageSizes[p] || 0;
        }

        // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Web - A4 Yatay)
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
        // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
        const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
        const isAutoFitted = autoFitScale < 1;
        const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
        const isOverflow = effectivePercent > 102;
        const isTight = effectivePercent >= 94 && effectivePercent <= 102;

        return (
          <div key={pageIdx} className="mb-8">
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
                    %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
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

            {/* A4 Landscape Page Container */}
            <div className="web-report-page">`;

if (content.includes(oldWebSection)) {
  content = content.replace(oldWebSection, newWebSection);
  console.log('✔ WebReportEditor autoFitScale scope lifted successfully');
} else {
  console.error('❌ Could not match oldWebSection');
}

console.log('>>> [2/2] FIXING SahaZiyaretEditor autoFitScale SCOPE...');

const oldSahaSection = `        {pages.map((pageRisks, pageIdx) => {
          let sumBefore = 0;
          for (let p = 0; p < pageIdx; p++) {
            sumBefore += pageSizes[p] || 0;
          }

          return (
            <div key={pageIdx} className="mb-6">
              {(() => {
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
                // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
                const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
                const isAutoFitted = autoFitScale < 1;
                const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
                const isOverflow = effectivePercent > 102;
                const isTight = effectivePercent >= 94 && effectivePercent <= 102;

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
                          %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
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
              })()}

              <div className="saha-report-page">`;

const newSahaSection = `        {pages.map((pageRisks, pageIdx) => {
          let sumBefore = 0;
          for (let p = 0; p < pageIdx; p++) {
            sumBefore += pageSizes[p] || 0;
          }

          // Canlı A4 Kapasite Göstergesi & Mikro-Ölçekleme Hesabı (Saha - A4 Dikey)
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
          // Plan 2: Sayfa İçi Akıllı Mikro-Ölçekleme (Auto-Fit)
          const autoFitScale = (capPercent > 98 && capPercent <= 118) ? Math.max(0.85, (95 / capPercent)) : 1;
          const isAutoFitted = autoFitScale < 1;
          const effectivePercent = isAutoFitted ? Math.round(capPercent * autoFitScale) : capPercent;
          const isOverflow = effectivePercent > 102;
          const isTight = effectivePercent >= 94 && effectivePercent <= 102;

          return (
            <div key={pageIdx} className="mb-6">
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
                      %{effectivePercent} {isOverflow ? '(A4 Taşıyor!)' : isAutoFitted ? '(Akıllı Sığdırıldı)' : isTight ? '(Sınırda)' : '(A4 İdeal)'}
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

              <div className="saha-report-page">`;

if (content.includes(oldSahaSection)) {
  content = content.replace(oldSahaSection, newSahaSection);
  console.log('✔ SahaZiyaretEditor autoFitScale scope lifted successfully');
} else {
  console.error('❌ Could not match oldSahaSection');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> SCOPE FIX COMPLETE <<<');
