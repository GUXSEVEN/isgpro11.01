const fs = require('fs');

const filesToPatch = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

// Target 1: WebReportEditor
const oldWebHazard = `<div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                              <div className="italic text-slate-600">{r.risk}</div>`;

const newWebHazard = `<div className="font-bold p-1 border-b border-black" style={{ borderBottom: '1px solid black' }}>{r.hazard}</div>
                              <div className="italic text-slate-700 p-1">{r.risk}</div>`;

// Target 2: SahaZiyaretEditor
const oldSahaDesc = `<strong style={{ textTransform: 'uppercase' }}>{risk.topic || 'BULGU'}</strong>
                              <br />{risk.hazard}
                              <br />{risk.risk}`;

const newSahaDesc = `<strong style={{ textTransform: 'uppercase' }}>{risk.topic || 'BULGU'}</strong>
                              <div className="font-bold border-b border-black pb-0.5 mb-0.5 mt-1" style={{ borderBottom: '1px solid black' }}>{risk.hazard}</div>
                              <div className="italic text-slate-700">{risk.risk}</div>`;

// Target 3: getOpenInNewTabHTML
const oldPrintHtml = `<div contenteditable="true" style="font-weight:bold; border-bottom:1px solid #ccc; margin-bottom:2px; padding-bottom:1px;">\${r.hazard}</div>
           <div contenteditable="true" style="font-style:italic; color:#444;">\${r.risk}</div>`;

const newPrintHtml = `<div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black; padding: 3px;">\${r.hazard}</div>
           <div contenteditable="true" style="font-style:italic; color:#444; padding: 3px;">\${r.risk}</div>`;

for (const f of filesToPatch) {
  if (!fs.existsSync(f)) {
    console.log('Skipping non-existent:', f);
    continue;
  }
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  // 1. WebReportEditor
  if (c.includes(oldWebHazard)) {
    c = c.replace(oldWebHazard, newWebHazard);
    // Also ensure td has p-0
    c = c.replace(
      '<td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>\n                            <ReportTextCell\n                              cellKey={`web-hazard',
      '<td className="border border-black p-0 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign, padding: 0 }}>\n                            <ReportTextCell\n                              cellKey={`web-hazard'
    );
    changed = true;
    console.log(f, '-> WebReportEditor patched');
  }

  // 2. SahaZiyaretEditor
  if (c.includes(oldSahaDesc)) {
    c = c.replace(oldSahaDesc, newSahaDesc);
    changed = true;
    console.log(f, '-> SahaZiyaretEditor patched');
  }

  // 3. getOpenInNewTabHTML
  if (c.includes(oldPrintHtml)) {
    c = c.replace(oldPrintHtml, newPrintHtml);
    c = c.replace(
      '<td style="vertical-align: top; padding: 3px;">\n           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black; padding: 3px;">',
      '<td style="vertical-align: top; padding: 0;">\n           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black; padding: 3px;">'
    );
    changed = true;
    console.log(f, '-> getOpenInNewTabHTML patched');
  }

  if (changed) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('SAVED:', f);
  } else {
    console.log('No matching targets (already updated or different):', f);
  }
}
