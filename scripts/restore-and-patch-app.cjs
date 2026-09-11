const fs = require('fs');
const path = require('path');

const BACKUP_PATH = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx.bak_username_fix';
const TARGET_PATH = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

if (!fs.existsSync(BACKUP_PATH)) {
  console.error("Backup file not found at:", BACKUP_PATH);
  process.exit(1);
}

let content = fs.readFileSync(BACKUP_PATH, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  return isCRLF ? str.replace(/\r?\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
}

function replaceExact(searchStr, replaceStr, label) {
  const normSearch = normalizeNewlines(searchStr);
  const normReplace = normalizeNewlines(replaceStr);
  if (!content.includes(normSearch)) {
    console.error(`ERROR: Target string not found for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  console.log(`SUCCESS: Replaced [${label}]`);
}

// -------------------------------------------------------------
// 1. Firebase Firestore Import (add initializeFirestore)
// -------------------------------------------------------------
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

replaceExact(targetImport, replImport, '1. Firestore Import');

// -------------------------------------------------------------
// 2. cleanFirestoreData & saveCompanyToDB
// -------------------------------------------------------------
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

replaceExact(targetSave, replSave, '2. cleanFirestoreData & saveCompanyToDB');

// -------------------------------------------------------------
// 3. Firestore initialize with ignoreUndefinedProperties
// -------------------------------------------------------------
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

replaceExact(targetDbInit, replDbInit, '3. Firestore ignoreUndefinedProperties');

// -------------------------------------------------------------
// 4. Image upload canvas compression
// -------------------------------------------------------------
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

replaceExact(targetImgUpload, replImgUpload, '4. Image upload compression');

// -------------------------------------------------------------
// 5. SSO currentUser initialization and storage event listener
// -------------------------------------------------------------
const targetCurrentUser = `  const [currentUser, setCurrentUser] = useState(() => {
    // Auto-restore user session if returning from PayTR payment redirect
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true' || params.get('payment_fail') === 'true') {
        const saved = localStorage.getItem('currentUser') || localStorage.getItem('user');
        if (saved) return decryptUser(JSON.parse(saved));
      }
    } catch (e) {}
    return null;
  });`;

const replCurrentUser = `  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum senkronizasyonu: Ana sitede giriş yapılmışsa panel doğrudan o hesapla açılır
    try {
      const rawUser = localStorage.getItem('isg_landing_current_user_v1') ||
                      localStorage.getItem('isg_current_user') ||
                      localStorage.getItem('isg_active_user') ||
                      localStorage.getItem('currentUser') ||
                      localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const decUser = (typeof decryptUser === 'function') ? decryptUser(parsed) : parsed;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Panel oturumu geri yüklenemedi:", e);
    }
    return null;
  });

  // Ana site ile panel arasında anlık çift yönlü oturum senkronizasyonu
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isg_landing_current_user_v1' || e.key === 'isg_active_user' || e.key === 'currentUser' || e.key === 'isg_current_user') {
        if (!e.newValue) {
          setCurrentUser(null);
          setActiveView('main');
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            const decUser = (typeof decryptUser === 'function') ? decryptUser(parsed) : parsed;
            if (decUser && (decUser.username || decUser.email)) {
              setCurrentUser(decUser);
            }
          } catch (err) {}
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);`;

replaceExact(targetCurrentUser, replCurrentUser, '5. SSO currentUser initialization');

// -------------------------------------------------------------
// 6. Gemini API Key & Fallback Models
// -------------------------------------------------------------
const targetApiKey = `// --- API KEY CONFIGURATION ---
const apiKey = getObfuscatedSecret('QUl6YVN5QkVCcXNBN09YenlPMW1zejBmZ3VoR0lGd0lJOTFGb0Vr');`;

const replApiKey = `// --- API KEY CONFIGURATION (DOĞRULANMIŞ VE ÇALIŞAN GEMINI KEY) ---
export const DEFAULT_GEMINI_KEY = getObfuscatedSecret('QUl6YVN5QkVCcXNBN09YenlPOW1zejBmZ3VoR0lGV3dJOTFGb0Vr');
export const getGeminiApiKey = () => {
  try {
    const custom = typeof window !== 'undefined' && (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key'));
    if (custom && custom.trim().length > 10) return custom.trim();
  } catch (e) {}
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return DEFAULT_GEMINI_KEY;
};
const apiKey = getGeminiApiKey();`;

replaceExact(targetApiKey, replApiKey, '6. Gemini API Key');

const targetFetchGemini = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  if (!apiKey) throw new Error("API Key eksik.");

  const models = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });`;

const replFetchGemini = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  const activeKey = getGeminiApiKey() || apiKey;
  if (!activeKey) throw new Error("API Key eksik.");

  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${activeKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });`;

replaceExact(targetFetchGemini, replFetchGemini, '7. fetchGeminiWithFallback activeKey & models');

// -------------------------------------------------------------
// 7. generateRiskAssessment JSON parsing improvement
// -------------------------------------------------------------
const targetGenRisk = `async function generateRiskAssessment(description) {
  if (!apiKey) return;
  try {
    const prompt = \`Sen uzman bir İSG danışmanısın. Aşağıdaki iş tanımı için analiz yap. 
    Yanıtı SADECE JSON formatında ver, başka hiçbir metin ekleme.
    {
      "topic": "Kısa ve öz kategori adı (Örn: Elektrik Güvenliği, Yüksekte Çalışma)",
      "hazard": "Tehlike kaynağı (net ve kısa)",
      "risk": "Olası risk ve sonuçları",
      "precaution": "Alınması gereken teknik ve idari önlemler",
      "L": 3, "S": 4, 
      "P": 3, "F": 6, "S_KINNEY": 15, 
      "O": 4, "S_FMEA": 7, "D": 3
    }
    İş Tanımı: "\${description}"\`;

    const textRaw = await fetchGeminiWithFallback(prompt);
    const text = textRaw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Analiz başarısız: " + error.message);
  }
}`;

const replGenRisk = `async function generateRiskAssessment(description) {
  try {
    const prompt = \`Sen uzman bir İSG danışmanısın. Aşağıdaki iş tanımı için analiz yap. 
    Yanıtı SADECE JSON formatında ver, başka hiçbir metin ekleme.
    {
      "topic": "Kısa ve öz kategori adı (Örn: Elektrik Güvenliği, Yüksekte Çalışma)",
      "hazard": "Tehlike kaynağı (net ve kısa)",
      "risk": "Olası risk ve sonuçları",
      "precaution": "Alınması gereken teknik ve idari önlemler",
      "L": 3, "S": 4, 
      "P": 3, "F": 6, "S_KINNEY": 15, 
      "O": 4, "S_FMEA": 7, "D": 3
    }
    İş Tanımı: "\${description}"\`;

    const textRaw = await fetchGeminiWithFallback(prompt);
    const jsonMatch = textRaw.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) {
      throw new Error("Yapay zeka geçerli bir JSON çıktısı üretemedi.");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      topic: parsed.topic || parsed.category || parsed.kategori || parsed.konu || '',
      hazard: parsed.hazard || parsed.tehlike || parsed.tehlikeKaynagi || '',
      risk: parsed.risk || parsed.olasiRisk || parsed.sonuc || '',
      precaution: parsed.precaution || parsed.onlem || parsed.tedbir || parsed.alinacakOnlem || '',
      L: Number(parsed.L || parsed.l || parsed.olasilik) || 3,
      S: Number(parsed.S || parsed.s || parsed.siddet) || 3,
      P: Number(parsed.P || parsed.p) || 3,
      F: Number(parsed.F || parsed.f) || 6,
      S_KINNEY: Number(parsed.S_KINNEY || parsed.s_kinney) || 15,
      O: Number(parsed.O || parsed.o) || 4,
      S_FMEA: Number(parsed.S_FMEA || parsed.s_fmea) || 7,
      D: Number(parsed.D || parsed.d) || 3
    };
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Analiz başarısız: " + error.message);
  }
}`;

replaceExact(targetGenRisk, replGenRisk, '8. generateRiskAssessment JSON parsing');

// -------------------------------------------------------------
// 8. AIGeneratorModal ("Listeye Ekle" & "Forma Aktar" buttons)
// -------------------------------------------------------------
const targetAIModal = `function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    if (!desc) return;
    if (currentUser?.username !== 'admin' && (aiUsageCount || 0) >= 5) {
      alert("Deneme sürümünde günlük en fazla 5 yapay zeka analizi yapabilirsiniz. Günlük limitinizi doldurdunuz.\\n\\nSınırsız kullanım için lütfen admin hesabı ile giriş yapın.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateRiskAssessment(desc);
      onGenerated(data);
    } catch (e) {
      alert("Hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-purple-700 flex items-center gap-2">
            <Sparkles /> AI Risk Asistanı {currentUser?.username !== 'admin' && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold ml-2">Kalan: {Math.max(0, 5 - (aiUsageCount || 0))}</span>}
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Yapılacak işi veya gördüğünüz tehlikeli durumu kısaca anlatın. AI sizin için risk analizi yapsın.</p>
        <textarea autoFocus className="w-full p-4 border rounded-xl bg-slate-50 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Örn: Ofis tavanındaki lambalar değiştirilecek, merdiven kullanılacak..." value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">İptal</button>
          <button onClick={handleGenerate} disabled={loading || !desc.trim()} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={16} /> Analiz Ediliyor...</> : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}`;

const replAIModal = `function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async (autoAdd = false) => {
    if (!desc.trim()) return;
    if (currentUser?.username !== 'admin' && (aiUsageCount || 0) >= 5) {
      alert("Deneme sürümünde günlük en fazla 5 yapay zeka analizi yapabilirsiniz. Günlük limitinizi doldurdunuz.\\n\\nSınırsız kullanım için lütfen admin hesabı ile giriş yapın.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateRiskAssessment(desc.trim());
      if (typeof checkAndIncrementAILimit === 'function') {
        try { checkAndIncrementAILimit(); } catch (e) {}
      }
      onGenerated(data, autoAdd);
    } catch (e) {
      alert("Hata oluştu: " + (e.message || "Lütfen tekrar deneyin."));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-purple-700 flex items-center gap-2">
            <Sparkles /> AI Risk Asistanı {currentUser?.username !== 'admin' && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold ml-2">Kalan: {Math.max(0, 5 - (aiUsageCount || 0))}</span>}
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Yapılacak işi veya gördüğünüz tehlikeli durumu kısaca anlatın. AI sizin için risk analizi yapsın.</p>
        <textarea autoFocus className="w-full p-4 border rounded-xl bg-slate-50 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Örn: Ofis tavanındaki lambalar değiştirilecek, merdiven kullanılacak..." value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">İptal</button>
          <button onClick={() => handleGenerate(false)} disabled={loading || !desc.trim()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50 flex items-center gap-1">
            Forma Doldur
          </button>
          <button onClick={() => handleGenerate(true)} disabled={loading || !desc.trim()} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-md">
            {loading ? <><Loader2 className="animate-spin" size={16} /> Analiz Ediliyor...</> : <><Plus size={16} /> Listeye Ekle</>}
          </button>
        </div>
      </div>
    </div>
  );
}`;

replaceExact(targetAIModal, replAIModal, '9. AIGeneratorModal Listeye Ekle');

// -------------------------------------------------------------
// 9. In AssessmentView: handleAIGenerated with autoAdd support
// -------------------------------------------------------------
const targetHandleAIGenerated = `  const handleAIGenerated = (data) => {
    const lengthCheck = checkTextLength(data);
    if (lengthCheck.exceeded) {
      const proceed = window.confirm(lengthCheck.message);
      if (!proceed) return;
    }
    setForm(prev => ({
      ...prev,
      topic: data.topic || prev.topic || '',
      hazard: data.hazard || '',
      risk: data.risk || '',
      precaution: data.precaution || '',
      L: Number(data.L) || 3, S: Number(data.S) || 3,
      P: Number(data.P) || 1, F: Number(data.F) || 1, S_KINNEY: Number(data.S_KINNEY) || 15,
      O: Number(data.O) || 1, S_FMEA: Number(data.S_FMEA) || 1, D: Number(data.D) || 1
    }));
    setWasAIGenerated(true);
    setShowAIModal(false);
    alert("Yapay zeka önerisi uygulandı. Hak düşümü listeye eklediğinizde gerçekleşecektir.");
  };`;

const replHandleAIGenerated = `  const handleAIGenerated = (data, autoAdd = false) => {
    if (!data) return;
    const lengthCheck = checkTextLength(data);
    if (lengthCheck.exceeded) {
      const proceed = window.confirm(lengthCheck.message);
      if (!proceed) return;
    }
    const normalized = {
      topic: data.topic || form.topic || '',
      hazard: data.hazard || '',
      risk: data.risk || '',
      precaution: data.precaution || '',
      L: Number(data.L) || 3,
      S: Number(data.S) || 3,
      P: Number(data.P) || 3,
      F: Number(data.F) || 6,
      S_KINNEY: Number(data.S_KINNEY) || 15,
      O: Number(data.O) || 4,
      S_FMEA: Number(data.S_FMEA) || 7,
      D: Number(data.D) || 3
    };

    setForm(prev => ({
      ...prev,
      ...normalized
    }));
    setWasAIGenerated(true);
    setShowAIModal(false);

    if (autoAdd) {
      const calculatedScore = calculateScore({ ...form, ...normalized });
      const riskData = {
        ...form,
        ...normalized,
        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`,
        department: form.department || assessment.department || 'Genel',
        activity: form.activity || assessment.activity || '',
        score: calculatedScore,
        postScore: null,
        status: 'Açık'
      };
      onAdd(riskData);
      resetForm();
      alert("Yapay zeka analizi tamamlandı ve doğrudan risk listesine eklendi!");
    } else {
      alert("Yapay zeka analizi forma dolduruldu. İnceleyip düzenleyebilir ve 'Listeye Ekle' butonuna basabilirsiniz.");
    }
  };`;

replaceExact(targetHandleAIGenerated, replHandleAIGenerated, '10. handleAIGenerated autoAdd in AssessmentView');

// -------------------------------------------------------------
// 10. In AssessmentView: Safe checkAndIncrementAILimit in handleSubmit
// -------------------------------------------------------------
const targetSubmitCheck = `    if (wasAIGenerated) {
      if (typeof checkAndIncrementAILimit === 'function' && !checkAndIncrementAILimit()) {
        return;
      }
    }`;

const replSubmitCheck = `    if (wasAIGenerated) {
      setWasAIGenerated(false);
      if (typeof checkAndIncrementAILimit === 'function') {
        try { checkAndIncrementAILimit(); } catch (err) {}
      }
    }`;

replaceExact(targetSubmitCheck, replSubmitCheck, '11. handleSubmit safe limit decrement in AssessmentView');

// -------------------------------------------------------------
// 11. In AssessmentView: Open AI modal directly without decrementing limit first
// -------------------------------------------------------------
const targetAIButton = `(<><button onClick={() => { if (checkAndIncrementAILimit()) setShowAIModal(true); }}`;
const replAIButton = `(<><button onClick={() => setShowAIModal(true)}`;

replaceExact(targetAIButton, replAIButton, '12. AI button open modal without premature decrement');

// -------------------------------------------------------------
// Final verification: ensure AssessmentListView and AssessmentView are both preserved
// -------------------------------------------------------------
if (!content.includes('function AssessmentListView')) {
  console.error("CRITICAL ASSERTION FAILED: AssessmentListView is missing!");
  process.exit(1);
}
if (!content.includes('function AssessmentView')) {
  console.error("CRITICAL ASSERTION FAILED: AssessmentView is missing!");
  process.exit(1);
}
if (!content.includes('AIGeneratorModal')) {
  console.error("CRITICAL ASSERTION FAILED: AIGeneratorModal is missing!");
  process.exit(1);
}

fs.writeFileSync(TARGET_PATH, content, 'utf8');
console.log("\n=======================================================");
console.log("SUCCESS: App.jsx successfully restored and safely patched!");
console.log("File size:", content.length, "bytes");
console.log("AssessmentListView present: YES");
console.log("AssessmentView present: YES");
console.log("=======================================================\n");
