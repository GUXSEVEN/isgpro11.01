/**
 * patch-panel-appscript-and-2fa.cjs
 * Integrates Google Apps Script email delivery, configuration, and fail-safe 2FA
 * into the Panel application (isg-projesi - Copy).
 */

const fs = require('fs');
const path = require('path');

const panelRoot = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy';
if (!fs.existsSync(panelRoot)) {
  console.error('Panel directory not found:', panelRoot);
  process.exit(1);
}

console.log('>>> [1/3] Patching UserSettingsModal.jsx for Google Apps Script settings...');
const userSettingsPath = path.join(panelRoot, 'src/components/modals/UserSettingsModal.jsx');
if (fs.existsSync(userSettingsPath)) {
  let usContent = fs.readFileSync(userSettingsPath, 'utf8');

  // 1. Ensure useEffect and getDoc are imported
  if (!usContent.includes('useEffect')) {
    usContent = usContent.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
  }
  if (!usContent.includes('getDoc')) {
    usContent = usContent.replace("import { doc, setDoc, getFirestore } from 'firebase/firestore';", "import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';");
  }

  // 2. Add googleScriptUrl to initial state
  if (!usContent.includes('googleScriptUrl:')) {
    usContent = usContent.replace("webhookUrl: ''", "webhookUrl: '',\n      googleScriptUrl: ''");
  }

  // 3. Add useEffect to load googleScriptUrl from Firestore smtp_config/default
  if (!usContent.includes('// Load system-wide Google Apps Script')) {
    const loadGlobalEffect = `
  // Load system-wide Google Apps Script config from Firestore
  useEffect(() => {
    const loadSystemSmtp = async () => {
      try {
        const db = getFirestore();
        if (db) {
          const snap = await getDoc(doc(db, 'smtp_config', 'default'));
          if (snap.exists() && snap.data().googleScriptUrl) {
            setSmtpForm(prev => ({
              ...prev,
              googleScriptUrl: prev.googleScriptUrl || snap.data().googleScriptUrl
            }));
          }
        }
      } catch (err) {
        console.warn('Could not read global smtp_config:', err);
      }
    };
    loadSystemSmtp();
  }, []);
`;
    usContent = usContent.replace('const handleSaveProfile = async (e) => {', loadGlobalEffect + '\n  const handleSaveProfile = async (e) => {');
  }

  // 4. In handleSaveSmtp: save googleScriptUrl to smtp_config/default if admin
  if (!usContent.includes("doc(db, 'smtp_config', 'default')")) {
    const saveGlobalSnippet = `
      if (db && (currentUser?.username === 'admin' || currentUser?.role === 'admin' || profileForm.role === 'admin')) {
        try {
          await setDoc(doc(db, 'smtp_config', 'default'), {
            googleScriptUrl: (smtpForm.googleScriptUrl || '').trim(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log('[Firestore] Updated global smtp_config/default with googleScriptUrl');
        } catch (e) {
          console.warn('Error saving global smtp_config:', e);
        }
      }`;
    usContent = usContent.replace("await setDoc(doc(db, 'user_smtp_configs', String(targetUsername)), encryptedSmtp, { merge: true });", "await setDoc(doc(db, 'user_smtp_configs', String(targetUsername)), encryptedSmtp, { merge: true });" + saveGlobalSnippet);
  }

  // 5. In handleTestEmail: support Google Apps Script dispatch
  if (!usContent.includes("if (smtpForm.googleScriptUrl && smtpForm.googleScriptUrl.startsWith('https://'))")) {
    const testScriptDispatch = `
    if (smtpForm.googleScriptUrl && smtpForm.googleScriptUrl.startsWith('https://')) {
      try {
        await fetch(smtpForm.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            recipient: targetEmail,
            subject: subject,
            html: \`<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-top: 0;">🚀 İSG Pro - Google Apps Script Entegrasyonu Doğrulandı</h2>
              <p>Tebrikler! Panel üzerinden gönderilen test e-postası Google Apps Script webhook'u ile <strong>Port 443 HTTPS</strong> üzerinden iletildi.</p>
              <pre style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 11px; border: 1px solid #e2e8f0;">\${bodyText}</pre>
            </div>\`,
            fromName: senderName || 'İSG Pro'
          })
        });
      } catch (gErr) {
        console.warn('Google Apps Script test exception:', gErr);
      }
    }
`;
    usContent = usContent.replace("await fetch(\"https://api.web3forms.com/submit\", { method: \"POST\", body: formData });", "await fetch(\"https://api.web3forms.com/submit\", { method: \"POST\", body: formData });" + testScriptDispatch);
  }

  // 6. In UI: Add Google Apps Script Webhook section
  if (!usContent.includes('Google Apps Script Webhook URL')) {
    const uiAppsScriptSection = `
              {/* GOOGLE APPS SCRIPT WEBHOOK ENTEGRASYONU (PORT 443 HTTPS) */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Globe size={14} /> 🔗 Google Apps Script Webhook URL (Port 443 HTTPS)
                  </span>
                  <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    ⭐ Kesintisiz E-Posta
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Gmail klasik SMTP portları engellendiğinde veya admin 2FA doğrulama kodlarının kesintisiz gelmesi için Google Apps Script Webhook URL'inizi buraya giriniz.
                </p>
                <input
                  type="text"
                  value={smtpForm.googleScriptUrl || ''}
                  onChange={e => setSmtpForm({ ...smtpForm, googleScriptUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
`;
    usContent = usContent.replace('{/* OPSİYONEL: EMAILJS / WEBHOOK API GÖNDERİM AYARI */}', uiAppsScriptSection + '\n              {/* OPSİYONEL: EMAILJS / WEBHOOK API GÖNDERİM AYARI */}');
  }

  fs.writeFileSync(userSettingsPath, usContent, 'utf8');
  console.log('✔ UserSettingsModal.jsx updated successfully.');
}

