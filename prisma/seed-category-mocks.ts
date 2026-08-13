// Demo places for the three categories that have none — entertainment (02),
// relaxation (03) and activities (04) all showed "0" on the category list
// while food already had ten real, user-added businesses. Five each, so the
// category pages, the map and the previews have something to render.
//
// These are fictional businesses, which is why every name carries the
// "Демо — " prefix already used by the one demo row in the table: they read
// as placeholder content in the admin list and are trivial to delete with a
// single `startsWith` filter. Coordinates are real spots in the aimag each
// one claims to be in, so their Google Maps pins land somewhere sensible.
//
// Images are Wikimedia Commons photos matching each entry's subject, via
// Special:FilePath so no thumbnail hash has to be guessed — the same
// approach as prisma/seedContent.ts. Food is deliberately left alone.
//
// Run: bun run prisma/seed-category-mocks.ts   (npm run seed:category-mocks)
// Safe to re-run: each row is skipped if a place of that name already exists.
import { prisma } from '../lib/prisma';

const SEED_ADMIN_EMAIL = 'admin@bigbang.mn';
const PREFIX = 'Демо — ';

const WM = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;

interface MockPlace {
  name: string; description: string; category: string; sub: string; aimag: string;
  lat: number; lng: number; image: string; openTime: string; closeTime: string; accessible: boolean;
}

