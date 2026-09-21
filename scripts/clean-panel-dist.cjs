const fs = require('fs');
const path = require('path');

function cleanDir(baseDir) {
  const htmlPath = path.join(baseDir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, 'utf8');
  const matches = [...html.matchAll(/assets\/([^"'\s>]+)/g)].map(m => m[1]);

  const assetsDir = path.join(baseDir, 'assets');
  if (!fs.existsSync(assetsDir)) return;

  // Keep all files referenced in index.html, logo, and active web-* chunks from the latest build
  const activeAssets = new Set(matches);
  activeAssets.add('logo-CUsry-VN.png');
  activeAssets.add('web-C5PZxmv4.js');
  activeAssets.add('web-Db5C98Lv.js');
  activeAssets.add('web-CxPz_WoQ.js');

  fs.readdirSync(assetsDir).forEach(f => {
    if (f.startsWith('index-') && !activeAssets.has(f)) {
      try {
        fs.unlinkSync(path.join(assetsDir, f));
        console.log(`[${baseDir}] Removed stale asset:`, f);
      } catch (e) {}
    }
  });
}

cleanDir('panel-dist');
cleanDir('dist/panel');
console.log('>>> Stale bundles cleaned successfully.');
