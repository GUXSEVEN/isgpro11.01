const fs = require('fs');

const isgPath = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/components/tabs/IsgEducationTab.jsx';
let content = fs.readFileSync(isgPath, 'utf8');

// 1. Import trainingTemplateLibrary in IsgEducationTab if not present
if (!content.includes('trainingTemplateLibrary')) {
  content = content.replace(
    /import React, \{ useState, useEffect, useMemo, useRef \} from 'react';/,
    `import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getSavedTemplates,
  saveCustomTemplate,
  deleteCustomTemplate
} from '../../utils/trainingTemplateLibrary';`
  );
}

// 2. Synchronize availableTemplates in IsgEducationTab with trainingTemplateLibrary
const syncTemplateLogic = `
  // Merkezi Kütüphaneden Şablonları Senkronize Et
  const centralTemplates = useMemo(() => {
    return getSavedTemplates(company?.id);
  }, [company, savedTemplates]);
`;

if (!content.includes('centralTemplates')) {
  content = content.replace(
    /const availableTemplates = useMemo\(\(\) => \{[\s\S]*?\}, \[company, savedTemplates\]\);/,
    `const availableTemplates = useMemo(() => {
    const local = savedTemplates || [];
    const central = getSavedTemplates(company?.id) || [];
    const map = new Map();
    [...central, ...local].forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [company, savedTemplates]);`
  );
}

// 3. Add 1-Click Remove from Content in IsgEducationTab
// When a template's topics are currently in selectedTopics, offer "➖ İçerikten Çıkar"
const enhancedTemplateButtons = `
                  <div key={tmpl.id} className="inline-flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-1 text-xs gap-1">
                    {/* Zaten ekli mi kontrolü */}
                    {(() => {
                      const tmplTopics = tmpl.topics || [];
                      const isAdded = tmplTopics.length > 0 && tmplTopics.some(tt => 
                        selectedTopics.some(st => (st.name || st.title || '').trim().toLowerCase() === (tt.name || tt.title || '').trim().toLowerCase())
                      );
                      return isAdded ? (
                        <button
                          type="button"
                          onClick={() => {
                            const namesToRemove = new Set(tmplTopics.map(t => (t.name || t.title || '').trim().toLowerCase()));
                            setSelectedTopics(prev => prev.filter(t => !namesToRemove.has((t.name || t.title || '').trim().toLowerCase())));
                            showToast(\`"\${tmpl.name}" konuları içerikten kaldırıldı.\`);
                          }}
                          className="px-2 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-bold cursor-pointer"
                          title="Bu şablonun konularını mevcut eğitimden kaldır"
                        >
                          ➖ Çıkar
                        </button>
                      ) : null;
                    })()}

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-left truncate max-w-[190px] cursor-pointer"
                      title="Bu şablonu içeriğe ekle / uygula"
                    >
                      {tmpl.name}
                    </button>

                    {tmpl.id !== 'tmpl-default-1' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                        title="Şablonu Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
`;

content = content.replace(
  /<div key=\{tmpl\.id\} className="inline-flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-1 text-xs">[\s\S]*?<\/div>/m,
  enhancedTemplateButtons.trim()
);

fs.writeFileSync(isgPath, content, 'utf8');
console.log('>>> IsgEducationTab patched with shared library sync and 1-click remove.');
