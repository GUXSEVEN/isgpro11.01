const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');
const originalLength = content.length;
let modified = false;

// 1. PATCH CompanySettingsView hasEditPermission
console.log('1. Patching CompanySettingsView hasEditPermission...');
const oldSettingsPermPattern = /const\s+isSystemAdmin\s*=\s*currentUser\?\.username\s*===\s*'admin';[\r\n\s]+const\s+isOwner\s*=\s*company\?\.owner\s*===\s*currentUser\?\.username;[\r\n\s]+const\s+userPerm\s*=\s*\(currentUser\?\.companyPermissions\s*\|\|\s*\[\]\)\.find\(p\s*=>\s*p\.companyId\s*===\s*company\?\.id\);[\r\n\s]+const\s+isAssignedWithEdit\s*=\s*userPerm\s*\?\s*userPerm\.canEdit\s*:\s*false;[\r\n\s]+const\s+hasEditPermission\s*=\s*isSystemAdmin\s*\|\|\s*isOwner\s*\|\|\s*isAssignedWithEdit;/;

const newSettingsPerm = `const isSystemAdmin = currentUser?.username === 'admin' || currentUser?.role === 'admin';
  const isOwner = company?.owner === currentUser?.username;
  const userPerm = (currentUser?.companyPermissions || []).find(p => p.companyId === company?.id);
  const isAssignedWithEdit = Boolean(userPerm ? userPerm.canEdit : false);
  
  // OSGB Yöneticisi kontrolü: Sonradan eklenen veya ataması olmasa bile OSGB'sine ait veya serbest/tüm firmaları düzenleyebilir
  const isOsgbManager = Boolean(currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || currentUser?.isManager);
  const myOsgbName = (currentUser?.managedOsgbName || currentUser?.osgb?.name || '').trim().toLowerCase();
  const companyOsgbName = (company?.assignedOsgbName || company?.osgbName || '').trim().toLowerCase();
  const isOsgbManagerForCompany = isOsgbManager && (!companyOsgbName || !myOsgbName || companyOsgbName === myOsgbName || currentUser?.canViewAllCompanies === true);

  // Firma ekibinde yer alan uzman/hekim kontrolü
  const inTeam = Boolean((company?.info?.team || []).some(t => 
    (t.username && currentUser?.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) ||
    (t.name && currentUser?.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  ));

  const hasEditPermission = isSystemAdmin || isOwner || isAssignedWithEdit || isOsgbManagerForCompany || inTeam;`;

if (oldSettingsPermPattern.test(content)) {
  content = content.replace(oldSettingsPermPattern, newSettingsPerm);
  console.log('  -> CompanySettingsView hasEditPermission successfully updated!');
  modified = true;
} else {
  console.warn('  -> Could not match CompanySettingsView hasEditPermission pattern directly, attempting fallback replace...');
  const fallbackOld = "const hasEditPermission = isSystemAdmin || isOwner || isAssignedWithEdit;";
  if (content.includes(fallbackOld)) {
    content = content.replace(
      fallbackOld,
      `// OSGB Yöneticisi kontrolü: Sonradan eklenen veya ataması olmasa bile düzenleyebilir
  const isOsgbManager = Boolean(currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || currentUser?.isManager);
  const myOsgbName = (currentUser?.managedOsgbName || currentUser?.osgb?.name || '').trim().toLowerCase();
  const companyOsgbName = (company?.assignedOsgbName || company?.osgbName || '').trim().toLowerCase();
  const isOsgbManagerForCompany = isOsgbManager && (!companyOsgbName || !myOsgbName || companyOsgbName === myOsgbName || currentUser?.canViewAllCompanies === true);
  const inTeam = Boolean((company?.info?.team || []).some(t => 
    (t.username && currentUser?.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) ||
    (t.name && currentUser?.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  ));
  const hasEditPermission = isSystemAdmin || isOwner || isAssignedWithEdit || isOsgbManagerForCompany || inTeam;`
    );
    console.log('  -> Fallback replacement applied for CompanySettingsView!');
    modified = true;
  } else {
    console.error('  -> Failed to find fallback for CompanySettingsView!');
  }
}

