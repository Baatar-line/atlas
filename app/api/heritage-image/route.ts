import { NextResponse } from 'next/server';

const BITMAP = /\.(?:jpe?g|png|webp|gif|tiff?)$/i;
const NON_GROUND = /\b(?:iss\d*|satellite|aerial|spacecraft|space station|landsat|sentinel|worldview|orbital|earth observation|map|diagram|locator|relief|topograph|geolog|route|flag|coat of arms)\b/i;
const AIMAG_EN: Record<string, string> = {
  'Улаанбаатар': 'Ulaanbaatar', 'Архангай': 'Arkhangai', 'Баян-Өлгий': 'Bayan-Olgii',
  'Баянхонгор': 'Bayankhongor', 'Булган': 'Bulgan', 'Говь-Алтай': 'Govi-Altai',
  'Говьсүмбэр': 'Govisumber', 'Дархан-Уул': 'Darkhan-Uul', 'Дорноговь': 'Dornogovi',
  'Дорнод': 'Dornod', 'Дундговь': 'Dundgovi', 'Завхан': 'Zavkhan', 'Орхон': 'Orkhon',
  'Өвөрхангай': 'Ovorkhangai', 'Өмнөговь': 'Omnogovi', 'Сүхбаатар': 'Sukhbaatar',
  'Сэлэнгэ': 'Selenge', 'Төв': 'Tov', 'Увс': 'Uvs', 'Ховд': 'Khovd',
  'Хөвсгөл': 'Khuvsgul', 'Хэнтий': 'Khentii',
};

function subjectEn(type: string) {
  if (/музей/i.test(type)) return 'museum';
  if (/нуур/i.test(type)) return 'lake';
  if (/уул|хайрхан|овоo|овоо/i.test(type)) return 'mountain';
  if (/хад|цав|чулуу/i.test(type)) return 'rock';
  if (/хийд|сүм/i.test(type)) return 'monastery';
  if (/хөшөө|дурсгал/i.test(type)) return 'monument';
  if (/археологи|балгас|туурь/i.test(type)) return 'archaeological site';
  return 'landmark';
}

function usable(page: any) {
  const info = page?.imageinfo?.[0];
  const text = `${page?.title || ''} ${info?.extmetadata?.ImageDescription?.value || ''}`;
  return info?.mime?.startsWith('image/')
    && BITMAP.test(String(page?.title || '').replace(/^File:/, ''))
    && !NON_GROUND.test(text);
}

async function commonsPages(params: Record<string, string>) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({
    action: 'query', prop: 'imageinfo', iiprop: 'url|mime|extmetadata',
    iiurlwidth: '1200', format: 'json', origin: '*', ...params,
  }).forEach(([key, value]) => api.searchParams.set(key, value));
  const res = await fetch(api, {
    headers: { 'User-Agent': 'AtlasMongoliaMap/1.0 (heritage image resolver)' },
    next: { revalidate: 604800 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (Object.values(json?.query?.pages || {}) as any[]).filter(usable);
}

// Resolves one heritage pin to its own Commons result. The browser/CDN caches
// the redirect for a week, so opening a pin again does not call Wikimedia and
// this never touches the application database.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 180);
  const aimag = (searchParams.get('aimag') || '').trim().slice(0, 80);
  const type = (searchParams.get('type') || '').trim().slice(0, 100);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!q) return new NextResponse(null, { status: 404 });
  try {
    let pages = await commonsPages({
      generator: 'search', gsrsearch: `${q} Mongolia filetype:bitmap`,
      gsrnamespace: '6', gsrlimit: '20',
    });
    // Commons descriptions and filenames are often English even when the
    // pin's canonical display name is Mongolian. Search the same province and
    // subject before widening spatially; this is what resolves e.g. Khentii's
    // museum without using an unrelated country-wide stock landscape.
    if (!pages.length && aimag) {
      pages = await commonsPages({
        generator: 'search',
        gsrsearch: `${AIMAG_EN[aimag] || aimag} ${subjectEn(type)} Mongolia filetype:bitmap`,
        gsrnamespace: '6', gsrlimit: '30',
      });
    }
    // When the exact Mongolian name has no Commons result, use the nearest
    // geotagged ground photograph. Start local, then expand only as far as
    // needed for sparse rural Commons coverage. Space/aerial/map files remain
    // excluded by usable() at every radius.
    if (!pages.length && Number.isFinite(lat) && Number.isFinite(lng)) {
      for (const radius of [10000, 50000, 100000]) {
        pages = await commonsPages({
          generator: 'geosearch', ggsprimary: 'all', ggsnamespace: '6',
          ggscoord: `${lat}|${lng}`, ggsradius: String(radius), ggslimit: '100',
        });
        if (pages.length) break;
      }
    }
    const hit = pages.sort((a, b) => Number(a.index || 999) - Number(b.index || 999))[0];
    if (!hit) return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } });
    const image = hit.imageinfo[0]?.thumburl || hit.imageinfo[0]?.url;
    return NextResponse.redirect(image, {
      status: 307,
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
