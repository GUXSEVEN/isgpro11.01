const fs = require('fs');

const targetFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\components\\tabs\\EmergencyTeamsTab.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add calculateEmergencyQuotas / legalQuotas logic
const targetBeforeStats = `  // İstatistikler (Tüm ekipleri dinamik sayar)
  const stats = useMemo(() => {`;

const quotaCalculationCode = `  // ── YASAL MEVZUAT VE KOTA HESAPLAYICI (30/40/50 KURALI & İLKYARDIM YÖNETMELİĞİ) ──
  const legalQuotas = useMemo(() => {
    // Çalışan Sayısı Tespiti (Aktif çalışanlar veya kayıtlı personel sayısı)
    const activeEmployeesCount = Array.isArray(employees) && employees.length > 0
      ? employees.filter(e => !e.exitDate && e.status !== 'passive').length
      : (Number(company?.info?.employeeCount) || 1);

    const empCount = Math.max(1, activeEmployeesCount);

    // Tehlike Sınıfı Tespiti
    const rawHazard = String(company?.info?.hazardClass || company?.hazardClass || 'Az Tehlikeli').trim().toLowerCase();
    const isCokTehlikeli = rawHazard.includes('çok') || rawHazard.includes('cok');
    const isTehlikeli = !isCokTehlikeli && (rawHazard.includes('tehlikeli') && !rawHazard.includes('az'));
    const isAzTehlikeli = !isCokTehlikeli && !isTehlikeli;

    const hazardLabel = isCokTehlikeli ? 'Çok Tehlikeli' : (isTehlikeli ? 'Tehlikeli' : 'Az Tehlikeli');

    // 10'dan az çalışan az tehlikeli özel kuralı
    const isUnder10AzTehlikeli = isAzTehlikeli && empCount < 10;

    // Destek Elemanı Oranı: Çok Tehlikeli: 30, Tehlikeli: 40, Az Tehlikeli: 50
    const factorDestek = isCokTehlikeli ? 30 : (isTehlikeli ? 40 : 50);
    const standardRequired = Math.ceil(empCount / factorDestek);

    const fireRequired = standardRequired;
    const rescueRequired = standardRequired;
    const evacuationRequired = standardRequired;

    // İlkyardım Oranı: Çok Tehlikeli: 10, Tehlikeli: 15, Az Tehlikeli: 20
    const factorIlkyardim = isCokTehlikeli ? 10 : (isTehlikeli ? 15 : 20);
    const firstAidRequired = Math.ceil(empCount / factorIlkyardim);

    // Mevcut Atanan Sayılar
    const fireAssigned = teamMembers.filter(m => m.teamId === 'fire').length;
    const rescueAssigned = teamMembers.filter(m => m.teamId === 'rescue').length;
    const evacuationAssigned = teamMembers.filter(m => m.teamId === 'evacuation').length;
    const firstAidAssigned = teamMembers.filter(m => m.teamId === 'firstAid').length;

    // Eksikler
    let fireMissing = Math.max(0, fireRequired - fireAssigned);
    let rescueMissing = Math.max(0, rescueRequired - rescueAssigned);
    let evacuationMissing = Math.max(0, evacuationRequired - evacuationAssigned);
    let firstAidMissing = Math.max(0, firstAidRequired - firstAidAssigned);

    // 10'dan az az tehlikeli durumunda 3 ekip için toplam 1 kişi yeterli kuralı
    let isCompliant = false;
    if (isUnder10AzTehlikeli) {
      const totalDestek = fireAssigned + rescueAssigned + evacuationAssigned;
      isCompliant = totalDestek >= 1 && firstAidAssigned >= firstAidRequired;
      if (totalDestek >= 1) {
        fireMissing = 0;
        rescueMissing = 0;
        evacuationMissing = 0;
      }
    } else {
      isCompliant = fireMissing === 0 && rescueMissing === 0 && evacuationMissing === 0 && firstAidMissing === 0;
    }

    const totalMissing = fireMissing + rescueMissing + evacuationMissing + firstAidMissing;

    return {
      empCount,
      hazardLabel,
      factorDestek,
      factorIlkyardim,
      isUnder10AzTehlikeli,
      fire: { required: fireRequired, assigned: fireAssigned, missing: fireMissing, isOk: fireMissing === 0 },
      rescue: { required: rescueRequired, assigned: rescueAssigned, missing: rescueMissing, isOk: rescueMissing === 0 },
      evacuation: { required: evacuationRequired, assigned: evacuationAssigned, missing: evacuationMissing, isOk: evacuationMissing === 0 },
      firstAid: { required: firstAidRequired, assigned: firstAidAssigned, missing: firstAidMissing, isOk: firstAidMissing === 0 },
      isCompliant,
      totalMissing
    };
  }, [company, employees, teamMembers]);

  // İstatistikler (Tüm ekipleri dinamik sayar)
  const stats = useMemo(() => {`;

content = content.replace(targetBeforeStats, quotaCalculationCode);

