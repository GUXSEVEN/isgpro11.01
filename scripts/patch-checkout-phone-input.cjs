const fs = require('fs');

const targetAppPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - mobile\\src\\App.jsx';
let appContent = fs.readFileSync(targetAppPath, 'utf8');

// 1. Add customerPhone state in CheckoutView
const oldStateTarget = `  const [cardName, setCardName] = useState(() => currentUser?.name || currentUser?.username || '');
  const [customerEmail, setCustomerEmail] = useState(() => {`;

const newStateReplacement = `  const [cardName, setCardName] = useState(() => currentUser?.name || currentUser?.username || '');
  const [customerPhone, setCustomerPhone] = useState(() => {
    let raw = currentUser?.phone || '';
    try {
      const saved = localStorage.getItem('isg_checkout_phone');
      if (saved) raw = saved;
    } catch(e) {}
    const digits = (raw || '').replace(/\\D/g, '');
    return digits.length >= 10 ? (digits.startsWith('0') ? digits : '0' + digits) : '05555555555';
  });
  const [customerEmail, setCustomerEmail] = useState(() => {`;

if (appContent.includes(oldStateTarget)) {
  appContent = appContent.replace(oldStateTarget, newStateReplacement);
  console.log('>>> Added customerPhone state');
}

// 2. Pass customerPhone in requestPayload
const oldPayloadTarget = `      name: cardName || currentUser?.name || currentUser?.username || 'Müşteri',
      email: targetUserEmail,
      phone: currentUser?.phone || '05555555555',`;

const newPayloadReplacement = `      name: cardName || currentUser?.name || currentUser?.username || 'Müşteri',
      email: targetUserEmail,
      phone: customerPhone || currentUser?.phone || '05555555555',`;

if (appContent.includes(oldPayloadTarget)) {
  appContent = appContent.replace(oldPayloadTarget, newPayloadReplacement);
  console.log('>>> Updated requestPayload with customerPhone');
}

// 3. Add Phone input field in CheckoutView JSX (Step 2)
const oldInputsGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                    E-Posta Adresiniz (Lisansın İletileceği Adres) *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={e => {
                      setCustomerEmail(e.target.value);
                      try { localStorage.setItem('isg_checkout_email', e.target.value); } catch(err) {}
                    }}
                    placeholder="ornek: adiniz@sirketiniz.com"
                    className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                    Ad Soyad / Şirket Unvanı (Sözleşme Sahibi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-sm"
                  />
                </div>
              </div>`;

const newInputsGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                    E-Posta Adresiniz *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={e => {
                      setCustomerEmail(e.target.value);
                      try { localStorage.setItem('isg_checkout_email', e.target.value); } catch(err) {}
                    }}
                    placeholder="adiniz@sirket.com"
                    className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                    Ad Soyad / Şirket Unvanı *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                    Cep Telefonu (PayTR Zorunlu: 11 Hane) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomerPhone(val);
                      try { localStorage.setItem('isg_checkout_phone', val); } catch(err) {}
                    }}
                    placeholder="05555555555"
                    className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-sm"
                  />
                </div>
              </div>`;

if (appContent.includes(oldInputsGrid)) {
  appContent = appContent.replace(oldInputsGrid, newInputsGrid);
  console.log('>>> Added Phone input field to Step 2');
} else {
  console.error('>>> oldInputsGrid not found!');
}

fs.writeFileSync(targetAppPath, appContent, 'utf8');
console.log('>>> App.jsx updated with customer phone input!');
