const fs = require('fs');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(targetPath)) {
  console.error('Target file not found:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// =========================================================================
// 1. PATCH: OsgbManagerPanel handleTogglePerm
// =========================================================================
console.log('1. Patching OsgbManagerPanel handleTogglePerm...');

const oldPanelTogglePattern = `  const handleTogglePerm = (user, companyId, field, value) => {
    const cur = getUserPerm(user, companyId);
    const upd = { companyId, canView: cur.canView, canEdit: cur.canEdit, [field]: value };
    if (field === 'canEdit' && value) upd.canView = true;
    if (field === 'canView' && !value) upd.canEdit = false;
    const newPerms = [
      ...(user.companyPermissions || []).filter(p => p.companyId !== companyId),
      ...(upd.canView || upd.canEdit ? [upd] : [])
    ];
    onAdminUpdateUser(user.username, { companyPermissions: newPerms });
  };`;

const newPanelToggle = `  const handleTogglePerm = (user, companyId, field, value) => {
    if (!user) return;
    const isMgr = Boolean(user.isOsgbManager || user.role === 'osgb_manager' || user.isManager);
    if (isMgr) return; // OSGB Yöneticilerinde müdahale edilmez, tüm firmalara tam yetkilidir

    const cur = getUserPerm(user, companyId);
    const upd = { companyId, canView: cur.canView, canEdit: cur.canEdit, [field]: value };
    if (field === 'canEdit' && value) upd.canView = true;
    if (field === 'canView' && !value) upd.canEdit = false;

    const existingPerms = user.companyPermissions || [];
    const newPerms = [
      ...existingPerms.filter(p => p.companyId !== companyId),
      ...(upd.canView || upd.canEdit ? [upd] : [])
    ];

    // İzin modalı açıksa modal içi permTarget state'ini anında güncelle (tiklerin anında değişmesi için)
    if (permTarget && (cleanUsername(permTarget.username) === cleanUsername(user.username))) {
      setPermTarget(prev => prev ? { ...prev, companyPermissions: newPerms } : prev);
    }

    onAdminUpdateUser(user.username, { companyPermissions: newPerms });
  };`;

if (content.includes(oldPanelTogglePattern)) {
  content = content.replace(oldPanelTogglePattern, newPanelToggle);
  console.log('✔ Patched handleTogglePerm in OsgbManagerPanel');
} else {
  console.warn('handleTogglePerm pattern in OsgbManagerPanel not found directly, checking...');
}

// =========================================================================
// 2. PATCH: OsgbManagerPanel showPermModal Modal UI
// =========================================================================
console.log('2. Patching showPermModal in OsgbManagerPanel...');

const oldPermModalPattern = `      {/* İZİN QUICK MODALİ */}
      {showPermModal && permTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                {permTarget.name || permTarget.username} — Firma Erişim İzinleri
              </h3>
              <button onClick={() => setShowPermModal(false)} className="text-slate-400 hover:text-slate-700 p-1"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-2.5 max-h-96 overflow-y-auto">
              {myCompanies.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">Bu OSGB'ye atanmış firma yok. Firmalar sekmesinden atayın.</p>
              ) : myCompanies.map(c => {
                const perm = getUserPerm(permTarget, c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={\`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm \${c.color || 'bg-blue-600'}\`}>{(c.name || '?').charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.info?.hazardClass || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <label className="flex flex-col items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={perm.canView} onChange={e => handleTogglePerm(permTarget, c.id, 'canView', e.target.checked)} className="w-4 h-4 accent-teal-500" />
                        <span className="text-[9px] text-slate-500 font-bold">Görüntüle</span>
                      </label>
                      <label className="flex flex-col items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={perm.canEdit} onChange={e => handleTogglePerm(permTarget, c.id, 'canEdit', e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                        <span className="text-[9px] text-slate-500 font-bold">Düzenle</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-slate-200">
              <button onClick={() => setShowPermModal(false)} className="w-full px-4 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Kapat</button>
            </div>
          </div>
        </div>
      )}`;

const newPermModal = [
  "      {/* İZİN QUICK MODALİ */}",
  "      {showPermModal && permTarget && (() => {",
  "        const isTargetManager = Boolean(",
  "          permTarget.isOsgbManager === true ||",
  "          permTarget.isOsgbManager === 'true' ||",
  "          permTarget.role === 'osgb_manager' ||",
  "          permTarget.isManager === true",
  "        );",
  "",
  "        return (",
  '          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">',
  '            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">',
  '              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">',
  "                <div>",
  '                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">',
  '                    <ShieldCheck size={18} className="text-teal-600" />',
  "                    {permTarget.name || permTarget.username} — Firma Erişim İzinleri",
  "                  </h3>",
  "                  {isTargetManager ? (",
  '                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-200">',
  "                      👑 OSGB Yöneticisi (Tüm firmalarda tam yetkilidir, müdahale edilemez)",
  "                    </span>",
  "                  ) : (",
  '                    <p className="text-[11px] text-slate-500 mt-0.5">Uzmanın çalışacağı firmalar için görüntüleme ve düzenleme yetkisi belirleyin.</p>',
  "                  )}",
  "                </div>",
  '                <button onClick={() => setShowPermModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"><X size={20} /></button>',
  "              </div>",
  "",
  "              {/* Hızlı Toplu Butonlar (Yalnızca normal personel için) */}",
  "              {!isTargetManager && myCompanies.length > 0 && (",
  '                <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">',
  '                  <span className="text-[11px] font-bold text-slate-600">Toplu İşlemler:</span>',
  '                  <div className="flex items-center gap-1.5">',
  "                    <button",
  '                      type="button"',
  "                      onClick={() => {",
  "                        const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: false }));",
  "                        setPermTarget(prev => ({ ...prev, companyPermissions: newPerms }));",
  "                        onAdminUpdateUser(permTarget.username, { companyPermissions: newPerms });",
  "                      }}",
  '                      className="text-[10px] font-bold px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 cursor-pointer transition-colors"',
  '                      title="Tüm firmaları yalnızca görüntüleme yetkisi ver"',
  "                    >",
  "                      Tümünü Gör",
  "                    </button>",
  "                    <button",
  '                      type="button"',
  "                      onClick={() => {",
  "                        const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: true }));",
  "                        setPermTarget(prev => ({ ...prev, companyPermissions: newPerms }));",
  "                        onAdminUpdateUser(permTarget.username, { companyPermissions: newPerms });",
  "                      }}",
  '                      className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer transition-colors"',
  '                      title="Tüm firmalara tam yetki (görüntüle + düzenle) ver"',
  "                    >",
  "                      Tümünü Düzenle",
  "                    </button>",
  "                    <button",
  '                      type="button"',
  "                      onClick={() => {",
  "                        setPermTarget(prev => ({ ...prev, companyPermissions: [] }));",
  "                        onAdminUpdateUser(permTarget.username, { companyPermissions: [] });",
  "                      }}",
  '                      className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer transition-colors"',
  '                      title="Tüm firma yetkilerini sıfırla"',
  "                    >",
  "                      Sıfırla",
  "                    </button>",
  "                  </div>",
  "                </div>",
  "              )}",
  "",
  '              <div className="p-5 space-y-2.5 overflow-y-auto grow">',
  "                {myCompanies.length === 0 ? (",
  '                  <p className="text-center text-slate-400 text-sm py-6">Bu OSGB\'ye atanmış firma yok. Firmalar sekmesinden atayın.</p>',
  "                ) : myCompanies.map(c => {",
  "                  const perm = getUserPerm(permTarget, c.id);",
  "                  const canViewChecked = isTargetManager ? true : Boolean(perm.canView);",
  "                  const canEditChecked = isTargetManager ? true : Boolean(perm.canEdit);",
  "",
  "                  return (",
  '                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-colors">',
  '                      <div className="flex items-center gap-3">',
  "                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${c.color || 'bg-blue-600'}`}>{(c.name || '?').charAt(0)}</div>",
  "                        <div>",
  '                          <p className="font-semibold text-slate-800 text-sm">{c.name}</p>',
  '                          <p className="text-[11px] text-slate-400">{c.info?.hazardClass || \'—\'}</p>',
  "                        </div>",
  "                      </div>",
  '                      <div className="flex items-center gap-5">',
  "                        <label className={`flex flex-col items-center gap-1 ${isTargetManager ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}>",
  "                          <input",
  '                            type="checkbox"',
  "                            checked={canViewChecked}",
  "                            disabled={isTargetManager}",
  "                            onChange={e => handleTogglePerm(permTarget, c.id, 'canView', e.target.checked)}",
  "                            className={`w-4 h-4 accent-teal-500 ${isTargetManager ? 'cursor-not-allowed' : 'cursor-pointer'}`}",
  "                          />",
  '                          <span className="text-[9px] text-slate-500 font-bold">Görüntüle</span>',
  "                        </label>",
  "                        <label className={`flex flex-col items-center gap-1 ${isTargetManager ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}>",
  "                          <input",
  '                            type="checkbox"',
  "                            checked={canEditChecked}",
  "                            disabled={isTargetManager}",
  "                            onChange={e => handleTogglePerm(permTarget, c.id, 'canEdit', e.target.checked)}",
  "                            className={`w-4 h-4 accent-indigo-500 ${isTargetManager ? 'cursor-not-allowed' : 'cursor-pointer'}`}",
  "                          />",
  '                          <span className="text-[9px] text-slate-500 font-bold">Düzenle</span>',
  "                        </label>",
  "                      </div>",
  "                    </div>",
  "                  );",
  "                })}",
  "              </div>",
  '              <div className="p-5 border-t border-slate-200 shrink-0 bg-slate-50">',
  '                <button onClick={() => setShowPermModal(false)} className="w-full px-4 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer shadow-sm">Kapat</button>',
  "              </div>",
  "            </div>",
  "          </div>",
  "        );",
  "      })()}"
].join('\n');

if (content.includes(oldPermModalPattern)) {
  content = content.replace(oldPermModalPattern, newPermModal);
  console.log('✔ Patched showPermModal UI in OsgbManagerPanel');
} else {
  console.warn('showPermModal pattern not found directly, checking...');
}

// =========================================================================
// 3. PATCH: Permissions Tab table - Disable manager rows, allow staff
// =========================================================================
console.log('3. Patching activeTab === permissions table...');

const oldTableManagerButtons = `<div className="flex gap-1 mt-2">
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
                            </div>`;

const newTableManagerButtons = `{!Boolean(u.isOsgbManager || u.role === 'osgb_manager' || u.isManager) && (
                            <div className="flex gap-1 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerms = myCompanies.map(c => ({ companyId: c.id, canView: true, canEdit: false }));
                                  onAdminUpdateUser(u.username, { companyPermissions: newPerms });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
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
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                                title="Tüm firmalara tam yetki (görüntüle + düzenle) ver"
                              >
                                Tümünü Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onAdminUpdateUser(u.username, { companyPermissions: [] });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                                title="Tüm izinleri kaldır"
                              >
                                Sıfırla
                              </button>
                            </div>
                          )}`;

if (content.includes(oldTableManagerButtons)) {
  content = content.replace(oldTableManagerButtons, newTableManagerButtons);
  console.log('✔ Patched action buttons in permissions table');
}

const oldTableCheckboxes = `<td key={c.id} className="px-3 py-3 text-center border-r border-slate-200">
                                <div className="flex justify-center gap-5">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer group">
                                    <input type="checkbox" checked={perm.canView}
                                      onChange={e => handleTogglePerm(u, c.id, 'canView', e.target.checked)}
                                      className="w-4 h-4 accent-teal-500 cursor-pointer" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-teal-600 transition-colors">Gör</span>
                                  </label>
                                  <label className="flex flex-col items-center gap-1 cursor-pointer group">
                                    <input type="checkbox" checked={perm.canEdit}
                                      onChange={e => handleTogglePerm(u, c.id, 'canEdit', e.target.checked)}
                                      className="w-4 h-4 accent-indigo-500 cursor-pointer" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 transition-colors">Düz</span>
                                  </label>
                                </div>
                              </td>`;

const newTableCheckboxes = [
  '                              <td key={c.id} className="px-3 py-3 text-center border-r border-slate-200">',
  "                                {(() => {",
  "                                  const isRowManager = Boolean(u.isOsgbManager || u.role === 'osgb_manager' || u.isManager);",
  "                                  const rowCanView = isRowManager ? true : Boolean(perm.canView);",
  "                                  const rowCanEdit = isRowManager ? true : Boolean(perm.canEdit);",
  "                                  return (",
  '                                    <div className="flex justify-center gap-5">',
  '                                      <label className={`flex flex-col items-center gap-1 group ${isRowManager ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}>',
  "                                        <input",
  '                                          type="checkbox"',
  "                                          checked={rowCanView}",
  "                                          disabled={isRowManager}",
  "                                          onChange={e => handleTogglePerm(u, c.id, 'canView', e.target.checked)}",
  '                                          className={`w-4 h-4 accent-teal-500 ${isRowManager ? "cursor-not-allowed" : "cursor-pointer"}`}',
  "                                        />",
  '                                        <span className="text-[9px] text-slate-400 group-hover:text-teal-600 transition-colors">Gör</span>',
  "                                      </label>",
  '                                      <label className={`flex flex-col items-center gap-1 group ${isRowManager ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}>',
  "                                        <input",
  '                                          type="checkbox"',
  "                                          checked={rowCanEdit}",
  "                                          disabled={isRowManager}",
  "                                          onChange={e => handleTogglePerm(u, c.id, 'canEdit', e.target.checked)}",
  '                                          className={`w-4 h-4 accent-indigo-500 ${isRowManager ? "cursor-not-allowed" : "cursor-pointer"}`}',
  "                                        />",
  '                                        <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 transition-colors">Düz</span>',
  "                                      </label>",
  "                                    </div>",
  "                                  );",
  "                                })()}",
  "                              </td>"
].join('\n');

if (content.includes(oldTableCheckboxes)) {
  content = content.replace(oldTableCheckboxes, newTableCheckboxes);
  console.log('✔ Patched checkboxes in permissions table');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('🎉 Successfully applied permission modal and table patches!');
