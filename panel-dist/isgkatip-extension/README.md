# İSGPRO İSG-KATİP Akıllı Asistanı (v5.5.0)

Paylaştığınız `content.js` ve `injected.js` (v4.1) temel dosyaları üzerine inşa edilmiş, tam paket Chrome Eklentisi (Manifest V3).

## Eklenen Yeni Özellikler (v4.1 -> v5.5.0)
1. **Seçilen Sözleşmeleri "İşlemler > Detay Görüntüle" ile Toplu İndirme**:
   - Hem firma bazlı hem de tekil sözleşme (Uzman, Hekim, DSP ayrı ayrı) seçimi yapılabilir.
   - `handleBulkDownloadSelectedContractsViaDetail` fonksiyonu seçilen her sözleşmenin tablo satırındaki **İşlemler > Detay Görüntüle** menüsünü otomatik açar, açılan modal ve API detay verilerini okur, resmi formatta sözleşme detay belgesini ve toplu JSON paketini indirir.
2. **Tüm Sayfaları Eksiksiz Çekme (Örn: Sayfa 1: 100 + Sayfa 2: 74 = 174 Sözleşme)**:
   - Hem `injected.js` içerisinde çoklu sayfa API döngüsü hem de `content.js` içerisinde PrimeNG sayfalama gezgini birleştirilerek tüm sayfalardaki sözleşmeler tek listede toplanır.
3. **Sözleşme Statü Sütunu Doğrulaması**:
   - **Devam Eden Sözleşmeler**: Sadece statü sütununda **"Sözleşme Devam Ediyor"** yer alan kayıtları alır.
   - **Onay Bekleyen Sözleşmeler**: Sadece statü sütununda **"Sözleşme Teklif Durumunda"** (veya onay bekliyor) yer alan kayıtları alır.
4. **Uzman, Hekim ve DSP Toplam Sözleşme Sayısı + Firma Sayısı Gösterimi**:
   - Sekme ve özet çubuğunda hem toplam sözleşme adedi hem de firma adedi birlikte gösterilir.
