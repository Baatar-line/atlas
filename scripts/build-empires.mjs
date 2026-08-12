/* Builds public/assets/empires.json — the peak extent of the ten largest
   empires in history, as drawn on the /globe globe.
 *
 * Source: github.com/aourednik/historical-basemaps (CC-BY-4.0), one GeoJSON
 * per year of world borders. Hand-drawn empire blobs were the alternative and
 * they look like blobs; this gives real coastlines, at the cost of a build
 * step. Each empire below picks its member polygons out of the year file
 * closest to its peak, unions them so internal borders don't show as seams,
 * and simplifies the result down to what a 2048×1024 globe texture can
 * actually resolve.
 *
 * Run: node scripts/build-empires.mjs [--cache <dir>]
 * The year files are ~1-2 MB each and are fetched once into the cache dir.
 */
import fs from 'fs';
import path from 'path';
import * as d3 from 'd3-geo';
import polygonClipping from 'polygon-clipping';

const CACHE = process.argv.includes('--cache')
  ? process.argv[process.argv.indexOf('--cache') + 1]
  : path.join(process.cwd(), '.cache/historical-basemaps');
const OUT = path.join(process.cwd(), 'public/assets/empires.json');
const RAW = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_';

// `year` is the source file, `peak` the label shown in the UI — they differ
// wherever the dataset has no file for the peak year itself (Qing's 1790 peak
// is read off the 1800 borders, the Mongol 1270–1309 span off 1279).
const EMPIRES = [
  { id: 'british', year: 1920, area: 35.5, subject: /^United Kingdom/, names: [
    'United Kingdom of Great Britain and Ireland', 'Dominion of Newfoundland', 'Canada', 'Australia', 'New Zealand',
    'Union of South Africa', 'British Raj', 'Ceylon', 'Malaysia', 'Brunei', 'Hong Kong', 'Egypt', 'Sudan',
    'British Somaliland', 'Kenya', 'Uganda', 'Tanzania, United Republic of', 'Zambia', 'Zimbabwe', 'Malawi',
    'Botswana', 'Lesotho', 'Swaziland', 'Nigeria', 'Ghana', 'Sierra Leone', 'Gambia, The', 'Guyana', 'Belize',
    'Jamaica', 'Trinidad', 'Barbados', 'Fiji', 'Papua New Guinea', 'Cyprus', 'Malta', 'Bahamas', 'Nepal',
    'Mandatory Palestine (GB)', 'Mesopotamia (GB)', 'Muscat and Oman', 'Qatar', 'Trucial Oman', 'Aden',
  ] },
  // Novgorod paid tribute to the Horde but was never occupied, and at ~1.5M km²
  // it is the difference between this outline and the cited 24M figure.
  { id: 'mongol', year: 1279, peak: '1270–1309', area: 24.0, subject: /^Mongol Empire$/, exclude: ['Novgorod'] },
  { id: 'russian', year: 1900, peak: 1895, area: 22.8, names: ['Russian Empire'] },
  { id: 'qing', year: 1800, peak: 1790, area: 14.7, names: ['Qing Empire'] },
  { id: 'spanish', year: 1800, peak: 1810, area: 13.7, subject: /^Spain$/, names: [
    'Spain', 'Philippines', 'Viceroyalty of the Río de la Plata',
  ] },
  { id: 'french', year: 1920, area: 11.5, subject: /^France$/, names: [
    'France', 'Algeria', 'Tunisia', 'Morocco', 'French Indo-China', 'Annam', 'Cochin China', 'Madagascar (France)',
    'French Guiana', 'Guadeloupe', 'Martinique',
  ] },
  // Composed rather than taken whole: the dataset's nearest snapshots are 700
  // (which draws the caliphate at 1.7M km², before the conquests that made it
  // the largest state on earth) and 800 (by which time the Abbasids had taken
  // the east and lost the west). The 720 empire is the 800 file's Abbasid core
  // plus exactly those western territories that had broken away from it —
  // al-Andalus and the Maghreb — which is how it is drawn here.
  { id: 'umayyad', year: 800, peak: 720, area: 11.1, names: [
    'Abbasid Caliphate', 'Emirate of Córdoba', 'Idrisid Caliphate', 'Aghlabid Emirate',
  ] },
  { id: 'abbasid', year: 800, peak: 750, area: 11.1, names: ['Abbasid Caliphate'] },
  { id: 'yuan', year: 1300, peak: 1310, area: 11.0, names: ['Great Khanate'] },
  { id: 'portuguese', year: 1815, area: 10.4, subject: /^Portugal$/, names: [
    'Portugal', 'Viceroyalty of Brazil', 'Portuguese East Africa', 'Angola', 'Goa', 'Delagoa Bay', 'Portuguese Guinea',
  ] },

  // ── 11-25 ──────────────────────────────────────────────────────────────
  // Five of these carry hand-drawn `rings` (see the note on `approx` below)
  // because the dataset either has no feature for them at all or draws them at
  // a third of their cited size. Everything else is dataset geometry.
  { id: 'turk', year: 600, peak: 557, area: 10.0, approx: true, rings: [[
    [112,53],[120,51],[124,47],[121,43],[113,41],[105,40],[97,40],[89,41],[81,42],[73,42],[65,43],[57,44],[49,45],
    [41,45],[35,44],[31,45],[30,48],[34,51],[40,53],[48,55],[56,57],[64,58],[72,58],[80,58],[88,57],[96,56],[104,55],
  ]] },
  { id: 'xiongnu', year: 'bc200', peak: '-176', area: 9.0, approx: true, rings: [[
    [73,37],[80,36],[88,36],[94,37],[100,38],[106,39],[112,40],[118,41],[125,43],[131,45],[133,48],[129,52],
    [121,55],[113,57],[105,58],[97,57],[90,55],[84,51],[77,44],
  ]] },
  { id: 'brazilian', year: 1880, peak: 1889, area: 8.5, names: ['Kingdom of Brazil'] },
  // North America is drawn as indigenous nations in the 1715 file — New France
  // and the Louisiana claim, four fifths of this empire, simply aren't in it.
  { id: 'french1', year: 1715, peak: 1750, area: 8.0, approx: true, names: ['France', 'Louisiana'], rings: [[
    [-72,47],[-65,49],[-60,50],[-58,52],[-63,54],[-72,56],[-82,55],[-90,54],[-98,53],[-106,51],[-112,48],[-113,44],
    [-110,40],[-106,36],[-101,32],[-96,29],[-92,29],[-89,30],[-85,32],[-83,36],[-82,40],[-80,43],[-76,45],
  ]] },
  // 1942 is past the end of the dataset's 1938 file, so the conquests are
  // added as their 1938 selves — which is exactly what Japan occupied — plus a
  // ring for occupied eastern China, which has no feature of its own.
  { id: 'japanese', year: 1938, peak: 1942, area: 7.4, approx: true, names: [
    'Empire of Japan', 'Philippines', 'Malaysia', 'Brunei', 'Dutch East Indies', 'French Indo-China',
    'Cambodia', 'Cochin China', 'Laos', 'Hong Kong', 'Guam', 'Saipan',
  ], rings: [[
    [116,41],[122,41],[124,39],[122,36],[121,32],[121,28],[118,25],[114,23],[110,21.5],[108,21],[106,23],
    [108,26],[110,29],[112,32],[112,36],[114,39],
  ]] },
  { id: 'han', year: 100, peak: '100', area: 6.5, names: ['Han'] },
  { id: 'ming', year: 1500, peak: 1450, area: 6.5, names: ['Ming Chinese Empire'] },
  // No Rashidun feature in either neighbouring file: 600 is still Sassanid and
  // Byzantine, 700 is already Umayyad and drawn at 1.7M km².
  { id: 'rashidun', year: 700, peak: 655, area: 6.4, approx: true, rings: [[
    [25,31],[32,31.5],[36,36],[41,37],[46,39],[52,40],[58,39],[63,38],[67,36],[69,32],[63,26],[57,25],[52,26],
    [50,22],[48,18],[45,13],[43,12],[40,16],[38,21],[35,25],[33,28],[30,29],[27,30],
  ]] },
  { id: 'goldenhorde', year: 1300, peak: 1310, area: 6.0, subject: /Golden Horde/, names: ['Khanate of the Golden Horde'] },
  { id: 'achaemenid', year: 'bc500', peak: '-500', area: 5.5, names: ['Achaemenid Empire'] },
  // The 700 file labels the Chinese state "Sui" — that dynasty ended in 618,
  // so at year 700 the outline it draws is Tang, and it is much closer to the
  // 715 peak than the 800 file's post-An-Lushan Tang.
  { id: 'tang', year: 700, peak: 715, area: 5.4, names: ['Sui Empire'] },
  { id: 'macedon', year: 'bc323', peak: '-323', area: 5.2, names: ['Empire of Alexander'] },
  { id: 'ottoman', year: 1650, peak: 1683, area: 5.2, names: ['Ottoman Empire'] },
  { id: 'maurya', year: 'bc200', peak: '-250', area: 5.0, names: ['Mauryan Empire'] },
  { id: 'roman', year: 100, peak: '117', area: 5.0, subject: /^Roman Empire$/, names: ['Roman Empire'] },
];

