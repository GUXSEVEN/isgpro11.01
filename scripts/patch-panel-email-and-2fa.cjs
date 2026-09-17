const fs = require('fs');
const path = require('path');

console.log('>>> [1/3] Updating emailTemplates.js in isg-projesi - Copy...');
const emailTemplatesPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/services/emailTemplates.js';
if (!fs.existsSync(emailTemplatesPath)) {
  console.error('File not found:', emailTemplatesPath);
  process.exit(1);
}

let emailTemplatesContent = fs.readFileSync(emailTemplatesPath, 'utf8');

// 1. Check if getAdmin2FAHtmlTemplate already defined
if (!emailTemplatesContent.includes('export const getAdmin2FAHtmlTemplate =')) {
  const templateFunction = `
// HTML Email Template for Admin Two-Factor Authentication (2FA) Security Verification
export const getAdmin2FAHtmlTemplate = (code = '592814', expiryTime = '10 dakika', ipAddress = '') => \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro - Yönetici Giriş Doğrulama Kodu (2FA)</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 20px 0; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0,0,0,0.3); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 35px 25px; text-align: center; color: #ffffff; }
    .security-badge { display: inline-block; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .content { padding: 35px 30px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; }
    .text { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0; }
    .otp-box { background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 25px; text-align: center; margin: 25px 0; }
    .otp-code { font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #4338ca; font-family: Consolas, 'Courier New', monospace; padding-left: 12px; }
    .expiry { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 10px; }
    .alert-box { background-color: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 8px; padding: 14px 18px; margin: 25px 0; }
    .alert-title { font-size: 12px; font-weight: 800; color: #be123c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .alert-text { font-size: 12px; color: #881337; line-height: 1.5; margin: 0; }
    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #64748b; margin-top: 20px; }
    .footer { background-color: #0f172a; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="security-badge">🛡️ YÖNETİCİ GÜVENLİK PROTOKOLÜ</div>
      <div style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">İSG Pro Yönetim Paneli</div>
      <div style="color: #c7d2fe; font-size: 13px; font-weight: 600; margin-top: 4px;">Çift Aşamalı Doğrulama (2FA) Giriş Onayı</div>
    </div>
    <div class="content">
      <h2 class="title">Sistem Yöneticisi Giriş Onayı</h2>
      <p class="text">
        İSG Pro sisteminde <strong>admin</strong> hesabı için bir oturum açma denemesi yapılmıştır. Hesaba erişim sağlamak için aşağıdaki 6 haneli tek kullanımlık güvenlik kodunu sisteme girmeniz gerekmektedir:
      </p>

      <div class="otp-box">
        <div class="otp-code">\${code}</div>
        <div class="expiry">Bu kod <strong>\${expiryTime}</strong> süresine kadar geçerlidir.</div>
      </div>

      <div class="alert-box">
        <div class="alert-title">⚠️ Kritik Güvenlik Uyarısı</div>
        <p class="alert-text">
          Bu kod girilmeden sisteme <strong>hiçbir koşulda yönetici erişimi verilemez</strong>. Bu giriş denemesini siz gerçekleştirmediyseniz, lütfen derhal yönetici şifrenizi güncelleyiniz.
        </p>
      </div>

      \${ipAddress ? \`
      <div class="meta-box">
        <strong>İstek Bilgileri:</strong> IP: \${ipAddress} | Tarih: \${new Date().toLocaleString('tr-TR')}
      </div>\` : ''}
    </div>
    <div class="footer">
      &copy; \${new Date().getFullYear()} İSG Pro Güvenli Kimlik Doğrulama Sistemi. Bu e-posta gizlidir.
    </div>
  </div>
</body>
</html>
\`;
`;
  emailTemplatesContent += '\n' + templateFunction;
  console.log('✔ getAdmin2FAHtmlTemplate added to emailTemplates.js');
}

