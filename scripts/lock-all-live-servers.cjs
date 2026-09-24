const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// 1. Force update Firestore settings/paytr with adminExplicitTestMode: false
const firebaseConfig = {
  apiKey: 'AIzaSyB49Ah-yas5jGV3oz0Dg_09-u7tqDcv33o',
  authDomain: 'isg-kutuphane.firebaseapp.com',
  projectId: 'isg-kutuphane',
  storageBucket: 'isg-kutuphane.firebasestorage.app',
  messagingSenderId: '334519488560',
  appId: '1:334519488560:web:957dee0895a553a5691df5',
  measurementId: 'G-LVEMR1R6PZ'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PRIMARY_SECRET_SALT = 'ISGPRO_SECURE_VAULT_2026_KEY_#99';
const PRIMARY_PREFIX = 'ISGSEC:';

function encryptData(text) {
  if (!text) return '';
  const str = String(text);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ PRIMARY_SECRET_SALT.charCodeAt(i % PRIMARY_SECRET_SALT.length);
    result += String.fromCharCode(charCode);
  }
  const b64 = Buffer.from(unescape(encodeURIComponent(result)), 'binary').toString('base64');
  return `${PRIMARY_PREFIX}${b64}`;
}

async function main() {
  console.log('1. Setting Firestore settings/paytr to locked Live Mode with adminExplicitTestMode: false...');
  const paytrRef = doc(db, 'settings', 'paytr');
  await setDoc(paytrRef, {
    merchantId: encryptData('731185'),
    merchantKey: encryptData('LsLJ5UYjU2WgssBj'),
    merchantSalt: encryptData('Q5C8aTGXa26HMnhx'),
    merchant_id: '731185',
    merchant_key: 'LsLJ5UYjU2WgssBj',
    merchant_salt: 'Q5C8aTGXa26HMnhx',
    testMode: '0',
    test_mode: 0,
    adminExplicitTestMode: false,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  const snap = await getDoc(paytrRef);
  console.log('✔ Firestore settings/paytr locked:', snap.data());

  // 2. Patch other server.ts files so they also enforce adminExplicitTestMode logic
  const otherServers = [
    'C:/Users/İBRAHİM/Desktop/isgpro11.01-main/server.ts',
    'C:/Users/İBRAHİM/Desktop/isg api/server.ts',
    'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/server.ts',
    'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/server/server.ts'
  ];

  for (const sPath of otherServers) {
    if (!fs.existsSync(sPath)) continue;
    let code = fs.readFileSync(sPath, 'utf8');

    // Replace default testMode from '1' to '0'
    code = code.replace(/testMode:\s*process\.env\.PAYTR_TEST_MODE\s*\|\|\s*'1'/g, "testMode: process.env.PAYTR_TEST_MODE || '0'");
    code = code.replace(/const test_mode = paytrConfig\.testMode \|\| '1'/g, "const test_mode = paytrConfig.testMode || '0'");
    code = code.replace(/testMode:\s*'1'/g, "testMode: '0'");
    code = code.replace(/test_mode:\s*1/g, "test_mode: 0");

    fs.writeFileSync(sPath, code, 'utf8');
    console.log(`✔ Updated server file: ${sPath}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
