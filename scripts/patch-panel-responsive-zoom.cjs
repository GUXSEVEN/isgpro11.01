const fs = require('fs');
const path = require('path');

console.log('>>> [1/4] Creating PanelZoomController.jsx in isg-projesi - Copy...');

const commonDir = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/common';
if (!fs.existsSync(commonDir)) {
  fs.mkdirSync(commonDir, { recursive: true });
}

const zoomControllerCode = `import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, SlidersHorizontal, ChevronDown } from 'lucide-react';

const ZOOM_PRESETS = [75, 80, 85, 90, 100, 110, 125];

export default function PanelZoomController({ zoom, setZoom, isCompact, setIsCompact }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleZoomChange = (newZoom) => {
    const clamped = Math.min(130, Math.max(70, newZoom));
    setZoom(clamped);
    try {
      localStorage.setItem('isg_panel_zoom', String(clamped));
    } catch (_) {}
  };

  const toggleCompact = () => {
    const next = !isCompact;
    setIsCompact(next);
    try {
      localStorage.setItem('isg_compact_mode', String(next));
    } catch (_) {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs backdrop-blur-sm select-none">
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={() => handleZoomChange(zoom - 5)}
        disabled={zoom <= 70}
        title="Küçült (Uzaklaştır - Küçük ekranlar için genişlet)"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-all cursor-pointer"
      >
        <ZoomOut size={14} />
      </button>

      {/* Preset Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          title="Ekran Görünüm Ölçeği (Büyüt / Küçült)"
          className="px-2 py-0.5 min-w-[50px] text-center font-mono font-black text-xs text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
        >
          <span>%{zoom}</span>
          <ChevronDown size={10} className="text-slate-400" />
        </button>

        {showPresets && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
            <div className="absolute top-full mt-1.5 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 px-1 min-w-[130px] text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2.5 py-1 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                Görünüm Ölçeği
              </div>
              {ZOOM_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    handleZoomChange(preset);
                    setShowPresets(false);
                  }}
                  className={\`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer \${
                    zoom === preset
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }\`}
                >
                  <span>%{preset}</span>
                  {preset === 100 && <span className="text-[9px] text-slate-400 font-normal">Normal</span>}
                  {preset === 85 && <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">Laptop</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={() => handleZoomChange(zoom + 5)}
        disabled={zoom >= 130}
        title="Büyüt (Yakınlaştır)"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-all cursor-pointer"
      >
        <ZoomIn size={14} />
      </button>

      {/* Reset to 100% button */}
      {zoom !== 100 && (
        <button
          type="button"
          onClick={() => handleZoomChange(100)}
          title="Sıfırla (%100)"
          className="w-6 h-6 flex items-center justify-center rounded-md text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RotateCcw size={12} />
        </button>
      )}

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Compact Mode Switch */}
      <button
        type="button"
        onClick={toggleCompact}
        title={isCompact ? "Kompakt Mod Aktif (Küçük ekranlar için sıkıştırılmış düzen)" : "Standart Mod Aktif (Kompakt moda geçmek için tıklayın)"}
        className={\`px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer \${
          isCompact
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
        }\`}
      >
        <SlidersHorizontal size={12} />
        <span className="hidden sm:inline">{isCompact ? 'Kompakt' : 'Standart'}</span>
      </button>

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap (Görüş alanını genişlet)"}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
      >
        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      </button>
    </div>
  );
}
`;

fs.writeFileSync(path.join(commonDir, 'PanelZoomController.jsx'), zoomControllerCode, 'utf8');
console.log('✔ PanelZoomController.jsx created.');

