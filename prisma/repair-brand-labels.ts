// Re-labels the Brand rows already in the database so each name/category
// describes the photograph actually on the card.
//
// The rows were seeded with one set of photographs and later had different
// ones uploaded through the admin panel, one row at a time. The labels never
// moved with them, so the Suggest page's rail ended up captioning a cycling
// helmet "Tengri Roast — Кофе, ундаа", a camping lantern "Tavan Tug Games —
// Ширээний тоглоом", and a badminton set "Orkhon Audio — Дуу хөгжмийн
// хэрэглэл". Every one of the 15 was wrong.
//
// Matched on the image URL rather than on id or position: the URL is the one
// thing that identifies which photograph a row is carrying, and it is what
// the new label was written against (see the per-entry comments in
// seedBrands.ts). Ids would work today and silently mis-assign the moment a
// row is deleted and re-added; position is what drifted in the first place.
//
// Names stay fictional, as they were — see the note at the top of
// seedBrands.ts. `image` is never written here; the uploaded photographs are
// the fixed point this whole script is aligning to.
//
// Safe to re-run: it writes only the rows whose stored label differs.
import { prisma } from '../lib/prisma';
import { BRANDS } from './seedBrands';

// The Cloudinary public id — everything after /upload/ and before the
// extension. Compared instead of the whole URL so a stored transform
// ("/upload/w_400/v17.../abc.jpg") still matches the plain form in the seed.
// Takes `string | null` because Brand.image is nullable — a row with no
// photograph at all simply matches nothing and is left alone.
function publicId(url: string | null): string {
  const m = /\/upload\/(?:[^/]+\/)*?(v\d+\/.+?)(?:\.[a-z0-9]+)?$/i.exec(url || '');
  return m ? m[1] : (url || '');
}

async function main() {
  const rows = await prisma.brand.findMany();
  const byImage = new Map(rows.map((r) => [publicId(r.image), r]));

  let updated = 0;
  const missing: string[] = [];

  for (const b of BRANDS) {
    const row = byImage.get(publicId(b.image));
    if (!row) { missing.push(b.name); continue; }
    if (row.name === b.name && row.category === b.category && row.logo === b.logo && row.link === b.link) continue;
    await prisma.brand.update({
      where: { id: row.id },
      data: { name: b.name, category: b.category, logo: b.logo, link: b.link },
    });
    console.log(`#${row.id}  ${row.name} · ${row.category}\n      → ${b.name} · ${b.category}`);
    updated++;
  }

  console.log(`\nRe-labelled ${updated} of ${BRANDS.length} brands.`);
  if (missing.length) {
    console.log(`No row carries the photograph for: ${missing.join(', ')} — left alone.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
