const fs = require('fs');

const targetFile = './src/components/AdminPanel.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('1. Adding OSGB manager states and modal states to AdminPanel.tsx...');

// Target after editModalLicenseKey state (line ~295)
const targetStatePoint = `  const [editModalLicenseType, setEditModalLicenseType] = useState<LicenseType>('yearly');
  const [editModalLicenseKey, setEditModalLicenseKey] = useState('');`;

const newStateBlock = `  const [editModalLicenseType, setEditModalLicenseType] = useState<LicenseType>('yearly');
  const [editModalLicenseKey, setEditModalLicenseKey] = useState('');
  const [editModalIsOsgbManager, setEditModalIsOsgbManager] = useState(false);
  const [editModalManagedOsgbName, setEditModalManagedOsgbName] = useState('');
  const [editModalCanViewAllCompanies, setEditModalCanViewAllCompanies] = useState(false);
  const [editModalCompanyPermissions, setEditModalCompanyPermissions] = useState<Array<{ companyId: string; canView: boolean; canEdit: boolean }>>([]);

  // New User OSGB & Company states
  const [newUserIsOsgbManager, setNewUserIsOsgbManager] = useState(false);
  const [newUserManagedOsgbName, setNewUserManagedOsgbName] = useState('');
  const [newUserCanViewAllCompanies, setNewUserCanViewAllCompanies] = useState(false);

  // Dedicated Company Permissions Modal state
  const [permModalUser, setPermModalUser] = useState<User | null>(null);
  const [permModalIsOsgbManager, setPermModalIsOsgbManager] = useState(false);
  const [permModalManagedOsgbName, setPermModalManagedOsgbName] = useState('');
  const [permModalCanViewAllCompanies, setPermModalCanViewAllCompanies] = useState(false);
  const [permModalCompanyPerms, setPermModalCompanyPerms] = useState<Array<{ companyId: string; canView: boolean; canEdit: boolean }>>([]);
  const [allCompaniesList, setAllCompaniesList] = useState<Array<{ id: string; name: string; assignedOsgbName?: string }>>([]);

  // Load companies for permission management
  useEffect(() => {
    if (activeTab === 'database') {
      try {
        const rawLocal = localStorage.getItem('companies');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllCompaniesList(parsed);
          }
        }
      } catch (e) {}

      if (db) {
        getDocs(collection(db, 'companies')).then(snap => {
          const comps = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          if (comps.length > 0) {
            setAllCompaniesList(comps);
          }
        }).catch(err => console.warn('Could not fetch companies list:', err));
      }
    }
  }, [activeTab]);`;

if (content.includes(targetStatePoint)) {
  content = content.replace(targetStatePoint, newStateBlock);
  console.log('  -> State declarations added successfully!');
} else {
  console.error('  -> Could not locate targetStatePoint!');
}

// 2. Open edit modal: initialize OSGB manager states
console.log('2. Updating openEditModalForUser...');
const targetOpenEdit = `    setEditModalLicenseType(detectedType);
    setEditModalLicenseKey(user.licenseKey || '');
  };`;

const newOpenEdit = `    setEditModalLicenseType(detectedType);
    setEditModalLicenseKey(user.licenseKey || '');
    setEditModalIsOsgbManager(Boolean(user.isOsgbManager || user.role === 'osgb_manager'));
    setEditModalManagedOsgbName(user.managedOsgbName || '');
    setEditModalCanViewAllCompanies(Boolean(user.canViewAllCompanies));
    setEditModalCompanyPermissions(user.companyPermissions || []);
  };`;

if (content.includes(targetOpenEdit)) {
  content = content.replace(targetOpenEdit, newOpenEdit);
  console.log('  -> openEditModalForUser updated!');
} else {
  console.error('  -> Could not locate targetOpenEdit!');
}

// 3. Save edit modal: persist OSGB manager fields
console.log('3. Updating handleSaveEditModal...');
const targetSaveEdit = `        licenseExpiresAt: editModalIsPremium ? expiryDate.toISOString() : null
      };
    });`;

const newSaveEdit = `        licenseExpiresAt: editModalIsPremium ? expiryDate.toISOString() : null,
        isOsgbManager: editModalIsOsgbManager,
        managedOsgbName: editModalManagedOsgbName.trim(),
        canViewAllCompanies: editModalCanViewAllCompanies,
        companyPermissions: editModalCompanyPermissions
      };
    });`;

