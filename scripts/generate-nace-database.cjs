const path = require('path');
const fs = require('fs');
const ExcelJS = require('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/node_modules/exceljs');

const EXCEL_PATH = 'C:/Users/İBRAHİM/.gemini/antigravity/brain/d59cde9a-2445-4598-94d7-bf9083207952/.user_uploaded/media_1793877797424_e6581e61.xlsx';
const OUTPUT_JSON_PATH = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/data/naceDatabase.json';
const OUTPUT_SERVICE_PATH = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/data/naceService.js';

async function generate() {
  console.log('>>> NACE Excel dosyası okunuyor:', EXCEL_PATH);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  
  const ws = wb.worksheets[0];
  console.log('>>> Çalışma Sayfası:', ws.name, '| Satır Sayısı:', ws.rowCount);

  let currentSection = { code: '', title: '' };
  let currentDivision = { code: '', title: '' };
  let currentGroup = { code: '', title: '' };
  let currentClass = { code: '', title: '' };

  const allEntries = [];
  const sections = [];
  const divisions = [];
  const groups = [];
  const classes = [];
  const subclasses = []; // 6 haneli kodlar

  for (let rowIdx = 2; rowIdx <= ws.rowCount; rowIdx++) {
    const row = ws.getRow(rowIdx);
    const col1 = (row.getCell(1).text || '').trim();
    const col2 = (row.getCell(2).text || '').trim();
    const col3 = (row.getCell(3).text || '').trim();

    if (!col1 && !col2) continue;
    if (col1.includes('Altılı Kod') || col2.includes('Altılı Tanım')) continue;

    // Özel notlar: Mülga, Değişik ibare, Ek satır
    const isMulga = col1.includes('Mülga') || col2.includes('Mülga');
    const isDegisik = col1.includes('Değişik') || col2.includes('Değişik');
    const isEk = col1.includes('Ek satır') || col2.includes('Ek satır');

    // Not metnini ayıkla (Örn: RG-1/4/2026-33211)
    let note = '';
    const noteMatch = (col1 + ' ' + col2).match(/\((Değişik|Mülga|Ek)[^\)]+\)/i);
    if (noteMatch) {
      note = noteMatch[0].replace(/[\(\)]/g, '').trim();
    }

    // Temiz NACE kodu (sadece A-Z, 0-9 ve nokta)
    let cleanCode = col1.replace(/[\"\'\(\)]/g, ' ').split(/\s+/)[0].trim();
    cleanCode = cleanCode.replace(/^[^A-Z0-9]+|[^A-Z0-9\.]+$/gi, '');

    let title = col2.replace(/^[\"\'\s]+|[\"\'\s]+$/g, '').trim();
    if (!title && isMulga) {
      title = '(Mülga Satır - Yürürlükten Kaldırıldı)';
    }

    // Tehlike Sınıfı Normalizasyonu
    const rawHazard = col3.trim();
    const lowerHaz = rawHazard.toLowerCase();
    const hasAsbestos = rawHazard.includes('*') || title.toLowerCase().includes('asbest') || title.toLowerCase().includes('amyant');
    
    let hazardClass = '';
    if (lowerHaz.includes('çok tehlikeli') || lowerHaz.includes('cok tehlikeli')) {
      hazardClass = 'Çok Tehlikeli';
    } else if (lowerHaz.includes('az tehlikeli')) {
      hazardClass = 'Az Tehlikeli';
    } else if (lowerHaz.includes('tehlikeli')) {
      hazardClass = 'Tehlikeli';
    }

    // Hiyerarşik Seviye Tespiti
    let level = 'other';
    if (/^[A-Z]$/.test(cleanCode)) {
      level = 'section'; // Kısım: A, B, C...
      currentSection = { code: cleanCode, title };
      currentDivision = { code: '', title: '' };
      currentGroup = { code: '', title: '' };
      currentClass = { code: '', title: '' };
      sections.push({ code: cleanCode, title });
    } else if (/^\d{2}$/.test(cleanCode)) {
      level = 'division'; // Bölüm: 01, 02...
      currentDivision = { code: cleanCode, title };
      currentGroup = { code: '', title: '' };
      currentClass = { code: '', title: '' };
      divisions.push({ code: cleanCode, title, sectionCode: currentSection.code });
    } else if (/^\d{2}\.\d$/.test(cleanCode)) {
      level = 'group'; // Grup: 01.1...
      currentGroup = { code: cleanCode, title };
      currentClass = { code: '', title: '' };
      groups.push({ code: cleanCode, title, divisionCode: currentDivision.code, sectionCode: currentSection.code });
    } else if (/^\d{2}\.\d{2}$/.test(cleanCode)) {
      level = 'class'; // Sınıf: 01.11...
      currentClass = { code: cleanCode, title };
      classes.push({ code: cleanCode, title, groupCode: currentGroup.code, divisionCode: currentDivision.code, sectionCode: currentSection.code });
    } else if (/^\d{2}\.\d{2}\.\d{2}$/.test(cleanCode)) {
      level = 'subclass'; // Altılı Kod: 01.11.07...
    }

    // Arama indeksi oluştur (Türkçe karakter duyarsız arama için)
    const normalizeTr = (str) => {
      return (str || '')
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    };

    const entry = {
      code: cleanCode,
      rawCode: col1,
      title,
      hazardClass,
      level,
      isMulga,
      isDegisik,
      isEk,
      note,
      hasAsbestos,
      sectionCode: currentSection.code,
      sectionTitle: currentSection.title,
      divisionCode: currentDivision.code,
      divisionTitle: currentDivision.title,
      groupCode: currentGroup.code,
      groupTitle: currentGroup.title,
      classCode: currentClass.code,
      classTitle: currentClass.title,
      searchIndex: normalizeTr(`${cleanCode} ${title} ${currentSection.title} ${currentDivision.title}`)
    };

    allEntries.push(entry);
    if (level === 'subclass') {
      subclasses.push(entry);
    }
  }

  console.log('>>> Toplam Ayrıştırılan Kayıt:', allEntries.length);
  console.log('    - Kısım (Sektör):', sections.length);
  console.log('    - Bölüm (2 haneli):', divisions.length);
  console.log('    - Grup (3 haneli):', groups.length);
  console.log('    - Sınıf (4 haneli):', classes.length);
  console.log('    - Altılı NACE Kodu (6 haneli):', subclasses.length);
  console.log('    - Aktif 6 haneli kod:', subclasses.filter(s => !s.isMulga).length);
  console.log('    - Mülga (Kaldırılmış) kod:', subclasses.filter(s => s.isMulga).length);

  // Veritabanı yapısı
  const database = {
    metadata: {
      title: 'İSG NACE Kodları ve Tehlike Sınıfları Veritabanı',
      source: 'T.C. Çalışma ve Sosyal Güvenlik Bakanlığı İş Sağlığı ve Güvenliğine İlişkin İşyeri Tehlike Sınıfları Tebliği (Ek-1)',
      version: 'NACE Rev.2.1 Ver.3',
      latestOfficialGazette: '1/4/2026 - 33211 & 13/3/2025 - 32840',
      totalRecords: allEntries.length,
      subclassCount: subclasses.length,
      activeSubclassCount: subclasses.filter(s => !s.isMulga).length,
      generatedAt: new Date().toISOString()
    },
    sections,
    divisions,
    groups,
    classes,
    subclasses, // Hızlı erişim için doğrudan 6 haneli kodlar
    allEntries  // Tüm hiyerarşik liste
  };

  // JSON Dosyasını Kaydet
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(database, null, 2), 'utf8');
  console.log('>>> JSON veritabanı başarıyla kaydedildi:', OUTPUT_JSON_PATH);

  // Servis / Yardımcı Fonksiyonlar Modülünü Oluştur
  const serviceCode = `/**
 * NACE Kodları & Tehlike Sınıfları Servisi (NACE Rev.2.1 Ver.3)
 * T.C. Çalışma ve Sosyal Güvenlik Bakanlığı Güncel Tebliği
 * Otomatik üretilmiştir: ${new Date().toISOString()}
 */
import naceDb from './naceDatabase.json';

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
    const dotless = item.code.replace(/\\./g, '');
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
  const dotless = clean.replace(/\\./g, '');
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
    if (item.code.startsWith(query.trim()) || item.code.replace(/\\./g, '').startsWith(query.trim())) {
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
`;

  fs.writeFileSync(OUTPUT_SERVICE_PATH, serviceCode, 'utf8');
  console.log('>>> NACE Servisi başarıyla kaydedildi:', OUTPUT_SERVICE_PATH);

  console.log('>>> TAMAMLANDI! NACE Veritabanı ve Servis modülü hazır.');
}

generate().catch(err => {
  console.error('Hata oluştu:', err);
  process.exit(1);
});
