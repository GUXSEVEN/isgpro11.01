const fs = require('fs');
const path = require('path');

const candidateDirs = [
  'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile',
  'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy'
];
const isgProjesiDir = candidateDirs.find(d => fs.existsSync(d)) || candidateDirs[0];
const appJsxPath = path.join(isgProjesiDir, 'src', 'App.jsx');

console.log('Target App.jsx path:', appJsxPath);
let raw = fs.readFileSync(appJsxPath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

console.log('App.jsx initial character length:', content.length);

// 1. Remove the legacy duplicate PayTR useEffect that was hijacking sessions to admin
const legacyStart = "  // Handle top-level PayTR redirection query parameters\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    if (!currentUser) return;";
const legacyEnd = "  }, [db, currentUser]);";

const startIdx = content.indexOf(legacyStart);
if (startIdx !== -1) {
  const endIdx = content.indexOf(legacyEnd, startIdx);
  if (endIdx !== -1) {
    const fullBlock = content.slice(startIdx, endIdx + legacyEnd.length);
    content = content.replace(fullBlock, "  // [Legacy PayTR handler removed to prevent hijacking - unified handler below handles PayTR redirects with strict user isolation]");
    console.log('✓ Successfully removed legacy duplicate PayTR useEffect!');
  } else {
    console.warn('⚠️ Could not find legacyEnd');
  }
} else {
  console.warn('⚠️ Could not find legacyStart');
}

// 2. Enhance unified PayTR handler
const oldUnified = `  // PayTR Yönlendirme Kontrolü (URL Query Params Check - Kullanıcıyı Doğrudan Anasayfaya Zorlar)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('paytr_status') === 'success' || urlParams.get('payment') === 'success') {
        const selectedPlanFromUrl = urlParams.get('plan') || 'yearly';
        const licenseKey = urlParams.get('license') || urlParams.get('key') || urlParams.get('oid') || generateLicenseKey(selectedPlanFromUrl);
        const urlUsername = urlParams.get('username') || null;
        handleCheckoutSuccess(licenseKey, selectedPlanFromUrl, urlUsername);
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
      }
    } catch(e) {
      console.error("PayTR URL parse error:", e);
    }
  }, []);`;

const newUnified = `  // PayTR Yönlendirme Kontrolü (URL Query Params Check - Kullanıcıyı Kendi Hesabına ve Ana Sayfaya Yönlendirir)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get('paytr_status') === 'success' || 
                        urlParams.get('payment') === 'success' || 
                        urlParams.get('paytr_success') === 'true' || 
                        urlParams.get('payment_success') === 'true';
      const isFail = urlParams.get('paytr_status') === 'failed' || 
                     urlParams.get('payment') === 'failed' || 
                     urlParams.get('payment_fail') === 'true';

      if (isSuccess) {
        const selectedPlanFromUrl = urlParams.get('plan') || 'yearly';
        const licenseKey = urlParams.get('license') || urlParams.get('key') || urlParams.get('oid') || generateLicenseKey(selectedPlanFromUrl);
        const urlUsername = urlParams.get('username') || null;
        handleCheckoutSuccess(licenseKey, selectedPlanFromUrl, urlUsername);
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
      } else if (isFail) {
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
        alert('Ödeme işlemi onaylanmadı veya iptal edildi. Lütfen tekrar deneyiniz.');
        setActiveView('main');
      }
    } catch(e) {
      console.error("PayTR URL parse error:", e);
    }
  }, []);`;

if (content.includes(oldUnified)) {
  content = content.replace(oldUnified, newUnified);
  console.log('✓ Successfully updated unified PayTR handler!');
} else {
  console.warn('⚠️ Could not match oldUnified');
}

// 3. Make sure handleCheckoutSuccess updates all session storages and never defaults to admin
const oldHandleCheckoutSearch = `      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(updatedUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(updatedUser)));
      } catch (e) {}`;

const newHandleCheckoutReplace = `      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('currentUser', JSON.stringify(encryptUser(updatedUser)));
        localStorage.setItem('user', JSON.stringify(encryptUser(updatedUser)));
        localStorage.setItem('isg_landing_current_user_v1', JSON.stringify(updatedUser));
        localStorage.setItem('isg_active_user', JSON.stringify(updatedUser));
      } catch (e) {}`;

if (content.includes(oldHandleCheckoutSearch)) {
  content = content.replace(oldHandleCheckoutSearch, newHandleCheckoutReplace);
  console.log('✓ Successfully synced session storage in handleCheckoutSuccess!');
}

// 4. Add ibrahim to INITIAL_USERS if not present
const adminUserStr = '{ username: "admin", password: encryptData(getObfuscatedSecret(\'cGFzc3dvcmQ=\'))';
const ibrahimRecord = `{ username: "ibrahim", password: encryptData(getObfuscatedSecret('MTQ3MzY5')), name: getObfuscatedSecret('aWJyYWhpbQ=='), email: getObfuscatedSecret('aWJyYWhpbWNvc2t1bi5ncy4xOTA1QGdtYWlsLmNvbQ=='), phone: '', role: 'uzman', isPremium: true },\n  `;

if (!content.includes('username: "ibrahim"')) {
  content = content.replace(adminUserStr, ibrahimRecord + adminUserStr);
  console.log('✓ Successfully added ibrahim to INITIAL_USERS!');
}

const finalOutput = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(appJsxPath, finalOutput, 'utf8');
console.log('App.jsx written! New character length:', finalOutput.length);
