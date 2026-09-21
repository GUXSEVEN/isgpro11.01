const fs = require('fs');
const path = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';

let c = fs.readFileSync(path, 'utf8');

console.log('>>> [Patch Admin Mobile Perfect] Starting...');

// 1. Ensure ChevronDown is imported
if (!c.includes('ChevronDown')) {
  c = c.replace(
    'ChevronRight, ChevronLeft,',
    'ChevronRight, ChevronLeft, ChevronDown,'
  );
  console.log('✔ [1] Added ChevronDown to lucide-react imports');
}

// 2. Add Mobile Fast Menu Selector (Dropdown) above AdminPanel tabs
const adminTabsWrapperOld = `{/* SEKMELER - MOBİL VE WEB SAĞA/SOLA KAYDIRILABİLİR KULLANICI DOSTU MENÜ ÇUBUĞU */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative border-b border-slate-200 flex items-center bg-slate-50/50">`;

const adminTabsWrapperNew = `{/* SEKMELER - MOBİL VE WEB SAĞA/SOLA KAYDIRILABİLİR KULLANICI DOSTU MENÜ ÇUBUĞU */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* MOBİL HIZLI MENÜ SEÇİCİ (Mobilde tek tıkla Yetkilendirme veya herhangi bir menüye doğrudan geçiş) */}
          <div className="md:hidden p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <label htmlFor="mobile-admin-tab-select" className="text-xs font-black text-indigo-950 flex items-center gap-1.5 shrink-0">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Menü:</span>
            </label>
            <div className="relative flex-1">
              <select
                id="mobile-admin-tab-select"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSearchQuery('');
                  setSelectedUser(null);
                }}
                className="w-full bg-white border border-indigo-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-8 shadow-xs outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer appearance-none"
              >
                {TABS.map(tab => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label} {activeTab === tab.key ? '✔' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
            </div>
          </div>

          <div className="relative border-b border-slate-200 flex items-center bg-slate-50/50">`;

if (c.includes(adminTabsWrapperOld)) {
  c = c.replace(adminTabsWrapperOld, adminTabsWrapperNew);
  console.log('✔ [2] Mobile tab select dropdown added to AdminPanel');
} else {
  console.warn('⚠ [2] Admin tabs wrapper string not found, checking fallback...');
  const altOld = `<div className="relative border-b border-slate-200 flex items-center bg-slate-50/50">`;
  if (c.includes(altOld)) {
    c = c.replace(altOld, `{/* MOBİL HIZLI MENÜ SEÇİCİ */}
          <div className="md:hidden p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <label htmlFor="mobile-admin-tab-select" className="text-xs font-black text-indigo-950 flex items-center gap-1.5 shrink-0">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Menü:</span>
            </label>
            <div className="relative flex-1">
              <select
                id="mobile-admin-tab-select"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSearchQuery('');
                  setSelectedUser(null);
                }}
                className="w-full bg-white border border-indigo-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-8 shadow-xs outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer appearance-none"
              >
                {TABS.map(tab => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label} {activeTab === tab.key ? '✔' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
            </div>
          </div>\n` + altOld);
    console.log('✔ [2-fallback] Mobile tab select dropdown added via fallback');
  }
}

// 3. Make Users table min-w-[850px] and add horizontal scroll tip for mobile
const userTableMarker = `{/* ====== KULLANICILAR ====== */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto custom-panel-scrollbar w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              <table className="w-full text-sm">`;

const userTableReplacement = `{/* ====== KULLANICILAR ====== */}
          {activeTab === 'users' && (
            <div>
              {/* Mobil Yatay Kaydırma Rozeti / İpucu */}
              <div className="md:hidden px-3.5 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-700 font-bold">
                <span>👉 Tabloyu parmağınızla sağa-sola kaydırabilirsiniz</span>
                <span className="text-[10px] bg-white border border-indigo-200 px-2 py-0.5 rounded-md font-extrabold text-indigo-600 shrink-0">↔ Yatay Kaydır</span>
              </div>
              <div className="overflow-x-auto custom-panel-scrollbar w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
                <table className="min-w-[880px] w-full text-sm">`;

if (c.includes(userTableMarker)) {
  c = c.replace(userTableMarker, userTableReplacement);
  console.log('✔ [3] Users table updated with min-w-[880px] and mobile scroll badge');
} else {
  // Regex fallback for user table
  c = c.replace(
    /(\{\/\* ====== KULLANICILAR ====== \*\/[\s\S]*?\{activeTab === 'users' && \([\s\S]*?<div className="overflow-x-auto[^"]*"[^>]*>\s*)<table className="w-full text-sm">/,
    `$1<table className="min-w-[880px] w-full text-sm">`
  );
  console.log('✔ [3-regex] Users table updated with min-w-[880px]');
}

// 4. Update Companies table to min-w-[850px]
c = c.replace(
  /(\{\/\* ====== İŞYERLERİ ====== \*\/[\s\S]*?\{activeTab === 'companies' && \([\s\S]*?<div className="overflow-x-auto[^"]*"[^>]*>\s*)<table className="w-full text-sm">/,
  `$1<table className="min-w-[850px] w-full text-sm">`
);
console.log('✔ [4] Companies table updated with min-w-[850px]');

// 5. Update Licenses table to min-w-[850px]
c = c.replace(
  /(\{\/\* ====== LİSANSLAR ====== \*\/[\s\S]*?\{activeTab === 'licenses' && \([\s\S]*?<div className="overflow-x-auto[^"]*"[^>]*>\s*)<table className="w-full text-sm">/,
  `$1<table className="min-w-[850px] w-full text-sm">`
);
console.log('✔ [5] Licenses table updated with min-w-[850px]');

// 6. Action buttons in Users table: ensure whitespace-nowrap and shrink-0
c = c.replace(
  '<div className="flex gap-1.5 flex-wrap">',
  '<div className="flex gap-1.5 shrink-0 whitespace-nowrap">'
);
console.log('✔ [6] Action buttons formatted to whitespace-nowrap');

fs.writeFileSync(path, c, 'utf8');
console.log('🎉 [ALL DONE] Admin Mobile Perfect Patch Applied!');