/* ── The Mongol timeline on the /globe history bar ────────────────────────
   The five dates were hand-drawn blobs to begin with, which is exactly what
   they looked like. Each one is now assembled out of the same dataset, by
   naming the states the empire actually held that year — so 1227 is the 1200
   file's Mongol homeland plus Xi Xia, Jin, Kara Khitai and Khwarazm, drawn
   along their own borders rather than around a convex hull of them.

   `at` is where a part's name is painted on the globe texture, and is only set
   for 1260, the one year that shows four states at once. */
const ERA_GOLD = '#E8B84B', ERA_BLUE = '#6FA8DC', ERA_GREEN = '#8FD14F', ERA_CLAY = '#D9705A';
const SEA_BLUE = '#4FC3E8';   // the sea-access band on the 1368 map

const ERAS = [
  // Temüjin is proclaimed Genghis Khan over the united Mongol tribes: the
  // homeland only, before any conquest.
  { year: 1206, parts: [{ color: ERA_GOLD, year: 1200, names: ['Mongol Empire'] }] },

  // At Genghis's death. Xixia fell 1227, the Jin north of the Yellow River by
  // 1215 (the 1200 file calls that state Liao), Kara Khitai 1218, the
  // Khwarazmian empire and the Ghaznavid lands 1219-1221.
  { year: 1227, parts: [{ color: ERA_GOLD, year: 1200, names: [
    'Mongol Empire', 'Xixia', 'Liao', 'Kara Khitai Khaganate', 'Kwarizm-Shah', 'Ghaznavid Emirate',
  ] }] },

  // Ögedei's campaigns: the Kipchak steppe, Volga Bulgaria and the Rus'
  // principalities are taken 1236-1240, Persia by Chormaqan in the 1230s.
  { year: 1241, parts: [
    { color: ERA_GOLD, year: 1200, names: [
      'Mongol Empire', 'Xixia', 'Liao', 'Kara Khitai Khaganate', 'Kwarizm-Shah', 'Ghaznavid Emirate',
      'Cuman Khanates', 'Volga Bulgars', 'Principality of Vladimir-Suzdal', 'Principality of Galicia-Volhynia',
      'Other Rus Principalities', 'Principality of Novgorod', 'Principality of Kyiv', 'Buwayhid Emirates',
      // Transcaucasia fell to Chormaqan's campaigns of 1236-39.
      'Armenia', 'Georgia',
    ],
      // The 1200 file draws Persia and Mesopotamia as one Buwayhid polygon.
      // Chormaqan held Persia by the 1230s, but Baghdad did not fall until
      // 1258 — so Iraq is cut back out of it.
      subtract: [{ rings: [[
        [38,33.5],[41,35.5],[44,36],[46.5,35],[49,33],[49,30],[47,29],[44,29.5],[41,31],[38,32],
      ]] }] },
    // Poland and Hungary were raided and withdrawn from, not administered, and
    // no dataset draws a border around a campaign — so this one part stays a
    // hand-drawn ring, dashed to say as much.
    { color: ERA_GOLD, dashed: true, year: 1200, rings: [[
      [16,51.5],[21,53],[26,53.5],[27,50],[25,47],[21,46],[17,48],
    ]] },
  ] },

  // The Toluid civil war splits the empire. The four khanates are drawn at
  // their 1279 borders — the earliest the dataset has them — with the Southern
  // Song cut back out of the Great Khanate, since it held out until 1279.
  { year: 1260, parts: [
    { color: ERA_GOLD, label: 'YUAN', at: [43, 108], year: 1279, names: ['Great Khanate', 'Tibet'],
      subtract: [{ year: 1200, names: ['Song Empire'] }] },
    { color: ERA_BLUE, label: 'ALTAN ORD', at: [52, 45], year: 1279, names: ['Khanate of the Golden Horde', 'Ryazan'] },
    { color: ERA_GREEN, label: 'TSAGADAI', at: [43, 68], year: 1279, names: ['Chagatai Khanate'] },
    { color: ERA_CLAY, label: 'IL KHAN', at: [32, 52], year: 1279, names: ['Ilkhanate', 'Seljuk Caliphate'] },
  ] },

  // Territorial peak — the same outline the "largest 25" tab draws for the
  // Mongol Empire, so the two tabs agree with each other.
  { year: 1279, parts: [{ color: ERA_GOLD, year: 1279, subject: /^Mongol Empire$/, exclude: ['Novgorod'] }] },

  // The Yuan is driven out of China in 1368 and the Mongol state falls back on
  // the steppe — but not yet inland. It keeps Manchuria, and with it the last
  // coastline any Mongol state would ever hold: Liaodong on the Bohai Sea
  // (Naghachu's domain, which held out until 1387) and the Primorye shore on
  // the Sea of Japan. Everything after this is landlocked.
  //
  // The territory is the 1400 file's Great Khanate — which that file still
  // draws at its full Yuan extent — cut down to what the Mongols kept: the
  // steppe and Manchuria, north of the line the Ming fortified as the Great
  // Wall, and short of the Yalu, which leaves Goryeo out. Subtracting the
  // Ming's own 1500 borders was the obvious alternative and it takes Liaodong
  // with them, which is the one piece this map exists to show.
  //
  // The sea band is that same territory intersected with an offshore box, so
  // its seaward edge is the real coast rather than a drawn line.
  { year: 1368, parts: [
    { color: ERA_GOLD, year: 1400, names: ['Great Khanate'], intersect: [{ rings: [[
      [73,46],[80,45],[88,44],[95,42],[100,40.5],[106,41],[112,41],[117,40.5],[120,40],[124,41],[127,41.5],
      [130.5,42.5],[136,45],[141,49],[144,54],[144,60],[73,60],
    ]] }] },
    { color: SEA_BLUE, label: 'DALAI', at: [46, 133], year: 1400, names: ['Great Khanate'], intersect: [
      { rings: [[
        [73,46],[80,45],[88,44],[95,42],[100,40.5],[106,41],[112,41],[117,40.5],[120,40],[124,41],[127,41.5],
        [130.5,42.5],[136,45],[141,49],[144,54],[144,60],[73,60],
      ]] },
      { rings: [[
        [116,37],[126,39.5],[133,43],[139,47],[143,52],[144,57],[138,57],[133,51],[128,46],[123,42],[116,39.5],
      ]] },
    ] },
  ] },
];

