import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Lock, ArrowRight, X, Sparkles, Send } from 'lucide-react';
import { User } from '../types';
import { checkEmailAccountLimitFromDb } from '../lib/userUtils';

interface EmailVerificationModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose?: () => void;
  onLogout?: () => void;
  onVerified: () => void;
  onUpdateEmail?: (newEmail: string) => Promise<boolean | void> | void;
  startInChangeMode?: boolean;
}

const isValidEmailAddress = (emailStr?: string): boolean => {
  if (!emailStr) return false;
  const trimmed = emailStr.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export default function EmailVerificationModal({
  isOpen,
  currentUser,
  onClose,
  onLogout,
  onVerified,
  onUpdateEmail,
  startInChangeMode = false
}: EmailVerificationModalProps) {
  const initialEmail = (currentUser?.email || '').trim();
  const hasInitialValidEmail = isValidEmailAddress(initialEmail);

  const [step, setStep] = useState<'define_email' | 'send' | 'verify' | 'success'>(() => {
    if (startInChangeMode) return 'define_email';
    return hasInitialValidEmail ? 'send' : 'define_email';
  });
  const [targetEmail, setTargetEmail] = useState<string>(initialEmail);
  const [emailInput, setEmailInput] = useState<string>(initialEmail);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(900); // 15 dakika
  const [limitStatus, setLimitStatus] = useState<{ checked: boolean; allowed: boolean; count: number; limit: number; message: string }>({
    checked: false,
    allowed: true,
    count: 0,
    limit: 2,
    message: ''
  });
  
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

  // Modal ilk açıldığında SADECE e-posta adresi zaten tanımlı ve geçerliyse ve startInChangeMode değilse 1 KEZ otomatik kod gönder
  useEffect(() => {
    if (isOpen && isValidEmailAddress(currentUser?.email) && !startInChangeMode && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      handleSendCode(currentUser.email.trim());
    }
  }, [isOpen, currentUser?.email, startInChangeMode]);

  if (!isOpen) return null;

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

  // 1. Tanımsız E-Posta Adresini Kaydetme ve Doğrulama Kodu Gönderme
  const handleSaveAndSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!isValidEmailAddress(cleanEmail)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz (örn: ad.soyad@ornek.com).');
      return;
    }

    setIsSavingEmail(true);
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 0. Öncelikli olarak Veritabanından Yıllık 2 Hesap Sınırı Kontrolü
      const limitCheck = await checkEmailAccountLimitFromDb(cleanEmail, currentUser?.username);
      setLimitStatus({
        checked: true,
        allowed: limitCheck.allowed,
        count: limitCheck.count,
        limit: limitCheck.limit,
        message: limitCheck.message
      });

      if (!limitCheck.allowed) {
        setErrorMsg(limitCheck.message || 'Bu e-posta adresine bağlı son 1 yıl içerisinde en fazla 2 adet doğrulanmış hesap açılabilir. Yıllık limitiniz dolmuştur.');
        setIsSavingEmail(false);
        setIsLoading(false);
        return;
      }

      // 1. Ana uygulamada kullanıcının profilini güncelle ve veritabanına kaydet
      if (onUpdateEmail) {
        await onUpdateEmail(cleanEmail);
      }

      setTargetEmail(cleanEmail);
      setStep('send');

      // 2. Doğrulama kodunu yeni tanımlanan e-postaya gönder
      await handleSendCode(cleanEmail);
    } catch (err: any) {
      console.error('E-posta kaydetme hatası:', err);
      setErrorMsg(err?.message || 'E-posta adresi kaydedilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
      setStep('define_email');
    } finally {
      setIsSavingEmail(false);
      setIsLoading(false);
    }
  };

  // 2. Doğrulama Kodu Gönderme
  const handleSendCode = async (emailToSend?: string) => {
    if (isSendingRef.current) return;
    const emailToUse = (emailToSend || targetEmail || '').trim().toLowerCase();

    if (!isValidEmailAddress(emailToUse)) {
      setStep('define_email');
      setErrorMsg('Lütfen öncelikle geçerli bir e-posta adresi tanımlayınız.');
      return;
    }

    isSendingRef.current = true;
    setIsLoading(true);
    setErrorMsg('');

    // 0. Veritabanından Yıllık 2 Hesap Sınırı Kontrolü
    try {
      const limitCheck = await checkEmailAccountLimitFromDb(emailToUse, currentUser?.username);
      setLimitStatus({
        checked: true,
        allowed: limitCheck.allowed,
        count: limitCheck.count,
        limit: limitCheck.limit,
        message: limitCheck.message
      });

      if (!limitCheck.allowed) {
        setErrorMsg(limitCheck.message || 'Bu e-posta adresine bağlı son 1 yıl içerisinde en fazla 2 adet doğrulanmış hesap açılabilir. Yıllık limitiniz dolmuştur.');
        setIsLoading(false);
        isSendingRef.current = false;
        return;
      }
    } catch (checkErr) {
      console.warn('Veritabanı limit ön kontrol uyarısı:', checkErr);
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);

    const candidateUrls = getCandidateUrls();
    let sent = false;
    let limitBlocked = false;

    for (const base of candidateUrls) {
      try {
        const res = await fetch(`${base}/api/send-email-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToUse,
            code: newCode,
            name: currentUser?.name || currentUser?.username,
            username: currentUser?.username
          })
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.error || 'Bu e-posta adresine bağlı son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.');
          setLimitStatus(prev => ({ ...prev, allowed: false, message: errData.error }));
          limitBlocked = true;
          break;
        }

        if (res.ok) {
          sent = true;
          break;
        }
      } catch (e) {}
    }

    if (!sent && !limitBlocked) {
      // Fallback: send-email-otp
      for (const base of candidateUrls) {
        try {
          const res = await fetch(`${base}/api/send-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailToUse,
              code: newCode,
              name: currentUser?.name || currentUser?.username,
              username: currentUser?.username
            })
          });

          if (res.status === 403) {
            const errData = await res.json().catch(() => ({}));
            setErrorMsg(errData.error || 'Bu e-posta adresine bağlı son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.');
            setLimitStatus(prev => ({ ...prev, allowed: false, message: errData.error }));
            limitBlocked = true;
            break;
          }

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
      setTargetEmail(emailToUse);
      setStep('verify');
    } else if (!limitBlocked) {
      setErrorMsg('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyiniz.');
    }
  };

  // 3. Kodu Doğrulama
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

  const isDefineStep = step === 'define_email';

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
                {isDefineStep ? 'E-Posta Tanımlama' : 'Güvenlik Doğrulaması'}
              </span>
              <h3 className="font-black text-lg text-white mt-0.5">
                {isDefineStep ? 'E-Posta Adresinizi Tanımlayın' : 'E-Posta Adresi Doğrulama'}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-4">
          
          {/* Yıllık Doğrulanmış Hesap Kuralı Bilgilendirme Kartı */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
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
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-amber-950 dark:text-amber-100 block">
                  Yıllık Hesap Kotası Doldu ({limitStatus.count}/{limitStatus.limit})
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {limitStatus.message || 'Bu e-posta adresine bağlı olarak son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 0. ADIM: E-POSTA ADRESİ TANIMLAMA (Daha önce e-posta tanımlamamış kullanıcılar için) */}
          {step === 'define_email' && (
            <form onSubmit={handleSaveAndSendEmail} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={18} />
                </div>
                <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                  <span className="font-extrabold block text-indigo-900 dark:text-indigo-100">
                    E-Posta Adresi Tanımlaması Gerekli
                  </span>
                  <p className="text-[11px] leading-relaxed text-indigo-800/90 dark:text-indigo-300">
                    Daha önce kayıt olan kullanıcılarımızın hesap güvenliği, yasal bildirimleri ve 6 haneli güvenlik kodunu (OTP) alabilmesi için geçerli bir e-posta adresi tanımlaması gerekmektedir.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  E-Posta Adresiniz <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="ad.soyad@ornek.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tek kullanımlık 6 haneli güvenlik kodu bu adrese gönderilecektir.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSavingEmail || !emailInput.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading || isSavingEmail ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>E-Posta Kaydediliyor & Kod Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <span>E-Postayı Kaydet ve Doğrulama Kodu Gönder</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {onLogout && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </form>
          )}

          {/* 1. ADIM: KOD GÖNDERİLİYOR DURUMU */}
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

          {/* 2. ADIM: KOD GİRİŞİ VE DOĞRULAMA */}
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
                disabled={isLoading || otpCode.length < 6 || !limitStatus.allowed}
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

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendCode(targetEmail)}
                  disabled={isLoading || countdown > 840 || !limitStatus.allowed}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Kodu Tekrar Gönder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('define_email');
                    setErrorMsg('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <span>E-Postayı Değiştir</span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Lock size={14} className="shrink-0 mt-0.5 text-slate-400" />
                <span>E-posta doğrulandıktan sonra sistem teyit bildirimi alıcıya ve sistem yöneticisine otomatik olarak iletilecektir.</span>
              </div>
            </form>
          )}

          {/* 3. ADIM: BAŞARI DURUMU */}
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