console.log('>>> [2/3] Patching EmailVerificationModal.jsx for Google Apps Script direct fallback...');
const emailModalPath = path.join(panelRoot, 'src/components/modals/EmailVerificationModal.jsx');
if (fs.existsSync(emailModalPath)) {
  let emContent = fs.readFileSync(emailModalPath, 'utf8');

  // Add getDoc to firebase/firestore import if missing
  if (!emContent.includes('getDoc')) {
    emContent = emContent.replace("import { doc, setDoc, getFirestore } from 'firebase/firestore';", "import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';");
  }

  // Add Google Apps Script fallback in handleSendCode
  if (!emContent.includes('Direct Apps Script dispatch fallback for OTP')) {
    const fallbackSnippet = `
      // Direct Apps Script dispatch fallback for OTP if local API is unreachable
      if (!sent && !limitBlocked) {
        try {
          const db = getFirestore();
          let scriptUrl = '';
          if (db) {
            const snap = await getDoc(doc(db, 'smtp_config', 'default'));
            if (snap.exists() && snap.data().googleScriptUrl) {
              scriptUrl = snap.data().googleScriptUrl;
            }
          }
          if (scriptUrl && scriptUrl.startsWith('https://')) {
            const expTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const htmlBody = \`<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-top: 0;">İSG Pro E-Posta Güvenlik Doğrulama</h2>
              <p>Sayın <strong>\${currentUser?.name || currentUser?.username || 'Kullanıcı'}</strong>,</p>
              <p>Hesabınızı güvenle doğrulamak için 6 haneli tek kullanımlık güvenlik kodunuz:</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4338ca; background: #eef2ff; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px dashed #6366f1;">\${newCode}</div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Bu kod \${expTime} saatine kadar (15 dakika) geçerlidir.</p>
            </div>\`;

            await fetch(scriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: emailToSend,
                recipient: emailToSend,
                subject: \`\${newCode} - İSG Pro Güvenlik ve Doğrulama Kodunuz\`,
                html: htmlBody,
                fromName: 'İSG Pro Güvenlik'
              })
            });
            sent = true;
          }
        } catch (gasErr) {
          console.warn('Apps Script direct OTP error:', gasErr);
        }
      }
`;
    emContent = emContent.replace('setIsLoading(false);', fallbackSnippet + '\n      setIsLoading(false);');
    fs.writeFileSync(emailModalPath, emContent, 'utf8');
    console.log('✔ EmailVerificationModal.jsx updated with Google Apps Script fallback.');
  }
}