const PLACES: MockPlace[] = [
  // ── 02 Энтертайнмент ─────────────────────────────────────────────────────
  { name: 'Tengis Cinema Palace', description: '4K дэлгэц, Dolby Atmos дуу, өргөн суудалтай орчин үеийн кино театр. Долоо хоног бүр шинэ нээлт.', category: 'entertainment', sub: 'Кино театр', aimag: 'Улаанбаатар', lat: 47.9188, lng: 106.9170, image: 'RZ Metro Movie Theater interior 2023-03 (2).jpg', openTime: '10:00', closeTime: '23:30', accessible: true },
  { name: 'Од Кино Төв', description: 'Хоёр танхимтай, гэр бүлээрээ үзэх хямд үнэтэй үдээс өмнөх үзвэртэй кино театр.', category: 'entertainment', sub: 'Кино театр', aimag: 'Орхон', lat: 49.0333, lng: 104.0833, image: '4DX seats in cinema (motion and environmental effects synced with the on-screen action) bench rows in a movie theater hall Kinostoler kinosal Kilden kino Tønsberg, Norway 2023 IMG 7849.jpg', openTime: '11:00', closeTime: '22:00', accessible: true },
  { name: 'Live Stage UB', description: 'Орон нутгийн хамтлагууд долоо хоног бүр тоглодог, 200 хүний багтаамжтай амьд хөгжмийн клуб.', category: 'entertainment', sub: 'Амьд хөгжим', aimag: 'Улаанбаатар', lat: 47.9130, lng: 106.9195, image: 'LAKE playing at The Hideout in Chicago, Illinois, USA (2025-04-20).jpg', openTime: '19:00', closeTime: '02:00', accessible: false },
  { name: 'Жаз Клуб 46', description: 'Жаз, соул, фанк — амьд хөгжим, коктейлийн цэстэй үдшийн клуб.', category: 'entertainment', sub: 'Амьд хөгжим', aimag: 'Улаанбаатар', lat: 47.9184, lng: 106.9177, image: 'A large crowd enjoys a music concert illuminated by colorful lights and a stunning stage display.jpg', openTime: '18:00', closeTime: '01:00', accessible: true },
  { name: 'SoundWave Студи', description: 'Дуу бичлэг, подкаст, микс хийх мэргэжлийн студи — цагаар түрээслүүлнэ.', category: 'entertainment', sub: 'Студи', aimag: 'Улаанбаатар', lat: 47.9240, lng: 106.9080, image: 'Recording-Studio-In-Atlanta-Studio-A-Best-1030x535.jpg', openTime: '10:00', closeTime: '20:00', accessible: true },

  // ── 03 Амралт ────────────────────────────────────────────────────────────
  { name: 'Зэн Массаж төв', description: 'Уламжлалт болон тайландын массаж, чулуун засал — урьдчилан цаг авна.', category: 'relaxation', sub: 'Массаж', aimag: 'Улаанбаатар', lat: 47.9175, lng: 106.9220, image: 'Young-man-spa-treatment-recreation-rest-relaxation-massage-hygh-angle-view.jpg', openTime: '09:00', closeTime: '21:00', accessible: true },
  { name: 'Уужим Сауна', description: 'Хуурай болон уурын сауна, хүйтэн усан сан, амрах танхимтай.', category: 'relaxation', sub: 'Сауна', aimag: 'Дархан-Уул', lat: 49.4867, lng: 105.9228, image: 'Stained Glass, Fordyce Bathhouse, Hot Springs NP.JPG', openTime: '10:00', closeTime: '22:00', accessible: false },
  { name: 'Belle Beauty Studio', description: 'Үс засал, будалт, хумсны үйлчилгээ — хосуудад зориулсан багц бий.', category: 'relaxation', sub: 'Гоо сайхан', aimag: 'Улаанбаатар', lat: 47.9155, lng: 106.9145, image: 'Salon interior.jpg', openTime: '09:00', closeTime: '20:00', accessible: true },
  { name: 'Тэрэлж Ая Тухтай Ресорт', description: 'Уулын дунд байрлах амралтын газар — халуун усан сан, спа, ресторантай.', category: 'relaxation', sub: 'Амралтын газар', aimag: 'Төв', lat: 47.9700, lng: 107.4200, image: 'Couple walks by a clear pool in a resort wearing bathrobes and preparing for a relaxing day at the spa.jpg', openTime: '00:00', closeTime: '23:59', accessible: true },
  { name: 'Хөвсгөл Лэйксайд Ресорт', description: 'Нуурын эрэг дээрх модон байшингууд — завиар зугаалах, загасчлах боломжтой.', category: 'relaxation', sub: 'Амралтын газар', aimag: 'Хөвсгөл', lat: 50.4333, lng: 100.1500, image: 'East Lake Resort 8453.jpg', openTime: '00:00', closeTime: '23:59', accessible: false },

  // ── 04 Идэвхтэй амралт ───────────────────────────────────────────────────
  { name: 'TrailMasters Явган аялалын клуб', description: 'Амралтын өдөр бүр Богд хан, Тэрэлж рүү бүлгээр явган аялал зохион байгуулна.', category: 'activities', sub: 'Явган аялал', aimag: 'Улаанбаатар', lat: 47.9250, lng: 106.9300, image: "Group Hiking on Munch's Coulee National Hiking Trail (5220995838).jpg", openTime: '08:00', closeTime: '18:00', accessible: false },
  { name: 'FitZone Спорт төв', description: 'Хүчний бэлтгэл, бүлгийн хичээл, дасгалжуулагчтай — өглөө эрт нээдэг.', category: 'activities', sub: 'Спорт', aimag: 'Улаанбаатар', lat: 47.9110, lng: 106.9060, image: 'Woman lifting dumbbells in a modern gym during a workout session focused on strength training and fitness.jpg', openTime: '06:00', closeTime: '23:00', accessible: true },
  { name: 'Nomad Ger Кемп', description: 'Уулын хормойн жуулчны гэр бааз — морь унах, од харах, гал түлэх.', category: 'activities', sub: 'Кемп', aimag: 'Төв', lat: 47.9600, lng: 107.4500, image: 'Steppe Nomads Eco Camp.jpg', openTime: '00:00', closeTime: '23:59', accessible: false },
  { name: 'BoardHouse Тоглоомын кафе', description: '200 гаруй ширээний тоглоом, кофе, хөнгөн зууш — хосоор тоглох цэстэй.', category: 'activities', sub: 'Тоглоом', aimag: 'Улаанбаатар', lat: 47.9195, lng: 106.9245, image: 'Table Taft Board Game Café interior.jpg', openTime: '12:00', closeTime: '23:00', accessible: true },
  { name: 'Adrenaline Rock Climbing', description: 'Дотор авиралтын хана, гадаа хадан авиралтын аялал — багаж хэрэгсэл түрээслүүлнэ.', category: 'activities', sub: 'Адреналин', aimag: 'Улаанбаатар', lat: 47.9270, lng: 106.9020, image: 'Outdoor rock climbing 150709-F-WT808-259.jpg', openTime: '10:00', closeTime: '22:00', accessible: false },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'atlas';
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (!admin) throw new Error('Seed admin not found — run `prisma/seed.ts` first.');

  const aimags = await prisma.aimag.findMany();
  const aimagIdByName = new Map(aimags.map((a) => [a.name, a.id]));
  const categories = await prisma.category.findMany();
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let added = 0, skipped = 0;
  for (const [i, p] of PLACES.entries()) {
    const name = PREFIX + p.name;
    // Per-row guard rather than one marker row: a half-finished run, or a
    // later edit that appends to this list, then tops up only what's missing.
    if (await prisma.place.findFirst({ where: { name }, select: { id: true } })) { skipped++; continue; }

    const aimagId = aimagIdByName.get(p.aimag);
    if (!aimagId) throw new Error(`Aimag not found: ${p.aimag}`);
    const categoryId = categoryIdBySlug.get(p.category);
    if (!categoryId) throw new Error(`Category not found: ${p.category}`);

    const slug = slugify(p.name);
    await prisma.place.create({
      data: {
        name, description: p.description,
        images: [WM(p.image)],
        categoryId, subCategory: p.sub,
        aimagId, lat: p.lat, lng: p.lng,
        openTime: p.openTime, closeTime: p.closeTime,
        phone: String(88000000 + i),
        instagramUrl: `instagram.com/${slug}`,
        facebookUrl: `facebook.com/${slug}`,
        contactEmail: `${slug}@email.mn`,
        accessible: p.accessible,
        addedBy: admin.id,
        status: 'approved',
      },
    });
    added++;
  }

  console.log(`Demo places — added ${added}, already present ${skipped}`);
  for (const slug of ['entertainment', 'relaxation', 'activities']) {
    const id = categoryIdBySlug.get(slug)!;
    console.log(`  ${slug}: ${await prisma.place.count({ where: { categoryId: id, status: 'approved' } })} approved`);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
