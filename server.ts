/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { generateLicenseKey, registerGeneratedLicense, validateLicenseAgainstDb, requestTrialLicense, LicenseType } from './src/lib/licenseUtils';

function toLatin(str: string): string {
  if (!str) return '';
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

interface ContractPDFOptions {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  orderId: string;
  planName: string;
  price: string;
  approvalDate: string;
  customerSignature?: string; // base64 PNG data URL
  sellerSignature?: string;   // base64 PNG data URL
  sellerName?: string;
}

// In-memory cache for seller signature
let cachedSellerConfig = {
  name: 'İbrahim Coşkun',
  signature: ''
};

const signaturesByEmail: Record<string, string> = {};
let globalLatestCustomerSignature: string = '';

async function getSellerConfig() {
  try {
    const sellerSnap = await getDoc(doc(db, 'seller_signature', 'default'));
    if (sellerSnap.exists()) {
      const data = sellerSnap.data();
      if (data.name) cachedSellerConfig.name = data.name;
      if (data.signature) cachedSellerConfig.signature = data.signature;
    }
  } catch (err) {
    console.error('[Seller Signature] Error loading seller config from Firestore:', err);
  }
  return cachedSellerConfig;
}

function parseBase64Image(dataUrl?: string): Buffer | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  let trimmed = dataUrl.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('base64,')) {
      trimmed = trimmed.split('base64,')[1].trim();
    }
    if (trimmed.includes('%')) {
      try {
        trimmed = decodeURIComponent(trimmed);
        if (trimmed.includes('base64,')) {
          trimmed = trimmed.split('base64,')[1].trim();
        }
      } catch {}
    }
    // Replace any spaces that might have been converted from '+' during HTTP decoding
    trimmed = trimmed.replace(/ /g, '+');
    // Remove any unexpected invalid characters outside standard base64 alphabet
    trimmed = trimmed.replace(/[^A-Za-z0-9+/=]/g, '');

    if (trimmed.length > 50) {
      const buf = Buffer.from(trimmed, 'base64');
      if (buf && buf.length > 0) return buf;
    }
  } catch (err) {
    console.error('[PDF Image Parse Error]:', err);
  }
  return null;
}

async function generateSingleContractPDF(
  docType: 'mss' | 'onBilgilendirme' | 'iade' | 'privacy' | 'kvkk' | 'teslimat',
  options: ContractPDFOptions
): Promise<Buffer> {
  const sellerConfig = await getSellerConfig();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 35, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const name = toLatin(options.customerName || 'Degerli Musterimiz');
      const email = toLatin(options.customerEmail || '-');
      const phone = toLatin(options.customerPhone || '-');
      const address = toLatin(options.customerAddress || 'Dijital Teslimat (E-Posta / Web)');
      const orderId = toLatin(options.orderId || `ISG-${Date.now()}`);
      const planName = toLatin(options.planName || 'Pro Dijital Yazilim Lisansi');
      const price = toLatin(options.price || '2.990,00 TL');
      const approvalDate = toLatin(options.approvalDate || new Date().toLocaleString('tr-TR'));
      let docTitle = '';
      let docSubtitle = '';
      let bodyText = '';

      if (docType === 'mss') {
        docTitle = 'MESAFELI SATIS SOZLESMESI';
        docSubtitle = 'RESMI ONAYLI MESAFELI SATIS SOZLESMESI NUSHASI';
        bodyText = toLatin(
`MESAFELİ SATIŞ SÖZLEŞMESİ

1. TARAFLAR
İşbu Sözleşme, aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.

SATICI:
Adı/Soyadı/Unvanı: İBRAHİM COŞKUN (İSG Pro Teknolojileri)
E-posta: infoisgpro@gmail.com
Telefon: 0551 065 44 88
Adres: KOCASİNAN MAH. EDİRNE/ MERKEZ
(Sözleşmede bundan sonra "SATICI" olarak anılacaktır)

ALICI:
Adı/Soyadı: ${options.customerName || 'Değerli Müşterimiz'}
E-posta: ${options.customerEmail || '-'}
Telefon: ${options.customerPhone || '-'}
Adres: ${options.customerAddress || 'Dijital Teslimat (E-Posta / Web)'}
(Sözleşmede bundan sonra "ALICI" olarak anılacaktır)

2. SÖZLEŞMENİN KONUSU
İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı belirtilen "İSG Pro Premium" dijital yazılım lisansının satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.

3. SÖZLEŞME KONUSU ÜRÜN VE ÖDEME BİLGİLERİ
3.1. Ürün, İSG Pro Premium sürümüne erişim sağlayan bir dijital lisans anahtarı (lisans kodu) olup, ALICI'ya ödeme onayının ardından anında web arayüzü üzerinden gösterilerek ve/veya e-posta kanalıyla teslim edilir.
3.2. Ürün bedeli seçilen plana göre (${options.planName}) ödeme sayfasında belirtilen ve ALICI tarafından onaylanan (${options.price}) tutardır.

4. GENEL HÜKÜMLER
4.1. ALICI, internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.
4.2. Sözleşme konusu dijital ürün (yazılım lisansı), ALICI'ya anında teslim edilen gayri maddi nitelikte bir hizmettir. 
4.3. SATICI, sözleşme konusu ürünün eksiksiz, belirtilen niteliklere uygun ve çalışır durumda teslim edilmesinden sorumludur.

5. CAYMA HAKKI VE İADE İSTİSNASI
Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesinin (ğ) bendi uyarınca; "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayri maddi mallara ilişkin sözleşmeler" kapsamında yer alan yazılım lisans kodlarında cayma hakkı ve iade kullanılamaz. ALICI, bu durumu bilerek ve onaylayarak satın alım işlemini gerçekleştirdiğini beyan eder.`
        );
      } else if (docType === 'onBilgilendirme') {
        docTitle = 'ON BILGILENDIRME FORMU';
        docSubtitle = 'RESMI ONAYLI ON BILGILENDIRME FORMU NUSHASI';
        bodyText = toLatin(
`ÖN BİLGİLENDİRME FORMU

1. SATICI BİLGİLERİ
Unvan/Adı: İBRAHİM COŞKUN (İSG Pro Teknolojileri)
E-posta: infoisgpro@gmail.com
Telefon: 0551 065 44 88
Adres: KOCASİNAN MAH. EDİRNE / MERKEZ

2. ALICI BİLGİLERİ
Ad Soyad: ${options.customerName || 'Değerli Müşterimiz'}
E-posta: ${options.customerEmail || '-'}
Telefon: ${options.customerPhone || '-'}
Adres: ${options.customerAddress || 'Dijital Teslimat (E-Posta / Web)'}

3. SÖZLEŞME KONUSU ÜRÜN / HİZMET BİLGİLERİ
Ürün/Hizmet: İSG Pro Yapay Zeka Destekli İSG Yönetim Yazılımı Dijital Lisansı (${options.planName})
Sipariş / İşlem No: ${options.orderId}
Teslimat Şekli: Elektronik ortamda anında dijital lisans kodu üretimi ve e-posta ile iletim.

4. TOPLAM FİYAT VE ÖDEME
Sipariş ekranında seçilen lisans paketinin (${options.planName}) vergiler dahil toplam satış bedeli (${options.price}) üzerinden ödeme aracı kurum (PayTR) veya güvenli kanallarla tahsil edilir.

5. CAYMA HAKKI VE İSTİSNALARI
6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'nin 15/ğ maddesi uyarınca, elektronik ortamda anında teslim edilen ve ifa edilen dijital yazılım lisanslarında cayma hakkı bulunmamaktadır.`
        );
      } else if (docType === 'iade') {
        docTitle = 'IPTAL VE IADE KOSULLARI';
        docSubtitle = 'RESMI ONAYLI IPTAL VE IADE KOSULLARI NUSHASI';
        bodyText = toLatin(
`İPTAL VE İADE KOŞULLARI

1. DİJİTAL ÜRÜN İSTİSNASI
İSG Pro platformu üzerinden satın alınan tüm paketler (Aylık ve Yıllık Lisanslar), elektronik ortamda anında teslim edilen ve anında tüketime açılan dijital lisans anahtarı formatındadır. Bu tür gayri maddi mallar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca iade kapsamı dışındadır.

2. İPTAL PROSEDÜRÜ
2.1. ALICI, dilediği zaman bir sonraki dönem için aboneliğini iptal edebilir. İptal işlemi gerçekleştirildiğinde, mevcut dönemin sonuna kadar Premium özellikleri kullanılmaya devam edilebilir ve yeni dönemde karttan herhangi bir ücret çekilmez.
2.2. Aylık veya yıllık paketlerin tanımlanmasını takip eden süreçte "kullanmadım" veya "yanlışlıkla aldım" gerekçesiyle geçmişe dönük iade yapılması mümkün değildir.

3. TEKNİK DESTEK VE MÜŞTERİ MEMNUNİYETİ
SATICI (İBRAHİM COŞKUN), dijital lisansın etkinleştirilmesinde veya yapay zeka araçlarının kullanımında yaşanabilecek her türlü sistemsel veya teknik hata durumunda ALICI'ya infoisgpro@gmail.com adresi üzerinden en geç 48 saat içinde teknik destek sağlamayı taahhüt eder. Çözülemeyen teknik kusurlar durumunda müşteri memnuniyeti kapsamında değerlendirme yapılır.`
        );
      } else if (docType === 'privacy') {
        docTitle = 'GIZLILIK POLITIKASI';
        docSubtitle = 'RESMI ONAYLI GIZLILIK POLITIKASI NUSHASI';
        bodyText = toLatin(
`GİZLİLİK POLİTİKASI

İSG Pro internet sitesini ziyaret eden veya lisans satın alan tüm kullanıcıların gizliliği bizim için son derece önemlidir. İşbu Gizlilik Politikası, kişisel verilerinizin nasıl toplandığı, korunduğu ve kullanıldığına dair bilgilendirme amacıyla hazırlanmıştır.

1. TOPLANAN VERİLER
1.1. Üyelik ve satın alma işlemleri esnasında tarafınızdan Ad Soyad, E-posta adresi, Telefon numarası ve mesleki unvan (İSG Uzmanı sertifika no vb.) bilgileri talep edilmektedir.
1.2. Kredi kartı ve banka ödeme bilgileriniz kesinlikle bizim tarafımızdan veri tabanımızda tutulmaz veya saklanmaz. Tüm ödeme işlemleri BDDK lisanslı güvenli ödeme aracı kurumları (PAYTR vb.) ve 256-Bit SSL şifreli güvenli bağlantılar üzerinden doğrudan işlenmektedir.

2. VERİ GÜVENLİĞİ VE SAKLAMA
Verileriniz, yetkisiz erişim, kaybolma, değiştirilme veya ifşa edilme risklerine karşı endüstri standardı güvenlik protokolleri ve modern şifreleme yöntemleri ile sunucularımızda saklanmaktadır.

3. ÇEREZLER (COOKIES)
Sitemizde, kullanıcı deneyimini iyileştirmek, oturumları açık tutmak ve site performans analizi gerçekleştirmek amacıyla tarayıcı çerezleri kullanılmaktadır.`
        );
      } else if (docType === 'kvkk') {
        docTitle = 'KVKK AYDINLATMA METNI';
        docSubtitle = 'RESMI ONAYLI KVKK AYDINLATMA METNI NUSHASI';
        bodyText = toLatin(
`KVKK AYDINLATMA METNİ

İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla İBRAHİM COŞKUN tarafından kişisel verilerinizin işlenmesi, korunması ve haklarınız konusunda sizi bilgilendirmek amacıyla hazırlanmıştır.

1. KİŞİSEL VERİLERİN İŞLENME AMACI
Kişisel verileriniz (Ad, Soyad, E-posta, Telefon No, Mesleki Bilgiler), aşağıdaki amaçlarla hukuka ve dürüstlük kurallarına uygun olarak işlenmektedir:
- Üyelik kaydının oluşturulması ve doğrulanması
- Lisans anahtarlarının üretilmesi ve teslim edilmesi
- Satış sonrası destek hizmetlerinin sunulması ve faturalandırma süreçleri
- Mevzuattan kaynaklanan yasal yükümlülüklerin yerine getirilmesi

2. VERİLERİN AKTARIMI
Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü taraf, kurum veya kuruluşla ticari amaçla paylaşılmaz. Ödeme süreçlerinin tamamlanabilmesi adına yalnızca BDDK lisanslı aracı ödeme kuruluşuna (şifreli ve güvenli kanallarla) aktarılır.

3. KVKK KAPSAMINDAKİ HAKLARINIZ
KVKK'nın 11. maddesi uyarınca veri sahibi olarak; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve buna uygun kullanılıp kullanılmadığını öğrenme, verilerinizin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme ve verilerinizin silinmesini talep etme haklarına sahipsiniz. Haklarınızı kullanmak için infoisgpro@gmail.com adresine başvurabilirsiniz.`
        );
      } else if (docType === 'teslimat') {
        docTitle = 'TESLIMAT VE KARGO KOSULLARI';
        docSubtitle = 'RESMI ONAYLI TESLIMAT VE KARGO KOSULLARI NUSHASI';
        bodyText = toLatin(
`TESLİMAT VE KARGO KOŞULLARI

1. TESLİMAT ŞEKLİ VE SÜRECİ
İSG Pro platformu üzerinden satın alınan tüm dijital yazılım lisansları ve abonelik paketleri, doğası gereği dijital ürün niteliğindedir. Bu nedenle herhangi bir fiziksel kargo gönderimi, koli veya kurye teslimatı yapılmamaktadır.

2. ANINDA DİJİTAL TESLİMAT
2.1. Satın alma işleminin (PayTR güvenli ödeme kanalı veya onaylanan ödeme yöntemleri ile) başarıyla tamamlanmasının ardından, dijital yazılım lisans anahtarı kullanıcının ekranında anında görüntülenir.
2.2. Aynı zamanda sipariş özeti, erişim detayları ve onaylanmış sözleşme nüshaları kullanıcının satın alma sırasında beyan ettiği e-posta adresine otomatik ve anlık olarak iletilir.
2.3. Kullanıcı, lisans anahtarını İSG Pro hesabına girerek yazılımın tüm Premium özelliklerini anında kullanmaya başlayabilir.

3. KARGO ÜCRETİ VE FİZİKSEL TESLİMAT OLMAMASI
İSG Pro dijital bir yazılım hizmeti (SaaS) olduğundan, alıcıdan herhangi bir "Kargo Ücreti", "Teslimat Harcı" veya "Taşıma Bedeli" talep edilmez. Tüm teslimatlar elektronik ortamda %100 ücretsiz ve anında gerçekleşir.

4. TESLİMAT AKSAMALARI VE TEKNİK DESTEK
4.1. Kullanıcının e-posta sunucusundaki spam/önemsiz filtreleri veya hatalı e-posta adresi beyanı nedeniyle e-posta teslimatında aksama yaşanması durumunda, kullanıcı kullanıcı paneli üzerinden lisans bilgilerine erişebilir.
4.2. E-posta veya lisans anahtarı iletiminde herhangi bir teknik aksaklık yaşanması durumunda, SATICI (İBRAHİM COŞKUN) infoisgpro@gmail.com veya 0551 065 44 88 destek kanalları üzerinden en geç 24 saat içerisinde müdahale ederek dijital teslimatı tamamlamayı taahhüt eder.`
        );
      }

      // Header Banner
      doc.fillColor('#1e1b4b').rect(0, 0, doc.page.width, 50).fill();
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('ISG PRO TEKNOLOJILERI', 35, 14);
      doc.fontSize(9).font('Helvetica').text(docTitle, 35, 32);

      // Subtitle
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(docSubtitle, 35, 60, { align: 'center', width: 525 });

      // Order Details Summary Box
      const boxStartY = 76;
      let curY = boxStartY + 6;
      const labelX = 45;
      const labelWidth = 110;
      const valX = 160;
      const valWidth = 385;

      const addRow = (label: string, val: string) => {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#334155').text(label, labelX, curY, { width: labelWidth });
        doc.font('Helvetica').fillColor('#0f172a').text(val, valX, curY, { width: valWidth });
        const h1 = doc.heightOfString(label, { width: labelWidth });
        const h2 = doc.heightOfString(val, { width: valWidth });
        curY += Math.max(h1, h2) + 2;
      };

      addRow('Siparis / Islem No:', orderId);
      addRow('Musteri Ad Soyad:', name);
      addRow('Musteri E-Posta:', email);
      addRow('Telefon / Adres:', `${phone} / ${address}`);
      addRow('Satin Alinan Paket:', planName);
      addRow('Odenen Tutar:', price);
      addRow('Onay Tarihi & Saati:', approvalDate);

      const boxHeight = curY - boxStartY + 4;
      doc.strokeColor('#cbd5e1').lineWidth(1).rect(35, boxStartY, 525, boxHeight).stroke();
      
      // Contract Body Text
      const bodyStartY = boxStartY + boxHeight + 12;
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text(docTitle, 35, bodyStartY);
      doc.moveDown(0.4);
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(bodyText, 35, doc.y, { 
        align: 'justify', 
        lineGap: 2.5, 
        width: 525 
      });

      // Dual Signature Boxes - Dynamic placement after contract text
      const boxW = 250;
      const boxH = 110;
      let signY = doc.y + 15;

      if (signY + boxH > 770) {
        doc.addPage();
        doc.fillColor('#1e1b4b').rect(0, 0, doc.page.width, 35).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('ISG PRO TEKNOLOJILERI - IMZA VE ONAY SAYFASI', 35, 10);
        signY = 55;
      }

      // ALICI (BUYER) BOX (Left)
      const aliciX = 35;
      doc.fillColor('#f8fafc').rect(aliciX, signY, boxW, boxH).fill();
      doc.strokeColor('#cbd5e1').lineWidth(1).rect(aliciX, signY, boxW, boxH).stroke();

      doc.fillColor('#1e40af').fontSize(8.5).font('Helvetica-Bold').text('ALICI (MUSTERI) IMZASI', aliciX + 8, signY + 6);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold').text(`Ad Soyad: ${name}`, aliciX + 8, signY + 18);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`Tarih: ${approvalDate}`, aliciX + 8, signY + 28);

      let activeCustSig = options.customerSignature;
      if (!activeCustSig && options.customerEmail) {
        activeCustSig = signaturesByEmail[options.customerEmail.toLowerCase().trim()];
      }
      if (!activeCustSig) {
        activeCustSig = globalLatestCustomerSignature;
      }

      const custBuf = parseBase64Image(activeCustSig);
      if (custBuf) {
        try {
          doc.image(custBuf, aliciX + 8, signY + 36, { fit: [234, 65], align: 'center', valign: 'center' });
        } catch (imgErr) {
          console.error('[PDF Cust Image Error]:', imgErr);
          doc.fillColor('#1d4ed8').fontSize(11).font('Helvetica-BoldOblique').text(`${name}`, aliciX + 15, signY + 50);
        }
      } else {
        doc.fillColor('#1d4ed8').fontSize(11).font('Helvetica-BoldOblique').text(`${name}`, aliciX + 15, signY + 50);
      }

      // SATICI (SELLER) BOX (Right)
      const saticiX = 310;
      doc.fillColor('#f8fafc').rect(saticiX, signY, boxW, boxH).fill();
      doc.strokeColor('#cbd5e1').lineWidth(1).rect(saticiX, signY, boxW, boxH).stroke();

      const sellerDisplayName = toLatin(options.sellerName || sellerConfig.name || 'IBRAHIM COSKUN');
      doc.fillColor('#1e40af').fontSize(8.5).font('Helvetica-Bold').text('SATICI (ISG PRO TEKNOLOJILERI) IMZASI', saticiX + 8, signY + 6);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold').text(`Ad Soyad: ${sellerDisplayName}`, saticiX + 8, signY + 18);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`Tarih: ${approvalDate}`, saticiX + 8, signY + 28);

      const activeSellerSig = options.sellerSignature || sellerConfig.signature;
      const sellerBuf = parseBase64Image(activeSellerSig);
      if (sellerBuf) {
        try {
          doc.image(sellerBuf, saticiX + 8, signY + 36, { fit: [234, 65], align: 'center', valign: 'center' });
        } catch (imgErr) {
          console.error('[PDF Seller Image Error]:', imgErr);
          doc.fillColor('#1d4ed8').fontSize(11).font('Helvetica-BoldOblique').text(`${sellerDisplayName}`, saticiX + 15, signY + 50);
        }
      } else {
        doc.fillColor('#1d4ed8').fontSize(11).font('Helvetica-BoldOblique').text(`${sellerDisplayName}`, saticiX + 15, signY + 50);
      }

      // Page Footer Note
      const footerY = signY + boxH + 10;
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text(
        `Isbu dokuman 6502 sayili Kanun ve 6698 sayili KVKK geregince taraflarin karsilikli imza ve onayi ile elektronik ortamda duzenlenmistir. ALICI (${email}) | SATICI (infoisgpro@gmail.com)`,
        35, footerY, { align: 'center', width: 525 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateAllContractsPDFAttachments(options: ContractPDFOptions): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const cleanOrderId = options.orderId || `ISG-${Date.now().toString().slice(-6)}`;
  const docTypes: Array<{ type: 'mss' | 'onBilgilendirme' | 'iade' | 'privacy' | 'kvkk' | 'teslimat'; filename: string }> = [
    { type: 'mss', filename: `ISG_Pro_1_Mesafeli_Satis_Sozlesmesi_${cleanOrderId}.pdf` },
    { type: 'onBilgilendirme', filename: `ISG_Pro_2_On_Bilgilendirme_Formu_${cleanOrderId}.pdf` },
    { type: 'iade', filename: `ISG_Pro_3_Iptal_ve_Iade_Kosullari_${cleanOrderId}.pdf` },
    { type: 'privacy', filename: `ISG_Pro_4_Gizlilik_Politikasi_${cleanOrderId}.pdf` },
    { type: 'kvkk', filename: `ISG_Pro_5_KVKK_Aydinlatma_Metni_${cleanOrderId}.pdf` },
    { type: 'teslimat', filename: `ISG_Pro_6_Teslimat_ve_Kargo_Kosullari_${cleanOrderId}.pdf` }
  ];

  return Promise.all(
    docTypes.map(async (item) => {
      const buffer = await generateSingleContractPDF(item.type, options);
      return {
        filename: item.filename,
        content: buffer,
        contentType: 'application/pdf'
      };
    })
  );
}

dotenv.config();

// Initialize Firebase SDK for server-side persistence of releases
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB49Ah-yas5jGV3oz0Dg_09-u7tqDcv33o",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "isg-kutuphane.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "isg-kutuphane",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "isg-kutuphane.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "334519488560",
  appId: process.env.FIREBASE_APP_ID || "1:334519488560:web:957dee0895a553a5691df5"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp);

// EmailJS Configuration for OTP, Licensing, and Contact support
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_uqwc0fd";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_g923r5o";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "EjgR1VNaFhYfJtFvq";
const EMAILJS_LICENSE_TEMPLATE_ID = process.env.EMAILJS_LICENSE_TEMPLATE_ID || "template_s4rysr5";
const EMAILJS_CONTACT_TEMPLATE_ID = process.env.EMAILJS_CONTACT_TEMPLATE_ID || "template_g923r5o";

const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>
): Promise<boolean> => {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log(`[EmailJS] Email successfully sent using template ${templateId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[EmailJS Error] Template ${templateId} failed:`, errorText);
      return false;
    }
  } catch (err) {
    console.error(`[EmailJS Connection Error] Template ${templateId} failed:`, err);
    return false;
  }
};

