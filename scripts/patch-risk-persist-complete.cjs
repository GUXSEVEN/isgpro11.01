const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (!fs.existsSync(filePath)) {
  console.error("App.jsx does not exist at:", filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Quota Guard on saveAssessmentsDirectToDB & saveCompanyToDB
const targetSaveBlock = `// Doğrudan ve Hızlı Risk Analizi Firestore Kaydetme (Gecikmesiz & Kota Aşımına Takılmadan)
export const saveAssessmentsDirectToDB = async (companyId, assessments, updatedAt = Date.now()) => {
  if (!db || !companyId) return false;
  try {
    const docId = String(companyId);
    const cleanAss = cleanFirestoreData(assessments || []);
    await setDoc(doc(db, 'companies', docId), {
      assessments: cleanAss,
      _clientUpdatedAt: updatedAt
    }, { merge: true });
    console.log(\`[saveAssessmentsDirectToDB] Firma (\${docId}) risk analizleri buluta kalıcı olarak yazıldı.\`);
    return true;
  } catch (err) {
    console.error("[saveAssessmentsDirectToDB] Bulut risk analizi kayıt hatası:", err);
    return false;
  }
};

const saveCompanyToDB = async (company) => {
  if (!db || !company) return false;
  try {
    const docId = String(company.id || Date.now());
    let cleanCompany = cleanFirestoreData({ ...company, id: docId });

    // Hızlı ve doğrudan Firestore yazımı
    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    return false;
  }
};`;

const replSaveBlock = `// Doğrudan ve Hızlı Risk Analizi Firestore Kaydetme (Gecikmesiz & Kota Aşımına Takılmadan & Otomatik Fotoğraf Optimizasyonu)
export const saveAssessmentsDirectToDB = async (companyId, assessments, updatedAt = Date.now()) => {
  if (!db || !companyId) return false;
  try {
    const docId = String(companyId);
    let cleanAss = cleanFirestoreData(assessments || []);

    // Firestore 1MB kotası koruması (Fotoğrafları canvas ile güvenli optimize et)
    let strLen = JSON.stringify(cleanAss).length;
    if (strLen > 650000 && Array.isArray(cleanAss) && typeof window !== 'undefined') {
      console.warn(\`[Firestore Quota Guard] Risk analizleri boyutu (\${strLen} byte) 1MB sınırına yaklaşıyor, fotoğraflar optimize ediliyor...\`);
      for (const ass of cleanAss) {
        if (ass && ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 25000) {
              const comp = await compressBase64Image(r.beforePhoto, 360, 0.4);
              if (comp) r.beforePhoto = comp;
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 25000) {
              const comp = await compressBase64Image(r.afterPhoto, 360, 0.4);
              if (comp) r.afterPhoto = comp;
            }
          }
        }
      }
      strLen = JSON.stringify(cleanAss).length;
    }

    if (strLen > 850000 && Array.isArray(cleanAss) && typeof window !== 'undefined') {
      for (const ass of cleanAss) {
        if (ass && ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 15000) {
              const comp = await compressBase64Image(r.beforePhoto, 260, 0.35);
              if (comp) r.beforePhoto = comp;
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 15000) {
              const comp = await compressBase64Image(r.afterPhoto, 260, 0.35);
              if (comp) r.afterPhoto = comp;
            }
          }
        }
      }
    }

    await setDoc(doc(db, 'companies', docId), {
      assessments: cleanAss,
      _clientUpdatedAt: updatedAt
    }, { merge: true });
    console.log(\`[saveAssessmentsDirectToDB] Firma (\${docId}) risk analizleri buluta kalıcı olarak yazıldı.\`);
    return true;
  } catch (err) {
    console.error("[saveAssessmentsDirectToDB] Bulut risk analizi kayıt hatası:", err);
    return false;
  }
};

const saveCompanyToDB = async (company) => {
  if (!db || !company) return false;
  try {
    const docId = String(company.id || Date.now());
    let cleanCompany = cleanFirestoreData({ ...company, id: docId });

    // Firestore 1MB kotası koruması (Fotoğrafları canvas ile güvenli optimize et)
    let strLen = JSON.stringify(cleanCompany).length;
    if (strLen > 650000 && cleanCompany.assessments && Array.isArray(cleanCompany.assessments) && typeof window !== 'undefined') {
      console.warn(\`[Firestore Quota Guard] Firma boyutu (\${strLen} byte) 1MB sınırına yaklaşıyor, fotoğraflar optimize ediliyor...\`);
      for (const ass of cleanCompany.assessments) {
        if (ass && ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 25000) {
              const comp = await compressBase64Image(r.beforePhoto, 360, 0.4);
              if (comp) r.beforePhoto = comp;
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 25000) {
              const comp = await compressBase64Image(r.afterPhoto, 360, 0.4);
              if (comp) r.afterPhoto = comp;
            }
          }
        }
      }
      strLen = JSON.stringify(cleanCompany).length;
    }

    if (strLen > 850000 && cleanCompany.assessments && Array.isArray(cleanCompany.assessments) && typeof window !== 'undefined') {
      for (const ass of cleanCompany.assessments) {
        if (ass && ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 15000) {
              const comp = await compressBase64Image(r.beforePhoto, 260, 0.35);
              if (comp) r.beforePhoto = comp;
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 15000) {
              const comp = await compressBase64Image(r.afterPhoto, 260, 0.35);
              if (comp) r.afterPhoto = comp;
            }
          }
        }
      }
    }

    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    return false;
  }
};`;

if (!content.includes(targetSaveBlock)) {
  console.error('ERROR: targetSaveBlock not found!');
  process.exit(1);
}
content = content.replace(targetSaveBlock, replSaveBlock);
console.log('1. Applied saveAssessmentsDirectToDB & saveCompanyToDB Quota Guard');

// 2. AssessmentView handleSubmit and handleEditClick
const targetHandleSubmit = `    const calculatedScore = calculateScore(form);
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
    resetForm();
    setMobileSubTab('list');`;

const replHandleSubmit = `    const calculatedScore = calculateScore(form);
    let postScore = null;
    if (includeDof) {
      const postParams = {
        L: form.postL, S: form.postS, F: form.postF,
        P: form.postP, O: form.postO, D: form.postD
      };
      postScore = Number(currentMethodConfig.formula(postParams)).toFixed(1);
    }
    const riskData = {
      ...form,
      id: form.id || \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`,
      controlDate: form.controlDate || '',
      processOwner: form.processOwner || '',
      deadline: form.deadline || '',
      beforePhoto: form.beforePhoto || null,
      afterPhoto: form.afterPhoto || null,
      score: String(calculatedScore || 0),
      postScore: (includeDof && postScore !== null && !isNaN(postScore)) ? String(postScore) : (form.postScore || null),
      status: form.status || 'Açık',
      updatedAt: Date.now()
    };
    if (isEditing) { onUpdate(riskData); setIsEditing(false); } else { onAdd({ ...riskData, createdAt: new Date().toISOString() }); }
    resetForm();
    setMobileSubTab('list');`;

if (!content.includes(targetHandleSubmit)) {
  console.error('ERROR: targetHandleSubmit not found!');
  process.exit(1);
}
content = content.replace(targetHandleSubmit, replHandleSubmit);
console.log('2. Applied handleSubmit explicit field persistence');

const targetHandleEditClick = `  const handleEditClick = (risk) => {
    setForm({ ...risk });
    setIncludeDof(!!risk.postScore);
    setIsEditing(true);
    setMobileSubTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };`;

const replHandleEditClick = `  const handleEditClick = (risk) => {
    setForm({
      ...risk,
      controlDate: risk.controlDate || '',
      processOwner: risk.processOwner || '',
      deadline: risk.deadline || '',
      beforePhoto: risk.beforePhoto || null,
      afterPhoto: risk.afterPhoto || null
    });
    setIncludeDof(Boolean(risk.postScore || risk.afterPhoto || (risk.postL && risk.postL > 1) || (risk.postP && risk.postP > 0.5)));
    setIsEditing(true);
    setMobileSubTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };`;

if (!content.includes(targetHandleEditClick)) {
  console.error('ERROR: targetHandleEditClick not found!');
  process.exit(1);
}
content = content.replace(targetHandleEditClick, replHandleEditClick);
console.log('3. Applied handleEditClick includeDof & field retention');

// 3. onSnapshot merge improvements and local cache restore
const targetOnSnapshot = `  useEffect(() => {
    if (!db || !currentUser) {
      setCompanies([]);
      return;
    }
    setLoadingData(true);
    const unsubscribe = onSnapshot(collection(db, 'companies'), (snap) => {
      const cloudCompanies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompanies(prevCompanies => {
        const localEdits = window._isg_local_edits || {};
        const now = Date.now();

        const mergedCompanies = cloudCompanies.map(cloudC => {
          const localEntry = localEdits[String(cloudC.id)];
          if (localEntry) {
            const localC = localEntry.data;
            // Yerel düzenleme buluttan daha güncelse yerel düzenlemeyi koru
            if (localC && (localC._clientUpdatedAt || 0) > (cloudC._clientUpdatedAt || 0)) {
              return localC;
            }
          }
          return cloudC;
        });

        // Bulutta henüz olmayan yerel firmaları da koru
        const cloudIds = new Set(mergedCompanies.map(c => String(c.id)));
        (prevCompanies || []).forEach(pComp => {
          if (!cloudIds.has(String(pComp.id))) {
            const localEntry = localEdits[String(pComp.id)];
            if (localEntry && localEntry.data) {
              mergedCompanies.push(localEntry.data);
            }
          }
        });

        try {
          localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(mergedCompanies));
        } catch (e) {
          console.warn("localStorage yazma kotası:", e);
        }
        return mergedCompanies;
      });
      setLoadingData(false);
    }, (err) => {
      console.error("Firestore companies dinleme hatası:", err);
      setLoadingData(false);
    });
    return () => unsubscribe();
  }, [db, currentUser?.username]);`;

const replOnSnapshot = `  useEffect(() => {
    // Tarayıcı yeniden açıldığında yerel düzenleme önbelleğini geri yükle
    try {
      const cached = localStorage.getItem('isg_local_edits_cache');
      if (cached) {
        window._isg_local_edits = { ...(window._isg_local_edits || {}), ...JSON.parse(cached) };
      }
    } catch (_) {}

    if (!db || !currentUser) {
      setCompanies([]);
      return;
    }
    setLoadingData(true);
    const unsubscribe = onSnapshot(collection(db, 'companies'), (snap) => {
      const cloudCompanies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompanies(prevCompanies => {
        const localEdits = window._isg_local_edits || {};

        const mergedCompanies = cloudCompanies.map(cloudC => {
          const localEntry = localEdits[String(cloudC.id)];
          const localPrev = (prevCompanies || []).find(p => String(p.id) === String(cloudC.id));
          const candidate = (localEntry && localEntry.data) || localPrev;

          if (candidate) {
            const localTime = candidate._clientUpdatedAt || (localEntry ? localEntry.time : 0) || 0;
            const cloudTime = cloudC._clientUpdatedAt || 0;

            // Eğer yerel kopya buluttan daha güncelse yereli koru ve buluta geri yaz
            if (localTime > cloudTime) {
              if (db) {
                saveCompanyToDB(candidate).catch(() => {});
              }
              return candidate;
            }

            // Ayrıca: Bulut verisinde fotoğraflar veya alanlar boşsa ama yerelde varsa akıllıca birleştir
            if (candidate.assessments && Array.isArray(candidate.assessments)) {
              const mergedAssessments = (cloudC.assessments || []).map(cAss => {
                const lAss = candidate.assessments.find(a => String(a.id) === String(cAss.id));
                if (!lAss) return cAss;
                const mergedRisks = (cAss.risks || []).map(cRisk => {
                  const lRisk = (lAss.risks || []).find(r => String(r.id) === String(cRisk.id));
                  if (!lRisk) return cRisk;
                  return {
                    ...lRisk,
                    ...cRisk,
                    controlDate: cRisk.controlDate || lRisk.controlDate || '',
                    processOwner: cRisk.processOwner || lRisk.processOwner || '',
                    deadline: cRisk.deadline || lRisk.deadline || '',
                    beforePhoto: cRisk.beforePhoto || lRisk.beforePhoto || null,
                    afterPhoto: cRisk.afterPhoto || lRisk.afterPhoto || null,
                    postScore: (cRisk.postScore !== undefined && cRisk.postScore !== null) ? cRisk.postScore : lRisk.postScore
                  };
                });
                return { ...lAss, ...cAss, risks: mergedRisks };
              });
              cloudC = { ...cloudC, assessments: mergedAssessments };
            }
          }
          return cloudC;
        });

        // Bulutta henüz olmayan yerel firmaları da koru
        const cloudIds = new Set(mergedCompanies.map(c => String(c.id)));
        (prevCompanies || []).forEach(pComp => {
          if (!cloudIds.has(String(pComp.id))) {
            const localEntry = localEdits[String(pComp.id)];
            if (localEntry && localEntry.data) {
              mergedCompanies.push(localEntry.data);
            } else {
              mergedCompanies.push(pComp);
            }
          }
        });

        try {
          localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(mergedCompanies));
        } catch (e) {
          console.warn("localStorage yazma kotası:", e);
        }
        return mergedCompanies;
      });
      setLoadingData(false);
    }, (err) => {
      console.error("Firestore companies dinleme hatası:", err);
      setLoadingData(false);
    });
    return () => unsubscribe();
  }, [db, currentUser?.username]);`;

if (!content.includes(targetOnSnapshot)) {
  console.error('ERROR: targetOnSnapshot not found!');
  process.exit(1);
}
content = content.replace(targetOnSnapshot, replOnSnapshot);
console.log('4. Applied onSnapshot smart merge and local edit cache recovery');

// 4. updateActiveCompany, updateCompanyById, and handleManualSave
const targetUpdateActive = `  const updateActiveCompany = (updates) => {
    const updatedAt = Date.now();
    let updatedActiveComp = null;

    // 1. Doğrudan ve Hızlı Firestore Risk Analizi Kaydı (Gecikmesiz, anında kalıcı)
    if (db && activeCompanyId && updates.assessments) {
      saveAssessmentsDirectToDB(activeCompanyId, updates.assessments, updatedAt);
    }

    setCompanies(prevCompanies => {
      const updatedCompanies = (prevCompanies || []).map(c => {
        if (String(c.id) === String(activeCompanyId)) {
          const updatedComp = { ...c, ...updates, _clientUpdatedAt: updatedAt };
          updatedActiveComp = updatedComp;
          return updatedComp;
        }
        return c;
      });

      if (updatedActiveComp) {
        window._isg_local_edits = window._isg_local_edits || {};
        window._isg_local_edits[String(activeCompanyId)] = { time: updatedAt, data: updatedActiveComp };
        if (db) {
          saveCompanyToDB(updatedActiveComp).catch(err => console.warn("Bulut tam firma kayıt bildirimi:", err));
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
      } catch (e) {
        console.warn("localStorage kotası aşıldı, bellekten devam ediliyor:", e);
      }
      return updatedCompanies;
    });

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  }; 

  const updateCompanyById = (targetCompanyId, updates) => {
    const updatedAt = Date.now();
    let updatedTargetComp = null;

    if (db && targetCompanyId && updates.assessments) {
      saveAssessmentsDirectToDB(targetCompanyId, updates.assessments, updatedAt);
    }

    setCompanies(prevCompanies => {
      const updatedCompanies = (prevCompanies || []).map(c => {
        if (String(c.id) === String(targetCompanyId)) {
          const updatedComp = { ...c, ...updates, _clientUpdatedAt: updatedAt };
          updatedTargetComp = updatedComp;
          return updatedComp;
        }
        return c;
      });

      if (updatedTargetComp) {
        window._isg_local_edits = window._isg_local_edits || {};
        window._isg_local_edits[String(targetCompanyId)] = { time: updatedAt, data: updatedTargetComp };
        if (db) {
          saveCompanyToDB(updatedTargetComp).catch(err => console.warn("Bulut tam firma kayıt bildirimi:", err));
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
      } catch (e) {
        console.warn("localStorage kotası aşıldı, bellekten devam ediliyor:", e);
      }
      return updatedCompanies;
    });
  };


  const handleManualSave = async () => {
    if (!currentUser) return;
    setShowSaveNotification(true);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library));
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map(u => encryptUser(u))));
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

