const fs = require('fs');
const path = require('path');

const targetPhrase = ' Ödeme altyapısı simülasyondur, kartınızdan gerçek ücret alınmaz.';
const altPhrase1 = 'Ödeme altyapısı simülasyondur, kartınızdan gerçek ücret alınmaz.';
const altPhrase2 = 'Ödeme altyapısı simülasyondur, kartınızdan gerçek ücret alınmaz';

const filesToPatch = [
  'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\app\\App.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\app\\App-2.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\app\\App-3.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\app\\App-stabil en son srüüm.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\APP dosyaları\\App.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\APP dosyaları\\App-ekstra.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\APP dosyaları\\App2.jsx'
];

let totalPatched = 0;

for (const filePath of filesToPatch) {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      if (content.includes(targetPhrase)) {
        content = content.replaceAll(targetPhrase, '');
        modified = true;
      }
      if (content.includes(altPhrase1)) {
        content = content.replaceAll(altPhrase1, '');
        modified = true;
      }
      if (content.includes(altPhrase2)) {
        content = content.replaceAll(altPhrase2, '');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✔ Başarıyla güncellendi: ${filePath}`);
        totalPatched++;
      } else {
        console.log(`- İlgili metin bulunamadı veya zaten kaldırılmış: ${filePath}`);
      }
    } catch (err) {
      console.error(`Hata (${filePath}):`, err.message);
    }
  } else {
    console.log(`Dosya mevcut değil: ${filePath}`);
  }
}

console.log(`\nToplam ${totalPatched} dosya güncellendi.`);
