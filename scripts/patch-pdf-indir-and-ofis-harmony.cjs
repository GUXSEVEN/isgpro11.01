const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update openSahaZiyaretiReport banner
const oldSahaBanner = `      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; gap: 10px;">
        <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">YAZDIR</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">KAPAT</button>
      </div>`;

const newSahaBanner = `      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">📋 Saha Takip Raporu (A4 Dikey)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>`;

if (content.includes(oldSahaBanner)) {
  content = content.replace(oldSahaBanner, newSahaBanner);
  console.log('✔ [1/5] openSahaZiyaretiReport banner updated to YAZDIR / PDF OLARAK KAYDET');
} else {
  console.log('⚠ [1/5] oldSahaBanner not matched exactly, skipping or already modified');
}

// 2. Update openAcilDurumReport banner
const oldAcilBanner = `      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; gap: 10px;">
        <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">YAZDIR</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">KAPAT</button>
      </div>`;

if (content.includes(oldAcilBanner)) {
  const newAcilBanner = `      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">🚨 Acil Durum Eylem Planı (A4 Dikey)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>`;
  content = content.replace(oldAcilBanner, newAcilBanner);
  console.log('✔ [2/5] openAcilDurumReport banner updated to YAZDIR / PDF OLARAK KAYDET');
} else {
  console.log('⚠ [2/5] oldAcilBanner not matched or already modified');
}

// 3. Update downloadWebReportPDF fallback on desktop
const oldDownloadHeader = `  // Web raporu için: gerçek PDF üret → yeni sekmede tarayıcı PDF görüntüleyicide aç
  const downloadWebReportPDF = async (action = 'open') => {
    if (!assessmentData || !company) {
      alert('Rapor verileri hazır değil.');
      return;
    }
    const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();
    if (!isNative && action === 'open') {
      openWebReport(company, assessmentData);
      return;
    }`;

const newDownloadHeader = `  // Web raporu için: gerçek PDF üret → yeni sekmede tarayıcı PDF görüntüleyicide aç
  const downloadWebReportPDF = async (action = 'open') => {
    if (!assessmentData || !company) {
      alert('Rapor verileri hazır değil.');
      return;
    }
    const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();
    if (!isNative) {
      // PDF Ofis Aç ile aynı canlı önizleme / doğrudan baskı ve kaydetme penceresini açar
      triggerPrint();
      return;
    }`;

if (content.includes(oldDownloadHeader)) {
  content = content.replace(oldDownloadHeader, newDownloadHeader);
  console.log('✔ [3/5] downloadWebReportPDF harmonized with triggerPrint on web');
} else {
  console.log('⚠ [3/5] oldDownloadHeader not matched');
}

// 4. Update Toolbar Action Buttons
const oldToolbarButtons = `        {/* AKSİYON BUTONLARI - MOBİLDE TEK SATIRDA KOMPAKT */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={() => {
              const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();
              setPrintAction(isNative ? 'share' : 'print');
              setShowPrintPrompt(true);
            }}
            className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"
          >
            <Printer size={16} /> <span className="md:hidden">PAYLAŞ</span> <span className="hidden md:inline">YAZDIR / PAYLAŞ</span>
          </button>

          <button
            onClick={() => {
              setPrintAction('open');
              setShowPrintPrompt(true);
            }}
            disabled={isGeneratingPDF}
            className="flex-1 md:flex-none justify-center bg-orange-600 hover:bg-orange-650 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"
          >
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
            <span className="md:hidden">OPF AÇ</span> <span className="hidden md:inline">PDF/OFİS AÇ</span>
          </button>



          {reportType !== 'acil-durum' && assessmentData && (
            <button
              onClick={() => {
                if (checkAndIncrementReportLimit()) {
                  downloadWebReportPDF();
                }
              }}
              disabled={isGeneratingPDF}
              className="flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-colors text-xs md:text-sm flex items-center gap-2"
            >
              {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">PDF İNDİR</span>
            </button>
          )}



          <button
            onClick={onClose}
            className="flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors text-xs md:text-sm"
          >
            KAPAT
          </button>
        </div>`;