console.log('>>> [3/3] Patching App.jsx for fail-safe Admin 2FA with Google Apps Script direct browser fallback...');
const appJsxPath = path.join(panelRoot, 'src/App.jsx');
if (fs.existsSync(appJsxPath)) {
  let appContent = fs.readFileSync(appJsxPath, 'utf8');

  // Enhance handleResendAdmin2FACode to fallback to direct Google Apps Script
  if (!appContent.includes('// Fail-safe Google Apps Script fallback for Admin 2FA')) {
    const enhanced2FADispatch = `
  // Fail-safe Google Apps Script fallback for Admin 2FA
  const dispatchAdmin2FACodeFallback = async () => {
    const adminEmail = 'infoisgpro@gmail.com';
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = 'client_' + fallbackCode + '_' + Date.now();
    try {
      const db = getFirestore();
      let scriptUrl = '';
      if (db) {
        const snap = await getDoc(doc(db, 'smtp_config', 'default'));
        if (snap.exists() && snap.data().googleScriptUrl) {
          scriptUrl = snap.data().googleScriptUrl;
        }
      }
      if (scriptUrl && scriptUrl.startsWith('https://')) {
        const expTime = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            to: adminEmail,
            recipient: adminEmail,
            email: adminEmail,
            subject: \`🔐 \${fallbackCode} - İSG Pro Yönetici (Admin) Çift Aşamalı Giriş Doğrulama Kodu\`,
            html: \`<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-top: 0;">🛡️ Yönetici Giriş Güvenlik Onayı (2FA)</h2>
              <p>İSG Pro sisteminde <strong>admin</strong> hesabı için bir oturum açma denemesi yapılmıştır. Giriş yapmak için tek kullanımlık güvenlik kodunuz:</p>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #4338ca; background: #eef2ff; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px dashed #6366f1;">\${fallbackCode}</div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Bu kod \${expTime} saatine kadar geçerlidir.</p>
            </div>\`,
            fromName: 'İSG Pro Güvenlik'
          })
        });
        const resText = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(resText); } catch (_) {}
        if (res.ok && (!parsed || parsed.success !== false)) {
          sessionStorage.setItem('pending_admin_2fa_code', fallbackCode);
          sessionStorage.setItem('pending_admin_2fa_challenge', challengeId);
          return { success: true, challengeId };
        } else {
          console.warn('[Fallback 2FA Warning]: Apps Script error:', resText);
        }
      }
    } catch (e) {
      console.warn('Fallback 2FA dispatch error:', e);
    }
    return null;
  };
`;

    // Insert dispatchAdmin2FACodeFallback before LoginScreen
    appContent = appContent.replace('function LoginScreen(', enhanced2FADispatch + '\nfunction LoginScreen(');

    // Update handleVerifyAdmin2FA in LoginScreen to handle client_ challengeId
    const clientVerifySnippet = `
    const storedClientCode = sessionStorage.getItem('pending_admin_2fa_code');
    if (admin2FAChallengeId && admin2FAChallengeId.startsWith('client_') && storedClientCode) {
      if (cleanCode === storedClientCode) {
        sessionStorage.removeItem('pending_admin_2fa_code');
        sessionStorage.removeItem('pending_admin_2fa_challenge');
        if (typeof onConfirmAdminLogin === 'function') {
          await onConfirmAdminLogin();
        }
        setIsSending(false);
        return;
      } else {
        setMsg({ type: 'error', text: 'Girdiğiniz 6 haneli güvenlik kodu hatalı.' });
        setIsSending(false);
        return;
      }
    }
`;
    appContent = appContent.replace('const handleVerifyAdmin2FA = async (e) => {\n    e.preventDefault();\n    const cleanCode = (admin2FACode || \'\').trim().replace(/\\s+/g, \'\');', 'const handleVerifyAdmin2FA = async (e) => {\n    e.preventDefault();\n    const cleanCode = (admin2FACode || \'\').trim().replace(/\\s+/g, \'\');' + clientVerifySnippet);

    // Update handleResendAdmin2FACode in LoginScreen to fallback
    const resendWithFallback = `  const handleResendAdmin2FACode = async () => {
    setIsSending(true);
    setMsg({ type: '', text: '' });
    try {
      let sentChallengeId = '';
      try {
        const res = await fetch('/api/auth/admin-2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.challengeId) {
          sentChallengeId = data.challengeId;
        }
      } catch (_) {}

      if (!sentChallengeId) {
        const fallbackRes = await dispatchAdmin2FACodeFallback();
        if (fallbackRes && fallbackRes.challengeId) {
          sentChallengeId = fallbackRes.challengeId;
        }
      }

      if (sentChallengeId) {
        setAdmin2FAChallengeId(sentChallengeId);
        setAdmin2FACountdown(600);
        setMsg({ type: 'success', text: 'Yeni 6 haneli güvenlik kodu infoisgpro@gmail.com adresine gönderildi.' });
      } else {
        setMsg({ type: 'error', text: 'Doğrulama kodu gönderilemedi. Lütfen bağlantınızı kontrol ediniz.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Kod gönderilirken bir hata oluştu.' });
    } finally {
      setIsSending(false);
    }
  };`;

    appContent = appContent.replace(/const handleResendAdmin2FACode = async \(\) => \{[\s\S]*?setIsSending\(false\);\s*\};/, resendWithFallback);

    // Also update onLogin admin fallback to use dispatchAdmin2FACodeFallback if server is offline
    const adminLoginTryCatch = `      setPendingAdminLogin(adminUser);
      try {
        let challenge = '';
        try {
          const res = await fetch('/api/auth/admin-2fa/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.success && data.challengeId) {
            challenge = data.challengeId;
          }
        } catch (_) {}

        if (!challenge) {
          const fallback = await dispatchAdmin2FACodeFallback();
          if (fallback && fallback.challengeId) {
            challenge = fallback.challengeId;
          }
        }

        if (challenge) {
          return { requires2FA: true, challengeId: challenge };
        } else {
          throw new Error('Admin 2FA kodu gönderilemedi. Lütfen internet bağlantınızı ve Google Apps Script ayarınızı kontrol ediniz.');
        }
      } catch (err) {
        console.error('2FA send error:', err);
        throw err;
      }`;

    appContent = appContent.replace(/setPendingAdminLogin\(adminUser\);[\s\S]*?throw err;\s*\}/, adminLoginTryCatch);

    fs.writeFileSync(appJsxPath, appContent, 'utf8');
    console.log('✔ App.jsx updated with fail-safe Google Apps Script 2FA dispatch.');
  }
}

console.log('>>> ALL PANEL PATCHES APPLIED SUCCESSFULLY!');
