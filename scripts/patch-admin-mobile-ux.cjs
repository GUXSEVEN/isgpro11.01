const fs = require('fs');
const path = require('path');

const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
const targetCssPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\index.css';

console.log('>>> [1/2] Updating index.css...');
let cssContent = fs.readFileSync(targetCssPath, 'utf8');

cssContent = cssContent.replace(
  /\/\* Tüm body'ye kaydırma touch-action izni ver \*\/\s*touch-action:\s*pan-y pinch-zoom;/g,
  `/* Tüm body'ye yatay ve dikey kaydırma touch-action izni ver */\n  touch-action: pan-x pan-y pinch-zoom;`
);

cssContent = cssContent.replace(
  /\.panel-scroll-container\s*\{([\s\S]*?)touch-action:\s*pan-y pinch-zoom !important;([\s\S]*?)\}/,
  `.panel-scroll-container {$1touch-action: pan-x pan-y pinch-zoom !important;$2}`
);

if (!cssContent.includes('.tab-swipeable-btn')) {
  cssContent += `\n\n/* Dokunmatik menü sekme butonları için yatay dokunma izni */
.tab-swipeable-btn,
.panel-horizontal-scroll button,
[data-tab-btn] {
  touch-action: pan-x pan-y !important;
  user-select: none;
  -webkit-user-select: none;
}\n`;
}

fs.writeFileSync(targetCssPath, cssContent, 'utf8');
console.log('>>> index.css updated successfully!');

console.log('>>> [2/2] Updating App.jsx...');
let appContent = fs.readFileSync(targetAppPath, 'utf8');

// 1. AdminPanel state & tab synchronization
const oldAdminState = `function AdminPanel({ currentUser, users, companies, osgbs = [], onSaveOsgbs, onLogout, onBack, onAdminUpdateUser, onSetOsgbManager, onAssignOsgbToCompany, onCreateUser, onDeleteUser, onOsgbManagementClick, smtpConfig, onSaveSmtpConfig }) {
  const [activeTab, setActiveTab] = useState('users');
  const adminTabsRef = useRef(null);`;

const newAdminState = `function AdminPanel({ currentUser, users, companies, osgbs = [], onSaveOsgbs, onLogout, onBack, onAdminUpdateUser, onSetOsgbManager, onAssignOsgbToCompany, onCreateUser, onDeleteUser, onOsgbManagementClick, smtpConfig, onSaveSmtpConfig }) {
  const [activeTab, setActiveTab] = useState('users');
  const [userViewMode, setUserViewMode] = useState('cards'); // 'cards' veya 'table' mobilde
  const adminTabsRef = useRef(null);

  // Aktif sekme değiştiğinde sekme çubuğunu otomatik olarak ortala
  useEffect(() => {
    if (adminTabsRef.current) {
      const activeBtn = adminTabsRef.current.querySelector(\`[data-tab="\${activeTab}"]\`);
      if (activeBtn) {
        try {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (_) {}
      }
    }
  }, [activeTab]);

  // Sekmeler için dokunmatik kaydırma dinleyicisi (Direct Touch Drag)
  useEffect(() => {
    const el = adminTabsRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onTouchStart = (e) => {
      isDown = true;
      startX = e.touches[0].pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onTouchEnd = () => { isDown = false; };
    const onTouchMove = (e) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startX) * 1.3;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);`;

if (appContent.includes(oldAdminState)) {
  appContent = appContent.replace(oldAdminState, newAdminState);
  console.log('>>> AdminPanel state & tab sync added.');
} else {
  console.log('>>> AdminPanel state already contains tab sync or signature differs, checking...');
}

