const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
if (!fs.existsSync(targetFile)) {
  console.error('File not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update AdvancedReportModal parameters and plan states
const oldModalHeader = `function AdvancedReportModal({ company, assessment, visibleRisks, onClose, reportFontSize, setReportFontSize, itemsPerPage, setItemsPerPage, currentUser, checkAndIncrementAILimit, aiUsageCount, triggerUpgrade, initialReportType = null, onUpdateCompany }) {
  const [reportType, setReportType] = useState(initialReportType || (assessment ? 'ziyaret' : 'acil-durum-yeni'));`;

const newModalHeader = `function AdvancedReportModal({ company, assessment, assessments = [], onSelectAssessment, emergencyPlan, emergencyPlans = [], onSelectEmergencyPlan, visibleRisks, onClose, reportFontSize, setReportFontSize, itemsPerPage, setItemsPerPage, currentUser, checkAndIncrementAILimit, aiUsageCount, triggerUpgrade, initialReportType = null, onUpdateCompany, workspaceActiveTab }) {
  const [selectedPlanId, setSelectedPlanId] = useState(emergencyPlan?.id || null);

  useEffect(() => {
    if (emergencyPlan?.id) {
      setSelectedPlanId(emergencyPlan.id);
    }
  }, [emergencyPlan?.id]);

  const currentEmergencyPlan = useMemo(() => {
    if (selectedPlanId) {
      const found = emergencyPlans.find(p => String(p.id) === String(selectedPlanId));
      if (found) return found;
    }
    return emergencyPlan || null;
  }, [selectedPlanId, emergencyPlan, emergencyPlans]);

  const hasActiveEmergencyPlan = Boolean(currentEmergencyPlan);
  const hasActiveAssessment = Boolean(assessment);

  const [reportType, setReportType] = useState(() => {
    if (initialReportType) return initialReportType;
    if (workspaceActiveTab === 'emergency_new' && emergencyPlan) return 'acil-durum-yeni';
    if (assessment) return 'ziyaret';
    if (emergencyPlan) return 'acil-durum-yeni';
    return null;
  });`;

if (!content.includes(oldModalHeader)) {
  console.error('Target 1 (oldModalHeader) not found!');
  process.exit(1);
}
content = content.replace(oldModalHeader, newModalHeader);
console.log('Target 1 replaced!');

// 2. Update defaultEmergencyData to use currentEmergencyPlan
const oldEmergencyData = `  // Geçici veya Kayıtlı Acil Durum Verisi
  const defaultEmergencyData = useMemo(() => {
    const plan = company?.emergencyPlan || {};
    return {
      companyName: plan.companyName || company?.name || '',
      address: plan.address || company?.info?.address || '',
      preparerName: plan.preparerName || company?.info?.preparer?.name || '',
      date: plan.date || new Date().toISOString().split('T')[0],
      hazardClass: plan.hazardClass || company?.info?.hazardClass || 'Tehlikeli',
      employeeCount: company?.info?.employeeCount || (company?.employees?.length ? String(company.employees.length) : '') || (plan.employeeCount && String(plan.employeeCount) !== '144' ? String(plan.employeeCount) : '') || '1',
      emergencies: Array.isArray(plan.emergencies) ? plan.emergencies : ['Yangın', 'Deprem', 'İş Kazası', 'Kimyasal Döküntü'],
      preventiveLimitingTable: (Array.isArray(plan.preventiveLimitingTable) && plan.preventiveLimitingTable.length > 0)
        ? plan.preventiveLimitingTable
        : ((Array.isArray(company?.preventiveLimitingTable) && company.preventiveLimitingTable.length > 0)
            ? company.preventiveLimitingTable
            : DEFAULT_PREVENTIVE_LIMITING_TABLE),
      preventiveMeasures: plan.preventiveMeasures || '1. Elektrik tesisatının periyodik kontrollerinin yapılması.\\n2. Kimyasalların MSDS formlarına uygun depolanması.\\n3. Makine koruyucularının eksiksiz kullanılması.',
      limitingMeasures: plan.limitingMeasures || '1. Yangın tüplerinin ve hortumlarının her an kullanıma hazır tutulması.\\n2. Acil çıkış kapılarının dışarı açılır ve kilitli olmaması.',
      aiProcedures: plan.aiProcedures || '',
      availableEmergencies: plan.availableEmergencies || [],
      scenarios: (Array.isArray(plan.scenarios) && plan.scenarios.length > 0) ? plan.scenarios : OFFICIAL_DEFAULT_TEMPLATE.scenarios,
      teams: plan.teams || {
        fireLeader: 'Ahmet Yılmaz (Söndürme Şefi)',
        rescueLeader: 'Mehmet Demir (Kurtarma Şefi)',
        evacuationLeader: 'Ayşe Kaya (Koruma Şefi)',
        firstAidLeader: 'Zeynep Çelik (İlkyardım Sorumlusu)'
      },
      gatheringPoint: plan.gatheringPoint || 'Krokide belirlenen Güvenli Açık Toplanma Sahası',
      hospitalInfo: plan.hospitalInfo || 'SÜLOĞLU DEVLET HASTANESİ / TRAKYA ÜNİVERSİTESİ TIP FAKÜLTESİ HASTANESİ',
      neighborInfo: plan.neighborInfo || 'Komşu Tesisler, Sanayi Bölgesi İtfaiye Müfrezesi ve Çevre İşletmeler',
      documentNo: plan.documentNo || 'ADEP-01',
      revisionNo: plan.revisionNo || '02',
      revisionDate: plan.revisionDate || plan.date || new Date().toISOString().split('T')[0],
      validityDate: plan.validityDate || calculateValidityDate(plan.date || new Date().toISOString().split('T')[0], company?.info?.hazardClass || 'Tehlikeli'),
      teamSource: plan.teamSource || 'assessmentTeam',
      emergencyTeam: plan.emergencyTeam || company?.info?.emergencyTeam || [],
      iguName: plan.iguName || '',
      iguCert: plan.iguCert || '',
      iyhName: plan.iyhName || '',
      iyhCert: plan.iyhCert || '',
      employerName: plan.employerName || company?.info?.official || '',
      employerTitle: plan.employerTitle || 'İşveren / İşveren Vekili',
      preparers: plan.preparers || plan.emergencyTeam || company?.info?.emergencyTeam || []
    };
  }, [company]);`;

const newEmergencyData = `  // Seçili veya Aktif Acil Durum Planı Verisi (Plan Seçilmeden Asla Görüntülenemez)
  const defaultEmergencyData = useMemo(() => {
    if (!currentEmergencyPlan) return null;
    const plan = currentEmergencyPlan;
    return {
      companyName: plan.name || plan.companyName || company?.name || '',
      address: plan.address || company?.info?.address || '',
      preparerName: plan.preparerName || company?.info?.preparer?.name || '',
      date: plan.date || new Date().toISOString().split('T')[0],
      hazardClass: plan.hazardClass || company?.info?.hazardClass || 'Tehlikeli',
      employeeCount: plan.employeeCount || company?.info?.employeeCount || (company?.employees?.length ? String(company.employees.length) : '') || '1',
      department: plan.department || '',
      emergencies: (Array.isArray(plan.emergencies) && plan.emergencies.length > 0) ? plan.emergencies : ['Yangın', 'Deprem', 'İş Kazası', 'Kimyasal Döküntü'],
      preventiveLimitingTable: (Array.isArray(plan.preventiveLimitingTable) && plan.preventiveLimitingTable.length > 0)
        ? plan.preventiveLimitingTable
        : ((Array.isArray(company?.preventiveLimitingTable) && company.preventiveLimitingTable.length > 0)
            ? company.preventiveLimitingTable
            : DEFAULT_PREVENTIVE_LIMITING_TABLE),
      preventiveMeasures: plan.preventiveMeasures || '1. Elektrik tesisatının periyodik kontrollerinin yapılması.\\n2. Kimyasalların MSDS formlarına uygun depolanması.\\n3. Makine koruyucularının eksiksiz kullanılması.',
      limitingMeasures: plan.limitingMeasures || '1. Yangın tüplerinin ve hortumlarının her an kullanıma hazır tutulması.\\n2. Acil çıkış kapılarının dışarı açılır ve kilitli olmaması.',
      aiProcedures: plan.aiProcedures || '',
      availableEmergencies: plan.availableEmergencies || [],
      scenarios: (Array.isArray(plan.scenarios) && plan.scenarios.length > 0) ? plan.scenarios : OFFICIAL_DEFAULT_TEMPLATE.scenarios,
      teams: plan.teams || {
        fireLeader: 'Ahmet Yılmaz (Söndürme Şefi)',
        rescueLeader: 'Mehmet Demir (Kurtarma Şefi)',
        evacuationLeader: 'Ayşe Kaya (Koruma Şefi)',
        firstAidLeader: 'Zeynep Çelik (İlkyardım Sorumlusu)'
      },
      gatheringPoint: plan.gatheringPoint || 'Krokide belirlenen Güvenli Açık Toplanma Sahası',
      hospitalInfo: plan.hospitalInfo || 'SÜLOĞLU DEVLET HASTANESİ / TRAKYA ÜNİVERSİTESİ TIP FAKÜLTESİ HASTANESİ',
      neighborInfo: plan.neighborInfo || 'Komşu Tesisler, Sanayi Bölgesi İtfaiye Müfrezesi ve Çevre İşletmeler',
      documentNo: plan.documentNo || 'ADEP-01',
      revisionNo: plan.revisionNo || '02',
      revisionDate: plan.revisionDate || plan.date || new Date().toISOString().split('T')[0],
      validityDate: plan.validityDate || (typeof calculateValidityDate === 'function' ? calculateValidityDate(plan.date || new Date().toISOString().split('T')[0], plan.hazardClass || company?.info?.hazardClass || 'Tehlikeli') : ''),
      teamSource: plan.teamSource || 'assessmentTeam',
      emergencyTeam: plan.emergencyTeam || company?.info?.emergencyTeam || [],
      iguName: plan.iguName || '',
      iguCert: plan.iguCert || '',
      iyhName: plan.iyhName || '',
      iyhCert: plan.iyhCert || '',
      employerName: plan.employerName || company?.info?.official || '',
      employerTitle: plan.employerTitle || 'İşveren / İşveren Vekili',
      preparers: plan.preparers || plan.emergencyTeam || company?.info?.emergencyTeam || [],
      emergencyTeams: Array.isArray(plan.emergencyTeams) ? plan.emergencyTeams : [],
      emergencyProcedures: plan.emergencyProcedures || {},
      drills: Array.isArray(plan.drills) ? plan.drills : [],
      ...plan
    };
  }, [currentEmergencyPlan, company]);`;

if (!content.includes(oldEmergencyData)) {
  console.error('Target 2 (oldEmergencyData) not found!');
  process.exit(1);
}
content = content.replace(oldEmergencyData, newEmergencyData);
console.log('Target 2 replaced!');

// 3. Update triggerPrint to guard against empty plan
const oldTriggerPrint = `  const triggerPrint = () => {
    if (reportType === 'ziyaret') {`;

const newTriggerPrint = `  const triggerPrint = () => {
    if (isEmergencyReportActive && !defaultEmergencyData) {
      alert('Lütfen önce bir Acil Durum Planı dosyası seçiniz.');
      return;
    }
    if ((reportType === 'ziyaret' || reportType === 'web' || reportType === 'kapak' || reportType === 'prosedur') && !assessmentData) {
      alert('Lütfen önce bir Risk Analizi dosyası seçiniz.');
      return;
    }
    if (reportType === 'ziyaret') {`;

if (!content.includes(oldTriggerPrint)) {
  console.error('Target 3 (oldTriggerPrint) not found!');
  process.exit(1);
}
content = content.replace(oldTriggerPrint, newTriggerPrint);
console.log('Target 3 replaced!');

// 4. Update Header button bar: Acil Durum Belgeleri button + plan selector dropdown
const oldBtnBar = `            {/* 🚨 ACİL DURUM BELGELERİ AÇILIR PENCERE BUTONU (KULLANICI DOSTU & MOBİL UYUMLU) */}
            <button
              type="button"
              onClick={() => setIsEmergencyMenuOpen(true)}
              className={\`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 \${
                isEmergencyReportActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/60 shadow-emerald-900/40 ring-2 ring-emerald-500/30'
                  : 'text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/80'
              }\`}
              title="Acil durum dokümanlarını açılır pencerede seç ve görüntüle"
            >
              <span className="text-sm">🚨</span>
              <span>{isEmergencyReportActive ? \`Belge: \${activeEmergencyDoc.title}\` : '🚨 Acil Durum Belgeleri (Seç...)'}</span>
              <span className="px-1.5 py-0.5 bg-emerald-700/70 text-[10px] rounded font-mono text-emerald-100">9 Belge</span>
              <ChevronDown size={14} className="text-emerald-200" />
            </button>`;

const newBtnBar = `            {/* 🚨 ACİL DURUM BELGELERİ AÇILIR PENCERE BUTONU (KULLANICI DOSTU & MOBİL UYUMLU) */}
            <button
              type="button"
              onClick={() => {
                if (!hasActiveEmergencyPlan && emergencyPlans.length === 0) {
                  alert("Bu firmada kayıtlı bir Acil Durum Planı bulunamadı. Lütfen önce 'Acil Durum Yönetimi (Yeni Rehber)' menüsünden yeni bir plan oluşturun.");
                  return;
                }
                setIsEmergencyMenuOpen(true);
              }}
              className={\`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 \${
                isEmergencyReportActive && hasActiveEmergencyPlan
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/60 shadow-emerald-900/40 ring-2 ring-emerald-500/30'
                  : (!hasActiveEmergencyPlan
                      ? 'text-amber-300 hover:text-white bg-amber-950/60 border border-amber-500/50 hover:bg-amber-900/80 ring-1 ring-amber-500/40'
                      : 'text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/80')
              }\`}
              title={hasActiveEmergencyPlan ? "Acil durum dokümanlarını açılır pencerede seç ve görüntüle" : "Görüntülemek için bir Acil Durum Planı seçiniz"}
            >
              <span className="text-sm">{hasActiveEmergencyPlan ? '🚨' : '⚠️'}</span>
              <span>
                {isEmergencyReportActive && hasActiveEmergencyPlan
                  ? \`Belge: \${activeEmergencyDoc.title}\`
                  : (hasActiveEmergencyPlan
                      ? '🚨 Acil Durum Belgeleri (Seç...)'
                      : '🚨 Acil Durum Planı Seç (Gerekli)')}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-700/70 text-[10px] rounded font-mono text-emerald-100">9 Belge</span>
              <ChevronDown size={14} className="text-emerald-200" />
            </button>

            {/* HIZLI PLAN SEÇİCİ DROPDOWN */}
            {emergencyPlans.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-xl shrink-0">
                <Flame size={13} className={hasActiveEmergencyPlan ? "text-emerald-400" : "text-amber-400 animate-pulse"} />
                <select
                  value={selectedPlanId || ''}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPlanId(pid);
                    if (onSelectEmergencyPlan) onSelectEmergencyPlan(pid);
                    if (!reportType || !isEmergencyReportActive) {
                      setReportType('acil-durum-yeni');
                    }
                  }}
                  className={\`bg-transparent text-xs font-bold outline-none cursor-pointer max-w-[130px] md:max-w-[180px] truncate \${
                    hasActiveEmergencyPlan ? 'text-white' : 'text-amber-300 font-extrabold'
                  }\`}
                  title="Görüntülenecek Acil Durum Planı Dosyasını Seçin"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">-- Plan Seçiniz --</option>
                  {emergencyPlans.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name || 'İsimsiz Plan'} {p.department ? \`(\${p.department})\` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}`;

if (!content.includes(oldBtnBar)) {
  console.error('Target 4 (oldBtnBar) not found!');
  process.exit(1);
}
content = content.replace(oldBtnBar, newBtnBar);
console.log('Target 4 replaced!');

// 5. Update Preview rendering for 9 emergency documents and add requirement state
const oldPreviewDocs = `            {reportType === 'acil-durum-kapak' && (
              <EmergencyCoverPreview company={company} emergencyData={defaultEmergencyData} />
            )}

            {reportType === 'acil-durum-yeni' && (
              <AcilDurumRehberReportBooklet
                company={company}
                emergencyData={company?.emergencyPlan || defaultEmergencyData}
                employeeCount={reportEmployeeCount}
                onUpdateEmployeeCount={handleReportEmployeeCountChange}
                reportFontSize={reportFontSize}
                reportHeaderFontSize={reportHeaderFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum' && (
              <AcilDurumReportBooklet
                company={company}
                emergencyData={company?.emergencyPlan || defaultEmergencyData}
                employeeCount={reportEmployeeCount}
                onUpdateEmployeeCount={handleReportEmployeeCountChange}
                reportFontSize={reportFontSize}
                reportHeaderFontSize={reportHeaderFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum-akis' && (
              <AcilDurumFlowchartReport
                company={company}
                emergencyData={company?.emergencyPlan || defaultEmergencyData}
                reportFontSize="9pt"
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum-ek2' && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={company?.emergencyPlan || defaultEmergencyData}
                docType="ek2"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum-ek-belgeler' && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={company?.emergencyPlan || defaultEmergencyData}
                docType="ek_belgeler"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum-ek3' && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={company?.emergencyPlan || defaultEmergencyData}
                docType="ek3"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'isg-yonetim-plani' && (
              <IsgYonetimPlani52Report
                company={company}
                emergencyData={company?.emergencyPlan || defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {reportType === 'acil-durum-kroki' && (
              <AcilDurumKrokiReportBooklet
                company={company}
                emergencyData={company?.emergencyPlan || defaultEmergencyData}
                reportFontSize={reportFontSize}
                onUpdateCompany={onUpdateCompany}
                isEditable={true}
              />
            )}`;

const newPreviewDocs = `            {/* 1. Kapak */}
            {reportType === 'acil-durum-kapak' && defaultEmergencyData && (
              <EmergencyCoverPreview company={company} emergencyData={defaultEmergencyData} />
            )}

            {/* 2. Acil Durum Yeni Rehber Kitapçığı */}
            {reportType === 'acil-durum-yeni' && defaultEmergencyData && (
              <AcilDurumRehberReportBooklet
                company={company}
                emergencyData={defaultEmergencyData}
                employeeCount={reportEmployeeCount}
                onUpdateEmployeeCount={handleReportEmployeeCountChange}
                reportFontSize={reportFontSize}
                reportHeaderFontSize={reportHeaderFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 3. Klasik Acil Durum Planı Kitapçığı */}
            {reportType === 'acil-durum' && defaultEmergencyData && (
              <AcilDurumReportBooklet
                company={company}
                emergencyData={defaultEmergencyData}
                employeeCount={reportEmployeeCount}
                onUpdateEmployeeCount={handleReportEmployeeCountChange}
                reportFontSize={reportFontSize}
                reportHeaderFontSize={reportHeaderFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 4. Müdahale Akış Şeması */}
            {reportType === 'acil-durum-akis' && defaultEmergencyData && (
              <AcilDurumFlowchartReport
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize="9pt"
                isEditable={true}
              />
            )}

            {/* 5. Kontrol Formu (Ek-2) */}
            {reportType === 'acil-durum-ek2' && defaultEmergencyData && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={defaultEmergencyData}
                docType="ek2"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 6. Ek Belgeler Rehberi */}
            {reportType === 'acil-durum-ek-belgeler' && defaultEmergencyData && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={defaultEmergencyData}
                docType="ek_belgeler"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 7. Yangın Mücadele El Kitabı (Ek-3) */}
            {reportType === 'acil-durum-ek3' && defaultEmergencyData && (
              <AcilDurumEklerReportBooklet
                company={company}
                assessmentData={defaultEmergencyData}
                docType="ek3"
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                cellCustomStyles={cellCustomStyles}
                onUpdateCellStyle={handleUpdateCellStyle}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 8. İSG Yönetim Planı (52 Sayfa) */}
            {reportType === 'isg-yonetim-plani' && defaultEmergencyData && (
              <IsgYonetimPlani52Report
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                itemsPerPage={itemsPerPage}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
                reportFontWeight={reportFontWeight}
                reportFontStyle={reportFontStyle}
                reportTextColor={reportTextColor}
                isEditable={true}
              />
            )}

            {/* 9. Acil Durum Krokisi */}
            {reportType === 'acil-durum-kroki' && defaultEmergencyData && (
              <AcilDurumKrokiReportBooklet
                company={company}
                emergencyData={defaultEmergencyData}
                reportFontSize={reportFontSize}
                onUpdateCompany={onUpdateCompany}
                isEditable={true}
              />
            )}

            {/* 🚨 ACİL DURUM PLANI AÇILMADAN GÖRÜNTÜLENEMEZ UYARI & SEÇİM ALANI (RİSK ANALİZİ MANTIĞI) */}
            {isEmergencyReportActive && !defaultEmergencyData && (
              <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900/95 border-2 border-dashed border-amber-500/60 rounded-3xl text-center shadow-2xl animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
                  <Flame size={32} />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mb-2">
                  Acil Durum Planı Dosyası Açılmalıdır
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
                  Risk Analizi modülünde olduğu gibi, Acil Durum Planı raporunu ve resmi belgelerini görüntülemek için firmanıza ait bir acil durum planı dosyasının açık veya seçilmiş olması zorunludur.
                </p>

                {emergencyPlans.length > 0 ? (
                  <div className="flex flex-col gap-2 text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Lütfen Raporu Alınacak Planı Seçin ({emergencyPlans.length} Kayıtlı Plan):
                    </span>
                    <div className="max-h-56 overflow-y-auto no-scrollbar space-y-2">
                      {emergencyPlans.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlanId(p.id);
                            if (onSelectEmergencyPlan) onSelectEmergencyPlan(p.id);
                            if (!reportType || !isEmergencyReportActive) setReportType('acil-durum-yeni');
                          }}
                          className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/60 rounded-xl transition-all cursor-pointer group shadow"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                              {p.name || 'İsimsiz Acil Durum Planı'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {p.department ? \`\${p.department} • \` : ''}{p.date || 'Tarih yok'} • {p.hazardClass || 'Tehlikeli'}
                            </div>
                          </div>
                          <span className="text-xs font-bold bg-emerald-600 group-hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shrink-0 shadow">
                            Planı Aç & Göster
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-300 text-xs text-left flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Henüz Acil Durum Planı Oluşturulmamış</div>
                      <div className="text-[11px] text-amber-200/80 mt-1">
                        Bu firmaya ait kayıtlı bir plan bulunamadı. Lütfen sol menüden "Acil Durum Yönetimi (Yeni Rehber)" sekmesine giderek yeni bir acil durum planı oluşturunuz.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HİÇBİR DOSYA SEÇİLİ OLMADIĞINDA GENEL SEÇİM EKRANI */}
            {!assessmentData && !isEmergencyReportActive && !reportType && (
              <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900/95 border border-slate-800 rounded-3xl text-center shadow-2xl animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
                  <Printer size={32} />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Rapor Görüntülemek İçin Dosya Seçiniz</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
                  Raporunu oluşturmak, önizlemek ve yazdırmak istediğiniz Risk Analizi veya Acil Durum Planı dosyasını seçiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Risk Analizleri Kartı */}
                  <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-indigo-300 mb-2">
                        <ClipboardList size={16} />
                        <span>Risk Analizleri ({assessments.length})</span>
                      </div>
                      {assessments.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                          {assessments.map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                if (onSelectAssessment) onSelectAssessment(a.id);
                                setReportType('ziyaret');
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-950/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all text-xs font-semibold text-white truncate cursor-pointer group"
                            >
                              <div className="font-bold group-hover:text-indigo-300 truncate">{a.name || 'Risk Analizi'}</div>
                              <div className="text-[10px] text-slate-400">{a.risks?.length || 0} Risk Maddesi</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 p-2">Kayıtlı risk analizi bulunamadı.</div>
                      )}
                    </div>
                  </div>

                  {/* Acil Durum Planları Kartı */}
                  <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-300 mb-2">
                        <Flame size={16} />
                        <span>Acil Durum Planları ({emergencyPlans.length})</span>
                      </div>
                      {emergencyPlans.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                          {emergencyPlans.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlanId(p.id);
                                if (onSelectEmergencyPlan) onSelectEmergencyPlan(p.id);
                                setReportType('acil-durum-yeni');
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-emerald-950/50 border border-slate-700/50 hover:border-emerald-500/40 transition-all text-xs font-semibold text-white truncate cursor-pointer group"
                            >
                              <div className="font-bold group-hover:text-emerald-300 truncate">{p.name || 'Acil Durum Planı'}</div>
                              <div className="text-[10px] text-slate-400">{p.department ? \`\${p.department} • \` : ''}{p.date || 'Tarih yok'}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 p-2">Kayıtlı acil durum planı bulunamadı.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}`;

if (!content.includes(oldPreviewDocs)) {
  console.error('Target 5 (oldPreviewDocs) not found!');
  process.exit(1);
}
content = content.replace(oldPreviewDocs, newPreviewDocs);
console.log('Target 5 replaced!');

// 6. Update isEmergencyMenuOpen popup: add plan selector and guard clicks
const oldMenuModalTop = `            {/* 🗺️ MENÜDE DOĞRUDAN ACİL DURUM KROKİSİ YÜKLEME KARTI */}`;

const newMenuModalTop = `            {/* 📁 ACİL DURUM PLANI DOSYA SEÇİMİ (ZORUNLU - RİSK ANALİZİ MANTIĞI) */}
            <div className={\`my-2 p-3 rounded-xl border flex flex-col gap-2 shrink-0 \${
              hasActiveEmergencyPlan
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
            }\`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame size={16} className={hasActiveEmergencyPlan ? "text-emerald-400" : "text-amber-400 animate-pulse"} />
                  <span className="text-xs font-black text-white">
                    {hasActiveEmergencyPlan ? 'Seçili Acil Durum Planı Dosyası:' : '⚠️ Lütfen Önce Acil Durum Planı Seçiniz:'}
                  </span>
                </div>
                {hasActiveEmergencyPlan && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Aktif
                  </span>
                )}
              </div>

              {emergencyPlans.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {emergencyPlans.map(p => {
                    const isPlanActive = String(p.id) === String(selectedPlanId);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          if (onSelectEmergencyPlan) onSelectEmergencyPlan(p.id);
                          if (!reportType || !isEmergencyReportActive) setReportType('acil-durum-yeni');
                        }}
                        className={\`flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer border text-xs \${
                          isPlanActive
                            ? 'bg-emerald-600/30 border-emerald-400 text-white font-bold ring-1 ring-emerald-400/50'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                        }\`}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <div className="truncate">{p.name || 'İsimsiz Plan'}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.department ? \`\${p.department} • \` : ''}{p.date || 'Tarih yok'} • {p.hazardClass || 'Tehlikeli'}
                          </div>
                        </div>
                        {isPlanActive ? (
                          <span className="text-[10px] font-extrabold text-emerald-300 shrink-0">✓ Seçili</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 hover:text-white shrink-0">Seç</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-amber-300/90 bg-amber-950/50 p-2 rounded-lg border border-amber-500/30">
                  Bu firmada henüz kayıtlı bir acil durum planı bulunamadı. Lütfen "Acil Durum Yönetimi (Yeni Rehber)" menüsünden plan oluşturunuz.
                </div>
              )}
            </div>

            {/* 🗺️ MENÜDE DOĞRUDAN ACİL DURUM KROKİSİ YÜKLEME KARTI */}`;

if (!content.includes(oldMenuModalTop)) {
  console.error('Target 6 (oldMenuModalTop) not found!');
  process.exit(1);
}
content = content.replace(oldMenuModalTop, newMenuModalTop);
console.log('Target 6 replaced!');

// 7. Update document selection click in isEmergencyMenuOpen
const oldDocClick = `                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReportType(item.id);
                      if (item.fontSize) setReportFontSize(item.fontSize);
                      setIsEmergencyMenuOpen(false);
                    }}`;

const newDocClick = `                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!hasActiveEmergencyPlan && !selectedPlanId) {
                        alert("Lütfen önce yukarıdaki listeden raporunu görüntülemek istediğiniz Acil Durum Planı dosyasını seçiniz.");
                        return;
                      }
                      setReportType(item.id);
                      if (item.fontSize) setReportFontSize(item.fontSize);
                      setIsEmergencyMenuOpen(false);
                    }}`;

if (!content.includes(oldDocClick)) {
  console.error('Target 7 (oldDocClick) not found!');
  process.exit(1);
}
content = content.replace(oldDocClick, newDocClick);
console.log('Target 7 replaced!');

// 8. Update Workspace AdvancedReportModal invocation
const oldInvocation = `      {showAdvancedReport && (
        <AdvancedReportModal
          company={company}
          assessment={activeAssessment}
          visibleRisks={sortedRisks}  // <-- HATA VEREN KISIM ARTIK BURADA ÇALIŞACAK
          onClose={() => setShowAdvancedReport(false)}
          reportFontSize={reportFontSize}
          setReportFontSize={setReportFontSize}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentUser={currentUser}
          checkAndIncrementAILimit={checkAndIncrementAILimit}
          aiUsageCount={aiUsageCount}
          initialReportType={advancedReportType}
          onUpdateCompany={onUpdateActiveCompany}
        />
      )}`;

const newInvocation = `      {showAdvancedReport && (
        <AdvancedReportModal
          company={company}
          assessment={activeAssessment}
          assessments={company?.assessments || []}
          onSelectAssessment={(id) => setActiveAssessmentId(id)}
          emergencyPlan={activeEmergencyPlan}
          emergencyPlans={emergencyPlans}
          onSelectEmergencyPlan={(id) => setActiveEmergencyPlanId(id)}
          visibleRisks={sortedRisks}
          onClose={() => setShowAdvancedReport(false)}
          reportFontSize={reportFontSize}
          setReportFontSize={setReportFontSize}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentUser={currentUser}
          checkAndIncrementAILimit={checkAndIncrementAILimit}
          aiUsageCount={aiUsageCount}
          initialReportType={advancedReportType}
          onUpdateCompany={onUpdateActiveCompany}
          workspaceActiveTab={activeTab}
        />
      )}`;

if (!content.includes(oldInvocation)) {
  console.error('Target 8 (oldInvocation) not found!');
  process.exit(1);
}
content = content.replace(oldInvocation, newInvocation);
console.log('Target 8 replaced!');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ ALL 8 TARGETS SUCCESSFULLY PATCHED in App.jsx!');

