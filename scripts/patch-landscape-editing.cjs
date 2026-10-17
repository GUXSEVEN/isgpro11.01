const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyTeamsTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add landscapeSettings state and handlePrintLandscapeA4 function
const targetBeforeFiltered = `  // Filtrelenmiş Ekip Üyeleri
  const filteredMembers = useMemo(() => {`;

const landscapeStateAndPrint = `  // Yatay A4 Rapor Gelişmiş Düzenleme State'leri
  const [landscapeSettings, setLandscapeSettings] = useState({
    fontSize: '9.5pt', // '8.5pt' | '9.5pt' | '10.5pt'
    lineHeight: '1.2',
    isEditable: false,
    showPhones: true,
    reportDate: new Date().toLocaleDateString('tr-TR'),
    employerName: company?.info?.official || 'İşveren / İşveren Vekili'
  });

  // ── 9. GERÇEK YATAY A4 SAF VEKTÖREL YAZDIRMA (EKRAN GÖRÜNTÜSÜ DEĞİL) ───
  const handlePrintLandscapeA4 = () => {
    const printableElement = document.getElementById('yatay-a4-printable-document');
    if (!printableElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = \`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Acil Durum Ekipleri Raporu (Yatay A4) - \${company.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #0f172a;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: \${landscapeSettings.fontSize};
            line-height: \${landscapeSettings.lineHeight};
          }
          .yatay-a4-page {
            width: 280mm;
            min-height: 194mm;
            height: 194mm;
            max-height: 194mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #0f172a;
            padding: 4mm 6mm;
            box-sizing: border-box;
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
          .imza-alani-yasla {
            margin-top: auto !important;
            padding-top: 3mm;
            border-top: 2px solid #0f172a;
          }
          table {
            border-collapse: collapse !important;
            width: 100%;
          }
          th, td {
            border: 1px solid #334155;
            padding: 2.5px 4px;
          }
          th {
            background-color: #f1f5f9 !important;
          }
        </style>
      </head>
      <body>
        <div class="yatay-a4-page">
          \${printableElement.innerHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"').replace(/outline-dashed/gi, '').replace(/bg-amber-50/gi, '')}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              window.close();
            }, 350);
          };
        </script>
      </body>
      </html>
    \`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filtrelenmiş Ekip Üyeleri
  const filteredMembers = useMemo(() => {`;

content = content.replace(targetBeforeFiltered, landscapeStateAndPrint);

// 2. Replace the entire Landscape Modal with advanced Toolbar, interactive editing and A4 preview
const oldLandscapeModalStart = `{/* ── 8. YATAY A4 ACİL DURUM EKİPLERİ LİSTESİ RAPORU MODALI (LANDSCAPE A4) ─── */}
      {showLandscapeReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-8 space-y-6 max-h-[90vh] overflow-y-auto">`;

const endOfFileTarget = `    </div>
  );
}
`;

const landscapeModalIndex = content.indexOf('{/* ── 8. YATAY A4 ACİL DURUM EKİPLERİ LİSTESİ RAPORU MODALI');
if (landscapeModalIndex === -1) {
  console.error("Could not find Landscape Modal in content");
  process.exit(1);
}

const beforeLandscapeModal = content.substring(0, landscapeModalIndex);

