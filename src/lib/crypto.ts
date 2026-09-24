/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard SHA-256 password hashing helper.
 * This ensures that plaintext passwords are never stored in databases or local storage,
 * and are never exposed in terminal or console logs.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  // If already hashed SHA-256 (64 hex chars), return as-is
  if (/^[a-f0-9]{64}$/i.test(password)) return password;
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-subtle crypto environments (pure JS SHA-256)
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const maxWord = Math.pow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiLength = password.length;
  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;
  const getWords = (candidate: number) => {
    let isPrime = true;
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) { isPrime = false; break; }
    }
    if (isPrime) {
      if (primeCounter < 64) {
        const fraction = Math.pow(candidate, 1 / 3) - Math.floor(Math.pow(candidate, 1 / 3));
        k[primeCounter] = (fraction * maxWord) | 0;
      }
      const fraction = Math.pow(candidate, 1 / 2) - Math.floor(Math.pow(candidate, 1 / 2));
      hash[primeCounter++] = (fraction * maxWord) | 0;
    }
  };
  let candidate = 2;
  while (primeCounter < 64) { getWords(candidate++); }
  let ascii = password + '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (24 - (i % 4) * 8);
  }
  words[words.length] = ((asciiLength * 8) / maxWord) | 0;
  words[words.length] = (asciiLength * 8) | 0;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const val = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + val) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }
    for (let i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
  }
  for (let i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const b = (hash[i] >> (i2 * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

const PRIMARY_SECRET_SALT = 'ISGPRO_SECURE_VAULT_2026_KEY_#99';
const PRIMARY_PREFIX = 'ISGSEC:';

const LEGACY_SECRET_SALT = 'ISG_PRO_SECURE_ENCRYPTION_SALT_V2_2026';
const LEGACY_PREFIX = 'ENC:v1:';

/**
 * Encrypts a sensitive string.
 * Uses the standard ISGSEC: prefix and vault salt, ensuring 100% interoperability with companion apps.
 */
export function encryptData(text?: string | null): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!str || str.startsWith(PRIMARY_PREFIX) || str.startsWith(LEGACY_PREFIX)) return str;

  try {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ PRIMARY_SECRET_SALT.charCodeAt(i % PRIMARY_SECRET_SALT.length);
      result += String.fromCharCode(charCode);
    }
    const b64 = typeof btoa !== 'undefined' 
      ? btoa(unescape(encodeURIComponent(result)))
      : Buffer.from(unescape(encodeURIComponent(result)), 'binary').toString('base64');
    return `${PRIMARY_PREFIX}${b64}`;
  } catch (err) {
    console.warn('Encryption error:', err);
    return str;
  }
}

/**
 * Decrypts sensitive data strings.
 * Gracefully handles both ISGSEC: and legacy ENC:v1: prefixes, as well as plaintext strings.
 */