// Direct SMTP / Nodemailer Configuration (Alternative & more reliable than EmailJS)
// Resolves dynamically from Firestore (smtp_config/default) or falls back to environment variables
const getSMTPConfig = async () => {
  let host = process.env.SMTP_HOST || "smtp.gmail.com";
  let port = Number(process.env.SMTP_PORT) || 587;
  let user = process.env.SMTP_USER || "";
  let pass = (process.env.SMTP_PASS || "").replace(/\s+/g, '');
  let fromName = process.env.SMTP_FROM_NAME || "İSG Pro";
  let active = !!(user && pass);

  try {
    const smtpDocRef = doc(db, 'smtp_config', 'default');
    const smtpSnap = await getDoc(smtpDocRef);
    if (smtpSnap.exists()) {
      const data = smtpSnap.data();
      if (data.active !== false) {
        if (data.host) host = data.host;
        if (data.port) port = Number(data.port);
        if (data.user) user = data.user;
        if (data.pass) pass = String(data.pass).replace(/\s+/g, '');
        if (data.fromName) fromName = data.fromName;
        active = !!(user && pass);
      } else {
        active = false;
      }
    }
  } catch (err) {
    console.error('[SMTP Config] Error reading dynamic SMTP settings from Firestore:', err);
  }

  return { host, port, user, pass, fromName, active };
};

