const fs = require('fs');
const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let appContent = fs.readFileSync(targetAppPath, 'utf8');

appContent = appContent.replace(
  /function AdminPanel[\s\S]*?return \(\s*<div \s*className="panel-scroll-container bg-slate-50 font-sans custom-panel-scrollbar flex flex-col"\s*style=\{\{\s*WebkitOverflowScrolling: 'touch',\s*touchAction: 'pan-y pinch-zoom'/,
  (match) => match.replace("touchAction: 'pan-y pinch-zoom'", "touchAction: 'pan-x pan-y pinch-zoom'")
);

fs.writeFileSync(targetAppPath, appContent, 'utf8');
console.log('>>> AdminPanel touchAction updated to pan-x pan-y pinch-zoom!');
