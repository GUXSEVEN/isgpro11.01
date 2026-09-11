const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('panel-dist/index.html', 'utf8');
const matches = [...html.matchAll(/assets\/([^"'\s>]+)/g)].map(m => m[1]);
const keep = new Set([
  ...matches,
  'logo-CUsry-VN.png',
  'web-Cjs5DNsr.js',
  'web-CbtPdQe5.js',
  'web-DGjFbboX.js'
]);

console.log('Keeping files:', [...keep]);
const dir = 'panel-dist/assets';
fs.readdirSync(dir).forEach(f => {
  if (!keep.has(f)) {
    fs.unlinkSync(path.join(dir, f));
    console.log('Removed stale asset:', f);
  }
});
