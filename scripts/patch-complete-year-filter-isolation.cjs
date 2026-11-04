/**
 * ISGPRO - Tam Çalışma Yılı İzolasyonu, Tarih Süzgeci ve Akıllı Birleştirici Patch
 */
const fs = require('fs');

const targetPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';

if (!fs.existsSync(targetPath)) {
  console.error('Hedef dosya bulunamadı:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// 1. IMPORTLARI GÜNCELLE
const oldImport = `import {
  normalizeCompanyRecordsWithTimestamps,
  filterRecordsByDate,
  filterRecordsByWorkingYear,
  getAvailableYearsFromRecords
} from './utils/dateFilterHelper';`;

const newImport = `import {
  normalizeCompanyRecordsWithTimestamps,
  filterRecordsByDate,
  filterRecordsByWorkingYear,
  getAvailableYearsFromRecords,
  getFilteredCompany,
  isRecordMatchingFilter,
  stampRecord
} from './utils/dateFilterHelper';`;

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log('✓ dateFilterHelper importları zenginleştirildi.');
}

// 2. WORKSPACE BİLEŞENİ İÇİNE FILTEREDCOMPANY VE SAYAÇ KODLARINI EKLE
const hookMarker = "// Otomatik Geriye Dönük Zaman Damgalama & Buluta Yazma";

const additions = `  // --- TÜM PANELE ETKİ EDEN FİLTRELENMİŞ FİRMA NESNESİ (TÜM SEKME VE LİSTELERİ SÜZER) ---
  const filteredCompany = useMemo(() => {
    return getFilteredCompany(company, {
      workingYear,
      isOnlyWorkingYearActive,
      filterType: globalFilterType,
      startDate: globalCustomStart,
      endDate: globalCustomEnd
    });
  }, [company, workingYear, isOnlyWorkingYearActive, globalFilterType, globalCustomStart, globalCustomEnd]);

  // Sekmelerde ve alt görünümlerde kullanılacak filtrelenmiş firma
  const effectiveCompany = filteredCompany || company;

  // Akıllı Firma Güncelleme (Filtre modundayken diğer yılların kayıtlarını kaybetmeden birleştirir)
  const handleSmartUpdateCompany = (updates) => {
    if (!updates || typeof updates !== 'object') {
      if (onUpdateActiveCompany) onUpdateActiveCompany(updates);
      return;
    }

    if (!isOnlyWorkingYearActive && globalFilterType === 'all') {
      const stampedUpdates = normalizeCompanyRecordsWithTimestamps(updates, workingYear);
      if (onUpdateActiveCompany) onUpdateActiveCompany(stampedUpdates);
      return;
    }

    const arrayFields = [
      'accidentRecords', 'accidentTrainings', 'nearMissRecords', 'kurulMeetings',
      'defterRecords', 'trainings', 'educationRecords', 'inductionTrainings',
      'healthRecords', 'examinations', 'drills', 'drillRecords', 'emergencyTeams',
      'workPermits', 'kkdDeliveries', 'kkdAssignments', 'mobileAudits', 'auditFindings',
      'savedForms', 'employees', 'prescriptions', 'clinicRecords', 'annualPlans', 'annualActivities'
    ];

    let merged = { ...company, ...updates };

    arrayFields.forEach(field => {
      if (Array.isArray(updates[field])) {
        const updatedItems = updates[field].map(it => stampRecord(it, workingYear));
        const originalHiddenItems = (Array.isArray(company[field]) ? company[field] : []).filter(item => {
          return !isRecordMatchingFilter(item, {
            workingYear,
            isOnlyWorkingYearActive,
            filterType: globalFilterType,
            startDate: globalCustomStart,
            endDate: globalCustomEnd
          });
        });
        merged[field] = [...updatedItems, ...originalHiddenItems];
      }
    });

    if (onUpdateActiveCompany) {
      onUpdateActiveCompany(merged);
    }
  };

  // Aktif Sekmenin Toplam ve Filtrelenen Sayaç Değerleri
  const { currentTabTotal, currentTabFiltered } = useMemo(() => {
    let rawList = [];
    let filtList = [];

    switch (activeTab) {
      case 'accident':
        rawList = company?.accidentRecords || [];
        filtList = effectiveCompany?.accidentRecords || [];
        break;
      case 'nearmiss':
        rawList = company?.nearMissRecords || [];
        filtList = effectiveCompany?.nearMissRecords || [];
        break;
      case 'kurul':
        rawList = company?.kurulMeetings || [];
        filtList = effectiveCompany?.kurulMeetings || [];
        break;
      case 'defter':
        rawList = company?.defterRecords || [];
        filtList = effectiveCompany?.defterRecords || [];
        break;
      case 'education':
        rawList = company?.trainings || company?.educationRecords || [];
        filtList = effectiveCompany?.trainings || effectiveCompany?.educationRecords || [];
        break;
      case 'health':
        rawList = company?.healthRecords || company?.examinations || [];
        filtList = effectiveCompany?.healthRecords || effectiveCompany?.examinations || [];
        break;
      case 'drill':
        rawList = company?.drills || company?.drillRecords || [];
        filtList = effectiveCompany?.drills || effectiveCompany?.drillRecords || [];
        break;
      case 'emergency_teams':
        rawList = company?.emergencyTeams || [];
        filtList = effectiveCompany?.emergencyTeams || [];
        break;
      case 'permits':
        rawList = company?.workPermits || [];
        filtList = effectiveCompany?.workPermits || [];
        break;
      case 'kkd':
        rawList = company?.kkdDeliveries || company?.kkdAssignments || [];
        filtList = effectiveCompany?.kkdDeliveries || effectiveCompany?.kkdAssignments || [];
        break;
      case 'mobile_audit':
        rawList = company?.mobileAudits || [];
        filtList = effectiveCompany?.mobileAudits || [];
        break;
      case 'hr':
        rawList = company?.employees || [];
        filtList = effectiveCompany?.employees || [];
        break;
      case 'forms':
        rawList = company?.savedForms || [];
        filtList = effectiveCompany?.savedForms || [];
        break;
      case 'assessment':
        rawList = company?.assessments || [];
        filtList = effectiveCompany?.assessments || [];
        break;
      default:
        rawList = [];
        filtList = [];
    }

    return {
      currentTabTotal: rawList.length,
      currentTabFiltered: filtList.length
    };
  }, [activeTab, company, effectiveCompany]);
\n  `;

if (content.includes(hookMarker) && !content.includes('const filteredCompany = useMemo')) {
  content = content.replace(hookMarker, additions + hookMarker);
  console.log('✓ filteredCompany, handleSmartUpdateCompany ve sayaç useMemo kodları eklendi.');
}

// 3. DATEFILTERTOOLBAR'A AKTİF SAYAÇLARI BAĞLA
const oldToolbarCall = `<DateFilterToolbar
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
            />`;

const newToolbarCall = `<DateFilterToolbar
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
              totalCount={currentTabTotal}
              filteredCount={currentTabFiltered}
              label="Kayıtlar"
            />`;

if (content.includes(oldToolbarCall)) {
  content = content.replace(oldToolbarCall, newToolbarCall);
  console.log('✓ DateFilterToolbar sayaçları güncellendi.');
}

// 4. SEKME ÇAĞRILARINDA company={company} YERİNE company={effectiveCompany} VE onUpdateCompany={handleSmartUpdateCompany} KULLAN
// Sadece Workspace içindeki (main id="main-scroll-container") sekmeleri etkile
const mainStart = content.indexOf('<main id="main-scroll-container"');
const mainEnd = content.indexOf('</main>', mainStart);

if (mainStart !== -1 && mainEnd !== -1) {
  let mainSection = content.substring(mainStart, mainEnd);

  // company={company} -> company={effectiveCompany}
  // Ancak company tab hariç (CompanySettingsView ham company kullanmalı)
  mainSection = mainSection.replace(/company=\{company\}/g, (match, offset) => {
    // Önceki 100 karaktere bak, CompanySettingsView ise dokunma
    const prevChunk = mainSection.substring(Math.max(0, offset - 100), offset);
    if (prevChunk.includes('CompanySettingsView')) {
      return match;
    }
    return 'company={effectiveCompany}';
  });

  // onUpdateCompany={onUpdateActiveCompany} -> onUpdateCompany={handleSmartUpdateCompany}
  mainSection = mainSection.replace(/onUpdateCompany=\{onUpdateActiveCompany\}/g, (match, offset) => {
    const prevChunk = mainSection.substring(Math.max(0, offset - 100), offset);
    if (prevChunk.includes('CompanySettingsView')) {
      return match;
    }
    return 'onUpdateCompany={handleSmartUpdateCompany}';
  });

  // assessments={company.assessments} -> assessments={effectiveCompany.assessments}
  mainSection = mainSection.replace(/assessments=\{company\.assessments\}/g, 'assessments={effectiveCompany.assessments}');

  content = content.substring(0, mainStart) + mainSection + content.substring(mainEnd);
  console.log('✓ Workspace sekmeleri effectiveCompany ve handleSmartUpdateCompany ile bağlandı.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('>>> Başarılı! İzolasyon ve akıllı filtreleme App.jsx dosyasına uygulandı.');
