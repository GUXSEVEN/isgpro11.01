const fs = require('fs');
const path = require('path');

const targetBase = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile';
const appJsxPath = path.join(targetBase, 'src', 'App.jsx');

let code = fs.readFileSync(appJsxPath, 'utf8');

const targetHeaderSearch = `{/* RAPOR SEÇİCİ BUTONLAR - MOBİLDE FLEX WRAP ve TAM GENİŞLİK */}
          <div className="flex flex-wrap justify-center md:justify-start bg-slate-700 p-1 rounded-xl gap-1 w-full md:w-auto">`;

const targetHeaderReplace = `{/* RAPOR SEÇİCİ BUTONLAR - MOBİLDE TEK SATIRDA YATAY KAYAR */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-touch-smooth flex-nowrap bg-slate-700/90 p-1 rounded-xl w-full md:w-auto max-w-full">`;

if (code.includes(targetHeaderSearch)) {
  code = code.replace(targetHeaderSearch, targetHeaderReplace);
  console.log('✓ Rapor seçici yatay kaydırma çipine dönüştürüldü.');
} else {
  console.warn('⚠️ targetHeaderSearch bulunamadı.');
}

// Ensure each report type button in this container has shrink-0
code = code.replace(/className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap \${reportType ===/g,
  'className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${reportType ===');

// Compact action buttons
const actionsSearch = `{/* AKSİYON BUTONLARI - MOBİLDE TAM GENİŞLİK */}
        <div className="flex w-full md:w-auto gap-2">`;

const actionsReplace = `{/* AKSİYON BUTONLARI - MOBİLDE TEK SATIRDA KOMPAKT */}
        <div className="flex items-center w-full md:w-auto gap-1.5 justify-end shrink-0">`;

if (code.includes(actionsSearch)) {
  code = code.replace(actionsSearch, actionsReplace);
  console.log('✓ Aksiyon butonları alanı kompaktlaştırıldı.');
}

fs.writeFileSync(appJsxPath, code, 'utf8');
console.log('✓ Header bar patch tamamlandı.');
