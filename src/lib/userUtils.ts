import { User } from '../types';
import { getLicenseTypeFromKey, isLicenseActive } from './licenseUtils';
import { encryptUser, decryptUser } from './crypto';

/**
 * Normalizes username by trimming leading/trailing spaces, removing internal whitespace,
 * handling Turkish characters (İ->i, I->i, ı->i), and converting to lowercase.
 * This guarantees complete case-insensitivity and immunity to accidental trailing spaces.
 */
export function normalizeUsername(str: string): string {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/\s+/g, '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase();
}

/**
 * Intelligently generates available alternative username suggestions when a collision occurs.
 * Guarantees that none of the returned suggestions are already taken.
 */
export function generateAvailableUsernameSuggestions(
  requestedUsername: string,
  fullName?: string,
  existingUsers?: Array<{ username?: string }>
): string[] {
  const base = normalizeUsername(requestedUsername).replace(/[^a-z0-9_.]/g, '') || 'isg';
  const currentYear = new Date().getFullYear();
  const existingSet = new Set<string>();

  if (Array.isArray(existingUsers)) {
    for (const u of existingUsers) {
      if (u?.username) {
        existingSet.add(normalizeUsername(u.username));
      }
    }
  }

  const candidates: string[] = [];

  // Full name based suggestions (e.g. Ahmet Yılmaz -> ahmet.yilmaz, ahmet_yilmaz, ahmetyilmaz)
  if (fullName) {
    const parts = fullName.trim().toLowerCase().split(/\s+/).map(p => normalizeUsername(p).replace(/[^a-z0-9]/g, ''));
    if (parts.length >= 2) {
      const f = parts[0];
      const l = parts[parts.length - 1];
      if (f && l) {
        candidates.push(`${f}.${l}`);
        candidates.push(`${f}_${l}`);
        candidates.push(`${f}${l}`);
        candidates.push(`${f}${l.charAt(0)}`);
      }
    }
  }

  // Base username with numbers and suffixes
  candidates.push(`${base}_${currentYear}`);
  candidates.push(`${base}${currentYear}`);
  candidates.push(`${base}_isg`);
  candidates.push(`${base}.isg`);
  candidates.push(`${base}_pro`);
  candidates.push(`${base}1`);
  candidates.push(`${base}2`);
  candidates.push(`${base}${Math.floor(10 + Math.random() * 89)}`);
  candidates.push(`${base}_${Math.floor(10 + Math.random() * 89)}`);

  // Filter out candidates that already exist or are too short
  const available = candidates.filter(c => c && c.length >= 3 && !existingSet.has(normalizeUsername(c)));

  // Return top 4 unique available candidates
  return Array.from(new Set(available)).slice(0, 4);
}

/**
 * Deduplicates and merges user records based on normalized email or username.
 * Ensures that if a user has multiple entries (e.g. "ibrahim" vs "ibrahimcoskun.gs.1905@gmail.com"),
 * they are merged into a single canonical user record preserving Premium license status,
 * latest timestamps, and correct profile metadata.
 */
