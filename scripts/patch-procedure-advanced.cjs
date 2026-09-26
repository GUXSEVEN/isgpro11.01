const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update ProcedurePreview component
const newProcedureComponent = `const ProcedurePreview = ({
  company,
  assessment,
  reportFontSize = '8pt',
  reportPadding = '8mm',
  reportLineHeight = '1.2',
  signatureStyle = 'compact',
  tableVerticalAlign = 'middle',
  tableTextAlign = 'left'
}) => {
  if (!company || !company.info || !assessment) {
    return <div className="p-10 text-center text-red-600 font-bold">Veriler yükleniyor...</div>;
  }

  const method = assessment.method || 'MATRIX_L';

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

  // Font ve stil hesaplamaları
  const fontPt = parseFloat(reportFontSize) || 8;
  const fontScale = fontPt / 8;
  const lineHeightVal = parseFloat(reportLineHeight) || 1.2;
  const padMm = parseFloat(reportPadding) || 8;

  const titleFont = \`calc(\${9.5 * fontScale}pt)\`;
  const subTitleFont = \`calc(\${9 * fontScale}pt)\`;
  const bodyFont = \`calc(\${8 * fontScale}pt)\`;
  const smallFont = \`calc(\${7.5 * fontScale}pt)\`;
  const tinyFont = \`calc(\${7 * fontScale}pt)\`;

  const cellVAlign = tableVerticalAlign || 'middle';
  const cellTAlign = tableTextAlign || 'left';

  const methodFormulaInline = method === 'FINE_KINNEY'
    ? '(Risk = İhtimal x Frekans x Şiddet)'
    : method === 'FMEA'
    ? '(Risk = Olasılık x Şiddet x Saptanabilirlik)'
    : '(Risk = Olasılık x Şiddet)';

  // Blok tanımları: Her blok bölünmez (atomic) bir içerik parçasıdır
  // 7 ana sayfa grubuna ayrılmıştır
  const blocks = [
    // --- GRUP 1: AMAÇ, KAPSAM, TANIMLAR, SORUMLULUKLAR, 5.1 SIKLIK ---
    {
      id: 'b1_amac',
      group: 1,
      basePt: 75,
      render: () => (
        <div key="b1_amac" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-black mb-0.5" style={{ fontSize: subTitleFont }}>1. <span className="underline ml-4">AMAÇ:</span></div>
          <p className="text-justify mb-1" style={{ fontSize: bodyFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Bu prosedürün amacı, işyerindeki mevcut çalışma koşullarından kaynaklanabilecek ve işyerinin faaliyetleri sırasında oluşabilecek her türlü potansiyel tehlikenin tanımlanması, bunlara ilişkin risklerin belirlenmesi ve değerlendirilmesi, olası risklerle ilgili kontrol tedbirlerinin alınmasına ilişkin yöntem ve esasların belirlenmesi, her türlü tehlike ve sağlık riskini insan sağlığını etkilemeyen minimum seviyeye düşürmektir.
          </p>
          <p className="text-justify" style={{ fontSize: bodyFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Risk değerlendirmesi sonucunda, işyerindeki tüm tehlikelerin ne olduğuna karar verilmiş kaza olma olasılığı ile olası kazaların boyutu/büyüklüğü hakkında bilgi sahibi olunmuş olacaktır.
          </p>
        </div>
      )
    },
    {
      id: 'b2_kapsam',
      group: 1,
      basePt: 55,
      render: () => (
        <div key="b2_kapsam" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-black mb-0.5" style={{ fontSize: subTitleFont }}>2. <span className="underline ml-4">KAPSAM:</span></div>
          <p className="mb-0.5" style={{ fontSize: bodyFont, lineHeight: lineHeightVal }}>Bu prosedür, çalışma alanındaki:</p>
          <ul className="list-disc pl-5 space-y-0.5" style={{ fontSize: bodyFont, lineHeight: lineHeightVal }}>
            <li>İşyerini,</li>
            <li>İşyerinde kullanılan tüm makine, tesisat, bina, eklenti ve sosyal tesisleri,</li>
            <li>İşyerinde çalışan firma sorumlularını ve çalışanları,</li>
            <li>Ziyaretçi ve tedarikçilerini kapsar.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'b3_tanimlar',
      group: 1,
      basePt: 220,
      render: () => (
        <div key="b3_tanimlar" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-black text-center border-b border-gray-300 pb-0.5 mb-1 tracking-wide" style={{ fontSize: subTitleFont }}>3. TANIMLAR</div>
          <div className="space-y-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
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
      )
    },
    {
      id: 'b4_sorumluluklar',
      group: 1,
      basePt: 35,
      render: () => (
        <div key="b4_sorumluluklar" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-black mb-0.5" style={{ fontSize: subTitleFont }}>4. <span className="underline ml-4">SORUMLULUKLAR</span></div>
          <p className="text-justify" style={{ fontSize: bodyFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Bu prosedüre ilişkin olarak tehlikelerin tanımlanması, risklerin değerlendirilmesi ve kontrol tedbirlerinin belirlenmesinde işveren ve tüm çalışanlar sorumludur.
          </p>
        </div>
      )
    },
    {
      id: 'b5_siklik',
      group: 1,
      basePt: 150,
      render: () => (
        <div key="b5_siklik" className="mb-1" style={{ breakInside: 'avoid' }}>
          <div className="font-bold bg-gray-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide" style={{ fontSize: subTitleFont }}>
            5. RİSK ANALİZİ VE RİSK DEĞERLENDİRMESİNDE İZLENECEK METOTLAR
          </div>
          <div className="font-bold mb-1" style={{ fontSize: bodyFont }}>5.1 Risk Analizi Ve Risk Değerlendirmesi Çalışmalarının Gerçekleştirilme Sıklığı:</div>
          <div className="space-y-1 pl-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },

    // --- GRUP 2: 5.2 HUSUSLAR, AKIŞ ŞEMASI, 5.3 YÖNTEM, 5.4 DEĞERLENDİRME ---
    {
      id: 'b6_hususlar',
      group: 2,
      basePt: 130,
      render: () => (
        <div key="b6_hususlar" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>5.2 Risk Analizi Ve Risk Değerlendirmesi Çalışmalarında Dikkat Edilecek Hususlar</div>
          <p className="mb-1" style={{ fontSize: bodyFont, lineHeight: lineHeightVal }}>Risk analizi ve risk değerlendirmesi çalışmaları yapılırken aşağıdaki hususlar dikkate alınacaktır.</p>
          <div className="space-y-0.5 pl-2" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
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
      )
    },
    {
      id: 'b7_akis_semasi',
      group: 2,
      basePt: 160,
      render: () => (
        <div key="b7_akis_semasi" className="my-2 border border-black p-2 bg-gray-50 flex items-center justify-between" style={{ breakInside: 'avoid', fontSize: smallFont }}>
          <div className="w-[18%] border border-red-500 bg-white p-2 text-center font-semibold text-red-900 rounded flex flex-col justify-center min-h-[130px]">
            <div className="font-bold mb-1" style={{ fontSize: bodyFont }}>İletişim</div>
            <div className="mb-1">ve</div>
            <div className="font-bold" style={{ fontSize: bodyFont }}>Danışma</div>
            <div className="text-[12px] text-red-500 mt-2">⇄</div>
          </div>

          <div className="w-[58%] flex flex-col items-center gap-1">
            <div className="w-full border border-red-600 bg-white p-1 text-center font-bold text-gray-800 shadow-xs">
              Tehlikelerin Belirlenmesi
            </div>
            <div className="text-red-500 text-[10px] leading-none">↓</div>

            <div className="w-full border-2 border-dashed border-red-400 p-1 bg-red-50/40 rounded">
              <div className="font-bold text-red-800 text-center uppercase tracking-wider mb-0.5" style={{ fontSize: tinyFont }}>Risklerin Değerlendirmesi</div>
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

          <div className="w-[18%] border border-red-500 bg-white p-2 text-center font-semibold text-red-900 rounded flex flex-col justify-center min-h-[130px]">
            <div className="font-bold mb-1" style={{ fontSize: bodyFont }}>İzleme</div>
            <div className="mb-1">ve</div>
            <div className="font-bold" style={{ fontSize: bodyFont }}>Gözden Geçirme</div>
            <div className="text-[12px] text-red-500 mt-2">⇄</div>
          </div>
        </div>
      )
    },
    {
      id: 'b8_yontem',
      group: 2,
      basePt: 80,
      render: () => (
        <div key="b8_yontem" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>5.3 Risk Analizi Ve Risk Değerlendirmesi Yöntemi</div>
          <p className="mb-1" style={{ fontSize: bodyFont, lineHeight: lineHeightVal }}>Risk analizi ve risk değerlendirmesi şu şekilde yapılmaktadır.</p>
          <div className="space-y-0.5 pl-2 text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            <div><b>a.</b> Başlangıçta İş Sağlığı ve Güvenliği Kurulu veya İş Güvenliği Uzmanı tarafından hazırlanan risk analizi çalışmaları sürecin devamında ilgili birim yetkilisi veya yetkilileri tarafından sürekli olarak izlenecek ve kontrol tedbirlerinin uygulanması ile risk skorları azaltılarak iyileştirme çalışmaları gerçekleştirilecektir.</div>
            <div><b>b.</b> Belirlenen risklerin kabul edilebilir seviyeye indirilinceye kadar sürekli izlenmesi gerekmektedir.</div>
            <div><b>c.</b> Kabul edilebilir seviyeye indirilen riskler ise olasılık ve şiddetlerinin artmaması için alınmış olan önlemlerin devamlılığı izlenmelidir.</div>
          </div>
        </div>
      )
    },
    {
      id: 'b9_degerlendirme',
      group: 2,
      basePt: 150,
      render: () => (
        <div key="b9_degerlendirme" className="mb-1" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>5.4 Risk Değerlendirmesi</div>
          <p className="mb-1 text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Sistematik metotlarla çalışma ortamı, şartları yada çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve riskleri kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür. İşverenler aşağıdaki genel prensiplere uygun tedbirleri alacaktır.
          </p>
          <ul className="list-disc pl-5 space-y-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },

    // --- GRUP 3: 5.4.a GİRDİLER, TEHLİKE LİSTELERİ, ÖZET ---
    {
      id: 'b10_girdiler',
      group: 3,
      basePt: 130,
      render: () => (
        <div key="b10_girdiler" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>a. Tehlike Belirleme Girdileri</div>
          <div className="grid grid-cols-2 gap-x-4" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b11_tehlike_tablosu',
      group: 3,
      basePt: 135,
      render: () => (
        <div key="b11_tehlike_tablosu" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold bg-gray-100 border border-black px-1.5 py-0.5 mb-1" style={{ fontSize: bodyFont }}>Genel tehlike listesi</div>
          <div className="grid grid-cols-2 gap-x-4 border border-black p-1.5 bg-white" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b12_hedef_tablosu',
      group: 3,
      basePt: 125,
      render: () => (
        <div key="b12_hedef_tablosu" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold bg-gray-100 border border-black px-1.5 py-0.5 mb-1" style={{ fontSize: bodyFont }}>Tehlike sonucu hedef listesi İnsanlarda</div>
          <div className="grid grid-cols-2 gap-x-4 border border-black p-1.5 bg-white" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b13_insanlar_disinda',
      group: 3,
      basePt: 60,
      render: () => (
        <div key="b13_insanlar_disinda" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold bg-gray-100 border border-black px-1.5 py-0.5 mb-1" style={{ fontSize: bodyFont }}>İnsanlar Dışında</div>
          <div className="border border-black p-1.5 grid grid-cols-2 gap-x-4 bg-white" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b14_girdiler_ozet',
      group: 3,
      basePt: 55,
      render: () => (
        <div key="b14_girdiler_ozet" className="border-t border-gray-300 pt-1.5" style={{ breakInside: 'avoid' }}>
          <p className="text-justify text-gray-800" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Yukarıda verilen tipik girdiler tehlikelerin belirlenmesi amacıyla değerlendirilir. Bu değerlendirme sonucunda düşme, malzeme düşmesi, elektriğe çarpılma, maruziyet, makine-ekipman zararları, kimyasal maddelerle temaslar, yangın, patlama v.b. tehlikeler tanımlanır.İşyeri ortamında gözle görebildiğimiz yada göremediğimiz bir çok tehlike mevcuttur, önemli olan acil önlem gerektiren tolere edilemeyecek risklerin ayırt edilmesidir.
          </p>
        </div>
      )
    },

    // --- GRUP 4: 5.4.b VERİLER, c SORUMLULUK, d YARARLAR, 5.5, 5.6 METODOLOJİ GİRİŞİ ---
    {
      id: 'b15_ise_baslanmadan',
      group: 4,
      basePt: 95,
      render: () => (
        <div key="b15_ise_baslanmadan" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>b) İşe Başlanmadan Önce Şu Veriler Toplanıp Değerlendirilmelidir.</div>
          <div className="pl-2 space-y-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b16_kisisel_sorumluluk',
      group: 4,
      basePt: 70,
      render: () => (
        <div key="b16_kisisel_sorumluluk" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>c) Risk Değerlendirmesinde Kişisel Sorumluluk</div>
          <div className="pl-2 space-y-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
            <div>• Yeteneklerinin ve sınırlarının farkında olmak,</div>
            <div>• Yönetim sistemlerine uygun ve disiplinli çalışmak,</div>
            <div>• Kendisinin ve diğerlerinin güvenliğini gözetmek,</div>
            <div>• Etkin takım elemanı olmak,</div>
            <div>• Mücadeleci olmak,</div>
            <div>• Değişime uyum sağlamak</div>
          </div>
        </div>
      )
    },
    {
      id: 'b17_isveren_yararlar',
      group: 4,
      basePt: 70,
      render: () => (
        <div key="b17_isveren_yararlar" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>d) Risk Değerlendirmesinin İşverenler Açısından Yararları</div>
          <div className="pl-2 space-y-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
            <div>• Tehlike ve risklerini önceden görebilme</div>
            <div>• Uluslararası saygınlık ve geçerlilik</div>
            <div>• Proaktif yaklaşımla acil durumlar için her an hazırlıklı olma</div>
            <div>• İstenmeyen durumların önlenmesi ile kayıpların azaltılması</div>
            <div>• Sorumlulukların ve görevlerin belirlenmesi ve paylaşımı</div>
            <div>• Güvenli teknoloji seçimi ile güvenli çalışma ortamı temini</div>
          </div>
        </div>
      )
    },
    {
      id: 'b18_5_5_tablo',
      group: 4,
      basePt: 60,
      render: () => (
        <div key="b18_5_5_tablo" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>5.5 Değerlendirme Tablosu</div>
          <p className="text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Değerlendirme tablosuna göre ilgili bölüm/süreç dahilindeki tüm faaliyetler sınıflandırılır. Faaliyetlerin belirlenmesinde, bölümlerin kendi içerisinde bölümlendirilmesi ile en küçük parçalar halinde sınıflandırılmasına dikkat edilir. Ardından faaliyetlerden kaynaklanan tehlikelerin, risklerin ve risklerin doğurabileceği sonuçların tanımlanması gerçekleştirilir. Risk değerlendirmesi yapılırken hem sağlık hem de güvenlik ile ilgili tehlike ve riskler tek tek ele alınır.
          </p>
        </div>
      )
    },
    {
      id: 'b19_metodoloji_part1',
      group: 4,
      basePt: 190,
      render: () => (
        <div key="b19_metodoloji_part1" style={{ breakInside: 'avoid' }}>
          {method === 'MATRIX_L' && (
            <div>
              <div className="font-bold bg-amber-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide" style={{ fontSize: subTitleFont }}>
                5.6 Risk Değerlendirmesi Karar Matris Metodolojisi
              </div>
              <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                En sık kullanılan yaklaşımlardan biri olan risk değerlendirme matrisi ABD.Askeri standardı MIL_STD_882-B olarak da bilinen sistem güvenlik program gereksinimini karşılamak maksadıyla geliştirilmiştir. Matris diyagramları iki veya daha fazla değişken arasındaki ilişkiyi analiz etmekte kullanılan değerlendirme araçlarıdır. Bu metot basit olması dolayısıyla tek başına risk analizi yapmak zorunda olan analistler için idealdir. Ancak değişik prosesler içeren veya birbirinden çok farklı akım şemasına sahip işlerin/proseslerin hepsi için tek başına yeterli değildir ve analistin birikimine göre metodun başarı oranı değişir.
              </p>
              <div className="font-bold my-1 text-center bg-gray-100 border border-gray-300 py-0.5" style={{ fontSize: bodyFont }}>
                Risk Skoru = İhtimal X Şiddetin Derecesi’dir.
              </div>
              <p className="text-justify mb-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-justify mb-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              {/* Bir Olayın Gerçekleşme İhtimali Tablosu */}
              <div className="bg-red-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: bodyFont }}>
                Bir Olayın Gerçekleşme İhtimali
              </div>
              <table className="w-full border-collapse border border-black" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-black p-1 w-12 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                    <th className="border border-black p-1 w-24 text-center" style={{ verticalAlign: cellVAlign }}>İhtimal</th>
                    <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Ortaya çıkma olasılığı için derecelendirme basamakları</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>1</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Çok Küçük</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Hemen hemen hiç</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>2</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Küçük</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Çok az ( yılda bir kez ), sadece anormal durumlarda,</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>3</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Orta</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Az ( yılda bir kaç kez )</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>4</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Yüksek</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Sıklıkla ( ayda,bir )</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>5</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Çok Yüksek</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Çok sıklıkla ( haftada bir, her gün ), normal çalışma şartlarında</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {method === 'FINE_KINNEY' && (
            <div>
              <div className="font-bold bg-blue-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide" style={{ fontSize: subTitleFont }}>
                5.6 Fine-Kinney Risk Değerlendirme Metodolojisi
              </div>
              <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                Fine-Kinney metodu, riskin sayısal olarak değerlendirilmesinde İhtimal (Olasılık), Frekans (Maruziyet Sıklığı) ve Şiddet olmak üzere üç temel parametreyi esas alan nicel bir risk değerlendirme yöntemidir. William T. Fine ve G.F. Kinney tarafından geliştirilmiştir. Çok parametreli yapısı sayesinde risklerin derecelendirilmesinde daha hassas ve nesnel sonuçlar sunar.
              </p>
              <div className="font-bold my-1 text-center bg-blue-50 border border-blue-300 py-0.5 text-blue-900" style={{ fontSize: bodyFont }}>
                Risk Değeri (R) = İhtimal (P) X Frekans (F) X Şiddet (S)’dir.
              </div>
              <p className="text-justify mb-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-justify mb-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="bg-blue-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: smallFont }}>
                    İhtimal (P) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                        <th className="border border-black p-0.5 text-center" style={{ verticalAlign: cellVAlign }}>Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>0.2</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Beklenmez (Pratik olarak imkânsız)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>0.5</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Çok Düşük (Kuvvetle muhtemel değil)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Nadir (Fakat olanaklı)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>3</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Mümkün (Alışılmamış fakat olanaklı)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>6</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Muhtemel (Fazla şaşırtıcı olmaz)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>10</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Beklenir (Kuvvetle muhtemel)</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-amber-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: smallFont }}>
                    Frekans (F) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                        <th className="border border-black p-0.5 text-center" style={{ verticalAlign: cellVAlign }}>Maruziyet Sıklığı</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>0.5</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Çok Nadir (Yılda bir veya daha az)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Nadir (Yılda birkaç kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>2</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Az (Ayda bir kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>3</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Ara Sıra (Haftada bir kez)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>6</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Sıklıkla (Günlük / Gün boyu)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>10</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Sürekli (Sürekli veya saatte birçok kez)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {method === 'FMEA' && (
            <div>
              <div className="font-bold bg-purple-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide" style={{ fontSize: subTitleFont }}>
                5.6 FMEA (Hata Türleri ve Etkileri Analizi) Metodolojisi
              </div>
              <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                FMEA (Failure Mode and Effects Analysis) metodu, proses veya operasyon adımlarındaki olası hata türlerini, bu hataların yaratacağı etkileri ve kök nedenlerini belirlemek, önceliklendirmek ve ortadan kaldırmak için uygulanan sistematik bir değerlendirme tekniğidir. Risk Öncelik Sayısı (RPN) hesaplaması ile kritik riskler önceliklendirilir.
              </p>
              <div className="font-bold my-1 text-center bg-purple-50 border border-purple-300 py-0.5 text-purple-900" style={{ fontSize: bodyFont }}>
                Risk Öncelik Değeri (RPN) = Olasılık (O) X Şiddet (S) X Saptanabilirlik (D)’dir.
              </div>
              <p className="text-justify mb-0.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Risk Değerlendirmesi:</b> Sistematik metotlarla çalışma ortamı, şartları ya da çevrede var olan tehlikeleri belirlemek, riskleri ortaya çıkarmak ve kontrol etmek için uygun nitel ve/veya nicel yöntemler kullanılarak yapılan çalışmaların bütünüdür.
              </p>
              <p className="text-justify mb-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                <b>Kabul Edilebilir Risk:</b> Kanuni zorunluluklar ve işletmenin kendi sağlık ve güvenlik politikası ve uygulamaları dikkate alındığında, kabul edebilecek düzeye indirilmiş risktir.
              </p>

              <div className="bg-purple-700 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: bodyFont }}>
                Olasılık (O) Derecelendirme Skalası
              </div>
              <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <thead>
                  <tr className="bg-purple-100 text-purple-900">
                    <th className="border border-black p-0.5 w-12 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                    <th className="border border-black p-0.5 w-24 text-center" style={{ verticalAlign: cellVAlign }}>İhtimal</th>
                    <th className="border border-black p-0.5 text-center" style={{ verticalAlign: cellVAlign }}>Ortaya Çıkma Kriteri</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black font-bold p-0.5" style={{ verticalAlign: cellVAlign }}>Neredeyse İmkansız</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Hatanın ortaya çıkması beklenmez (&lt; 1/1.500.000)</td></tr>
                  <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>2 - 3</td><td className="border border-black font-bold p-0.5" style={{ verticalAlign: cellVAlign }}>Düşük</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Seyrek hata ortaya çıkma olasılığı (1/150.000 - 1/15.000)</td></tr>
                  <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>4 - 6</td><td className="border border-black font-bold p-0.5" style={{ verticalAlign: cellVAlign }}>Orta</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Zaman zaman ortaya çıkan hata (1/2.000 - 1/80)</td></tr>
                  <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>7 - 8</td><td className="border border-black font-bold p-0.5" style={{ verticalAlign: cellVAlign }}>Yüksek</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Sık karşılaşılan hata (1/20 - 1/8)</td></tr>
                  <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>9 - 10</td><td className="border border-black font-bold p-0.5" style={{ verticalAlign: cellVAlign }}>Çok Yüksek</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Hatanın ortaya çıkması kaçınılmazdır (&ge; 1/3 - 1/2)</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    },

    // --- GRUP 5: ŞİDDET TABLOSU, MATRİS VE EYLEM TABLOSU ---
    {
      id: 'b20_siddet_tablosu',
      group: 5,
      basePt: 120,
      render: () => (
        <div key="b20_siddet_tablosu" className="mb-2" style={{ breakInside: 'avoid' }}>
          {method === 'MATRIX_L' && (
            <div>
              <div className="bg-red-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: bodyFont }}>
                Bir Olayın Gerçekleştiği Takdirde Şiddeti
              </div>
              <table className="w-full border-collapse border border-black" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <thead>
                  <tr className="bg-pink-100 text-pink-950">
                    <th className="border border-black p-1 w-12 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                    <th className="border border-black p-1 w-24 text-center" style={{ verticalAlign: cellVAlign }}>İhtimal (Şiddet)</th>
                    <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Derecelendirme</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>1</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Çok Hafif</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>İş saati kaybı yok, hemen giderilebilen, ilk yardım gerektiren</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>2</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Hafif</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>İş günü kaybı yok, , kalıcı etkisi olmayan ayakta tedavi</td>
                  </tr>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>3</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Orta</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Hafif yaralanma, yatarak tedavi/yaralanma</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>4</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Ciddi</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Ciddi yaralanma, uzun süreli tedavi, meslek hastalığı</td>
                  </tr>
                  <tr className="bg-pink-50/50">
                    <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>5</td>
                    <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Çok Ciddi</td>
                    <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Ölüm, sürekli iş göremezlik</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-justify mt-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                Tablolardan elde edilen değerler “Matris Metodolojisi Temelli Risk Değerlendirme Tablosuna” kaydedilir. Çıkan sonucun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>
            </div>
          )}

          {method === 'FINE_KINNEY' && (
            <div>
              <div className="bg-red-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: bodyFont }}>
                Şiddet (S) Skalası ve Derecelendirme
              </div>
              <table className="w-full border-collapse border border-black" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <thead>
                  <tr className="bg-red-100 text-red-950">
                    <th className="border border-black p-1 w-12 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                    <th className="border border-black p-1 w-28 text-center" style={{ verticalAlign: cellVAlign }}>Derece</th>
                    <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Zarar ve Etki Derecelendirmesi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Dikkate Alınmaz</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>İş saati kaybı yok, ilk yardım gerektiren durumlar</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>3</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Önemli</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>Hafif yaralanma, ayakta tedavi, iş kaybı oluşturmayan durum</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>7</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Ciddi</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>Ağır yaralanma, dış hastane tedavisi, geçici iş göremezlik</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>15</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Çok Ciddi</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>Uzuv kaybı, kalıcı maluliyet, meslek hastalığı</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>40</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Felaket</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>Tek ölümlü kaza</td></tr>
                  <tr><td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>100</td><td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Birden Fazla Ölümlü</td><td className="border border-black p-1" style={{ verticalAlign: cellVAlign }}>Çoklu ölüm, büyük çaplı tesis hasarı / çevre felaketi</td></tr>
                </tbody>
              </table>
              <p className="text-justify mt-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                Tablolardan elde edilen İhtimal (P), Frekans (F) ve Şiddet (S) değerleri çarpılarak Risk Değeri (R = P x F x S) elde edilir ve “Fine-Kinney Risk Değerlendirme Tablosuna” kaydedilir. Çıkan sonucun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>
            </div>
          )}

          {method === 'FMEA' && (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-1.5">
                <div>
                  <div className="bg-red-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: smallFont }}>
                    Şiddet (S) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                        <th className="border border-black p-0.5 text-center" style={{ verticalAlign: cellVAlign }}>Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Etkisiz (Zarar veya etki yok)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>2 - 3</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Çok Hafif / Hafif Etki</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>4 - 6</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Orta Dereceli Hasar / İş Kaybı</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>7 - 8</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Ağır Yaralanma / Büyük Tesis Hasarı</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>9 - 10</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Ölümcül / Felaket Sonuç</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-blue-600 text-white font-bold text-center py-0.5 border border-black" style={{ fontSize: smallFont }}>
                    Saptanabilirlik (D) Skalası
                  </div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-0.5 w-8 text-center" style={{ verticalAlign: cellVAlign }}>Puan</th>
                        <th className="border border-black p-0.5 text-center" style={{ verticalAlign: cellVAlign }}>Tespit Edilebilirlik</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>1</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Kesinlikle Saptanır (Otomatik kontrol)</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>2 - 3</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Yüksek Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>4 - 6</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Orta Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>7 - 8</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Düşük Tespit Şansı</td></tr>
                      <tr><td className="border border-black text-center font-bold" style={{ verticalAlign: cellVAlign }}>9 - 10</td><td className="border border-black p-0.5" style={{ verticalAlign: cellVAlign }}>Saptanamaz / Uyarıcı Mekanizma Yok</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
                Olasılık, Şiddet ve Saptama parametrelerinin çarpımı ile RPN (Risk Priority Number) elde edilir ve “FMEA Risk Değerlendirme Tablosuna” kaydedilir. Çıkan RPN sonucunun büyüklüğüne göre en büyük değerden başlayarak riskler için gerekli önlemler alınır.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'b21_matris_tablosu',
      group: 5,
      basePt: 170,
      render: () => (
        <div key="b21_matris_tablosu" className="mb-2" style={{ breakInside: 'avoid' }}>
          {method === 'MATRIX_L' && (
            <div>
              <div className="flex justify-center mb-2">
                <table className="border-collapse border border-black font-bold text-center" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <thead>
                    <tr>
                      <th colSpan="2" rowSpan="2" className="border border-black bg-white p-1"></th>
                      <th colSpan="5" className="border border-black bg-gray-100 p-1 font-bold" style={{ fontSize: bodyFont }}>Şiddet</th>
                    </tr>
                    <tr className="bg-gray-50" style={{ fontSize: tinyFont }}>
                      <th className="border border-black p-1 w-14">1<br/><span className="font-normal">(Çok Hafif)</span></th>
                      <th className="border border-black p-1 w-14">2<br/><span className="font-normal">(Hafif)</span></th>
                      <th className="border border-black p-1 w-14">3<br/><span className="font-normal">(Orta)</span></th>
                      <th className="border border-black p-1 w-14">4<br/><span className="font-normal">(Ciddi)</span></th>
                      <th className="border border-black p-1 w-14">5<br/><span className="font-normal">(Çok Ciddi)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowSpan="5" className="border border-black font-bold bg-gray-100 p-1 w-5" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', verticalAlign: cellVAlign }}>Olasılık</td>
                      <td className="border border-black p-1 bg-gray-50" style={{ fontSize: tinyFont, verticalAlign: cellVAlign }}>1<br/><span className="font-normal">(Çok Küçük)</span></td>
                      <td className="border border-black p-1 bg-green-500 text-black" style={{ verticalAlign: cellVAlign }}>1</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>2</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>3</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>4</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>5</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50" style={{ fontSize: tinyFont, verticalAlign: cellVAlign }}>2<br/><span className="font-normal">(Küçük)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>2</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>4</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>6</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>8</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>10</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50" style={{ fontSize: tinyFont, verticalAlign: cellVAlign }}>3<br/><span className="font-normal">(Orta)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>3</td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>6</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>9</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>12</td>
                      <td className="border border-black p-1 bg-red-600 text-white" style={{ verticalAlign: cellVAlign }}>15</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50" style={{ fontSize: tinyFont, verticalAlign: cellVAlign }}>4<br/><span className="font-normal">(Yüksek)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>4</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>8</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>12</td>
                      <td className="border border-black p-1 bg-red-600 text-white" style={{ verticalAlign: cellVAlign }}>16</td>
                      <td className="border border-black p-1 bg-red-600 text-white" style={{ verticalAlign: cellVAlign }}>20</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50" style={{ fontSize: tinyFont, verticalAlign: cellVAlign }}>5<br/><span className="font-normal">(Çok Yüksek)</span></td>
                      <td className="border border-black p-1 bg-yellow-300 text-black" style={{ verticalAlign: cellVAlign }}>5</td>
                      <td className="border border-black p-1 bg-orange-400 text-black" style={{ verticalAlign: cellVAlign }}>10</td>
                      <td className="border border-black p-1 bg-red-600 text-white" style={{ verticalAlign: cellVAlign }}>15</td>
                      <td className="border border-black p-1 bg-red-600 text-white" style={{ verticalAlign: cellVAlign }}>20</td>
                      <td className="border border-black p-1 bg-red-800 text-white" style={{ verticalAlign: cellVAlign }}>25</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'b22_eylem_tablosu',
      group: 5,
      basePt: 160,
      render: () => (
        <div key="b22_eylem_tablosu" style={{ breakInside: 'avoid' }}>
          {method === 'MATRIX_L' && (
            <table className="w-full border-collapse border border-black" style={{ fontSize: tinyFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-black p-1 w-32 text-center" style={{ verticalAlign: cellVAlign }}>Risk Skoru</th>
                  <th className="border border-black p-1 w-16 text-center" style={{ verticalAlign: cellVAlign }}>Değer</th>
                  <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Anlamı</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-cyan-50">
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Anlamsız (Önemsiz)</td>
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>1</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri ortadan kaldırmak için control presesleri planlamaya ve gerçekleştirilecek faaliyetlerin kayıtlarını tutmaya gerek yoktur.</td>
                </tr>
                <tr className="bg-blue-100">
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Düşük (Katlanılabilir Risk)</td>
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>2,3,4,5,6</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri ortadan kaldırmak için ilave kontrol preseslerine ihtiyaç olmayabilir. Ancak mevcut kontroller sürdürülmelidir</td>
                </tr>
                <tr className="bg-yellow-100">
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Orta</td>
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>8,9,10,12</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri düşürmek için gerekli faaliyetler başlatılmalı ve en az 6 ay içinde tamamlanmalıdır.</td>
                </tr>
                <tr className="bg-orange-100">
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Ciddi</td>
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>15,16,20</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Rsikleri düşürmek için gerekli faaliyetler kısa zamanda (bir kaç hafta) başlatılmalıdır. Risk faaliyetin durdurulmasını gerektirecek kadar büyük değilse çalışmalar kontrollü olarak yetkili kişilerce yönetilmelidir.</td>
                </tr>
                <tr className="bg-red-100 text-red-900">
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Kabul Edilemez</td>
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>25</td>
                  <td className="border border-black p-1 font-semibold" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Risk Kabul edilebilir seviyeye düşürülünceye kadar iş başlatılmamalı, devam eden faaliyet varsa hemen durdurulmalıdır. Gerçekleştireln faaliyetlere ragmen risk düşürülemiyorsa, faaliyet engellenmelidir.</td>
                </tr>
              </tbody>
            </table>
          )}

          {method === 'FINE_KINNEY' && (
            <table className="w-full border-collapse border border-black" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-black p-1 w-24 text-center" style={{ verticalAlign: cellVAlign }}>Risk Değeri (R)</th>
                  <th className="border border-black p-1 w-36 text-center" style={{ verticalAlign: cellVAlign }}>Risk Düzeyi</th>
                  <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Aksiyon ve Karar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>0 - 20</td>
                  <td className="border border-black font-bold p-1 text-green-900" style={{ verticalAlign: cellVAlign }}>Kabul Edilebilir Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri ortadan kaldırmak için ilave kontrole ihtiyaç yoktur, mevcut durum sürdürülür.</td>
                </tr>
                <tr className="bg-yellow-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>20 - 70</td>
                  <td className="border border-black font-bold p-1 text-yellow-900" style={{ verticalAlign: cellVAlign }}>Olası Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Gözetim altında tutulmalı, standart işletme prosedürleri ile kontrol edilmelidir.</td>
                </tr>
                <tr className="bg-amber-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>70 - 200</td>
                  <td className="border border-black font-bold p-1 text-amber-900" style={{ verticalAlign: cellVAlign }}>Önemli Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri düşürmek için gerekli faaliyetler planlanmalı ve en az 3-6 ay içinde tamamlanmalıdır.</td>
                </tr>
                <tr className="bg-orange-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>200 - 400</td>
                  <td className="border border-black font-bold p-1 text-orange-900" style={{ verticalAlign: cellVAlign }}>Esaslı Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri düşürmek için kısa zamanda (birkaç hafta) acil eylem planı başlatılmalıdır. Kontrollü çalışma şarttır.</td>
                </tr>
                <tr className="bg-red-100 text-red-900">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>400 +</td>
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Tolerans Gösterilemez</td>
                  <td className="border border-black p-1 font-semibold" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Risk kabul edilebilir seviyeye indirilene kadar faaliyet durdurulmalı, derhal acil tedbirler alınmalıdır.</td>
                </tr>
              </tbody>
            </table>
          )}

          {method === 'FMEA' && (
            <table className="w-full border-collapse border border-black" style={{ fontSize: smallFont, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <thead>
                <tr className="bg-purple-700 text-white">
                  <th className="border border-black p-1 w-24 text-center" style={{ verticalAlign: cellVAlign }}>RPN Skoru</th>
                  <th className="border border-black p-1 w-36 text-center" style={{ verticalAlign: cellVAlign }}>Risk Düzeyi</th>
                  <th className="border border-black p-1 text-center" style={{ verticalAlign: cellVAlign }}>Aksiyon ve Karar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>0 - 40</td>
                  <td className="border border-black font-bold p-1 text-green-900" style={{ verticalAlign: cellVAlign }}>Düşük Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Kabul edilebilir seviye. İlave kontrole ihtiyaç olmayabilir, rutin kontroller sürdürülür.</td>
                </tr>
                <tr className="bg-yellow-100">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>40 - 100</td>
                  <td className="border border-black font-bold p-1 text-yellow-900" style={{ verticalAlign: cellVAlign }}>Orta Risk</td>
                  <td className="border border-black p-1" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Riskleri düşürmek için gerekli faaliyetler başlatılmalı ve belirlenen takvimde tamamlanmalıdır.</td>
                </tr>
                <tr className="bg-red-100 text-red-900">
                  <td className="border border-black text-center font-bold p-1" style={{ verticalAlign: cellVAlign }}>100 +</td>
                  <td className="border border-black font-bold p-1" style={{ verticalAlign: cellVAlign }}>Yüksek Risk</td>
                  <td className="border border-black p-1 font-semibold" style={{ verticalAlign: cellVAlign, textAlign: cellTAlign }}>Kritik risk seviyesi. Derhal acil aksiyon planlanmalı, risk kabul edilebilir seviyeye indirilmeden işe devam edilmemelidir.</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )
    },

    // --- GRUP 6: 6. ÖNLEMLER VE ÖNCELİKLER ---
    {
      id: 'b23_onlemler_giris',
      group: 6,
      basePt: 40,
      render: () => (
        <div key="b23_onlemler_giris" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold bg-gray-100 border border-black px-1.5 py-0.5 mb-1 uppercase tracking-wide" style={{ fontSize: subTitleFont }}>
            6. ÖNLEMLERİN DEĞERLENDİRİLMESİ
          </div>
          <p className="text-justify mb-1.5" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Belirlenen öncelik derecesine ve işverenin ayırabileceği kaynaklara göre, riskler arasında öncelikli görülenlerin değerlendirilmesi aşağıda verilen yöntem doğrultusunda kararlaştırılır
          </p>
        </div>
      )
    },
    {
      id: 'b24_birinci_oncelik',
      group: 6,
      basePt: 105,
      render: () => (
        <div key="b24_birinci_oncelik" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-red-900 mb-0.5" style={{ fontSize: bodyFont }}>6.1. Birinci Öncelikli Tehlikeler</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            {method === 'FINE_KINNEY'
              ? 'Değerlendirme sonucunda 400 ve üzeri puan alan riskler.'
              : method === 'FMEA'
              ? 'Değerlendirme sonucunda 100 ve üzeri RPN alan riskler.'
              : 'Değerlendirme sonucunda 25 puan alan riskler.'} Önlemler ivedi olarak alınmalı gerekiyorsa faaliyet durdurulmalıdır. Risk kontrol altına alındığı takdirde faaliyete devam edilebilir. Yapılması planlanan faaliyetler:
          </p>
          <div className="space-y-0.5 pl-3" style={{ fontSize: tinyFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b25_ikinci_oncelik',
      group: 6,
      basePt: 105,
      render: () => (
        <div key="b25_ikinci_oncelik" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-orange-900 mb-0.5" style={{ fontSize: bodyFont }}>6.2. İkinci Öncelikli Tehlikeler</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            {method === 'FINE_KINNEY'
              ? 'Değerlendirme sonucunda 200 ile 400 arası puan alan riskler.'
              : method === 'FMEA'
              ? 'Değerlendirme sonucunda 70 ile 100 arası RPN alan riskler.'
              : 'Değerlendirme sonucunda 15 ile 20 arası/dahil puan alan riskler.'} Risk kontrol altında tutulmalı, sürekli gözlemlenmeli ve önlemler ivedi olarak alınmalıdır. Yapılması planlanan faaliyetler:
          </p>
          <div className="space-y-0.5 pl-3" style={{ fontSize: tinyFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b26_ucuncu_oncelik',
      group: 6,
      basePt: 75,
      render: () => (
        <div key="b26_ucuncu_oncelik" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-yellow-900 mb-0.5" style={{ fontSize: bodyFont }}>6.3. Üçüncü Öncelikli Tehlikeler</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            {method === 'FINE_KINNEY'
              ? 'Değerlendirme sonucunda 70 ile 200 arası puan alan riskler.'
              : method === 'FMEA'
              ? 'Değerlendirme sonucunda 40 ile 70 arası RPN alan riskler.'
              : 'Değerlendirme sonucunda 8 ile 12 arası/dahil puan alan riskler.'} İyileştirici tedbirler planlanmalıdır. Yapılması planlanan faaliyetler:
          </p>
          <div className="space-y-0.5 pl-3" style={{ fontSize: tinyFont, lineHeight: lineHeightVal }}>
            <div>□ İyileştirmeye yönelik düzeltici ve önleyici faaliyetler belirlenir, dökümante eldir, uygulanır ve takip edilir.</div>
            <div>□ Üçüncü öncelikli tedbirlerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi hedeflenir.</div>
            <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
            <div>□ Bu konulardaki tüm uygulamaların belirli periyotlarda denetlenmesi sağlanır, yönetime raporların.</div>
          </div>
        </div>
      )
    },
    {
      id: 'b27_dorduncu_oncelik',
      group: 6,
      basePt: 65,
      render: () => (
        <div key="b27_dorduncu_oncelik" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-blue-900 mb-0.5" style={{ fontSize: bodyFont }}>6.4. Dördüncü Öncelikli Tehlikeler</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            {method === 'FINE_KINNEY'
              ? 'Değerlendirme sonucunda 20 ile 70 arası puan alan riskler.'
              : method === 'FMEA'
              ? 'Değerlendirme sonucunda 20 ile 40 arası RPN alan riskler.'
              : 'Değerlendirme sonucunda 2 ile 6 arası/dahil puan alan riskler.'} Alınan önlemler gerektiğinde kontrol edilmelidir. Yapılması planlanan faaliyetler:
          </p>
          <div className="space-y-0.5 pl-3" style={{ fontSize: tinyFont, lineHeight: lineHeightVal }}>
            <div>□ Önlemler, planlanan uygulamalar kısmında tarif edilir ve uygulama kontrolleri yapılır.</div>
            <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
            <div>□ Dördüncü öncelikli tehlikelerin, kontroller sonucu kabul edilebilir sınırlara indirilmesi hedeflenir.</div>
          </div>
        </div>
      )
    },
    {
      id: 'b28_besinci_oncelik',
      group: 6,
      basePt: 65,
      render: () => (
        <div key="b28_besinci_oncelik" className="mb-1.5" style={{ breakInside: 'avoid' }}>
          <div className="font-bold text-green-900 mb-0.5" style={{ fontSize: bodyFont }}>6.5. Beşinci Öncelikli Tehlikeler</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            {method === 'FINE_KINNEY'
              ? 'Değerlendirme sonucunda 0 ile 20 arası puan alan riskler.'
              : method === 'FMEA'
              ? 'Değerlendirme sonucunda 1 ile 20 arası RPN alan riskler.'
              : 'Değerlendirme sonucunda 1 puan alan riskler.'} Alınan önlemler gerektiğinde kontrol edilmelidir. Yapılması planlanan faaliyetler:
          </p>
          <div className="space-y-0.5 pl-3" style={{ fontSize: tinyFont, lineHeight: lineHeightVal }}>
            <div>□ Gelecekte önemli bir tehlike oluşturulmaması için, incelenir ve gerekirse önlemler planlanan uygulamalar kısmında tarif edilir.</div>
            <div>□ Uygulama kontrolleri yapılır.</div>
            <div>□ Personele, ihtiyaç duyulan eğitimler verilir.</div>
          </div>
        </div>
      )
    },
    {
      id: 'b29_not',
      group: 6,
      basePt: 50,
      render: () => (
        <div key="b29_not" className="border border-gray-400 p-1.5 bg-gray-50 text-justify mt-1" style={{ breakInside: 'avoid', fontSize: tinyFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
          <b>NOT:</b> Olasılığı çok küçük fakat ölüm, uzuv kaybı, meslek hastalığı veya sürekli iş göremezlik ile sonuçlanabilecek durumlar için risk seviyesi kabul edilebilir seviye altına alınamıyorsa, alınan kontrol önlemleri belirli aralıklarla kontrol edilerek gözetim altında tutulmalıdır.
        </div>
      )
    },

    // --- GRUP 7: 6.6 HİYERARŞİ, 6.7 YENİDEN DEĞERLENDİRME, 7, 8, 9 ---
    {
      id: 'b30_hiyerarsi',
      group: 7,
      basePt: 150,
      render: () => (
        <div key="b30_hiyerarsi" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>6.6. Kontrol Tedbirlerinin Belirlenmesi ve Hiyerarşi</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Belirlenen tehlikeler ve sebep olacağı risklerin azaltılmasına veya kontrol altına alınmasına yönelik önleyici faaliyetler planlanır. Önlemlerin yerine getirilmesi ile ilgili olarak, sorumlu/sorumlular ve önlemin yerine getirileceği süre belirlenir.
          </p>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Tehlikenin ve riskin tamamen ortadan kaldırılması mümkün olmasa da, tehlikenin ve riskin azaltılması, uygulanan kontrol sistemleri ile sağlanabilir. Kontroller belirlenirken veya mevcut kontroller üzerinde değişiklik yapma planlanırken aşağıdaki hiyerarşiye uygun olarak risklerin azaltılması düşünülür.
          </p>
          <div className="space-y-0.5 pl-4 border-l-2 border-black" style={{ fontSize: smallFont, lineHeight: lineHeightVal }}>
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
      )
    },
    {
      id: 'b31_duzeltilme',
      group: 7,
      basePt: 120,
      render: () => (
        <div key="b31_duzeltilme" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-1" style={{ fontSize: subTitleFont }}>6.7. Önlemlerin Düzeltilme Durumu ve Riskin Yeniden Değerlendirilmesi</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Planlanan faaliyetlerin düzeltilip düzeltilmediği kontrol edilir. Planlanan faaliyetin düzeltilmeme durumunda neden düzeltilemediği değerlendirilir. Değerlendirme sonucuna göre yeni bir faaliyet planlanır ya da faaliyetin gerçekleştirilmesi için neler yapılması gerektiği araştırılır. Konuya ilişkin üst yönetim kararı gereken noktalarda üst yönetime danışılır.
          </p>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Önemli riskler için hedefler oluşturulur. Konu gerektiğinde İş Sağlığı ve Güvenliği Kurulu’na taşınır. Kurul son kararı verebilir. Alınan önlemler doğrultusunda düzeltilen riskler madde 5.8’e göre yeniden değerlendirilmeye alınır. Bu şekilde risklerin ne düzeyde indirgenebildiği hesaplanmış ve yeni öncelik dereceleri tespit edilmiş olur. Riskler kabul edilebilir sınırlara çekilmeye çalışılır. Kabul edilebilir sınırlara çekilemeyen riskler için hedefler oluşturulur. Riskler yeniden faaliyet planlamasına alınır.
          </p>
          <p className="text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Bu aşamaya kadar olan tüm çalışmalar “Risk analizi ve Risk Değerlendirme Formu”na işlenir ve bu form ile takip edilir.
          </p>
        </div>
      )
    },
    {
      id: 'b32_diger_hukumler',
      group: 7,
      basePt: 45,
      render: () => (
        <div key="b32_diger_hukumler" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>7. DİĞER HÜKÜMLER</div>
          <p className="text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Belirlenen tehlikeler, riskler, bunların öncelik dereceleri, önemli riskler ve bunlara göre oluşturulan uygulama ve kontrol sonuçları, işveren/işveren vekili tarafından gözden geçirilir. İş Sağlığı ve Güvenliği Kurulu tarafından, kurulun olmadığı kuruluşlarda ise işveren/işveren vekili tarafından onaylanır.
          </p>
        </div>
      )
    },
    {
      id: 'b33_sonuc',
      group: 7,
      basePt: 130,
      render: () => (
        <div key="b33_sonuc" className="mb-2" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>8. SONUÇ</div>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            <b>Yapılan Bu Risk Değerlendirmesi:</b><br />
            Riskin algılanmasını sağlamak, bu konuda tüm paydaşların ortak algısını oluşturmak ve risklerin kontrollünü sağlayabilmek amacıyla hazırlanmıştır.
          </p>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Bu raporun değerlendirilmesi, yapılacak çalışmaların yönlendirilmesi, ilgili birimlerle işbirliğinin sağlanması, İş Sağlığı ve Güvenliği Kurulunda çözüm önerilerinin değerlendirilmesi, işyeri hekimince meslek hastalıklarının da risk kontrolü yöntemi ile değerlendirilmesi ve sonuçlandırılması işveren/işveren vekilinin görevidir.
          </p>
          <p className="text-justify mb-1" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Kontrolü ve değerlendirilmesi yapılmamış bir risk analiz raporu, işveren tarafından teşhisi konulmuş tedavisi yapılmamış bir hastalık gibi kabul edilmelidir.
          </p>
          <p className="text-justify" style={{ fontSize: smallFont, lineHeight: lineHeightVal, textAlign: cellTAlign }}>
            Çalışanları açısından daha güvenli, sağlıklı ve verimli bir çalışma ortamı oluşmasında katkı sağlamasını arzu eder, çalışanlarının yaklaşımından dolayı teşekkür ederiz.
          </p>
        </div>
      )
    },
    {
      id: 'b34_ekler',
      group: 7,
      basePt: 30,
      render: () => (
        <div key="b34_ekler" className="mb-1" style={{ breakInside: 'avoid' }}>
          <div className="font-bold mb-0.5" style={{ fontSize: subTitleFont }}>9. EKLER</div>
          <div className="font-bold pl-2" style={{ fontSize: smallFont }}>9.1 Risk Değerlendirmesi Analiz Sonuçları</div>
        </div>
      )
    }
  ];

  // ── AKILLI SAYFALAMA VE DAĞITIM MOTORU (SMART SPILL-OVER & PAGINATION) ──
  // A4 yüksekliği: 842 pt (~297mm).
  // Header: ~75 pt
  // Footer: compact (~45 pt), standard (~75 pt), hide (0 pt)
  // Padding: padMm * 2.835 * 2
  const footerHeightPt = signatureStyle === 'hide' ? 0 : (signatureStyle === 'standard' ? 75 : 45);
  const paddingPt = padMm * 2.835 * 2;
  const PAGE_CAPACITY_PT = Math.max(300, 842 - 75 - footerHeightPt - paddingPt);

  // Blokları sayfalara dağıt:
  // Her grup (1-7) doğal bir sayfa olarak başlar. Eğer o gruptaki blokların toplam boyutu
  // PAGE_CAPACITY_PT'yi aşarsa (yazı boyutu veya satır aralığı büyütülmüşse),
  // taşan bloklar sıralama bozulmadan ve tablolar/paragraflar yarıdan kesilmeden
  // bir sonraki sayfaya aktarılır (spill-over).
  const pages = [];
  let currentPageBlocks = [];
  let currentAccumulatedPt = 0;
  let currentGroup = 1;

  blocks.forEach((block) => {
    const blockActualPt = block.basePt * fontScale * (lineHeightVal / 1.2);

    // Yeni grup başlangıcı mı? (Standart 7 sayfa yerleşimi)
    const isNewGroup = block.group !== currentGroup;

    if (isNewGroup) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentAccumulatedPt = 0;
      }
      currentGroup = block.group;
    }

    // Blok mevcut sayfaya sığıyor mu?
    if (currentAccumulatedPt + blockActualPt <= PAGE_CAPACITY_PT || currentPageBlocks.length === 0) {
      currentPageBlocks.push(block);
      currentAccumulatedPt += blockActualPt;
    } else {
      // Sığmıyor: Bu bloğu bölmeden BİR SONRAKİ SAYFAYA AKTAR (spill-over)
      pages.push(currentPageBlocks);
      currentPageBlocks = [block];
      currentAccumulatedPt = blockActualPt;
    }
  });

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks);
  }

  const totalPages = Math.max(7, pages.length);

  const renderPageHeader = (pageNum) => (
    <table className="w-full border-collapse border border-black mb-3 text-xs header-table" style={{ breakInside: 'avoid' }}>
      <tbody>
        <tr>
          <td rowSpan="5" className="border border-black w-[15%] text-center p-1 bg-white" style={{ verticalAlign: 'middle' }}>
            {company.info.logo ? (
              <img src={company.info.logo} className="max-h-12 max-w-[90px] mx-auto object-contain" alt="logo" />
            ) : (
              <div className="font-bold text-[10px] text-gray-500 uppercase">{company.name || 'LOGO'}</div>
            )}
          </td>
          <td rowSpan="5" className="border border-black w-[55%] text-center font-bold text-[14px] tracking-wide bg-white" style={{ verticalAlign: 'middle' }}>
            Risk Değerlendirme Prosedürü
          </td>
          <td className="border border-black font-semibold bg-gray-50 p-1 w-[18%] text-[8.5px] leading-tight" style={{ verticalAlign: 'middle' }}>Yayın Tarihi</td>
          <td className="border border-black p-1 text-[8.5px] text-center w-[12%] leading-tight" style={{ verticalAlign: 'middle' }}>{formattedDate}</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[8.5px] leading-tight" style={{ verticalAlign: 'middle' }}>Döküman No</td>
          <td className="border border-black p-1 text-[8.5px] text-center leading-tight" style={{ verticalAlign: 'middle' }}>RDP-01</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[8.5px] leading-tight" style={{ verticalAlign: 'middle' }}>Revizyon Tarihi</td>
          <td className="border border-black p-1 text-[8.5px] text-center leading-tight" style={{ verticalAlign: 'middle' }}>{formattedDate}</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[8.5px] leading-tight" style={{ verticalAlign: 'middle' }}>Revizyon No</td>
          <td className="border border-black p-1 text-[8.5px] text-center leading-tight" style={{ verticalAlign: 'middle' }}>00</td>
        </tr>
        <tr>
          <td className="border border-black font-semibold bg-gray-50 p-1 text-[8.5px] leading-tight" style={{ verticalAlign: 'middle' }}>Sayfa No</td>
          <td className="border border-black p-1 text-[8.5px] text-center font-bold leading-tight" style={{ verticalAlign: 'middle' }}>{pageNum}/{totalPages}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPageFooter = () => {
    if (signatureStyle === 'hide') return null;

    if (signatureStyle === 'standard') {
      return (
        <div className="w-full border-t border-black pt-2 mt-auto" style={{ breakInside: 'avoid' }}>
          <div className="text-[7.5px] font-bold uppercase bg-gray-100 py-0.5 border border-black mb-1 text-center">
            Risk Değerlendirme Ekibi İmzaları
          </div>
          <table className="w-full border-collapse border border-black text-center" style={{ tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                {sigMembers.map((m, idx) => (
                  <td key={idx} className="border border-black p-1 bg-white" style={{ verticalAlign: 'top', height: '55px' }}>
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="font-bold text-[7px] uppercase bg-gray-50 border-b border-gray-200 pb-0.5">{m.role}</div>
                        <div className="font-bold text-[8px] mt-1">{m.name}</div>
                        {m.cert ? <div className="text-[7px] text-gray-500 font-semibold">{m.cert}</div> : null}
                      </div>
                      <div className="border-t border-dashed border-gray-400 pt-0.5 text-[7px] text-gray-400">İmza</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Default: 'compact'
    return (
      <div className="w-full border-t border-black pt-1.5 mt-auto" style={{ breakInside: 'avoid' }}>
        <div className="grid grid-cols-5 gap-1 text-center">
          {sigMembers.map((m, idx) => (
            <div key={idx} className="flex flex-col justify-start px-0.5">
              <div className="font-bold text-[8px] uppercase text-black leading-tight mb-0.5">{m.name}</div>
              <div className="text-[7.5px] text-gray-800 leading-tight font-medium">{m.role}</div>
              {m.cert ? <div className="text-[7px] text-gray-600 leading-tight mt-0.5">{m.cert}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[210mm] min-w-[210mm] mx-auto no-print-shadows">
      {pages.map((pageBlockList, pIdx) => (
        <div
          key={pIdx}
          contentEditable
          suppressContentEditableWarning
          className="procedure-page w-[210mm] min-w-[210mm] h-[297mm] min-h-[297mm] bg-white mx-auto text-black font-sans shadow-lg mb-6 flex flex-col justify-between box-border"
          style={{
            padding: reportPadding,
            pageBreakAfter: 'always',
            breakAfter: 'page',
            overflow: 'hidden'
          }}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {renderPageHeader(pIdx + 1)}
            <div className="flex-1 flex flex-col">
              {pageBlockList.map(b => b.render())}
            </div>
          </div>

          {renderPageFooter()}
        </div>
      ))}
    </div>
  );
};`;

