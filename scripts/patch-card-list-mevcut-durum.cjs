const fs = require('fs');

const files = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

const target = `<p className="text-xs text-slate-500 font-medium mb-2">{risk.risk}</p>`;
const replacement = `<p className="text-xs text-slate-500 font-medium mb-2">{risk.risk}</p>
                            {risk.description && <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-2 font-normal"><span className="font-bold text-slate-700">Mevcut Durum: </span>{risk.description}</div>}`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes(target) && !c.includes('Mevcut Durum: </span>{risk.description}')) {
      c = c.replace(target, replacement);
      fs.writeFileSync(f, c, 'utf8');
      console.log('Card view updated in:', f);
    }
  }
});
