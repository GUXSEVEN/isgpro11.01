/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, HelpCircle, Star, MessageSquare, ListTodo, Film, 
  Trash2, Plus, Edit2, Save, X, Check, CheckCircle, Mail, Phone, MapPin, 
  RefreshCcw, AlertCircle, Sparkles, FileText, FileEdit, Clock,
  Download, Database, Search, Upload, UserPlus, ShieldAlert, CheckSquare, Sparkle,
  Link as LinkIcon, ExternalLink, PenTool, KeyRound, ShieldCheck, CreditCard, Lock, Copy
} from 'lucide-react';
import { FAQItem, Review, RiskPreset, SiteConfig, ContactMessage, AppRelease, User } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { hashPassword, encryptSensitiveData, decryptSensitiveData } from '../lib/crypto';
import { maskLicenseKey } from '../lib/privacy';
import { deduplicateAndCleanUsers } from '../lib/userUtils';
import { generateLicenseKey, registerGeneratedLicense, LicenseType } from '../lib/licenseUtils';
import SignatureCanvas from './SignatureCanvas';

interface AdminPanelProps {
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: SiteConfig) => void;
  faqs: FAQItem[];
  onUpdateFaqs: (faqs: FAQItem[]) => void;
  reviews: Review[];
  onUpdateReviews: (reviews: Review[]) => void;
  presets: RiskPreset[];
  onUpdatePresets: (presets: RiskPreset[]) => void;
  users?: User[];
  onUpdateUsers?: (users: User[]) => void;
}

