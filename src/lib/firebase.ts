import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const defaultFirebaseConfig = {
  apiKey: "AIzaSyB49Ah-yas5jGV3oz0Dg_09-u7tqDcv33o",
  authDomain: "isg-kutuphane.firebaseapp.com",
  projectId: "isg-kutuphane",
  storageBucket: "isg-kutuphane.firebasestorage.app",
  messagingSenderId: "334519488560",
  appId: "1:334519488560:web:957dee0895a553a5691df5",
  measurementId: "G-LVEMR1R6PZ"
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(defaultFirebaseConfig) : getApp();
} catch (error) {
  console.warn("Firebase app could not be initialized:", error);
}

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export default app;
