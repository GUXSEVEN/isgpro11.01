const fs = require('fs');
const path = require('path');

const candidates = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy'
];

const panelRoot = candidates.find(p => fs.existsSync(p));

if (!panelRoot) {
  console.error('❌ Panel directory not found in candidates:', candidates);
  process.exit(1);
}

console.log(`>>> [Scroll Fix] Target panel directory: ${panelRoot}`);

// 1. PATCH index.css
const cssPath = path.join(panelRoot, 'src/index.css');
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  if (!cssContent.includes('.panel-scroll-container')) {
    const scrollContainerCSS = `
/* ── PANEL STANDALONE VIEWS DEDICATED SCROLL CONTAINER (ADMIN, CHECKOUT, OSGB) ── */
.panel-scroll-container {
  height: 100% !important;
  height: 100dvh !important;
  width: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-y pinch-zoom !important;
  overscroll-behavior-y: contain !important;
  position: relative;
}
`;
    cssContent += '\n' + scrollContainerCSS;
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log('✔ [1/4] index.css patched with .panel-scroll-container');
  } else {
    console.log('ℹ [1/4] index.css already contains .panel-scroll-container');
  }
} else {
  console.warn('⚠ index.css not found at', cssPath);
}

// 2. PATCH App.jsx
const appPath = path.join(panelRoot, 'src/App.jsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');

  // A) Patch AdminPanel Root Div
  const adminPanelOld = `<div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm pt-[max(0.75rem,env(safe-area-inset-top))]">`;

  const adminPanelNew = `<div 
      className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y pinch-zoom',
        overscrollBehaviorY: 'contain'
      }}
    >
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">`;

  if (appContent.includes(adminPanelOld)) {
    appContent = appContent.replace(adminPanelOld, adminPanelNew);
    console.log('✔ [2/4] AdminPanel root div updated with scroll container');
  } else {
    const adminRegex = /function AdminPanel\([\s\S]*?return\s*\(\s*<div\s+className="min-h-screen\s+bg-slate-50\s+font-sans">/m;
    if (adminRegex.test(appContent)) {
      appContent = appContent.replace(
        adminRegex,
        (match) => match.replace(
          '<div className="min-h-screen bg-slate-50 font-sans">',
          `<div className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y pinch-zoom', overscrollBehaviorY: 'contain' }}>`
        )
      );
      console.log('✔ [2/4] AdminPanel root div regex-patched with scroll container');
    } else {
      console.warn('⚠ [2/4] AdminPanel pattern not matched or already patched');
    }
  }

  // Ensure AdminPanel main has flex-1 w-full
  appContent = appContent.replace(
    '<main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">',
    '<main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 flex-1 w-full">'
  );

  // B) Patch CheckoutView Root Div & Main Flexbox
  const checkoutOld = `<div className="min-h-screen font-sans flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>
      {/* HEADER */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5 px-6 border-b border-slate-200">`;

  const checkoutNew = `<div 
      className="panel-scroll-container font-sans flex flex-col justify-between custom-panel-scrollbar" 
      style={{ 
        background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y pinch-zoom',
        overscrollBehaviorY: 'contain'
      }}
    >
      {/* HEADER */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5 px-6 border-b border-slate-200 shrink-0">`;

  if (appContent.includes(checkoutOld)) {
    appContent = appContent.replace(checkoutOld, checkoutNew);
    console.log('✔ [3/4] CheckoutView root div updated with scroll container');
  } else {
    const checkoutRegex = /function CheckoutView\([\s\S]*?return\s*\(\s*<div\s+className="min-h-screen\s+font-sans\s+flex\s+flex-col\s+justify-between"/m;
    if (checkoutRegex.test(appContent)) {
      appContent = appContent.replace(
        checkoutRegex,
        (match) => match.replace(
          'className="min-h-screen font-sans flex flex-col justify-between"',
          'className="panel-scroll-container font-sans flex flex-col justify-between custom-panel-scrollbar"'
        )
      );
      console.log('✔ [3/4] CheckoutView root div regex-patched');
    } else {
      console.warn('⚠ [3/4] CheckoutView pattern not matched or already patched');
    }
  }

  // Fix CheckoutView main container justify-center data loss bug
  const checkoutMainOld = '<main className="max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6 px-4">';
  const checkoutMainNew = '<main className="max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-start my-4 md:my-6 px-4">';
  if (appContent.includes(checkoutMainOld)) {
    appContent = appContent.replace(checkoutMainOld, checkoutMainNew);
    console.log('✔ [3/4b] CheckoutView main flexbox updated to justify-start (prevents top/bottom clipping)');
  }

  // Ensure CheckoutView footer is shrink-0
  appContent = appContent.replace(
    '<footer className="max-w-6xl mx-auto w-full text-center py-4 px-6 border-t border-slate-200 text-xs text-slate-400">',
    '<footer className="max-w-6xl mx-auto w-full text-center py-4 px-6 border-t border-slate-200 text-xs text-slate-400 shrink-0 mt-auto">'
  );

  // C) Patch OsgbManagerPanel Root Div
  const osgbReturnOld = `  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm pt-[max(0.75rem,env(safe-area-inset-top))]">`;

  const osgbReturnNew = `  return (
    <div 
      className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y pinch-zoom',
        overscrollBehaviorY: 'contain'
      }}
    >
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">`;

  if (appContent.includes(osgbReturnOld)) {
    appContent = appContent.replace(osgbReturnOld, osgbReturnNew);
    console.log('✔ [4/4] OsgbManagerPanel root div updated with scroll container');
  }

  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('🎉 [DONE] All scroll patches written to App.jsx successfully!');
} else {
  console.error('❌ App.jsx not found at', appPath);
}
