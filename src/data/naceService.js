/**
 * NACE Kodları & Tehlike Sınıfları Servisi (NACE Rev.2.1 Ver.3)
 * T.C. Çalışma ve Sosyal Güvenlik Bakanlığı Güncel Tebliği
 * Otomatik üretilmiştir: 2026-11-05T11:33:26.665Z
 */
import naceDb from './naceDatabase.js';

export const NACE_METADATA = naceDb.metadata;
export const NACE_SECTIONS = naceDb.sections;
export const NACE_SUBCLASSES = naceDb.subclasses;
export const ALL_NACE_ENTRIES = naceDb.allEntries;

// Hızlı arama haritası (Map)
const codeMap = new Map();
naceDb.allEntries.forEach(item => {
  if (item.code) {
    codeMap.set(item.code, item);
    // Noktasız format da eşleştirilsin (Örn: 011107 -> 01.11.07)
    const dotless = item.code.replace(/\./g, '');
    if (dotless && dotless !== item.code) {
      codeMap.set(dotless, item);
    }
  }
});

/**
 * Türkçe karakter duyarsız arama normalleştirici
 */
export function normalizeSearchText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

/**
 * NACE koduna göre kaydı bulur (Örn: '01.11.07' veya '011107')
 */
export function findNaceByCode(code) {
  if (!code) return null;
  const clean = String(code).trim();
  if (codeMap.has(clean)) return codeMap.get(clean);
  const dotless = clean.replace(/\./g, '');
  if (codeMap.has(dotless)) return codeMap.get(dotless);
  return null;
}

/**
 * NACE koduna göre tehlike sınıfını döner
 */
export function getHazardClassByNace(code) {
  const item = findNaceByCode(code);
  return item?.hazardClass || 'Tehlikeli';
}

/**
 * Akıllı Arama: Kod veya tanım içinde arama yapar
 * @param {string} query - Arama kelimesi veya NACE kodu
 * @param {Object} options - { limit, onlySubclasses, onlyActive }
 */
export function searchNace(query, options = {}) {
  const { limit = 30, onlySubclasses = true, onlyActive = true } = options;
  if (!query || !query.trim()) {
    const list = onlySubclasses ? NACE_SUBCLASSES : ALL_NACE_ENTRIES;
    return onlyActive ? list.filter(i => !i.isMulga).slice(0, limit) : list.slice(0, limit);
  }

  const q = normalizeSearchText(query);
  const pool = onlySubclasses ? NACE_SUBCLASSES : ALL_NACE_ENTRIES;

  const matches = [];
  for (const item of pool) {
    if (onlyActive && item.isMulga) continue;

    // Tam kod başlangıcı eşleşmesi (En yüksek öncelik)
    if (item.code.startsWith(query.trim()) || item.code.replace(/\./g, '').startsWith(query.trim())) {
      matches.push({ item, score: 100 });
      continue;
    }

    // Tanım veya arama indeksi içinde geçme
    if (item.searchIndex && item.searchIndex.includes(q)) {
      // Başlıkta tam geçiyorsa
      const titleNorm = normalizeSearchText(item.title);
      const score = titleNorm.startsWith(q) ? 80 : 50;
      matches.push({ item, score });
    }
  }

  // Skor sırasına göre sırala
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map(m => m.item);
}

/**
 * Sektöre (Kısıma) göre alt faaliyetleri listeler
 */
export function getNaceBySection(sectionCode) {
  if (!sectionCode) return [];
  return NACE_SUBCLASSES.filter(s => s.sectionCode === sectionCode && !s.isMulga);
}

export default {
  metadata: NACE_METADATA,
  sections: NACE_SECTIONS,
  subclasses: NACE_SUBCLASSES,
  findNaceByCode,
  getHazardClassByNace,
  searchNace,
  getNaceBySection
};
