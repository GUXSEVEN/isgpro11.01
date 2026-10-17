const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyTeamsTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Dikey A4 Raporunda Tabloya Acil Durum Yöneticisi satırı ekleme
const oldPortraitTbody = `                    <tbody>
                      {teamMembers.map((m, idx) => {
                        const teamObj = allTeams.find(t => t.id === m.teamId);
                        return (
                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-1 font-bold text-center border-r border-slate-400">{idx + 1}</td>`;

const newPortraitTbody = `                    <tbody>
                      {/* 1. SATIR: ACİL DURUM YÖNETİCİSİ (EKİP İMZASI TABLODA ALINIR) */}
                      {emergencyManager?.name && (
                        <tr className="border-b-2 border-indigo-900 bg-indigo-50/70 font-semibold">
                          <td className="p-1 font-black text-center border-r border-slate-400 text-indigo-900">1</td>
                          <td className="p-1 font-black border-r border-slate-400 text-indigo-950">
                            {emergencyManager.name}
                            <span className="block text-[8px] text-indigo-600 font-bold uppercase">(İşyeri Acil Durum Yöneticisi)</span>
                          </td>
                          <td className="p-1 font-mono text-center border-r border-slate-400">{emergencyManager.tcNo || '-'}</td>
                          {reportSettings.showPhones && (
                            <td className="p-1 font-mono text-center border-r border-slate-400 font-bold text-indigo-900">{emergencyManager.phone || '-'}</td>
                          )}
                          <td className="p-1 border-r border-slate-400">{emergencyManager.title || 'Acil Durum Yöneticisi'}</td>
                          <td className="p-1 font-extrabold border-r border-slate-400 text-indigo-900">Acil Durum Yönetim ve Koordinasyon</td>
                          <td className="p-1 text-center font-black border-r border-slate-400 text-indigo-900 bg-indigo-100/60">Yönetici / Ekip Lideri</td>
                          <td className="p-1 text-center h-8">
                            <div className="w-full h-6 border border-dashed border-indigo-400 rounded flex items-center justify-center text-[8px] text-indigo-700 font-bold">
                              [ İMZA ]
                            </div>
                          </td>
                        </tr>
                      )}

                      {teamMembers.map((m, idx) => {
                        const teamObj = allTeams.find(t => t.id === m.teamId);
                        const seqNum = emergencyManager?.name ? idx + 2 : idx + 1;
                        return (
                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-1 font-bold text-center border-r border-slate-400">{seqNum}</td>`;

content = content.replace(oldPortraitTbody, newPortraitTbody);

// 2. Dikey A4 Alt İmza Alanını Sadece 2 Kişi Yapma (İSG Uzmanı & İşveren/İşveren Vekili)
const oldPortraitSignatures = `                {/* 5. İMZA ALANLARI (A4'ÜN TAM EN ALTINA YASLI - MARGIN-TOP: AUTO) */}
                <div className="imza-alani-yasla mt-auto pt-3 border-t-2 border-slate-900 text-center text-[10px] shrink-0">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Düzenleyen */}
                    <div>
                      <p className="font-extrabold uppercase">DÜZENLEYEN</p>
                      <p className="text-[9px] text-slate-500 font-semibold">İş Güvenliği Uzmanı</p>
                      <p className="font-bold text-slate-800 mt-0.5">{currentUser?.name || 'İSG Uzmanı'}</p>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-0.5">İmza</p>
                    </div>

                    {/* Acil Durum Yöneticisi */}
                    <div>
                      <p className="font-extrabold uppercase">ACİL DURUM YÖNETİCİSİ</p>
                      <p className="text-[9px] text-slate-500 font-semibold">Koordinatör / Yetkili</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {emergencyManager?.name || 'Acil Durum Koordinatörü'}
                      </p>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-0.5">İmza</p>
                    </div>

                    {/* Tebliğ Eden / İşveren (BUGÜNÜN TARİHİ VE İŞVEREN OLARAK YAZILDI) */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-900">TEBLİĞ EDEN</p>
                      <p className="text-[9px] text-slate-600 font-bold">İşveren / İşveren Vekili</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{reportSettings.employerName}</p>
                      <p className="text-[8px] text-slate-500 font-mono">Tarih: {reportSettings.protocolDate}</p>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-0.5"></div>
                      <p className="text-[8px] text-slate-400 mt-0.5">İmza / Kaşe</p>
                    </div>
                  </div>
                </div>`;

const newPortraitSignatures = `                {/* 5. İMZA ALANLARI (SADECE İSG UZMANI VE İŞVEREN / İŞVEREN VEKİLİ - A4'ÜN EN ALTINA YASLI) */}
                <div className="imza-alani-yasla mt-auto pt-3 border-t-2 border-slate-900 text-center text-[10px] shrink-0">
                  <div className="grid grid-cols-2 gap-12 max-w-2xl mx-auto">
                    {/* Düzenleyen: İş Güvenliği Uzmanı */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-800">DÜZENLEYEN</p>
                      <p className="text-[9px] text-slate-500 font-semibold">İş Güvenliği Uzmanı</p>
                      <p className="font-bold text-slate-900 mt-1">{currentUser?.name || 'İSG Uzmanı'}</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza</p>
                    </div>

                    {/* Tebliğ Eden: İşveren / İşveren Vekili */}
                    <div>
                      <p className="font-extrabold uppercase text-slate-900">TEBLİĞ EDEN</p>
                      <p className="text-[9px] text-slate-600 font-bold">İşveren / İşveren Vekili</p>
                      <p className="font-extrabold text-slate-900 mt-1">{reportSettings.employerName}</p>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">Tarih: {reportSettings.protocolDate}</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                      <p className="text-[8px] text-slate-400 mt-1">İmza / Kaşe</p>
                    </div>
                  </div>
                </div>`;

