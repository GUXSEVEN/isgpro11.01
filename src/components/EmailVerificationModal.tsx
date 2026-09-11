import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Lock, ArrowRight, X } from 'lucide-react';
import { User } from '../types';

interface EmailVerificationModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose?: () => void;
  onLogout?: () => void;
  onVerified: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  currentUser,
  onClose,
  onLogout,
  onVerified
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(900); // 15 dakika
  
  const hasSentInitialRef = useRef(false);
  const isSendingRef = useRef(false);

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

  // Modal ilk açıldığında SADECE 1 KEZ otomatik kod gönder (Strict mode veya re-render çift gönderimini engeller)
  useEffect(() => {
    if (isOpen && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      handleSendCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetEmail = currentUser?.email || '';

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return '';
    const [u, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    if (u.length <= 2) return `${u[0]}***@${domain}`;
    return `${u[0]}***${u[u.length - 1]}@${domain}`;
  };

  const getCandidateUrls = () => {
    if (typeof window === 'undefined') return [''];
    const { protocol, hostname } = window.location;
    return ['', `${protocol}//${hostname}:5001`, `${protocol}//${hostname}:3000`];
  };

  // 1. Kod Gönderme
  const handleSendCode = async () => {
    if (isSendingRef.current) return;
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Geçerli bir e-posta adresi bulunamadı.');
      return;
    }

    isSendingRef.current = true;
    setIsLoading(true);
    setErrorMsg('');

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);

    const candidateUrls = getCandidateUrls();
    let sent = false;

    for (const base of candidateUrls) {
      try {
        const res = await fetch(`${base}/api/send-email-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            code: newCode,
            name: currentUser?.name || currentUser?.username
          })
        });

        if (res.ok) {
          sent = true;
          break;
        }
      } catch (e) {}
    }

    if (!sent) {
      // Fallback: send-email-otp
      for (const base of candidateUrls) {
        try {
          const res = await fetch(`${base}/api/send-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: targetEmail,
              code: newCode,
              name: currentUser?.name || currentUser?.username
            })
          });

          if (res.ok) {
            sent = true;
            break;
          }
        } catch (e) {}
      }
    }

    setIsLoading(false);
    isSendingRef.current = false;
    if (sent) {
      setStep('verify');
    } else {
      setErrorMsg('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyiniz.');
    }
  };

  // 2. Kodu Doğrulama
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = otpCode.trim();

    if (!cleanInput) {
      setErrorMsg('Lütfen 6 haneli doğrulama kodunu giriniz.');
      return;
    }

    if (cleanInput !== generatedCode.trim()) {
      setErrorMsg('Girdiğiniz doğrulama kodu hatalı veya süresi dolmuş. Lütfen tekrar deneyiniz.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Başarı e-postası tetikle (hem kullanıcıya hem admin'e)
    const candidateUrls = getCandidateUrls();
    for (const base of candidateUrls) {
      try {
        const res = await fetch(`${base}/api/send-email-verified-success`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: currentUser?.name || currentUser?.username,
            username: currentUser?.username
          })
        });
        if (res.ok) {
          break;
        }
      } catch (err) {
        console.warn('Başarı teyit maili gönderim uyarısı:', err);
      }
    }

    setIsLoading(false);
    setStep('success');

    // 1.5 saniye sonra onVerified tetikle
    setTimeout(() => {
      onVerified();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Modal Başlığı */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white p-6 relative">
          {(onClose || onLogout) && (
            <button
              type="button"
              onClick={onClose || onLogout}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/15"
              title="Kapat ve Çıkış Yap"
            >
              <X size={16} />
            </button>
          )}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Mail size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/30 border border-blue-400/40 text-blue-200 px-2 py-0.5 rounded-md">
                Güvenlik Doğrulaması
              </span>
              <h3 className="font-black text-lg text-white mt-0.5">E-Posta Adresi Doğrulama</h3>
            </div>
          </div>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'send' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                <Loader2 size={28} className="animate-spin" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Doğrulama Kodu Gönderiliyor...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <strong>{maskEmail(targetEmail)}</strong> adresine 6 haneli güvenlik kodunuz iletiliyor.
                </p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Lütfen <strong>{maskEmail(targetEmail)}</strong> adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                </p>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Kod geçerlilik süresi: {formatCountdown(countdown)}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full py-3.5 text-center text-2xl font-mono font-black tracking-widest bg-slate-50 dark:bg-slate-800/80 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl text-slate-900 dark:text-white focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <span>E-Postayı Doğrula ve Devam Et</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading || countdown > 840} // ilk 1 dakika tekrar basamasın
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Kodu Tekrar Gönder</span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Çıkış Yap / Değiştir
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Lock size={14} className="shrink-0 mt-0.5 text-slate-400" />
                <span>E-posta doğrulandıktan sonra sistem teyit bildirimi alıcıya ve sistem yöneticisine otomatik olarak iletilecektir.</span>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">E-Posta Adresiniz Doğrulandı!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Güvenlik teyidi başarıyla kaydedildi. Yönlendiriliyorsunuz...
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
