const fs = require('fs');

const targetFiles = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/APP/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App.jsx',
  'C:/Users/İBRAHİM/Desktop/APP dosyaları/App2.jsx',
  'C:/Users/İBRAHİM/Desktop/app/App.jsx',
  'C:/Users/İBRAHİM/Desktop/kod/isg_projesi_guncel/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/PROJEM/İSG PRO/src/App.jsx'
];

const primaryFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let code = fs.readFileSync(primaryFile, 'utf8');

// Target the local library folder block
const oldPattern = `            {!filter && currentFolders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
                {currentFolders.map(folder => {
                  const itemCount = (library || []).filter(i => i.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      title={folder.name}
                      className={\`p-3.5 border rounded-2xl cursor-pointer transition-all group relative flex items-start gap-3 min-h-[70px] \${
                        dragOverFolderId === folder.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 shadow-md scale-102 z-10'
                          : 'bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200/80 dark:border-yellow-900/40 hover:bg-yellow-100/90 dark:hover:bg-yellow-950/35 hover:shadow-md'
                      }\`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <FolderOpen className={\`\${dragOverFolderId === folder.id ? 'text-blue-500 fill-blue-500' : 'text-yellow-600 fill-yellow-500/30'}\`} size={26} />
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words whitespace-normal" title={folder.name}>
                          {folder.name}
                        </h4>
                        <span className="inline-block text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {itemCount} madde
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                        <button onClick={(e) => { e.stopPropagation(); handleUploadSpecificFolder(folder); }} className="p-1 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-md transition-colors" title="Buluta Yükle"><UploadCloud size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setMovingFolder(folder); setShowFolderMoveModal(true); }} className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors" title="Klasörü Taşı"><FolderInput size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors" title="Sil"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}`;

const newPattern = `            {!filter && currentFolders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-6">
                {currentFolders.map(folder => {
                  const itemCount = (library || []).filter(i => i.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      title={folder.name}
                      className={\`p-3.5 border rounded-2xl cursor-pointer transition-all group relative flex items-start gap-3 min-h-[70px] \${
                        dragOverFolderId === folder.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 shadow-md scale-102 z-10'
                          : 'bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200/80 dark:border-yellow-900/40 hover:bg-yellow-100/90 dark:hover:bg-yellow-950/35 hover:shadow-md'
                      }\`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <FolderOpen className={\`\${dragOverFolderId === folder.id ? 'text-blue-500 fill-blue-500' : 'text-yellow-600 fill-yellow-500/30'}\`} size={26} />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug truncate" title={folder.name}>
                          {folder.name}
                        </h4>
                        <span className="inline-block text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium whitespace-nowrap">
                          {itemCount} madde
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2 flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                        <button onClick={(e) => { e.stopPropagation(); handleUploadSpecificFolder(folder); }} className="p-1 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-md transition-colors" title="Buluta Yükle"><UploadCloud size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setMovingFolder(folder); setShowFolderMoveModal(true); }} className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors" title="Klasörü Taşı"><FolderInput size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors" title="Sil"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}`;

const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldPattern.replace(/\r\n/g, '\n');
const normNew = newPattern.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
  code = normCode.replace(normOld, normNew);
  console.log('✓ Successfully updated LibraryManager folder layout!');
} else {
  console.error('✗ oldPattern not found in primary file!');
  process.exit(1);
}

fs.writeFileSync(primaryFile, code, 'utf8');
console.log('Saved primary file:', primaryFile);

targetFiles.forEach(target => {
  if (target === primaryFile) return;
  if (fs.existsSync(target)) {
    try {
      fs.writeFileSync(target, code, 'utf8');
      console.log('Synced to:', target);
    } catch (e) {
      console.error('Error syncing to:', target, e.message);
    }
  }
});

console.log('Done!');