content = content.replace(oldPortraitSignatures, newPortraitSignatures);

// 3. Yatay A4 Raporunda Tabloya Acil Durum Yöneticisi satırı ekleme
const oldLandscapeTbody = `                <tbody>
                  {teamMembers.map((m, idx) => {
                    const teamObj = allTeams.find(t => t.id === m.teamId);
                    return (
                      <tr key={m.id} className="border-b border-slate-400">
                        <td className="p-2 font-bold text-center border-r border-slate-400">{idx + 1}</td>`;

const newLandscapeTbody = `                <tbody>
                  {/* ACİL DURUM YÖNETİCİSİ SATIRI (EKİP İMZASI TABLODA ALINIR) */}
                  {emergencyManager?.name && (
                    <tr className="border-b-2 border-indigo-900 bg-indigo-50/70 font-semibold">
                      <td className="p-2 font-black text-center border-r border-slate-400 text-indigo-900">1</td>
                      <td className="p-2 font-black border-r border-slate-400 text-indigo-950">
                        {emergencyManager.name}
                        <span className="block text-[8.5px] text-indigo-600 font-bold uppercase">(İşyeri Acil Durum Yöneticisi)</span>
                      </td>
                      <td className="p-2 font-mono text-center border-r border-slate-400">{emergencyManager.tcNo || '-'}</td>
                      <td className="p-2 font-mono text-center border-r border-slate-400 font-bold text-indigo-900">{emergencyManager.phone || '-'}</td>
                      <td className="p-2 border-r border-slate-400">{emergencyManager.title || 'Acil Durum Yöneticisi'}</td>
                      <td className="p-2 font-extrabold border-r border-slate-400 text-indigo-900">Acil Durum Yönetim ve Koordinasyon</td>
                      <td className="p-2 font-black text-center border-r border-slate-400 text-indigo-900 bg-indigo-100/60">Yönetici / Ekip Lideri</td>
                      <td className="p-2 border-r border-slate-400">{osgbTrainers[0] || '-'}</td>
                      <td className="p-2 font-mono text-center border-r border-slate-400">{new Date().toLocaleDateString('tr-TR')}</td>
                      <td className="p-2 border-r border-slate-400 text-center h-10">
                        <div className="w-full h-8 border border-dashed border-indigo-400 rounded flex items-center justify-center text-[9px] text-indigo-700 font-bold">
                          [ İMZA ]
                        </div>
                      </td>
                    </tr>
                  )}

                  {teamMembers.map((m, idx) => {
                    const teamObj = allTeams.find(t => t.id === m.teamId);
                    const seqNum = emergencyManager?.name ? idx + 2 : idx + 1;
                    return (
                      <tr key={m.id} className="border-b border-slate-400">
                        <td className="p-2 font-bold text-center border-r border-slate-400">{seqNum}</td>`;

content = content.replace(oldLandscapeTbody, newLandscapeTbody);

// 4. Yatay A4 Alt İmza Alanını Sadece 2 Kişi Yapma (İSG Uzmanı & İşveren/İşveren Vekili)
const oldLandscapeSignatures = `              {/* Onay İmzaları (Yönetici Dahil) */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-center text-[11px]">
                <div>
                  <p className="font-bold uppercase">Hazırlayan (İSG Uzmanı)</p>
                  <p className="text-slate-700">{currentUser?.name || 'İSG Uzmanı'}</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-400">İmza</p>
                </div>
                <div>
                  <p className="font-bold uppercase">Acil Durum Yöneticisi</p>
                  <p className="text-slate-700">{emergencyManager?.name || 'Yönetici / Koordinatör'}</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-400">İmza</p>
                </div>
                <div>
                  <p className="font-bold uppercase">Tebliğ Eden / Onaylayan (İşveren)</p>
                  <p className="text-slate-700">{company.info?.official || 'İşveren / İşveren Vekili'}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                  <div className="h-8 border-b border-dashed border-slate-400 mt-0.5"></div>
                  <p className="text-[9px] text-slate-400">İmza / Kaşe</p>
                </div>
              </div>`;

const newLandscapeSignatures = `              {/* Onay İmzaları (SADECE İSG UZMANI VE İŞVEREN / İŞVEREN VEKİLİ) */}
              <div className="grid grid-cols-2 gap-16 max-w-2xl mx-auto pt-6 border-t-2 border-slate-900 text-center text-[11px]">
                <div>
                  <p className="font-bold uppercase">Hazırlayan (İSG Uzmanı)</p>
                  <p className="text-slate-700 mt-1 font-semibold">{currentUser?.name || 'İSG Uzmanı'}</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-400 mt-1">İmza</p>
                </div>
                <div>
                  <p className="font-bold uppercase">Tebliğ Eden / Onaylayan (İşveren)</p>
                  <p className="text-slate-700 mt-1 font-semibold">{company.info?.official || 'İşveren / İşveren Vekili'}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-400 mt-1">İmza / Kaşe</p>
                </div>
              </div>`;

content = content.replace(oldLandscapeSignatures, newLandscapeSignatures);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('EmergencyTeamsTab.jsx successfully patched: Manager moved to teams table for signature, bottom signatures set to only IGU & Employer!');
