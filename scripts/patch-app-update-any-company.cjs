const fs = require('fs');

const appPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add updateCompanyById right after updateActiveCompany
const updateCompByIdCode = `
  const updateCompanyById = (targetCompanyId, updates) => {
    const updatedCompanies = companies.map(c => {
      if (String(c.id) === String(targetCompanyId)) {
        const updatedComp = { ...c, ...updates };
        if (db) {
          saveCompanyToDB(updatedComp).catch(err => console.warn("Bulut kayıt bildirimi:", err));
        }
        return updatedComp;
      }
      return c;
    });
    setCompanies(updatedCompanies);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
  };
`;

if (!content.includes('const updateCompanyById =')) {
  content = content.replace(
    /const updateActiveCompany = \(updates\) => \{[\s\S]*?syncPermissionsForCompany\(activeCompanyId, updates\.info\.team, updates\.info\.preparer\);\s*\}\s*\};/,
    `$& \n${updateCompByIdCode}`
  );
}

// 2. Add onUpdateAnyCompany to Workspace params
if (!content.includes('onUpdateAnyCompany,')) {
  content = content.replace(
    /function Workspace\(\{([\s\S]*?)onUpdateActiveCompany,/,
    `function Workspace({$1onUpdateActiveCompany, onUpdateAnyCompany,`
  );
}

// 3. Pass onUpdateAnyCompany to EducationHubTab inside Workspace
content = content.replace(
  /<EducationHubTab([\s\S]*?)onUpdateCompany=\{onUpdateActiveCompany\}/,
  `<EducationHubTab$1onUpdateCompany={onUpdateActiveCompany}\n              onUpdateAnyCompany={onUpdateAnyCompany}`
);

// 4. Pass onUpdateAnyCompany={updateCompanyById} to Workspace component instantiation
content = content.replace(
  /onUpdateActiveCompany=\{updateActiveCompany\}/,
  `onUpdateActiveCompany={updateActiveCompany}\n              onUpdateAnyCompany={updateCompanyById}`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('>>> App.jsx patched with onUpdateAnyCompany successfully.');