export function deduplicateAndCleanUsers(usersList: User[]): User[] {
  if (!Array.isArray(usersList)) return [];

  const map = new Map<string, User>();

  for (const rawUserItem of usersList) {
    if (!rawUserItem) continue;
    const rawUser = decryptUser(rawUserItem);

    // Normalize email & username
    const normalizedUsername = normalizeUsername(rawUser.username || '');
    const normalizedEmail = (rawUser.email || '').toLowerCase().trim();

    if (!normalizedUsername && !normalizedEmail) continue;

    // Primary lookup key: normalized username if present, else doc ID or normalized email.
    // Accounts are uniquely identified by username. Distinct user accounts sharing the same email
    // address (up to 2 accounts) must NEVER be collapsed or merged into one another!
    const rawDocId = (rawUser as any)?.id ? String((rawUser as any).id).trim() : '';
    const key = normalizedUsername || (rawDocId ? rawDocId.toLowerCase() : '') || normalizedEmail;

    const initialType = rawUser.licenseType || (rawUser.licenseKey ? getLicenseTypeFromKey(rawUser.licenseKey) : null);
    const initialIsPremium = rawUser.role === 'admin' ? true : Boolean(rawUser.isPremium && isLicenseActive(rawUser));

    if (!map.has(key)) {
      map.set(key, {
        ...rawUser,
        username: normalizeUsername(rawUser.username || '') || rawDocId || normalizedEmail || 'kullanici',
        email: rawUser.email?.trim() || '',
        name: rawUser.name?.trim() || rawUser.username || 'Kullanıcı',
        isPremium: initialIsPremium,
        licenseType: initialType,
        isEmailVerified: Boolean(rawUser.isEmailVerified)
      });
    } else {
      const existing = map.get(key)!;

      // Determine active license details
      const activeLicenseKey = (rawUser.isPremium ? rawUser.licenseKey : existing.licenseKey) || rawUser.licenseKey || existing.licenseKey;
      const activeLicenseType = (rawUser.isPremium ? rawUser.licenseType : existing.licenseType) || 
                                rawUser.licenseType || existing.licenseType || 
                                (activeLicenseKey ? getLicenseTypeFromKey(activeLicenseKey) : null);
      const activePurchasedAt = rawUser.licensePurchasedAt || existing.licensePurchasedAt;
      const activeExpiresAt = rawUser.licenseExpiresAt || existing.licenseExpiresAt;

      // Determine canonical username
      let canonicalUsername = existing.username;
      if (!canonicalUsername || canonicalUsername.includes('@')) {
        if (rawUser.username && !rawUser.username.includes('@')) {
          canonicalUsername = rawUser.username;
        }
      }

      const role = (existing.role === 'admin' || rawUser.role === 'admin') ? 'admin' : (rawUser.role || existing.role || 'uzman');
      const isExistingPremium = Boolean(existing.isPremium);
      const isRawPremium = Boolean(rawUser.isPremium);
      const isPremiumCombined = isExistingPremium || isRawPremium;

      const candidateUser: Partial<User> = {
        isPremium: isPremiumCombined,
        licenseExpiresAt: activeExpiresAt,
        role
      };

      const finalIsPremium = role === 'admin' ? true : (isPremiumCombined && isLicenseActive(candidateUser));

      // Merge fields for the same user account
      const mergedUser: User = {
        ...existing,
        ...rawUser,
        username: canonicalUsername || existing.username || rawUser.username,
        name: (rawUser.name && rawUser.name !== rawUser.username ? rawUser.name : existing.name) || existing.name || rawUser.name,
        email: rawUser.email?.trim() || existing.email || '',
        phone: rawUser.phone || existing.phone || '',
        role,
        isPremium: finalIsPremium,
        licenseKey: activeLicenseKey || null,
        licenseType: activeLicenseType || null,
        licensePurchasedAt: activePurchasedAt || null,
        licenseExpiresAt: activeExpiresAt || null,
        password: existing.password || rawUser.password,
        certificateNo: rawUser.certificateNo || existing.certificateNo,
        isEmailVerified: rawUser.isEmailVerified !== undefined ? Boolean(rawUser.isEmailVerified) : Boolean(existing.isEmailVerified),
      };

      map.set(key, mergedUser);
    }
  }

  return Array.from(map.values());
}

/**
 * Sanitizes and normalizes user object for Firestore persistence.
 * - Completely eliminates 'undefined' values (which crash Firestore setDoc).
 * - Ensures all standard fields expected by the companion application (isg-projesi - Copy)
 *   are properly formatted and present with suitable fallbacks.
 */
