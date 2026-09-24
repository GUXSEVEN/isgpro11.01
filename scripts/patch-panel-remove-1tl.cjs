const fs = require('fs');
const path = require('path');

console.log('>>> 1 TL Test modunu kaldırma ve Canlı Mod (0) ayarlama işlemi başlatılıyor...');

// 1. isg-projesi - mobile\src\App.jsx
const mobileAppJsx = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
if (fs.existsSync(mobileAppJsx)) {
  let content = fs.readFileSync(mobileAppJsx, 'utf8');

  // Change testMode: '1' to testMode: '0' in auto-sync useEffect
  if (content.includes("testMode: '1'")) {
    content = content.replace("testMode: '1'", "testMode: '0'");
    console.log('✔ isg-projesi - mobile: testMode: 1 -> testMode: 0 yapıldı.');
  }

  // Remove 1 TL card and change grid-cols-3 to grid-cols-2
  const oldGrid = '<div className="grid grid-cols-1 md:grid-cols-3 gap-4">';
  const newGrid = '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">';
  if (content.includes(oldGrid)) {
    content = content.replace(oldGrid, newGrid);
    console.log('✔ isg-projesi - mobile: Grid 2 kolona ayarlandı.');
  }

  // Remove the 1 TL Card block
  const oldCardStart = '{/* --- GEÇİCİ 1 TL TEST PAKETİ KARTI (SONRADAN KALDIRILACAK) --- */}';
  const oldCardEnd = '{/* AYLIK LİSANS SEÇİM KARTI */}';
  if (content.includes(oldCardStart) && content.includes(oldCardEnd)) {
    const startIndex = content.indexOf(oldCardStart);
    const endIndex = content.indexOf(oldCardEnd);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      content = content.substring(0, startIndex) + content.substring(endIndex);
      console.log('✔ isg-projesi - mobile: 1 TL Test Paketi kartı JSX üzerinden kaldırıldı.');
    }
  }

  // Clean planPrice, planLabel, rawPrice
  content = content.replace(
    "const planPrice = isMultipleOsgb ? '₺1.990' : (selectedPlan === 'test' ? '₺1' : (selectedPlan === 'yearly' ? '₺2.990' : '₺299'));",
    "const planPrice = isMultipleOsgb ? '₺1.990' : (selectedPlan === 'yearly' ? '₺2.990' : '₺299');"
  );

  content = content.replace(
    "const planLabel = isMultipleOsgb ? ' / tek seferlik' : (selectedPlan === 'test' ? ' / test' : (selectedPlan === 'yearly' ? ' / yıl' : ' / ay'));",
    "const planLabel = isMultipleOsgb ? ' / tek seferlik' : (selectedPlan === 'yearly' ? ' / yıl' : ' / ay');"
  );

  content = content.replace(
    "const rawPrice = isMultipleOsgb ? '1990.00' : (selectedPlan === 'test' ? '1.00' : (selectedPlan === 'yearly' ? '2990.00' : '299.00'));",
    "const rawPrice = isMultipleOsgb ? '1990.00' : (selectedPlan === 'yearly' ? '2990.00' : '299.00');"
  );

  fs.writeFileSync(mobileAppJsx, content, 'utf8');
  console.log('✔ isg-projesi - mobile/src/App.jsx başarıyla kaydedildi.');
}

// 2. isg-projesi - mobile\src\shared-db\licenseEngine.ts
const mobileLicenseEngine = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\shared-db\\licenseEngine.ts';
const localLicenseEngine = path.join(__dirname, '..', 'src', 'shared-db', 'licenseEngine.ts');
if (fs.existsSync(mobileLicenseEngine) && fs.existsSync(localLicenseEngine)) {
  fs.copyFileSync(localLicenseEngine, mobileLicenseEngine);
  console.log('✔ isg-projesi - mobile/src/shared-db/licenseEngine.ts senkronize edildi.');
}

// 3. Other backup files in Desktop with testMode: '1'
const otherFiles = [
  'C:\\Users\\İBRAHİM\\Desktop\\APP dosyaları\\App.jsx',
  'C:\\Users\\İBRAHİM\\Desktop\\APP dosyaları\\App2.jsx'
];
for (const f of otherFiles) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes("testMode: '1'")) {
      c = c.replaceAll("testMode: '1'", "testMode: '0'");
      fs.writeFileSync(f, c, 'utf8');
      console.log(`✔ Canlı mod güncellendi: ${f}`);
    }
  }
}

console.log('>>> Tamamlandı.');
