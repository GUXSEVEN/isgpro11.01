const fs = require('fs');

const hrFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\HumanResourcesTab.jsx';
let content = fs.readFileSync(hrFile, 'utf8');

// 1. editFormData initial state
content = content.replace(
  `  const [editFormData, setEditFormData] = useState({
    id: '',
    tcNo: '',
    name: '',
    surname: '',`,
  `  const [editFormData, setEditFormData] = useState({
    id: '',
    tcNo: '',
    name: '',
    surname: '',
    phone: '',`
);

// 2. newEmp initial state
content = content.replace(
  `  const [newEmp, setNewEmp] = useState({
    tcNo: '',
    name: '',
    surname: '',`,
  `  const [newEmp, setNewEmp] = useState({
    tcNo: '',
    name: '',
    surname: '',
    phone: '',`
);

// 3. employees normalization in useMemo
content = content.replace(
  `          tcNo: existing.tcNo || tc,
          professionTitle: existing.professionTitle || emp.professionTitle || emp.jobTitle || 'Çalışan',`,
  `          tcNo: existing.tcNo || tc,
          phone: existing.phone || emp.phone || emp.telephone || '',
          professionTitle: existing.professionTitle || emp.professionTitle || emp.jobTitle || 'Çalışan',`
);

// 4. search filter in filteredEmployees
content = content.replace(
  `        const prof = (emp.professionTitle || emp.professionCode || '').toLowerCase();
        const sgk = (emp.sgkNo || '').toLowerCase();
        return fullName.includes(query) || tc.includes(query) || prof.includes(query) || sgk.includes(query);`,
  `        const prof = (emp.professionTitle || emp.professionCode || '').toLowerCase();
        const sgk = (emp.sgkNo || '').toLowerCase();
        const phone = (emp.phone || emp.telephone || '').toLowerCase();
        return fullName.includes(query) || tc.includes(query) || prof.includes(query) || sgk.includes(query) || phone.includes(query);`
);

// 5. handleSaveEmployee (createdEmp object)
content = content.replace(
  `      name: newEmp.name.trim(),
      surname: newEmp.surname.trim(),
      fullName,
      birthDate: newEmp.birthDate,`,
  `      name: newEmp.name.trim(),
      surname: newEmp.surname.trim(),
      phone: newEmp.phone ? newEmp.phone.trim() : '',
      fullName,
      birthDate: newEmp.birthDate,`
);

// 6. handleOpenEditModal (setEditFormData)
content = content.replace(
  `      tcNo: emp.tcNo || '',
      name: computedName,
      surname: computedSurname,
      birthDate: emp.birthDate || '',`,
  `      tcNo: emp.tcNo || '',
      name: computedName,
      surname: computedSurname,
      phone: emp.phone || emp.telephone || '',
      birthDate: emp.birthDate || '',`
);

// 7. handleSaveEditEmployee (updatedEmployees mapping)
content = content.replace(
  `        name: editFormData.name.trim(),
        surname: editFormData.surname.trim(),
        fullName,
        birthDate: editFormData.birthDate,`,
  `        name: editFormData.name.trim(),
        surname: editFormData.surname.trim(),
        phone: editFormData.phone ? editFormData.phone.trim() : '',
        fullName,
        birthDate: editFormData.birthDate,`
);

// 8. resetAddForm
content = content.replace(
  `    setNewEmp({
      tcNo: '',
      name: '',
      surname: '',`,
  `    setNewEmp({
      tcNo: '',
      name: '',
      surname: '',
      phone: '',`
);

// 9. exportEmployeesToExcel headers & data
content = content.replace(
  `      'TC Kimlik No',
      'Ad',
      'Soyad',
      'Doğum Tarihi',`,
  `      'TC Kimlik No',
      'Ad',
      'Soyad',
      'Telefon No',
      'Doğum Tarihi',`
);

content = content.replace(
  `      const tc = emp.tcNo ? String(emp.tcNo).replace(/\\D/g, '').trim() : '';
      const key = (tc && tc.length >= 11) ? tc : (emp.id || \`\${emp.name}_\${emp.surname}\`);
      const m25 = madde25Map.get(key);
      const m18 = madde18Map.get(key);

      let m25StatusText = 'Standart Kayıt';`,
  `      const tc = emp.tcNo ? String(emp.tcNo).replace(/\\D/g, '').trim() : '';
      const key = (tc && tc.length >= 11) ? tc : (emp.id || \`\${emp.name}_\${emp.surname}\`);
      const m25 = madde25Map.get(key);
      const m18 = madde18Map.get(key);

      let m25StatusText = 'Standart Kayıt';`
);

// Let's add phone to excel row
content = content.replace(
  `      worksheet.addRow([
        index + 1,
        tc || '-',
        emp.name || '-',
        emp.surname || '-',
        emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('tr-TR') : '-',`,
  `      worksheet.addRow([
        index + 1,
        tc || '-',
        emp.name || '-',
        emp.surname || '-',
        emp.phone || emp.telephone || '-',
        emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('tr-TR') : '-',`
);

// 10. Table display in tbody (phone badge)
content = content.replace(
  `                            <p className="text-[10px] text-slate-400">
                              SGK: {emp.sgkNo || company.info?.sgkNo || '-'}
                            </p>`,
  `                            <p className="text-[10px] text-slate-400">
                              SGK: {emp.sgkNo || company.info?.sgkNo || '-'}
                              {(emp.phone || emp.telephone) && (
                                <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">
                                  📞 {emp.phone || emp.telephone}
                                </span>
                              )}
                            </p>`
);

// 11. showAddModal input for phone
const targetAddSurnameInput = `                {/* Soyad */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Soyad <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Çalışanın Soyadı"
                    value={newEmp.surname}
                    onChange={(e) => setNewEmp({ ...newEmp, surname: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>`;

const replacementAddSurnameInput = `${targetAddSurnameInput}

                {/* Telefon Numarası */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    İletişim / Telefon Numarası <span className="text-slate-400 font-normal">(İsteğe Bağlı)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Örn: 05XX XXX XX XX"
                    value={newEmp.phone || ''}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>`;

content = content.replace(targetAddSurnameInput, replacementAddSurnameInput);

// 12. showEditModal input for phone
const targetEditSurnameInput = `                {/* Soyad */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Soyadı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.surname}
                    onChange={(e) => setEditFormData({ ...editFormData, surname: e.target.value })}
                    placeholder="Çalışan Soyadı"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>`;

const replacementEditSurnameInput = `${targetEditSurnameInput}

                {/* Telefon Numarası */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    İletişim / Telefon Numarası <span className="text-slate-400 font-normal">(İsteğe Bağlı)</span>
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="Örn: 05XX XXX XX XX"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>`;

content = content.replace(targetEditSurnameInput, replacementEditSurnameInput);

fs.writeFileSync(hrFile, content, 'utf8');
console.log('HumanResourcesTab.jsx successfully patched with phone number support!');