// 2. PATCH Dashboard filteredByPermission
console.log('2. Patching Dashboard filteredByPermission...');
const oldDashboardFilterPattern = /\/\/ 1\. Filter by view mode & permissions[\r\n\s]+const\s+filteredByPermission\s*=\s*companies\.filter\(c\s*=>\s*\{[\s\S]*?return\s*\(currentUser\?\.companyPermissions\s*\|\|\s*\[\]\)\.some\(p\s*=>\s*p\.companyId\s*===\s*c\.id\s*&&\s*\(p\.canView\s*\|\|\s*p\.canEdit\)\);[\r\n\s]+\}\);/;

const newDashboardFilter = `// 1. Filter by view mode & permissions
  const filteredByPermission = companies.filter(c => {
    if (isSystemAdmin) {
      if (viewMode === 'all') return true;
      return c.owner === 'admin';
    }

    const compOsgb = (c.assignedOsgbName || c.osgbName || '').trim().toLowerCase();
    const isMyOsgbCompany = isOsgbManager && (!compOsgb || !myOsgbName || compOsgb === myOsgbName || canViewAll);

    // OSGB yöneticisi ise kendi OSGB'sinin veya atanmış tüm firmalarını her modda eksiksiz görür
    if (isMyOsgbCompany) return true;

    if (viewMode === 'all' && hasAccessToAll) {
      if (canViewAll) return true;
      if (myOsgbName && compOsgb === myOsgbName) return true;
      if (c.owner === currentUser?.username) return true;
    }

    // Default / assigned view
    if (c.owner === currentUser?.username) return true;

    // Yetki tablosunda canView veya canEdit tanımlı mı
    const hasExplicitPerm = (currentUser?.companyPermissions || []).some(p => p.companyId === c.id && (p.canView || p.canEdit));
    if (hasExplicitPerm) return true;

    // Ekip kadrosunda kayıtlı mı
    const inTeam = (c.info?.team || []).some(t => 
      (t.username && t.username.toLowerCase() === (currentUser?.username || '').toLowerCase()) ||
      (t.name && currentUser?.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
    );
    if (inTeam) return true;

    return false;
  });`;

if (oldDashboardFilterPattern.test(content)) {
  content = content.replace(oldDashboardFilterPattern, newDashboardFilter);
  console.log('  -> Dashboard filteredByPermission successfully updated!');
  modified = true;
} else {
  console.warn('  -> Could not match Dashboard filteredByPermission pattern directly!');
}

// 3. PATCH allowedCompanies
console.log('3. Patching allowedCompanies...');
const oldAllowedPattern = /const\s+allowedCompanies\s*=\s*useMemo\(\(\)\s*=>\s*\{[\s\S]*?return\s*false;[\r\n\s]+\};\s*\},[\s\S]*?\[companies,\s*currentUser,\s*isSystemAdmin,\s*isOsgbManager,\s*canViewAll,\s*myOsgbName\]\);/;

const newAllowed = `const allowedCompanies = useMemo(() => {
    if (!currentUser) return [];
    if (isSystemAdmin) return companies;

    const myOsgbClean = (currentUser?.managedOsgbName || currentUser?.osgb?.name || '').trim().toLowerCase();
    const isMgr = Boolean(currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || currentUser?.isManager);
    const viewAll = currentUser?.canViewAllCompanies === true;

    return companies.filter(c => {
      // 1. Kendi oluşturduğu firma
      if (c.owner && c.owner === currentUser.username) return true;

      // 2. OSGB yöneticisi: Ataması olmasa bile OSGB'sine ait firmaları veya serbest/tüm firmaları görebilir
      if (isMgr) {
        const compOsgb = (c.assignedOsgbName || c.osgbName || '').trim().toLowerCase();
        if (!compOsgb || !myOsgbClean || compOsgb === myOsgbClean || viewAll) {
          return true;
        }
      }

      // 3. OSGB'de tüm firmaları görme izni olan personel
      if (viewAll) {
        if (!myOsgbClean) return true;
        const compOsgb = (c.assignedOsgbName || c.osgbName || '').trim().toLowerCase();
        if (compOsgb === myOsgbClean) return true;
      }

      // 4. Kullanıcıya atanan yetkiler (companyPermissions)
      const hasPermission = (currentUser.companyPermissions || []).some(
        p => p.companyId === c.id && (p.canView || p.canEdit)
      );
      if (hasPermission) return true;

      // 5. Firma ekibinde / uzman kadrosunda yer alma
      const inTeam = (c.info?.team || []).some(t => 
        (t.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (t.name && currentUser.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
      if (inTeam) return true;

      // 6. Firma hazırlayanı olma
      const isPreparer = c.info?.preparer && (
        (c.info.preparer.username && c.info.preparer.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (c.info.preparer.name && currentUser.name && c.info.preparer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
      if (isPreparer) return true;

      return false;
    });
  }, [companies, currentUser, isSystemAdmin]);`;