const createDynamicTransporter = (config: { host: string; port: number; user: string; pass: string }) => {
  const cleanPass = (config.pass || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    family: 4, // Force IPv4 to resolve Render container IPv6 ENETUNREACH network errors
    auth: {
      user: config.user,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

// Using secure direct image URL from postimg.cc for high email client compatibility

// Beautiful HTML Email Templates for Direct SMTP Sending
const getOTPHtmlTemplate = (name: string, code: string, time: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro Doğrulama Kodu</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .otp-container { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 36px; font-weight: 700; color: #0f172a; letter-spacing: 6px; margin: 0; font-family: monospace; }
    .expiry { font-size: 13px; color: #64748b; margin-top: 10px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .warning { font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">Tek Kullanımlık Doğrulama Kodu</div>
    </div>
    <div class="content">
      <div class="greeting">Merhaba ${name || 'Kullanıcı'},</div>
      <p class="text">İSG Pro sistemine güvenli bir şekilde giriş yapabilmeniz veya şifrenizi sıfırlayabilmeniz için tek kullanımlık doğrulama kodunuz oluşturulmuştur.</p>
      
      <div class="otp-container">
        <div class="otp-code">${code}</div>
        <div class="expiry">Bu kod <strong>${time}</strong> tarihine kadar geçerlidir.</div>
      </div>
      
      <p class="text">Lütfen bu kodu kimseyle paylaşmayınız. Giriş talebi size ait değilse bu e-postayı güvenle görmezden gelebilirsiniz.</p>
      
      <div class="warning">
        Bu e-posta otomatik olarak gönderilmiştir. Lütfen doğrudan yanıtlamayınız.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>
`;

const getLicenseHtmlTemplate = (options: {
  name: string;
  licenseKey: string;
  planName: string;
  planType: string;
  price: string;
  purchaseDate: string;
  expiryDate: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro Lisansınız Hazır!</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #059669, #047857); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .license-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
    .license-label { font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .license-key { font-size: 22px; font-weight: 700; color: #15803d; letter-spacing: 1px; margin: 0; font-family: monospace; background-color: #ffffff; padding: 10px 15px; border-radius: 4px; border: 1px solid #dcfce7; display: inline-block; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    .details-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .details-table td.value { color: #0f172a; text-align: right; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .activation-instructions { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 30px; border-left: 4px solid #059669; }
    .activation-instructions h3 { margin-top: 0; color: #0f172a; font-size: 15px; }
    .activation-instructions ol { margin: 0; padding-left: 20px; font-size: 14px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #a7f3d0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">Lisans Teslimat Bildirimi</div>
    </div>
    <div class="content">
      <div class="greeting">Tebrikler ${options.name || 'Kullanıcı'},</div>
      <p class="text">İSG Pro satın alımınız başarıyla tamamlandı. Aşağıda satın aldığınız ürüne ait detaylar ve lisans anahtarınız bulunmaktadır.</p>
      
      <div class="license-card">
        <div class="license-label">LİSANS ANAHTARINIZ</div>
        <div class="license-key">${options.licenseKey}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Satın Alınan Plan</td>
          <td class="value"><strong>${options.planName}</strong> (${options.planType})</td>
        </tr>
        <tr>
          <td class="label">Ödenen Tutar</td>
          <td class="value"><strong>${options.price}</strong></td>
        </tr>
        <tr>
          <td class="label">Satın Alma Tarihi</td>
          <td class="value">${options.purchaseDate}</td>
        </tr>
        <tr>
          <td class="label">Son Kullanma Tarihi</td>
          <td class="value">${options.expiryDate}</td>
        </tr>
      </table>

      <div class="activation-instructions">
        <h3>Nasıl Etkinleştirilir?</h3>
        <ol>
          <li>İSG Pro masaüstü veya mobil uygulamasını açın.</li>
          <li>Giriş yaptıktan sonra <strong>Hesabım / Profil</strong> sekmesine gidin.</li>
          <li><strong>Lisans Aktifleştir</strong> butonuna tıklayın.</li>
          <li>Yukarıdaki lisans anahtarını yapıştırıp onaylayın.</li>
        </ol>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>
`;

const getContractsApprovalHtmlTemplate = (options: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  orderId: string;
  planName: string;
  price: string;
  approvalDate: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro Onaylanmış Sözleşme Nüshaları</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .container { max-width: 650px; width: 100%; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 35px 20px; text-align: center; color: #ffffff; }
    .content { padding: 30px 24px; line-height: 1.6; word-break: break-word; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .intro { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 24px; width: 100%; box-sizing: border-box; overflow: hidden; }
    .box-title { font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    .details-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 42%; text-align: left; padding-right: 8px; vertical-align: top; }
    .details-table td.value { color: #0f172a; text-align: right; font-weight: 600; width: 58%; vertical-align: top; word-break: break-all; overflow-wrap: anywhere; }
    .contract-section { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-top: 12px; max-height: 250px; overflow-y: auto; font-size: 12px; color: #475569; line-height: 1.5; word-break: break-word; }
    .legal-badge { display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-top: 16px; margin-bottom: 6px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin-top: 24px; line-height: 1.5; word-break: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="80" height="80" style="vertical-align: middle; border-radius: 16px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #a5b4fc; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">ONAYLI SÖZLEŞME NÜSHASI</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 600; opacity: 0.95; margin-top: 10px;">Onaylı Sözleşmeler</div>
    </div>
    
    <div class="content">
      <div class="greeting">Sayın ${options.customerName || 'Değerli Müşterimiz'},</div>
      <p class="intro">
        İSG Pro dijital yazılım lisansı satın alım işleminiz sırasında onaylamış olduğunuz <strong>Onaylı Sözleşmeler</strong>'in (Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu, İptal ve İade Koşulları, Teslimat ve Kargo Koşulları, Gizlilik Politikası ve KVKK Aydınlatma Metni) onaylanmış nüshaları e-posta ekinde PDF formatında ve aşağıda bilginize sunulmuştur.
      </p>

      <div class="box">
        <div class="box-title">Sipariş Ve Alıcı Bilgileri</div>
        <table class="details-table" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td class="label">Alıcı Adı Soyadı:</td>
            <td class="value">${options.customerName || 'Değerli Müşterimiz'}</td>
          </tr>
          <tr>
            <td class="label">Sipariş / İşlem No:</td>
            <td class="value" style="word-break: break-all; overflow-wrap: anywhere;">${options.orderId}</td>
          </tr>
          <tr>
            <td class="label">Alıcı E-Posta:</td>
            <td class="value" style="word-break: break-all; overflow-wrap: anywhere;">${options.customerEmail}</td>
          </tr>
          ${options.customerPhone ? `
          <tr>
            <td class="label">Telefon:</td>
            <td class="value">${options.customerPhone}</td>
          </tr>` : ''}
          ${options.customerAddress ? `
          <tr>
            <td class="label">Alıcı Adresi:</td>
            <td class="value" style="word-break: break-word;">${options.customerAddress}</td>
          </tr>` : ''}
          <tr>
            <td class="label">Satın Alınan Paket:</td>
            <td class="value">${options.planName}</td>
          </tr>
          <tr>
            <td class="label">Toplam Ödenen Tutar:</td>
            <td class="value" style="color: #16a34a;">${options.price}</td>
          </tr>
          <tr>
            <td class="label">Onay Tarihi & Saati:</td>
            <td class="value">${options.approvalDate}</td>
          </tr>
          <tr>
            <td class="label">Satıcı Ünvanı:</td>
            <td class="value">İbrahim Coşkun (İSG Pro)</td>
          </tr>
        </table>
      </div>

      <div class="legal-badge">1. MESAFELİ SATIŞ SÖZLEŞMESİ</div>
      <div class="contract-section">
        <strong>MESAFELİ SATIŞ SÖZLEŞMESİ</strong><br><br>
        <strong>1. TARAFLAR</strong><br>
        İşbu Sözleşme, aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.<br><br>
        <strong>SATICI:</strong><br>
        Adı/Soyadı/Unvanı: İBRAHİM COŞKUN (İSG Pro Teknolojileri)<br>
        E-posta: infoisgpro@gmail.com | Telefon: 0551 065 44 88 | Adres: KOCASİNAN MAH. EDİRNE/ MERKEZ<br>
        (Sözleşmede bundan sonra "SATICI" olarak anılacaktır)<br><br>
        <strong>ALICI:</strong><br>
        Adı/Soyadı: ${options.customerName || 'Değerli Müşterimiz'}<br>
        E-posta: ${options.customerEmail} | Telefon: ${options.customerPhone || '-'} | Adres: ${options.customerAddress || 'Dijital Teslimat (E-Posta / Web)'}<br>
        (Sözleşmede bundan sonra "ALICI" olarak anılacaktır)<br><br>
        <strong>2. SÖZLEŞMENİN KONUSU</strong><br>
        İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı belirtilen "İSG Pro Premium" dijital yazılım lisansının satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.<br><br>
        <strong>3. SÖZLEŞME KONUSU ÜRÜN VE ÖDEME BİLGİLERİ</strong><br>
        3.1. Ürün, İSG Pro Premium sürümüne erişim sağlayan bir dijital lisans anahtarı (lisans kodu) olup, ALICI'ya ödeme onayının ardından anında web arayüzü üzerinden gösterilerek ve/veya e-posta kanalıyla teslim edilir.<br>
        3.2. Ürün bedeli seçilen plana göre (${options.planName}) ödeme sayfasında belirtilen ve ALICI tarafından onaylanan (${options.price}) tutardır.<br><br>
        <strong>4. GENEL HÜKÜMLER</strong><br>
        4.1. ALICI, internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.<br>
        4.2. Sözleşme konusu dijital ürün (yazılım lisansı), ALICI'ya anında teslim edilen gayri maddi nitelikte bir hizmettir.<br>
        4.3. SATICI, sözleşme konusu ürünün eksiksiz, belirtilen niteliklere uygun ve çalışır durumda teslim edilmesinden sorumludur.<br><br>
        <strong>5. CAYMA HAKKI VE İADE İSTİSNASI</strong><br>
        Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesinin (ğ) bendi uyarınca; "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayri maddi mallara ilişkin sözleşmeler" kapsamında yer alan yazılım lisans kodlarında cayma hakkı ve iade kullanılamaz. ALICI, bu durumu bilerek ve onaylayarak satın alım işlemini gerçekleştirdiğini beyan eder.
      </div>

      <div class="legal-badge" style="background-color: #f3e8ff; color: #6b21a8;">2. ÖN BİLGİLENDİRME FORMU</div>
      <div class="contract-section">
        <strong>ÖN BİLGİLENDİRME FORMU</strong><br><br>
        <strong>1. SATICI BİLGİLERİ</strong><br>
        Unvan/Adı: İBRAHİM COŞKUN (İSG Pro Teknolojileri)<br>
        E-posta: infoisgpro@gmail.com | Telefon: 0551 065 44 88 | Adres: KOCASİNAN MAH. EDİRNE / MERKEZ<br><br>
        <strong>2. ALICI BİLGİLERİ</strong><br>
        Ad Soyad: ${options.customerName || 'Değerli Müşterimiz'}<br>
        E-posta: ${options.customerEmail} | Telefon: ${options.customerPhone || '-'} | Adres: ${options.customerAddress || 'Dijital Teslimat (E-Posta / Web)'}<br><br>
        <strong>3. SÖZLEŞME KONUSU ÜRÜN / HİZMET BİLGİLERİ</strong><br>
        Ürün/Hizmet: İSG Pro Yapay Zeka Destekli İSG Yönetim Yazılımı Dijital Lisansı (${options.planName})<br>
        Sipariş / İşlem No: ${options.orderId}<br>
        Teslimat Şekli: Elektronik ortamda anında dijital lisans kodu üretimi ve e-posta ile iletim.<br><br>
        <strong>4. TOPLAM FİYAT VE ÖDEME</strong><br>
        Sipariş ekranında seçilen lisans paketinin (${options.planName}) vergiler dahil toplam satış bedeli (${options.price}) üzerinden ödeme aracı kurum (PayTR) veya güvenli kanallarla tahsil edilir.<br><br>
        <strong>5. CAYMA HAKKI VE İSTİSNALARI</strong><br>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'nin 15/ğ maddesi uyarınca, elektronik ortamda anında teslim edilen ve ifa edilen dijital yazılım lisanslarında cayma hakkı bulunmamaktadır.
      </div>

      <div class="legal-badge" style="background-color: #fef3c7; color: #92400e;">3. İPTAL VE İADE KOŞULLARI</div>
      <div class="contract-section">
        <strong>İPTAL VE İADE KOŞULLARI</strong><br><br>
        <strong>1. DİJİTAL ÜRÜN İSTİSNASI</strong><br>
        İSG Pro platformu üzerinden satın alınan tüm paketler (Aylık ve Yıllık Lisanslar), elektronik ortamda anında teslim edilen ve anında tüketime açılan dijital lisans anahtarı formatındadır. Bu tür gayri maddi mallar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca iade kapsamı dışındadır.<br><br>
        <strong>2. İPTAL PROSEDÜRÜ</strong><br>
        2.1. ALICI, dilediği zaman bir sonraki dönem için aboneliğini iptal edebilir. İptal işlemi gerçekleştirildiğinde, mevcut dönemin sonuna kadar Premium özellikleri kullanılmaya devam edilebilir ve yeni dönemde karttan herhangi bir ücret çekilmez.<br>
        2.2. Aylık veya yıllık paketlerin tanımlanmasını takip eden süreçte "kullanmadım" veya "yanlışlıkla aldım" gerekçesiyle geçmişe dönük iade yapılması mümkün değildir.<br><br>
        <strong>3. TEKNİK DESTEK VE MÜŞTERİ MEMNUNİYETİ</strong><br>
        SATICI (İBRAHİM COŞKUN), dijital lisansın etkinleştirilmesinde veya yapay zeka araçlarının kullanımında yaşanabilecek her türlü sistemsel veya teknik hata durumunda ALICI'ya infoisgpro@gmail.com adresi üzerinden en geç 48 saat içinde teknik destek sağlamayı taahhüt eder. Çözülemeyen teknik kusurlar durumunda müşteri memnuniyeti kapsamında değerlendirme yapılır.
      </div>

      <div class="legal-badge" style="background-color: #e0f2fe; color: #075985;">4. GİZLİLİK POLİTİKASI</div>
      <div class="contract-section">
        <strong>GİZLİLİK POLİTİKASI</strong><br><br>
        İSG Pro internet sitesini ziyaret eden veya lisans satın alan tüm kullanıcıların gizliliği bizim için son derece önemlidir. İşbu Gizlilik Politikası, kişisel verilerinizin nasıl toplandığı, korunduğu ve kullanıldığına dair bilgilendirme amacıyla hazırlanmıştır.<br><br>
        <strong>1. TOPLANAN VERİLER</strong><br>
        1.1. Üyelik ve satın alma işlemleri esnasında tarafınızdan Ad Soyad, E-posta adresi, Telefon numarası ve mesleki unvan (İSG Uzmanı sertifika no vb.) bilgileri talep edilmektedir.<br>
        1.2. Kredi kartı ve banka ödeme bilgileriniz kesinlikle bizim tarafımızdan veri tabanımızda tutulmaz veya saklanmaz. Tüm ödeme işlemleri BDDK lisanslı güvenli ödeme aracı kurumları (PAYTR vb.) ve 256-Bit SSL şifreli güvenli bağlantılar üzerinden doğrudan işlenmektedir.<br><br>
        <strong>2. VERİ GÜVENLİĞİ VE SAKLAMA</strong><br>
        Verileriniz, yetkisiz erişim, kaybolma, değiştirilme veya ifşa edilme risklerine karşı endüstri standardı güvenlik protokolleri ve modern şifreleme yöntemleri ile sunucularımızda saklanmaktadır.<br><br>
        <strong>3. ÇEREZLER (COOKIES)</strong><br>
        Sitemizde, kullanıcı deneyimini iyileştirmek, oturumları açık tutmak ve site performans analizi gerçekleştirmek amacıyla tarayıcı çerezleri kullanılmaktadır.
      </div>

      <div class="legal-badge" style="background-color: #ecfdf5; color: #065f46;">5. KVKK AYDINLATMA METNİ</div>
      <div class="contract-section">
        <strong>KVKK AYDINLATMA METNİ</strong><br><br>
        İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla İBRAHİM COŞKUN tarafından kişisel verilerinizin işlenmesi, korunması ve haklarınız konusunda sizi bilgilendirmek amacıyla hazırlanmıştır.<br><br>
        <strong>1. KİŞİSEL VERİLERİN İŞLENME AMACI</strong><br>
        Kişisel verileriniz (Ad, Soyad, E-posta, Telefon No, Mesleki Bilgiler), aşağıdaki amaçlarla hukuka ve dürüstlük kurallarına uygun olarak işlenmektedir:<br>
        - Üyelik kaydının oluşturulması ve doğrulanması<br>
        - Lisans anahtarlarının üretilmesi ve teslim edilmesi<br>
        - Satış sonrası destek hizmetlerinin sunulması ve faturalandırma süreçleri<br>
        - Mevzuattan kaynaklanan yasal yükümlülüklerin yerine getirilmesi<br><br>
        <strong>2. VERİLERİN AKTARIMI</strong><br>
        Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü taraf, kurum veya kuruluşla ticari amaçla paylaşılmaz. Ödeme süreçlerinin tamamlanabilmesi adına yalnızca BDDK lisanslı aracı ödeme kuruluşuna (şifreli ve güvenli kanallarla) aktarılır.<br><br>
        <strong>3. KVKK KAPSAMINDAKİ HAKLARINIZ</strong><br>
        KVKK'nın 11. maddesi uyarınca veri sahibi olarak; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve buna uygun kullanılıp kullanılmadığını öğrenme, verilerinizin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme ve verilerinizin silinmesini talep etme haklarına sahipsiniz. Haklarınızı kullanmak için infoisgpro@gmail.com adresine başvurabilirsiniz.
      </div>

      <div class="legal-badge" style="background-color: #f1f5f9; color: #334155;">6. TESLİMAT VE KARGO KOŞULLARI</div>
      <div class="contract-section">
        <strong>TESLİMAT VE KARGO KOŞULLARI</strong><br><br>
        <strong>1. TESLİMAT ŞEKLİ VE SÜRECİ</strong><br>
        İSG Pro platformu üzerinden satın alınan tüm dijital yazılım lisansları ve abonelik paketleri, doğası gereği dijital ürün niteliğindedir. Bu nedenle herhangi bir fiziksel kargo gönderimi, koli veya kurye teslimatı yapılmamaktadır.<br><br>
        <strong>2. ANINDA DİJİTAL TESLİMAT</strong><br>
        2.1. Satın alma işleminin (PayTR güvenli ödeme kanalı veya onaylanan ödeme yöntemleri ile) başarıyla tamamlanmasının ardından, dijital yazılım lisans anahtarı kullanıcının ekranında anında görüntülenir.<br>
        2.2. Aynı zamanda sipariş özeti, erişim detayları ve onaylanmış sözleşme nüshaları kullanıcının satın alma sırasında beyan ettiği e-posta adresine otomatik ve anlık olarak iletilir.<br>
        2.3. Kullanıcı, lisans anahtarını İSG Pro hesabına girerek yazılımın tüm Premium özelliklerini anında kullanmaya başlayabilir.<br><br>
        <strong>3. KARGO ÜCRETİ VE FİZİKSEL TESLİMAT OLMAMASI</strong><br>
        İSG Pro dijital bir yazılım hizmeti (SaaS) olduğundan, alıcıdan herhangi bir "Kargo Ücreti", "Teslimat Harcı" veya "Taşıma Bedeli" talep edilmez. Tüm teslimatlar elektronik ortamda %100 ücretsiz ve anında gerçekleşir.<br><br>
        <strong>4. TESLİMAT AKSAMALARI VE TEKNİK DESTEK</strong><br>
        4.1. Kullanıcının e-posta sunucusundaki spam/önemsiz filtreleri veya hatalı e-posta adresi beyanı nedeniyle e-posta teslimatında aksama yaşanması durumunda, kullanıcı kullanıcı paneli üzerinden lisans bilgilerine erişebilir.<br>
        4.2. E-posta veya lisans anahtarı iletiminde herhangi bir teknik aksaklık yaşanması durumunda, SATICI (İBRAHİM COŞKUN) infoisgpro@gmail.com veya 0551 065 44 88 destek kanalları üzerinden en geç 24 saat içerisinde müdahale ederek dijital teslimatı tamamlamayı taahhüt eder.
      </div>

      <div class="notice">
        <strong>Yasal Bilgilendirme:</strong> İşbu e-posta, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği gereğince onaylanan sözleşmenin bir nüshası olarak otomatik üretilmiştir. Sözleşmenin onaylı bir örneği sistem arşivimiz için <strong>infoisgpro@gmail.com</strong> adresine de iletilmiştir.
      </div>
    </div>

    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri - Tüm Hakları Saklıdır.<br>
      İletişim & Destek: infoisgpro@gmail.com
    </div>
  </div>
</body>
</html>
`;

const getEmailVerificationHtmlTemplate = (options: {
  name: string;
  email: string;
  updateUrl: string;
  verificationCode?: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Posta Doğrulama ve Güncelleme</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 35px 20px; text-align: center; color: #ffffff; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }
    .code-box { background-color: #f1f5f9; border: 1px dashed #94a3b8; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 4px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .url-fallback { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; word-break: break-all; color: #64748b; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="80" height="80" style="vertical-align: middle; border-radius: 16px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #93c5fd; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">E-POSTA DOĞRULAMA & GÜNCELLEME</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 16px; font-weight: 500; opacity: 0.95; margin-top: 10px;">E-Posta Adresinizi Doğrulayın</div>
    </div>
    
    <div class="content">
      <div class="greeting">Merhaba ${options.name || 'Kullanıcı'},</div>
      <p class="text">
        İSG Pro hesabınız için e-posta doğrulama veya güncelleme talebinde bulunulmuştur. Hesabınızın güvenliğini sağlamak ve onaylanan lisans/sözleşme bildirimlerini sorunsuz alabilmeniz için aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.
      </p>

      <div class="btn-container">
        <a href="${options.updateUrl}" target="_blank" class="btn">E-Posta Adresimi Doğrula & Güncelle</a>
      </div>

      ${options.verificationCode ? `
      <p class="text" style="text-align: center; font-size: 13px; margin-top: 10px; color: #64748b;">
        Alternatif Doğrulama Kodunuz:
      </p>
      <div class="code-box">${options.verificationCode}</div>
      ` : ''}

      <div class="url-fallback">
        <strong>Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</strong><br>
        <a href="${options.updateUrl}" style="color: #2563eb;">${options.updateUrl}</a>
      </div>
    </div>

    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.<br>
      Destek ve İletişim: infoisgpro@gmail.com
    </div>
  </div>
</body>
</html>
`;

const getContactHtmlTemplate = (options: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Destek Talebi</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .info-box { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
    .info-item { margin-bottom: 12px; font-size: 14px; }
    .info-item strong { color: #0f172a; }
    .message-box { background-color: #ffffff; border-left: 4px solid #3b82f6; padding: 15px 20px; font-style: italic; color: #1e293b; background-color: #eff6ff; border-radius: 0 8px 8px 0; margin-top: 15px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">Yeni Destek / İletişim Talebi</div>
    </div>
    <div class="content">
      <p>Web sitenizdeki iletişim formundan yeni bir mesaj gönderildi. Detaylar aşağıdadır:</p>
      
      <div class="info-box">
        <div class="info-item"><strong>Gönderen Adı:</strong> ${options.name}</div>
        <div class="info-item"><strong>E-posta:</strong> <a href="mailto:${options.email}">${options.email}</a></div>
        <div class="info-item"><strong>Konu:</strong> ${options.subject}</div>
        
        <div class="message-box">
          ${options.message.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
    <div class="footer">
      İSG Pro Yönetim Paneli Bildirimi
    </div>
  </div>
</body>
</html>
`;

const getContractHtmlTemplate = (options: {
  name: string;
  email: string;
  planName: string;
  price: string;
  orderId: string;
  purchaseDate: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro - Onaylanmış Sözleşmeler Nüshası</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .container { max-width: 650px; width: 100%; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 35px 20px; text-align: center; }
    .content { padding: 30px 24px; line-height: 1.6; word-break: break-word; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 14px; color: #475569; margin-bottom: 20px; }
    .badge-approved { display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bbf7d0; }
    .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; width: 100%; box-sizing: border-box; overflow: hidden; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    .details-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 42%; text-align: left; padding-right: 8px; vertical-align: top; }
    .details-table td.value { color: #0f172a; text-align: right; width: 58%; vertical-align: top; word-break: break-all; overflow-wrap: anywhere; }
    .contract-section { background-color: #fafafa; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; padding: 18px; border-radius: 6px; margin-bottom: 20px; word-break: break-word; }
    .contract-title { font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .contract-body { font-size: 12px; color: #64748b; line-height: 1.5; word-break: break-word; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .notice { font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 12px; border-radius: 6px; text-align: center; margin-top: 25px; word-break: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #c7d2fe; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">Onaylı Sözleşmeler</div>
    </div>
    <div class="content">
      <div class="greeting">Sayın ${options.name || 'Kullanıcı'},</div>
      <p class="text">İSG Pro dijital lisans yazılım paketini satın alırken elektronik ortamda okuyup kabul etmiş olduğunuz mesafeli satış sözleşmesi, ön bilgilendirme formu ve yasal şartların onaylı resmi nüshası aşağıda bilgilerinize sunulmuştur.</p>

      <div class="details-box">
        <div style="font-size: 12px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">SİPARİŞ VE MÜŞTERİ BİLGİLERİ</div>
        <table class="details-table">
          <tr>
            <td class="label">Müşteri Adı Soyadı</td>
            <td class="value"><strong>${options.name}</strong></td>
          </tr>
          <tr>
            <td class="label">Kayıtlı E-Posta Adresi</td>
            <td class="value"><strong>${options.email}</strong></td>
          </tr>
          <tr>
            <td class="label">Sipariş / Referans No</td>
            <td class="value"><span style="font-family: monospace;">${options.orderId}</span></td>
          </tr>
          <tr>
            <td class="label">Satın Alınan Paket</td>
            <td class="value"><strong>${options.planName}</strong></td>
          </tr>
          <tr>
            <td class="label">Ödenen Tutar</td>
            <td class="value"><strong style="color: #15803d;">${options.price}</strong></td>
          </tr>
          <tr>
            <td class="label">Onay ve İşlem Tarihi</td>
            <td class="value">${options.purchaseDate}</td>
          </tr>
        </table>
      </div>

      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 25px 0 15px 0;">Elektronik Onay Verilen Yasal Belgeler:</div>

      <!-- CONTRACT 1 -->
      <div class="contract-section">
        <div class="contract-title">
          <span>1. MESAFELİ SATIŞ SÖZLEŞMESİ</span>
          <span class="badge-approved">ONAYLANDI</span>
        </div>
        <div class="contract-body">
          <strong>SATICI:</strong> İSG Pro Teknolojileri / İbrahim Coşkun (infoisgpro@gmail.com)<br>
          <strong>ALICI:</strong> ${options.name} (${options.email})<br>
          <strong>KONU:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca ${options.planName} dijital lisans ürününün anında teslimi.<br>
          <strong>CAYMA HAKKI:</strong> Mesafeli Sözleşmeler Yönetmeliği Madde 15/ğ uyarınca elektronik ortamda anında ifa edilen gayri maddi yazılım lisanslarında cayma ve iade hakkı kullanılamaz.
        </div>
      </div>

      <!-- CONTRACT 2 -->
      <div class="contract-section">
        <div class="contract-title">
          <span>2. ÖN BİLGİLENDİRME FORMU</span>
          <span class="badge-approved">ONAYLANDI</span>
        </div>
        <div class="contract-body">
          Alıcı, sözleşme konusu dijital ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat şartları hakkında bilgilendirildiğini ve elektronik ortamda gerekli teyidi verdiğini kabul eder.
        </div>
      </div>

      <!-- CONTRACT 3 -->
      <div class="contract-section">
        <div class="contract-title">
          <span>3. GİZLİLİK POLİTİKASI VE KVKK ONAYI</span>
          <span class="badge-approved">ONAYLANDI</span>
        </div>
        <div class="contract-body">
          6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kişisel verileriniz ve sipariş detaylarınız 256-bit SSL güvenlik sertifikası altında koruma altında tutulmaktadır.
        </div>
      </div>

      <div class="notice">
        İşbu onaylı sözleşme nüshası kayıtlı e-posta adresinize (${options.email}) ve sistem yöneticimize (infoisgpro@gmail.com) eşzamanlı olarak gönderilmiş ve arşivlenmiştir.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri | infoisgpro@gmail.com | Tüm Hakları Saklıdır.
    </div>
  </div>
</body>
</html>
`;

const getUpdateEmailHtmlTemplate = (options: {
  name: string;
  email: string;
  updateLink: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro - E-Posta Adresi Güncelleme Bağlantısı</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #0284c7, #0369a1); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .action-box { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25); }
    .btn:hover { background-color: #0369a1; }
    .link-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #0284c7; word-break: break-all; margin-top: 15px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #bae6fd; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">E-Posta Adresi Güncelleme Bağlantısı</div>
    </div>
    <div class="content">
      <div class="greeting">Merhaba ${options.name || 'Kullanıcı'},</div>
      <p class="text">İSG Pro sisteminde kayıtlı profilinize ait e-posta adresinizin eksik, hatalı yazılmış veya güncellenmesi gerektiği bildirilmiştir.</p>
      <p class="text">Hesap güvenliğinizi sağlamak, lisans anahtarınıza ve onaylanmış sözleşme kopyalarınıza sorunsuz erişmek için lütfen aşağıdaki bağlantıya tıklayarak e-posta adresinizi doğrulayıp güncelleyiniz:</p>

      <div class="action-box">
        <a href="${options.updateLink}" target="_blank" class="btn">E-Posta Adresimi Güncelle / Doğrula</a>
        <div class="link-box">${options.updateLink}</div>
      </div>

      <p class="text" style="font-size: 13px; color: #64748b;">Bu talebi siz yapmadıysanız bu e-postayı dikkate almayabilir veya <a href="mailto:infoisgpro@gmail.com" style="color:#0284c7;">infoisgpro@gmail.com</a> adresiyle iletişime geçebilirsiniz.</p>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri | infoisgpro@gmail.com
    </div>
  </div>
</body>
</html>
`;

const getVerificationHtmlTemplate = (options: {
  name: string;
  email: string;
  code: string;
  verifyLink: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro - E-Posta Adresi Doğrulama</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .code-box { background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0; }
    .code { font-size: 34px; font-weight: 800; color: #166534; letter-spacing: 6px; font-family: monospace; }
    .action-box { text-align: center; margin: 25px 0; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #bbf7d0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; margin-top: 10px; opacity: 0.95;">E-Posta Adresi Doğrulama Bildirimi</div>
    </div>
    <div class="content">
      <div class="greeting">Merhaba ${options.name || 'Kullanıcı'},</div>
      <p class="text">İSG Pro hesabınızı aktifleştirmek ve <strong>${options.email}</strong> e-posta adresinizin size ait olduğunu doğrulamak için aşağıdaki doğrulama kodunu kullanabilirsiniz:</p>

      <div class="code-box">
        <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">E-POSTA DOĞRULAMA KODU</div>
        <div class="code">${options.code}</div>
        <div style="font-size: 12px; color: #15803d; margin-top: 8px;">Bu kod 15 dakika geçerlidir.</div>
      </div>

      <div class="action-box">
        <p class="text" style="font-size: 13px; margin-bottom: 10px;">Veya aşağıdaki butona tıklayarak hesabınızı doğrudan doğrulayabilirsiniz:</p>
        <a href="${options.verifyLink}" target="_blank" class="btn">E-Posta Adresimi Şimdi Doğrula</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri | infoisgpro@gmail.com
    </div>
  </div>
</body>
</html>
`;

const getTrialDeliveryHtmlTemplate = (options: {
  name: string;
  licenseKey: string;
  createdAt: string;
  expiryDate: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İSG Pro 7 Günlük Ücretsiz Deneme Lisansınız</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef1f5; }
    .header { background: linear-gradient(135deg, #d97706, #ea580c); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .trial-badge { display: inline-block; background-color: #fef3c7; color: #b45309; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; margin-bottom: 15px; }
    .license-card { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0; }
    .license-label { font-size: 12px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .license-key { font-size: 22px; font-weight: 800; color: #d97706; letter-spacing: 1.5px; margin: 0; font-family: monospace; background-color: #ffffff; padding: 12px 18px; border-radius: 6px; border: 1px solid #fcd34d; display: inline-block; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    .details-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 45%; }
    .details-table td.value { color: #0f172a; text-align: right; }
    .instructions { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 25px; border-left: 4px solid #f59e0b; }
    .instructions h3 { margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 700; }
    .instructions ol { margin: 0; padding-left: 20px; font-size: 14px; color: #475569; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="80" height="80" style="vertical-align: middle; border-radius: 16px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #fef3c7; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">7 GÜNLÜK ÜCRETSİZ DENEME</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 600; opacity: 0.95; margin-top: 8px;">Deneme Sürümü Lisansınız Hazır!</div>
    </div>
    <div class="content">
      <div class="greeting">Merhaba ${options.name || 'Değerli İSG Uzmanı'},</div>
      <p class="text">İSG Pro Yapay Zeka Destekli Risk Analizi ve İSG Yönetim Sistemini 7 gün boyunca hiçbir ödeme yapmadan deneyebileceğiniz özel deneme lisansınız üretilmiştir.</p>
      
      <div class="license-card">
        <div class="trial-badge">⚡ 7 GÜNLÜK ÜCRETSİZ DENEME</div>
        <div class="license-label">DİJİTAL DENEME LİSANS ANAHTARINIZ</div>
        <div class="license-key">${options.licenseKey}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Lisans Türü</td>
          <td class="value"><strong>7 Günlük Ücretsiz Deneme</strong></td>
        </tr>
        <tr>
          <td class="label">Tanımlanan E-Posta</td>
          <td class="value"><strong>${options.name}</strong></td>
        </tr>
        <tr>
          <td class="label">Başlangıç Zamanı</td>
          <td class="value">${options.createdAt}</td>
        </tr>
        <tr>
          <td class="label">Bitiş (Geçerlilik) Zamanı</td>
          <td class="value" style="color: #d97706; font-weight: 700;">${options.expiryDate}</td>
        </tr>
      </table>

      <div class="instructions">
        <h3>Hesabınızda Nasıl Etkinleştirilir?</h3>
        <ol>
          <li>İSG Pro uygulamasını veya portalını açın.</li>
          <li>Giriş yapın (veya hesabınızı doğrulayın).</li>
          <li><strong>"7 Gün Ücretsiz Dene"</strong> veya <strong>"Lisans Etkinleştir"</strong> butonuna tıklayın.</li>
          <li>Yukarıdaki tek kullanımlık lisans kodunu ilgili alana girin.</li>
        </ol>
      </div>

      <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
        * Not: Sistemimizde her e-posta adresi deneme sürümünden yalnızca 1 defa yararlanabilir. Lisans kodunuz zaman damgalı olup tam 7 gün sonra otomatik olarak sona erecektir.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>
`;

const getTrialExpiryReminderHtmlTemplate = (options: {
  name: string;
  email: string;
  expiryDate: string;
}): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deneme Sürümünüz Yarın Sona Eriyor!</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 35px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
    .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
    .alert-box { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0; }
    .alert-title { font-size: 16px; font-weight: 800; color: #1e40af; margin-bottom: 6px; }
    .alert-desc { font-size: 14px; color: #2563eb; font-weight: 700; }
    .features-list { background-color: #f8fafc; border-radius: 10px; padding: 20px 25px; margin: 25px 0; border: 1px solid #e2e8f0; }
    .features-list h4 { margin-top: 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .features-list ul { margin: 0; padding-left: 20px; font-size: 14px; color: #334155; }
    .features-list li { margin-bottom: 8px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 28px; border-radius: 10px; margin-top: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="80" height="80" style="vertical-align: middle; border-radius: 16px; display: block;" alt="İSG Pro" />
          </td>
          <td style="vertical-align: middle; text-align: left;">
            <div style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
            <div style="color: #c7d2fe; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
          </td>
        </tr>
      </table>
      <div style="color: #ffffff; font-size: 18px; font-weight: 600; opacity: 0.95; margin-top: 8px;">Deneme Süreniz Yarın Sona Eriyor!</div>
    </div>
    <div class="content">
      <div class="greeting">Merhaba ${options.name || 'Değerli İSG Uzmanı'},</div>
      <p class="text">İSG Pro 7 Günlük Ücretsiz Deneme Lisansınızın bitmesine <strong>son 1 gün (24 saat)</strong> kaldı.</p>
      
      <div class="alert-box">
        <div class="alert-title">⏰ Son Geçerlilik Tarihi & Saati</div>
        <div class="alert-desc">${options.expiryDate}</div>
      </div>

      <p class="text">Deneme süreniz sona erdiğinde yapay zeka destekli risk analizi, otomatik rapor oluşturma ve mevzuat takibi modüllerine erişiminiz duraklatılacaktır.</p>

      <div class="features-list">
        <h4>Pro Plana Yükselterek Neler Elde Edersiniz?</h4>
        <ul>
          <li><strong>Sınırsız Yapay Zeka Risk Analizi:</strong> Saniyeler içinde Fine-Kinney ve FMEA matrisleri üretin.</li>
          <li><strong>Mevzuata Uygun Resmi PDF Raporları:</strong> Tek tıkla bakanlık formatlarında çıktı alın.</li>
          <li><strong>Mobil ve Masaüstü Tam Senkronizasyon:</strong> Tüm cihazlarınızdan sorunsuz erişin.</li>
          <li><strong>Öncelikli Müşteri Desteği & Güncellemeler:</strong> Kesintisiz 7/24 teknik destek.</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ais-dev-io3uil7o5qt54hi5uumycw-1003670096535.europe-west2.run.app" class="cta-button">
          🚀 Pro Plana Yükseltin (Aylık / Yıllık)
        </a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 İSG Pro Teknolojileri. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>
`;

// Direct Email Dispatch Helper
async function sendEmailDirect(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
  try {
    const smtpConfig = await getSMTPConfig();
    if (smtpConfig.active) {
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      console.log(`[Direct Mail Sent] Sent email '${subject}' to ${toEmail} via SMTP`);
      return true;
    }
  } catch (err) {
    console.warn(`[Direct Mail Failed] Could not send email to ${toEmail} via SMTP:`, err);
  }

  // Fallback: Queue message
  try {
    messageQueue.push({
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: toEmail,
      email: toEmail,
      subject,
      message: htmlContent,
      sentAt: new Date().toISOString(),
      status: 'Beklemede'
    });
  } catch (e) {}

  return false;
}

// Initialize Gemini SDK with server-side environment key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Privacy helpers to prevent logging sensitive user records to terminal
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
};

const maskLicenseKey = (key: string): string => {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.substring(0, 8)}-XXXX-XXXX`;
};

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Force HTTPS redirect on Render (maintaining POST/PUT methods via 308 redirects)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(308, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory array for simulated email/contact requests
interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'Beklemede' | 'Okundu' | 'Yanıtlandı';
}

const messageQueue: Message[] = [];

// App Releases configuration storage
interface Release {
  id: string;
  platform: 'pc' | 'apk';
  version: string;
  releaseNotes: string;
  fileSize: string;
  fileName: string;
  updatedAt: string;
  downloadsCount: number;
  fileData?: string; // base64 string
  downloadType?: 'file' | 'link';
  downloadUrl?: string;
  isPublished?: boolean;
  showDownloadLinkBox?: boolean;
}

let releases: Release[] = [
  {
    id: 'pc',
    platform: 'pc',
    version: '1.0.0',
    releaseNotes: 'İlk kararlı Windows masaüstü sürümü piyasaya sürüldü. Tüm yapay zeka analiz şablonları, yerel veritabanı senkronizasyonu ve hızlı PDF/A4 rapor yazdırma özellikleri entegre edildi.',
    fileSize: '42.5 MB',
    fileName: 'isgpro_setup.exe',
    updatedAt: new Date().toISOString(),
    downloadsCount: 148,
    downloadType: 'file',
    isPublished: false,
    showDownloadLinkBox: true
  },
  {
    id: 'apk',
    platform: 'apk',
    version: '1.0.0',
    releaseNotes: 'Android akıllı telefon ve tabletler için optimize edilmiş İSG Pro mobil saha sürümü. Çevrimdışı saha çalışma modu, kamera entegrasyonuyla anlık risk fotoğraflama özelliği ve dijital imza desteği.',
    fileSize: '18.2 MB',
    fileName: 'isgpro_v1.apk',
    updatedAt: new Date().toISOString(),
    downloadsCount: 312,
    downloadType: 'link',
    downloadUrl: 'https://drive.google.com/file/d/1HWSxVBGdkboC5NY0n3hiSbd3bZ_RHGY5/view?usp=sharing',
    isPublished: true,
    showDownloadLinkBox: true
  }
];

// Function to load releases from Firestore or initialize them if empty
async function initReleasesFromFirestore() {
  try {
    const releasesColRef = collection(db, 'releases');
    const snapshot = await getDocs(releasesColRef);
    if (!snapshot.empty) {
      const cloudReleases: Release[] = [];
      snapshot.forEach(docSnap => {
        cloudReleases.push(docSnap.data() as Release);
      });
      releases = cloudReleases;
      console.log(`[Firestore] Loaded ${releases.length} releases from database.`);
    } else {
      console.log('[Firestore] No releases found in database. Initializing default releases...');
      for (const r of releases) {
        await setDoc(doc(db, 'releases', r.id), r);
      }
    }
    // Ensure initial pc release has isPublished: false if not set or if default
    const pcIndex = releases.findIndex(r => r.platform === 'pc');
    if (pcIndex !== -1 && releases[pcIndex].isPublished === undefined) {
      releases[pcIndex].isPublished = false;
    }
  } catch (err) {
    console.error('[Firestore] Error loading releases from Firestore:', err);
  }
}

// ==========================================
// 1. FULL-STACK API ENDPOINTS
// ==========================================

// AI Risk Generation API (Proxied server-side to hide API key)
app.post('/api/generate-risk', async (req, res) => {
  const { description, method } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Açıklama alanı zorunludur.' });
  }

  try {
    const prompt = `Sen uzman bir İş Sağlığı ve Güvenliği (İSG / OHS) danışmanısın.
Aşağıda belirtilen çalışma senaryosu veya iş faaliyeti için detaylı bir risk değerlendirmesi yap.
Senaryo: "${description}"

Yanıtı sadece geçerli bir JSON olarak döndür. Markdown etiketleri (örn. \`\`\`json) veya başka açıklama metni ekleme. Sadece saf JSON string döndür.
Yöntem: ${method || 'MATRIX_L'} (L Tipi 5x5 Matris)

JSON şeması:
{
  "category": "Kısa ve öz kategori adı (Örn: Yüksekte Çalışma, Elektrik Güvenliği, Kişisel Koruyucu Donanım)",
  "hazard": "Tehlike kaynağı (kısa ve teknik, örn: Korkuluksuz iskele platformu)",
  "risk": "Olası kaza / sonuç (örn: Yüksekten düşme sonucu ağır yaralanma veya can kaybı)",
  "precaution": "Alınması gereken teknik ve idari İSG önlemleri (örneğin: Korkuluk montajı, yaşam hatları, dikey yaşam hattına paraşüt tipi emniyet kemeriyle bağlanma, eğitim ve gözetim)",
  "L": 4, 
  "S": 5
}

Not: L (Olasılık) ve S (Şiddet) değerleri 1 ile 5 arasında tam sayılar olmalıdır.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    // Clean potential markdown wrappers
    const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedData = JSON.parse(cleanJsonText);
      return res.json(parsedData);
    } catch (parseError) {
      console.warn('AI returned invalid JSON, fallback to basic parsing', responseText);
      return res.status(500).json({ 
        error: 'Yapay zeka yanıtı ayrıştırılamadı.',
        rawText: responseText
      });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: 'İSG yapay zeka analizi başarısız oldu.',
      details: error.message 
    });
  }
});

// Contact Support / Mail Sending API (Integrated with real SMTP/Nodemailer and EmailJS fallback)
app.post('/api/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tüm alanları doldurmak zorunludur.' });
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    name,
    email,
    subject,
    message,
    sentAt: new Date().toISOString(),
    status: 'Beklemede'
  };

  messageQueue.unshift(newMessage);

  const smtpConfig = await getSMTPConfig();
  let sentViaSMTP = false;

  if (smtpConfig.active) {
    console.log(`[SMTP Contact Support] Sending email via direct mailer. From: ${name} <${maskEmail(email)}>, Subject: ${subject}`);
    try {
      const htmlContent = getContactHtmlTemplate({ name, email, subject, message });
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: "infoisgpro@gmail.com",
        replyTo: email,
        subject: `[Destek] ${subject}`,
        html: htmlContent
      });
      
      console.log(`[SMTP] İletişim e-postası doğrudan sunucu ile başarıyla gönderildi: ${maskEmail(email)}`);
      sentViaSMTP = true;
      return res.json({ 
        success: true, 
        message: 'Destek talebiniz başarıyla iletildi!',
        data: newMessage
      });
    } catch (smtpError: any) {
      console.error("[SMTP Error] SMTP direct mailer failed, trying EmailJS fallback...", smtpError);
    }
  }

  if (!sentViaSMTP) {
    console.log(`[EmailJS Contact Support] Sending email via fallback. From: ${name} <${maskEmail(email)}>, Subject: ${subject}`);
    const success = await sendEmailViaEmailJS(EMAILJS_CONTACT_TEMPLATE_ID, {
      name: name,
      from_name: name,
      email: email,
      from_email: email,
      reply_to: email,
      to_email: "infoisgpro@gmail.com",
      subject: subject,
      message: message,
      project_name: "İSG Pro"
    });

    if (success) {
      return res.json({
        success: true,
        message: 'Destek talebiniz başarıyla iletildi!',
        data: newMessage
      });
    } else {
      return res.status(500).json({
        error: 'E-posta gönderilemedi.',
        details: 'Hem SMTP hem de yedek e-posta servisi başarısız oldu.'
      });
    }
  }
});

// Proxy endpoint for OTP email
app.post('/api/send-email-otp', async (req, res) => {
  const { email, code, name } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  console.log(`[Email Dispatch] Sending OTP to: ${maskEmail(email)}`);
  const expTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const smtpConfig = await getSMTPConfig();
  let sentViaSMTP = false;

  if (smtpConfig.active) {
    console.log(`[SMTP OTP] Dispatching direct SMTP OTP email to: ${maskEmail(email)}`);
    try {
      const htmlContent = getOTPHtmlTemplate(name || email, code, expTime);
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: email,
        subject: `${code} - İSG Pro Güvenli Giriş Kodunuz`,
        html: htmlContent
      });
      
      console.log(`[SMTP] OTP e-postası doğrudan sunucu ile başarıyla gönderildi: ${maskEmail(email)}`);
      sentViaSMTP = true;
      return res.json({ success: true, method: 'smtp' });
    } catch (smtpError: any) {
      console.error("[SMTP Error] OTP direct mailer failed, trying EmailJS fallback...", smtpError);
    }
  }

  if (!sentViaSMTP) {
    console.log(`[EmailJS OTP] Dispatching EmailJS OTP email to: ${maskEmail(email)}`);
    const success = await sendEmailViaEmailJS(EMAILJS_TEMPLATE_ID, {
      to_email: email,
      email: email,
      to: email,
      to_name: name || email,
      otp_code: code,
      passcode: code,
      time: expTime,
      project_name: "İSG Pro"
    });

    if (success) {
      return res.json({ success: true, method: 'emailjs' });
    } else {
      return res.status(500).json({ error: 'Doğrulama kodu gönderilemedi.', details: 'SMTP ve EmailJS servisleri başarısız oldu.' });
    }
  }
});

// Proxy endpoint for License email
app.post('/api/send-email-license', async (req, res) => {
  const { email, name, licenseKey, planName, planType, price, purchaseDate, expiryDate } = req.body;
  if (!email || !licenseKey) {
    return res.status(400).json({ error: 'Email and licenseKey are required.' });
  }

  console.log(`[Email Dispatch] Sending License Key email to: ${maskEmail(email)}, Plan: ${planName}`);

  const formatDateTR = (dateVal: string) => {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formattedPurchaseDate = formatDateTR(purchaseDate);
  const formattedExpiryDate = formatDateTR(expiryDate);

  const smtpConfig = await getSMTPConfig();
  let sentViaSMTP = false;

  if (smtpConfig.active) {
    console.log(`[SMTP License] Dispatching direct SMTP license email to: ${maskEmail(email)}`);
    try {
      const htmlContent = getLicenseHtmlTemplate({
        name: name || email,
        licenseKey,
        planName,
        planType,
        price,
        purchaseDate: formattedPurchaseDate,
        expiryDate: formattedExpiryDate
      });
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: email,
        subject: `Tebrikler, İSG Pro Lisansınız Hazır!`,
        html: htmlContent
      });
      
      console.log(`[SMTP] Lisans e-postası doğrudan sunucu ile başarıyla gönderildi: ${maskEmail(email)}`);
      sentViaSMTP = true;
      return res.json({ success: true, method: 'smtp' });
    } catch (smtpError: any) {
      console.error("[SMTP Error] License direct mailer failed, trying EmailJS fallback...", smtpError);
    }
  }

  if (!sentViaSMTP) {
    console.log(`[EmailJS License] Dispatching EmailJS license email to: ${maskEmail(email)}`);
    const success = await sendEmailViaEmailJS(EMAILJS_LICENSE_TEMPLATE_ID, {
      to_email: email,
      email: email,
      to: email,
      user_name: name || email,
      licenseKey: licenseKey,
      plan_name: planName,
      plan_type: planType,
      price: price,
      licensePurchasedAt: formattedPurchaseDate,
      licenseExpiresAt: formattedExpiryDate
    });

    if (success) {
      return res.json({ success: true, method: 'emailjs' });
    } else {
      return res.status(500).json({ error: 'Lisans e-postası gönderilemedi.', details: 'SMTP ve EmailJS servisleri başarısız oldu.' });
    }
  }
});

// Shared handler function for approved contracts PDF sending
const handleSendContractsEmail = async (req: express.Request, res: express.Response) => {
  const { email, name, planName, price, orderId, purchaseDate, phone, address, userSignature, customerSignature } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Kayıtlı e-posta adresi zorunludur.' });
  }

  const cleanName = name || 'Değerli İSG Pro Kullanıcısı';
  const cleanPlan = planName || 'Pro Lisans Paketi';
  const cleanPrice = price || '₺2.990,00';
  const cleanOrderId = orderId || `ISG-${Date.now().toString().slice(-6)}`;
  const cleanDate = purchaseDate || new Date().toLocaleString('tr-TR');

  // Lookup signature from request body OR paytrOrders registry fallback OR signaturesByEmail OR globalLatest
  const orderInDb = paytrOrders[cleanOrderId];
  const activeSignature = userSignature || customerSignature || orderInDb?.userSignature || (email ? signaturesByEmail[email.toLowerCase().trim()] : undefined) || globalLatestCustomerSignature;

  if (activeSignature) {
    if (email) signaturesByEmail[email.toLowerCase().trim()] = activeSignature;
    globalLatestCustomerSignature = activeSignature;
  }

  console.log(`[Email Contracts] Sending approved contracts PDF copy to: ${maskEmail(email)} and infoisgpro@gmail.com. Signature present: ${!!activeSignature}`);

  const htmlContent = getContractsApprovalHtmlTemplate({
    customerName: cleanName,
    customerEmail: email,
    customerPhone: phone,
    customerAddress: address,
    planName: cleanPlan,
    price: cleanPrice,
    orderId: cleanOrderId,
    approvalDate: cleanDate
  });

  let pdfAttachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  try {
    pdfAttachments = await generateAllContractsPDFAttachments({
      customerName: cleanName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      orderId: cleanOrderId,
      planName: cleanPlan,
      price: cleanPrice,
      approvalDate: cleanDate,
      customerSignature: activeSignature
    });
  } catch (pdfErr) {
    console.error('[PDF Generation Error]:', pdfErr);
  }

  const recipients = Array.from(new Set([email, 'infoisgpro@gmail.com']));
  const mailAttachments = pdfAttachments;

  const smtpConfig = await getSMTPConfig();
  if (smtpConfig.active) {
    try {
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: recipients,
        subject: `İSG Pro - Onaylanmış Mesafeli Satış ve Hizmet Sözleşmeleri (${cleanOrderId})`,
        html: htmlContent,
        attachments: mailAttachments
      });
      console.log(`[SMTP Contracts] Contract email with PDF sent to ${recipients.join(', ')}`);
      return res.json({ success: true, message: 'Onaylı sözleşme nüshaları PDF olarak başarıyla gönderildi.' });
    } catch (err: any) {
      console.error('[SMTP Contracts Error]:', err);
    }
  }

  // Fallback direct SMTP / Gmail sending
  try {
    const transporter = createDynamicTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      user: process.env.SMTP_USER || "infoisgpro@gmail.com",
      pass: process.env.SMTP_PASS || ""
    });

    await transporter.sendMail({
      from: `"İSG Pro Teknolojileri" <infoisgpro@gmail.com>`,
      to: recipients,
      subject: `İSG Pro - Onaylanmış Mesafeli Satış ve Hizmet Sözleşmeleri (${cleanOrderId})`,
      html: htmlContent,
      attachments: mailAttachments
    });

    return res.json({ success: true, method: 'fallback_smtp', message: 'Sözleşmeler PDF olarak iletildi.' });
  } catch (err: any) {
    console.error('Contract Email Fallback Error:', err);
    return res.status(500).json({ error: 'Sözleşme e-postası gönderilirken hata oluştu.', details: err.message });
  }
};

app.post('/api/send-email-contracts', handleSendContractsEmail);
app.post('/api/send-contracts', handleSendContractsEmail);

// Proxy endpoint for Email Update Link
app.post('/api/send-email-update-link', async (req, res) => {
  const { email, name, updateLink } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi zorunludur.' });
  }

  const cleanName = name || 'Değerli Kullanıcı';
  const host = req.headers.host || 'isgpro.com';
  const cleanLink = updateLink || `https://${host}/#profile`;

  console.log(`[Email Update Link] Dispatching update link email to: ${maskEmail(email)}`);

  const htmlContent = getUpdateEmailHtmlTemplate({
    name: cleanName,
    email: email,
    updateLink: cleanLink
  });

  const smtpConfig = await getSMTPConfig();
  if (smtpConfig.active) {
    try {
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: email,
        subject: `İSG Pro - E-Posta Adresi Güncelleme Bağlantısı`,
        html: htmlContent
      });
      console.log(`[SMTP Email Update] Link sent to ${maskEmail(email)}`);
      return res.json({ success: true, message: 'E-posta güncelleme bağlantısı gönderildi.' });
    } catch (err: any) {
      console.error('[SMTP Email Update Error]:', err);
    }
  }

  return res.json({ success: true, message: 'Güncelleme talebi işleme alındı.' });
});

// Proxy endpoint for Email Verification Code & Link
app.post('/api/send-email-verification', async (req, res) => {
  const { email, name, code, verifyLink } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi zorunludur.' });
  }

  const cleanName = name || 'Değerli Kullanıcı';
  const cleanCode = code || Math.floor(100000 + Math.random() * 900000).toString();
  const host = req.headers.host || 'isgpro.com';
  const cleanLink = verifyLink || `https://${host}/#verify?code=${cleanCode}`;

  console.log(`[Email Verification] Dispatching verification email to: ${maskEmail(email)}`);

  const htmlContent = getVerificationHtmlTemplate({
    name: cleanName,
    email: email,
    code: cleanCode,
    verifyLink: cleanLink
  });

  const smtpConfig = await getSMTPConfig();
  if (smtpConfig.active) {
    try {
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: email,
        subject: `${cleanCode} - İSG Pro E-Posta Adresi Doğrulama Kodunuz`,
        html: htmlContent
      });
      console.log(`[SMTP Verification] Verification email sent to ${maskEmail(email)}`);
      return res.json({ success: true, code: cleanCode, message: 'Doğrulama e-postası gönderildi.' });
    } catch (err: any) {
      console.error('[SMTP Verification Error]:', err);
    }
  }

  return res.json({ success: true, code: cleanCode, message: 'Doğrulama e-postası işlendi.' });
});

// In-memory registry for PayTR transactions with Firestore persistence
interface PaytrOrder {
  merchantOid: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  planId: 'monthly' | 'yearly';
  licenseKey: string;
  userSignature?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: number;
  testMode?: string;
  failedReasonCode?: string;
  failedReasonMsg?: string;
  paymentType?: string;
  currency?: string;
  paymentAmount?: number;
}
const paytrOrders: Record<string, PaytrOrder> = {};

// Helper function to safely fetch PayTR order from memory or Firestore
async function getPaytrOrder(merchantOid: string): Promise<PaytrOrder | null> {
  if (paytrOrders[merchantOid]) {
    return paytrOrders[merchantOid];
  }
  if (db && merchantOid) {
    try {
      const docRef = doc(db, 'paytr_orders', merchantOid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as PaytrOrder;
        paytrOrders[merchantOid] = data;
        return data;
      }
    } catch (e) {
      console.warn(`[PayTR Order Fetch Error] Failed to fetch ${merchantOid} from Firestore:`, e);
    }
  }
  return null;
}

// Satıcı İmza Yönetim API Endpoints
app.get('/api/seller-signature', async (req, res) => {
  try {
    const config = await getSellerConfig();
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(500).json({ error: 'Satıcı imza bilgileri alınamadı.', details: err.message });
  }
});

app.post('/api/seller-signature', async (req, res) => {
  const { name, signature } = req.body;
  try {
    const docRef = doc(db, 'seller_signature', 'default');
    const updated = {
      name: name || 'İbrahim Coşkun',
      signature: signature || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, updated, { merge: true });
    cachedSellerConfig.name = updated.name;
    cachedSellerConfig.signature = updated.signature;
    return res.json({ success: true, message: 'Satıcı imzası başarıyla kaydedildi.', config: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Satıcı imzası kaydedilemedi.', details: err.message });
  }
});

// PayTR Dynamic Config Storage
interface PayTRConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: string;
  customDomain?: string;
}

let cachedPayTRConfig: PayTRConfig = {
  merchantId: process.env.PAYTR_MERCHANT_ID || '',
  merchantKey: process.env.PAYTR_MERCHANT_KEY || '',
  merchantSalt: process.env.PAYTR_MERCHANT_SALT || '',
  testMode: process.env.PAYTR_TEST_MODE || '1',
  customDomain: process.env.PAYTR_CUSTOM_DOMAIN || ''
};

function resolvePublicAppUrl(req: express.Request, customDomain?: string): string {
  if (customDomain && customDomain.trim()) {
    let domain = customDomain.trim();
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = 'https://' + domain;
    }
    return domain.replace(/\/$/, '');
  }

  const rawForwardedHost = (req.headers['x-forwarded-host'] as string || '').split(',')[0].trim();
  const rawHost = (req.headers.host || '').trim();
  let host = rawForwardedHost || rawHost;

  if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
    const referer = (req.headers.referer as string) || (req.headers.origin as string) || '';
    if (referer) {
      try {
        const u = new URL(referer);
        return u.origin;
      } catch (e) {}
    }
    return host ? `http://${host}` : 'http://localhost:3000';
  }

  const protocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'https' : 'https';
  return `${protocol}://${host}`;
}

function getPublicUserIp(req: express.Request): string {
  const forwardedFor = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim();
  const rawIp = forwardedFor || req.socket.remoteAddress || '85.105.1.1';
  let cleanIp = rawIp.replace(/^::ffff:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || !cleanIp) {
    cleanIp = '85.105.1.1';
  }
  return cleanIp;
}

async function getPayTRConfig(): Promise<PayTRConfig> {
  if (db && (!cachedPayTRConfig.merchantId || !cachedPayTRConfig.merchantKey)) {
    try {
      const docRef = doc(db, 'settings', 'paytr');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.merchantId) cachedPayTRConfig.merchantId = data.merchantId;
        if (data.merchantKey) cachedPayTRConfig.merchantKey = data.merchantKey;
        if (data.merchantSalt) cachedPayTRConfig.merchantSalt = data.merchantSalt;
        if (data.testMode !== undefined) cachedPayTRConfig.testMode = String(data.testMode);
        if (data.customDomain !== undefined) cachedPayTRConfig.customDomain = String(data.customDomain);
      }
    } catch (e) {
      console.warn('[PayTR Config] Failed to fetch from Firestore:', e);
    }
  }
  return {
    merchantId: cachedPayTRConfig.merchantId || process.env.PAYTR_MERCHANT_ID || '',
    merchantKey: cachedPayTRConfig.merchantKey || process.env.PAYTR_MERCHANT_KEY || '',
    merchantSalt: cachedPayTRConfig.merchantSalt || process.env.PAYTR_MERCHANT_SALT || '',
    testMode: cachedPayTRConfig.testMode || process.env.PAYTR_TEST_MODE || '1',
    customDomain: cachedPayTRConfig.customDomain || process.env.PAYTR_CUSTOM_DOMAIN || ''
  };
}

// PayTR Config Status Endpoint for Admin Panel
app.get('/api/paytr/config-status', async (req, res) => {
  const config = await getPayTRConfig();
  const isConfigured = !!(config.merchantId && config.merchantKey && config.merchantSalt);
  const publicAppUrl = resolvePublicAppUrl(req, config.customDomain);
  const callbackUrl = `${publicAppUrl}/api/paytr/callback`;

  return res.json({
    configured: isConfigured,
    merchantId: config.merchantId,
    merchantKey: config.merchantKey ? '••••••••••••••••' : '',
    merchantSalt: config.merchantSalt ? '••••••••••••••••' : '',
    testMode: config.testMode,
    customDomain: config.customDomain || '',
    hasKey: !!config.merchantKey,
    hasSalt: !!config.merchantSalt,
    callbackUrl,
    appUrl: publicAppUrl
  });
});

// PayTR Config Save Endpoint for Admin Panel
app.post('/api/paytr/config', async (req, res) => {
  const { merchantId, merchantKey, merchantSalt, testMode, customDomain } = req.body;
  try {
    let finalKey = (merchantKey || '').trim();
    let finalSalt = (merchantSalt || '').trim();

    if (finalKey === '••••••••••••••••' || finalSalt === '••••••••••••••••') {
      const existing = await getPayTRConfig();
      if (finalKey === '••••••••••••••••') {
        finalKey = existing.merchantKey || '';
      }
      if (finalSalt === '••••••••••••••••') {
        finalSalt = existing.merchantSalt || '';
      }
    }

    const updated: PayTRConfig = {
      merchantId: (merchantId || '').trim(),
      merchantKey: finalKey,
      merchantSalt: finalSalt,
      testMode: testMode === '0' ? '0' : '1',
      customDomain: (customDomain || '').trim()
    };

    cachedPayTRConfig = updated;

    if (db) {
      const docRef = doc(db, 'settings', 'paytr');
      await setDoc(docRef, { ...updated, updatedAt: new Date().toISOString() }, { merge: true });
    }

    console.log(`[PayTR Config Updated] Merchant ID: ${updated.merchantId}, Test Mode: ${updated.testMode}`);
    return res.json({
      success: true,
      message: 'PayTR Mağaza SanalPOS bilgileri başarıyla kaydedildi.',
      config: {
        ...updated,
        merchantKey: updated.merchantKey ? '••••••••••••••••' : '',
        merchantSalt: updated.merchantSalt ? '••••••••••••••••' : ''
      }
    });
  } catch (err: any) {
    console.error('[PayTR Config Save Error]', err);
    return res.status(500).json({ error: 'PayTR bilgileri kaydedilemedi.', details: err.message });
  }
});

// Helper function to activate order in Firestore and dispatch license delivery emails
async function activateAndNotifyOrder(merchantOid: string): Promise<boolean> {
  const order = await getPaytrOrder(merchantOid);
  if (!order) {
    console.error(`[Activation Error] Order ${merchantOid} not found in database registry.`);
    return false;
  }

  if (order.status === 'success') {
    console.log(`[Activation] Order ${merchantOid} is already active.`);
    return true;
  }

  order.status = 'success';
  console.log(`[Activation Success] Activating order: ${merchantOid} for ${order.email}`);

  // Persist order status change to Firestore
  if (db && merchantOid) {
    try {
      const orderDocRef = doc(db, 'paytr_orders', merchantOid);
      await setDoc(orderDocRef, { ...order, activatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn(`[Firestore PayTR Order Save Error] ${merchantOid}:`, e);
    }
  }

  // Activate license in DB/Firestore if db exists
  if (db && order.email) {
    try {
      const usernameKey = order.email.toLowerCase().trim();
      const userDocRef = doc(db, 'users', usernameKey);
      const userSnap = await getDoc(userDocRef);

      const purchaseDate = new Date().toISOString();
      const expiryDate = new Date();
      if (order.planId === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      else expiryDate.setMonth(expiryDate.getMonth() + 1);

      const upgradeFields = {
        isPremium: true,
        licenseKey: order.licenseKey,
        licensePurchasedAt: purchaseDate,
        licenseExpiresAt: expiryDate.toISOString(),
        licenseType: order.planId
      };

      if (userSnap.exists()) {
        await setDoc(userDocRef, upgradeFields, { merge: true });
        console.log(`[Firestore] Activated license for user ${usernameKey}`);
      } else {
        // Search through all docs if user is saved under custom username instead of email
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        let foundUsername = '';
        usersSnap.forEach(d => {
          const u = d.data();
          if (u.email && u.email.toLowerCase().trim() === usernameKey) {
            foundUsername = d.id;
          }
        });
        if (foundUsername) {
          await setDoc(doc(db, 'users', foundUsername), upgradeFields, { merge: true });
          console.log(`[Firestore] Activated license for user ${foundUsername} via search`);
        }
      }
    } catch (dbErr) {
      console.error('[Firestore Activation Error]', dbErr);
    }
  }

  // Automatically trigger license key delivery email (SMTP)
  const planName = order.planId === 'yearly' ? 'Yıllık Pro Lisans' : 'Aylık Pro Lisans';
  const planType = order.planId === 'yearly' ? 'Yıllık Premium' : 'Aylık Standart';
  const priceStr = order.planId === 'yearly' ? '₺2.990,00' : '₺299,00';
  const purchaseDateStr = new Date().toLocaleDateString('tr-TR');
  const expiryDateStr = new Date(Date.now() + (order.planId === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR');

  const smtpConfig = await getSMTPConfig();
  let sentViaSMTP = false;

  if (smtpConfig.active) {
    console.log(`[SMTP Activation] Dispatching direct SMTP license email to: ${maskEmail(order.email)}`);
    try {
      const htmlContent = getLicenseHtmlTemplate({
        name: order.name || 'Değerli İSG Pro Kullanıcısı',
        licenseKey: order.licenseKey,
        planName,
        planType,
        price: priceStr,
        purchaseDate: purchaseDateStr,
        expiryDate: expiryDateStr
      });
      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: order.email,
        subject: `Tebrikler, İSG Pro Lisansınız Hazır!`,
        html: htmlContent
      });
      console.log(`[SMTP Activation] License email sent: ${maskEmail(order.email)}`);
      sentViaSMTP = true;
    } catch (smtpError: any) {
      console.error("[SMTP Activation Error] SMTP direct mailer failed, trying EmailJS fallback...", smtpError);
    }

    // Also send approved contracts copy to user and admin email (infoisgpro@gmail.com) with PDF attachment
    try {
      const contractHtml = getContractsApprovalHtmlTemplate({
        customerName: order.name || 'Değerli İSG Pro Kullanıcısı',
        customerEmail: order.email,
        planName,
        price: priceStr,
        orderId: merchantOid,
        approvalDate: purchaseDateStr
      });

      let pdfAttachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
      try {
        pdfAttachments = await generateAllContractsPDFAttachments({
          customerName: order.name || 'Değerli İSG Pro Kullanıcısı',
          customerEmail: order.email,
          customerPhone: order.phone,
          customerAddress: order.address,
          orderId: merchantOid,
          planName,
          price: priceStr,
          approvalDate: purchaseDateStr,
          customerSignature: order.userSignature,
          sellerSignature: '',
          sellerName: 'İbrahim Coşkun'
        });
      } catch (pdfErr) {
        console.error('[PayTR PDF Generation Error]:', pdfErr);
      }

      const transporter = createDynamicTransporter(smtpConfig);
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: `${order.email}, infoisgpro@gmail.com`,
        subject: `İSG Pro Onaylı Mesafeli Satış Sözleşmesi ve Evrakları`,
        html: contractHtml,
        attachments: pdfAttachments
      });
      console.log(`[SMTP Activation] Contracts and PDFs sent: ${maskEmail(order.email)}`);
    } catch (contractErr) {
      console.error('[SMTP Contract Delivery Error]:', contractErr);
    }
  }

  if (!sentViaSMTP) {
    console.log(`[EmailJS Activation] Dispatching license email via fallback to: ${maskEmail(order.email)}`);
    try {
      await sendEmailViaEmailJS(EMAILJS_LICENSE_TEMPLATE_ID, {
        to_email: order.email,
        email: order.email,
        to: order.email,
        user_name: order.name || 'Değerli İSG Pro Kullanıcısı',
        licenseKey: order.licenseKey,
        plan_name: planName,
        plan_type: planType,
        price: priceStr,
        licensePurchasedAt: purchaseDateStr,
        licenseExpiresAt: expiryDateStr
      });
    } catch (emailError) {
      console.error(`[EmailJS Activation Error]`, emailError);
    }
  }

  return true;
}

// Enable CORS and handle Preflight OPTIONS requests for PayTR / payment routes
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (p.includes('paytr') || p.includes('iyzico')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  next();
});

// PayTR step 1: Get secure iframe token from PayTR API (handles multi-route aliases for backward compatibility)
app.all(['/api/paytr/token', '/paytr/token', '/paytr/pay-direct', '/api/paytr/pay-direct', '/iyzico/pay-direct', '/api/iyzico/pay-direct'], async (req, res) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  const { planId, name, email, phone, address, userSignature } = req.body || {};

  if (!planId || !name || !email) {
    return res.status(400).json({ error: 'Plan seçimi, ad soyad ve e-posta zorunludur.' });
  }

  const paytrConfig = await getPayTRConfig();
  const PAYTR_MERCHANT_ID = paytrConfig.merchantId;
  const PAYTR_MERCHANT_KEY = paytrConfig.merchantKey;
  const PAYTR_MERCHANT_SALT = paytrConfig.merchantSalt;
  const test_mode = paytrConfig.testMode || '1';

  const isConfigured = !!(PAYTR_MERCHANT_ID && PAYTR_MERCHANT_KEY && PAYTR_MERCHANT_SALT);

  // Generate a unique order id (MUST be strictly alphanumeric: letters and numbers only, no hyphens/special chars for PayTR)
  const merchantOid = `ISGTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
  
  const chosenPlanType: LicenseType = (planId === 'monthly' || req.body.planType === 'monthly') ? 'monthly' : 'yearly';
  const licenseKey = generateLicenseKey(chosenPlanType);
  await registerGeneratedLicense(licenseKey, chosenPlanType, email);

  const activeSig = userSignature || req.body.customerSignature;
  if (activeSig) {
    if (email) signaturesByEmail[email.toLowerCase().trim()] = activeSig;
    globalLatestCustomerSignature = activeSig;
  }

  // Save order to our registry and Firestore
  paytrOrders[merchantOid] = {
    merchantOid,
    email,
    name,
    phone,
    address,
    planId,
    licenseKey,
    userSignature: activeSig,
    status: 'pending',
    testMode: test_mode,
    createdAt: Date.now()
  };

  if (db) {
    try {
      await setDoc(doc(db, 'paytr_orders', merchantOid), paytrOrders[merchantOid], { merge: true });
    } catch (e) {
      console.warn(`[Firestore Order Save Error] ${merchantOid}:`, e);
    }
  }

  const amountStr = planId === 'yearly' ? '2990.00' : '299.00';
  const paymentAmount = planId === 'yearly' ? 299000 : 29900; // in kuruş (cents)

  // If credentials are not configured, offer a fully functional sandbox demo response
  if (!isConfigured) {
    console.log(`[PayTR Sandbox] Generating dynamic checkout token in sandbox mode for ${maskEmail(email)}`);
    return res.json({
      success: true,
      isDemo: true,
      merchantOid,
      iframeToken: `mock_paytr_token_${Date.now()}`,
      licenseKey,
      amount: amountStr
    });
  }

  try {
    const clean_ip = getPublicUserIp(req);
    
    const user_basket = Buffer.from(JSON.stringify([
      [planId === 'yearly' ? 'Yıllık Pro Lisans' : 'Aylık Pro Lisans', amountStr, '1']
    ])).toString('base64');

    const no_installment = 0; // Set to 1 to disable installment payments
    const max_installment = 0; // Set to 0 to use merchant panel default
    const currency = 'TL';

    const publicUrl = resolvePublicAppUrl(req, paytrConfig.customDomain);
    const merchant_ok_url = `${publicUrl}/api/paytr/success?oid=${merchantOid}`;
    const merchant_fail_url = `${publicUrl}/api/paytr/fail?oid=${merchantOid}`;

    // Signature formula: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
    const hash_str = PAYTR_MERCHANT_ID + clean_ip + merchantOid + email + paymentAmount + user_basket + no_installment + max_installment + currency + test_mode;
    const paytr_token = crypto.createHmac('sha256', PAYTR_MERCHANT_KEY).update(hash_str + PAYTR_MERCHANT_SALT).digest('base64');

    console.log(`[PayTR API Request] Requesting token for order: ${merchantOid}, amount: ${paymentAmount} kuruş, test_mode: ${test_mode}`);

    const paytrParams = new URLSearchParams({
      merchant_id: PAYTR_MERCHANT_ID,
      user_ip: clean_ip,
      merchant_oid: merchantOid,
      email: email,
      payment_amount: paymentAmount.toString(),
      paytr_token: paytr_token,
      user_basket: user_basket,
      debug_on: '1',
      no_installment: no_installment.toString(),
      max_installment: max_installment.toString(),
      user_name: name,
      user_address: address || 'Türkiye',
      user_phone: phone || '05555555555',
      merchant_ok_url: merchant_ok_url,
      merchant_fail_url: merchant_fail_url,
      timeout_limit: '30',
      currency: currency,
      test_mode: test_mode
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: paytrParams
    });

    const rawText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // Fallback for query string format
      const params = new URLSearchParams(rawText);
      if (params.get('iframe_token')) {
        data = { status: 'success', token: params.get('iframe_token') };
      } else {
        data = { status: 'failed', reason: rawText };
      }
    }

    if (data.status === 'success' && data.token) {
      console.log(`[PayTR API Success] Generated checkout token for order: ${merchantOid}`);
      return res.json({
        success: true,
        isDemo: false,
        merchantOid,
        iframeToken: data.token,
        licenseKey,
        amount: amountStr
      });
    } else {
      console.error(`[PayTR API Error] Status: ${data.status}, Reason: ${data.reason || rawText}`);
      return res.status(400).json({
        success: false,
        error: `PayTR Hata: ${data.reason || 'SanalPOS token üretilemedi.'}`,
        rawReason: data.reason || rawText
      });
    }
  } catch (error: any) {
    console.error(`[PayTR Exception]`, error);
    return res.status(500).json({ error: `Sunucu PayTR bağlantı hatası: ${error.message}` });
  }
});

// PayTR step 2: Postback notification callback url (PayTR hits this asynchronously)
app.all(['/api/paytr/callback', '/paytr/callback'], express.urlencoded({ extended: true }), express.json(), async (req, res) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  const merchant_oid = req.body.merchant_oid || req.body.merchantOid;
  const status = req.body.status;
  const total_amount = req.body.total_amount || req.body.totalAmount;
  const hash = req.body.hash;
  const failed_reason_code = req.body.failed_reason_code || req.body.failedReasonCode || '';
  const failed_reason_msg = req.body.failed_reason_msg || req.body.failedReasonMsg || '';
  const test_mode = req.body.test_mode || req.body.testMode || '1';
  const payment_type = req.body.payment_type || req.body.paymentType || 'card';
  const currency = req.body.currency || 'TL';

  console.log(`[PayTR 2. ADIM Callback Webhook] Received for order: ${merchant_oid}, Status: ${status}, TestMode: ${test_mode}, Amount: ${total_amount}`);

  if (!merchant_oid || !status || !hash) {
    console.error('[PayTR 2. ADIM Callback Error] Missing mandatory parameters in POST body.');
    return res.status(400).send('BAD REQUEST');
  }

  const paytrConfig = await getPayTRConfig();
  const PAYTR_MERCHANT_KEY = paytrConfig.merchantKey;
  const PAYTR_MERCHANT_SALT = paytrConfig.merchantSalt;

  if (!PAYTR_MERCHANT_KEY || !PAYTR_MERCHANT_SALT) {
    console.warn(`[PayTR 2. ADIM Callback Webhook] Merchant credentials missing in server config. Accepting callback in sandbox mode.`);
    await activateAndNotifyOrder(merchant_oid);
    return res.send('OK');
  }

  // 2. ADIM Security Signature Formula (Document Specification):
  // merchant_oid + merchant_salt + status + total_amount
  const hash_to_be_hashed = merchant_oid + PAYTR_MERCHANT_SALT + status + total_amount;
  const expected_hash = crypto.createHmac('sha256', PAYTR_MERCHANT_KEY).update(hash_to_be_hashed).digest('base64');

  if (expected_hash !== hash) {
    console.error(`[PayTR 2. ADIM Hash Mismatch] Order: ${merchant_oid}, Expected: ${expected_hash}, Received: ${hash}`);
    return res.status(400).send('PAYTR HASH MISMATCH');
  }

  const order = await getPaytrOrder(merchant_oid);
  if (!order) {
    console.error(`[PayTR 2. ADIM Callback Error] Order ${merchant_oid} not found in database or memory registry.`);
    return res.status(404).send('Order not found');
  }

  // Check Idempotency: If already active, return OK immediately to avoid duplicate processing
  if (order.status === 'success') {
    console.log(`[PayTR 2. ADIM Idempotency] Order ${merchant_oid} is already active. Returning OK.`);
    return res.send('OK');
  }

  // Update transaction metadata
  order.testMode = String(test_mode);
  order.paymentType = String(payment_type);
  order.currency = String(currency);
  order.paymentAmount = Number(total_amount);

  if (status === 'success') {
    console.log(`[PayTR 2. ADIM Payment Approved] Order: ${merchant_oid}, Amount: ${total_amount} kuruş`);
    await activateAndNotifyOrder(merchant_oid);
  } else {
    order.status = 'failed';
    order.failedReasonCode = String(failed_reason_code);
    order.failedReasonMsg = String(failed_reason_msg);

    console.warn(`[PayTR 2. ADIM Payment Rejected] Order: ${merchant_oid}, Code: ${failed_reason_code}, Reason: ${failed_reason_msg}`);

    if (db) {
      try {
        const orderDocRef = doc(db, 'paytr_orders', merchant_oid);
        await setDoc(orderDocRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn(`[Firestore Save Failed Order Error] ${merchant_oid}:`, e);
      }
    }
  }

  // PayTR MANDATORY RESPONSE: Return plain text "OK" ONLY (no HTML, no additional text)
  return res.send('OK');
});

// PayTR Step 2 Test Mode Callback Simulator / Verification Endpoint
app.post('/api/paytr/test-callback', async (req, res) => {
  try {
    const { planId = 'yearly', email = 'test@isgpro.com', name = 'Test Kullanıcı', testStatus = 'success' } = req.body;
    const paytrConfig = await getPayTRConfig();

    const merchantOid = `ISGTEST${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const amountStr = planId === 'yearly' ? '2990.00' : '299.00';
    const totalAmount = planId === 'yearly' ? '299000' : '29900';
    const licenseKey = generateLicenseKey(planId === 'yearly' ? 'yearly' : 'monthly');

    // Register test order
    paytrOrders[merchantOid] = {
      merchantOid,
      email,
      name,
      phone: '05555555555',
      address: 'Test Adresi Istanbul',
      planId: planId as any,
      licenseKey,
      status: 'pending',
      testMode: '1',
      createdAt: Date.now()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'paytr_orders', merchantOid), paytrOrders[merchantOid], { merge: true });
      } catch (e) {}
    }

    const merchantKey = paytrConfig.merchantKey || 'mock_merchant_key';
    const merchantSalt = paytrConfig.merchantSalt || 'mock_merchant_salt';

    // Calculate HMAC-SHA256 signature
    const hashStr = merchantOid + merchantSalt + testStatus + totalAmount;
    const generatedHash = crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');

    // Verify hash match
    const expectedHash = crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');
    const isHashMatched = (expectedHash === generatedHash);

    if (isHashMatched && testStatus === 'success') {
      await activateAndNotifyOrder(merchantOid);
    }

    console.log(`[PayTR 2. ADIM Test Simulator] Simulated test callback for ${merchantOid}. Hash OK: ${isHashMatched}`);

    return res.json({
      success: true,
      message: '2. Aşama (Bildirim URL Callback) test modunda başarıyla doğrulandı!',
      testDetails: {
        merchantOid,
        testMode: '1',
        status: testStatus,
        totalAmount: `${amountStr} TL (${totalAmount} Kuruş)`,
        merchantKeyConfigured: !!paytrConfig.merchantKey,
        merchantSaltConfigured: !!paytrConfig.merchantSalt,
        hashStrFormula: `merchant_oid (${merchantOid}) + merchant_salt + status (${testStatus}) + total_amount (${totalAmount})`,
        calculatedHash: generatedHash,
        hashVerified: isHashMatched,
        expectedResponseText: 'OK',
        orderActivated: isHashMatched && testStatus === 'success',
        licenseKey
      }
    });
  } catch (err: any) {
    console.error('[PayTR 2. ADIM Test Simulator Exception]', err);
    return res.status(500).json({ error: '2. Aşama test çağrısı sırasında hata oluştu.', details: err.message });
  }
});

// PayTR Interactive Demo / Fallback Iframe Endpoint (Serves authentic PayTR BDDK payment screen)
app.all('/api/paytr/demo-iframe', (req, res) => {
  const oid = (req.query.oid || req.body.oid || `ISGTR${Date.now()}`) as string;
  const amount = (req.query.amount || req.body.amount || '299.00') as string;
  const email = (req.query.email || req.body.email || 'musteri@isgpro.com') as string;
  const name = (req.query.name || req.body.name || 'Değerli Müşterimiz') as string;

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PayTR BDDK Lisanslı Güvenli Ödeme</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #f1f5f9; color: #0f172a; padding: 16px; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
        .container { max-width: 540px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 18px 24px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .logo-box { display: flex; align-items: center; gap: 10px; }
        .logo-badge { background: #2563eb; color: white; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
        .sub-logo { font-size: 11px; color: #94a3b8; font-weight: 700; }
        .ssl-badge { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); padding: 5px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; color: #38bdf8; }
        .order-summary { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
        .summary-label { font-size: 12px; color: #64748b; font-weight: 600; }
        .summary-oid { font-size: 11px; font-family: monospace; color: #0f172a; font-weight: 700; }
        .summary-price { font-size: 18px; font-weight: 900; color: #2563eb; }
        .form-body { padding: 24px; }
        .form-group { margin-bottom: 16px; }
        .label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 6px; }
        .input { width: 100%; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-weight: 600; color: #0f172a; outline: none; transition: border-color 0.2s; background: #fff; }
        .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .row { display: flex; gap: 12px; }
        .col { flex: 1; }
        .card-brands { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }
        .brand-pill { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; color: #475569; }
        .btn-pay { width: 100%; background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25); display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 8px; }
        .btn-pay:hover { background: linear-gradient(135deg, #15803d, #166534); transform: translateY(-1px); }
        .btn-pay:active { transform: translateY(0); }
        .footer-notice { text-align: center; margin-top: 18px; font-size: 10.5px; color: #64748b; line-height: 1.4; }
        .bddk-text { font-weight: 700; color: #0f172a; }
        
        /* 3D SECURE OVERLAY */
        .secure-modal { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 99; justify-content: center; align-items: center; padding: 16px; }
        .secure-box { background: white; max-width: 420px; width: 100%; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .bank-header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .bank-title { font-weight: 800; color: #1e3a8a; font-size: 15px; }
        .otp-input { width: 160px; font-size: 24px; font-weight: 800; text-align: center; letter-spacing: 6px; padding: 10px; border: 2px solid #2563eb; border-radius: 8px; margin: 16px 0; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">
            <div class="logo-badge">PayTR</div>
            <div class="sub-logo">BDDK LİSANSLI SANAL POS</div>
          </div>
          <div class="ssl-badge">
            🔒 256-Bit SSL
          </div>
        </div>

        <div class="order-summary">
          <div>
            <div class="summary-label">İSG Pro Lisans Satın Alımı</div>
            <div class="summary-oid">Sipariş ID: ${oid}</div>
          </div>
          <div class="summary-price">${amount} TL</div>
        </div>

        <form id="paymentForm" class="form-body" onsubmit="handlePaySubmit(event)">
          <div class="form-group">
            <label class="label">Kart Üzerindeki İsim</label>
            <input type="text" id="cardName" class="input" required value="${name.replace(/"/g, '&quot;')}" placeholder="Örn: İBRAHİM COŞKUN" />
          </div>

          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label class="label">Kart Numarası</label>
              <div class="card-brands">
                <span class="brand-pill">VISA</span>
                <span class="brand-pill">MC</span>
                <span class="brand-pill">TROY</span>
              </div>
            </div>
            <input type="text" id="cardNumber" class="input" required placeholder="5549 **** **** 1092" maxlength="19" value="5549 1234 5678 9012" oninput="formatCardNum(this)" />
          </div>

          <div class="row">
            <div class="col form-group">
              <label class="label">Son Kullanma (AA/YY)</label>
              <input type="text" id="cardExp" class="input" required placeholder="12/28" maxlength="5" value="12/28" oninput="formatExp(this)" />
            </div>
            <div class="col form-group">
              <label class="label">Güvenlik Kodu (CVC)</label>
              <input type="password" id="cardCvc" class="input" required placeholder="***" maxlength="4" value="842" />
            </div>
          </div>

          <div class="form-group">
            <label class="label">Taksit Seçeneği</label>
            <select class="input" style="background:#f8fafc;">
              <option value="1">Tek Çekim (${amount} TL) - 0% Vade Farkı</option>
            </select>
          </div>

          <button type="submit" class="btn-pay" id="payBtn">
            🔒 3D Secure İle Öde (${amount} TL)
          </button>

          <div class="footer-notice">
            Bu ödeme <span class="bddk-text">BDDK Lisanslı PayTR Ödeme Hizmetleri A.Ş.</span> güvencesi ile 256-Bit SSL şifreli kanalda gerçekleşmektedir. Kart bilgileriniz saklanmaz.
          </div>
        </form>
      </div>

      <!-- 3D SECURE OTP SIMULATION MODAL -->
      <div id="secureModal" class="secure-modal">
        <div class="secure-box">
          <div class="bank-header">
            <span class="bank-title">3D SECURE BANKA DOĞRULAMA</span>
            <span style="font-size:10px; font-weight:700; color:#2563eb;">PAYTR VERIFIED</span>
          </div>
          <p style="font-size:12px; color:#475569; line-height:1.5;">
            Cep telefonunuza gönderilen 6 haneli 3D Secure doğrulama şifresini giriniz.
          </p>
          <div style="font-size:11px; font-weight:700; color:#0f172a; margin-top:8px;">Tutar: ${amount} TL</div>
          
          <input type="text" id="otpCode" class="otp-input" value="123456" maxlength="6" />
          
          <button type="button" class="btn-pay" onclick="confirm3DSecure()" style="margin-top:10px;">
            Ödemeyi Onayla & Tamamla
          </button>
        </div>
      </div>

      <script>
        function formatCardNum(input) {
          let v = input.value.replace(/\\D/g, '').substring(0, 16);
          let parts = [];
          for (let i = 0; i < v.length; i += 4) {
            parts.push(v.substring(i, i + 4));
          }
          input.value = parts.join(' ');
        }
        function formatExp(input) {
          let v = input.value.replace(/\\D/g, '').substring(0, 4);
          if (v.length >= 3) {
            input.value = v.substring(0, 2) + '/' + v.substring(2);
          } else {
            input.value = v;
          }
        }
        function handlePaySubmit(e) {
          e.preventDefault();
          document.getElementById('secureModal').style.display = 'flex';
        }
        function confirm3DSecure() {
          const btn = document.querySelector('#secureModal button');
          btn.innerHTML = '⏳ İşlem Onaylanıyor...';
          btn.disabled = true;
          setTimeout(() => {
            window.location.href = "/api/paytr/success?oid=${encodeURIComponent(oid)}";
          }, 1200);
        }
      </script>
    </body>
    </html>
  `);
});

// PayTR Step 3: Success Iframe Redirect Page (posts message to React parent or redirects main page)
app.all('/api/paytr/success', async (req, res) => {
  const oid = (req.query.oid || req.body.merchant_oid || req.body.oid) as string;
  const order = oid ? paytrOrders[oid] : null;
  const licenseKey = order ? order.licenseKey : 'ISG-PRO-MOCK-LICENSE';

  if (oid) {
    // Process activation immediately in case the callback webhook was blocked/not received (e.g., in localhost testing)
    await activateAndNotifyOrder(oid);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Ödeme Başarılı</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05); text-align: center; max-width: 400px; border: 1px solid #f1f5f9; }
        h1 { color: #10b981; font-size: 24px; margin-bottom: 8px; font-weight: 800; }
        p { font-size: 14px; color: #475569; line-height: 1.5; font-weight: 500; }
        .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 24px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="spinner"></div>
        <h1>Ödeme Başarılı!</h1>
        <p>Aboneliğiniz başarıyla onaylandı. Sayfanıza yönlendiriliyorsunuz, lütfen bekleyin...</p>
      </div>
      <script>
        setTimeout(() => {
          if (window.self === window.top) {
            // Loaded in main window -> redirect to local dashboard with params
            let targetOrigin = window.location.origin;
            if (targetOrigin.includes('localhost') || targetOrigin.includes('127.0.0.1')) {
              targetOrigin = targetOrigin.replace('https://', 'http://');
            }
            window.location.href = targetOrigin + "/?paytr_success=true&license=" + encodeURIComponent(${JSON.stringify(licenseKey)});
          } else {
            // Loaded in iframe -> postMessage to parent React app
            window.parent.postMessage({ 
              type: 'PAYTR_SUCCESS', 
              oid: ${JSON.stringify(oid)}, 
              licenseKey: ${JSON.stringify(licenseKey)} 
            }, '*');
          }
        }, 1500);
      </script>
    </body>
    </html>
  `);
});

// PayTR Step 4: Failure Iframe Redirect Page (posts message to React parent or redirects main page)
app.all('/api/paytr/fail', (req, res) => {
  const oid = (req.query.oid || req.body.merchant_oid || req.body.oid) as string;
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Ödeme Başarısız</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05); text-align: center; max-width: 400px; border: 1px solid #f1f5f9; }
        h1 { color: #ef4444; font-size: 24px; margin-bottom: 8px; font-weight: 800; }
        p { font-size: 14px; color: #475569; line-height: 1.5; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Ödeme Başarısız</h1>
        <p>İşleminiz banka provizyon hatası veya kullanıcı iptali sebebiyle tamamlanamadı. Yönlendiriliyorsunuz...</p>
      </div>
      <script>
        setTimeout(() => {
          if (window.self === window.top) {
            // Redirect to home page with fail parameter
            let targetOrigin = window.location.origin;
            if (targetOrigin.includes('localhost') || targetOrigin.includes('127.0.0.1')) {
              targetOrigin = targetOrigin.replace('https://', 'http://');
            }
            window.location.href = targetOrigin + "/?paytr_fail=true";
          } else {
            window.parent.postMessage({ 
              type: 'PAYTR_FAIL', 
              oid: ${JSON.stringify(oid)} 
            }, '*');
          }
        }, 1500);
      </script>
    </body>
    </html>
  `);
});

// Dynamic SMTP Server Settings (Retrieve, Save & Test)
app.get('/api/smtp-config', async (req, res) => {
  try {
    const config = await getSMTPConfig();
    const safeConfig = {
      ...config,
      pass: config.pass ? '••••••••••••••••' : ''
    };
    return res.json({ success: true, config: safeConfig });
  } catch (err: any) {
    return res.status(500).json({ error: 'SMTP ayarları alınamadı.', details: err.message });
  }
});

app.post('/api/smtp-config', async (req, res) => {
  const { host, port, user, pass, fromName, active } = req.body;
  try {
    const smtpDocRef = doc(db, 'smtp_config', 'default');
    
    // Handle keeping the existing password if they didn't modify it
    let finalPass = pass;
    if (pass === '••••••••••••••••') {
      const existingSnap = await getDoc(smtpDocRef);
      if (existingSnap.exists()) {
        finalPass = existingSnap.data().pass || '';
      }
    }

    await setDoc(smtpDocRef, {
      host,
      port: Number(port),
      user,
      pass: finalPass,
      fromName,
      active: active !== false,
      updatedAt: new Date().toISOString()
    });
    return res.json({ success: true, message: 'SMTP ayarları başarıyla kaydedildi.' });
  } catch (err: any) {
    console.error('[SMTP POST] Error:', err);
    return res.status(500).json({ error: 'SMTP ayarları kaydedilirken hata oluştu.', details: err.message });
  }
});

app.post('/api/smtp-config/test', async (req, res) => {
  const { host, port, user, pass, fromName, testEmail, templateType = 'general' } = req.body;
  if (!testEmail) {
    return res.status(400).json({ error: 'Test alıcı adresi boş olamaz.' });
  }

  let finalPass = pass;
  if (pass === '••••••••••••••••') {
    try {
      const smtpDocRef = doc(db, 'smtp_config', 'default');
      const existingSnap = await getDoc(smtpDocRef);
      if (existingSnap.exists()) {
        finalPass = existingSnap.data().pass || '';
      }
    } catch (err) {
      console.error('[SMTP Test] Error reading existing password:', err);
    }
  }

  const testConfig = {
    host: host || process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(port) || Number(process.env.SMTP_PORT) || 465,
    user: user || process.env.SMTP_USER || "",
    pass: (finalPass || process.env.SMTP_PASS || "").replace(/\s+/g, '')
  };

  if (!testConfig.user || !testConfig.pass) {
    return res.status(400).json({ error: 'E-posta kullanıcısı ve şifresi belirtilmelidir.' });
  }

  console.log(`[SMTP Test] Sending test email (${templateType}) to ${maskEmail(testEmail)} using host ${testConfig.host}:${testConfig.port}`);

  let subject = 'İSG Pro - E-Posta Gönderim Servisi Test Mesajı';
  let html = '';

  let testAttachments: any[] = [];
  let testRecipients: string | string[] = testEmail;

  if (templateType === 'otp') {
    subject = '748291 - İSG Pro Güvenli Giriş Kodunuz';
    const expTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    html = getOTPHtmlTemplate('Test Kullanıcısı', '748291', expTime);
  } else if (templateType === 'license') {
    subject = 'Tebrikler, İSG Pro Lisansınız Hazır!';
    html = getLicenseHtmlTemplate({
      name: 'Test Kullanıcısı',
      licenseKey: 'ISG-PRO-TEST-KEY-748291-2026',
      planName: 'Profesyonel Yıllık Paket',
      planType: 'Premium',
      price: '2.499,00 TL',
      purchaseDate: new Date().toLocaleDateString('tr-TR'),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')
    });
  } else if (templateType === 'contact') {
    subject = '[Destek] Uygulama Kurulumu Hakkında Soru';
    html = getContactHtmlTemplate({
      name: 'Ahmet Yılmaz',
      email: 'ahmetyilmaz@test.com',
      subject: 'Uygulama Kurulumu Hakkında Soru',
      message: 'Merhaba, bu bir test mesajıdır. SMTP sunucusu aracılığıyla gelen destek taleplerinin size nasıl iletildiğini deneyimlemeniz için gönderilmiştir. Harika çalışıyor!'
    });
  } else if (templateType === 'contracts') {
    const testOrderId = `TEST-${Date.now().toString().slice(-6)}`;
    const approvalDate = new Date().toLocaleString('tr-TR');
    subject = `İSG Pro - Onaylanmış Mesafeli Satış ve Hizmet Sözleşmeleri PDF (${testOrderId})`;
    html = getContractsApprovalHtmlTemplate({
      customerName: 'Ahmet Yılmaz (Test)',
      customerEmail: testEmail,
      planName: 'Yıllık Pro Lisans Paketi',
      price: '₺2.990,00',
      orderId: testOrderId,
      approvalDate: approvalDate
    });
    testRecipients = Array.from(new Set([testEmail, 'infoisgpro@gmail.com']));

    try {
      const pdfs = await generateAllContractsPDFAttachments({
        customerName: 'Ahmet Yılmaz (Test)',
        customerEmail: testEmail,
        orderId: testOrderId,
        planName: 'Yıllık Pro Lisans Paketi',
        price: '₺2.990,00',
        approvalDate: approvalDate
      });
      testAttachments.push(...pdfs);
    } catch (pdfErr) {
      console.error('[SMTP Test PDF Generation Error]:', pdfErr);
    }
  } else if (templateType === 'update' || templateType === 'verify' || templateType === 'verification') {
    subject = 'İSG Pro - E-Posta Adresi Doğrulama & Güncelleme Bağlantısı (Test)';
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    html = getEmailVerificationHtmlTemplate({
      name: 'Ahmet Yılmaz (Test)',
      email: testEmail,
      updateUrl: `${protocol}://${host}/?verify-email=${encodeURIComponent(testEmail)}&token=591823`,
      verificationCode: '591823'
    });
  } else {
    // Default general connectivity verification template
    html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 25px;">
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 5px auto;">
              <tr>
                <td style="vertical-align: middle; padding-right: 12px;">
                  <img src="https://i.postimg.cc/fbb8FgR4/Gemini-Generated-Image.png" width="96" height="96" style="vertical-align: middle; border-radius: 20px; display: block;" alt="İSG Pro" />
                </td>
                <td style="vertical-align: middle; text-align: left;">
                  <div style="color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">İSG Pro</div>
                  <div style="color: #4f46e5; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;">YAPAY ZEKA DESTEKLİ</div>
                </td>
              </tr>
            </table>
            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: block; margin-top: 5px;">E-Posta Servis Doğrulama</span>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">Merhaba,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">Bu e-posta, İSG Pro yönetim panelinden gerçekleştirmiş olduğunuz <strong>SMTP sunucu ayarları test işlemi</strong> sonucunda başarıyla gönderilmiştir.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 5px 0; color: #0f172a; font-size: 14px;">Kurulum Başarılı!</h4>
            <p style="margin: 0; font-size: 12px; color: #475569;">E-posta sunucunuz an itibariyle tüm lisans gönderimlerini, kullanıcı giriş şifrelerini (OTP) ve destek mesajlarını otomatik olarak iletmeye hazırdır.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">SMTP Sunucusu (Host)</td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right; font-family: monospace;">${testConfig.host}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Bağlantı Portu</td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right; font-family: monospace;">${testConfig.port}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Güvenlik Modu</td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right;">${testConfig.port === 465 ? 'SSL (Güvenli)' : 'TLS / STARTTLS'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Test Zamanı</td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right;">${new Date().toLocaleString('tr-TR')}</td>
            </tr>
          </table>
          <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; font-size: 11px; text-align: center; color: #94a3b8;">
            Bu e-posta otomatik olarak üretilmiştir. Lütfen doğrudan yanıtlamayınız.
          </div>
        </div>
      `;
  }

  let sentViaSMTP = false;
  let smtpErrorMsg = '';

  try {
    const transporter = createDynamicTransporter(testConfig);
    await transporter.sendMail({
      from: `"${fromName || 'İSG Pro'}" <${testConfig.user}>`,
      to: testRecipients,
      subject: subject,
      html: html,
      attachments: testAttachments
    });

    const maskedRecipients = Array.isArray(testRecipients) ? testRecipients.map(m => maskEmail(m)).join(', ') : maskEmail(testRecipients);
    console.log(`[SMTP Test] Test email successfully delivered to ${maskedRecipients}`);
    sentViaSMTP = true;
    return res.json({ success: true, message: `E-posta başarıyla '${Array.isArray(testRecipients) ? testRecipients.join(' & ') : testRecipients}' adreslerine PDF ekiyle gönderildi.` });
  } catch (err: any) {
    smtpErrorMsg = err?.message || String(err);
    console.error('[SMTP Test Error] SMTP direct test failed, trying EmailJS fallback...', err);
  }

  if (!sentViaSMTP) {
    console.log(`[EmailJS Test] Dispatching EmailJS test email (${templateType}) to ${maskEmail(testEmail)}`);
    
    let targetTemplate = EMAILJS_CONTACT_TEMPLATE_ID;
    let templateParams: any = {};

    if (templateType === 'otp') {
      targetTemplate = EMAILJS_TEMPLATE_ID;
      templateParams = {
        to_email: testEmail,
        email: testEmail,
        to: testEmail,
        to_name: 'Test Kullanıcısı',
        otp_code: '748291',
        passcode: '748291',
        time: '15 dakika',
        project_name: "İSG Pro"
      };
    } else if (templateType === 'license') {
      targetTemplate = EMAILJS_LICENSE_TEMPLATE_ID;
      templateParams = {
        to_email: testEmail,
        email: testEmail,
        to: testEmail,
        user_name: 'Test Kullanıcısı',
        licenseKey: 'ISG-PRO-TEST-KEY-748291-2026',
        plan_name: 'Profesyonel Yıllık Paket',
        plan_type: 'Premium',
        price: '2.499,00 TL',
        licensePurchasedAt: new Date().toLocaleDateString('tr-TR'),
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')
      };
    } else {
      // For general and contact
      targetTemplate = EMAILJS_CONTACT_TEMPLATE_ID;
      templateParams = {
        name: 'Ahmet Yılmaz (Test)',
        from_name: 'Ahmet Yılmaz (Test)',
        email: 'ahmetyilmaz@test.com',
        from_email: 'ahmetyilmaz@test.com',
        reply_to: 'ahmetyilmaz@test.com',
        to_email: testEmail,
        subject: subject,
        message: 'Bu e-posta, İSG Pro yönetim panelinden gerçekleştirmiş olduğunuz test işlemi sonucunda yedek servis aracılığıyla başarıyla gönderilmiştir.',
        project_name: "İSG Pro"
      };
    }

    const success = await sendEmailViaEmailJS(targetTemplate, templateParams);
    if (success) {
      return res.json({ success: true, message: 'E-posta başarıyla gönderildi.' });
    } else {
      return res.status(500).json({
        error: 'E-posta sunucusuna bağlanırken hata oluştu.',
        details: smtpErrorMsg ? `SMTP Hatası: ${smtpErrorMsg}` : 'Hem SMTP hem de yedek e-posta servisi başarısız oldu.'
      });
    }
  }
});


// Fetch simulated inbox messages (for user dashboard to check their sent e-mails)
app.get('/api/my-emails', (req, res) => {
  const { email, role } = req.query;
  
  // Only allow admin to view the entire queue
  if (role === 'admin') {
    return res.json(messageQueue);
  }
  
  if (!email) {
    return res.status(400).json({ error: 'E-posta parametresi zorunludur.' });
  }
  
  const filtered = messageQueue.filter(m => m.email === email);
  return res.json(filtered);
});

// 7-Day Free Trial Request Endpoint (Generates time-stamped trial key & emails user)
app.post('/api/request-trial', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi zorunludur.' });
    }

    const trialRes = await requestTrialLicense(email, name);
    if (!trialRes.success || !trialRes.licenseKey) {
      return res.status(400).json({ success: false, error: trialRes.error });
    }

    const formattedCreated = new Date(trialRes.record?.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formattedExpiry = new Date(trialRes.record?.expiresAt || Date.now() + 7 * 86400000).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send trial key directly to user's email address
    const subject = '🎁 7 Günlük Ücretsiz Deneme Lisansınız Hazır! - İSG Pro';
    const htmlContent = getTrialDeliveryHtmlTemplate({
      name: name || 'Değerli İSG Uzmanı',
      licenseKey: trialRes.licenseKey,
      createdAt: formattedCreated,
      expiryDate: formattedExpiry
    });

    sendEmailDirect(email, subject, htmlContent).catch(e => console.warn('Trial mail send background error:', e));

    return res.json({
      success: true,
      licenseKey: trialRes.licenseKey,
      expiresAt: trialRes.record?.expiresAt,
      createdAt: trialRes.record?.createdAt,
      message: `7 Günlük Ücretsiz Deneme Lisansınız (${trialRes.licenseKey}) başarıyla üretildi ve '${email}' adresinize e-posta olarak iletildi!`
    });
  } catch (err: any) {
    console.error('[Request Trial Error]', err);
    return res.status(500).json({ success: false, error: 'Ücretsiz deneme lisansı oluşturulurken hata oluştu.' });
  }
});

// Trial Expiry Reminder Scanner Function (Scans trials and sends "1 Day Remaining" email)
async function checkAndSendTrialExpiryReminders(): Promise<{ checked: number; sent: number }> {
  console.log('[Trial Expiry Reminder Check] Scanning 7-day trial licenses...');
  const nowMs = Date.now();
  const THIRTY_SIX_HOURS_MS = 36 * 60 * 60 * 1000;
  let checked = 0;
  let sent = 0;

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'trial_requests'));
      checked = snap.size;

      for (const tDoc of snap.docs) {
        const data = tDoc.data();
        if (!data || data.reminderSent === true) continue;

        const expiresAtMs = new Date(data.expiresAt || 0).getTime();
        const diffMs = expiresAtMs - nowMs;

        // If trial expires within 36 hours (approx. 1 day before expiration) and hasn't expired yet
        if (diffMs > 0 && diffMs <= THIRTY_SIX_HOURS_MS) {
          const userEmail = data.email;
          const userName = data.name || 'Değerli İSG Uzmanı';
          const formattedExpiry = new Date(expiresAtMs).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          console.log(`[Trial Expiry Reminder] Sending 1-day reminder email to ${userEmail} (expires: ${formattedExpiry})`);
          const subject = '⏰ 7 Günlük Ücretsiz Deneme Sürümünüz Yarın Sona Eriyor! Pro Plana Yükseltin';
          const html = getTrialExpiryReminderHtmlTemplate({
            name: userName,
            email: userEmail,
            expiryDate: formattedExpiry
          });

          const mailSuccess = await sendEmailDirect(userEmail, subject, html);
          sent++;

          // Mark reminderSent in Firestore
          try {
            await setDoc(doc(db, 'trial_requests', userEmail), {
              reminderSent: true,
              reminderSentAt: new Date().toISOString(),
              reminderDeliverySuccess: mailSuccess
            }, { merge: true });
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('[Trial Expiry Reminder Check Error]', err);
    }
  }

  return { checked, sent };
}

// Endpoint to trigger or test trial expiry reminders
app.post('/api/check-trial-reminders', async (req, res) => {
  try {
    const result = await checkAndSendTrialExpiryReminders();
    return res.json({
      success: true,
      message: `${result.checked} adet deneme lisansı tarandı, ${result.sent} kullanıcıya 1 gün önceden bitiş hatırlatma e-postası gönderildi.`,
      result
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Manual License Activation Endpoint
app.post('/api/activate-license', async (req, res) => {
  try {
    const { licenseKey, email, username } = req.body;
    if (!licenseKey || typeof licenseKey !== 'string') {
      return res.status(400).json({ success: false, error: 'Lütfen e-posta ile tarafınıza iletilen lisans kodunu giriniz.' });
    }

    const val = await validateLicenseAgainstDb(licenseKey, email);

    if (!val.valid || !val.record) {
      return res.status(400).json({
        success: false,
        error: val.error || 'Girilen lisans kodu sistemde bulunamadı veya geçerlilik süresi dolmuştur.'
      });
    }

    const record = val.record;

    // Mark as used in Firestore if db is available
    if (db) {
      try {
        const docRef = doc(db, 'generated_licenses', record.licenseKey);
        await setDoc(docRef, {
          used: true,
          usedByEmail: email || username || 'activated_user',
          usedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Error marking license used in Firestore:', e);
      }
    }

    console.log(`[Manual License Activation] User ${email || username || 'Guest'} activated ${record.licenseType} key: ${record.licenseKey}`);

    const planLabel = record.licenseType === 'trial'
      ? '7 Günlük Ücretsiz Deneme Lisansı'
      : record.licenseType === 'monthly'
      ? 'Aylık Pro Lisans (1 Ay)'
      : record.licenseType === 'demo'
      ? '10 Dakikalık Test Lisansı'
      : 'Yıllık Pro Lisans (1 Yıl)';

    return res.json({
      success: true,
      licenseKey: record.licenseKey,
      licenseType: record.licenseType,
      licensePurchasedAt: record.createdAt,
      licenseExpiresAt: record.expiresAt,
      message: `Tebrikler! ${planLabel} kodunuz doğrulandı ve Premium hesabınız etkinleştirildi!`
    });
  } catch (err: any) {
    console.error('[Manual License Activation Error]', err);
    return res.status(500).json({ success: false, error: 'Lisans etkinleştirme işlemi sırasında hata oluştu.' });
  }
});

// Fetch all active application releases (excludes heavy base64 fileData to save bandwidth)
app.get('/api/releases', (req, res) => {
  const sanitized = releases.map(({ fileData, ...rest }) => ({
    ...rest,
    hasFileData: !!fileData
  }));
  return res.json(sanitized);
});

// Create/Update a release with custom file data
app.post('/api/releases', async (req, res) => {
  const { platform, version, releaseNotes, fileSize, fileName, fileData, downloadType, downloadUrl, isPublished, showDownloadLinkBox } = req.body;
  if (!platform || !version) {
    return res.status(400).json({ error: 'Platform ve sürüm bilgisi zorunludur.' });
  }

  const index = releases.findIndex(r => r.platform === platform);
  const updatedRelease: Release = {
    id: platform,
    platform: platform as 'pc' | 'apk',
    version,
    releaseNotes: releaseNotes || '',
    fileSize: fileSize || '0 MB',
    fileName: fileName || (platform === 'pc' ? 'isgpro_setup.exe' : 'isgpro_v1.apk'),
    updatedAt: new Date().toISOString(),
    downloadsCount: index !== -1 ? releases[index].downloadsCount : 0,
    fileData: fileData || (index !== -1 ? releases[index].fileData : undefined),
    downloadType: downloadType || 'file',
    downloadUrl: downloadUrl || '',
    isPublished: isPublished !== undefined ? isPublished : true,
    showDownloadLinkBox: showDownloadLinkBox !== undefined ? showDownloadLinkBox : true
  };

  if (index !== -1) {
    releases[index] = updatedRelease;
  } else {
    releases.push(updatedRelease);
  }

  try {
    await setDoc(doc(db, 'releases', platform), updatedRelease);
  } catch (err) {
    console.error('[Firestore] Error saving release:', err);
  }

  return res.json({ success: true, release: { ...updatedRelease, fileData: undefined } });
});

// Endpoint to quickly toggle isPublished or showDownloadLinkBox status
app.post('/api/releases/toggle-setting/:platform', async (req, res) => {
  const { platform } = req.params;
  const { field, value } = req.body; // field can be 'isPublished' or 'showDownloadLinkBox'
  
  const release = releases.find(r => r.platform === platform);
  if (!release) {
    return res.status(404).json({ error: 'Release not found' });
  }

  if (field === 'isPublished') {
    release.isPublished = value !== undefined ? value : !release.isPublished;
  } else if (field === 'showDownloadLinkBox') {
    release.showDownloadLinkBox = value !== undefined ? value : !release.showDownloadLinkBox;
  }

  release.updatedAt = new Date().toISOString();

  try {
    await setDoc(doc(db, 'releases', platform), { [field]: release[field as keyof Release], updatedAt: release.updatedAt }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error updating release setting:', err);
  }

  return res.json({ success: true, release: { ...release, fileData: undefined } });
});

// Explicit real-time download counter tracking endpoint
app.post('/api/releases/track-download/:platform', async (req, res) => {
  const { platform } = req.params;
  const release = releases.find(r => r.platform === platform);
  if (!release) {
    return res.status(404).json({ error: 'Release not found' });
  }
  release.downloadsCount = (release.downloadsCount || 0) + 1;

  try {
    await setDoc(doc(db, 'releases', platform), { downloadsCount: release.downloadsCount, updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`[Firestore] Download count incremented for ${platform}: ${release.downloadsCount}`);
  } catch (err) {
    console.error('[Firestore] Error updating release download count:', err);
  }

  return res.json({ success: true, downloadsCount: release.downloadsCount });
});

// Stream or download release binary package
app.get('/api/releases/download/:platform', async (req, res) => {
  const { platform } = req.params;
  const release = releases.find(r => r.platform === platform);
  if (!release) {
    return res.status(404).send('Release not found');
  }
  release.downloadsCount += 1;

  try {
    await setDoc(doc(db, 'releases', platform), release, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error updating release download count:', err);
  }

  // Redirect to external Google Drive / link if downloadType is set to 'link'
  if (release.downloadType === 'link' && release.downloadUrl) {
    return res.redirect(release.downloadUrl);
  }

  // Stream custom uploaded binary file if downloadType is 'file'
  if (release.fileData) {
    try {
      const base64Data = release.fileData.split(';base64,').pop() || release.fileData;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', platform === 'pc' ? 'application/octet-stream' : 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${release.fileName}"`);
      return res.send(fileBuffer);
    } catch (err) {
      console.error('Error serving custom file buffer:', err);
    }
  }

  // Default fallback if downloadType is 'file' but no fileData is uploaded yet
  if (platform === 'apk') {
    return res.redirect('https://drive.google.com/file/d/1HWSxVBGdkboC5NY0n3hiSbd3bZ_RHGY5/view?usp=sharing');
  }

  // Fallback beautiful setup info text file
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${release.fileName}.txt"`);
  res.send(`İSG Pro Yapay Zeka Destekli Platform - ${platform.toUpperCase()} Kurulum Dosyası
============================================================
Sürüm: v${release.version}
Dosya Adı: ${release.fileName}
Platform: ${platform === 'pc' ? 'Windows Desktop Client' : 'Android Mobile Sürümü'}
Güncelleme Tarihi: ${release.updatedAt}

Not: Bu dosya, sistem yöneticisi tarafından panele yüklenen gerçek uygulama paketinin simülasyonudur.
Eğer yönetici kendi özel .exe/.apk dosyasını yüklediyse, o dosya doğrudan buraya inecektir.

Kurulum Talimatları:
1. Kurulumu başlatmak için indirilen dosyayı çalıştırın.
2. Karşınıza çıkan pencerelerde "İleri" ve "Yükle" adımlarını takip edin.
3. Uygulama açıldığında hesabınızla giriş yaparak kullanmaya başlayın.`);
});

// ==========================================
// 1.5. API CATCH-ALL (Prevents HTML fallback / JSON parse errors)
// ==========================================
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'İstenen API rotası bulunamadı veya geçersiz istek yöntemi kullanıldı.',
    method: req.method,
    path: req.path
  });
});

// ==========================================
// 2. VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  // Sync/Load application releases from Firestore asynchronously to prevent startup blockages
  initReleasesFromFirestore().catch(err => {
    console.error('[Firestore] Background loading failed:', err);
  });

  // Check 7-day trial expirations and send 1-day reminder emails
  checkAndSendTrialExpiryReminders().catch(err => {
    console.error('[Trial Reminder Check] Startup check failed:', err);
  });
  // Recurring check every 30 minutes
  setInterval(() => {
    checkAndSendTrialExpiryReminders().catch(err => console.error('[Trial Reminder Check] Interval check failed:', err));
  }, 30 * 60 * 1000);

  const isProduction = process.env.NODE_ENV === 'production' || (typeof __filename !== 'undefined' ? !__filename.endsWith('.ts') : true);
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running successfully on http://localhost:${PORT}`);
  });

  // Secondary Port 5001 listener (only in development)
  if (process.env.NODE_ENV !== 'production' && String(PORT) !== '5001') {
    try {
      const server5001 = app.listen(5001, '0.0.0.0', () => {
        console.log(`[SERVER] Secondary Port 5001 listener active on http://localhost:5001`);
      });
      server5001.on('error', (err: any) => {
        if (err.code !== 'EADDRINUSE') {
          console.warn('[SERVER] Port 5001 listener note:', err.message);
        }
      });
    } catch (e) {
      console.warn('[SERVER] Could not bind port 5001:', e);
    }
  }
}

startServer();
