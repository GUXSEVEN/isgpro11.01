const fs = require('fs');
const path = require('path');

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.gradle' || ent.name === 'build' && dir.includes('android')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      search(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes('paytr') && c.includes('testMode')) {
          const lines = c.split('\n');
          lines.forEach((l, i) => {
            if (l.includes("testMode: '1'") || l.includes('testMode: "1"') || l.includes('test_mode: 1') || l.includes("testMode = '1'")) {
              console.log(`${full}:${i + 1}: ${l.trim()}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

console.log('Searching Desktop for testMode: 1...');
search('C:/Users/İBRAHİM/Desktop');
