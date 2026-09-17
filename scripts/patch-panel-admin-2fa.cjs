/**
 * patch-panel-admin-2fa.cjs
 * Applies Two-Factor Authentication (2FA) requirement for Admin login
 * to isg-projesi - Copy/src/App.jsx.
 */

const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('Target file not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> [Patch Panel Admin 2FA] Başlatılıyor...');

// 1. Update LoginScreen signature to accept onConfirmAdminLogin
const oldLoginScreenSig = 'function LoginScreen({ onLogin, onRegister, onResetPassword, checkUserExists, theme, toggleTheme }) {';
const newLoginScreenSig = 'function LoginScreen({ onLogin, onRegister, onResetPassword, checkUserExists, theme, toggleTheme, onConfirmAdminLogin }) {';

if (content.includes(oldLoginScreenSig)) {
  content = content.replace(oldLoginScreenSig, newLoginScreenSig);
  console.log('✔ LoginScreen parametresi onConfirmAdminLogin eklendi.');
}

// 2. Add 2FA states & handlers to LoginScreen
const loginScreenStateTarget = "const [msg, setMsg] = useState({ type: '', text: '' });\n  const [isSending, setIsSending] = useState(false);";
const loginScreenStateReplace = `const [msg, setMsg] = useState({ type: '', text: '' });
  const [isSending, setIsSending] = useState(false);
  const [admin2FAChallengeId, setAdmin2FAChallengeId] = useState('');
  const [admin2FACode, setAdmin2FACode] = useState('');
  const [admin2FACountdown, setAdmin2FACountdown] = useState(600);`;

if (content.includes(loginScreenStateTarget) && !content.includes('admin2FAChallengeId')) {
  content = content.replace(loginScreenStateTarget, loginScreenStateReplace);
  console.log('✔ LoginScreen içine admin 2FA state tanımları eklendi.');
}

// 2b. Add countdown effect for admin_2fa
const oldTimerEffect = `  useEffect(() => {
    if (view !== 'otp') return;`;
const newTimerEffect = `  useEffect(() => {
    if (view !== 'admin_2fa') return;
    setAdmin2FACountdown(600);
    const timer = setInterval(() => {
      setAdmin2FACountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'otp') return;`;

if (content.includes(oldTimerEffect) && !content.includes("view !== 'admin_2fa'")) {
  content = content.replace(oldTimerEffect, newTimerEffect);
  console.log('✔ admin_2fa için geri sayım timer effect eklendi.');
}

// 3. Update handleLogin in LoginScreen to handle 2FA response
const oldHandleLoginInScreen = `const handleLogin = async (e) => { e.preventDefault(); const cleanUser = (username || '').trim(); const success = await onLogin(cleanUser, password); if (!success) setMsg({ type: 'error', text: 'Yanlış şifre veya hatalı kullanıcı adı' }); };`;
const newHandleLoginInScreen = `const handleLogin = async (e) => {
    e.preventDefault();
    const cleanUser = (username || '').trim();
    setIsSending(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await onLogin(cleanUser, password);
      if (res === true) {
        // normal login success
      } else if (res && typeof res === 'object' && res.requires2FA) {
        setAdmin2FAChallengeId(res.challengeId);
        setAdmin2FACode('');
        setView('admin_2fa');
        setMsg({ type: 'info', text: 'Admin güvenlik kodu infoisgpro@gmail.com adresine iletildi.' });
      } else {
        setMsg({ type: 'error', text: 'Yanlış şifre veya hatalı kullanıcı adı' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Giriş yapılırken bir hata oluştu.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAdmin2FA = async (e) => {
    e.preventDefault();
    const cleanCode = (admin2FACode || '').trim().replace(/\\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setMsg({ type: 'error', text: 'Lütfen 6 haneli güvenlik kodunu eksiksiz giriniz.' });
      return;
    }
    setIsSending(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/auth/admin-2fa/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: admin2FAChallengeId, code: cleanCode })
      });
      const data = await res.json();
      if (data.success && data.verified) {
        if (typeof onConfirmAdminLogin === 'function') {
          await onConfirmAdminLogin();
        }
      } else {
        setMsg({ type: 'error', text: data.error || 'Geçersiz veya süresi dolmuş kod girdiniz.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Doğrulama sırasında bağlantı hatası oluştu.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleResendAdmin2FACode = async () => {
    setIsSending(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/auth/admin-2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.challengeId) {
        setAdmin2FAChallengeId(data.challengeId);
        setAdmin2FACountdown(600);
        setMsg({ type: 'success', text: 'Yeni 6 haneli güvenlik kodu infoisgpro@gmail.com adresine gönderildi.' });
      } else {
        setMsg({ type: 'error', text: data.error || 'Kod gönderilemedi.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Kod gönderilirken bir hata oluştu.' });
    } finally {
      setIsSending(false);
    }
  };`;

