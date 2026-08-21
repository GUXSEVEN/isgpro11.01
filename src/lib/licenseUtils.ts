import { db } from './firebase.ts';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { encryptSensitiveData } from './crypto.ts';

export type LicenseType = 'monthly' | 'yearly' | 'trial' | 'demo';

export interface LicenseRecord {
  licenseKey: string;
  encryptedKey: string;
  licenseType: LicenseType;
  createdAt: string;
  expiresAt: string;
  assignedEmail?: string | null;
  used: boolean;
  usedByEmail?: string | null;
  usedAt?: string | null;
}

/**
 * Generates a license key with embedded creation timestamp in base36 format.
 * Format: ISG-[TYPE]-[TIMESTAMP_BASE36]-[RANDOM_4CHAR]-[RANDOM_4CHAR]
 * Example Monthly: ISG-M-2G7DGY-9K4P-7M2Q
 * Example Yearly:  ISG-Y-2G7DGY-3B8N-5X1L
 * Example Trial:   ISG-T-2G7DGY-8V1X-4K9P
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
 * Registers a newly generated or assigned digital license key into Firestore & local storage with encryption.
 */
export async function registerGeneratedLicense(
  rawKey: string,
  type: LicenseType,
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
    if (type === 'trial') {
      expiresAtDate.setDate(expiresAtDate.getDate() + 7);
    } else if (type === 'monthly') {
      expiresAtDate.setDate(expiresAtDate.getDate() + 30);
    } else if (type === 'demo') {
      expiresAtDate.setMinutes(expiresAtDate.getMinutes() + 10);
    } else {
      expiresAtDate.setDate(expiresAtDate.getDate() + 365);
    }
  }

  const record: LicenseRecord = {
    licenseKey: cleanKey,
    encryptedKey: encryptSensitiveData(cleanKey),
    licenseType: type,
    createdAt: now.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    assignedEmail: assignedEmail || null,
    used: false,
    usedByEmail: null,
    usedAt: null
  };

  // Save to Firestore
  if (db) {
    try {
      const docRef = doc(db, 'generated_licenses', cleanKey);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn('Error saving generated license to Firestore:', err);
    }
  }

  // Local Storage fallback cache
  try {
    const cached = localStorage.getItem('isg_generated_licenses_v1');
    const records: Record<string, LicenseRecord> = cached ? JSON.parse(cached) : {};
    records[cleanKey] = record;
    localStorage.setItem('isg_generated_licenses_v1', JSON.stringify(records));
  } catch (e) {}

  return record;
}

/**
 * Validates a license key against database records and system clock.
 */