// Replace ProcedurePreview
const startMarker = 'const ProcedurePreview = ({';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find ProcedurePreview start marker');
  process.exit(1);
}

const endMarker = '// --- GÜNCELLENMİŞ SAHA ZİYARET EDİTÖRÜ';
const endIdx = content.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  console.error('Could not find ProcedurePreview end marker');
  process.exit(1);
}

content = content.substring(0, startIdx) + newProcedureComponent + '\n\n' + content.substring(endIdx);

// 2. Enable toolbar controls for prosedur in AdvancedReportModal
// Replace kenar boslugu, satir araligi, imza alani condition
const targetCondition = "{(reportType === 'acil-durum' || reportType === 'web') && (";
const replacementCondition = "{(reportType === 'acil-durum' || reportType === 'web' || reportType === 'prosedur') && (";

content = content.split(targetCondition).join(replacementCondition);

// 3. Connect ProcedurePreview call with all props
const oldCall = '{reportType === \'prosedur\' && assessmentData && (\n              <ProcedurePreview company={company} assessment={assessmentData} />\n            )}';
const newCall = `{reportType === 'prosedur' && assessmentData && (
              <ProcedurePreview
                company={company}
                assessment={assessmentData}
                reportFontSize={reportFontSize}
                reportPadding={reportPadding}
                reportLineHeight={reportLineHeight}
                signatureStyle={signatureStyle}
                tableVerticalAlign={tableVerticalAlign}
                tableTextAlign={tableTextAlign}
              />
            )}`;