if (content.includes(targetSaveEdit)) {
  content = content.replace(targetSaveEdit, newSaveEdit);
  console.log('  -> handleSaveEditModal updated!');
} else {
  console.error('  -> Could not locate targetSaveEdit!');
}

// 4. Add User: save OSGB manager fields & reset
console.log('4. Updating handleAddUser...');
const targetAddUser = `      hasAcceptedLegalTerms: false,
      createdBy: 'admin'
    };`;

const newAddUser = `      hasAcceptedLegalTerms: false,
      createdBy: 'admin',
      isOsgbManager: newUserIsOsgbManager,
      managedOsgbName: newUserManagedOsgbName.trim(),
      canViewAllCompanies: newUserCanViewAllCompanies,
      companyPermissions: []
    };`;

if (content.includes(targetAddUser)) {
  content = content.replace(targetAddUser, newAddUser);
  console.log('  -> handleAddUser updated!');
} else {
  console.error('  -> Could not locate targetAddUser!');
}

const targetResetAdd = `    setNewUserIsEmailVerified(true);
    setNewUserOpen(false);`;

const newResetAdd = `    setNewUserIsEmailVerified(true);
    setNewUserIsOsgbManager(false);
    setNewUserManagedOsgbName('');
    setNewUserCanViewAllCompanies(false);
    setNewUserOpen(false);`;

if (content.includes(targetResetAdd)) {
  content = content.replace(targetResetAdd, newResetAdd);
  console.log('  -> Reset add user updated!');
} else {
  console.error('  -> Could not locate targetResetAdd!');
}

// 5. Add openPermissionsModalForUser helper
console.log('5. Adding permission modal helper methods...');
const targetBeforeHandleAddUser = `  const handleAddUser = async (e: React.FormEvent) => {`;

const newPermissionMethods = `  const openPermissionsModalForUser = (user: User) => {
    setPermModalUser(user);
    setPermModalIsOsgbManager(Boolean(user.isOsgbManager || user.role === 'osgb_manager'));
    setPermModalManagedOsgbName(user.managedOsgbName || (user.osgb && typeof user.osgb === 'object' ? user.osgb.name : '') || '');
    setPermModalCanViewAllCompanies(Boolean(user.canViewAllCompanies));
    setPermModalCompanyPerms(user.companyPermissions || []);
  };

  const handleToggleUserPerm = (companyId: string, field: 'canView' | 'canEdit', value: boolean) => {
    setPermModalCompanyPerms(prev => {
      const existing = prev.find(p => p.companyId === companyId);
      const updatedItem = existing ? { ...existing, [field]: value } : { companyId, canView: false, canEdit: false, [field]: value };
      if (field === 'canEdit' && value) updatedItem.canView = true;
      if (field === 'canView' && !value) updatedItem.canEdit = false;
      return [
        ...prev.filter(p => p.companyId !== companyId),
        ...(updatedItem.canView || updatedItem.canEdit ? [updatedItem] : [])
      ];
    });
  };

  const handleSavePermModal = async () => {
    if (!permModalUser) return;
    const cleanUName = normalizeUsername(permModalUser.username);
    const updatedUsers = dbUsers.map(u => {
      if (normalizeUsername(u.username) === cleanUName) {
        return {
          ...u,
          isOsgbManager: permModalIsOsgbManager,
          managedOsgbName: permModalManagedOsgbName.trim(),
          canViewAllCompanies: permModalCanViewAllCompanies,
          companyPermissions: permModalCompanyPerms
        };
      }
      return u;
    });
    await saveUsersToStorage(updatedUsers);
    setPermModalUser(null);
    showDbSuccess(\`@\${permModalUser.username} kullanıcısının firma yetkileri ve OSGB yöneticilik ayarları başarıyla kaydedildi.\`);
  };

  const handleAddUser = async (e: React.FormEvent) => {`;

if (content.includes(targetBeforeHandleAddUser)) {
  content = content.replace(targetBeforeHandleAddUser, newPermissionMethods);
  console.log('  -> Permission methods added!');
} else {
  console.error('  -> Could not locate targetBeforeHandleAddUser!');
}