if (oldAllowedPattern.test(content)) {
  content = content.replace(oldAllowedPattern, newAllowed);
  console.log('  -> allowedCompanies successfully updated!');
  modified = true;
} else {
  console.warn('  -> Could not match allowedCompanies pattern directly!');
}

// 4. PATCH OsgbPanel & OsgbManagementModal getUserPerm & handleTogglePerm
console.log('4. Patching getUserPerm in OsgbPanel and OsgbManagementModal...');

// Replace getUserPerm across OsgbPanel and OsgbManagementModal
const oldGetUserPermRegex = /const\s+getUserPerm\s*=\s*\(user,\s*companyId\)\s*=>[\r\n\s]+\(user\.companyPermissions\s*\|\|\s*\[\]\)\.find\(p\s*=>\s*p\.companyId\s*===\s*companyId\)\s*\|\|\s*\{\s*canView:\s*false,\s*canEdit:\s*false\s*\};/g;

const newGetUserPerm = `const getUserPerm = (user, companyId) => {
    if (!user) return { canView: false, canEdit: false, isManager: false };
    const isMgr = Boolean(user.isOsgbManager || user.role === 'osgb_manager' || user.isManager);
    if (isMgr) return { canView: true, canEdit: true, isManager: true };
    const p = (user.companyPermissions || []).find(p => p.companyId === companyId);
    return p ? { canView: Boolean(p.canView || p.canEdit), canEdit: Boolean(p.canEdit), isManager: false } : { canView: false, canEdit: false, isManager: false };
  };`;

if (oldGetUserPermRegex.test(content)) {
  content = content.replace(oldGetUserPermRegex, newGetUserPerm);
  console.log('  -> getUserPerm functions updated in OsgbPanel and OsgbManagementModal!');
  modified = true;
} else {
  console.warn('  -> Could not match getUserPerm pattern!');
}

// 5. Enhance handleTogglePerm to ensure bidirectional consistency
console.log('5. Patching handleTogglePerm to ensure bidirectional consistency...');
const oldTogglePermPattern = /const\s+handleTogglePerm\s*=\s*\(user,\s*companyId,\s*field,\s*value\)\s*=>\s*\{[\r\n\s]+const\s+cur\s*=\s*getUserPerm\(user,\s*companyId\);[\r\n\s]+const\s+upd\s*=\s*\{\s*companyId,\s*canView:\s*cur\.canView,\s*canEdit:\s*cur\.canEdit,\s*\[field\]:\s*value\s*\};[\r\n\s]+if\s*\(field\s*===\s*'canEdit'\s*&&\s*value\)\s*upd\.canView\s*=\s*true;[\r\n\s]+if\s*\(field\s*===\s*'canView'\s*&&\s*!value\)\s*upd\.canEdit\s*=\s*false;/g;

const newTogglePerm = `const handleTogglePerm = (user, companyId, field, value) => {
    const cur = getUserPerm(user, companyId);
    const upd = { companyId, canView: cur.canView, canEdit: cur.canEdit, [field]: value };
    if (field === 'canEdit' && value) upd.canView = true;
    if (field === 'canView' && !value) upd.canEdit = false;`;

if (oldTogglePermPattern.test(content)) {
  content = content.replace(oldTogglePermPattern, newTogglePerm);
  console.log('  -> handleTogglePerm updated!');
  modified = true;
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log(`\nSUCCESS: App.jsx updated! (old: ${originalLength} chars, new: ${content.length} chars)`);
} else {
  console.log('\nNo changes made.');
}
