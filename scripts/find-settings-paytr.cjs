const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) searchAll(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('settings') && c.includes('paytr')) {
        console.log('MATCH:', full);
      }
    }
  }
}

searchAll('C:/Users/İBRAHİM/Desktop/isgpro11.01-main - Kopya');
searchAll('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile');
searchAll('C:/Users/İBRAHİM/Desktop/APP dosyaları');
searchAll('C:/Users/İBRAHİM/Desktop/app');
searchAll('C:/Users/İBRAHİM/Desktop/isg api');
