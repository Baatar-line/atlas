/**
 * Downloads Mongolia's road, railway, river and bridge geometry from
 * OpenStreetMap and writes it to public/osm/*.geojson. Run with
 * `bun run sync:osm`.
 *
 * Baked into files rather than queried at runtime on purpose. Overpass is a
 * free, shared, heavily rate-limited service — it returned "server is probably
 * too busy" to one of these very queries while this was being written — so a
 * map layer that called it on every toggle would be slow when it worked and
 * broken when it didn't. The road network barely changes; re-run this when it
 * needs refreshing.
 *
 * Data © OpenStreetMap contributors, ODbL. Attribution is required wherever
 * these layers are drawn — see the map page's layer toggles.
 *
 * Not in prisma/ like the other sync scripts because nothing here touches the
 * database: this is static geometry served straight from public/, which also
 * keeps it out of Neon (same reasoning as CountrySite's remote image URLs).
 */
import fs from 'fs';
import path from 'path';

// Tried in order — the main instance is the busiest and fails most often.
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const PAVED = '^(asphalt|paved|concrete|paving_stones)$';
const MAIN = '^(motorway|trunk|primary|secondary)$';

interface Layer {
  file: string;
  label: string;
  query: string;
  /** Collapses every LineString feature to a single point at its geometric
   * midpoint. For layers like bridges, where the source is a short road
   * segment but what the map actually wants to mark is "a crossing exists
   * here", not the segment's exact few dozen metres. */
  asMidpoints?: boolean;
  /** Ramer-Douglas-Peucker tolerance in degrees, applied to every line and
   * polygon ring. Riverbank outlines in particular are traced from satellite
   * imagery at a detail no country-scale map can show — one ring came back
   * with ~2000 points for a shape that renders as a few dozen pixels wide —
   * so simplification is what keeps the file a sane size without visibly
   * changing the shape at the zoom this is ever viewed at.
   */
  simplifyDeg?: number;
}