// 2. Add admin_2fa to EMAIL_TEMPLATES_CATALOG
if (!emailTemplatesContent.includes("id: 'admin_2fa'")) {
  const catalogEntry = `  {
    id: 'admin_2fa',
    name: 'Yönetici (Admin) 2FA Giriş Doğrulama Kodu',
    category: 'Güvenlik & Yönetici',
    badgeColor: 'bg-purple-100 text-purple-700',
    description: 'Yönetici hesabına giriş yapılırken infoisgpro@gmail.com adresine gönderilen 6 haneli güvenlik doğrulama kodu.',
    defaultSubject: '🔐 592814 - İSG Pro Yönetici (Admin) Çift Aşamalı Giriş Doğrulama Kodu',
    render: (data = {}) => ({
      subject: \`🔐 \${data.code || '592814'} - İSG Pro Yönetici (Admin) Çift Aşamalı Giriş Doğrulama Kodu\`,
      html: getAdmin2FAHtmlTemplate(data.code || '592814', data.time || '10 dakika', data.ip || '192.168.1.100')
    })
  },
`;
  emailTemplatesContent = emailTemplatesContent.replace(
    /export const EMAIL_TEMPLATES_CATALOG = \[\r?\n/,
    `export const EMAIL_TEMPLATES_CATALOG = [\n${catalogEntry}`
  );
  console.log('✔ admin_2fa entry added to EMAIL_TEMPLATES_CATALOG');
}

fs.writeFileSync(emailTemplatesPath, emailTemplatesContent, 'utf8');

console.log('>>> [2/3] Updating App.jsx in isg-projesi - Copy...');
const appJsxPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let appContent = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add admin 2FA states in LoginScreen if not present
if (!appContent.includes('const [admin2FAChallengeId, setAdmin2FAChallengeId] = useState')) {
  const target = /const \[isSending,\s*setIsSending\]\s*=\s*useState\(false\);/;
  if (target.test(appContent)) {
    appContent = appContent.replace(target, `const [isSending, setIsSending] = useState(false);
  const [admin2FAChallengeId, setAdmin2FAChallengeId] = useState('');
  const [admin2FACode, setAdmin2FACode] = useState('');
  const [admin2FACountdown, setAdmin2FACountdown] = useState(600);`);
    console.log('✔ LoginScreen state variables added.');
  }
}

// 2. Add admin_2fa timer effect
if (!appContent.includes("view !== 'admin_2fa'")) {
  const otpTimerTarget = /useEffect\(\(\) => \{\r?\n\s*if \(view !== 'otp'\) return;/;
  if (otpTimerTarget.test(appContent)) {
    appContent = appContent.replace(otpTimerTarget, `useEffect(() => {
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
    if (view !== 'otp') return;`);
    console.log('✔ LoginScreen admin_2fa countdown effect added.');
  }
}

// 3. Update handleLogin in App component for admin fallback override
const oldFallbackRegex = /\/\/ Kesin geçiş garantisi \(Admin Fallback Override\)[\s\S]*?setActiveView\('admin'\);\s*return true;\s*\}/;
const newFallbackCode = `// Kesin geçiş garantisi (Admin Fallback Override with Mandatory 2FA)
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

if (oldFallbackRegex.test(appContent)) {
  appContent = appContent.replace(oldFallbackRegex, newFallbackCode);
  console.log('✔ App handleLogin fallback admin replaced with 2FA enforcement.');
} else {
  console.log('ℹ oldFallbackRegex did not match (might already be patched).');
}

// 4. Update foundUser when foundUser.username === 'admin'
const oldFoundUserRegex = /} else if \(foundUser\.username === 'admin'\) \{\r?\n\s*setActiveView\('admin'\);\r?\n\s*\} else \{/;
const newFoundUserCode = `} else if (foundUser.username === 'admin') {
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

if (oldFoundUserRegex.test(appContent)) {
  appContent = appContent.replace(oldFoundUserRegex, newFoundUserCode);
  console.log('✔ App handleLogin foundUser.username === "admin" replaced with 2FA enforcement.');
} else {
  console.log('ℹ oldFoundUserRegex did not match (might already be patched).');
}

// 5. Ensure pendingAdminLogin state is in App
if (!appContent.includes('const [pendingAdminLogin, setPendingAdminLogin] = useState')) {
  const curUserRegex = /const \[currentUser,\s*setCurrentUser\]\s*=\s*useState\(\(\)\s*=>\s*\{/;
  if (curUserRegex.test(appContent)) {
    appContent = appContent.replace(curUserRegex, `const [pendingAdminLogin, setPendingAdminLogin] = useState(null);\n  const [currentUser, setCurrentUser] = useState(() => {`);
    console.log('✔ App component pendingAdminLogin state added.');
  }
}

// 6. Ensure handleConfirmAdminLogin is in App
if (!appContent.includes('const handleConfirmAdminLogin =')) {
  const handleLoginTarget = /const handleLogin = async \(username, password\) => \{/;
  if (handleLoginTarget.test(appContent)) {
    const confirmFunc = `const handleConfirmAdminLogin = async () => {
    if (!pendingAdminLogin) return;
    const adminUser = pendingAdminLogin;
    setCurrentUser(adminUser);
    try {
      localStorage.setItem('currentUser', JSON.stringify(encryptUser(adminUser)));
      localStorage.setItem('user', JSON.stringify(encryptUser(adminUser)));
    } catch (e) {}
    setActiveView('admin');
    setPendingAdminLogin(null);
  };\n\n  `;
    appContent = appContent.replace(handleLoginTarget, confirmFunc + 'const handleLogin = async (username, password) => {');
    console.log('✔ handleConfirmAdminLogin function added to App.');
  }
}

// 7. Ensure onConfirmAdminLogin is passed to LoginScreen
const loginScreenNoProp = /<LoginScreen onLogin=\{handleLogin\} onRegister=\{handleRegister\} onResetPassword=\{handleResetPassword\} checkUserExists=\{checkUserExists\} theme=\{theme\} toggleTheme=\{toggleTheme\}\s*\/>/;
if (loginScreenNoProp.test(appContent)) {
  appContent = appContent.replace(loginScreenNoProp, `<LoginScreen onLogin={handleLogin} onRegister={handleRegister} onResetPassword={handleResetPassword} checkUserExists={checkUserExists} theme={theme} toggleTheme={toggleTheme} onConfirmAdminLogin={handleConfirmAdminLogin} />`);
  console.log('✔ onConfirmAdminLogin prop passed to LoginScreen.');
}

fs.writeFileSync(appJsxPath, appContent, 'utf8');
console.log('✔ isg-projesi - Copy files updated successfully.');
