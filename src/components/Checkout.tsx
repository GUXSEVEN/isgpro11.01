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
  PenTool,
  Building2,
  Building,
  Hash,
  FileText
} from 'lucide-react';
import { LEGAL_TEXTS } from '../data/legal';
import SignatureCanvas from './SignatureCanvas';
import { generateLicenseKey, registerGeneratedLicense } from '../lib/licenseUtils';
import { TURKEY_PROVINCES } from '../data/provinces';
import { decryptUser } from '../lib/crypto';

interface CheckoutProps {
  planId: 'monthly' | 'yearly' | 'test';
  onSubmitSuccess: (licenseKey: string, checkoutMeta?: any) => void;
  onCancel: () => void;
  currentUser?: any;
}

export default function Checkout({ planId, onSubmitSuccess, onCancel, currentUser }: CheckoutProps) {
  // Try to resolve current user from props or localStorage
  const resolvedUser = currentUser || (() => {
    try {
      const storedLanding = localStorage.getItem('isg_landing_current_user_v1');
      if (storedLanding) {
        const parsed = JSON.parse(storedLanding);
        return decryptUser(parsed);
      }
      const storedPanel = localStorage.getItem('currentUser') || localStorage.getItem('isg_current_user') || localStorage.getItem('isg_active_user') || localStorage.getItem('user');
      if (storedPanel) {
        const parsed = JSON.parse(storedPanel);
        return decryptUser(parsed);
      }
    } catch (_) {}
    return null;
  })();

  const effectiveUsername = resolvedUser?.username || currentUser?.username || '';
  useEffect(() => {
    if (effectiveUsername) {
      try {
        sessionStorage.setItem('isg_checkout_active_username', effectiveUsername);
        localStorage.setItem('isg_checkout_active_username', effectiveUsername);
      } catch (_) {}
    }
  }, [effectiveUsername]);

  // Billing Type: 'individual' (Bireysel) | 'corporate' (Kurumsal)
  const [billingType, setBillingType] = useState<'individual' | 'corporate'>(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_billing_type');
      if (saved === 'corporate' || saved === 'individual') return saved;
    } catch (_) {}
    return 'individual';
  });

  // 1) Individual fields
  const [fullName, setFullName] = useState(() => {
    if (resolvedUser?.name) return resolvedUser.name;
    if (resolvedUser?.username) return resolvedUser.username;
    try {
      const saved = localStorage.getItem('isg_checkout_name');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  const [tcNo, setTcNo] = useState(() => {
    if (resolvedUser?.tcNo) return resolvedUser.tcNo;
    try {
      const saved = localStorage.getItem('isg_checkout_tc') || localStorage.getItem('isg_user_tc');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  // Shared contact & address fields
  const [email, setEmail] = useState(() => {
    if (resolvedUser?.email && resolvedUser.email.includes('@')) return resolvedUser.email;
    try {
      const saved = localStorage.getItem('isg_checkout_email');
      if (saved && saved.includes('@')) return saved;
    } catch (_) {}
    return '';
  });

  const [phone, setPhone] = useState(() => {
    if (resolvedUser?.phone) {
      const digits = resolvedUser.phone.replace(/\D/g, '');
      if (digits.length >= 10) return digits.startsWith('0') ? digits : '0' + digits;
    }
    try {
      const saved = localStorage.getItem('isg_checkout_phone');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  const [city, setCity] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_city');
      if (saved && TURKEY_PROVINCES.includes(saved)) return saved;
    } catch (_) {}
    return 'İstanbul';
  });

  const [district, setDistrict] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_district');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_address');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  // 2) Corporate fields
  const [companyName, setCompanyName] = useState(() => {
    if (resolvedUser?.managedOsgbName) return resolvedUser.managedOsgbName;
    try {
      const saved = localStorage.getItem('isg_checkout_company_name');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  const [taxNumber, setTaxNumber] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_tax_number');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

  const [taxOffice, setTaxOffice] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_checkout_tax_office');
      if (saved) return saved;
    } catch (_) {}
    return '';
  });

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

  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'yearly' | 'test'>(planId || 'yearly');

  const plansMeta = {
    test: { name: '1 TL Canlı Test Lisansı', price: '₺1', rawPrice: '1.00', label: ' / tek seferlik (Canlı Test)' },
    monthly: { name: 'Aylık Plan', price: '₺299', rawPrice: '299.00', label: '/ Ay' },
    yearly: { name: 'Yıllık Plan', price: '₺2.990', rawPrice: '2990.00', label: '/ Yıl (En İyi Teklif)' }
  };

  const activePlan = plansMeta[selectedPlanId] || plansMeta[planId] || plansMeta.yearly;

  // PayTR iFrame Callback & Result Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'PAYTR_SUCCESS') {
        const receivedLic = event.data.licenseKey;
        const lic = (receivedLic && receivedLic !== 'ISG-PRO-MOCK-LICENSE') ? receivedLic : generatedLicense;
        if (lic) setGeneratedLicense(lic);
        const activeOid = event.data.oid || merchantOid;
        if (activeOid) setMerchantOid(activeOid);
        setStep('success');

        const activeSig = userSignatureRef.current || userSignature || (typeof window !== 'undefined' ? localStorage.getItem('isg_user_signature') || '' : '');
        const targetDisplayName = billingType === 'individual' ? fullName.trim() : companyName.trim();
        const fullAddress = `${address.trim()}, ${district.trim()} / ${city.trim()}`;

        const checkoutMeta = {
          orderId: activeOid || `ISG-${Date.now().toString().slice(-6)}`,
          email: email.trim(),
          name: targetDisplayName,
          fullName: fullName.trim(),
          billingType,
          tcNo: billingType === 'individual' ? tcNo.trim() : '',
          companyName: billingType === 'corporate' ? companyName.trim() : '',
          taxNumber: billingType === 'corporate' ? taxNumber.trim() : '',
          taxOffice: billingType === 'corporate' ? taxOffice.trim() : '',
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          district: district.trim(),
          fullAddress,
          planName: activePlan.name,
          price: activePlan.price,
          userSignature: activeSig
        };

        // Arka planda fatura bildirim e-postasını infoisgpro@gmail.com'a ilet
        // Önce production sunucusuna dene, olmassa relative URL ile fallback yap
        const billingPayload = JSON.stringify({
          orderId: checkoutMeta.orderId,
          planName: activePlan.name,
          price: activePlan.price,
          billingType,
          customerName: targetDisplayName,
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          customerAddress: fullAddress,
          city: city.trim(),
          district: district.trim(),
          tcNo: billingType === 'individual' ? tcNo.trim() : '',
          companyName: billingType === 'corporate' ? companyName.trim() : '',
          taxNumber: billingType === 'corporate' ? taxNumber.trim() : '',
          taxOffice: billingType === 'corporate' ? taxOffice.trim() : '',
          licenseKey: lic || generatedLicense,
          customerSignature: activeSig
        });
        const billingHeaders = { 'Content-Type': 'application/json' };
        fetch('/api/send-email-billing', {
          method: 'POST',
          headers: billingHeaders,
          body: billingPayload
        }).then(r => r.json()).then(d => {
          console.log('[Checkout Billing] Sent successfully via /api/send-email-billing:', d);
        }).catch(e => {
          console.warn('[Checkout Billing] Failed to send billing email:', e);
        });

        setTimeout(() => {
          onSubmitSuccess(lic || generatedLicense, checkoutMeta);
        }, 3500);
      } else if (event.data.type === 'PAYTR_FAIL') {
        setPaytrErrorMsg('Ödeme işlemi onaylanmadı veya kullanıcı tarafından iptal edildi.');
        setStep('paytr_error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [generatedLicense, onSubmitSuccess, merchantOid, email, fullName, phone, address, city, district, billingType, tcNo, companyName, taxNumber, taxOffice, userSignature, activePlan]);

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

  // Form submit & strict billing validation
  const handleOpenSignatureModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedAgreements) {
      alert('Lütfen devam etmek için satış sözleşmesini ve diğer yasal koşulları onaylayın.');
      return;
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      alert('Lütfen lisans kodunuzun ve faturanızın iletileceği geçerli bir e-posta adresi giriniz.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Lütfen en az 10 haneli geçerli bir cep telefonu numarası giriniz.');
      return;
    }

    if (!city.trim()) {
      alert('Lütfen fatura adresiniz için il seçiniz.');
      return;
    }

    if (!district.trim()) {
      alert('Lütfen fatura adresiniz için ilçe bilgisini giriniz.');
      return;
    }

    if (!address.trim()) {
      alert('Lütfen açık fatura adresinizi (cadde, mahalle, bina/kapı no) eksiksiz giriniz.');
      return;
    }

    if (billingType === 'individual') {
      if (!fullName.trim()) {
        alert('Lütfen Bireysel Fatura için Ad Soyad bilginizi giriniz.');
        return;
      }
      const cleanTc = tcNo.replace(/\D/g, '');
      if (cleanTc.length !== 11) {
        alert('Lütfen 11 haneli T.C. Kimlik Numaranızı eksiksiz olarak giriniz.');
        return;
      }
    } else {
      // corporate
      if (!companyName.trim()) {
        alert('Lütfen Kurumsal Fatura için Ticari Şirket Unvanını eksiksiz giriniz.');
        return;
      }
      const cleanTax = taxNumber.replace(/\D/g, '');
      if (cleanTax.length < 10) {
        alert('Lütfen en az 10 haneli Vergi Kimlik Numaranızı (VKN) eksiksiz giriniz.');
        return;
      }
      if (!taxOffice.trim()) {
        alert('Lütfen bağlı olduğunuz Vergi Dairesi adını giriniz.');
        return;
      }
    }

    // Persist values in localStorage for user convenience
    try {
      localStorage.setItem('isg_checkout_billing_type', billingType);
      localStorage.setItem('isg_checkout_email', cleanEmail);
      localStorage.setItem('isg_checkout_phone', cleanPhone);
      localStorage.setItem('isg_checkout_address', address.trim());
      localStorage.setItem('isg_checkout_city', city.trim());
      localStorage.setItem('isg_checkout_district', district.trim());
      if (billingType === 'individual') {
        localStorage.setItem('isg_checkout_name', fullName.trim());
        localStorage.setItem('isg_checkout_tc', tcNo.trim());
      } else {
        localStorage.setItem('isg_checkout_company_name', companyName.trim());
        localStorage.setItem('isg_checkout_tax_number', taxNumber.trim());
        localStorage.setItem('isg_checkout_tax_office', taxOffice.trim());
      }
    } catch (_) {}

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
    const targetDisplayName = billingType === 'individual' ? fullName.trim() : companyName.trim();
    const fullAddress = `${address.trim()}, ${district.trim()} / ${city.trim()}`;

    try {
      const response = await fetch('/api/paytr/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          name: targetDisplayName,
          fullName: fullName.trim(),
          billingType,
          tcNo: billingType === 'individual' ? tcNo.trim() : '',
          companyName: billingType === 'corporate' ? companyName.trim() : '',
          taxNumber: billingType === 'corporate' ? taxNumber.trim() : '',
          taxOffice: billingType === 'corporate' ? taxOffice.trim() : '',
          email: email.trim(),
          username: resolvedUser?.username || currentUser?.username || '',
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          phone: phone.trim(),
          address: fullAddress,
          city: city.trim(),
          district: district.trim(),
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

        try {
          localStorage.setItem('isg_user_signature', activeSig);
          localStorage.setItem('isg_checkout_order_details', JSON.stringify({
            orderId: oid,
            email: email.trim(),
            name: targetDisplayName,
            fullName: fullName.trim(),
            billingType,
            tcNo: billingType === 'individual' ? tcNo.trim() : '',
            companyName: billingType === 'corporate' ? companyName.trim() : '',
            taxNumber: billingType === 'corporate' ? taxNumber.trim() : '',
            taxOffice: billingType === 'corporate' ? taxOffice.trim() : '',
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            district: district.trim(),
            fullAddress,
            planName: activePlan.name,
            price: activePlan.price,
            userSignature: activeSig
          }));
        } catch (_) {}

        // Construct PayTR iframe URL according to 1. ADIM specification
        let targetIframeUrl = '';
        if (isDemo || !token || token.startsWith('mock_')) {
          targetIframeUrl = `/api/paytr/demo-iframe?oid=${encodeURIComponent(oid)}&amount=${encodeURIComponent(activePlan.rawPrice)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(targetDisplayName)}`;
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
        try {
          localStorage.setItem('isg_user_signature', activeSig);
        } catch (_) {}

        const tempLicenseKey = generateLicenseKey(selectedPlanId === 'test' ? 'demo' : (selectedPlanId as any));
        try {
          await registerGeneratedLicense(tempLicenseKey, selectedPlanId === 'test' ? 'demo' : (selectedPlanId as any), email);
        } catch (regErr) {
          console.warn('Could not auto-register temp license:', regErr);
        }
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
    <div className="min-h-screen w-full py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 flex flex-col justify-start transition-colors duration-300 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y pinch-zoom' }}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        
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

                {/* Plan Seçim Butonları (1 TL Test / Aylık / Yıllık) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Paket Seçimi
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                      Tıklayarak değiştirebilirsiniz
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId('test')}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlanId === 'test'
                          ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[9px] font-black text-emerald-600 uppercase">🧪 Canlı Test</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">₺1</div>
                      <div className="text-[9px] text-slate-400 font-bold">1 TL Çekim</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanId('monthly')}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlanId === 'monthly'
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[9px] font-black text-blue-600 uppercase">⚡ Aylık</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">₺299</div>
                      <div className="text-[9px] text-slate-400 font-bold">/ Ay</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanId('yearly')}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlanId === 'yearly'
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[9px] font-black text-indigo-600 uppercase">👑 Yıllık</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">₺2.990</div>
                      <div className="text-[9px] text-slate-400 font-bold">/ Yıl</div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{activePlan.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                        {selectedPlanId === 'test' ? 'PayTR gerçek kart çekim ve fatura doğrulama' : 'Sınırsız yapay zeka & rapor çıktıları'}
                      </p>
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

                {/* FATURA TÜRÜ SEÇİMİ (BİREYSEL / KURUMSAL) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                    Fatura Tipi Seçimi *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBillingType('individual')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        billingType === 'individual'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <User size={15} />
                      <span>Bireysel Fatura</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingType('corporate')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        billingType === 'corporate'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Building2 size={15} />
                      <span>Kurumsal Fatura</span>
                    </button>
                  </div>
                </div>

                {/* FORM INPUTS */}
                <form onSubmit={handleOpenSignatureModal} className="space-y-4">
                  {billingType === 'individual' ? (
                    /* ================= BİREYSEL FATURA ALANLARI ================= */
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            Ad Soyad *
                          </label>
                          {(resolvedUser?.name || resolvedUser?.username) && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              ✓ Profilinizden Alındı
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            T.C. Kimlik Numarası (Zorunlu) *
                          </label>
                          {resolvedUser?.tcNo ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              ✓ Profilde Kayıtlı
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                              ! Fatura İçin Zorunlu
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            required
                            maxLength={11}
                            value={tcNo}
                            onChange={(e) => setTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="11 Haneli T.C. Kimlik Numaranız"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold font-mono"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ================= KURUMSAL FATURA ALANLARI ================= */
                    <>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                          Ticari Şirket Unvanı *
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Örn: ABC İş Sağlığı ve Güvenliği Hizmetleri Ltd. Şti."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                            Vergi Numarası (VKN) *
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                            <input
                              type="text"
                              required
                              maxLength={11}
                              value={taxNumber}
                              onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                              placeholder="10 Haneli Vergi No"
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                            Vergi Dairesi *
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                            <input
                              type="text"
                              required
                              value={taxOffice}
                              onChange={(e) => setTaxOffice(e.target.value)}
                              placeholder="Örn: Beşiktaş V.D."
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ================= ORTAK İLETİŞİM VE ADRES ALANLARI ================= */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        E-Posta Adresi (Fatura ve Lisans İletimi) *
                      </label>
                      {resolvedUser?.isEmailVerified ? (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          ✓ Doğrulanmış Hesap
                        </span>
                      ) : (resolvedUser?.email || email) ? (
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                          ✓ Kayıtlı E-Posta
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          ! Zorunlu
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Örn: iletisim@sirketiniz.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Telefon Numarası (PayTR Doğrulama) *
                      </label>
                      {resolvedUser?.phone ? (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          ✓ Profilinizden Alındı
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          ! Zorunlu
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XXXXXXXXX"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* İL VE İLÇE (YAN YANA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                        İl (Şehir) *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold cursor-pointer appearance-none"
                        >
                          {TURKEY_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                        İlçe *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="Örn: Kadıköy / Çankaya"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                      Açık Fatura Adresi (Cadde, Mahalle, Kapı No) *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Örn: Atatürk Mah. İnönü Cad. No: 12 D: 4"
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
