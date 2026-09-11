import fs from 'fs';
import path from 'path';

const isgProjesiDir = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy';
const appJsxPath = path.join(isgProjesiDir, 'src', 'App.jsx');

console.log('>>> Starting safe user-isolation patch for isg-projesi...');

let raw = fs.readFileSync(appJsxPath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');
const initialLineCount = content.split('\n').length;
console.log('App.jsx lines before patch:', initialLineCount);

function safeReplace(name, searchBlock, replaceBlock) {
  const normSearch = searchBlock.replace(/\r\n/g, '\n');
  const normReplace = replaceBlock.replace(/\r\n/g, '\n');
  
  if (!content.includes(normSearch)) {
    console.error(`❌ FAILED to find target block for: ${name}`);
    return false;
  }
  
  const parts = content.split(normSearch);
  if (parts.length > 2) {
    console.error(`❌ Target block found multiple times for: ${name}`);
    return false;
  }
  
  content = parts.join(normReplace);
  console.log(`✓ Successfully patched: ${name}`);
  return true;
}

// 1. currentUser useState (Do NOT read isg_landing_current_user_v1)
safeReplace(
  'Isolated panel currentUser initialization',
  `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum geri yükleme (Sayfa yenileme ve PayTR yönlendirmesinde oturumu korur, login ekranına düşmeyi engeller)
    try {
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('isg_landing_current_user_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const decUser = parsed ? decryptUser(parsed) : null;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Kullanıcı oturumu geri yüklenemedi:", e);
    }
    return null;
  });`,
  `  const [activeCompanyId, setActiveCompanyId] = useState(null);
  /** @type {any} */
  const [currentUser, setCurrentUser] = useState(() => {
    // Oturum geri yükleme (Tamamen panele özel, landing sayfası oturumundan bağımsız)
    try {
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const decUser = parsed ? decryptUser(parsed) : null;
        if (decUser && (decUser.username || decUser.email)) {
          return decUser;
        }
      }
    } catch (e) {
      console.warn("Kullanıcı oturumu geri yüklenemedi:", e);
    }
    return null;
  });`
);

// 2. startPayTRSession payload with explicit username
safeReplace(
  'startPayTRSession payload with active username',
  `    const targetUserEmail = (customerEmail || currentUser?.email || localStorage.getItem('isg_checkout_email') || '').trim() || 'infoisgpro@gmail.com';

    const requestPayload = {
      planId: selectedPlan,
      amount: rawPrice,
      name: cardName || currentUser?.name || currentUser?.username || 'Müşteri',
      email: targetUserEmail,
      phone: currentUser?.phone || '05555555555',
      address: 'KOCASİNAN MAH. EDİRNE/MERKEZ',
      userSignature: activeBuyerSig,
      customerSignature: activeBuyerSig,
      sellerSignature: activeSellerSig,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      fromPanel: true,
      returnUrl: '/panel/'
    };`,
  `    const activeUsername = currentUser?.username || '';
    const targetUserEmail = (customerEmail || currentUser?.email || localStorage.getItem('isg_checkout_email') || '').trim() || 'infoisgpro@gmail.com';

    if (activeUsername) {
      try {
        localStorage.setItem('isg_checkout_active_username', activeUsername);
        sessionStorage.setItem('isg_checkout_active_username', activeUsername);
      } catch (e) {}
    }

    const requestPayload = {
      planId: selectedPlan,
      amount: rawPrice,
      name: cardName || currentUser?.name || currentUser?.username || 'Müşteri',
      email: targetUserEmail,
      username: activeUsername,
      phone: currentUser?.phone || '05555555555',
      address: 'KOCASİNAN MAH. EDİRNE/MERKEZ',
      userSignature: activeBuyerSig,
      customerSignature: activeBuyerSig,
      sellerSignature: activeSellerSig,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      fromPanel: true,
      returnUrl: '/panel/'
    };`
);

// 3. triggerSuccess and handleMessage in CheckoutView
safeReplace(
  'triggerSuccess with explicit username parameter',
  `    const triggerSuccess = (licenseKey = null, activePlan = selectedPlan) => {
      if (successTriggered) return;
      successTriggered = true;

      const userName = cardName || currentUser?.name || currentUser?.username || 'Değerli İSG Pro Kullanıcısı';`,
  `    const triggerSuccess = (licenseKey = null, activePlan = selectedPlan, explicitUsername = null) => {
      if (successTriggered) return;
      successTriggered = true;

      const userName = cardName || currentUser?.name || currentUser?.username || 'Değerli İSG Pro Kullanıcısı';`
);

safeReplace(
  'onSuccess call in triggerSuccess',
  `      // Lisansı aktifleştir ve kullanıcının kendi arayüzündeki anasayfasına yönlendir
      onSuccess(licenseKey, activePlan);
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PAYTR_SUCCESS') {
        const incomingKey = event.data.licenseKey || null;
        const incomingPlan = event.data.planId || selectedPlan;
        triggerSuccess(incomingKey, incomingPlan);`,
  `      // Lisansı aktifleştir ve kullanıcının kendi arayüzündeki anasayfasına yönlendir
      onSuccess(licenseKey, activePlan, explicitUsername || currentUser?.username);
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PAYTR_SUCCESS') {
        const incomingKey = event.data.licenseKey || null;
        const incomingPlan = event.data.planId || selectedPlan;
        const incomingUsername = event.data.username || currentUser?.username || null;
        triggerSuccess(incomingKey, incomingPlan, incomingUsername);`
);

// 4. handleCheckoutSuccess strict targetUser preservation
safeReplace(
  'handleCheckoutSuccess strict targetUser preservation',
  `  const handleCheckoutSuccess = (licenseKey, plan) => {
    // Aktif oturum açmış kullanıcıyı bul ve şifresini çöz (Oturumu kaybetmesini veya '?' görünmesini engeller)
    let targetUser = currentUser;
    if (!targetUser || !targetUser.username) {
      try {
        const raw = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('isg_landing_current_user_v1');
        if (raw) {
          targetUser = decryptUser(JSON.parse(raw));
        }
      } catch (e) {}
    }

    if (!targetUser || !targetUser.username) {
      targetUser = { 
        username: 'kullanici', 
        name: 'İSG Kullanıcısı', 
        email: 'kullanici@isgpro.app',
        hasAcceptedLegalTerms: true,
        userSignature: 'APPROVED_AT_CHECKOUT'
      };
    }`,
  `  const handleCheckoutSuccess = (licenseKey, plan, explicitUsername = null) => {
    // 1. Ödeme yapan kullanıcıyı KESİNLİKLE tespit et:
    // Sıra: explicitUsername > sessionStorage > localStorage['isg_checkout_active_username'] > currentUser.username
    const targetUsername = explicitUsername || 
                           sessionStorage.getItem('isg_checkout_active_username') || 
                           localStorage.getItem('isg_checkout_active_username') || 
                           currentUser?.username;

    // Tek seferlik token temizliği
    try {
      sessionStorage.removeItem('isg_checkout_active_username');
      localStorage.removeItem('isg_checkout_active_username');
    } catch (e) {}

    let targetUser = null;
    if (targetUsername) {
      targetUser = users.find(u => cleanUsername(u.username) === cleanUsername(targetUsername));
    }

    if (!targetUser && currentUser && currentUser.username) {
      targetUser = currentUser;
    }

    if (!targetUser) {
      try {
        const raw = localStorage.getItem('currentUser') || localStorage.getItem('user');
        if (raw) {
          const dec = decryptUser(JSON.parse(raw));
          if (dec && dec.username) targetUser = dec;
        }
      } catch (e) {}
    }

    if (!targetUser || !targetUser.username) {
      targetUser = { 
        username: targetUsername || 'kullanici', 
        name: 'İSG Kullanıcısı', 
        email: 'kullanici@isgpro.app',
        hasAcceptedLegalTerms: true,
        userSignature: 'APPROVED_AT_CHECKOUT'
      };
    }`
);

// 5. PayTR URL check with username parameter pass-through
safeReplace(
  'PayTR URL Params Check with username parameter',
  `      if (isSuccess) {
        const selectedPlanFromUrl = urlParams.get('plan') || 'yearly';
        const licenseKey = urlParams.get('license') || urlParams.get('key') || urlParams.get('oid') || generateLicenseKey(selectedPlanFromUrl);
        handleCheckoutSuccess(licenseKey, selectedPlanFromUrl);
        setActiveView('main');
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
      }`,
  `      if (isSuccess) {
        const selectedPlanFromUrl = urlParams.get('plan') || 'yearly';
        const licenseKey = urlParams.get('license') || urlParams.get('key') || urlParams.get('oid') || generateLicenseKey(selectedPlanFromUrl);
        const urlUsername = urlParams.get('username') || null;
        handleCheckoutSuccess(licenseKey, selectedPlanFromUrl, urlUsername);
        setActiveView('main');
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
      }`
);

const finalLineCount = content.split('\n').length;
console.log('App.jsx lines after patch:', finalLineCount);

if (Math.abs(finalLineCount - initialLineCount) > 50) {
  console.error('❌ Unexpected line count difference! Aborting write.');
  process.exit(1);
}

const finalOutput = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(appJsxPath, finalOutput, 'utf8');
console.log('🎉 App.jsx successfully patched with strict user isolation!');
