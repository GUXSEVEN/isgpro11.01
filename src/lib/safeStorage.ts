/**
 * ISGPRO Akıllı & Güvenli Depolama Katmanı (IndexedDB + LocalStorage Hibrit)
 * LocalStorage 5MB kotasını aşan durumlarda QuotaExceededError çökmelerini %100 engeller.
 * Veriyi IndexedDB üzerinde limitsiz saklar, LocalStorage için ise hafifletilmiş (lightweight) önbellek oluşturur.
 */

const DB_NAME = 'isg_landing_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'landing_data';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = (e) => {
          console.warn('[IndexedDB] Veritabanı açılamadı:', e);
          resolve(null);
        };
        req.onblocked = () => {
          console.warn('[IndexedDB] Veritabanı bloklandı.');
          resolve(null);
        };
      } catch (err) {
        console.warn('[IndexedDB] Başlatma hatası:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

/**
 * IndexedDB'ye asenkron limitsiz veri yaz
 */
export async function idbSet(key: string, value: any): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * IndexedDB'den veri oku
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Kullanıcı nesnelerini LocalStorage kotasını aşmaması için hafifletir (yalnızca temel auth alanları)
 */
export function sanitizeUsersForStorage(users: any[]): any[] {
  if (!Array.isArray(users)) return [];
  return users.map(u => {
    if (!u || typeof u !== 'object') return u;
    return {
      username: u.username || '',
      email: u.email || '',
      role: u.role || 'other',
      password: u.password || '',
      name: u.name || '',
      isPremium: Boolean(u.isPremium),
      licenseKey: u.licenseKey || '',
      licenseType: u.licenseType || '',
      licenseExpiresAt: u.licenseExpiresAt || '',
      licensePurchasedAt: u.licensePurchasedAt || '',
      hasAcceptedLegalTerms: Boolean(u.hasAcceptedLegalTerms),
      isEmailVerified: Boolean(u.isEmailVerified),
      phone: u.phone || '',
      certificateNo: u.certificateNo || '',
      subscriptionStatus: u.subscriptionStatus || ''
    };
  });
}

/**
 * Hibrit Güvenli Kayıt:
 * 1. IndexedDB'ye arka planda asenkron kaydeder (asla kota hatası vermez).
 * 2. LocalStorage'a kaydetmeyi dener.
 * 3. QuotaExceededError oluşursa asla fırlatmaz (çökme olmaz); gereksiz kopyaları temizler,
 *    veriyi hafifletir ve güvenle saklar.
 */
export const safeSetItem = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. IndexedDB'ye kaydet
  try {
    idbSet(key, value).catch(() => {});
  } catch (_) {}

  // 2. LocalStorage'a kaydetmeyi dene
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (quotaError: any) {
    console.warn(`[SafeStorage] LocalStorage kotası doldu (${key}). Optimizasyon uygulanıyor...`);

    // A) Eski/mükerrer anahtarları temizle
    try {
      if (key === 'isg_landing_users_v1' || key === 'isg_users_db') {
        localStorage.removeItem('isg_users_db'); // Çift kopyayı kaldır
      }
      // Geçici/isteğe bağlı önbellekleri silerek yer aç
      localStorage.removeItem('isg_presets_v1');
      localStorage.removeItem('isg_reviews_v1');
    } catch (_) {}

    // B) Eğer kullanıcı listesi kaydediliyorsa, devasa verileri soyup hafifletilmiş haliyle dene
    try {
      if (Array.isArray(value)) {
        const lightweight = sanitizeUsersForStorage(value);
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch (_) {}

    // C) Eğer hala sığmıyorsa bu anahtarı LocalStorage'dan silip IndexedDB işaretçisi bırak
    try {
      localStorage.removeItem(key);
      localStorage.setItem(`${key}_in_idb`, 'true');
    } catch (_) {}

    return false;
  }
};

/**
 * Güvenli LocalStorage Okuma
 */
export const safeGetItem = <T = any>(key: string, fallback: T | null = null): T | null => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
};

/**
 * Güvenli LocalStorage Silme
 */
export const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_in_idb`);
  } catch (_) {}
};

