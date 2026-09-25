const fs = require('fs');

const allCandidateFiles = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App-ekstra.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App-2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App-3.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App-stabil en son srüüm.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

allCandidateFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  try {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern 1: WebReportEditor with ReportTextCell
    if (content.includes('border-b border-slate-200 pb-0.5">{r.hazard}</div>')) {
      content = content.replace(
        '<div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>',
        '<div className="font-bold p-1 border-b border-black" style={{ borderBottom: \'1px solid black\' }}>{r.hazard}</div>'
      );
      content = content.replace(
        '<div className="italic text-slate-600">{r.risk}</div>',
        '<div className="italic text-slate-700 p-1">{r.risk}</div>'
      );
      content = content.replace(
        '<td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>',
        '<td className="border border-black p-0 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign, padding: 0 }}>'
      );
      content = content.replace(
        '<td className="border border-black p-1 align-top text-[6.5px] font-normal">',
        '<td className="border border-black p-0 align-top text-[6.5px] font-normal" style={{ padding: 0 }}>'
      );
      changed = true;
    }

    // Pattern 2: print html with border-bottom:1px solid #ccc;
    if (content.includes('border-bottom:1px solid #ccc; margin-bottom:2px; padding-bottom:1px;">${r.hazard}</div>')) {
      content = content.replace(
        '<div contenteditable="true" style="font-weight:bold; border-bottom:1px solid #ccc; margin-bottom:2px; padding-bottom:1px;">${r.hazard}</div>\n           <div contenteditable="true" style="font-style:italic; color:#444;">${r.risk}</div>',
        '<div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black; padding: 3px;">${r.hazard}</div>\n           <div contenteditable="true" style="font-style:italic; color:#444; padding: 3px;">${r.risk}</div>'
      );
      content = content.replace(
        '<td style="vertical-align: top; padding: 3px;">\n           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black;',
        '<td style="vertical-align: top; padding: 0;">\n           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black;'
      );
      changed = true;
    }

    // Pattern 3: SahaZiyaretEditor
    if (content.includes('<br />{risk.hazard}\n                              <br />{risk.risk}')) {
      content = content.replace(
        '<strong style={{ textTransform: \'uppercase\' }}>{risk.topic || \'BULGU\'}</strong>\n                              <br />{risk.hazard}\n                              <br />{risk.risk}',
        '<strong style={{ textTransform: \'uppercase\' }}>{risk.topic || \'BULGU\'}</strong>\n                              <div className="font-bold border-b border-black pb-0.5 mb-0.5 mt-1" style={{ borderBottom: \'1px solid black\' }}>{risk.hazard}</div>\n                              <div className="italic text-slate-700">{risk.risk}</div>'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully patched:', file);
    } else {
      console.log('No changes needed:', file);
    }
  } catch (err) {
    console.error('Error patching', file, err.message);
  }
});
