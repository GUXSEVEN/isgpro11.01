const fs = require('fs');

const mainFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let code = fs.readFileSync(mainFile, 'utf8');

// 1. Update INITIAL_LIBRARY to include description
code = code.replace(
  `const INITIAL_LIBRARY = [
  { id: 'lib1', folderId: 'f1', category: 'Yüksekte Çalışma', hazard: 'Standartlara uygun olmayan iskele', risk: 'Düşme sonucu yaralanma/ölüm', precaution: 'TS EN 12811 standartlarına uygun iskele, paraşüt tipi emniyet kemeri.', defaultL: 4, defaultS: 5 },
  { id: 'lib2', folderId: 'f2', category: 'Elektrik', hazard: 'Açıkta duran pano uçları', risk: 'Elektrik çarpması ve yanık', precaution: 'Panolar kilitli tutulacak, kaçak akım rölesi test edilecek.', defaultL: 3, defaultS: 5 },
  { id: 'lib3', folderId: 'f3', category: 'Mekanik', hazard: 'Arızalı el aletleri', risk: 'Elektrik çarpması', precaution: 'El aletleri periyodik kontrol edilecek.', defaultL: 3, defaultS: 4 },
];`,
  `const INITIAL_LIBRARY = [
  { id: 'lib1', folderId: 'f1', category: 'Yüksekte Çalışma', description: 'Standartlara uygun olmayan iskele üzerinde çalışma', hazard: 'Standartlara uygun olmayan iskele', risk: 'Düşme sonucu yaralanma/ölüm', precaution: 'TS EN 12811 standartlarına uygun iskele, paraşüt tipi emniyet kemeri.', defaultL: 4, defaultS: 5 },
  { id: 'lib2', folderId: 'f2', category: 'Elektrik', description: 'Açıkta duran pano uçları ve kablo bağlantıları', hazard: 'Açıkta duran pano uçları', risk: 'Elektrik çarpması ve yanık', precaution: 'Panolar kilitli tutulacak, kaçak akım rölesi test edilecek.', defaultL: 3, defaultS: 5 },
  { id: 'lib3', folderId: 'f3', category: 'Mekanik', description: 'Arızalı ve yalıtımsız el aletleriyle çalışma', hazard: 'Arızalı el aletleri', risk: 'Elektrik çarpması', precaution: 'El aletleri periyodik kontrol edilecek.', defaultL: 3, defaultS: 4 },
];`
);

// 2. Update analyzeRiskFromImage prompt and return to include description
code = code.replace(
  `  "topic": "Spesifik İSG Konusu",
  "hazard": "Somut tehlike kaynağı (1-2 net cümle)",`,
  `  "topic": "Spesifik İSG Konusu",
  "description": "Fotoğrafta tespit edilen tehlikenin ve çalışma ortamının kısa özeti (1-2 net cümle)",
  "hazard": "Somut tehlike kaynağı (1-2 net cümle)",`
);

code = code.replace(
  `  return {
    topic: parsed.topic || parsed.category || 'Saha Güvenliği',
    hazard: parsed.hazard || 'Fotoğrafta tespit edilen somut tehlike kaynağı',`,
  `  return {
    topic: parsed.topic || parsed.category || 'Saha Güvenliği',
    description: parsed.description || parsed.hazard || 'Fotoğrafta tespit edilen çalışma ortamı ve tehlike durumu',
    hazard: parsed.hazard || 'Fotoğrafta tespit edilen somut tehlike kaynağı',`
);

// 3. Update calcAccurateRowHeight: remove topic height for web report
code = code.replace(
  `    const topicH = r.topic ? (fontPx + 6) : 0;`,
  `    const topicH = 0; // Konu artık Web Raporu Mevcut Durum hücresine eklenmez`
);

// 4. Update WebReportEditor: remove r.topic from column 3
const oldWebDescCell = `                          <td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1">
                              {r.topic && <div className="font-bold bg-yellow-50 p-0.5 border-b border-gray-100 text-center" style={{ fontSize: reportFontSize }}>{r.topic}</div>}
                              {r.beforePhoto ? (`;

const newWebDescCell = `                          <td className="border border-black p-1 bg-white font-normal" style={{ fontSize: reportFontSize, verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <div className="flex flex-col gap-1">
                              {r.beforePhoto ? (`;

if (code.includes(oldWebDescCell)) {
  code = code.replace(oldWebDescCell, newWebDescCell);
  console.log('✔ WebReportEditor: Konu kaldırıldı, sadece Mevcut Durum (foto + açıklama) bırakıldı.');
} else {
  console.warn('⚠ oldWebDescCell exact match not found');
}

// 5. Update getOpenInNewTabHTML: remove r.topic
code = code.replace(
  `        <td style="vertical-align: top; padding: 3px; background-color: white;">
           \${r.topic ? \`<div contenteditable="true" style="font-weight:bold; background-color:#fefce8; text-align:center; border-bottom:1px solid #eee; margin-bottom:2px; font-size: 7px; padding:1px;">\${r.topic}</div>\` : ''}
           \${beforeImg}`,
  `        <td style="vertical-align: top; padding: 3px; background-color: white;">
           \${beforeImg}`
);

