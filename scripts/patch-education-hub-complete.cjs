const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/EducationHubTab.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Backup the original file first if not already backed up
const backupPath = filePath + '.bak_pre_multi_company_ai';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log('Backup created at', backupPath);
}

// 1. Verify and update props to include onUpdateAnyCompany
content = content.replace(
  /export default function EducationHubTab\(\{[\s\S]*?onNavigateToModule\s*\}\) \{/,
  `export default function EducationHubTab({
  company,
  currentUser,
  users = [],
  companies = [],
  osgbs = [],
  employees = [],
  onUpdateCompany,
  setActiveTab,
  onNavigateToModule,
  onUpdateAnyCompany
}) {`
);

// 2. Add imports for AI / UI icons if not present
if (!content.includes('Building2')) {
  content = content.replace(
    /import \{\s*GraduationCap,/,
    `import {\n  Building2, Stethoscope, Sparkles, Bot, Loader2, Plus, Filter, CheckSquare, Square, RefreshCw,\n  GraduationCap,`
  );
}

// Write the script to perform full replacement or targeted insertion
fs.writeFileSync(filePath, content, 'utf8');
console.log('Step 1 applied successfully.');
