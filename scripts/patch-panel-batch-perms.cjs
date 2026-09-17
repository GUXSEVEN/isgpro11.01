const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. PATCH allowedCompanies and surrounding isOsgbManager definition
console.log('1. Patching allowedCompanies and manager definition...');
const oldAllowedChunk = `  const isSystemAdmin = currentUser?.username === 'admin';
  const isOsgbManager = Boolean(currentUser?.isOsgbManager);
  const canViewAll = currentUser?.canViewAllCompanies === true;
  const myOsgbName = (isOsgbManager ? currentUser?.managedOsgbName : currentUser?.osgb?.name) || '';

  // Kullanıcının atalı olduğu veya OSGB yetkisiyle görebileceği izinli firmalar
  const allowedCompanies = useMemo(() => {
    if (!currentUser) return [];
    if (isSystemAdmin) return companies;

    return companies.filter(c => {
      // 1. Kendi oluşturduğu firma
      if (c.owner && c.owner === currentUser.username) return true;

      // 2. OSGB yöneticisi veya OSGB'de tüm firmaları görme izni olan personel
      if ((isOsgbManager || canViewAll) && myOsgbName) {
        if ((c.assignedOsgbName || '').trim().toLowerCase() === myOsgbName.trim().toLowerCase()) {
          return true;
        }
      }

      // 3. Kullanıcıya atanan yetkiler (companyPermissions)
      const hasPermission = (currentUser.companyPermissions || []).some(
        p => p.companyId === c.id && (p.canView || p.canEdit)
      );
      if (hasPermission) return true;

      // 4. Firma ekibinde / uzman kadrosunda yer alma
      const inTeam = (c.info?.team || []).some(t => 
        (t.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (t.name && currentUser.name && t.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
      if (inTeam) return true;

      // 5. Firma hazırlayanı olma
      const isPreparer = c.info?.preparer && (
        (c.info.preparer.username && c.info.preparer.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (c.info.preparer.name && currentUser.name && c.info.preparer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
      if (isPreparer) return true;

      return false;
    });
  }, [companies, currentUser, isSystemAdmin, isOsgbManager, canViewAll, myOsgbName]);`;

const newAllowedChunk = `  const isSystemAdmin = currentUser?.username === 'admin' || currentUser?.role === 'admin';
  const isOsgbManager = Boolean(currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || currentUser?.isManager);
  const canViewAll = currentUser?.canViewAllCompanies === true;
  const myOsgbName = (currentUser?.managedOsgbName || currentUser?.osgb?.name || '').trim().toLowerCase();

  // Kullanıcının atalı olduğu veya OSGB yetkisiyle görebileceği izinli firmalar
  const allowedCompanies = useMemo(() => {
    if (!currentUser) return [];
    if (isSystemAdmin) return companies;

    return companies.filter(c => {
      // 1. Kendi oluşturduğu firma
      if (c.owner && c.owner === currentUser.username) return true;

      const compOsgb = (c.assignedOsgbName || c.osgbName || '').trim().toLowerCase();

      // 2. OSGB yöneticisi: Ataması olmasa dahi kendi OSGB firmalarını veya tüm firmaları görebilir
      if (isOsgbManager) {
        if (!compOsgb || !myOsgbName || compOsgb === myOsgbName || canViewAll) {
          return true;
        }
      }

      // 3. OSGB'de tüm firmaları görme izni olan personel
      if (canViewAll) {
        if (!myOsgbName || compOsgb === myOsgbName) return true;
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
  }, [companies, currentUser, isSystemAdmin, isOsgbManager, canViewAll, myOsgbName]);`;

if (content.includes(oldAllowedChunk)) {
  content = content.replace(oldAllowedChunk, newAllowedChunk);
  console.log('  -> allowedCompanies chunk replaced successfully!');
} else {
  console.log('  -> Trying normalized whitespace match for allowedCompanies...');
  const normalize = str => str.replace(/\r\n/g, '\n');
  const normContent = normalize(content);
  const normOld = normalize(oldAllowedChunk);
  if (normContent.includes(normOld)) {
    content = normContent.replace(normOld, normalize(newAllowedChunk));
    console.log('  -> Normalized allowedCompanies matched and replaced!');
  } else {
    console.error('  -> Failed to replace allowedCompanies!');
  }
}

// 2. PATCH Batch Permission Buttons in OsgbPanel (Perm Table)
console.log('2. Adding Batch Permission UI in OsgbPanel...');
const targetOsgbUserRow = `<p className="font-semibold text-slate-800 text-xs">{u.name || u.username}</p>
                                <p className="text-[10px] text-slate-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>`;

const newOsgbUserRow = `<p className="font-semibold text-slate-800 text-xs">{u.name || u.username}</p>
                                <p className="text-[10px] text-slate-400">@{u.username}</p>
                                {Boolean(u.isOsgbManager || u.role === 'osgb_manager') && (
                                  <span className="inline-block mt-0.5 text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200">👑 Yönetici (Tam Yetkili)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: false }));
                                  onAdminUpdateUser(u.username, { companyPermissions: newPerms });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                                title="Tüm firmaları görüntüleme yetkisi ver"
                              >
                                Tümünü Gör
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: true }));
                                  onAdminUpdateUser(u.username, { companyPermissions: newPerms });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                title="Tüm firmalara tam yetki (görüntüle + düzenle) ver"
                              >
                                Tümünü Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onAdminUpdateUser(u.username, { companyPermissions: [] });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                title="Tüm izinleri kaldır"
                              >
                                Sıfırla
                              </button>
                            </div>
                          </td>`;

const normContent2 = content.replace(/\r\n/g, '\n');
const normTarget2 = targetOsgbUserRow.replace(/\r\n/g, '\n');
if (normContent2.includes(normTarget2)) {
  content = normContent2.replace(normTarget2, newOsgbUserRow.replace(/\r\n/g, '\n'));
  console.log('  -> Batch permission buttons added to OsgbPanel table!');
} else {
  console.warn('  -> Could not locate targetOsgbUserRow in OsgbPanel table');
}

// 3. PATCH Batch Permission Buttons in OsgbManagementModal
console.log('3. Adding Batch Permission UI in OsgbManagementModal...');
const targetModalUserRow = `{u.name || u.username} (@{u.username})
                                  </td>`;
const newModalUserRow = `<div>
                                      <p className="font-bold">{u.name || u.username} (@{u.username})</p>
                                      {Boolean(u.isOsgbManager || u.role === 'osgb_manager') && (
                                        <span className="inline-block mt-0.5 text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">👑 Yönetici (Tam Yetkili)</span>
                                      )}
                                      <div className="flex gap-1 mt-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: false }));
                                            onAdminUpdateUser(u.username, { companyPermissions: newPerms });
                                          }}
                                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                                        >
                                          Tümünü Gör
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: true }));
                                            onAdminUpdateUser(u.username, { companyPermissions: newPerms });
                                          }}
                                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                        >
                                          Tümünü Düzenle
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onAdminUpdateUser(u.username, { companyPermissions: [] });
                                          }}
                                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                        >
                                          Sıfırla
                                        </button>
                                      </div>
                                    </div>
                                  </td>`;

const normContent3 = content.replace(/\r\n/g, '\n');
const normTarget3 = targetModalUserRow.replace(/\r\n/g, '\n');
if (normContent3.includes(normTarget3)) {
  content = normContent3.replace(normTarget3, newModalUserRow.replace(/\r\n/g, '\n'));
  console.log('  -> Batch permission buttons added to OsgbManagementModal table!');
} else {
  console.warn('  -> Could not locate targetModalUserRow in OsgbManagementModal table');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done updating App.jsx!');