if (content.includes(oldHandleLoginInScreen)) {
  content = content.replace(oldHandleLoginInScreen, newHandleLoginInScreen);
  console.log('✔ LoginScreen handleLogin 2FA desteği ve doğrulama fonksiyonları eklendi.');
}

// 4. Render admin_2fa view in LoginScreen JSX right after {view === 'login' && (...)}
const loginViewTarget = "{view === 'login' && (";
const admin2FAViewHtml = `{view === 'admin_2fa' && (
          <form onSubmit={handleVerifyAdmin2FA} className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-inner">
              <Lock size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Yönetici Giriş Doğrulaması (2FA)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Güvenliğiniz için <strong className="text-indigo-600 dark:text-indigo-400 font-mono">infoisgpro@gmail.com</strong> adresine 6 haneli güvenlik kodu gönderildi.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block text-left mb-1">
                6 Haneli Doğrulama Kodu
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-2xl tracking-[8px] font-black focus:ring-2 focus:ring-indigo-500 outline-none transition text-indigo-600 dark:text-indigo-400 font-mono"
                placeholder="000000"
                value={admin2FACode}
                onChange={e => setAdmin2FACode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
              />
              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                <span>Kalan Süre: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatTime(admin2FACountdown)}</strong></span>
                <button
                  type="button"
                  disabled={admin2FACountdown > 540 || isSending}
                  onClick={handleResendAdmin2FACode}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50 cursor-pointer"
                >
                  Tekrar Kod Gönder
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending || admin2FACode.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? 'Doğrulanıyor...' : 'Kodu Doğrula ve Giriş Yap'}
            </button>

            <button
              type="button"
              onClick={() => {
                setView('login');
                setMsg({ type: '', text: '' });
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold hover:underline cursor-pointer pt-2 block mx-auto"
            >
              ← Giriş Ekranına Geri Dön
            </button>
          </form>
        )}\n\n        `;

if (content.includes(loginViewTarget) && !content.includes("view === 'admin_2fa'")) {
  content = content.replace(loginViewTarget, admin2FAViewHtml + loginViewTarget);
  console.log('✔ LoginScreen JSX içine admin_2fa arayüzü eklendi.');
}

// 5. In main App component, add pendingAdminLogin state & handleConfirmAdminLogin
const mainAppPendingTarget = "const [currentUser, setCurrentUser] = useState(() => {";
const mainAppPendingReplace = `const [pendingAdminLogin, setPendingAdminLogin] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {`;

if (content.includes(mainAppPendingTarget) && !content.includes('pendingAdminLogin')) {
  content = content.replace(mainAppPendingTarget, mainAppPendingReplace);
  console.log('✔ Ana bileşene pendingAdminLogin state eklendi.');
}

// 6. Add handleConfirmAdminLogin in main App
const mainAppConfirmFunc = `  const handleConfirmAdminLogin = async () => {
    if (!pendingAdminLogin) return;
    const adminUser = pendingAdminLogin;
    setCurrentUser(adminUser);
    try {
      localStorage.setItem('currentUser', JSON.stringify(encryptUser(adminUser)));
      localStorage.setItem('user', JSON.stringify(encryptUser(adminUser)));
    } catch (e) {}
    setActiveView('admin');
    setPendingAdminLogin(null);
  };
`;

if (!content.includes('const handleConfirmAdminLogin =')) {
  content = content.replace('const handleLogin = async (username, password) => {', mainAppConfirmFunc + '\n  const handleLogin = async (username, password) => {');
  console.log('✔ handleConfirmAdminLogin fonksiyonu tanımlandı.');
}

