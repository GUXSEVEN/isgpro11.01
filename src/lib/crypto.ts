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
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SECRET_SALT = 'ISG_PRO_SECURE_ENCRYPTION_SALT_V2_2026';

/**
 * Encrypts sensitive data strings (e.g. API keys, sensitive tokens, passwords) before saving to DB or storage.
 */
export function encryptSensitiveData(text?: string | null): string {
  if (!text) return '';
  if (text.startsWith('ENC:v1:')) return text; // Already encrypted
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
    result += String.fromCharCode(charCode);
  }
  try {
    return 'ENC:v1:' + btoa(unescape(encodeURIComponent(result)));
  } catch {
    return text;
  }
}

/**
 * Decrypts sensitive data strings encrypted by encryptSensitiveData.
 */
export function decryptSensitiveData(encryptedText?: string | null): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('ENC:v1:')) return encryptedText;
  try {
    const raw = decodeURIComponent(escape(atob(encryptedText.replace('ENC:v1:', ''))));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return encryptedText;
  }
}

/**
 * Checks if a string is encrypted.
 */
export function isEncrypted(text?: string | null): boolean {
  return typeof text === 'string' && text.startsWith('ENC:v1:');
}

