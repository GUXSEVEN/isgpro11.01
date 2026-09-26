const fs = require('fs');

const targetFiles = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

const primaryFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let code = fs.readFileSync(primaryFile, 'utf8');

// 1. In AIGeneratorModal, add toggle UI after the textarea if not already present
if (!code.includes('Mevcut Durum Alanını Doldur')) {
  const oldTextarea = `<textarea autoFocus className="w-full p-4 border rounded-xl bg-slate-50 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Örn: 3. kat dış cephe iskelesinde montaj yapılacak, zemin ıslak ve rüzgar var..." value={desc} onChange={e => setDesc(e.target.value)} />`;
  const newTextarea = `<textarea autoFocus className="w-full p-4 border rounded-xl bg-slate-50 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Örn: 3. kat dış cephe iskelesinde montaj yapılacak, zemin ıslak ve rüzgar var..." value={desc} onChange={e => setDesc(e.target.value)} />
        
        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer bg-purple-50 p-2.5 rounded-xl border border-purple-200 select-none my-3 hover:bg-purple-100/70 transition-colors">
          <div className="flex-1 pr-2">
            <span className="font-bold text-purple-900 flex items-center gap-1.5">
              <FileText size={14} className="text-purple-600" />
              Mevcut Durum Alanını Doldur
            </span>
            <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
              {aiWriteDescription ? 'Yapay zeka mevcut durumu da tespit edip forma aktarır.' : 'Kapalı: Mevcut durum boş bırakılır, sadece konu, tehlike, risk ve önlemler yazılır.'}
            </span>
          </div>
          <input 
            type="checkbox" 
            checked={aiWriteDescription} 
            onChange={e => {
              setAiWriteDescription(e.target.checked);
              try { localStorage.setItem('isg_ai_write_description', e.target.checked ? 'true' : 'false'); } catch(_) {}
            }}
            className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
          />
        </label>`;
  if (code.includes(oldTextarea)) {
    code = code.replace(oldTextarea, newTextarea);
    console.log('✓ AIGeneratorModal: toggle checkbox added.');
  } else {
    console.warn('⚠ oldTextarea pattern not found');
  }
} else {
  console.log('✓ AIGeneratorModal already contains toggle.');
}

// 2. In AssessmentView, ensure aiWriteDescription state is declared
const targetAssessState = `  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [wasAIGenerated, setWasAIGenerated] = useState(false);`;
const replacementAssessState = `  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [wasAIGenerated, setWasAIGenerated] = useState(false);
  const [aiWriteDescription, setAiWriteDescription] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_ai_write_description');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });`;

if (code.includes(targetAssessState)) {
  code = code.replace(targetAssessState, replacementAssessState);
  console.log('✓ AssessmentView: aiWriteDescription state added.');
} else if (code.includes('const [aiWriteDescription, setAiWriteDescription] = useState') && code.indexOf('const [aiWriteDescription, setAiWriteDescription] = useState') !== code.lastIndexOf('const [aiWriteDescription, setAiWriteDescription] = useState')) {
  console.log('✓ AssessmentView already has aiWriteDescription state.');
} else {
  console.warn('⚠ targetAssessState pattern not found in AssessmentView');
}

// Save primary file and sync to all copies
fs.writeFileSync(primaryFile, code, 'utf8');
console.log('Saved primary file:', primaryFile);

targetFiles.forEach(target => {
  if (target === primaryFile) return;
  if (fs.existsSync(target)) {
    try {
      fs.writeFileSync(target, code, 'utf8');
      console.log('Synced to:', target);
    } catch (e) {
      console.error('Error syncing to:', target, e.message);
    }
  }
});

console.log('Done!');
