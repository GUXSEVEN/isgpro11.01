const fs = require('fs');

const targets = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx'
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    let content = fs.readFileSync(target, 'utf8');
    const beforeLen = content.length;
    
    // Remove auto-sync useEffect block
    const pattern = /\/\/ Auto-sync PayTR merchant settings to Firestore[\s\S]*?}, \[\]\);/g;
    content = content.replace(pattern, '// Auto-sync removed: PayTR credentials are managed exclusively by Admin');

    if (content.length !== beforeLen) {
      fs.writeFileSync(target, content, 'utf8');
      console.log(`✔ Removed auto-sync from: ${target}`);
    } else {
      console.log(`ℹ Pattern not found or already removed in: ${target}`);
    }
  }
}
