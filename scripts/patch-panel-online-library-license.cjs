const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx');
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add isUserLicensedForOnlineLibrary helper function right after isLicenseActive
if (!content.includes('isUserLicensedForOnlineLibrary')) {
  const licenseActivePattern = /const isLicenseActive = \(userOrRecord\) => \{[\s\S]*?return Date\.now\(\) <= expiresAtMs;\r?\n\};/;
  const match = content.match(licenseActivePattern);
  if (!match) {
    console.error('Could not find isLicenseActive pattern in file!');
    process.exit(1);
  }

  const helperFunction = `${match[0]}

export const isUserLicensedForOnlineLibrary = (user) => {
  if (!user) return false;
  // Admin hesabı her zaman tam erişime sahiptir
  if (user.username === 'admin' || user.role === 'admin' || user.isAdmin === true) return true;
  // Lisansı olmayan, deneme sürümündeki veya lisans süresi dolmuş hesaplar engellenir
  if (!user.isPremium) return false;
  if (user.licenseType === 'trial' || user.licenseType === 'demo') return false;
  if (typeof isLicenseActive === 'function' && !isLicenseActive(user)) return false;
  return true;
};`;

  content = content.replace(match[0], helperFunction);
  console.log('Added isUserLicensedForOnlineLibrary helper function.');
} else {
  console.log('isUserLicensedForOnlineLibrary already present.');
}

// 2. Update OnlineLibraryModal signature to receive triggerUpgrade
if (content.includes('function OnlineLibraryModal({ onClose, onImport, localLibrary, currentUser, onImportFolderWithItems, localFolders, activeAssessmentId, onImportRisks }) {')) {
  content = content.replace(
    'function OnlineLibraryModal({ onClose, onImport, localLibrary, currentUser, onImportFolderWithItems, localFolders, activeAssessmentId, onImportRisks }) {',
    'function OnlineLibraryModal({ onClose, onImport, localLibrary, currentUser, onImportFolderWithItems, localFolders, activeAssessmentId, onImportRisks, triggerUpgrade }) {'
  );
  console.log('Updated OnlineLibraryModal function signature.');
}