// =========================================================================
// [2/4] Updating index.css with sleek scrollbar & compact mode classes
// =========================================================================
console.log('>>> [2/4] Updating index.css in isg-projesi - Copy...');
const cssPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/index.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const scrollbarAndCompactCss = `
/* ── KÜÇÜK EKRANLI BİLGİSAYARLAR İÇİN ZARİF KAYDIRMA ÇUBUĞU (CUSTOM SCROLLBAR) ── */
.custom-panel-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.custom-panel-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-panel-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-panel-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.custom-panel-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(99, 102, 241, 0.7);
}

html.dark .custom-panel-scrollbar {
  scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
}

html.dark .custom-panel-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.45);
}

html.dark .custom-panel-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(129, 140, 248, 0.7);
}

/* ── KÜÇÜK EKRANLI LAPTOPLAR İÇİN KOMPAKT GÖRÜNÜM MODU ── */
.panel-compact-mode .p-6 {
  padding: 0.875rem !important;
}

.panel-compact-mode .p-8 {
  padding: 1rem !important;
}

.panel-compact-mode .gap-6 {
  gap: 0.75rem !important;
}

.panel-compact-mode .gap-4 {
  gap: 0.5rem !important;
}

.panel-compact-mode .space-y-6 > * + * {
  margin-top: 0.75rem !important;
}

.panel-compact-mode .space-y-4 > * + * {
  margin-top: 0.5rem !important;
}

.panel-compact-mode .mb-6 {
  margin-bottom: 0.75rem !important;
}

.panel-compact-mode .mb-8 {
  margin-bottom: 0.875rem !important;
}

.panel-compact-mode input:not([type="checkbox"]):not([type="radio"]),
.panel-compact-mode select,
.panel-compact-mode textarea {
  padding-top: 0.4rem !important;
  padding-bottom: 0.4rem !important;
  font-size: 0.8125rem !important;
}

.panel-compact-mode h1 {
  font-size: 1.25rem !important;
}

.panel-compact-mode h2 {
  font-size: 1.1rem !important;
}

.panel-compact-mode h3 {
  font-size: 0.95rem !important;
}
`;

if (!cssContent.includes('.custom-panel-scrollbar')) {
  cssContent += '\n' + scrollbarAndCompactCss;
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('✔ index.css updated with custom-panel-scrollbar and compact mode.');
} else {
  console.log('ℹ index.css already contains custom scrollbar styles.');
}

// =========================================================================
// [3/4] Updating App.jsx in isg-projesi - Copy
// =========================================================================
console.log('>>> [3/4] Patching App.jsx in isg-projesi - Copy...');
const appPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Add import for PanelZoomController
if (!appContent.includes("import PanelZoomController from './components/common/PanelZoomController';")) {
  appContent = appContent.replace(
    "import EmailVerificationModal from './components/modals/EmailVerificationModal';",
    "import EmailVerificationModal from './components/modals/EmailVerificationModal';\nimport PanelZoomController from './components/common/PanelZoomController';"
  );
  console.log('✔ PanelZoomController imported in App.jsx');
}

// 2. Add ChevronLeft / ChevronRight / PanelLeftClose to imports if needed
// (ChevronLeft and ChevronRight are already imported from lucide-react in App.jsx)

// 3. Add states for zoom, compact mode, and collapsed sidebar in App component
const stateHookTarget = "const [isDrawerOpen, setIsDrawerOpen] = useState(false);";
if (appContent.includes(stateHookTarget) && !appContent.includes("const [panelZoom, setPanelZoom]")) {
  const stateAdditions = `const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [panelZoom, setPanelZoom] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_panel_zoom');
      if (saved) return Number(saved);
      // Küçük laptop ekranlarında varsayılan olarak %90 ile ferah başlat
      if (typeof window !== 'undefined' && window.innerWidth <= 1366) return 90;
      return 100;
    } catch (_) { return 100; }
  });
  const [isCompactMode, setIsCompactMode] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_compact_mode');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth <= 1366;
    } catch (_) { return false; }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('isg_sidebar_collapsed') === 'true';
    } catch (_) { return false; }
  });`;

  appContent = appContent.replace(stateHookTarget, stateAdditions);
  console.log('✔ States added to App component: panelZoom, isCompactMode, isSidebarCollapsed');
}

// 4. Update desktop sidebar render in App.jsx:
// Replace fixed width `<aside className="hidden md:flex md:w-64 lg:w-72 ...">`
const oldAsideRegex = /<aside\s+className="hidden\s+md:flex\s+md:w-64\s+lg:w-72\s+flex-col\s+bg-white\s+dark:bg-slate-800\s+border-r\s+border-slate-200\s+dark:border-slate-700\s+h-screen\s+sticky\s+top-0\s+shrink-0\s+select-none\s+z-30[\s\S]*?">\s*\{renderSidebar\(false\)\}\s*<\/aside>/;

const newAside = `<aside 
        className={\`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] \${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64 lg:w-72'
        }\`}
      >
        {renderSidebar(false, isSidebarCollapsed)}
      </aside>`;

if (oldAsideRegex.test(appContent)) {
  appContent = appContent.replace(oldAsideRegex, newAside);
  console.log('✔ Desktop aside updated with collapsible width (72px <-> 256/288px).');
}

// 5. Update renderSidebar definition to accept isCollapsed parameter
if (appContent.includes("const renderSidebar = (isMobile = false) => {")) {
  appContent = appContent.replace(
    "const renderSidebar = (isMobile = false) => {",
    "const renderSidebar = (isMobile = false, isCollapsed = false) => {"
  );
  console.log('✔ renderSidebar updated to accept isCollapsed');
}

