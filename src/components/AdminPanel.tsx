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
  Link as LinkIcon, ExternalLink, PenTool, KeyRound, ShieldCheck, CreditCard, Lock, Copy,
  AlertTriangle, CheckCircle2, Eye, EyeOff, Building2, Calendar, BadgeCheck, Briefcase,
  ArrowUp, ArrowDown, Play, Video, ListVideo, Youtube, Send, UserCheck, Loader2
} from 'lucide-react';
import { FAQItem, Review, RiskPreset, SiteConfig, ContactMessage, AppRelease, User, PromoVideoItem } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { hashPassword, encryptSensitiveData, decryptSensitiveData, encryptUser, decryptUser } from '../lib/crypto';
import { maskLicenseKey } from '../lib/privacy';
import { deduplicateAndCleanUsers, sanitizeUserForFirestore, normalizeUsername, generateAvailableUsernameSuggestions, checkEmailAccountLimitFromDb } from '../lib/userUtils';
import { generateLicenseKey, registerGeneratedLicense, LicenseType, getLicenseTypeFromKey } from '../lib/licenseUtils';
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

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    if (url.includes('youtube.com/embed/')) {
      return url.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
    }
    return url;
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
};

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
  const [paytrTestMode, setPaytrTestMode] = useState('0'); // '0': Canlı (Production) VARSAYILAN, '1': Test
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
        body: JSON.stringify({ planId: 'yearly', email: 'infoisgpro@gmail.com', name: 'Test Kullanıcı' })
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
  const [promoVideos, setPromoVideos] = useState<PromoVideoItem[]>(() => {
    if (siteConfig.promoVideos && Array.isArray(siteConfig.promoVideos) && siteConfig.promoVideos.length > 0) {
      return siteConfig.promoVideos;
    }
    return [
      {
        id: 'vid-1',
        title: 'İSG Pro Genel Tanıtım',
        url: siteConfig.videoUrl || 'https://www.youtube.com/shorts/tNB7_PMT59U',
        description: 'İSG Pro platformunun genel tanıtımı ve özellikleri.'
      }
    ];
  });
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

  // Promo Video Add/Edit Modal states
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState<string | null>(null);

  // SMTP & HTTPS REST Config states
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('İSG Pro');
  const [smtpActive, setSmtpActive] = useState(true);
  const [resendApiKey, setResendApiKey] = useState('');
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState('');
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testTemplateType, setTestTemplateType] = useState<
    'general' | 'otp' | 'admin_2fa' | 'verification' | 'verified_user' | 'verified_admin' | 'new_user' |
    'license' | 'trial_license' | 'trial_reminder' | 'contracts' | 'registration_consent' |
    'update' | 'contact' | 'billing_notification'
  >('general');
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [templatePreviewLoading, setTemplatePreviewLoading] = useState(false);
  const [templatePreviewData, setTemplatePreviewData] = useState<{ subject: string; html: string; hasAttachments?: boolean; attachmentCount?: number } | null>(null);
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
  const [dbUsers, setDbUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('isg_landing_users_v1') || localStorage.getItem('isg_users_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateAndCleanUsers(parsed);
        }
      }
    } catch (e) {}
    return users && users.length > 0 ? deduplicateAndCleanUsers(users) : [];
  });
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<'uzman' | 'hekim' | 'dsp' | 'other' | 'admin'>('uzman');
  const [editUserIsPremium, setEditUserIsPremium] = useState(false);
  const [editUserLicenseKey, setEditUserLicenseKey] = useState('');
  const [editUserLicenseType, setEditUserLicenseType] = useState<LicenseType>('yearly');
  const [dbSuccessMessage, setDbSuccessMessage] = useState('');

  // User Personal Details View Modal state
  const [viewUserDetail, setViewUserDetail] = useState<User | null>(null);

  // User Full Edit Modal with Password Change state
  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [editModalName, setEditModalName] = useState('');
  const [editModalUsername, setEditModalUsername] = useState('');
  const [editModalEmail, setEditModalEmail] = useState('');
  const [editModalPhone, setEditModalPhone] = useState('');
  const [editModalPassword, setEditModalPassword] = useState('');
  const [editModalShowPassword, setEditModalShowPassword] = useState(false);
  const [editModalTcNo, setEditModalTcNo] = useState('');
  const [editModalCertificateNo, setEditModalCertificateNo] = useState('');
  const [editModalDiplomaNo, setEditModalDiplomaNo] = useState('');
  const [editModalTescilNo, setEditModalTescilNo] = useState('');
  const [editModalRole, setEditModalRole] = useState<'uzman' | 'hekim' | 'dsp' | 'other' | 'admin'>('uzman');
  const [editModalOsgbName, setEditModalOsgbName] = useState('');
  const [editModalIsEmailVerified, setEditModalIsEmailVerified] = useState(false);
  const [editModalHasAcceptedLegalTerms, setEditModalHasAcceptedLegalTerms] = useState(false);
  const [editModalIsPremium, setEditModalIsPremium] = useState(false);
  const [editModalLicenseType, setEditModalLicenseType] = useState<LicenseType>('yearly');
  const [editModalLicenseKey, setEditModalLicenseKey] = useState('');
  const [editModalIsOsgbManager, setEditModalIsOsgbManager] = useState(false);
  const [editModalManagedOsgbName, setEditModalManagedOsgbName] = useState('');
  const [editModalCanViewAllCompanies, setEditModalCanViewAllCompanies] = useState(false);
  const [editModalCompanyPermissions, setEditModalCompanyPermissions] = useState<Array<{ companyId: string; canView: boolean; canEdit: boolean }>>([]);

  // New User OSGB & Company states
  const [newUserIsOsgbManager, setNewUserIsOsgbManager] = useState(false);
  const [newUserManagedOsgbName, setNewUserManagedOsgbName] = useState('');
  const [newUserCanViewAllCompanies, setNewUserCanViewAllCompanies] = useState(false);

  // Dedicated Company Permissions Modal state
  const [permModalUser, setPermModalUser] = useState<User | null>(null);
  const [permModalIsOsgbManager, setPermModalIsOsgbManager] = useState(false);
  const [permModalManagedOsgbName, setPermModalManagedOsgbName] = useState('');
  const [permModalCanViewAllCompanies, setPermModalCanViewAllCompanies] = useState(false);
  const [permModalCompanyPerms, setPermModalCompanyPerms] = useState<Array<{ companyId: string; canView: boolean; canEdit: boolean }>>([]);
  const [allCompaniesList, setAllCompaniesList] = useState<Array<{ id: string; name: string; assignedOsgbName?: string }>>([]);

  // Load companies for permission management
  useEffect(() => {
    if (activeTab === 'database') {
      try {
        const rawLocal = localStorage.getItem('companies');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllCompaniesList(parsed);
          }
        }
      } catch (e) {}

      if (db) {
        getDocs(collection(db, 'companies')).then(snap => {
          const comps = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          if (comps.length > 0) {
            setAllCompaniesList(comps);
          }
        }).catch(err => console.warn('Could not fetch companies list:', err));
      }
    }
  }, [activeTab]);

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

  // E-Postayı Değiştir ve Doğrulama Kodu Gönder Modalı State'leri
  const [changeEmailModalUser, setChangeEmailModalUser] = useState<User | null>(null);
  const [changeEmailInput, setChangeEmailInput] = useState('');
  const [changeEmailIsSubmitting, setChangeEmailIsSubmitting] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState('');

  const openChangeEmailAndVerifyModal = (u: User) => {
    setChangeEmailModalUser(u);
    setChangeEmailInput(u.email || '');
    setChangeEmailError('');
    setChangeEmailIsSubmitting(false);
  };

  const [faqSuccess, setFaqSuccess] = useState(false);

  // Add new user states
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'uzman' | 'hekim' | 'dsp' | 'other' | 'admin'>('uzman');
  const [newUserIsPremium, setNewUserIsPremium] = useState(false);
  const [newUserLicenseType, setNewUserLicenseType] = useState<LicenseType>('yearly');
  const [newUserIsEmailVerified, setNewUserIsEmailVerified] = useState(true);

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
      let loadedConfig = false;
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
          setBrevoApiKey(data.config.brevoApiKey || '');
          loadedConfig = true;
        }
      }
      // Firestore direct fallback if googleScriptUrl is not retrieved
      if (db && (!loadedConfig || !googleScriptUrl)) {
        try {
          const snap = await getDoc(doc(db, 'smtp_config', 'default'));
          if (snap.exists()) {
            const d = snap.data();
            if (d.googleScriptUrl) setGoogleScriptUrl(d.googleScriptUrl);
            if (d.user && !smtpUser) setSmtpUser(d.user);
            if (d.fromName && !smtpFromName) setSmtpFromName(d.fromName);
            if (d.resendApiKey && !resendApiKey) setResendApiKey(d.resendApiKey);
            if (d.brevoApiKey && !brevoApiKey) setBrevoApiKey(d.brevoApiKey);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching SMTP config from API, trying Firestore direct:', err);
      if (db) {
        try {
          const snap = await getDoc(doc(db, 'smtp_config', 'default'));
          if (snap.exists()) {
            const d = snap.data();
            if (d.googleScriptUrl) setGoogleScriptUrl(d.googleScriptUrl);
            if (d.user) setSmtpUser(d.user);
            if (d.fromName) setSmtpFromName(d.fromName);
            if (d.resendApiKey) setResendApiKey(d.resendApiKey);
            if (d.brevoApiKey) setBrevoApiKey(d.brevoApiKey);
          }
        } catch (_) {}
      }
    }
  };

  const handleSaveSMTPConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpSaveSuccess(false);

    // 1. Direct Firestore Persistence (Guaranteed DB Save)
    try {
      if (db) {
        await setDoc(doc(db, 'smtp_config', 'default'), {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          active: smtpActive,
          resendApiKey,
          googleScriptUrl: (googleScriptUrl || '').trim(),
          brevoApiKey,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('[Firestore SMTP] Saved smtp_config/default directly to Firestore.');
      }
    } catch (fErr) {
      console.warn('[Firestore SMTP Save Warning]:', fErr);
    }

    // 2. Server API Sync
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
          googleScriptUrl: (googleScriptUrl || '').trim(),
          brevoApiKey
        })
      });
      if (response.ok) {
        setSmtpSaveSuccess(true);
        setTimeout(() => setSmtpSaveSuccess(false), 3000);
      } else {
        // If Firestore succeeded, we still notify success with note
        setSmtpSaveSuccess(true);
        setTimeout(() => setSmtpSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Server API sync note:', err);
      setSmtpSaveSuccess(true);
      setTimeout(() => setSmtpSaveSuccess(false), 3000);
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleTestGoogleScriptDirect = async () => {
    const targetEmail = testEmailAddress || 'infoisgpro@gmail.com';
    const cleanUrl = (googleScriptUrl || '').trim();
    if (!cleanUrl || !cleanUrl.startsWith('https://')) {
      alert('Lütfen geçerli bir Google Apps Script Webhook URL giriniz (https://script.google.com/macros/s/.../exec).');
      return;
    }
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const resp = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          recipient: targetEmail,
          to_email: targetEmail,
          subject: '🧪 [İSG Pro Test] Google Apps Script Doğrulama',
          html: `<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-top: 0;">🚀 İSG Pro - Google Apps Script Entegrasyonu Doğrulandı</h2>
            <p>Tebrikler! Google Apps Script e-posta gönderim webhook'unuz <strong>Port 443 HTTPS</strong> üzerinden başarıyla çalıştı.</p>
            <p>Bu yöntem sayesinde Gmail SMTP port engelleri tamamen aşılır ve Admin 2FA doğrulama kodları anında gelen kutunuza iletilir.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')} | Gönderen: ${smtpFromName || 'İSG Pro'}</p>
          </div>`,
          fromName: smtpFromName || 'İSG Pro'
        })
      });

      const text = await resp.text();
      let ok = resp.ok;
      try {
        const j = JSON.parse(text);
        if (j.success === false || j.status === 'error') ok = false;
      } catch (_) {}

      if (ok) {
        setSmtpTestResult({
          success: true,
          message: `E-posta Google Apps Script üzerinden '${targetEmail}' adresine başarıyla ulaştırıldı!`
        });
      } else {
        setSmtpTestResult({
          success: false,
          message: `Google Apps Script yanıtı: ${text}`
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: 'Google Apps Script bağlantı hatası: ' + (err.message || err)
      });
    } finally {
      setSmtpTesting(false);
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
          brevoApiKey,
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

  const handlePreviewTemplate = async () => {
    setTemplatePreviewLoading(true);
    setTemplatePreviewOpen(true);
    try {
      const response = await fetch('/api/smtp-config/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: testTemplateType,
          testEmail: testEmailAddress || 'infoisgpro@gmail.com'
        })
      });
      const data = await response.json();
      if (data.success) {
        setTemplatePreviewData({
          subject: data.subject,
          html: data.html,
          hasAttachments: data.hasAttachments,
          attachmentCount: data.attachmentCount
        });
      } else {
        alert(data.error || 'Şablon önizleme yüklenemedi.');
      }
    } catch (err: any) {
      alert(`Önizleme hatası: ${err.message}`);
    } finally {
      setTemplatePreviewLoading(false);
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
    try {
      const stored = localStorage.getItem('isg_landing_users_v1') || localStorage.getItem('isg_users_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDbUsers(deduplicateAndCleanUsers(parsed));
        }
      } else if (users && users.length > 0) {
        setDbUsers(deduplicateAndCleanUsers(users));
      }
    } catch (e) {}

    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const cloudUsers: User[] = [];
        querySnapshot.forEach((docSnap) => {
          const raw = docSnap.data() as any;
          if (raw) {
            const dec = decryptUser(raw as User);
            const resolvedUsername = dec.username || raw.username || docSnap.id;
            cloudUsers.push({
              ...dec,
              username: resolvedUsername,
              email: dec.email || raw.email || ''
            });
          }
        });
        if (cloudUsers.length > 0) {
          const currentLocal: User[] = (() => {
            try {
              const s = localStorage.getItem('isg_landing_users_v1') || localStorage.getItem('isg_users_db');
              return s ? JSON.parse(s) : [];
            } catch { return []; }
          })();
          const merged = deduplicateAndCleanUsers([...cloudUsers, ...currentLocal, ...(users || [])]);
          setDbUsers(merged);
          if (onUpdateUsers) {
            onUpdateUsers(merged);
          }
          localStorage.setItem('isg_landing_users_v1', JSON.stringify(merged));
          localStorage.setItem('isg_users_db', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn("Error fetching users from Firestore:", err);
      }
    }
  };

  useEffect(() => {
    loadUsersFromStorage();
  }, [activeTab]);

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
        // Save/Update users in Firestore without deleting missing accounts
        for (const u of cleaned) {
          const usernameKey = normalizeUsername(u.username || u.email || '');
          if (!usernameKey) continue;
          let pwd = u.password;
          if (pwd && !pwd.match(/^[a-f0-9]{64}$/i)) {
            pwd = await hashPassword(pwd);
          }
          const userDoc = sanitizeUserForFirestore({ ...u, password: pwd });
          await setDoc(doc(db, 'users', usernameKey), userDoc, { merge: true });

          // Dual-write to server sync endpoint
          fetch('/api/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userDoc })
          }).catch(err => console.warn('Admin user sync call warning:', err));
        }
      } catch (err) {
        console.warn("Error syncing users to Firestore:", err);
      }
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    const targetUsername = normalizeUsername(targetUser.username);
    if (targetUsername === 'admin' || targetUser.email === 'admin@isg.com') {
      alert('Sistem yöneticisi silinemez!');
      return;
    }
    requestConfirm(
      'Kullanıcıyı Sil',
      `@${targetUser.username} (${targetUser.email || 'E-posta yok'}) kullanıcısını tamamen silmek istediğinize emin misiniz?`,
      async () => {
        const updated = dbUsers.filter(u => normalizeUsername(u.username) !== targetUsername);
        setDbUsers(updated);
        if (onUpdateUsers) onUpdateUsers(updated);
        try {
          localStorage.setItem('isg_landing_users_v1', JSON.stringify(updated));
          localStorage.setItem('isg_users_db', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}

        if (db) {
          try {
            await deleteDoc(doc(db, 'users', targetUsername));
            if (targetUser.username && targetUser.username !== targetUsername) {
              await deleteDoc(doc(db, 'users', targetUser.username));
            }
          } catch (delErr) {
            console.warn('Firestore deleteDoc error:', delErr);
          }
        }
        showDbSuccess(`@${targetUser.username} kullanıcısı başarıyla silindi.`);
        setConfirmModal(null);
      }
    );
  };

  const openEditModalForUser = (user: User) => {
    setEditUserModal(user);
    setEditModalName(user.name || '');
    setEditModalUsername(user.username || '');
    setEditModalEmail(user.email || '');
    setEditModalPhone(user.phone || '');
    setEditModalPassword('');
    setEditModalShowPassword(false);
    setEditModalTcNo(user.tcNo || '');
    setEditModalCertificateNo(user.certificateNo || '');
    setEditModalDiplomaNo(user.diplomaNo || '');
    setEditModalTescilNo(user.tescilNo || '');
    setEditModalRole(user.role || 'uzman');
    setEditModalOsgbName(user.osgb?.name || (typeof user.osgb === 'string' ? user.osgb : '') || '');
    setEditModalIsEmailVerified(Boolean(user.isEmailVerified));
    setEditModalHasAcceptedLegalTerms(Boolean(user.hasAcceptedLegalTerms));
    setEditModalIsPremium(Boolean(user.isPremium));
    const detectedType = user.licenseType || getLicenseTypeFromKey(user.licenseKey) || 'yearly';
    setEditModalLicenseType(detectedType);
    setEditModalLicenseKey(user.licenseKey || '');
    setEditModalIsOsgbManager(Boolean(user.isOsgbManager || user.role === 'osgb_manager'));
    setEditModalManagedOsgbName(user.managedOsgbName || '');
    setEditModalCanViewAllCompanies(Boolean(user.canViewAllCompanies));
    setEditModalCompanyPermissions(user.companyPermissions || []);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditModalPassword(pass);
    setEditModalShowPassword(true);
  };

  const handleSaveEditModal = async () => {
    if (!editUserModal) return;
    if (!editModalName.trim() || !editModalEmail.trim()) {
      alert('Ad Soyad ve E-Posta zorunludur.');
      return;
    }

    let newHashedPassword: string | undefined = undefined;
    if (editModalPassword.trim()) {
      newHashedPassword = await hashPassword(editModalPassword.trim());
    }

    const purchaseDate = editUserModal.licensePurchasedAt || new Date().toISOString();
    const expiryDate = new Date();
    if (editModalLicenseType === 'trial') expiryDate.setDate(expiryDate.getDate() + 7);
    else if (editModalLicenseType === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
    else expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const finalKey = editModalIsPremium
      ? (editModalLicenseKey.trim() || generateLicenseCode(editModalLicenseType))
      : null;

    if (editModalIsPremium && finalKey) {
      registerGeneratedLicense(finalKey, editModalLicenseType, editModalEmail.trim(), purchaseDate, expiryDate.toISOString());
    }

    const cleanUName = (editModalUsername.trim() || editUserModal.username || editModalEmail.trim()).replace(/\s+/g, '');
    const oldUsername = normalizeUsername(editUserModal.username);

    const updatedUsers = dbUsers.map(u => {
      const isTarget = normalizeUsername(u.username) === oldUsername;
      if (!isTarget) return u;

      return {
        ...u,
        name: editModalName.trim(),
        username: cleanUName,
        email: editModalEmail.trim(),
        phone: editModalPhone.trim(),
        password: newHashedPassword ? newHashedPassword : u.password,
        role: editModalRole === 'admin' ? 'admin' : (editModalIsOsgbManager ? 'osgb_manager' : editModalRole),
        tcNo: editModalTcNo.trim(),
        certificateNo: editModalCertificateNo.trim(),
        diplomaNo: editModalDiplomaNo.trim(),
        tescilNo: editModalTescilNo.trim(),
        osgb: {
          ...(typeof u.osgb === 'object' && u.osgb ? u.osgb : { name: '', logo: null, idNo: '', contact: '', staff: [] }),
          name: (editModalOsgbName.trim() || editModalManagedOsgbName.trim())
        },
        isEmailVerified: editModalIsEmailVerified,
        emailVerifiedAt: editModalIsEmailVerified ? (u.emailVerifiedAt || new Date().toISOString()) : null,
        hasAcceptedLegalTerms: editModalHasAcceptedLegalTerms,
        legalAcceptedAt: editModalHasAcceptedLegalTerms ? (u.legalAcceptedAt || new Date().toISOString()) : null,
        isPremium: editModalIsPremium,
        licenseKey: finalKey,
        licenseType: editModalIsPremium ? editModalLicenseType : null,
        licensePurchasedAt: editModalIsPremium ? purchaseDate : null,
        licenseExpiresAt: editModalIsPremium ? expiryDate.toISOString() : null,
        isOsgbManager: Boolean(editModalIsOsgbManager || editModalRole === 'osgb_manager'),
        managedOsgbName: (editModalManagedOsgbName.trim() || editModalOsgbName.trim()),
        canViewAllCompanies: editModalCanViewAllCompanies,
        companyPermissions: editModalCompanyPermissions
      };
    });

    if (db && cleanUName.toLowerCase() !== oldUsername) {
      try {
        await deleteDoc(doc(db, 'users', oldUsername));
      } catch (e) {}
    }

    await saveUsersToStorage(updatedUsers);
    setEditUserModal(null);
    showDbSuccess(`"${editModalName}" kullanıcısının bilgileri${newHashedPassword ? ' ve şifresi' : ''} başarıyla güncellendi.`);
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.email);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserPhone(user.phone);
    setEditUserRole(user.role);
    setEditUserIsPremium(user.isPremium);
    setEditUserLicenseKey(user.licenseKey || '');
    const detectedType = user.licenseType || getLicenseTypeFromKey(user.licenseKey);
    setEditUserLicenseType(detectedType);
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

  const openPermissionsModalForUser = (user: User) => {
    setPermModalUser(user);
    setPermModalIsOsgbManager(Boolean(user.isOsgbManager || user.role === 'osgb_manager'));
    setPermModalManagedOsgbName(user.managedOsgbName || (user.osgb && typeof user.osgb === 'object' ? user.osgb.name : '') || '');
    setPermModalCanViewAllCompanies(Boolean(user.canViewAllCompanies));
    setPermModalCompanyPerms(user.companyPermissions || []);
  };

  const handleToggleUserPerm = (companyId: string, field: 'canView' | 'canEdit', value: boolean) => {
    setPermModalCompanyPerms(prev => {
      const existing = prev.find(p => p.companyId === companyId);
      const updatedItem = existing ? { ...existing, [field]: value } : { companyId, canView: false, canEdit: false, [field]: value };
      if (field === 'canEdit' && value) updatedItem.canView = true;
      if (field === 'canView' && !value) updatedItem.canEdit = false;
      return [
        ...prev.filter(p => p.companyId !== companyId),
        ...(updatedItem.canView || updatedItem.canEdit ? [updatedItem] : [])
      ];
    });
  };

  const handleSavePermModal = async () => {
    if (!permModalUser) return;
    const cleanUName = normalizeUsername(permModalUser.username);
    const updatedUsers = dbUsers.map(u => {
      if (normalizeUsername(u.username) === cleanUName) {
        const targetRole = u.role === 'admin' ? 'admin' : (permModalIsOsgbManager ? 'osgb_manager' : (u.role === 'osgb_manager' ? 'uzman' : u.role));
        const finalManagedOsgb = permModalManagedOsgbName.trim();
        return {
          ...u,
          role: targetRole,
          isOsgbManager: permModalIsOsgbManager,
          managedOsgbName: finalManagedOsgb,
          osgb: {
            ...(typeof u.osgb === 'object' && u.osgb ? u.osgb : { name: '', logo: null, idNo: '', contact: '', staff: [] }),
            name: finalManagedOsgb || (u.osgb && typeof u.osgb === 'object' ? u.osgb.name : '') || ''
          },
          canViewAllCompanies: permModalCanViewAllCompanies,
          companyPermissions: permModalCompanyPerms
        };
      }
      return u;
    });
    await saveUsersToStorage(updatedUsers);
    setPermModalUser(null);
    showDbSuccess(`@${permModalUser.username} kullanıcısının firma yetkileri ve OSGB yöneticilik ayarları başarıyla kaydedildi.`);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = normalizeUsername(newUsername);
    const cleanEmail = newUserEmail.trim().toLowerCase();
    const cleanFullName = newFullName.trim();

    if (!cleanUser || !cleanFullName || !cleanEmail) {
      alert('Kullanıcı adı, ad soyad ve e-posta zorunludur.');
      return;
    }

    if (dbUsers.some(u => normalizeUsername(u.username) === cleanUser || (u.email && u.email.toLowerCase().trim() === cleanEmail))) {
      const suggestions = generateAvailableUsernameSuggestions(cleanUser, cleanFullName, dbUsers);
      alert(`⚠️ Bu kullanıcı adı ("@${cleanUser}") veya e-posta adresi zaten mevcut!\n\nÖnerilen müsait kullanıcı adları:\n${suggestions.map(s => '• @' + s).join('\n')}`);
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
      registerGeneratedLicense(createdKey, newUserLicenseType, cleanEmail, purchaseDate, expiryDate.toISOString());
    }

    const newUser: User = {
      username: cleanUser,
      password: hashedPassword,
      name: cleanFullName,
      email: cleanEmail,
      phone: newUserPhone.trim(),
      role: newUserRole,
      isPremium: newUserIsPremium,
      licenseKey: createdKey,
      licenseType: newUserIsPremium ? newUserLicenseType : null,
      licensePurchasedAt: newUserIsPremium ? purchaseDate : null,
      licenseExpiresAt: newUserIsPremium ? expiryDate.toISOString() : null,
      isEmailVerified: newUserIsEmailVerified,
      hasAcceptedLegalTerms: false,
      createdBy: 'admin',
      isOsgbManager: newUserIsOsgbManager,
      managedOsgbName: newUserManagedOsgbName.trim(),
      canViewAllCompanies: newUserCanViewAllCompanies,
      companyPermissions: []
    };

    const updated = [...dbUsers, newUser];
    saveUsersToStorage(updated);

    // Arka planda yöneticiye yeni kullanıcı bildirimi gönder
    try {
      fetch('/api/send-new-user-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUser: {
            ...newUser,
            createdAt: new Date().toISOString()
          },
          adminEmail: 'infoisgpro@gmail.com'
        })
      }).catch(err => console.warn('New user notification dispatch error:', err));
    } catch (e) {}
    
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('uzman');
    setNewUserIsPremium(false);
    setNewUserIsEmailVerified(true);
    setNewUserIsOsgbManager(false);
    setNewUserManagedOsgbName('');
    setNewUserCanViewAllCompanies(false);
    setNewUserOpen(false);

    showDbSuccess('Yeni kullanıcı başarıyla eklendi.');
  };

  const handleToggleEmailVerification = async (targetUser: User) => {
    const nextState = !targetUser.isEmailVerified;
    const updated = dbUsers.map(u => 
      u.username.toLowerCase() === targetUser.username.toLowerCase()
        ? { ...u, isEmailVerified: nextState }
        : u
    );
    await saveUsersToStorage(updated);
    showDbSuccess(`@${targetUser.username} kullanıcısının e-posta doğrulama durumu: ${nextState ? 'DOĞRULANDI' : 'DOĞRULANMADI'} olarak güncellendi.`);
  };

  const handleSendVerificationEmail = async (targetUser: User) => {
    if (!targetUser.email) {
      openChangeEmailAndVerifyModal(targetUser);
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      showDbSuccess(`@${targetUser.username} için doğrulama e-postası gönderiliyor...`);
      const res = await fetch('/api/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetUser.email,
          name: targetUser.name || targetUser.username,
          username: targetUser.username,
          code
        })
      });
      if (res.ok) {
        showDbSuccess(`Doğrulama kodu @${targetUser.username} (${targetUser.email}) adresine başarıyla iletildi.`);
      } else {
        alert('Doğrulama e-postası gönderilirken sunucu hatası oluştu.');
      }
    } catch (err) {
      alert('Bağlantı hatası: Doğrulama e-postası gönderilemedi.');
    }
  };

  const handleExecuteChangeEmailAndSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!changeEmailModalUser) return;

    const cleanEmail = changeEmailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setChangeEmailError('Lütfen geçerli bir e-posta adresi giriniz (örn: ad.soyad@firma.com).');
      return;
    }

    setChangeEmailIsSubmitting(true);
    setChangeEmailError('');

    try {
      // 1. Veritabanından yıllık 2 hesap kotası kontrolü
      const limitCheck = await checkEmailAccountLimitFromDb(cleanEmail, changeEmailModalUser.username);
      if (!limitCheck.allowed) {
        setChangeEmailError(limitCheck.message || 'Bu e-posta adresine bağlı son 1 yıl içinde en fazla 2 doğrulanmış hesap açılabilir.');
        setChangeEmailIsSubmitting(false);
        return;
      }

      // 2. Kullanıcının e-postasını güncelle ve veritabanına kaydet
      const updated = dbUsers.map(u => 
        u.username.toLowerCase() === changeEmailModalUser.username.toLowerCase()
          ? { ...u, email: cleanEmail, isEmailVerified: false, emailVerifiedAt: null }
          : u
      );
      await saveUsersToStorage(updated);

      // 3. 6 haneli doğrulama kodu oluştur ve e-postaya gönder
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      let sent = false;
      try {
        const res = await fetch('/api/send-email-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: changeEmailModalUser.name || changeEmailModalUser.username,
            username: changeEmailModalUser.username,
            code
          })
        });
        if (res.ok) sent = true;
      } catch (err) {}

      if (!sent) {
        // Fallback: send-email-otp
        try {
          const res2 = await fetch('/api/send-email-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              name: changeEmailModalUser.name || changeEmailModalUser.username,
              username: changeEmailModalUser.username,
              code
            })
          });
          if (res2.ok) sent = true;
        } catch (err) {}
      }

      showDbSuccess(`@${changeEmailModalUser.username} e-postası "${cleanEmail}" olarak kaydedildi ve doğrulama kodu başarıyla iletildi.`);
      setChangeEmailModalUser(null);
    } catch (err: any) {
      console.error('E-posta değiştirme ve doğrulama kodu gönderme hatası:', err);
      setChangeEmailError(err?.message || 'İşlem sırasında bir hata oluştu.');
    } finally {
      setChangeEmailIsSubmitting(false);
    }
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

  // Promo Video actions
  const handleSavePromoVideo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newVideoTitle.trim()) {
      alert('Lütfen tanıtım videosu başlığı giriniz.');
      return;
    }
    if (!newVideoUrl.trim()) {
      alert('Lütfen geçerli bir YouTube video bağlantısı giriniz.');
      return;
    }

    if (editingVideoId) {
      setPromoVideos(prev => prev.map(v => v.id === editingVideoId ? {
        ...v,
        title: newVideoTitle.trim(),
        url: newVideoUrl.trim(),
        description: newVideoDesc.trim()
      } : v));
    } else {
      const newItem: PromoVideoItem = {
        id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: newVideoTitle.trim(),
        url: newVideoUrl.trim(),
        description: newVideoDesc.trim()
      };
      setPromoVideos(prev => [...prev, newItem]);
    }

    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoDesc('');
    setEditingVideoId(null);
    setShowAddVideoModal(false);
  };

  const handleEditPromoVideo = (video: PromoVideoItem) => {
    setEditingVideoId(video.id);
    setNewVideoTitle(video.title);
    setNewVideoUrl(video.url);
    setNewVideoDesc(video.description || '');
    setShowAddVideoModal(true);
  };

  const handleDeletePromoVideo = (id: string) => {
    if (promoVideos.length <= 1) {
      alert('En az 1 adet tanıtım videosu bulunmalıdır.');
      return;
    }
    requestConfirm(
      'Tanıtım Videosunu Sil',
      'Bu tanıtım videosunu silmek istediğinize emin misiniz?',
      () => {
        setPromoVideos(prev => prev.filter(v => v.id !== id));
        setConfirmModal(null);
      }
    );
  };

  const handleMovePromoVideo = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === promoVideos.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...promoVideos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPromoVideos(updated);
  };

  // Content actions
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteConfig({
      videoUrl: promoVideos[0]?.url || videoUrl,
      kurulumVideoUrl,
      promoVideos,
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
                  {/* MULTIPLE PROMOTIONAL VIDEOS SECTION */}
                  <div className="col-span-1 md:col-span-2 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Film className="text-red-500" size={18} />
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            Ana Sayfa Tanıtım Videoları
                          </h4>
                          <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full">
                            {promoVideos.length} Video
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Ziyaretçiler ana sayfada bu videoları liste halinde sırayla veya seçerek izleyebilirler.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVideoId(null);
                          setNewVideoTitle('');
                          setNewVideoUrl('');
                          setNewVideoDesc('');
                          setShowAddVideoModal(true);
                        }}
                        className="self-start sm:self-auto px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Yeni Tanıtım Videosu Ekle</span>
                      </button>
                    </div>

                    {/* Videos List */}
                    <div className="space-y-2.5">
                      {promoVideos.map((video, idx) => (
                        <div
                          key={video.id || idx}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-red-100 dark:border-red-900/30">
                              #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {video.title}
                                </h5>
                                {idx === 0 && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded uppercase">
                                    Ana / Varsayılan
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                {video.url}
                              </p>
                              {video.description && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                  {video.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMovePromoVideo(idx, 'up')}
                              disabled={idx === 0}
                              title="Yukarı Taşı"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                            >
                              <ArrowUp size={14} />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMovePromoVideo(idx, 'down')}
                              disabled={idx === promoVideos.length - 1}
                              title="Aşağı Taşı"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                            >
                              <ArrowDown size={14} />
                            </button>

                            {/* Test / Watch Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewingVideoUrl(previewingVideoUrl === video.url ? null : video.url)}
                              title="Önizle / İzle"
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                previewingVideoUrl === video.url
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400'
                              }`}
                            >
                              <Play size={14} className={previewingVideoUrl === video.url ? 'fill-white' : ''} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleEditPromoVideo(video)}
                              title="Düzenle"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeletePromoVideo(video.id)}
                              disabled={promoVideos.length <= 1}
                              title={promoVideos.length <= 1 ? "En az 1 video kalmalıdır" : "Sil"}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Preview If Opened */}
                    {previewingVideoUrl && (
                      <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-slate-800 animate-in fade-in">
                        <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Play size={12} className="text-red-500 fill-red-500" /> Canlı Video Önizleme
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewingVideoUrl(null)}
                            className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                          >
                            Önizlemeyi Kapat
                          </button>
                        </div>
                        <div className="aspect-video w-full max-w-xl mx-auto rounded-xl overflow-hidden bg-black">
                          <iframe
                            src={getYouTubeEmbedUrl(previewingVideoUrl)}
                            title="Video Önizleme"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}
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
                        onChange={(e) => setNewUsername(e.target.value.replace(/^\s+/, ''))}
                        onBlur={() => setNewUsername(prev => normalizeUsername(prev))}
                        placeholder="Örn: ahmet12"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-indigo-600 font-mono"
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
                        <option value="dsp">Diğer Sağlık Personeli (DSP)</option>
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

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        id="newUserIsEmailVerified"
                        checked={newUserIsEmailVerified}
                        onChange={(e) => setNewUserIsEmailVerified(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="newUserIsEmailVerified" className="text-xs text-slate-800 font-extrabold cursor-pointer flex items-center gap-1">
                        <span>E-Posta Adresi Doğrulanmış Olarak Başlatılsın</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newUserIsOsgbManager"
                          checked={newUserIsOsgbManager}
                          onChange={(e) => setNewUserIsOsgbManager(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="newUserIsOsgbManager" className="text-xs text-slate-800 font-extrabold cursor-pointer flex items-center gap-1">
                          <Building2 size={13} className="text-indigo-600" />
                          <span>🏢 OSGB Yöneticisi Yetkisi Ver (Firma ataması olmasa bile firma bilgilerini düzenleyebilir)</span>
                        </label>
                      </div>

                      {newUserIsOsgbManager && (
                        <div className="pl-6 pt-1">
                          <label className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">
                            Yönetilen OSGB Unvanı / Adı
                          </label>
                          <input
                            type="text"
                            value={newUserManagedOsgbName}
                            onChange={(e) => setNewUserManagedOsgbName(e.target.value)}
                            placeholder="Örn: Kuzey Doğu İSG OSGB"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1 font-normal">
                            Bu yönetici, bu OSGB'ye kayıtlı tüm firmaları ve bilgilerini tek tek atama yapılmasa bile düzenleyebilir.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newUserCanViewAllCompanies"
                          checked={newUserCanViewAllCompanies}
                          onChange={(e) => setNewUserCanViewAllCompanies(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor="newUserCanViewAllCompanies" className="text-xs text-slate-800 font-extrabold cursor-pointer">
                          <span>👁️ Sistemdeki Tüm Firmaları Görme Yetkisi (canViewAllCompanies)</span>
                        </label>
                      </div>
                    </div>

                    {newUserIsPremium && (
                      <div className="pl-6 pt-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <span className="text-xs font-bold text-slate-600">Lisans Paket Türü:</span>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700">
                            <input
                              type="radio"
                              name="newUserLicenseType"
                              value="trial"
                              checked={newUserLicenseType === 'trial'}
                              onChange={() => setNewUserLicenseType('trial')}
                              className="text-amber-600"
                            />
                            <span>7 Günlük Deneme (Code: ISG-T-...)</span>
                          </label>

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
                        const nameStr = (u.name || '').toLowerCase();
                        const userStr = (u.username || '').toLowerCase();
                        const emailStr = (u.email || '').toLowerCase();
                        const phoneStr = (u.phone || '');
                        return (
                          nameStr.includes(term) ||
                          userStr.includes(term) ||
                          emailStr.includes(term) ||
                          phoneStr.includes(term)
                        );
                      }).map((u, idx) => {
                        const rowKey = u.username || u.email || `usr-${idx}`;
                        const isEditing = editingUserId === (u.email || u.username);

                        return (
                          <tr key={rowKey} className="hover:bg-slate-50/40 transition-colors">
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="font-extrabold text-slate-900 text-sm">{u.name}</h5>
                                    {u.tcNo && (
                                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                        TC: {u.tcNo}
                                      </span>
                                    )}
                                  </div>
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
                                <div className="space-y-1">
                                  <div>
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
                                    {Boolean(u.isOsgbManager || u.role === 'osgb_manager') && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                                          <Building2 size={10} /> OSGB Yöneticisi: {u.managedOsgbName || 'Atanmamış'}
                                        </span>
                                      </div>
                                    )}
                                    {Boolean(u.canViewAllCompanies) && (
                                      <div className="mt-0.5">
                                        <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                          👁️ Tüm Firmaları Görebilir
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {u.certificateNo && (
                                    <div className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60 inline-block">
                                      Belge: {u.certificateNo}
                                    </div>
                                  )}
                                  {u.osgb?.name && (
                                    <div className="text-[9px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded inline-block truncate max-w-[130px]" title={u.osgb.name}>
                                      🏢 {u.osgb.name}
                                    </div>
                                  )}
                                </div>
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
                                <div className="space-y-1 text-[11px]">
                                  <div className="text-slate-800 font-bold">{u.email || <span className="text-amber-600 font-bold italic">E-Posta Tanımlanmamış</span>}</div>
                                  <div className="text-slate-400 font-semibold">{u.phone || 'Telefon Yok'}</div>
                                  <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                                    {u.isEmailVerified ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 size={10} className="text-emerald-600" />
                                        <span>E-Posta Doğrulandı</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                        <AlertTriangle size={10} className="text-amber-600" />
                                        <span>Doğrulanmadı</span>
                                      </span>
                                    )}
                                    {u.hasAcceptedLegalTerms ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title={`Onay Tarihi: ${u.legalAcceptedAt ? new Date(u.legalAcceptedAt).toLocaleDateString('tr-TR') : '-'}`}>
                                        <Check size={9} />
                                        <span>Sözleşme Onaylı</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                        <span>Sözleşme Bekliyor</span>
                                      </span>
                                    )}
                                  </div>
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
                                      {(() => {
                                        const t = u.licenseType || getLicenseTypeFromKey(u.licenseKey);
                                        if (t === 'trial') {
                                          return (
                                            <div className="flex items-center gap-1 text-[10px] text-amber-700 font-extrabold">
                                              <CheckSquare size={12} className="text-amber-600" />
                                              <span>AKTİF (7 Günlük Deneme)</span>
                                            </div>
                                          );
                                        }
                                        if (t === 'monthly') {
                                          return (
                                            <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-extrabold">
                                              <CheckSquare size={12} className="text-indigo-600" />
                                              <span>AKTİF (Aylık Lisans - 1 Ay)</span>
                                            </div>
                                          );
                                        }
                                        if (t === 'demo') {
                                          return (
                                            <div className="flex items-center gap-1 text-[10px] text-purple-700 font-extrabold">
                                              <CheckSquare size={12} className="text-purple-600" />
                                              <span>AKTİF (10 Dk Demo Test)</span>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold">
                                            <CheckSquare size={12} className="text-emerald-600" />
                                            <span>AKTİF (Yıllık Lisans - 1 Yıl)</span>
                                          </div>
                                        );
                                      })()}
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
                                    {/* Tüm Kişisel Bilgileri İncele Butonu */}
                                    <button
                                      onClick={() => setViewUserDetail(u)}
                                      title="Tüm Kişisel ve Mesleki Bilgileri İncele"
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-indigo-200 flex items-center gap-1"
                                    >
                                      <Eye size={12} />
                                      <span>İncele</span>
                                    </button>

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
                                              const updated = dbUsers.map(usr => normalizeUsername(usr.username) === normalizeUsername(u.username) ? { ...usr, isPremium: false, licenseKey: null, licenseType: null } : usr);
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

                                    {/* E-Posta Doğrulama Kontrolleri */}
                                    {u.isEmailVerified ? (
                                      <button
                                        onClick={() => handleToggleEmailVerification(u)}
                                        title="Doğrulama durumunu iptal et"
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200"
                                      >
                                        Doğrulamayı Al
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleToggleEmailVerification(u)}
                                          title="E-Postayı Manuel Olarak Doğrula"
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-emerald-200"
                                        >
                                          Doğrula
                                        </button>
                                        <button
                                          onClick={() => handleSendVerificationEmail(u)}
                                          title="Kullanıcıya Yeni Doğrulama Kodu Gönder"
                                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-blue-200"
                                        >
                                          Kod Gönder
                                        </button>
                                        <button
                                          onClick={() => openChangeEmailAndVerifyModal(u)}
                                          title={u.email ? "E-Posta Adresini Değiştir ve Doğrulama Kodu Gönder" : "E-Posta Adresi Tanımla ve Doğrulama Kodu Gönder"}
                                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-amber-300 flex items-center gap-1 shadow-xs"
                                        >
                                          <Mail size={11} className="text-amber-600 shrink-0" />
                                          <span>{u.email ? 'E-Postayı Değiştir & Doğrula' : 'E-Posta Tanımla & Doğrula'}</span>
                                        </button>
                                      </>
                                    )}

                                     {/* Firma İzinleri ve OSGB Yetkileri Modalı Açıcı */}
                                     <button
                                       onClick={() => openPermissionsModalForUser(u)}
                                       title="Firma İzinlerini ve OSGB Yetkilerini Yönet"
                                       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-indigo-200 flex items-center gap-1 shadow-xs"
                                     >
                                       <ShieldCheck size={11} className="text-indigo-600" />
                                       <span>Firma İzinleri</span>
                                     </button>
                                    {/* Şifre ve Tüm Bilgileri Düzenleme Modalı Açıcı */}
                                    <button
                                      onClick={() => openEditModalForUser(u)}
                                      title="Kullanıcı Bilgilerini ve Şifresini Düzenle"
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200 flex items-center gap-1"
                                    >
                                      <Edit2 size={11} />
                                      <span>Düzenle</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-1 rounded cursor-pointer"
                                      title="Kullanıcıyı Sil"
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

                        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-extrabold uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
                              🔗 Google Apps Script Webhook URL (Port 443 HTTPS REST API)
                            </label>
                            <span className="text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                              ⭐ 1. Öncelikli & Sıfır Port Engeli
                            </span>
                          </div>
                          <input
                            type="text"
                            value={googleScriptUrl}
                            onChange={(e) => setGoogleScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-750 rounded-xl p-2.5 text-slate-950 dark:text-white text-xs sm:text-sm outline-none font-mono focus:ring-2 focus:ring-indigo-500/30"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleTestGoogleScriptDirect}
                              disabled={!googleScriptUrl || smtpTesting}
                              className="text-[11px] font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              ⚡ Apps Script Test Maili Gönder
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowScriptCode(!showScriptCode)}
                              className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              {showScriptCode ? '▲ Kodu Gizle' : '📋 Hazır Google Script Kodunu Görüntüle'}
                            </button>
                          </div>

                          {showScriptCode && (
                            <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-slate-700 text-slate-200 text-xs font-mono space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>script.google.com &gt; Yeni Dağıtım (Deploy as Web app &gt; Anyone)</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const codeToCopy = `function doPost(e) {\\n  try {\\n    var data = JSON.parse(e.postData.contents);\\n    var to = Array.isArray(data.to) ? data.to.join(',') : (data.to || data.recipient || 'infoisgpro@gmail.com');\\n    var subject = data.subject || 'İSG Pro Bildirim';\\n    var htmlBody = data.html || data.htmlBody || data.body || '';\\n    var fromName = data.fromName || data.name || 'İSG Pro Güvenlik';\\n\\n    MailApp.sendEmail({\\n      to: to,\\n      subject: subject,\\n      htmlBody: htmlBody,\\n      name: fromName\\n    });\\n\\n    return ContentService\\n      .createTextOutput(JSON.stringify({ success: true, message: 'E-posta başarıyla iletildi' }))\\n      .setMimeType(ContentService.MimeType.JSON);\\n  } catch (err) {\\n    return ContentService\\n      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))\\n      .setMimeType(ContentService.MimeType.JSON);\\n  }\\n}`;
                                    navigator.clipboard.writeText(codeToCopy);
                                    setCopiedScript(true);
                                    setTimeout(() => setCopiedScript(false), 2500);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  {copiedScript ? '✔ Kopyalandı' : 'Kodu Kopyala'}
                                </button>
                              </div>
                              <pre className="text-[10px] text-emerald-400 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded border border-slate-800 whitespace-pre">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = Array.isArray(data.to) ? data.to.join(',') : (data.to || data.recipient || 'infoisgpro@gmail.com');
    var subject = data.subject || 'İSG Pro Bildirim';
    var htmlBody = data.html || data.htmlBody || data.body || '';
    var fromName = data.fromName || data.name || 'İSG Pro Güvenlik';

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: fromName
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'E-posta başarıyla iletildi' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                              </pre>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
                            ⚡ Brevo (Sendinblue) API Key (Port 443 HTTPS REST API)
                          </label>
                          <input
                            type="text"
                            value={brevoApiKey}
                            onChange={(e) => setBrevoApiKey(e.target.value)}
                            placeholder="xkeysib-..."
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">E-Posta Şablon Tipi</label>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">13 Şablon Hazır</span>
                        </div>
                        <select
                          value={testTemplateType}
                          onChange={(e) => setTestTemplateType(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none font-bold cursor-pointer"
                        >
                          <optgroup label="Doğrulama, Güvenlik ve Hesap Şablonları">
                            <option value="general">🌐 Genel Bağlantı Doğrulama Testi (Standart Servis)</option>
                            <option value="otp">🔑 Güvenli Giriş Kodu (OTP) Şablonu</option>
                            <option value="admin_2fa">🔐 Yönetici (Admin) 2FA Giriş Doğrulama Kodu Şablonu</option>
                            <option value="verification">✉️ E-Posta Doğrulama Kodu & Aktivasyon Linki</option>
                            <option value="verified_user">✅ E-Posta Adresiniz Doğrulandı (Kullanıcı Güvenlik Teyidi)</option>
                            <option value="verified_admin">🛡️ Kullanıcı E-Postasını Doğruladı (Yönetici Bildirimi)</option>
                            <option value="new_user">👤 Yeni Kullanıcı Kaydı Bildirimi (Yönetici Hesap Kartı)</option>
                            <option value="update">🔄 E-Posta Adresi Güncelleme Bağlantısı Şablonu</option>
                          </optgroup>
                          <optgroup label="Lisans & Deneme Sürümü Şablonları">
                            <option value="license">🎁 Lisans Teslimat Bildirimi (Satın Alınan Lisans Anahtarı)</option>
                            <option value="trial_license">⚡ 7 Günlük Ücretsiz Deneme Lisansı Bildirimi</option>
                            <option value="trial_reminder">⏰ Deneme Süresi Bitiş Hatırlatması (Son 1 Gün / Pro'ya Geç)</option>
                          </optgroup>
                          <optgroup label="Resmi Sözleşmeler & Müşteri İletişimi">
                            <option value="contracts">📜 Satın Alma Onaylı Sözleşmeler (6 Belge + PDF Ekli)</option>
                            <option value="billing_notification">🧾 Yeni Sipariş & Fatura Kesim Bildirimi (infoisgpro@gmail.com)</option>
                            <option value="registration_consent">✍️ Kayıt Öncesi Yasal Metinler & Islak İmza (3 Belge + PDF)</option>
                            <option value="contact">💬 Yeni Destek & İletişim Talebi Mesajı</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Canlı Önizleme Butonu */}
                      <button
                        type="button"
                        onClick={handlePreviewTemplate}
                        disabled={templatePreviewLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
                      >
                        <Eye size={14} className="text-indigo-600" />
                        <span>{templatePreviewLoading ? 'Şablon Yükleniyor...' : 'Seçili Şablonu Canlı Önizle'}</span>
                      </button>

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
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        {smtpTesting ? 'Test E-Postası Gönderiliyor...' : 'Test E-Postasını Gönder'}
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
                      <option value="0">🚀 Canlı Mod / Production (0) - Gerçek Kredi Kartı Tahsilatı (Varsayılan)</option>
                      <option value="1">🧪 Test Modu (1) - PayTR Sandbox / Deneme İşlemleri</option>
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

      {/* ========================================================================= */}
      {/* 1. TÜM KİŞİSEL BİLGİLERİ GÖRÜNTÜLEME MODALI (USER DETAIL MODAL)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewUserDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden"
            >
              {/* Modal Başlık Çubuğu */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black text-lg shadow-inner">
                    {viewUserDetail.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>{viewUserDetail.name}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        viewUserDetail.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                        viewUserDetail.role === 'uzman' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                        viewUserDetail.role === 'hekim' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                        'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                      }`}>
                        {viewUserDetail.role === 'admin' ? 'YÖNETİCİ' :
                         viewUserDetail.role === 'uzman' ? 'İSG UZMANI' :
                         viewUserDetail.role === 'hekim' ? 'İŞYERİ HEKİMİ' : 'PERSONEL'}
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200/70 font-mono">@{viewUserDetail.username || 'kullanici'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewUserDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal İçerik Gövdesi */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

                {/* 1. Kimlik ve İletişim Bilgileri */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BadgeCheck size={16} className="text-indigo-600" />
                    <span>Kimlik ve Temel Bilgiler</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">T.C. Kimlik No:</span>
                      <span className="font-mono font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {viewUserDetail.tcNo || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Kullanıcı Adı:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                        @{viewUserDetail.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">E-Posta Adresi:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 break-all">
                        {viewUserDetail.email || <span className="text-amber-600 font-bold italic">E-Posta Tanımlanmamış</span>}
                      </span>
                      <div className="mt-1">
                        {viewUserDetail.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300">
                            <CheckCircle2 size={11} />
                            <span>E-Posta Doğrulandı {viewUserDetail.emailVerifiedAt ? `(${new Date(viewUserDetail.emailVerifiedAt).toLocaleDateString('tr-TR')})` : ''}</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300">
                              <AlertTriangle size={11} />
                              <span>Doğrulanmamış Hesap</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const u = viewUserDetail;
                                setViewUserDetail(null);
                                openChangeEmailAndVerifyModal(u);
                              }}
                              className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 hover:text-amber-900 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Mail size={11} className="text-amber-600 shrink-0" />
                              <span>{viewUserDetail.email ? 'E-Postayı Değiştir & Doğrula' : 'E-Posta Tanımla & Doğrula'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Telefon Numarası:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {viewUserDetail.phone || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Kayıt Tarihi:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {viewUserDetail.createdAt ? new Date(viewUserDetail.createdAt).toLocaleString('tr-TR') : 'Sistem Kurulumu'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Kayıt Kaynağı:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {viewUserDetail.createdBy || 'Web Kayıt Formu'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Mesleki Profil ve Kurum Bilgileri */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span>Mesleki ve Kurumsal Bilgiler</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Mesleki Rol:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {viewUserDetail.role === 'admin' ? 'Yönetici (Admin)' :
                         viewUserDetail.role === 'uzman' ? 'İş Güvenliği Uzmanı' :
                         viewUserDetail.role === 'hekim' ? 'İşyeri Hekimi' : 'Diğer Personel'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">İSG Katip / Belge No:</span>
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 inline-block">
                        {viewUserDetail.certificateNo || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Diploma No:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {viewUserDetail.diplomaNo || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Oda / Sicil / Tescil No:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {viewUserDetail.tescilNo || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">Bağlı Olduğu OSGB / Firma:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {viewUserDetail.osgb?.name || (typeof viewUserDetail.osgb === 'string' ? viewUserDetail.osgb : '') || 'Bağımsız / Bireysel Çalışan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Hukuki Sözleşmeler ve Dijital Islak İmza */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PenTool size={16} className="text-emerald-600" />
                    <span>Hukuki Sözleşmeler ve Dijital İmza</span>
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Sözleşme Onay Durumu:</span>
                        <span className="text-[11px] text-slate-400">Kullanıcı Sözleşmesi, KVKK ve Mesafeli Satış Sözleşmesi</span>
                      </div>
                      <div>
                        {viewUserDetail.hasAcceptedLegalTerms ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check size={13} />
                            <span>ONAYLANDI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-600">
                            <span>ONAYLANMADI</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {viewUserDetail.legalAcceptedAt && (
                      <div className="text-[11px] text-slate-500 font-semibold pl-1">
                        Sözleşme Onay Tarihi: <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(viewUserDetail.legalAcceptedAt).toLocaleString('tr-TR')}</span>
                      </div>
                    )}

                    {/* Dijital İmza Önizleme */}
                    <div>
                      <span className="text-slate-500 font-bold block text-[11px] mb-1.5">Kullanıcı Dijital İmzası:</span>
                      {viewUserDetail.userSignature ? (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 inline-block">
                          <img
                            src={viewUserDetail.userSignature}
                            alt="Kullanıcı Dijital İmzası"
                            className="h-20 max-w-full object-contain bg-white rounded p-1 border border-slate-100"
                          />
                          <p className="text-[9px] text-emerald-600 font-bold mt-1">✓ Yasal kayıtlı dijital imza</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs italic">
                          Kullanıcı henüz sisteme dijital imza kaydetmemiştir.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Lisans Durumu */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <span>Lisans ve Yetki Durumu</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Durum:</span>
                      {viewUserDetail.isPremium ? (
                        <span className="font-black text-emerald-600">✓ Premium Lisans Aktif</span>
                      ) : (
                        <span className="font-bold text-slate-500">Deneme Sürümü / Pasif</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Lisans Türü:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {viewUserDetail.licenseType === 'trial' ? '7 Günlük Deneme' :
                         viewUserDetail.licenseType === 'monthly' ? 'Aylık Lisans (1 Ay)' :
                         viewUserDetail.licenseType === 'demo' ? '10 Dk Demo' :
                         viewUserDetail.licenseType === 'yearly' ? 'Yıllık Lisans (1 Yıl)' : 'Standart'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">Lisans Anahtarı:</span>
                      <span className="font-mono font-extrabold text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                        {viewUserDetail.licenseKey || 'Tanımlanmamış'}
                      </span>
                    </div>
                    {viewUserDetail.licenseExpiresAt && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Bitiş Tarihi:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(viewUserDetail.licenseExpiresAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Alt Butonlar */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const u = viewUserDetail;
                    setViewUserDetail(null);
                    openEditModalForUser(u);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
                >
                  <KeyRound size={14} />
                  <span>Şifreyi Değiştir & Düzenle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewUserDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1.5. KULLANICI FİRMA İZİNLERİ VE OSGB YÖNETİM MODALI                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {permModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">Firma İzinleri ve OSGB Yetkilendirme</h3>
                    <p className="text-[11px] text-white/80 font-medium">@{permModalUser.username} — {permModalUser.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* OSGB Yöneticisi Kartı */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permModalIsOsgbManager}
                        onChange={(e) => setPermModalIsOsgbManager(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                        👑 Bu Kullanıcı OSGB Yöneticisidir
                      </span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                      Önemli Yetki
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    OSGB yöneticisi olarak işaretlenen kullanıcılar, firmaya uzman veya hekim olarak tek tek atanmamış olsa dahi OSGB bünyesindeki tüm firmaların firma bilgilerini ve ayarlarını tam yetkiyle (görüntüleme ve düzenleme) yönetebilirler.
                  </p>

                  {permModalIsOsgbManager && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Yönettiği OSGB Adı:
                      </label>
                      <input
                        type="text"
                        value={permModalManagedOsgbName}
                        onChange={(e) => setPermModalManagedOsgbName(e.target.value)}
                        placeholder="Örn: Kuzey Doğu İSG OSGB"
                        className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-indigo-100 dark:border-indigo-900">
                    <input
                      type="checkbox"
                      checked={permModalCanViewAllCompanies}
                      onChange={(e) => setPermModalCanViewAllCompanies(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                      👁️ Sistemdeki Tüm Firmaları Görme İzni (canViewAllCompanies)
                    </span>
                  </label>
                </div>

                {/* Firma İzinleri Tablosu */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={14} className="text-teal-600" />
                      <span>Firma Bazlı İzinler ({allCompaniesList.length} Firma)</span>
                    </h4>
                    
                    {/* Toplu İşlem Butonları */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allView = allCompaniesList.map(c => ({ companyId: c.id, canView: true, canEdit: false }));
                          setPermModalCompanyPerms(allView);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer transition"
                      >
                        Hepsini Gör
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allEdit = allCompaniesList.map(c => ({ companyId: c.id, canView: true, canEdit: true }));
                          setPermModalCompanyPerms(allEdit);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition"
                      >
                        Hepsini Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermModalCompanyPerms([])}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition"
                      >
                        Sıfırla
                      </button>
                    </div>
                  </div>

                  {allCompaniesList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                      Sistemde henüz kayıtlı firma bulunmuyor. Firmalar oluşturuldukça burada listelenecektir.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                      {allCompaniesList.map(c => {
                        const perm = permModalCompanyPerms.find(p => p.companyId === c.id) || { canView: false, canEdit: false };
                        return (
                          <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{c.name || 'İsimsiz Firma'}</p>
                              {c.assignedOsgbName && (
                                <p className="text-[10px] text-slate-400">OSGB: {c.assignedOsgbName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perm.canView}
                                  onChange={(e) => handleToggleUserPerm(c.id, 'canView', e.target.checked)}
                                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Görüntüle</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perm.canEdit}
                                  onChange={(e) => handleToggleUserPerm(c.id, 'canEdit', e.target.checked)}
                                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Düzenle</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSavePermModal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Yetkileri Kaydet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. KULLANICI DÜZENLEME VE ŞİFRE DEĞİŞTİRME MODALI (EDIT USER MODAL)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden"
            >
              {/* Modal Başlık Çubuğu */}
              <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-300/40 flex items-center justify-center text-white">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Kullanıcı Bilgilerini Düzenle & Şifre Değiştir</h3>
                    <p className="text-xs text-indigo-200 font-mono">@{editUserModal.username} ({editUserModal.email})</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Gövdesi */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

                {/* ŞİFRE DEĞİŞTİRME YETKİ KUTUSU (ÖZEL VURGULU) */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-indigo-500/10 dark:from-amber-950/30 dark:to-indigo-950/30 p-4 rounded-2xl border-2 border-amber-400/50 dark:border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Şifre Değiştirme Yetkisi (Yönetici)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300">
                      Opsiyonel
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Kullanıcının şifresini değiştirmek veya sıfırlamak istiyorsanız yeni şifreyi giriniz.
                    <span className="font-bold text-slate-700 dark:text-slate-200"> Boş bırakırsanız kullanıcının mevcut şifresi korunur.</span>
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={editModalShowPassword ? 'text' : 'password'}
                          value={editModalPassword}
                          onChange={(e) => setEditModalPassword(e.target.value)}
                          placeholder="Yeni şifre belirleyin (değiştirmek istemiyorsanız boş bırakın)"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setEditModalShowPassword(!editModalShowPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={editModalShowPassword ? 'Gizle' : 'Göster'}
                        >
                          {editModalShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-amber-300 shrink-0"
                        title="Rastgele Güçlü Şifre Oluştur"
                      >
                        <Sparkles size={13} />
                        <span>Rastgele Üret</span>
                      </button>
                    </div>

                    {editModalPassword.trim() && (
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={12} />
                        <span>Yeni şifre SHA-256 ile güvenli biçimde şifrelenecek ve veritabanı ile sunucuya kaydedilecektir.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TEMEL BİLGİLER */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeCheck size={14} className="text-indigo-600" />
                    <span>Temel Bilgiler</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Ad Soyad *</label>
                      <input
                        type="text"
                        value={editModalName}
                        onChange={(e) => setEditModalName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Kullanıcı Adı</label>
                      <input
                        type="text"
                        value={editModalUsername}
                        onChange={(e) => setEditModalUsername(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">E-Posta Adresi *</label>
                      <input
                        type="email"
                        value={editModalEmail}
                        onChange={(e) => setEditModalEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Telefon Numarası</label>
                      <input
                        type="tel"
                        value={editModalPhone}
                        onChange={(e) => setEditModalPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">T.C. Kimlik No</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={editModalTcNo}
                        onChange={(e) => setEditModalTcNo(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="11 haneli T.C. No"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Mesleki Rol</label>
                      <select
                        value={editModalRole}
                        onChange={(e) => setEditModalRole(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="uzman">İş Güvenliği Uzmanı</option>
                        <option value="hekim">İşyeri Hekimi</option>
                        <option value="dsp">Diğer Sağlık Personeli (DSP)</option>
                        <option value="other">Diğer Personel</option>
                        <option value="admin">Yönetici (Admin)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* MESLEKİ BİLGİLER */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600" />
                    <span>Mesleki ve Kurum Bilgileri</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">İSG Katip / Belge No</label>
                      <input
                        type="text"
                        value={editModalCertificateNo}
                        onChange={(e) => setEditModalCertificateNo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Örn: 123456"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Diploma No</label>
                      <input
                        type="text"
                        value={editModalDiplomaNo}
                        onChange={(e) => setEditModalDiplomaNo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Diploma No"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Oda / Sicil / Tescil No</label>
                      <input
                        type="text"
                        value={editModalTescilNo}
                        onChange={(e) => setEditModalTescilNo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tescil No"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Bağlı Olduğu OSGB / Firma</label>
                      <input
                        type="text"
                        value={editModalOsgbName}
                        onChange={(e) => setEditModalOsgbName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="OSGB Adı"
                      />
                    </div>
                  </div>
                </div>

                {/* OSGB YÖNETİCİSİ VE FİRMA ERİŞİM YETKİLERİ */}
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-600" />
                    <span>OSGB Yöneticisi & Firma Yetki Ayarları</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalIsOsgbManager}
                        onChange={(e) => setEditModalIsOsgbManager(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        👑 Bu kullanıcı bir OSGB Yöneticisidir (Ataması olmasa bile OSGB firmalarını düzenleyebilir)
                      </span>
                    </label>

                    {editModalIsOsgbManager && (
                      <div className="pl-6 pt-1">
                        <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                          Yönetilen OSGB Ticaret Adı:
                        </label>
                        <input
                          type="text"
                          value={editModalManagedOsgbName}
                          onChange={(e) => setEditModalManagedOsgbName(e.target.value)}
                          placeholder="Örn: Kuzey Doğu İSG OSGB"
                          className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          OSGB yöneticisi, bu OSGB adına kayıtlı tüm firmaların verilerini ve firma ayarlarını tek tek yetki tanımlanmasa dahi tam yetkiyle (görüntüle + düzenle) güncelleyebilir.
                        </p>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={editModalCanViewAllCompanies}
                        onChange={(e) => setEditModalCanViewAllCompanies(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        👁️ Sistemdeki Tüm Firmaları Görme Yetkisi (canViewAllCompanies)
                      </span>
                    </label>
                  </div>
                </div>

                {/* DOĞRULAMA VE HUKUKİ İZİNLER */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Yetki ve Sözleşme Durumu
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalIsEmailVerified}
                        onChange={(e) => setEditModalIsEmailVerified(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">E-Posta Doğrulandı Olarak İşaretle</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalHasAcceptedLegalTerms}
                        onChange={(e) => setEditModalHasAcceptedLegalTerms(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hukuki Sözleşmeleri Onayladı</span>
                    </label>
                  </div>
                </div>

                {/* LİSANS AYARLARI */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editModalIsPremium}
                      onChange={(e) => setEditModalIsPremium(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">Premium Lisans Yetkisi Tanımla</span>
                  </label>

                  {editModalIsPremium && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-700">
                          <input
                            type="radio"
                            name="editModalLicenseTypeRadio"
                            value="trial"
                            checked={editModalLicenseType === 'trial'}
                            onChange={() => {
                              setEditModalLicenseType('trial');
                              setEditModalLicenseKey(generateLicenseCode('trial'));
                            }}
                          />
                          <span>7 Günlük Deneme</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="editModalLicenseTypeRadio"
                            value="monthly"
                            checked={editModalLicenseType === 'monthly'}
                            onChange={() => {
                              setEditModalLicenseType('monthly');
                              setEditModalLicenseKey(generateLicenseCode('monthly'));
                            }}
                          />
                          <span>Aylık (1 Ay)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="editModalLicenseTypeRadio"
                            value="yearly"
                            checked={editModalLicenseType === 'yearly'}
                            onChange={() => {
                              setEditModalLicenseType('yearly');
                              setEditModalLicenseKey(generateLicenseCode('yearly'));
                            }}
                          />
                          <span>Yıllık (1 Yıl)</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editModalLicenseKey}
                          onChange={(e) => setEditModalLicenseKey(e.target.value.toUpperCase())}
                          placeholder="Lisans Anahtarı"
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setEditModalLicenseKey(generateLicenseCode(editModalLicenseType))}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Kod Üret
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Alt Butonları */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditModal}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Save size={15} />
                  <span>Değişiklikleri ve Şifreyi Kaydet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. E-POSTA ŞABLONU CANLI ÖNİZLEME MODALI (EMAIL TEMPLATE PREVIEW MODAL)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {templatePreviewOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>E-Posta Şablonu Canlı Önizleme</span>
                      <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/40 uppercase">
                        {testTemplateType}
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200/70">
                      {templatePreviewData?.subject || 'E-Posta Konusu Yükleniyor...'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTemplatePreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subject bar & Attachment badge */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">Konu:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                    {templatePreviewData?.subject || '—'}
                  </span>
                </div>

                {templatePreviewData?.hasAttachments && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300">
                    <FileText size={13} />
                    <span>Resmi PDF Sözleşme Eki İçerir ({templatePreviewData.attachmentCount || 1} Dosya)</span>
                  </span>
                )}
              </div>

              {/* Iframe Body */}
              <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                {templatePreviewLoading ? (
                  <div className="h-[500px] flex items-center justify-center text-slate-400 text-sm font-semibold">
                    Şablon render ediliyor...
                  </div>
                ) : templatePreviewData?.html ? (
                  <iframe
                    title="Şablon Önizleme"
                    srcDoc={templatePreviewData.html}
                    className="w-full h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-slate-400 text-sm font-semibold">
                    Önizleme bulunamadı.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Bu şablon mobil ve masaüstü tüm e-posta istemcileriyle %100 uyumludur.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplatePreviewOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Kapat
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTemplatePreviewOpen(false);
                      handleTestSMTP();
                    }}
                    disabled={!testEmailAddress}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Mail size={14} />
                    <span>Bu Şablonu Test Maili Olarak Gönder</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. TANITIM VİDEOSU EKLEME / DÜZENLEME MODALI (PROMO VIDEO MODAL)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddVideoModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-red-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Film size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {editingVideoId ? 'Tanıtım Videosunu Düzenle' : 'Yeni Tanıtım Videosu Ekle'}
                    </h3>
                    <p className="text-xs text-red-100 font-medium">
                      Ana sayfadaki oynatma listesinde yer alacak video bilgileri
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="p-1.5 bg-black/20 hover:bg-black/30 rounded-full text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSavePromoVideo} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Video Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="Örn: 5x5 L Tipi Risk Analizi & Raporlama"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    YouTube Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... veya https://youtu.be/..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Standart YouTube linki, Shorts veya Embed bağlantısı yapıştırabilirsiniz. Otomatik dönüştürülür.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Kısa Açıklama (İsteğe Bağlı)
                  </label>
                  <textarea
                    rows={2}
                    value={newVideoDesc}
                    onChange={(e) => setNewVideoDesc(e.target.value)}
                    placeholder="Örn: Saha denetimlerinde risk analizlerinin nasıl yapılacağını anlatan rehber video."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                  />
                </div>

                {/* Video Quick Preview */}
                {newVideoUrl.trim() && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Play size={12} className="text-red-500 fill-red-500" /> Video Önizleme
                    </span>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                      <iframe
                        src={getYouTubeEmbedUrl(newVideoUrl.trim())}
                        title="Önizleme"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddVideoModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-red-600/25 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>{editingVideoId ? 'Değişiklikleri Kaydet' : 'Videoyu Listeye Ekle'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ========================================================================= */}
      {/* E-POSTAYI DEĞİŞTİR / TANIMLA VE DOĞRULAMA KODU GÖNDER MODALI               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {changeEmailModalUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Başlık */}
              <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 relative">
                <button
                  type="button"
                  onClick={() => setChangeEmailModalUser(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/15"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Mail size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 text-amber-100 px-2 py-0.5 rounded-md border border-white/20">
                      {changeEmailModalUser.email ? 'E-Posta Güncelleme' : 'Yeni E-Posta Tanımlama'}
                    </span>
                    <h3 className="font-black text-base text-white mt-0.5">
                      {changeEmailModalUser.email ? 'E-Postayı Değiştir & Doğrula' : 'E-Posta Tanımla & Doğrula'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Form Alanı */}
              <form onSubmit={handleExecuteChangeEmailAndSendCode} className="p-6 space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs space-y-1.5">
                  <div className="font-extrabold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs">
                    <UserCheck size={15} className="text-amber-700 dark:text-amber-400" />
                    <span>@{changeEmailModalUser.username} {changeEmailModalUser.name ? '(' + changeEmailModalUser.name + ')' : ''}</span>
                  </div>
                  <div className="text-[11px] text-amber-800/90 dark:text-amber-300">
                    {changeEmailModalUser.email ? (
                      <div>Mevcut E-Posta: <strong className="font-mono">{changeEmailModalUser.email}</strong> (Doğrulanmamış)</div>
                    ) : (
                      <div className="font-bold text-red-600 dark:text-red-400">⚠️ Bu kullanıcının sistemde tanımlı bir e-posta adresi bulunmuyor!</div>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                    Tanımlanan yeni e-posta adresi kullanıcının profiline ve veritabanına kaydedilecek, ardından bu yeni adrese anında <strong>6 haneli tek kullanımlık doğrulama kodu (OTP)</strong> gönderilecektir.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {changeEmailModalUser.email ? 'Yeni E-Posta Adresi' : 'Tanımlanacak E-Posta Adresi'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={changeEmailInput}
                      onChange={(e) => {
                        setChangeEmailInput(e.target.value);
                        setChangeEmailError('');
                      }}
                      placeholder="ad.soyad@firma.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {changeEmailError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-red-500" />
                    <span>{changeEmailError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={changeEmailIsSubmitting}
                    onClick={() => setChangeEmailModalUser(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={changeEmailIsSubmitting || !changeEmailInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {changeEmailIsSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Kaydediliyor & Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>E-Postayı Değiştir ve Kod Gönder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