export default function AdminPanel({
  siteConfig,
  onUpdateSiteConfig,
  faqs,
  onUpdateFaqs,
  reviews,
  onUpdateReviews,
  presets,
  onUpdatePresets,
  users,
  onUpdateUsers,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'presets' | 'faqs' | 'reviews' | 'messages' | 'releases' | 'database' | 'smtp' | 'signature' | 'paytr'>('content');
  
  // PayTR SanalPOS Durumları & Manuel Giriş
  const [paytrStatus, setPaytrStatus] = useState<{
    configured: boolean;
    merchantId: string;
    merchantKey?: string;
    merchantSalt?: string;
    testMode?: string;
    customDomain?: string;
    hasKey: boolean;
    hasSalt: boolean;
    callbackUrl: string;
    appUrl: string;
  } | null>(null);
  const [paytrMerchantId, setPaytrMerchantId] = useState('');
  const [paytrMerchantKey, setPaytrMerchantKey] = useState('');
  const [paytrMerchantSalt, setPaytrMerchantSalt] = useState('');
  const [paytrTestMode, setPaytrTestMode] = useState('1'); // '1': Test, '0': Production
  const [paytrCustomDomain, setPaytrCustomDomain] = useState('');
  const [paytrLoading, setPaytrLoading] = useState(false);
  const [paytrSaving, setPaytrSaving] = useState(false);
  const [paytrSaveSuccess, setPaytrSaveSuccess] = useState(false);
  const [showPaytrSecrets, setShowPaytrSecrets] = useState(false);
  const [copiedPaytrUrl, setCopiedPaytrUrl] = useState(false);
  
  // PayTR 2. ADIM Callback Test Simülatörü Durumları
  const [paytrTestCallbackRunning, setPaytrTestCallbackRunning] = useState(false);
  const [paytrTestCallbackResult, setPaytrTestCallbackResult] = useState<any>(null);

  const handleRunPaytrTestCallback = async () => {
    setPaytrTestCallbackRunning(true);
    setPaytrTestCallbackResult(null);
    try {
      const res = await fetch('/api/paytr/test-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'yearly', email: 'test@isgpro.com', name: 'Test Kullanıcı' })
      });
      const data = await res.json();
      setPaytrTestCallbackResult(data);
    } catch (err: any) {
      setPaytrTestCallbackResult({ success: false, error: err.message || 'Test bağlantısı kurulamadı.' });
    } finally {
      setPaytrTestCallbackRunning(false);
    }
  };
  
  // Satıcı İmza & Bilgi durumları
  const [sellerName, setSellerName] = useState('İbrahim Coşkun');
  const [sellerSignature, setSellerSignature] = useState('');
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [signatureSaveSuccess, setSignatureSaveSuccess] = useState(false);
  const [showDrawSignatureModal, setShowDrawSignatureModal] = useState(false);

  useEffect(() => {
    fetch('/api/seller-signature')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config) {
          setSellerName(data.config.name || 'İbrahim Coşkun');
          setSellerSignature(data.config.signature || '');
        }
      })
      .catch(err => console.error("Error fetching seller signature:", err));
  }, []);

  const handleSaveSellerSignature = async (nameVal: string, sigVal: string) => {
    setSignatureSaving(true);
    try {
      const res = await fetch('/api/seller-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, signature: sigVal })
      });
      if (res.ok) {
        setSellerName(nameVal);
        setSellerSignature(sigVal);
        setSignatureSaveSuccess(true);
        setTimeout(() => setSignatureSaveSuccess(false), 3000);
      } else {
        alert('Satıcı imza bilgileri kaydedilirken bir hata oluştu.');
      }
    } catch (err) {
      console.error("Error saving seller signature:", err);
      alert('Sunucu bağlantı hatası oluştu.');
    } finally {
      setSignatureSaving(false);
    }
  };
  
  // Content edit states
  const [videoUrl, setVideoUrl] = useState(siteConfig.videoUrl);
  const [kurulumVideoUrl, setKurulumVideoUrl] = useState(siteConfig.kurulumVideoUrl || '');
  const [heroTitle, setHeroTitle] = useState(siteConfig.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(siteConfig.heroSubtitle);
  const [contactEmail, setContactEmail] = useState(siteConfig.contactEmail);
  const [contactPhone, setContactPhone] = useState(siteConfig.contactPhone);
  const [contactAddress, setContactAddress] = useState(siteConfig.contactAddress);
  const [kanunLink, setKanunLink] = useState(siteConfig.kanunLink || '');
  const [yonetmelikLink, setYonetmelikLink] = useState(siteConfig.yonetmelikLink || '');
  const [contentSuccess, setContentSuccess] = useState(false);

  // SMTP & HTTPS REST Config states
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('İSG Pro');
  const [smtpActive, setSmtpActive] = useState(true);
  const [resendApiKey, setResendApiKey] = useState('');
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testTemplateType, setTestTemplateType] = useState<'general' | 'otp' | 'license' | 'contact' | 'contracts' | 'verification'>('general');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Preset edit states
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetLabel, setPresetLabel] = useState('');
  const [presetText, setPresetText] = useState('');
  const [newPresetOpen, setNewPresetOpen] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetText, setNewPresetText] = useState('');

  // FAQ edit states
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [newFaqOpen, setNewFaqOpen] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // Messages states
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Releases states
  const [appReleases, setAppReleases] = useState<AppRelease[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'pc' | 'apk'>('pc');
  const [releaseVersion, setReleaseVersion] = useState('1.0.0');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseFileName, setReleaseFileName] = useState('isgpro_setup.exe');
  const [releaseFileSize, setReleaseFileSize] = useState('42.5 MB');
  const [releaseFileData, setReleaseFileData] = useState<string | null>(null);
  const [releaseDownloadType, setReleaseDownloadType] = useState<'file' | 'link'>('file');
  const [releaseDownloadUrl, setReleaseDownloadUrl] = useState('');
  const [releaseIsPublished, setReleaseIsPublished] = useState(true);
  const [releaseShowDownloadLinkBox, setReleaseShowDownloadLinkBox] = useState(true);
  const [releaseSuccess, setReleaseSuccess] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  // Local Database states
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<'uzman' | 'hekim' | 'other' | 'admin'>('uzman');
  const [editUserIsPremium, setEditUserIsPremium] = useState(false);
  const [editUserLicenseKey, setEditUserLicenseKey] = useState('');
  const [editUserLicenseType, setEditUserLicenseType] = useState<LicenseType>('yearly');
  const [dbSuccessMessage, setDbSuccessMessage] = useState('');

  // Manual License Assignment Modal states
  const [assignLicenseUser, setAssignLicenseUser] = useState<User | null>(null);
  const [assignLicenseType, setAssignLicenseType] = useState<LicenseType>('yearly');
  const [assignLicenseCustomKey, setAssignLicenseCustomKey] = useState('');

  const generateLicenseCode = (type: LicenseType) => {
    return generateLicenseKey(type);
  };

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const [faqSuccess, setFaqSuccess] = useState(false);

  // Add new user states
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'uzman' | 'hekim' | 'other' | 'admin'>('uzman');
  const [newUserIsPremium, setNewUserIsPremium] = useState(false);
  const [newUserLicenseType, setNewUserLicenseType] = useState<LicenseType>('yearly');

  useEffect(() => {
    if (activeTab === 'releases') {
      fetchReleases();
    } else if (activeTab === 'database') {
      loadUsersFromStorage();
    } else if (activeTab === 'smtp') {
      fetchSMTPConfig();
    } else if (activeTab === 'paytr') {
      fetchPayTRStatus();
    }
  }, [activeTab]);

  const fetchPayTRStatus = async () => {
    setPaytrLoading(true);
    try {
      const response = await fetch('/api/paytr/config-status');
      if (response.ok) {
        const data = await response.json();
        setPaytrStatus(data);
        if (data.merchantId) setPaytrMerchantId(data.merchantId);
        if (data.merchantKey) setPaytrMerchantKey(data.merchantKey);
        if (data.merchantSalt) setPaytrMerchantSalt(data.merchantSalt);
        if (data.testMode !== undefined) setPaytrTestMode(String(data.testMode));
        if (data.customDomain) setPaytrCustomDomain(data.customDomain);
      }
    } catch (err) {
      console.error('Error fetching PayTR status:', err);
    } finally {
      setPaytrLoading(false);
    }
  };

  const handleSavePayTRConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPaytrSaving(true);
    setPaytrSaveSuccess(false);
    try {
      const response = await fetch('/api/paytr/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: paytrMerchantId,
          merchantKey: paytrMerchantKey,
          merchantSalt: paytrMerchantSalt,
          testMode: paytrTestMode,
          customDomain: paytrCustomDomain
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPaytrSaveSuccess(true);
        setTimeout(() => setPaytrSaveSuccess(false), 4500);
        await fetchPayTRStatus();
      } else {
        alert(`Kayıt Başarısız: ${data.error || 'İşlem gerçekleştirilemedi.'}`);
      }
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setPaytrSaving(false);
    }
  };

  const fetchSMTPConfig = async () => {
    try {
      const response = await fetch('/api/smtp-config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setSmtpHost(data.config.host || 'smtp.gmail.com');
          setSmtpPort(Number(data.config.port) || 465);
          setSmtpUser(data.config.user || '');
          setSmtpPass(data.config.pass || '');
          setSmtpFromName(data.config.fromName || 'İSG Pro');
          setSmtpActive(data.config.active !== false);
          setResendApiKey(data.config.resendApiKey || '');
          setGoogleScriptUrl(data.config.googleScriptUrl || '');
        }
      }
    } catch (err) {
      console.error('Error fetching SMTP config:', err);
    }
  };

  const handleSaveSMTPConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpSaveSuccess(false);
    try {
      const response = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          active: smtpActive,
          resendApiKey,
          googleScriptUrl
        })
      });
      if (response.ok) {
        setSmtpSaveSuccess(true);
        setTimeout(() => setSmtpSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'SMTP ayarları kaydedilemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('SMTP sunucusuyla bağlantı kurulamadı.');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!testEmailAddress) {
      alert('Lütfen test e-postası göndermek için geçerli bir e-posta adresi yazın.');
      return;
    }
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const response = await fetch('/api/smtp-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          active: smtpActive,
          resendApiKey,
          googleScriptUrl,
          testEmail: testEmailAddress,
          templateType: testTemplateType
        })
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { success: false, error: response.status === 502 ? 'Sunucu bağlantı yanıt süresi aşıldı.' : 'Sunucudan geçersiz yanıt alındı.' };
      }
      setSmtpTestResult({
        success: response.ok && data.success !== false,
        message: data.message || (data.details ? `${data.error} - ${data.details}` : data.error) || 'Test e-postası gönderilemedi.'
      });
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Bağlantı hatası oluştu.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const fetchReleases = async () => {
    try {
      const res = await fetch('/api/releases');
      if (res.ok) {
        const data = await res.json();
        setAppReleases(data);
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
    }
  };

  useEffect(() => {
    const rel = appReleases.find(r => r.platform === selectedPlatform);
    if (rel) {
      setReleaseVersion(rel.version);
      setReleaseNotes(rel.releaseNotes);
      setReleaseFileName(rel.fileName);
      setReleaseFileSize(rel.fileSize);
      setReleaseFileData(null);
      setReleaseDownloadType(rel.downloadType || 'file');
      setReleaseDownloadUrl(rel.downloadUrl || '');
      setReleaseIsPublished(rel.isPublished === true);
      setReleaseShowDownloadLinkBox(rel.showDownloadLinkBox !== false);
    } else {
      setReleaseVersion('1.0.0');
      setReleaseNotes('');
      setReleaseFileName(selectedPlatform === 'pc' ? 'isgpro_setup.exe' : 'isgpro_v1.apk');
      setReleaseFileSize(selectedPlatform === 'pc' ? '42.5 MB' : '18.2 MB');
      setReleaseFileData(null);
      setReleaseDownloadType(selectedPlatform === 'apk' ? 'link' : 'file');
      setReleaseDownloadUrl(selectedPlatform === 'apk' ? 'https://drive.google.com/file/d/1HWSxVBGdkboC5NY0n3hiSbd3bZ_RHGY5/view?usp=sharing' : '');
      setReleaseIsPublished(selectedPlatform === 'pc' ? false : true);
      setReleaseShowDownloadLinkBox(true);
    }
  }, [selectedPlatform, appReleases]);

  useEffect(() => {
    if (users && users.length > 0) {
      setDbUsers(deduplicateAndCleanUsers(users));
    }
  }, [users]);

  const loadUsersFromStorage = async () => {
    if (users && users.length > 0) {
      const cleaned = deduplicateAndCleanUsers(users);
      setDbUsers(cleaned);
    }

    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const cloudUsers: User[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as User;
          if (data && (data.username || data.email)) {
            cloudUsers.push(data);
          }
        });
        if (cloudUsers.length > 0) {
          const cleaned = deduplicateAndCleanUsers(cloudUsers);
          setDbUsers(cleaned);
          if (onUpdateUsers) {
            onUpdateUsers(cleaned);
          }
          localStorage.setItem('isg_landing_users_v1', JSON.stringify(cleaned));
          localStorage.setItem('isg_users_db', JSON.stringify(cleaned));
        }
      } catch (err) {
        console.warn("Error fetching users from Firestore:", err);
      }
    }
  };

  const saveUsersToStorage = async (updatedUsers: User[]) => {
    const cleaned = deduplicateAndCleanUsers(updatedUsers);
    setDbUsers(cleaned);
    if (onUpdateUsers) {
      onUpdateUsers(cleaned);
    }
    try {
      localStorage.setItem('isg_landing_users_v1', JSON.stringify(cleaned));
      localStorage.setItem('isg_users_db', JSON.stringify(cleaned));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error saving users to local storage:', e);
    }

    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const currentFirestoreUsers: User[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as User;
          if (data) currentFirestoreUsers.push(data);
        });

        const deletedUsers = currentFirestoreUsers.filter(pu => 
          !cleaned.some(uu => 
            uu.username.toLowerCase() === pu.username.toLowerCase() ||
            (uu.email && pu.email && uu.email.toLowerCase() === pu.email.toLowerCase())
          )
        );
        
        for (const u of deletedUsers) {
          if (u.username) await deleteDoc(doc(db, 'users', u.username.toLowerCase()));
          if (u.email) await deleteDoc(doc(db, 'users', u.email.toLowerCase()));
        }

        for (const u of cleaned) {
          const usernameKey = (u.username || u.email || '').toLowerCase().trim();
          if (!usernameKey) continue;
          let pwd = u.password;
          if (pwd && !pwd.match(/^[a-f0-9]{64}$/i)) {
            pwd = await hashPassword(pwd);
          }
          const userDoc = { ...u, password: pwd };
          await setDoc(doc(db, 'users', usernameKey), userDoc, { merge: true });
        }
      } catch (err) {
        console.warn("Error syncing users to Firestore:", err);
      }
    }
  };

  const handleDeleteUser = (email: string) => {
    if (email === 'admin@isg.com') {
      alert('Sistem yöneticisi silinemez!');
      return;
    }
    requestConfirm(
      'Kullanıcıyı Sil',
      `${email} e-postasına sahip kullanıcıyı tamamen silmek istediğinize emin misiniz?`,
      () => {
        const updated = dbUsers.filter(u => u.email !== email);
        saveUsersToStorage(updated);
        showDbSuccess('Kullanıcı başarıyla silindi.');
        setConfirmModal(null);
      }
    );
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.email);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserPhone(user.phone);
    setEditUserRole(user.role);
    setEditUserIsPremium(user.isPremium);
    setEditUserLicenseKey(user.licenseKey || '');
    const detectedType = user.licenseType || (user.licenseKey?.startsWith('ISG-M') || user.licenseKey?.includes('-M-') ? 'monthly' : 'yearly');
    setEditUserLicenseType(detectedType as 'monthly' | 'yearly');
  };

  const handleSaveUserEdit = () => {
    if (!editUserName.trim() || !editUserEmail.trim()) {
      alert('Ad soyad ve e-posta zorunludur.');
      return;
    }

    const updated = dbUsers.map(u => {
      if (u.email === editingUserId) {
        const purchaseDate = u.licensePurchasedAt || new Date().toISOString();
        const expiryDate = new Date();
        if (editUserLicenseType === 'trial') {
          expiryDate.setDate(expiryDate.getDate() + 7);
        } else if (editUserLicenseType === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        const finalKey = editUserIsPremium
          ? (editUserLicenseKey.trim() || generateLicenseCode(editUserLicenseType))
          : null;

        if (editUserIsPremium && finalKey) {
          registerGeneratedLicense(finalKey, editUserLicenseType, editUserEmail, purchaseDate, expiryDate.toISOString());
        }

        return {
          ...u,
          name: editUserName,
          email: editUserEmail,
          phone: editUserPhone,
          role: editUserRole,
          isPremium: editUserIsPremium,
          licenseKey: finalKey,
          licenseType: editUserIsPremium ? editUserLicenseType : null,
          licensePurchasedAt: editUserIsPremium ? purchaseDate : null,
          licenseExpiresAt: editUserIsPremium ? expiryDate.toISOString() : null
        };
      }
      return u;
    });

    saveUsersToStorage(updated);
    setEditingUserId(null);
    showDbSuccess('Kullanıcı bilgileri başarıyla güncellendi.');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newUserEmail.trim()) {
      alert('Kullanıcı adı, ad soyad ve e-posta zorunludur.');
      return;
    }

    if (dbUsers.some(u => u.username.toLowerCase() === newUsername.toLowerCase() || u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('Kullanıcı adı veya e-posta zaten mevcut!');
      return;
    }

    const hashedPassword = await hashPassword(newPassword || '123456');

    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date();
    if (newUserLicenseType === 'trial') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else if (newUserLicenseType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const createdKey = newUserIsPremium ? generateLicenseCode(newUserLicenseType) : null;
    if (newUserIsPremium && createdKey) {
      registerGeneratedLicense(createdKey, newUserLicenseType, newUserEmail.trim(), purchaseDate, expiryDate.toISOString());
    }

    const newUser: User = {
      username: newUsername.trim(),
      password: hashedPassword,
      name: newFullName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      isPremium: newUserIsPremium,
      licenseKey: createdKey,
      licenseType: newUserIsPremium ? newUserLicenseType : null,
      licensePurchasedAt: newUserIsPremium ? purchaseDate : null,
      licenseExpiresAt: newUserIsPremium ? expiryDate.toISOString() : null
    };

    const updated = [...dbUsers, newUser];
    saveUsersToStorage(updated);
    
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('uzman');
    setNewUserIsPremium(false);
    setNewUserOpen(false);

    showDbSuccess('Yeni kullanıcı başarıyla eklendi.');
  };

  const showDbSuccess = (msg: string) => {
    setDbSuccessMessage(msg);
    setTimeout(() => setDbSuccessMessage(''), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      users: dbUsers,
      faqs,
      reviews,
      presets,
      siteConfig,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `isgpro_database_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (backup.users && Array.isArray(backup.users)) {
          saveUsersToStorage(backup.users);
          if (backup.faqs) onUpdateFaqs(backup.faqs);
          if (backup.reviews) onUpdateReviews(backup.reviews);
          if (backup.presets) onUpdatePresets(backup.presets);
          if (backup.siteConfig) onUpdateSiteConfig(backup.siteConfig);

          showDbSuccess('Veritabanı yedeği başarıyla geri yüklendi!');
        } else {
          alert('Geçersiz yedek dosyası formatı!');
        }
      } catch (err) {
        alert('Yedek dosyası ayrıştırılamadı.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Dosya boyutu çok büyük! Lütfen 15MB\'tan küçük bir dosya seçin.');
      return;
    }

    setReleaseFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setReleaseFileSize(sizeInMB);

    const reader = new FileReader();
    reader.onload = () => {
      setReleaseFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setReleaseLoading(true);
    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          version: releaseVersion,
          releaseNotes: releaseNotes,
          fileSize: releaseDownloadType === 'file' ? (releaseFileSize || '10 MB') : 'Google Drive',
          fileName: releaseDownloadType === 'file' ? releaseFileName : (selectedPlatform === 'pc' ? 'isgpro_setup.exe' : 'isgpro_v1.apk'),
          fileData: releaseDownloadType === 'file' ? releaseFileData : null,
          downloadType: releaseDownloadType,
          downloadUrl: releaseDownloadUrl,
          isPublished: releaseIsPublished,
          showDownloadLinkBox: releaseShowDownloadLinkBox
        })
      });

      if (res.ok) {
        setReleaseSuccess(true);
        fetchReleases();
        setTimeout(() => setReleaseSuccess(false), 3000);
      } else {
        alert('Dosya güncellenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Error saving release:', err);
      alert('Ağ hatası oluştu.');
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleToggleReleaseSetting = async (platform: 'pc' | 'apk', field: 'isPublished' | 'showDownloadLinkBox', currentValue: boolean) => {
    const newValue = !currentValue;
    try {
      const res = await fetch(`/api/releases/toggle-setting/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: newValue })
      });
      if (res.ok) {
        setAppReleases(prev => prev.map(r => r.platform === platform ? { ...r, [field]: newValue } : r));
      }
    } catch (err) {
      console.error('Error toggling release setting:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch('/api/my-emails?role=admin');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Okundu' | 'Yanıtlandı') => {
    // In-memory update/simulation
    const updated = messages.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMessages(updated);
  };

  const handleDeleteMessage = (id: string) => {
    requestConfirm(
      'Mesajı Sil',
      'Bu mesajı silmek istediğinize emin misiniz?',
      () => {
        const updated = messages.filter(m => m.id !== id);
        setMessages(updated);
        setConfirmModal(null);
      }
    );
  };

  // Content actions
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteConfig({
      videoUrl,
      kurulumVideoUrl,
      heroTitle,
      heroSubtitle,
      contactEmail,
      contactPhone,
      contactAddress,
      kanunLink,
      yonetmelikLink
    });
    setContentSuccess(true);
    setTimeout(() => setContentSuccess(false), 3000);
  };

  // Preset actions
  const handleStartEditPreset = (preset: RiskPreset) => {
    setEditingPresetId(preset.id);
    setPresetLabel(preset.label);
    setPresetText(preset.text);
  };

  const handleSavePresetEdit = (id: string) => {
    if (!presetLabel.trim() || !presetText.trim()) return;
    const updated = presets.map(p => p.id === id ? { ...p, label: presetLabel, text: presetText } : p);
    onUpdatePresets(updated);
    setEditingPresetId(null);
  };

  const handleDeletePreset = (id: string) => {
    requestConfirm(
      'Şablonu Sil',
      'Bu İSG çalışma şablonunu silmek istediğinize emin misiniz?',
      () => {
        const updated = presets.filter(p => p.id !== id);
        onUpdatePresets(updated);
        setConfirmModal(null);
      }
    );
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetLabel.trim() || !newPresetText.trim()) return;
    const newPreset: RiskPreset = {
      id: `preset-${Date.now()}`,
      label: newPresetLabel.trim(),
      text: newPresetText.trim()
    };
    onUpdatePresets([...presets, newPreset]);
    setNewPresetLabel('');
    setNewPresetText('');
    setNewPresetOpen(false);
  };

  // FAQ actions
  const handleStartEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
  };

  const handleSaveFaqEdit = (id: string) => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    const updated = faqs.map(f => f.id === id ? { ...f, question: faqQuestion, answer: faqAnswer } : f);
    onUpdateFaqs(updated);
    setEditingFaqId(null);
    setFaqSuccess(true);
    setTimeout(() => setFaqSuccess(false), 3000);
  };

  const handleDeleteFaq = (id: string) => {
    requestConfirm(
      'Soruyu Sil',
      'Bu S.S.S sorusunu silmek istediğinize emin misiniz?',
      () => {
        const updated = faqs.filter(f => f.id !== id);
        onUpdateFaqs(updated);
        setConfirmModal(null);
        setFaqSuccess(true);
        setTimeout(() => setFaqSuccess(false), 3000);
      }
    );
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim()
    };
    onUpdateFaqs([...faqs, newFaq]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqOpen(false);
    setFaqSuccess(true);
    setTimeout(() => setFaqSuccess(false), 3000);
  };

  // Review actions
  const handleDeleteReview = (id: string) => {
    requestConfirm(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinize emin misiniz?',
      () => {
        const updated = reviews.filter(r => r.id !== id);
        onUpdateReviews(updated);
        setConfirmModal(null);
      }
    );
  };

  const handleApproveReview = (id: string) => {
    const updated = reviews.map(r => r.id === id ? { ...r, isApproved: true } : r);
    onUpdateReviews(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-full mb-1 border border-red-200/50 dark:border-red-900/30">
            <Settings size={12} /> YÖNETİM PANELİ
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">İSG Pro Sistem Yönetimi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Sitedeki tüm tanıtım metinlerini, videoları, şablonları, yorumları ve sıkça sorulan soruları buradan dinamik olarak düzenleyebilirsiniz.</p>
        </div>
        <div className="text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Yönetici Oturumu Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'content'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Film size={16} />
            <span>Tanıtım & İletişim</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <ListTodo size={16} />
            <span>İSG Çalışma Şablonları</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <HelpCircle size={16} />
            <span>Sıkça Sorulan Sorular</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <MessageSquare size={16} />
            <span>Kullanıcı Değerlendirmeleri</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Mail size={16} />
            <span>Gelen Destek Mesajları</span>
          </button>

          <button
            onClick={() => setActiveTab('releases')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'releases'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Download size={16} />
            <span>Uygulama Dosyaları & Güncelleme</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Database size={16} />
            <span>Veritabanı Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'smtp'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Settings size={16} />
            <span>E-Posta Servis Ayarları</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'signature'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <PenTool size={16} />
            <span>Satıcı İmza Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveTab('paytr')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
              activeTab === 'paytr'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <CreditCard size={16} />
            <div className="flex items-center justify-between w-full">
              <span>PayTR SanalPOS Rehberi</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded">3D Secure</span>
            </div>
          </button>
        </div>

        {/* Content Box (9 Columns) */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: CONTENT & CONTACT INFO */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4 mb-2">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Film className="text-indigo-600" size={18} />
                  Tanıtım Videosu & Genel Site Metinleri
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Ana sayfadaki video linkini, başlıkları ve iletişim kanallarını güncelleyebilirsiniz.</p>
              </div>

              {contentSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle size={16} />
                  Site ayarları ve içerikler başarıyla güncellendi!
                </div>
              )}

              <form onSubmit={handleSaveContent} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Tanıtım Videosu Embed URL (YouTube)</label>
                    <input
                      type="url" required
                      value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-[9px] text-slate-400 block font-medium">Lütfen youtube.com/embed/... formatında bir embed linki girdiğinizden emin olun.</span>
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kurulum Kılavuzu & Alan Adı Ayarları Videosu Embed URL (YouTube)</label>
                    <input
                      type="url" required
                      value={kurulumVideoUrl} onChange={e => setKurulumVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-[9px] text-slate-400 block font-medium">Render, Squarespace ve alan adı yönlendirme detaylarını gösteren video bağlantısı.</span>
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Ana Sayfa Hero Başlığı</label>
                    <input
                      type="text" required
                      value={heroTitle} onChange={e => setHeroTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Ana Sayfa Hero Alt Açıklaması</label>
                    <textarea
                      required rows={3}
                      value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Destek E-Posta Adresi</label>
                    <input
                      type="email" required
                      value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">İletişim Telefon No</label>
                    <input
                      type="text" required
                      value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Merkez Ofis Adresi</label>
                    <input
                      type="text" required
                      value={contactAddress} onChange={e => setContactAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">6331 Sayılı İSG Kanunu Bağlantısı (Link)</label>
                    <input
                      type="url" required
                      value={kanunLink} onChange={e => setKanunLink(e.target.value)}
                      placeholder="https://www.mevzuat.gov.tr/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Risk Değerlendirmesi Yönetmeliği Bağlantısı (Link)</label>
                    <input
                      type="url" required
                      value={yonetmelikLink} onChange={e => setYonetmelikLink(e.target.value)}
                      placeholder="https://www.mevzuat.gov.tr/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>Genel Ayarları Kaydet</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: RISK PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ListTodo className="text-indigo-600" size={18} />
                    Çalışma Senaryosu Şablonları
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Yapay zeka deneme alanındaki (Playground) hazır seçim butonlarını yönetin.</p>
                </div>
                <button
                  onClick={() => setNewPresetOpen(!newPresetOpen)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-indigo-200/50 cursor-pointer transition-all active:scale-95"
                >
                  {newPresetOpen ? <X size={14} /> : <Plus size={14} />}
                  <span>{newPresetOpen ? 'Vazgeç' : 'Şablon Ekle'}</span>
                </button>
              </div>

              {/* Add New Preset Form */}
              <AnimatePresence>
                {newPresetOpen && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddPreset}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 overflow-hidden"
                  >
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Yeni Şablon Detayları</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Şablon Kısa Adı (Etiket) *</label>
                          <input
                            type="text" required
                            value={newPresetLabel} onChange={e => setNewPresetLabel(e.target.value)}
                            placeholder="Örn: Forklift Şarj İstasyonu"
                            className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Detaylı İSG Senaryo Metni *</label>
                          <textarea
                            required rows={3}
                            value={newPresetText} onChange={e => setNewPresetText(e.target.value)}
                            placeholder="Örn: Fabrika içerisindeki forklift şarj istasyonunda asit sızıntıları ve havalandırma yetersizliği altında akü şarj işlemi gerçekleştirilecek."
                            className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Şablonu Ekle
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Presets List */}
              <div className="space-y-3">
                {presets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Kayıtlı İSG şablonu bulunmuyor.</p>
                ) : (
                  presets.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-all">
                      {editingPresetId === p.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Etiket</label>
                            <input
                              type="text"
                              value={presetLabel} onChange={e => setPresetLabel(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Detaylı Senaryo</label>
                            <textarea
                              rows={3}
                              value={presetText} onChange={e => setPresetText(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none mt-0.5 resize-none"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingPresetId(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Vazgeç
                            </button>
                            <button
                              onClick={() => handleSavePresetEdit(p.id)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 rounded">
                              {p.label}
                            </span>
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-1">{p.text}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEditPreset(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Şablonu Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Şablonu Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <HelpCircle className="text-indigo-600" size={18} />
                    Sıkça Sorulan Sorular (S.S.S)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Sitenin alt kısmındaki sıkça sorulan sorular akordeon listesini düzenleyin.</p>
                </div>
                {faqSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce shrink-0">
                    <CheckCircle size={14} />
                    Soru listesi güncellendi!
                  </div>
                )}
                <button
                  onClick={() => setNewFaqOpen(!newFaqOpen)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-indigo-200/50 cursor-pointer transition-all active:scale-95"
                >
                  {newFaqOpen ? <X size={14} /> : <Plus size={14} />}
                  <span>{newFaqOpen ? 'Vazgeç' : 'Soru Ekle'}</span>
                </button>
              </div>

              {/* Add New FAQ Form */}
              <AnimatePresence>
                {newFaqOpen && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddFaq}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 overflow-hidden"
                  >
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Yeni FAQ Detayları</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Soru Metni *</label>
                          <input
                            type="text" required
                            value={newFaqQuestion} onChange={e => setNewFaqQuestion(e.target.value)}
                            placeholder="Örn: Platformu internetsiz kullanabilir miyim?"
                            className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Cevap Metni *</label>
                          <textarea
                            required rows={3}
                            value={newFaqAnswer} onChange={e => setNewFaqAnswer(e.target.value)}
                            placeholder="Örn: Evet, tüm yerel veriler tarayıcınızda şifreli olarak saklanır, dolayısıyla internet bağlantınız olmadığında bile çalışmaya devam eder."
                            className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Soruyu Ekle
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* FAQ List */}
              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Kayıtlı S.S.S. bulunmuyor.</p>
                ) : (
                  faqs.map(f => (
                    <div key={f.id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-all">
                      {editingFaqId === f.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Soru</label>
                            <input
                              type="text"
                              value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Cevap</label>
                            <textarea
                              rows={3}
                              value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none mt-0.5 resize-none"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingFaqId(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Vazgeç
                            </button>
                            <button
                              onClick={() => handleSaveFaqEdit(f.id)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Q: {f.question}</h4>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 pl-3 border-l border-slate-200">A: {f.answer}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEditFaq(f)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Soruyu Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(f.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Soruyu Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4 mb-2">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <MessageSquare className="text-indigo-600" size={18} />
                  Kullanıcı Yorumları ve Feedbackler
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Kullanıcıların site genelinde yaptığı puanlamaları onaylayabilir veya silebilirsiniz.</p>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Kullanıcı yorumu bulunmuyor.</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start gap-4 bg-slate-50/20">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{r.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({r.role})</span>
                          <span className="text-[9px] text-slate-400 font-mono ml-2">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={12} 
                              fill={idx < r.rating ? 'currentColor' : 'none'} 
                              className={idx < r.rating ? 'text-amber-500' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 font-semibold italic">"{r.comment}"</p>
                        {r.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <Check size={10} /> ONAYLANMIŞ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 font-extrabold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded animate-pulse">
                            <Clock size={10} /> ONAY BEKLİYOR
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-start">
                        {!r.isApproved && (
                          <button
                            onClick={() => handleApproveReview(r.id)}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <CheckCircle size={12} />
                            Onayla
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Trash2 size={12} />
                          Sil
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT MESSAGES INBOX */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Mail className="text-indigo-600" size={18} />
                    Gelen Destek Mesajları
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Kullanıcıların 'Bizimle İletişime Geçin' formundan gönderdikleri tüm mesajların havuzu.</p>
                </div>
                <button
                  onClick={fetchMessages}
                  disabled={messagesLoading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCcw size={13} className={messagesLoading ? 'animate-spin' : ''} />
                  <span>Yenile</span>
                </button>
              </div>

              {messagesLoading ? (
                <div className="text-center py-12 text-xs text-slate-400">Mesajlar yükleniyor...</div>
              ) : messages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Kayıtlı iletişim/destek mesajı bulunmuyor.</p>
              ) : (
                <div className="space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/30">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{m.name}</h4>
                          <span className="text-[10px] text-indigo-600 font-semibold">{m.email}</span>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(m.sentAt).toLocaleString('tr-TR')}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            m.status === 'Okundu' ? 'bg-blue-100 text-blue-700' :
                            m.status === 'Yanıtlandı' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konu</span>
                        <p className="text-xs font-bold text-slate-800">{m.subject}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mesaj</span>
                        <p className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                          {m.message}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        {m.status === 'Beklemede' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'Okundu')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            Okundu İşaretle
                          </button>
                        )}
                        {m.status !== 'Yanıtlandı' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'Yanıtlandı')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            Yanıtlandı İşaretle
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                        >
                          Mesajı Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: APP RELEASES UPLOAD & VERSION CONTROL */}
          {activeTab === 'releases' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Download className="text-indigo-600" size={18} />
                    Uygulama Dosyaları & Güncelleme
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Sistem kullanıcıları için PC (.exe) ve Android (.apk) paketlerini buraya yükleyip güncelleyin.
                  </p>
                </div>
                <button
                  onClick={fetchReleases}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCcw size={13} />
                  <span>Sürümleri Yenile</span>
                </button>
              </div>

              {releaseSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 flex items-center gap-2.5 font-semibold">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>Sürüm dosyaları ve bilgileri başarıyla sisteme kaydedildi ve yayınlandı!</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Release Form */}
                <form onSubmit={handleSaveRelease} className="lg:col-span-7 bg-slate-50/50 border border-slate-200 rounded-2xl p-6 space-y-5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Upload size={15} className="text-indigo-600" /> Sürüm Yükle / Düzenle
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Hedef Platform</label>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value as 'pc' | 'apk')}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-indigo-600 cursor-pointer"
                      >
                        <option value="pc">Windows PC Masaüstü Sürümü (.exe)</option>
                        <option value="apk">Android Mobil Saha Sürümü (.apk)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Sürüm Numarası</label>
                      <input
                        type="text"
                        value={releaseVersion}
                        onChange={(e) => setReleaseVersion(e.target.value)}
                        placeholder="Örn: 1.0.4"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Download Type selection toggle */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">İndirme Yöntemi / Dosya Kaynağı</label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setReleaseDownloadType('file')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                          releaseDownloadType === 'file'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Upload size={13} />
                        <span>Doğrudan Dosya Yükle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReleaseDownloadType('link')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                          releaseDownloadType === 'link'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <LinkIcon size={13} />
                        <span>Google Drive / Harici Link</span>
                      </button>
                    </div>
                  </div>

                  {releaseDownloadType === 'file' ? (
                    /* Drag and Drop Upload container */
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Dosya Paketi Seçin (Maks 15MB)</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-6 text-center transition-all cursor-pointer relative group">
                        <input
                          type="file"
                          accept={selectedPlatform === 'pc' ? '.exe,.zip,.txt' : '.apk,.txt'}
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload size={24} className="text-slate-400 mx-auto mb-2 group-hover:text-indigo-600 transition-colors" />
                        <p className="text-xs font-black text-slate-800">{releaseFileName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Tıklayın veya dosyayı sürükleyip bırakın (Boyut: {releaseFileSize})
                        </p>
                        {releaseFileData && (
                          <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full mt-2">
                            HAZIR (Yüklenecek)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Google Drive or External Link input field */
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Google Drive veya Harici İndirme Bağlantısı</label>
                      <input
                        type="url"
                        value={releaseDownloadUrl}
                        onChange={(e) => setReleaseDownloadUrl(e.target.value)}
                        placeholder="Örn: https://drive.google.com/file/d/.../view?usp=sharing"
                        required={releaseDownloadType === 'link'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-indigo-600"
                      />
                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5 leading-relaxed">
                        Kullanıcılar sitenizdeki indirme butonuna bastıklarında doğrudan bu Drive bağlantısına veya girdiğiniz URL'ye yönlendirilirler.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Sürüm Güncelleme Notları</label>
                    <textarea
                      value={releaseNotes}
                      onChange={(e) => setReleaseNotes(e.target.value)}
                      placeholder="Yeni eklenen özellikleri, hata düzeltmelerini yazın..."
                      required
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-700 focus:outline-indigo-600"
                    />
                  </div>

                  {/* Settings Toggles for Publication and Link Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-800">
                        Sürüm Yayın Durumu:
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {releaseIsPublished ? 'Yayında (Aktif)' : 'Yayından Kaldırıldı (Pasif)'}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={releaseIsPublished}
                        onChange={(e) => setReleaseIsPublished(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-2 cursor-pointer border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-2 sm:pt-0">
                      <span className="text-xs font-bold text-slate-800">
                        İndirme Link Kutusu:
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {releaseShowDownloadLinkBox ? 'İndirme Sayfasında Göster' : 'İndirme Sayfasında Gizle'}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={releaseShowDownloadLinkBox}
                        onChange={(e) => setReleaseShowDownloadLinkBox(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={releaseLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {releaseLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Dosya Yükleniyor ve Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Sürümü Kaydet ve Dosyayı Güncelle</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Info and current status */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Sistemdeki Sürümler
                    </h4>

                    {appReleases.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Yüklenmiş aktif dosya bulunmuyor. Varsayılan simülasyon dosyaları geçerli.</p>
                    ) : (
                      <div className="space-y-3">
                        {appReleases.map(rel => (
                          <div key={rel.platform} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-block bg-indigo-100 text-indigo-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {rel.platform === 'pc' ? 'Masaüstü (Win)' : 'Android APK'}
                                  </span>
                                  <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    rel.downloadType === 'link' 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {rel.downloadType === 'link' ? 'Dosya Linki' : 'Sunucu Dosyası'}
                                  </span>
                                  <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    rel.isPublished !== false
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {rel.isPublished !== false ? 'Yayında' : 'Yayından Kaldırıldı'}
                                  </span>
                                  <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    rel.showDownloadLinkBox !== false
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {rel.showDownloadLinkBox !== false ? 'Link Kutusu Görünür' : 'Link Kutusu Gizli'}
                                  </span>
                                </div>
                                <h5 className="text-xs font-extrabold text-slate-900">{rel.fileName}</h5>
                                <p className="text-[10px] text-slate-500 font-semibold">
                                  Sürüm: v{rel.version} | Boyut: {rel.fileSize}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-black text-indigo-600 block">{rel.downloadsCount} indirme</span>
                                <span className="text-[8px] text-slate-400 font-mono block mt-0.5">{new Date(rel.updatedAt).toLocaleDateString('tr-TR')}</span>
                              </div>
                            </div>

                            {/* Quick Action Toggles */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleToggleReleaseSetting(rel.platform, 'isPublished', rel.isPublished !== false)}
                                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                                  rel.isPublished !== false
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {rel.isPublished !== false ? 'Yayından Kaldır' : 'Yeniden Yayına Al'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleReleaseSetting(rel.platform, 'showDownloadLinkBox', rel.showDownloadLinkBox !== false)}
                                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                                  rel.showDownloadLinkBox !== false
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                                }`}
                              >
                                {rel.showDownloadLinkBox !== false ? 'Link Kutusunu Gizle' : 'Link Kutusunu Göster'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-2.5">
                    <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-indigo-600" /> Önemli Yönetici Bilgisi
                    </h4>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Sistemimize yüklediğiniz dosyalar sunucumuzda güvenle saklanır. Kullanıcılar ana sayfadaki <strong className="text-indigo-950">"Uygulamayı İndir"</strong> sayfasından bu dosyaları anında çekebilir. Yüklenen .exe veya .apk dosyaları doğrudan indirilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: USER DATABASE & LICENSE MANAGER */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              
              {/* Header section with export and search action */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Database className="text-indigo-600" size={18} />
                    Veritabanı & Lisans Yönetimi
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Sistemdeki kullanıcıların hesap verilerini düzenleyin, lisanslarını bir tıkla iptal edin/yenileyin veya Excel'e aktarın.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportBackup}
                    title="JSON formatında yedek al"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    Yedek Al (JSON)
                  </button>

                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
                    Yedek Yükle
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      const headers = ['Ad Soyad', 'Kullanıcı Adı', 'E-Posta', 'Telefon', 'Rol', 'Premium Lisans', 'Lisans Anahtarı', 'Lisans Tipi'];
                      const rows = dbUsers.map(u => [
                        u.name,
                        u.username,
                        u.email,
                        u.phone,
                        u.role === 'admin' ? 'Yönetici' : u.role === 'uzman' ? 'Uzman' : u.role === 'hekim' ? 'Hekim' : 'Diğer',
                        u.isPremium ? 'Aktif' : 'Pasif',
                        u.licenseKey || '',
                        u.licenseType || ''
                      ]);
                      const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `isgpro_kullanicilar_excel_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showDbSuccess('Hesap bilgileri Excel dosyası (CSV) olarak indirildi!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                  >
                    <FileText size={13} />
                    <span>Excel'e Aktar (.csv)</span>
                  </button>

                  <button
                    onClick={() => setNewUserOpen(!newUserOpen)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                  >
                    <UserPlus size={13} />
                    <span>Yeni Kullanıcı Ekle</span>
                  </button>
                </div>
              </div>

              {dbSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 flex items-center gap-2.5 font-semibold animate-fade-in">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              {/* SEARCH BOX */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Kullanıcı adı, isim, e-posta veya telefon ile anlık ara..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold focus:ring-0 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* NEW USER ADD DRAWER */}
              {newUserOpen && (
                <form onSubmit={handleAddUser} className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-4 shadow-sm relative">
                  <div className="absolute top-4 right-4">
                    <button type="button" onClick={() => setNewUserOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider">Yeni Kullanıcı Hesabı Tanımla</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kullanıcı Adı</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Örn: ahmet12"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Giriş Şifresi</label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Örn: 123456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ad Soyad</label>
                      <input
                        type="text"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="Örn: Ahmet Yılmaz"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">E-Posta Adresi</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Örn: ahmet@mail.com"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Telefon No</label>
                      <input
                        type="text"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="Örn: 5554443322"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Mesleki Rol</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600"
                      >
                        <option value="uzman">A/B/C Sınıfı İSG Uzmanı</option>
                        <option value="hekim">İşyeri Hekimi</option>
                        <option value="other">Diğer Personel / Destek</option>
                        <option value="admin">Sistem Yöneticisi (Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="newUserIsPremium"
                        checked={newUserIsPremium}
                        onChange={(e) => setNewUserIsPremium(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="newUserIsPremium" className="text-xs text-slate-800 font-extrabold cursor-pointer">
                        Bu kullanıcıya doğrudan Premium lisans anahtarı tanımlansın
                      </label>
                    </div>

                    {newUserIsPremium && (
                      <div className="pl-6 pt-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <span className="text-xs font-bold text-slate-600">Lisans Paket Türü:</span>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="radio"
                              name="newUserLicenseType"
                              value="monthly"
                              checked={newUserLicenseType === 'monthly'}
                              onChange={() => setNewUserLicenseType('monthly')}
                              className="text-indigo-600"
                            />
                            <span>Aylık Lisans (1 Ay - Code: ISG-M-...)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="radio"
                              name="newUserLicenseType"
                              value="yearly"
                              checked={newUserLicenseType === 'yearly'}
                              onChange={() => setNewUserLicenseType('yearly')}
                              className="text-indigo-600"
                            />
                            <span>Yıllık Lisans (1 Yıl - Code: ISG-Y-...)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNewUserOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                    >
                      Kullanıcıyı Kaydet
                    </button>
                  </div>
                </form>
              )}

              {/* USER DATABASE INTERACTIVE DATAGRID TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Kullanıcı Detayları</th>
                        <th className="p-4">Mesleki Profil / Rol</th>
                        <th className="p-4">İletişim</th>
                        <th className="p-4">Lisans Durumu</th>
                        <th className="p-4 text-right">Yönetici İşlemleri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                      {dbUsers.filter(u => {
                        const term = searchUserQuery.toLowerCase().trim();
                        if (!term) return true;
                        return (
                          u.name.toLowerCase().includes(term) ||
                          u.username.toLowerCase().includes(term) ||
                          u.email.toLowerCase().includes(term) ||
                          u.phone.includes(term)
                        );
                      }).map(u => {
                        const isEditing = editingUserId === u.email;

                        return (
                          <tr key={u.email} className="hover:bg-slate-50/40 transition-colors">
                            {/* Cell 1: Username & Real Name */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-1.5 max-w-[200px]">
                                  <input
                                    type="text"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                                    placeholder="Ad Soyad"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <h5 className="font-extrabold text-slate-900 text-sm">{u.name}</h5>
                                  <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                                </div>
                              )}
                            </td>

                            {/* Cell 2: Role */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value as any)}
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px]"
                                >
                                  <option value="uzman">İSG Uzmanı</option>
                                  <option value="hekim">İşyeri Hekimi</option>
                                  <option value="other">Diğer Personel</option>
                                  <option value="admin">Yönetici (Admin)</option>
                                </select>
                              ) : (
                                <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                                  u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                  u.role === 'uzman' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  u.role === 'hekim' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {u.role === 'admin' ? 'YÖNETİCİ' :
                                   u.role === 'uzman' ? 'İSG UZMANI' :
                                   u.role === 'hekim' ? 'İŞYERİ HEKİMİ' : 'PERSONEL'}
                                </span>
                              )}
                            </td>

                            {/* Cell 3: Contact */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-1 max-w-[180px]">
                                  <input
                                    type="email"
                                    value={editUserEmail}
                                    onChange={(e) => setEditUserEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold"
                                    placeholder="E-Posta"
                                  />
                                  <input
                                    type="text"
                                    value={editUserPhone}
                                    onChange={(e) => setEditUserPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold"
                                    placeholder="Telefon"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-0.5 text-[11px]">
                                  <div className="text-slate-800 font-bold">{u.email}</div>
                                  <div className="text-slate-400 font-semibold">{u.phone || 'Telefon Yok'}</div>
                                </div>
                              )}
                            </td>

                            {/* Cell 4: License State */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editUserIsPremium}
                                      onChange={(e) => setEditUserIsPremium(e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-[11px] font-extrabold text-slate-800">Premium Lisans</span>
                                  </label>

                                  {editUserIsPremium && (
                                    <div className="space-y-1.5 pt-1">
                                      <div className="flex flex-wrap gap-2 text-[10px]">
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-700">
                                          <input
                                            type="radio"
                                            name={`editLicenseType-${u.email}`}
                                            value="trial"
                                            checked={editUserLicenseType === 'trial'}
                                            onChange={() => {
                                              setEditUserLicenseType('trial');
                                              setEditUserLicenseKey(generateLicenseCode('trial'));
                                            }}
                                          />
                                          <span>Deneme (7 Gün)</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                                          <input
                                            type="radio"
                                            name={`editLicenseType-${u.email}`}
                                            value="monthly"
                                            checked={editUserLicenseType === 'monthly'}
                                            onChange={() => {
                                              setEditUserLicenseType('monthly');
                                              setEditUserLicenseKey(generateLicenseCode('monthly'));
                                            }}
                                          />
                                          <span>Aylık (1 Ay)</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                                          <input
                                            type="radio"
                                            name={`editLicenseType-${u.email}`}
                                            value="yearly"
                                            checked={editUserLicenseType === 'yearly'}
                                            onChange={() => {
                                              setEditUserLicenseType('yearly');
                                              setEditUserLicenseKey(generateLicenseCode('yearly'));
                                            }}
                                          />
                                          <span>Yıllık (1 Yıl)</span>
                                        </label>
                                      </div>

                                      <div className="flex gap-1">
                                        <input
                                          type="text"
                                          value={editUserLicenseKey}
                                          onChange={(e) => setEditUserLicenseKey(e.target.value.toUpperCase())}
                                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-mono text-[10px] uppercase font-bold"
                                          placeholder="Lisans Anahtarı"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setEditUserLicenseKey(generateLicenseCode(editUserLicenseType))}
                                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded"
                                          title="Yeniden Kod Üret"
                                        >
                                          Üret
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {u.isPremium ? (
                                    <>
                                      {u.licenseType === 'monthly' || u.licenseKey?.startsWith('ISG-M') || u.licenseKey?.includes('-M-') ? (
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-extrabold">
                                          <CheckSquare size={12} className="text-indigo-600" />
                                          <span>AKTİF (Aylık Lisans - 1 Ay)</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold">
                                          <CheckSquare size={12} className="text-emerald-600" />
                                          <span>AKTİF (Yıllık Lisans - 1 Yıl)</span>
                                        </div>
                                      )}
                                      <p className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 inline-block max-w-[150px] truncate" title={u.licenseKey || 'SÜRESİZ-YAPAY-ZEKA'}>
                                        {maskLicenseKey(u.licenseKey || 'SÜRESİZ-YAPAY-ZEKA')}
                                      </p>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold">
                                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                      <span>Deneme Sürümü / Pasif</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Cell 5: Actions */}
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={handleSaveUserEdit}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                    >
                                      Kaydet
                                    </button>
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                    >
                                      İptal
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {/* Cancel License directly if active */}
                                    {u.isPremium ? (
                                      <button
                                        onClick={() => {
                                          if (u.email === 'admin@isg.com') {
                                            alert('Sistem yöneticisinin lisansı iptal edilemez!');
                                            return;
                                          }
                                          requestConfirm(
                                            'Lisansı İptal Et',
                                            `${u.name} kullanıcısının Premium lisans yetkisini derhal İPTAL etmek istiyor musunuz?`,
                                            () => {
                                              const updated = dbUsers.map(usr => usr.email === u.email ? { ...usr, isPremium: false, licenseKey: null, licenseType: null } : usr);
                                              saveUsersToStorage(updated);
                                              showDbSuccess(`${u.name} kullanıcısının premium lisans yetkisi iptal edildi.`);
                                              setConfirmModal(null);
                                            }
                                          );
                                        }}
                                        title="Lisansı İptal Et / Yetkileri Al"
                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded-lg cursor-pointer transition-all border border-red-200"
                                      >
                                        Lisansı İptal Et
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setAssignLicenseUser(u);
                                          setAssignLicenseType('yearly');
                                          setAssignLicenseCustomKey(generateLicenseCode('yearly'));
                                        }}
                                        title="Kullanıcıya Aylık veya Yıllık Lisans Tanımla"
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-1 rounded-lg cursor-pointer transition-all border border-emerald-200"
                                      >
                                        Lisans Tanımla
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleStartEditUser(u)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                    >
                                      Düzenle
                                    </button>

                                    <button
                                      onClick={() => handleDeleteUser(u.email)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-1 rounded cursor-pointer"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: SMTP MAIL SERVICE SETTINGS */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4 mb-2">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Mail className="text-indigo-600" size={18} />
                  E-Posta (SMTP) Gönderim Servisi Ayarları
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Sisteminizin otomatik doğrulama kodlarını (OTP), lisans anahtarlarını ve iletişim mesajlarını doğrudan kendi alan adınızdan veya Gmail hesabınızdan göndermesini sağlayın.
                </p>
              </div>

              {smtpSaveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} />
                  SMTP Sunucu Ayarları Başarıyla Kaydedildi!
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* SMTP Configuration Form */}
                <form onSubmit={handleSaveSMTPConfig} className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Sunucu & Kimlik Bilgileri</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smtpActive}
                          onChange={(e) => setSmtpActive(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Servisi Etkinleştir</span>
                      </label>
                    </div>

                    {/* 🚀 HTTPS REST API (Port 443 - Bypasses all Render TCP Port Blocks) */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Tavsiye Edilen (Port 443)</span>
                        <h5 className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-200">HTTPS REST API Göndericisi (Resend & Google)</h5>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                        Render bulut sunucularında klasik TCP 465/587 portları engellendiği için aşağıdaki Resend API Key veya Google Webhook URL'inizi girerek <strong>fiziki e-postanın kutunuza 1 saniyede düşmesini</strong> sağlayabilirsiniz.
                      </p>

                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
                            🔑 Ücretsiz Resend API Key (Port 443 HTTPS REST API)
                          </label>
                          <input
                            type="text"
                            value={resendApiKey}
                            onChange={(e) => setResendApiKey(e.target.value)}
                            placeholder="re_123456789... (resend.com adresinden ücretsiz 15 saniyede alınır)"
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none font-mono focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
                            🔗 Google Webhook REST URL (Port 443 HTTPS REST API)
                          </label>
                          <input
                            type="text"
                            value={googleScriptUrl}
                            onChange={(e) => setGoogleScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none font-mono focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Classic Nodemailer SMTP Section */}
                    <div className="pt-2 space-y-3">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">Klasik Nodemailer SMTP Ayarları (Alternatif)</h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">SMTP Sunucusu (Host)</label>
                          <input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">SMTP Portu</label>
                          <select
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                          >
                            <option value={465}>465 (SSL / Önerilen)</option>
                            <option value={587}>587 (TLS / STARTTLS)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Gönderen E-Posta (Kullanıcı Adı)</label>
                          <input
                            type="email"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="ornek@alanadi.com"
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">E-Posta Şifresi / Uygulama Şifresi</label>
                          <input
                            type="password"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Görünen Gönderici Adı (From Name)</label>
                        <input
                          type="text"
                          value={smtpFromName}
                          onChange={(e) => setSmtpFromName(e.target.value)}
                          placeholder="İSG Pro Destek"
                          className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 mt-6">
                    <button
                      type="submit"
                      disabled={smtpLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {smtpLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                    </button>
                  </div>
                </form>

                {/* Interactive SMTP Deliverability Test */}
                <div className="lg:col-span-5 bg-white border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 mb-2">
                      <Sparkles className="text-yellow-500" size={16} />
                      E-Posta Gönderim Testi
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-4">
                      SMTP ayarlarınızın doğru çalıştığından emin olmak için aşağıdaki alana kendi şahsi e-posta adresinizi girip anında deneme maili tetikleyebilirsiniz.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">E-Posta Şablon Tipi</label>
                        <select
                          value={testTemplateType}
                          onChange={(e) => setTestTemplateType(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none font-bold"
                        >
                          <option value="general">Genel Bağlantı Doğrulama Testi (Standart)</option>
                          <option value="otp">Güvenli Giriş Kodu (OTP) Şablonu</option>
                          <option value="license">Lisans Teslimat Bildirimi Şablonu</option>
                          <option value="contracts">Sözleşmeler Onay Nüshası (Mesafeli Satış + KVKK + Ön Bilgilendirme)</option>
                          <option value="update">E-Posta Güncelleme Bağlantısı Şablonu</option>
                          <option value="verify">E-Posta Doğrulama Kodu & Linki Şablonu</option>
                          <option value="contact">Yeni Destek Talebi Bildirim Şablonu</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Test Alıcı E-Postası</label>
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="ahmet@gmail.com"
                          className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleTestSMTP}
                        disabled={smtpTesting || !testEmailAddress}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {smtpTesting ? 'Test Ediliyor...' : 'Seçili Şablonu Gönder'}
                      </button>
                    </div>

                    {smtpTestResult && (
                      <div className={`mt-4 p-4 rounded-xl border ${
                        smtpTestResult.success 
                          ? 'bg-green-50/50 border-green-200 text-green-800' 
                          : 'bg-red-50/50 border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`mt-0.5 shrink-0 ${smtpTestResult.success ? 'text-green-600' : 'text-red-600'}`} size={16} />
                          <div>
                            <h5 className="font-bold text-xs">
                              {smtpTestResult.success ? 'Bağlantı Başarılı!' : 'Bağlantı Hatası'}
                            </h5>
                            <p className="text-[10px] font-semibold mt-1 break-all select-all font-mono leading-relaxed">
                              {smtpTestResult.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 mt-4">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block mb-1">💡 Gmail için Önemli İpucu:</span>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                      Eğer gönderici olarak bir Gmail hesabı kullanıyorsanız, şahsi şifreniz yerine mutlaka Google hesabınızdan <strong className="text-indigo-950">"2 Adımlı Doğrulama"</strong> sayfasını açıp en alttan bir <strong className="text-indigo-950">"Uygulama Şifresi" (16 haneli)</strong> oluşturup onu şifre alanına yapıştırın.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SELLER SIGNATURE MANAGEMENT */}
          {activeTab === 'signature' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <PenTool className="text-indigo-600 dark:text-indigo-400" size={18} />
                  Satıcı İmzası ve Resmi Sözleşme Bilgileri
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Otomatik e-posta ile gönderilen PDF sözleşmelerin sağ alt köşesinde satıcı (Bireysel Satıcı) olarak yer alacak ad soyad ve dijital imzanızı buradan değiştirebilirsiniz.
                </p>
              </div>

              {signatureSaveSuccess && (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} />
                  Satıcı imza ve unvan bilgileri başarıyla kaydedildi!
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Satıcı Adı Soyadı / Unvanı</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Örn: İbrahim Coşkun"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">PDF sözleşmelerinde Satıcı kısmında bu isim görünecektir.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-2">Mevcut Satıcı Dijital İmzası</label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center min-h-[140px] relative">
                    {sellerSignature ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={sellerSignature} 
                          alt="Satıcı İmzası" 
                          className="max-h-24 object-contain border border-dashed border-slate-300 dark:border-slate-600 bg-white p-2 rounded-lg shadow-sm"
                        />
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={12} /> Kayıtlı Satıcı İmzası Aktif
                        </span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <PenTool className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                        <p className="text-xs text-slate-400 font-semibold">Henüz özel satıcı imzası çizilmedi.</p>
                        <p className="text-[10px] text-slate-400">Özel imza çizilmediğinde sistem varsayılan metin imzasını kullanır.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDrawSignatureModal(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  >
                    <PenTool size={14} />
                    <span>{sellerSignature ? 'İmzayı Yeniden Çiz' : 'Satıcı İmzası Çiz'}</span>
                  </button>

                  {sellerSignature && (
                    <button
                      type="button"
                      onClick={() => {
                        setSellerSignature('');
                        handleSaveSellerSignature(sellerName, '');
                      }}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 size={14} />
                      <span>İmzayı Temizle ve Varsayılana Dön</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={signatureSaving}
                    onClick={() => handleSaveSellerSignature(sellerName, sellerSignature)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 ml-auto"
                  >
                    {signatureSaving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Değişiklikleri Kaydet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: PAYTR SANALPOS REHBERİ */}
          {activeTab === 'paytr' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="text-indigo-600 dark:text-indigo-400" size={20} />
                    PayTR SanalPOS Entegrasyon Rehberi ve Kontrol Paneli
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    PayTR Mağaza SanalPOS entegrasyonu, 3D Secure güvenli ödeme ekranı ve otomatik lisans teslimatı için adım adım kullanım kılavuzu.
                  </p>
                </div>

                <button
                  onClick={fetchPayTRStatus}
                  disabled={paytrLoading}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCcw size={14} className={paytrLoading ? 'animate-spin' : ''} />
                  <span>Durumu Yenile</span>
                </button>
              </div>

              {/* MANUAL PAYTR CREDENTIALS FORM */}
              <form onSubmit={handleSavePayTRConfig} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <KeyRound className="text-indigo-600 dark:text-indigo-400" size={18} />
                      PayTR Mağaza Bilgileri ve API Anahtarlarını Elle Giriş Yapın
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      PayTR panelinden aldığınız ID, Key ve Salt değerlerini buraya girerek SanalPOS'u anında aktifleştirebilirsiniz.
                    </p>
                  </div>

                  {paytrSaveSuccess && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold animate-fadeIn">
                      <CheckCircle size={14} />
                      <span>Bilgiler Başarıyla Kaydedildi!</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Merchant ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Mağaza Numarası (Merchant ID) <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">Sadece Rakamlar</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={paytrMerchantId}
                      onChange={(e) => setPaytrMerchantId(e.target.value)}
                      placeholder="Örn: 483920"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Test / Production Mode Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      Çalışma Modu (Test / Canlı)
                    </label>
                    <select
                      value={paytrTestMode}
                      onChange={(e) => setPaytrTestMode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="1">🧪 Test Modu (1) - PayTR Sandbox / Deneme İşlemleri</option>
                      <option value="0">🚀 Canlı Mod / Production (0) - Gerçek Kredi Kartı Tahsilatı</option>
                    </select>
                  </div>

                  {/* Merchant Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Mağaza Anahtarı (Merchant Key) <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPaytrSecrets ? "text" : "password"}
                        required
                        value={paytrMerchantKey}
                        onChange={(e) => setPaytrMerchantKey(e.target.value)}
                        placeholder="Örn: xK81jM92PqL5..."
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPaytrSecrets(!showPaytrSecrets)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title={showPaytrSecrets ? "Gizle" : "Göster"}
                      >
                        <Lock size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Merchant Salt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Mağaza Salt Değeri (Merchant Salt) <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPaytrSecrets ? "text" : "password"}
                        required
                        value={paytrMerchantSalt}
                        onChange={(e) => setPaytrMerchantSalt(e.target.value)}
                        placeholder="Örn: m9P1zL34XqW7..."
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPaytrSecrets(!showPaytrSecrets)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title={showPaytrSecrets ? "Gizle" : "Göster"}
                      >
                        <Lock size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Custom Domain (Optional) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Özel Canlı Web Sitesi Domain'i (İsteğe Bağlı)</span>
                      <span className="text-[10px] text-indigo-500 font-bold">Örn: https://www.siteniz.com</span>
                    </label>
                    <input
                      type="text"
                      value={paytrCustomDomain}
                      onChange={(e) => setPaytrCustomDomain(e.target.value)}
                      placeholder="Boş bırakılırsa canlı HTTPS preview URL'i otomatik kullanılır (Örn: https://siteniz.com)"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    />
                    <p className="text-[10px] text-slate-400">
                      * PayTR güvenlik kuralları gereği <code className="text-amber-600 dark:text-amber-400">localhost</code> adreslerini kabul etmez. Sistemimiz otomatik olarak canlı HTTPS sunucu adresinizi bildirim URL olarak üretir.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
                    <span>Girdiğiniz PayTR ID ve anahtar değerleri doğrudan sunucu hafızasında ve güvenli Firestore veritabanınızda saklanır.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={paytrSaving}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {paytrSaving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>PayTR Anahtarlarını Kaydet</span>
                  </button>
                </div>
              </form>

              {/* Status Banner */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    SİSTEM DURUMU
                  </span>
                  {paytrStatus?.configured ? (
                    <span className="text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-900/30">
                      <CheckCircle size={14} /> GERÇEK PAYTR API ANAHTARLARI TANIMLI
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-200 dark:border-amber-900/30">
                      <AlertCircle size={14} /> TEST / SIMULATION MODU AKTİF (ANAHTARLAR BEKLENİYOR)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchant ID (Mağaza No)</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200">
                      {paytrStatus?.merchantId || 'Tanımlı Değil'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchant Key</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {paytrStatus?.hasKey ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span>Gizli Anahtar Mutfakta</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Eksik</span>
                      )}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merchant Salt</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {paytrStatus?.hasSalt ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span>Salt Değeri Mutfakta</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Eksik</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Callback URL box */}
                <div className="pt-2">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    PayTR Panelinde Tanımlanacak Bildirim (Callback/OK) URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                      {paytrStatus?.callbackUrl || 'Yükleniyor...'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (paytrStatus?.callbackUrl) {
                          navigator.clipboard.writeText(paytrStatus.callbackUrl);
                          setCopiedPaytrUrl(true);
                          setTimeout(() => setCopiedPaytrUrl(false), 2500);
                        }
                      }}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95"
                    >
                      {copiedPaytrUrl ? (
                        <>
                          <Check size={14} /> Kopyalandı!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> URL'yi Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * PayTR Mağaza Paneli &gt; Ayarlar &gt; Bildirim URL (Postback URL) kısmına bu adresi yapıştırın.
                  </span>
                </div>

                {/* 2. ADIM TEST SIMULATOR CARD */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-500" /> 2. Aşama (Bildirim URL Callback) Ödeme Testi
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PayTR 2. ADIM dökümanındaki HMAC-SHA256 imza doğrulamasını ve düz metin <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">OK</code> yanıtını test modunda anında simüle edin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunPaytrTestCallback}
                      disabled={paytrTestCallbackRunning}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                    >
                      {paytrTestCallbackRunning ? (
                        <>
                          <RefreshCcw size={14} className="animate-spin" /> Test Çalıştırılıyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} /> 2. Aşama Testini Çalıştır
                        </>
                      )}
                    </button>
                  </div>

                  {paytrTestCallbackResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      paytrTestCallbackResult.success
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center gap-1.5">
                          {paytrTestCallbackResult.success ? <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />}
                          {paytrTestCallbackResult.message || paytrTestCallbackResult.error}
                        </span>
                        <span className="font-mono text-[10px] bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded font-extrabold border border-current">
                          test_mode: 1
                        </span>
                      </div>

                      {paytrTestCallbackResult.testDetails && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Test Sipariş No (merchant_oid)</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{paytrTestCallbackResult.testDetails.merchantOid}</span>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">HMAC-SHA256 Imza Doğrulaması</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check size={12} /> {paytrTestCallbackResult.testDetails.hashVerified ? 'Hash Uyumlu & Geçerli' : 'Geçersiz Hash'}
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">PayTR Dönen Yanıt (Response Text)</span>
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{paytrTestCallbackResult.testDetails.expectedResponseText} (HTTP 200 OK)</span>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Üretilen Test Lisans Anahtarı</span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">{paytrTestCallbackResult.testDetails.licenseKey}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STEP BY STEP GUIDE */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500" /> Adım Adım PayTR SanalPOS Entegrasyon Rehberi
                </h4>

                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-black">1</span>
                      <span>PayTR Mağaza Paneline Giriş ve API Anahtarlarını Alın</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-7">
                      PayTR yönetici panelinize (<a href="https://www.paytr.com/magaza" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">www.paytr.com/magaza <ExternalLink size={10} /></a>) giriş yapın. Sol menüdeki <strong>Bilgi &gt; Entegrasyon Bilgileri</strong> sekmesine tıklayın. Orada bulunan <strong>Merchant ID</strong>, <strong>Merchant Key</strong> ve <strong>Merchant Salt</strong> değerlerini görüntüleyin.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-black">2</span>
                      <span>Bildirim URL (Callback URL) Ayarını Yapın</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-7">
                      PayTR Panelinde <strong>Ayarlar &gt; Bildirim URL (Postback URL)</strong> alanına gidin.
                      Müşterinin ödemesi onaylandığında PayTR sunucularının sitemize anında haber verebilmesi için yukarıda kopyaladığınız <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 px-1 py-0.5 rounded font-mono text-[11px] font-bold">{paytrStatus?.callbackUrl || 'https://site-domaininiz.com/api/paytr/callback'}</code> adresini Bildirim URL kısmına kaydedin.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-black">3</span>
                      <span>Anahtarları Projedeki `.env` Dosyasına Ekleyin</span>
                    </div>
                    <div className="pl-7 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                        Anahtarlarınızı projenizin kök dizinindeki <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 px-1 py-0.5 rounded font-mono text-[11px] font-bold">.env</code> dosyasına şu şekilde ekleyin:
                      </p>
                      <div className="bg-slate-900 text-indigo-200 rounded-lg p-3 text-[11px] font-mono select-all overflow-x-auto whitespace-pre">
{`PAYTR_MERCHANT_ID="MAGAZA_ID_BURAYA"
PAYTR_MERCHANT_KEY="MAĞAZA_KEY_BURAYA"
PAYTR_MERCHANT_SALT="MAĞAZA_SALT_BURAYA"`}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-black">4</span>
                      <span>Test Kartları İle Test İşlemi Gerçekleştirin</span>
                    </div>
                    <div className="pl-7 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      <p>Mağazanız PayTR tarafından test modundayken ödeme yaparken aşağıdaki PayTR resmi test kartını kullanabilirsiniz:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">TEST KART NO</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">5443 2300 0000 0000</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">SKT / CVV / SMS KODU</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">12/28 | 123 | SMS: 123456</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-black">5</span>
                      <span>Canlı Moda (Production) Geçiş</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-7">
                      PayTR ekibi web sitenizi ve mesafeli satış sözleşmelerinizi inceleyip canlı mod onayını verdikten sonra, sistemimizdeki <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 px-1 py-0.5 rounded font-mono text-[11px] font-bold">test_mode</code> değeri otomatik olarak <code className="bg-slate-100 dark:bg-slate-800 text-emerald-600 px-1 py-0.5 rounded font-mono text-[11px] font-bold">0</code> olarak çalışacak ve gerçek kredi/banka kartlarından tahsilat yapılacaktır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* DRAW SELLER SIGNATURE MODAL */}
      <AnimatePresence>
        {showDrawSignatureModal && (
          <SignatureCanvas
            onConfirm={(sigData) => {
              setSellerSignature(sigData);
              setShowDrawSignatureModal(false);
              handleSaveSellerSignature(sellerName, sigData);
            }}
            onClose={() => setShowDrawSignatureModal(false)}
            title="Satıcı Dijital İmzası Çiz"
            subtitle="Tüm müşterilere gönderilecek PDF sözleşmelerinde Satıcı alanında yer alacak imzanızı çiziniz."
            signerName={sellerName}
            confirmButtonText="Satıcı İmzası Olarak Kaydet"
            strokeColor="#1d4ed8"
          />
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle size={24} />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-red-600/10"
                >
                  Onayla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUEL LİSANS TANIMLAMA MODALI (AYLIK / YILLIK SEÇİMLİ) */}
      <AnimatePresence>
        {assignLicenseUser && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Manuel Lisans Tanımla</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">{assignLicenseUser.name} ({assignLicenseUser.email})</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignLicenseUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    1. Hangi Lisans Türü Tanımlansın?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignLicenseType('trial');
                        setAssignLicenseCustomKey(generateLicenseCode('trial'));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        assignLicenseType === 'trial'
                          ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 dark:text-amber-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Deneme</span>
                        <span className="text-[8px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-black px-1 py-0.5 rounded">7 Gün</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                        Önek: <code className="font-mono font-bold text-amber-600">ISG-T-</code>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignLicenseType('monthly');
                        setAssignLicenseCustomKey(generateLicenseCode('monthly'));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        assignLicenseType === 'monthly'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Aylık</span>
                        <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-black px-1 py-0.5 rounded">1 Ay</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                        Önek: <code className="font-mono font-bold text-indigo-600">ISG-M-</code>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignLicenseType('yearly');
                        setAssignLicenseCustomKey(generateLicenseCode('yearly'));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        assignLicenseType === 'yearly'
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Yıllık</span>
                        <span className="text-[8px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black px-1 py-0.5 rounded">1 Yıl</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                        Önek: <code className="font-mono font-bold text-emerald-600">ISG-Y-</code>
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      2. Üretilen Lisans Anahtarı
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {assignLicenseType === 'trial' ? '7 Günlük Kod' : assignLicenseType === 'monthly' ? 'Aylık Kod' : 'Yıllık Kod'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={assignLicenseCustomKey}
                      onChange={(e) => setAssignLicenseCustomKey(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAssignLicenseCustomKey(generateLicenseCode(assignLicenseType))}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Yeni Rastgele Kodu Üret"
                    >
                      Yenile
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignLicenseUser(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!assignLicenseUser) return;
                    const purchaseDate = new Date().toISOString();
                    const expiryDate = new Date();
                    if (assignLicenseType === 'trial') {
                      expiryDate.setDate(expiryDate.getDate() + 7);
                    } else if (assignLicenseType === 'monthly') {
                      expiryDate.setMonth(expiryDate.getMonth() + 1);
                    } else {
                      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    }

                    const key = assignLicenseCustomKey.trim() || generateLicenseCode(assignLicenseType);
                    registerGeneratedLicense(key, assignLicenseType, assignLicenseUser.email, purchaseDate, expiryDate.toISOString());

                    const updated = dbUsers.map(usr => 
                      usr.email === assignLicenseUser.email 
                        ? {
                            ...usr,
                            isPremium: true,
                            licenseKey: key,
                            licenseType: assignLicenseType,
                            licensePurchasedAt: purchaseDate,
                            licenseExpiresAt: expiryDate.toISOString()
                          } 
                        : usr
                    );

                    saveUsersToStorage(updated);
                    showDbSuccess(`${assignLicenseUser.name} kullanıcısına ${assignLicenseType === 'trial' ? '7 Günlük Deneme' : assignLicenseType === 'monthly' ? 'Aylık (1 Ay)' : 'Yıllık (1 Yıl)'} lisans (${key}) tanımlandı.`);
                    setAssignLicenseUser(null);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  <span>Lisansı Etkinleştir ve Kaydet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