// 2. Add AI & Legal Quotas Widget directly under Emergency Manager card
const targetUnderManagerCard = `        {/* ── EKİP KARTLARI VE KİŞİ SAYILARI (DİNAMİK + SİLİNEBİLİR) ─── */}`;

const quotaWidgetCode = `        {/* ── AI MEVZUAT VE YASAL KOTA DENETİM PANELİ (30/40/50 KURALI & İLKYARDIM YÖNETMELİĞİ) ─── */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900/60 dark:to-indigo-950/30 p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} className="text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  AI Mevzuat & Yasal Ekip Kotası Denetimi
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    6331 Sayılı Kanun Madde 11
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  İşyerinin tehlike sınıfı (<strong className="text-indigo-600 dark:text-indigo-400">{legalQuotas.hazardLabel}</strong>) ve 
                  çalışan sayısına (<strong className="text-slate-700 dark:text-slate-200">{legalQuotas.empCount} Personel</strong>) göre yasal asgari zorunlu kadro analizi
                </p>
              </div>
            </div>

            <div>
              {legalQuotas.isCompliant ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-sm shadow-emerald-500/20">
                  <CheckCircle2 size={16} /> MEVZUATA %100 TAM UYUMLU
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-black shadow-sm shadow-rose-500/20 animate-pulse">
                  <ShieldAlert size={16} /> {legalQuotas.totalMissing} PERSONEL EKSİĞİ VAR
                </span>
              )}
            </div>
          </div>

          {/* 10'dan az çalışan az tehlikeli özel muafiyet notu */}
          {legalQuotas.isUnder10AzTehlikeli && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Info size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>10'dan Az Çalışanı Olan Az Tehlikeli İşyeri Kuralı:</strong> Söndürme, kurtarma ve koruma ekiplerinin tamamı için uygun donanıma sahip en az 1 destek elemanı görevlendirilmesi yeterlidir.
              </span>
            </div>
          )}

          {/* Kural Kriterleri & 4 Ekip Yasal Kota İlerleme Çubukları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Söndürme Ekibi */}
            <div className={\`p-3 rounded-xl border transition-all \${
              legalQuotas.fire.isOk 
                ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-800' 
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
            }\`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-extrabold text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <Flame size={14} /> Söndürme Ekibi
                </span>
                <span className={\`text-[10px] font-black px-1.5 py-0.2 rounded \${
                  legalQuotas.fire.isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }\`}>
                  {legalQuotas.fire.isOk ? '✓ Tam' : \`\${legalQuotas.fire.missing} Eksik\`}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[10px] text-slate-500">Kural: Her {legalQuotas.factorDestek} kişiye 1</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {legalQuotas.fire.assigned} / {legalQuotas.fire.required} Kişi
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={\`h-full rounded-full transition-all \${legalQuotas.fire.isOk ? 'bg-emerald-500' : 'bg-rose-500'}\`}
                  style={{ width: \`\${Math.min(100, (legalQuotas.fire.assigned / legalQuotas.fire.required) * 100)}%\` }}
                />
              </div>
            </div>

            {/* 2. Kurtarma Ekibi */}
            <div className={\`p-3 rounded-xl border transition-all \${
              legalQuotas.rescue.isOk 
                ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-800' 
                : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
            }\`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-extrabold text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert size={14} /> Kurtarma Ekibi
                </span>
                <span className={\`text-[10px] font-black px-1.5 py-0.2 rounded \${
                  legalQuotas.rescue.isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }\`}>
                  {legalQuotas.rescue.isOk ? '✓ Tam' : \`\${legalQuotas.rescue.missing} Eksik\`}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[10px] text-slate-500">Kural: Her {legalQuotas.factorDestek} kişiye 1</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {legalQuotas.rescue.assigned} / {legalQuotas.rescue.required} Kişi
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={\`h-full rounded-full transition-all \${legalQuotas.rescue.isOk ? 'bg-emerald-500' : 'bg-amber-500'}\`}
                  style={{ width: \`\${Math.min(100, (legalQuotas.rescue.assigned / legalQuotas.rescue.required) * 100)}%\` }}
                />
              </div>
            </div>

            {/* 3. Koruma Ekibi */}
            <div className={\`p-3 rounded-xl border transition-all \${
              legalQuotas.evacuation.isOk 
                ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-800' 
                : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900'
            }\`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-extrabold text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <Users size={14} /> Koruma Ekibi
                </span>
                <span className={\`text-[10px] font-black px-1.5 py-0.2 rounded \${
                  legalQuotas.evacuation.isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }\`}>
                  {legalQuotas.evacuation.isOk ? '✓ Tam' : \`\${legalQuotas.evacuation.missing} Eksik\`}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[10px] text-slate-500">Kural: Her {legalQuotas.factorDestek} kişiye 1</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {legalQuotas.evacuation.assigned} / {legalQuotas.evacuation.required} Kişi
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={\`h-full rounded-full transition-all \${legalQuotas.evacuation.isOk ? 'bg-emerald-500' : 'bg-blue-500'}\`}
                  style={{ width: \`\${Math.min(100, (legalQuotas.evacuation.assigned / legalQuotas.evacuation.required) * 100)}%\` }}
                />
              </div>
            </div>

            {/* 4. İlkyardım Ekibi (İlkyardım Yönetmeliği) */}
            <div className={\`p-3 rounded-xl border transition-all \${
              legalQuotas.firstAid.isOk 
                ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-800' 
                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-rose-300 dark:border-rose-900'
            }\`}>
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-extrabold text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <HeartPulse size={14} /> İlkyardım Ekibi
                </span>
                <span className={\`text-[10px] font-black px-1.5 py-0.2 rounded \${
                  legalQuotas.firstAid.isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }\`}>
                  {legalQuotas.firstAid.isOk ? '✓ Tam' : \`\${legalQuotas.firstAid.missing} Eksik\`}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[10px] text-slate-500">Kural: Her {legalQuotas.factorIlkyardim} kişiye 1</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {legalQuotas.firstAid.assigned} / {legalQuotas.firstAid.required} Kişi
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={\`h-full rounded-full transition-all \${legalQuotas.firstAid.isOk ? 'bg-emerald-500' : 'bg-rose-500'}\`}
                  style={{ width: \`\${Math.min(100, (legalQuotas.firstAid.assigned / legalQuotas.firstAid.required) * 100)}%\` }}
                />
              </div>
            </div>
          </div>
        </div>

        ${targetUnderManagerCard}`;

