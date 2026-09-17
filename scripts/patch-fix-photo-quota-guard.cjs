const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error("Target file does not exist:", targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Check if sanitizePhotoUrl already exists
if (!content.includes('const sanitizePhotoUrl =')) {
  const saveMarker = 'const saveCompanyToDB = async (company) => {';
  const saveIdx = content.indexOf(saveMarker);
  if (saveIdx === -1) {
    console.error("saveCompanyToDB marker not found!");
    process.exit(1);
  }

  const helperFunctions = `// Güvenli Fotoğraf URL Doğrulama ve Düzeltme (ERR_INVALID_URL ve kesilmiş Base64 koruması)
const sanitizePhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('data:image/')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return null;
    const header = trimmed.substring(0, commaIdx);
    let data = trimmed.substring(commaIdx + 1).replace(/\\s+/g, '');
    if (data.length < 50) return null;
    const rem = data.length % 4;
    if (rem === 1) {
      data = data.slice(0, -1);
    } else if (rem === 2) {
      data += '==';
    } else if (rem === 3) {
      data += '=';
    }
    return \`\${header},\${data}\`;
  }
  return null;
};

// Fotoğrafı Güvenli Canvas ile Yeniden Sıkıştırma (Kesme/substring yapmadan, RFC uyumlu tam JPEG çıktısı)
const compressBase64Image = (dataUrl, maxDim = 500, quality = 0.55) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(dataUrl);
    }
    const cleanUrl = sanitizePhotoUrl(dataUrl);
    if (!cleanUrl) return resolve(null);

    // Zaten 35KB'tan küçükse tekrar sıkıştırmaya gerek yok
    if (cleanUrl.length < 35000) return resolve(cleanUrl);

    let resolved = false;
    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    const timer = setTimeout(() => finish(cleanUrl), 1500);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      try {
        let w = img.width || 500;
        let h = img.height || 400;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(cleanUrl);
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        if (compressed && compressed.startsWith('data:image/jpeg') && compressed.length < cleanUrl.length) {
          finish(compressed);
        } else {
          finish(cleanUrl);
        }
      } catch (err) {
        finish(cleanUrl);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    img.src = cleanUrl;
  });
};

`;

  content = content.slice(0, saveIdx) + helperFunctions + content.slice(saveIdx);
  console.log("Added sanitizePhotoUrl and compressBase64Image helpers.");
}

// 2. Replace the faulty saveCompanyToDB implementation
const oldSaveRegex = /const saveCompanyToDB = async \(company\) => \{[\s\S]*?await setDoc\(doc\(db, 'companies', docId\), cleanCompany, \{ merge: true \}\);[\s\S]*?return true;\s*\} catch \(err\) \{[\s\S]*?return false;\s*\}\s*\};/;

const newSaveCode = `const saveCompanyToDB = async (company) => {
  if (!db || !company) return false;
  try {
    const docId = String(company.id || Date.now());
    let cleanCompany = cleanFirestoreData({ ...company, id: docId });

    // Firestore 1MB (1,048,576 byte) kotası koruması:
    // Doküman boyutu 850KB'ı aşıyorsa fotoğrafları canvas ile güvenli şekilde optimize et
    let strLen = JSON.stringify(cleanCompany).length;
    if (strLen > 850000 && cleanCompany.assessments && Array.isArray(cleanCompany.assessments) && typeof window !== 'undefined') {
      console.warn(\`[Firestore Quota Guard] Firma boyutu (\${strLen} byte) 1MB sınırına yaklaşıyor, fotoğraflar optimize ediliyor...\`);
      for (const ass of cleanCompany.assessments) {
        if (ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 35000) {
              r.beforePhoto = await compressBase64Image(r.beforePhoto, 450, 0.5);
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 35000) {
              r.afterPhoto = await compressBase64Image(r.afterPhoto, 450, 0.5);
            }
          }
        }
      }
    }

    await setDoc(doc(db, 'companies', docId), cleanCompany, { merge: true });
    console.log(\`Firma (\${company.name || docId}) buluta başarıyla yedeklendi.\`);
    return true;
  } catch (err) {
    console.error("Firma kaydetme hatası:", err);
    return false;
  }
};`;

if (oldSaveRegex.test(content)) {
  content = content.replace(oldSaveRegex, newSaveCode);
  console.log("Updated saveCompanyToDB with safe canvas compression and 850KB threshold.");
} else {
  console.warn("Could not match oldSaveRegex, searching for substring replacement...");
  const oldChunkStart = 'let strLen = JSON.stringify(cleanCompany).length;';
  const oldChunkEnd = 'await setDoc(doc(db, \'companies\', docId), cleanCompany, { merge: true });';
  const startIdx = content.indexOf(oldChunkStart);
  const endIdx = content.indexOf(oldChunkEnd);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const replacement = `let strLen = JSON.stringify(cleanCompany).length;
    if (strLen > 850000 && cleanCompany.assessments && Array.isArray(cleanCompany.assessments) && typeof window !== 'undefined') {
      console.warn(\`[Firestore Quota Guard] Firma boyutu (\${strLen} byte) 1MB sınırına yaklaşıyor, fotoğraflar optimize ediliyor...\`);
      for (const ass of cleanCompany.assessments) {
        if (ass.risks && Array.isArray(ass.risks)) {
          for (const r of ass.risks) {
            if (r.beforePhoto && typeof r.beforePhoto === 'string' && r.beforePhoto.length > 35000) {
              r.beforePhoto = await compressBase64Image(r.beforePhoto, 450, 0.5);
            }
            if (r.afterPhoto && typeof r.afterPhoto === 'string' && r.afterPhoto.length > 35000) {
              r.afterPhoto = await compressBase64Image(r.afterPhoto, 450, 0.5);
            }
          }
        }
      }
    }

    `;
    content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
    console.log("Replaced Quota Guard chunk successfully.");
  }
}

