const fs = require('fs');
const path = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/modals/UserSettingsModal.jsx';

if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// 1. Add AlertTriangle import if not present
if (!content.includes('AlertTriangle')) {
  content = content.replace(
    "import { X, User, Mail, Settings, Shield, Key, CheckCircle2, Send, Sun, Moon, Database, FileText, Globe, Code } from 'lucide-react';",
    "import { X, User, Mail, Settings, Shield, Key, CheckCircle2, Send, Sun, Moon, Database, FileText, Globe, Code, AlertTriangle } from 'lucide-react';"
  );
}

// 2. Add onOpenEmailVerify prop to UserSettingsModal
if (!content.includes('onOpenEmailVerify,')) {
  content = content.replace(
    `export default function UserSettingsModal({ 
  currentUser, 
  onClose, 
  onUpdateUser,
  darkMode,
  toggleDarkMode
})`,
    `export default function UserSettingsModal({ 
  currentUser, 
  onClose, 
  onUpdateUser,
  onOpenEmailVerify,
  darkMode,
  toggleDarkMode
})`
  );
}

// 3. Update Email field label in tab 1 (profile) to show verification badge and button
const targetEmailBlock = `                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>`;

const replacementEmailBlock = `                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">E-Posta Adresi *</label>
                    {currentUser?.isEmailVerified ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={11} /> Doğrulandı
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenEmailVerify) onOpenEmailVerify();
                          else alert('E-postanızı doğrulamak için lütfen panel ana sayfasındaki doğrulama bildirimini kullanınız.');
                        }}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 cursor-pointer animate-pulse"
                        title="E-Postanızı doğrulamak için tıklayınız"
                      >
                        <AlertTriangle size={11} /> Doğrulanmamış (Doğrula)
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>`;

if (content.includes(targetEmailBlock)) {
  content = content.replace(targetEmailBlock, replacementEmailBlock);
  console.log('Successfully updated UserSettingsModal.jsx with email verification badge!');
} else {
  console.log('Target email block not exact match, checking alternative replace...');
  const altTarget = `<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-Posta Adresi *</label>`;
  if (content.includes(altTarget)) {
    content = content.replace(altTarget, `<div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">E-Posta Adresi *</label>
                    {currentUser?.isEmailVerified ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={11} /> Doğrulandı
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenEmailVerify) onOpenEmailVerify();
                          else alert('E-postanızı doğrulamak için lütfen panel ana sayfasındaki doğrulama bildirimini kullanınız.');
                        }}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 cursor-pointer animate-pulse"
                        title="E-Postanızı doğrulamak için tıklayınız"
                      >
                        <AlertTriangle size={11} /> Doğrulanmamış (Doğrula)
                      </button>
                    )}
                  </div>`);
    console.log('Successfully patched email label with verification badge in UserSettingsModal.jsx!');
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('UserSettingsModal.jsx patched successfully!');
