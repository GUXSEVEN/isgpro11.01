const fs = require('fs');
const path = require('path');

console.log('>>> [1/2] Patching ISGDashboard.jsx in isg-projesi - Copy...');
const isgDashboardPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/dashboard/ISGDashboard.jsx';

if (!fs.existsSync(isgDashboardPath)) {
  console.error('File not found:', isgDashboardPath);
  process.exit(1);
}

let isgDashboardContent = fs.readFileSync(isgDashboardPath, 'utf8');

// 1. Add verifyStartInChangeMode state if not present
if (!isgDashboardContent.includes('verifyStartInChangeMode')) {
  isgDashboardContent = isgDashboardContent.replace(
    'const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);',
    `const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);\n  const [verifyStartInChangeMode, setVerifyStartInChangeMode] = useState(false);`
  );
  console.log('✔ verifyStartInChangeMode state added to ISGDashboard.jsx');
}

// 2. Add onUpdateUser prop to ISGDashboard signature if not present
if (isgDashboardContent.includes('export default function ISGDashboard({ companies = [], currentUser, onSelectCompany, onVerifyEmail }) {')) {
  isgDashboardContent = isgDashboardContent.replace(
    'export default function ISGDashboard({ companies = [], currentUser, onSelectCompany, onVerifyEmail }) {',
    'export default function ISGDashboard({ companies = [], currentUser, onSelectCompany, onVerifyEmail, onUpdateUser }) {'
  );
  console.log('✔ onUpdateUser prop added to ISGDashboard declaration');
}

// 3. Update Email banner title and description for accounts without email
if (isgDashboardContent.includes('<h4 className="font-extrabold text-sm text-slate-900 dark:text-amber-300">\n                  E-Posta Adresiniz Henüz Doğrulanmadı\n                </h4>')) {
  isgDashboardContent = isgDashboardContent.replace(
    '<h4 className="font-extrabold text-sm text-slate-900 dark:text-amber-300">\n                  E-Posta Adresiniz Henüz Doğrulanmadı\n                </h4>',
    `<h4 className="font-extrabold text-sm text-slate-900 dark:text-amber-300">
                  {currentUser.email ? 'E-Posta Adresiniz Henüz Doğrulanmadı' : 'E-Posta Adresiniz Tanımlı Değil'}
                </h4>`
  );
}

const descOld = `<p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Kayıtlı e-posta adresiniz: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{currentUser.email}</strong>. Resmi bildirimlerin ve sözleşmelerin tarafınıza güvenle ulaşabilmesi için lütfen e-postanızı doğrulayınız.
              </p>`;

const descNew = `<p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {currentUser.email ? (
                  <>Kayıtlı e-posta adresiniz: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{currentUser.email}</strong>. Resmi bildirimlerin ve sözleşmelerin tarafınıza güvenle ulaşabilmesi için lütfen e-postanızı doğrulayınız.</>
                ) : (
                  <>Hesabınızda kayıtlı bir e-posta adresi bulunmuyor. Doğrulama kodu alabilmek ve hesap güvenliğinizi sağlamak için lütfen geçerli bir e-posta tanımlayınız.</>
                )}
              </p>`;

if (isgDashboardContent.includes(descOld)) {
  isgDashboardContent = isgDashboardContent.replace(descOld, descNew);
  console.log('✔ Email banner text updated for missing/present email');
}

// 4. Update the buttons in the banner to have BOTH "E-Postayı Doğrula" and "E-Postayı Değiştir ve Doğrula"
const oldSingleBtnRegex = /<button\s+type="button"\s+onClick=\{\(\)\s*=>\s*setShowEmailVerifyModal\(true\)\}\s+className="px-5 py-2\.5 bg-amber-500[\s\S]*?<span>E-Postayı Doğrula<\/span>\s*<\/button>/;

