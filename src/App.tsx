/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, LayoutGrid, Sparkles, Building2, User, KeyRound, 
  CreditCard, Mail, Phone, Lock, HeartHandshake, ArrowUp, Star, X, MapPin 
} from 'lucide-react';
import { User as UserType, FAQItem, Review, RiskPreset, SiteConfig } from './types';

// Firebase imports
import { db } from './lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot, deleteDoc, query } from 'firebase/firestore';
import { hashPassword, encryptUser, decryptUser, decryptData, encryptData, getObfuscatedSecret } from './lib/crypto';
import { logActivity } from './lib/activity';

// Component imports
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Playground from './components/Playground';
import Pricing from './components/Pricing';
import Contact from './components/Contact';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Checkout from './components/Checkout';
import FAQ from './components/FAQ';
import Reviews from './components/Reviews';
import AdminPanel from './components/AdminPanel';
import DownloadsPage from './components/DownloadsPage';
import TrialModal from './components/TrialModal';
import InitialLegalConsentModal from './components/InitialLegalConsentModal';
import EmailVerificationModal from './components/EmailVerificationModal';
import { getLicenseTypeFromKey, getLicenseDurationDays, isLicenseActive, getLicensePlanName } from './lib/licenseUtils';
import { deduplicateAndCleanUsers, sanitizeUserForFirestore, normalizeUsername, generateAvailableUsernameSuggestions, checkEmailAccountLimitFromDb } from './lib/userUtils';
import { getGenericLegalText } from './data/legal';

const STORAGE_KEYS = {
  USERS: 'isg_landing_users_v1',
  CURRENT_USER: 'isg_landing_current_user_v1',
};

const INITIAL_USERS: UserType[] = [
  { 
    username: "admin", 
    password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 hash of "password"
    name: getObfuscatedSecret("U2lzdGVtIFnDtm5ldGljaXNp"), 
    email: getObfuscatedSecret("YWRtaW5AaXNnLmNvbQ=="), 
    phone: getObfuscatedSecret("NTU1MTExMjIzMw=="), 
    role: 'admin', 
    isPremium: true,
    licenseKey: getObfuscatedSecret("SVNHLTlNTVctUFZRQi00S1pOLUROTTY="),
    licenseType: 'yearly',
    licensePurchasedAt: '2026-07-06T20:02:45.433Z',
    licenseExpiresAt: '2027-07-06T20:02:45.433Z'
  },
  { 
    username: "ibrahim", 
    password: "bc1583dbd69cf369314be86b8579f367cd17e441986f9131c240015829f044cf", // SHA-256 hash of "147369"
    name: getObfuscatedSecret("aWJyYWhpbQ=="), 
    email: getObfuscatedSecret("aWJyYWhpbWNvc2t1bi5ncy4xOTA1QGdtYWlsLmNvbQ=="), 
    phone: "", 
    role: 'uzman', 
    isPremium: true,
    licenseKey: getObfuscatedSecret("SVNHLVRYWU4tTjJTQi02UEdZLVJMWE8="),
    licenseType: 'yearly',
    licensePurchasedAt: '2026-07-06T14:06:35.291Z',
    licenseExpiresAt: '2027-07-06T14:06:35.291Z'
  },
  { 
    username: "aytul", 
    password: "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0", // SHA-256 hash of "0000"
    name: getObfuscatedSecret("QXl0w7xsIMSwbmNlb8SfbHU="), 
    email: "", 
    phone: "", 
    role: 'other', 
    isPremium: false 
  },
  { 
    username: "fatma", 
    password: "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0", // SHA-256 hash of "0000"
    name: getObfuscatedSecret("RmF0bWEgQXJrdW4="), 
    email: "", 
    phone: "", 
    role: 'other', 
    isPremium: false 
  },
  { 
    username: "ali", 
    password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3", // SHA-256 hash of "123"
    name: getObfuscatedSecret("QWxpIFnEsWxtYXogKMSwR1Up"), 
    email: getObfuscatedSecret("YWxpQGlzZy5jb20="), 
    phone: getObfuscatedSecret("NTU1NDQ0NTU2Ng=="), 
    role: 'uzman', 
    certificateNo: getObfuscatedSecret("MTIzNDUtQQ=="), 
    isPremium: false 
  }
];

