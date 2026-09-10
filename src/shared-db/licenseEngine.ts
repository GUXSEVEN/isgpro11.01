/**
 * İSG Ortak Lisans Motoru (Ortak Kurallar & Algoritmalar)
 * Bu dosyadaki değişiklikler her iki projeyi de anında etkiler.
 */

import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export type LicenseType = 'monthly' | 'yearly' | 'trial' | 'demo';

export interface LicenseRecord {
  licenseKey: string;
  licenseType: LicenseType;
  createdAt: string;
  expiresAt: string;
  assignedEmail?: string | null;
  used: boolean;
  usedByEmail?: string | null;
  usedAt?: string | null;
}

/**
 * Lisans kodunun önekine bakarak lisans tipini çözümler.
 * ISG-T... / ISGTRL... -> trial (7 gün)
 * ISG-M... / ISGMTH... -> monthly (30 gün)
 * ISG-Y... / ISGYRL... -> yearly (365 gün)
 * ISG-D...             -> demo (10 dakika)
 */
export function getLicenseTypeFromKey(rawKey?: string | null): LicenseType {
  if (!rawKey || typeof rawKey !== 'string') return 'yearly';
  const clean = rawKey.trim().toUpperCase();
  if (clean.startsWith('ISG-T') || clean.startsWith('ISGTRL') || clean.includes('-T-') || clean.includes('TRIAL') || clean.includes('DENEME')) {
    return 'trial';
  }
  if (clean.startsWith('ISG-M') || clean.startsWith('ISGMTH') || clean.includes('-M-') || clean.includes('MONTH') || clean.includes('AYLIK')) {
    return 'monthly';
  }
  if (clean.startsWith('ISG-D') || clean.includes('-D-') || clean.includes('DEMO')) {
    return 'demo';
  }
  return 'yearly';
}

/**
 * Lisans tipine göre geçerlilik süresini gün cinsinden döndürür.
 */
export function getLicenseDurationDays(type: LicenseType): number {
  switch (type) {
    case 'trial': return 7;
    case 'monthly': return 30;
    case 'demo': return 0.007; // ~10 dakika
    case 'yearly': default: return 365;
  }
}

/**
 * Kullanıcı dostu Türkçe plan adı.
 */
export function getLicensePlanName(type?: LicenseType | null): string {
  switch (type) {
    case 'trial': return '7 Günlük Ücretsiz Deneme';
    case 'monthly': return 'Aylık Pro Plan';
    case 'demo': return '10 Dakikalık Demo Test';
    case 'yearly': default: return 'Yıllık Pro Plan';
  }
}

/**
 * Bir kullanıcının lisansının şu an aktif ve süresinin geçmemiş olduğunu kontrol eder.
 */
export function isLicenseActive(userOrRecord?: { isPremium?: boolean; licenseExpiresAt?: string | null } | null): boolean {
  if (!userOrRecord || !userOrRecord.isPremium) return false;
  if (!userOrRecord.licenseExpiresAt) return true;
  const expiresAtMs = new Date(userOrRecord.licenseExpiresAt).getTime();
  if (isNaN(expiresAtMs)) return true;
  return Date.now() <= expiresAtMs;
}

/**
 * Kalan gün, saat ve süre dolum bilgisini hesaplar.
 */
export function getRemainingLicenseTime(expiresAt?: string | null): {
  days: number;
  hours: number;
  isExpired: boolean;
  label: string;
} {
  if (!expiresAt) {
    return { days: 999, hours: 9999, isExpired: false, label: 'Süresiz / Aktif' };
  }
  const expiryMs = new Date(expiresAt).getTime();
  if (isNaN(expiryMs)) {
    return { days: 999, hours: 9999, isExpired: false, label: 'Bilinmiyor' };
  }
  const diffMs = expiryMs - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, isExpired: true, label: 'Süresi Doldu' };
  }
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) {
    return { days, hours, isExpired: false, label: `${days} gün kaldı` };
  }
  const mins = Math.floor((diffMs % (60 * 1000)) / 1000);
  return { days: 0, hours, isExpired: false, label: `${hours} saat ${mins} dk kaldı` };
}

