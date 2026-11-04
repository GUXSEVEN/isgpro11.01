# İSGPRO — İSG-KATİP Akıllı Tarayıcı Botu & Eklentisi (Manifest V3)

Bu Google Chrome eklentisi, T.C. Çalışma ve Sosyal Güvenlik Bakanlığı **İSG-KATİP** (İş Sağlığı ve Güvenliği Kayıt, Takip ve İzleme Programı) sistemi ile **İSGPRO** uygulaması arasında çift yönlü otomatik veri köprüsü kurar ve rutin işlemleri otomatikleştirir.

---

## 🚀 Başlıca Yetenekler

1. **🏢 Firma ve Çalışan Bilgilerini Tek Tıkla Çekme:**
   - İSG-KATİP'te açık olan firmanın unvanını, SGK sicil numarasını, NACE kodunu ve tehlike sınıfını otomatik okur.
   - Sayfadaki kayıtlı personelleri (TC Kimlik No, Ad Soyad, Görev vb.) tek tıkla listeleyip İSGPRO formatında dışa aktarır.
2. **⚡ Toplu Sözleşme Onaylama Botu:**
   - Onay bekleyen İSG Uzmanı / İşyeri Hekimi sözleşmelerini tespit eder.
   - Sayfadaki onay butonlarına ve açılan onay onaylama diyaloglarına (modal pencerelere) sırayla, güvenli zaman aralıklarıyla tıklar.
3. **📑 Toplu Sözleşme / Evrak İndirme (PDF):**
   - Sayfada listelenen tüm sözleşmelerin PDF dosyalarını sırayla ve çakışma olmaksızın bilgisayarınıza kaydeder.
4. **🤖 Sayfa İçi Canlı Bot Widget'ı:**
   - İSG-KATİP sayfasına girdiğinizde sağ alt köşede otomatik olarak belirir; sekmeler arası geçiş yapmadan doğrudan sayfadan işlem yapmanızı sağlar.

---

## 🛠️ Google Chrome'a Nasıl Yüklenir? (1 Dakikada Kurulum)

1. **Google Chrome'u** açın.
2. Adres çubuğuna şu adresi yazıp Enter'a basın:
   ```text
   chrome://extensions/
   ```
3. Sağ üst köşedeki **"Geliştirici modu"** (Developer mode) anahtarını **AÇIK** konuma getirin.
4. Sol üstte beliren **"Paketlenmemiş öge yükle"** (Load unpacked) butonuna tıklayın.
5. Açılan pencerede bu klasörü seçin:
   ```text
   C:\Users\İBRAHİM\Desktop\isg-katip-eklentisi
   ```
6. Tebrikler! Eklenti yüklendi. Artık tarayıcınızın uzantılar menüsünde (yapboz parçası simgesi) **İSGPRO Katip Botu**'nu görebilirsiniz.

---

## 📖 Nasıl Kullanılır?

1. **İSG-KATİP** portalına (`https://isgkatip.csgb.gov.tr`) e-Devlet ile giriş yapın.
2. Sağ alt köşede beliren mavi **"🤖 İSGPRO Katip Botu"** düğmesine tıklayın.
3. Yapmak istediğiniz işlemi seçin:
   - **"🔍 Bilgileri Tara":** Ekrana gelen firma ve çalışanları okur.
   - **"📥 İSGPRO'ya Aktar":** Verileri JSON olarak indirir veya panoya kopyalar; İSGPRO panelinde İSG-KATİP sekmesinden "İçe Aktar" diyerek tek tıkla firmanıza ve İK çalışan listenize aktarabilirsiniz.
   - **"✓ Bekleyen Sözleşmeleri Onayla":** Açık sayfadaki tüm sözleşmeleri sırayla otomatik onaylar.
   - **"⬇️ Tüm Sözleşmeleri İndir":** Belgeleri sırayla PDF olarak indirir.