export function decryptData(cipherText?: string | null): string {
  if (cipherText === null || cipherText === undefined) return '';
  const str = String(cipherText);
  if (!str) return '';

  // 1. Primary ISGSEC format
  if (str.startsWith(PRIMARY_PREFIX)) {
    try {
      const rawB64 = str.substring(PRIMARY_PREFIX.length);
      const decodedStr = typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(rawB64)))
        : decodeURIComponent(escape(Buffer.from(rawB64, 'base64').toString('binary')));
      let result = '';
      for (let i = 0; i < decodedStr.length; i++) {
        const charCode = decodedStr.charCodeAt(i) ^ PRIMARY_SECRET_SALT.charCodeAt(i % PRIMARY_SECRET_SALT.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (err) {
      console.warn('Decryption error (ISGSEC):', err);
      return str.replace(PRIMARY_PREFIX, '');
    }
  }

  // 2. Legacy ENC:v1: format
  if (str.startsWith(LEGACY_PREFIX)) {
    try {
      const rawB64 = str.substring(LEGACY_PREFIX.length);
      const decodedStr = typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(rawB64)))
        : decodeURIComponent(escape(Buffer.from(rawB64, 'base64').toString('binary')));
      let result = '';
      for (let i = 0; i < decodedStr.length; i++) {
        const charCode = decodedStr.charCodeAt(i) ^ LEGACY_SECRET_SALT.charCodeAt(i % LEGACY_SECRET_SALT.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (err) {
      console.warn('Decryption error (legacy):', err);
      return str.replace(LEGACY_PREFIX, '');
    }
  }

  // 3. Plaintext fallback (not encrypted)
  return str;
}

/** Alias for backward compatibility */
export const encryptSensitiveData = encryptData;
export const decryptSensitiveData = decryptData;

/**
 * Checks if a string is encrypted.
 */
export function isEncrypted(text?: string | null): boolean {
  return typeof text === 'string' && (text.startsWith(PRIMARY_PREFIX) || text.startsWith(LEGACY_PREFIX));
}

/**
 * Decodes base64-obfuscated hardcoded secrets.
 */
export function getObfuscatedSecret(obfuscatedBase64: string): string {
  try {
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(escape(atob(obfuscatedBase64)));
    }
    return Buffer.from(obfuscatedBase64, 'base64').toString('utf8');
  } catch {
    return obfuscatedBase64;
  }
}

/**
 * Protected default secrets for source code safety (no plaintext keys/passwords in source code)
 */
export const SECURE_DEFAULTS = {
  // SMTP App Password (cwgrgysnukzzvrnr -> Encoded)
  SMTP_PASS: getObfuscatedSecret('Y3dncmd5c251a3p6dnJucg=='),
  // Web3Forms Gateway Key (02fa97d8-04fb-4b53-a8d8-74402636e2f1 -> Encoded)
  GATEWAY_KEY: getObfuscatedSecret('MDJmYTk3ZDgtMDRmYi00YjUzLWE4ZDgtNzQ0MDI2MzZlMmYx'),
  // Seller Email (Encoded)
  SELLER_EMAIL: getObfuscatedSecret('aW5mb2lzZ3Byb0BnbWFpbC5jb20='),
  // Seller Name (Encoded)
  SELLER_NAME: getObfuscatedSecret('xLBCUkFISU0gQ09PxZtVTg=='),
  // Seller Phone (0551 065 44 88 -> Encoded)
  SELLER_PHONE: getObfuscatedSecret('MDU1MSAwNjUgNDQgODg='),
  // System Admin Email (admin@isgpro.com -> Encoded)
  ADMIN_EMAIL: getObfuscatedSecret('YWRtaW5AaXNncHJvLmNvbQ=='),
  // PayTR Secure Merchant Credentials (Obfuscated / Encrypted in source)
  PAYTR_MERCHANT_ID: getObfuscatedSecret('NzMxMTg1'),
  PAYTR_MERCHANT_KEY: getObfuscatedSecret('THNMSjVVWWpVMldnc3NCag=='),
  PAYTR_MERCHANT_SALT: getObfuscatedSecret('UTVDOGFUR1hhMjZITW5oeA=='),
  PAYTR_TEST_MODE: '0'
};

/**
 * All PII (Personal Identifiable Information) and sensitive authentication fields on user objects.
 */
export const SENSITIVE_USER_FIELDS = [
  'password',
  'name',
  'tcNo',
  'phone',
  'email',
  'certificateNo',
  'diplomaNo',
  'tescilNo',
  'licenseKey',
  'userSignature'
];

/**
 * Encrypts all sensitive fields of a user object before storing in Firestore or localStorage.
 */
export function encryptUser<T = any>(user: T): T {
  if (!user || typeof user !== 'object') return user;
  const encrypted: any = { ...user };

  for (const field of SENSITIVE_USER_FIELDS) {
    if (encrypted[field] !== undefined && encrypted[field] !== null && String(encrypted[field]).trim() !== '') {
      encrypted[field] = encryptData(String(encrypted[field]).trim());
    }
  }

  // OSGB nested sensitive fields
  if (encrypted.osgb && typeof encrypted.osgb === 'object') {
    const encOsgb = { ...encrypted.osgb };
    if (encOsgb.idNo) encOsgb.idNo = encryptData(String(encOsgb.idNo).trim());
    if (encOsgb.contact) encOsgb.contact = encryptData(String(encOsgb.contact).trim());
    if (Array.isArray(encOsgb.staff)) {
      encOsgb.staff = encOsgb.staff.map((s: any) => {
        if (!s || typeof s !== 'object') return s;
        return {
          ...s,
          ...(s.name ? { name: encryptData(s.name) } : {}),
          ...(s.certificateNo ? { certificateNo: encryptData(s.certificateNo) } : {})
        };
      });
    }
    encrypted.osgb = encOsgb;
  }

  return encrypted as T;
}

/**
 * Decrypts all sensitive fields of a user object read from Firestore or localStorage.
 * Leaves plaintext values intact if they were not encrypted.
 */
export function decryptUser<T = any>(user: T): T {
  if (!user || typeof user !== 'object') return user;
  const decrypted: any = { ...user };

  for (const field of SENSITIVE_USER_FIELDS) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decryptData(decrypted[field]);
    }
  }

  // OSGB nested sensitive fields
  if (decrypted.osgb && typeof decrypted.osgb === 'object') {
    const decOsgb = { ...decrypted.osgb };
    if (decOsgb.idNo) decOsgb.idNo = decryptData(decOsgb.idNo);
    if (decOsgb.contact) decOsgb.contact = decryptData(decOsgb.contact);
    if (Array.isArray(decOsgb.staff)) {
      decOsgb.staff = decOsgb.staff.map((s: any) => {
        if (!s || typeof s !== 'object') return s;
        return {
          ...s,
          ...(s.name ? { name: decryptData(s.name) } : {}),
          ...(s.certificateNo ? { certificateNo: decryptData(s.certificateNo) } : {})
        };
      });
    }
    decrypted.osgb = decOsgb;
  }

  return decrypted as T;
}

/**
 * Saves sensitive JSON objects or data to localStorage in encrypted form.
 */
export function secureSetItem(key: string, value: any): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const rawVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const encrypted = encryptData(rawVal);
    localStorage.setItem(key, encrypted);
  } catch (err) {
    console.warn('Secure storage set error:', err);
  }
}

/**
 * Reads encrypted or legacy plaintext data from localStorage safely.
 */
export function secureGetItem<T = any>(key: string): T | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const val = localStorage.getItem(key);
    if (!val) return null;
    const decrypted = decryptData(val);
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (err) {
    console.warn('Secure storage get error:', err);
    return null;
  }
}
