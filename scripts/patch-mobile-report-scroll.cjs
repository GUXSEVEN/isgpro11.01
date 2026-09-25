const fs = require('fs');

const files = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add previewRef and containerHeight state + ResizeObserver effect in AdvancedReportModal
  const targetState = `  const [photoCustomStyles, setPhotoCustomStyles] = useState({});`;
  const replState = `  const [photoCustomStyles, setPhotoCustomStyles] = useState({});
  const previewRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(null);

  useEffect(() => {
    const updateH = () => {
      if (previewRef.current) {
        const unscaledH = previewRef.current.offsetHeight;
        if (unscaledH > 0) {
          setContainerHeight(Math.ceil(unscaledH * previewZoom) + 80);
        }
      }
    };
    updateH();
    let ro;
    if (typeof ResizeObserver !== 'undefined' && previewRef.current) {
      ro = new ResizeObserver(updateH);
      ro.observe(previewRef.current);
    }
    const t = setTimeout(updateH, 100);
    const t2 = setTimeout(updateH, 400);
    return () => {
      if (ro) ro.disconnect();
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [previewZoom, reportType, reportFontSize, itemsPerPage, photoHeight, photoFit]);`;

  if (code.includes(targetState) && !code.includes('const [containerHeight, setContainerHeight]')) {
    code = code.replace(targetState, replState);
    modified = true;
  }

  // 2. Add min-h-0 to preview parent container
  const targetParent = `<div className="flex-1 bg-slate-200/50 overflow-hidden relative flex flex-col">`;
  const replParent = `<div className="flex-1 min-h-0 bg-slate-200/50 overflow-hidden relative flex flex-col">`;
  if (code.includes(targetParent)) {
    code = code.replace(targetParent, replParent);
    modified = true;
  }

  // 3. Update the scroll container and preview-container wrapper
  const oldScrollSection = `        {/* Scroll Container: Mobilde ve masaüstünde taşmayı yönetir */}
        <div className="flex-1 overflow-auto p-2 md:p-8 w-full h-full touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
          {/* İçerik Wrapper: İçeriğin küçülmesini engeller, A4 boyutunu korur (w-fit ve min-w-fit KRİTİK) */}
          <div
            id="report-preview-container"
            className="mx-auto w-fit min-w-fit shadow-2xl bg-white origin-top transition-transform duration-150"
            style={{ transform: \`scale(\${previewZoom})\`, transformOrigin: 'top center', marginBottom: \`\${(previewZoom - 1) * 100}%\` }}
          >`;

  const newScrollSection = `        {/* Scroll Container: Mobilde ve masaüstünde dikey/yatay kaydırmayı kusursuz yönetir */}
        <div 
          className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-auto p-2 sm:p-4 md:p-8 overscroll-contain pb-24" 
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          {/* İçerik Sizer: previewZoom ölçeklemesinde dikey ve yatay kaydırma alanını kusursuz korur */}
          <div
            className="w-fit min-w-fit mx-auto"
            style={containerHeight ? { height: \`\${containerHeight}px\`, minHeight: \`\${containerHeight}px\` } : undefined}
          >
            {/* İçerik Wrapper: İçeriğin küçülmesini engeller, A4 boyutunu korur (w-fit ve min-w-fit KRİTİK) */}
            <div
              ref={previewRef}
              id="report-preview-container"
              className="mx-auto w-fit min-w-fit shadow-2xl bg-white origin-top transition-transform duration-150"
              style={{ transform: \`scale(\${previewZoom})\`, transformOrigin: 'top center' }}
            >`;

  if (code.includes(oldScrollSection)) {
    code = code.replace(oldScrollSection, newScrollSection);
    
    // Also close the extra sizer div
    const oldClosing = `            {reportType === 'acil-durum' && (
              <AcilDurumReportPreview
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                removeEmpty={removeEmpty}
              />
            )}

          </div>
        </div>
      </div>`;

    const newClosing = `            {reportType === 'acil-durum' && (
              <AcilDurumReportPreview
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                removeEmpty={removeEmpty}
              />
            )}

          </div>
        </div>
      </div>
    </div>`;

    if (code.includes(oldClosing)) {
      code = code.replace(oldClosing, newClosing);
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched mobile scroll in:', filePath);
  } else {
    console.log('No patch needed or pattern not matched in:', filePath);
  }
});
