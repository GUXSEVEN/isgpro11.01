const fs = require('fs');

const appFile = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Update AI analysis prompt team names
content = content.replace(
  `- Söndürme: \${data.teams?.fire?.join(', ') || 'Belirtilmemiş'}
    - Kurtarma: \${data.teams?.rescue?.join(', ') || 'Belirtilmemiş'}
    - Koruma/Tahliye: \${data.teams?.evacuation?.join(', ') || 'Belirtilmemiş'}
    - İlkyardım: \${data.teams?.firstAid?.join(', ') || 'Belirtilmemiş'}`,
  `- Söndürme Ekibi: \${data.teams?.fire?.join(', ') || 'Belirtilmemiş'}
    - Kurtarma Ekibi: \${data.teams?.rescue?.join(', ') || 'Belirtilmemiş'}
    - Koruma Ekibi: \${data.teams?.evacuation?.join(', ') || 'Belirtilmemiş'}
    - İlkyardım Ekibi: \${data.teams?.firstAid?.join(', ') || 'Belirtilmemiş'}`
);

// 2. Update blockTeams in AcilDurumReportPreview
content = content.replace(
  `              <span>Arama ve Kurtarma Ekibi</span>
              <span className="text-[6.5px] text-amber-500 font-normal">Arama & Tahliye</span>`,
  `              <span>Kurtarma Ekibi</span>
              <span className="text-[6.5px] text-amber-500 font-normal">Kurtarma & Tahliye</span>`
);

content = content.replace(
  `              <span>Koruma ve Tahliye Ekibi</span>
              <span className="text-[6.5px] text-blue-500 font-normal">Güvenlik & Sevk</span>`,
  `              <span>Koruma Ekibi</span>
              <span className="text-[6.5px] text-blue-500 font-normal">Güvenlik & Koruma</span>`
);

// 3. Add Emergency Manager display in blockInfo & blockTeams of AcilDurumReportPreview
const targetBlockTeamsHeader = `<h2 className="font-bold text-[9.5px] uppercase bg-gray-100 p-1 border border-gray-300 mb-1">
          {procedureParagraphs.length > 0 ? '5.' : '4.'} ACİL DURUM EKİPLERİ
        </h2>`;

const replacementBlockTeamsHeader = `${targetBlockTeamsHeader}
        {company.emergencyManager?.name && (
          <div className="mb-1.5 p-1 bg-indigo-50/80 border border-indigo-200 rounded flex items-center justify-between text-[7.5px]">
            <span className="font-bold text-indigo-950">🚨 ACİL DURUM YÖNETİCİSİ: {company.emergencyManager.name} ({company.emergencyManager.title || 'Koordinatör'})</span>
            <span className="font-bold text-indigo-800">📞 İletişim: {company.emergencyManager.phone || '-'}</span>
          </div>
        )}`;

content = content.replace(targetBlockTeamsHeader, replacementBlockTeamsHeader);

// 4. Update EmergencyPlanView step 4 renderTeamSection
content = content.replace(
  `      {renderTeamSection('fire', 'Söndürme Ekibi', 'text-red-500', 'bg-red-50')}
      {renderTeamSection('rescue', 'Arama ve Kurtarma Ekibi', 'text-orange-500', 'bg-orange-50')}
      {renderTeamSection('evacuation', 'Koruma ve Tahliye Ekibi', 'text-blue-500', 'bg-blue-50')}
      {renderTeamSection('firstAid', 'İlkyardım Ekibi', 'text-green-500', 'bg-green-50')}`,
  `      {renderTeamSection('fire', 'Söndürme Ekibi', 'text-red-500', 'bg-red-50')}
      {renderTeamSection('rescue', 'Kurtarma Ekibi', 'text-orange-500', 'bg-orange-50')}
      {renderTeamSection('evacuation', 'Koruma Ekibi', 'text-blue-500', 'bg-blue-50')}
      {renderTeamSection('firstAid', 'İlkyardım Ekibi', 'text-green-500', 'bg-green-50')}`
);

fs.writeFileSync(appFile, content, 'utf8');
console.log('App.jsx successfully patched with updated team names and emergency manager reporting!');
