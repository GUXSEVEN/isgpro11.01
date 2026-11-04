const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update handleReportEmployeeCountChange in AdvancedReportModal
const oldHandleCount = `  const handleReportEmployeeCountChange = (newCount) => {
    const countStr = String(newCount ?? '').trim();
    setReportEmployeeCount(countStr);
    if (countStr && typeof onUpdateCompany === 'function') {
      onUpdateCompany({
        info: { ...(company?.info || {}), employeeCount: countStr },
        emergencyPlan: { ...(company?.emergencyPlan || {}), employeeCount: countStr }
      });
    }
  };`;

const newHandleCount = `  const handleReportEmployeeCountChange = (newCount) => {
    const countStr = String(newCount ?? '').trim();
    if (!countStr || countStr === reportEmployeeCount) return;
    setReportEmployeeCount(countStr);
    if (typeof onUpdateCompany === 'function') {
      const updatedPlan = currentEmergencyPlan ? { ...currentEmergencyPlan, employeeCount: countStr } : null;
      const hasMultiPlans = Array.isArray(company?.emergencyPlans) && company.emergencyPlans.length > 0;
      onUpdateCompany({
        info: { ...(company?.info || {}), employeeCount: countStr },
        ...(hasMultiPlans && updatedPlan ? {
          emergencyPlans: company.emergencyPlans.map(p => String(p.id) === String(updatedPlan.id) ? updatedPlan : p)
        } : (currentEmergencyPlan ? { emergencyPlan: updatedPlan } : {}))
      });
    }
  };`;

if (content.includes(oldHandleCount)) {
  content = content.replace(oldHandleCount, newHandleCount);
  console.log('1. handleReportEmployeeCountChange updated!');
} else {
  console.log('1. Warning: oldHandleCount not found exactly.');
}

// 2. Enhance saveCompanyToDB with strict byte calculation, deduplication of emergencyPlan, and 850KB guarantee
const oldSaveDbQuota = `    // Kesin emniyet sigortası: Firestore 1MB (1,048,576 byte) sınırını asla geçemez!
    if (strLen > 980000) {
      const purgeLargeStrings = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === 'string' && obj[k].length > 10000) {
            delete obj[k];
          } else if (typeof obj[k] === 'object') {
            purgeLargeStrings(obj[k]);
          }
        }
      };
      purgeLargeStrings(cleanCompany);
      strLen = JSON.stringify(cleanCompany).length;
    }`;

const newSaveDbQuota = `    // --- AKILLI VE KESİN 1MB KOTA GÜVENCESİ (Firestore & LocalStorage) ---
    // 1. Yeni modül acil durum planları (emergencyPlans) varsa, eski kopya emergencyPlan alanını silerek 300KB+ tasarruf et
    if (Array.isArray(cleanCompany.emergencyPlans) && cleanCompany.emergencyPlans.length > 0) {
      delete cleanCompany.emergencyPlan;
    }

    // 2. Acil durum krokilerindeki devasa görselleri/PDF verilerini kota tehlikesinde optimize et
    if (Array.isArray(cleanCompany.emergencyDiagrams) && strLen > 700000) {
      cleanCompany.emergencyDiagrams = cleanCompany.emergencyDiagrams.map(d => {
        if (!d) return d;
        const copy = { ...d };
        if (copy.imageUrl && typeof copy.imageUrl === 'string' && copy.imageUrl.length > 25000) {
          delete copy.imageUrl;
        }
        return copy;
      });
    }

    const getRealByteSize = (obj) => {
      try {
        if (typeof Blob !== 'undefined') return new Blob([JSON.stringify(obj)]).size;
      } catch (_) {}
      return JSON.stringify(obj).length * 1.15;
    };

    let realBytes = getRealByteSize(cleanCompany);

    // Kesin emniyet sigortası: Firestore 1MB (1,048,576 byte) sınırını asla geçemez, maksimum 850KB'ta sabitler!
    if (realBytes > 850000) {
      console.warn(\`[Firestore Quota Guard] Kritik sınır aşıldı (\${realBytes} byte). Kademeli koruma uygulanıyor...\`);
      delete cleanCompany.emergencyPlan;
      if (Array.isArray(cleanCompany.emergencyDiagrams)) {
        cleanCompany.emergencyDiagrams = cleanCompany.emergencyDiagrams.map(d => ({ ...d, imageUrl: undefined }));
      }
      let maxLen = 8000;
      while (getRealByteSize(cleanCompany) > 850000 && maxLen >= 1000) {
        const purgeLargeStrings = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string' && obj[k].length > maxLen) {
              delete obj[k];
            } else if (typeof obj[k] === 'object') {
              purgeLargeStrings(obj[k]);
            }
          }
        };
        purgeLargeStrings(cleanCompany);
        maxLen -= 1500;
      }
      strLen = JSON.stringify(cleanCompany).length;
    }`;

if (content.includes(oldSaveDbQuota)) {
  content = content.replace(oldSaveDbQuota, newSaveDbQuota);
  console.log('2. saveCompanyToDB quota guard upgraded!');
} else {
  console.log('2. Warning: oldSaveDbQuota not found.');
}

// 3. Fix raw localStorage.setItem(STORAGE_KEYS.COMPANIES, ...) calls to use safeSetItem
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(updatedCompanies\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, updatedCompanies);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(mergedCompanies\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, mergedCompanies);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(newCompaniesList\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, newCompaniesList);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(filteredCompanies\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, filteredCompanies);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(syncedCompanies\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, syncedCompanies);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(light\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, light);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(lightCompanies\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, lightCompanies);'
);
content = content.replace(
  /localStorage\.setItem\(STORAGE_KEYS\.COMPANIES,\s*JSON\.stringify\(updated\)\);/g,
  'safeSetItem(STORAGE_KEYS.COMPANIES, updated);'
);
console.log('3. All raw localStorage calls converted to safeSetItem!');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ App.jsx successfully patched!');

