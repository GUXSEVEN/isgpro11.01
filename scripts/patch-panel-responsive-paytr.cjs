const fs = require('fs');

const appJsxPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Remove duplicate script loader on lines ~18140-18157 if present
const duplicateLoaderPattern = /\/\/ PayTR iframe resizer script yükleyici \(Doküman Sayfa 3\)[\s\S]*?useEffect\(\(\) => \{[\s\S]*?script\.src = 'https:\/\/www\.paytr\.com\/js\/iframeResizer\.min\.js';[\s\S]*?\}, \[step\]\);/;
if (duplicateLoaderPattern.test(content)) {
  content = content.replace(duplicateLoaderPattern, '// iframeResizer loader centralized above');
  console.log('✔ Removed duplicate iframeResizer useEffect');
}

// 2. Locate the paytr_iframe render block
const oldIframeRenderBlock = /\{\(step === 'paytr_iframe' \|\| \(step === 'input' && checkoutStage === 'payment_form'\)\) && \([\s\S]*?\/\* AŞAMA 2: REAL \/ PORTAL PAYTR BDDK 256-BIT SSL GÜVENLİ ÖDEME EKRANI[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newIframeRender = `{(step === 'paytr_iframe' || (step === 'input' && checkoutStage === 'payment_form')) && (
          /* ========================================================================= */
          /* AŞAMA 2: REAL / PORTAL PAYTR BDDK 256-BIT SSL GÜVENLİ ÖDEME EKRANI (MOBİL UYUMLU) */
          /* ========================================================================= */
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto my-4 w-full animate-fade-in">
            {/* Top info bar (Ana uygulamadaki Checkout.tsx ile birebir aynı) */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded">PayTR</div>
                <span className="text-xs font-bold text-slate-300">BDDK Lisanslı 256-Bit SSL Ödeme Sayfası</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                <Lock size={12} /> Güvenli Bağlantı
              </div>
            </div>

            {/* Order Summary banner */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold">
              <div className="min-w-0 pr-3">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sipariş / Fatura Sahibi</span>
                <span className="font-bold text-slate-900 dark:text-white block truncate">
                  {cardName || currentUser?.name || currentUser?.username || 'Değerli Müşterimiz'} ({(customerEmail || currentUser?.email || 'musteri@isgpro.com')})
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ödenecek Tutar</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base block">{planPrice}</span>
              </div>
            </div>

            {/* PayTR iframe Container (Mobilde tam ekran genişlik, masaüstünde dengeli boşluk) */}
            <div className="p-0 sm:p-3 bg-slate-100 dark:bg-slate-900 min-h-[640px] flex justify-center items-center w-full">
              {iframeToken ? (
                <iframe
                  src={\`https://www.paytr.com/odeme/guvenli/\${iframeToken}\`}
                  id="paytriframe"
                  frameBorder="0"
                  scrolling="no"
                  allow="payment; top-navigation; forms; payment-handler"
                  className="w-full min-h-[640px] border-0 sm:rounded-xl shadow-inner bg-white block"
                  title="PayTR Güvenli Ödeme Ekranı"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                  <p className="text-xs text-slate-500 font-semibold">PayTR BDDK 256-Bit SSL Güvenli Ödeme Ekranı Yükleniyor...</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setCheckoutStage('contract_and_signature');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Bilgileri Değiştir / Sözleşmeye Dön
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                Sipariş No: {merchantOid}
              </span>
            </div>

            {/* Security Note Footer */}
            <div className="text-center text-[10px] sm:text-[11px] text-slate-400 p-3 bg-white dark:bg-slate-950 flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-850">
              <Lock size={11} className="text-emerald-500 shrink-0" />
              <span>Ödeme bilgileriniz kesinlikle sunucularımızda saklanmaz. Doğrudan BDDK lisanslı PayTR 3D Secure ile 256-Bit SSL şifrelenir.</span>
            </div>
          </div>
        )}`;

if (oldIframeRenderBlock.test(content)) {
  content = content.replace(oldIframeRenderBlock, newIframeRender);
  fs.writeFileSync(appJsxPath, content, 'utf8');
  console.log('✔ Successfully replaced panel PayTR iframe with responsive Checkout.tsx design in App.jsx');
} else {
  console.error('❌ Could not match oldIframeRenderBlock in App.jsx');
}
