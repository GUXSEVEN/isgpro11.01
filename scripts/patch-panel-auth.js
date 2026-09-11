import fs from 'fs';
import path from 'path';

const isgProjesiDir = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy';
const appJsxPath = path.join(isgProjesiDir, 'src', 'App.jsx');

console.log('>>> Starting safe panel auth & SSO synchronization patch...');

if (!fs.existsSync(appJsxPath)) {
  console.error(`❌ App.jsx not found at ${appJsxPath}`);
  process.exit(1);
}

let raw = fs.readFileSync(appJsxPath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');
const initialLineCount = content.split('\n').length;
console.log('App.jsx lines before patch:', initialLineCount);

function safeReplace(name, searchBlock, replaceBlock) {
  const normSearch = searchBlock.replace(/\r\n/g, '\n');
  const normReplace = replaceBlock.replace(/\r\n/g, '\n');
  
  if (!content.includes(normSearch)) {
    console.error(`❌ FAILED to find target block for: ${name}`);
    return false;
  }
  
  const parts = content.split(normSearch);
  if (parts.length > 2) {
    console.error(`❌ Target block found multiple times for: ${name}`);
    return false;
  }
  
  content = parts.join(normReplace);
  console.log(`✓ Successfully patched: ${name}`);
  return true;
}

// 1. Synchronize panel currentUser initialization with landing site active user
const search1 = `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum geri yükleme (Tamamen panele özel, landing sayfası oturumundan bağımsız)
    try {
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const decUser = parsed ? decryptUser(parsed) : null;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Kullanıcı oturumu geri yüklenemedi:", e);
    }
    return null;
  });`;

const replace1 = `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum geri yükleme: Ana sitede girilen kullanıcının hesabı ekstra giriş istemeden açılır
    // Kullanıcı girişi yapılmamışsa kesinlikle kullanıcı sayfası açılmaz, doğrudan giriş ekranı gelir
    try {
      // 1. Birincil Öncelik: Ana sitedeki aktif oturumu oku
      const landingRaw = localStorage.getItem('isg_landing_current_user_v1') || localStorage.getItem('isg_active_user');
      if (landingRaw) {
        const parsed = JSON.parse(landingRaw);
        const decUser = parsed ? decryptUser(parsed) : null;
        if (decUser && (decUser.username || decUser.email)) {
          // Panelin anahtarlarını da bu aktif kullanıcıyla senkronize et
          try {
            localStorage.setItem('currentUser', JSON.stringify(encryptUser(decUser)));
            localStorage.setItem('user', JSON.stringify(encryptUser(decUser)));
          } catch (e) {}
          return decUser;
        }
      }

      // 2. İkincil Kontrol: Eğer ana sitede oturum yoksa, paneldeki eski/farklı oturumları kesinlikle devralma ve temizle!
      // Bu sayede şifresiz/yetkisiz kullanıcı sayfası açılması veya eski oturuma geçiş %100 engellenir
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (saved) {
        if (!landingRaw) {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('user');
          localStorage.removeItem('isg_current_user');
          return null;
        }
        const parsed = JSON.parse(saved);
        const decUser = parsed ? decryptUser(parsed) : null;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Kullanıcı oturumu geri yüklenemedi:", e);
    }
    return null;
  });

  // Ana site ile panel arasında anlık çift yönlü oturum senkronizasyonu
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isg_landing_current_user_v1' || e.key === 'isg_active_user' || e.key === 'currentUser') {
        if (!e.newValue) {
          // Ana sitede çıkış yapıldıysa panelde de oturumu derhal kapat ve giriş ekranına yönlendir
          setCurrentUser(null);
          setActiveView('main');
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            const decUser = parsed ? decryptUser(parsed) : null;
            if (decUser && (decUser.username || decUser.email)) {
              setCurrentUser(decUser);
            }
          } catch (err) {}
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);`;

const ok1 = safeReplace('Panel SSO currentUser initialization & cross-tab sync', search1, replace1);

// 2. Admin handleLogin sync
const searchAdminLogin = `      setCurrentUser(adminUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(adminUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(adminUser)));
      } catch (e) {}`;

const replaceAdminLogin = `      setCurrentUser(adminUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(adminUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(adminUser)));
        localStorage.setItem('isg_landing_current_user_v1', JSON.stringify(adminUser));
        localStorage.setItem('isg_active_user', JSON.stringify(adminUser));
      } catch (e) {}`;

safeReplace('Admin handleLogin sync with landing keys', searchAdminLogin, replaceAdminLogin);

// 3. User handleLogin sync
const searchUserLogin = `      setCurrentUser(foundUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(foundUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(foundUser)));
      } catch (e) {}`;

const replaceUserLogin = `      setCurrentUser(foundUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(foundUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(foundUser)));
        localStorage.setItem('isg_landing_current_user_v1', JSON.stringify(foundUser));
        localStorage.setItem('isg_active_user', JSON.stringify(foundUser));
      } catch (e) {}`;

safeReplace('User handleLogin sync with landing keys', searchUserLogin, replaceUserLogin);

// 4. handleLogout clean all keys
const searchLogout = `  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCompanyId(null);
    setActiveView('main');
    try {
      localStorage.removeItem('isg_user_signature');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('isg_current_user');
    } catch (e) {}
  };`;

const replaceLogout = `  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCompanyId(null);
    setActiveView('main');
    try {
      localStorage.removeItem('isg_user_signature');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('isg_current_user');
      localStorage.removeItem('isg_landing_current_user_v1');
      localStorage.removeItem('isg_active_user');
    } catch (e) {}
  };`;

safeReplace('handleLogout clean all session keys', searchLogout, replaceLogout);

const finalLineCount = content.split('\n').length;
console.log('App.jsx lines after patch:', finalLineCount);

if (!ok1) {
  console.error('❌ Essential replacement failed. Aborting write.');
  process.exit(1);
}

const finalOutput = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(appJsxPath, finalOutput, 'utf8');
console.log('🎉 Panel App.jsx successfully patched with unified SSO authentication!');
