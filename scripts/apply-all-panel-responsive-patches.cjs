const fs = require('fs');
const path = require('path');

console.log('>>> Applying all responsive and zoom patches to isg-projesi - Copy...');
const appPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// Helper to replace regex with replacement
function safeReplace(name, regex, replacement) {
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    console.log(`✔ [${name}] applied successfully.`);
    return true;
  } else {
    console.warn(`⚠ [${name}] pattern not found or already applied.`);
    return false;
  }
}

// 1. Desktop <aside> with dynamic width
safeReplace(
  'Desktop Aside Dynamic Width',
  /<aside\s+className="hidden md:flex md:w-64 lg:w-72 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 shrink-0 select-none z-30 pt-\[max\(1rem,env\(safe-area-inset-top\)\)\] pb-\[max\(1rem,env\(safe-area-inset-bottom\)\)\]"\s*>\s*\{renderSidebar\(false\)\}\s*<\/aside>/,
  `<aside 
        className={\`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] \${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64 lg:w-72'
        }\`}
      >
        {renderSidebar(false, isSidebarCollapsed)}
      </aside>`
);

// 2. Sidebar Header inside renderSidebar
safeReplace(
  'Sidebar Header with Collapse Button',
  /\{\/\*\s*Sidebar Header\s*\*\/\}[\r\n\s]+<div className="p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">[\r\n\s]+<div className="flex items-center gap-3">[\r\n\s]+<div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg">[\r\n\s]+<ShieldCheck size=\{22\} \/>[\r\n\s]+<\/div>[\r\n\s]+<div>[\r\n\s]+<h1 className="text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">[\r\n\s]+İSG Pro[\r\n\s]+<\/h1>[\r\n\s]+<p className="text-\[9px\] text-slate-400 dark:text-slate-500 font-medium">Dijital İSG Yönetimi<\/p>[\r\n\s]+<\/div>[\r\n\s]+<\/div>[\r\n\s]+<\/div>/,
  `{/* Sidebar Header */}
        <div className={\`border-b border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-between gap-2 \${
          isCollapsed ? 'p-3 flex-col' : 'p-4'
        }\`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck size={20} />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm md:text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                  İSG Pro
                </h1>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">Dijital İSG Yönetimi</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <button
              type="button"
              onClick={() => {
                const next = !isSidebarCollapsed;
                setIsSidebarCollapsed(next);
                try { localStorage.setItem('isg_sidebar_collapsed', String(next)); } catch(_) {}
              }}
              title={isSidebarCollapsed ? "Menüyü Genişlet (Çalışma Alanını Daralt)" : "Menüyü Daralt (Ekran Alanını Büyüt)"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>`
);

// 3. Profile section in renderSidebar
safeReplace(
  'Sidebar Profile Section Collapsed Mode',
  /\{\/\*\s*Profile Section\s*\*\/\}[\r\n\s]+<div className="p-4 border-b border-slate-100 dark:border-slate-700\/50 shrink-0">[\r\n\s]+<div className="bg-slate-50 dark:bg-slate-900\/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700\/30">[\r\n\s]+<div className="flex items-center gap-3 mb-2">[\r\n\s]+<div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950\/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">[\r\n\s]+\{currentUser\?\.name\?\.charAt \? currentUser\.name\.charAt\(0\) : '\?'\}[\r\n\s]+<\/div>[\r\n\s]+<div className="overflow-hidden">[\r\n\s]+<p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">\{currentUser\?\.name\}<\/p>[\r\n\s]+<p className="text-\[9px\] text-slate-400 dark:text-slate-500 font-semibold capitalize">\{currentUser\?\.role \|\| 'Kullanıcı'\}<\/p>[\r\n\s]+<\/div>[\r\n\s]+<\/div>/,
  `{/* Profile Section */}
        <div className={\`border-b border-slate-100 dark:border-slate-700/50 shrink-0 \${
          isCollapsed ? 'p-2 flex justify-center' : 'p-3'
        }\`}>
          {isCollapsed ? (
            <div 
              title={\`\${currentUser?.name || ''} (\${currentUser?.role || 'Kullanıcı'})\`}
              className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
              onClick={() => setShowUserSettingsModal(true)}
            >
              {currentUser?.name?.charAt ? currentUser.name.charAt(0) : '?'}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700/30">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt ? currentUser.name.charAt(0) : '?'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser?.name}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold capitalize truncate">{currentUser?.role || 'Kullanıcı'}</p>
                </div>
              </div>`
);

// 4. Mount PanelZoomController in Dashboard header
safeReplace(
  'Dashboard Header PanelZoomController',
  /<div className="flex flex-wrap gap-2 w-full md:w-auto">[\r\n\s]+\{currentUser\?\.username === 'admin' && \(/,
  `<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          {currentUser?.username === 'admin' && (`
);

// 5. Pass zoom props to Dashboard in App.jsx
safeReplace(
  'Pass zoom to Dashboard',
  /(<Dashboard[\s\S]*?onVerifyEmail=\{handleEmailVerified\})(\s*\/>)/,
  `$1
              panelZoom={panelZoom}
              setPanelZoom={setPanelZoom}
              isCompactMode={isCompactMode}
              setIsCompactMode={setIsCompactMode}$2`
);

// 6. Mount PanelZoomController in Workspace header
safeReplace(
  'Workspace Header PanelZoomController',
  /<div className="flex items-center gap-2">[\r\n\s]+<button onClick=\{onManualSave\} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1\.5 rounded-lg text-xs font-bold flex items-center gap-1\.5 transition-colors shadow-sm active:scale-95"><Database size=\{14\} \/> Kaydet<\/button>[\r\n\s]+<\/div>/,
  `<div className="flex items-center gap-2">
          {setPanelZoom && (
            <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          )}
          <button onClick={onManualSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"><Database size={14} /> Kaydet</button>
        </div>`
);

// 7. Pass zoom props to Workspace in App.jsx
safeReplace(
  'Pass zoom to Workspace',
  /(<Workspace[\s\S]*?company=\{activeCompany\})(\s+library=\{library\})/,
  `$1
              panelZoom={panelZoom}
              setPanelZoom={setPanelZoom}
              isCompactMode={isCompactMode}
              setIsCompactMode={setIsCompactMode}$2`
);

// 8. Enhance CompanySettingsView Header & Cards
safeReplace(
  'CompanySettingsView Header',
  /<div className="space-y-6 pb-4">[\r\n\s]+<div className="flex items-center gap-2 mb-2"><Briefcase className="text-slate-400" size=\{20\} \/><h2 className="text-xl font-bold text-slate-800">Firma Ayarları<\/h2><\/div>/,
  `<div className="space-y-4 md:space-y-5 pb-6">
      <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <Briefcase size={20} />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-extrabold text-slate-800 dark:text-slate-100">Firma Bilgileri & Yönetimi</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Şirket kimliği, İSG ekibi, bölümler ve yetkili tanımları</p>
          </div>
        </div>
      </div>`
);

// Optimize CompanySettingsView cards from p-6 to responsive p-4 sm:p-5 md:p-6
content = content.replace(
  /function CompanySettingsView[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/,
  (match) => {
    return match
      .replace(/<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">/g, '<div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all">')
      .replace(/grid grid-cols-1 md:grid-cols-2 gap-4 mb-6/g, 'grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4')
      .replace(/<div className="space-y-6 pb-4">/g, '<div className="space-y-4 md:space-y-5 pb-6">');
  }
);
console.log('✔ CompanySettingsView cards made responsive.');

fs.writeFileSync(appPath, content, 'utf8');
console.log('>>> [DONE] All patches applied to App.jsx!');
