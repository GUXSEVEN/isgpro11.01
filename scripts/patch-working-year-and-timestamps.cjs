/**
 * ISGPRO - Çalışma Yılı, Zaman Damgası ve Yıllık Filtreleme Entegrasyon Patch Scripti
 */
const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';

if (!fs.existsSync(targetPath)) {
  console.error('Hedef dosya bulunamadı:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// Yedek al
const backupPath = targetPath + '.bak_before_working_year_patch';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log('Yedek alındı:', backupPath);
}

// 1. IMPORT EKLEME
const importHook = "import AnnualPlanTab from './components/tabs/AnnualPlanTab';";
const newImports = `import AnnualPlanTab from './components/tabs/AnnualPlanTab';
import DateFilterToolbar from './components/common/DateFilterToolbar';
import {
  normalizeCompanyRecordsWithTimestamps,
  filterRecordsByDate,
  filterRecordsByWorkingYear,
  getAvailableYearsFromRecords
} from './utils/dateFilterHelper';`;

if (!content.includes('dateFilterHelper')) {
  if (content.includes(importHook)) {
    content = content.replace(importHook, newImports);
    console.log('✓ dateFilterHelper ve DateFilterToolbar importları eklendi.');
  } else {
    // Alternatif import yeri
    const altHook = "import LogoImage from './assets/logo.png';";
    content = content.replace(altHook, `${altHook}\nimport DateFilterToolbar from './components/common/DateFilterToolbar';\nimport { normalizeCompanyRecordsWithTimestamps, filterRecordsByDate, filterRecordsByWorkingYear, getAvailableYearsFromRecords } from './utils/dateFilterHelper';`);
    console.log('✓ dateFilterHelper ve DateFilterToolbar importları (alternatif) eklendi.');
  }
}

// 2. ACTIVE COMPANY NORMALIZATION (Zaman damgalama)
const activeCompanyHook = "const activeCompany = (isSystemAdmin ? companies : allowedCompanies).find(c => String(c.id) === String(activeCompanyId));";
const activeCompanyReplacement = `const rawActiveCompany = (isSystemAdmin ? companies : allowedCompanies).find(c => String(c.id) === String(activeCompanyId));
  const activeCompany = useMemo(() => {
    if (!rawActiveCompany) return null;
    return normalizeCompanyRecordsWithTimestamps(rawActiveCompany);
  }, [rawActiveCompany]);`;

if (content.includes(activeCompanyHook)) {
  content = content.replace(activeCompanyHook, activeCompanyReplacement);
  console.log('✓ activeCompany için normalizeCompanyRecordsWithTimestamps bağlandı.');
}

// 3. UPDATE ACTIVE COMPANY'DE OTOMATİK DAMGALAMA
const updateActiveCompanyHook = `const updateActiveCompany = (updates) => {
    const updatedAt = Date.now();`;

const updateActiveCompanyReplacement = `const updateActiveCompany = (updates) => {
    const updatedAt = Date.now();
    const cleanUpdates = (updates && typeof updates === 'object') ? normalizeCompanyRecordsWithTimestamps(updates) : updates;
    updates = cleanUpdates;`;

if (content.includes(updateActiveCompanyHook)) {
  content = content.replace(updateActiveCompanyHook, updateActiveCompanyReplacement);
  console.log('✓ updateActiveCompany için otomatik damgalama bağlandı.');
}

// 4. WORKSPACE BİLEŞENİ İÇİNE ÇALIŞMA YILI STATE'LERİ EKLEME
const workspaceHook = "function Workspace({ company, library, folders, companies, onUpdateCompany, onUpdateActiveCompany, onUpdateAnyCompany, onCreateAssessment, onUpdateAssessmentDate, onDeleteAssessment, onAddRisk, onUpdateRisk, onDeleteRisk, onDeleteBatch, onUpdateBatch, onImportRisks, onCopyAssessment, onAddToLibrary, onUpdateLibraryItem, onDeleteFromLibrary, onDeleteLibraryBatch, onMoveLibraryItem, onAddFolder, onDeleteFolder, onBack, onRequestConfirmation, onManualSave, currentUser, users, onImportFolderWithItems, onMoveFolder, onBulkLibraryImport, onMoveLibraryItemsBatch, affectedGroups, onAddAffectedGroup, onRemoveAffectedGroup, checkAndIncrementAILimit, aiUsageCount, triggerUpgrade, theme, toggleTheme, osgbs, activeTab, setActiveTab, onMenuToggle, showAdvancedReport, setShowAdvancedReport, panelZoom = 100, setPanelZoom, isCompactMode = false, setIsCompactMode }) {";

const workspaceStateAdditions = `
  // --- ÇALIŞMA YILI VE TARİH FİLTRELEME ALTYAPISI ---
  const currentSystemYear = new Date().getFullYear();
  const [workingYear, setWorkingYear] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_active_working_year');
      return saved ? Number(saved) : currentSystemYear;
    } catch (e) {
      return currentSystemYear;
    }
  });
  const [isOnlyWorkingYearActive, setIsOnlyWorkingYearActive] = useState(() => {
    try {
      const saved = localStorage.getItem('isg_only_working_year_active');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });
  const [globalFilterType, setGlobalFilterType] = useState('all');
  const [globalCustomStart, setGlobalCustomStart] = useState('');
  const [globalCustomEnd, setGlobalCustomEnd] = useState('');

  const handleWorkingYearChange = (year) => {
    setWorkingYear(year);
    try {
      localStorage.setItem('isg_active_working_year', String(year));
    } catch (e) {}
  };

  const handleToggleOnlyWorkingYear = (active) => {
    setIsOnlyWorkingYearActive(active);
    try {
      localStorage.setItem('isg_only_working_year_active', String(active));
    } catch (e) {}
  };

  const availableYears = useMemo(() => {
    return getAvailableYearsFromRecords(company, workingYear);
  }, [company, workingYear]);

  // Otomatik Geriye Dönük Zaman Damgalama & Buluta Yazma
  useEffect(() => {
    if (company && !company._recordsTimestampedAt && onUpdateActiveCompany) {
      const stamped = normalizeCompanyRecordsWithTimestamps(company, workingYear);
      if (stamped._recordsTimestampedAt) {
        onUpdateActiveCompany(stamped);
      }
    }
  }, [company?.id]);
`;

if (content.includes(workspaceHook) && !content.includes('isg_active_working_year')) {
  content = content.replace(workspaceHook, workspaceHook + workspaceStateAdditions);
  console.log('✓ Workspace bileşenine Çalışma Yılı state ve kontrolleri eklendi.');
}

// 5. WORKSPACE RENDER ALANINA DATEFILTERTOOLBAR EKLEME
const mainHook = `<main id="main-scroll-container" className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-panel-scrollbar p-3 sm:p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] no-print">
        <div className="max-w-6xl mx-auto">`;

const toolbarRenderCode = `<main id="main-scroll-container" className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-panel-scrollbar p-3 sm:p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] no-print">
        <div className="max-w-6xl mx-auto">

          {/* GLOBAL ÇALIŞMA YILI VE TARİH FİLTRESİ ÇUBUĞU */}
          {activeTab !== 'company' && activeTab !== 'annual_plan' && (
            <DateFilterToolbar
              workingYear={workingYear}
              onWorkingYearChange={handleWorkingYearChange}
              isOnlyWorkingYearActive={isOnlyWorkingYearActive}
              onToggleOnlyWorkingYear={handleToggleOnlyWorkingYear}
              filterType={globalFilterType}
              onFilterTypeChange={setGlobalFilterType}
              availableYears={availableYears}
              startDate={globalCustomStart}
              endDate={globalCustomEnd}
              onCustomDateChange={(st, en) => {
                setGlobalCustomStart(st);
                setGlobalCustomEnd(en);
              }}
              label="Kayıtlar"
            />
          )}`;

if (content.includes(mainHook) && !content.includes('GLOBAL ÇALIŞMA YILI VE TARİH FİLTRESİ ÇUBUĞU')) {
  content = content.replace(mainHook, toolbarRenderCode);
  console.log('✓ Workspace içine DateFilterToolbar yerleştirildi.');
}

// 6. ANNUALPLANTAB ÇAĞRISINA PROP AKTARIMI
const annualPlanTabHook = `<AnnualPlanTab
              company={company}
              currentUser={currentUser}
              onUpdateCompany={onUpdateActiveCompany}
            />`;

const annualPlanTabReplacement = `<AnnualPlanTab
              company={company}
              currentUser={currentUser}
              onUpdateCompany={onUpdateActiveCompany}
              workingYear={workingYear}
              isOnlyWorkingYearActive={isOnlyWorkingYearActive}
            />`;

if (content.includes(annualPlanTabHook)) {
  content = content.replace(annualPlanTabHook, annualPlanTabReplacement);
  console.log('✓ AnnualPlanTab bileşenine çalışma yılı prop aktarımı yapıldı.');
}

// Dosyaya yaz
fs.writeFileSync(targetPath, content, 'utf8');
console.log('>>> Başarılı! App.jsx güncellendi ve çalışma yılı altyapısı kuruldu.');
