const fs = require('fs');

// 1. PATCH IsgEducationTab.jsx
const isgFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/IsgEducationTab.jsx';
let isgContent = fs.readFileSync(isgFile, 'utf8');

// Backup
fs.writeFileSync(isgFile + '.bak_hub_link', isgContent, 'utf8');

// Props
const oldIsgProps = `export default function IsgEducationTab({ 
  company, 
  currentUser, 
  users = [], 
  companies = [], 
  osgbs = [], 
  onUpdateCompany 
}) {`;

const newIsgProps = `export default function IsgEducationTab({ 
  company, 
  currentUser, 
  users = [], 
  companies = [], 
  osgbs = [], 
  onUpdateCompany,
  initialActiveTab = 'form',
  initialRecordForPrint = null,
  onBackToHub = null
}) {`;

if (isgContent.includes(oldIsgProps)) {
  isgContent = isgContent.replace(oldIsgProps, newIsgProps);
  console.log('✓ Updated IsgEducationTab props');
}

// activeTab state
const oldActiveTabState = `const [activeTab, setActiveTab] = useState('form'); // 'form' | 'records' | 'templates' | 'quiz' | 'print_tutanak' | 'print_certificates'`;
const newActiveTabState = `const [activeTab, setActiveTab] = useState(initialActiveTab || 'form'); // 'form' | 'records' | 'templates' | 'quiz' | 'print_tutanak' | 'print_certificates'
  useEffect(() => {
    if (initialActiveTab) setActiveTab(initialActiveTab);
  }, [initialActiveTab]);`;

if (isgContent.includes(oldActiveTabState)) {
  isgContent = isgContent.replace(oldActiveTabState, newActiveTabState);
  console.log('✓ Updated activeTab in IsgEducationTab');
}

// activeRecordForPrint state
const oldRecordState = `const [activeRecordForPrint, setActiveRecordForPrint] = useState(null);`;
const newRecordState = `const [activeRecordForPrint, setActiveRecordForPrint] = useState(initialRecordForPrint || null);
  useEffect(() => {
    if (initialRecordForPrint) setActiveRecordForPrint(initialRecordForPrint);
  }, [initialRecordForPrint]);`;

if (isgContent.includes(oldRecordState)) {
  isgContent = isgContent.replace(oldRecordState, newRecordState);
  console.log('✓ Updated activeRecordForPrint in IsgEducationTab');
}

// Add onBackToHub button in renderReportingToolbar
const toolbarBackBtn = `<button 
              type="button"
              onClick={() => setActiveTab('records')}`;

const newToolbarBackBtn = `{typeof onBackToHub === 'function' && (
              <button 
                type="button"
                onClick={onBackToHub} 
                className="flex items-center gap-1.5 text-xs font-black text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 px-3.5 py-1.5 rounded-xl border border-indigo-700/80 transition cursor-pointer shadow-sm"
              >
                <ArrowLeft size={15} /> Eğitim Merkezine Dön
              </button>
            )}
            <button 
              type="button"
              onClick={() => setActiveTab('records')}`;

if (isgContent.includes(toolbarBackBtn) && !isgContent.includes('Eğitim Merkezine Dön')) {
  isgContent = isgContent.replace(toolbarBackBtn, newToolbarBackBtn);
  console.log('✓ Added onBackToHub button to IsgEducationTab toolbar');
}

fs.writeFileSync(isgFile, isgContent, 'utf8');
console.log('✓ IsgEducationTab successfully updated');


// 2. PATCH JobInductionTrainingTab.jsx
const indFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/JobInductionTrainingTab.jsx';
let indContent = fs.readFileSync(indFile, 'utf8');

// Backup
fs.writeFileSync(indFile + '.bak_hub_link', indContent, 'utf8');

const oldIndProps = `export default function JobInductionTrainingTab({
  company,
  companies = [],
  users = [],
  currentUser,
  onUpdateCompany,
  employees: externalEmployees = null,
  initialEmployee = null,
  onClearInitialEmployee
}) {`;

const newIndProps = `export default function JobInductionTrainingTab({
  company,
  companies = [],
  users = [],
  currentUser,
  onUpdateCompany,
  employees: externalEmployees = null,
  initialEmployee = null,
  onClearInitialEmployee,
  initialActiveTab = 'list',
  initialRecordForPrint = null,
  onBackToHub = null
}) {`;

if (indContent.includes(oldIndProps)) {
  indContent = indContent.replace(oldIndProps, newIndProps);
  console.log('✓ Updated JobInductionTrainingTab props');
}

// activeTab in JobInductionTrainingTab
const oldIndActiveTab = `const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form' | 'archive' | 'print'`;
const newIndActiveTab = `const [activeTab, setActiveTab] = useState(initialActiveTab || 'list'); // 'list' | 'form' | 'archive' | 'print'
  useEffect(() => {
    if (initialActiveTab) setActiveTab(initialActiveTab);
  }, [initialActiveTab]);`;

if (indContent.includes(oldIndActiveTab)) {
  indContent = indContent.replace(oldIndActiveTab, newIndActiveTab);
  console.log('✓ Updated activeTab in JobInductionTrainingTab');
}

// activeRecordForPrint in JobInductionTrainingTab
const oldIndRecord = `const [activeRecordForPrint, setActiveRecordForPrint] = useState(null);`;
const newIndRecord = `const [activeRecordForPrint, setActiveRecordForPrint] = useState(initialRecordForPrint || null);
  useEffect(() => {
    if (initialRecordForPrint) setActiveRecordForPrint(initialRecordForPrint);
  }, [initialRecordForPrint]);`;

if (indContent.includes(oldIndRecord)) {
  indContent = indContent.replace(oldIndRecord, newIndRecord);
  console.log('✓ Updated activeRecordForPrint in JobInductionTrainingTab');
}

// Add onBackToHub button in print toolbar
const indToolbarBack = `<button
                type="button"
                onClick={() => setActiveTab('list')}`;

const newIndToolbarBack = `{typeof onBackToHub === 'function' && (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="px-3.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-indigo-700/80 shadow-sm"
                >
                  <ArrowLeft size={14} /> Eğitim Merkezine Dön
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('list')}`;

if (indContent.includes(indToolbarBack) && !indContent.includes('Eğitim Merkezine Dön')) {
  indContent = indContent.replace(indToolbarBack, newIndToolbarBack);
  console.log('✓ Added onBackToHub button to JobInductionTrainingTab toolbar');
}

fs.writeFileSync(indFile, indContent, 'utf8');
console.log('✓ JobInductionTrainingTab successfully updated');
