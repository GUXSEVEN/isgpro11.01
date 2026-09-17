const fs = require('fs');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx';
let content = fs.readFileSync(targetFile, 'utf8');

console.log('1. Patching FolderSelectionModal folder names...');
const oldFolderSelectionCard = `<button key={folder.id} onClick={() => setCurrentPathId(folder.id)} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all text-left group">
                <Folder className="text-yellow-500 fill-yellow-100 group-hover:text-yellow-600" size={20} />
                <span className="text-sm font-medium text-slate-700 flex-1">{folder.name}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </button>`;

const newFolderSelectionCard = `<button key={folder.id} onClick={() => setCurrentPathId(folder.id)} title={folder.name} className="w-full flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all text-left group">
                <Folder className="text-yellow-500 fill-yellow-100 group-hover:text-yellow-600 shrink-0 mt-0.5" size={20} />
                <span className="text-xs sm:text-sm font-bold text-slate-700 flex-1 leading-snug break-words whitespace-normal">{folder.name}</span>
                <ChevronRight size={16} className="text-slate-300 shrink-0 mt-0.5" />
              </button>`;

if (content.includes(oldFolderSelectionCard)) {
  content = content.replace(oldFolderSelectionCard, newFolderSelectionCard);
  console.log('  -> FolderSelectionModal folder card updated!');
} else {
  console.log('  -> Trying normalized replace for FolderSelectionModal...');
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = oldFolderSelectionCard.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    content = normContent.replace(normTarget, newFolderSelectionCard.replace(/\r\n/g, '\n'));
    console.log('  -> Normalized FolderSelectionModal replaced!');
  } else {
    console.error('  -> Could not find oldFolderSelectionCard');
  }
}

console.log('2. Patching LibraryManager (Local Library) folder cards...');
const oldLocalFoldersBlock = `            {!filter && currentFolders.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {currentFolders.map(folder => (
                <div key={folder.id} draggable onDragStart={(e) => handleDragStart(e, folder, 'folder')} onClick={() => setCurrentFolderId(folder.id)} onDragOver={(e) => handleDragOver(e, folder.id)} onDrop={(e) => handleDrop(e, folder.id)} className={\`p-3 border rounded-xl cursor-pointer transition-all group relative flex items-center gap-3 \${dragOverFolderId === folder.id ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 shadow-md scale-105 z-10' : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:shadow-md'}\`}>
                  <FolderOpen className={\`\${dragOverFolderId === folder.id ? 'text-blue-500 fill-blue-500' : 'text-yellow-500 fill-yellow-500'}\`} size={24} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{folder.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleUploadSpecificFolder(folder); }} className="p-1.5 text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-950/30 rounded-full" title="Buluta Yükle"><UploadCloud size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setMovingFolder(folder); setShowFolderMoveModal(true); }} className="p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/30 rounded-full" title="Klasörü Taşı"><FolderInput size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-full" title="Sil"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>}`;

const newLocalFoldersBlock = `            {!filter && currentFolders.length > 0 && (
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

const normContent = content.replace(/\r\n/g, '\n');
const normLocal = oldLocalFoldersBlock.replace(/\r\n/g, '\n');
if (normContent.includes(normLocal)) {
  content = normContent.replace(normLocal, newLocalFoldersBlock.replace(/\r\n/g, '\n'));
  console.log('  -> LibraryManager local folder cards successfully updated!');
} else {
  console.error('  -> Could not locate oldLocalFoldersBlock in LibraryManager');
}

console.log('3. Patching OnlineLibraryModal folder cards...');
const oldOnlineFoldersBlock = `              {!search && currentFolders.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currentFolders.map(folder => (
                    <div
                      key={folder.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('folderId', folder.id);
                      }}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder.id); }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => handleOnlineDrop(e, folder.id)}
                      className={\`group relative p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 bg-white hover:shadow-md h-14 \${dragOverFolderId === folder.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200'}\`}
                    >
                      <Folder className="text-indigo-400 fill-indigo-100 group-hover:text-indigo-600 shrink-0" size={24} />
                      <span className="text-sm font-bold text-slate-700 truncate flex-1">{folder.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadFolder(folder); }} className="p-1.5 text-green-500 hover:bg-green-50 rounded-full transition-all shrink-0" title="Cihaza İndir"><Download size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setMovingOnlineFolder(folder); setShowOnlineFolderMoveModal(true); }} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-full transition-all shrink-0" title="Klasörü Taşı"><FolderInput size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all shrink-0" title="Buluttan Sil"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}`;

const newOnlineFoldersBlock = `              {!search && currentFolders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {currentFolders.map(folder => {
                    const onlineCount = (items || []).filter(i => i.folderId === folder.id).length;
                    return (
                      <div
                        key={folder.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('folderId', folder.id);
                        }}
                        onClick={() => setCurrentFolderId(folder.id)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder.id); }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={(e) => handleOnlineDrop(e, folder.id)}
                        title={folder.name}
                        className={\`group relative p-3.5 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 bg-white hover:shadow-md min-h-[70px] \${
                          dragOverFolderId === folder.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 shadow-md scale-102 z-10' : 'border-slate-200 hover:border-indigo-300'
                        }\`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <Folder className="text-indigo-500 fill-indigo-100 group-hover:text-indigo-600" size={26} />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-snug break-words whitespace-normal" title={folder.name}>
                            {folder.name}
                          </h4>
                          {onlineCount > 0 && (
                            <span className="inline-block text-[10px] text-indigo-600 font-medium mt-1">
                              {onlineCount} bulut maddesi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadFolder(folder); }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Cihaza İndir"><Download size={15} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setMovingOnlineFolder(folder); setShowOnlineFolderMoveModal(true); }} className="p-1 text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Klasörü Taşı"><FolderInput size={15} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Buluttan Sil"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}`;

const normOnline = oldOnlineFoldersBlock.replace(/\r\n/g, '\n');
if (normContent.includes(normOnline)) {
  content = content.replace(normOnline, newOnlineFoldersBlock.replace(/\r\n/g, '\n'));
  console.log('  -> OnlineLibraryModal folder cards successfully updated!');
} else {
  console.error('  -> Could not locate oldOnlineFoldersBlock in OnlineLibraryModal');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done patching library folder names!');
