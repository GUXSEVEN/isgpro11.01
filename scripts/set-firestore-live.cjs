const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49Ah-yas5jGV3oz0Dg_09-u7tqDcv33o",
  authDomain: "isg-kutuphane.firebaseapp.com",
  projectId: "isg-kutuphane",
  storageBucket: "isg-kutuphane.firebasestorage.app",
  messagingSenderId: "334519488560",
  appId: "1:334519488560:web:957dee0895a553a5691df5",
  measurementId: "G-LVEMR1R6PZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setLiveMode() {
  try {
    const docRef = doc(db, 'settings', 'paytr');
    await setDoc(docRef, {
      testMode: '0',
      test_mode: 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const updatedSnap = await getDoc(docRef);
    console.log('✔ Firestore PayTR canlı mod güncellendi:', {
      testMode: updatedSnap.data().testMode,
      test_mode: updatedSnap.data().test_mode
    });
    process.exit(0);
  } catch (err) {
    console.error('Firestore güncelleme hatası:', err);
    process.exit(1);
  }
}

setLiveMode();