// 6. Add sidebar header collapse button & adapt header when collapsed
const sidebarHeaderOld = `<div className="p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                İSG Pro
              </h1>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Dijital İSG Yönetimi</p>
            </div>
          </div>
        </div>`;

const sidebarHeaderNew = `<div className="p-3.5 md:p-4 border-b border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
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
        </div>`;

if (appContent.includes(sidebarHeaderOld)) {
  appContent = appContent.replace(sidebarHeaderOld, sidebarHeaderNew);
  console.log('✔ Sidebar header updated with collapse button.');
}

// 7. Adapt profile section and navigation in renderSidebar when collapsed
const profileSectionOld = `<div className="p-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.charAt ? currentUser.name.charAt(0) : '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser?.name}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold capitalize">{currentUser?.role || 'Kullanıcı'}</p>
              </div>
            </div>`;

const profileSectionNew = `<div className={\`border-b border-slate-100 dark:border-slate-700/50 shrink-0 \${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}\`}>
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
              </div>`;

if (appContent.includes(profileSectionOld)) {
  appContent = appContent.replace(profileSectionOld, profileSectionNew);
  console.log('✔ Profile section updated for collapsed sidebar.');
}

// 8. Update main content container in App.jsx to use zoom and custom scrollbar
const mainContainerOld = `<div className="flex-1 flex flex-col h-full md:h-screen overflow-hidden pt-0 md:pt-[max(1rem,env(safe-area-inset-top))] pb-0 md:pb-[max(1rem,env(safe-area-inset-bottom))]">`;
const mainContainerNew = `<div className={\`flex-1 flex flex-col h-full md:h-screen overflow-hidden pt-0 md:pt-[max(0.5rem,env(safe-area-inset-top))] pb-0 md:pb-[max(0.5rem,env(safe-area-inset-bottom))] \${isCompactMode ? 'panel-compact-mode' : ''}\`}>`;

if (appContent.includes(mainContainerOld)) {
  appContent = appContent.replace(mainContainerOld, mainContainerNew);
  console.log('✔ Main container updated with compact mode class.');
}

// 9. Update dynamic content scroll container:
// Replace `<div className="flex-1 overflow-y-auto relative">`
const dynamicContentOld = `<div className="flex-1 overflow-y-auto relative">`;
const dynamicContentNew = `<div 
          id="panel-root-scroll-viewport" 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-panel-scrollbar relative"
          style={{ zoom: panelZoom / 100 }}
        >`;

if (appContent.includes(dynamicContentOld)) {
  appContent = appContent.replace(dynamicContentOld, dynamicContentNew);
  console.log('✔ Dynamic content scroll container updated with zoom and custom-panel-scrollbar.');
}

// 10. In Dashboard header, add PanelZoomController
const dashboardHeaderTarget = `{/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>`;

const dashboardHeaderNew = `{/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>`;

if (appContent.includes(dashboardHeaderTarget)) {
  appContent = appContent.replace(dashboardHeaderTarget, dashboardHeaderNew);
}

// Add PanelZoomController to Dashboard button group
const dashboardBtnGroupOld = `<div className="flex flex-wrap gap-2 w-full md:w-auto">
          {currentUser?.username === 'admin' && (`;

const dashboardBtnGroupNew = `<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          {currentUser?.username === 'admin' && (`;

if (appContent.includes(dashboardBtnGroupOld) && !appContent.includes('<PanelZoomController zoom={panelZoom}')) {
  appContent = appContent.replace(dashboardBtnGroupOld, dashboardBtnGroupNew);
  console.log('✔ PanelZoomController mounted in Dashboard header.');
}

// 11. Pass panelZoom, setPanelZoom, isCompactMode, setIsCompactMode to Workspace
const workspaceInvocationOld = `<Workspace
              key={activeCompanyId} // FORCE RESET STATE ON COMPANY CHANGE
              company={activeCompany}`;

const workspaceInvocationNew = `<Workspace
              key={activeCompanyId} // FORCE RESET STATE ON COMPANY CHANGE
              company={activeCompany}
              panelZoom={panelZoom}
              setPanelZoom={setPanelZoom}
              isCompactMode={isCompactMode}
              setIsCompactMode={setIsCompactMode}`;

if (appContent.includes(workspaceInvocationOld) && !appContent.includes('panelZoom={panelZoom}')) {
  appContent = appContent.replace(workspaceInvocationOld, workspaceInvocationNew);
  console.log('✔ Zoom props passed to Workspace component.');
}

