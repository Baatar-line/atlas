/* Builds public/assets/empire-dossiers.json — the three cards shown down the
 * right of /globe when exactly one of the 25 largest empires is lit:
 *
 *   1. the empire's seat of power   2. the ruler who made it that big
 *   3. a few facts worth stopping on
 *
 * Photographs come from the Wikipedia API rather than being pasted in by hand.
 * A hand-written commons URL is a guess that 404s silently months later; asking
 * the API for a page's lead image gets whatever is actually on that article
 * today, and the run fails loudly if a subject has no image at all.
 *
 * Names and facts are the one part not taken from the API. The extract endpoint
 * returns an English encyclopaedia paragraph, and this UI wants a Mongolian
 * line short enough for a card — so the display text is curated below and the
 * API supplies the picture. `blurb` is the fallback if a curated line is ever
 * dropped: the first sentence of the article, trimmed.
 *
 * Run: node scripts/build-empire-dossiers.mjs [--check]
 *   --check  fetch and report, write nothing
 */
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'public/assets/empire-dossiers.json');
const API = 'https://en.wikipedia.org/w/api.php';
const CHECK_ONLY = process.argv.includes('--check');

// `page` is an English Wikipedia title — redirects are followed by the API, so
// "Queen Victoria" resolving to "Victoria" is fine. Everything else on the card
// is written here, because it has to fit a card and read as Mongolian.
//
// The ruler is the one who took the ground, which is not always the one reigning
// in the peak year the readout prints: the British peak is 1920 but the empire
// is Victoria's, and the Mongol peak spans Kublai while the conquest is
// Genghis's. Each card carries the reign years so the two dates can't be
// confused for each other.
const SUBJECTS = {
  british: {
    capital: { page: 'London', mn: 'Лондон', en: 'London' },
    ruler: { page: 'Queen Victoria', mn: 'Виктория хатан хаан', en: 'Queen Victoria', reign: '1837–1901' },
    facts: [
      { mn: 'Оргил үедээ дэлхийн хуурай газрын дөрөвний нэгийг, хүн амын дөрөвний нэгийг захирч байсан — түүхэн дэх хамгийн том эзэнт гүрэн.', en: 'At its peak it held about a quarter of the world\'s land and a quarter of its people — the largest empire in history.' },
      { mn: '«Нар жаргадаггүй эзэнт гүрэн» гэдэг нэр нь яруу үг биш: газар нутаг нь бүх цагийн бүсэд тархсан тул үргэлж хаа нэгтээ нь өдөр байв.', en: 'The phrase "the empire on which the sun never sets" was literal: its territories spanned every time zone, so it was always daytime somewhere in it.' },
      { mn: 'Дэлхийн цагийн эхлэл Гринвичээр тогтсон нь тэнгисийн ноёрхлын үр дүн — далайн замын зураглалыг Британи хийж байсан учир 1884 онд Гринвичийг 0 градус болгожээ.', en: 'World time starts at Greenwich because of that naval reach — British charts dominated navigation, so in 1884 Greenwich was fixed as zero longitude.' },
    ],
  },
  mongol: {
    capital: { page: 'Karakorum', mn: 'Хархорум', en: 'Karakorum' },
    ruler: { page: 'Genghis Khan', mn: 'Чингис хаан', en: 'Genghis Khan', reign: '1206–1227' },
    facts: [
      { mn: 'Түүхэн дэх хамгийн том залгаа газар нутагтай эзэнт гүрэн — Британиас талбайгаар бага ч, тасалдалгүй нэг бүхэл нутаг байсан нь давтагдаагүй.', en: 'The largest contiguous land empire ever — smaller than Britain\'s in total area, but a single unbroken landmass, which nothing has matched.' },
      { mn: 'Хубилай хаан цаасан мөнгийг (Чао) улс даяар цорын ганц хууль ёсны төлбөрийн хэрэгсэл болгосон. Мөнгө, торгоор баталгаажсан цаас — Европ үүнийг Марко Пологийн тэмдэглэлээр дамжуулж мэдсэн.', en: 'Kublai Khan made paper money (chao) the sole legal tender across the realm — paper backed by silver and silk, which Europe first heard of through Marco Polo.' },
      { mn: 'Өртөөний сүлжээ: тогтсон зайд байрлах бэлэн морьтой өртөөнүүдээр захидал өдөрт 300 гаруй км туулдаг байв. Энэ хурдыг Европ 19-р зууны төмөр зам хүртэл давж чадаагүй.', en: 'The yam relay: stations kept fresh horses at fixed intervals, moving a message over 300 km a day — a speed Europe did not beat until railways in the 1800s.' },
    ],
  },
  russian: {
    capital: { page: 'Saint Petersburg', mn: 'Санкт-Петербург', en: 'Saint Petersburg' },
    ruler: { page: 'Catherine the Great', mn: 'II Екатерина хатан хаан', en: 'Catherine the Great', reign: '1762–1796' },
    facts: [
      { mn: 'Сибирийг туулсан тэлэлт нь голдуу үслэг ангийн наймааны араас явсан — булганы үс тэр үед үнэт металлтай зэрэгцэх өртөгтэй байв.', en: 'The push across Siberia followed the fur trade — sable pelts were then priced alongside precious metals.' },
      { mn: '1867 онд Аляскийг АНУ-д 7.2 сая доллараар зарсан. Га тутам нь 2 центээс арай илүү — өнөөгийн мөнгөөр ч дэлхийн хамгийн хямд газрын наймааны нэг хэвээр.', en: 'In 1867 it sold Alaska to the United States for $7.2 million — about two cents an acre, still one of the cheapest land deals ever made.' },
      { mn: 'Транссибирийн төмөр зам 9,289 км — өнөөг хүртэл дэлхийн хамгийн урт төмөр замын шугам, нэг эзэнт гүрний дотор баригдсан.', en: 'The Trans-Siberian Railway runs 9,289 km — still the longest railway line in the world, built inside a single empire.' },
    ],
  },
  qing: {
    capital: { page: 'Beijing', mn: 'Бээжин', en: 'Beijing' },
    ruler: { page: 'Qianlong Emperor', mn: 'Тэнгэрийн тэтгэсэн хаан (Цяньлун)', en: 'Qianlong Emperor', reign: '1735–1796' },
    facts: [
      { mn: 'Манж гаралтай хаант улс Хятадыг захирсан ч монгол, түвэд, уйгур нутгийг тусад нь, өөр өөр журмаар удирдаж байв.', en: 'A Manchu dynasty ruling China, it governed Mongol, Tibetan and Uyghur lands separately, each under its own set of rules.' },
      { mn: '18-р зуунд дэлхийн эдийн засгийн бараг гуравны нэгийг дангаараа бүрдүүлж байсан гэж түүхэн тооцоолол хэлдэг.', en: 'Historical estimates put it at nearly a third of the world economy on its own in the 1700s.' },
      { mn: 'Цяньлун хааны захиалгаар эмхэтгэсэн «Сыку цюаньшу» цуглуулга 36 мянга гаруй боть — цаасан дээрх хамгийн том эмхэтгэлийн нэг.', en: 'The Siku Quanshu compiled at Qianlong\'s order ran to over 36,000 volumes — one of the largest collections ever put on paper.' },
    ],
  },
  spanish: {
    capital: { page: 'Madrid', mn: 'Мадрид', en: 'Madrid' },
    ruler: { page: 'Philip II of Spain', mn: 'II Филипп хаан', en: 'Philip II', reign: '1556–1598' },
    facts: [
      { mn: 'Потосигийн мөнгөний уурхай (одоогийн Боливи) эзэнт гүрнийг санхүүжүүлж, зуун жилийн турш дэлхийн мөнгөний ихэнхийг өгч байв.', en: 'The silver mountain at Potosí (in today\'s Bolivia) bankrolled the empire, supplying much of the world\'s silver for a century.' },
      { mn: 'Тэр мөнгө Манилаар дамжин Хятад руу урсаж, түүхэн дэх анхны жинхэнэ дэлхийн худалдааны сүлжээг үүсгэсэн.', en: 'That silver flowed through Manila to China, creating what is often called the first genuinely global trade network.' },
      { mn: 'Испани хэл өнөөдөр 20 гаруй улсын албан ёсны хэл — эзэнт гүрний хамгийн урт насалсан ул мөр.', en: 'Spanish is now official in more than twenty countries — the empire\'s longest-lasting trace.' },
    ],
  },
  french: {
    capital: { page: 'Paris', mn: 'Парис', en: 'Paris' },
    ruler: { page: 'Jules Ferry', mn: 'Жюль Ферри', en: 'Jules Ferry', reign: '1880–1885' },
    facts: [
      { mn: 'Хоёр дахь колончлолын гүрэн: эхнийхийг нь алдсаны дараа 19-р зуунд Африк, Индохинад дахин байгуулагдсан.', en: 'The second colonial empire: rebuilt in the 1800s across Africa and Indochina after the first one was lost.' },
      { mn: 'Оргил үедээ Францын нутаг дэвсгэрийн 20 дахин том газрыг эзэмшиж байв.', en: 'At its height it held territory around twenty times the size of France itself.' },
      { mn: 'Франц хэл өнөөдөр таван тивийн 29 улсын албан ёсны хэл хэвээр.', en: 'French remains official in 29 countries across five continents.' },
    ],
  },
  umayyad: {
    capital: { page: 'Damascus', mn: 'Дамаск', en: 'Damascus' },
    ruler: { page: 'Al-Walid I', mn: 'I Аль-Валид халиф', en: 'Al-Walid I', reign: '705–715' },
    facts: [
      { mn: 'Зөвхөн зуун жилийн дотор Испаниас Инд мөрөн хүртэл тэлсэн — түүхэн дэх хамгийн хурдан тэлэлтүүдийн нэг.', en: 'It stretched from Spain to the Indus in under a century — one of the fastest expansions in history.' },
      { mn: 'Араб хэлийг захиргааны нэгдсэн хэл болгосон нь Дундад Дорнодын хэл шинжлэлийн зургийг өнөөг хүртэл тодорхойлж байна.', en: 'Making Arabic the single language of administration shaped the linguistic map of the Middle East to this day.' },
      { mn: 'Дамаскийн Их сүм нь тухайн үедээ дэлхийн хамгийн өндөр өртөгтэй барилгуудын нэг байсан гэдэг.', en: 'The Great Mosque of Damascus was said to be among the most expensive buildings in the world at the time.' },
    ],
  },
  abbasid: {
    capital: { page: 'Baghdad', mn: 'Багдад', en: 'Baghdad' },
    ruler: { page: 'Harun al-Rashid', mn: 'Харун аль-Рашид халиф', en: 'Harun al-Rashid', reign: '786–809' },
    facts: [
      { mn: 'Багдадын «Мэргэн ухааны өргөө» нь Грек, Перс, Энэтхэгийн зохиолыг араб руу орчуулж, эртний мэдлэгийг үхлээс аварсан.', en: 'Baghdad\'s House of Wisdom translated Greek, Persian and Indian works into Arabic, saving much ancient knowledge from loss.' },
      { mn: 'Тоонуудыг бид «араб тоо» гэж нэрлэдэг ч Энэтхэгээс гаралтай — Аббасидын эрдэмтэд дамжуулж, дэлхийд түгээсэн.', en: 'The digits we call Arabic numerals came from India — Abbasid scholars carried them onward to the world.' },
      { mn: '«Алгоритм» гэдэг үг нь Багдадад ажиллаж байсан математикч аль-Хорезмийн нэрнээс гаралтай.', en: 'The word "algorithm" comes from al-Khwarizmi, a mathematician working in Baghdad.' },
    ],
  },
  yuan: {
    capital: { page: 'Khanbaliq', mn: 'Ханбалиг (Даду)', en: 'Khanbaliq' },
    ruler: { page: 'Kublai Khan', mn: 'Хубилай хаан', en: 'Kublai Khan', reign: '1260–1294' },
    facts: [
      { mn: 'Хятадыг бүхэлд нь захирсан анхны эзэнт гүрэн монгол угсаатны байв.', en: 'The first dynasty to rule all of China was of Mongol origin.' },
      { mn: 'Өнөөгийн Бээжин хотын суурь нь Хубилайн байгуулсан Даду хот — түүний төлөвлөлт өнөөг хүртэл хотын голд харагддаг.', en: 'Modern Beijing sits on Kublai\'s city of Dadu — his plan is still legible in the city\'s core.' },
      { mn: 'Марко Поло энэ ордонд ирж, Европт цаасан мөнгө, нүүрсний тухай ярьж байсан нь итгэмээргүй мэт хүлээж авагдсан.', en: 'Marco Polo came to this court, and his reports of paper money and burning coal were received in Europe as barely credible.' },
    ],
  },
  portuguese: {
    capital: { page: 'Lisbon', mn: 'Лиссабон', en: 'Lisbon' },
    ruler: { page: 'Manuel I of Portugal', mn: 'I Мануэл хаан', en: 'Manuel I', reign: '1495–1521' },
    facts: [
      { mn: 'Европын анхны бөгөөд хамгийн удаан наслсан колончлолын гүрэн — 1415-аас 1999 он хүртэл бараг зургаан зуун жил.', en: 'Europe\'s first and longest-lived colonial empire — nearly six centuries, from 1415 to 1999.' },
      { mn: '1494 оны Тордесильясын гэрээгээр Португал, Испани хоёр дэлхийг газрын зураг дээр шулуун зураасаар хуваасан.', en: 'By the 1494 Treaty of Tordesillas, Portugal and Spain divided the world between them along a line drawn on a map.' },
      { mn: 'Васко да Гамагийн Энэтхэг рүү хийсэн далайн аялал амжилттай болсноор амтлагчийн худалдаа Европын гарт орсон.', en: 'Vasco da Gama\'s sea route to India put the spice trade in European hands.' },
    ],
  },
  turk: {
    // Ötüken itself has no article photograph — it is a sacred region rather
    // than a dug site — so the seat is shown as the valley it stood in.
    capital: { page: 'Orkhon Valley Cultural Landscape', mn: 'Өтүкэн — Орхоны хөндий', en: 'Ötüken — Orkhon Valley' },
    // No likeness of Muqan exists, and the Orkhon statues are of other men, so
    // this card runs without a picture rather than passing one of them off as him.
    ruler: { page: 'Muqan Qaghan', mn: 'Мухан хаган', en: 'Muqan Qaghan', reign: '553–572' },
    facts: [
      { mn: 'Манж нутгаас Хар тэнгис хүртэл Торгоны замыг бүхэлд нь хяналтдаа авсан анхны нүүдэлчин гүрэн.', en: 'The first steppe power to control the whole Silk Road, from Manchuria to the Black Sea.' },
      { mn: 'Орхоны бичээс бол түрэг хэлээр бичигдсэн хамгийн эртний уншигдах дурсгал — Монголын нутагт өнөөг хүртэл зогсож байна.', en: 'The Orkhon inscriptions are the oldest readable texts in a Turkic language, and still stand in Mongolia.' },
      { mn: '«Түрэг» гэдэг нэр өнөөдрийн Турк, Түркмен, Узбек зэрэг олон улсын нэрийн үндэс болсон.', en: 'The name "Türk" is the root of the names of Turkey, Turkmenistan, Uzbekistan and more.' },
    ],
  },
  xiongnu: {
    // Longcheng's site is still argued over and has no photograph; Ivolga is a
    // Xiongnu town that has been excavated, so the card says which it is showing.
    capital: { page: 'Ivolginsky District', mn: 'Луут хот (Лунчэн)', en: 'Longcheng', photo: { mn: 'Зураг: Иволгагийн Хүннү хот суурин', en: 'Pictured: the excavated Xiongnu town at Ivolga' } },
    // No likeness of Modu survives from the 2nd century BC. The article photo is
    // a museum reconstruction of a chieftain of his era, and says so on the card.
    ruler: { page: 'Chanyu', mn: 'Модун шаньюй', en: 'Modu Chanyu', reign: 'МЭӨ 209–174', photo: { mn: 'Зураг: тэр үеийн Хүннү ноёны сэргээн зураг', en: 'Pictured: a reconstruction of a Xiongnu chief of that era' } },
    facts: [
      { mn: 'Монголын нутагт байгуулагдсан анхны нүүдэлчдийн эзэнт гүрэн — Чингисээс 1400 жилийн өмнө.', en: 'The first nomadic empire founded on the Mongolian plateau — fourteen centuries before Genghis.' },
      { mn: 'Хятадын Цагаан хэрмийг холбож, бэхжүүлэх болсон шалтгаан нь голчлон Хүннүгийн морин цэрэг байв.', en: 'The Great Wall was joined up and strengthened largely because of Xiongnu cavalry.' },
      { mn: 'Хань улс тэднийг дарж чадалгүй, гүнж өгч, торго, тариа жил бүр илгээж эвлэрдэг байсан — эзэнт гүрэн албан ёсоор алба гувчуур төлж байсан ховор тохиолдол.', en: 'Unable to defeat them, Han China sent princesses, silk and grain every year — a rare case of an empire paying tribute outward.' },
    ],
  },
  brazilian: {
    capital: { page: 'Rio de Janeiro', mn: 'Рио-де-Жанейро', en: 'Rio de Janeiro' },
    ruler: { page: 'Pedro II of Brazil', mn: 'II Педру хаан', en: 'Pedro II', reign: '1831–1889' },
    facts: [
      { mn: 'Америк тивд байгуулагдсан цорын ганц удаан наслсан хаант засаглал.', en: 'The only long-lasting monarchy established in the Americas.' },
      { mn: 'Португалийн хаан Наполеоноос зугтаж Бразил руу нүүсэн нь колони нь эзэнт гүрний нийслэл болсон түүхэн ховор тохиолдол.', en: 'When Portugal\'s court fled Napoleon to Brazil, a colony briefly became the seat of its own empire — a rare inversion.' },
      { mn: 'Бразил бол боолчлолыг Америк тивд хамгийн сүүлд, 1888 онд халсан улс.', en: 'Brazil was the last country in the Americas to abolish slavery, in 1888.' },
    ],
  },
  french1: {
    capital: { page: 'Paris', mn: 'Парис', en: 'Paris' },
    ruler: { page: 'Louis XIV', mn: 'XIV Людовик хаан', en: 'Louis XIV', reign: '1643–1715' },
    facts: [
      { mn: 'Анхны колончлолын гүрэн Хойд Америкийн голуудыг дагаж тэлсэн — Квебекээс Луизиана хүртэл.', en: 'The first colonial empire spread along North America\'s rivers — from Quebec down to Louisiana.' },
      { mn: '1803 онд Луизианаг АНУ-д зарснаар АНУ-ын газар нутаг нэг өдрийн дотор бараг хоёр дахин нэмэгдсэн.', en: 'Selling Louisiana to the United States in 1803 nearly doubled that country\'s territory overnight.' },
      { mn: 'Канадын Квебек муж франц хэлээ өнөөг хүртэл хадгалсан нь энэ гүрний үлдэц.', en: 'Quebec\'s French language today is what remains of it.' },
    ],
  },
  japanese: {
    capital: { page: 'Tokyo', mn: 'Токио', en: 'Tokyo' },
    ruler: { page: 'Hirohito', mn: 'Хирохито (Шоува) эзэн хаан', en: 'Emperor Shōwa (Hirohito)', reign: '1926–1989' },
    facts: [
      { mn: 'Оргил үе нь ердөө хэдхэн сар үргэлжилсэн — 1942 оны эхээр Номхон далайн баруун хэсгийг бараг бүхэлд нь эзэлж байв.', en: 'Its peak lasted only months — in early 1942 it held nearly the whole western Pacific.' },
      { mn: 'Азийн улсуудаас Европын колончлолд бүрэн ороогүй цөөхний нэг байсан бөгөөд өөрөө колончлогч болсон.', en: 'One of the few Asian states never fully colonised by Europe, it became a coloniser itself.' },
      { mn: 'Тэр газар нутгийн ихэнх нь далай байсан тул талбайн тооцоо газар нутгаар нь бол харагдахаас хамаагүй бага.', en: 'Most of that reach was ocean, so its land area is far smaller than the map suggests.' },
    ],
  },
  han: {
    capital: { page: "Chang'an", mn: 'Чанъань', en: "Chang'an" },
    ruler: { page: 'Emperor Wu of Han', mn: 'Хань улсын У хаан', en: 'Emperor Wu of Han', reign: 'МЭӨ 141–87' },
    facts: [
      { mn: 'Хятадын үндсэн үндэстэн өөрийгөө өнөөг хүртэл «хань» гэж нэрлэдэг нь энэ гүрний нэрнээс.', en: 'China\'s majority people still call themselves "Han", after this dynasty.' },
      { mn: 'Торгоны зам албан ёсоор энэ үед нээгдсэн — Жан Цянь баруун зүг рүү илгээгдсэнээр.', en: 'The Silk Road opened formally in this period, with Zhang Qian\'s mission to the west.' },
      { mn: 'Цаас энэ үед зохиогдсон нь мэдээллийг хадгалах өртгийг эрс бууруулсан.', en: 'Paper was invented under the Han, collapsing the cost of keeping records.' },
    ],
  },
  ming: {
    capital: { page: 'Beijing', mn: 'Бээжин', en: 'Beijing' },
    ruler: { page: 'Yongle Emperor', mn: 'Юнлэ хаан', en: 'Yongle Emperor', reign: '1402–1424' },
    facts: [
      { mn: 'Жэн Хэгийн флот Колумбаас 90 жилийн өмнө Африк хүрч байсан — хамгийн том хөлөг нь Колумбын хөлгөөс хэд дахин том байжээ.', en: 'Zheng He\'s fleets reached Africa ninety years before Columbus, in ships several times the size of his.' },
      { mn: 'Бээжингийн Хориотой хот энэ үед баригдсан — 980 барилга, бараг 100 га талбай.', en: 'Beijing\'s Forbidden City was built in this period — some 980 buildings across nearly 100 hectares.' },
      { mn: 'Өнөөдөр бидний харж буй Цагаан хэрмийн ихэнх хэсэг нь Мин улсын үеийнх, Хүннүгийн үеийнх биш.', en: 'Most of the Great Wall people see today is Ming work, not the older ramparts.' },
    ],
  },
  rashidun: {
    capital: { page: 'Medina', mn: 'Медина', en: 'Medina' },
    ruler: { page: 'Umar', mn: 'Умар халиф', en: 'Caliph Umar', reign: '634–644' },
    facts: [
      { mn: 'Хорин таван жилийн дотор Сасанийн Персийг бүрэн, Византийн хагасыг эзэлсэн.', en: 'In twenty-five years it took all of Sasanian Persia and half of Byzantium.' },
      { mn: 'Хоёр эртний гүрэн бие биетэйгээ дайтаж ядарсан яг тэр мөчид гарч ирсэн нь тэлэлтийн хурдны нэг тайлбар.', en: 'It arrived exactly as those two ancient powers had exhausted each other — one reason for the speed.' },
      { mn: 'Исламын хуанли Мухаммедын Мединад нүүсэн 622 оноос эхэлдэг.', en: 'The Islamic calendar counts from Muhammad\'s move to Medina in 622.' },
    ],
  },
  goldenhorde: {
    // Little of Sarai is left to photograph; Bolghar is a Horde city that stands.
    capital: { page: 'Bolghar', mn: 'Сарай', en: 'Sarai', photo: { mn: 'Зураг: Болгар — Ордны бас нэг хот', en: 'Pictured: Bolghar, another city of the Horde' } },
    ruler: { page: 'Batu Khan', mn: 'Бат хаан', en: 'Batu Khan', reign: '1227–1255' },
    facts: [
      { mn: 'Монголын эзэнт гүрний баруун жигүүр — Чингисийн ач хүү Батын удирдсан улс.', en: 'The western wing of the Mongol Empire, ruled by Genghis\'s grandson Batu.' },
      { mn: 'Оросын ноёдууд хоёр зуун жилийн турш алба гувчуур төлж, хаан ширээний зөвшөөрлийг Сарайгаас авдаг байв.', en: 'Russian princes paid tribute for two centuries and took their right to rule from Sarai.' },
      { mn: 'Москва хот бусдын алба хураахыг нь хариуцаж авснаараа хүчирхэгжсэн — дараа нь тэр хүчээрээ Ордоос салсан.', en: 'Moscow rose by collecting that tribute for the Horde — and later used the same strength to break from it.' },
    ],
  },
  achaemenid: {
    // The Persepolis article carries no lead image; its own gatehouse does, and
    // the photograph is of Persepolis either way.
    capital: { page: 'Gate of All Nations', mn: 'Персеполис', en: 'Persepolis' },
    ruler: { page: 'Darius the Great', mn: 'Их Дариус хаан', en: 'Darius the Great', reign: 'МЭӨ 522–486' },
    facts: [
      { mn: 'Тухайн үедээ дэлхийн хүн амын бараг тал хувийг захирч байсан гэж тооцдог — энэ харьцааг хожим хэн ч давтаагүй.', en: 'It is reckoned to have ruled nearly half the world\'s people — a share no empire has matched since.' },
      { mn: 'Хааны зам 2,700 км урт байсан бөгөөд элч долоо хоногт туулдаг замыг жирийн аялагч гурван сар явдаг байв.', en: 'The Royal Road ran 2,700 km; a courier crossed in a week what took a traveller three months.' },
      { mn: 'Кирийн цилиндрийг хүний эрхийн анхны тунхаглалуудын нэг гэж үздэг — эзлэгдсэн ард түмнийг шашин, зан заншлаа хадгалахыг зөвшөөрсөн.', en: 'The Cyrus Cylinder is often called an early charter of rights — conquered peoples kept their religion and customs.' },
    ],
  },
  tang: {
    capital: { page: "Chang'an", mn: 'Чанъань', en: "Chang'an" },
    ruler: { page: 'Emperor Taizong of Tang', mn: 'Тан улсын Тайзун хаан', en: 'Emperor Taizong', reign: '626–649' },
    facts: [
      { mn: 'Чанъань тухайн үедээ дэлхийн хамгийн том хот байсан — сая орчим хүнтэй, гуравны нэг нь гадаадынхан.', en: 'Chang\'an was then the largest city on earth — around a million people, a third of them foreign.' },
      { mn: 'Хэвлэх урлаг энэ үед үүссэн: одоо байгаа хамгийн эртний огноотой хэвлэмэл ном 868 оных.', en: 'Printing began here: the oldest dated printed book in existence is from 868.' },
      { mn: 'Их анги дамжсан төрийн шалгалтын тогтолцоо энэ үед бэхжсэн нь язгуур гаралгүй хүн түшмэл болох замыг нээсэн.', en: 'The imperial examination system matured here, opening office to men without noble birth.' },
    ],
  },
  macedon: {
    capital: { page: 'Babylon', mn: 'Вавилон', en: 'Babylon' },
    ruler: { page: 'Alexander the Great', mn: 'Македонский Александр', en: 'Alexander the Great', reign: 'МЭӨ 336–323' },
    facts: [
      { mn: 'Арван гурван жилийн дотор Грекээс Энэтхэг хүртэл байлдан дагуулж, гучин хоёр насандаа нас барсан.', en: 'He conquered from Greece to India in thirteen years and died at thirty-two.' },
      { mn: 'Нэрээ өгсөн хорь орчим хот байгуулсан — Египетийн Александри нь хамгийн алдартай нь.', en: 'He founded some twenty cities bearing his name; Alexandria in Egypt is the famous one.' },
      { mn: 'Нэг ч тулалдаанд ялагдаж байгаагүй ч эзэнт гүрэн нь үхлийнх нь дараа тэр дороо задарсан.', en: 'He never lost a battle, yet the empire broke apart immediately after his death.' },
    ],
  },
  ottoman: {
    capital: { page: 'Constantinople', mn: 'Константинополь', en: 'Constantinople' },
    ruler: { page: 'Suleiman the Magnificent', mn: 'Сүлэйман сүрлэг хаан', en: 'Suleiman the Magnificent', reign: '1520–1566' },
    facts: [
      { mn: '1453 онд Константинополь унасныг олон түүхч Дундад зууны төгсгөл гэж тэмдэглэдэг.', en: 'The fall of Constantinople in 1453 is where many historians end the Middle Ages.' },
      { mn: 'Зургаан зуун гаруй жил оршиж, Дэлхийн нэгдүгээр дайны дараа л татан буугдсан.', en: 'It lasted over six centuries, dissolving only after the First World War.' },
      { mn: 'Европ руу очих газар замыг хаасан нь Португал, Испанийг далайн зам хайхад хүргэсэн — Америк нээгдэх шалтгааны нэг.', en: 'By closing the land routes east it pushed Portugal and Spain to look for sea routes — one reason the Americas were reached.' },
    ],
  },
  maurya: {
    capital: { page: 'Pataliputra', mn: 'Паталипутра', en: 'Pataliputra' },
    ruler: { page: 'Ashoka', mn: 'Ашока хаан', en: 'Ashoka', reign: 'МЭӨ 268–232' },
    facts: [
      { mn: 'Ашока Калингагийн дайны хядлагыг үзсэнийхээ дараа буддын шашинд орж, байлдан дагуулахаа больсон.', en: 'After the slaughter at Kalinga, Ashoka turned to Buddhism and stopped conquering.' },
      { mn: 'Түүний зарлигуудыг сийлсэн багана, хаднууд өнөөг хүртэл зогсож байна — эзэнт гүрний захиас өөрөө үлдсэн ховор жишээ.', en: 'His edicts, carved on pillars and rock, still stand — a rare case of an empire\'s own words surviving.' },
      { mn: 'Энэтхэгийн төрийн далбаан дээрх хүрд, төрийн сүлд дэх арслан хоёулаа Ашокагийн баганаас авагдсан.', en: 'The wheel on India\'s flag and the lions of its state emblem both come from Ashoka\'s pillars.' },
    ],
  },
  roman: {
    capital: { page: 'Rome', mn: 'Ром', en: 'Rome' },
    ruler: { page: 'Trajan', mn: 'Траян эзэн хаан', en: 'Trajan', reign: '98–117' },
    facts: [
      { mn: 'Газар дундын тэнгисийг бүхэлд нь тойрон эзэлсэн цорын ганц гүрэн — Ромчууд түүнийг «бидний тэнгис» гэдэг байв.', en: 'The only power ever to hold the entire Mediterranean shore — Romans called it "our sea".' },
      { mn: 'Барьсан замын нийт урт 400,000 км орчим, үүний 80,000 нь чулуун хучилттай.', en: 'It built roughly 400,000 km of roads, some 80,000 of them stone-paved.' },
      { mn: 'Ромын бетоноор баригдсан Пантеоны бөмбөгөр өнөөг хүртэл дэлхийн хамгийн том арматургүй бетон бөмбөгөр хэвээр.', en: 'The Pantheon\'s dome, in Roman concrete, is still the largest unreinforced concrete dome in the world.' },
    ],
  },
};