// 6. Update newUserOpen form to include OSGB manager fields
console.log('6. Adding OSGB Manager fields to newUserOpen form...');
const targetNewUserEmailVerified = `                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        id="newUserIsEmailVerified"
                        checked={newUserIsEmailVerified}
                        onChange={(e) => setNewUserIsEmailVerified(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="newUserIsEmailVerified" className="text-xs text-slate-800 font-extrabold cursor-pointer flex items-center gap-1">
                        <span>E-Posta Adresi Doğrulanmış Olarak Başlatılsın</span>
                      </label>
                    </div>`;

const newNewUserOsgbFields = `                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        id="newUserIsEmailVerified"
                        checked={newUserIsEmailVerified}
                        onChange={(e) => setNewUserIsEmailVerified(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="newUserIsEmailVerified" className="text-xs text-slate-800 font-extrabold cursor-pointer flex items-center gap-1">
                        <span>E-Posta Adresi Doğrulanmış Olarak Başlatılsın</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newUserIsOsgbManager"
                          checked={newUserIsOsgbManager}
                          onChange={(e) => setNewUserIsOsgbManager(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="newUserIsOsgbManager" className="text-xs text-slate-800 font-extrabold cursor-pointer flex items-center gap-1">
                          <Building2 size={13} className="text-indigo-600" />
                          <span>🏢 OSGB Yöneticisi Yetkisi Ver (Firma ataması olmasa bile firma bilgilerini düzenleyebilir)</span>
                        </label>
                      </div>

                      {newUserIsOsgbManager && (
                        <div className="pl-6 pt-1">
                          <label className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">
                            Yönetilen OSGB Unvanı / Adı
                          </label>
                          <input
                            type="text"
                            value={newUserManagedOsgbName}
                            onChange={(e) => setNewUserManagedOsgbName(e.target.value)}
                            placeholder="Örn: Kuzey Doğu İSG OSGB"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1 font-normal">
                            Bu yönetici, bu OSGB'ye kayıtlı tüm firmaları ve bilgilerini tek tek atama yapılmasa bile düzenleyebilir.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newUserCanViewAllCompanies"
                          checked={newUserCanViewAllCompanies}
                          onChange={(e) => setNewUserCanViewAllCompanies(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor="newUserCanViewAllCompanies" className="text-xs text-slate-800 font-extrabold cursor-pointer">
                          <span>👁️ Sistemdeki Tüm Firmaları Görme Yetkisi (canViewAllCompanies)</span>
                        </label>
                      </div>
                    </div>`;

if (content.includes(targetNewUserEmailVerified)) {
  content = content.replace(targetNewUserEmailVerified, newNewUserOsgbFields);
  console.log('  -> newUserOpen form updated with OSGB fields!');
} else {
  console.error('  -> Could not locate targetNewUserEmailVerified!');
}

// 7. User table: display OSGB Manager badge in Cell 2
console.log('7. Adding OSGB Manager badge in table...');
const targetRoleBadge = `                                  <div>
                                    <span className={\`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full \${
                                      u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      u.role === 'uzman' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      u.role === 'hekim' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                    }\`}>
                                      {u.role === 'admin' ? 'Sistem Yöneticisi' :
                                       u.role === 'uzman' ? 'İSG Uzmanı' :
                                       u.role === 'hekim' ? 'İşyeri Hekimi' : 'Diğer Personel'}
                                    </span>
                                  </div>`;

const newRoleBadge = `                                  <div>
                                    <span className={\`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full \${
                                      u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      u.role === 'uzman' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      u.role === 'hekim' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                    }\`}>
                                      {u.role === 'admin' ? 'Sistem Yöneticisi' :
                                       u.role === 'uzman' ? 'İSG Uzmanı' :
                                       u.role === 'hekim' ? 'İşyeri Hekimi' : 'Diğer Personel'}
                                    </span>
                                    {Boolean(u.isOsgbManager || u.role === 'osgb_manager') && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                                          <Building2 size={10} /> OSGB Yöneticisi: {u.managedOsgbName || 'Atanmamış'}
                                        </span>
                                      </div>
                                    )}
                                    {Boolean(u.canViewAllCompanies) && (
                                      <div className="mt-0.5">
                                        <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                          👁️ Tüm Firmaları Görebilir
                                        </span>
                                      </div>
                                    )}
                                  </div>`;

