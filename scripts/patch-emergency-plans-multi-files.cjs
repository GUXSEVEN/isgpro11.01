/**
 * ISGPRO - Acil Durum Planı Çoklu Kart Dosyaları ve Kopyalama Entegrasyon Patch Scripti
 */
const fs = require('fs');

// 1. ÖNCE EmergencyManagementHubTab.jsx'E onBackToList VE plan DESTEĞİ EKLE
const hubPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EmergencyManagementHubTab.jsx';
if (fs.existsSync(hubPath)) {
  let hubContent = fs.readFileSync(hubPath, 'utf8');

  // Prop listesine plan ve onBackToList ekle
  const hubPropsHook = `export default function EmergencyManagementHubTab({
  company: initialCompany,
  currentUser,
  users = [],
  employees = [],
  companies = [],
  osgbs = [],
  onUpdateCompany,
  onOpenReport
}) {`;

  const hubPropsReplacement = `export default function EmergencyManagementHubTab({
  company: initialCompany,
  plan,
  currentUser,
  users = [],
  employees = [],
  companies = [],
  osgbs = [],
  onUpdateCompany,
  onUpdatePlan,
  onBackToList,
  onOpenReport
}) {`;

  if (hubContent.includes(hubPropsHook)) {
    hubContent = hubContent.replace(hubPropsHook, hubPropsReplacement);
    console.log('✓ EmergencyManagementHubTab props listesine plan ve onBackToList eklendi.');
  }

  // existingPlan tanımını plan || company?.emergencyPlan yap
  const existingPlanHook = 'const existingPlan = company?.emergencyPlan || {};';
  const existingPlanReplacement = 'const existingPlan = plan || company?.emergencyPlan || {};';
  if (hubContent.includes(existingPlanHook)) {
    hubContent = hubContent.replace(existingPlanHook, existingPlanReplacement);
    console.log('✓ EmergencyManagementHubTab existingPlan tanımı güncellendi.');
  }

  // Ana return'ün başına "← Plan Dosyalarına Dön" butonunu ekle
  const returnHook = `return (
    <div className="space-y-5 pb-24">`;

  const returnReplacement = `return (
    <div className="space-y-5 pb-24">
      {/* ── PLAN DOSYALARINA DÖNÜŞ VE AKTİF PLAN BAŞLIĞI ── */}
      {typeof onBackToList === 'function' && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mb-2">
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-extrabold text-xs text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <ArrowRight size={15} className="rotate-180" /> Acil Durum Plan Dosyalarına Dön
          </button>
          {plan?.name && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Aktif Plan:</span>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-300 dark:border-emerald-800">
                {plan.name}
              </span>
            </div>
          )}
        </div>
      )}`;

  if (hubContent.includes(returnHook) && !hubContent.includes('PLAN DOSYALARINA DÖNÜŞ VE AKTİF PLAN BAŞLIĞI')) {
    hubContent = hubContent.replace(returnHook, returnReplacement);
    console.log('✓ EmergencyManagementHubTab içine "Plan Dosyalarına Dön" butonu eklendi.');
  }

  fs.writeFileSync(hubPath, hubContent, 'utf8');
}

