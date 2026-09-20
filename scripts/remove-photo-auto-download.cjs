const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Backup
fs.writeFileSync(targetFile + '.bak_photo_download', content, 'utf8');
console.log('Backup created successfully.');

const targetBlock = `      // 2. Galeriye Kaydet (Cihaza İndirme)
      try {
        const link = document.createElement('a');
        link.href = objectUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = \`Risk_Foto_\${timestamp}.jpg\`;
        document.body.appendChild(link);
        link.click(); // İndirmeyi tetikle
        document.body.removeChild(link);
      } catch (err) {
        console.log("Galeriye kaydetme hatası:", err);
      }`;

if (!content.includes(targetBlock)) {
  console.error('Target block not found in App.jsx!');
  process.exit(1);
}

content = content.replace(targetBlock, `      // Fotoğraf cihazdan/tarayıcıdan yüklendiğinde tekrar cihaza indirilmesi engellendi.`);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully removed automatic photo download from App.jsx!');
