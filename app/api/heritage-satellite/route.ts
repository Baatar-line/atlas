import { NextResponse } from 'next/server';

// Exact-coordinate imagery fallback for heritage sites that do not have a
// verified, openly licensed ground photograph. This is deliberately not a
// stock/category photo: every response is centred on that pin's own location.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 41 || lat > 53 || lng < 87 || lng > 120) {
    return NextResponse.json({ error: 'Invalid Mongolia coordinate' }, { status: 400 });
  }

  // Roughly 3–5 km across at Mongolia's latitude: wide enough to understand
  // the surrounding site, close enough to see a museum block or rock complex.
  const dx = 0.035;
  const dy = 0.022;
  const image = new URL('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export');
  image.searchParams.set('bbox', `${lng - dx},${lat - dy},${lng + dx},${lat + dy}`);
  image.searchParams.set('bboxSR', '4326');
  image.searchParams.set('imageSR', '4326');
  image.searchParams.set('size', '1200,675');
  image.searchParams.set('format', 'jpg');
  image.searchParams.set('f', 'image');

  return NextResponse.redirect(image, {
    status: 307,
    headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=7776000' },
  });
}
