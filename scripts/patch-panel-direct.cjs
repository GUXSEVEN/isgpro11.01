const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';
if (!fs.existsSync(targetFile)) {
  console.log('Target file not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Replace the fetch call in dispatchAdmin2FACodeFallback
const oldSnippet = `        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            recipient: adminEmail,`;

const newSnippet = `        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            to: adminEmail,
            recipient: adminEmail,
            email: adminEmail,`;

if (content.includes(oldSnippet)) {
  content = content.replace(oldSnippet, newSnippet);
  // Also handle response check
  const oldRespCheck = `        sessionStorage.setItem('pending_admin_2fa_code', fallbackCode);
        sessionStorage.setItem('pending_admin_2fa_challenge', challengeId);
        return { success: true, challengeId };`;

  const newRespCheck = `        const resText = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(resText); } catch (_) {}
        if (res.ok && (!parsed || parsed.success !== false)) {
          sessionStorage.setItem('pending_admin_2fa_code', fallbackCode);
          sessionStorage.setItem('pending_admin_2fa_challenge', challengeId);
          return { success: true, challengeId };
        } else {
          console.warn('[Fallback 2FA Warning]: Apps Script error:', resText);
        }`;

  if (content.includes(oldRespCheck)) {
    content = content.replace(oldRespCheck, newRespCheck);
  }

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✔ Successfully patched App.jsx with CORS-safe text/plain Apps Script dispatch!');
} else {
  console.log('Old snippet not found or already patched.');
}
