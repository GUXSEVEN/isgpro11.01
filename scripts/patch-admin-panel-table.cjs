const fs = require('fs');

const targetFile = './src/components/AdminPanel.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('1. Adding OSGB Manager badge in Cell 2...');
const targetRoleBadge = `                                    <span className={\`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full \${
                                      u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      u.role === 'uzman' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      u.role === 'hekim' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                    }\`}>
                                      {u.role === 'admin' ? 'YÖNETİCİ' :
                                       u.role === 'uzman' ? 'İSG UZMANI' :
                                       u.role === 'hekim' ? 'İŞYERİ HEKİMİ' : 'PERSONEL'}
                                    </span>`;

const newRoleBadge = `                                    <span className={\`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full \${
                                      u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      u.role === 'uzman' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      u.role === 'hekim' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                    }\`}>
                                      {u.role === 'admin' ? 'YÖNETİCİ' :
                                       u.role === 'uzman' ? 'İSG UZMANI' :
                                       u.role === 'hekim' ? 'İŞYERİ HEKİMİ' : 'PERSONEL'}
                                    </span>
                                    {Boolean(u.isOsgbManager || u.role === 'osgb_manager') && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                                          <Building2 size={10} /> OSGB Yöneticisi: {u.managedOsgbName || 'Atanmamış'}
                                        </span>
                                      </div>
                                    )}
                                    {Boolean(u.canViewAllCompanies) && (
                                      <div className="mt-0.5">
                                        <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                          👁️ Tüm Firmaları Görebilir
                                        </span>
                                      </div>
                                    )}`;

if (content.includes(targetRoleBadge)) {
  content = content.replace(targetRoleBadge, newRoleBadge);
  console.log('  -> Role badge updated with OSGB Manager info!');
} else {
  console.log('  -> Trying normalized replace for role badge...');
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = targetRoleBadge.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    content = normContent.replace(normTarget, newRoleBadge.replace(/\r\n/g, '\n'));
    console.log('  -> Normalized role badge replaced!');
  } else {
    console.error('  -> Failed to replace role badge!');
  }
}

console.log('2. Adding "Firma İzinleri" button in Cell 5...');
const targetCell5Edit = `                                     {/* Şifre ve Tüm Bilgileri Düzenleme Modalı Açıcı */}
                                     <button
                                       onClick={() => openEditModalForUser(u)}
                                       title="Kullanıcı Bilgilerini ve Şifresini Düzenle"
                                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200 flex items-center gap-1"
                                     >
                                       <Edit2 size={11} />
                                       <span>Düzenle</span>
                                     </button>`;

const newCell5Edit = `                                     {/* Firma İzinleri ve OSGB Yetkileri Modalı Açıcı */}
                                     <button
                                       onClick={() => openPermissionsModalForUser(u)}
                                       title="Firma İzinlerini ve OSGB Yetkilerini Yönet"
                                       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-indigo-200 flex items-center gap-1 shadow-xs"
                                     >
                                       <ShieldCheck size={11} className="text-indigo-600" />
                                       <span>Firma İzinleri</span>
                                     </button>

                                     {/* Şifre ve Tüm Bilgileri Düzenleme Modalı Açıcı */}
                                     <button
                                       onClick={() => openEditModalForUser(u)}
                                       title="Kullanıcı Bilgilerini ve Şifresini Düzenle"
                                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200 flex items-center gap-1"
                                     >
                                       <Edit2 size={11} />
                                       <span>Düzenle</span>
                                     </button>`;

const normContent2 = content.replace(/\r\n/g, '\n');
const normTarget2 = targetCell5Edit.replace(/\r\n/g, '\n');
if (normContent2.includes(normTarget2)) {
  content = normContent2.replace(normTarget2, newCell5Edit.replace(/\r\n/g, '\n'));
  console.log('  -> "Firma İzinleri" button added to table actions!');
} else {
  console.error('  -> Failed to replace cell 5 edit button!');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done updating AdminPanel.tsx table!');
