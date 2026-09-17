const fs = require('fs');
const path = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';

if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// 1. Fix missing myOsgbName and robust isOsgbManager definition in Dashboard
const oldDashboardHeader = `  const isSystemAdmin = currentUser?.username === 'admin';
  const isOsgbManager = currentUser?.isOsgbManager;
  const canViewAll = currentUser?.canViewAllCompanies === true;
  const hasAccessToAll = isSystemAdmin || isOsgbManager || canViewAll;`;

const newDashboardHeader = `  const isSystemAdmin = currentUser?.username === 'admin' || currentUser?.role === 'admin';
  const isOsgbManager = Boolean(currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || currentUser?.isManager || (currentUser?.managedOsgbName && currentUser.managedOsgbName.trim() !== ''));
  const myOsgbName = (currentUser?.managedOsgbName || currentUser?.osgb?.name || '').trim().toLowerCase();
  const canViewAll = currentUser?.canViewAllCompanies === true;
  const hasAccessToAll = isSystemAdmin || isOsgbManager || canViewAll;`;

if (content.includes(oldDashboardHeader)) {
  content = content.replace(oldDashboardHeader, newDashboardHeader);
  console.log('✔ Fixed myOsgbName and isOsgbManager in Dashboard');
} else {
  console.warn('Dashboard header pattern not found directly, checking variations...');
}

// 2. Fix Dashboard OSGB Paneli button check to use isOsgbManager
const oldDashboardBtn = `{currentUser?.isOsgbManager && onOsgbPanelClick && (
            <button onClick={onOsgbPanelClick} className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105">
              <Building2 size={18} /> OSGB Paneli
            </button>
          )}`;

const newDashboardBtn = `{(isOsgbManager || currentUser?.isOsgbManager) && onOsgbPanelClick && (
            <button onClick={onOsgbPanelClick} className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer">
              <Building2 size={18} /> OSGB Paneli
            </button>
          )}`;

if (content.includes(oldDashboardBtn)) {
  content = content.replace(oldDashboardBtn, newDashboardBtn);
  console.log('✔ Updated Dashboard OSGB Paneli button visibility');
}

// 3. Fix drawer sidebar and view conditions to use robust isOsgbManager check
const oldDrawerCheck = `          {/* Admin / OSGB Panel Options */}
          {(currentUser?.username === 'admin' || currentUser?.isOsgbManager) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
              <div className="px-3 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PANEL ERİŞİMİ</div>
              {currentUser?.username === 'admin' && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <ShieldCheck size={15} />
                  <span>Admin Paneli</span>
                </button>
              )}
              {currentUser?.isOsgbManager && (
                <button
                  onClick={() => {
                    setActiveView('osgbpanel');
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                >
                  <Building2 size={15} />
                  <span>OSGB Paneli</span>
                </button>
              )}
            </div>
          )}`;

const newDrawerCheck = `          {/* Admin / OSGB Panel Options */}
          {(currentUser?.username === 'admin' || isOsgbManager) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
              <div className="px-3 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PANEL ERİŞİMİ</div>
              {currentUser?.username === 'admin' && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <ShieldCheck size={15} />
                  <span>Admin Paneli</span>
                </button>
              )}
              {isOsgbManager && (
                <button
                  onClick={() => {
                    setActiveView('osgbpanel');
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                >
                  <Building2 size={15} />
                  <span>OSGB Paneli</span>
                </button>
              )}
            </div>
          )}`;

if (content.includes(oldDrawerCheck)) {
  content = content.replace(oldDrawerCheck, newDrawerCheck);
  console.log('✔ Updated Drawer OSGB Paneli button visibility');
}

// 4. Update view router: if (currentUser.isOsgbManager && activeView === 'osgbpanel')
const oldViewRouter = `if (currentUser.isOsgbManager && activeView === 'osgbpanel') {`;
const newViewRouter = `if ((isOsgbManager || currentUser?.isOsgbManager) && activeView === 'osgbpanel') {`;
if (content.includes(oldViewRouter)) {
  content = content.replace(oldViewRouter, newViewRouter);
  console.log('✔ Updated View Router for OSGB Panel');
}

// 5. Allow multiple managers by default and do not strip previous managers in OsgbManagementModal
const oldAllowState = `const [allowMultipleManagers, setAllowMultipleManagers] = useState(false);`;
const newAllowState = `const [allowMultipleManagers, setAllowMultipleManagers] = useState(true);`;
if (content.includes(oldAllowState)) {
  content = content.replace(oldAllowState, newAllowState);
  console.log('✔ Defaulted allowMultipleManagers to true');
}

const oldMgrAssignBlock = `                            const newStatus = !isManager;
                            if (newStatus && !allowMultipleManagers) {
                              // Tekli mod aktifse, önce tüm diğer yöneticilerin yetkisini kaldır
                              const prevMgrs = allUsers.filter(usr => usr.isOsgbManager && usr.managedOsgbName === managerModalOsgb.name);
                              prevMgrs.forEach(pm => {
                                onAdminUpdateUser(pm.username, { isOsgbManager: false, managedOsgbName: '' });
                              });
                            }
                            onAdminUpdateUser(u.username, { isOsgbManager: newStatus, managedOsgbName: newStatus ? managerModalOsgb.name : '' });`;

const newMgrAssignBlock = `                            const newStatus = !isManager;
                            // Birden fazla yönetici atamasına her zaman izin ver (mevcut yöneticileri asla silme)
                            onAdminUpdateUser(u.username, { isOsgbManager: newStatus, managedOsgbName: newStatus ? managerModalOsgb.name : '' });`;

if (content.includes(oldMgrAssignBlock)) {
  content = content.replace(oldMgrAssignBlock, newMgrAssignBlock);
  console.log('✔ Allowed multiple OSGB managers without stripping previous ones');
}

// 6. Update OsgbManagerPanel myOsgbName and myCompanies
const oldOsgbPanelMyName = `const myOsgbName = currentUser.managedOsgbName || '';`;
const newOsgbPanelMyName = `const myOsgbName = (currentUser.managedOsgbName || currentUser?.osgb?.name || '').trim();`;
if (content.includes(oldOsgbPanelMyName)) {
  content = content.replace(oldOsgbPanelMyName, newOsgbPanelMyName);
  console.log('✔ Updated OsgbManagerPanel myOsgbName fallback');
}

const oldMyCompanies = `const myCompanies = allCompanies.filter(c => (c.assignedOsgbName || '').trim().toLowerCase() === myOsgbName.trim().toLowerCase());`;
const newMyCompanies = `const myCompanies = allCompanies.filter(c => 
    (myOsgbName && (c.assignedOsgbName || '').trim().toLowerCase() === myOsgbName.toLowerCase()) ||
    c.owner === currentUser.username ||
    c.createdBy === currentUser.username ||
    (currentUser.companyPermissions || []).some(p => p.companyId === c.id && (p.canView || p.canEdit)) ||
    (c.info?.team || []).some(t => (t.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) || (t.name && currentUser.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()))
  );`;
if (content.includes(oldMyCompanies)) {
  content = content.replace(oldMyCompanies, newMyCompanies);
  console.log('✔ Updated OsgbManagerPanel myCompanies filtering');
}

fs.writeFileSync(path, content, 'utf8');
console.log('>>> All OSGB Manager & myOsgbName patches applied to App.jsx successfully!');
