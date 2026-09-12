/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Mail, Phone, ArrowLeft, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';
import { normalizeUsername } from '../lib/userUtils';

interface AuthProps {
  onClose: () => void;
  onLogin: (username: string, password: string) => boolean | Promise<boolean>;
  onRegister: (newUser: UserType) => boolean | { success: boolean; reason?: string; suggestions?: string[]; message?: string } | Promise<boolean | { success: boolean; reason?: string; suggestions?: string[]; message?: string }>;
  checkUserExists: (username: string) => UserType | undefined | Promise<UserType | undefined>;
  onResetPassword: (username: string, newPass: string) => boolean | Promise<boolean>;
}

export default function Auth({
  onClose,
  onLogin,
  onRegister,
  checkUserExists,
  onResetPassword,
}: AuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'reset' | 'otp' | 'newpass'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'uzman' | 'hekim' | 'dsp' | 'other'>('uzman');
  const [tcNo, setTcNo] = useState('');
  const [certificateNo, setCertificateNo] = useState('');
  const [diplomaNo, setDiplomaNo] = useState('');
  const [tescilNo, setTescilNo] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Reset password states
  const [resetUsername, setResetUsername] = useState('');
  const [foundUser, setFoundUser] = useState<UserType | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = normalizeUsername(username);
    const cleanPass = password.trim();
    if (!cleanUser || !cleanPass) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const success = await onLogin(cleanUser, cleanPass);
      if (success) {
        onClose();
      } else {
        setMessage({ type: 'error', text: 'Hatalı kullanıcı adı veya şifre girdiniz.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Giriş yapılırken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUser = normalizeUsername(username);
    const cleanPass = password.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanTcNo = tcNo.trim();
    const cleanCertNo = certificateNo.trim();
    const cleanDiplomaNo = diplomaNo.trim();
    const cleanTescilNo = tescilNo.trim();

    // 1. Zorunlu Alan Kontrolleri
    if (!cleanName) {
      setMessage({ type: 'error', text: 'Ad Soyad alanı zorunludur.' });
      return;
    }
    if (!cleanUser || cleanUser.length < 3) {
      setMessage({ type: 'error', text: 'Kullanıcı adı zorunludur ve en az 3 karakter olmalıdır.' });
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setMessage({ type: 'error', text: 'Şifre zorunludur ve en az 4 karakter olmalıdır.' });
      return;
    }

    // 2. T.C. Kimlik No Kontrolü (İsteğe bağlı, girildiyse 11 hane)
    if (cleanTcNo && cleanTcNo.length !== 11) {
      setMessage({ type: 'error', text: 'T.C. Kimlik Numarası girildiyse tam 11 haneli olmalıdır.' });
      return;
    }

    // 3. E-Posta Format Kontrolü (Zorunlu, RFC Standardı)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir e-posta adresi giriniz (örn: ad.soyad@isgpro.com).' });
      return;
    }

    // 4. Telefon Numarası Kontrolü (İsteğe bağlı, girildiyse 05XX formatı)
    const digitsOnlyPhone = cleanPhone.replace(/\D/g, '');
    const phoneRegex = /^(0?5\d{9})$/;
    if (digitsOnlyPhone && !phoneRegex.test(digitsOnlyPhone)) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir Türkiye cep telefonu numarası giriniz (05XX XXX XX XX) veya boş bırakınız.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const newUser: UserType = {
      username: cleanUser,
      password: cleanPass,
      name: cleanName,
      email: cleanEmail,
      phone: digitsOnlyPhone || cleanPhone,
      role,
      tcNo: cleanTcNo || '',
      certificateNo: cleanCertNo || '',
      diplomaNo: cleanDiplomaNo || '',
      tescilNo: cleanTescilNo || '',
      isPremium: false,
      isEmailVerified: false,
      hasAcceptedLegalTerms: false,
      createdBy: 'web_register',
      createdAt: new Date().toISOString()
    };

    try {
      const result = await onRegister(newUser);
      const isSuccess = typeof result === 'boolean' ? result : result?.success;
      if (isSuccess) {
        setUsernameSuggestions([]);
        onClose();
      } else {
        // Sunucudan/App'ten gelen müsait kullanıcı adı önerilerini kullan
        const returnedSuggestions = (typeof result === 'object' && Array.isArray(result?.suggestions)) ? result.suggestions : [];
        if (returnedSuggestions.length > 0) {
          setUsernameSuggestions(returnedSuggestions);
        } else {
          // Yedek öneriler
          const randomNum = Math.floor(10 + Math.random() * 89);
          const currentYear = new Date().getFullYear();
          const suggestions = [
            `${cleanUser}${randomNum}`,
            `${cleanUser}_${currentYear}`,
            `${cleanUser}_isg`,
            `${cleanUser}.isg`
          ];
          setUsernameSuggestions(suggestions);
        }
        setMessage({ 
          type: 'error', 
          text: (typeof result === 'object' && result?.message)
            ? result.message
            : `⚠️ "@${cleanUser}" kullanıcı adı sistemde zaten kayıtlı! Lütfen aşağıdaki müsait önerilerden birine tıklayarak seçin veya farklı bir ad yazın:` 
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Kayıt olurken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanResetUser = normalizeUsername(resetUsername);
    if (!cleanResetUser) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const user = await checkUserExists(cleanResetUser);
      if (user) {
        setFoundUser(user);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setView('otp');
        setMessage({ type: 'success', text: `Doğrulama kodu kayıtlı e-posta adresinize başarıyla gönderildi. Lütfen gelen kutunuzu kontrol edin.` });

        // Send real/simulated OTP email via secure server API proxy
        if (user.email) {
          try {
            await fetch('/api/send-email-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                code,
                name: user.name || user.username
              })
            });
          } catch (err) {
            console.warn('Could not send OTP email:', err);
          }
        }
      } else {
        setMessage({ type: 'error', text: 'Girdiğiniz kullanıcı adı sistemde kayıtlı değil.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Kullanıcı sorgulanırken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === generatedOtp) {
      setView('newpass');
      setMessage({ type: 'success', text: 'Kod doğrulandı! Şimdi yeni şifrenizi belirleyin.' });
    } else {
      setMessage({ type: 'error', text: 'Doğrulama kodu geçersiz.' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 3) {
      setMessage({ type: 'error', text: 'Şifreniz en az 3 karakter olmalıdır.' });
      return;
    }

    if (foundUser) {
      setLoading(true);
      try {
        await onResetPassword(foundUser.username, newPassword);
        setMessage({ type: 'success', text: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
        setView('login');
      } catch (err) {
        setMessage({ type: 'error', text: 'Şifre sıfırlanırken bir hata oluştu.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Brand Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <KeyRound size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Üye Girişi & Kayıt</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">İSG Pro Portalı</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {message.text && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === 'error' 
                ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300' 
                : 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-300'
            }`}>
              {message.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              <span>{message.text}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* LOGIN VIEW */}
            {view === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Kullanıcı Adı</label>
                  <input
                    type="text" required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                    placeholder="kullaniciadi"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/^\s+/, ''))}
                    onBlur={() => setUsername(prev => normalizeUsername(prev))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Şifre</label>
                    <button
                      type="button"
                      onClick={() => setView('reset')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                  <input
                    type="password" required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white"
                    placeholder="••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  Giriş Yap
                </button>

                <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
                  Hesabınız yok mu?{' '}
                  <button type="button" onClick={() => setView('register')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                    Kayıt Olun
                  </button>
                </div>
              </motion.form>
            )}

            {/* REGISTER VIEW */}
            {view === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Ad Soyad *</label>
                  <input
                    type="text" required
                    className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Kullanıcı Adı *</label>
                  <input
                    type="text" required
                    className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                    placeholder="ahmetyilmaz"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value.replace(/^\s+/, ''));
                      if (usernameSuggestions.length > 0) setUsernameSuggestions([]);
                    }}
                    onBlur={() => setUsername(prev => normalizeUsername(prev))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                {usernameSuggestions.length > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <span>Önerilen Müsait Kullanıcı Adları (Seçmek için tıklayın):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {usernameSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setUsername(sug);
                            setUsernameSuggestions([]);
                            setMessage({ type: '', text: '' });
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-mono font-bold shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <span>@{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">T.C. Kimlik No (11 Hane)</label>
                    <input
                      type="text"
                      maxLength={11}
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="11 haneli kimlik no"
                      value={tcNo}
                      onChange={e => setTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Şifre *</label>
                    <input
                      type="password" required
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white"
                      placeholder="En az 4 karakter"
                      value={password} onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">E-Posta *</label>
                    <input
                      type="email" required
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="ornek@isg.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      ℹ️ Bir e-posta ile yılda en fazla 2 doğrulanmış hesap açılabilir.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Telefon (İsteğe Bağlı)</label>
                    <input
                      type="tel"
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="05XX XXX XX XX"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mesleki Rol / Branş</label>
                  <select
                    value={role} onChange={e => setRole(e.target.value as any)}
                    className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="other" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Diğer / Yönetici</option>
                    <option value="uzman" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">İş Güvenliği Uzmanı (İGU)</option>
                    <option value="hekim" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">İşyeri Hekimi (İH)</option>
                    <option value="dsp" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Diğer Sağlık Personeli (DSP)</option>
                  </select>
                </div>

                {(role === 'uzman' || role === 'hekim' || role === 'dsp') && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Sertifika / Belge Numarası</label>
                    <input
                      type="text"
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Örn: 123456"
                      value={certificateNo}
                      onChange={e => setCertificateNo(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Diploma No (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Örn: DIP-12345"
                      value={diplomaNo}
                      onChange={e => setDiplomaNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tescil No (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Örn: TSC-98765"
                      value={tescilNo}
                      onChange={e => setTescilNo(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !username.trim() || !password.trim() || !email.trim() || (tcNo.length > 0 && tcNo.length !== 11)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  {loading ? 'Kayıt Oluşturuluyor...' : 'Kayıt Ol'}
                </button>

                <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  Zaten üye misiniz?{' '}
                  <button type="button" onClick={() => setView('login')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                    Giriş Yapın
                  </button>
                </div>
              </motion.form>
            )}

            {/* PASSWORD RESET SEARCH VIEW */}
            {view === 'reset' && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetCheck}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Kullanıcı Adı Girin</label>
                  <input
                    type="text" required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                    placeholder="kullaniciadi"
                    value={resetUsername}
                    onChange={e => setResetUsername(e.target.value.replace(/^\s+/, ''))}
                    onBlur={() => setResetUsername(prev => normalizeUsername(prev))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button" onClick={() => setView('login')}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Kodu Gönder
                  </button>
                </div>
              </motion.form>
            )}

            {/* OTP VERIFICATION VIEW */}
            {view === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex gap-2">
                  <CheckCircle2 className="shrink-0 text-emerald-600 dark:text-emerald-400" size={14} />
                  <span>Tek kullanımlık doğrulama kodu (OTP) kayıtlı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol ederek 6 haneli kodu aşağıya girin.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">6 Haneli Kod</label>
                  <input
                    type="text" required maxLength={6}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white text-center tracking-widest font-mono font-bold placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="000000"
                    value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  Kodu Doğrula
                </button>
              </motion.form>
            )}

            {/* NEW PASSWORD SUBMIT VIEW */}
            {view === 'newpass' && (
              <motion.form
                key="newpass"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Yeni Şifreniz</label>
                  <input
                    type="password" required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white"
                    placeholder="••••••"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  Şifreyi Güncelle
                </button>
              </motion.form>
            )}

          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