const newLandscapeModal = `{/* ── 8. YATAY A4 ACİL DURUM EKİPLERİ LİSTESİ RAPORU MODALI (GELİŞMİŞ DÜZENLEME & VEKTÖREL BASKI) ─── */}
      {showLandscapeReportModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[96vh]">

            {/* Gelişmiş Toolbar Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Printer size={22} className="text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Yatay A4 Ekipler ve Destek Elemanları Raporu</h3>
                  <p className="text-[10px] text-slate-400">Resmi Yatay A4 Formatı — Saf Vektörel PDF Baskı & Etkileşimli Düzenleme</p>
                </div>
              </div>

              {/* Düzenleme ve Baskı Ayarları Toolbar */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Font Boyutu */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <Type size={14} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400">Yazı:</span>
                  <select
                    value={landscapeSettings.fontSize}
                    onChange={e => setLandscapeSettings({ ...landscapeSettings, fontSize: e.target.value })}
                    className="bg-transparent text-white font-bold outline-none text-[11px]"
                  >
                    <option value="8.5pt" className="bg-slate-800 text-white">8.5pt (Kompakt)</option>
                    <option value="9.5pt" className="bg-slate-800 text-white">9.5pt (Standart)</option>
                    <option value="10.5pt" className="bg-slate-800 text-white">10.5pt (Büyük)</option>
                  </select>
                </div>

                {/* Hızlı Tarih Değiştirme Inputu */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <Calendar size={13} className="text-indigo-400" />
                  <span className="text-[10px] text-slate-400">Rapor Tarihi:</span>
                  <input
                    type="text"
                    value={landscapeSettings.reportDate}
                    onChange={e => setLandscapeSettings({ ...landscapeSettings, reportDate: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-white font-bold px-1.5 py-0.5 rounded text-[11px] w-24 text-center outline-none focus:border-indigo-500"
                    placeholder="GG.AA.YYYY"
                    title="Rapor tarihini buradan veya doğrudan belge üzerinden düzenleyebilirsiniz"
                  />
                </div>

                {/* Telefon Göster/Gizle */}
                <button
                  type="button"
                  onClick={() => setLandscapeSettings({ ...landscapeSettings, showPhones: !landscapeSettings.showPhones })}
                  className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 \${
                    landscapeSettings.showPhones
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }\`}
                >
                  <Phone size={12} /> {landscapeSettings.showPhones ? 'Tel Açık' : 'Tel Gizli'}
                </button>

                {/* Tıklayarak Düzenle Modu Butonu */}
                <button
                  type="button"
                  onClick={() => setLandscapeSettings({ ...landscapeSettings, isEditable: !landscapeSettings.isEditable })}
                  className={\`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm \${
                    landscapeSettings.isEditable
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }\`}
                >
                  <Edit3 size={13} className={landscapeSettings.isEditable ? 'text-slate-950' : 'text-amber-400'} />
                  {landscapeSettings.isEditable ? '✓ Düzenleme Aktif (Metinlere Tıkla)' : 'Metinleri Düzenle'}
                </button>

                {/* Yazdır Butonu */}
                <button
                  onClick={handlePrintLandscapeA4}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <Printer size={15} /> Yatay A4 PDF Yazdır
                </button>

                <button
                  onClick={() => setShowLandscapeReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Düzenleme Modu Bilgi ve Hızlı Sıfırlama Şeridi */}
            {landscapeSettings.isEditable && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <strong>✏️ METİN VE TARİH DÜZENLEME AÇIK:</strong> Yatay rapordaki tüm tarihleri, firma ünvanını, yetkili adlarını ve tablodaki hücreleri doğrudan tıklayarak elle serbestçe düzenleyebilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={() => setLandscapeSettings(prev => ({
                    ...prev,
                    reportDate: new Date().toLocaleDateString('tr-TR'),
                    employerName: company?.info?.official || 'İşveren / İşveren Vekili'
                  }))}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[11px] font-semibold border border-amber-400/40 transition"
                >
                  ↺ Varsayılan Tarih ve Metne Dön
                </button>
              </div>
            )}

            {/* DÖKÜMAN ÖNİZLEME ALANI (YATAY A4 ORANLI & İMZA EN ALTA YASLI) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-200 dark:bg-slate-900 flex justify-center">
              <div
                id="yatay-a4-printable-document"
                className="bg-white text-slate-900 shadow-2xl p-6 sm:p-7 flex flex-col justify-between border-2 border-slate-900"
                style={{
                  width: '280mm',
                  minHeight: '194mm',
                  height: '194mm',
                  boxSizing: 'border-box',
                  fontSize: landscapeSettings.fontSize,
                  lineHeight: landscapeSettings.lineHeight
                }}
              >
                {/* 1. ÜST BAŞLIK & METADATA */}
                <div className="space-y-2.5 shrink-0">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5">
                    <div className="space-y-0.5">
                      <h2
                        className={\`font-black text-base uppercase tracking-wide \${
                          landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''
                        }\`}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                        title="Firma ünvanını düzenlemek için tıklayınız"
                      >
                        {company.name}
                      </h2>
                      <p className="text-[10px] text-slate-700 font-extrabold uppercase">
                        6331 SAYILI KANUN UYARINCA ACİL DURUM EKİPLERİ VE DESTEK ELEMANLARI RAPORU
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[10px] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-400 block mb-1">
                        YATAY A4 RAPOR
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 block">
                        Rapor Tarihi: <span
                          contentEditable={landscapeSettings.isEditable}
                          suppressContentEditableWarning
                          className={landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 py-0.5 rounded cursor-text font-black text-indigo-700' : ''}
                          title="Rapor tarihini düzenlemek için tıklayınız"
                        >
                          {landscapeSettings.reportDate}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Yasal Kota & Mevzuat Bilgi Bandı */}
                  <div className="bg-slate-100 p-1.5 border border-slate-400 text-[9.5px] flex items-center justify-between font-bold">
                    <span>
                      🏛️ YASAL KOTA DENETİMİ (30/40/50 & İLKYARDIM YÖNETMELİĞİ): {legalQuotas.hazardLabel} ({legalQuotas.empCount} Çalışan) — Söndürme: {legalQuotas.fire.assigned}/{legalQuotas.fire.required} | Kurtarma: {legalQuotas.rescue.assigned}/{legalQuotas.rescue.required} | Koruma: {legalQuotas.evacuation.assigned}/{legalQuotas.evacuation.required} | İlkyardım: {legalQuotas.firstAid.assigned}/{legalQuotas.firstAid.required}
                    </span>
                    <span className={\`px-2 py-0.5 rounded text-[9px] font-black \${
                      legalQuotas.isCompliant ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }\`}>
                      {legalQuotas.isCompliant ? 'MEVZUATA %100 UYUMLU' : \`\${legalQuotas.totalMissing} KİŞİ EKSİK\`}
                    </span>
                  </div>

                  {/* Firma Metadata Satırı */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 border border-slate-400 text-[10px] font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase">SGK SİCİL NO:</span>
                      <span
                        className={landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text block' : 'block'}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        {company.info?.sgkNo || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase">NACE KODU:</span>
                      <span
                        className={landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text block' : 'block'}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        {company.info?.naceCode || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase">ACİL DURUM YÖNETİCİSİ:</span>
                      <span
                        className={\`font-bold text-indigo-950 block \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        {emergencyManager?.name ? \`\${emergencyManager.name} (\${emergencyManager.phone || 'Tel Yok'})\` : 'Belirlenmedi'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase">İŞVEREN / İŞVEREN VEKİLİ:</span>
                      <span
                        className={\`font-bold block \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50/70 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                      >
                        {landscapeSettings.employerName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. DİNAMİK EKİP ÜYELERİ TABLOSU (A4 ORTA GÖVDE) */}
                <div className="flex-1 my-2 overflow-hidden flex flex-col justify-start">
                  <table className="w-full border-collapse border border-slate-900 text-left text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-200 border-b border-slate-900 font-extrabold text-center">
                        <th className="p-1.5 border-r border-slate-900 w-8">S.N.</th>
                        <th className="p-1.5 border-r border-slate-900 text-left">Çalışan Adı Soyadı</th>
                        <th className="p-1.5 border-r border-slate-900">TC Kimlik No</th>
                        {landscapeSettings.showPhones && (
                          <th className="p-1.5 border-r border-slate-900">Telefon No</th>
                        )}
                        <th className="p-1.5 border-r border-slate-900">Görevi</th>
                        <th className="p-1.5 border-r border-slate-900">Atandığı Acil Durum Ekibi</th>
                        <th className="p-1.5 border-r border-slate-900">Ekip İçi Rolü</th>
                        <th className="p-1.5 border-r border-slate-900">Eğitim Veren Yetkili</th>
                        <th className="p-1.5 border-r border-slate-900">Eğitim Tarihi</th>
                        <th className="p-1.5 w-24">İmza Alanı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ACİL DURUM YÖNETİCİSİ SATIRI (EKİP İMZASI TABLODA ALINIR) */}
                      {emergencyManager?.name && (
                        <tr className="border-b-2 border-indigo-900 bg-indigo-50/70 font-semibold">
                          <td className="p-1.5 font-black text-center border-r border-slate-400 text-indigo-900">1</td>
                          <td 
                            className={\`p-1.5 font-black border-r border-slate-400 text-indigo-950 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            {emergencyManager.name}
                            <span className="block text-[8px] text-indigo-600 font-bold uppercase">(İşyeri Acil Durum Yöneticisi)</span>
                          </td>
                          <td 
                            className={\`p-1.5 font-mono text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            {emergencyManager.tcNo || '-'}
                          </td>
                          {landscapeSettings.showPhones && (
                            <td 
                              className={\`p-1.5 font-mono text-center border-r border-slate-400 font-bold text-indigo-900 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {emergencyManager.phone || '-'}
                            </td>
                          )}
                          <td 
                            className={\`p-1.5 border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            {emergencyManager.title || 'Acil Durum Yöneticisi'}
                          </td>
                          <td 
                            className={\`p-1.5 font-extrabold border-r border-slate-400 text-indigo-900 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            Acil Durum Yönetim ve Koordinasyon
                          </td>
                          <td 
                            className={\`p-1.5 font-black text-center border-r border-slate-400 text-indigo-900 bg-indigo-100/60 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            Yönetici / Ekip Lideri
                          </td>
                          <td 
                            className={\`p-1.5 border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                          >
                            {osgbTrainers[0] || '-'}
                          </td>
                          <td 
                            className={\`p-1.5 font-mono text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 cursor-text font-bold text-rose-700' : ''}\`}
                            contentEditable={landscapeSettings.isEditable}
                            suppressContentEditableWarning
                            title="Tarihi düzenlemek için tıklayınız"
                          >
                            {landscapeSettings.reportDate}
                          </td>
                          <td className="p-1.5 border-r border-slate-400 text-center h-8">
                            <div className="w-full h-6 border border-dashed border-indigo-400 rounded flex items-center justify-center text-[8.5px] text-indigo-700 font-bold">
                              [ İMZA ]
                            </div>
                          </td>
                        </tr>
                      )}

                      {teamMembers.map((m, idx) => {
                        const teamObj = allTeams.find(t => t.id === m.teamId);
                        const seqNum = emergencyManager?.name ? idx + 2 : idx + 1;
                        return (
                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-1.5 font-bold text-center border-r border-slate-400">{seqNum}</td>
                            <td 
                              className={\`p-1.5 font-bold border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.name} {m.surname}
                            </td>
                            <td 
                              className={\`p-1.5 font-mono text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.tcNo || '-'}
                            </td>
                            {landscapeSettings.showPhones && (
                              <td 
                                className={\`p-1.5 font-mono text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                                contentEditable={landscapeSettings.isEditable}
                                suppressContentEditableWarning
                              >
                                {m.phone || '-'}
                              </td>
                            )}
                            <td 
                              className={\`p-1.5 border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.jobTitle || 'Personel'}
                            </td>
                            <td 
                              className={\`p-1.5 font-bold border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {teamObj?.title || m.teamId}
                            </td>
                            <td 
                              className={\`p-1.5 font-semibold text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.role || 'Ekip Üyesi'}
                            </td>
                            <td 
                              className={\`p-1.5 border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-400 bg-amber-50/40 cursor-text' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                            >
                              {m.trainerName || '-'}
                            </td>
                            <td 
                              className={\`p-1.5 font-mono text-center border-r border-slate-400 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 cursor-text font-bold text-rose-700' : ''}\`}
                              contentEditable={landscapeSettings.isEditable}
                              suppressContentEditableWarning
                              title="Tarihi düzenlemek için tıklayınız"
                            >
                              {m.trainingDate ? new Date(m.trainingDate).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="p-1.5 border-r border-slate-400 text-center h-8">
                              <div className="w-full h-6 border border-dashed border-slate-400 rounded flex items-center justify-center text-[8.5px] text-slate-400">
                                [ İMZA ]
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3. İMZA ALANLARI (SADECE İSG UZMANI VE İŞVEREN - A4'ÜN EN ALTINA YASLI) */}
                <div className="imza-alani-yasla mt-auto pt-2.5 border-t-2 border-slate-900 text-center text-[10px] shrink-0">
                  <div className="grid grid-cols-2 gap-16 max-w-2xl mx-auto">
                    {/* Düzenleyen */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-800">HAZIRLAYAN</p>
                      <p className="text-[9px] text-slate-500 font-semibold">İş Güvenliği Uzmanı</p>
                      <p 
                        className={\`font-bold text-slate-900 mt-0.5 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                        title="İSG Uzmanı adını düzenlemek için tıklayınız"
                      >
                        {currentUser?.name || 'İSG Uzmanı'}
                      </p>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-0.5">İmza</p>
                    </div>

                    {/* Tebliğ Eden / İşveren */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-900">ONAYLAYAN / TEBLİĞ EDEN</p>
                      <p className="text-[9px] text-slate-600 font-bold">İşveren / İşveren Vekili</p>
                      <p 
                        className={\`font-extrabold text-slate-900 mt-0.5 \${landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''}\`}
                        contentEditable={landscapeSettings.isEditable}
                        suppressContentEditableWarning
                        title="İşveren yetkilisini düzenlemek için tıklayınız"
                      >
                        {landscapeSettings.employerName}
                      </p>
                      <p className="text-[8.5px] text-slate-600 font-mono mt-0.5">
                        Tarih: <span
                          contentEditable={landscapeSettings.isEditable}
                          suppressContentEditableWarning
                          className={landscapeSettings.isEditable ? 'outline-dashed outline-1 outline-amber-500 bg-amber-50 px-1 rounded cursor-text font-bold text-rose-700' : 'font-bold'}
                          title="Onay tarihini düzenlemek için tıklayınız"
                        >
                          {landscapeSettings.reportDate}
                        </span>
                      </p>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-0.5"></div>
                      <p className="text-[8px] text-slate-400 mt-0.5">İmza / Kaşe</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Alt Kapatma Çubuğu */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px]">
                * Sayfa baskısı A4 standart yatay ölçülerine (297x210mm) tam oturtulmuş olup ekran görüntüsü yerine saf vektörel PDF çıktısı oluşturur.
              </span>
              <button
                onClick={() => setShowLandscapeReportModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 rounded-xl font-bold"
              >
                Pencereyi Kapat
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
`;

content = beforeLandscapeModal + newLandscapeModal;

fs.writeFileSync(targetFile, content, 'utf8');
console.log('EmergencyTeamsTab.jsx successfully patched with advanced editing and vector print for Landscape A4!');
