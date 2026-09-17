const fs = require('fs');
const path = require('path');

console.log('>>> [1/1] Patching sidebar, dashboard, and company settings in App.jsx...');
const appPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Update <aside> width and transition
const asideOld = `<aside 
        className="hidden md:flex md:w-64 lg:w-72 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 shrink-0 select-none z-30 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {renderSidebar(false)}
      </aside>`;

const asideNew = `<aside 
        className={\`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] \${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64 lg:w-72'
        }\`}
      >
        {renderSidebar(false, isSidebarCollapsed)}
      </aside>`;

if (appContent.includes(asideOld)) {
  appContent = appContent.replace(asideOld, asideNew);
  console.log('✔ Desktop aside updated with dynamic width.');
}

// 2. Update sidebar header in renderSidebar
const sidebarHeaderTarget = `        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
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

const sidebarHeaderReplacement = `        {/* Sidebar Header */}
        <div className={\`border-b border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-between gap-2 \${
          isCollapsed ? 'p-3 flex-col' : 'p-4'
        }\`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck size={22} />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-base font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
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
              title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt (Ekran Alanını Büyüt)"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer shrink-0"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>`;

if (appContent.includes(sidebarHeaderTarget)) {
  appContent = appContent.replace(sidebarHeaderTarget, sidebarHeaderReplacement);
  console.log('✔ Sidebar header updated with collapse button.');
}

// 3. Update profile section in renderSidebar when collapsed
const profileTarget = `        {/* Profile Section */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
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

const profileReplacement = `        {/* Profile Section */}
        <div className={\`border-b border-slate-100 dark:border-slate-700/50 shrink-0 \${
          isCollapsed ? 'p-2 flex justify-center' : 'p-3 md:p-4'
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
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2.5 md:p-3 border border-slate-100 dark:border-slate-700/30">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt ? currentUser.name.charAt(0) : '?'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser?.name}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold capitalize truncate">{currentUser?.role || 'Kullanıcı'}</p>
                </div>
              </div>`;

if (appContent.includes(profileTarget)) {
  appContent = appContent.replace(profileTarget, profileReplacement);
  console.log('✔ Profile section updated for collapsed sidebar.');
}

// 4. Update Company Dropdown in renderSidebar when collapsed
const companySelectTarget = `        {/* Company Dropdown Selection */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">`;

const companySelectReplacement = `        {/* Company Dropdown Selection */}
        <div className={\`border-b border-slate-100 dark:border-slate-700/50 shrink-0 \${
          isCollapsed ? 'p-2 flex justify-center' : 'p-3 md:p-4'
        }\`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setActiveCompanyId(null)}
              title="Tüm Firmalar (Ana Sayfa)"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition cursor-pointer"
            >
              <Building2 size={16} />
            </button>
          ) : null}
          <div className={isCollapsed ? 'hidden' : 'block'}>`;

if (appContent.includes(companySelectTarget)) {
  appContent = appContent.replace(companySelectTarget, companySelectReplacement);
  // Also close the extra div before navigation menu tabs
  appContent = appContent.replace(
    `            </div>
          </div>
        </div>

        {/* Navigation Menu Tabs */}`,
    `            </div>
          </div>
          </div>
        </div>

        {/* Navigation Menu Tabs */}`
  );
  console.log('✔ Company selector updated for collapsed sidebar.');
}

// 5. Update Navigation Tabs in renderSidebar when collapsed
// Helper regex to make all buttons in sidebar center icons when collapsed
appContent = appContent.replace(
  /className=\{`w-full flex items-center (gap-[0-9\.]+) px-3 py-2 rounded-xl text-xs font-bold transition-all/g,
  "className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : '$1 px-3 py-2'} rounded-xl text-xs font-bold transition-all"
);
console.log('✔ Sidebar button layout updated for collapsed mode.');

// Hide section headers like "FİRMA YÖNETİMİ" when collapsed
appContent = appContent.replace(
  '<div className="px-3 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">FİRMA YÖNETİMİ</div>',
  `{!isCollapsed && (<div className="px-3 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">FİRMA YÖNETİMİ</div>)}`
);

// Hide span text in navigation items when collapsed
appContent = appContent.replace(
  /<span>(Firma Bilgileri|Risk Analizi|Acil Durum|İSG Belgeleri|İSG Kurul Yönetimi|Tespit & Öneri Defteri)<\/span>/g,
  '{!isCollapsed && <span>$1</span>}'
);

// 6. Mount PanelZoomController in Dashboard
const dashboardBtnsTarget = `<div className="flex flex-wrap gap-2 w-full md:w-auto">
          {currentUser?.username === 'admin' && (`;

const dashboardBtnsReplacement = `<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          {currentUser?.username === 'admin' && (`;

if (appContent.includes(dashboardBtnsTarget)) {
  appContent = appContent.replace(dashboardBtnsTarget, dashboardBtnsReplacement);
  console.log('✔ PanelZoomController added to Dashboard.');
}

// 7. Pass zoom props to Dashboard in App.jsx
const dashboardMountOld = `<Dashboard
              companies={isSystemAdmin ? companies : allowedCompanies}
              users={users}
              currentUser={currentUser}
              onCreate={handleCreateCompany}
              onSelect={setActiveCompanyId}
              onDelete={handleDeleteCompany}
              onManualSave={handleManualSave}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
              aiUsageCount={aiUsageCount}
              onUpgradeClick={() => {
                setCheckoutReason('upgrade');
                setActiveView('checkout');
              }}
              onAdminPanelClick={() => setActiveView('admin')}
              onOsgbManagementClick={() => setShowOsgbManagement(true)}
              onOsgbPanelClick={() => setActiveView('osgbpanel')}
              theme={theme}
              toggleTheme={toggleTheme}
              onMenuToggle={() => setIsDrawerOpen(true)}
              onVerifyEmail={handleEmailVerified}
            />`;

const dashboardMountNew = `<Dashboard
              companies={isSystemAdmin ? companies : allowedCompanies}
              users={users}
              currentUser={currentUser}
              onCreate={handleCreateCompany}
              onSelect={setActiveCompanyId}
              onDelete={handleDeleteCompany}
              onManualSave={handleManualSave}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
              aiUsageCount={aiUsageCount}
              onUpgradeClick={() => {
                setCheckoutReason('upgrade');
                setActiveView('checkout');
              }}
              onAdminPanelClick={() => setActiveView('admin')}
              onOsgbManagementClick={() => setShowOsgbManagement(true)}
              onOsgbPanelClick={() => setActiveView('osgbpanel')}
              theme={theme}
              toggleTheme={toggleTheme}
              onMenuToggle={() => setIsDrawerOpen(true)}
              onVerifyEmail={handleEmailVerified}
              panelZoom={panelZoom}
              setPanelZoom={setPanelZoom}
              isCompactMode={isCompactMode}
              setIsCompactMode={setIsCompactMode}
            />`;

if (appContent.includes(dashboardMountOld)) {
  appContent = appContent.replace(dashboardMountOld, dashboardMountNew);
  console.log('✔ Zoom props passed to Dashboard invocation in App.jsx');
}

// 8. In Dashboard definition, accept zoom props
const dashboardDefOld = "function Dashboard({ companies = [], users = [], onCreate, onSelect, onDelete, onManualSave, onLogout, currentUser, onUpdateUser, aiUsageCount, onUpgradeClick, onAdminPanelClick, onOsgbManagementClick, theme, toggleTheme, onOsgbPanelClick, onMenuToggle, onVerifyEmail }) {";
const dashboardDefNew = "function Dashboard({ companies = [], users = [], onCreate, onSelect, onDelete, onManualSave, onLogout, currentUser, onUpdateUser, aiUsageCount, onUpgradeClick, onAdminPanelClick, onOsgbManagementClick, theme, toggleTheme, onOsgbPanelClick, onMenuToggle, onVerifyEmail, panelZoom = 100, setPanelZoom, isCompactMode = false, setIsCompactMode }) {";

if (appContent.includes(dashboardDefOld)) {
  appContent = appContent.replace(dashboardDefOld, dashboardDefNew);
  console.log('✔ Dashboard function signature updated with zoom props.');
}

// 9. Mount PanelZoomController in Workspace header
const workspaceHeaderTarget = `<div className="flex items-center gap-2">
          <button onClick={onManualSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"><Database size={14} /> Kaydet</button>
        </div>`;

const workspaceHeaderReplacement = `<div className="flex items-center gap-2">
          {setPanelZoom && (
            <PanelZoomController zoom={panelZoom} setZoom={setPanelZoom} isCompact={isCompactMode} setIsCompact={setIsCompactMode} />
          )}
          <button onClick={onManualSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"><Database size={14} /> Kaydet</button>
        </div>`;

if (appContent.includes(workspaceHeaderTarget)) {
  appContent = appContent.replace(workspaceHeaderTarget, workspaceHeaderReplacement);
  console.log('✔ PanelZoomController mounted in Workspace header.');
}

// 10. Pass zoom props to Workspace invocation
const wsInvocationTarget = `<Workspace
              key={activeCompanyId} // FORCE RESET STATE ON COMPANY CHANGE
              company={activeCompany}
              library={library}
              folders={folders}
              companies={companies}
              activeTab={workspaceActiveTab}
              setActiveTab={setWorkspaceActiveTab}
              onMenuToggle={() => setIsDrawerOpen(true)}
              showAdvancedReport={showAdvancedReport}
              setShowAdvancedReport={setShowAdvancedReport}

              onCreateAssessment={handleCreateAssessment}

              onUpdateCompany={(info) => updateActiveCompany({ info, name: info.name || activeCompany.name })}
              onUpdateActiveCompany={updateActiveCompany}
              onUpdateAssessmentDate={handleUpdateAssessmentDate}
              onDeleteAssessment={handleDeleteAssessment}
              onAddRisk={handleAddRisk}`;

const wsInvocationReplacement = `<Workspace
              key={activeCompanyId} // FORCE RESET STATE ON COMPANY CHANGE
              company={activeCompany}
              panelZoom={panelZoom}
              setPanelZoom={setPanelZoom}
              isCompactMode={isCompactMode}
              setIsCompactMode={setIsCompactMode}
              library={library}
              folders={folders}
              companies={companies}
              activeTab={workspaceActiveTab}
              setActiveTab={setWorkspaceActiveTab}
              onMenuToggle={() => setIsDrawerOpen(true)}
              showAdvancedReport={showAdvancedReport}
              setShowAdvancedReport={setShowAdvancedReport}

              onCreateAssessment={handleCreateAssessment}

              onUpdateCompany={(info) => updateActiveCompany({ info, name: info.name || activeCompany.name })}
              onUpdateActiveCompany={updateActiveCompany}
              onUpdateAssessmentDate={handleUpdateAssessmentDate}
              onDeleteAssessment={handleDeleteAssessment}
              onAddRisk={handleAddRisk}`;

if (appContent.includes(wsInvocationTarget)) {
  appContent = appContent.replace(wsInvocationTarget, wsInvocationReplacement);
  console.log('✔ Zoom props passed to Workspace invocation.');
}

// 11. Enhance CompanySettingsView cards and headers for small screens
const companySettingsOld = `<div className="space-y-6 pb-4">
      <div className="flex items-center gap-2 mb-2"><Briefcase className="text-slate-400" size={20} /><h2 className="text-xl font-bold text-slate-800">Firma Ayarları</h2></div>`;

const companySettingsNew = `<div className="space-y-4 md:space-y-5 pb-6">
      <div className="flex items-center justify-between gap-2 mb-1 border-b border-slate-200 dark:border-slate-700/60 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-extrabold text-slate-800 dark:text-slate-100">Firma Bilgileri & Yönetimi</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Şirket kimliği, İSG ekibi, bölümler ve yetkili tanımları</p>
          </div>
        </div>
      </div>`;

if (appContent.includes(companySettingsOld)) {
  appContent = appContent.replace(companySettingsOld, companySettingsNew);
  console.log('✔ CompanySettingsView header enhanced.');
}

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('✔ All patches applied to App.jsx successfully.');
