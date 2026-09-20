const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Backup
fs.writeFileSync(targetFile + '.bak_menu_move', content, 'utf8');
console.log('Backup created successfully.');

const emergencyMarker = "setWorkspaceActiveTab('emergency');";
const formsMarker = "setWorkspaceActiveTab('forms');";
const libraryMarker = "setWorkspaceActiveTab('library');";
const reportMarker = "setShowAdvancedReport(true);";

const emergencyIdx = content.indexOf(emergencyMarker);
if (emergencyIdx === -1) {
  console.error('Error: emergencyMarker not found!');
  process.exit(1);
}

// Find button enclosing emergencyMarker
const emergencyBtnStart = content.lastIndexOf('<button', emergencyIdx);
const emergencyBtnEnd = content.indexOf('</button>', emergencyIdx) + '</button>'.length;
const emergencyBtnText = content.substring(emergencyBtnStart, emergencyBtnEnd);

console.log('Found Emergency Button:');
console.log(emergencyBtnText);

// Find bottom library and report button
// Search from after risk_map
const riskMapIdx = content.indexOf("setWorkspaceActiveTab('risk_map');");
if (riskMapIdx === -1) {
  console.error('Error: risk_map not found!');
  process.exit(1);
}

const bottomLibraryIdx = content.indexOf(libraryMarker, riskMapIdx);
const bottomLibraryBtnStart = content.lastIndexOf('<button', bottomLibraryIdx);
const bottomLibraryBtnEnd = content.indexOf('</button>', bottomLibraryIdx) + '</button>'.length;
const bottomLibraryBtnText = content.substring(bottomLibraryBtnStart, bottomLibraryBtnEnd);

console.log('\nFound Bottom Library Button:');
console.log(bottomLibraryBtnText);

const bottomReportIdx = content.indexOf(reportMarker, bottomLibraryBtnEnd);
const bottomReportBtnStart = content.lastIndexOf('<button', bottomReportIdx);
const bottomReportBtnEnd = content.indexOf('</button>', bottomReportIdx) + '</button>'.length;
const bottomReportBtnText = content.substring(bottomReportBtnStart, bottomReportBtnEnd);

console.log('\nFound Bottom Report Button:');
console.log(bottomReportBtnText);

// New Report Button
const newReportBtnText = `              <button
                onClick={() => {
                  setShowAdvancedReport(true);
                  if (isMobile) setIsDrawerOpen(false);
                }}
                title={isCollapsed ? "Rapor Oluştur" : undefined}
                className={\`w-full flex items-center \${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-xs font-bold transition-all text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20\`}
              >
                <Printer size={15} />
                {!isCollapsed && <span>Rapor Oluştur</span>}
              </button>`;

// New Library Button
const newLibraryBtnText = `              <button
                onClick={() => {
                  setWorkspaceActiveTab('library');
                  if (isMobile) setIsDrawerOpen(false);
                }}
                title={isCollapsed ? "Kütüphane" : undefined}
                className={\`w-full flex items-center \${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-xs font-bold transition-all \${
                  workspaceActiveTab === 'library'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-950 dark:hover:text-slate-100'
                }\`}
              >
                <Library size={15} />
                {!isCollapsed && <span>Kütüphane</span>}
              </button>`;

// First remove bottom buttons
// Remove from bottomLibraryBtnStart to bottomReportBtnEnd (plus indentation if needed)
const beforeBottom = content.substring(0, bottomLibraryBtnStart);
const afterBottom = content.substring(bottomReportBtnEnd);
content = beforeBottom + afterBottom;

// Now insert after emergencyBtnText
const updatedEmergencyIdx = content.indexOf(emergencyMarker);
const updatedEmergencyBtnStart = content.lastIndexOf('<button', updatedEmergencyIdx);
const updatedEmergencyBtnEnd = content.indexOf('</button>', updatedEmergencyIdx) + '</button>'.length;

const beforeEmergency = content.substring(0, updatedEmergencyBtnEnd);
const afterEmergency = content.substring(updatedEmergencyBtnEnd);

const insertion = '\n\n' + newReportBtnText + '\n\n' + newLibraryBtnText;
content = beforeEmergency + insertion + afterEmergency;

fs.writeFileSync(targetFile, content, 'utf8');
console.log('\nApp.jsx successfully patched!');