if (content.includes(oldCall)) {
  content = content.replace(oldCall, newCall);
  console.log('Updated ProcedurePreview props call.');
} else {
  // Try regex replace
  const callRegex = /\{reportType === 'prosedur' && assessmentData && \(\s*<ProcedurePreview[^/]*\/>\s*\)\}/;
  if (callRegex.test(content)) {
    content = content.replace(callRegex, newCall);
    console.log('Updated ProcedurePreview props call via regex.');
  }
}

// 4. Update A4 Akıllı Dağıt button in toolbar
const oldSmartButton = "{(reportType === 'ziyaret' || reportType === 'web') && (\n              <button\n                type=\"button\"\n                onClick={handleSmartAutoPack}";
const newSmartButton = `{(reportType === 'ziyaret' || reportType === 'web' || reportType === 'prosedur') && (
              <button
                type="button"
                onClick={() => {
                  if (reportType === 'prosedur') {
                    setReportFontSize('7.5pt');
                    setReportLineHeight('1.2');
                    setReportPadding('8mm');
                    setSignatureStyle('compact');
                    setTableVerticalAlign('middle');
                    setTableTextAlign('left');
                  } else {
                    handleSmartAutoPack();
                  }
                }}`;

if (content.includes(oldSmartButton)) {
  content = content.replace(oldSmartButton, newSmartButton);
  console.log('Updated smart auto pack button for prosedur.');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully patched App.jsx with advanced procedure reporting features!');
