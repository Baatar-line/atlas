// Seven fictional showcase events. They are served only when ?catalog=1 is
// requested, so the admin panel and Event table remain strictly real data.
export const DEMO_EVENTS = [
  {
    id: -101, name: 'Талын оддын шөнө', tag: 'Одон орон · Кемп',
    meta: '19:30 · Горхи-Тэрэлжийн байгалийн цогцолборт газар · Дурангаар од ажиглах, галын дэргэдэх акустик хөгжим, шөнийн гэрэл зургийн аялал.',
    startDate: '2026-09-05T11:30:00.000Z', endDate: '2026-09-06T02:00:00.000Z',
    lat: 47.9879, lng: 107.4596, aimag: { name: 'Төв' }, featured: true,
    images: ['/api/heritage-image?q=Milky+Way+night+sky+Mongolia'], _count: { attendees: 86 }, demo: true,
  },
  {
    id: -102, name: 'Хөвсгөлийн цэнхэр гэрэл фестиваль', tag: 'Нуур · Урлаг',
    meta: '16:00 · Хатгалын эрэг · Гэрлэн инсталляц, завины парад, нутгийн уран бүтээлчдийн тоглолт.',
    startDate: '2026-09-19T08:00:00.000Z', endDate: '2026-09-19T15:00:00.000Z',
    lat: 50.4366, lng: 100.1543, aimag: { name: 'Хөвсгөл' },
    images: ['/api/heritage-image?q=Khuvsgul+Lake+blue+water+Mongolia'], _count: { attendees: 124 }, demo: true,
  },
  {
    id: -103, name: 'Говийн нар жаргах хөгжмийн үдэш', tag: 'Хөгжим · Говь',
    meta: '17:30 · Хонгорын элс · Элсэн манхны аялал, морин хуурын тоглолт, нар жаргах үеийн задгай тайз.',
    startDate: '2026-10-03T09:30:00.000Z', endDate: '2026-10-03T14:30:00.000Z',
    lat: 43.8068, lng: 102.1741, aimag: { name: 'Өмнөговь' },
    images: ['/api/heritage-image?q=Khongoryn+Els+sunset+Mongolia'], _count: { attendees: 73 }, demo: true,
  },
  {
    id: -104, name: 'Хархорумын өв соёлын өдөр', tag: 'Түүх · Соёл',
    meta: '11:00 · Эрдэнэ Зуу хийдийн гадна талбай · Уртын дуу, бичиг соёлын өртөө, уламжлалт гар урлалын үзэсгэлэн.',
    startDate: '2026-10-17T03:00:00.000Z', endDate: '2026-10-17T10:00:00.000Z',
    lat: 47.2016, lng: 102.8438, aimag: { name: 'Өвөрхангай' },
    images: ['/api/heritage-image?q=Erdene+Zuu+monastery+Kharkhorin'], _count: { attendees: 158 }, demo: true,
  },
  {
    id: -105, name: 'Алтайн бүргэд ба гэрэл зургийн өдөр', tag: 'Бүргэд · Фото',
    meta: '10:00 · Өлгий хотын ойролцоо · Бүргэдчдийн үзүүлбэр, хөрөг зургийн сургалт, казах үндэсний хоолны хэсэг.',
    startDate: '2026-10-31T02:00:00.000Z', endDate: '2026-10-31T09:00:00.000Z',
    lat: 48.9683, lng: 89.9621, aimag: { name: 'Баян-Өлгий' },
    images: ['/api/heritage-image?q=Kazakh+eagle+hunter+Bayan+Olgii'], _count: { attendees: 96 }, demo: true,
  },
  {
    id: -106, name: 'Улаанбаатар Street Food Weekend', tag: 'Хоол · Хот',
    meta: '12:00 · Үндэсний соёл амралтын хүрээлэн · 30 амтны цэг, залуу тогоочдын тэмцээн, DJ тайз.',
    startDate: '2026-11-14T04:00:00.000Z', endDate: '2026-11-15T12:00:00.000Z',
    lat: 47.9105, lng: 106.9207, aimag: { name: 'Улаанбаатар' },
    images: ['/api/heritage-image?q=Ulaanbaatar+food+festival+Mongolia'], _count: { attendees: 231 }, demo: true,
  },
  {
    id: -107, name: 'Өвлийн ном, кофе фестиваль', tag: 'Ном · Кофе',
    meta: '11:00 · Дархан хот, Залуучууд театрын танхим · Зохиолчдын уулзалт, ном солилцоо, кофе амталгаа, хүүхдийн уншлагын булан.',
    startDate: '2026-12-05T03:00:00.000Z', endDate: '2026-12-05T10:00:00.000Z',
    lat: 49.4867, lng: 105.9228, aimag: { name: 'Дархан-Уул' },
    images: ['/api/heritage-image?q=books+coffee+winter+festival'], _count: { attendees: 67 }, demo: true,
  },
] as const;