async function loadYear(year) {
  const file = path.join(CACHE, `world_${year}.geojson`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(CACHE, { recursive: true });
    const res = await fetch(`${RAW}${year}.geojson`);
    if (!res.ok) throw new Error(`world_${year}: HTTP ${res.status}`);
    fs.writeFileSync(file, await res.text());
    console.log(`  fetched world_${year}.geojson`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Douglas–Peucker on raw lng/lat. One texture pixel is ~0.18°, so anything
// under a few tenths of a degree is detail the globe can never show.
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let far = -1, best = tol;
    const [ax, ay] = pts[i], [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / len;
      if (d > best) { best = d; far = k; }
    }
    if (far > 0) { keep[far] = 1; stack.push([i, far], [far, j]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// A closed ring can't go through Douglas–Peucker directly: its first and last
// points are the same, so every vertex measures zero distance from that
// degenerate chord and the whole coastline simplifies away to nothing. Split
// it at the vertex farthest from the start and simplify the two halves.
function simplifyRing(ring, tol) {
  if (ring.length < 6) return ring;
  let mid = 1, best = -1;
  for (let k = 1; k < ring.length - 1; k++) {
    const d = Math.hypot(ring[k][0] - ring[0][0], ring[k][1] - ring[0][1]);
    if (d > best) { best = d; mid = k; }
  }
  const out = dp(ring.slice(0, mid + 1), tol).concat(dp(ring.slice(mid), tol).slice(1));
  if (out.length < 4) return null;
  const first = out[0], last = out[out.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) out.push(first.slice());
  return out;
}

// Islands smaller than a couple of texture pixels turn into specks of noise.
function bboxSpan(ring) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return Math.max(x1 - x0, y1 - y0);
}

function polygonsOf(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return [g.coordinates];
  if (g.type === 'MultiPolygon') return g.coordinates;
  return [];
}

const round = (ring) => ring.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);

function membersOf(world, spec) {
  const wanted = new Set(spec.names || []);
  return world.features.filter((f) => {
    const p = f.properties || {};
    const name = (p.NAME || '').trim();
    const sub = (p.SUBJECTO || '').trim();
    if ((spec.exclude || []).includes(name)) return false;
    return wanted.has(name) || (spec.subject && spec.subject.test(sub));
  });
}

// The polygons a spec selects: hand-drawn rings plus every member feature of
// its year file (and of any extra files named in `from`, which is how the
// timeline years are assembled — 1227 is the 1200 file's Mongol homeland plus
// every state Genghis had taken by the time he died).
async function polysOf(spec) {
  const polys = [];
  // Hand-drawn rings, split into ~2° steps: d3.geoPath resamples long edges
  // along great circles, which bows a 15°-wide steppe border poleward.
  for (const ring of spec.rings || []) {
    const dense = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 2));
      for (let s = 0; s < n; s++) dense.push([a[0] + (b[0] - a[0]) * (s / n), a[1] + (b[1] - a[1]) * (s / n)]);
    }
    dense.push(dense[0].slice());
    polys.push([dense]);
  }
  const members = [];
  if (spec.names || spec.subject) members.push(...membersOf(await loadYear(spec.year), spec));
  for (const extra of spec.from || []) members.push(...membersOf(await loadYear(extra.year), extra));
  for (const f of members) {
    for (const poly of polygonsOf(f)) {
      const rings = poly.map((r) => simplifyRing(r, 0.12)).filter(Boolean);
      if (!rings.length || bboxSpan(rings[0]) < 0.5) continue;
      polys.push(rings);
    }
  }
  return polys;
}

