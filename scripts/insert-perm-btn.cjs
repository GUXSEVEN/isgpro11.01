const fs = require('fs');
const content = fs.readFileSync('./src/components/AdminPanel.tsx', 'utf8');
const lines = content.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes('openEditModalForUser(u)'));
if (idx !== -1) {
  console.log('Found openEditModalForUser(u) at line', idx + 1);
  const btnLines = [
    '                                     {/* Firma İzinleri ve OSGB Yetkileri Modalı Açıcı */}',
    '                                     <button',
    '                                       onClick={() => openPermissionsModalForUser(u)}',
    '                                       title="Firma İzinlerini ve OSGB Yetkilerini Yönet"',
    '                                       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-indigo-200 flex items-center gap-1 shadow-xs"',
    '                                     >',
    '                                       <ShieldCheck size={11} className="text-indigo-600" />',
    '                                       <span>Firma İzinleri</span>',
    '                                     </button>'
  ];
  let insertIdx = idx;
  if (lines[idx - 1] && lines[idx - 1].includes('<button')) {
    insertIdx = idx - 1;
  }
  if (lines[insertIdx - 1] && lines[insertIdx - 1].includes('Şifre')) {
    insertIdx = insertIdx - 1;
  }
  lines.splice(insertIdx, 0, ...btnLines);
  fs.writeFileSync('./src/components/AdminPanel.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully inserted Firma İzinleri button!');
} else {
  console.error('Could not find line!');
}
