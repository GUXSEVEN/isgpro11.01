const fs = require('fs');
const file = 'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the missing closing div for activeTab === 'users'
const target = `                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Lisans Kodu</span><span className="font-mono text-indigo-700 text-[10px]">{selectedUser.licenseKey || '—'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}`;

const fixed = `                    <div className="bg-white rounded-lg p-2.5 border border-indigo-100"><span className="font-bold text-slate-500 block mb-0.5">Lisans Kodu</span><span className="font-mono text-indigo-700 text-[10px]">{selectedUser.licenseKey || '—'}</span></div>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}`;

if (content.includes(target)) {
  content = content.replace(target, fixed);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✔ Fixed closing div in users tab');
} else {
  console.log('Target not matched, searching with normalized CRLF...');
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    content = normContent.replace(normTarget, fixed.replace(/\r\n/g, '\n'));
    fs.writeFileSync(file, content, 'utf8');
    console.log('✔ Fixed closing div with normalization');
  } else {
    console.error('❌ Failed to find target');
  }
}
