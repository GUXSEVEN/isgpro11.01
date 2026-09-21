const fs = require('fs');

const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let appContent = fs.readFileSync(targetAppPath, 'utf8');

// 1. Ensure osgbTabsRef is defined in OsgbManagerPanel
if (!appContent.includes('const osgbTabsRef = useRef(null);')) {
  appContent = appContent.replace(
    /const \[activeTab, setActiveTab\] = useState\('users'\);\s*const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `const [activeTab, setActiveTab] = useState('users');\n  const osgbTabsRef = useRef(null);\n  const [searchQuery, setSearchQuery] = useState('');`
  );
  console.log('>>> Added osgbTabsRef to OsgbManagerPanel');
}

// 2. Clean up AdminPanel state
const oldAdminStateRegex = /function AdminPanel\(\{[\s\S]*?\}\) \{\s*const \[activeTab, setActiveTab\] = useState\('users'\);[\s\S]*?const adminTabsRef = useRef\(null\);[\s\S]*?\/\/ Sekmeler için dokunmatik kaydırma dinleyicisi[\s\S]*?\}, \[\]\);/;

const cleanAdminState = `function AdminPanel({ currentUser, users, companies, osgbs = [], onSaveOsgbs, onLogout, onBack, onAdminUpdateUser, onSetOsgbManager, onAssignOsgbToCompany, onCreateUser, onDeleteUser, onOsgbManagementClick, smtpConfig, onSaveSmtpConfig }) {
  const [activeTab, setActiveTab] = useState('users');
  const adminTabsRef = useRef(null);`;

if (oldAdminStateRegex.test(appContent)) {
  appContent = appContent.replace(oldAdminStateRegex, cleanAdminState);
  console.log('>>> AdminPanel state cleaned to match OsgbManagerPanel');
}

// 3. Match AdminPanel tabs bar exactly with OsgbManagerPanel
const targetTabsSearch = appContent.indexOf('{/* SEKMELER');
const targetAramaSearch = appContent.indexOf('{/* ARAMA */}');

if (targetTabsSearch !== -1 && targetAramaSearch !== -1 && targetAramaSearch > targetTabsSearch) {
  const newTabsSection = `{/* SEKMELER - OSGB PANELİ İLE BİREBİR AYNI SAĞA-SOLA KAYDIRILABİLİR MENÜ ÇUBUĞU */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative border-b border-slate-200 flex items-center bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition border-r border-slate-200/80 shrink-0 z-10 cursor-pointer flex items-center justify-center select-none md:hidden"
              title="Sola Kaydır"
              aria-label="Sola Kaydır"
            >
              <ChevronLeft size={16} />
            </button>
            <div
              ref={adminTabsRef}
              className="flex flex-1 min-w-0 overflow-x-auto scroll-smooth custom-panel-scrollbar select-none py-0.5 no-scrollbar"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                    setSelectedUser(null);
                    try {
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } catch (_) {}
                  }}
                  className={\`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer \${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
                  }\`}
                  style={{ touchAction: 'pan-x pan-y' }}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition border-l border-slate-200/80 shrink-0 z-10 cursor-pointer flex items-center justify-center select-none md:hidden"
              title="Sağa Kaydır"
              aria-label="Sağa Kaydır"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          `;

  appContent = appContent.slice(0, targetTabsSearch) + newTabsSection + appContent.slice(targetAramaSearch);
  console.log('>>> Tabs bar matched to OSGB panel structure successfully!');
}

// 4. Ensure Users tab in AdminPanel is clean table like OSGB panel
const usersTabSearch = appContent.indexOf('{/* ====== KULLANICILAR ====== */}');
const osgbsTabSearch = appContent.indexOf('{/* ====== OSGB YÖNETİMİ ====== */}');