const replUpdateActive = `  const updateActiveCompany = (updates) => {
    const updatedAt = Date.now();
    let updatedActiveComp = null;

    // 1. Doğrudan ve Hızlı Firestore Risk Analizi Kaydı (Gecikmesiz, anında kalıcı)
    if (db && activeCompanyId && updates.assessments) {
      saveAssessmentsDirectToDB(activeCompanyId, updates.assessments, updatedAt);
    }

    setCompanies(prevCompanies => {
      const updatedCompanies = (prevCompanies || []).map(c => {
        if (String(c.id) === String(activeCompanyId)) {
          const updatedComp = { ...c, ...updates, _clientUpdatedAt: updatedAt };
          updatedActiveComp = updatedComp;
          return updatedComp;
        }
        return c;
      });

      if (updatedActiveComp) {
        window._isg_local_edits = window._isg_local_edits || {};
        window._isg_local_edits[String(activeCompanyId)] = { time: updatedAt, data: updatedActiveComp };
        try {
          localStorage.setItem('isg_local_edits_cache', JSON.stringify(window._isg_local_edits));
        } catch (_) {}
        if (db) {
          saveCompanyToDB(updatedActiveComp).catch(err => console.warn("Bulut tam firma kayıt bildirimi:", err));
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
      } catch (e) {
        console.warn("localStorage kotası aşıldı, bellekten devam ediliyor:", e);
      }
      return updatedCompanies;
    });

    // Synchronize permissions back to specialists if info.team or info.preparer changes
    if (updates.info) {
      syncPermissionsForCompany(activeCompanyId, updates.info.team, updates.info.preparer);
    }
  }; 

  const updateCompanyById = (targetCompanyId, updates) => {
    const updatedAt = Date.now();
    let updatedTargetComp = null;

    if (db && targetCompanyId && updates.assessments) {
      saveAssessmentsDirectToDB(targetCompanyId, updates.assessments, updatedAt);
    }

    setCompanies(prevCompanies => {
      const updatedCompanies = (prevCompanies || []).map(c => {
        if (String(c.id) === String(targetCompanyId)) {
          const updatedComp = { ...c, ...updates, _clientUpdatedAt: updatedAt };
          updatedTargetComp = updatedComp;
          return updatedComp;
        }
        return c;
      });

      if (updatedTargetComp) {
        window._isg_local_edits = window._isg_local_edits || {};
        window._isg_local_edits[String(targetCompanyId)] = { time: updatedAt, data: updatedTargetComp };
        try {
          localStorage.setItem('isg_local_edits_cache', JSON.stringify(window._isg_local_edits));
        } catch (_) {}
        if (db) {
          saveCompanyToDB(updatedTargetComp).catch(err => console.warn("Bulut tam firma kayıt bildirimi:", err));
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
      } catch (e) {
        console.warn("localStorage kotası aşıldı, bellekten devam ediliyor:", e);
      }
      return updatedCompanies;
    });
  };

  const handleManualSave = async () => {
    if (!currentUser) return;
    setShowSaveNotification(true);
    try {
      // 1. LocalStorage güvenli kayıt (kotaya takılmadan)
      try {
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      } catch (e) {
        console.warn("localStorage kotası aşıldı, hafifletilmiş kayıt deneniyor:", e);
        try {
          const lightCompanies = companies.map(c => ({
            ...c,
            assessments: (c.assessments || []).map(a => ({
              ...a,
              risks: (a.risks || []).map(r => ({
                ...r,
                beforePhoto: r.beforePhoto && r.beforePhoto.length > 40000 ? r.beforePhoto.slice(0, 40000) : r.beforePhoto,
                afterPhoto: r.afterPhoto && r.afterPhoto.length > 40000 ? r.afterPhoto.slice(0, 40000) : r.afterPhoto
              }))
            }))
          }));
          localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(lightCompanies));
        } catch (_) {}
      }

      try { localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library)); } catch (_) {}
      try { localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders)); } catch (_) {}
      try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map(u => encryptUser(u)))); } catch (_) {}
      try { localStorage.setItem('isg_affected_groups', JSON.stringify(affectedGroups)); } catch (_) {}

      // Yerel düzenleme durumunu yedekle
      try {
        if (window._isg_local_edits) {
          localStorage.setItem('isg_local_edits_cache', JSON.stringify(window._isg_local_edits));
        }
      } catch (_) {}

      // 2. Veritabanına (Firestore) Kalıcı Kayıt:
      // Aktif firma + kullanıcının erişebildiği firmalar (Kısıtlama olmadan aktif firma MUTLAKA kaydedilir)
      if (db) {
        const activeComp = companies.find(c => String(c.id) === String(activeCompanyId));
        const companiesToSave = Array.from(new Set([
          ...(currentUser.username === 'admin' ? companies : companies.filter(c => c.owner === currentUser.username)),
          ...(activeComp ? [activeComp] : [])
        ]));

        const savePromises = companiesToSave.map(comp => saveCompanyToDB(comp));
        await Promise.all(savePromises);
        console.log(\`[handleManualSave] \${companiesToSave.length} adet firma ve tüm risk analizleri buluta kaydedildi.\`);
      }
      setTimeout(() => setShowSaveNotification(false), 2000);
      alert("Tüm değişiklikler (kontrol tarihi, süreç sorumlusu, termin tarihi, fotoğraflar ve risk skorları) veritabanına ve sisteme başarıyla kaydedildi!");
    } catch (err) {
      console.error("Manuel kayıt hatası:", err);
      alert("Kayıt sırasında hata oluştu: " + (err?.message || err));
    }
  };`;

if (!content.includes(targetUpdateActive)) {
  console.error('ERROR: targetUpdateActive not found!');
  process.exit(1);
}
content = content.replace(targetUpdateActive, replUpdateActive);
console.log('5. Applied updateActiveCompany & handleManualSave bulletproof cloud save');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All patches successfully written to App.jsx!');
