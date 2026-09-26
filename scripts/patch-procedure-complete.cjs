const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const procedureCode = `const ProcedurePreview = ({ company, assessment }) => {
  if (!company || !company.info || !assessment) {
    return <div className="p-10 text-center text-red-600 font-bold">Veriler yükleniyor...</div>;
  }

  const method = assessment.method || 'MATRIX_L';
  const totalPages = 7;

  const calculatedValidity = calculateValidityDate(assessment.createdAt, company.info.hazardClass);
  const formattedValidity = formatDateTR(calculatedValidity);
  const formattedDate = formatDateTR(assessment.createdAt || new Date().toISOString());

  // Ekip üyelerini PDF şablonundaki sıraya ve rollere göre akıllıca eşle
  const teamList = company.info.team || [];
  const findMember = (keywords, defaultRole, defaultName, defaultCert = '') => {
    const found = teamList.find(m => keywords.some(k => (m.role || '').toLowerCase().includes(k)));
    if (found) {
      return {
        role: found.role || defaultRole,
        name: found.name || defaultName,
        cert: found.certificateNo || defaultCert
      };
    }
    return { role: defaultRole, name: defaultName, cert: defaultCert };
  };

  const sigMembers = [
    findMember(['işveren', 'isveren', 'yetkili'], 'İşveren / İşveren Vekili', company.info.official || 'OZAN ÜNDEŞ'),
    findMember(['uzman'], 'İş Güvenliği Uzmanı', 'AYTÜL İNCEOĞLU', '167328'),
    findMember(['hekim', 'doktor'], 'İşyeri Hekimi', 'HAKAN YILMAZ', '19825'),
    findMember(['temsilci'], 'Çalışan Temsilcisi/Baş Temsilci', 'MUSTAFA ONUR KARA'),
    findMember(['destek'], 'Destek Elemanı', 'SERDAR YILMAN')
  ];

  const renderPageHeader = (pageNum) => (
    <table className="w-full border-collapse border border-black mb-3 text-xs header-table">
      <tbody>
        <tr>
          <td rowSpan="5" className="border border-black w-[15%] text-center p-1 bg-white">
            {company.info.logo ? (
              <img src={company.info.logo} className="max-h-12 max-w-[90px] mx-auto object-contain" alt="logo" />
            ) : (
              <div className="font-bold text-[10px] text-gray-500 uppercase">{company.name || 'LOGO'}</div>
            )}
          </td>
          <td rowSpan="5" className="border border-black w-[55%] text-center font-bold text-[15px] tracking-wide bg-white">
            Risk Değerlendirme Prosedürü
          </td>
          <td className="border border-black font-semibold bg-gray-50 p-1 w-[18%] text-[9px] leading-tight">Yayın Tarihi</td>
          <td className="border border-black p-1 text-[9px] text-center w-[12%] leading-tight">{formattedDate}</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[9px] leading-tight">Döküman No</td>
          <td className="border border-black p-1 text-[9px] text-center leading-tight">RDP-01</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[9px] leading-tight">Revizyon Tarihi</td>
          <td className="border border-black p-1 text-[9px] text-center leading-tight">{formattedDate}</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[9px] leading-tight">Revizyon No</td>
          <td className="border border-black p-1 text-[9px] text-center leading-tight">00</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[9px] leading-tight">Sayfa No</td>
          <td className="border border-black p-1 text-[9px] text-center font-bold leading-tight">{pageNum}/7</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPageFooter = () => (
    <div className="w-full border-t border-black pt-2 mt-auto">
      <div className="grid grid-cols-5 gap-1 text-center">
        {sigMembers.map((m, idx) => (
          <div key={idx} className="flex flex-col justify-start px-0.5">
            <div className="font-bold text-[8px] uppercase text-black leading-tight mb-0.5">{m.name}</div>
            <div className="text-[7.5px] text-gray-800 leading-tight">{m.role}</div>
            {m.cert ? <div className="text-[7px] text-gray-600 leading-tight mt-0.5">{m.cert}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );

  // Metodolojiye göre Section 3 Risk formül metni
  const methodFormulaInline = method === 'FINE_KINNEY'
    ? '(Risk = İhtimal x Frekans x Şiddet)'
    : method === 'FMEA'
    ? '(Risk = Olasılık x Şiddet x Saptanabilirlik)'
    : '(Risk = Olasılık x Şiddet)';

  return (
    <div className="w-[210mm] min-w-[210mm] mx-auto no-print-shadows">
      {/* ===================== SAYFA 1 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(1)}

          {/* 1. AMAÇ */}
          <div className="mb-2">
            <div className="font-bold text-[10px] text-black mb-0.5">1. <span className="underline ml-4">AMAÇ:</span></div>
            <p className="text-[8px] leading-relaxed text-justify mb-1">
              Bu prosedürün amacı, işyerindeki mevcut çalışma koşullarından kaynaklanabilecek ve işyerinin faaliyetleri sırasında oluşabilecek her türlü potansiyel tehlikenin tanımlanması, bunlara ilişkin risklerin belirlenmesi ve değerlendirilmesi, olası risklerle ilgili kontrol tedbirlerinin alınmasına ilişkin yöntem ve esasların belirlenmesi, her türlü tehlike ve sağlık riskini insan sağlığını etkilemeyen minimum seviyeye düşürmektir.
            </p>
            <p className="text-[8px] leading-relaxed text-justify">
              Risk değerlendirmesi sonucunda, işyerindeki tüm tehlikelerin ne olduğuna karar verilmiş kaza olma olasılığı ile olası kazaların boyutu/büyüklüğü hakkında bilgi sahibi olunmuş olacaktır.
            </p>
          </div>

          {/* 2. KAPSAM */}
          <div className="mb-2">
            <div className="font-bold text-[10px] text-black mb-0.5">2. <span className="underline ml-4">KAPSAM:</span></div>
            <p className="text-[8px] leading-relaxed mb-0.5">Bu prosedür, çalışma alanındaki:</p>
            <ul className="list-disc pl-5 text-[8px] leading-snug space-y-0.5">
              <li>İşyerini,</li>
              <li>İşyerinde kullanılan tüm makine, tesisat, bina, eklenti ve sosyal tesisleri,</li>
              <li>İşyerinde çalışan firma sorumlularını ve çalışanları,</li>
              <li>Ziyaretçi ve tedarikçilerini kapsar.</li>
            </ul>
          </div>

          {/* 3. TANIMLAR */}
          <div className="mb-2">
            <div className="font-bold text-[10px] text-black text-center border-b border-gray-300 pb-0.5 mb-1 tracking-wide">3. TANIMLAR</div>
            <div className="text-[7.5px] leading-tight space-y-0.5">
              <p><b>Tehlike:</b> Çalışanlara, malzeme ve ekipmanlara ve işyerine zarar verme potansiyeline sahip kaynak, durum veya uygulamalardır.</p>
              <p><b>Tehlike tanımlaması:</b> Bir tehlikenin varlığını tanıma ve özelliklerini tarif etme prosesi</p>
              <p><b>Risk:</b> Tehlike olarak tanımlanan olgular içinde doğal olarak bulunan ve ortaya çıktığında daima zarar veren durumdur. {methodFormulaInline}</p>
              <p><b>Risk Değerlendirme ekibi:</b> Tehlike kaynakları ve bunlara ait olası riskleri ortaya çıkartmak ve gerekli önleyici düzeltici çalışmaları yapmak üzere kurulmuş ekiptir.</p>
              <p><b>Risk Değerlendirmesi:</b> Bir riskin ortaya çıkma olasılığının öngörülerek, kabul edilebilir olup olmadığının belirlenmesi için yapılan riskin büyüklüğünün tahmini çalışmasıdır.</p>
              <p><b>Riskin Gerçekleşme Olasılığı:</b> Bir riskin gerçekleşme olasılığıdır.</p>
              <p><b>Kabul edilebilir risk:</b> Kuruluşun, yasal zorunlulukları ve kendi İSG politikasına göre, tahammül edilebileceği düzeye indirilmiş risk.</p>
              <p><b>Riskin Önem Durumu:</b> Yapılacak önleyici ve düzeltici çalışmaların öncelik sırasının belirlenmesidir.</p>
              <p><b>Olay:</b> Yaralanmaya veya sağlığın bozulmasına veya ölüme sebep olan veya sebep olacak potansiyele sahip olan, işle ilgili olaydır.</p>
              <p><b>Kaza:</b> Yaralanma, sağlığın bozulmasına veya ölüme sebep olan olaydır.</p>
              <p><b>Hasarsız olay:</b> Yaralanmaya, sağlığın bozulmasına veya ölüme sebep olmadan gerçekleşen olaylara “hasarsız olay” denir.</p>
              <p><b>Sağlığın bozulması:</b> Bir iş faaliyetinin veya işle ilgili durumun yol açtığı ve/veya kötüleştirdiği belirlenebilir, olumsuz fiziksel veya ruhsal durum.</p>
              <p><b>Kimyasal madde:</b> Doğal halde bulunan veya üretilen veya herhangi bir işlem sırasında veya atık olarak ortaya çıkan veya kazara oluşan her türlü element, bileşik veya karışımlardır.</p>
              <p><b>Mesleki maruziyet sınır değeri:</b> Başka şekilde belirtilmedikçe, 8 saatlik sürede, çalışanların solunum bölgesindeki havada bulunan kimyasal madde konsantrasyonunun zaman ağırlıklı ortalamasının üst sınırıdır.</p>
              <p><b>Biyolojik sınır değeri:</b> Kimyasal maddenin, metabolizmasının veya etkilenmeyi belirleyecek bir maddenin uygun biyolojik ortamdaki konsantrasyonunun üst sınırıdır.</p>
              <p><b>Sağlık gözetimi:</b> Çalışanların belirli bir kimyasal maddeye maruziyetleri ile ilgili olarak sağlık durumlarının belirlenmesi amacıyla yapılan değerlendirmelerdir.</p>
              <p><b>Ramak kala olay:</b> İşyerinde meydana gelen; çalışan, işyeri ya da iş ekipmanını zarara uğratma potansiyeli olduğu halde zarara uğratmayan olayı,</p>
            </div>
          </div>

          {/* 4. SORUMLULUKLAR */}
          <div className="mb-2">
            <div className="font-bold text-[10px] text-black mb-0.5">4. <span className="underline ml-4">SORUMLULUKLAR</span></div>
            <p className="text-[8px] leading-relaxed text-justify">
              Bu prosedüre ilişkin olarak tehlikelerin tanımlanması, risklerin değerlendirilmesi ve kontrol tedbirlerinin belirlenmesinde işveren ve tüm çalışanlar sorumludur.
            </p>
          </div>

          {/* 5. RİSK ANALİZİ VE RİSK DEĞERLENDİRMESİNDE İZLENECEK METOTLAR */}
          <div className="mb-1">
            <div className="font-bold text-[9px] bg-gray-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide">
              5. RİSK ANALİZİ VE RİSK DEĞERLENDİRMESİNDE İZLENECEK METOTLAR
            </div>
            <div className="font-bold text-[8.5px] mb-1">5.1 Risk Analizi Ve Risk Değerlendirmesi Çalışmalarının Gerçekleştirilme Sıklığı:</div>
            <div className="text-[7.5px] leading-tight space-y-1 pl-1">
              <div>
                <span className="font-bold">1. İşe başlama aşamasında</span>
                <div className="pl-4">□ İşyerinin kurulup üretime başlamasından hemen sonra,</div>
                <div className="pl-4">□ İşyerinin daha önce kurulmuş ve risk analizi ve risk değerlendirmesi çalışmalarının hiç yapılmamış olması halinde,</div>
              </div>
              <div>
                <span className="font-bold">2. Değişiklik durumunda</span>
                <div className="pl-4">□ İşyerinde malzeme ekipman, konum, teknoloji ve prosedür değişikliğinde,</div>
                <div className="pl-4">□ Yeni ve ciddi bir tehlikenin ortaya çıkması durumunda,</div>
                <div className="pl-4">□ Risk değerlendirme ile ilgili kontrol çalışmaları esnasında yeni bir riskin tespit edilmesi halinde,</div>
              </div>
              <div>
                <span className="font-bold">3. İş kazası, meslek hastalığı vb. durumlarda</span>
                <div className="pl-4">□ İşyerinin tamamını yada büyük bir kısmını etkileyebilecek bir kaza, iş kazası, meslek hastalığı yada olayın meydana gelmesi halinde,</div>
              </div>
              <div>
                <span className="font-bold">4. Düzenli aralıklarla</span>
                <div className="pl-4">□ İşyerinden ve etkilenme alanından kaynaklanan tehlikelerin ve bu tehlikeler sonucu ortaya çıkan risklerin yapısında ve faaliyetlerdeki yada işteki değişimin derecesine bağlı olarak yapılacaktır,</div>
              </div>
            </div>
          </div>
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 2 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(2)}

          {/* 5.2 */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-1">5.2 Risk Analizi Ve Risk Değerlendirmesi Çalışmalarında Dikkat Edilecek Hususlar</div>
            <p className="text-[8px] mb-1">Risk analizi ve risk değerlendirmesi çalışmaları yapılırken aşağıdaki hususlar dikkate alınacaktır.</p>
            <div className="text-[7.5px] leading-tight space-y-0.5 pl-2">
              <div>a) Rutin veya rutin olmayan faaliyetler,</div>
              <div>b) İşyerine erişebilme imkanına sahip personelin faaliyetleri (taşeronlar ve ziyaretçiler dahil),</div>
              <div>c) İnsan davranışları, kabiliyetleri ve diğer insan faktörleri,</div>
              <div>d) İşyerinin dışından kaynaklanan ve işyerinde kuruluşun kontrolü altındaki insanların sağlığını ve güvenliğini olumsuz yönde etkileme kabiliyetine sahip olan belirlenmiş tehlikeler,</div>
              <div>e) İşyerinin civarında kuruluşun kontrolü altındaki işle ilgili faaliyetlerden kaynaklanan tehlikeler,</div>
              <div>f) Kuruluş tarafından veya başkaları tarafından temin edilmiş olan işyerindeki altyapı, teçhizat ve malzemeler,</div>
              <div>g) Kuruluş, kuruluşun faaliyetleri veya malzemeleri üzerinde yapılan veya yapılması teklif edilen değişiklikler,</div>
              <div>h) Risk değerlendirmesi ve gerekli kontrollerin uygulanması ile ilgili uygulanabilir yasal yükümlülükler,</div>
              <div>i) İş alanlarının, proseslerin, tesislerin, makine/teçhizatın, işletme prosedürlerinin ve iş organizasyonlarının tasarımı ve bunların insan kabiliyetlerine uyarlanması,</div>
            </div>
          </div>

          {/* SÜREÇ AKIŞ ŞEMASI (PDF BİREBİR) */}
          <div className="my-2 border border-black p-2 bg-gray-50 flex items-center justify-between text-[8px]">
            {/* Sol: İletişim ve Danışma */}
            <div className="w-[18%] border border-red-500 bg-white p-2 text-center font-semibold text-red-900 rounded flex flex-col justify-center min-h-[140px]">
              <div className="text-[9px] font-bold mb-1">İletişim</div>
              <div className="text-[8px] mb-1">ve</div>
              <div className="text-[9px] font-bold">Danışma</div>
              <div className="text-[12px] text-red-500 mt-2">⇄</div>
            </div>

            {/* Orta: Adımlar */}
            <div className="w-[58%] flex flex-col items-center gap-1.5">
              <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs">
                Tehlikelerin Belirlenmesi
              </div>
              <div className="text-red-500 text-[10px] leading-none">↓</div>

              <div className="w-full border-2 border-dashed border-red-400 p-1 bg-red-50/40 rounded">
                <div className="text-[7.5px] font-bold text-red-800 text-center uppercase tracking-wider mb-0.5">Risklerin Değerlendirmesi</div>
                <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs mb-1">
                  Risklerin Analizi
                </div>
                <div className="text-center text-red-500 text-[10px] leading-none mb-1">↓</div>
                <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs">
                  Risklerin Değerlendirilmesi
                </div>
              </div>
              <div className="text-red-500 text-[10px] leading-none">↓</div>

              <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs">
                Kontrol Önlemlerinin Belirlenmesi
              </div>
              <div className="text-red-500 text-[10px] leading-none">↓</div>

              <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs">
                Kontrol Önlemlerinin Yerine Getirilmesi
              </div>
            </div>

            {/* Sağ: İzleme ve Gözden Geçirme */}
            <div className="w-[18%] border border-red-500 bg-white p-2 text-center font-semibold text-red-900 rounded flex flex-col justify-center min-h-[140px]">
              <div className="text-[9px] font-bold mb-1">İzleme</div>
              <div className="text-[8px] mb-1">ve</div>
              <div className="text-[9px] font-bold">Gözden Geçirme</div>
              <div className="text-[12px] text-red-500 mt-2">⇄</div>
            </div>
          </div>

          {/* 5.3 */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-1">5.3 Risk Analizi Ve Risk Değerlendirmesi Yöntemi</div>
            <p className="text-[8px] mb-1">Risk analizi ve risk değerlendirmesi şu şekilde yapılmaktadır.</p>
            <div className="text-[7.5px] leading-tight space-y-1 pl-2 text-justify">
              <div><b>a.</b> Başlangıçta İş Sağlığı ve Güvenliği Kurulu veya İş Güvenliği Uzmanı tarafından hazırlanan risk analizi çalışmaları sürecin devamında ilgili birim yetkilisi veya yetkilileri tarafından sürekli olarak izlenecek ve kontrol tedbirlerinin uygulanması ile risk skorları azaltılarak iyileştirme çalışmaları gerçekleştirilecektir.</div>
              <div><b>b.</b> Belirlenen risklerin kabul edilebilir seviyeye indirilinceye kadar sürekli izlenmesi gerekmektedir.</div>
              <div><b>c.</b> Kabul edilebilir seviyeye indirilen riskler ise olasılık ve şiddetlerinin artmaması için alınmış olan önlemlerin devamlılığı izlenmelidir.</div>
            </div>
          </div>

          {/* 5.4 */}
          <div className="mb-1">
            <div className="font-bold text-[9px] mb-1">5.4 Risk Değerlendirmesi</div>
            <p className="text-[7.5px] leading-tight mb-1 text-justify">
              Sistematik metotlarla çalışma ortamı, şartları yada çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve riskleri kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür. İşverenler aşağıdaki genel prensiplere uygun tedbirleri alacaktır.
            </p>
            <ul className="list-disc pl-5 text-[7.5px] leading-snug space-y-0.5">
              <li>Tehlikelerin önüne geçmek</li>
              <li>Önüne geçilemeyen kaçınılmaz tehlikeleri değerlendirmek</li>
              <li>Tehlikeler ile kaynağında mücadele etmek</li>
              <li>İşleri kişilere uygun hale getirme, özellikle işyeri tasarımında, iş makinesi, çalışma ve üretim yöntemi seçimlerinde, üretim temposunun sağlığa etkilerini düşürmek ve monotonluğunu azaltmak</li>
              <li>Teknik gelişmeleri adapte etmek</li>
              <li>Tehlikelilerin yerine tehlikesizleri veya daha az tehlikelileri ikame etmek</li>
              <li>Çalışma ortamına ilişkin tüm koşulları, teknolojiyi, iş organizasyonunu, çalışma koşullarını ve sosyal ilişkileri bir arada değerlendirerek birbirini destekler mahiyette tedbirler politikası geliştirmek</li>
              <li>Toplu korunma önlemlerine kişisel korunma önlemlerinden daha çok öncelik vermek</li>
              <li>İşçilere uygun talimatları vermek</li>
            </ul>
          </div>
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 3 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(3)}

          {/* a. Tehlike Belirleme Girdileri */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-1">a. Tehlike Belirleme Girdileri</div>
            <div className="grid grid-cols-2 gap-x-4 text-[7.5px] leading-tight">
              <div>
                <div>· Sezgisel mühendislik duyusunun kullanımı</div>
                <div>· Benzer sistemleri incelemek</div>
                <div>· İş Sağlığı ve Güvenliği’ne ilişkin hukuki ve diğer şartlar,</div>
                <div>· Literatür taraması (standart vb.)</div>
                <div>· Çalışanlar ve diğer ilgili taraflardan alınan bilgiler,</div>
                <div>· İşyerine özgü tipik tehlike riskleri, benzer kuruluşlarda olmuş olan kaza ve olaylar,</div>
                <div>· Benzeri diğer işyerlerinden elde edilen veriler,</div>
                <div>· Üç günden fazla işgünü kaybı ile sonuçlanan iş kazaları ile ilgili kayıt</div>
                <div>· Denetim sonuçları,</div>
                <div>· İletişim belgeleri,</div>
                <div>· Elektrik kullanımı,</div>
              </div>
              <div>
                <div>· İmalat hakkında bilgi</div>
                <div>· Saha planları,</div>
                <div>· İş akış şemaları, İş aktivitelerinin gözden geçirilmesi</div>
                <div>· Makine, ekipman v.b. bilgiler,</div>
                <div>· Malzeme envanterleri (ham maddeler, kimyasallar, atıklar, ürünler ve alt ürünler),</div>
                <div>· Kimyevi, fiziki ve biyolojik ajanlar listesi, kimyasal ve tehlikeli maddelere ait Güvenlik Bilgi Formları (MSDS),</div>
                <div>· Yöntemler, görevler,</div>
                <div>· Tıbbi/ilk yardım raporları, Sağlık Riskleri taraması</div>
                <div>· Ortam ölçüm raporlarının incelenmesi</div>
                <div>· İmalatçı verilerinin değerlendirilmesi</div>
                <div>· Teknik periyodik kontrol raporlarının incelenmesi</div>
              </div>
            </div>
          </div>

          {/* Genel Tehlike Listesi */}
          <div className="mb-2">
            <div className="font-bold text-[8.5px] bg-gray-100 border border-black px-1.5 py-0.5 mb-1">Genel tehlike listesi</div>
            <div className="grid grid-cols-2 gap-x-4 border border-black p-1.5 text-[7.5px] leading-snug bg-white">
              <div>
                <div>Yüksekten düşme</div>
                <div>Aynı seviyede düşme</div>
                <div>Malzeme düşmesi</div>
                <div>Bir şeye çarpma</div>
                <div>Bir şeyin çarpması</div>
                <div>Kayma</div>
                <div>Sürüklenme</div>
                <div>Zorlanma</div>
                <div>Gazdan boğulma</div>
                <div>Kaynak ışığına maruz kalma</div>
                <div>Zehirlenme</div>
              </div>
              <div>
                <div>Elektrik çarpması</div>
                <div>Parlayıcı tahribatı</div>
                <div>Patlayıcı tahribatı</div>
                <div>Kimyasallara maruz kalma</div>
                <div>Fırlayan madde</div>
                <div>Uçuşan madde</div>
                <div>Bir şeyin batması - kesmesi</div>
                <div>Yangın</div>
                <div>Göze çapak kaçma</div>
                <div>Sıcak yüzeylere temas (ateş, kaynar su)</div>
                <div>Panik ve düzenin bozulması</div>
              </div>
            </div>
          </div>

          {/* Tehlike sonucu hedef listesi İnsanlarda */}
          <div className="mb-2">
            <div className="font-bold text-[8.5px] bg-gray-100 border border-black px-1.5 py-0.5 mb-1">Tehlike sonucu hedef listesi İnsanlarda</div>
            <div className="grid grid-cols-2 gap-x-4 border border-black p-1.5 text-[7.5px] leading-snug bg-white">
              <div>
                <div>• Göz</div>
                <div>• Kulak</div>
                <div>• Yüz</div>
                <div>• Kafatası</div>
                <div>• Boyun</div>
                <div>• Kol</div>
                <div>• Bilek</div>
                <div>• El</div>
                <div>• Parmak</div>
                <div>• Ayak</div>
                <div>• Bacak</div>
              </div>
              <div>
                <div>• Sırt</div>
                <div>• Göğüs Kalça</div>
                <div>• Omuz</div>
                <div>• Karın</div>
                <div>• Sindirim sistem,</div>
                <div>• Ürener sistem</div>
                <div>• Solunum sistemi</div>
                <div>• Kardio-vasküler sistem</div>
                <div>• Bel</div>
                <div>• Eklem</div>
              </div>
            </div>
          </div>

          {/* İnsanlar Dışında */}
          <div className="mb-2">
            <div className="font-bold text-[8.5px] bg-gray-100 border border-black px-1.5 py-0.5 mb-1">İnsanlar Dışında</div>
            <div className="border border-black p-1.5 grid grid-cols-2 gap-x-4 text-[7.5px] leading-snug bg-white">
              <div>
                <div>• Malzeme hasarı veya kaybı</div>
                <div>• Ekipman hasarı veya kaybı</div>
                <div>• Tesis hasarı</div>
              </div>
              <div>
                <div>• İş gücü kaybı</div>
                <div>• İş süresi kaybı</div>
                <div>• İşletmenin Prestij kaybı</div>
              </div>
            </div>
          </div>

          {/* Özet Değerlendirme Paragrafı */}
          <p className="text-[7.5px] leading-relaxed text-justify text-gray-800 border-t border-gray-300 pt-1.5">
            Yukarıda verilen tipik girdiler tehlikelerin belirlenmesi amacıyla değerlendirilir. Bu değerlendirme sonucunda düşme, malzeme düşmesi, elektriğe çarpılma, maruziyet, makine-ekipman zararları, kimyasal maddelerle temaslar, yangın, patlama v.b. tehlikeler tanımlanır.İşyeri ortamında gözle görebildiğimiz yada göremediğimiz bir çok tehlike mevcuttur, önemli olan acil önlem gerektiren tolere edilemeyecek risklerin ayırt edilmesidir.
          </p>
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 4 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(4)}

          {/* b) */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] mb-0.5">b) İşe Başlanmadan Önce Şu Veriler Toplanıp Değerlendirilmelidir.</div>
            <div className="text-[7.5px] leading-snug pl-2 space-y-0.5">
              <div>• Kimyevi, fiziki ve biyolojik ajanlar listesi,</div>
              <div>• İş aktivitelerinin gözden geçirilmesi,</div>
              <div>• Ortam ölçüm raporlarının incelenmesi,</div>
              <div>• İş kazası ve hadise (olay) raporlarının incelenmesi,</div>
              <div>• Literatür taraması (standart vb.),</div>
              <div>• İmalatçı verilerinin değerlendirilmesi,</div>
              <div>• Uzman görüşlerinden yararlanılması,</div>
              <div>• Teknik periyodik kontrol raporlarının incelenmesi,</div>
              <div>• Benzeri diğer işyerlerinden elde edilen veriler,</div>
            </div>
          </div>

          {/* c) */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] mb-0.5">c) Risk Değerlendirmesinde Kişisel Sorumluluk</div>
            <div className="text-[7.5px] leading-snug pl-2 space-y-0.5">
              <div>• Yeteneklerinin ve sınırlarının farkında olmak,</div>
              <div>• Yönetim sistemlerine uygun ve disiplinli çalışmak,</div>
              <div>• Kendisinin ve diğerlerinin güvenliğini gözetmek,</div>
              <div>• Etkin takım elemanı olmak,</div>
              <div>• Mücadeleci olmak,</div>
              <div>• Değişime uyum sağlamak</div>
            </div>
          </div>

          {/* d) */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] mb-0.5">d) Risk Değerlendirmesinin İşverenler Açısından Yararları</div>
            <div className="text-[7.5px] leading-snug pl-2 space-y-0.5">
              <div>• Tehlike ve risklerini önceden görebilme</div>
              <div>• Uluslararası saygınlık ve geçerlilik</div>
              <div>• Proaktif yaklaşımla acil durumlar için her an hazırlıklı olma</div>
              <div>• İstenmeyen durumların önlenmesi ile kayıpların azaltılması</div>
              <div>• Sorumlulukların ve görevlerin belirlenmesi ve paylaşımı</div>
              <div>• Güvenli teknoloji seçimi ile güvenli çalışma ortamı temini</div>
            </div>
          </div>

          {/* 5.5 */}
          <div className="mb-2">
            <div className="font-bold text-[8.5px] mb-0.5">5.5 Değerlendirme Tablosu</div>
            <p className="text-[7.5px] leading-relaxed text-justify">
              Değerlendirme tablosuna göre ilgili bölüm/süreç dahilindeki tüm faaliyetler sınıflandırılır. Faaliyetlerin belirlenmesinde, bölümlerin kendi içerisinde bölümlendirilmesi ile en küçük parçalar halinde sınıflandırılmasına dikkat edilir. Ardından faaliyetlerden kaynaklanan tehlikelerin, risklerin ve risklerin doğurabileceği sonuçların tanımlanması gerçekleştirilir. Risk değerlendirmesi yapılırken hem sağlık hem de güvenlik ile ilgili tehlike ve riskler tek tek ele alınır.
            </p>
          </div>

          {/* 5.6 METODOLOJİ - METODA GÖRE UYARLANMIŞ GİRİŞ VE İLK TABLOLAR */}
          {method === 'MATRIX_L' && (
            <div>
              <div className="font-bold text-[9px] bg-amber-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide">
                5.6 Risk Değerlendirmesi Karar Matris Metodolojisi
              </div>
              <p className="text-[7.5px] leading-relaxed text-justify mb-1">
                En sık kullanılan yaklaşımlardan biri olan risk değerlendirme matrisi ABD.Askeri standardı MIL_STD_882-B olarak da bilinen sistem güvenlik program gereksinimini karşılamak maksadıyla geliştirilmiştir. Matris diyagramları iki veya daha fazla değişken arasındaki ilişkiyi analiz etmekte kullanılan değerlendirme araçlarıdır. Bu metot basit olması dolayısıyla tek başına risk analizi yapmak zorunda olan analistler için idealdir. Ancak değişik prosesler içeren veya birbirinden çok farklı akım şemasına sahip işlerin/proseslerin hepsi için tek başına yeterli değildir ve analistin birikimine göre metodun başarı oranı değişir.
              </p>
              <div className="font-bold text-[8px] my-1 text-center bg-gray-100 border border-gray-300 py-0.5">
                Risk Skoru = İhtimal X Şiddetin Derecesi’dir.
              </div>
              <p className="text-[7.5px] leading-tight text-justify mb-0.5">
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-[7.5px] leading-tight text-justify mb-1.5">
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              {/* Bir Olayın Gerçekleşme İhtimali Tablosu */}
              <div className="bg-red-600 text-white font-bold text-[8px] text-center py-0.5 border border-black">
                Bir Olayın Gerçekleşme İhtimali
              </div>
              <table className="w-full border-collapse border border-black text-[7.5px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-black p-1 w-12 text-center">Puan</th>
                    <th className="border border-black p-1 w-24 text-center">İhtimal</th>
                    <th className="border border-black p-1 text-center">Ortaya çıkma olasılığı için derecelendirme basamakları</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1">1</td>
                    <td className="border border-black font-bold p-1">Çok Küçük</td>
                    <td className="border border-black p-1">Hemen hemen hiç</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1">2</td>
                    <td className="border border-black font-bold p-1">Küçük</td>
                    <td className="border border-black p-1">Çok az ( yılda bir kez ), sadece anormal durumlarda,</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1">3</td>
                    <td className="border border-black font-bold p-1">Orta</td>
                    <td className="border border-black p-1">Az ( yılda bir kaç kez )</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1">4</td>
                    <td className="border border-black font-bold p-1">Yüksek</td>
                    <td className="border border-black p-1">Sıklıkla ( ayda,bir )</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1">5</td>
                    <td className="border border-black font-bold p-1">Çok Yüksek</td>
                    <td className="border border-black p-1">Çok sıklıkla ( haftada bir, her gün ), normal çalışma şartlarında</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {method === 'FINE_KINNEY' && (
            <div>
              <div className="font-bold text-[9px] bg-blue-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide">
                5.6 Fine-Kinney Risk Değerlendirme Metodolojisi
              </div>
              <p className="text-[7.5px] leading-relaxed text-justify mb-1">
                Fine-Kinney metodu, riskin sayısal olarak değerlendirilmesinde İhtimal (Olasılık), Frekans (Maruziyet Sıklığı) ve Şiddet olmak üzere üç temel parametreyi esas alan nicel bir risk değerlendirme yöntemidir. William T. Fine ve G.F. Kinney tarafından geliştirilmiştir. Çok parametreli yapısı sayesinde risklerin derecelendirilmesinde daha hassas ve nesnel sonuçlar sunar.
              </p>
              <div className="font-bold text-[8px] my-1 text-center bg-blue-50 border border-blue-300 py-0.5 text-blue-900">
                Risk Değeri (R) = İhtimal (P) X Frekans (F) X Şiddet (S)’dir.
              </div>
              <p className="text-[7.5px] leading-tight text-justify mb-0.5">
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-[7.5px] leading-tight text-justify mb-1.5">
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              {/* İhtimal (P) ve Frekans (F) Tabloları yan yana */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="bg-blue-600 text-white font-bold text-[7.5px] text-center py-0.5 border border-black">
                    İhtimal (P) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black text-[7px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center">Puan</th>
                        <th className="border border-black p-0.5 text-center">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold">0.2</td><td className="border border-black p-0.5">Beklenmez (Pratik olarak imkânsız)</td></tr>
                      <tr><td className="border border-black text-center font-bold">0.5</td><td className="border border-black p-0.5">Çok Düşük (Kuvvetle muhtemel değil)</td></tr>
                      <tr><td className="border border-black text-center font-bold">1</td><td className="border border-black p-0.5">Nadir (Fakat olanaklı)</td></tr>
                      <tr><td className="border border-black text-center font-bold">3</td><td className="border border-black p-0.5">Mümkün (Alışılmamış fakat olanaklı)</td></tr>
                      <tr><td className="border border-black text-center font-bold">6</td><td className="border border-black p-0.5">Muhtemel (Fazla şaşırtıcı olmaz)</td></tr>
                      <tr><td className="border border-black text-center font-bold">10</td><td className="border border-black p-0.5">Beklenir (Kuvvetle muhtemel)</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-amber-600 text-white font-bold text-[7.5px] text-center py-0.5 border border-black">
                    Frekans (F) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black text-[7px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center">Puan</th>
                        <th className="border border-black p-0.5 text-center">Maruziyet Sıklığı</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold">0.5</td><td className="border border-black p-0.5">Çok Nadir (Yılda bir veya daha az)</td></tr>
                      <tr><td className="border border-black text-center font-bold">1</td><td className="border border-black p-0.5">Nadir (Yılda birkaç kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold">2</td><td className="border border-black p-0.5">Az (Ayda bir kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold">3</td><td className="border border-black p-0.5">Ara Sıra (Haftada bir kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold">6</td><td className="border border-black p-0.5">Sıklıkla (Günlük / Gün boyu)</td></tr>
                      <tr><td className="border border-black text-center font-bold">10</td><td className="border border-black p-0.5">Sürekli (Sürekli veya saatte birçok kez)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {method === 'FMEA' && (
            <div>
              <div className="font-bold text-[9px] bg-purple-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide">
                5.6 FMEA (Hata Türleri ve Etkileri Analizi) Metodolojisi
              </div>
              <p className="text-[7.5px] leading-relaxed text-justify mb-1">
                FMEA (Failure Mode and Effects Analysis) metodu, proses veya operasyon adımlarındaki olası hata türlerini, bu hataların yaratacağı etkileri ve kök nedenlerini belirlemek, önceliklendirmek ve ortadan kaldırmak için uygulanan sistematik bir değerlendirme tekniğidir. Risk Öncelik Sayısı (RPN) hesaplaması ile kritik riskler önceliklendirilir.
              </p>
              <div className="font-bold text-[8px] my-1 text-center bg-purple-50 border border-purple-300 py-0.5 text-purple-900">
                Risk Öncelik Değeri (RPN) = Olasılık (O) X Şiddet (S) X Saptanabilirlik (D)’dir.
              </div>
              <p className="text-[7.5px] leading-tight text-justify mb-0.5">
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-[7.5px] leading-tight text-justify mb-1.5">
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              {/* Olasılık (O) Tablosu */}
              <div className="bg-purple-700 text-white font-bold text-[8px] text-center py-0.5 border border-black">
                Olasılık (O) Derecelendirme Skalası
              </div>
              <table className="w-full border-collapse border border-black text-[7px]">
                <thead>
                  <tr className="bg-purple-100 text-purple-900">
                    <th className="border border-black p-0.5 w-12 text-center">Puan</th>
                    <th className="border border-black p-0.5 w-24 text-center">İhtimal</th>
                    <th className="border border-black p-0.5 text-center">Ortaya Çıkma Kriteri</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-black text-center font-bold">1</td><td className="border border-black font-bold p-0.5">Neredeyse İmkansız</td><td className="border border-black p-0.5">Hatanın ortaya çıkması beklenmez (&lt; 1/1.500.000)</td></tr>
                  <tr><td className="border border-black text-center font-bold">2 - 3</td><td className="border border-black font-bold p-0.5">Düşük</td><td className="border border-black p-0.5">Seyrek hata ortaya çıkma olasılığı (1/150.000 - 1/15.000)</td></tr>
                  <tr><td className="border border-black text-center font-bold">4 - 6</td><td className="border border-black font-bold p-0.5">Orta</td><td className="border border-black p-0.5">Zaman zaman ortaya çıkan hata (1/2.000 - 1/80)</td></tr>
                  <tr><td className="border border-black text-center font-bold">7 - 8</td><td className="border border-black font-bold p-0.5">Yüksek</td><td className="border border-black p-0.5">Sık karşılaşılan hata (1/20 - 1/8)</td></tr>
                  <tr><td className="border border-black text-center font-bold">9 - 10</td><td className="border border-black font-bold p-0.5">Çok Yüksek</td><td className="border border-black p-0.5">Hatanın ortaya çıkması kaçınılmazdır (&ge; 1/3 - 1/2)</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 5 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(5)}

          {method === 'MATRIX_L' && (
            <div>
              {/* Bir Olayın Gerçekleştiği Takdirde Şiddeti Tablosu */}
              <div className="bg-red-600 text-white font-bold text-[8px] text-center py-0.5 border border-black">
                Bir Olayın Gerçekleştiği Takdirde Şiddeti
              </div>
              <table className="w-full border-collapse border border-black text-[7.5px] mb-2">
                <thead>
                  <tr className="bg-pink-100 text-pink-950">
                    <th className="border border-black p-1 w-12 text-center">Puan</th>
                    <th className="border border-black p-1 w-24 text-center">İhtimal (Şiddet)</th>
                    <th className="border border-black p-1 text-center">Derecelendirme</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1">1</td>
                    <td className="border border-black font-bold p-1">Çok Hafif</td>
                    <td className="border border-black p-1">İş saati kaybı yok, hemen giderilebilen, ilk yardım gerektiren</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1">2</td>
                    <td className="border border-black font-bold p-1">Hafif</td>
                    <td className="border border-black p-1">İş günü kaybı yok, , kalıcı etkisi olmayan ayakta tedavi</td>
                  </tr>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1">3</td>
                    <td className="border border-black font-bold p-1">Orta</td>
                    <td className="border border-black p-1">Hafif yaralanma, yatarak tedavi/yaralanma</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1">4</td>
                    <td className="border border-black font-bold p-1">Ciddi</td>
                    <td className="border border-black p-1">Ciddi yaralanma, uzun süreli tedavi, meslek hastalığı</td>
                  </tr>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1">5</td>
                    <td className="border border-black font-bold p-1">Çok Ciddi</td>
                    <td className="border border-black p-1">Ölüm, sürekli iş göremezlik</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-[7.5px] leading-relaxed text-justify mb-2">
                Tablolardan elde edilen değerler “Matris Metodolojisi Temelli Risk Değerlendirme Tablosuna” kaydedilir. Çıkan sonucun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>

              {/* 5x5 Renkli Matris Tablosu (PDF Birebir) */}
              <div className="flex justify-center mb-2">
                <table className="border-collapse border border-black text-[7.5px] font-bold text-center">
                  <thead>
                    <tr>
                      <th colSpan="2" rowSpan="2" className="border border-black bg-white p-1"></th>
                      <th colSpan="5" className="border border-black bg-gray-100 p-1 text-[8px] font-bold">Şiddet</th>
                    </tr>
                    <tr className="bg-gray-50 text-[7px]">
                      <th className="border border-black p-1 w-14">1<br/><span className="font-normal">(Çok Hafif)</span></th>
                      <th className="border border-black p-1 w-14">2<br/><span className="font-normal">(Hafif)</span></th>
                      <th className="border border-black p-1 w-14">3<br/><span className="font-normal">(Orta)</span></th>
                      <th className="border border-black p-1 w-14">4<br/><span className="font-normal">(Ciddi)</span></th>
                      <th className="border border-black p-1 w-14">5<br/><span className="font-normal">(Çok Ciddi)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowSpan="5" className="border border-black font-bold bg-gray-100 p-1 w-5" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Olasılık</td>
                      <td className="border border-black p-1 bg-gray-50 text-[7px]">1<br/><span className="font-normal">(Çok Küçük)</span></td>
                      <td className="border border-black p-1 bg-green-500 text-black">1</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">2</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">3</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">4</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">5</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50 text-[7px]">2<br/><span className="font-normal">(Küçük)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">2</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">4</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">6</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">8</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">10</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50 text-[7px]">3<br/><span className="font-normal">(Orta)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">3</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">6</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">9</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">12</td>
                      <td className="border border-black p-1 bg-red-600 text-white">15</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50 text-[7px]">4<br/><span className="font-normal">(Yüksek)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">4</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">8</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">12</td>
                      <td className="border border-black p-1 bg-red-600 text-white">16</td>
                      <td className="border border-black p-1 bg-red-600 text-white">20</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50 text-[7px]">5<br/><span className="font-normal">(Çok Yüksek)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black">5</td>
                      <td className="border border-black p-1 bg-orange-400 text-black">10</td>
                      <td className="border border-black p-1 bg-red-600 text-white">15</td>
                      <td className="border border-black p-1 bg-red-600 text-white">20</td>
                      <td className="border border-black p-1 bg-red-800 text-white">25</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Risk Skoru ve Anlamı Tablosu */}
              <table className="w-full border-collapse border border-black text-[7px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-black p-1 w-32 text-center">Risk Skoru</th>
                    <th className="border border-black p-1 w-16 text-center">Değer</th>
                    <th className="border border-black p-1 text-center">Anlamı</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-cyan-50">
                    <td className="border border-black font-bold p-1">Anlamsız (Önemsiz)</td>
                    <td className="border border-black text-center font-bold p-1">1</td>
                    <td className="border border-black p-1">Riskleri ortadan kaldırmak için control presesleri planlamaya ve gerçekleştirilecek faaliyetlerin kayıtlarını tutmaya gerek yoktur.</td>
                  </tr>
                  <tr className="bg-blue-100">
                    <td className="border border-black font-bold p-1">Düşük (Katlanılabilir Risk)</td>
                    <td className="border border-black text-center font-bold p-1">2,3,4,5,6</td>
                    <td className="border border-black p-1">Riskleri ortadan kaldırmak için ilave kontrol preseslerine ihtiyaç olmayabilir. Ancak mevcut kontroller sürdürülmelidir</td>
                  </tr>
                  <tr className="bg-yellow-100">
                    <td className="border border-black font-bold p-1">Orta</td>
                    <td className="border border-black text-center font-bold p-1">8,9,10,12</td>
                    <td className="border border-black p-1">Riskleri düşürmek için gerekli faaliyetler başlatılmalı ve en az 6 ay içinde tamamlanmalıdır.</td>
                  </tr>
                  <tr className="bg-orange-100">
                    <td className="border border-black font-bold p-1">Ciddi</td>
                    <td className="border border-black text-center font-bold p-1">15,16,20</td>
                    <td className="border border-black p-1">Rsikleri düşürmek için gerekli faaliyetler kısa zamanda (bir kaç hafta) başlatılmalıdır. Risk faaliyetin durdurulmasını gerektirecek kadar büyük değilse çalışmalar kontrollü olarak yetkili kişilerce yönetilmelidir.</td>
                  </tr>
                  <tr className="bg-red-100 text-red-900">
                    <td className="border border-black font-bold p-1">Kabul Edilemez</td>
                    <td className="border border-black text-center font-bold p-1">25</td>
                    <td className="border border-black p-1 font-semibold">Risk Kabul edilebilir seviyeye düşürülünceye kadar iş başlatılmamalı, devam eden faaliyet varsa hemen durdurulmalıdır. Gerçekleştireln faaliyetlere ragmen risk düşürülemiyorsa, faaliyet engellenmelidir.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {method === 'FINE_KINNEY' && (
            <div>
              {/* Şiddet (S) Skalası */}
              <div className="bg-red-600 text-white font-bold text-[8px] text-center py-0.5 border border-black">
                Şiddet (S) Skalası ve Derecelendirme
              </div>
              <table className="w-full border-collapse border border-black text-[7.5px] mb-2">
                <thead>
                  <tr className="bg-red-100 text-red-950">
                    <th className="border border-black p-1 w-12 text-center">Puan</th>
                    <th className="border border-black p-1 w-28 text-center">Derece</th>
                    <th className="border border-black p-1 text-center">Zarar ve Etki Derecelendirmesi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-black text-center font-bold p-1">1</td><td className="border border-black font-bold p-1">Dikkate Alınmaz</td><td className="border border-black p-1">İş saati kaybı yok, ilk yardım gerektiren durumlar</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1">3</td><td className="border border-black font-bold p-1">Önemli</td><td className="border border-black p-1">Hafif yaralanma, ayakta tedavi, iş kaybı oluşturmayan durum</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1">7</td><td className="border border-black font-bold p-1">Ciddi</td><td className="border border-black p-1">Ağır yaralanma, dış hastane tedavisi, geçici iş göremezlik</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1">15</td><td className="border border-black font-bold p-1">Çok Ciddi</td><td className="border border-black p-1">Uzuv kaybı, kalıcı maluliyet, meslek hastalığı</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1">40</td><td className="border border-black font-bold p-1">Felaket</td><td className="border border-black p-1">Tek ölümlü kaza</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1">100</td><td className="border border-black font-bold p-1">Birden Fazla Ölümlü</td><td className="border border-black p-1">Çoklu ölüm, büyük çaplı tesis hasarı / çevre felaketi</td></tr>
                </tbody>
              </table>

              <p className="text-[7.5px] leading-relaxed text-justify mb-2">
                Tablolardan elde edilen İhtimal (P), Frekans (F) ve Şiddet (S) değerleri çarpılarak Risk Değeri (R = P x F x S) elde edilir ve “Fine-Kinney Risk Değerlendirme Tablosuna” kaydedilir. Çıkan sonucun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>

              {/* Fine-Kinney Eylem Planı Tablosu */}
              <table className="w-full border-collapse border border-black text-[7.5px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-black p-1 w-24 text-center">Risk Değeri (R)</th>
                    <th className="border border-black p-1 w-36 text-center">Risk Düzeyi</th>
                    <th className="border border-black p-1 text-center">Aksiyon ve Karar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-100">
                    <td className="border border-black text-center font-bold p-1">0 - 20</td>
                    <td className="border border-black font-bold p-1 text-green-900">Kabul Edilebilir Risk</td>
                    <td className="border border-black p-1">Riskleri ortadan kaldırmak için ilave kontrole ihtiyaç yoktur, mevcut durum sürdürülür.</td>
                  </tr>
                  <tr className="bg-yellow-100">
                    <td className="border border-black text-center font-bold p-1">20 - 70</td>
                    <td className="border border-black font-bold p-1 text-yellow-900">Olası Risk</td>
                    <td className="border border-black p-1">Gözetim altında tutulmalı, standart işletme prosedürleri ile kontrol edilmelidir.</td>
                  </tr>
                  <tr className="bg-amber-100">
                    <td className="border border-black text-center font-bold p-1">70 - 200</td>
                    <td className="border border-black font-bold p-1 text-amber-900">Önemli Risk</td>
                    <td className="border border-black p-1">Riskleri düşürmek için gerekli faaliyetler planlanmalı ve en az 3-6 ay içinde tamamlanmalıdır.</td>
                  </tr>
                  <tr className="bg-orange-100">
                    <td className="border border-black text-center font-bold p-1">200 - 400</td>
                    <td className="border border-black font-bold p-1 text-orange-900">Esaslı Risk</td>
                    <td className="border border-black p-1">Riskleri düşürmek için kısa zamanda (birkaç hafta) acil eylem planı başlatılmalıdır. Kontrollü çalışma şarttır.</td>
                  </tr>
                  <tr className="bg-red-100 text-red-900">
                    <td className="border border-black text-center font-bold p-1">400 +</td>
                    <td className="border border-black font-bold p-1">Tolerans Gösterilemez</td>
                    <td className="border border-black p-1 font-semibold">Risk kabul edilebilir seviyeye indirilene kadar faaliyet durdurulmalı, derhal acil tedbirler alınmalıdır.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {method === 'FMEA' && (
            <div>
              {/* Şiddet (S) ve Saptanabilirlik (D) Skalaları */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="bg-red-600 text-white font-bold text-[7.5px] text-center py-0.5 border border-black">
                    Şiddet (S) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black text-[7px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center">Puan</th>
                        <th className="border border-black p-0.5 text-center">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold">1</td><td className="border border-black p-0.5">Etkisiz (Zarar veya etki yok)</td></tr>
                      <tr><td className="border border-black text-center font-bold">2 - 3</td><td className="border border-black p-0.5">Çok Hafif / Hafif Etki</td></tr>
                      <tr><td className="border border-black text-center font-bold">4 - 6</td><td className="border border-black p-0.5">Orta Dereceli Hasar / İş Kaybı</td></tr>
                      <tr><td className="border border-black text-center font-bold">7 - 8</td><td className="border border-black p-0.5">Ağır Yaralanma / Büyük Tesis Hasarı</td></tr>
                      <tr><td className="border border-black text-center font-bold">9 - 10</td><td className="border border-black p-0.5">Ölümcül / Felaket Sonuç</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-blue-600 text-white font-bold text-[7.5px] text-center py-0.5 border border-black">
                    Saptanabilirlik (D) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black text-[7px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center">Puan</th>
                        <th className="border border-black p-0.5 text-center">Tespit Edilebilirlik</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold">1</td><td className="border border-black p-0.5">Kesinlikle Saptanır (Otomatik kontrol)</td></tr>
                      <tr><td className="border border-black text-center font-bold">2 - 3</td><td className="border border-black p-0.5">Yüksek Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold">4 - 6</td><td className="border border-black p-0.5">Orta Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold">7 - 8</td><td className="border border-black p-0.5">Düşük Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold">9 - 10</td><td className="border border-black p-0.5">Saptanamaz / Uyarıcı Mekanizma Yok</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[7.5px] leading-relaxed text-justify mb-2">
                Olasılık, Şiddet ve Saptama parametrelerinin çarpımı ile RPN (Risk Priority Number) elde edilir ve “FMEA Risk Değerlendirme Tablosuna” kaydedilir. Çıkan RPN sonucunun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>

              {/* FMEA Eylem Planı Tablosu */}
              <table className="w-full border-collapse border border-black text-[7.5px]">
                <thead>
                  <tr className="bg-purple-700 text-white">
                    <th className="border border-black p-1 w-24 text-center">RPN Skoru</th>
                    <th className="border border-black p-1 w-36 text-center">Risk Düzeyi</th>
                    <th className="border border-black p-1 text-center">Aksiyon ve Karar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-100">
                    <td className="border border-black text-center font-bold p-1">0 - 40</td>
                    <td className="border border-black font-bold p-1 text-green-900">Düşük Risk</td>
                    <td className="border border-black p-1">Kabul edilebilir seviye. İlave kontrole ihtiyaç olmayabilir, rutin kontroller sürdürülür.</td>
                  </tr>
                  <tr className="bg-yellow-100">
                    <td className="border border-black text-center font-bold p-1">40 - 100</td>
                    <td className="border border-black font-bold p-1 text-yellow-900">Orta Risk</td>
                    <td className="border border-black p-1">Riskleri düşürmek için gerekli faaliyetler başlatılmalı ve belirlenen takvimde tamamlanmalıdır.</td>
                  </tr>
                  <tr className="bg-red-100 text-red-900">
                    <td className="border border-black text-center font-bold p-1">100 +</td>
                    <td className="border border-black font-bold p-1">Yüksek Risk</td>
                    <td className="border border-black p-1 font-semibold">Kritik risk seviyesi. Derhal acil aksiyon planlanmalı, risk kabul edilebilir seviyeye indirilmeden işe devam edilmemelidir.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 6 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(6)}

          {/* 6. ÖNLEMLERİN DEĞERLENDİRİLMESİ */}
          <div className="mb-2">
            <div className="font-bold text-[9.5px] bg-gray-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide">
              6. ÖNLEMLERİN DEĞERLENDİRİLMESİ
            </div>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1.5">
              Belirlenen öncelik derecesine ve işverenin ayırabileceği kaynaklara göre, riskler arasında öncelikli görülenlerin değerlendirilmesi aşağıda verilen yöntem doğrultusunda kararlaştırılır
            </p>
          </div>

          {/* 6.1 */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] text-red-900 mb-0.5">6.1. Birinci Öncelikli Tehlikeler</div>
            <p className="text-[7.5px] leading-tight text-justify mb-1">
              {method === 'FINE_KINNEY'
                ? 'Değerlendirme sonucunda 400 ve üzeri puan alan riskler.'
                : method === 'FMEA'
                ? 'Değerlendirme sonucunda 100 ve üzeri RPN alan riskler.'
                : 'Değerlendirme sonucunda 25 puan alan riskler.'} Önlemler ivedi olarak alınmalı gerekiyorsa faaliyet durdurulmalıdır. Risk kontrol altına alındığı takdirde faaliyete devam edilebilir. Yapılması planlanan faaliyetler:
            </p>
            <div className="text-[7px] leading-tight space-y-0.5 pl-3">
              <div>□ Tehlike kontrol altına alınır.</div>
              <div>□ Kontrol için dökümante edilmiş prosedür/talimatlar oluşturulur.</div>
              <div>□ İzleme ve ölçme yapılır ve kayıtları tutulur.</div>
              <div>□ İyileştirilmeye yönelik düzeltici ve önleyici faaliyetler belirlenir, dökümante edilir, uygulanır ve takip edilir.</div>
              <div>□ Birinci öncelikli tehlikelerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi sağlanır.</div>
              <div>□ Mümkün olduğu yerde iyileştirmelerin rakamsal olarak takibi yapılır ve kaydı tutulur.</div>
              <div>□ Personele ihtiyaç duyulan eğitimler verilir.</div>
              <div>□ Bu konularda tüm uygulamanın belirli periyotlarla denetlenmesi sağlanır.</div>
            </div>
          </div>

          {/* 6.2 */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] text-orange-900 mb-0.5">6.2. İkinci Öncelikli Tehlikeler</div>
            <p className="text-[7.5px] leading-tight text-justify mb-1">
              {method === 'FINE_KINNEY'
                ? 'Değerlendirme sonucunda 200 ile 400 arası puan alan riskler.'
                : method === 'FMEA'
                ? 'Değerlendirme sonucunda 70 ile 100 arası RPN alan riskler.'
                : 'Değerlendirme sonucunda 15 ile 20 arası/dahil puan alan riskler.'} Risk kontrol altında tutulmalı, sürekli gözlemlenmeli ve önlemler ivedi olarak alınmalıdır. Yapılması planlanan faaliyetler:
            </p>
            <div className="text-[7px] leading-tight space-y-0.5 pl-3">
              <div>□ Tehlike kontrol altına alınır.</div>
              <div>□ Gerekli ise kontrol için dökümante edilmiş prosedür/talimatlar oluşturulur.</div>
              <div>□ İzleme ve ölçme planı yapılır ve kayıtları tutulur.</div>
              <div>□ İyileştirilmeye yönelik düzeltici ve önleyici faaliyetler belirlenir, dökümante edilir, uygulanır ve takip edilir.</div>
              <div>□ İkinci öncelikli tehlikelerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi.</div>
              <div>□ Mümkün olduğu yerde iyileştirmelerin rakamsal olarak takibi yapılır ve kaydı tutulur.</div>
              <div>□ Personele ihtiyaç duyulan eğitimler verilir.</div>
              <div>□ Bu konularda tüm uygulamanın belirli periyotlarla denetlenmesi sağlanır</div>
            </div>
          </div>

          {/* 6.3 */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] text-yellow-900 mb-0.5">6.3. Üçüncü Öncelikli Tehlikeler</div>
            <p className="text-[7.5px] leading-tight text-justify mb-1">
              {method === 'FINE_KINNEY'
                ? 'Değerlendirme sonucunda 70 ile 200 arası puan alan riskler.'
                : method === 'FMEA'
                ? 'Değerlendirme sonucunda 40 ile 70 arası RPN alan riskler.'
                : 'Değerlendirme sonucunda 8 ile 12 arası/dahil puan alan riskler.'} İyileştirici tedbirler planlanmalıdır. Yapılması planlanan faaliyetler:
            </p>
            <div className="text-[7px] leading-tight space-y-0.5 pl-3">
              <div>□ İyileştirmeye yönelik düzeltici ve önleyici faaliyetler belirlenir, dökümante eldir, uygulanır ve takip edilir.</div>
              <div>□ Üçüncü öncelikli tedbirlerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi hedeflenir.</div>
              <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
              <div>□ Bu konulardaki tüm uygulamaların belirli periyotlarda denetlenmesi sağlanır, yönetime raporların.</div>
            </div>
          </div>

          {/* 6.4 */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] text-blue-900 mb-0.5">6.4. Dördüncü Öncelikli Tehlikeler</div>
            <p className="text-[7.5px] leading-tight text-justify mb-1">
              {method === 'FINE_KINNEY'
                ? 'Değerlendirme sonucunda 20 ile 70 arası puan alan riskler.'
                : method === 'FMEA'
                ? 'Değerlendirme sonucunda 20 ile 40 arası RPN alan riskler.'
                : 'Değerlendirme sonucunda 2 ile 6 arası/dahil puan alan riskler.'} Alınan önlemler gerektiğinde kontrol edilmelidir. Yapılması planlanan faaliyetler:
            </p>
            <div className="text-[7px] leading-tight space-y-0.5 pl-3">
              <div>□ Önlemler, planlanan uygulamalar kısmında tarif edilir ve uygulama kontrolleri yapılır.</div>
              <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
              <div>□ Dördüncü öncelikli tehlikelerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi hedeflenir.</div>
            </div>
          </div>

          {/* 6.5 */}
          <div className="mb-1.5">
            <div className="font-bold text-[8.5px] text-green-900 mb-0.5">6.5. Beşinci Öncelikli Tehlikeler</div>
            <p className="text-[7.5px] leading-tight text-justify mb-1">
              {method === 'FINE_KINNEY'
                ? 'Değerlendirme sonucunda 0 ile 20 arası puan alan riskler.'
                : method === 'FMEA'
                ? 'Değerlendirme sonucunda 1 ile 20 arası RPN alan riskler.'
                : 'Değerlendirme sonucunda 1 puan alan riskler.'} Alınan önlemler gerektiğinde kontrol edilmelidir. Yapılması planlanan faaliyetler:
            </p>
            <div className="text-[7px] leading-tight space-y-0.5 pl-3">
              <div>□ Gelecekte önemli bir tehlike oluşturulmaması için, incelenir ve gerekirse önlemler planlanan uygulamalar kısmında tarif edilir.</div>
              <div>□ Uygulama kontrolleri yapılır.</div>
              <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
            </div>
          </div>

          {/* NOT */}
          <div className="border border-gray-400 p-1.5 bg-gray-50 text-[7px] leading-tight text-justify mt-1">
            <b>NOT:</b> Olasılığı çok küçük fakat ölüm, uzuv kaybı, meslek hastalığı veya sürekli iş göremezlik ile sonuçlanabilecek durumlar için risk seviyesi kabul edilebilir seviye altına alınamıyorsa, alınan kontrol önlemleri belirli aralıklarla kontrol edilerek gözetim altında tutulmalıdır.
          </div>
        </div>

        {renderPageFooter()}
      </div>

      {/* ===================== SAYFA 7 ===================== */}
      <div contentEditable suppressContentEditableWarning className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto p-8 text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border">
        <div className="flex-1 flex flex-col">
          {renderPageHeader(7)}

          {/* 6.6 */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-1">6.6. Kontrol Tedbirlerinin Belirlenmesi ve Hiyerarşi</div>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Belirlenen tehlikeler ve sebep olacağı risklerin azaltılmasına veya kontrol altına alınmasına yönelik önleyici faaliyetler planlanır. Önlemlerin yerine getirilmesi ile ilgili olarak, sorumlu/sorumlular ve önlemin yerine getirileceği süre belirlenir.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Tehlikenin ve riskin tamamen ortadan kaldırılması mümkün olmasa da, tehlikenin ve riskin azaltılması, uygulanan kontrol sistemleri ile sağlanabilir. Kontroller belirlenirken veya mevcut kontroller üzerinde değişiklik yapma planlanırken aşağıdaki hiyerarşiye uygun olarak risklerin azaltılması düşünülür.
            </p>
            <div className="text-[7.5px] leading-snug space-y-0.5 pl-4 border-l-2 border-black">
              <div>□ Tehlikeyi kaynağında ortadan kaldırma</div>
              <div>□ Yerine koyma</div>
              <div>□ Tehlikeyi kaynağında azaltma</div>
              <div>□ Kişiyi tehlikeden uzaklaştırma</div>
              <div>□ Kişinin maruziyet seviyesini azaltma</div>
              <div>□ Mühendislik kontrolleri</div>
              <div>□ İşaretler/uyarılar ve/veya diğer idari kontroller</div>
              <div>□ Kişisel koruyucu donanım</div>
            </div>
          </div>

          {/* 6.7 */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-1">6.7. Önlemlerin Düzeltilme Durumu ve Riskin Yeniden Değerlendirilmesi</div>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Planlanan faaliyetlerin düzeltilip düzeltilmediği kontrol edilir. Planlanan faaliyetin düzeltilmeme durumunda neden düzeltilemediği değerlendirilir. Değerlendirme sonucuna göre yeni bir faaliyet planlanır ya da faaliyetin gerçekleştirilmesi için neler yapılması gerektiği araştırılır. Konuya ilişkin üst yönetim kararı gereken noktalarda üst yönetime danışılır.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Önemli riskler için hedefler oluşturulur. Konu gerektiğinde İş Sağlığı ve Güvenliği Kurulu’na taşınır. Kurul son kararı verebilir. Alınan önlemler doğrultusunda düzeltilen riskler madde 5.8’e göre yeniden değerlendirilmeye alınır. Bu şekilde risklerin ne düzeyde indirgenebildiği hesaplanmış ve yeni öncelik dereceleri tespit edilmiş olur. Riskler kabul edilebilir sınırlara çekilmeye çalışılır. Kabul edilebilir sınırlara çekilemeyen riskler için hedefler oluşturulur. Riskler yeniden faaliyet planlamasına alınır.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify">
              Bu aşamaya kadar olan tüm çalışmalar “Risk analizi ve Risk Değerlendirme Formu”na işlenir ve bu form ile takip edilir.
            </p>
          </div>

          {/* 7. DİĞER HÜKÜMLER */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-0.5">7. DİĞER HÜKÜMLER</div>
            <p className="text-[7.5px] leading-relaxed text-justify">
              Belirlenen tehlikeler, riskler, bunların öncelik dereceleri, önemli riskler ve bunlara göre oluşturulan uygulama ve kontrol sonuçları, işveren/işveren vekili tarafından gözden geçirilir. İş Sağlığı ve Güvenliği Kurulu tarafından, kurulun olmadığı kuruluşlarda ise işveren/işveren vekili tarafından onaylanır.
            </p>
          </div>

          {/* 8. SONUÇ */}
          <div className="mb-2">
            <div className="font-bold text-[9px] mb-0.5">8. SONUÇ</div>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              <b>Yapılan Bu Risk Değerlendirmesi:</b><br />
              Riskin algılanmasını sağlamak, bu konuda tüm paydaşların ortak algısını oluşturmak ve risklerin kontrollünü sağlayabilmek amacıyla hazırlanmıştır.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Bu raporun değerlendirilmesi, yapılacak çalışmaların yönlendirilmesi, ilgili birimlerle işbirliğinin sağlanması, İş Sağlığı ve Güvenliği Kurulunda çözüm önerilerinin değerlendirilmesi, işyeri hekimince meslek hastalıklarının da risk kontrolü yöntemi ile değerlendirilmesi ve sonuçlandırılması işveren/işveren vekilinin görevidir.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify mb-1">
              Kontrolü ve değerlendirilmesi yapılmamış bir risk analiz raporu, işveren tarafından teşhisi konulmuş tedavisi yapılmamış bir hastalık gibi kabul edilmelidir.
            </p>
            <p className="text-[7.5px] leading-relaxed text-justify">
              Çalışanları açısından daha güvenli, sağlıklı ve verimli bir çalışma ortamı oluşmasında katkı sağlamasını arzu eder, çalışanlarının yaklaşımından dolayı teşekkür ederiz.
            </p>
          </div>

          {/* 9. EKLER */}
          <div className="mb-1">
            <div className="font-bold text-[9px] mb-0.5">9. EKLER</div>
            <div className="text-[7.5px] font-bold pl-2">9.1 Risk Değerlendirmesi Analiz Sonuçları</div>
          </div>
        </div>

        {renderPageFooter()}
      </div>
    </div>
  );
};`;