/**
 * Yeni standart dijital lisans anahtarı üretir.
 * Format: ISG-[TYPE]-[TIMESTAMP_BASE36]-[4CHAR]-[4CHAR]
 * Örnek Trial:   ISG-T-2G7DGY-8V1X-4K9P
 * Örnek Monthly: ISG-M-2G7DGY-9K4P-7M2Q
 * Örnek Yearly:  ISG-Y-2G7DGY-3B8N-5X1L
 */
export function generateLicenseKey(type: LicenseType = 'yearly', createdAtMs: number = Date.now()): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randSeg = (len = 4) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const tsBase36 = Math.floor(createdAtMs / 1000).toString(36).toUpperCase();
  let prefix = 'ISG-Y';
  if (type === 'monthly') prefix = 'ISG-M';
  else if (type === 'trial') prefix = 'ISG-T';
  else if (type === 'demo') prefix = 'ISG-D';
  return `${prefix}-${tsBase36}-${randSeg(4)}-${randSeg(4)}`;
}

/**
 * Üretilen lisansı Firestore ('generated_licenses' ve 'licenses') ve LocalStorage'a kaydeder.
 */
export async function registerGeneratedLicense(
  rawKey: string,
  type: LicenseType = 'yearly',
  assignedEmail?: string | null,
  customCreatedAt?: string | null,
  customExpiresAt?: string | null
): Promise<LicenseRecord> {
  const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const now = customCreatedAt ? new Date(customCreatedAt) : new Date();
  
  let expiresAtDate: Date;
  if (customExpiresAt) {
    expiresAtDate = new Date(customExpiresAt);
  } else {
    expiresAtDate = new Date(now.getTime());
    const durationDays = getLicenseDurationDays(type);
    if (type === 'demo') {
      expiresAtDate.setMinutes(expiresAtDate.getMinutes() + 10);
    } else {
      expiresAtDate.setDate(expiresAtDate.getDate() + durationDays);
    }
  }

  const record: LicenseRecord = {
    licenseKey: cleanKey,
    licenseType: type,
    createdAt: now.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    assignedEmail: assignedEmail ? assignedEmail.trim().toLowerCase() : null,
    used: false,
    usedByEmail: null,
    usedAt: null
  };

  // Ortak Firestore Kaydı
  if (db) {
    try {
      await setDoc(doc(db, 'generated_licenses', cleanKey), record, { merge: true });
      await setDoc(doc(db, 'licenses', cleanKey), {
        ...record,
        status: 'active',
        type
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore Lisans Kayıt Hatası]:', err);
    }
  }

  // LocalStorage Önbelleği
  try {
    const cached = localStorage.getItem('isg_generated_licenses_v1');
    const records: Record<string, LicenseRecord> = cached ? JSON.parse(cached) : {};
    records[cleanKey] = record;
    localStorage.setItem('isg_generated_licenses_v1', JSON.stringify(records));
  } catch (e) {}

  return record;
}

/**
 * Veritabanındaki lisansı doğrular.
 */
export async function validateLicenseAgainstDb(
  rawKey: string,
  userEmail?: string | null
): Promise<{ valid: boolean; error?: string; record?: LicenseRecord }> {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'Lütfen geçerli bir lisans kodu giriniz.' };
  }

  const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  let record: LicenseRecord | null = null;

  // 1. LocalStorage
  try {
    const cached = localStorage.getItem('isg_generated_licenses_v1');
    if (cached) {
      const records: Record<string, LicenseRecord> = JSON.parse(cached);
      if (records[cleanKey]) record = records[cleanKey];
    }
  } catch (e) {}

  // 2. Firestore generated_licenses
  if (!record && db) {
    try {
      const snap = await getDoc(doc(db, 'generated_licenses', cleanKey));
      if (snap.exists()) record = snap.data() as LicenseRecord;
    } catch (e) {}
  }

  // 3. Firestore licenses
  if (!record && db) {
    try {
      const snap = await getDoc(doc(db, 'licenses', cleanKey));
      if (snap.exists()) {
        const d = snap.data();
        const type = (d.type || d.licenseType || getLicenseTypeFromKey(cleanKey)) as LicenseType;
        record = {
          licenseKey: cleanKey,
          licenseType: type,
          createdAt: d.createdAt || new Date().toISOString(),
          expiresAt: d.expiresAt || new Date(Date.now() + getLicenseDurationDays(type) * 86400000).toISOString(),
          assignedEmail: d.email || d.assignedEmail || null,
          used: d.status === 'used' || d.used === true,
          usedByEmail: d.usedByEmail || null,
          usedAt: d.usedAt || null
        };
      }
    } catch (e) {}
  }

  // 4. Firestore users
  if (!record && db) {
    try {
      const querySnap = await getDocs(collection(db, 'users'));
      querySnap.forEach((uDoc) => {
        const uData = uDoc.data();
        if (uData && uData.licenseKey && uData.licenseKey.trim().toUpperCase() === cleanKey) {
          const type: LicenseType = (uData.licenseType as LicenseType) || getLicenseTypeFromKey(cleanKey);
          const createdAt = uData.licensePurchasedAt || new Date().toISOString();
          const expiresAt = uData.licenseExpiresAt || new Date(Date.now() + getLicenseDurationDays(type) * 86400000).toISOString();
          record = {
            licenseKey: cleanKey,
            licenseType: type,
            createdAt,
            expiresAt,
            assignedEmail: uData.email || null,
            used: true,
            usedByEmail: uData.email || null,
            usedAt: createdAt
          };
        }
      });
    } catch (e) {}
  }

  if (!record) {
    return {
      valid: false,
      error: 'Girilen lisans kodu sistemde bulunamadı. Lütfen yöneticiniz veya resmi sistem tarafından üretilmiş geçerli dijital lisans kodunu giriniz.'
    };
  }

  // Süre aşımı
  const nowMs = Date.now();
  const expiresAtMs = new Date(record.expiresAt).getTime();

  if (nowMs > expiresAtMs) {
    const formattedExpiry = new Date(expiresAtMs).toLocaleDateString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const typeLabel = getLicensePlanName(record.licenseType);
    return {
      valid: false,
      error: `Bu ${typeLabel} lisansının geçerlilik süresi dolmuştur! Bitiş zamanı: ${formattedExpiry}.`
    };
  }

  // E-posta kontrolü
  if (record.assignedEmail && userEmail && record.assignedEmail.toLowerCase() !== userEmail.toLowerCase().trim()) {
    return {
      valid: false,
      error: `Bu lisans kodu yalnızca '${record.assignedEmail}' e-posta adresi için özel üretilmiştir.`
    };
  }

  return { valid: true, record };
}