export default function App() {
  const [users, setUsers] = useState<UserType[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = (JSON.parse(stored) as UserType[]).map(u => decryptUser(u));
        const hasIbrahim = parsed.some(u => u.username.toLowerCase() === 'ibrahim');
        if (!hasIbrahim) {
          return INITIAL_USERS;
        }
        // Ensure admin password in local storage state is hashed
        const adminIndex = parsed.findIndex(u => u.username.toLowerCase() === 'admin');
        if (adminIndex > -1) {
          const expectedHash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";
          if (parsed[adminIndex].password !== expectedHash) {
            parsed[adminIndex].password = expectedHash;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
          }
        }
        return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = decryptUser(JSON.parse(stored) as UserType);
        if (parsed.password) {
          delete parsed.password;
        }

        // Eğer kullanıcı henüz sözleşmeleri imzalamadıysa veya e-postasını doğrulamadıysa (onboarding yarım kaldıysa),
        // tarayıcı kapatılıp açıldığında veya sayfa yenilendiğinde bu ekranda kilitli kalmaması için
        // oturumu temizle ve ana sayfadan temiz bir şekilde başlat:
        if (parsed.role !== 'admin' && parsed.username !== 'admin') {
          if (!parsed.hasAcceptedLegalTerms || !parsed.isEmailVerified) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            return null;
          }
        }

        // Auto-check expiration for non-admin accounts
        if (parsed.isPremium && parsed.licenseExpiresAt && parsed.role !== 'admin') {
          if (!isLicenseActive(parsed)) {
            parsed.isPremium = false;
          }
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [activeSection, setActiveSection] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isg_dark_mode');
      if (stored) {
        return stored === 'true';
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('isg_dark_mode', String(darkMode));
  }, [darkMode]);

  // Helper to save user to Firestore with password security and full schema compatibility
  const saveUserToFirestore = async (user: UserType) => {
    try {
      const usernameKey = (user.username || user.email || '').toLowerCase().trim();
      if (!usernameKey) return;

      let pwd = user.password;
      if (pwd && !pwd.match(/^[a-f0-9]{64}$/i)) {
        pwd = await hashPassword(pwd);
      }
      
      const userToSave = sanitizeUserForFirestore(user);
      if (pwd) {
        userToSave.password = pwd;
      }

      // 1. Direct Client-side Firestore write
      if (db) {
        const userDocRef = doc(db, 'users', usernameKey);
        await setDoc(userDocRef, userToSave, { merge: true });

        // If user has email registered as separate doc ID in Firestore, clean up duplicate doc
        if (user.email && user.email.toLowerCase().trim() !== usernameKey) {
          const altDocRef = doc(db, 'users', user.email.toLowerCase().trim());
          const altSnap = await getDoc(altDocRef);
          if (altSnap.exists()) {
            await deleteDoc(altDocRef);
          }
        }
      }

      // 2. Server-side dual write guarantee (survives client adblockers / connection drops)
      fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userToSave })
      }).catch(err => console.warn('Server sync user call warning:', err));

    } catch (err) {
      console.error("Error saving user to Firestore:", err);
    }
  };

  // Real-time sync users with Firestore onSnapshot + Deduplication
  useEffect(() => {
    if (!db) return;

    let isSubscribed = true;

    // Bootstrap initial users if database is empty
    const initDb = async () => {
      try {
        const adminDocRef = doc(db, 'users', 'admin');
        const adminSnap = await getDoc(adminDocRef);
        const hashedAdminPassword = await hashPassword('password');

        if (adminSnap.exists()) {
          const adminData = adminSnap.data() as UserType;
          if (adminData.password !== hashedAdminPassword) {
            await setDoc(adminDocRef, { ...adminData, password: hashedAdminPassword }, { merge: true });
          }
        } else {
          for (const u of INITIAL_USERS) {
            const userDocRef = doc(db, 'users', u.username.toLowerCase());
            const hashedPassword = await hashPassword(u.password || '');
            await setDoc(userDocRef, sanitizeUserForFirestore({ ...u, password: hashedPassword }));
          }
        }

        // Ensure all user documents in Firestore are in readable format for admin inspection
        try {
          const allDocsSnap = await getDocs(collection(db, 'users'));
          for (const d of allDocsSnap.docs) {
            const rawData = d.data();
            const isEncryptedRecord = (rawData.name && (String(rawData.name).startsWith('ISGSEC:') || String(rawData.name).startsWith('ENC:v1:'))) ||
                                      (rawData.email && (String(rawData.email).startsWith('ISGSEC:') || String(rawData.email).startsWith('ENC:v1:'))) ||
                                      (rawData.tcNo && (String(rawData.tcNo).startsWith('ISGSEC:') || String(rawData.tcNo).startsWith('ENC:v1:'))) ||
                                      (rawData.phone && (String(rawData.phone).startsWith('ISGSEC:') || String(rawData.phone).startsWith('ENC:v1:'))) ||
                                      (rawData.licenseKey && (String(rawData.licenseKey).startsWith('ISGSEC:') || String(rawData.licenseKey).startsWith('ENC:v1:')));
            if (isEncryptedRecord) {
              const readableData = sanitizeUserForFirestore(decryptUser(rawData));
              await setDoc(doc(db, 'users', d.id), readableData, { merge: true });
              console.log(`[Admin Data Restore] User doc '${d.id}' converted to readable format in database.`);
            }
          }
        } catch (migErr) {
          console.warn('[Admin Data Restore Error]:', migErr);
        }
      } catch (e) {
        console.warn("Firestore init error:", e);
      }
    };
    initDb();

    // Subscribe to Firestore users collection real-time updates
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!isSubscribed) return;
      const rawUsers: UserType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          const dec = decryptUser(data as UserType);
          const resolvedUsername = dec.username || (data as any).username || docSnap.id;
          rawUsers.push({
            ...dec,
            username: resolvedUsername,
            email: dec.email || (data as any).email || ''
          });
        }
      });

      if (rawUsers.length > 0) {
        const localList: UserType[] = (() => {
          try {
            const s = localStorage.getItem(STORAGE_KEYS.USERS) || localStorage.getItem('isg_users_db');
            return s ? (JSON.parse(s) as UserType[]).map(u => decryptUser(u)) : [];
          } catch { return []; }
        })();
        const cleaned = deduplicateAndCleanUsers([...rawUsers, ...localList]);
        setUsers(cleaned);

        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
          localStorage.setItem('isg_users_db', JSON.stringify(cleaned));
        } catch (e) {
          console.warn("LocalStorage save error:", e);
        }

        // Live update logged-in user state (match strictly by username to avoid overwriting distinct accounts)
        if (currentUser) {
          const matching = cleaned.find(
            u => u.username.toLowerCase() === currentUser.username.toLowerCase()
          );
          if (matching) {
            const { password, ...safeUser } = matching;
            setCurrentUser(prev => prev ? { ...prev, ...matching } : matching);
            try {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
            } catch (e) {}
          }
        }
      }
    }, (error) => {
      console.warn("Firestore onSnapshot users error:", error);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUser?.username, currentUser?.email]);

  // Handle URL parameters (Email verification, Unlock Email, & PayTR redirection fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashStr = window.location.hash || '';
    const hashQuery = hashStr.includes('?') ? hashStr.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);
    const unlockEmail = params.get('unlock_email') === 'true' || hashParams.get('unlock_email') === 'true' || hashStr.includes('unlock_email=true');
    if (unlockEmail) {
      setActiveSection('dashboard');
    }

    const verifyEmail = params.get('verify-email');
    if (verifyEmail) {
      if (currentUser) {
        handleUpdateProfile({ email: verifyEmail, isEmailVerified: true });
      }
      alert(`Tebrikler! ${verifyEmail} e-posta adresiniz başarıyla doğrulandı ve hesabınızla eşleştirildi.`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const paytrSuccess = params.get('paytr_success') === 'true' || params.get('paytr_status') === 'success';
    const rawLicense = params.get('license');
    const license = (rawLicense && rawLicense !== 'ISG-PRO-MOCK-LICENSE') ? rawLicense : '';
    const urlUsername = params.get('username');

    if (paytrSuccess) {
      // 1. Ödeme yapan kullanıcıyı KESİNLİKLE tespit et:
      // Eğer URL'de bir kullanıcı adı gelmişse (urlUsername), ASLA admin ile karıştırma ve bu kullanıcıyı bul
      let targetUser: UserType | null = null;
      if (urlUsername && urlUsername.trim()) {
        const cleanTarget = urlUsername.trim().toLowerCase();
        targetUser = users.find(u => u.username.toLowerCase() === cleanTarget) || null;
      }

      if (!targetUser && currentUser) {
        // Eğer urlUsername admin değilse ve currentUser admin ise, admin'e devretme!
        if (!urlUsername || currentUser.username.toLowerCase() === urlUsername.trim().toLowerCase() || currentUser.username !== 'admin') {
          targetUser = currentUser;
        }
      }

      if (!targetUser) {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('isg_active_user') || localStorage.getItem('currentUser');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (!urlUsername || parsed.username?.toLowerCase() === urlUsername.trim().toLowerCase())) {
              targetUser = parsed;
            }
          }
        } catch (_) {}
      }

      if (targetUser && license) {
        const planType = getLicenseTypeFromKey(license);
        const durationDays = getLicenseDurationDays(planType);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const updatedTarget: UserType = {
          ...targetUser,
          isPremium: true,
          licenseKey: license,
          licensePurchasedAt: now.toISOString(),
          licenseExpiresAt: expiresAt.toISOString(),
          licenseType: planType
        };

        // Update in users array
        const updatedUsers = users.map(u => 
          u.username.toLowerCase() === targetUser!.username.toLowerCase() ? updatedTarget : u
        );
        setUsers(updatedUsers);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
          localStorage.setItem('isg_users_db', JSON.stringify(updatedUsers));
        } catch (_) {}

        // Set active user session to targetUser
        setCurrentUser(updatedTarget);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTarget));
          localStorage.setItem('isg_active_user', JSON.stringify(updatedTarget));
          localStorage.setItem('currentUser', JSON.stringify(updatedTarget));
        } catch (_) {}

        // Persist to Firestore
        saveUserToFirestore(updatedTarget).catch(e => console.warn('Save user Firestore error:', e));

        // Direct server sync
        fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: updatedTarget })
        }).catch(err => console.warn('Server sync user call warning:', err));
      }

      // Fatura bildirim e-postasını infoisgpro@gmail.com'a anında ve doğrudan ilet
      try {
        const savedOrderDetails = localStorage.getItem('isg_checkout_order_details');
        const parsedOrder = savedOrderDetails ? JSON.parse(savedOrderDetails) : {};
        const activeOid = params.get('oid') || parsedOrder.orderId || `ISG-${Date.now().toString().slice(-6)}`;
        const activePlanId = params.get('plan') || parsedOrder.planId || 'yearly';
        const activePlanName = activePlanId === 'yearly' ? 'Yıllık Pro Lisans' : (activePlanId === 'test' ? 'Canlı Test Lisansı' : 'Aylık Pro Lisans');
        const activePrice = activePlanId === 'yearly' ? '₺2.990,00' : (activePlanId === 'test' ? '₺1,00' : '₺299,00');

        const billingData = {
          orderId: activeOid,
          planName: parsedOrder.planName || activePlanName,
          price: parsedOrder.price || activePrice,
          billingType: parsedOrder.billingType || (parsedOrder.companyName ? 'corporate' : 'individual'),
          customerName: parsedOrder.name || parsedOrder.fullName || targetUser?.name || targetUser?.username || 'Değerli Müşterimiz',
          customerEmail: parsedOrder.email || targetUser?.email || 'infoisgpro@gmail.com',
          customerPhone: parsedOrder.phone || '',
          customerAddress: parsedOrder.address || parsedOrder.fullAddress || '',
          city: parsedOrder.city || '',
          district: parsedOrder.district || '',
          tcNo: parsedOrder.tcNo || '',
          companyName: parsedOrder.companyName || '',
          taxNumber: parsedOrder.taxNumber || '',
          taxOffice: parsedOrder.taxOffice || '',
          licenseKey: license || parsedOrder.licenseKey || '',
          customerSignature: parsedOrder.userSignature || ''
        };

        // Hem onaylı sözleşmeleri (fatura kartı gömülü) hem de fatura bildirimini eş zamanlı ve garanti gönder
        fetch('/api/send-email-contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...billingData,
            email: billingData.customerEmail,
            name: billingData.customerName,
            phone: billingData.customerPhone,
            address: billingData.customerAddress,
            approvalDate: new Date().toLocaleString('tr-TR')
          })
        }).catch(err => console.warn('[App.tsx paytrSuccess] Contracts fetch error:', err));

        fetch('/api/send-email-billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billingData)
        }).then(r => r.json()).then(res => {
          console.log('[App.tsx paytrSuccess] Billing sent successfully:', res);
        }).catch(err => {
          console.warn('[App.tsx paytrSuccess] Billing fetch error:', err);
        });
      } catch (err) {
        console.warn('[App.tsx paytrSuccess catch]:', err);
      }

      // Yönlendirme: Kullanıcı admin değilse ASLA admin paneline yönlendirme, kullanıcının profiline/dashboard'una yönlendir
      if (targetUser && (targetUser.username === 'admin' || targetUser.role === 'admin') && urlUsername === 'admin') {
        setActiveSection('admin');
      } else {
        setActiveSection('dashboard');
      }

      alert(`Tebrikler, ödemeniz onaylandı ve lisansınız başarıyla aktive edildi!${license ? ` Lisans kodunuz: ${license}` : ''}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const paytrFail = params.get('paytr_fail') === 'true' || params.get('paytr_status') === 'failed';
    if (paytrFail) {
      alert('Ödeme alınamadı. İşleminiz banka provizyon hatası veya kullanıcı iptali sebebiyle tamamlanamadı. Lütfen tekrar deneyiniz.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, users]);
  const [checkoutPlan, setCheckoutPlan] = useState<'monthly' | 'yearly' | 'test' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Dynamic Site Administration states
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const stored = localStorage.getItem('isg_site_config_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.contactEmail === "destek@isgpro.com") parsed.contactEmail = "infoisgpro@gmail.com";
        if (parsed.contactPhone === "+90 (212) 555 4744") parsed.contactPhone = "0551 065 44 88";
        if (parsed.contactAddress === "Teknokent Blok A, Maslak, İstanbul") parsed.contactAddress = "KOCASİNAN MAH. EDİRNE/ MERKEZ";
        if (!parsed.kanunLink) parsed.kanunLink = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6331&MevzuatTur=1&MevzuatTertip=5";
        if (!parsed.yonetmelikLink || parsed.yonetmelikLink === "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16924&MevzuatTur=7&MevzuatTertip=5") {
          parsed.yonetmelikLink = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16925&MevzuatTur=7&MevzuatTertip=5";
        }
        if (!parsed.videoUrl || parsed.videoUrl === "https://www.youtube.com/embed/dQw4w9WgXcQ" || parsed.videoUrl === "https://youtu.be/rn0f9yESCbU?si=5eUBdQ8RJoREVyYb") {
          parsed.videoUrl = "https://www.youtube.com/shorts/tNB7_PMT59U";
        }
        if (!parsed.kurulumVideoUrl || parsed.kurulumVideoUrl === "https://youtu.be/rn0f9yESCbU?si=5eUBdQ8RJoREVyYb") {
          parsed.kurulumVideoUrl = "https://www.youtube.com/shorts/tNB7_PMT59U";
        }
        if (!parsed.promoVideos || !Array.isArray(parsed.promoVideos) || parsed.promoVideos.length === 0) {
          parsed.promoVideos = [
            {
              id: 'vid-1',
              title: 'İSG Pro Genel Tanıtım',
              url: parsed.videoUrl || "https://www.youtube.com/shorts/tNB7_PMT59U",
              description: 'İSG Pro platformunun genel tanıtımı ve özellikleri.'
            }
          ];
        }
        return parsed;
      }
    } catch {}
    return {
      videoUrl: "https://www.youtube.com/shorts/tNB7_PMT59U",
      kurulumVideoUrl: "https://www.youtube.com/shorts/tNB7_PMT59U",
      promoVideos: [
        {
          id: 'vid-1',
          title: 'İSG Pro Genel Tanıtım',
          url: "https://www.youtube.com/shorts/tNB7_PMT59U",
          description: 'İSG Pro platformunun genel tanıtımı ve özellikleri.'
        }
      ],
      heroTitle: "İSG Süreçlerinizi Yapay Zeka Gücüyle Dijitalleştirin",
      heroSubtitle: "Saha risk analizleri, acil durum eylem planları, ekip imzalı kapak sayfaları, detaylı PDF raporları ve online kütüphane entegrasyonu. Hepsi tek bir platformda.",
      contactEmail: "infoisgpro@gmail.com",
      contactPhone: "0551 065 44 88",
      contactAddress: "KOCASİNAN MAH. EDİRNE/ MERKEZ",
      kanunLink: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6331&MevzuatTur=1&MevzuatTertip=5",
      yonetmelikLink: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16925&MevzuatTur=7&MevzuatTertip=5"
    };
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    try {
      const stored = localStorage.getItem('isg_faqs_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'faq-1', question: 'İSG Pro yapay zeka sistemi hangi mevzuatları baz alıyor?', answer: 'Yapay zeka motorumuz, başta 6331 sayılı İş Sağlığı ve Güvenliği Kanunu olmak üzere, Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği ve ilgili tüm alt tebliğleri güncel olarak tarayarak çıktı üretir.' },
      { id: 'faq-2', question: 'Üretilen risk analizi raporları müfettiş denetiminde geçerli midir?', answer: 'Evet, üretilen PDF ve Excel raporları, Çalışma Bakanlığı resmi 5x5 L Tipi ve FK Matris standartlarına %100 uyumludur. İmza alanları, kapak sayfası ve revizyon numarasıyla resmi evrak olarak teslim edilebilir.' },
      { id: 'faq-3', question: 'İnternet bağlantısı olmadan platformu kullanabilir miyim?', answer: 'Giriş ve veri görüntüleme işlemlerinizi tarayıcı önbelleği (Local Cache) sayesinde internetsiz de yapabilirsiniz. Ancak yapay zekayla yeni risk analizi üretmek için internet bağlantısı gerekmektedir.' },
      { id: 'faq-4', question: 'Kurumsal veya OSGB çoklu lisans avantajları nelerdir?', answer: 'OSGB ve çok şubeli firmalar için sınırsız alt uzman hesabı ekleme, merkezi kontrol ve ortak kütüphane paylaşımı sunulur. Yıllık paketlerde %40 tasarruf imkanı vardır.' }
    ];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const stored = localStorage.getItem('isg_reviews_v1');
      if (stored) {
        const parsed: Review[] = JSON.parse(stored);
        // Filter out old initial fake mock reviews
        return parsed.filter(r => !['rev-1', 'rev-2', 'rev-3'].includes(r.id));
      }
    } catch {}
    return [];
  });

  const [presets, setPresets] = useState<RiskPreset[]>(() => {
    try {
      const stored = localStorage.getItem('isg_presets_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'preset-1', label: 'Dış Cephe İskele Sökümü', text: '5. katta dış cephe boya işleri için kurulan demir boru iskelenin söküm faaliyeti gerçekleştirilecek.' },
      { id: 'preset-2', label: 'Sıcak Kaynak İşleri', text: 'Üretim holündeki metal borular için gazaltı kaynak makinesiyle sıcak kaynak işleri yapılacaktır.' },
      { id: 'preset-3', label: 'Dar Alanda Kazı Çalışması', text: 'Fabrika sahası içerisinde 2.5 metre derinliğinde altyapı su hattı için kanal kazısı ve dolgu işleri.' }
    ];
  });

  const [activeLegalModal, setActiveLegalModal] = useState<'mss' | 'iade' | 'privacy' | 'kvkk' | 'teslimat' | null>(null);

  // Load and sync dynamic site components from Firestore on mount
  useEffect(() => {
    const loadDynamicContent = async () => {
      if (!db) return;
      try {
        // 1. Site Config
        const siteConfigDocRef = doc(db, 'site_config', 'default');
        const siteConfigSnap = await getDoc(siteConfigDocRef);
        if (siteConfigSnap.exists()) {
          const cloudConfig = siteConfigSnap.data() as SiteConfig;
          if (cloudConfig.contactEmail === "destek@isgpro.com") cloudConfig.contactEmail = "infoisgpro@gmail.com";
          if (cloudConfig.contactPhone === "+90 (212) 555 4744") cloudConfig.contactPhone = "0551 065 44 88";
          if (cloudConfig.contactAddress === "Teknokent Blok A, Maslak, İstanbul") cloudConfig.contactAddress = "KOCASİNAN MAH. EDİRNE/ MERKEZ";
          if (!cloudConfig.kanunLink) cloudConfig.kanunLink = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6331&MevzuatTur=1&MevzuatTertip=5";
          if (!cloudConfig.yonetmelikLink || cloudConfig.yonetmelikLink === "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16924&MevzuatTur=7&MevzuatTertip=5") {
            cloudConfig.yonetmelikLink = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16925&MevzuatTur=7&MevzuatTertip=5";
          }
          if (!cloudConfig.videoUrl || cloudConfig.videoUrl === "https://www.youtube.com/embed/dQw4w9WgXcQ" || cloudConfig.videoUrl === "https://youtu.be/rn0f9yESCbU?si=5eUBdQ8RJoREVyYb") {
            cloudConfig.videoUrl = "https://www.youtube.com/shorts/tNB7_PMT59U";
          }
          if (!cloudConfig.kurulumVideoUrl || cloudConfig.kurulumVideoUrl === "https://youtu.be/rn0f9yESCbU?si=5eUBdQ8RJoREVyYb") {
            cloudConfig.kurulumVideoUrl = "https://www.youtube.com/shorts/tNB7_PMT59U";
          }
          if (!cloudConfig.promoVideos || !Array.isArray(cloudConfig.promoVideos) || cloudConfig.promoVideos.length === 0) {
            cloudConfig.promoVideos = [
              {
                id: 'vid-1',
                title: 'İSG Pro Genel Tanıtım',
                url: cloudConfig.videoUrl || "https://www.youtube.com/shorts/tNB7_PMT59U",
                description: 'İSG Pro platformunun genel tanıtımı ve özellikleri.'
              }
            ];
          }
          setSiteConfig(cloudConfig);
          localStorage.setItem('isg_site_config_v1', JSON.stringify(cloudConfig));
        } else {
          await setDoc(siteConfigDocRef, siteConfig);
        }

        // 2. FAQs
        const faqsDocRef = doc(db, 'site_config', 'faqs');
        const faqsSnap = await getDoc(faqsDocRef);
        if (faqsSnap.exists()) {
          const data = faqsSnap.data();
          if (data && Array.isArray(data.items)) {
            setFaqs(data.items);
            localStorage.setItem('isg_faqs_v1', JSON.stringify(data.items));
          }
        } else {
          await setDoc(faqsDocRef, { items: faqs });
        }

        // 3. Reviews
        const reviewsDocRef = doc(db, 'site_config', 'reviews');
        const reviewsSnap = await getDoc(reviewsDocRef);
        if (reviewsSnap.exists()) {
          const data = reviewsSnap.data();
          if (data && Array.isArray(data.items)) {
            const cleanReviews = (data.items as Review[]).filter(r => !['rev-1', 'rev-2', 'rev-3'].includes(r.id));
            setReviews(cleanReviews);
            localStorage.setItem('isg_reviews_v1', JSON.stringify(cleanReviews));
          }
        } else {
          await setDoc(reviewsDocRef, { items: reviews });
        }

        // 4. Presets
        const presetsDocRef = doc(db, 'site_config', 'presets');
        const presetsSnap = await getDoc(presetsDocRef);
        if (presetsSnap.exists()) {
          const data = presetsSnap.data();
          if (data && Array.isArray(data.items)) {
            setPresets(data.items);
            localStorage.setItem('isg_presets_v1', JSON.stringify(data.items));
          }
        } else {
          await setDoc(presetsDocRef, { items: presets });
        }
      } catch (err) {
        console.warn("Error loading dynamic content from Firestore:", err);
      }
    };

    loadDynamicContent();
  }, [db]);

  // Firestore & local storage write handlers
  const handleUpdateSiteConfig = async (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    localStorage.setItem('isg_site_config_v1', JSON.stringify(newConfig));
    if (db) {
      try {
        await setDoc(doc(db, 'site_config', 'default'), newConfig);
      } catch (err) {
        console.error("Firestore write siteConfig failed:", err);
      }
    }
  };

  const handleUpdateFaqs = async (newFaqs: FAQItem[]) => {
    setFaqs(newFaqs);
    localStorage.setItem('isg_faqs_v1', JSON.stringify(newFaqs));
    if (db) {
      try {
        await setDoc(doc(db, 'site_config', 'faqs'), { items: newFaqs });
      } catch (err) {
        console.error("Firestore write faqs failed:", err);
      }
    }
  };

  const handleUpdateReviews = async (newReviews: Review[]) => {
    setReviews(newReviews);
    localStorage.setItem('isg_reviews_v1', JSON.stringify(newReviews));
    if (db) {
      try {
        await setDoc(doc(db, 'site_config', 'reviews'), { items: newReviews });
      } catch (err) {
        console.error("Firestore write reviews failed:", err);
      }
    }
  };

  const handleUpdatePresets = async (newPresets: RiskPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('isg_presets_v1', JSON.stringify(newPresets));
    if (db) {
      try {
        await setDoc(doc(db, 'site_config', 'presets'), { items: newPresets });
      } catch (err) {
        console.error("Firestore write presets failed:", err);
      }
    }
  };

  // Monitor scroll for Scroll-to-Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      // Determine active section based on scroll
      const sections = ['home', 'features', 'playground', 'pricing', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync users with localStorage (readable for admin)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Sync currentUser with localStorage for both landing portal and panel (/panel)
  useEffect(() => {
    if (currentUser) {
      const safeUser = { ...currentUser };
      if (safeUser.password) delete safeUser.password;
      
      try {
        // 1. Landing portal storage key
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
        // 2. ISG Panel storage keys (both encrypted and plain active session)
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(safeUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(safeUser)));
        localStorage.setItem('isg_active_user', JSON.stringify(safeUser));
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        localStorage.removeItem('isg_active_user');
        localStorage.removeItem('isg_current_user');
      } catch (e) {}
    }
  }, [currentUser]);

  // Cross-tab / Cross-subsite session synchronization (detects logout or login from /panel)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === STORAGE_KEYS.CURRENT_USER || e.key === 'isg_active_user') {
        if (!e.newValue) {
          setCurrentUser(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            const decUser = decryptUser(parsed);
            if (decUser && (decUser.username || decUser.email)) {
              setCurrentUser(decUser);
            }
          } catch (err) {}
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================
  const [pendingAdminUser, setPendingAdminUser] = useState<UserType | null>(null);

  const handleVerifyAdmin2FA = async (challengeId: string, code: string): Promise<boolean> => {
    if (!pendingAdminUser) {
      throw new Error('Bekleyen yönetici oturumu bulunamadı. Lütfen tekrar giriş yapınız.');
    }
    const res = await fetch('/api/auth/admin-2fa/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, code })
    });
    const data = await res.json();
    if (data.success && data.verified) {
      setCurrentUser(pendingAdminUser);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(pendingAdminUser));
      } catch (e) {}
      logActivity('admin', 'login_2fa_success', { role: 'admin', email: 'infoisgpro@gmail.com' })
        .catch(e => console.error("Error logging admin 2fa activity:", e));
      setPendingAdminUser(null);
      return true;
    } else {
      throw new Error(data.error || 'Doğrulama kodu geçersiz.');
    }
  };

  const handleResendAdmin2FA = async (): Promise<string> => {
    const res = await fetch('/api/auth/admin-2fa/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '2FA kodu gönderilemedi.');
    }
    return data.challengeId;
  };

  const handleLogin = async (usernameInput: string, passwordInput: string): Promise<boolean | { requires2FA: boolean; challengeId: string }> => {
    const usernameKey = normalizeUsername(usernameInput);
    const cleanPass = (passwordInput || '').trim();
    const hashedInput = await hashPassword(cleanPass);

    // 1. Try Firestore first
    if (db) {
      try {
        let userData: UserType | null = null;
        const userDocRef = doc(db, 'users', usernameKey);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          userData = decryptUser(docSnap.data() as UserType);
        } else {
          // Check query in case doc was saved under original case or email
          const q = query(collection(db, 'users'));
          const snap = await getDocs(q);
          const foundDoc = snap.docs.find(d => {
            const data = decryptUser(d.data() as UserType);
            return normalizeUsername(data.username) === usernameKey || 
                   normalizeUsername(d.id) === usernameKey ||
                   (data.email && data.email.toLowerCase().trim() === usernameInput.toLowerCase().trim());
          });
          if (foundDoc) {
            userData = decryptUser(foundDoc.data() as UserType);
          }
        }

        if (userData) {
          // Match hashed password or support encrypted/legacy plaintext passwords
          const decPass = decryptData(userData.password);
          if (
            userData.password === hashedInput || 
            decPass === hashedInput || 
            userData.password === cleanPass || 
            decPass === cleanPass || 
            userData.password === passwordInput
          ) {
            const loggedInUser = { ...userData };
            if (normalizeUsername(loggedInUser.username) === 'admin') {
              loggedInUser.role = 'admin';
              setPendingAdminUser(loggedInUser);
              const res = await fetch('/api/auth/admin-2fa/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              if (!data.success) {
                throw new Error(data.error || 'Admin 2FA kodu gönderilemedi.');
              }
              return { requires2FA: true, challengeId: data.challengeId };
            }
            setCurrentUser(loggedInUser);
            try {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedInUser));
            } catch (e) {}
            // Log successful login
            logActivity(usernameKey, 'login', { role: loggedInUser.role || 'user', email: loggedInUser.email || '' })
              .catch(e => console.error("Error logging login activity:", e));
            return true;
          }
        }
      } catch (err) {
        console.warn("Firestore login failed, falling back to local:", err);
      }
    }

    // 2. Fallback to local storage & state
    const localUsers: UserType[] = (() => {
      try {
        const s = localStorage.getItem(STORAGE_KEYS.USERS) || localStorage.getItem('isg_users_db');
        return s ? (JSON.parse(s) as UserType[]).map(u => decryptUser(u)) : users;
      } catch {
        return users;
      }
    })();

    const found = localUsers.find(
      u => {
        const decLocalPass = decryptData(u.password);
        return (normalizeUsername(u.username) === usernameKey || (u.email && u.email.toLowerCase().trim() === usernameInput.toLowerCase().trim())) &&
               (u.password === hashedInput || decLocalPass === hashedInput || u.password === cleanPass || decLocalPass === cleanPass || u.password === passwordInput);
      }
    );
    if (found) {
      const loggedInUser = { ...found };
      if (normalizeUsername(loggedInUser.username) === 'admin') {
        loggedInUser.role = 'admin';
        setPendingAdminUser(loggedInUser);
        const res = await fetch('/api/auth/admin-2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Admin 2FA kodu gönderilemedi.');
        }
        return { requires2FA: true, challengeId: data.challengeId };
      }
      setCurrentUser(loggedInUser);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedInUser));
      } catch (e) {}
      // Log successful login fallback
      logActivity(usernameKey, 'login', { role: loggedInUser.role || 'user', email: loggedInUser.email || '' })
        .catch(e => console.error("Error logging login activity:", e));
      return true;
    }
    return false;
  };

  const handleRegister = async (newUser: UserType): Promise<{ success: boolean; reason?: string; suggestions?: string[]; message?: string } | boolean> => {
    const usernameKey = normalizeUsername(newUser.username);
    if (!usernameKey || usernameKey.length < 3) {
      return { success: false, reason: 'invalid_username', message: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
    }

    // 0. E-Posta Başına Yıllık En Fazla 2 Doğrulanmış Hesap Kontrolü (Veritabanından)
    if (newUser.email) {
      try {
        const limitCheck = await checkEmailAccountLimitFromDb(newUser.email, usernameKey, users);
        if (!limitCheck.allowed) {
          return {
            success: false,
            reason: 'email_limit_exceeded',
            message: limitCheck.message || 'Bu e-posta adresine bağlı olarak son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.'
          };
        }
      } catch (limitErr) {
        console.warn('Kayıt öncesi e-posta limit kontrolü uyarısı:', limitErr);
      }
    }
    
    // 1. Check local state
    let isTaken = users.some(u => normalizeUsername(u.username) === usernameKey);

    // 2. Check Firestore
    if (!isTaken && db) {
      try {
        const userDocRef = doc(db, 'users', usernameKey);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          isTaken = true;
        } else {
          const q = query(collection(db, 'users'));
          const snap = await getDocs(q);
          if (snap.docs.some(d => normalizeUsername((d.data() as any)?.username) === usernameKey || normalizeUsername(d.id) === usernameKey)) {
            isTaken = true;
          }
        }
      } catch (err) {
        console.warn("Firestore check during registration failed:", err);
      }
    }

    if (isTaken) {
      // Gather all known usernames for suggestion filtering
      const existingList = [...users];
      if (db) {
        try {
          const snap = await getDocs(query(collection(db, 'users')));
          snap.docs.forEach(d => {
            const u = (d.data() as any)?.username || d.id;
            if (u) existingList.push({ username: u } as any);
          });
        } catch (_) {}
      }

      const suggestions = generateAvailableUsernameSuggestions(usernameKey, newUser.name, existingList);
      return {
        success: false,
        reason: 'username_taken',
        suggestions,
        message: `⚠️ "@${usernameKey}" kullanıcı adı sistemde zaten kayıtlı!`
      };
    }

    // Hash password and save
    const hashedPassword = await hashPassword(newUser.password || '');
    const securedUser: UserType = { 
      ...newUser, 
      password: hashedPassword, 
      username: usernameKey,
      hasAcceptedLegalTerms: false,
      isEmailVerified: false,
      createdBy: 'web_register',
      createdAt: new Date().toISOString()
    };

    const updated = deduplicateAndCleanUsers([...users, securedUser]);
    setUsers(updated);
    setCurrentUser(securedUser);
    
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      localStorage.setItem('isg_users_db', JSON.stringify(updated));
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {}

    await saveUserToFirestore(securedUser);

    // Arka planda yöneticiye anlık bildirim e-postası gönder
    try {
      fetch('/api/send-new-user-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUser: {
            ...securedUser,
            createdAt: new Date().toISOString()
          },
          adminEmail: 'infoisgpro@gmail.com'
        })
      }).catch(err => console.warn('New user notification dispatch error:', err));
    } catch (e) {}

    return { success: true };
  };

  const checkUserExists = async (usernameInput: string): Promise<UserType | undefined> => {
    const usernameKey = normalizeUsername(usernameInput);
    if (db) {
      try {
        const userDocRef = doc(db, 'users', usernameKey);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          return decryptUser(docSnap.data() as UserType);
        }
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const match = snap.docs.find(d => {
          const dec = decryptUser(d.data() as UserType);
          return normalizeUsername(dec.username) === usernameKey || 
                 normalizeUsername(d.id) === usernameKey ||
                 (dec.email && dec.email.toLowerCase().trim() === usernameInput.toLowerCase().trim());
        });
        if (match) return decryptUser(match.data() as UserType);
      } catch (err) {
        console.warn("Firestore user lookup failed:", err);
      }
    }
    return users.find(u => normalizeUsername(u.username) === usernameKey || (u.email && u.email.toLowerCase().trim() === usernameInput.toLowerCase().trim()));
  };

  // Password Reset / Account Recovery
  const handleResetPassword = async (usernameOrEmail: string, newPass: string): Promise<boolean> => {
    const usernameKey = normalizeUsername(usernameOrEmail);
    const hashedPassword = await hashPassword(newPass);

    if (db) {
      try {
        const userDocRef = doc(db, 'users', usernameKey);
        await setDoc(userDocRef, { password: hashedPassword }, { merge: true });
      } catch (err) {
        console.warn("Firestore password reset failed:", err);
      }
    }

    const updated = users.map(u => {
      if (normalizeUsername(u.username) === usernameKey || (u.email && u.email.toLowerCase().trim() === usernameOrEmail.toLowerCase().trim())) {
        return { ...u, password: hashedPassword };
      }
      return u;
    });
    setUsers(updated);
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSection('home');
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('isg_active_user');
      localStorage.removeItem('isg_current_user');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // PROFILE UPDATE & TRANSACTION PORTAL
  // ==========================================

  const handleUpdateProfile = async (updatedFields: Partial<UserType>): Promise<any> => {
    if (!currentUser) return { success: false };

    const fields = { ...updatedFields };
    if (fields.password) {
      fields.password = await hashPassword(fields.password);
    }

    const updatedUser = { ...currentUser, ...fields };
    setCurrentUser(updatedUser);

    // Update in users array
    const updatedUsers = users.map(u => 
      u.username.toLowerCase() === currentUser.username.toLowerCase() 
        ? { ...u, ...fields } 
        : u
    );
    setUsers(updatedUsers);

    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('isg_users_db', JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    } catch (e) {}

    await saveUserToFirestore(updatedUser);

    // Log standard profile update (exclude license upgrades which are logged by handleCheckoutSuccess)
    const isLicenseUpgrade = 'isPremium' in fields;
    if (!isLicenseUpgrade) {
      const modifiedFields = Object.keys(fields).filter(k => k !== 'password');
      logActivity(currentUser.username, 'profile_update', {
        modifiedFields
      }).catch(e => console.error("Error logging profile update activity:", e));
    }

    return { success: true };
  };

  const handlePurchaseSelect = (planId: 'monthly' | 'yearly' | 'test') => {
    if (!currentUser) {
      setAuthModalOpen(true);
      alert('Lisans satın alma işlemlerini tamamlamak için lütfen önce üye olun veya giriş yapın.');
      return;
    }
    setCheckoutPlan(planId);
  };

  const handleCheckoutSuccess = (licenseKey: string, checkoutMeta?: any) => {
    if (!currentUser) return;

    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date();
    if (checkoutPlan === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    else if (checkoutPlan === 'test') expiryDate.setDate(expiryDate.getDate() + 30);
    else expiryDate.setMonth(expiryDate.getMonth() + 1);

    const upgradeFields: Partial<UserType> = { 
      isPremium: true, 
      licenseKey, 
      licensePurchasedAt: purchaseDate, 
      licenseExpiresAt: expiryDate.toISOString(),
      licenseType: checkoutPlan as any
    };

    if (checkoutMeta?.tcNo && !currentUser.tcNo) {
      upgradeFields.tcNo = checkoutMeta.tcNo;
    }
    if (checkoutMeta?.phone && !currentUser.phone) {
      upgradeFields.phone = checkoutMeta.phone;
    }

    handleUpdateProfile(upgradeFields);

    // Fallback stored checkout details
    let savedOrderDetails: any = null;
    try {
      const stored = localStorage.getItem('isg_checkout_order_details');
      if (stored) savedOrderDetails = JSON.parse(stored);
    } catch (_) {}

    const targetEmail = checkoutMeta?.email || savedOrderDetails?.email || currentUser.email;
    const targetName = checkoutMeta?.name || savedOrderDetails?.name || currentUser.name || currentUser.username;
    const targetPhone = checkoutMeta?.phone || savedOrderDetails?.phone;
    const targetAddress = checkoutMeta?.fullAddress || checkoutMeta?.address || savedOrderDetails?.fullAddress || savedOrderDetails?.address;
    const targetOrderId = checkoutMeta?.orderId || savedOrderDetails?.orderId || `ISG-TR-${Date.now()}`;
    const targetPlanName = checkoutMeta?.planName || savedOrderDetails?.planName || (checkoutPlan === 'yearly' ? 'Yıllık Premium Plan' : (checkoutPlan === 'test' ? '1 TL Canlı Test Lisansı' : 'Aylık Standart Plan'));
    const targetPrice = checkoutMeta?.price || savedOrderDetails?.price || (checkoutPlan === 'yearly' ? '₺2.990,00' : (checkoutPlan === 'test' ? '₺1,00' : '₺299,00'));
    const savedSig = checkoutMeta?.userSignature || savedOrderDetails?.userSignature || (typeof window !== 'undefined' ? localStorage.getItem('isg_user_signature') || '' : '');

    // Log successful license purchase
    logActivity(currentUser.username, 'license_purchase', {
      planName: targetPlanName,
      licenseKey: licenseKey.substring(0, 8) + '-XXXX-XXXX', // Mask full key for privacy/security
      price: targetPrice,
      purchaseDate,
      expiryDate: expiryDate.toISOString(),
      billingType: checkoutMeta?.billingType || savedOrderDetails?.billingType || 'individual',
      tcNo: checkoutMeta?.tcNo || savedOrderDetails?.tcNo || '',
      companyName: checkoutMeta?.companyName || savedOrderDetails?.companyName || '',
      taxNumber: checkoutMeta?.taxNumber || savedOrderDetails?.taxNumber || '',
      taxOffice: checkoutMeta?.taxOffice || savedOrderDetails?.taxOffice || ''
    }).catch(e => console.error("Error logging purchase activity:", e));

    // Send license confirmation email via secure server API proxy
    if (targetEmail) {
      fetch('/api/send-email-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          licenseKey,
          planName: targetPlanName,
          planType: checkoutPlan === 'yearly' ? 'Yıllık' : (checkoutPlan === 'test' ? 'Canlı Test' : 'Aylık'),
          price: targetPrice,
          purchaseDate,
          expiryDate: expiryDate.toISOString()
        })
      }).catch(err => console.warn('Could not send license email:', err));

      // SADECE TAM SÜRÜME GEÇİLDİĞİNDE (Ödeme sonrası): 6 Nüsha onaylı sözleşmeleri ilet
      fetch('/api/send-email-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          phone: targetPhone,
          address: targetAddress,
          city: checkoutMeta?.city || savedOrderDetails?.city || '',
          district: checkoutMeta?.district || savedOrderDetails?.district || '',
          billingType: checkoutMeta?.billingType || savedOrderDetails?.billingType || 'individual',
          tcNo: checkoutMeta?.tcNo || savedOrderDetails?.tcNo || '',
          companyName: checkoutMeta?.companyName || savedOrderDetails?.companyName || '',
          taxNumber: checkoutMeta?.taxNumber || savedOrderDetails?.taxNumber || '',
          taxOffice: checkoutMeta?.taxOffice || savedOrderDetails?.taxOffice || '',
          orderId: targetOrderId,
          planName: targetPlanName,
          price: targetPrice,
          approvalDate: new Date().toLocaleString('tr-TR'),
          userSignature: savedSig,
          customerSignature: savedSig
        })
      }).catch(err => console.warn('Could not send contracts email:', err));

      // SADECE TAM SÜRÜME GEÇİLDİĞİNDE: Fatura ve yeni sipariş bildirimini anında ilet
      fetch('/api/send-email-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: targetOrderId,
          planName: targetPlanName,
          price: targetPrice,
          billingType: checkoutMeta?.billingType || savedOrderDetails?.billingType || 'individual',
          customerName: targetName,
          customerEmail: targetEmail,
          customerPhone: targetPhone,
          customerAddress: targetAddress,
          city: checkoutMeta?.city || savedOrderDetails?.city || '',
          district: checkoutMeta?.district || savedOrderDetails?.district || '',
          tcNo: checkoutMeta?.tcNo || savedOrderDetails?.tcNo || '',
          companyName: checkoutMeta?.companyName || savedOrderDetails?.companyName || '',
          taxNumber: checkoutMeta?.taxNumber || savedOrderDetails?.taxNumber || '',
          taxOffice: checkoutMeta?.taxOffice || savedOrderDetails?.taxOffice || '',
          licenseKey,
          customerSignature: savedSig
        })
      }).catch(err => console.warn('Could not send billing email:', err));
    } else {
      // User email missing or invalid -> Send email update link and verification email
      const targetEmail = currentUser.email || (currentUser.username.includes('@') ? currentUser.username : 'infoisgpro@gmail.com');
      const origin = window.location.origin;
      const targetUser = currentUser.username;
      fetch('/api/send-email-update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name || currentUser.username,
          email: targetEmail,
          updateLink: `https://isgprotech.com/#dashboard?tab=profile&unlock_email=true&user=${encodeURIComponent(targetUser)}`
        })
      }).catch(err => console.warn('Could not send update link email:', err));

      fetch('/api/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name || currentUser.username,
          email: targetEmail,
          verifyLink: `${origin}/?verify-email=${encodeURIComponent(targetEmail)}`
        })
      }).catch(err => console.warn('Could not send verification email:', err));
    }

    // Smooth return to dashboard view
    setTimeout(() => {
      setCheckoutPlan(null);
      setActiveSection('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2800);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased transition-colors duration-300">
      
      {/* Dynamic Header */}
      {checkoutPlan === null && (
        <Navbar 
          currentUser={currentUser} 
          onLogout={handleLogout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onOpenTrialModal={() => setTrialModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      )}

      {/* Main Container Switching */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* CHECKOUT WIZARD VIEW */}
          {checkoutPlan !== null ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Checkout 
                planId={checkoutPlan}
                onSubmitSuccess={handleCheckoutSuccess}
                onCancel={() => setCheckoutPlan(null)}
                currentUser={currentUser}
              />
            </motion.div>
          ) : activeSection === 'dashboard' && currentUser ? (
            // CUSTOMER PORTAL/DASHBOARD VIEW
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
              />
            </motion.div>
          ) : activeSection === 'downloads' ? (
            // DOWNLOADS PAGE VIEW
            <motion.div
              key="downloads"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DownloadsPage />
            </motion.div>
          ) : activeSection === 'admin' && currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin') ? (
            // SYSTEM ADMIN PANEL VIEW
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel
                siteConfig={siteConfig}
                onUpdateSiteConfig={handleUpdateSiteConfig}
                faqs={faqs}
                onUpdateFaqs={handleUpdateFaqs}
                reviews={reviews}
                onUpdateReviews={handleUpdateReviews}
                presets={presets}
                onUpdatePresets={handleUpdatePresets}
                users={users}
                onUpdateUsers={setUsers}
              />
            </motion.div>
          ) : (
            // SINGLE PAGE MARKETING LANDING VIEW
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              {/* Hero Section */}
              <div id="home" className="pt-2 md:pt-6">
                <Hero 
                  onExploreClick={() => {
                    setActiveSection('pricing');
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  onPlaygroundClick={() => {
                    setActiveSection('playground');
                    document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onTrialClick={() => setTrialModalOpen(true)}
                  siteConfig={siteConfig}
                />
              </div>

              {/* Modular Features */}
              <Features />

              {/* Active AI Playground / Live Demo */}
              <div id="playground">
                <Playground presets={presets} />
              </div>

              {/* Pricing Cards */}
              <Pricing 
                onSelectPlan={handlePurchaseSelect} 
                onOpenTrialModal={() => setTrialModalOpen(true)}
              />

              {/* Support & Contact Form */}
              <Contact 
                currentUserEmail={currentUser?.email} 
                onMailSent={() => {
                  // If logged in, fetch support emails list again
                }}
                siteConfig={siteConfig}
              />

              {/* FAQ Accordion Section */}
              <FAQ faqs={faqs} />

              {/* Reviews & Feedback Section */}
              <Reviews 
                reviews={reviews}
                currentUser={currentUser}
                onAddReview={(newReview) => {
                  handleUpdateReviews([...reviews, newReview]);
                }}
                onOpenAuthModal={() => setAuthModalOpen(true)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* PERSISTENT FOOTER */}
      {checkoutPlan === null && (
        <footer className="bg-slate-900 text-white border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Brand Col */}
              <div className="space-y-4 col-span-1 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-base font-bold text-white">İSG Pro</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Müfettiş denetimlerine tam uyumlu, yapay zeka entegrasyonlu ve A4 resmi şablon çıktı garanti olan İSG yönetim asistanı.
                </p>
              </div>

              {/* Site Links Col */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Hızlı Bağlantılar</h5>
                <ul className="space-y-2 text-xs font-semibold text-slate-400">
                  <li><button onClick={() => { setActiveSection('home'); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Ana Sayfa</button></li>
                  <li><button onClick={() => { setActiveSection('features'); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Özellikler</button></li>
                  <li><button onClick={() => { setActiveSection('playground'); document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">AI Oyun Alanı</button></li>
                  <li><button onClick={() => { setActiveSection('pricing'); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Fiyatlandırma</button></li>
                </ul>
              </div>

              {/* Legal & Compliance Col */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Yasal & Mevzuat</h5>
                <ul className="space-y-2 text-xs font-semibold text-slate-400">
                  <li>
                    <a 
                      href={siteConfig.kanunLink || 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6331&MevzuatTur=1&MevzuatTertip=5'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white cursor-pointer transition-colors block"
                    >
                      6331 Sayılı İSG Kanunu
                    </a>
                  </li>
                  <li>
                    <a 
                      href={siteConfig.yonetmelikLink || 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=16925&MevzuatTur=7&MevzuatTertip=5'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white cursor-pointer transition-colors block"
                    >
                      Risk Değerlendirmesi Yönetmeliği
                    </a>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveLegalModal('mss')} 
                      className="hover:text-white cursor-pointer transition-colors text-left block w-full"
                    >
                      Mesafeli Satış Sözleşmesi
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveLegalModal('iade')} 
                      className="hover:text-white cursor-pointer transition-colors text-left block w-full"
                    >
                      İptal ve İade Koşulları
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveLegalModal('teslimat')} 
                      className="hover:text-white cursor-pointer transition-colors text-left block w-full"
                    >
                      Teslimat ve Kargo Koşulları
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveLegalModal('privacy')} 
                      className="hover:text-white cursor-pointer transition-colors text-left block w-full"
                    >
                      Gizlilik Politikası
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveLegalModal('kvkk')} 
                      className="hover:text-white cursor-pointer transition-colors text-left block w-full"
                    >
                      KVKK Aydınlatma Metni
                    </button>
                  </li>
                </ul>
              </div>

              {/* Support info Col */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Müşteri İlişkileri</h5>
                <div className="space-y-2.5 text-xs font-semibold text-slate-400">
                  <p className="flex items-center gap-2"><Mail size={12} className="text-indigo-400 shrink-0" /> {siteConfig.contactEmail}</p>
                  <p className="flex items-center gap-2"><Phone size={12} className="text-indigo-400 shrink-0" /> {siteConfig.contactPhone}</p>
                  <p className="flex items-start gap-2"><MapPin size={12} className="text-indigo-400 shrink-0 mt-0.5" /> {siteConfig.contactAddress}</p>
                </div>
              </div>

            </div>

            <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 font-semibold flex flex-col sm:flex-row justify-between items-center gap-4">
              <span>© 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.</span>
              <span className="flex items-center gap-1.5"><HeartHandshake size={14} className="text-indigo-500" /> Güvenli saha yönetimi için tasarlandı.</span>
            </div>
          </div>
        </footer>
      )}

      {/* FLOAT SCROLL TO TOP */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-lg shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
            title="Yukarı Çık"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AUTH MODAL DIALOG */}
      <AnimatePresence>
        {authModalOpen && (
          <Auth 
            onClose={() => setAuthModalOpen(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            checkUserExists={checkUserExists}
            onResetPassword={handleResetPassword}
            onVerifyAdmin2FA={handleVerifyAdmin2FA}
            onResendAdmin2FA={handleResendAdmin2FA}
          />
        )}
      </AnimatePresence>

      {/* GENERAL LEGAL MODAL */}
      <AnimatePresence>
        {activeLegalModal && (() => {
          const legalData = getGenericLegalText(activeLegalModal);
          return (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" size={18} />
                    {legalData.title}
                  </h3>
                  <button 
                    onClick={() => setActiveLegalModal(null)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line space-y-3 max-h-[60vh] bg-slate-50/50 dark:bg-slate-950/40">
                  {legalData.content}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveLegalModal(null)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 7-DAY FREE TRIAL REQUEST MODAL */}
      <TrialModal 
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        currentUser={currentUser}
        onActivateSuccess={(key, licenseType, expiresAt) => {
          if (currentUser) {
            handleUpdateProfile({
              isPremium: true,
              licenseKey: key,
              licenseType: licenseType,
              licensePurchasedAt: new Date().toISOString(),
              licenseExpiresAt: expiresAt
            });
          }
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* 1. ADIM: 1 DEFAYA MAHSUS YASAL BİLGİLENDİRME VE DİJİTAL SÖZLEŞME ONAY MODALI (Kayıttan Hemen Sonra) */}
      {currentUser && (currentUser.role !== 'admin' && currentUser.username !== 'admin') && currentUser.hasAcceptedLegalTerms !== true && (
        <InitialLegalConsentModal
          currentUser={currentUser}
          onClose={handleLogout}
          onComplete={async (signature) => {
            const updatedFields: Partial<UserType> = {
              hasAcceptedLegalTerms: true,
              legalAcceptedAt: new Date().toISOString(),
              userSignature: signature
            };
            await handleUpdateProfile(updatedFields);
          }}
        />
      )}

      {/* 2. ADIM: ZORUNLU E-POSTA DOĞRULAMA MODALI (Sözleşmeler onaylandıktan sonra) */}
      {currentUser && (currentUser.role !== 'admin' && currentUser.username !== 'admin') && currentUser.hasAcceptedLegalTerms === true && currentUser.isEmailVerified !== true && (
        <EmailVerificationModal
          isOpen={true}
          currentUser={currentUser}
          onClose={handleLogout}
          onLogout={handleLogout}
          onUpdateEmail={async (newEmail: string) => {
            await handleUpdateProfile({ email: newEmail });
          }}
          onVerified={async () => {
            await handleUpdateProfile({ isEmailVerified: true, emailVerifiedAt: new Date().toISOString() });
          }}
        />
      )}

    </div>
  );
}
