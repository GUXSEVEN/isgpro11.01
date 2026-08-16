/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Copy, 
  Sparkles, 
  AlertTriangle, 
  X, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  ExternalLink,
  Check,
  AlertCircle,
  PenTool
} from 'lucide-react';
import { LEGAL_TEXTS } from '../data/legal';
import SignatureCanvas from './SignatureCanvas';

interface CheckoutProps {
  planId: 'monthly' | 'yearly';
  onSubmitSuccess: (licenseKey: string) => void;
  onCancel: () => void;
}

export default function Checkout({ planId, onSubmitSuccess, onCancel }: CheckoutProps) {
  // Try to pre-populate billing details from logged in user if exists
  const [email, setEmail] = useState(() => {
    try {
      const stored = localStorage.getItem('isg_landing_current_user_v1');
      if (stored) {
        const u = JSON.parse(stored);
        return u.email || '';
      }
    } catch (_) {}
    return '';
  });

  const [fullName, setFullName] = useState(() => {
    try {
      const stored = localStorage.getItem('isg_landing_current_user_v1');
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || '';
      }
    } catch (_) {}
    return '';
  });

  const [phone, setPhone] = useState('05555555555');
  const [address, setAddress] = useState('İstanbul, Türkiye');
  const [step, setStep] = useState<'input' | 'processing' | 'paytr_iframe' | 'success' | 'paytr_error'>('input');
  const [iframeUrl, setIframeUrl] = useState<string>('');
  
  const [merchantOid, setMerchantOid] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [acceptedAgreements, setAcceptedAgreements] = useState(false);
  const [activeModal, setActiveModal] = useState<'mss' | 'onBilgilendirme' | 'iade' | 'privacy' | 'kvkk' | 'teslimat' | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const userSignatureRef = useRef<string>('');
  const [loadingMsg, setLoadingMsg] = useState('Siparişiniz işleniyor...');
  const [paytrErrorMsg, setPaytrErrorMsg] = useState<string>('');

  const plansMeta = {
    monthly: { name: 'Aylık Plan', price: '₺299', rawPrice: '299.00', label: '/ Ay' },
    yearly: { name: 'Yıllık Plan', price: '₺2.990', rawPrice: '2990.00', label: '/ Yıl (En İyi Teklif)' }
  };

  const activePlan = plansMeta[planId];

  // PayTR iFrame Callback & Result Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'PAYTR_SUCCESS') {
        const lic = event.data.licenseKey || generatedLicense;
        if (lic) setGeneratedLicense(lic);
        if (event.data.oid) setMerchantOid(event.data.oid);
        setStep('success');
        setTimeout(() => {
          onSubmitSuccess(lic || generatedLicense);
        }, 3500);
      } else if (event.data.type === 'PAYTR_FAIL') {
        setPaytrErrorMsg('Ödeme işlemi onaylanmadı veya kullanıcı tarafından iptal edildi.');
        setStep('paytr_error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [generatedLicense, onSubmitSuccess]);

  // Load PayTR iFrame Resizer Helper Script dynamically
  useEffect(() => {
    if (step === 'paytr_iframe') {
      const script = document.createElement('script');
      script.src = 'https://www.paytr.com/js/iframeResizer.min.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        try {
          document.body.removeChild(script);
        } catch (_) {}
      };
    }
  }, [step]);

  const handleOpenSignatureModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedAgreements) {
      alert('Lütfen devam etmek için satış sözleşmesini ve diğer yasal koşulları onaylayın.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      alert('Lütfen fatura ve iletişim bilgilerini eksiksiz doldurun.');
      return;
    }
    setShowSignatureModal(true);
  };

  const handleConfirmSignatureAndPay = async (signatureDataUrl: string) => {
    setUserSignature(signatureDataUrl);
    userSignatureRef.current = signatureDataUrl;
    try {
      localStorage.setItem('isg_user_signature', signatureDataUrl);
    } catch (e) {}
    setShowSignatureModal(false);
    await startPayTRSession(signatureDataUrl);
  };

  const startPayTRSession = async (sigUrl: string) => {
    setStep('processing');
    setLoadingMsg('PayTR 256-Bit SSL Güvenli Ödeme Ekranı Hazırlanıyor...');

    const activeSig = sigUrl || userSignatureRef.current || userSignature || (typeof window !== 'undefined' ? localStorage.getItem('isg_user_signature') || '' : '');

    try {
      const response = await fetch('/api/paytr/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          name: fullName,
          email,
          phone,
          address,
          userSignature: activeSig,
          customerSignature: activeSig
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PayTR ödeme oturumu başlatılırken bir sorun oluştu.');
      }

      const data = await response.json();
      if (data.success && (data.iframeToken || data.merchantOid)) {
        const oid = data.merchantOid;
        const lic = data.licenseKey;
        const token = data.iframeToken;
        const isDemo = data.isDemo;

        setMerchantOid(oid);
        setGeneratedLicense(lic);

        // Pre-send PDF contracts & signature record
        fetch('/api/send-email-contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: fullName,
            phone,
            address,
            orderId: oid,
            planName: activePlan.name,
            price: activePlan.price,
            userSignature: activeSig,
            customerSignature: activeSig
          })
        }).catch(e => console.error("Contract delivery pre-send note:", e));

        // Construct PayTR iframe URL according to 1. ADIM specification
        let targetIframeUrl = '';
        if (isDemo || !token || token.startsWith('mock_')) {
          targetIframeUrl = `/api/paytr/demo-iframe?oid=${encodeURIComponent(oid)}&amount=${encodeURIComponent(activePlan.rawPrice)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`;
        } else {
          targetIframeUrl = `https://www.paytr.com/odeme/guvenli/${token}`;
        }

        setIframeUrl(targetIframeUrl);
        setStep('paytr_iframe');
      } else {
        throw new Error(data.error || 'Geçersiz sunucu yanıtı.');
      }
    } catch (err: any) {
      console.error("Order Initiation Error:", err);
      setPaytrErrorMsg(err.message || 'Ödeme oturumu başlatılırken sunucudan yanıt alınamadı.');
      setStep('paytr_error');
    }
  };

  // Triggers simulated callback for testing emails and flow without credentials
  const handleSimulatePayment = async (status: 'success' | 'fail') => {
    setStep('processing');
    setLoadingMsg(status === 'success' ? 'Güvenli ödeme simüle ediliyor, lisansınız üretiliyor...' : 'İptal işlemi simüle ediliyor...');

    try {
      if (status === 'success') {
        const activeSig = userSignatureRef.current || userSignature || (typeof window !== 'undefined' ? localStorage.getItem('isg_user_signature') || '' : '');
        
        console.log(`[Simulated Payment] Sending contract email with active signature length: ${activeSig.length}`);

        // Automatically send contract email with signature attachment for test simulation
        await fetch('/api/send-email-contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: fullName,
            phone,
            address,
            orderId: merchantOid,
            planName: activePlan.name,
            price: activePlan.price,
            userSignature: activeSig,
            customerSignature: activeSig
          })
        }).catch(e => console.error("Simulated contract delivery error:", e));

        const tempLicenseKey = `ISG-PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setTimeout(() => {
          window.postMessage({
            type: 'PAYTR_SUCCESS',
            oid: merchantOid,
            licenseKey: tempLicenseKey
          }, '*');
        }, 1500);
      } else {
        setTimeout(() => {
          window.postMessage({
            type: 'PAYTR_FAIL',
            oid: merchantOid
          }, '*');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setStep('input');
    }
  };

  const handleCopyKey = () => {
    try {
      navigator.clipboard.writeText(generatedLicense);
      alert('Lisans kodunuz panoya kopyalandı!');
    } catch (e) {
      alert(`Lisans kodunuz: ${generatedLicense}`);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center transition-colors duration-300">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
          <button
            onClick={onCancel}
            disabled={step === 'processing'}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft size={14} /> Geri Dön
          </button>
          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Lock size={12} /> PayTR 256-Bit SSL Güvenli Altyapı
          </span>
        </div>

        <AnimatePresence mode="wait">
          
          {/* PROCESSING STATE */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-10 rounded-2xl shadow-md flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950/40 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Güvenlik Kontrolü</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {loadingMsg}
                </p>
              </div>
            </motion.div>
          )}

          {/* PAYTR IFRAME STEP (RIGHT AFTER DIGITAL SIGNATURE) */}
          {step === 'paytr_iframe' && (
            <motion.div
              key="paytr_iframe"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto"
            >
              {/* Top info bar */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded">PayTR</div>
                  <span className="text-xs font-bold text-slate-300">BDDK Lisanslı 256-Bit SSL Ödeme Sayfası</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <Lock size={12} /> Güvenli Bağlantı
                </div>
              </div>

              {/* Order Summary banner */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Sipariş / Fatura Sahibi</span>
                  <span className="font-bold text-slate-900 dark:text-white block">{fullName} ({email})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block">Ödenecek Tutar</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base block">{activePlan.price}</span>
                </div>
              </div>

              {/* PayTR iframe */}
              <div className="p-2 sm:p-4 bg-slate-100 dark:bg-slate-900 min-h-[620px] flex justify-center items-center">
                {iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    id="paytriframe"
                    frameBorder="0"
                    scrolling="no"
                    className="w-full min-h-[620px] border-0 rounded-xl shadow-inner bg-white"
                    title="PayTR Ödeme Formu"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <p className="text-xs text-slate-500 font-semibold">PayTR ödeme formu yükleniyor...</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Bilgileri Değiştir
                </button>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  Sipariş No: {merchantOid}
                </span>
              </div>
            </motion.div>
          )}

          {/* PAYTR ERROR STATE */}
          {step === 'paytr_error' && (
            <motion.div
              key="paytr_error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/30 p-8 rounded-2xl shadow-md flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Ödeme Tamamlanamadı</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  {paytrErrorMsg || 'İşlem sırasında bir hata oluştu veya ödeme iptal edildi.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Tekrar Dene
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal Et
                </button>
              </div>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/30 p-10 rounded-2xl shadow-md flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white">Ödeme Onaylandı!</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  Aboneliğiniz başarıyla tamamlandı, faturanız oluşturuldu ve Premium lisans kodunuz e-posta adresinize gönderildi.
                </p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 w-full text-center space-y-2">
                <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">PREMIUM LİSANS KODUNUZ</span>
                <span className="font-mono font-extrabold text-indigo-800 dark:text-indigo-300 text-base block">{generatedLicense}</span>
                <button
                  onClick={handleCopyKey}
                  className="mx-auto text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Copy size={10} /> Kodu Kopyala
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <Check size={14} className="text-emerald-500" />
                <span>E-posta başarıyla iletildi! Gelen kutunuzu kontrol edin.</span>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Kullanıcı panelinize yönlendiriliyorsunuz...</p>
            </motion.div>
          )}



          {/* INPUT FORM STATE */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              
              {/* Left Column: Plan Summary & Features */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
                <div className="space-y-2">
                  <span className="inline-block px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    GÜVENLİ LİSANS SATIN ALIMI
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Aboneliğinizi Başlatın</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Seçtiğiniz plana ilişkin ayrıntılar ve PayTR güvenli fatura formu.</p>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{activePlan.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Sınırsız yapay zeka & rapor çıktıları</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 block">{activePlan.price}</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block -mt-1">{activePlan.label}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Siparişe Ait Haklar:</span>
                    {[
                      'Ömür Boyu Bulut Güncelleme Desteği',
                      'Yönetmeliğe Uygun Rapor Kalitesi',
                      'Dosya Başına Sınırsız İSG Analizi',
                      'Anında İptal Edebilme İmkanı'
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Billing Information Form */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4">
                  <ShieldCheck className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                  <div className="text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold leading-snug">
                    Güvenli ödeme işlemine başlamak için BDDK standartları gereğince aşağıdaki iletişim ve fatura bilgilerini doldurunuz. Kart bilgileriniz bir sonraki aşamada PayTR iframe ekranında girilecektir.
                  </div>
                </div>

                {/* FORM INPUTS */}
                <form onSubmit={handleOpenSignatureModal} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Ad Soyad</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Örn: İbrahim Coşkun"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">E-Posta Adresi</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Örn: ibrahim@isgpro.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Telefon Numarası</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Örn: 05555555555"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Fatura Adresi</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Örn: Kadıköy, İstanbul"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Legal Agreements Panel */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">YASAL SÖZLEŞMELER</span>
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">Bireysel Satıcı: İBRAHİM COŞKUN</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveModal('mss')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • Mesafeli Satış Sözleşmesi
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal('onBilgilendirme')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • Ön Bilgilendirme Formu
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal('iade')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • İptal ve İade Koşulları
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal('teslimat')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • Teslimat ve Kargo Koşulları
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal('privacy')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • Gizlilik Politikası
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal('kvkk')}
                        className="text-left text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        • KVKK Sözleşmesi
                      </button>
                    </div>

                    <div className="relative flex items-start gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center h-5">
                        <input
                          id="legal-checkbox"
                          name="legal-checkbox"
                          type="checkbox"
                          checked={acceptedAgreements}
                          onChange={(e) => setAcceptedAgreements(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                        />
                      </div>
                      <div className="text-[11px] leading-snug">
                        <label htmlFor="legal-checkbox" className="font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                          <span className="font-bold text-slate-900 dark:text-white">İbrahim Coşkun</span> tarafından sunulan Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu, İptal ve İade Koşulları, Teslimat ve Kargo Koşulları, Gizlilik Politikası ve KVKK Sözleşmesi'ni okudum, onaylıyorum.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Pay Button */}
                  <button
                    type="submit"
                    disabled={!acceptedAgreements}
                    className={`w-full font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      acceptedAgreements 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none hover:shadow-none'
                    }`}
                  >
                    <PenTool size={16} />
                    <span>Dijital Olarak İmzala ve Aboneliği Başlat</span>
                  </button>
                </form>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

        {/* DIGITAL SIGNATURE MODAL */}
        <AnimatePresence>
          {showSignatureModal && (
            <SignatureCanvas
              onConfirm={handleConfirmSignatureAndPay}
              onClose={() => setShowSignatureModal(false)}
              title="Islak İmza Onayı"
              subtitle="Mesafeli Satış ve KVKK Sözleşmelerini onaylamak için aşağıdaki alana imzanızı çiziniz."
              signerName={fullName || email}
              confirmButtonText="İmzala ve Aboneliği Tamamla"
              strokeColor="#1d4ed8"
            />
          )}
        </AnimatePresence>

        {/* LEGAL AGREEMENTS MODAL */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
                    {LEGAL_TEXTS[activeModal].title}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line space-y-3 max-h-[60vh] bg-slate-50/50 dark:bg-slate-900/50">
                  {LEGAL_TEXTS[activeModal].content}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedAgreements(true);
                      setActiveModal(null);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    Okudum, Onaylıyorum
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
