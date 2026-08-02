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
  const [step, setStep] = useState<'input' | 'processing' | 'paytr_iframe' | 'paytr_sandbox' | 'success' | 'paytr_error'>('input');
  
  const [iframeToken, setIframeToken] = useState('');
  const [merchantOid, setMerchantOid] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [tempLicenseKey, setTempLicenseKey] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [acceptedAgreements, setAcceptedAgreements] = useState(false);
  const [activeModal, setActiveModal] = useState<'mss' | 'onBilgilendirme' | 'iade' | 'privacy' | 'kvkk' | 'teslimat' | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string>('');
  const userSignatureRef = useRef<string>('');
  const [loadingMsg, setLoadingMsg] = useState('Ödeme oturumu başlatılıyor...');
  const [paytrErrorMsg, setPaytrErrorMsg] = useState<string>('');

  const plansMeta = {
    monthly: { name: 'Aylık Plan', price: '₺299', rawPrice: '299.00', label: '/ Ay' },
    yearly: { name: 'Yıllık Plan', price: '₺2.990', rawPrice: '2990.00', label: '/ Yıl (En İyi Teklif)' }
  };

  const activePlan = plansMeta[planId];

  // Listen to the postMessage redirects from the iframe success/fail handlers
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PAYTR_SUCCESS') {
        const lic = event.data.licenseKey || tempLicenseKey;
        setGeneratedLicense(lic);
        setStep('success');
        
        // Final success hook
        setTimeout(() => {
          onSubmitSuccess(lic);
        }, 3000);
      } else if (event.data && event.data.type === 'PAYTR_FAIL') {
        alert('Ödeme işlemi tamamlanamadı veya iptal edildi.');
        setStep('input');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tempLicenseKey, onSubmitSuccess]);

  // Load PayTR iframe resizer dynamically when step is 'paytr_iframe'
  useEffect(() => {
    if (step === 'paytr_iframe') {
      const script = document.createElement('script');
      script.src = 'https://www.paytr.com/js/iframeResizer.min.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.iFrameResize) {
          // @ts-ignore
          window.iFrameResize({}, '#paytriframe');
        }
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
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
    setLoadingMsg('PayTR Güvenli Ödeme Altyapısı Başlatılıyor...');

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
        throw new Error(errorData.error || 'Ödeme altyapısı başlatılırken bir sorun oluştu.');
      }

      const data = await response.json();
      if (data.success && data.iframeToken) {
        setIframeToken(data.iframeToken);
        setMerchantOid(data.merchantOid);
        setIsDemo(data.isDemo);
        setTempLicenseKey(data.licenseKey);
        
        if (data.isDemo) {
          setStep('paytr_sandbox');
        } else {
          setStep('paytr_iframe');
        }
      } else {
        throw new Error('Geçersiz sunucu ödeme oturumu yanıtı.');
      }
    } catch (err: any) {
      console.error("PayTR Session Initiation Error:", err);
      setPaytrErrorMsg(err.message || 'Ödeme altyapısı başlatılırken sunucudan veya PayTR servisinden yanıt alınamadı.');
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

          {/* REAL PAYTR IFRAME GATEWAY */}
          {step === 'paytr_iframe' && (
            <motion.div
              key="paytr_iframe"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm p-4 sm:p-6 overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
                    PayTR Güvenli Ödeme Ekranı
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Sipariş ID: {merchantOid}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block">Tutar</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{activePlan.price} TL</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <iframe
                  src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                  id="paytriframe"
                  frameBorder="0"
                  scrolling="no"
                  className="w-full min-h-[600px] border-0"
                  title="PayTR Secure Payment Interface"
                />
              </div>
              <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                Kart bilgileriniz bizim sunucumuzda saklanmaz. Doğrudan BDDK lisanslı PayTR altyapısı üzerinden 3D Secure ile işlem yapılır.
              </div>
            </motion.div>
          )}

          {/* PAYTR ERROR DIAGNOSTIC STATE */}
          {step === 'paytr_error' && (
            <motion.div
              key="paytr_error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 p-6 sm:p-8 rounded-2xl shadow-md space-y-6 max-w-2xl mx-auto"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">PayTR Oturumu Başlatılamadı</h3>
                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">API Yanıtı</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                    PayTR sunucusu ödeme oturumu açma isteğinizi reddetti. Yanıt mesajı aşağıdadır:
                  </p>
                </div>
              </div>

              {/* Error Detail Message Box */}
              <div className="bg-slate-900 text-amber-300 p-4 rounded-xl text-xs font-mono font-bold leading-relaxed overflow-x-auto border border-slate-800 select-all">
                {paytrErrorMsg}
              </div>

              {/* Explanatory Guidance */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <p className="font-extrabold text-slate-800 dark:text-slate-200">🔍 Kontrol Edilmesi Gerekenler:</p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li><strong>Mağaza Bilgileri:</strong> PayTR Mağaza Paneli (paytr.com) -&gt; Entegrasyon Bilgileri'nden aldığınız Mağaza No, Key ve Salt değerlerinin tam ve doğru olduğunu kontrol edin.</li>
                  <li><strong>Test Modu:</strong> PayTR hesabınız henüz canlıya alınmadıysa Yönetici Paneli'nde "Test Modu (1)" seçili olmalıdır.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startPayTRSession('')}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-2 cursor-pointer"
                  >
                    Sözleşmeye Dön
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* DYNAMIC SANDBOX DEVELOPMENT CONTROL CENTER */}
          {step === 'paytr_sandbox' && (
            <motion.div
              key="paytr_sandbox"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              {/* Left Column: SandBox Information */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200 dark:border-indigo-900/35 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl font-extrabold text-xs">
                      TEST / SANDBOX MODU
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">PAYTR AKTİF DEĞİL</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Entegrasyon Başarıyla Hazırlandı</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      PayTR güvenli ödeme sisteminiz sunucu tarafında ve istemci tarafında eksiksiz yapılandırıldı. Ancak şu anda <code className="bg-slate-100 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 font-mono px-1 rounded font-bold">.env</code> dosyanızda gerçek PayTR API anahtarlarınız bulunmuyor.
                    </p>
                  </div>

                  {/* Step-by-Step setup instructions */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-850 space-y-3">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Giriş Anahtarlarını Aktifleştirmek İçin:</span>
                    <ol className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                      <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">1.</span>
                        <span>PayTR Mağaza Paneli'ne girin ve <strong>Bilgi -&gt; Entegrasyon Bilgileri</strong> alanına tıklayın.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">2.</span>
                        <span>Oradaki <strong>Merchant ID</strong>, <strong>Merchant Key</strong> ve <strong>Merchant Salt</strong> değerlerini kopyalayın.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">3.</span>
                        <span>Bunları projenizin ana dizinindeki <code className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono px-1.5 py-0.5 rounded text-[10px]">.env</code> dosyasındaki ilgili alanlara yapıştırın:</span>
                      </li>
                    </ol>

                    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 text-[10px] font-mono text-indigo-200 dark:text-indigo-300 select-all overflow-x-auto whitespace-pre">
                      {`PAYTR_MERCHANT_ID="MAGAZA_ID_BURAYA"\nPAYTR_MERCHANT_KEY="ANAHTAR_BURAYA"\nPAYTR_MERCHANT_SALT="SALT_BURAYA"`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wide">ÖDEME AKIŞI VE POSTA TESTİ</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSimulatePayment('success')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Başarılı Ödeme Simüle Et
                    </button>
                    <button
                      onClick={() => handleSimulatePayment('fail')}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                      <X size={14} /> İptal/Hata Simüle Et
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-center">
                    * Başarılı ödeme simüle edildiğinde, belirttiğiniz <strong>{email}</strong> adresine SMTP entegrasyonuyla <strong>gerçek e-posta</strong> ve lisans anahtarı gönderilir!
                  </p>
                </div>
              </div>

              {/* Right Column: Order Info Panel */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">SİPARİŞ ÖZETİ</h4>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activePlan.name}</span>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{activePlan.price} TL</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 space-y-1">
                      <p>Müşteri: {fullName}</p>
                      <p className="truncate">E-Posta: {email}</p>
                      <p>Telefon: {phone}</p>
                      <p>Sipariş ID: {merchantOid}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">HİZMET DETAYLARI:</span>
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

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-2">
                  <AlertCircle size={16} className="text-indigo-500 shrink-0" />
                  <span className="text-[10px] text-indigo-800 dark:text-indigo-300 leading-normal font-semibold">
                    PayTR test moduna erişmek için bu sandbox ekranını dilediğinizce kullanabilirsiniz. E-posta servisiniz tam olarak çalışmaktadır!
                  </span>
                </div>
              </div>
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
                    <span>Dijital Olarak İmzala ve Güvenli Ödemeye Geç</span>
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
              confirmButtonText="İmzala ve Ödemeye Geç"
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