const newToolbarButtons = `        {/* AKSİYON BUTONLARI - MOBİLDE TEK SATIRDA KOMPAKT */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={() => {
              const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();
              setPrintAction(isNative ? 'share' : 'print');
              setShowPrintPrompt(true);
            }}
            className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"
          >
            <Printer size={16} /> <span className="md:hidden">PAYLAŞ</span> <span className="hidden md:inline">YAZDIR / PAYLAŞ</span>
          </button>

          <button
            onClick={() => {
              setPrintAction('open');
              setShowPrintPrompt(true);
            }}
            disabled={isGeneratingPDF}
            className="flex-1 md:flex-none justify-center bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"
          >
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
            <span className="md:hidden">PDF/OFİS AÇ</span> <span className="hidden md:inline">PDF/OFİS AÇ</span>
          </button>

          <button
            onClick={() => {
              setPrintAction('download');
              setShowPrintPrompt(true);
            }}
            disabled={isGeneratingPDF}
            className="flex-1 md:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"
          >
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="md:hidden">PDF İNDİR</span> <span className="hidden md:inline">PDF İNDİR</span>
          </button>

          <button
            onClick={onClose}
            className="flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors text-xs md:text-sm"
          >
            KAPAT
          </button>
        </div>`;

if (content.includes(oldToolbarButtons)) {
  content = content.replace(oldToolbarButtons, newToolbarButtons);
  console.log('✔ [4/5] Toolbar Action Buttons updated: PDF İNDİR matched with PDF/OFİS AÇ');
} else {
  console.log('⚠ [4/5] oldToolbarButtons not matched');
}

// 5. Update showPrintPrompt modal header & action footer
const oldModalHeader = `            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-xl">
                <Printer size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Yazdırma Öncesi Kontrol</h3>
                <p className="text-xs text-slate-500">Raporunuzu en uygun sayfa düzeninde yazdırın.</p>
              </div>
            </div>`;

const newModalHeader = `            <div className="flex items-center gap-3 mb-4">
              <div className={\`p-2.5 rounded-xl \${printAction === 'open' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400' : (printAction === 'download' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400')}\`}>
                {printAction === 'open' ? <BookOpen size={24} /> : (printAction === 'download' ? <Download size={24} /> : <Printer size={24} />)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {printAction === 'open' ? 'PDF / Ofis Öncesi Kontrol' : (printAction === 'download' ? 'PDF İndirme Öncesi Kontrol' : 'Yazdırma Öncesi Kontrol')}
                </h3>
                <p className="text-xs text-slate-500">
                  {printAction === 'download' ? 'Raporunuzu en yüksek kalitede PDF olarak kaydedin.' : (printAction === 'open' ? 'Raporunuzu canlı baskı ve ofis düzeninde açın.' : 'Raporunuzu en uygun sayfa düzeninde yazdırın.')}
                </p>
              </div>
            </div>`;

if (content.includes(oldModalHeader)) {
  content = content.replace(oldModalHeader, newModalHeader);
  console.log('✔ [5a/5] showPrintPrompt header updated with dynamic icon & title');
} else {
  console.log('⚠ [5a/5] oldModalHeader not matched');
}

const oldModalFooter = `              <button
                onClick={() => {
                  if (!checkAndIncrementReportLimit()) {
                    return;
                  }
                  setShowPrintPrompt(false);
                  setAuditResult(null);
                  const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();

                  if (reportType === 'web') {
                    if (printAction === 'open') {
                      openWebReport(company, assessmentData);
                    } else {
                      openWebReport(company, assessmentData);
                    }
                  } else {
                    if (isNative) {
                      loadHtml2pdfAndRun(printAction || 'share');
                    } else {
                      triggerPrint();
                    }
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
              >
                {typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform() ? 'Raporu Hazırla' : 'Yazdırmayı Başlat'}
              </button>`;

const newModalFooter = `              <button
                onClick={() => {
                  if (!checkAndIncrementReportLimit()) {
                    return;
                  }
                  setShowPrintPrompt(false);
                  setAuditResult(null);
                  const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform();

                  if (isNative) {
                    loadHtml2pdfAndRun(printAction || 'download');
                  } else {
                    triggerPrint();
                  }
                }}
                className={\`px-5 py-2.5 \${printAction === 'open' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' : (printAction === 'download' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20')} text-white rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2\`}
              >
                {printAction === 'open' ? (
                  <>
                    <BookOpen size={16} /> PDF / Ofis Aç
                  </>
                ) : printAction === 'download' ? (
                  <>
                    <Download size={16} /> PDF İndir / Kaydet
                  </>
                ) : (
                  <>
                    <Printer size={16} /> {typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform() ? 'Raporu Hazırla' : 'Yazdırmayı Başlat'}
                  </>
                )}
              </button>`;

if (content.includes(oldModalFooter)) {
  content = content.replace(oldModalFooter, newModalFooter);
  console.log('✔ [5b/5] showPrintPrompt footer button harmonized for PDF İndir & PDF / Ofis Aç');
} else {
  console.log('⚠ [5b/5] oldModalFooter not matched');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('🚀 App.jsx successfully updated and saved!');