// One spec (an empire, or one part of one era) → one MultiPolygon.
async function geometryFor(spec, label) {
  {
    let polys = await polysOf(spec);

    // Union so the empire reads as one territory — member polygons share
    // borders, and stroking them un-unioned draws every internal frontier.
    // The union is the fragile step (historical outlines self-intersect here
    // and there), so a failure falls back to the un-unioned set rather than
    // dropping the empire.
    let merged = polys;
    try {
      merged = polygonClipping.union(polys.map((p) => [p[0], ...p.slice(1)]));
    } catch (err) {
      console.warn(`  ${label}: union failed (${err.message}) — keeping ${polys.length} separate polygons`);
    }

    // `subtract` takes territory back off — either a named state (the Great
    // Khanate is drawn at its 1279 extent, which already swallowed the
    // Southern Song two decades after the 1260 map this feeds) or a ring, for
    // where a source file's one polygon spans both a conquered and an
    // unconquered region.
    for (const cut of spec.subtract || []) {
      const cutPolys = await polysOf(cut);
      if (!cutPolys.length) continue;
      try {
        merged = polygonClipping.difference(merged, cutPolys);
      } catch (err) {
        console.warn(`  ${label}: subtract failed (${err.message})`);
      }
    }

    // `intersect` keeps only what falls inside a ring — used to cut a coastal
    // band out of a territory. Drawing that band by hand would mean tracing a
    // coastline; intersecting a rough offshore box with the real geometry
    // makes the sea edge follow the true coast for free.
    for (const keep of spec.intersect || []) {
      const keepPolys = await polysOf(keep);
      if (!keepPolys.length) continue;
      try {
        merged = polygonClipping.intersection(merged, keepPolys);
      } catch (err) {
        console.warn(`  ${label}: intersect failed (${err.message})`);
      }
    }

    // Cutting one dataset's borders out of another's leaves hairline slivers
    // wherever the two drew the same frontier a few kilometres apart. They are
    // invisible at globe scale but they multiply the part count, so they go.
    merged = merged.filter((p) => bboxSpan(p[0]) >= 0.5);

    // d3 reads polygons as spherical, where winding decides which side is
    // "inside" — polygon-clipping's output convention is the opposite one, so
    // an un-flipped ring paints the whole planet except the empire. Checked
    // per polygon rather than assumed, since the fallback path above emits
    // rings straight from the source data.
    const geometry = {
      type: 'MultiPolygon',
      coordinates: merged.map((p) => {
        const rings = p.map(round);
        return d3.geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI
          ? rings.map((r) => r.slice().reverse())
          : rings;
      }),
    };
    return geometry;
  }
}

