const fs = require('fs');
const targetPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let rawContent = fs.readFileSync(targetPath, 'utf8');
const isCRLF = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');

function replaceBetween(startMarker, endMarker, newBlock, label) {
  const normStart = startMarker.replace(/\r\n/g, '\n');
  const normEnd = endMarker.replace(/\r\n/g, '\n');
  const startIdx = content.indexOf(normStart);
  if (startIdx === -1) {
    console.error(`ERROR: startMarker not found for [${label}]: ${normStart.slice(0, 50)}`);
    process.exit(1);
  }
  const endIdx = content.indexOf(normEnd, startIdx + normStart.length);
  if (endIdx === -1) {
    console.error(`ERROR: endMarker not found for [${label}]: ${normEnd.slice(0, 50)}`);
    process.exit(1);
  }
  const fullEndIdx = endIdx + normEnd.length;
  content = content.slice(0, startIdx) + newBlock.replace(/\r\n/g, '\n') + content.slice(fullEndIdx);
  console.log(`SUCCESS: Replaced [${label}]`);
}

// 1. generateRiskAssessment
const newGenRisk = `async function generateRiskAssessment(description) {
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
}

async function analyzeRiskFromImage(base64Image) {`;

replaceBetween(
  'async function generateRiskAssessment(description) {',
  'async function analyzeRiskFromImage(base64Image) {',
  newGenRisk,
  'generateRiskAssessment'
);

// 2. AIGeneratorModal
const newAIModal = `function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {
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

replaceBetween(
  'function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {',
  'function BulkEditModal({ selectedCount',
  newAIModal + '\n\n// --- GÜNCELLENMİŞ TOPLU DÜZENLEME MODALI ---\nfunction BulkEditModal({ selectedCount',
  'AIGeneratorModal'
);

// 3. handleAIGenerated
const newHandleAIGenerated = `  const handleAIGenerated = (data, autoAdd = false) => {
    if (!data) return;
    const normalized = {
      topic: data.topic || data.category || '',
      hazard: data.hazard || data.tehlike || '',
      risk: data.risk || data.olasiRisk || '',
      precaution: data.precaution || data.onlem || '',
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
        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`,
        topic: normalized.topic,
        hazard: normalized.hazard,
        risk: normalized.risk,
        precaution: normalized.precaution,
        department: form.department || assessment.department || 'Genel',
        activity: form.activity || assessment.activity || '',
        processOwner: form.processOwner || '',
        affectedPersons: form.affectedPersons || '',
        deadline: form.deadline || '',
        controlDate: form.controlDate || '',
        beforePhoto: null,
        afterPhoto: null,
        L: normalized.L,
        S: normalized.S,
        F: normalized.F,
        P: normalized.P,
        O: normalized.O,
        D: normalized.D,
        S_KINNEY: normalized.S_KINNEY,
        S_FMEA: normalized.S_FMEA,
        postL: 1, postS: 1, postF: 1, postP: 0.5, postO: 1, postD: 1,
        postS_KINNEY: 1, postS_FMEA: 1,
        score: String(calculatedScore || 0),
        postScore: null,
        status: 'Açık',
        createdAt: new Date().toISOString()
      };
      onAdd(riskData);
      resetForm();
    }
  };`;

replaceBetween(
  '  const handleAIGenerated = (data) => {',
  'alert("Yapay zeka önerisi uygulandı. Hak düşümü listeye eklediğinizde gerçekleşecektir.");\n  };',
  newHandleAIGenerated,
  'handleAIGenerated'
);

// 4. handleSubmit
const newHandleSubmitStart = `  const handleSubmit = (e) => {
    e.preventDefault();
    if (wasAIGenerated) {
      setWasAIGenerated(false);
      if (typeof checkAndIncrementAILimit === 'function') {
        try { checkAndIncrementAILimit(); } catch (err) {}
      }
    }
    const calculatedScore = calculateScore(form);`;

replaceBetween(
  '  const handleSubmit = (e) => {',
  'const calculatedScore = calculateScore(form);',
  newHandleSubmitStart,
  'handleSubmit'
);

// 5. AssessmentView AI Asistan button
if (content.includes('if (checkAndIncrementAILimit()) setShowAIModal(true);')) {
  content = content.replace(
    'if (checkAndIncrementAILimit()) setShowAIModal(true);',
    'setShowAIModal(true);'
  );
  console.log('SUCCESS: Replaced AI Asistan button open call');
}

// 6. handleAddRisk
replaceBetween(
  '  const handleAddRisk = (aid, risk) => {',
  '; };\n  const handleUpdateRisk =',
  `  const handleAddRisk = (aid, risk) => {
    const newRisk = { ...risk, id: risk.id || \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\` };
    const currentComp = companies.find(c => String(c.id) === String(activeCompanyId)) || activeCompany;
    if (!currentComp) return;
    const currentAssessments = currentComp.assessments || [];
    updateActiveCompany({
      assessments: currentAssessments.map(a => String(a.id) === String(aid) ? { ...a, risks: [newRisk, ...(a.risks || [])] } : a)
    });
  };\n  const handleUpdateRisk =`,
  'handleAddRisk'
);

const finalContent = isCRLF ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(targetPath, finalContent, 'utf8');
console.log('ALL PATCHES APPLIED SUCCESSFULLY TO isg-projesi - Copy/src/App.jsx!');
