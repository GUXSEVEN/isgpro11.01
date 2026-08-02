import { User } from '../types';

/**
 * Deduplicates and merges user records based on normalized email or username.
 * Ensures that if a user has multiple entries (e.g. "ibrahim" vs "ibrahimcoskun.gs.1905@gmail.com"),
 * they are merged into a single canonical user record preserving Premium license status,
 * latest timestamps, and correct profile metadata.
 */
export function deduplicateAndCleanUsers(usersList: User[]): User[] {
  if (!Array.isArray(usersList)) return [];

  const map = new Map<string, User>();

  for (const rawUser of usersList) {
    if (!rawUser) continue;

    // Normalize email & username
    const normalizedUsername = (rawUser.username || '').toLowerCase().trim();
    const normalizedEmail = (rawUser.email || '').toLowerCase().trim();

    if (!normalizedUsername && !normalizedEmail) continue;

    // Primary lookup key: normalized email if present, else normalized username
    const key = normalizedEmail || normalizedUsername;

    if (!map.has(key)) {
      map.set(key, {
        ...rawUser,
        username: rawUser.username?.trim() || normalizedEmail || 'kullanici',
        email: rawUser.email?.trim() || (normalizedUsername.includes('@') ? normalizedUsername : ''),
        name: rawUser.name?.trim() || rawUser.username || 'Kullanıcı',
        isPremium: Boolean(rawUser.isPremium),
      });
    } else {
      const existing = map.get(key)!;

      // Determine which user holds the active premium status or latest license info
      const isExistingPremium = Boolean(existing.isPremium);
      const isRawPremium = Boolean(rawUser.isPremium);
      const isPremiumCombined = isExistingPremium || isRawPremium;

      // Determine active license details
      const activeLicenseKey = (isRawPremium ? rawUser.licenseKey : existing.licenseKey) || rawUser.licenseKey || existing.licenseKey;
      const activeLicenseType = (isRawPremium ? rawUser.licenseType : existing.licenseType) || rawUser.licenseType || existing.licenseType;
      const activePurchasedAt = rawUser.licensePurchasedAt || existing.licensePurchasedAt;
      const activeExpiresAt = rawUser.licenseExpiresAt || existing.licenseExpiresAt;

      // Determine canonical username (prefer shorter or non-email username if existing, e.g. "ibrahim" over email)
      let canonicalUsername = existing.username;
      if (!canonicalUsername || canonicalUsername.includes('@')) {
        if (rawUser.username && !rawUser.username.includes('@')) {
          canonicalUsername = rawUser.username;
        }
      }

      // Merge fields
      const mergedUser: User = {
        ...existing,
        ...rawUser,
        username: canonicalUsername || existing.username || rawUser.username,
        name: (rawUser.name && rawUser.name !== rawUser.username ? rawUser.name : existing.name) || existing.name || rawUser.name,
        email: existing.email || rawUser.email || (key.includes('@') ? key : ''),
        phone: rawUser.phone || existing.phone || '',
        role: (existing.role === 'admin' || rawUser.role === 'admin') ? 'admin' : (rawUser.role || existing.role || 'uzman'),
        isPremium: isPremiumCombined,
        licenseKey: activeLicenseKey || null,
        licenseType: activeLicenseType || null,
        licensePurchasedAt: activePurchasedAt || null,
        licenseExpiresAt: activeExpiresAt || null,
        password: existing.password || rawUser.password,
        certificateNo: rawUser.certificateNo || existing.certificateNo,
        isEmailVerified: Boolean(existing.isEmailVerified || rawUser.isEmailVerified),
      };

      map.set(key, mergedUser);
    }
  }

  return Array.from(map.values());
}