if (content.includes(targetRoleBadge)) {
  content = content.replace(targetRoleBadge, newRoleBadge);
  console.log('  -> Table role badge updated with OSGB Manager badge!');
} else {
  console.error('  -> Could not locate targetRoleBadge!');
}

// 8. Add "Firma İzinleri" button to Cell 5 in table
console.log('8. Adding "Firma İzinleri" button in table...');
const targetCell5EditBtn = `                                     {/* Şifre ve Tüm Bilgileri Düzenleme Modalı Açıcı */}
                                     <button
                                       onClick={() => openEditModalForUser(u)}
                                       title="Kullanıcı Bilgilerini ve Şifresini Düzenle"
                                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200 flex items-center gap-1"
                                     >
                                       <Edit2 size={11} />
                                       <span>Düzenle</span>
                                     </button>`;

const newCell5EditBtn = `                                     {/* Firma İzinleri ve OSGB Yöneticilik Butonu */}
                                     <button
                                       onClick={() => openPermissionsModalForUser(u)}
                                       title="Firma İzinlerini ve OSGB Yetkilerini Yönet"
                                       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-indigo-200 flex items-center gap-1 shadow-xs"
                                     >
                                       <ShieldCheck size={11} className="text-indigo-600" />
                                       <span>Firma İzinleri</span>
                                     </button>

                                     {/* Şifre ve Tüm Bilgileri Düzenleme Modalı Açıcı */}
                                     <button
                                       onClick={() => openEditModalForUser(u)}
                                       title="Kullanıcı Bilgilerini ve Şifresini Düzenle"
                                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200 flex items-center gap-1"
                                     >
                                       <Edit2 size={11} />
                                       <span>Düzenle</span>
                                     </button>`;

if (content.includes(targetCell5EditBtn)) {
  content = content.replace(targetCell5EditBtn, newCell5EditBtn);
  console.log('  -> "Firma İzinleri" button added to table actions!');
} else {
  console.error('  -> Could not locate targetCell5EditBtn!');
}

// 9. Add OSGB Manager fields to editUserModal JSX
console.log('9. Adding OSGB Manager fields to editUserModal JSX...');
const targetEditModalContract = `                {/* DOĞRULAMA VE HUKUKİ İZİNLER */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Yetki ve Sözleşme Durumu
                  </h4>`;

const newEditModalOsgbSection = `                {/* OSGB YÖNETİCİSİ VE FİRMA ERİŞİM YETKİLERİ */}
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-600" />
                    <span>OSGB Yöneticisi & Firma Yetki Ayarları</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalIsOsgbManager}
                        onChange={(e) => setEditModalIsOsgbManager(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        👑 Bu kullanıcı bir OSGB Yöneticisidir (Ataması olmasa bile OSGB firmalarını düzenleyebilir)
                      </span>
                    </label>

                    {editModalIsOsgbManager && (
                      <div className="pl-6 pt-1">
                        <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                          Yönetilen OSGB Ticaret Adı:
                        </label>
                        <input
                          type="text"
                          value={editModalManagedOsgbName}
                          onChange={(e) => setEditModalManagedOsgbName(e.target.value)}
                          placeholder="Örn: Kuzey Doğu İSG OSGB"
                          className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          OSGB yöneticisi, bu OSGB adına kayıtlı tüm firmaların verilerini ve firma ayarlarını tek tek yetki tanımlanmasa dahi tam yetkiyle (görüntüle + düzenle) güncelleyebilir.
                        </p>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={editModalCanViewAllCompanies}
                        onChange={(e) => setEditModalCanViewAllCompanies(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        👁️ Sistemdeki Tüm Firmaları Görme Yetkisi (canViewAllCompanies)
                      </span>
                    </label>
                  </div>
                </div>

                {/* DOĞRULAMA VE HUKUKİ İZİNLER */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Yetki ve Sözleşme Durumu
                  </h4>`;

if (content.includes(targetEditModalContract)) {
  content = content.replace(targetEditModalContract, newEditModalOsgbSection);
  console.log('  -> editUserModal updated with OSGB Manager settings!');
} else {
  console.error('  -> Could not locate targetEditModalContract!');
}

