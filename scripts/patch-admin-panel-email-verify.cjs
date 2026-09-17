const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/AdminPanel.tsx');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add E-Postayı Değiştir & Doğrula button next to Kod Gönder
const regexBtn = /(<button[\s\S]*?onClick=\{\(\)\s*=>\s*handleSendVerificationEmail\(u\)\}[\s\S]*?Kod Gönder[\s\S]*?<\/button>)/;
if (regexBtn.test(content) && !content.includes('openChangeEmailAndVerifyModal(u)')) {
  content = content.replace(regexBtn, `$1
                                        <button
                                          onClick={() => openChangeEmailAndVerifyModal(u)}
                                          title={u.email ? "E-Posta Adresini Değiştir ve Doğrulama Kodu Gönder" : "E-Posta Adresi Tanımla ve Doğrulama Kodu Gönder"}
                                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition border border-amber-300 flex items-center gap-1 shadow-xs"
                                        >
                                          <Mail size={11} className="text-amber-600 shrink-0" />
                                          <span>{u.email ? 'E-Postayı Değiştir & Doğrula' : 'E-Posta Tanımla & Doğrula'}</span>
                                        </button>`);
  console.log('✔ Button added via regex replacement.');
} else if (content.includes('openChangeEmailAndVerifyModal(u)')) {
  console.log('ℹ Button already present.');
} else {
  console.error('❌ Could not find target button');
}

// 2. Add Modal Markup before closing `    </div>\n  );\n}`
const modalMarkup = `
      {/* ========================================================================= */}
      {/* E-POSTAYI DEĞİŞTİR / TANIMLA VE DOĞRULAMA KODU GÖNDER MODALI               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {changeEmailModalUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Başlık */}
              <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 relative">
                <button
                  type="button"
                  onClick={() => setChangeEmailModalUser(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/15"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Mail size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 text-amber-100 px-2 py-0.5 rounded-md border border-white/20">
                      {changeEmailModalUser.email ? 'E-Posta Güncelleme' : 'Yeni E-Posta Tanımlama'}
                    </span>
                    <h3 className="font-black text-base text-white mt-0.5">
                      {changeEmailModalUser.email ? 'E-Postayı Değiştir & Doğrula' : 'E-Posta Tanımla & Doğrula'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Form Alanı */}
              <form onSubmit={handleExecuteChangeEmailAndSendCode} className="p-6 space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs space-y-1.5">
                  <div className="font-extrabold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs">
                    <UserCheck size={15} className="text-amber-700 dark:text-amber-400" />
                    <span>@{changeEmailModalUser.username} {changeEmailModalUser.name ? '(' + changeEmailModalUser.name + ')' : ''}</span>
                  </div>
                  <div className="text-[11px] text-amber-800/90 dark:text-amber-300">
                    {changeEmailModalUser.email ? (
                      <div>Mevcut E-Posta: <strong className="font-mono">{changeEmailModalUser.email}</strong> (Doğrulanmamış)</div>
                    ) : (
                      <div className="font-bold text-red-600 dark:text-red-400">⚠️ Bu kullanıcının sistemde tanımlı bir e-posta adresi bulunmuyor!</div>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                    Tanımlanan yeni e-posta adresi kullanıcının profiline ve veritabanına kaydedilecek, ardından bu yeni adrese anında <strong>6 haneli tek kullanımlık doğrulama kodu (OTP)</strong> gönderilecektir.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {changeEmailModalUser.email ? 'Yeni E-Posta Adresi' : 'Tanımlanacak E-Posta Adresi'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={changeEmailInput}
                      onChange={(e) => {
                        setChangeEmailInput(e.target.value);
                        setChangeEmailError('');
                      }}
                      placeholder="ad.soyad@firma.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {changeEmailError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-red-500" />
                    <span>{changeEmailError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={changeEmailIsSubmitting}
                    onClick={() => setChangeEmailModalUser(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={changeEmailIsSubmitting || !changeEmailInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {changeEmailIsSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Kaydediliyor & Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>E-Postayı Değiştir ve Kod Gönder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

if (!content.includes('changeEmailModalUser &&')) {
  content = content.replace(/(\n\s*<\/div>\s*\n\s*\);\s*\n\}\s*)$/, modalMarkup + '$1');
  console.log('✔ Modal markup added before main closing tag.');
}

// 3. Update table email cell to display nicely if email is empty
content = content.replace(
  '<div className="text-slate-800 font-bold">{u.email}</div>',
  '<div className="text-slate-800 font-bold">{u.email || <span className="text-amber-600 font-bold italic">E-Posta Tanımlanmamış</span>}</div>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✔ AdminPanel.tsx updated successfully.');