export function sanitizeUserForFirestore(user: any): Record<string, any> {
  if (!user || typeof user !== 'object') return {};

  // Decrypt user fields first in case they were previously encrypted
  const decrypted = decryptUser(user);
  const cleanUser: Record<string, any> = {};

  // Standard string fields (fallback to empty string if undefined/null)
  cleanUser.username = normalizeUsername(decrypted.username || decrypted.email || '');
  cleanUser.name = String(decrypted.name || decrypted.username || 'Kullanıcı').trim();
  cleanUser.email = String(decrypted.email || '').trim().toLowerCase();
  cleanUser.phone = String(decrypted.phone || '').trim();
  cleanUser.role = decrypted.role || 'other';
  cleanUser.tcNo = decrypted.tcNo ? String(decrypted.tcNo).trim() : '';
  cleanUser.certificateNo = decrypted.certificateNo ? String(decrypted.certificateNo).trim() : '';
  cleanUser.diplomaNo = decrypted.diplomaNo ? String(decrypted.diplomaNo).trim() : '';
  cleanUser.tescilNo = decrypted.tescilNo ? String(decrypted.tescilNo).trim() : '';

  // OSGB structure (expected by isg-projesi)
  if (decrypted.osgb && typeof decrypted.osgb === 'object') {
    cleanUser.osgb = {
      name: decrypted.osgb.name || '',
      logo: decrypted.osgb.logo || null,
      idNo: decrypted.osgb.idNo || '',
      contact: decrypted.osgb.contact || '',
      staff: Array.isArray(decrypted.osgb.staff) ? decrypted.osgb.staff : []
    };
  } else {
    cleanUser.osgb = { name: '', logo: null, idNo: '', contact: '', staff: [] };
  }

  // Booleans
  cleanUser.hasAcceptedLegalTerms = Boolean(decrypted.hasAcceptedLegalTerms);
  cleanUser.isEmailVerified = Boolean(decrypted.isEmailVerified);
  cleanUser.isPremium = Boolean(decrypted.isPremium);

  // Timestamps / Signatures / Licenses
  cleanUser.createdAt = decrypted.createdAt || new Date().toISOString();
  cleanUser.legalAcceptedAt = decrypted.legalAcceptedAt || null;
  cleanUser.userSignature = decrypted.userSignature || null;
  cleanUser.emailVerifiedAt = decrypted.emailVerifiedAt || null;
  cleanUser.licenseKey = decrypted.licenseKey || null;
  cleanUser.licenseType = decrypted.licenseType || null;
  cleanUser.licensePurchasedAt = decrypted.licensePurchasedAt || null;
  cleanUser.licenseExpiresAt = decrypted.licenseExpiresAt || null;
  cleanUser.createdBy = decrypted.createdBy || 'web_register';

  if (decrypted.password !== undefined && decrypted.password !== null && decrypted.password !== '') {
    cleanUser.password = decrypted.password;
  }

  // Preserve any additional custom fields like companyPermissions if they exist, but omit undefined
  for (const [key, val] of Object.entries(decrypted)) {
    if (cleanUser[key] === undefined) {
      if (val === undefined) {
        continue;
      }
      cleanUser[key] = val;
    }
  }

  // Return clean readable user so admin can view all fields in Firestore and Admin Panel
  return cleanUser;
}

/**
 * Bir e-posta adresine bağlı olarak son 1 yıl içinde en fazla 2 adet doğrulanmış hesap açılabilir kuralını
 * hem sunucu API'sinden (veritabanı) hem de yerel yedek üzerinden kontrol eder.
 */
export async function checkEmailAccountLimitFromDb(
  email?: string,
  username?: string,
  localUsers?: any[]
): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  message: string;
}> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUsername = normalizeUsername(username || '');

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { allowed: true, count: 0, limit: 2, message: '' };
  }

  // Yönetici hesapları için kural uygulanmaz
  if (cleanEmail === 'infoisgpro@gmail.com' || cleanEmail === 'admin@isgpro.com' || cleanUsername === 'admin') {
    return { allowed: true, count: 0, limit: 2, message: '' };
  }

  // 1. Veritabanı API Uç Noktası Kontrolü (Primary / Authoritative)
  try {
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.')
    );
    const candidateUrls = isLocal ? ['', 'http://localhost:5001', 'http://127.0.0.1:5001'] : [''];
    for (const base of candidateUrls) {
      try {
        const res = await fetch(`${base}/api/check-email-account-limit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, username: cleanUsername })
        });
        if (res.ok) {
          const data = await res.json();
          return {
            allowed: data.allowed !== false,
            count: Number(data.count) || 0,
            limit: Number(data.limit) || 2,
            message: data.message || ''
          };
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[checkEmailAccountLimitFromDb API check error]:', err);
  }

  // 2. Yedek: Yerel kullanıcı havuzu üzerinden kontrol
  if (Array.isArray(localUsers) && localUsers.length > 0) {
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const verifiedUsers: string[] = [];

    localUsers.forEach(u => {
      const uEmail = String(u?.email || '').trim().toLowerCase();
      if (uEmail === cleanEmail && (u?.isEmailVerified === true || Boolean(u?.emailVerifiedAt))) {
        const dateVal = u?.emailVerifiedAt || u?.createdAt;
        const timeVal = dateVal ? new Date(dateVal).getTime() : now;
        if (!isNaN(timeVal) && (now - timeVal) <= ONE_YEAR_MS) {
          const uName = normalizeUsername(u?.username || '');
          if (uName && !verifiedUsers.includes(uName)) {
            verifiedUsers.push(uName);
          }
        }
      }
    });

    if (cleanUsername && verifiedUsers.includes(cleanUsername)) {
      return { allowed: true, count: verifiedUsers.length, limit: 2, message: '' };
    }

    if (verifiedUsers.length >= 2) {
      return {
        allowed: false,
        count: verifiedUsers.length,
        limit: 2,
        message: `Bu e-posta adresine bağlı olarak son 1 yıl içerisinde en fazla 2 adet doğrulanmış hesap açılabilir. Yıllık limitiniz dolmuştur (${verifiedUsers.length}/2).`
      };
    }
  }

  return { allowed: true, count: 0, limit: 2, message: '' };
}

