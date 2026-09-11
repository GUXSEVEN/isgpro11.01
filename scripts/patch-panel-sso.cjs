const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  if (isCRLF) {
    return str.replace(/\r?\n/g, '\r\n');
  } else {
    return str.replace(/\r\n/g, '\n');
  }
}

function replaceExact(searchStr, replaceStr, label) {
  const normSearch = normalizeNewlines(searchStr);
  const normReplace = normalizeNewlines(replaceStr);
  if (!content.includes(normSearch)) {
    console.error(`ERROR: Could not find target string for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  console.log(`SUCCESS: Replaced [${label}]`);
}

const targetCurrentUser = `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Auto-restore user session if returning from PayTR payment redirect
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true' || params.get('payment_fail') === 'true') {
        const saved = localStorage.getItem('currentUser');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  });`;

const replCurrentUser = `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum senkronizasyonu: Ana sitede giriş yapılmışsa panel doğrudan o hesapla açılır
    try {
      const rawUser = localStorage.getItem('isg_landing_current_user_v1') ||
                      localStorage.getItem('isg_current_user') ||
                      localStorage.getItem('isg_active_user') ||
                      localStorage.getItem('currentUser') ||
                      localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const decUser = (typeof decryptUser === 'function') ? decryptUser(parsed) : parsed;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Panel oturumu geri yüklenemedi:", e);
    }
    return null;
  });

  // Ana site ile panel arasında anlık çift yönlü oturum senkronizasyonu
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isg_landing_current_user_v1' || e.key === 'isg_active_user' || e.key === 'currentUser' || e.key === 'isg_current_user') {
        if (!e.newValue) {
          setCurrentUser(null);
          setActiveView('main');
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            const decUser = (typeof decryptUser === 'function') ? decryptUser(parsed) : parsed;
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

replaceExact(targetCurrentUser, replCurrentUser, 'Panel SSO currentUser initialization');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated App.jsx with SSO support!');