// Ramer-Douglas-Peucker: keeps the points that matter to a line's shape and
// drops the ones a straight segment between their neighbours already
// approximates within `eps`. Iterative with an explicit stack rather than
// recursive — some of these rings are long enough that recursion depth would
// otherwise be a real concern.
function simplify(points: [number, number][], eps: number): [number, number][] {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  const distSq = (p: [number, number], a: [number, number], b: [number, number]) => {
    const [x, y] = p, [ax, ay] = a, [bx, by] = b;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return (x - ax) ** 2 + (y - ay) ** 2;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const px = ax + t * dx, py = ay + t * dy;
    return (x - px) ** 2 + (y - py) ** 2;
  };
  while (stack.length) {
    const [lo, hi] = stack.pop() as [number, number];
    let maxD = 0, maxI = -1;
    for (let i = lo + 1; i < hi; i += 1) {
      const d = distSq(points[i], points[lo], points[hi]);
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > eps * eps) {
      keep[maxI] = 1;
      stack.push([lo, maxI], [maxI, hi]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Overpass `out geom` returns three shapes and they need different handling:
// a node is a point, a way is a line (a Polygon when its ends meet), and a
// relation carries its member ways' geometry instead of its own.
//
// Relation members are emitted as separate polygons rather than assembled into
// a proper multipolygon with holes. Real ring assembly is a chunk of work for
// something nothing here reads — these are drawn as translucent shapes, where
// an unfilled hole is invisible and an extra outline costs nothing.
function toFeatures(elements: any[]): any[] {
  const out: any[] = [];
  const ring = (geom: any[]) => geom.map((g: any) => [round(g.lon), round(g.lat)]);
  const closed = (c: number[][]) => c.length > 3 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1];
  const push = (geometry: any) => out.push({ type: 'Feature', properties: {}, geometry });

  elements.forEach((el: any) => {
    if (el.type === 'node' && el.lat != null) {
      push({ type: 'Point', coordinates: [round(el.lon), round(el.lat)] });
      return;
    }
    if (Array.isArray(el.geometry) && el.geometry.length > 1) {
      const c = ring(el.geometry);
      push(closed(c) ? { type: 'Polygon', coordinates: [c] } : { type: 'LineString', coordinates: c });
      return;
    }
    if (el.type === 'relation' && Array.isArray(el.members)) {
      el.members
        .filter((mem: any) => Array.isArray(mem.geometry) && mem.geometry.length > 1 && mem.role !== 'inner')
        .forEach((mem: any) => {
          const c = ring(mem.geometry);
          push(closed(c) ? { type: 'Polygon', coordinates: [c] } : { type: 'LineString', coordinates: c });
        });
    }
  });
  return out;
}

const LAYERS: Layer[] = [
  {
    file: 'mn-roads-paved',
    label: 'Хатуу хучилттай зам',
    // surface is what makes this answerable at all — a raster basemap draws
    // every road the same way, so "which of these is actually sealed" can only
    // come from the underlying tags.
    query: `way(area.mn)["highway"~"${MAIN}"]["surface"~"${PAVED}"];`,
  },
  {
    file: 'mn-roads-unpaved',
    label: 'Шороон зам',
    // Same road classes, everything the paved filter didn't take — including
    // ways with no surface tag at all, which in Mongolia are far more often
    // unsealed than not.
    query: `way(area.mn)["highway"~"${MAIN}"]["surface"!~"${PAVED}"];`,
  },
  {
    file: 'mn-railways',
    label: 'Төмөр зам',
    // railway=rail only: sidings, yards and disused track would triple the
    // line count without adding anything a traveller reads off a map.
    query: `way(area.mn)["railway"="rail"];`,
  },
  {
    file: 'mn-rivers',
    label: 'Гол, мөрөн',
    // Two different shapes of the same thing, deliberately combined into one
    // file: `waterway=river|canal` centerlines exist for essentially every
    // river (4,789 of them), but only 615 also have their bank outline mapped
    // (`waterway=riverbank`, or `natural=water`+`water=river` in newer
    // tagging) — that outline is the only place actual width comes from, OSM
    // has no reliable width *tag* (57 rivers out of 4,789 carry one, too thin
    // to build anything on). Streams are left out: at country scale they're
    // both invisible and numerous enough (8,541) to tell the file size than
    // the map.
    //
    // toFeatures() below draws whichever shape came back — LineString where
    // only a centerline exists, Polygon where a real outline was mapped — so
    // a river reads as a thin line for most of its length and visibly widens
    // wherever OSM actually captured that.
    query: `(
      way(area.mn)["waterway"~"^(river|canal)$"];
      way(area.mn)["waterway"="riverbank"];
      way(area.mn)["natural"="water"]["water"="river"];
      relation(area.mn)["natural"="water"]["water"="river"];
    );`,
    // ~0.001° is ~110m at this latitude — still invisible as a shape change
    // on a map where the whole ~2000km-wide country renders in a browser
    // window, and it's what got the file down from an initial 16.5MB
    // (unsimplified) to a size in line with the other layers.
    simplifyDeg: 0.001,
  },
  {
    file: 'mn-bridges',
    label: 'Гүүр',
    // highway+bridge=yes tags the *road segment* that crosses the water, not
    // a bridge object — at country scale that segment (usually a few dozen
    // metres) is invisible as a line, so asMidpoints collapses each one to a
    // single point marking where a crossing exists.
    query: `way(area.mn)["bridge"="yes"]["highway"];`,
    asMidpoints: true,
  },
  {
    file: 'mn-mining',
    // Named for what the data honestly is. OSM has ~127 of these for the whole
    // country — individual pits and shafts that mappers happened to trace, not
    // licence areas. Mongolia's actual mining concessions live with MRAM and
    // aren't published in a form this can read, so calling the layer "mining
    // zones" would promise a completeness it does not have.
    label: 'Мэдэгдэж буй уурхай, карьер',
    query: `(
      way(area.mn)["landuse"="quarry"];
      relation(area.mn)["landuse"="quarry"];
      way(area.mn)["industrial"="mine"];
      node(area.mn)["man_made"="mineshaft"];
    );`,
  },
];

async function overpass(query: string): Promise<any> {
  const body = `[out:json][timeout:240];\narea["ISO3166-1"="MN"][admin_level=2]->.mn;\n${query}\nout geom;`;
  let lastErr: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BigBang-Mongolia-App/1.0 (admin@bigbang.mn)' },
        body: `data=${encodeURIComponent(body)}`,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();
      // A busy instance answers 200 with an HTML error page, not JSON.
      if (!text.trimStart().startsWith('{')) throw new Error(text.replace(/<[^>]*>/g, ' ').trim().slice(0, 160));
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      console.log(`  ${new URL(url).host} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw lastErr;
}

// 5 decimals is ~1m at this latitude — far finer than a line drawn 2px wide on
// a country-scale map, and it roughly halves the file next to raw precision.
const round = (n: number) => Number(n.toFixed(5));

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'osm');
  fs.mkdirSync(outDir, { recursive: true });

  // Overpass mirrors time out often enough that re-running the whole set to
  // add one layer means re-fetching — and re-failing on — layers that were
  // already fine. Existing files are left alone unless named explicitly or
  // --force is passed:
  //   bun run sync:osm                 every layer that has no file yet
  //   bun run sync:osm mn-mining       just that one, overwriting it
  //   bun run sync:osm --force         all of them, from scratch
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const named = args.filter((a) => !a.startsWith('--'));
  const wanted = LAYERS.filter((l) => (named.length ? named.includes(l.file) : force || !fs.existsSync(path.join(outDir, `${l.file}.geojson`))));
  if (!wanted.length) { console.log('Nothing to do — every layer already has a file (pass --force to refetch).'); return; }

  for (const layer of wanted) {
    console.log(`${layer.label}…`);
    const data = await overpass(layer.query);
    // No ids and no tags on the features: nothing renders them, and carrying
    // the tag bag would multiply the file size for data the map never reads.
    let features = toFeatures(data.elements || []);
    if (layer.simplifyDeg) {
      const eps = layer.simplifyDeg;
      features = features.map((f) => {
        if (f.geometry.type === 'LineString') {
          return { ...f, geometry: { ...f.geometry, coordinates: simplify(f.geometry.coordinates, eps) } };
        }
        if (f.geometry.type === 'Polygon') {
          const ring = simplify(f.geometry.coordinates[0], eps);
          // simplify() can drop the ring below 4 points (a closed ring needs
          // at least a triangle plus its repeated closing point); fall back
          // to the original rather than emit invalid GeoJSON.
          const closed = ring.length >= 4 ? ring : f.geometry.coordinates[0];
          return { ...f, geometry: { ...f.geometry, coordinates: [closed] } };
        }
        return f;
      });
    }
    if (layer.asMidpoints) {
      features = features
        .filter((f) => f.geometry.type === 'LineString')
        .map((f) => {
          const coords: [number, number][] = f.geometry.coordinates;
          const mid = coords[Math.floor(coords.length / 2)];
          return { ...f, geometry: { type: 'Point', coordinates: mid } };
        });
    }
    const target = path.join(outDir, `${layer.file}.geojson`);
    fs.writeFileSync(target, JSON.stringify({ type: 'FeatureCollection', features }));
    const kb = Math.round(fs.statSync(target).size / 1024);
    console.log(`  ${features.length} lines → public/osm/${layer.file}.geojson (${kb} KB)`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