// 12. In Workspace component definition, accept panelZoom, setPanelZoom, isCompactMode, setIsCompactMode
const workspaceDefOld = "function Workspace({ company, library, folders, companies, onUpdateCompany, onUpdateActiveCompany, onCreateAssessment, onUpdateAssessmentDate, onDeleteAssessment, onAddRisk, onUpdateRisk, onDeleteRisk, onDeleteBatch, onUpdateBatch, onImportRisks, onCopyAssessment, onAddToLibrary, onUpdateLibraryItem, onDeleteFromLibrary, onDeleteLibraryBatch, onMoveLibraryItem, onAddFolder, onDeleteFolder, onBack, onRequestConfirmation, onManualSave, currentUser, users, onImportFolderWithItems, onMoveFolder, onBulkLibraryImport, onMoveLibraryItemsBatch, affectedGroups, onAddAffectedGroup, onRemoveAffectedGroup, checkAndIncrementAILimit, aiUsageCount, triggerUpgrade, theme, toggleTheme, osgbs, activeTab, setActiveTab, onMenuToggle, showAdvancedReport, setShowAdvancedReport }) {";

const workspaceDefNew = "function Workspace({ company, library, folders, companies, onUpdateCompany, onUpdateActiveCompany, onCreateAssessment, onUpdateAssessmentDate, onDeleteAssessment, onAddRisk, onUpdateRisk, onDeleteRisk, onDeleteBatch, onUpdateBatch, onImportRisks, onCopyAssessment, onAddToLibrary, onUpdateLibraryItem, onDeleteFromLibrary, onDeleteLibraryBatch, onMoveLibraryItem, onAddFolder, onDeleteFolder, onBack, onRequestConfirmation, onManualSave, currentUser, users, onImportFolderWithItems, onMoveFolder, onBulkLibraryImport, onMoveLibraryItemsBatch, affectedGroups, onAddAffectedGroup, onRemoveAffectedGroup, checkAndIncrementAILimit, aiUsageCount, triggerUpgrade, theme, toggleTheme, osgbs, activeTab, setActiveTab, onMenuToggle, showAdvancedReport, setShowAdvancedReport, panelZoom = 100, setPanelZoom, isCompactMode = false, setIsCompactMode }) {";

if (appContent.includes(workspaceDefOld)) {
  appContent = appContent.replace(workspaceDefOld, workspaceDefNew);
  console.log('✔ Workspace signature updated with zoom props.');
}

// 13. Mount PanelZoomController in Workspace header
const workspaceHeaderActionOld = `<div className="flex items-center gap-2">
          <button onClick={onManualSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"><Database size={14} /> Kaydet</button>
        </div>`;

const workspaceHeaderActionNew = `<div className="flex items-center gap-2">
          {setPanelZoom && (
            <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          )}
          <button onClick={onManualSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"><Database size={14} /> Kaydet</button>
        </div>`;

if (appContent.includes(workspaceHeaderActionOld)) {
  appContent = appContent.replace(workspaceHeaderActionOld, workspaceHeaderActionNew);
  console.log('✔ PanelZoomController mounted in Workspace header.');
}

// 14. Update Workspace main scroll container
const workspaceMainOld = `<main id="main-scroll-container" className="flex-1 overflow-y-auto p-4 md:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] no-print">`;
const workspaceMainNew = `<main id="main-scroll-container" className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-panel-scrollbar p-3 sm:p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] no-print">`;

if (appContent.includes(workspaceMainOld)) {
  appContent = appContent.replace(workspaceMainOld, workspaceMainNew);
  console.log('✔ Workspace main scroll container updated with smooth custom-panel-scrollbar.');
}

// 15. Optimize CompanySettingsView for small screens & laptop viewports
const companySettingsContainerOld = `<div className="space-y-6 pb-4">
      <div className="flex items-center gap-2 mb-2"><Briefcase className="text-slate-400" size={20} /><h2 className="text-xl font-bold text-slate-800">Firma Ayarları</h2></div>`;

const companySettingsContainerNew = `<div className="space-y-4 md:space-y-5 pb-6">
      <div className="flex items-center justify-between gap-2 mb-1 border-b border-slate-200 dark:border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">Firma Bilgileri ve Yönetimi</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Şirket kimliği, İSG ekibi, bölümler ve yetkili tanımları</p>
          </div>
        </div>
      </div>`;

if (appContent.includes(companySettingsContainerOld)) {
  appContent = appContent.replace(companySettingsContainerOld, companySettingsContainerNew);
  console.log('✔ CompanySettingsView header enhanced.');
}

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('✔ App.jsx successfully updated.');
console.log('>>> [4/4] All responsive zoom & layout patches completed successfully!');
