const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  return isCRLF ? str.replace(/\r?\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
}

// 1. generateRiskAssessment fonksiyonunu güncelle (apiKey ilet & zengin prompt)
const startMarkerGen = "async function generateRiskAssessment(description) {";
const endMarkerGen = "async function analyzeRiskFromImage(base64Image) {";

const startIndexGen = content.indexOf(startMarkerGen);
const endIndexGen = content.indexOf(endMarkerGen);

if (startIndexGen === -1 || endIndexGen === -1 || startIndexGen >= endIndexGen) {
  console.error("ERROR: Could not locate generateRiskAssessment boundaries!");
  process.exit(1);
}

const newGenerateRiskAssessment = `async function generateRiskAssessment(description) {
  const activeKey = getGeminiApiKey() || apiKey;

  // 1. Önce sunucu üzerindeki güvenli ve garantili /api/generate-risk servisini çağır (apiKey ile)
  try {
    const res = await fetch('/api/generate-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, apiKey: activeKey })
    });
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && (parsed.hazard || parsed.risk || parsed.category || parsed.topic)) {
        return {
          topic: parsed.topic || parsed.category || 'Genel İSG',
          hazard: parsed.hazard || '',
          risk: parsed.risk || '',
          precaution: parsed.precaution || '',
          L: Number(parsed.L) || 3,
          S: Number(parsed.S) || 3,
          P: Number(parsed.P) || 3,
          F: Number(parsed.F) || 6,
          S_KINNEY: Number(parsed.S_KINNEY) || 15,
          O: Number(parsed.O) || 4,
          S_FMEA: Number(parsed.S_FMEA) || 7,
          D: Number(parsed.D) || 3
        };
      }
    }
  } catch (srvErr) {
    console.warn("Sunucu AI proxy çağrısı başarısız, istemci üzerinden deneniyor:", srvErr);
  }

  // 2. Sunucu proxy yanıt vermezse doğrudan Gemini API çağrısını dene
  if (activeKey && !activeKey.includes('AIzaSyBEBqs')) {
    try {
      const prompt = \`Sen uzman bir İş Sağlığı ve Güvenliği (İSG) danışmanısın. Aşağıdaki iş faaliyeti için resmi raporlara uygun, ortalama uzunlukta ve maddeli bir analiz yap.
Yanıtı SADECE geçerli JSON formatında ver:
{
  "topic": "Spesifik İSG Konusu (2-4 kelime)",
  "hazard": "Somut tehlike kaynağı (1-2 net cümle)",
  "risk": "Olası kaza ve sonuç (1-2 net cümle)",
  "precaution": "1. Birinci somut önlem\\\\n2. İkinci somut önlem\\\\n3. Üçüncü somut önlem",
  "L": 4, "S": 4, 
  "P": 6, "F": 6, "S_KINNEY": 15, 
  "O": 6, "S_FMEA": 8, "D": 4
}
İş Tanımı: "\${description}"\`;

      const textRaw = await fetchGeminiWithFallback(prompt);
      const jsonMatch = textRaw.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          topic: parsed.topic || parsed.category || 'Genel İSG',
          hazard: parsed.hazard || '',
          risk: parsed.risk || '',
          precaution: parsed.precaution || '',
          L: Number(parsed.L) || 3,
          S: Number(parsed.S) || 3,
          P: Number(parsed.P) || 3,
          F: Number(parsed.F) || 6,
          S_KINNEY: Number(parsed.S_KINNEY) || 15,
          O: Number(parsed.O) || 4,
          S_FMEA: Number(parsed.S_FMEA) || 7,
          D: Number(parsed.D) || 3
        };
      }
    } catch (aiErr) {
      console.warn("Doğrudan Gemini çağrısı başarısız, yerel uzman İSG motoru devreye giriyor:", aiErr);
    }
  }

  // 3. Her iki yol da başarısız olursa anında profesyonel yerel analizi üretir
  return generateClientOHSFallback(description);
}

`;

content = content.substring(0, startIndexGen) + normalizeNewlines(newGenerateRiskAssessment) + content.substring(endIndexGen);
console.log("SUCCESS: Replaced generateRiskAssessment with resilient multi-tier engine!");

// 2. AIGeneratorModal içine API Anahtarı Tanımlama ve akıllı hata yakalama ekle
const startMarkerModal = "function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {";
const endMarkerModal = "function BulkEditModal({";

const startIndexModal = content.indexOf(startMarkerModal);
const endIndexModal = content.indexOf(endMarkerModal);

if (startIndexModal === -1 || endIndexModal === -1 || startIndexModal >= endIndexModal) {
  console.error("ERROR: Could not locate AIGeneratorModal boundaries!");
  process.exit(1);
}

const newAIGeneratorModal = `function AIGeneratorModal({ onClose, onGenerated, checkAndIncrementAILimit, aiUsageCount, currentUser }) {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePromptApiKey = () => {
    const existing = localStorage.getItem('isg_custom_gemini_key') || '';
    const entered = window.prompt(
      "Yapay zeka asistanının derinlemesine ve en güncel modellerle çalışması için Gemini API Anahtarınızı giriniz:\\n\\n(Google AI Studio'dan ücretsiz alabilirsiniz: https://aistudio.google.com/)",
      existing
    );
    if (entered !== null) {
      const cleanKey = entered.trim();
      if (cleanKey.length > 10) {
        localStorage.setItem('isg_custom_gemini_key', cleanKey);
        alert("Gemini API Anahtarınız başarıyla kaydedildi! Artık tüm yapay zeka özellikleri aktif.");
      } else if (cleanKey === '') {
        localStorage.removeItem('isg_custom_gemini_key');
        alert("Özel API anahtarı temizlendi.");
      }
    }
  };

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
      if (!autoAdd) {
        onClose();
      }
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
        <p className="text-sm text-slate-500 mb-3">Yapılacak işi veya gördüğünüz tehlikeli durumu kısaca anlatın. Yapay zeka sizin için mevzuata uygun konu, spesifik tehlike, olası risk ve teknik önlemleri çıkarsın.</p>
        
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={handlePromptApiKey} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
            <KeyRound size={12} /> {localStorage.getItem('isg_custom_gemini_key') ? '🔑 Özel Gemini AI Anahtarı Tanımlı' : '🔑 Gemini AI Anahtarı Tanımla'}
          </button>
        </div>

        <textarea autoFocus className="w-full p-4 border rounded-xl bg-slate-50 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Örn: 3. kat dış cephe iskelesinde montaj yapılacak, zemin ıslak ve rüzgar var..." value={desc} onChange={e => setDesc(e.target.value)} />
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
}

`;

content = content.substring(0, startIndexModal) + normalizeNewlines(newAIGeneratorModal) + content.substring(endIndexModal);
console.log("SUCCESS: Replaced AIGeneratorModal with seamless AI key handling & auto-fill!");

fs.writeFileSync(path, content, 'utf8');
console.log("ALL AI ASSISTANT PATCHES APPLIED TO App.jsx!");