// Replace ProcedurePreview in App.jsx
const startIndex = content.indexOf('const ProcedurePreview = ({ company, assessment }) => {');
if (startIndex === -1) {
  console.error('Could not find ProcedurePreview in App.jsx');
  process.exit(1);
}

const endMarker = '// --- GÜNCELLENMİŞ SAHA ZİYARET EDİTÖRÜ';
const endIndex = content.indexOf(endMarker, startIndex);
if (endIndex === -1) {
  console.error('Could not find end marker in App.jsx');
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

content = before + procedureCode + '\n\n' + after;

// Also check openProcedurePage definition
if (!content.includes('const openProcedurePage = (company, assessment) => {')) {
  const coverEnd = 'const openCoverPage = (company, assessment) => {';
  const coverIdx = content.indexOf(coverEnd);
  if (coverIdx !== -1) {
    const nextFuncMarker = '// --- WEB RAPORU YENİ SEKMEDE';
    const nextFuncIdx = content.indexOf(nextFuncMarker, coverIdx);
    if (nextFuncIdx !== -1) {
      const openProcedureCode = `// --- PROSEDÜR YENİ SEKMEDE YAZDIRMA ---\nconst openProcedurePage = (company, assessment) => {\n  const html = getProcedurePageHTML(company, assessment);\n  const win = window.open('', '_blank');\n  if (win) {\n    win.document.write(html);\n    win.document.close();\n  }\n};\n\n`;
      content = content.substring(0, nextFuncIdx) + openProcedureCode + content.substring(nextFuncIdx);
      console.log('Added openProcedurePage function.');
    }
  }
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('ProcedurePreview replaced successfully!');