// 6. Update React-PDF: remove r.topic
code = code.replace(
  `                    <View style={{ ...pdfStyles.cell, width: \`\${w.desc}%\` }}>
                      {r.topic ? <Text style={{ fontSize: 5.5, fontFamily: 'RobotoBold', backgroundColor: '#FEFCE8', padding: 1, marginBottom: 2 }}>{r.topic}</Text> : null}`,
  `                    <View style={{ ...pdfStyles.cell, width: \`\${w.desc}%\` }}>`
);

// 7. Update initial form state in AssessmentManager
code = code.replace(
  `  const [form, setForm] = useState({
    id: null, topic: '', hazard: '', risk: '', precaution: '',`,
  `  const [form, setForm] = useState({
    id: null, topic: '', description: '', hazard: '', risk: '', precaution: '',`
);

// 8. Update resetForm in AssessmentManager
code = code.replace(
  `setForm({ id: null, topic: '', hazard: '', risk: '', precaution: '',`,
  `setForm({ id: null, topic: '', description: '', hazard: '', risk: '', precaution: '',`
);

// 9. Update handleAnalyzePhoto to auto-fill description from hazard summary
code = code.replace(
  `      setForm(prev => ({
        ...prev,
        topic: res.topic || prev.topic || '',
        hazard: res.hazard || '',`,
  `      setForm(prev => ({
        ...prev,
        topic: res.topic || prev.topic || '',
        description: res.description || res.hazard || '',
        hazard: res.hazard || '',`
);

// 10. Update handleAIGenerated
code = code.replace(
  `    const normalized = {
      topic: data.topic || form.topic || '',
      hazard: data.hazard || '',`,
  `    const normalized = {
      topic: data.topic || form.topic || '',
      description: data.description || data.hazard || form.description || '',
      hazard: data.hazard || '',`
);

// 11. Add "Mevcut Durum" TextArea to the Risk Form JSX
const oldFormFields = `            </div>
          </div>

          <TextArea label="Tehlike Kaynağı" value={form.hazard}`;

const newFormFields = `            </div>
          </div>

          <TextArea label="Mevcut Durum" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Çalışma ortamındaki mevcut durum / tespit..." icon={FileText} color="blue" />
          <TextArea label="Tehlike Kaynağı" value={form.hazard}`;

if (code.includes(oldFormFields)) {
  code = code.replace(oldFormFields, newFormFields);
  console.log('✔ Form: "Mevcut Durum" alanı eklendi.');
} else {
  console.warn('⚠ oldFormFields exact match not found');
}

// 12. Update handleImportRisks to carry over description into assessment risks
code = code.replace(
  `        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`, originId: item.id,
        topic: item.category || '', hazard: item.hazard || '', risk: item.risk || '', precaution: item.precaution || '',`,
  `        id: \`risk-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`, originId: item.id,
        topic: item.category || '', description: item.description || item.hazard || '', hazard: item.hazard || '', risk: item.risk || '', precaution: item.precaution || '',`
);

// 13. Update handleBatchAddToLibrary to save description
code = code.replace(
  `    const itemsToAdd = selectedRisks.map(r => ({
      folderId: null,
      category: r.topic || r.department || 'Genel',
      hazard: r.hazard, risk: r.risk, precaution: r.precaution,`,
  `    const itemsToAdd = selectedRisks.map(r => ({
      folderId: null,
      category: r.topic || r.department || 'Genel',
      description: r.description || '',
      hazard: r.hazard, risk: r.risk, precaution: r.precaution,`
);

// 14. Update LibraryManager form to also have description
code = code.replace(
  `  const [form, setForm] = useState({
    id: null, category: '', hazard: '', risk: '', precaution: '',`,
  `  const [form, setForm] = useState({
    id: null, category: '', description: '', hazard: '', risk: '', precaution: '',`
);

code = code.replace(
  `            <Input label="Konu" value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Örn: Elektrik Güvenliği" />
            <TextArea label="Tehlike" value={form.hazard}`,
  `            <Input label="Konu" value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Örn: Elektrik Güvenliği" />
            <TextArea label="Mevcut Durum" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Mevcut çalışma durumu..." icon={FileText} color="blue" />
            <TextArea label="Tehlike" value={form.hazard}`
);

// Save main file
fs.writeFileSync(mainFile, code, 'utf8');
console.log('App.jsx in isg-projesi - mobile updated successfully.');

// Also copy to all other Desktop copies so they never fall out of sync
const otherCopies = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

otherCopies.forEach(dest => {
  if (fs.existsSync(dest)) {
    try {
      fs.writeFileSync(dest, code, 'utf8');
      console.log('Synced to:', dest);
    } catch (e) {
      console.error('Error syncing to', dest, e.message);
    }
  }
});
