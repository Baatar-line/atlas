import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';
import { SITES as HERITAGE_SITES, heritageImages } from '../../../scripts/sync-mongolia-heritage-pins';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aimagId = searchParams.get('aimagId');
    const includeCatalog = searchParams.get('catalog') === '1' && !aimagId;
    const pins = await prisma.scenicPin.findMany({
      where: aimagId ? { aimagId: Number(aimagId) } : undefined,
      include: { aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    // The researched national catalogue is code-backed, not 60+ database
    // rows. This keeps admin CRUD clean and avoids a large table/rating fanout;
    // the map still receives DB pins + catalogue in one cacheable request.
    const catalogue = includeCatalog ? HERITAGE_SITES.map((p) => {
      const images = heritageImages(p);
      return {
        name: p.name,
        type: p.type,
        description: p.description,
        images,
        // Do not claim a Commons photograph for coordinate-only pins. The
        // distinction is useful to the UI/admin audit and keeps attribution
        // honest while the catalogue is curated further.
        imageSource: images[0].startsWith('/api/heritage-image')
          ? 'Wikimedia Commons · нэр эсвэл ойролцоох газрын зураг'
          : 'Wikimedia Commons · curated photograph',
        aimag: { name: p.aimag },
        lat: p.lat,
        lng: p.lng,
        googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery || `${p.lat},${p.lng}`)}`,
        catalog: true,
      };
    }) : [];
    return NextResponse.json([...pins, ...catalogue], {
      headers: includeCatalog
        ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }
        : undefined,
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, type, description, images, aimagId, lat, lng, googleMapUrl } = await request.json();
    if (!name || !type || !description || !aimagId) {
      return NextResponse.json({ error: 'Нэр, төрөл, тайлбар, аймаг шаардлагатай' }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length < 1 || images.length > 4) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    const pin = await prisma.scenicPin.create({
      data: {
        name, type, description, images,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        googleMapUrl,
        addedBy: user.userId,
      },
    });
    return NextResponse.json(pin, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
