/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User as UserType, ContactMessage } from '../types';
import { hashPassword } from '../lib/crypto';
import { 
  User, KeyRound, Clock, Mail, ShieldCheck, CreditCard, Sparkles, Copy, 
  Settings, RefreshCcw, Save, MessageSquare, Trash2, ArrowUpRight, HelpCircle,
  Loader2, CheckCircle2, ShieldAlert, Send, Eye, EyeOff
} from 'lucide-react';
import { maskLicenseKey } from '../lib/privacy';
import { validateLicenseAgainstDb } from '../lib/licenseUtils';

interface DashboardProps {
  currentUser: UserType;
  onUpdateProfile: (updatedFields: Partial<UserType>) => Promise<any>;
}

export default function Dashboard({ currentUser, onUpdateProfile }: DashboardProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [role, setRole] = useState(currentUser.role || 'uzman');
  const [certificateNo, setCertificateNo] = useState(currentUser.certificateNo || '');
  
  const [myEmails, setMyEmails] = useState<ContactMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFullLicense, setShowFullLicense] = useState(false);

  // Password update states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [sendingEmailNotice, setSendingEmailNotice] = useState(false);
  const [emailNoticeMsg, setEmailNoticeMsg] = useState('');

  // Manual License Activation states
  const [activationCode, setActivationCode] = useState('');
  const [activatingLicense, setActivatingLicense] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState('');

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');
    setActivationSuccess('');

    const clean = activationCode.trim().toUpperCase();
    if (!clean) {
      setActivationError('Lütfen e-posta ile tarafınıza iletilen lisans kodunu giriniz.');
      return;
    }

    if (clean.length < 6) {
      setActivationError('Lisans kodu en az 6 karakter olmalıdır. Örn: ISG-9MHW-PVQB-4KZN');
      return;
    }

    setActivatingLicense(true);
    try {
      const response = await fetch('/api/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: clean,
          email: currentUser.email,
          username: currentUser.username
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const result = await onUpdateProfile({
          isPremium: true,
          licenseKey: data.licenseKey,
          licensePurchasedAt: data.licensePurchasedAt,
          licenseExpiresAt: data.licenseExpiresAt,
          licenseType: data.licenseType
        });

        if (result && result.success) {
          setActivationSuccess(data.message || 'Lisansınız başarıyla etkinleştirildi! Premium özellikler hesabınıza tanımlandı.');
          setActivationCode('');
        } else {
          setActivationError('Lisans doğrulandı ancak profil güncellenirken bir hata oluştu.');
        }
      } else {
        setActivationError(data.error || 'Lisans kodu doğrulanamadı. Lütfen e-postanıza gelen kodu kontrol ediniz.');
      }
    } catch {
      setActivationError('Sunucu bağlantısı sağlanamadı. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setActivatingLicense(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!email) {
      alert('Lütfen öncelikle geçerli bir e-posta adresi kaydediniz.');
      return;
    }
    setSendingEmailNotice(true);
    try {
      await fetch('/api/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name || currentUser.username
        })
      });
      setEmailNoticeMsg('Doğrulama e-postası ve doğrulama kodunuz adresinize gönderildi!');
      setTimeout(() => setEmailNoticeMsg(''), 4000);
    } catch {
      setEmailNoticeMsg('E-posta gönderilirken bir hata oluştu.');
    } finally {
      setSendingEmailNotice(false);
    }
  };

  const handleSendUpdateLinkEmail = async () => {
    if (!email) {
      alert('Lütfen öncelikle geçerli bir e-posta adresi yazınız.');
      return;
    }
    setSendingEmailNotice(true);
    try {
      await fetch('/api/send-email-update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name || currentUser.username,
          updateLink: `https://${window.location.host}/#dashboard`
        })
      });
      setEmailNoticeMsg('E-posta güncelleme ve doğrulama bağlantısı e-posta adresinize iletildi!');
      setTimeout(() => setEmailNoticeMsg(''), 4000);
    } catch {
      setEmailNoticeMsg('E-posta gönderilirken bir hata oluştu.');
    } finally {
      setSendingEmailNotice(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const hashedOld = await hashPassword(oldPassword);
    if (oldPassword !== currentUser.password && hashedOld !== currentUser.password) {
      setPasswordError('Mevcut şifreniz hatalı.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler uyuşmuyor.');
      return;
    }

    const result = await onUpdateProfile({ password: newPassword });
    if (result && result.success) {
      setPasswordSuccess('Şifreniz başarıyla güncellendi!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
    } else {
      setPasswordError('Şifre güncellenirken bir hata oluştu.');
    }
  };

  // Fetch simulated messages sent by this user from server
  const fetchMyEmails = async () => {
    if (!currentUser.email) return;
    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/my-emails?email=${encodeURIComponent(currentUser.email)}`);
      if (response.ok) {
        const data = await response.json();
        setMyEmails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    fetchMyEmails();
  }, [currentUser.email]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onUpdateProfile({
      name,
      email,
      phone,
      role,
      certificateNo
    });

    if (result.success) {
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleCopyLicense = () => {
    if (currentUser.licenseKey) {
      try {
        navigator.clipboard.writeText(currentUser.licenseKey);
        alert('Lisans kodunuz panoya kopyalandı!');
      } catch (err) {
        alert(`Lisans kodunuz: ${currentUser.licenseKey}`);
      }
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Simulated purchase history list
  const receipts = currentUser.isPremium ? [
    {
      id: `RCP-${(currentUser.licenseKey || '1111').slice(4, 8)}`,
      date: currentUser.licensePurchasedAt || new Date().toISOString(),
      amount: currentUser.licenseType === 'yearly' ? '₺2.990,00' : '₺299,00',
      plan: currentUser.licenseType === 'yearly' ? 'Yıllık Pro Lisans' : 'Aylık Pro Lisans',
      method: 'Kredi Kartı',
      status: 'Ödendi'
    }
  ] : [];

  return (
    <section id="dashboard" className="py-12 md:py-20 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Müşteri Portalım</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Lisans bilgilerinizi kontrol edin, profilinizi güncelleyin ve destek taleplerinizi takip edin.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-550 font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg shadow-sm">
            Sistem Saati: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: LICENSE & STATS DASHBOARD (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active License Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Lisans Durumum</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Abonelik & Yetki</p>
                  </div>
                </div>

                {currentUser.isPremium ? (
                  <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-sm border border-emerald-200/50 dark:border-emerald-900/30">
                    <Sparkles size={11} className="animate-pulse text-emerald-500 dark:text-emerald-400" /> PREMIUM AKTİF
                  </span>
                ) : (
                  <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border border-amber-200/50 dark:border-amber-900/30">
                    KAPSAM: DENEME (DEMO)
                  </span>
                )}
              </div>

              {currentUser.isPremium && currentUser.licenseKey ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Lisans Kodu</span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900/50">Gizlilik Korumalı</span>
                      </div>
                      <span className="font-mono font-extrabold text-indigo-800 dark:text-indigo-300 text-sm tracking-wide">
                        {showFullLicense ? currentUser.licenseKey : maskLicenseKey(currentUser.licenseKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFullLicense(!showFullLicense)}
                        className="px-3 py-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                        title={showFullLicense ? 'Gizle' : 'Göster'}
                      >
                        {showFullLicense ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showFullLicense ? 'Gizle' : 'Göster'}
                      </button>
                      <button
                        onClick={handleCopyLicense}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                      >
                        <Copy size={12} /> Kopyala
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Satın Alma</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(currentUser.licensePurchasedAt)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Bitiş Tarihi</span>
                      <span className="text-red-600 dark:text-red-400 font-bold">{formatDate(currentUser.licenseExpiresAt)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Plan Tipi</span>
                      <span className="capitalize text-slate-800 dark:text-slate-200 font-bold">
                        {currentUser.licenseType === 'yearly' ? 'Yıllık Pro Plan' : currentUser.licenseType === 'demo' ? '10 Dakikalık Demo Test Lisansı' : 'Aylık Pro Plan'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                    Şu anda platformu <strong>Deneme Sürümü (Demo)</strong> olarak kullanıyorsunuz. 
                    Deneme sürümünde haftalık rapor çıktısı limitiniz 3, yapay zeka analiz limitiniz ise günlük 5 adettir.
                  </p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <a
                      href="#pricing"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-lg transition-all shadow shadow-indigo-600/10 active:scale-95 cursor-pointer"
                    >
                      <span>Şimdi Lisans Al ve Sınırları Kaldır</span>
                      <ArrowUpRight size={14} />
                    </a>
                    <a
                      href="#manual-activation"
                      className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-4 py-3 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 transition-all active:scale-95 cursor-pointer"
                    >
                      <KeyRound size={14} />
                      <span>E-Posta Kodum Var (Etkinleştir)</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Manual License Activation Card */}
            <div id="manual-activation" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Manuel Lisans Etkinleştirme</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">E-Posta Lisans Kod Aktivasyonu</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/40">
                  Kod İle Aktif Et
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                Satın alma işleminizin ardından e-posta adresinize gönderilen veya tarafınıza iletilen lisans anahtarınızı aşağıdaki kutuya girerek hesabınızı manuel olarak anında etkinleştirebilirsiniz.
              </p>

              {activationSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{activationSuccess}</span>
                </div>
              )}

              {activationError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <ShieldAlert size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                  <span>{activationError}</span>
                </div>
              )}

              <form onSubmit={handleActivateLicense} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between mb-1">
                    <span>E-Posta İle Gelen Dijital Lisans Anahtarı</span>
                    <span className="text-[9px] text-slate-400 font-mono">Örn: ISG-M-XXXX (Aylık) veya ISG-Y-XXXX (Yıllık)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="Örn: ISG-M-XXXX-XXXX (Aylık) veya ISG-Y-XXXX-XXXX (Yıllık)"
                      className="w-full pl-3.5 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 text-slate-400">
                      <KeyRound size={16} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activatingLicense || !activationCode.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {activatingLicense ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Lisans Kodunuz Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Lisans Kodunu Etkinleştir</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Simulated Sent Emails Inbox */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Gönderdiğim Destek / İletişim E-Postaları</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Müşteri Destek Geçmişi</p>
                  </div>
                </div>
                <button 
                  onClick={fetchMyEmails}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                  title="Mesajları Yenile"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>

              {loadingEmails ? (
                <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  <span>Kutunuz kontrol ediliyor...</span>
                </div>
              ) : myEmails.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-2 font-semibold">
                  <Mail size={32} className="opacity-25 text-slate-400 dark:text-slate-500" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Henüz hiç destek veya iletişim mesajınız yok.</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Bize ulaşmak için aşağıdaki iletişim formunu kullanabilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {myEmails.map((msg) => (
                    <div key={msg.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-all space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">{msg.subject}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block mt-1">{formatDate(msg.sentAt)}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          msg.status === 'Beklemede' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed bg-white dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase History */}
            {receipts.length > 0 && (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Ödeme ve Fatura Geçmişim</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Finansal Kayıtlar</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-200 dark:border-slate-800 pb-2 text-left">
                        <th className="py-2 font-bold">Fatura ID</th>
                        <th className="py-2 font-bold">Tarih</th>
                        <th className="py-2 font-bold">Plan</th>
                        <th className="py-2 font-bold text-right">Tutar</th>
                        <th className="py-2 font-bold text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {receipts.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{rec.id}</td>
                          <td className="py-2.5">{formatDate(rec.date)}</td>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-white">{rec.plan}</td>
                          <td className="py-2.5 text-right font-bold text-indigo-700 dark:text-indigo-400">{rec.amount}</td>
                          <td className="py-2.5 text-right">
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full">{rec.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: PROFILE MANAGEMENT & SETTINGS (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Profil Bilgileri Kartı */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Profil Ayarlarım</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">İSG Bilgileri Düzenleme</p>
                  </div>
                </div>

                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                  >
                    Düzenle
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditing(false); setName(currentUser.name); setEmail(currentUser.email); setPhone(currentUser.phone); setRole(currentUser.role); setCertificateNo(currentUser.certificateNo || ''); }}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 transition-all active:scale-95 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/35 text-green-700 dark:text-green-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Profil bilgileriniz başarıyla güncellendi!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center border border-indigo-200 dark:border-indigo-900/40 text-indigo-500 dark:text-indigo-400 shadow-sm relative">
                    <User size={36} />
                    <span className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Ad Soyad</label>
                  <input
                    type="text" required
                    disabled={!editing}
                    className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all disabled:opacity-60 placeholder-slate-400 dark:placeholder-slate-500"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Kullanıcı Adı (Benzersiz)</label>
                  <input
                    type="text" disabled
                    className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                    value={`@${currentUser.username}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">E-Posta</label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Onaylı
                      </span>
                    </div>
                    <input
                      type="email" required
                      disabled={!editing}
                      className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all disabled:opacity-60 placeholder-slate-400 dark:placeholder-slate-500"
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleSendVerificationEmail}
                        disabled={sendingEmailNotice}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Mail size={12} /> Doğrulama Kodu Gönder
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={handleSendUpdateLinkEmail}
                        disabled={sendingEmailNotice}
                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={12} /> Güncelleme Linki İstet
                      </button>
                    </div>

                    {emailNoticeMsg && (
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 animate-fadeIn">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        {emailNoticeMsg}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Telefon</label>
                    <input
                      type="tel" required
                      disabled={!editing}
                      className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all disabled:opacity-60 placeholder-slate-400 dark:placeholder-slate-500"
                      value={phone} onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1 mb-1">Mesleki Yetkilendirme</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">İSG Rolü</label>
                      <select
                        disabled={!editing}
                        className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all disabled:opacity-60"
                        value={role} onChange={e => setRole(e.target.value as any)}
                      >
                        <option value="uzman" className="text-slate-950 bg-white dark:bg-slate-900 dark:text-white">İş Güvenliği Uzmanı</option>
                        <option value="hekim" className="text-slate-950 bg-white dark:bg-slate-900 dark:text-white">İşyeri Hekimi</option>
                        <option value="other" className="text-slate-950 bg-white dark:bg-slate-900 dark:text-white">Diğer / Yönetici</option>
                      </select>
                    </div>
                    {(role === 'uzman' || role === 'hekim') && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Sertifika No</label>
                        <input
                          type="text"
                          disabled={!editing}
                          className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all disabled:opacity-60 placeholder-slate-400 dark:placeholder-slate-500"
                          placeholder="Örn: 12345-A"
                          value={certificateNo} onChange={e => setCertificateNo(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Profil Bilgilerini Kaydet</span>
                  </button>
                )}
              </form>
            </div>

            {/* Şifre Değiştirme Kartı */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Şifre Değiştir</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Hesap Güvenliği</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/35 text-green-700 dark:text-green-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert size={15} /> {passwordError}
                </div>
              )}

              {!changingPassword ? (
                <button
                  type="button"
                  onClick={() => setChangingPassword(true)}
                  className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <KeyRound size={14} />
                  <span>Şifremi Değiştir</span>
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mevcut Şifre</label>
                    <input
                      type="password"
                      required
                      className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Yeni Şifre</label>
                      <input
                        type="password"
                        required
                        className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        required
                        className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:border-indigo-500 transition-all"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPassword(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Kaydet</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
