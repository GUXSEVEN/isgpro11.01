const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

const anchor = `const getAcilDurumReportHTML = (company) => {`;

if (!content.includes(anchor)) {
  console.error("Could not find anchor: " + anchor);
  process.exit(1);
}

const functionsToInsert = `// --- PROSEDÜR YENİ SEKMEDE / PDF OFİS BASKI MODUNDA AÇMA (BİREBİR ÖNİZLEME DÜZENİ) ---
const openProcedurePage = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const html = getProcedurePageHTML(company, assessment);
  try {
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error("Prosedür penceresi oluşturma hatası:", err);
    alert("Rapor penceresi oluşturulurken hata: " + err.message);
  }
};

// --- KAPAK ÖNIZLEME BİLEŞENİ (MODAL İÇİNDE) ---
const CoverPreview = ({ company, assessment }) => {
  if (!company || !company.info || !assessment) {
    return <div className="p-10 text-center text-red-600 font-bold">Veriler yükleniyor...</div>;
  }
  const calculatedValidity = calculateValidityDate(assessment.createdAt, company.info.hazardClass);
  return (
    <div id="report-preview-container" style={{ fontFamily: "'Times New Roman', serif", background: 'white', padding: '40px', border: '5px double #333', minHeight: '270mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        {company.info.logo && <img src={company.info.logo} style={{ maxHeight: '100px', maxWidth: '200px', marginBottom: '20px' }} alt="logo" />}
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{company.name}</div>
      </div>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: '36px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', color: '#1e3a8a' }}>RİSK DEĞERLENDİRME</div>
        <div style={{ fontSize: '36px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', color: '#1e3a8a' }}>RAPORU</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>İŞ SAĞLIĞI VE GÜVENLİĞİ</div>
        <div style={{ textAlign: 'center', margin: '30px 0', borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '20px 0' }}>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>Rapor Adı:</span>{assessment.name}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>Bölüm/Lokasyon:</span>{assessment.department || 'Genel'}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>NACE Kodu:</span>{company.info.naceCode || '-'}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>Tehlike Sınıfı:</span>{company.info.hazardClass}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>Hazırlanma Tarihi:</span>{formatDateTR(assessment.createdAt)}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}><span style={{ fontWeight: 'bold', marginRight: '10px' }}>Geçerlilik Tarihi:</span>{formatDateTR(calculatedValidity)}</div>
        </div>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '15px', fontSize: '14px' }}>RİSK DEĞERLENDİRME EKİBİ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          {(company.info.team || []).map((member, idx) => (
            <div key={idx} style={{ width: '140px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '5px', minHeight: '25px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{member.role}</div>
              <div style={{ fontSize: '12px' }}>{member.name}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>{member.certificateNo || ''}</div>
              <div style={{ borderTop: '1px solid #333', width: '100%', margin: '30px auto 5px' }}></div>
              <div style={{ fontSize: '10px' }}>İmza</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#777', marginTop: 'auto' }}>
        Bu rapor 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu gereğince hazırlanmıştır.<br />
        Doküman No: RDR-{new Date().getFullYear()}-{(assessment.id || '').split('-')[1] || '001'}
      </div>
    </div>
  );
};

// --- ACİL DURUM KAPAK ÖNIZLEME BİLEŞENİ (MODAL İÇİNDE) ---
const EmergencyCoverPreview = ({ company, emergencyData }) => {
  if (!company || !emergencyData) {
    return <div className="p-10 text-center text-red-600 font-bold">Veriler yükleniyor...</div>;
  }
  return (
    <div id="report-preview-container" style={{ fontFamily: "'Times New Roman', serif", background: 'white', padding: '40px', border: '5px double #c00', minHeight: '270mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {company.info?.logo && <img src={company.info.logo} style={{ maxHeight: '80px', maxWidth: '180px', marginBottom: '15px' }} alt="logo" />}
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{emergencyData.companyName || company.name}</div>
      </div>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: '30px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', color: '#b91c1c' }}>ACİL DURUM</div>
        <div style={{ fontSize: '30px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', color: '#b91c1c' }}>EYLEM PLANI</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '20px' }}>İŞ SAĞLIĞI VE GÜVENLİĞİ</div>
        <div style={{ textAlign: 'center', margin: '20px 0', borderTop: '2px solid #c00', borderBottom: '2px solid #c00', padding: '15px 0' }}>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Adres:</span>{emergencyData.address || '-'}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Tehlike Sınıfı:</span>{emergencyData.hazardClass || company.info?.hazardClass || '-'}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Çalışan Sayısı:</span>{emergencyData.employeeCount || '-'}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Hazırlanma Tarihi:</span>{formatDateTR(emergencyData.date)}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Geçerlilik Tarihi:</span>{formatDateTR(emergencyData.validityDate)}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Doküman No:</span>{emergencyData.documentNo || '-'}</div>
          <div style={{ fontSize: '14px', margin: '8px 0' }}><span style={{ fontWeight: 'bold', marginRight: '8px' }}>Revizyon No:</span>{emergencyData.revisionNo || '-'}</div>
        </div>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '15px', fontSize: '13px' }}>ACİL DURUM EKİBİ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
          {(company.info?.team || []).map((member, idx) => (
            <div key={idx} style={{ width: '130px', textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', marginBottom: '5px', minHeight: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{member.role}</div>
              <div style={{ fontSize: '11px' }}>{member.name}</div>
              <div style={{ fontSize: '9px', color: '#666' }}>{member.certificateNo || ''}</div>
              <div style={{ borderTop: '1px solid #c00', width: '100%', margin: '25px auto 5px' }}></div>
              <div style={{ fontSize: '9px' }}>İmza</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#777', marginTop: 'auto' }}>
        Bu plan 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve İşyerlerinde Acil Durumlar Hakkında Yönetmelik gereğince hazırlanmıştır.
      </div>
    </div>
  );
};

// --- ACİL DURUM KAPAK SAYFASINI YENİ SEKMEDE AÇ ---
const openEmergencyCoverPage = (company, emergencyData) => {
  const html = \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Acil Durum Kapak - \${company?.name || ''}</title>
      <style>
        @page { size: A4 portrait; margin: 20mm; }
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; color: #333; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; border: 5px double #c00; padding: 40px; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { max-height: 80px; max-width: 180px; margin-bottom: 15px; }
        .title { font-size: 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; color: #b91c1c; }
        .subtitle { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #555; }
        .info-box { text-align: center; margin: 20px 0; border-top: 2px solid #c00; border-bottom: 2px solid #c00; padding: 15px 0; }
        .info-row { font-size: 14px; margin: 8px 0; }
        .label { font-weight: bold; margin-right: 8px; }
        .footer { text-align: center; font-size: 10px; color: #777; margin-top: auto; }
        .signatures-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 15px; }
        .sig-box { width: 130px; text-align: center; margin-bottom: 15px; }
        .sig-role { font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 5px; min-height: 20px; display:flex; align-items:flex-end; justify-content:center; }
        .sig-name { font-size: 11px; }
        .sig-cert { font-size: 9px; color: #666; }
        .sig-line { border-top: 1px solid #c00; width: 100%; margin: 25px auto 5px; }
        @media print { body { border: 5px double #c00; height: 98vh; } .no-print { display: none !important; } .signatures-grid { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">🚨 Acil Durum Eylem Planı (A4 Dikey)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>
      <div class="header">
        \${company?.info?.logo ? \`<img src="\${company.info.logo}" class="logo" />\` : ''}
        <div style="font-size: 18px; font-weight:bold; margin-bottom:8px;">\${emergencyData?.companyName || company?.name || ''}</div>
      </div>
      <div style="text-align: center; flex: 1;">
        <div class="title">ACİL DURUM</div>
        <div class="title">EYLEM PLANI</div>
        <div class="subtitle">İŞ SAĞLIĞI VE GÜVENLİĞİ</div>
        <div class="info-box">
          <div class="info-row"><span class="label">Adres:</span>\${emergencyData?.address || '-'}</div>
          <div class="info-row"><span class="label">Tehlike Sınıfı:</span>\${emergencyData?.hazardClass || company?.info?.hazardClass || '-'}</div>
          <div class="info-row"><span class="label">Çalışan Sayısı:</span>\${emergencyData?.employeeCount || '-'}</div>
          <div class="info-row"><span class="label">Hazırlanma Tarihi:</span>\${formatDateTR(emergencyData?.date)}</div>
          <div class="info-row"><span class="label">Geçerlilik Tarihi:</span>\${formatDateTR(emergencyData?.validityDate)}</div>
          <div class="info-row"><span class="label">Doküman No:</span>\${emergencyData?.documentNo || '-'}</div>
          <div class="info-row"><span class="label">Revizyon No:</span>\${emergencyData?.revisionNo || '-'}</div>
        </div>
        <div style="font-weight:bold; text-decoration:underline; margin-bottom:15px; font-size:13px;">ACİL DURUM EKİBİ</div>
        <div class="signatures-grid">
          \${(company?.info?.team || []).map(member => \`
            <div class="sig-box">
              <div class="sig-role">\${member.role}</div>
              <div class="sig-name">\${member.name}</div>
              <div class="sig-cert">\${member.certificateNo || ''}</div>
              <div class="sig-line"></div>
              <div style="font-size:9px;">İmza</div>
            </div>
          \`).join('')}
        </div>
      </div>
      <div class="footer">
        Bu plan 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve İşyerlerinde Acil Durumlar Hakkında Yönetmelik gereğince hazırlanmıştır.
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 600); };
      </script>
    </body>
    </html>
  \`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

// --- GÜNCELLENMİŞ KAPAK SAYFASI (TÜM EKİP İMZASI) ---
const openCoverPage = (company, assessment) => {
  const calculatedValidity = calculateValidityDate(assessment.createdAt, company.info.hazardClass);

  const html = \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Kapak - \${company.name}</title>
      <style>
        @page { size: A4 portrait; margin: 20mm; }
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; color: #333; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; border: 5px double #333; padding: 40px; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 100px; max-width: 200px; margin-bottom: 20px; }
        .title { font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #1e3a8a; }
        .subtitle { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #555; }
        .info-box { text-align: center; margin: 30px 0; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 20px 0; }
        .info-row { font-size: 16px; margin: 10px 0; }
        .label { font-weight: bold; margin-right: 10px; }
        .footer { text-align: center; font-size: 10px; color: #777; margin-top: auto; }
        
        /* İmza Alanı Düzenlemesi */
        .signatures-grid { 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: center; 
            gap: 20px; 
            margin-top: 20px; 
        }
        .sig-box { 
            width: 140px; 
            text-align: center; 
            margin-bottom: 20px; 
        }
        .sig-role { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; min-height: 25px; display:flex; align-items:flex-end; justify-content:center; }
        .sig-name { font-size: 12px; }
        .sig-cert { font-size: 10px; color: #666; }
        .sig-line { border-top: 1px solid #333; width: 100%; margin: 30px auto 5px; }
        
        @media print { 
            body { border: 5px double #333; height: 98vh; } 
            .no-print { display: none !important; } 
            .signatures-grid { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; gap: 10px;">
        <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">YAZDIR</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">KAPAT</button>
      </div>

      <div class="header">
        \${company.info.logo ? \`<img src="\${company.info.logo}" class="logo" />\` : ''}
        <div style="font-size: 18px; font-weight:bold; margin-bottom:10px;">\${company.name}</div>
      </div>

      <div style="text-align: center; flex: 1;">
        <div class="title">RİSK DEĞERLENDİRME</div>
        <div class="title">RAPORU</div>
        <div class="subtitle">İŞ SAĞLIĞI VE GÜVENLİĞİ</div>
        
        <div class="info-box">
          <div class="info-row"><span class="label">Rapor Adı:</span> \${assessment.name}</div>
          <div class="info-row"><span class="label">Bölüm/Lokasyon:</span> \${assessment.department || 'Genel'}</div>
          <div class="info-row"><span class="label">NACE Kodu:</span> \${company.info.naceCode || '-'}</div>
          <div class="info-row"><span class="label">Tehlike Sınıfı:</span> \${company.info.hazardClass}</div>
          <div class="info-row"><span class="label">Hazırlanma Tarihi:</span> \${formatDateTR(assessment.createdAt)}</div>
          <div class="info-row"><span class="label">Geçerlilik Tarihi:</span> \${formatDateTR(calculatedValidity)}</div>
        </div>

        <div style="font-weight:bold; text-decoration:underline; margin-bottom:15px; font-size:14px;">RİSK DEĞERLENDİRME EKİBİ</div>
        
        <div class="signatures-grid">
            <!-- Ekipteki herkes döngü ile yazdırılıyor -->
            \${(company.info.team || []).map(member => \`
                <div class="sig-box">
                    <div class="sig-role">\${member.role}</div>
                    <div class="sig-name">\${member.name}</div>
                    <div class="sig-cert">\${member.certificateNo || ''}</div>
                    <div class="sig-line"></div>
                    <div style="font-size:10px;">İmza</div>
                </div>
            \`).join('')}
        </div>
      </div>

      <div class="footer">
        Bu rapor 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu gereğince hazırlanmıştır.<br>
        Doküman No: RDR-\${new Date().getFullYear()}-\${assessment.id.split('-')[1] || '001'}
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 600); };
      </script>
    </body>
    </html>
  \`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

// --- WEB RAPORU YENİ SEKMEDE / PDF OFİS BASKI MODUNDA AÇMA (BİREBİR ÖNİZLEME DÜZENİ) ---
const openWebReport = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const rawHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');
  const cleanedHTML = rawHTML ? rawHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"') : '';

  const html = \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Risk Değerlendirme Raporu - \${company?.name || ''}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { 
          margin: 0; 
          padding: 0; 
          background: white; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .no-print { display: none !important; }
        @media print {
          @page {
            size: 297mm 210mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .web-report-outer-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 297mm !important;
          }
          .web-report-page-wrapper, .mb-8 {
            margin: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .web-report-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            width: 297mm !important;
            min-width: 297mm !important;
            max-width: 297mm !important;
            height: 209mm !important;
            min-height: 209mm !important;
            max-height: 209mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .web-report-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .web-report-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .web-report-header { flex-shrink: 0 !important; }
          .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
          .web-report-table-container { flex: 1 1 auto !important; overflow: hidden !important; }
          .web-report-page table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .web-report-page table td, .web-report-page table th {
            padding: 2px !important;
            hyphens: auto !important;
            -webkit-hyphens: auto !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
          .report-photo-cell-container {
            max-height: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .report-photo-cell-container img {
            max-height: 100% !important;
            max-width: 100% !important;
            object-fit: contain !important;
          }
        }
        .web-report-page {
          width: 297mm;
          min-width: 297mm;
          height: 209mm;
          min-height: 209mm;
          max-height: 209mm;
          background: white;
          box-sizing: border-box;
          margin-bottom: 20px;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          break-inside: avoid-page !important;
          page-break-inside: avoid !important;
          overflow: hidden !important;
        }
        .web-report-header { flex-shrink: 0 !important; }
        .web-report-footer { margin-top: auto !important; flex-shrink: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
        .web-report-page tr, .web-report-page td, .web-report-page th, .report-photo-cell-container, .print-cell-wrapper {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">📄 Risk Değerlendirme Raporu (A4 Yatay)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>
      <div class="web-report-outer-container" style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
        \${cleanedHTML}
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => { window.print(); }, 900);
        };
      </script>
    </body>
    </html>
  \`;

  try {
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error("Yazdırma penceresi yazma hatası:", err);
    alert("Rapor penceresi oluşturulurken hata: " + err.message);
  }
};

// --- SAHA TAKİP RAPORU YENİ SEKMEDE BASKI MODUNDA AÇMA ---
const openSahaZiyaretiReport = (company, assessment) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const reportHTML = document.getElementById('report-preview-container').innerHTML;

  const html = \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Saha Takip Raporu - \${company.name}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: 210mm 297mm; margin: 0; }
        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print {
          .no-print { display: none !important; }
        }
        .saha-report-page, .acil-durum-page {
            margin: 0 !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            padding: 8mm 10mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }
        .report-table tr, .report-table td, .report-table th, .report-photo-cell-container, .print-cell-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
        }
        .saha-report-page:not(:last-child), .acil-durum-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
        }
        .saha-report-page:last-child, .acil-durum-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; gap: 10px;">
        <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">YAZDIR</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">KAPAT</button>
      </div>
      \${reportHTML}
      <script>
        window.onload = () => { 
           setTimeout(() => { window.print(); }, 800);
        };
      </script>
    </body>
    </html>
  \`;

  printWindow.document.write(html);
  printWindow.document.close();
};

`;

content = content.replace(anchor, functionsToInsert + anchor);
fs.writeFileSync(targetFile, content, 'utf8');
console.log("CoverPreview, EmergencyCoverPreview, openCoverPage, openEmergencyCoverPage, openWebReport, openSahaZiyaretiReport restored successfully!");
