const fs = require('fs');

const filePath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\views\\CertificateVerificationView.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = `      {/* ========================================================================= */}
      {/* NO-PRINT: RESMİ DOĞRULAMA KARTI & ÖZET BİLGİ PANELİ */}`;
const endMarker = `      {/* Yazdırma ve Scroll CSS Stilleri */}`;

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker, sIdx);

if (sIdx === -1 || eIdx === -1) {
  console.error('Markers not found!', { sIdx, eIdx });
  process.exit(1);
}

const newBody = `      {/* ========================================================================= */}
      {/* ANA İÇERİK ALANI: SOLDA DOĞRULAMA PANELİ (PC) / ÜSTTE KOMPAKT ÖZET (MOBİL) & ORTADA BELGE */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col lg:flex-row items-start gap-5 lg:gap-6 pb-24">

        {/* ───────────────────────────────────────────────────────────────────────── */}
        {/* SOL PANEL (PC: Sticky Sidebar | Mobil: Kompakt Özet & Açılır Detay)     */}
        {/* ───────────────────────────────────────────────────────────────────────── */}
        <aside className="no-print w-full lg:w-[350px] xl:w-[380px] shrink-0 lg:sticky lg:top-20 space-y-3">
          <div className="bg-gradient-to-br from-emerald-950/75 via-slate-900 to-slate-950 border-2 border-emerald-500/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <ShieldCheck size={170} className="text-emerald-400" />
            </div>

            {/* Üst Doğrulama Başlığı */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl shrink-0">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Resmi ve Geçerli Belge
                </span>
                <h1 className="text-sm sm:text-base font-black text-white mt-1 leading-snug">
                  İSG Eğitim Sertifikası Doğrulandı
                </h1>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Sorgu: {verifiedAt}
                </span>
              </div>
            </div>

            {/* Hızlı Özet (Mobilde her zaman görünür, az yer kaplar) */}
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-1 gap-2 text-xs relative z-10">
              <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[9.5px] block font-bold uppercase">Sertifika Sahibi</span>
                <strong className="text-white text-xs sm:text-sm block truncate mt-0.5">{certData.participantName}</strong>
                <span className="text-[10px] text-slate-400 font-mono">{certData.participantTc ? \`T.C.: \${certData.participantTc}\` : 'T.C. Kayıtlı'}</span>
              </div>

              <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[9.5px] block font-bold uppercase">Geçerlilik Durumu</span>
                <strong className={\`text-xs sm:text-sm block mt-0.5 font-black \${validityStatus.isExpired ? 'text-rose-400' : 'text-emerald-400'}\`}>
                  {validityStatus.text}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">Bitiş: {certData.expiryDate || '-'}</span>
              </div>
            </div>

            {/* Mobil Detay Aç/Kapat Butonu */}
            <button
              type="button"
              onClick={() => setShowMobileDetails(prev => !prev)}
              className="lg:hidden mt-3 w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer relative z-10"
            >
              {showMobileDetails ? (
                <>
                  <ChevronUp size={15} />
                  <span>Doğrulama Detaylarını Gizle</span>
                </>
              ) : (
                <>
                  <ChevronDown size={15} />
                  <span>İşyeri, Süre & Karekod Detaylarını Gör</span>
                </>
              )}
            </button>

            {/* Detaylı Bilgiler (PC'de daima açık, Mobilde butona basınca açılır) */}
            <div className={\`\${showMobileDetails ? 'block' : 'hidden'} lg:block mt-2.5 space-y-2.5 relative z-10\`}>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[9.5px] block font-bold uppercase">İşyeri / Firma</span>
                  <strong className="text-white text-xs sm:text-sm block truncate mt-0.5">{certData.companyName}</strong>
                  <span className="text-[10px] text-amber-400 font-medium">{certData.hazardClass} Tehlike Sınıfı</span>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 text-[9.5px] block font-bold uppercase">Eğitim Tarihi & Süresi</span>
                  <strong className="text-white text-xs sm:text-sm block mt-0.5">{certData.date}</strong>
                  <span className="text-[10px] text-slate-400">{certData.totalMinutes} Dk ({totalLessons} Ders Saati)</span>
                </div>
              </div>

              {/* Karekod Kutusu */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-900/95 border border-emerald-500/30 rounded-2xl">
                <div className="shrink-0 bg-white p-1 rounded-lg">
                  <CertificateQrCode
                    verificationUrl={window.location.href}
                    certCode={certData.certCode}
                    size={72}
                    showCode={false}
                  />
                </div>
                <div className="min-w-0 text-[10.5px] text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                    Karekod Doğrulama
                  </span>
                  <span className="font-mono text-slate-400 text-[10px] block truncate">{certData.certCode}</span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">
                    6331 Sayılı İSG Kanunu ve ilgili Yönetmelik standartlarına uygundur.
                  </span>
                </div>
              </div>

              {/* Yan Panel Hızlı Aksiyonlar */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
                >
                  <Printer size={14} />
                  <span>PDF / Yazdır</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Kopyalandı' : 'Link Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────────────────────── */}
        {/* SAĞ / ORTA ALAN: BELGE ÖNİZLEME VE BASKI ALANI                          */}
        {/* ───────────────────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full min-w-0 flex flex-col items-center">

          {/* Belge Önizleme Üst Barı & Sayfa Seçici */}
          <div className="no-print w-full max-w-[1000px] flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                  Resmi Eğitim Belgesi
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  A4 Yatay Format • 1. Sayfa Sertifika Ön Yüzü, 2. Sayfa Ek-1 Konular Dökümü
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setActivePagePreview('all')}
                className={\`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer \${
                  activePagePreview === 'all'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }\`}
              >
                Tümü (2)
              </button>
              <button
                type="button"
                onClick={() => setActivePagePreview('front')}
                className={\`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer \${
                  activePagePreview === 'front'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }\`}
              >
                1. Ön Yüz
              </button>
              <button
                type="button"
                onClick={() => setActivePagePreview('back')}
                className={\`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer \${
                  activePagePreview === 'back'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }\`}
              >
                2. Ek-1 Konular
              </button>
            </div>
          </div>

          {/* SERTİFİKA VE KONU SÜRELERİ DÖKÜMÜ (PDF / BASKI ALANI — ORTALANMIŞ) */}
          <div className="w-full flex flex-col items-center">
            <div
              id="verification-print-area"
              className="w-full max-w-[1000px] mx-auto space-y-6"
            >

              {/* ========================================================================= */}
              {/* SAYFA 1: YATAY TEMEL İSG EĞİTİM BELGESİ (ÖN YÜZ) */}
              {/* ========================================================================= */}
              <div className={\`\${activePagePreview === 'back' ? 'hidden print:flex' : 'flex'} print-page-wrapper bg-white text-slate-900 rounded-2xl border-4 border-slate-800 text-xs leading-relaxed shadow-2xl p-4 sm:p-7 flex-col justify-between min-h-[460px] sm:min-h-[560px] w-full\`}>
                <div className="print-page-sheet flex flex-col justify-between h-full space-y-3 sm:space-y-4">

                  {/* Üst Bant: (ÖN YÜZ) */}
                  <div className="flex items-center justify-end border-b-2 border-slate-800 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <span className="px-3 py-0.5 bg-slate-100 border border-slate-400 rounded-md font-black text-slate-900 tracking-widest text-[11px]">
                      (ÖN YÜZ)
                    </span>
                  </div>

                  {/* Başlık */}
                  <div className="text-center py-1">
                    <h1 className="text-lg sm:text-3xl font-black uppercase text-slate-950 tracking-wider">
                      {certData.category === 'madde18_refresher'
                        ? 'BİLGİ YENİLEME EĞİTİM BELGESİ (MADDE 18)'
                        : certData.category === 'madde19_additional'
                          ? (certData.subtype === 'occupational_disease'
                              ? 'MESLEK HASTALIĞI SONRASI İLAVE İSG EĞİTİM BELGESİ'
                              : 'İŞ KAZASI SONRASI İLAVE İSG EĞİTİM BELGESİ')
                          : 'TEMEL EĞİTİM BELGESİ'}
                    </h1>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wide mt-0.5">
                      Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik Kapsamında
                    </p>
                  </div>

                  {/* Metin Gövdesi */}
                  <div className="p-3 sm:p-4 bg-slate-50/90 border border-slate-300 rounded-xl leading-relaxed text-slate-800 space-y-1">
                    <p className="text-xs font-semibold text-slate-600">İşbu belge,</p>
                    <div className="text-lg sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
                      {certData.participantName}
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      ({certData.participantTitle || 'Çalışan'}{certData.participantTc ? \`, T.C. Kimlik No: \${certData.participantTc}\` : ''}) adına
                    </div>
                    <p className="text-[11px] text-slate-700 pt-1">
                      <strong>Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik</strong> kapsamında 
                      işyerinde görevli iş güvenliği uzmanı ve işyeri hekimi tarafından <strong>{certData.date}</strong> tarihinde gerçekleştirilen temel eğitim sonunda düzenlenmiştir.
                    </p>
                  </div>

                  {/* Parametre Tablosu */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-700 font-medium">
                    <div className="p-2 border border-slate-300 rounded-lg bg-slate-50/50">
                      <div className="font-bold text-slate-500 uppercase text-[9px]">İşyeri / Firma</div>
                      <div className="font-black text-slate-900 truncate mt-0.5">{certData.companyName}</div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg bg-slate-50/50">
                      <div className="font-bold text-slate-500 uppercase text-[9px]">Tehlike Sınıfı & Süre</div>
                      <div className="font-black text-slate-900 mt-0.5">{certData.hazardClass} • {certData.totalMinutes} Dk ({totalLessons} Ders)</div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg bg-slate-50/50">
                      <div className="font-bold text-slate-500 uppercase text-[9px]">Eğitim Tarihi</div>
                      <div className="font-black text-slate-900 mt-0.5">{certData.date}</div>
                    </div>
                    <div className="p-2 border border-slate-300 rounded-lg bg-slate-50/50">
                      <div className="font-bold text-slate-500 uppercase text-[9px]">Son Geçerlilik Tarihi</div>
                      <div className="font-black text-slate-900 mt-0.5">{certData.expiryDate || '-'}</div>
                    </div>
                  </div>

                  {/* İmza Kutuları */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                    <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 text-center flex flex-col justify-between min-h-[82px] sm:min-h-[95px]">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Eğitici İş Güvenliği Uzmanı</div>
                        <div className="font-black text-slate-950 text-xs mt-0.5">{certData.iguName || '-'}</div>
                        <div className="text-[9px] text-slate-600 font-medium">İSG Uzmanı {certData.iguCertNo ? \`(\${certData.iguCertNo})\` : ''}</div>
                      </div>
                      <div className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider pt-1.5 border-t border-dashed border-slate-300 mt-1">İmza</div>
                    </div>

                    <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 text-center flex flex-col justify-between min-h-[82px] sm:min-h-[95px]">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Eğitici İşyeri Hekimi</div>
                        <div className="font-black text-slate-950 text-xs mt-0.5">{certData.iyhName || '-'}</div>
                        <div className="text-[9px] text-slate-600 font-medium">İşyeri Hekimi {certData.iyhCertNo ? \`(\${certData.iyhCertNo})\` : ''}</div>
                      </div>
                      <div className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider pt-1.5 border-t border-dashed border-slate-300 mt-1">İmza</div>
                    </div>

                    <div className="border-2 border-slate-400 rounded-xl p-2.5 bg-slate-50/70 text-center flex flex-col justify-between min-h-[82px] sm:min-h-[95px]">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">İşveren / İşveren Vekili</div>
                        <div className="font-black text-slate-950 text-xs mt-0.5">{certData.employerName}</div>
                        <div className="text-[9px] text-slate-600 font-medium truncate">{certData.employerTitle || 'İşveren Yetkilisi'}</div>
                      </div>
                      <div className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider pt-1.5 border-t border-dashed border-slate-300 mt-1">İmza & Kaşe</div>
                    </div>
                  </div>

                  {/* Dipnot: Karekod ve Kod Yan Yana */}
                  <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-300 flex items-center justify-between gap-3">
                    <CertificateQrCode
                      verificationUrl={window.location.href}
                      certCode={certData.certCode}
                      size={88}
                      showCode={true}
                      pageLabel="Ön Yüz"
                    />
                    <span className="text-center flex-1 hidden md:inline text-[8.5px] text-slate-400">
                      * 45 dk ders + 15 dk mola standardı uygulanmıştır. Yönetmelik Ek-1 Konu ve Süreleri arka yüzde (Sayfa 2) yer almaktadır.
                    </span>
                    <span className="font-bold text-slate-600 shrink-0">Sayfa 1 / 2 (Ön Yüz)</span>
                  </div>

                </div>
              </div>

              {/* ========================================================================= */}
              {/* SAYFA 2: YATAY EĞİTİM KONULARI VE SÜRELERİ DÖKÜMÜ (ARKA YÜZ) */}
              {/* ========================================================================= */}
              <div className={\`\${activePagePreview === 'front' ? 'hidden print:flex' : 'flex'} print-page-wrapper bg-white text-slate-900 rounded-2xl border-4 border-slate-700 text-xs leading-relaxed shadow-2xl p-4 sm:p-7 flex-col justify-between min-h-[460px] sm:min-h-[560px] w-full\`}>
                <div className="print-page-sheet flex flex-col justify-between h-full space-y-3">

                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-2 space-y-0.5">
                    <h2 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wider">
                      TEMEL İŞ SAĞLIĞI VE GÜVENLİĞİ EĞİTİMİ KONULARI VE SÜRELERİ DÖKÜMÜ (EK-1)
                    </h2>
                    <div className="text-[10.5px] text-slate-600 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                      <span>Çalışan: <strong>{certData.participantName}</strong></span>
                      <span>•</span>
                      <span>İşyeri: <strong>{certData.companyName}</strong></span>
                      <span>•</span>
                      <span>Toplam Süre: <strong className="text-amber-800">{certData.totalMinutes} Dk ({totalLessons} Ders Saati)</strong></span>
                    </div>
                  </div>

                  {/* Konular Tablosu (4 Kategori) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 gap-2.5 text-[9.5px] leading-tight flex-1 py-1">
                    {['Genel Konular', 'Sağlık Konuları', 'Teknik Konular', 'İşe ve İşyerine Özgü Riskler'].map((cat, cIdx) => {
                      const normCat = (s = '') => String(s || '').toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i').trim();
                      const topicsInCat = (certData.topics || []).filter(t => {
                        const tc = normCat(t.category || t.c || '');
                        const target = normCat(cat);
                        if (tc === target) return true;
                        if (target.includes('genel') && tc.includes('genel')) return true;
                        if (target.includes('sağlık') && tc.includes('sağlık')) return true;
                        if (target.includes('teknik') && tc.includes('teknik')) return true;
                        if (target.includes('özgü') && tc.includes('özgü')) return true;
                        return false;
                      });
                      const catTotalM = topicsInCat.reduce((sum, curr) => sum + (Number(curr.minutes) || 45), 0);
                      const catLessons = Math.round(catTotalM / 45);

                      return (
                        <div key={cat} className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="font-black text-slate-900 border-b border-slate-300 pb-1 mb-1 uppercase text-[9.5px]">
                              {cIdx + 1}. {cat}
                            </div>
                            <ul className="space-y-1 text-slate-700">
                              {topicsInCat.map((t, tIdx) => (
                                <li key={tIdx} className="flex justify-between items-start gap-1 border-b border-slate-100 pb-0.5">
                                  <span className="truncate font-medium">{/^[a-zçğışüö]\\)/i.test(t.name || t.n || '') ? '' : '• '}{t.name || t.n}</span>
                                  <span className="font-bold text-amber-950 bg-amber-100/70 border border-amber-300 px-1 py-0.2 rounded shrink-0 text-[8px]">
                                    {t.minutes || 45} Dk
                                  </span>
                                </li>
                              ))}
                              {topicsInCat.length === 0 && (
                                <li className="text-slate-400 italic">Standart müfredat konusu tanımlı.</li>
                              )}
                            </ul>
                          </div>

                          <div className="border-t-2 border-slate-300 pt-1 mt-2 flex justify-between font-bold text-slate-900 text-[9px] bg-slate-100/80 -mx-2.5 -mb-2.5 p-1.5 rounded-b-lg">
                            <span>Kategori Toplamı:</span>
                            <span className="text-amber-800 font-black">{catTotalM} Dk ({catLessons} Ders)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dipnot: Karekod ve Kod Yan Yana */}
                  <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-300 flex items-center justify-between gap-3">
                    <CertificateQrCode
                      verificationUrl={window.location.href}
                      certCode={certData.certCode}
                      size={88}
                      showCode={true}
                      pageLabel="Arka Yüz"
                    />
                    <span className="text-center flex-1 hidden md:inline text-[8.5px] text-slate-400">
                      * 45 dk ders + 15 dk mola standardı uygulanmıştır. 6331 Sayılı Kanun ve Yönetmelik hükümlerine uygundur.
                    </span>
                    <span className="font-bold text-slate-600 shrink-0">Sayfa 2 / 2 (Eğitim Konuları ve Süreleri Dökümü)</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

`;

content = content.slice(0, sIdx) + newBody + content.slice(eIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated CertificateVerificationView.jsx');

