const fs = require('fs');

const filePath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\IsgEducationTab.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the misplaced mobile states block from before if (!company)
const startMarker = `  // ══════════════════════════════════════════════════════════════════════════
  // SADECE MOBİL (< lg) ÖZEL: 5 ADIMLI SADE VE PRATİK EĞİTİM SİHİRBAZI STATE'LERİ
  // ══════════════════════════════════════════════════════════════════════════`;
const endMarker = `  }, [MOBILE_5_STEPS]);`;

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
  content = content.slice(0, sIdx) + content.slice(eIdx + endMarker.length);
  console.log('Successfully removed misplaced block.');
} else {
  console.error('Could not find misplaced block markers!');
}

// 2. Add the mobile states right after participants state
const participantTarget = `  const [participants, setParticipants] = useState(() => []);`;
const mobileStates = `${participantTarget}

  // ══════════════════════════════════════════════════════════════════════════
  // SADECE MOBİL (< lg) ÖZEL: 5 ADIMLI SADE VE PRATİK EĞİTİM SİHİRBAZI STATE'LERİ
  // ══════════════════════════════════════════════════════════════════════════
  const [mobileStep, setMobileStep] = useState(1); // 1..5
  const [mobileEmpSearch, setMobileEmpSearch] = useState('');
  const [mobileCurriculumCat, setMobileCurriculumCat] = useState('all');
  const [mobileParticipantFilter, setMobileParticipantFilter] = useState('');
  const [mobileEmpPickerOpen, setMobileEmpPickerOpen] = useState(false);`;

if (!content.includes('const [mobileStep, setMobileStep] = useState(1);')) {
  content = content.replace(participantTarget, mobileStates);
  console.log('Added mobile states after participants.');
}

// 3. Add MOBILE_5_STEPS and overallReadinessPercent right after isRiskCategoryRuleSatisfied
const riskRuleTarget = `  const isRiskCategoryRuleSatisfied = useMemo(() => {
    return riskCategoryMinutes >= minRisk.minMinutes;
  }, [riskCategoryMinutes, minRisk]);`;

const mobileStepsMemo = `${riskRuleTarget}

  // ══════════════════════════════════════════════════════════════════════════
  // MOBİL 5 ADIMLI SİHİRBAZ ADIM TANIMLARI & HAZIRLIK HESAPLAMASI
  // ══════════════════════════════════════════════════════════════════════════
  const MOBILE_5_STEPS = useMemo(() => [
    {
      stepNo: 1,
      title: 'Künye & Rejim',
      subtitle: 'Mevzuat Türü, Tarih & Eğitici Kadrosu',
      icon: GraduationCap,
      isDone: Boolean(educationTitle && educationTitle.trim().length > 0)
    },
    {
      stepNo: 2,
      title: 'Müfredat',
      subtitle: '4 Ana Kategori & Ders Saatleri Dağılımı',
      icon: Layers,
      isDone: selectedTopics && selectedTopics.length > 0
    },
    {
      stepNo: 3,
      title: 'Katılımcılar',
      subtitle: \`\${participants.length} Personel Seçildi\`,
      icon: Users,
      isDone: participants && participants.length > 0
    },
    {
      stepNo: 4,
      title: 'Sınav & Not',
      subtitle: 'Madde 16 Ölçme ve Değerlendirme',
      icon: Award,
      isDone: participants.length > 0 && participants.every(p => p.score !== undefined && p.score !== null && p.score !== '')
    },
    {
      stepNo: 5,
      title: 'Onay & Çıktı',
      subtitle: 'Kaydet, A4 Tutanak & Sertifikalar',
      icon: CheckCircle2,
      isDone: Boolean(editingRecordId) || (participants.length > 0 && selectedTopics.length > 0)
    }
  ], [educationTitle, selectedTopics, participants, editingRecordId]);

  const overallReadinessPercent = useMemo(() => {
    const doneCount = MOBILE_5_STEPS.filter(s => s.isDone).length;
    return Math.round((doneCount / MOBILE_5_STEPS.length) * 100);
  }, [MOBILE_5_STEPS]);`;

if (!content.includes('const MOBILE_5_STEPS = useMemo')) {
  content = content.replace(riskRuleTarget, mobileStepsMemo);
  console.log('Added MOBILE_5_STEPS and overallReadinessPercent after isRiskCategoryRuleSatisfied.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');