// 2. ŞİMDİ App.jsx DOSYASINI GÜNCELLE
const appPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');

  // Importları ekle
  const importAnchor = "import EmergencyManagementHubTab from './components/tabs/EmergencyManagementHubTab';";
  const newImports = `import EmergencyManagementHubTab from './components/tabs/EmergencyManagementHubTab';
import EmergencyPlanListView from './components/views/EmergencyPlanListView';
import EmergencyCopyModal from './components/modals/EmergencyCopyModal';`;

  if (!appContent.includes('EmergencyPlanListView')) {
    appContent = appContent.replace(importAnchor, newImports);
    console.log('✓ App.jsx importlarına EmergencyPlanListView ve EmergencyCopyModal eklendi.');
  }

  // Workspace bileşeninin içine state ve fonksiyonları ekle
  const workspaceStateHook = "const [advancedReportType, setAdvancedReportType] = useState('ziyaret');";
  const workspaceStateAdditions = `const [advancedReportType, setAdvancedReportType] = useState('ziyaret');

  // --- ACİL DURUM PLANI ÇOKLU DOSYA STATE'LERİ ---
  const [activeEmergencyPlanId, setActiveEmergencyPlanId] = useState(null);
  const [showEmergencyCopyModal, setShowEmergencyCopyModal] = useState(false);
  const [emergencyPlanToCopy, setEmergencyPlanToCopy] = useState(null);

  // Firmanın Acil Durum Planı Dosyaları (Geriye dönük uyumlu)
  const emergencyPlans = useMemo(() => {
    const list = Array.isArray(effectiveCompany?.emergencyPlans) ? effectiveCompany.emergencyPlans : [];
    if (list.length === 0 && effectiveCompany?.emergencyPlan && Object.keys(effectiveCompany.emergencyPlan).length > 0) {
      return [{
        id: 'default-plan',
        name: \`\${effectiveCompany.name || 'Firma'} Genel Acil Durum Planı\`,
        date: effectiveCompany.emergencyPlan.date || new Date().toISOString().split('T')[0],
        validityDate: effectiveCompany.emergencyPlan.validityDate || '',
        hazardClass: effectiveCompany.emergencyPlan.hazardClass || effectiveCompany.info?.hazardClass || 'Tehlikeli',
        employeeCount: effectiveCompany.emergencyPlan.employeeCount || effectiveCompany.info?.employeeCount || '1',
        department: 'Genel',
        ...effectiveCompany.emergencyPlan
      }];
    }
    return list;
  }, [effectiveCompany]);

  const activeEmergencyPlan = activeEmergencyPlanId
    ? emergencyPlans.find(p => String(p.id) === String(activeEmergencyPlanId))
    : null;

  // Yeni Acil Durum Planı Dosyası Oluşturma
  const handleCreateEmergencyPlan = (planData) => {
    const newId = \`ep-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`;
    const newPlan = {
      id: newId,
      name: planData.name,
      department: planData.department || '',
      hazardClass: planData.hazardClass || company?.info?.hazardClass || 'Tehlikeli',
      employeeCount: planData.employeeCount || company?.info?.employeeCount || '1',
      date: planData.date || new Date().toISOString().split('T')[0],
      validityDate: calculateValidityDate ? calculateValidityDate(planData.date, planData.hazardClass) : '',
      createdAt: new Date().toISOString(),
      recordYear: workingYear,
      recordDate: planData.date || new Date().toISOString().split('T')[0],
      _timestamped: true
    };

    const updatedPlans = [newPlan, ...emergencyPlans];
    handleSmartUpdateCompany({
      ...company,
      emergencyPlans: updatedPlans,
      emergencyPlan: newPlan
    });
    setActiveEmergencyPlanId(newId);
  };

  // Acil Durum Planı Silme
  const handleDeleteEmergencyPlan = (planId) => {
    const updatedPlans = emergencyPlans.filter(p => String(p.id) !== String(planId));
    handleSmartUpdateCompany({
      ...company,
      emergencyPlans: updatedPlans
    });
    if (activeEmergencyPlanId === planId) {
      setActiveEmergencyPlanId(null);
    }
  };

  // Acil Durum Planı Kopyalama Onayı
  const handleCopyEmergencyPlanConfirm = ({ sourcePlan, targetCompanyId, newPlanName, options }) => {
    const targetComp = companies.find(c => String(c.id) === String(targetCompanyId)) || company;
    const newId = \`ep-copy-\${Date.now()}-\${Math.random().toString(36).substr(2, 6)}\`;

    const clonedPlan = {
      ...sourcePlan,
      id: newId,
      name: newPlanName,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      recordYear: workingYear,
      recordDate: new Date().toISOString().split('T')[0],
      _timestamped: true,
      preventiveRows: options.preventive ? (sourcePlan.preventiveRows || sourcePlan.preventiveLimitingTable || []) : [],
      preventiveLimitingTable: options.preventive ? (sourcePlan.preventiveLimitingTable || sourcePlan.preventiveRows || []) : [],
      section8: options.procedures ? sourcePlan.section8 : undefined,
      section10: options.procedures ? sourcePlan.section10 : undefined,
      section11: options.procedures ? sourcePlan.section11 : undefined,
      teams: options.teams ? (sourcePlan.teams || sourcePlan.emergencyTeamMembers || []) : [],
      emergencyTeamMembers: options.teams ? (sourcePlan.emergencyTeamMembers || sourcePlan.teams || []) : [],
      drills: options.drills ? (sourcePlan.drills || []) : [],
      checklist: options.checklist ? (sourcePlan.checklist || sourcePlan.emergencyChecklist || []) : [],
      diagrams: options.diagrams ? (sourcePlan.diagrams || []) : []
    };

    const existingTargetPlans = Array.isArray(targetComp.emergencyPlans) ? targetComp.emergencyPlans : [];
    const updatedTargetPlans = [clonedPlan, ...existingTargetPlans];

    if (String(targetCompanyId) === String(company.id)) {
      handleSmartUpdateCompany({
        ...company,
        emergencyPlans: updatedTargetPlans
      });
      setActiveEmergencyPlanId(newId);
    } else {
      if (typeof onUpdateAnyCompany === 'function') {
        onUpdateAnyCompany(targetCompanyId, {
          emergencyPlans: updatedTargetPlans
        });
      }
      alert(\`✓ Acil durum planı başarıyla "\${targetComp.name}" firmasına kopyalandı!\`);
    }

    setShowEmergencyCopyModal(false);
    setEmergencyPlanToCopy(null);
  };

  // Aktif Plan Güncellendiğinde
  const handleUpdateActiveEmergencyPlan = (planUpdates) => {
    if (!activeEmergencyPlanId) {
      handleSmartUpdateCompany(planUpdates);
      return;
    }
    const updatedPlans = emergencyPlans.map(p => {
      if (String(p.id) === String(activeEmergencyPlanId)) {
        return { ...p, ...planUpdates, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    handleSmartUpdateCompany({
      ...company,
      emergencyPlans: updatedPlans,
      emergencyPlan: { ...activeEmergencyPlan, ...planUpdates }
    });
  };`;

  if (appContent.includes(workspaceStateHook) && !appContent.includes('activeEmergencyPlanId')) {
    appContent = appContent.replace(workspaceStateHook, workspaceStateAdditions);
    console.log('✓ Workspace bileşenine acil durum planı state ve yönetim fonksiyonları eklendi.');
  }

  // Workspace JSX içindeki activeTab === 'emergency_new' render alanını güncelle
  const emergencyNewRenderHook = `{activeTab === 'emergency_new' && (
            <EmergencyManagementHubTab
              company={company}
              currentUser={currentUser}
              users={users}
              employees={company?.employees || company?.info?.employees || []}
              companies={companies}
              osgbs={osgbs}
              onUpdateCompany={handleSmartUpdateCompany}
              onOpenReport={(repType = 'acil-durum-yeni') => {
                setAdvancedReportType(repType);
                setShowAdvancedReport(true);
              }}
            />
          )}`;

  const emergencyNewRenderReplacement = `{/* ACİL DURUM PLANI KART DOSYALARI LİSTESİ */}
          {activeTab === 'emergency_new' && !activeEmergencyPlanId && (
            <EmergencyPlanListView
              plans={emergencyPlans}
              departments={company?.info?.departments || []}
              onCreate={handleCreateEmergencyPlan}
              onDelete={handleDeleteEmergencyPlan}
              onSelect={setActiveEmergencyPlanId}
              onCopy={(planId) => {
                const plan = emergencyPlans.find(p => String(p.id) === String(planId));
                if (plan) {
                  setEmergencyPlanToCopy(plan);
                  setShowEmergencyCopyModal(true);
                }
              }}
              companyInfo={company?.info || { name: company?.name }}
            />
          )}

          {/* ACİL DURUM PLANI DETAY GÖRÜNÜMÜ */}
          {activeTab === 'emergency_new' && activeEmergencyPlanId && (
            <EmergencyManagementHubTab
              company={effectiveCompany}
              plan={activeEmergencyPlan}
              currentUser={currentUser}
              users={users}
              employees={effectiveCompany?.employees || effectiveCompany?.info?.employees || []}
              companies={companies}
              osgbs={osgbs}
              onUpdateCompany={handleSmartUpdateCompany}
              onUpdatePlan={handleUpdateActiveEmergencyPlan}
              onBackToList={() => setActiveEmergencyPlanId(null)}
              onOpenReport={(repType = 'acil-durum-yeni') => {
                setAdvancedReportType(repType);
                setShowAdvancedReport(true);
              }}
            />
          )}`;

  if (appContent.includes(emergencyNewRenderHook)) {
    appContent = appContent.replace(emergencyNewRenderHook, emergencyNewRenderReplacement);
    console.log('✓ activeTab === emergency_new JSX alanı kart listesi ve detay olarak güncellendi.');
  } else {
    // Alternatif hook ara
    const altHook = "{activeTab === 'emergency_new' && (";
    const altEnd = "</main>";
    const hubIdx = appContent.indexOf(altHook);
    if (hubIdx !== -1) {
      const nextTabIdx = appContent.indexOf("{activeTab === 'emergency' && (", hubIdx);
      if (nextTabIdx !== -1) {
        const chunk = appContent.substring(hubIdx, nextTabIdx);
        appContent = appContent.substring(0, hubIdx) + emergencyNewRenderReplacement + '\n          ' + appContent.substring(nextTabIdx);
        console.log('✓ activeTab === emergency_new JSX alanı (alternatif) güncellendi.');
      }
    }
  }

  // Modallar alanına EmergencyCopyModal ekle
  const copyModalAnchor = "{showCopyModal && assessmentToCopy && (";
  const emergencyCopyModalCode = `{showEmergencyCopyModal && emergencyPlanToCopy && (
        <EmergencyCopyModal
          sourcePlan={emergencyPlanToCopy}
          sourceCompany={company}
          companies={companies}
          onConfirm={handleCopyEmergencyPlanConfirm}
          onClose={() => {
            setShowEmergencyCopyModal(false);
            setEmergencyPlanToCopy(null);
          }}
        />
      )}
      {showCopyModal && assessmentToCopy && (`;

  if (appContent.includes(copyModalAnchor) && !appContent.includes('EmergencyCopyModal')) {
    appContent = appContent.replace(copyModalAnchor, emergencyCopyModalCode);
    console.log('✓ Workspace içine EmergencyCopyModal render kodu eklendi.');
  }

  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('>>> Başarılı! App.jsx çoklu acil durum planı kart dosyaları mimarisiyle güncellendi.');
}
