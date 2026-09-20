const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('>>> FIXING openWebReport cleanedHTML MISSING DECLARATION <<<');

const oldCode = `const openWebReport = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const reportHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');`;

const newCode = `const openWebReport = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const rawHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');
  const cleanedHTML = rawHTML ? rawHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"') : '';`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✔ cleanedHTML declared in openWebReport');
} else {
  console.error('❌ Could not match oldCode in openWebReport');
}

// Wrap document.write in try/catch for rock-solid safety
const oldWrite = `  printWindow.document.write(html);
  printWindow.document.close();
};`;

const newWrite = `  try {
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error("Yazdırma penceresi yazma hatası:", err);
    alert("Rapor penceresi oluşturulurken hata: " + err.message);
  }
};`;

if (content.includes(oldWrite)) {
  content = content.replace(oldWrite, newWrite);
  console.log('✔ printWindow.document.write wrapped in try/catch');
} else {
  console.error('❌ Could not match oldWrite');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('>>> openWebReport BUG FIX COMPLETE <<<');
