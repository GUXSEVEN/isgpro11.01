const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update getAcilDurumReportHTML and openAcilDurumReport
const oldAcilDurumHtmlStart = `const getAcilDurumReportHTML = (company) => {`;
const oldAcilDurumOpenStart = `const openAcilDurumReport = (company) => {`;

// Let's locate getAcilDurumReportHTML up to the end of openAcilDurumReport
const getHtmlIdx = content.indexOf(oldAcilDurumHtmlStart);
const openReportIdx = content.indexOf(oldAcilDurumOpenStart);

if (getHtmlIdx === -1 || openReportIdx === -1) {
  console.error("Could not find getAcilDurumReportHTML or openAcilDurumReport");
  process.exit(1);
}

// Find closing brace of openAcilDurumReport
const endOfOpenReport = content.indexOf('};', openReportIdx) + 2;

const newAcilDurumHtmlAndOpen = `const getAcilDurumReportHTML = (company) => {
  const printableArea = document.getElementById('printable-area');
  const container = document.getElementById('report-preview-container');
  const rawHTML = printableArea ? printableArea.innerHTML : (container ? container.innerHTML : '');
  const cleanedHTML = rawHTML ? rawHTML.replace(/contenteditable="true"/gi, 'contenteditable="false"') : '';

  return \`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Acil Durum Eylem Planı - \${company?.name || ''}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: 210mm 297mm; margin: 0; }
        body { 
          margin: 0; 
          padding: 0; 
          background: #f1f5f9; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .no-print { display: none !important; }
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .acil-durum-outer-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
            width: 210mm !important;
          }
          .acil-durum-page {
            box-shadow: none !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: white !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .acil-durum-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .acil-durum-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          table {
            border-collapse: collapse !important;
          }
          tr, td, th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }
        .acil-durum-page {
          width: 210mm;
          min-width: 210mm;
          max-width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          background: white;
          box-sizing: border-box;
          margin-bottom: 24px;
          break-inside: avoid-page !important;
          page-break-inside: avoid !important;
          overflow: hidden !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .acil-durum-page tr, .acil-durum-page td, .acil-durum-page th {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; gap: 12px; align-items: center; font-family: sans-serif;">
        <span style="font-size: 12px; font-weight: bold; color: #1e293b;">📄 Acil Durum Eylem Planı (A4 Dikey)</span>
        <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ KAPAT</button>
      </div>
      <div class="acil-durum-outer-container" style="padding: 20px 10px; display: flex; flex-direction: column; align-items: center;">
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
};

const openAcilDurumReport = (company) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kaldırın.');
    return;
  }
  const html = getAcilDurumReportHTML(company);
  try {
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error("Acil durum penceresi oluşturma hatası:", err);
    alert("Rapor penceresi oluşturulurken hata: " + err.message);
  }
};`;

content = content.slice(0, getHtmlIdx) + newAcilDurumHtmlAndOpen + content.slice(endOfOpenReport);
console.log("1. getAcilDurumReportHTML and openAcilDurumReport replaced successfully.");

// 2. Update loadHtml2pdfAndRun filename for acil-durum
const oldFilename = `const filename = reportType === 'prosedur'
            ? \`Prosedur_\${(company?.name || 'Firma').replace(/\\s+/g, '_')}_\${Date.now()}.pdf\`
            : \`Rapor_\${Date.now()}.pdf\`;`;

const newFilename = `const filename = reportType === 'prosedur'
            ? \`Prosedur_\${(company?.name || 'Firma').replace(/\\s+/g, '_')}_\${Date.now()}.pdf\`
            : reportType === 'acil-durum'
            ? \`Acil_Durum_\${(company?.name || 'Firma').replace(/\\s+/g, '_')}_\${Date.now()}.pdf\`
            : \`Rapor_\${Date.now()}.pdf\`;`;

if (content.includes(oldFilename)) {
  content = content.replace(oldFilename, newFilename);
  console.log("2. loadHtml2pdfAndRun filename updated.");
}