function statsOf(geometry) {
  const km2 = d3.geoArea(geometry) * 6371 * 6371 / 1e6;
  const pts = geometry.coordinates.reduce((n, p) => n + p.reduce((m, r) => m + r.length, 0), 0);
  return { km2, pts, parts: geometry.coordinates.length };
}

// Centroid + camera distance for a set of geometries shown together.
function framingFor(geometries) {
  const all = { type: 'MultiPolygon', coordinates: geometries.flatMap((g) => g.coordinates) };
  const centroid = d3.geoCentroid(all);
  let radius = 0;
  for (const poly of all.coordinates) {
    for (const ring of poly) for (const pt of ring) radius = Math.max(radius, d3.geoDistance(centroid, pt));
  }
  radius = Math.min(radius, 1.45);
  // Two rules, whichever is farther. The linear one is fitted to the camera
  // distances these overlays were hand-tuned to before the geometry became
  // real (a 15°-wide 1206 read well at 2.9, a hemisphere-wide 1279 at 3.5);
  // the trigonometric one is the hard floor at which the far edge of the
  // territory is still on the near side of the horizon, and only takes over
  // for the empires that wrap most of the planet.
  const fitted = 2.7 + 0.9 * radius;
  const horizon = 1 / Math.cos(Math.min(radius * 1.05, 1.4));
  return {
    focus: [Math.round(centroid[1] * 10) / 10, Math.round(centroid[0] * 10) / 10],
    zoom: Math.round(Math.max(2.6, Math.min(5.2, Math.max(fitted, horizon))) * 100) / 100,
  };
}

