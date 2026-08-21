# İSG Pro - Yapay Zeka Destekli İSG Yönetim Portalı

Bu proje, React + Vite arayüzü ve Express/Node.js Serverless API arka ucunu birleştiren tam teşekküllü bir İş Sağlığı ve Güvenliği (İSG) yönetim ve lisanslama platformudur.

Proje hem **Vercel Serverless**, hem **Render / Docker**, hem de yerel (**Localhost**) ortamlarda %100 uyumlu çalışacak şekilde yapılandırılmıştır.

---

## 🚀 Vercel Üzerinde Yayına Alma (Deployment Rehberi)

### 1. Adım: Projeyi GitHub'a Yükleyin & Vercel'e Bağlayın
1. Projenizi GitHub reponuza push edin.
2. [Vercel Dashboard](https://vercel.com/dashboard) sayfasına gidin ve **"Add New... -> Project"** butonuna tıklayın.
3. GitHub reponuzu seçin.

### 2. Adım: Framework ve Derleme Ayarları
Vercel otomatik olarak yapılandırmayı algılayacaktır (`vercel.json` projenin kök dizinindedir):
- **Framework Preset:** `Vite`
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3. Adım: Çevresel Değişkenleri (Environment Variables) Ekleyin
Vercel proje ayarlarında (**Settings -> Environment Variables**) aşağıdaki anahtarları tanımlayın:

| Değişken Adı | Açıklama | Örnek Değer |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yapay Zeka analiz motoru için zorunlu | `AIzaSy...` |
| `PAYTR_MERCHANT_ID` | PayTR Mağaza Numarası | `123456` |
| `PAYTR_MERCHANT_KEY` | PayTR Mağaza Anahtarı | `xxxxxx` |
| `PAYTR_MERCHANT_SALT` | PayTR Mağaza Gizli Tuzu | `xxxxxx` |
| `PAYTR_TEST_MODE` | 1: Test Modu, 0: Canlı Mod | `1` veya `0` |
| `SMTP_USER` | E-posta gönderen adres | `infoisgpro@gmail.com` |
| `SMTP_PASS` | Gmail 16 Haneli Uygulama Şifresi | `xxxx xxxx xxxx xxxx` |
| `SMTP_HOST` | SMTP Sunucusu (Varsayılan: smtp.gmail.com) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Portu (465 SSL veya 587 STARTTLS) | `465` |
| `SMTP_FROM_NAME` | Gönderici Başlığı | `İSG Pro` |

> [!TIP]
> `APP_URL` değişkenini girmenize gerek yoktur; Vercel projenizin domain adresini (`https://...vercel.app`) otomatik algılar ve PayTR callback/yönlendirme bağlantılarına otomatik ekler. Özel bir domain bağladıysanız isteğe bağlı olarak `APP_URL` veya `PAYTR_CUSTOM_DOMAIN` girebilirsiniz.

### 4. Adım: PayTR Mağaza Panelinde Bildirim URL Ayarı
PayTR Mağaza Panelinize girip **Ayarlar -> Bilgi -> Bildirim URL (Callback URL)** alanına şu adresi ekleyin:
```
https://PROJE-ADINIZ.vercel.app/api/paytr/callback
```
*(veya özel alan adınız: `https://isgpro.com/api/paytr/callback`)*

---

## 💻 Yerel Geliştirme (Local Development)

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env.example` dosyasını `.env` olarak kopyalayıp değişkenlerinizi girin:
   ```bash
   cp .env.example .env
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   Uygulama `http://localhost:3000` üzerinde açılacaktır.

4. Derleme & Tip Kontrolü:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🛠️ Mimari ve Fonksiyon Özellikleri

- **PayTR 3-Adımlı SanalPOS Entegrasyonu:**
  - Token üretimi (`/api/paytr/token`)
  - Güvenli iFrame ödeme ekranı ve Demo Simülatörü (`/api/paytr/demo-iframe`)
  - Webhook POST Callback bildirimi (`/api/paytr/callback` - HMAC SHA256 doğrulaması)
  - Otomatik lisans üretimi ve Firestore senkronizasyonu
- **SMTP & PDF Sözleşme Gönderimi:**
  - Satın alma sonrası otomatik 6 adet resmi PDF sözleşme nüshası üretimi (Mesafeli Satış, Ön Bilgilendirme, İade, KVKK, Gizlilik, Teslimat)
  - Müşteri ve Satıcı dijital ıslak imzalı PDF çıktısı
  - Otomatik Gmail Port 465 (SSL) / 587 (STARTTLS) ve REST API yedeklemeleri
- **Yapay Zeka Risk Analizi:**
  - Google Gemini 2.5 Flash ile otomatik Fine-Kinney ve L Tipi 5x5 matris risk raporlaması
- **Vercel Cron:**
  - 7 günlük deneme süresi bitişine 24 saat kala kullanıcılara otomatik e-posta hatırlatması
