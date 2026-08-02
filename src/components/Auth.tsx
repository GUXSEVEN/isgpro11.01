/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Mail, Phone, ArrowLeft, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onClose: () => void;
  onLogin: (username: string, password: string) => boolean | Promise<boolean>;
  onRegister: (newUser: UserType) => boolean | Promise<boolean>;
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
  const [role, setRole] = useState<'uzman' | 'hekim' | 'other'>('uzman');

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
    if (!username || !password) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const success = await onLogin(username, password);
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
    if (!name || !username || !password || !email || !phone) {
      setMessage({ type: 'error', text: 'Lütfen tüm yıldızlı (*) alanları doldurunuz.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    const newUser: UserType = {
      username: username.toLowerCase().trim().replace(/\s/g, ''),
      password,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      isPremium: false,
    };

    try {
      const success = await onRegister(newUser);
      if (success) {
        setMessage({ type: 'success', text: 'Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.' });
        setView('login');
      } else {
        setMessage({ type: 'error', text: 'Bu kullanıcı adı zaten alınmış.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Kayıt olurken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const user = await checkUserExists(resetUsername);
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
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="kullaniciadi"
                    value={username} onChange={e => setUsername(e.target.value.toLowerCase().trim())}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Kullanıcı Adı *</label>
                    <input
                      type="text" required
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="ahmetyilmaz"
                      value={username} onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Şifre *</label>
                    <input
                      type="password" required
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white"
                      placeholder="••••••"
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
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Telefon *</label>
                    <input
                      type="tel" required
                      className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="555..."
                      value={phone} onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">İSG Rolü</label>
                  <select
                    value={role} onChange={e => setRole(e.target.value as any)}
                    className="mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="uzman" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">İş Güvenliği Uzmanı (İGU)</option>
                    <option value="hekim" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">İşyeri Hekimi (İH)</option>
                    <option value="other" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Diğer / Yönetici</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  Kayıt Ol ve Giriş Yap
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
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-slate-800 dark:text-white font-semibold placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="kullaniciadi"
                    value={resetUsername} onChange={e => setResetUsername(e.target.value.toLowerCase().trim())}
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
