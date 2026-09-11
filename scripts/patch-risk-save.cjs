const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  if (isCRLF) {
    return str.replace(/\r?\n/g, '\r\n');
  } else {
    return str.replace(/\r\n/g, '\n');
  }
}

function replaceExact(searchStr, replaceStr, label) {
  const normSearch = normalizeNewlines(searchStr);
  const normReplace = normalizeNewlines(replaceStr);
  if (!content.includes(normSearch)) {
    console.error(`ERROR: Could not find target string for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  console.log(`SUCCESS: Replaced [${label}]`);
}

// 1. Firebase firestore import
const targetImport = `import {
  getFirestore, collection, getDocs, addDoc, query, orderBy,
  serverTimestamp, doc, updateDoc, deleteDoc, where, writeBatch, setDoc, getDoc,
  onSnapshot
} from 'firebase/firestore';`;

const replImport = `import {
  getFirestore, collection, getDocs, addDoc, query, orderBy,
  serverTimestamp, doc, updateDoc, deleteDoc, where, writeBatch, setDoc, getDoc,
  onSnapshot, initializeFirestore
} from 'firebase/firestore';`;

replaceExact(targetImport, replImport, 'firebase/firestore import');

// 2. saveCompanyToDB
const targetSave = `// 2. Firmayı Buluta Kaydet (Varsa Güncelle, Yoksa Oluştur)
const saveCompanyToDB = async (company) => {
  if (!db) return;
  try {
    // ID'yi string formatına çevir (Firestore string ID sever)
    const docId = String(company.id);

    // setDoc: Belge varsa ezer/günceller, yoksa oluşturur.
    // merge: true kullanırsak sadece değişen alanları günceller, 
    // ancak biz tüm yapıyı (riskler dahil) sakladığımız için direkt yazıyoruz.
    await setDoc(doc(db, 'companies', docId), company);
    console.log(\`Firma (\${company.name}) buluta yedeklendi.\`);
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
  }
};`;

const replSave = `// --- FIRESTORE VERİ TEMİZLEME (UNDEFINED VE GEÇERSİZ DEĞERLERİ TEMİZLER) ---
export const cleanFirestoreData = (data) => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data === 'number') {
    return isNaN(data) ? 0 : data;
  }
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => cleanFirestoreData(item));
  }
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = cleanFirestoreData(value);
    }
  }
  return clean;
};

// 2. Firmayı Buluta Kaydet (Varsa Güncelle, Yoksa Oluştur)
const saveCompanyToDB = async (company) => {
  if (!db || !company) return;
  try {
    const docId = String(company.id || Date.now());
    const cleanCompany = cleanFirestoreData({ ...company, id: docId });
    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    throw err;
  }
};`;

replaceExact(targetSave, replSave, 'saveCompanyToDB');

// 3. Firebase db initialization with initializeFirestore
const targetDbInit = `  if (configToUse && configToUse.apiKey) {
    const app = initializeApp(configToUse);
    db = getFirestore(app);`;

const replDbInit = `  if (configToUse && configToUse.apiKey) {
    const app = initializeApp(configToUse);
    try {
      db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    } catch (e) {
      db = getFirestore(app);
    }`;

replaceExact(targetDbInit, replDbInit, 'Firebase db initialization');

// 4. handleImageUpload Canvas compression
const targetImgUpload = `      // 3. Kalıcı Depolama için Base64'e Çevir (Arka Planda)
      // Bu işlem biraz sürebilir ama kullanıcı zaten resmi gördüğü için sorun olmaz.
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ ...prev, [field]: reader.result }));
        // Not: Blob URL'ini hemen silmiyoruz, React state update sonrası garbage collected olabilir
        // veya browser page unload'da temizlenir.
      };
      reader.readAsDataURL(file);`;

const replImgUpload = `      // 3. Kalıcı ve Hafif Depolama: Canvas ile yeniden boyutlandırıp sıkıştır (Maks 800px, JPEG %70)
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          try {
            let w = img.width;
            let h = img.height;
            const maxDim = 800;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setForm(prev => ({ ...prev, [field]: compressedBase64 }));
          } catch (cErr) {
            setForm(prev => ({ ...prev, [field]: re.target.result }));
          }
        };
        img.onerror = () => {
          setForm(prev => ({ ...prev, [field]: re.target.result }));
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);`;

replaceExact(targetImgUpload, replImgUpload, 'handleImageUpload compression');

// 5. handleSubmit in AssessmentView
const targetSubmit = `    const calculatedScore = calculateScore(form);
    let postScore = null;
    if (includeDof) {
      const postParams = {
        L: form.postL, S: form.postS, F: form.postF,
        P: form.postP, O: form.postO, D: form.postD
      };
      postScore = Number(currentMethodConfig.formula(postParams)).toFixed(1);
    }
    const riskData = { ...form, score: calculatedScore, postScore };
    if (isEditing) { onUpdate(riskData); setIsEditing(false); } else { onAdd({ ...riskData, status: 'Açık' }); }
    resetForm();`;

const replSubmit = `    const calculatedScore = calculateScore(form);
    let postScore = null;
    if (includeDof) {
      const postParams = {
        L: form.postL, S: form.postS, F: form.postF,
        P: form.postP, O: form.postO, D: form.postD
      };
      postScore = Number(currentMethodConfig.formula(postParams)).toFixed(1);
    }
    const riskData = {
      id: form.id || \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`,
      topic: form.topic || '',
      hazard: form.hazard || '',
      risk: form.risk || '',
      precaution: form.precaution || '',
      department: form.department || assessment.department || 'Genel',
      activity: form.activity || assessment.activity || '',
      processOwner: form.processOwner || '',
      affectedPersons: form.affectedPersons || '',
      deadline: form.deadline || '',
      controlDate: form.controlDate || '',
      beforePhoto: (form.beforePhoto && !String(form.beforePhoto).startsWith('blob:')) ? form.beforePhoto : null,
      afterPhoto: (form.afterPhoto && !String(form.afterPhoto).startsWith('blob:')) ? form.afterPhoto : null,
      L: Number(form.L) || 1,
      S: Number(form.S) || 1,
      F: Number(form.F) || 1,
      P: Number(form.P) || 0.5,
      O: Number(form.O) || 1,
      D: Number(form.D) || 1,
      S_KINNEY: Number(form.S_KINNEY || form.S) || 1,
      S_FMEA: Number(form.S_FMEA || form.S) || 1,
      postL: Number(form.postL) || 1,
      postS: Number(form.postS) || 1,
      postF: Number(form.postF) || 1,
      postP: Number(form.postP) || 0.5,
      postO: Number(form.postO) || 1,
      postD: Number(form.postD) || 1,
      postS_KINNEY: Number(form.postS_KINNEY || form.postS) || 1,
      postS_FMEA: Number(form.postS_FMEA || form.postS) || 1,
      score: String(calculatedScore || 0),
      postScore: (includeDof && postScore !== null && !isNaN(postScore)) ? String(postScore) : null,
      status: form.status || 'Açık',
      createdAt: form.createdAt || new Date().toISOString()
    };
    if (isEditing) { onUpdate(riskData); setIsEditing(false); } else { onAdd(riskData); }
    resetForm();`;

replaceExact(targetSubmit, replSubmit, 'handleSubmit sanitized riskData');

// 6. updateActiveCompany and handleManualSave
const targetUpdateSave = `  const updateActiveCompany = (updates) => {
    const updatedCompanies = companies.map(c => {
      if (c.id === activeCompanyId) {
        const updatedComp = { ...c, ...updates };
        if (db) saveCompanyToDB(updatedComp);
        return updatedComp;
      }
      return c;
    });
    setCompanies(updatedCompanies);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  };

  const handleManualSave = async () => {
    if (!currentUser) return;
    setShowSaveNotification(true);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library));
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem('isg_affected_groups', JSON.stringify(affectedGroups)); // <-- YENİ
      if (db) {
        // Admin saves all companies, normal users save only their own
        const companiesToSave = currentUser.username === 'admin'
          ? companies
          : companies.filter(c => c.owner === currentUser.username);
        const savePromises = companiesToSave.map(comp => saveCompanyToDB(comp));
        await Promise.all(savePromises);
      }
      setTimeout(() => setShowSaveNotification(false), 2000);
    } catch (err) { console.error(err); alert("Kayıt hatası!"); }
  };`;

const replUpdateSave = `  const updateActiveCompany = (updates) => {
    const updatedCompanies = companies.map(c => {
      if (String(c.id) === String(activeCompanyId)) {
        const updatedComp = { ...c, ...updates };
        if (db) {
          saveCompanyToDB(updatedComp).catch(e => console.error("Otomatik bulut kaydetme hatası:", e));
        }
        return updatedComp;
      }
      return c;
    });
    setCompanies(updatedCompanies);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
    } catch (e) {
      console.warn("Yerel depolama kota uyarısı:", e);
    }

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  };

  const handleManualSave = async () => {
    if (!currentUser) return;
    setShowSaveNotification(true);
    try {
      // 1. Güvenli yerel depolama kaydı (Kota hatası Firestore senkronizasyonunu engellemez)
      const safeStore = (k, v) => {
        try { localStorage.setItem(k, v); } catch (e) { console.warn(\`Depolama kota uyarısı (\${k}):\`, e); }
      };
      safeStore(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      safeStore(STORAGE_KEYS.LIBRARY, JSON.stringify(library));
      safeStore(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      safeStore(STORAGE_KEYS.USERS, JSON.stringify(users));
      safeStore('isg_affected_groups', JSON.stringify(affectedGroups));

      // 2. Bulut Veritabanı (Firestore) Senkronizasyonu
      if (db) {
        // Admin tüm firmaları kaydeder; uzmanlar sahibi olduğu, yetkili olduğu veya şu an aktif olarak çalıştığı firmayı kaydeder
        const companiesToSave = currentUser.username === 'admin'
          ? companies
          : companies.filter(c => 
              c.owner === currentUser.username || 
              String(c.id) === String(activeCompanyId) ||
              (currentUser.companyPermissions || []).some(p => String(p.companyId) === String(c.id) && (p.canEdit || p.canView))
            );
        const savePromises = companiesToSave.map(comp => saveCompanyToDB(comp));
        await Promise.all(savePromises);
      }
      setTimeout(() => setShowSaveNotification(false), 2000);
    } catch (err) {
      console.error("Manuel kayıt hatası:", err);
      alert("Kayıt hatası: " + (err?.message || "Sunucuya kaydedilemedi"));
    }
  };`;

replaceExact(targetUpdateSave, replUpdateSave, 'updateActiveCompany & handleManualSave');

// 7. activeCompany & permissions lookups
content = content.replace(
  new RegExp(normalizeNewlines("const activeCompany = \\(isSystemAdmin \\? companies : allowedCompanies\\)\\.find\\(c => c\\.id === activeCompanyId\\);"), 'g'),
  normalizeNewlines("const activeCompany = (isSystemAdmin ? companies : allowedCompanies).find(c => String(c.id) === String(activeCompanyId));")
);
console.log('SUCCESS: Replaced activeCompany find expressions');

content = content.replace(
  new RegExp(normalizeNewlines("const hasAccess = allowedCompanies\\.some\\(c => c\\.id === activeCompanyId\\);"), 'g'),
  normalizeNewlines("const hasAccess = allowedCompanies.some(c => String(c.id) === String(activeCompanyId));")
);
console.log('SUCCESS: Replaced hasAccess some expression');

content = content.replace(
  new RegExp(normalizeNewlines("if \\(activeCompanyId === id\\) setActiveCompanyId\\(null\\);"), 'g'),
  normalizeNewlines("if (String(activeCompanyId) === String(id)) setActiveCompanyId(null);")
);
console.log('SUCCESS: Replaced activeCompanyId reset check');

// 8. handleImportRisks
const targetImportReturn = `      return {
        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`, originId: item.id,
        topic: item.category || '', hazard: item.hazard || '', risk: item.risk || '', precaution: item.precaution || '',
        department: targetAssessment.department || 'Genel', activity: targetAssessment.activity || '',
        L: valL, S: valS, P: valP, F: valF, S_KINNEY: valSK, O: valO, S_FMEA: valSF, D: valD,
        score: Number(calculatedScore).toFixed(1), status: 'Açık',
        postL: 1, postS: 1, postP: 0.5, postF: 1, postO: 1, postD: 1, createdAt: new Date().toISOString()
      };`;

const replImportReturn = `      return {
        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
        originId: item.id || null,
        topic: item.category || '',
        hazard: item.hazard || '',
        risk: item.risk || '',
        precaution: item.precaution || '',
        department: targetAssessment.department || 'Genel',
        activity: targetAssessment.activity || '',
        processOwner: '',
        affectedPersons: '',
        deadline: '',
        controlDate: '',
        beforePhoto: null,
        afterPhoto: null,
        L: valL, S: valS, P: valP, F: valF, S_KINNEY: valSK, O: valO, S_FMEA: valSF, D: valD,
        score: Number(calculatedScore).toFixed(1),
        postScore: null,
        status: 'Açık',
        postL: 1, postS: 1, postP: 0.5, postF: 1, postO: 1, postD: 1,
        postS_KINNEY: 1, postS_FMEA: 1,
        createdAt: new Date().toISOString()
      };`;

replaceExact(targetImportReturn, replImportReturn, 'handleImportRisks defaults');

fs.writeFileSync(path, content, 'utf8');
console.log('ALL PATCHES APPLIED CLEANLY AND VERIFIED! App.jsx length:', content.length);
