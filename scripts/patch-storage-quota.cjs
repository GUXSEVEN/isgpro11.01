const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Storage helper import
const importNeedle = "import KurulMeetingView from './components/tabs/KurulMeetingView'; // İSG Kurul Toplantı Yönetimi";
if (!code.includes(importNeedle)) {
  console.error('Import needle not found');
  process.exit(1);
}
if (!code.includes('./utils/storageHelper')) {
  const importAddition = `${importNeedle}\nimport { safeSetItem, safeGetItem, idbGet, idbSet } from './utils/storageHelper';`;
  code = code.replace(importNeedle, importAddition);
  console.log('1. Import added');
}

// 2. IndexedDB hydration useEffect
const stateNeedle = "const [folders, setFolders] = useState(() => loadFromStorage(STORAGE_KEYS.FOLDERS, INITIAL_FOLDERS));";
if (!code.includes(stateNeedle)) {
  console.error('State needle not found');
  process.exit(1);
}
if (!code.includes('loadFromIndexedDB')) {
  const hydrationEffect = `${stateNeedle}

  // IndexedDB'den büyük verileri (Kütüphane, Klasörler, Şirketler) asenkron yükle (LocalStorage kotasını aşan veriler için)
  useEffect(() => {
    let isMounted = true;
    async function loadFromIndexedDB() {
      try {
        const idbLib = await idbGet(STORAGE_KEYS.LIBRARY);
        if (isMounted && idbLib && Array.isArray(idbLib) && idbLib.length > 0) {
          setLibrary(prev => (idbLib.length >= (prev?.length || 0) ? idbLib : prev));
        }
        const idbFolders = await idbGet(STORAGE_KEYS.FOLDERS);
        if (isMounted && idbFolders && Array.isArray(idbFolders) && idbFolders.length > 0) {
          setFolders(prev => (idbFolders.length >= (prev?.length || 0) ? idbFolders : prev));
        }
        const idbComp = await idbGet(STORAGE_KEYS.COMPANIES);
        if (isMounted && idbComp && Array.isArray(idbComp) && idbComp.length > 0) {
          setCompanies(prev => (idbComp.length >= (prev?.length || 0) ? idbComp : prev));
        }
      } catch (err) {
        console.warn('[Storage] IndexedDB yükleme hatası:', err);
      }
    }
    loadFromIndexedDB();
    return () => { isMounted = false; };
  }, []);`;
  code = code.replace(stateNeedle, hydrationEffect);
  console.log('2. Hydration useEffect added');
}

// 3. Kütüphane kayıtlarını safeSetItem yap
code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.LIBRARY,\s*JSON\.stringify\(updatedLibrary\)\);/g, 'safeSetItem(STORAGE_KEYS.LIBRARY, updatedLibrary);');
code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.LIBRARY,\s*JSON\.stringify\(combined\)\);/g, 'safeSetItem(STORAGE_KEYS.LIBRARY, combined);');
code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.LIBRARY,\s*JSON\.stringify\(newLibrary\)\);/g, 'safeSetItem(STORAGE_KEYS.LIBRARY, newLibrary);');

code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.FOLDERS,\s*JSON\.stringify\(combined\)\);/g, 'safeSetItem(STORAGE_KEYS.FOLDERS, combined);');
code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.FOLDERS,\s*JSON\.stringify\(newFolders\)\);/g, 'safeSetItem(STORAGE_KEYS.FOLDERS, newFolders);');
code = code.replace(/localStorage\.setItem\(STORAGE_KEYS\.FOLDERS,\s*JSON\.stringify\(updatedFolders\)\);/g, 'safeSetItem(STORAGE_KEYS.FOLDERS, updatedFolders);');

// 4. Periyodik kayıt bloğundaki library ve companies için safeSetItem
code = code.replace(
  "try { localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library)); } catch (_) {}",
  "safeSetItem(STORAGE_KEYS.LIBRARY, library);"
);
code = code.replace(
  "try { localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders)); } catch (_) {}",
  "safeSetItem(STORAGE_KEYS.FOLDERS, folders);"
);

// 5. Companies kayıtlarını da safeSetItem ile destekle
code = code.replace(
  "localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));",
  "safeSetItem(STORAGE_KEYS.COMPANIES, companies);"
);
code = code.replace(
  "localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));",
  "safeSetItem(STORAGE_KEYS.COMPANIES, updatedCompanies);"
);
code = code.replace(
  "localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));",
  "safeSetItem(STORAGE_KEYS.COMPANIES, updated);"
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('SUCCESS: App.jsx successfully patched with safe hybrid IndexedDB/LocalStorage storage!');
