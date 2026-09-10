/**
 * İSG Ortak Veritabanı (Firebase & Firestore) Yapılandırması
 * Hem isgpro11.01-main hem de isg-projesi - Copy bu yapılandırmayı kullanır.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyB49Ah-yas5jGV3oz0Dg_09-u7tqDcv33o",
  authDomain: "isg-kutuphane.firebaseapp.com",
  projectId: "isg-kutuphane",
  storageBucket: "isg-kutuphane.firebasestorage.app",
  messagingSenderId: "334519488560",
  appId: "1:334519488560:web:957dee0895a553a5691df5",
  measurementId: "G-LVEMR1R6PZ"
};

let appInstance = null;
try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn('[Firebase Ortak Bağlantı Hatası]:', error);
}

export const app = appInstance;
export const db = appInstance ? getFirestore(appInstance) : null;
export default appInstance;
