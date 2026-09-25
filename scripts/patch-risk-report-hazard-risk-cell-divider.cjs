const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';

if (!fs.existsSync(targetFile)) {
  console.error('Target file does not exist:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. WebReportEditor Cell
const target1 = `                          <td className="border border-black p-1 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>
                            <ReportTextCell
                              cellKey={\`web-hazard-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              <div className="font-bold mb-0.5 border-b border-slate-200 pb-0.5">{r.hazard}</div>
                              <div className="italic text-slate-600">{r.risk}</div>
                            </ReportTextCell>
                          </td>`;

const replace1 = `                          <td className="border border-black p-0 font-normal" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign, padding: 0 }}>
                            <ReportTextCell
                              cellKey={\`web-hazard-\${r.id || itemNumber}\`}
                              defaultFontSize={reportFontSize}
                              customStyles={cellCustomStyles}
                              onUpdateCustomStyle={onUpdateCellStyle}
                              style={{ textAlign: cellTAlign }}
                            >
                              <div className="font-bold p-1 border-b border-black" style={{ borderBottom: '1px solid black' }}>{r.hazard}</div>
                              <div className="italic text-slate-700 p-1">{r.risk}</div>
                            </ReportTextCell>
                          </td>`;

// 2. getOpenInNewTabHTML Cell
const target2 = `        <td style="vertical-align: top; padding: 3px;">
           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid #ccc; margin-bottom:2px; padding-bottom:1px;">\${r.hazard}</div>
           <div contenteditable="true" style="font-style:italic; color:#444;">\${r.risk}</div>
        </td>`;

const replace2 = `        <td style="vertical-align: top; padding: 0;">
           <div contenteditable="true" style="font-weight:bold; border-bottom:1px solid black; padding: 3px;">\${r.hazard}</div>
           <div contenteditable="true" style="font-style:italic; color:#444; padding: 3px;">\${r.risk}</div>
        </td>`;

// 3. React-PDF (RiskReportDocument) Cell
const target3 = `                    <View style={{ ...pdfStyles.cell, width: \`\${w.hazard}%\` }}>
                      <Text style={{ ...pdfStyles.cellText, fontFamily: 'RobotoBold', fontSize: getPdfDynamicFontSize(r.hazard, 6) }}>{r.hazard}</Text>
                      <Text style={{ ...pdfStyles.cellText, color: '#4B5563', marginTop: 1, fontSize: getPdfDynamicFontSize(r.risk, 6) }}>{r.risk}</Text>
                    </View>`;

const replace3 = `                    <View style={{ ...pdfStyles.cell, width: \`\${w.hazard}%\`, padding: 0 }}>
                      <View style={{ borderBottomWidth: 1, borderColor: '#000000', padding: 2.5 }}>
                        <Text style={{ ...pdfStyles.cellText, fontFamily: 'RobotoBold', fontSize: getPdfDynamicFontSize(r.hazard, 6) }}>{r.hazard}</Text>
                      </View>
                      <View style={{ padding: 2.5 }}>
                        <Text style={{ ...pdfStyles.cellText, color: '#4B5563', fontSize: getPdfDynamicFontSize(r.risk, 6) }}>{r.risk}</Text>
                      </View>
                    </View>`;

console.log('Checking Target 1 in App.jsx...');
if (!content.includes(target1)) {
  console.error('ERROR: Target 1 not found in App.jsx!');
} else {
  content = content.replace(target1, replace1);
  console.log('SUCCESS: Target 1 replaced.');
}

console.log('Checking Target 2 in App.jsx...');
if (!content.includes(target2)) {
  console.error('ERROR: Target 2 not found in App.jsx!');
} else {
  content = content.replace(target2, replace2);
  console.log('SUCCESS: Target 2 replaced.');
}

console.log('Checking Target 3 in App.jsx...');
if (!content.includes(target3)) {
  console.error('ERROR: Target 3 not found in App.jsx!');
} else {
  content = content.replace(target3, replace3);
  console.log('SUCCESS: Target 3 replaced.');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('App.jsx successfully patched and saved.');
