import { NextResponse } from 'next/server';

const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Gobi_Desert.jpg/960px-Gobi_Desert.jpg';
const BITMAP = /\.(?:jpe?g|png|webp|gif|tiff?)$/i;

function xml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fallbackCard(q: string, image: string) {
  const label = q.length > 56 ? `${q.slice(0, 54)}…` : q;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <image href="${xml(image)}" width="1200" height="675" preserveAspectRatio="xMidYMid slice"/>
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="38%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#090b0e" stop-opacity=".94"/></linearGradient></defs>
    <rect width="1200" height="675" fill="url(#g)"/>
    <circle cx="74" cy="580" r="24" fill="#E8B84B"/><path d="M74 562a16 16 0 0 0-16 16c0 12 16 29 16 29s16-17 16-29a16 16 0 0 0-16-16zm0 22a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" fill="#132a1f"/>
    <text x="116" y="590" fill="#fff" font-family="Arial,sans-serif" font-size="34" font-weight="700">${xml(label)}</text>
    <text x="116" y="630" fill="#E8B84B" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="3">ATLAS · MONGOLIA</text>
  </svg>`;
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}

function verifiedPlaceholder(q: string) {
  const label = q.length > 56 ? `${q.slice(0, 54)}…` : q;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27352f"/><stop offset=".52" stop-color="#18201d"/><stop offset="1" stop-color="#0b0d0c"/></linearGradient><pattern id="p" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0v42" fill="none" stroke="#fff" stroke-opacity=".035"/></pattern></defs>
    <rect width="1200" height="675" fill="url(#bg)"/><rect width="1200" height="675" fill="url(#p)"/><path d="M0 500 190 365l120 78 185-205 166 176 120-106 199 192 220-159v334H0Z" fill="#e8b84b" fill-opacity=".09"/>
    <circle cx="78" cy="548" r="29" fill="#E8B84B"/><path d="M78 526a20 20 0 0 0-20 20c0 15 20 37 20 37s20-22 20-37a20 20 0 0 0-20-20zm0 28a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" fill="#132a1f"/>
    <text x="130" y="554" fill="#fff" font-family="Arial,sans-serif" font-size="34" font-weight="700">${xml(label)}</text><text x="130" y="600" fill="#E8B84B" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="3">ATLAS · БАТАЛГААЖУУЛСАН БАЙРШИЛ</text>
  </svg>`;
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } });
}

// Resolves one heritage pin to its own Commons result. The browser/CDN caches
// the redirect for a week, so opening a pin again does not call Wikimedia and
// this never touches the application database.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 180);
  const fallback = searchParams.get('fallback') || FALLBACK;
  if (searchParams.get('strict') === '1') return verifiedPlaceholder(q || 'Монголын өв');
  if (!q) return NextResponse.redirect(fallback, 307);
  try {
    const api = new URL('https://commons.wikimedia.org/w/api.php');
    api.searchParams.set('action', 'query');
    api.searchParams.set('generator', 'search');
    api.searchParams.set('gsrsearch', `${q} Mongolia filetype:bitmap`);
    api.searchParams.set('gsrnamespace', '6');
    api.searchParams.set('gsrlimit', '8');
    api.searchParams.set('prop', 'imageinfo');
    api.searchParams.set('iiprop', 'url|mime');
    api.searchParams.set('iiurlwidth', '1200');
    api.searchParams.set('format', 'json');
    api.searchParams.set('origin', '*');
    const res = await fetch(api, {
      headers: { 'User-Agent': 'AtlasMongoliaMap/1.0 (heritage image resolver)' },
      next: { revalidate: 604800 },
    });
    if (!res.ok) throw new Error(`Commons ${res.status}`);
    const json = await res.json();
    const pages = Object.values(json?.query?.pages || {}) as any[];
    const hit = pages
      .filter((p) => p?.imageinfo?.[0]?.mime?.startsWith('image/'))
      .filter((p) => BITMAP.test(String(p.title || '').replace(/^File:/, '')))
      .sort((a, b) => Number(a.index || 999) - Number(b.index || 999))[0];
    if (!hit) return fallbackCard(q, fallback);
    const image = hit.imageinfo[0]?.thumburl || hit.imageinfo[0]?.url;
    return NextResponse.redirect(image, {
      status: 307,
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' },
    });
  } catch {
    return fallbackCard(q, fallback);
  }
}
