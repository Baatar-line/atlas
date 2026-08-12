// One-off content seed for Brand — the admin panel's "Брэндийн сурталчилгаа"
// tab was empty ("Одоогоор брэнд алга"), so the public Suggest page's brand
// rail (gated by V.brands.length > 0, see app/(bigbang)/suggest/page.tsx)
// never rendered. Adds 15 mock partner brands.
//
// Names are fictional (not real companies) since these render under
// "Алдартай брэндээс санал болгож байна" — inventing names avoids implying a
// partnership that doesn't exist. `logo` points at a plain geometric mark
// drawn for this seed (public/brands/*.svg) for the same reason, and because
// the first-letter avatar the card falls back to made all 15 look alike.
// `link` points at a real internal route rather than an external URL, since
// these aren't real companies with real sites.
//
// The photographs are the ones actually uploaded through the admin panel and
// stored in this app's own Cloudinary folder — the seed used to point at
// Wikimedia files that no longer had anything to do with what is live, so
// re-seeding a fresh database produced a rail that disagreed with production.
// Each name/category pair below is written to match its photograph: a bottle
// brand on the bottle shot, an archery brand on the archery shot. They were
// wired up by position originally and had drifted completely — a coffee
// roaster captioning a cycling helmet, a board-game label on a camping
// lantern. See prisma/repair-brand-labels.ts, which carried the same mapping
// onto the rows already in the database.
import { prisma } from '../lib/prisma';

const SEED_ADMIN_EMAIL = 'admin@bigbang.mn';

const CL = (id: string) => `https://res.cloudinary.com/dmwbmvbbl/image/upload/${id}.jpg`;

export interface BrandSeed { name: string; category: string; image: string; link: string; logo: string }

export const BRANDS: BrandSeed[] = [
  // Vintage rangefinder camera
  { name: 'Nomad Reels', category: 'Гэрэл зураг, кино', image: CL('v1786460438/bigbang/brands/szqixjosecd7fvewjbqm'), link: '/suggest/movies', logo: '/brands/nomad-reels.svg' },
  // Insulated steel water bottle
  { name: 'Khangai Flask', category: 'Термос, ус сав', image: CL('v1786460463/bigbang/brands/z0z23ud2zyp0buuvv87k'), link: '/category/activities', logo: '/brands/khangai-flask.svg' },
  // Cream daypack with bungee cord
  { name: 'SkyBridge Travel Gear', category: 'Аялалын цүнх', image: CL('v1786460478/bigbang/brands/nb5c5xjwoylzppologjn'), link: '/category/activities', logo: '/brands/skybridge-travel-gear.svg' },
  // Over-ear headphones
  { name: 'Orkhon Audio', category: 'Чихэвч, дуу хөгжим', image: CL('v1786460495/bigbang/brands/x4nvb2ni0werh06kd5d8'), link: '/suggest', logo: '/brands/orkhon-audio.svg' },
  // Moss terrarium under a glass dome
  { name: 'Mokh Studio', category: 'Ургамал, гэрийн чимэглэл', image: CL('v1786460520/bigbang/brands/dmozbcrvxuyu10ncnlqj'), link: '/category/relaxation', logo: '/brands/mokh-studio.svg' },
  // Rechargeable camping lantern at dusk
  { name: 'GerCamp Supply', category: 'Кемп, гэрэлтүүлэг', image: CL('v1786460550/bigbang/brands/zqbz02oyyto5ipok5cqp'), link: '/category/activities', logo: '/brands/gercamp-supply.svg' },
  // Keyboard / controller / earbuds flat-lay
  { name: 'Orkhon Tech', category: 'Технологи, дагалдах хэрэгсэл', image: CL('v1786460562/bigbang/brands/jj6szyji9fq7xionux9i'), link: '/suggest', logo: '/brands/orkhon-tech.svg' },
  // Archer drawing a recurve bow
  { name: 'Khangarid Archery', category: 'Нум сум, сур харваа', image: CL('v1786460582/bigbang/brands/ggfebse58wzkrnvn8lmi'), link: '/category/activities', logo: '/brands/khangarid-archery.svg' },
  // Badminton racket set with shuttlecocks
  { name: 'Tavan Tug Sport', category: 'Бадминтон, ракетны спорт', image: CL('v1786460375/bigbang/brands/uoi9elg3jbdmqqjld8li'), link: '/category/activities', logo: '/brands/tavan-tug-sport.svg' },
  // Two-tone technical backpack
  { name: 'Deel & Co', category: 'Загварын цүнх, гадуур хувцас', image: CL('v1786460396/bigbang/brands/qv0a6bzxt1lakekpunlp'), link: '/suggest', logo: '/brands/deel-co.svg' },
  // Plain white sleeveless top on a hanger
  { name: 'Nutag Basics', category: 'Өдөр тутмын хувцас', image: CL('v1786460417/bigbang/brands/eppysmqqhi6watbmdu9m'), link: '/suggest', logo: '/brands/nutag-basics.svg' },
  // Vented road-cycling helmet
  { name: 'peak9 Protect', category: 'Дугуй, хамгаалах хэрэгсэл', image: CL('v1786460748/bigbang/brands/rhk3saw7hadubkr7rpts'), link: '/category/activities', logo: '/brands/peak9-protect.svg' },
  // Oversized graphic-print tee
  { name: 'Steppe Print', category: 'Принт хувцас', image: CL('v1786460764/bigbang/brands/sbxydhlwjprjafgr9tku'), link: '/suggest', logo: '/brands/steppe-print.svg' },
  // Black-and-white high-top trainers
  { name: 'Steppe Runner', category: 'Пүүз, гутал', image: CL('v1786461094/bigbang/brands/ytupis1pqrdhtkv4e4na'), link: '/category/activities', logo: '/brands/steppe-runner.svg' },
  // Compact-cassette archive poster
  { name: 'Arkhiv Print', category: 'Постер, интерьер чимэглэл', image: CL('v1786461108/bigbang/brands/etuzxvdzfmddo5bwrbi8'), link: '/suggest', logo: '/brands/arkhiv-print.svg' },
];

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (!admin) throw new Error('Seed admin not found — run `prisma/seed.ts` first.');

  const seeded = await prisma.brand.findFirst({ where: { name: BRANDS[0].name } });
  if (!seeded) {
    await prisma.brand.createMany({
      data: BRANDS.map((b) => ({
        name: b.name, category: b.category,
        image: b.image, link: b.link, logo: b.logo,
        addedBy: admin.id,
      })),
    });
  }

  // Backfills the rows this script seeded before it had logos to give them.
  // Scoped to `logo: null` so a logo an admin uploaded through the panel is
  // never overwritten, and so a re-run after the first backfill is a no-op.
  let backfilled = 0;
  for (const b of BRANDS) {
    const { count } = await prisma.brand.updateMany({
      where: { name: b.name, logo: null },
      data: { logo: b.logo },
    });
    backfilled += count;
  }

  console.log(`Seeded ${seeded ? 0 : BRANDS.length} brands, backfilled ${backfilled} logos.`);
}

// Importable by prisma/repair-brand-labels.ts without running the seed.
if (import.meta.main) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
