const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Backup original App.jsx
fs.writeFileSync(targetFile + '.bak_before_education_hub', content, 'utf8');
console.log('✓ Backup created at App.jsx.bak_before_education_hub');

// 1. Add Import for EducationHubTab if not present
const importMarker = "import IsgEducationTab from './components/tabs/IsgEducationTab';";
const educationHubImport = "import EducationHubTab from './components/tabs/EducationHubTab';\n";

if (!content.includes("import EducationHubTab")) {
  if (content.includes(importMarker)) {
    content = content.replace(importMarker, educationHubImport + importMarker);
    console.log('✓ Added EducationHubTab import');
  } else {
    console.error('Could not find importMarker');
  }
}

// 2. Add Tab Label & Module Tabs definitions
if (!content.includes("education_hub: 'Eğitim Yönetim Merkezi'")) {
  content = content.replace(
    "const TAB_LABEL_MAP = {",
    "const TAB_LABEL_MAP = {\n  education_hub: 'Eğitim Yönetim Merkezi',"
  );
  console.log('✓ Added education_hub to TAB_LABEL_MAP');
}

if (!content.includes("id: 'education_hub'")) {
  content = content.replace(
    "const WORKSPACE_MODULE_TABS = [",
    "const WORKSPACE_MODULE_TABS = [\n  { id: 'education_hub', label: 'Eğitim Merkezi', icon: GraduationCap },"
  );
  console.log('✓ Added education_hub to WORKSPACE_MODULE_TABS');
}

// 3. Add isEducationGroupOpen state if not present
const stateMarker = "const [workspaceActiveTab, setWorkspaceActiveTab] = useState('assessment');";
const stateCode = "const [isEducationGroupOpen, setIsEducationGroupOpen] = useState(true);\n  ";

if (!content.includes("const [isEducationGroupOpen, setIsEducationGroupOpen]")) {
  content = content.replace(stateMarker, stateCode + stateMarker);
  console.log('✓ Added isEducationGroupOpen state');
}

// 4. In Workspace component, render EducationHubTab
const workspaceTabMarker = "{!isTabLockedForUser('education', currentUser) && activeTab === 'education' && (";
const educationHubTabRender = `{activeTab === 'education_hub' && (
            <EducationHubTab
              company={company}
              currentUser={currentUser}
              users={users}
              companies={companies}
              osgbs={osgbs}
              employees={company?.employees || company?.info?.employees || []}
              onUpdateCompany={onUpdateActiveCompany}
              setActiveTab={setActiveTab}
            />
          )}
          `;

if (!content.includes("<EducationHubTab")) {
  content = content.replace(workspaceTabMarker, educationHubTabRender + workspaceTabMarker);
  console.log('✓ Added <EducationHubTab> render block in Workspace');
}

// 5. Sidebar Menu Reorganization
// Find the button for 'education' up to button for 'nearmiss'
const educationBtnStart = content.indexOf("setWorkspaceActiveTab('education');");
if (educationBtnStart === -1) {
  console.error('Could not find setWorkspaceActiveTab education');
  process.exit(1);
}
const educationButtonTagStart = content.lastIndexOf('<button', educationBtnStart);
const educationButtonTagEnd = content.indexOf('</button>', educationBtnStart) + '</button>'.length;

// Find onboarding_training button
const onboardingBtnStart = content.indexOf("setWorkspaceActiveTab('onboarding_training');");
const onboardingButtonTagStart = content.lastIndexOf('<button', onboardingBtnStart);
const onboardingButtonTagEnd = content.indexOf('</button>', onboardingBtnStart) + '</button>'.length;

// Find accident button
const accidentBtnStart = content.indexOf("setWorkspaceActiveTab('accident');");
const accidentButtonTagStart = content.lastIndexOf('<button', accidentBtnStart);
const accidentButtonTagEnd = content.indexOf('</button>', accidentBtnStart) + '</button>'.length;

console.log('Positions found:');
console.log('Education button:', educationButtonTagStart, educationButtonTagEnd);
console.log('Onboarding button:', onboardingButtonTagStart, onboardingButtonTagEnd);
console.log('Accident button:', accidentButtonTagStart, accidentButtonTagEnd);