// 10. Add Dedicated Permissions Modal JSX
console.log('10. Adding Dedicated Permissions Modal JSX...');
const targetBeforeLastAnimatePresence = `      {/* ========================================================================= */}
      {/* 2. KULLANICI DÜZENLEME VE ŞİFRE DEĞİŞTİRME MODALI (EDIT USER MODAL)       */}
      {/* ========================================================================= */}`;

const newPermissionsModalJSX = `      {/* ========================================================================= */}
      {/* 1.5. KULLANICI FİRMA İZİNLERİ VE OSGB YÖNETİM MODALI                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {permModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">Firma İzinleri ve OSGB Yetkilendirme</h3>
                    <p className="text-[11px] text-white/80 font-medium">@{permModalUser.username} — {permModalUser.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* OSGB Yöneticisi Kartı */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permModalIsOsgbManager}
                        onChange={(e) => setPermModalIsOsgbManager(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                        👑 Bu Kullanıcı OSGB Yöneticisidir
                      </span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                      Önemli Yetki
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    OSGB yöneticisi olarak işaretlenen kullanıcılar, firmaya uzman veya hekim olarak tek tek atanmamış olsa dahi OSGB bünyesindeki tüm firmaların firma bilgilerini ve ayarlarını tam yetkiyle (görüntüleme ve düzenleme) yönetebilirler.
                  </p>

                  {permModalIsOsgbManager && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Yönettiği OSGB Adı:
                      </label>
                      <input
                        type="text"
                        value={permModalManagedOsgbName}
                        onChange={(e) => setPermModalManagedOsgbName(e.target.value)}
                        placeholder="Örn: Kuzey Doğu İSG OSGB"
                        className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-indigo-100 dark:border-indigo-900">
                    <input
                      type="checkbox"
                      checked={permModalCanViewAllCompanies}
                      onChange={(e) => setPermModalCanViewAllCompanies(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                      👁️ Sistemdeki Tüm Firmaları Görme İzni (canViewAllCompanies)
                    </span>
                  </label>
                </div>

                {/* Firma İzinleri Tablosu */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={14} className="text-teal-600" />
                      <span>Firma Bazlı İzinler ({allCompaniesList.length} Firma)</span>
                    </h4>
                    
                    {/* Toplu İşlem Butonları */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allView = allCompaniesList.map(c => ({ companyId: c.id, canView: true, canEdit: false }));
                          setPermModalCompanyPerms(allView);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer transition"
                      >
                        Hepsini Gör
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allEdit = allCompaniesList.map(c => ({ companyId: c.id, canView: true, canEdit: true }));
                          setPermModalCompanyPerms(allEdit);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition"
                      >
                        Hepsini Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermModalCompanyPerms([])}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition"
                      >
                        Sıfırla
                      </button>
                    </div>
                  </div>

                  {allCompaniesList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                      Sistemde henüz kayıtlı firma bulunmuyor. Firmalar oluşturuldukça burada listelenecektir.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                      {allCompaniesList.map(c => {
                        const perm = permModalCompanyPerms.find(p => p.companyId === c.id) || { canView: false, canEdit: false };
                        return (
                          <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{c.name || 'İsimsiz Firma'}</p>
                              {c.assignedOsgbName && (
                                <p className="text-[10px] text-slate-400">OSGB: {c.assignedOsgbName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perm.canView}
                                  onChange={(e) => handleToggleUserPerm(c.id, 'canView', e.target.checked)}
                                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Görüntüle</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perm.canEdit}
                                  onChange={(e) => handleToggleUserPerm(c.id, 'canEdit', e.target.checked)}
                                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Düzenle</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSavePermModal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Yetkileri Kaydet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. KULLANICI DÜZENLEME VE ŞİFRE DEĞİŞTİRME MODALI (EDIT USER MODAL)       */}
      {/* ========================================================================= */}`;

if (content.includes(targetBeforeLastAnimatePresence)) {
  content = content.replace(targetBeforeLastAnimatePresence, newPermissionsModalJSX);
  console.log('  -> Dedicated Permissions Modal JSX added successfully!');
} else {
  console.error('  -> Could not locate targetBeforeLastAnimatePresence!');
}

// 11. Check if Briefcase is imported
if (!content.includes('Briefcase,')) {
  content = content.replace('Building2, Calendar, BadgeCheck,', 'Building2, Calendar, BadgeCheck, Briefcase,');
  console.log('  -> Briefcase icon imported!');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished updating AdminPanel.tsx!');
