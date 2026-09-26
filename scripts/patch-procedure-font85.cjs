const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. In ProcedurePreview default props and font calculations:
const oldProcHeader = "const ProcedurePreview = ({\n  company,\n  assessment,\n  reportFontSize = '8pt',";
const newProcHeader = "const ProcedurePreview = ({\n  company,\n  assessment,\n  reportFontSize = '8.5pt',";

if (content.includes(oldProcHeader)) {
  content = content.replace(oldProcHeader, newProcHeader);
  console.log('Updated ProcedurePreview default prop to 8.5pt');
}

// 2. In ProcedurePreview fontScale and font definitions:
const oldFontCalc = "  const fontPt = parseFloat(reportFontSize) || 8;\n  const fontScale = fontPt / 8;\n  const lineHeightVal = parseFloat(reportLineHeight) || 1.2;\n  const padMm = parseFloat(reportPadding) || 8;\n\n  const titleFont = `calc(${9.5 * fontScale}pt)`;\n  const subTitleFont = `calc(${9 * fontScale}pt)`;\n  const bodyFont = `calc(${8 * fontScale}pt)`;\n  const smallFont = `calc(${7.5 * fontScale}pt)`;\n  const tinyFont = `calc(${7 * fontScale}pt)`;";

const newFontCalc = "  const fontPt = parseFloat(reportFontSize) || 8.5;\n  const fontScale = fontPt / 8.5;\n  const lineHeightVal = parseFloat(reportLineHeight) || 1.2;\n  const padMm = parseFloat(reportPadding) || 8;\n\n  const titleFont = `calc(${10 * fontScale}pt)`;\n  const subTitleFont = `calc(${9.5 * fontScale}pt)`;\n  const bodyFont = `calc(${8.5 * fontScale}pt)`;\n  const smallFont = `calc(${8 * fontScale}pt)`;\n  const tinyFont = `calc(${7.5 * fontScale}pt)`;";

if (content.includes(oldFontCalc)) {
  content = content.replace(oldFontCalc, newFontCalc);
  console.log('Updated ProcedurePreview font calculations based on 8.5pt');
}

// 3. In AdvancedReportModal, add useEffect for reportType === 'prosedur'
const targetHook = "  useEffect(() => {\n    if (fitA4) {";
const replacementHook = "  useEffect(() => {\n    if (reportType === 'prosedur') {\n      setReportFontSize('8.5pt');\n    }\n  }, [reportType, setReportFontSize]);\n\n  useEffect(() => {\n    if (fitA4) {";

if (content.includes(targetHook) && !content.includes("if (reportType === 'prosedur') {\n      setReportFontSize('8.5pt');")) {
  content = content.replace(targetHook, replacementHook);
  console.log('Added useEffect to set reportFontSize to 8.5pt on prosedur tab');
}

// 4. Update tab button onClick for prosedur
const oldTabButton = "onClick={() => setReportType('prosedur')}";
const newTabButton = "onClick={() => { setReportType('prosedur'); setReportFontSize('8.5pt'); }}";

if (content.includes(oldTabButton)) {
  content = content.replace(oldTabButton, newTabButton);
  console.log('Updated prosedur tab button onClick');
}

// 5. In ProcedurePreview call, ensure reportFontSize || '8.5pt'
const oldCallProps = "reportFontSize={reportFontSize}";
const newCallProps = "reportFontSize={reportFontSize || '8.5pt'}";

if (content.includes(oldCallProps)) {
  content = content.replace(oldCallProps, newCallProps);
  console.log('Updated ProcedurePreview call props');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully set procedure default font size to 8.5pt across all analysis methods!');