// One API round trip per 40 titles rather than one per subject: the endpoint
// takes a pipe-joined list, and 50 subjects at one request each is 50 chances
// to be rate-limited for no reason.
async function fetchPages(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const url = new URL(API);
    url.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      redirects: '1',
      prop: 'pageimages|extracts',
      piprop: 'thumbnail',
      pithumbsize: '900',
      exintro: '1',
      explaintext: '1',
      titles: batch.join('|'),
      origin: '*',
    }).toString();

    const res = await fetch(url, { headers: { 'User-Agent': 'minii-bolzoo-globe/1.0 (empire dossier build)' } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status} for batch starting ${batch[0]}`);
    const json = await res.json();

    // `redirects` and `normalized` remap what we asked for to what came back,
    // so a title like "Queen Victoria" can still be looked up by that name.
    const alias = new Map();
    for (const list of [json.query?.normalized, json.query?.redirects]) {
      for (const r of list || []) alias.set(r.from, r.to);
    }
    const byTitle = new Map();
    for (const p of json.query?.pages || []) byTitle.set(p.title, p);
    for (const asked of batch) {
      let t = asked;
      for (let hop = 0; hop < 4 && alias.has(t); hop++) t = alias.get(t);
      out.set(asked, byTitle.get(t) || null);
    }
    process.stdout.write(`  fetched ${Math.min(i + 40, titles.length)}/${titles.length}\n`);
  }
  return out;
}

const firstSentence = (text) => {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  const cut = clean.slice(0, 400);
  const stop = cut.search(/\.\s+[A-Z(]/);
  return (stop > 40 ? cut.slice(0, stop + 1) : cut).trim();
};

const ids = Object.keys(SUBJECTS);
const titles = [...new Set(ids.flatMap((id) => [SUBJECTS[id].capital.page, SUBJECTS[id].ruler.page]))];
console.log(`Fetching ${titles.length} Wikipedia pages for ${ids.length} empires…`);
const pages = await fetchPages(titles);

const missing = [];
const dossiers = {};
for (const id of ids) {
  const s = SUBJECTS[id];
  const build = (part, kind) => {
    const page = pages.get(part.page);
    // The API tacks utm_* campaign params onto the thumbnail URL; they are noise
    // in a committed asset and change between runs, so the diff would churn.
    const img = (page?.thumbnail?.source || '').split('?')[0];
    if (!img) missing.push(`${id}.${kind} — "${part.page}" has no lead image`);
    return {
      mn: part.mn,
      en: part.en,
      ...(part.reign ? { reign: part.reign } : {}),
      img,
      // Set only where the picture is not a direct likeness of the subject, so
      // the card can say what it is actually showing instead of implying more.
      ...(part.photo ? { photo: part.photo } : {}),
      source: page?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` : '',
      blurb: firstSentence(page?.extract),
    };
  };
  dossiers[id] = { capital: build(s.capital, 'capital'), ruler: build(s.ruler, 'ruler'), facts: s.facts };
}

console.log(`\n${ids.length} dossiers built.`);
if (missing.length) {
  console.log(`\n${missing.length} subject(s) came back without a picture:`);
  for (const m of missing) console.log(`  ! ${m}`);
} else {
  console.log('Every subject has a picture.');
}

if (CHECK_ONLY) {
  console.log('\n--check: nothing written.');
} else {
  fs.writeFileSync(OUT, JSON.stringify(dossiers, null, 2) + '\n');
  console.log(`\nWrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} kB)`);
}