const newButtons = `<div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setVerifyStartInChangeMode(false);
                setShowEmailVerifyModal(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>E-Postayı Doğrula</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVerifyStartInChangeMode(true);
                setShowEmailVerifyModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Mail size={15} />
              <span>E-Postayı Değiştir ve Doğrula</span>
            </button>
          </div>`;

if (oldSingleBtnRegex.test(isgDashboardContent)) {
  isgDashboardContent = isgDashboardContent.replace(oldSingleBtnRegex, newButtons);
  console.log('✔ Side-by-side buttons added to ISGDashboard.jsx');
} else if (isgDashboardContent.includes('E-Postayı Değiştir ve Doğrula')) {
  console.log('ℹ Buttons already updated in ISGDashboard.jsx');
}

// 5. Update EmailVerificationModal component invocation in ISGDashboard.jsx
const modalUsageRegex = /<EmailVerificationModal\s+isOpen=\{showEmailVerifyModal\}\s+onClose=\{\(\)\s*=>\s*setShowEmailVerifyModal\(false\)\}\s+currentUser=\{currentUser\}\s+onVerified=\{[\s\S]*?\}\s*\/>/;

const newModalUsage = `<EmailVerificationModal
          isOpen={showEmailVerifyModal}
          onClose={() => setShowEmailVerifyModal(false)}
          currentUser={currentUser}
          startInChangeMode={verifyStartInChangeMode}
          onUpdateEmail={async (newEmail) => {
            if (currentUser) {
              currentUser.email = newEmail;
            }
            if (typeof onUpdateUser === 'function') {
              onUpdateUser(currentUser?.username, { ...currentUser, email: newEmail });
            }
          }}
          onVerified={() => {
            if (currentUser) {
              currentUser.isEmailVerified = true;
              currentUser.emailVerifiedAt = new Date().toISOString();
            }
            if (typeof onUpdateUser === 'function') {
              onUpdateUser(currentUser?.username, {
                ...currentUser,
                isEmailVerified: true,
                emailVerifiedAt: new Date().toISOString()
              });
            }
            if (onVerifyEmail) {
              onVerifyEmail();
            }
          }}
        />`;

if (modalUsageRegex.test(isgDashboardContent)) {
  isgDashboardContent = isgDashboardContent.replace(modalUsageRegex, newModalUsage);
  console.log('✔ EmailVerificationModal usage updated with startInChangeMode and onUpdateEmail');
}

fs.writeFileSync(isgDashboardPath, isgDashboardContent, 'utf8');
console.log('✔ ISGDashboard.jsx successfully saved.');

// =========================================================================
// [2/2] Updating EmailVerificationModal.jsx in isg-projesi - Copy
// =========================================================================
console.log('>>> [2/2] Updating EmailVerificationModal.jsx in isg-projesi - Copy...');
const modalPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/modals/EmailVerificationModal.jsx';

