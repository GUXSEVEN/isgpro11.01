const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// 1. Update Firestore settings/paytr
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

async function run() {
  console.log('[1/4] Updating Firestore settings/paytr to permanent LIVE mode (0)...');
  const paytrDocRef = doc(db, 'settings', 'paytr');
  await setDoc(paytrDocRef, {
    merchantId: encryptData('731185'),
    merchantKey: encryptData('LsLJ5UYjU2WgssBj'),
    merchantSalt: encryptData('Q5C8aTGXa26HMnhx'),
    merchant_id: '731185',
    merchant_key: 'LsLJ5UYjU2WgssBj',
    merchant_salt: 'Q5C8aTGXa26HMnhx',
    testMode: '0',
    test_mode: 0,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  const snap = await getDoc(paytrDocRef);
  console.log('✔ Firestore settings/paytr updated:', {
    merchant_id: snap.data().merchant_id,
    testMode: snap.data().testMode,
    test_mode: snap.data().test_mode
  });

  // 2. Patch file targets across desktop
  console.log('[2/4] Patching all companion servers and client files to Live mode (0)...');
  const filePatches = [
    {
      file: 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/utils/securityUtils.js',
      replacements: [
        ["PAYTR_TEST_MODE: '1'", "PAYTR_TEST_MODE: '0'"]
      ]
    },
    {
      file: 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/utils/paytrModule.js',
      replacements: [
        ["test_mode = '1'", "test_mode = '0'"],
        ["[params.test_mode=1]", "[params.test_mode=0]"]
      ]
    },
    {
      file: 'C:/Users/İBRAHİM/Desktop/isg api/server.ts',
      replacements: [
        ["testMode: process.env.PAYTR_TEST_MODE || '1'", "testMode: process.env.PAYTR_TEST_MODE || '0'"],
        ["testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '1'", "testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '0'"],
        ["const test_mode = paytrConfig.testMode || '1'", "const test_mode = paytrConfig.testMode || '0'"],
        ["const test_mode = req.body.test_mode || req.body.testMode || '1'", "const test_mode = req.body.test_mode || req.body.testMode || '0'"]
      ]
    },
    {
      file: 'C:/Users/İBRAHİM/Desktop/isgpro11.01-main/server.ts',
      replacements: [
        ["testMode: process.env.PAYTR_TEST_MODE || '1'", "testMode: process.env.PAYTR_TEST_MODE || '0'"],
        ["testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '1'", "testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '0'"],
        ["const test_mode = paytrConfig.testMode || '1'", "const test_mode = paytrConfig.testMode || '0'"],
        ["const test_mode = req.body.test_mode || req.body.testMode || '1'", "const test_mode = req.body.test_mode || req.body.testMode || '0'"]
      ]
    },
    {
      file: 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/server.ts',
      replacements: [
        ["testMode: process.env.PAYTR_TEST_MODE || '1'", "testMode: process.env.PAYTR_TEST_MODE || '0'"],
        ["testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '1'", "testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '0'"],
        ["const test_mode = paytrConfig.testMode || '1'", "const test_mode = paytrConfig.testMode || '0'"]
      ]
    },
    {
      file: 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/server/server.ts',
      replacements: [
        ["testMode: process.env.PAYTR_TEST_MODE || '1'", "testMode: process.env.PAYTR_TEST_MODE || '0'"],
        ["testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '1'", "testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '0'"],
        ["const test_mode = paytrConfig.testMode || '1'", "const test_mode = paytrConfig.testMode || '0'"]
      ]
    }
  ];

  for (const item of filePatches) {
    if (fs.existsSync(item.file)) {
      let content = fs.readFileSync(item.file, 'utf8');
      let modified = false;
      for (const [target, rep] of item.replacements) {
        if (content.includes(target)) {
          content = content.replaceAll(target, rep);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(item.file, content, 'utf8');
        console.log(`✔ Patched: ${item.file}`);
      } else {
        console.log(`ℹ Already up-to-date: ${item.file}`);
      }
    } else {
      console.log(`- Not found: ${item.file}`);
    }
  }

  console.log('[3/4] Re-syncing panel-dist...');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error in sync script:', err);
  process.exit(1);
});