/**
 * 7 Günlük Deneme Lisansı Talep Etme
 */
export async function requestTrialLicense(
  email: string,
  name: string = ''
): Promise<{ success: boolean; error?: string; licenseKey?: string; record?: LicenseRecord }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' };
  }

  // 1. LocalStorage
  try {
    const cachedTrials = localStorage.getItem('isg_trial_requests_v1');
    if (cachedTrials) {
      const trials = JSON.parse(cachedTrials);
      if (trials[cleanEmail]) {
        return {
          success: false,
          error: `Bu e-posta adresi (${cleanEmail}) için daha önce 7 günlük ücretsiz deneme lisansı oluşturulmuştur (${trials[cleanEmail].licenseKey}). Her e-posta yalnızca 1 defa yararlanabilir.`
        };
      }
    }
  } catch (e) {}

  // 2. Firestore
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'trial_requests', cleanEmail));
      if (snap.exists()) {
        const prevData = snap.data();
        return {
          success: false,
          error: `Bu e-posta adresi (${cleanEmail}) için daha önce 7 günlük ücretsiz deneme lisansı oluşturulmuştur (${prevData.licenseKey || 'Kayıtlı'}). Her e-posta yalnızca 1 defa yararlanabilir.`
        };
      }
    } catch (e) {}
  }

  // 3. Üret ve Kaydet
  const trialKey = generateLicenseKey('trial');
  const record = await registerGeneratedLicense(trialKey, 'trial', cleanEmail);

  const trialRecord = {
    email: cleanEmail,
    name: name || 'Deneme Kullanıcısı',
    licenseKey: trialKey,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt
  };

  if (db) {
    try {
      await setDoc(doc(db, 'trial_requests', cleanEmail), trialRecord, { merge: true });
    } catch (e) {}
  }

  try {
    const cachedTrials = localStorage.getItem('isg_trial_requests_v1');
    const trials = cachedTrials ? JSON.parse(cachedTrials) : {};
    trials[cleanEmail] = trialRecord;
    localStorage.setItem('isg_trial_requests_v1', JSON.stringify(trials));
  } catch (e) {}

  return { success: true, licenseKey: trialKey, record };
}
