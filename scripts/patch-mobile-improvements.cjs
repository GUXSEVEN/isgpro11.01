/**
 * patch-mobile-improvements.cjs
 * Implementation of "Mobil Platform Uyumluluk Değerlendirmesi ve İyileştirme Planı"
 */

const fs = require('fs');
const path = require('path');

const PANEL_SRC = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src';

console.log('>>> [1/4] Mobil İyileştirme Yaması Başlatılıyor...');

// =========================================================================
// 1. INDEX.CSS: iOS Zoom Prevention & Smooth Touch Scrolling
// =========================================================================
const panelIndexCssPath = path.join(PANEL_SRC, 'index.css');
if (fs.existsSync(panelIndexCssPath)) {
  let cssContent = fs.readFileSync(panelIndexCssPath, 'utf8');
  
  const mobileCssRules = `
/* MOBILE & TOUCH TARGET OPTIMIZATIONS (<= 768px) */
@media (max-width: 768px) {
  /* Prevent iOS Safari automatic zoom on focus by ensuring font-size is at least 16px */
  input[type="text"],
  input[type="password"],
  input[type="email"],
  input[type="number"],
  input[type="tel"],
  input[type="url"],
  input[type="search"],
  input[type="date"],
  select,
  textarea {
    font-size: 16px !important;
  }

  /* Optimize touch action and tap highlights */
  button, 
  a, 
  input[type="button"], 
  input[type="submit"] {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* Smooth momentum scrolling for mobile overflow containers */
  .overflow-x-auto,
  table {
    -webkit-overflow-scrolling: touch;
  }
}

/* SLEEK MOBILE QUICK TAB SCROLLBAR */
.scroll-touch-smooth {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.scroll-touch-smooth::-webkit-scrollbar {
  height: 4px;
}

.scroll-touch-smooth::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-touch-smooth::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
`;

  if (!cssContent.includes('MOBILE & TOUCH TARGET OPTIMIZATIONS')) {
    cssContent += '\n' + mobileCssRules;
    fs.writeFileSync(panelIndexCssPath, cssContent, 'utf8');
    console.log('✔ Panel index.css güncellendi (iOS zoom & touch scroll).');
  } else {
    console.log('ℹ Panel index.css zaten güncel.');
  }
}

// =========================================================================
// 2. ISGDASHBOARD.JSX: Alert Banner & Buttons Mobile Wrap Fix
// =========================================================================
const isgDashboardPath = path.join(PANEL_SRC, 'components/dashboard/ISGDashboard.jsx');
if (fs.existsSync(isgDashboardPath)) {
  let dashContent = fs.readFileSync(isgDashboardPath, 'utf8');

  // Fix alert header flex to wrap cleanly on mobile
  const oldAlertHeader = `<div className="flex items-center justify-between mb-3 border-b border-indigo-800/50 pb-2">`;
  const newAlertHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-indigo-800/50 pb-2">`;
  
  if (dashContent.includes(oldAlertHeader)) {
    dashContent = dashContent.replace(oldAlertHeader, newAlertHeader);
  }

  fs.writeFileSync(isgDashboardPath, dashContent, 'utf8');
  console.log('✔ ISGDashboard.jsx kontrol edildi ve güncellendi.');
}

// =========================================================================
// 3. APP.JSX: Mobile Layout, Safe Area, Quick Tab Scroller, AssessmentView
// =========================================================================
const appJsxPath = path.join(PANEL_SRC, 'App.jsx');
let appContent = fs.readFileSync(appJsxPath, 'utf8');

// Insert mobile switcher before form column in AssessmentView if not already there
const switcherHtml = `      {/* MOBİL RİSK LİSTESİ / YENİ RİSK FORMU GEÇİŞ ÇUBUĞU */}
      <div className="col-span-full lg:hidden flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 font-bold text-xs shadow-inner">
        <button
          type="button"
          onClick={() => setMobileSubTab('list')}
          className={\`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer \${
            mobileSubTab === 'list'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }\`}
        >
          <ClipboardList size={15} />
          <span>Risk Listesi ({risks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileSubTab('form')}
          className={\`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer \${
            mobileSubTab === 'form'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }\`}
        >
          {isEditing ? <Edit size={15} /> : <Plus size={15} />}
          <span>{isEditing ? 'Risk Düzenle' : 'Yeni Risk Formu'}</span>
        </button>
      </div>\n\n`;

if (!appContent.includes('MOBİL RİSK LİSTESİ / YENİ RİSK FORMU GEÇİŞ ÇUBUĞU')) {
  const formTarget = `      <div className={\`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit lg:sticky lg:top-20 max-h-[calc(100vh-140px)] overflow-y-auto \${mobileSubTab === 'form' ? 'block' : 'hidden lg:block'}\`}>`;
  if (appContent.includes(formTarget)) {
    appContent = appContent.replace(formTarget, switcherHtml + formTarget);
    console.log('✔ AssessmentView mobil Liste / Form geçiş çubuğu başarıyla eklendi.');
  }
}

// In handleEditRisk, ensure switching to form tab on mobile
if (!appContent.includes("setMobileSubTab('form');\n    setForm({\n      ...risk,\n      id: risk.id")) {
  appContent = appContent.replace(
    /const handleEditRisk = \(risk\) => \{\s*setForm\(\{/,
    "const handleEditRisk = (risk) => {\n    setMobileSubTab('form');\n    setForm({"
  );
  console.log('✔ handleEditRisk içine setMobileSubTab(\'form\') eklendi.');
}

// In handleSubmit, switch to 'list'
if (!appContent.includes("setMobileSubTab('list');\n    resetForm();") && !appContent.includes("resetForm();\n    setMobileSubTab('list');")) {
  appContent = appContent.replace(
    "resetForm();",
    "resetForm();\n    setMobileSubTab('list');"
  );
  console.log('✔ handleSubmit / form reset içine setMobileSubTab(\'list\') eklendi.');
}

fs.writeFileSync(appJsxPath, appContent, 'utf8');
console.log('✔ App.jsx başarıyla güncellendi!');