content = content.replace(targetUnderManagerCard, quotaWidgetCode);

// 3. Update Team Cards to show legal quota badge
const targetInsideTeamCard = `<span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 block">
                    {count} Personel
                  </span>`;

const replacementInsideTeamCard = `<div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {count} Personel
                    </span>
                    {legalQuotas[team.id] && (
                      <span className={\`text-[9.5px] font-bold px-1.5 py-0.2 rounded \${
                        legalQuotas[team.id].isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }\`}>
                        Yasal: {legalQuotas[team.id].required}
                      </span>
                    )}
                  </div>`;

content = content.replace(targetInsideTeamCard, replacementInsideTeamCard);

// 4. Add Legal Quotas Summary Banner in Dikey A4 Protocol Document
const targetDikeyNotice = `<p
                    className="text-[9.5px] text-slate-800 italic leading-snug border-b border-slate-300 pb-2"
                    contentEditable={reportSettings.isEditable}
                    suppressContentEditableWarning
                  >
                    "{reportSettings.protocolNoticeText}"
                  </p>`;

const replacementDikeyNotice = `${targetDikeyNotice}

                  {/* Yasal Kota & Mevzuat Uyum Özeti Bandı */}
                  <div className="bg-slate-100 p-1.5 border border-slate-300 rounded text-[8.5px] flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      🏛️ MEVZUAT VE KOTA UYUMU (Madde 11): {legalQuotas.hazardLabel} ({legalQuotas.empCount} Çalışan) — Söndürme: {legalQuotas.fire.assigned}/{legalQuotas.fire.required}, Kurtarma: {legalQuotas.rescue.assigned}/{legalQuotas.rescue.required}, Koruma: {legalQuotas.evacuation.assigned}/{legalQuotas.evacuation.required}, İlkyardım: {legalQuotas.firstAid.assigned}/{legalQuotas.firstAid.required}
                    </span>
                    <span className={\`font-black px-2 py-0.5 rounded \${
                      legalQuotas.isCompliant ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }\`}>
                      {legalQuotas.isCompliant ? '✓ Yasal Kotaya Uygun' : '⚠️ Eksik Kadro Mevcut'}
                    </span>
                  </div>`;

content = content.replace(targetDikeyNotice, replacementDikeyNotice);

// 5. Add Legal Quotas Summary Banner in Yatay A4 Document
const targetYatayNotice = `<div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-400 text-[11px] font-semibold">`;

const replacementYatayNotice = `<div className="bg-slate-100 p-1.5 border border-slate-400 text-[10px] flex items-center justify-between font-bold">
                <span>
                  🏛️ YASAL KOTA DENETİMİ (30/40/50 & İLKYARDIM YÖNETMELİĞİ): {legalQuotas.hazardLabel} ({legalQuotas.empCount} Çalışan) — Söndürme: {legalQuotas.fire.assigned}/{legalQuotas.fire.required} | Kurtarma: {legalQuotas.rescue.assigned}/{legalQuotas.rescue.required} | Koruma: {legalQuotas.evacuation.assigned}/{legalQuotas.evacuation.required} | İlkyardım: {legalQuotas.firstAid.assigned}/{legalQuotas.firstAid.required}
                </span>
                <span className={\`px-2 py-0.5 rounded text-[9.5px] font-black \${
                  legalQuotas.isCompliant ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }\`}>
                  {legalQuotas.isCompliant ? 'MEVZUATA %100 UYUMLU' : \`\${legalQuotas.totalMissing} KİŞİ EKSİK\`}
                </span>
              </div>

              ${targetYatayNotice}`;

content = content.replace(targetYatayNotice, replacementYatayNotice);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('EmergencyTeamsTab.jsx successfully patched with 30/40/50 rule and First Aid regulation quota engine!');