async function build() {
  const out = {};
  for (const emp of EMPIRES) {
    const geometry = await geometryFor(emp, emp.id);
    const s = statsOf(geometry);
    console.log(
      `${emp.id.padEnd(11)} src=${String(emp.year).padEnd(4)} parts=${String(s.parts).padStart(3)} ` +
      `pts=${String(s.pts).padStart(5)} area=${s.km2.toFixed(1)}M (cited ${emp.area}M)`
    );
    // Camera framing, solved once here rather than guessed per empire in the
    // engine: point at the centroid and pull back far enough that the visible
    // cap (half-angle acos(1/distance) for a unit sphere) covers the farthest
    // vertex. Empires that wrap more than a hemisphere — the British one does —
    // clamp at the far end, where the globe is as small as it usefully gets.
    // Numeric peak year (negative for BC), which the engine needs to decide
    // which parts of the world were still unknown to the Old World then — the
    // `peak` string is display text and can read "1270–1309" or "-176".
    const peakYear = Number(String(emp.peak ?? emp.year).split('–')[0]);
    out[emp.id] = {
      year: emp.year, peak: String(emp.peak || emp.year), peakYear, citedAreaM: emp.area, approx: !!emp.approx,
      ...framingFor([geometry]),
      geometry,
    };
  }

  const eras = {};
  for (const era of ERAS) {
    const parts = [];
    for (const part of era.parts) {
      const geometry = await geometryFor(part, `${era.year} ${part.label || ''}`);
      const s = statsOf(geometry);
      parts.push({ color: part.color, label: part.label, at: part.at, dashed: !!part.dashed, geometry });
      console.log(
        `era ${era.year} ${(part.label || '·').padEnd(10)} parts=${String(s.parts).padStart(3)} ` +
        `pts=${String(s.pts).padStart(5)} area=${s.km2.toFixed(1)}M`
      );
    }
    // Campaign-reach parts are excluded from the framing — 1241's raid into
    // Poland would otherwise drag the camera west off the empire itself.
    eras[era.year] = { ...framingFor(parts.filter((p) => !p.dashed).map((p) => p.geometry)), parts };
  }

  fs.writeFileSync(OUT, JSON.stringify({
    source: 'github.com/aourednik/historical-basemaps (CC-BY-4.0), simplified',
    empires: out,
    eras,
  }));
  console.log(`\nwrote ${OUT} — ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
}

build().catch((err) => { console.error(err); process.exit(1); });