export async function validateLicenseAgainstDb(
  rawKey: string,
  userEmail?: string | null
): Promise<{ valid: boolean; error?: string; record?: LicenseRecord }> {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'Lütfen lisans kodunu giriniz.' };
  }

  const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  let record: LicenseRecord | null = null;

  // 1. Try local storage cache first
  try {
    const cached = localStorage.getItem('isg_generated_licenses_v1');
    if (cached) {
      const records: Record<string, LicenseRecord> = JSON.parse(cached);
      if (records[cleanKey]) {
        record = records[cleanKey];
      }
    }
  } catch (e) {}

  // 2. Fetch from Firestore
  if (!record && db) {
    try {
      const docRef = doc(db, 'generated_licenses', cleanKey);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        record = snap.data() as LicenseRecord;
      }
    } catch (err) {
      console.warn('Error checking Firestore generated_licenses:', err);
    }
  }

  // 3. Fallback: Check if key exists in users collection (pre-existing licenses)
  if (!record && db) {
    try {
      const querySnap = await getDocs(collection(db, 'users'));
      querySnap.forEach((uDoc) => {
        const uData = uDoc.data();
        if (uData && uData.licenseKey && uData.licenseKey.trim().toUpperCase() === cleanKey) {
          const type: LicenseType = (uData.licenseType as LicenseType) || 'yearly';
          const createdAt = uData.licensePurchasedAt || new Date().toISOString();
          const expiresAt = uData.licenseExpiresAt || new Date(Date.now() + (type === 'trial' ? 7 : type === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
          
          record = {
            licenseKey: cleanKey,
            encryptedKey: encryptSensitiveData(cleanKey),
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

  // 4. Reject if license record is not found in database
  if (!record) {
    return {
      valid: false,
      error: 'Girilen lisans kodu sistemde bulunamadı. Lütfen yalnızca yönetici veya resmi sistem tarafından üretilmiş geçerli dijital lisans kodunu giriniz.'
    };
  }

  // 5. System Clock Expiration Check
  const nowMs = Date.now();
  const expiresAtMs = new Date(record.expiresAt).getTime();

  if (nowMs > expiresAtMs) {
    const formattedExpiry = new Date(expiresAtMs).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedCreated = new Date(record.createdAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return {
      valid: false,
      error: `Bu 7 günlük deneme lisansının süresi dolmuştur! Üretilme Tarihi: ${formattedCreated}, Bitiş Zamanı: ${formattedExpiry}.`
    };
  }

  // 6. Strict Assigned Email check (Trial or Custom licenses)
  if (record.assignedEmail && userEmail && record.assignedEmail.toLowerCase() !== userEmail.toLowerCase().trim()) {
    return {
      valid: false,
      error: `Bu lisans kodu yalnızca '${record.assignedEmail}' e-posta adresi için özel üretilmiştir. Farklı bir hesapla etkinleştirilemez.`
    };
  }

  // 7. Check if license was already used by another account (Single-Use Activation)
  if (record.used) {
    if (record.usedByEmail && userEmail && record.usedByEmail.toLowerCase() !== userEmail.toLowerCase().trim()) {
      return {
        valid: false,
        error: `Bu lisans kodu daha önce '${record.usedByEmail}' e-posta adresi tarafından etkinleştirilmiştir. Aynı kod başka bir hesapta kullanılamaz.`
      };
    }
  }

  return { valid: true, record };
}

/**
 * Requests a 7-Day Free Trial License for a user.
 * Enforces strictly 1 trial license per email address.
 */
export async function requestTrialLicense(
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string; licenseKey?: string; record?: LicenseRecord }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' };
  }

  // 1. Local Cache check
  try {
    const cachedTrials = localStorage.getItem('isg_trial_requests_v1');
    if (cachedTrials) {
      const trials: Record<string, any> = JSON.parse(cachedTrials);
      if (trials[cleanEmail]) {
        const prevKey = trials[cleanEmail].licenseKey;
        return {
          success: false,
          error: `Bu e-posta adresi (${cleanEmail}) için daha önce 7 günlük ücretsiz deneme lisansı oluşturulmuştur (${prevKey}). Sistemimizde her e-posta hesabı ücretsiz deneme sürümünden yalnızca 1 defa yararlanabilir.`
        };
      }
    }
  } catch (e) {}

  // 2. Firestore check
  if (db) {
    try {
      const trialDocRef = doc(db, 'trial_requests', cleanEmail);
      const snap = await getDoc(trialDocRef);
      if (snap.exists()) {
        const prevData = snap.data();
        return {
          success: false,
          error: `Bu e-posta adresi (${cleanEmail}) için daha önce 7 günlük ücretsiz deneme lisansı oluşturulmuştur (${prevData.licenseKey || 'Sistem Kaydı'}). Sistemimizde her e-posta hesabı ücretsiz deneme sürümünden yalnızca 1 defa yararlanabilir.`
        };
      }
    } catch (err) {
      console.warn('Error checking trial_requests Firestore:', err);
    }
  }

  // 3. Generate new 7-Day Trial key
  const trialKey = generateLicenseKey('trial');
  const record = await registerGeneratedLicense(trialKey, 'trial', cleanEmail);

  // 4. Record trial usage
  const trialRecord = {
    email: cleanEmail,
    name: name || 'Deneme Kullanıcısı',
    licenseKey: trialKey,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt
  };

  if (db) {
    try {
      const trialDocRef = doc(db, 'trial_requests', cleanEmail);
      await setDoc(trialDocRef, trialRecord, { merge: true });
    } catch (err) {
      console.warn('Error saving trial request to Firestore:', err);
    }
  }

  try {
    const cachedTrials = localStorage.getItem('isg_trial_requests_v1');
    const trials: Record<string, any> = cachedTrials ? JSON.parse(cachedTrials) : {};
    trials[cleanEmail] = trialRecord;
    localStorage.setItem('isg_trial_requests_v1', JSON.stringify(trials));
  } catch (e) {}

  return { success: true, licenseKey: trialKey, record };
}
