const fs = require('fs');

const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let appContent = fs.readFileSync(targetAppPath, 'utf8');

const targetTabSection = `<div className="relative border-b border-slate-200 flex items-center bg-slate-50/50">
            {/* Sol Kaydırma Oku */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: -220, behavior: 'smooth' });
              }}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition border-r border-slate-200/80 shrink-0 z-10 cursor-pointer flex items-center justify-center select-none"
              title="Sola Kaydır"
              aria-label="Sola Kaydır"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Kaydırılabilir Sekmeler Şeridi */}
            <div
              ref={adminTabsRef}
              className="flex flex-1 overflow-x-auto scroll-smooth custom-panel-scrollbar select-none py-0.5 no-scrollbar"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                    setSelectedUser(null);
                    try {
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } catch (_) {}
                  }}
                  className={\`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer \${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
                  }\`}
                >
                  <tab.icon size={15} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sağ Kaydırma Oku */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: 220, behavior: 'smooth' });
              }}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition border-l border-slate-200/80 shrink-0 z-10 cursor-pointer flex items-center justify-center select-none shadow-xs"
              title="Sağa Kaydır (Yetkilendirme ve Diğer Menüler)"
              aria-label="Sağa Kaydır"
            >
              <ChevronRight size={18} />
            </button>
          </div>`;

const replacementTabSection = `<div className="relative border-b border-slate-200 flex items-center bg-slate-100/70 w-full min-w-0 select-none">
            {/* Sol Kaydırma Oku - Her zaman sabit ve görünür */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              className="p-3 text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-50 active:bg-indigo-100 transition border-r border-slate-200 shrink-0 z-20 cursor-pointer flex items-center justify-center shadow-xs"
              title="Sola Kaydır"
              aria-label="Sola Kaydır"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>

            {/* Kaydırılabilir Sekmeler Şeridi (min-w-0 ile sağ oku asla dışarı itmez) */}
            <div
              ref={adminTabsRef}
              className="flex flex-1 min-w-0 overflow-x-auto scroll-smooth custom-panel-scrollbar select-none py-1 no-scrollbar touch-pan-x"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  data-tab-btn="true"
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                    setSelectedUser(null);
                    try {
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } catch (_) {}
                  }}
                  className={\`tab-swipeable-btn flex items-center gap-2 px-4 md:px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer \${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs font-extrabold'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-white/60'
                  }\`}
                  style={{ touchAction: 'pan-x pan-y' }}
                >
                  <tab.icon size={16} className={activeTab === tab.key ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sağ Kaydırma Oku - Her zaman sabit ve görünür */}
            <button
              type="button"
              onClick={() => {
                if (adminTabsRef.current) adminTabsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              className="p-3 text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-50 active:bg-indigo-100 transition border-l border-slate-200 shrink-0 z-20 cursor-pointer flex items-center justify-center shadow-xs"
              title="Sağa Kaydır (Yetkilendirme ve Diğer Menüler)"
              aria-label="Sağa Kaydır"
            >
              <ChevronRight size={20} className="stroke-[2.5]" />
            </button>
          </div>`;

if (appContent.includes(targetTabSection)) {
  appContent = appContent.replace(targetTabSection, replacementTabSection);
  fs.writeFileSync(targetAppPath, appContent, 'utf8');
  console.log('>>> SUCCESS: Tab section replaced with min-w-0 and pinned Chevron buttons!');
} else {
  console.error('>>> ERROR: targetTabSection not found in App.jsx');
}
