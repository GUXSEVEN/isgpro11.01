import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, CheckCircle2, ShieldAlert, Copy, Check, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '../types';
import { requestTrialLicense } from '../lib/licenseUtils';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onActivateSuccess?: (key: string, licenseType: 'trial', expiresAt: string) => void;
  onOpenAuthModal?: () => void;
}

export default function TrialModal({
  isOpen,
  onClose,
  currentUser,
  onActivateSuccess,
  onOpenAuthModal
}: TrialModalProps) {
  const [email, setEmail] = useState(currentUser?.email || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activatedLocally, setActivatedLocally] = useState(false);

  if (!isOpen) return null;

  const handleRequestTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setGeneratedKey(null);

    try {
      // 1. Try server endpoint
      const response = await fetch('/api/request-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedKey(data.licenseKey);
        setExpiresAt(data.expiresAt);
      } else if (data.error) {
        setErrorMsg(data.error);
      } else {
        // Local fallback
        const localRes = await requestTrialLicense(email.trim(), name.trim());
        if (localRes.success && localRes.licenseKey) {
          setGeneratedKey(localRes.licenseKey);
          setExpiresAt(localRes.record?.expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());
        } else {
          setErrorMsg(localRes.error || 'Deneme sürümü talebiniz gerçekleştirilemedi.');
        }
      }
    } catch (err) {
      // Offline / Local fallback check
      const localRes = await requestTrialLicense(email.trim(), name.trim());
      if (localRes.success && localRes.licenseKey) {
        setGeneratedKey(localRes.licenseKey);
        setExpiresAt(localRes.record?.expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());
      } else {
        setErrorMsg(localRes.error || 'Deneme sürümü talebiniz gerçekleştirilemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAutoActivate = async () => {
    if (!generatedKey || !expiresAt) return;
    setLoading(true);
    try {
      if (onActivateSuccess) {
        await onActivateSuccess(generatedKey, 'trial', expiresAt);
      }
      setActivatedLocally(true);
    } catch (e) {
      console.warn('Auto activation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md">
              <Sparkles size={12} />
              <span>Ücretsiz Deneme Fırsatı</span>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight">
              7 Günlük Ücretsiz Deneme Lisansı
            </h3>
            <p className="text-xs text-amber-100 font-semibold mt-1 leading-relaxed">
              Kredi kartı veya ödeme gerektirmeden tüm yapay zeka risk analizi ve raporlama modüllerini 7 gün boyunca sınırsız test edin.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {!generatedKey ? (
              <form onSubmit={handleRequestTrial} className="space-y-4">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5"
                  >
                    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-snug">{errorMsg}</span>
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    E-Posta Adresi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 flex items-center gap-1">
                    <Lock size={10} />
                    Sistemimizde her e-posta hesabı için yalnızca 1 adet 7 günlük deneme kodu tanımlanabilir.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Lisans Üretiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>7 Günlük Deneme Kodunu Üret</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Result View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={26} />
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activatedLocally ? 'Deneme Sürümünüz Etkinleştirildi!' : '7 Günlük Deneme Kodunuz Hazır!'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    {formattedExpiry && `Geçerlilik Bitiş Tarihi: ${formattedExpiry}`}
                  </p>
                </div>

                {/* Key Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Dijital Deneme Lisans Kodu
                  </span>
                  <p className="font-mono text-base font-extrabold text-amber-600 dark:text-amber-400 tracking-wider select-all">
                    {generatedKey}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {currentUser ? (
                    !activatedLocally ? (
                      <button
                        onClick={handleAutoActivate}
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span>Hesabımda Anında Etkinleştir</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>7 Günlük Deneme Sürümünüz Aktiftir!</span>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenAuthModal) onOpenAuthModal();
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Giriş Yap / Kayıt Ol ve Kodu Kullan</span>
                      <ArrowRight size={16} />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