// 7. In handleLogin: intercept admin login and dispatch 2FA
const oldAdminFallback = `    // Kesin geçiş garantisi (Admin Fallback Override)
    if (normalizedUsername === 'admin' && (password === getObfuscatedSecret('cGFzc3dvcmQ=') || hashedPassword === '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8')) {
      let adminUser = users.find(u => cleanUsername(u.username) === 'admin');
      if (!adminUser) {
        adminUser = {
          username: "admin",
          password: encryptData(getObfuscatedSecret('cGFzc3dvcmQ=')),
          name: "Sistem Yöneticisi",
          email: getObfuscatedSecret('YWRtaW5AaXNnLmNvbQ=='),
          phone: getObfuscatedSecret('NTU1MTExMjIzMw=='),
          role: 'other',
          certificateNo: '',
          osgb: { name: '', logo: null, idNo: '', contact: '', staff: [] }
        };
      }
      setCurrentUser(adminUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(adminUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(adminUser)));
      } catch (e) {}
      setActiveView('admin');
      return true;
    }`;

const newAdminFallback = `    // Kesin geçiş garantisi (Admin Fallback Override with Mandatory 2FA)
    if (normalizedUsername === 'admin' && (password === getObfuscatedSecret('cGFzc3dvcmQ=') || hashedPassword === '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8')) {
      let adminUser = users.find(u => cleanUsername(u.username) === 'admin');
      if (!adminUser) {
        adminUser = {
          username: "admin",
          password: encryptData(getObfuscatedSecret('cGFzc3dvcmQ=')),
          name: "Sistem Yöneticisi",
          email: getObfuscatedSecret('YWRtaW5AaXNnLmNvbQ=='),
          phone: getObfuscatedSecret('NTU1MTExMjIzMw=='),
          role: 'other',
          certificateNo: '',
          osgb: { name: '', logo: null, idNo: '', contact: '', staff: [] }
        };
      }
      // MUTLAK 2FA ZORUNLULUĞU: infoisgpro@gmail.com adresine kod gönderilmeden giriş yapılamaz
      setPendingAdminLogin(adminUser);
      try {
        const res = await fetch('/api/auth/admin-2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.challengeId) {
          return { requires2FA: true, challengeId: data.challengeId };
        } else {
          throw new Error(data.error || 'Admin 2FA kodu gönderilemedi.');
        }
      } catch (err) {
        console.error('2FA send error:', err);
        throw err;
      }
    }`;

if (content.includes(oldAdminFallback)) {
  content = content.replace(oldAdminFallback, newAdminFallback);
  console.log('✔ handleLogin fallback admin girişi 2FA zorunluluğuna bağlandı.');
}

// 8. Also intercept foundUser when foundUser.username === 'admin'
const oldFoundUserAdmin = `      } else if (foundUser.username === 'admin') {
        setActiveView('admin');
      } else {`;

const newFoundUserAdmin = `      } else if (foundUser.username === 'admin') {
        setPendingAdminLogin(foundUser);
        const res = await fetch('/api/auth/admin-2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.challengeId) {
          return { requires2FA: true, challengeId: data.challengeId };
        } else {
          throw new Error(data.error || 'Admin 2FA kodu gönderilemedi.');
        }
      } else {`;

if (content.includes(oldFoundUserAdmin)) {
  content = content.replace(oldFoundUserAdmin, newFoundUserAdmin);
  console.log('✔ handleLogin database foundUser admin girişi 2FA zorunluluğuna bağlandı.');
}

// 9. Update <LoginScreen ... /> call in App to pass onConfirmAdminLogin
const oldLoginScreenCall = '<LoginScreen onLogin={handleLogin} onRegister={handleRegister} onResetPassword={handleResetPassword} checkUserExists={checkUserExists} theme={theme} toggleTheme={toggleTheme} />';
const newLoginScreenCall = '<LoginScreen onLogin={handleLogin} onRegister={handleRegister} onResetPassword={handleResetPassword} checkUserExists={checkUserExists} theme={theme} toggleTheme={toggleTheme} onConfirmAdminLogin={handleConfirmAdminLogin} />';

if (content.includes(oldLoginScreenCall)) {
  content = content.replace(oldLoginScreenCall, newLoginScreenCall);
  console.log('✔ <LoginScreen /> çağrısına onConfirmAdminLogin propu geçirildi.');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✔ isg-projesi - Copy/src/App.jsx başarıyla güncellendi ve kaydedildi!');
