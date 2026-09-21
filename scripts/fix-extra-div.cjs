const fs = require('fs');

const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let appContent = fs.readFileSync(targetAppPath, 'utf8');

const targetStr = `                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* ====== OSGB YÖNETİMİ ====== */}`;

const replaceStr = `                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== OSGB YÖNETİMİ ====== */}`;

if (appContent.includes(targetStr)) {
  appContent = appContent.replace(targetStr, replaceStr);
  fs.writeFileSync(targetAppPath, appContent, 'utf8');
  console.log('>>> Extra div successfully removed!');
} else {
  console.error('>>> targetStr not found!');
}