// 3. Update ReportPhotoCell to use sanitizePhotoUrl and handle onError
const targetCellStart = 'function ReportPhotoCell({\n  src,';
if (content.includes(targetCellStart)) {
  // Let's replace the ReportPhotoCell component body start
  const oldCellSignature = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = ''
}) {
  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;

  if (!src) {
    return <span className="text-gray-400 italic text-center text-[6px]">-</span>;
  }`;

  const newCellSignature = `function ReportPhotoCell({
  src,
  photoKey,
  defaultHeight = 80,
  defaultFit = 'contain',
  customStyles = {},
  onUpdateCustomStyle,
  label = 'Fotoğraf',
  className = ''
}) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = useMemo(() => sanitizePhotoUrl(src), [src]);

  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  const custom = customStyles?.[photoKey] || {};
  const currentHeight = custom.height !== undefined ? custom.height : defaultHeight;
  const currentFit = custom.fit !== undefined ? custom.fit : defaultFit;
  const currentRotate = custom.rotate !== undefined ? custom.rotate : 0;

  if (!cleanSrc || hasError) {
    return <span className="text-gray-400 italic text-center text-[6px]">-</span>;
  }`;

  if (content.includes(oldCellSignature)) {
    content = content.replace(oldCellSignature, newCellSignature);
    console.log("Updated ReportPhotoCell signature & error handling.");
  }

  // Also update <img in ReportPhotoCell to use cleanSrc and onError
  content = content.replace(
    `<img\n        src={src}\n        alt={label}\n        style={{`,
    `<img\n        src={cleanSrc}\n        alt={label}\n        onError={() => setHasError(true)}\n        style={{`
  );
  console.log("Updated ReportPhotoCell img tag.");
}

// 4. Update direct <img src={risk.beforePhoto} /> and afterPhoto in summary view
content = content.replace(
  `{risk.beforePhoto && <img src={risk.beforePhoto} className="w-10 h-10 object-cover rounded border border-red-200" title="Mevcut" />}`,
  `{sanitizePhotoUrl(risk.beforePhoto) && <img src={sanitizePhotoUrl(risk.beforePhoto)} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-10 h-10 object-cover rounded border border-red-200" title="Mevcut" />}`
);
content = content.replace(
  `{risk.afterPhoto && <img src={risk.afterPhoto} className="w-10 h-10 object-cover rounded border border-green-200" title="DÖF Sonrası" />}`,
  `{sanitizePhotoUrl(risk.afterPhoto) && <img src={sanitizePhotoUrl(risk.afterPhoto)} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-10 h-10 object-cover rounded border border-green-200" title="DÖF Sonrası" />}`
);

// 5. Update form.beforePhoto and form.afterPhoto preview in risk modal
content = content.replace(
  `<img src={form.beforePhoto} className="w-full h-full object-cover" />`,
  `<img src={sanitizePhotoUrl(form.beforePhoto) || form.beforePhoto} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />`
);
content = content.replace(
  `<img src={form.afterPhoto} className="w-full h-full object-cover" />`,
  `<img src={sanitizePhotoUrl(form.afterPhoto) || form.afterPhoto} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />`
);

// 6. Update PDFImage export
content = content.replace(
  `{r.beforePhoto ? <PDFImage src={r.beforePhoto} style={{ width: 40, height: 30, alignSelf: 'center', marginBottom: 2 }} /> : null}`,
  `{sanitizePhotoUrl(r.beforePhoto) ? <PDFImage src={sanitizePhotoUrl(r.beforePhoto)} style={{ width: 40, height: 30, alignSelf: 'center', marginBottom: 2 }} /> : null}`
);
content = content.replace(
  `{r.afterPhoto ? <PDFImage src={r.afterPhoto} style={{ width: 40, height: 30 }} /> : <Text style={{ fontSize: 5, color: '#999' }}>-</Text>}`,
  `{sanitizePhotoUrl(r.afterPhoto) ? <PDFImage src={sanitizePhotoUrl(r.afterPhoto)} style={{ width: 40, height: 30 }} /> : <Text style={{ fontSize: 5, color: '#999' }}>-</Text>}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully patched isg-projesi - Copy/src/App.jsx!");

// Also update patch-image-ai-and-storage.cjs so future runs don't re-introduce substring
const patchScript = path.join(__dirname, 'patch-image-ai-and-storage.cjs');
if (fs.existsSync(patchScript)) {
  let patchContent = fs.readFileSync(patchScript, 'utf8');
  if (patchContent.includes('nr.beforePhoto.substring(0, 30000)')) {
    patchContent = patchContent.replace(
      /if \(strLen > 700000[\s\S]*?cleanCompany\.assessments = cleanCompany\.assessments\.map[\s\S]*?\}\)\);\s*\}/,
      `// Firestore 1MB kotası - Asla substring ile kesme yapılmaz, görsel bozulması engellenir`
    );
    fs.writeFileSync(patchScript, patchContent, 'utf8');
    console.log("Updated patch-image-ai-and-storage.cjs to remove substring bug.");
  }
}
