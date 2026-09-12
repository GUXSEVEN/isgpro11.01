const fs = require('fs');
const path = require('path');

const panelDir = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy';
const modalPath = path.join(panelDir, 'src', 'components', 'modals', 'EmailVerificationModal.jsx');
const appPath = path.join(panelDir, 'src', 'App.jsx');

console.log('>>> Starting Panel Email Limit & Verification Patch...');

function patchFile(filePath, searchStr, replaceStr, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const isCRLF = content.includes('\r\n');
  const normSearch = isCRLF ? searchStr.replace(/\r?\n/g, '\r\n') : searchStr.replace(/\r?\n/g, '\n');
  const normReplace = isCRLF ? replaceStr.replace(/\r?\n/g, '\r\n') : replaceStr.replace(/\r?\n/g, '\n');

  if (content.includes(normReplace)) {
    console.log(`ALREADY PATCHED: [${label}]`);
    return;
  }

  if (!content.includes(normSearch)) {
    console.error(`ERROR: Could not find target string for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`SUCCESS: Patched [${label}]`);
}

// 2b. Patch handleRegister in App.jsx
const searchHandleRegister = `    if (!emailRegex.test(newUser.email.trim())) {
      return { success: false, reason: 'invalid_email', message: 'Geçersiz e-posta adresi.' };
    }`;

const replaceHandleRegister = `    if (!emailRegex.test(newUser.email.trim())) {
      return { success: false, reason: 'invalid_email', message: 'Geçersiz e-posta adresi.' };
    }

    // 0. E-posta Yıllık En Fazla 2 Doğrulanmış Hesap Kontrolü (Veritabanından)
    try {
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
      const candidateUrls = isLocal ? ['', 'http://localhost:5001', 'http://127.0.0.1:5001'] : [''];
      for (const base of candidateUrls) {
        try {
          const res = await fetch(\`\${base}/api/check-email-account-limit\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newUser.email.trim(), username: newUser.username })
          });
          if (res.ok) {
            const limData = await res.json();
            if (limData.allowed === false) {
              return {
                success: false,
                reason: 'email_limit_exceeded',
                message: limData.message || 'Bu e-posta adresine bağlı son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.'
              };
            }
            break;
          }
        } catch (_) {}
      }
    } catch (limErr) {
      console.warn('Register email limit check warning:', limErr);
    }`;

patchFile(appPath, searchHandleRegister, replaceHandleRegister, 'Panel App.jsx: handleRegister Limit Check');

console.log('🎉 Panel Email Limit & Verification Patch completed successfully!');