// 2. Tab Navigation Bar with min-w-0 and pinned Chevron Buttons
const oldTabsBarRegex = /<div className="relative border-b border-slate-200 flex items-center bg-slate-50\/50">[\s\S]*?onClick=\{\(\) => \{\s*if \(adminTabsRef\.current\) adminTabsRef\.current\.scrollBy\(\{ left: -220[\s\S]*?<\/div>\s*\{TABS\.map\(tab => \([\s\S]*?<\/div>\s*\{\/\* Sağ Kaydırma Oku \*\/\}[\s\S]*?<ChevronRight size=\{18\} \/>\s*<\/button>\s*<\/div>/;

const newTabsBar = `<div className="relative border-b border-slate-200 flex items-center bg-slate-100/70 w-full min-w-0 select-none">
            {/* Sol Kaydırma Oku - Her zaman sabit ve görünür */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              className="p-3 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 active:bg-indigo-100 transition border-r border-slate-200 shrink-0 z-20 cursor-pointer flex items-center justify-center shadow-xs"
              title="Sola Kaydır"
              aria-label="Sola Kaydır"
            >
              <ChevronLeft size={20} className="text-indigo-600" />
            </button>

            {/* Kaydırılabilir Sekmeler Şeridi (min-w-0 ile sağ oku asla dışarı itmez) */}
            <div
              ref={adminTabsRef}
              className="flex flex-1 min-w-0 overflow-x-auto scroll-smooth custom-panel-scrollbar select-none py-1 no-scrollbar touch-pan-x"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  data-tab-btn="true"
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                    setSelectedUser(null);
                    try {
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } catch (_) {}
                  }}
                  className={\`tab-swipeable-btn flex items-center gap-2 px-4 md:px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer \${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs font-extrabold'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white/60'
                  }\`}
                  style={{ touchAction: 'pan-x pan-y' }}
                >
                  <tab.icon size={16} className={activeTab === tab.key ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sağ Kaydırma Oku - Her zaman sabit ve görünür */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              className="p-3 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 active:bg-indigo-100 transition border-l border-slate-200 shrink-0 z-20 cursor-pointer flex items-center justify-center shadow-xs"
              title="Sağa Kaydır (Yetkilendirme ve Diğer Menüler)"
              aria-label="Sağa Kaydır"
            >
              <ChevronRight size={20} className="text-indigo-600" />
            </button>
          </div>`;

if (oldTabsBarRegex.test(appContent)) {
  appContent = appContent.replace(oldTabsBarRegex, newTabsBar);
  console.log('>>> Tab bar replaced with min-w-0 and pinned Chevron buttons!');
} else {
  console.error('>>> Could not match oldTabsBarRegex in App.jsx!');
}

// 3. Add Mobile Card View for Users
const oldUsersBlockRegex = /\{activeTab === 'users' && \(\s*<div>\s*\{\/\* Mobil Yatay Kaydırma Rozeti \/ İpucu \*\/\}[\s\S]*?<div className="overflow-x-auto custom-panel-scrollbar w-full"[\s\S]*?<table className="min-w-\[880px\] w-full text-sm">[\s\S]*?<\/table>\s*\{\/\* DETAY KARTI \*\/\}/;

const newUsersBlock = `{activeTab === 'users' && (
            <div>
              {/* Mobil Görünüm Değiştirici & Kaydırma Bilgisi */}
              <div className="md:hidden px-3.5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-indigo-800">
                  {userViewMode === 'cards' ? '📱 Kart Görünümü (Mobil Uyumlu)' : '📊 Tablo Görünümü'}
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-200">
                  <button
                    type="button"
                    onClick={() => setUserViewMode('cards')}
                    className={\`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all \${
                      userViewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }\`}
                  >
                    Kartlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserViewMode('table')}
                    className={\`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all \${
                      userViewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }\`}
                  >
                    Tablo
                  </button>
                </div>
              </div>

              {/* MOBİL KART GÖRÜNÜMÜ (Mobilde sıfır taşma, tam parmak kontrolü) */}
              {userViewMode === 'cards' && (
                <div className="md:hidden p-3 space-y-3">
                  {filtered.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">Kullanıcı bulunamadı</div>
                  )}
                  {filtered.map((u, idx) => {
                    const remaining = getRemainingDays(u.licenseExpiresAt);
                    const userKey = u.id ? \`m-user-\${u.username}-\${u.id}-\${idx}\` : \`m-user-\${u.username}-\${idx}\`;
                    return (
                      <div
                        key={userKey}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Başlık ve Rol */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs">
                              {(u.name || u.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm">{u.name || u.username}</p>
                              <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {u.isPremium ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Tam Sürüm
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bilgi Rozetleri */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {u.osgb?.name ? (
                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-100">
                              🏢 {u.osgb.name}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-400 italic px-2 py-0.5 rounded-lg">
                              OSGB Atanmamış
                            </span>
                          )}
                          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg">
                            {u.role === 'uzman' ? 'İSG Uzmanı' : u.role === 'hekim' ? 'İşyeri Hekimi' : u.role || '—'}
                          </span>
                          {remaining !== null && (
                            <span className={\`font-bold px-2 py-0.5 rounded-lg \${
                              remaining > 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }\`}>
                              ⏳ {remaining} gün kaldı
                            </span>
                          )}
                        </div>

                        {/* E-posta & TC */}
                        <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                          <div className="truncate">📧 {u.email || 'E-posta belirtilmemiş'}</div>
                          {u.tcNo && <div>🆔 TC: {u.tcNo}</div>}
                          {u.certificateNo && <div>📜 Belge: {u.certificateNo}</div>}
                          <label className="flex items-center gap-2 pt-1 font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!u.canViewAllCompanies}
                              onChange={e => onAdminUpdateUser(u.username, { canViewAllCompanies: e.target.checked })}
                              className="w-4 h-4 accent-indigo-600 rounded"
                            />
                            <span>Tüm Firmaları Görebilsin</span>
                          </label>
                        </div>

                        {/* Aksiyon Butonları (Mobilde Tam Dokunmatik) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(u)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Building2 size={12} /> OSGB
                          </button>
                          <button
                            type="button"
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
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Edit size={12} /> Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.username)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Trash2 size={12} /> Sil
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MASAÜSTÜ VEYA SEÇİLEN TABLO GÖRÜNÜMÜ */}
              <div className={\`overflow-x-auto custom-panel-scrollbar w-full \${userViewMode === 'cards' ? 'hidden md:block' : 'block'}\`} style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}>
                <table className="min-w-[880px] w-full text-sm">
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
              </div>
              {/* DETAY KARTI */}`;

if (oldUsersBlockRegex.test(appContent)) {
  appContent = appContent.replace(oldUsersBlockRegex, newUsersBlock);
  console.log('>>> Mobile Card View & Responsive User Tab added!');
} else {
  console.error('>>> Could not match oldUsersBlockRegex in App.jsx!');
}

fs.writeFileSync(targetAppPath, appContent, 'utf8');
console.log('>>> App.jsx completely updated and saved!');