const fullModalCode = `import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, X, ArrowRight, RefreshCw, Sparkles, Send } from 'lucide-react';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { encryptUser } from '../../utils/securityUtils';

const isValidEmailAddress = (emailStr) => {
  if (!emailStr) return false;
  const trimmed = String(emailStr).trim();
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(trimmed);
};

export default function EmailVerificationModal({
  isOpen,
  onClose,
  currentUser,
  onVerified,
  onUpdateEmail,
  startInChangeMode = false
}) {
  const initialEmail = (currentUser?.email || '').trim();
  const hasValidEmail = isValidEmailAddress(initialEmail);

  const [step, setStep] = useState(() => {
    if (startInChangeMode) return 'define_email';
    return hasValidEmail ? 'send' : 'define_email';
  });

  const [targetEmail, setTargetEmail] = useState(initialEmail);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(900); // 15 dakika
  const [limitStatus, setLimitStatus] = useState({ checked: false, allowed: true, count: 0, limit: 2, message: '' });

  useEffect(() => {
    if (!isOpen) return;
    const curEmail = (currentUser?.email || '').trim();
    const valid = isValidEmailAddress(curEmail);
    setTargetEmail(curEmail);
    setEmailInput(curEmail);
    setErrorMsg('');
    setOtpCode('');
    if (startInChangeMode || !valid) {
      setStep('define_email');
    } else {
      setStep('send');
    }
  }, [isOpen, startInChangeMode, currentUser?.email]);

  useEffect(() => {
    if (step !== 'verify') return;
    setCountdown(900);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Modal açıldığında yıllık 2 doğrulanmış hesap limitini sorgula
  useEffect(() => {
    if (!isOpen) return;
    const queryEmail = (step === 'define_email' ? emailInput : targetEmail) || currentUser?.email;
    if (!queryEmail || !queryEmail.includes('@')) return;

    const checkLimit = async () => {
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
              body: JSON.stringify({ email: queryEmail, username: currentUser?.username })
            });
            if (res.ok) {
              const data = await res.json();
              setLimitStatus({
                checked: true,
                allowed: data.allowed !== false,
                count: data.count || 0,
                limit: data.limit || 2,
                message: data.message || ''
              });
              if (data.allowed === false) {
                setErrorMsg(data.message || 'Bu e-posta adresine bağlı son 1 yılda en fazla 2 doğrulanmış hesap açılabilir.');
              }
              break;
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Panel limit check error:', err);
      }
    };
    checkLimit();
  }, [isOpen, targetEmail, currentUser?.username]);

  if (!isOpen) return null;

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
  };

  // 1. E-Postayı Değiştirme ve Otomatik Kod Gönderme
  const handleSaveAndSendEmail = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!isValidEmailAddress(cleanEmail)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz (örn: ad.soyad@ornek.com).');
      return;
    }

    setIsSavingEmail(true);
    setIsLoading(true);
    setErrorMsg('');

    try {
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
      const candidateUrls = isLocal ? ['', 'http://localhost:5001', 'http://127.0.0.1:5001'] : [''];

      // Yıllık 2 hesap limit kontrolü
      let allowed = true;
      let limitMsg = '';
      for (const base of candidateUrls) {
        try {
          const res = await fetch(\`\${base}/api/check-email-account-limit\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, username: currentUser?.username })
          });
          if (res.ok) {
            const data = await res.json();
            setLimitStatus({
              checked: true,
              allowed: data.allowed !== false,
              count: data.count || 0,
              limit: data.limit || 2,
              message: data.message || ''
            });
            if (data.allowed === false) {
              allowed = false;
              limitMsg = data.message;
            }
            break;
          }
        } catch (_) {}
      }

      if (!allowed) {
        setErrorMsg(limitMsg || 'Bu e-posta adresine bağlı son 1 yılda en fazla 2 doğrulanmış hesap açılabilir.');
        setIsSavingEmail(false);
        setIsLoading(false);
        return;
      }

      // currentUser ve LocalStorage güncelle
      if (currentUser) {
        currentUser.email = cleanEmail;
      }
      try {
        ['isg_user', 'currentUser'].forEach(key => {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.email = cleanEmail;
              localStorage.setItem(key, JSON.stringify(parsed));
            } catch (_) {}
          }
        });
      } catch (_) {}

      // Firestore güncelle
      try {
        const db = getFirestore();
        const targetUsername = currentUser?.username;
        if (db && targetUsername) {
          await setDoc(doc(db, 'users', String(targetUsername)), encryptUser({ ...currentUser, email: cleanEmail }), { merge: true });
        }
      } catch (fErr) {
        console.warn('Firestore update in modal warning:', fErr);
      }

      // onUpdateEmail callback
      if (onUpdateEmail) {
        await onUpdateEmail(cleanEmail);
      }

      // Backend sync çağrısı
      for (const base of candidateUrls) {
        try {
          await fetch(\`\${base}/api/sync-user\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...currentUser, email: cleanEmail })
          });
          break;
        } catch (_) {}
      }

      setTargetEmail(cleanEmail);
      setIsSavingEmail(false);

      // Yeni e-postaya 6 haneli doğrulama kodu gönder
      await handleSendCode(cleanEmail);
    } catch (err) {
      console.error(err);
      setIsSavingEmail(false);
      setIsLoading(false);
      setErrorMsg('E-posta adresi kaydedilirken bir hata meydana geldi.');
    }
  };

  // 2. Doğrulama Kodu Gönderme
  const handleSendCode = async (overrideEmail = null) => {
    const emailToSend = (overrideEmail || targetEmail || '').trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      setErrorMsg('Geçerli bir e-posta adresi bulunamadı.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    if (limitStatus.checked && !limitStatus.allowed) {
      setErrorMsg(limitStatus.message || 'Yıllık en fazla 2 doğrulanmış hesap sınırına ulaşıldı.');
      setIsLoading(false);
      return;
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);

    try {
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
      const candidateUrls = isLocal
        ? ['', 'http://localhost:5001', 'http://127.0.0.1:5001']
        : [''];

      let sent = false;
      let limitBlocked = false;
      for (const base of candidateUrls) {
        try {
          const res = await fetch(\`\${base}/api/send-email-otp\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailToSend,
              code: newCode,
              name: currentUser?.name || currentUser?.username,
              username: currentUser?.username
            })
          });

          if (res.status === 403) {
            const errData = await res.json().catch(() => ({}));
            setErrorMsg(errData.error || 'Bu e-posta adresine bağlı son 1 yılda en fazla 2 doğrulanmış hesap açılabilir.');
            setLimitStatus(prev => ({ ...prev, allowed: false, message: errData.error }));
            limitBlocked = true;
            break;
          }

          if (res.ok) {
            sent = true;
            break;
          }
        } catch {}
      }

      setIsLoading(false);
      if (sent) {
        setStep('verify');
      } else if (!limitBlocked) {
        setErrorMsg('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setIsLoading(false);
      setErrorMsg('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  // 3. Kodu Doğrulama
  const handleVerifyCode = async () => {
    if (!otpCode.trim()) {
      setErrorMsg('Lütfen 6 haneli doğrulama kodunu giriniz.');
      return;
    }

    if (otpCode.trim() !== generatedCode.trim()) {
      setErrorMsg('Girdiğiniz doğrulama kodu hatalı. Lütfen kontrol ediniz.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const finalEmail = (targetEmail || currentUser?.email || '').trim();

    // 1. currentUser ve localStorage güncelle
    if (currentUser) {
      currentUser.isEmailVerified = true;
      currentUser.emailVerifiedAt = new Date().toISOString();
      if (finalEmail) currentUser.email = finalEmail;
    }

    try {
      ['isg_user', 'currentUser'].forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.isEmailVerified = true;
            parsed.emailVerifiedAt = new Date().toISOString();
            if (finalEmail) parsed.email = finalEmail;
            localStorage.setItem(key, JSON.stringify(parsed));
          } catch (_) {}
        }
      });
    } catch (_) {}

    // 2. Firestore güncelle
    try {
      const db = getFirestore();
      const targetUsername = currentUser?.username;
      if (db && targetUsername) {
        await setDoc(doc(db, 'users', String(targetUsername)), encryptUser({
          ...currentUser,
          email: finalEmail,
          isEmailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        }), { merge: true });
      }
    } catch (fErr) {
      console.warn('Firestore verify update warning:', fErr);
    }

    // 3. Başarı e-postası tetikle
    try {
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
      const candidateUrls = isLocal
        ? ['', 'http://localhost:5001', 'http://127.0.0.1:5001']
        : [''];

      for (const base of candidateUrls) {
        try {
          await fetch(\`\${base}/api/send-email-verified-success\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: finalEmail,
              name: currentUser?.name || currentUser?.username,
              username: currentUser?.username
            })
          });
          break;
        } catch {}
      }
    } catch (err) {
      console.warn('Başarı maili uyarısı:', err);
    }

    setIsLoading(false);
    setStep('success');

    if (onVerified) {
      onVerified();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Modal Başlığı */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {step === 'define_email' ? 'E-Postayı Değiştir ve Doğrula' : 'E-Posta Adresi Doğrulama'}
              </h3>
              <p className="text-[11px] text-blue-200/80">Hesap Güvenliği & Bildirim Onayı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal İçeriği */}
        <div className="p-6 space-y-4 text-xs">
          {/* Yıllık Doğrulanmış Hesap Kuralı Bilgilendirme Kartı */}
          <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-900 dark:text-blue-200 flex items-start gap-2.5 text-xs">
            <ShieldCheck size={16} className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-extrabold text-blue-950 dark:text-blue-100 block">
                Hesap Güvenliği & Doğrulama Kuralı
              </span>
              <p className="text-[11px] text-blue-800/90 dark:text-blue-300">
                Platform kuralları gereğince; <strong>bir e-posta adresine bağlı olarak yılda en fazla 2 adet doğrulanmış hesap</strong> açılabilmektedir.
              </p>
            </div>
          </div>

          {!limitStatus.allowed && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2 text-xs">
              <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-950 dark:text-amber-100 block">
                  Yıllık Hesap Kotası Doldu ({limitStatus.count}/{limitStatus.limit})
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  {limitStatus.message || 'Bu e-posta adresine bağlı son 1 yılda en fazla 2 doğrulanmış hesap açılabilir.'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2 font-bold">
              <AlertTriangle size={15} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ADIM 0: E-POSTA ADRESİNİ DEĞİŞTİR / TANIMLA */}
          {step === 'define_email' && (
            <form onSubmit={handleSaveAndSendEmail} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {targetEmail ? 'E-Posta Adresini Değiştir ve Doğrula' : 'E-Posta Adresi Tanımla'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Doğrulama kodunun gönderileceği ve resmi bildirimleri alacağınız geçerli e-posta adresinizi giriniz:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Geçerli E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="ornek@alanadi.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingEmail || isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {isSavingEmail || isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Kaydediliyor & Kod Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Kaydet ve Doğrulama Kodu Gönder</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {hasValidEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput(targetEmail);
                      setStep('send');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-1 cursor-pointer transition"
                  >
                    Vazgeç, mevcut e-postayı doğrula ({targetEmail})
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ADIM 1: MEVCUT E-POSTAYA KOD GÖNDER */}
          {step === 'send' && (
            <div className="space-y-4 text-center">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Hesabınızın güvenliği ve yasal sözleşme bildirimlerinin tarafınıza iletilebilmesi için aşağıdaki kayıtlı e-posta adresinizi doğrulayınız:
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 select-all">
                {targetEmail}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSendCode(targetEmail)}
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Kod Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Doğrulama Kodu Gönder</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('define_email')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center justify-center gap-1 cursor-pointer py-1"
                >
                  <Mail size={12} />
                  <span>E-Posta Adresini Değiştir ve Doğrula</span>
                </button>
              </div>
            </div>
          )}

          {/* ADIM 2: 6 HANELİ DOĞRULAMA KODUNU GİR */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  <strong>{targetEmail}</strong> adresinize 6 haneli bir doğrulama kodu gönderildi.
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                  Kalan Süre: {formatCountdown(countdown)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  6 Haneli Kod
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\\D/g, ''))}
                  placeholder="123456"
                  className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Doğrula ve Onayla</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendCode(targetEmail)}
                  disabled={isLoading}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Kodu Yeniden Gönder</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setStep('define_email')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Mail size={12} />
                  <span>E-Postayı Değiştir</span>
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: BAŞARI */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                E-Posta Adresiniz Başarıyla Doğrulandı!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Doğrulama teyit e-postası hem sizin adresinize hem de sistem yönetimine iletilmiştir.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Tamam
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync(modalPath, fullModalCode, 'utf8');
console.log('✔ EmailVerificationModal.jsx successfully updated.');
console.log('>>> All dashboard email patches applied!');
