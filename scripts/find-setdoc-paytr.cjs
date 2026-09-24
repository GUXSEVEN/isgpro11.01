const fs = require('fs');
const path = require('path');

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      search(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes('settings') && c.includes('paytr') && c.includes('setDoc')) {
          console.log('MATCH:', full);
          const lines = c.split('\n');
          lines.forEach((l, i) => {
            if (l.includes('setDoc') && (l.includes('paytr') || l.includes('docRef'))) {
              console.log(`  Line ${i+1}: ${l.trim().substring(0, 100)}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

search('C:/Users/İBRAHİM/Desktop');