if (usersTabSearch !== -1 && osgbsTabSearch !== -1 && osgbsTabSearch > usersTabSearch) {
  const newUsersSection = `{/* ====== KULLANICILAR ====== */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto custom-panel-scrollbar w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
              <table className="w-full text-sm min-w-[850px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kullanıcı</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">OSGB</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tüm Firmaları Gör</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lisans Bitiş</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && (
                    <tr key="empty-users"><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Kullanıcı bulunamadı</td></tr>
                  )}
                  {filtered.map((u, idx) => {
                    const remaining = getRemainingDays(u.licenseExpiresAt);
                    const userKey = u.id ? \`\${u.username || 'user'}-\${u.id}-\${idx}\` : \`\${u.username || 'user'}-\${idx}\`;
                    return (
                      <tr key={userKey} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedUser(selectedUser?.username === u.username ? null : u)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(u.name || u.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{u.name || u.username}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                @{u.username} · {u.email || '—'}
                                {u.tcNo ? \` · TC: \${u.tcNo}\` : ''}
                                {u.certificateNo ? \` · Belge: \${u.certificateNo}\` : ''}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                {u.isEmailVerified ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 size={10} className="text-emerald-600" /> Doğrulanmış E-Posta
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertTriangle size={10} className="text-amber-500" /> Doğrulanmamış E-Posta
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.osgb?.name ? (
                            <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">{u.osgb.name}</span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Atanmamış</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {u.role === 'uzman' ? 'İSG Uzmanı' : u.role === 'hekim' ? 'İşyeri Hekimi' : u.role === 'dsp' ? 'Diğer Sağlık Personeli' : u.role === 'other' ? 'Diğer / Yönetici' : (u.role || '—')}
                        </td>
                        <td className="px-5 py-3.5">
                          {u.isPremium
                            ? <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">Tam Sürüm</span>
                            : <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">Demo</span>
                          }
                        </td>
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={!!u.canViewAllCompanies}
                            onChange={e => onAdminUpdateUser(u.username, { canViewAllCompanies: e.target.checked })}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          {remaining !== null ? (
                            <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${remaining > 30 ? 'bg-emerald-100 text-emerald-700' : remaining > 7 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}\`}>
                              {remaining} gün
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleOpenAssign(u)}
                              className="text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                            >
                              <Building2 size={11} /> OSGB Ata
                            </button>
                            <button
                              onClick={() => {
                                setEditUserTarget(u);
                                setEditUserName(u.name || '');
                                setEditUserTcNo(u.tcNo || '');
                                setEditUserCertificateNo(u.certificateNo || '');
                                setEditUserDiplomaNo(u.diplomaNo || '');
                                setEditUserTescilNo(u.tescilNo || '');
                                setEditUserEmail(u.email || '');
                                setEditUserPhone(u.phone || '');
                                setEditUserRole(u.role || 'uzman');
                                setEditUserOsgbName(u.osgb?.name || '');
                                setEditUserPassword('');
                                setEditUserCanViewAllCompanies(u.canViewAllCompanies || false);
                                setShowEditUser(true);
                              }}
                              className="text-[11px] bg-amber-50 text-amber-600 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                            >
                              <Edit size={11} /> Düzenle
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.username)}
                              className="text-[11px] bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 size={11} /> Sil
                            </button>
                            {u.isPremium && (
                              <button
                                onClick={() => handleRevokeAccess(u.username)}
                                className="text-[11px] bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                              >
                                <X size={11} /> İptal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* DETAY KARTI */}
              {selectedUser && (
                <div className="m-4 p-5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Info size={15} className="text-indigo-600" /> {selectedUser.name || selectedUser.username} — Detay</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Kullanıcı Adı</span>{selectedUser.username}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
                      <span className="font-bold text-slate-500 block mb-0.5">E-posta</span>
                      <span>{selectedUser.email || '—'}</span>
                      <div className="mt-1">
                        {selectedUser.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} /> Doğrulanmış E-Posta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={10} /> Doğrulanmamış E-Posta
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Telefon</span>{selectedUser.phone || '—'}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">T.C. Kimlik No</span><span className="font-mono">{selectedUser.tcNo || '—'}</span></div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Rol</span>{selectedUser.role === 'uzman' ? 'İSG Uzmanı' : selectedUser.role === 'hekim' ? 'İşyeri Hekimi' : selectedUser.role === 'dsp' ? 'Diğer Sağlık Personeli' : selectedUser.role === 'other' ? 'Diğer / Yönetici' : (selectedUser.role || '—')}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Sertifika No</span><span className="font-mono">{selectedUser.certificateNo || '—'}</span></div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Diploma No</span><span className="font-mono">{selectedUser.diplomaNo || '—'}</span></div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Tescil No</span><span className="font-mono">{selectedUser.tescilNo || '—'}</span></div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">OSGB</span>{selectedUser.osgb?.name || '—'}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Lisans Tipi</span>{selectedUser.licenseType === 'yearly' ? 'Yıllık' : selectedUser.licenseType === 'monthly' ? 'Aylık' : '—'}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Satın Alma</span>{formatDate(selectedUser.licensePurchasedAt)}</div>
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Lisans Kodu</span><span className="font-mono text-indigo-700 text-[10px]">{selectedUser.licenseKey || '—'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          `;

  appContent = appContent.slice(0, usersTabSearch) + newUsersSection + appContent.slice(osgbsTabSearch);
  console.log('>>> Users section matched to OSGB panel structure successfully!');
}

// 5. Outer container style in AdminPanel to match OsgbManagerPanel
appContent = appContent.replace(
  /<div \s*className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col"\s*style=\{\{[\s\S]*?touchAction:\s*'[^']*'[\s\S]*?\}\}\s*>/,
  `<div 
      className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y pinch-zoom',
        overscrollBehaviorY: 'contain'
      }}
    >`
);

// 6. Main container in AdminPanel to match OsgbManagerPanel
appContent = appContent.replace(
  /<main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">/,
  `<main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 flex-1 w-full">`
);

fs.writeFileSync(targetAppPath, appContent, 'utf8');
console.log('>>> App.jsx updated to match OsgbManagerPanel exactly!');
