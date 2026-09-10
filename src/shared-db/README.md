# İSG Pro Master Ortak Yönetim Merkezi (v2.0)

Bu klasör, bilgisayarınızda yer alan **`isgpro11.01-main`** ve **`isg-projesi - Copy`** projelerinin tüm yönetimini (Kullanıcılar, Lisanslar, OSGB'ler, PayTR, SMTP ve Yedekleme) tek bir çatı altında toplayan Master Yönetim Merkezidir.

---

## 🚀 Hızlı Başlangıç

1. **Görsel Paneli Açmak İçin:**
   - Bu klasörde yer alan **`yonetim-paneli.bat`** veya **`yonetim-paneli.html`** dosyasına çift tıklayın.
   - Tarayıcınızda modern, lüks bir yönetici kontrol istasyonu açılacaktır.

---

## 🎛️ Yönetilebilir 6 Temel Modül

### 1. 👥 Kullanıcı Yönetimi
- İki projedeki tüm kullanıcıları tek listede görün.
- İsim, kullanıcı adı, e-posta veya telefon ile anlık arama yapın.
- Yeni kullanıcı ekleyin (İSG Uzmanı, İşyeri Hekimi, Yönetici).
- Kullanıcıya anında lisans tanımlayın veya silin.
- Kullanıcıları tek tıkla Excel (.csv) olarak indirin.

### 2. 🔑 Lisanslar & Deneme Sürümü
- Tek tıkla lisans üretin:
  - ⚡ **7 Günlük Deneme Lisansı** (`ISG-T-...`)
  - 💼 **Aylık Pro Lisans** (`ISG-M-...`)
  - 👑 **Yıllık Pro Lisans** (`ISG-Y-...`)
  - 🧪 **Demo Test Lisansı** (`ISG-D-...`)
- Sistemdeki lisansları listeleyin, kalan günlerini görün ve süresi bitenlere **+30 Gün** uzatma tanımlayın.
- Her iki projede de doğrudan geçerlidir.

### 3. 🏢 OSGB & Personel Yönetimi
- OSGB firmalarını, iletişim bilgilerini ve sicil numaralarını listeleyin.
- OSGB kadrolarına yetkili uzman ve hekim personeli atayın.
- Çoklu OSGB çalışma lisansı yetkisini açıp kapatın.

### 4. 💳 PayTR Ödeme & Fatura Yapılandırması
- Mağaza No (Merchant ID), Parola (Merchant Key), Gizli Anahtar (Merchant Salt).
- Test Modu / Canlı Mod geçişi.
- Aylık (299 TL) ve Yıllık (2.990 TL) paket fiyatlarını tek yerden güncelleyin.

### 5. 📧 SMTP E-Posta Sunucusu
- Lisans teslimatı ve aktivasyon e-postaları için SMTP sunucusu ayarları.
- Host, Port (465/587), SSL/TLS, E-Posta ve Uygulama Parolası.
- Gönderici başlığını özelleştirin.

### 6. 💾 Canlı Veritabanı & Yedekleme (Backup)
- Tek tıkla tüm kullanıcıları, lisansları ve ayarları içeren **Tam JSON Yedeği** indirin.
- İndirdiğiniz yedekleri tek tıkla sisteme geri yükleyin (Restore).

---

## 🔗 Sanal Dizin Bağı (Directory Junction) Mimarisi

Bu klasör Windows NTFS Junction bağı ile doğrudan her iki projenin içine bağlanmıştır:
- `isgpro11.01-main\src\shared-db` ➡️ `isg-ortak-veritabani`
- `isg-projesi - Copy\src\shared-db` ➡️ `isg-ortak-veritabani`

> **Önemli:** Burada değiştirdiğiniz her ayar, her iki projede de anında canlı olarak uygulanır. Asla manuel kopyalama yapmanız gerekmez!
