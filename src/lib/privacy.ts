/**
 * Utility functions for privacy masking of personal data (GDPR/KVKK compliance).
 * Ensures that sensitive information (license keys, emails, phone numbers, full names)
 * can be masked in UI elements, logs, and public views to prevent privacy breaches.
 */

/**
 * Masks a digital license key (e.g. "ISG-9MHW-PVQB-4KZN" -> "ISG-9MHW-****-****")
 */
export function maskLicenseKey(key?: string | null): string {
  if (!key) return '—';
  const parts = key.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-****-****`;
  }
  if (key.length <= 8) return '****-****';
  return `${key.substring(0, 8)}-****-****`;
}

/**
 * Masks an email address (e.g. "ibrahimcoskun@gmail.com" -> "i***n@gmail.com")
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email || '—';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Masks a phone number (e.g. "05510654488" -> "0551 *** ** 88")
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 7) return phone || '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.substring(0, 4)} *** ** ${clean.substring(9)}`;
  }
  return `${phone.substring(0, 3)} **** ${phone.substring(phone.length - 2)}`;
}

/**
 * Masks a person's full name (e.g. "Ahmet Yılmaz" -> "A*** Y****")
 */
export function maskName(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts.map(part => {
    if (part.length <= 1) return part;
    return `${part[0]}${'*'.repeat(Math.min(part.length - 1, 4))}`;
  }).join(' ');
}