// 3. Update top toolbar ⚡ A4'e Akıllı Dağıt button
const oldSmartPackCondition = `{(reportType === 'ziyaret' || reportType === 'web' || reportType === 'prosedur') && (
              <button
                type="button"
                onClick={() => {
                  if (reportType === 'prosedur') {
                    setReportFontSize('7.5pt');
                    setReportLineHeight('1.2');
                    setReportPadding('8mm');
                    setSignatureStyle('compact');
                    setTableVerticalAlign('middle');
                    setTableTextAlign('left');
                  } else {
                    handleSmartAutoPack();
                  }
                }}`;

const newSmartPackCondition = `{(reportType === 'ziyaret' || reportType === 'web' || reportType === 'prosedur' || reportType === 'acil-durum') && (
              <button
                type="button"
                onClick={() => {
                  if (reportType === 'prosedur') {
                    setReportFontSize('7.5pt');
                    setReportLineHeight('1.2');
                    setReportPadding('8mm');
                    setSignatureStyle('compact');
                    setTableVerticalAlign('middle');
                    setTableTextAlign('left');
                  } else if (reportType === 'acil-durum') {
                    const autoSize = calculateEmergencyFontSize(defaultEmergencyData);
                    setReportFontSize(autoSize);
                    setReportLineHeight('1.2');
                    setReportPadding('10mm');
                    setSignatureStyle('compact');
                    setTableVerticalAlign('middle');
                    setTableTextAlign('left');
                  } else {
                    handleSmartAutoPack();
                  }
                }}`;

if (content.includes(oldSmartPackCondition)) {
  content = content.replace(oldSmartPackCondition, newSmartPackCondition);
  console.log("3. ⚡ A4'e Akıllı Dağıt button updated for acil-durum.");
} else {
  console.warn("Could not find oldSmartPackCondition exactly, checking alternative...");
}

// 4. Update AcilDurumReportPreview call inside AdvancedReportModal to pass tableVerticalAlign and tableTextAlign
const oldAcilDurumCall = `<AcilDurumReportPreview
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                removeEmpty={removeEmpty}
              />`;

const newAcilDurumCall = `<AcilDurumReportPreview
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                removeEmpty={removeEmpty}
              />`;

if (content.includes(oldAcilDurumCall)) {
  content = content.replace(oldAcilDurumCall, newAcilDurumCall);
  console.log("4. AcilDurumReportPreview call in modal updated with alignment props.");
} else {
  console.warn("Could not find oldAcilDurumCall");
}

// 5. Replace AcilDurumReportPreview with advanced smart packaging engine
const oldPreviewStart = `// --- YENİ EKLENEN ACİL DURUM EYLEM PLANI ÖNİZLEME (RAPOR MENÜSÜ İÇİN) ---
const AcilDurumReportPreview = ({`;
const oldPreviewEnd = `const EmergencyPlanView = ({ company, onUpdateDate, onSave, currentUser, checkAndIncrementAILimit, aiUsageCount }) => {`;

const previewStartIdx = content.indexOf(oldPreviewStart);
const previewEndIdx = content.indexOf(oldPreviewEnd);

if (previewStartIdx === -1 || previewEndIdx === -1) {
  console.error("Could not find AcilDurumReportPreview boundaries!");
  process.exit(1);
}

