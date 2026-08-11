// Read-only helper for curating Commons photographs. It never writes to the DB.
export {};
const queries: Record<string, string> = {
  'Цагаан гол — Шивээт хайрхан': 'Tsagaan Gol Shiveet Khairkhan Mongolia',
  'Сэнжит хад — Мухар Шивэрт': 'Senjit Khad Eej Khairkhan Mongolia',
  'Бага газрын чулуу': 'Baga Gazriin Chuluu Mongolia',
  'Алтан Овоо': 'Altan Ovoo Dariganga Mongolia',
  'Нэмэгт уул ба Нэмэгтийн хотгор': 'Nemegt Basin Mongolia',
  'Бор хярын элс': 'Bor Khyar sand dunes Mongolia',
  'Мухартын гол': 'Mukhart River Mongolia',
  'Улаагчны Хар нуур': 'Ulaagchiin Khar Nuur Mongolia',
  'Орхоны хөндийн соёлын дурсгалт газар': 'Orkhon Valley Cultural Landscape Mongolia',
  'Чин толгойн балгас': 'Chin Tolgoi Khitan Mongolia',
  'Цагаан агуйн чулуун зэвсгийн бууц': 'Tsagaan Agui cave Mongolia',
  'Рашаан хад': 'Rashaan Khad Mongolia petroglyph',
  'Шивээт хайрханы хадны зураг': 'Shiveet Khairkhan petroglyph Mongolia',
  'Уушгийн өвөрийн буган чулуун цогцолбор': 'Uushigiin Ovor deer stones Mongolia',
  'Жаргалантын амны буган чулуун цогцолбор': 'Jargalantyn Am deer stones Mongolia',
  'Хойд Тамирын буган чулуун цогцолбор': 'Khoid Tamir deer stones Mongolia',
  'Тэвш уулын хадны зураг': 'Tevsh Uul petroglyph Mongolia',
  'Ямаан усны хадны зураг': 'Yamaan Us petroglyph Mongolia',
  'Чингис хаан Үндэсний музей — археологийн олдвор': 'Chinggis Khaan National Museum Mongolia',
  'Архангай аймгийн музей — Зая гэгээний Лаврин': 'Zaya Gegeen Museum Tsetserleg Mongolia',
  'Монголын Үндэсний музей': 'National Museum of Mongolia Ulaanbaatar',
  'Улаанбаатар хотын музей': 'Ulaanbaatar City Museum',
  'Төгрөгийн Ширээ': 'Tugrikin Shire dinosaur Mongolia',
  'Нэмэгтийн олдворт газар': 'Nemegt dinosaur locality Mongolia',
  'Бүгийн цав': 'Bugiin Tsav Mongolia dinosaur',
  'Шар Цав': 'Shar Tsav dinosaur tracks Mongolia',
  'Ноён уулын Хүннүгийн язгууртны булш': 'Noin Ula Xiongnu Mongolia',
  'Гол мод II — Хүннүгийн язгууртны оршуулга': 'Gol Mod II Xiongnu Mongolia',
  'Бурхан Халдун — Их хориг': 'Burkhan Khaldun Mongolia',
  'Дэлүүн Болдог — Чингис хааны төрсөн нутаг': 'Deluun Boldog Mongolia',
  'Мөнх хааны ордны туурь — Аураг': 'Avraga palace Mongolia',
  'Хиагт — 1915, 1921 оны түүхэн боомт': 'Altanbulag Kyakhta Mongolia',
  'Алтанбулагийн хувьсгалын дурсгал': 'Altanbulag Mongolia revolution monument',
  'Хамар давааны Ялалтын хөшөө': 'Khalkhin Gol victory monument Mongolia',
  'Яковлевын танкийн хөшөө': 'Khalkhin Gol tank monument Mongolia',
  'Монгол дайчдын гэрэлт хөшөө — Халхгол': 'Khalkhin Gol Mongolian soldiers monument',
  'Замын-Үүд — 1945 оны чөлөөлөх дайны зам': 'Zamyn Uud Mongolia',
  'Сайншанд — 1945 оны дайны ар талын төв': 'Sainshand Mongolia',
};

for (const [name, search] of Object.entries(queries)) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `${search} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '4', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', format: 'json', origin: '*' }).toString();
  let response = await fetch(api, { headers: { 'User-Agent': 'AtlasMongoliaAudit/1.0' } });
  if (response.status === 429) {
    await Bun.sleep(2500);
    response = await fetch(api, { headers: { 'User-Agent': 'AtlasMongoliaAudit/1.0' } });
  }
  if (!response.ok) { console.log(`${name} | HTTP ${response.status}`); continue; }
  const json = await response.json();
  const titles = Object.values(json.query?.pages || {}).map((p: any) => p.title.replace(/^File:/, ''));
  console.log(`${name} | ${titles.join(' || ')}`);
  await Bun.sleep(350);
}
