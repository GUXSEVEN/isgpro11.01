#!/usr/bin/env node
/**
 * İSG Lisans & Veritabanı Konsol Yönetim Aracı
 * Kullanım:
 *   node cli-yonetici.js uret [trial|monthly|yearly|demo] [email]
 *   node cli-yonetici.js dogrula <LISANS_KODU>
 */

const fs = require('fs');

function generateLicenseKey(type = 'yearly') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randSeg = (len = 4) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const tsBase36 = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  let prefix = 'ISG-Y';
  if (type === 'monthly') prefix = 'ISG-M';
  else if (type === 'trial') prefix = 'ISG-T';
  else if (type === 'demo') prefix = 'ISG-D';
  return `${prefix}-${tsBase36}-${randSeg(4)}-${randSeg(4)}`;
}

function getLicenseType(key) {
  if (!key) return 'bilinmiyor';
  const clean = key.toUpperCase();
  if (clean.startsWith('ISG-T')) return '7 Günlük Deneme (trial)';
  if (clean.startsWith('ISG-M')) return 'Aylık Pro Plan (monthly)';
  if (clean.startsWith('ISG-Y')) return 'Yıllık Pro Plan (yearly)';
  if (clean.startsWith('ISG-D')) return '10 Dk Demo Test (demo)';
  return 'Özel / Diğer';
}

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'yardim';

if (command === 'uret') {
  const type = args[1] || 'yearly';
  const email = args[2] || 'Atanmamis';
  const key = generateLicenseKey(type);
  console.log('\n=== YENİ LİSANS ÜRETİLDİ ===');
  console.log('Lisans Kodu :', key);
  console.log('Plan Türü   :', type.toUpperCase(), '->', getLicenseType(key));
  console.log('Atanan Hesap:', email);
  console.log('Üretilme    :', new Date().toLocaleString('tr-TR'));
  console.log('=============================\n');
} else if (command === 'dogrula') {
  const key = args[1];
  if (!key) {
    console.error('Lütfen lisans kodunu belirtiniz. Örn: node cli-yonetici.js dogrula ISG-T-XXXX-XXXX-XXXX');
    process.exit(1);
  }
  console.log('\n=== LİSANS ANALİZİ ===');
  console.log('Kod         :', key.trim().toUpperCase());
  console.log('Algılanan Tür:', getLicenseType(key));
  console.log('======================\n');
} else {
  console.log(`
=== İSG ORTAK VERİTABANI YÖNETİCİSİ ===
Kullanım:
  node cli-yonetici.js uret trial              -> 7 Günlük Deneme Lisansı Üretir
  node cli-yonetici.js uret monthly            -> Aylık Lisans Üretir
  node cli-yonetici.js uret yearly             -> Yıllık Lisans Üretir
  node cli-yonetici.js dogrula <LISANS_KODU>   -> Lisans Kodunun Türünü Analiz Eder
`);
}