const newAcilDurumReportPreview = `// --- YENİLENMİŞ GELİŞMİŞ ACİL DURUM EYLEM PLANI ÖNİZLEME (AKILLI A4 SAYFALAMA VE TAŞMA MOTORU) ---
const AcilDurumReportPreview = ({
  company,
  emergencyData,
  reportFontSize = '8pt',
  reportPadding = '10mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left',
  removeEmpty = false
}) => {
  if (!company || !emergencyData) {
    return <div className="p-10 text-center text-red-600 font-bold">Veriler yükleniyor...</div>;
  }

  // Font ve ölçek hesaplamaları
  const fontPt = parseFloat(reportFontSize) || 8;
  const fontScale = fontPt / 8;
  const lineHeightVal = parseFloat(reportLineHeight) || 1.2;
  const padMm = parseFloat(reportPadding) || 10;

  const cellVAlign = tableVerticalAlign || 'middle';
  const cellTAlign = tableTextAlign || 'left';

  // Usable vertical space in an A4 page (total ~842pt)
  const headerPt = 70;
  const footerPt = signatureStyle === 'hide' ? 10 : (signatureStyle === 'standard' ? 85 : 52);
  const paddingPt = padMm * 2 * 2.834;
  const PAGE_CAPACITY_PT = Math.max(460, 842 - paddingPt - headerPt - footerPt);

  // 1. İşyeri Bilgileri Bloğu
  const blockInfo = {
    id: 'b_info',
    basePt: 105,
    render: () => (
      <section key="b_info" className="mb-2" style={{ breakInside: 'avoid' }}>
        <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1 flex items-center justify-between">
          <span>1. İŞYERİ BİLGİLERİ</span>
        </h2>
        <table className="w-full border-collapse border border-gray-300 text-[8px]" style={{ fontSize: \`\${8 * fontScale}pt\`, textAlign: cellTAlign }}>
          <tbody>
            <tr>
              <td className="font-bold w-1/3 bg-gray-50 border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }}>İşyeri Adı</td>
              <td className="border border-gray-300 p-1 font-semibold text-gray-900" style={{ verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{emergencyData.companyName || '-'}</td>
            </tr>
            <tr>
              <td className="font-bold bg-gray-50 border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }}>Adres</td>
              <td className="border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{emergencyData.address || '-'}</td>
            </tr>
            <tr>
              <td className="font-bold bg-gray-50 border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }}>Tehlike Sınıfı</td>
              <td className="border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{emergencyData.hazardClass || 'Az Tehlikeli'}</td>
            </tr>
            <tr>
              <td className="font-bold bg-gray-50 border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }}>Çalışan Sayısı</td>
              <td className="border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{emergencyData.employeeCount || '-'}</td>
            </tr>
            <tr>
              <td className="font-bold bg-gray-50 border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }}>Düzenleme Tarihi</td>
              <td className="border border-gray-300 p-1" style={{ verticalAlign: cellVAlign }} contentEditable suppressContentEditableWarning>{formatDateTR(emergencyData.date)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    )
  };

  // 2. Belirlenen Acil Durumlar Bloğu
  const emergenciesList = Array.isArray(emergencyData.emergencies) && emergencyData.emergencies.length > 0
    ? emergencyData.emergencies
    : ['Yangın', 'Deprem', 'İş Kazası', 'Kimyasal Döküntü / Parlama'];
  const blockEmergencies = {
    id: 'b_emergencies',
    basePt: 35 + (emergenciesList.length * 8),
    render: () => (
      <section key="b_emergencies" className="mb-2" style={{ breakInside: 'avoid' }}>
        <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1">
          2. BELİRLENEN ACİL DURUMLAR
        </h2>
        <div className="grid grid-cols-2 gap-1 p-1.5 bg-gray-50/70 border border-gray-200 rounded" style={{ fontSize: \`\${8 * fontScale}pt\`, textAlign: cellTAlign }}>
          {emergenciesList.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 px-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
              <span className="font-semibold text-gray-800" contentEditable suppressContentEditableWarning>{e}</span>
            </div>
          ))}
        </div>
      </section>
    )
  };

  // 3. Önleyici ve Sınırlandırıcı Tedbirler Bloğu
  const prevText = emergencyData.preventiveMeasures || '1. Elektrik tesisatının periyodik kontrollerinin yapılması.\\n2. Kimyasalların MSDS formlarına uygun depolanması.\\n3. Makine koruyucularının eksiksiz kullanılması.';
  const limitText = emergencyData.limitingMeasures || '1. Yangın tüplerinin ve hortumlarının her an kullanıma hazır tutulması.\\n2. Acil çıkış kapılarının dışarı açılır ve kilitli olmaması.';
  const tedbirChars = (prevText + limitText).length;
  const blockTedbirler = {
    id: 'b_tedbirler',
    basePt: 45 + Math.ceil(tedbirChars * 0.16),
    render: () => (
      <section key="b_tedbirler" className="mb-2" style={{ breakInside: 'avoid' }}>
        <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1">
          3. ÖNLEYİCİ VE SINIRLANDIRICI TEDBİRLER
        </h2>
        <div className="space-y-1" style={{ fontSize: \`\${8 * fontScale}pt\`, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
          <div className="border border-gray-200 rounded p-1.5 bg-gray-50/40">
            <h3 className="font-bold text-red-800 text-[8px] uppercase mb-0.5">Önleyici Tedbirler:</h3>
            <p className="whitespace-pre-wrap pl-1 text-gray-800" contentEditable suppressContentEditableWarning>{prevText}</p>
          </div>
          <div className="border border-gray-200 rounded p-1.5 bg-gray-50/40">
            <h3 className="font-bold text-amber-800 text-[8px] uppercase mb-0.5">Sınırlandırıcı Tedbirler:</h3>
            <p className="whitespace-pre-wrap pl-1 text-gray-800" contentEditable suppressContentEditableWarning>{limitText}</p>
          </div>
        </div>
      </section>
    )
  };

  // 4. Detaylı Acil Durum Prosedürleri Paragrafları
  const rawProcedures = (emergencyData.aiProcedures || '').trim();
  const procedureParagraphs = [];
  if (rawProcedures) {
    const rawLines = rawProcedures.split('\\n');
    let currentP = '';
    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentP) {
          procedureParagraphs.push(currentP);
          currentP = '';
        }
      } else {
        if (currentP.length > 400) {
          procedureParagraphs.push(currentP);
          currentP = trimmed;
        } else {
          currentP += (currentP ? '\\n' : '') + trimmed;
        }
      }
    });
    if (currentP) procedureParagraphs.push(currentP);
  }

  // Prosedür blokları listesi
  const procedureBlocks = procedureParagraphs.map((paraText, pIdx) => {
    const isFirst = pIdx === 0;
    const paraEstPt = 16 + Math.ceil(paraText.length * 0.20);
    return {
      id: \`b_proc_\${pIdx}\`,
      basePt: paraEstPt,
      isProcedure: true,
      isFirstProc: isFirst,
      render: (isStartOfPage) => (
        <div key={\`b_proc_\${pIdx}\`} className="mb-1.5" style={{ breakInside: 'avoid' }}>
          {(isFirst || isStartOfPage) && (
            <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1 flex items-center justify-between">
              <span>{isFirst ? '4. DETAYLI ACİL DURUM PROSEDÜRLERİ' : '4. DETAYLI ACİL DURUM PROSEDÜRLERİ (DEVAM)'}</span>
            </h2>
          )}
          <div
            className="whitespace-pre-wrap border border-gray-200 p-1.5 rounded bg-gray-50/50 text-gray-900"
            style={{ fontSize: \`\${8 * fontScale}pt\`, lineHeight: lineHeightVal, textAlign: cellTAlign }}
            contentEditable
            suppressContentEditableWarning
          >
            {paraText}
          </div>
        </div>
      )
    };
  });

  // 5. Acil Durum Ekipleri Bloğu
  const teams = emergencyData.teams || {};
  const blockTeams = {
    id: 'b_teams',
    basePt: 120,
    render: () => (
      <section key="b_teams" className="mb-2" style={{ breakInside: 'avoid' }}>
        <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1">
          {procedureParagraphs.length > 0 ? '5.' : '4.'} ACİL DURUM EKİPLERİ
        </h2>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: \`\${7.5 * fontScale}pt\`, textAlign: cellTAlign }} contentEditable suppressContentEditableWarning>
          <div className="border border-red-200 bg-red-50/30 p-1.5 rounded">
            <h3 className="font-bold text-red-700 border-b border-red-200 pb-0.5 mb-1 text-[8px] uppercase flex items-center justify-between">
              <span>Söndürme Ekibi</span>
              <span className="text-[6.5px] text-red-500 font-normal">Yangın & Müdahale</span>
            </h3>
            <ul className="list-decimal list-inside space-y-0.5">
              {(teams.fire && teams.fire.length > 0 ? teams.fire : ['Belirlenmedi']).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
          <div className="border border-amber-200 bg-amber-50/30 p-1.5 rounded">
            <h3 className="font-bold text-amber-700 border-b border-amber-200 pb-0.5 mb-1 text-[8px] uppercase flex items-center justify-between">
              <span>Arama ve Kurtarma Ekibi</span>
              <span className="text-[6.5px] text-amber-500 font-normal">Arama & Tahliye</span>
            </h3>
            <ul className="list-decimal list-inside space-y-0.5">
              {(teams.rescue && teams.rescue.length > 0 ? teams.rescue : ['Belirlenmedi']).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
          <div className="border border-blue-200 bg-blue-50/30 p-1.5 rounded">
            <h3 className="font-bold text-blue-700 border-b border-blue-200 pb-0.5 mb-1 text-[8px] uppercase flex items-center justify-between">
              <span>Koruma ve Tahliye Ekibi</span>
              <span className="text-[6.5px] text-blue-500 font-normal">Güvenlik & Sevk</span>
            </h3>
            <ul className="list-decimal list-inside space-y-0.5">
              {(teams.evacuation && teams.evacuation.length > 0 ? teams.evacuation : ['Belirlenmedi']).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
          <div className="border border-emerald-200 bg-emerald-50/30 p-1.5 rounded">
            <h3 className="font-bold text-emerald-700 border-b border-emerald-200 pb-0.5 mb-1 text-[8px] uppercase flex items-center justify-between">
              <span>İlkyardım Ekibi</span>
              <span className="text-[6.5px] text-emerald-500 font-normal">İlk Müdahale</span>
            </h3>
            <ul className="list-decimal list-inside space-y-0.5">
              {(teams.firstAid && teams.firstAid.length > 0 ? teams.firstAid : ['Belirlenmedi']).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </div>
      </section>
    )
  };

  // 6. Tahliye ve Toplanma Alanı Bloğu
  const blockGathering = {
    id: 'b_gathering',
    basePt: 50,
    render: () => (
      <section key="b_gathering" className="mb-2" style={{ breakInside: 'avoid' }}>
        <h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1">
          {procedureParagraphs.length > 0 ? '6.' : '5.'} TAHLİYE VE TOPLANMA ALANI
        </h2>
        <div className="p-2 border border-blue-200 bg-blue-50/30 rounded text-center" style={{ textAlign: cellTAlign }}>
          <div className="font-bold text-slate-800 text-[8.5px] uppercase tracking-wide" contentEditable suppressContentEditableWarning>
            📍 {emergencyData.gatheringPoint || 'Ana bina önündeki açık toplanma alanı'}
          </div>
          <p className="text-[7.5px] text-slate-500 mt-0.5">
            Acil durum anında bina tahliye planına uyularak sakin bir şekilde acil çıkış kapılarından toplanma bölgesine intikal ediniz.
          </p>
        </div>
      </section>
    )
  };

  // Tüm blokları sıralı diziye topla:
  const allBlocks = [
    blockInfo,
    blockEmergencies,
    blockTedbirler,
    ...procedureBlocks,
    blockTeams,
    blockGathering
  ];

  // AKILLI A4 SAYFALAMA VE TAŞMA MOTORU
  const pages = [];
  let currentPageBlocks = [];
  let currentAccumulatedPt = 0;

  allBlocks.forEach((block) => {
    const blockActualPt = block.basePt * fontScale * (lineHeightVal / 1.2);

    // Eğer mevcut sayfaya sığıyorsa veya sayfa henüz boşsa ekle
    if (currentPageBlocks.length === 0 || currentAccumulatedPt + blockActualPt <= PAGE_CAPACITY_PT) {
      currentPageBlocks.push(block);
      currentAccumulatedPt += blockActualPt;
    } else {
      // Sığmıyor: Mevcut sayfayı tamamla ve yeni sayfaya aktar (spill-over)
      pages.push(currentPageBlocks);
      currentPageBlocks = [block];
      currentAccumulatedPt = blockActualPt;
    }
  });

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks);
  }

  const totalPages = pages.length;

  const renderPageHeader = (pageNum) => (
    <table className="w-full border-collapse border border-gray-400 text-[8px] mb-2 leading-normal no-break" style={{ breakInside: 'avoid' }}>
      <tbody>
        <tr>
          <td className="border border-gray-400 p-1 text-center font-bold w-[18%] bg-white" style={{ verticalAlign: cellVAlign }} rowSpan={2}>
            {company.info?.logo ? (
              <img src={company.info.logo} style={{ maxHeight: '28px', margin: 'auto' }} alt="Logo" />
            ) : (
              <span className="text-[7.5px] tracking-wider uppercase text-gray-500 font-bold">{company.name || 'LOGO'}</span>
            )}
          </td>
          <td className="border border-gray-400 p-1 text-center font-bold text-[10px] uppercase w-[52%] tracking-wide bg-white" style={{ verticalAlign: cellVAlign }} rowSpan={2}>
            ACİL DURUM EYLEM PLANI RAPORU
          </td>
          <td className="border border-gray-400 px-2 py-0.5 font-bold w-[30%] text-left" style={{ verticalAlign: cellVAlign }}>
            Döküman No: <span className="font-normal" contentEditable suppressContentEditableWarning>{emergencyData.documentNo || 'ADEP-01'}</span>
          </td>
        </tr>
        <tr>
          <td className="border border-gray-400 px-2 py-0.5 font-bold text-left" style={{ verticalAlign: cellVAlign }}>
            Rev. No / Tarih: <span className="font-normal" contentEditable suppressContentEditableWarning>{emergencyData.revisionNo || '00'}</span> / <span className="font-normal" contentEditable suppressContentEditableWarning>{formatDateTR(emergencyData.revisionDate || emergencyData.date)}</span>
          </td>
        </tr>
        <tr>
          <td className="border border-gray-400 p-1 text-center font-bold text-[8px] uppercase bg-gray-50" style={{ verticalAlign: cellVAlign }} colSpan={2}>
            {company.name}
          </td>
          <td className="border border-gray-400 px-2 py-0.5 font-bold text-left" style={{ verticalAlign: cellVAlign }}>
            Sayfa No: <span className="font-bold text-indigo-700">{pageNum} / {totalPages}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const teamList = company.info?.team || [];
  const findMember = (keywords, defaultRole, defaultName, defaultCert = '') => {
    const found = teamList.find(m => keywords.some(k => (m.role || '').toLowerCase().includes(k)));
    if (found) {
      return {
        role: found.role || defaultRole,
        name: found.name || defaultName,
        cert: found.certificateNo || defaultCert
      };
    }
    return { role: defaultRole, name: defaultName, cert: defaultCert };
  };

  const sigMembers = [
    findMember(['işveren', 'isveren', 'yetkili'], 'İşveren / İşveren Vekili', company.info?.official || '................'),
    findMember(['uzman'], 'İş Güvenliği Uzmanı', emergencyData.preparerName || '................'),
    findMember(['hekim', 'doktor'], 'İşyeri Hekimi', '................'),
    findMember(['temsilci'], 'Çalışan Temsilcisi', '................'),
    findMember(['destek', 'ilkyardım', 'kurtarma'], 'Destek Elemanı', '................')
  ];

  const renderPageFooter = (pageNum) => {
    if (signatureStyle === 'hide') return null;

    if (signatureStyle === 'standard') {
      return (
        <div className="w-full border-t border-gray-400 pt-1.5 mt-auto no-break" style={{ breakInside: 'avoid' }}>
          <div className="text-[7.5px] font-bold uppercase bg-gray-100 py-0.5 border border-gray-300 mb-1 text-center flex items-center justify-between px-2">
            <span>Acil Durum Yönetim Ekibi İmzaları</span>
            <span className="text-gray-500 font-normal">Sayfa {pageNum} / {totalPages}</span>
          </div>
          <table className="w-full border-collapse border border-gray-300 text-center" style={{ tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                {sigMembers.map((m, idx) => (
                  <td key={idx} className="border border-gray-300 p-1 bg-white" style={{ verticalAlign: 'top', height: '48px' }}>
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="font-bold text-[7px] uppercase bg-gray-50 border-b border-gray-200 pb-0.5">{m.role}</div>
                        <div className="font-bold text-[7.5px] mt-0.5 text-gray-800">{m.name}</div>
                        {m.cert ? <div className="text-[6.5px] text-gray-500">{m.cert}</div> : null}
                      </div>
                      <div className="border-t border-dashed border-gray-300 pt-0.5 text-[6.5px] text-gray-400">İmza</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Default: 'compact'
    return (
      <div className="w-full border-t border-gray-400 pt-1 mt-auto no-break" style={{ breakInside: 'avoid' }}>
        <table className="w-full text-[8px] border-collapse">
          <tbody>
            <tr>
              <td className="text-left font-bold text-gray-700 w-1/2">HAZIRLAYANLAR / ONAYLAYANLAR</td>
              <td className="text-right font-bold text-gray-500 w-1/2">Sayfa {pageNum} / {totalPages}</td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-1">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {sigMembers.map((m, idx) => (
                    <div key={idx} className="border border-gray-200 rounded p-1 bg-gray-50/80 leading-tight">
                      <div className="font-bold text-[6.5px] uppercase text-gray-600 border-b border-gray-200 pb-0.5 mb-0.5 truncate">{m.role}</div>
                      <div className="font-bold text-[7.5px] text-slate-800 truncate">{m.name}</div>
                      <div className="text-[6.5px] text-gray-400 truncate">{m.cert || 'İmza: ......'}</div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="printable-area" className="w-[210mm] min-w-[210mm] mx-auto no-print-shadows">
      <style>{\`
        .acil-durum-page {
            width: 210mm;
            min-width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            background: white;
            padding: \${reportPadding};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: black;
            box-sizing: border-box;
            margin-bottom: 20px;
            overflow: hidden;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            line-height: \${reportLineHeight};
        }
        
        .acil-durum-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
        }
        .acil-durum-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        
        @media print {
            .bg-slate-300 { background: none; padding: 0; }
            .no-print-space-y { margin: 0 !important; gap: 0 !important; }
            .acil-durum-page {
                box-shadow: none !important;
                margin: 0 !important;
                margin-bottom: 0 !important;
                width: 210mm !important;
                min-width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                min-height: 297mm !important;
                padding: \${reportPadding} !important;
                overflow: hidden !important;
                background: white !important;
                break-inside: avoid-page !important;
                page-break-inside: avoid !important;
                box-sizing: border-box !important;
            }
            .acil-durum-page:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
            }
            .acil-durum-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
        }
      \`}</style>

      {pages.map((pageBlockList, pageIdx) => (
        <div key={pageIdx} className="acil-durum-page" style={{ fontSize: \`\${fontPt}pt\` }}>
          <div className="flex-1 flex flex-col min-h-0">
            {renderPageHeader(pageIdx + 1)}
            <div className="flex-1 flex flex-col">
              {pageBlockList.map((b, bIdx) => typeof b.render === 'function' ? b.render(bIdx === 0) : null)}
            </div>
          </div>

          {renderPageFooter(pageIdx + 1)}
        </div>
      ))}
    </div>
  );
};

`;

content = content.slice(0, previewStartIdx) + newAcilDurumReportPreview + content.slice(previewEndIdx);
console.log("5. AcilDurumReportPreview completely upgraded with smart A4 block packing and advanced features.");

fs.writeFileSync(targetFile, content, 'utf8');
console.log("All Acil Durum updates successfully written to App.jsx!");