// 3. Add license check & fetch guard in OnlineLibraryModal
if (!content.includes('const isLicensed = isUserLicensedForOnlineLibrary(currentUser);')) {
  const modalStartPattern = /function OnlineLibraryModal\(\{ onClose, onImport, localLibrary, currentUser, onImportFolderWithItems, localFolders, activeAssessmentId, onImportRisks, triggerUpgrade \}\) \{(\r?\n)/;
  const matchModal = content.match(modalStartPattern);
  if (matchModal) {
    content = content.replace(
      matchModal[0],
      `${matchModal[0]}  const isLicensed = isUserLicensedForOnlineLibrary(currentUser);${matchModal[1]}`
    );
    console.log('Added isLicensed check in OnlineLibraryModal.');
  }
}

// Guard fetchOnlineData so it never queries Firestore when unlicensed
const oldFetchOnlinePattern = /useEffect\(\(\) => \{\r?\n\s*const fetchOnlineData = async \(\) => \{/;
if (content.match(oldFetchOnlinePattern) && !content.includes('if (!isLicensed) {\r\n        setLoading(false);\r\n        return;\r\n      }')) {
  content = content.replace(
    oldFetchOnlinePattern,
    `useEffect(() => {\r\n    if (!isLicensed) {\r\n      setLoading(false);\r\n      return;\r\n    }\r\n    const fetchOnlineData = async () => {`
  );
  console.log('Guarded fetchOnlineData against unlicensed accounts.');
}

// 4. Add locked screen return in OnlineLibraryModal render
if (!content.includes('Online Kütüphaneye Erişim Engellendi')) {
  const modalRenderPattern = /(\r?\n\s*return \(\r?\n\s*<div className="fixed inset-0 bg-slate-900\/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">\r?\n\s*<div className="bg-white w-full max-w-5xl)/;
  const matchRender = content.match(modalRenderPattern);
  if (matchRender) {
    const lockedScreen = `
  if (!isLicensed) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/20 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center mb-5 shadow-inner border border-amber-300/40">
            <Lock size={38} className="text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <ShieldAlert size={13} />
            <span>Lisanslı Kullanıcı Özelliği</span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">
            Online Kütüphaneye Erişim Engellendi
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
            Online Kütüphane ve bulut tabanlı hazır risk havuzu yalnızca <strong>aktif lisansa sahip</strong> kullanıcılara özeldir. Lisansı olmayan, süresi dolan veya deneme sürümündeki hesapların erişimi engellenmiştir.
          </p>

          <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-left mb-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Binlerce hazır sektörel İSG tehlike ve risk maddesi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Tek tıkla analizlere ve yerel kütüphaneye aktarma</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Sürekli güncellenen mevzuata uygun şablonlar</span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={() => {
                onClose();
                if (typeof triggerUpgrade === 'function') {
                  triggerUpgrade("Online Kütüphane erişimi lisanslı kullanıcılara özeldir. Bulut kütüphanesini kullanmak ve hazır risk şablonlarını indirmek için lütfen aktif bir lisans edininiz.");
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Crown size={16} />
              Lisans Edin
            </button>
          </div>
        </div>
      </div>
    );
  }
`;
    content = content.replace(matchRender[0], lockedScreen + matchRender[0]);
    console.log('Added locked screen render to OnlineLibraryModal.');
  }
}

// 5. Update handleUploadSpecificFolder with license check
const folderUploadPattern = /const handleUploadSpecificFolder = async \(folder\) => \{\r?\n\s*if \(!db\) \{ alert\("Veritabanı bağlantısı yok\."\); return; \}/;
if (content.match(folderUploadPattern)) {
  content = content.replace(
    folderUploadPattern,
    `const handleUploadSpecificFolder = async (folder) => {\r\n    if (!isUserLicensedForOnlineLibrary(currentUser)) {\r\n      if (typeof triggerUpgrade === 'function') {\r\n        triggerUpgrade("Buluta klasör yükleme ve Online Kütüphane özellikleri yalnızca aktif lisansı bulunan hesaplara özeldir. Lütfen tam sürüm lisansı edininiz.");\r\n      } else {\r\n        alert("Bu özellik lisansı olmayan hesaplar için engellenmiştir. Lütfen aktif bir lisans edininiz.");\r\n      }\r\n      return;\r\n    }\r\n    if (!db) { alert("Veritabanı bağlantısı yok."); return; }`
  );
  console.log('Updated handleUploadSpecificFolder with license check.');
}

// 6. Update handleUploadToCloud with license check
const itemUploadPattern = /const handleUploadToCloud = async \(\) => \{\r?\n\s*if \(!db\) \{ alert\("Veritabanı bağlantısı yok\."\); return; \}/;
if (content.match(itemUploadPattern)) {
  content = content.replace(
    itemUploadPattern,
    `const handleUploadToCloud = async () => {\r\n    if (!isUserLicensedForOnlineLibrary(currentUser)) {\r\n      if (typeof triggerUpgrade === 'function') {\r\n        triggerUpgrade("Buluta madde yükleme ve Online Kütüphane özellikleri yalnızca aktif lisansı bulunan hesaplara özeldir. Lütfen tam sürüm lisansı edininiz.");\r\n      } else {\r\n        alert("Bu özellik lisansı olmayan hesaplar için engellenmiştir. Lütfen aktif bir lisans edininiz.");\r\n      }\r\n      return;\r\n    }\r\n    if (!db) { alert("Veritabanı bağlantısı yok."); return; }`
  );
  console.log('Updated handleUploadToCloud with license check.');
}

// 7. Update Online Library button in LibraryManager
const buttonPattern = /<button\r?\n\s*onClick=\{\(\) => \{\r?\n\s*if \(currentUser\?\.username !== 'admin' && !currentUser\?\.isPremium\) \{[\s\S]*?setShowOnlineModal\(true\);\r?\n\s*\}\r?\n\s*\}\}\r?\n\s*className="bg-white dark:bg-slate-700 border-2 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950\/30 shadow-sm whitespace-nowrap transition-colors"\r?\n\s*>\r?\n\s*<Cloud size=\{16\} \/> Online Kütüphane\r?\n\s*<\/button>/;

const newButton = `<button
              onClick={() => {
                if (!isUserLicensedForOnlineLibrary(currentUser)) {
                  if (typeof triggerUpgrade === 'function') {
                    triggerUpgrade("Online Kütüphane ve hazır risk şablonları erişimi lisanslı kullanıcılara özeldir. Lisansı olmayan hesaplardan erişim engellenmiştir. Bulut kütüphanesini kullanmak ve hazır şablonları indirmek için lütfen aktif bir lisans edininiz.");
                  } else {
                    alert("Online Kütüphane erişimi lisansı olmayan hesaplar için engellenmiştir. Lütfen aktif bir lisans edininiz.");
                  }
                  return;
                }
                setShowOnlineModal(true);
              }}
              className={\`bg-white dark:bg-slate-700 border-2 \${!isUserLicensedForOnlineLibrary(currentUser) ? 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300'} px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-sm whitespace-nowrap transition-colors\`}
              title={!isUserLicensedForOnlineLibrary(currentUser) ? "Online Kütüphane lisanslı kullanıcılara özeldir (Kilitli)" : "Online Kütüphane"}
            >
              {!isUserLicensedForOnlineLibrary(currentUser) ? <Lock size={15} className="text-amber-500" /> : <Cloud size={16} />} Online Kütüphane
            </button>`;

if (content.match(buttonPattern)) {
  content = content.replace(buttonPattern, newButton);
  console.log('Updated Online Library button in LibraryManager.');
} else {
  console.warn('Could not match buttonPattern, trying loose match...');
  const loosePattern = /if \(currentUser\?\.username !== 'admin' && !currentUser\?\.isPremium\) \{[\s\S]*?setShowOnlineModal\(true\);\r?\n\s*\}/;
  if (content.match(loosePattern)) {
    content = content.replace(loosePattern, `if (!isUserLicensedForOnlineLibrary(currentUser)) {
                  if (typeof triggerUpgrade === 'function') {
                    triggerUpgrade("Online Kütüphane ve hazır risk şablonları erişimi lisanslı kullanıcılara özeldir. Lisansı olmayan hesaplardan erişim engellenmiştir. Bulut kütüphanesini kullanmak ve hazır şablonları indirmek için lütfen aktif bir lisans edininiz.");
                  } else {
                    alert("Online Kütüphane erişimi lisansı olmayan hesaplar için engellenmiştir. Lütfen aktif bir lisans edininiz.");
                  }
                  return;
                }
                setShowOnlineModal(true);`);
    console.log('Updated Online Library button onClick via loose match.');
  }
}

// 8. Pass triggerUpgrade to OnlineLibraryModal in LibraryManager
const modalCallPattern = /<OnlineLibraryModal\r?\n\s*onClose=\{\(\) => setShowOnlineModal\(false\)\}\r?\n\s*localLibrary=\{library\}\r?\n\s*currentUser=\{currentUser\}\r?\n\s*onImportFolderWithItems=\{onImportFolderWithItems\}\r?\n\s*onImport=\{handleOnlineImport\}\r?\n\s*localFolders=\{folders\}\r?\n\s*activeAssessmentId=\{activeAssessmentId\}\r?\n\s*onImportRisks=\{onImportRisks\}\r?\n\s*\/>/;

if (content.match(modalCallPattern)) {
  content = content.replace(
    modalCallPattern,
    `<OnlineLibraryModal
          onClose={() => setShowOnlineModal(false)}
          localLibrary={library}
          currentUser={currentUser}
          onImportFolderWithItems={onImportFolderWithItems}
          onImport={handleOnlineImport}
          localFolders={folders}
          activeAssessmentId={activeAssessmentId}
          onImportRisks={onImportRisks}
          triggerUpgrade={triggerUpgrade}
        />`
  );
  console.log('Passed triggerUpgrade prop to OnlineLibraryModal.');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched App.jsx for Online Library License Restrictions.');
