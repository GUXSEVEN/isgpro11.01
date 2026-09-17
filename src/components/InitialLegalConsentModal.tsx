import React, { useState, useEffect } from 'react';
import { ShieldCheck, PenTool, CheckCircle2, Lock, FileText, ArrowRight, Loader2, X } from 'lucide-react';
import { LEGAL_TEXTS } from '../data/legal';
import SignatureCanvas from './SignatureCanvas';
import { User } from '../types';

interface InitialLegalConsentModalProps {
  currentUser: User;
  onComplete: (signature: string) => void;
  onClose?: () => void;
}

export default function InitialLegalConsentModal({ currentUser, onComplete, onClose }: InitialLegalConsentModalProps) {
  const [activeTab, setActiveTab] = useState<'onBilgilendirme' | 'kvkk' | 'privacy'>('onBilgilendirme');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  
  // Kullanıcıya özel imza kontrolü
  const [signature, setSignature] = useState(() => {
    try {
      const u = currentUser?.username;
      if (!u || currentUser?.hasAcceptedLegalTerms !== true) {
        return '';
      }
      if (currentUser?.userSignature) return currentUser.userSignature;
      const stored = localStorage.getItem(`isg_user_signature_${u}`);
      return stored || '';
    } catch {
      return '';
    }
  });

  // Yeni veya onaylamamış kullanıcının yerel kalıntılarını temizle
  useEffect(() => {
    if (currentUser && currentUser.hasAcceptedLegalTerms !== true && currentUser.username) {
      const u = currentUser.username;
      try {
        localStorage.removeItem(`isg_user_signature_${u}`);
        localStorage.removeItem(`isg_user_signature_${u.toLowerCase()}`);
        localStorage.removeItem(`isg_legal_accepted_${u}`);
        localStorage.removeItem(`isg_legal_accepted_${u.toLowerCase()}`);
      } catch (e) {}
    }
  }, [currentUser]);

  const [showSigModal, setShowSigModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs: Array<{ key: 'onBilgilendirme' | 'kvkk' | 'privacy'; label: string }> = [
    { key: 'onBilgilendirme', label: 'Ön Bilgilendirme Formu' },
    { key: 'kvkk', label: 'KVKK Aydınlatma Metni' },
    { key: 'privacy', label: 'Gizlilik Politikası' }
  ];

  // Sözleşmeleri sunucu üzerinden hem kullanıcıya hem admin'e e-posta olarak gönder (Arka plan asenkron)
  const sendContractsDispatch = async (sigData: string) => {
    try {
      const customerEmail = currentUser?.email || 'kullanici@isgpro.app';
      const customerName = currentUser?.name || currentUser?.username || 'İSG Pro Kullanıcısı';
      const orderId = `KAYIT-${Date.now().toString().slice(-6)}`;

      const candidateUrls = typeof window !== 'undefined'
        ? ['', `${window.location.protocol}//${window.location.hostname}:5001`, `${window.location.protocol}//${window.location.hostname}:3000`]
        : [''];

      for (const base of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(`${base}/api/send-registration-contracts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              email: customerEmail,
              name: customerName,
              phone: currentUser?.phone || '',
              orderId,
              purchaseDate: new Date().toLocaleString('tr-TR'),
              userSignature: sigData,
              customerSignature: sigData
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            console.log('[Initial Consent] Onaylı 3 yasal bilgilendirme metni (Ön Bilgilendirme, Gizlilik, KVKK) PDF ile iletildi.');
            break;
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Sözleşme e-postası iletim uyarısı:', err);
    }
  };

  const handleConfirmAndProceed = async () => {
    if (!agreeTerms || !agreeKvkk || !signature) {
      alert('Lütfen tüm yasal şartları onaylayıp dijital imzanızı atınız.');
      return;
    }

    setIsSubmitting(true);

    if (currentUser?.username) {
      try {
        localStorage.setItem(`isg_user_signature_${currentUser.username}`, signature);
        localStorage.setItem(`isg_legal_accepted_${currentUser.username}`, 'true');
      } catch {}
    }

    // Kullanıcının imza ve onayını anında tamamla - Modal anında kapanır, kullanıcı bekletilmez!
    onComplete(signature);

    // Arka planda sözleşme e-postasını asenkron tetikle (fire-and-forget)
    sendContractsDispatch(signature).catch(e => {
      console.warn('E-posta gönderim adımı uyarısı:', e);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const isButtonDisabled = !agreeTerms || !agreeKvkk || !signature || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Üst Başlık Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white p-6 relative shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/15"
              title="Kapat ve Çıkış Yap"
            >
              <X size={16} />
            </button>
          )}
          <div className="flex items-center gap-3 mb-2 pr-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/30 border border-blue-400/40 text-blue-200 px-2 py-0.5 rounded-md">
                1 Defaya Mahsus Yasal Zorunluluk
              </span>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                Yasal Bilgilendirme ve Dijital Sözleşme Onayı
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-200/90 leading-relaxed max-w-2xl">
            Hoş geldiniz <strong>{currentUser?.name || currentUser?.username}</strong>. 6502 sayılı Tüketicinin Korunması Kanunu ve 6698 sayılı KVKK mevzuatı gereği, uygulamaya ilk erişiminizden önce yasal metinleri inceleyip dijital olarak onaylamanız ve imzalamanız gerekmektedir.
          </p>
        </div>

        {/* Sekmeler ve Metin Alanı */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Sekme Butonları */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sözleşme Metni İçeriği */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-52 sm:max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <h4 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-400">
                {LEGAL_TEXTS[activeTab]?.title}
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                6698 & 6502 Sayılı Kanun Uyarınca
              </span>
            </div>
            <div className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              {LEGAL_TEXTS[activeTab]?.content}
            </div>
          </div>

          {/* Onay Kutuları */}
          <div className="space-y-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-200 leading-relaxed select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <span>
                <strong>Ön Bilgilendirme Formu</strong> ve <strong>Gizlilik Politikası</strong>'nı okudum, anladım ve kabul ediyorum.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-200 leading-relaxed select-none">
              <input
                type="checkbox"
                checked={agreeKvkk}
                onChange={e => setAgreeKvkk(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <span>
                <strong>KVKK Aydınlatma Metni</strong> kapsamında kişisel verilerimin sistem kaydı, lisanslama ve onaylı sözleşme nüshalarının iletimi amacıyla işlenmesini onaylıyorum.
              </span>
            </label>
          </div>

          {/* Mavi Dijital İmza Alanı (Zorunlu) */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool size={18} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300">
                    Zorunlu Dijital İmza *
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Uygulamaya erişebilmek için imzanızı mavi mürekkep ile atmanız zorunludur.
                  </p>
                </div>
              </div>

              {signature ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-3 py-1 rounded-full shadow-xs">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  İmza Onaylandı
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-3 py-1 rounded-full shadow-xs">
                  İmza Bekleniyor
                </span>
              )}
            </div>

            {signature ? (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <img src={signature} alt="Kullanıcı İmzası" className="max-h-12 max-w-[160px] object-contain" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">İmzalayan</span>
                    <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300">{currentUser?.name || currentUser?.username}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSigModal(true)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Yeniden İmzala
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSigModal(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
              >
                <PenTool size={15} />
                <span>Ekrana Mavi Mürekkep İle İmza Atınız</span>
              </button>
            )}
          </div>

        </div>

        {/* Alt Buton ve Bilgilendirme */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Lock size={14} className="text-slate-400 shrink-0" />
            <span>İmzalanan onaylı sözleşme nüshaları (3 PDF) hem size hem de admin adresine e-posta ile gönderilecektir.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Daha Sonra Tamamla
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmAndProceed}
              disabled={isButtonDisabled}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                isButtonDisabled
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-600/30 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sözleşmeler Kaydediliyor & Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <span>İmzala ve Uygulamaya Başla</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* İmza Çizim Modalı */}
      {showSigModal && (
        <SignatureCanvas
          onConfirm={(sigDataUrl) => {
            setSignature(sigDataUrl);
            setShowSigModal(false);
          }}
          onClose={() => setShowSigModal(false)}
          title="Ön Bilgilendirme ve KVKK Onay İmzası"
          subtitle="6502 ve 6698 sayılı kanunlar gereği sözleşmeleri onaylamak için lütfen mavi mürekkep ile imzanızı çiziniz."
          signerName={currentUser?.name || currentUser?.username}
          confirmButtonText="İmzayı Kaydet ve Onayla"
          strokeColor="#1d4ed8"
        />
      )}
    </div>
  );
}