// Grouped Accordion Menu Code
const groupedEducationMenu = `{/* ========================================================================= */}
              {/* EĞİTİM & OLAY YÖNETİMİ MENÜ GRUBU (YENİ NESİL KULLANICI DOSTU) */}
              {/* ========================================================================= */}
              <div className="pt-1.5 pb-1">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setIsEducationGroupOpen(!isEducationGroupOpen)}
                    className={\`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all \${
                      ['education_hub', 'education', 'onboarding_training', 'accident'].includes(workspaceActiveTab)
                        ? 'bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }\`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <GraduationCap size={14} />
                      </div>
                      <span className="tracking-tight font-extrabold text-[12px] truncate">Eğitim & Olay Yönetimi</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                        Modüller
                      </span>
                      {isEducationGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setWorkspaceActiveTab('education_hub');
                      if (isMobile) setIsDrawerOpen(false);
                    }}
                    title="Eğitim & Olay Yönetimi"
                    className={\`w-full flex items-center justify-center px-2 py-2.5 rounded-xl text-xs font-bold transition-all \${
                      ['education_hub', 'education', 'onboarding_training', 'accident'].includes(workspaceActiveTab)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                    }\`}
                  >
                    <GraduationCap size={17} />
                  </button>
                )}

                {/* Grup Alt Menüleri */}
                {(!isCollapsed ? isEducationGroupOpen : false) && (
                  <div className="mt-1 pl-3 pr-1 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-3">
                    
                    {/* 1. Eğitim Yönetim Merkezi & Sihirbazı */}
                    <button
                      onClick={() => {
                        setWorkspaceActiveTab('education_hub');
                        if (isMobile) setIsDrawerOpen(false);
                      }}
                      className={\`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all \${
                        workspaceActiveTab === 'education_hub'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }\`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles size={13} className={workspaceActiveTab === 'education_hub' ? 'text-white' : 'text-indigo-500'} />
                        <span className="truncate">Eğitim Merkezi (Sihirbaz)</span>
                      </div>
                      <span className={\`text-[8px] font-black uppercase px-1 py-0.5 rounded \${
                        workspaceActiveTab === 'education_hub' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }\`}>
                        Sihirbaz
                      </span>
                    </button>

                    {/* 2. Temel İSG Eğitimi */}
                    <button
                      onClick={() => {
                        setWorkspaceActiveTab('education');
                        if (isMobile) setIsDrawerOpen(false);
                      }}
                      className={\`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all \${
                        workspaceActiveTab === 'education'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }\`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen size={13} className={workspaceActiveTab === 'education' ? 'text-slate-950' : 'text-amber-500'} />
                        <span className="truncate">Temel İSG Eğitimi</span>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400">
                        8-16 Sa
                      </span>
                    </button>

                    {/* 3. İşe Başlama Eğitimi (Madde 7) */}
                    <button
                      onClick={() => {
                        setWorkspaceActiveTab('onboarding_training');
                        if (isMobile) setIsDrawerOpen(false);
                      }}
                      className={\`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all \${
                        workspaceActiveTab === 'onboarding_training'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }\`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Briefcase size={13} className={workspaceActiveTab === 'onboarding_training' ? 'text-white' : 'text-rose-500'} />
                        <span className="truncate">İşe Başlama (Madde 7)</span>
                      </div>
                      <span className={\`text-[8px] font-black uppercase px-1 py-0.5 rounded \${
                        workspaceActiveTab === 'onboarding_training' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }\`}>
                        Acil
                      </span>
                    </button>

                    {/* 4. İş Kazası & Olay Yönetimi */}
                    <button
                      onClick={() => {
                        setWorkspaceActiveTab('accident');
                        if (isMobile) setIsDrawerOpen(false);
                      }}
                      className={\`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all \${
                        workspaceActiveTab === 'accident'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }\`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertOctagon size={13} className={workspaceActiveTab === 'accident' ? 'text-white' : 'text-purple-500'} />
                        <span className="truncate">İş Kazası & Olay Eğitimi</span>
                      </div>
                      <span className={\`text-[8px] font-black uppercase px-1 py-0.5 rounded \${
                        workspaceActiveTab === 'accident' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      }\`}>
                        Olay
                      </span>
                    </button>

                  </div>
                )}
              </div>`;

// Replace education button with the full grouped menu
// And remove onboarding and accident buttons so they are not duplicated
// Note: We need to perform the replacements in order from bottom to top so indices don't shift!

// 1. Remove accident button
content = content.substring(0, accidentButtonTagStart) + content.substring(accidentButtonTagEnd);
console.log('✓ Removed old separate accident button');

// Recalculate onboarding position
const newOnboardingBtnStart = content.indexOf("setWorkspaceActiveTab('onboarding_training');");
const newOnboardingTagStart = content.lastIndexOf('<button', newOnboardingBtnStart);
const newOnboardingTagEnd = content.indexOf('</button>', newOnboardingBtnStart) + '</button>'.length;
content = content.substring(0, newOnboardingTagStart) + content.substring(newOnboardingTagEnd);
console.log('✓ Removed old separate onboarding button');

// Recalculate education position and replace with groupedEducationMenu
const newEduBtnStart = content.indexOf("setWorkspaceActiveTab('education');");
const newEduTagStart = content.lastIndexOf('<button', newEduBtnStart);
const newEduTagEnd = content.indexOf('</button>', newEduBtnStart) + '</button>'.length;
content = content.substring(0, newEduTagStart) + groupedEducationMenu + content.substring(newEduTagEnd);
console.log('✓ Replaced old education button with modern unified Education & Event Group Menu');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✓ App.jsx successfully updated and saved!');
