'use client';

// Big Bang — Maps (/maps): aimag pin map, add-place form, pin detail panel.
import { Fragment, useContext, useEffect, useState } from 'react';
import { Accessibility, AlertTriangle, Globe, Heart, Layers, LocateFixed, MapPin, Phone } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';
import { imgUrl } from '@/components/bigbang/data';
import { getRatingSummary, submitRating, type RatingSummary } from '@/lib/ratings';

// Live score for the selected pin, read from and written to the same rows the
// detail pages use (V.pinSel.ratingKey is the shared '<kind>:<id>' key). Its
// own component so selecting a different pin remounts it — one fetch per pin,
// and no stale average flashing under the new name.
function PinRating({ V, targetKey }: { V: any; targetKey: string }) {
  const [summary, setSummary] = useState<RatingSummary>({ average: null, count: 0, mine: null });
  useEffect(() => {
    if (!targetKey) return;
    let cancelled = false;
    getRatingSummary(targetKey, V.mySessionToken).then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [targetKey, V.mySessionToken]);

  const rate = async (score: number) => {
    if (!V.loggedIn) { V.openUserAuth(); return; }
    // Optimistic, then corrected by whatever the server actually stored —
    // the average can only be recomputed there.
    setSummary((s) => ({ ...s, mine: score }));
    try {
      setSummary(await submitRating(V.mySessionToken, targetKey, score));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };
  const mine = summary.mine || 0;

  return (
    // Wraps rather than compressing: in a narrow rail the score and the five
    // stars don't have to share a line, and squeezing them together shrank the
    // stars into an unclickable row.
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[17px] font-extrabold leading-none text-cream">{summary.average != null ? summary.average.toFixed(1) : '—'}</span>
        <span className="text-[11px] text-[rgba(242,237,227,.45)]">{summary.count > 0 ? `${summary.count} үнэлгээ` : 'Үнэлгээгүй'}</span>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => rate(n)}
            title={`${n} од`}
            className="cursor-pointer border-0 bg-transparent p-0.5 text-base leading-none transition-transform duration-150 hover:scale-125"
            style={{ color: n <= mine ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)' }}
          >★</button>
        ))}
      </div>
    </div>
  );
}

// Small all-caps heading that separates the panel's blocks. Each block is one
// kind of thing, so the eye can skip to the one it wants instead of reading a
// single undifferentiated column. The label and the spacing do that on their
// own — no rules between blocks, which only added lines to look past.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-none flex-col gap-2 pt-1">
      <div className="text-[10px] font-bold uppercase tracking-[.1em] text-[rgba(242,237,227,.35)]">{title}</div>
      {children}
    </div>
  );
}

// Everything known about the selected pin. On desktop this fills a permanent
// right-hand rail, which is why it carries the full listing (gallery, live
// rating, description, contact, coordinates) instead of a teaser plus a
// "Дэлгэрэнгүй" link out to a detail page.
function PinPanel({ V }: { V: any }) {
  const p = V.pinSel;
  const gallery: string[] = ((p && p.images && p.images.length ? p.images : [p && p.img]) as string[]).filter(Boolean);
  // Which gallery photo the big frame is showing. Safe to reset by remount
  // rather than by effect because the call sites key this component on the
  // pin — a new pin gets a fresh component, and index 0 with it.
  const [active, setActive] = useState(0);
  if (!p) return null;
  const body = p.description || p.desc || '';
  // Same gradient + url() shape BigBangLayout builds for pinSel.thumb, rebuilt
  // here because the frame now shows whichever photo was picked, not only the
  // first one.
  const mainBg = `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.35)), url("${imgUrl(gallery[active] || p.img || '', 640)}")`;
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {/* Sized by ratio rather than a fixed height so it grows with the rail
          instead of staying a stamp on a wide screen — the rail is a share of
          the viewport, so a pixel height that suits a laptop is tiny on a
          large monitor. The min-h keeps it from collapsing at the narrow end. */}
      <BgMedia key={active} bg={mainBg} className="relative aspect-[16/9] min-h-[170px] flex-none rounded-[13px]" imgClassName="bg-cover bg-center" />
      {/* Every photo is in the strip, the one on show included — leaving it
          out made the strip disagree with the frame about how many photos
          there are, and gave no way back to the first once you left it. */}
      {gallery.length > 1 && (
        <div className="bb-hscroll flex flex-none gap-2 overflow-x-auto">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Зураг ${i + 1}`}
              aria-current={i === active}
              className="h-[52px] w-[74px] flex-none cursor-pointer rounded-lg border-0 bg-cover bg-center p-0 transition-opacity duration-200"
              style={{
                backgroundImage: `url("${imgUrl(src, 200)}")`,
                // An inset ring, not an outline: an outline is drawn outside
                // the element's box, and this strip scrolls — overflow-x:auto
                // forces overflow-y to compute as non-visible too (CSS spec:
                // one axis can't stay visible once the other isn't), so the
                // ring was being clipped off on all four sides.
                boxShadow: i === active ? 'inset 0 0 0 2px var(--accent,#E8B84B)' : 'none',
                opacity: i === active ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* The aimag trails the name instead of sitting in a chip row: it answers
          "where", which belongs with the name. Centred against the name rather
          than sharing its baseline — it is much the smaller of the two, and on
          a shared baseline it hung off the bottom of the title instead of
          reading as a pair. */}
      <div className="flex flex-none flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[19px] font-extrabold leading-[1.2] text-cream">{p.name}</span>
        <span className="text-[12px] text-[rgba(242,237,227,.5)]">{p.aimag}</span>
        {/* Pushed to the far edge so it sits directly above the favourite
            button, the panel's other round control — the two read as one
            column of badges instead of two loose circles. Centred inside a
            slot as wide as that button (w-8) rather than simply right-aligned:
            the badge is the smaller circle, so matching right edges would
            still leave their centres a few pixels apart. Rendered only when it
            applies — as its own row it left a stray band of column gap under
            the title whenever the pin had no badge to show. */}
        {p.accShow === 'inline-flex' && (
          <span className="ml-auto flex w-8 flex-none justify-center">
            <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[rgba(255,255,255,.26)] bg-[rgba(0,0,0,.5)] text-[#8fd6c6]"><Accessibility size={12} /></span>
          </span>
        )}
      </div>

      {/* Rendered whether or not the pin can be rated, because the favourite
          button lives here now — gating the whole section on ratingKey would
          take the heart with it for pins that have no db id to rate. */}
      <Section title="Үнэлгээ">
        {/* Centred, not top-aligned: the heart is the row's other half, and
            pinned to the top it hung above the score instead of reading as
            level with it — and if the rating wraps to two lines it stays
            centred against the pair rather than climbing to the first. */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {p.ratingKey
              ? <PinRating V={V} targetKey={p.ratingKey} />
              : <span className="text-[11.5px] text-[rgba(242,237,227,.4)]">Энэ пин дээр үнэлгээ өгөх боломжгүй</span>}
          </div>
          <button onClick={p.toggleFav} aria-label="Хадгалах" className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,.2)] bg-transparent transition-all duration-200 hover:border-[var(--accent,#E8B84B)]" style={{ color: p.heartColor }}><Heart size={15} fill={p.favOn ? 'currentColor' : 'none'} /></button>
        </div>
      </Section>

      {body && (
        <Section title="Тайлбар">
          <div className="text-[12.5px] leading-[1.6] text-[rgba(242,237,227,.62)]">{body}</div>
        </Section>
      )}

      {(p.hours || p.phone || (p.lat != null && p.lng != null)) && (
        <Section title="Мэдээлэл">
          {/* One wrapping row with a hairline between entries, rather than a
              stacked list — these are three short facts, and a column of them
              took the height of a paragraph to say very little. Built from an
              array so the separators fall between whichever facts this pin
              actually has, instead of every row carrying its own leading rule
              and leaving a dangling one when the fact above is missing. */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[11.5px] text-[rgba(242,237,227,.55)]">
            {[
              p.hours ? <span key="h" className="flex items-center gap-1.5"><span className="text-[var(--accent,#E8B84B)]">◷</span>{p.hours}</span> : null,
              p.phone ? (
                <a key="p" href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-inherit no-underline hover:text-[var(--accent,#E8B84B)]">
                  <Phone size={12} className="flex-none text-[var(--accent,#E8B84B)]" />{p.phone}
                </a>
              ) : null,
              p.lat != null && p.lng != null ? (
                <span key="c" className="flex items-center gap-1.5"><MapPin size={12} className="flex-none text-[var(--accent,#E8B84B)]" />{Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)}</span>
              ) : null,
            ].filter(Boolean).map((node, i) => (
              <Fragment key={i}>
                {i > 0 && <span aria-hidden className="h-3 w-px flex-none bg-[rgba(255,255,255,.16)]" />}
                {node}
              </Fragment>
            ))}
          </div>
        </Section>
      )}

      {/* Both rows pushed to the bottom together via mt-auto on the wrapper —
          putting it on just the last row would leave the detail button
          floating in the middle whenever the content above is short. */}
      {/* All three on one row at one width: flex-1 with basis-0 on each, so
          the row is divided evenly rather than by how long each label
          happens to be. Three buttons of three different widths read as
          three different kinds of thing; here they are one set of choices,
          and only the colour should say which is which.

          Equal thirds is a tight budget — about 109px each in the rail's
          usual width — so the labels are cut to fit it rather than left to
          overflow: no arrow after Дэлгэрэнгүй (the accent fill already says
          it is the action), and "Google Map" instead of the full
          "Google Map-аар харах", which is kept as the title. The shared
          L.openMaps stays long for the detail pages, where it has the room.

          Matching radius and vertical padding across all three, since side
          by side any difference in either reads as a mistake. */}
      <div className="mt-auto flex flex-none items-center gap-1.5 pt-3">
        {/* p.openDetail is unset for pins with nothing to open — synthetic
            near-me-scatter points and the like (see pinDetailOpen in
            BigBangLayout) — so the button only renders where a real detail
            page exists behind it, rather than linking to nowhere. */}
        {p.openDetail && (
          <button onClick={p.openDetail} title={V.L.detail} className="min-w-0 flex-1 basis-0 cursor-pointer truncate rounded-[11px] border border-[var(--accent,#E8B84B)] bg-[var(--accent,#E8B84B)] px-2.5 py-2.5 text-center font-[inherit] text-[11.5px] font-bold text-[#132a1f] transition-all duration-200 hover:opacity-85">
            {V.L.detail}
          </button>
        )}
        <a href={p.mapUrl} target="_blank" rel="noopener" title={V.L.openMaps} className="box-border flex min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center gap-1.5 rounded-[11px] border border-[rgba(66,133,244,.4)] bg-[rgba(66,133,244,.14)] px-2.5 py-2.5 font-[inherit] text-[11.5px] font-bold text-[#8ab4f8] no-underline transition-all duration-200 hover:bg-[rgba(66,133,244,.22)]">
          <MapPin size={13} className="flex-none" /><span className="truncate">Google Map</span>
        </a>
        <button onClick={V.closePin} className="min-w-0 flex-1 basis-0 cursor-pointer truncate rounded-[11px] border border-[rgba(242,237,227,.25)] bg-transparent px-2.5 py-2.5 text-center font-[inherit] text-[11.5px] font-bold text-[rgba(242,237,227,.75)] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">{V.L.close}</button>
      </div>
    </div>
  );
}

// Both map-control panels stack in the same corner, so they share one width.
// Set by the longest button label in either — "Тарвага — тахлын эрсдэл" — since
// the pills are whitespace-nowrap and overflow rather than reflow below it.
// Sized against the 10.5px pill text plus the dot, the pill's own padding and
// the panel's: shrinking any of those is what let the width come down from the
// 196px the 11.5px type needed.
const PANEL_W = 'w-[176px]';

export default function MapsPage() {
  const V: any = useContext(BigBangContext);
  // Both legend panels (road overlays + hazard zones) used to sit permanently
  // open over the map, crowding it even when nobody needed them. Now they
  // share one toggle button, sidebar-style — hidden until asked for, closed
  // again on request rather than always taking up the corner.
  const [legendOpen, setLegendOpen] = useState(false);
  // The rail is permanent on desktop, so the map box never changes size and
  // Leaflet needs no invalidateSize() when a pin is picked. It also means the
  // page reads as map + detail rather than map with something floating on top.
  return (
    <section data-screen-label="Пин — газрын зураг" className="relative h-screen overflow-hidden bg-ink">
      {/* A flex row rather than percentage-positioned boxes: percentages here
          resolve against the full viewport, so they ignore the page's own 16px
          margins and the gutter between the two panes — the split drifted off
          its stated ratio and the map ended up flush against the rail with no
          gap at all. flex-[8]/flex-[2] divides what is actually left after the
          margins and the gap, so 80/20 is 80/20 at any width. */}
      <div className={`absolute inset-0 box-border flex gap-3 px-4 pb-4 ${V.isMobile ? 'pt-[66px]' : 'pt-[72px]'}`}>
        {/* The Leaflet container is its own absolutely-filled child so the map
            controls below can be positioned against the map's edges without
            being appended into the element Leaflet manages. */}
        <div className="relative min-w-0 flex-[8]">
          {/* The crosshair has to beat Leaflet's own .leaflet-grab /
              .leaflet-interactive cursors, which sit on the very same
              elements at the same specificity — hence the important
              modifier and the descendant rule for the aimag polygons. */}
          <div
            ref={V.mainMapRef}
            className={`absolute inset-0 isolate overflow-hidden rounded-[18px] bg-[#1a2534] ${V.pickingLocation ? '!cursor-crosshair [&_.leaflet-interactive]:!cursor-crosshair' : ''}`}
          ></div>

          {/* Only while placing. Centred over the map rather than tucked in
              the panel: the instruction is about the map, and the click it
              asks for happens anywhere out here. */}
          {V.pickingLocation && (
            <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[var(--accent,#E8B84B)] bg-[rgba(20,20,20,.9)] px-4 py-2 text-[11.5px] font-bold text-[var(--accent,#E8B84B)] shadow-[0_4px_18px_rgba(0,0,0,.5)] backdrop-blur-[8px]">
                <MapPin size={13} className="flex-none" />
                Байгаа газраа газрын зураг дээр дарна уу
                <button onClick={V.togglePickLocation} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[11px] font-bold text-[rgba(242,237,227,.6)] hover:text-cream">Болих ×</button>
              </div>
            </div>
          )}

        {!V.isMobile && (
          <div className="absolute left-4 top-4 z-20 flex flex-col items-start gap-2">
            <button
              onClick={() => setLegendOpen((v) => !v)}
              title="Давхаргууд"
              aria-expanded={legendOpen}
              className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border transition-all duration-200"
              style={{
                borderColor: legendOpen ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.16)',
                background: legendOpen ? 'rgba(255,255,255,.06)' : 'rgba(20,20,20,.72)',
                color: legendOpen ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.85)',
              }}
            ><Layers size={15} /></button>
            {legendOpen && (
            <>
            {/* Road/rail overlays from OpenStreetMap. Each button carries its
                own layer's colour as a swatch, since over satellite imagery
                the colour is the only thing telling the three lines apart. */}
            <div className={`flex ${PANEL_W} flex-col gap-1 rounded-xl border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.78)] p-1.5 shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px]`}>
              {V.osmLayerOpts.map((o: any) => (
                <button
                  key={o.key}
                  onClick={o.toggle}
                  disabled={o.loading}
                  className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-[inherit] text-[10.5px] font-bold transition-all duration-200 disabled:cursor-wait"
                  style={{
                    borderColor: o.active ? o.color : 'rgba(255,255,255,.18)',
                    background: o.active ? 'rgba(255,255,255,.06)' : 'transparent',
                    color: o.active ? o.color : 'rgba(242,237,227,.7)',
                  }}
                >
                  <span className="h-[3px] w-3 flex-none rounded-full" style={{ background: o.active ? o.color : 'rgba(242,237,227,.35)' }} />
                  {o.label}{o.loading ? '…' : ''}
                </button>
              ))}
              {/* ODbL requires attribution wherever the data is drawn, so it
                  appears with the layers rather than buried in a footer. Linked
                  rather than plain text — OSM's attribution guidance asks for a
                  route back to the licence, not just the credit line. */}
              {V.osmAnyOn && (
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1 text-[9px] leading-tight text-[rgba(242,237,227,.35)] no-underline hover:text-[rgba(242,237,227,.6)]"
                >© OpenStreetMap contributors</a>
              )}
            </div>

            {/* Traveller hazard zones. One at a time by design — six
                translucent fills stacked on each other turn into a single
                brown wash that answers no question at all. */}
            {/* Narrow enough to stop crowding the map, but not past the point
                where the longest label ("Тарвага — тахлын эрсдэл") would wrap
                — the pills are whitespace-nowrap, so going tighter overflows
                rather than reflows. */}
            <div className={`flex ${PANEL_W} flex-col gap-1 rounded-xl border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.78)] p-1.5 shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px]`}>
              <div className="flex items-center gap-1 px-1 text-[9px] font-bold uppercase tracking-[.06em] text-[rgba(242,237,227,.4)]">
                <AlertTriangle size={10} className="flex-none" />Аюултай амьтдын бүс
              </div>
              {V.dangerOpts.map((z: any) => (
                // The advice sits directly under the hazard it belongs to,
                // not in a box at the foot of the list — down there it read as
                // a note about the whole panel, and with six buttons between
                // the press and the text it was easy to miss that anything
                // had appeared at all.
                <Fragment key={z.key}>
                  <button
                    onClick={z.pick}
                    className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-left font-[inherit] text-[10.5px] font-bold transition-all duration-200"
                    style={{
                      borderColor: z.active ? z.color : 'rgba(255,255,255,.18)',
                      background: z.active ? 'rgba(255,255,255,.06)' : 'transparent',
                      color: z.active ? z.color : 'rgba(242,237,227,.7)',
                    }}
                  >
                    <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: z.active ? z.color : 'rgba(242,237,227,.3)' }} />
                    {z.label}
                  </button>
                  {z.active && (
                    // Left border in the hazard's own colour, tying the text
                    // to the button above it rather than leaving it floating
                    // as another item in the same stack.
                    <div
                      className="mb-0.5 ml-2.5 flex flex-col gap-0.5 rounded-r-lg bg-[rgba(255,255,255,.04)] py-1 pl-2 pr-1.5"
                      style={{ borderLeft: `2px solid ${z.color}` }}
                    >
                      {z.season && <div className="text-[9.5px] font-bold" style={{ color: z.color }}>{z.season}</div>}
                      <div className="text-[10px] leading-[1.45] text-[rgba(242,237,227,.7)]">{z.advice}</div>
                    </div>
                  )}
                </Fragment>
              ))}
              <div className="px-1 text-[9px] leading-tight text-[rgba(242,237,227,.35)]">Ойролцоох чиглүүлэг. Албан ёсны эх сурвалж биш.</div>
            </div>
            </>
            )}
          </div>
        )}

        {!V.isMobile && (
          // items-end so the near-me panel below lines its right edge up with
          // the pill row above it instead of hanging off the left.
          <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2.5">
              {V.mapZoomed && (
                <button onClick={V.resetMap} className="cursor-pointer whitespace-nowrap rounded-full border border-[rgba(242,237,227,.3)] bg-[rgba(20,20,20,.72)] px-3.5 py-1.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.85)] shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">← {V.L.resetMap}</button>
              )}
              <button onClick={V.openGlobe} title={V.L.globe} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border-none text-[#132a1f] shadow-[0_4px_14px_rgba(0,0,0,.35)] transition-transform duration-200 hover:-translate-y-0.5" style={{ background: V.accent }}><Globe size={15} /></button>
              <div className="relative inline-grid grid-cols-3 rounded-full border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.72)] p-[3px] shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px]">
                <div className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-full transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]" style={{ background: V.accent, transform: `translateX(${V.pinPillShift})` }}></div>
                {V.pinModeOpts.map((m: any, i: number) => (
                  <button key={i} onClick={m.pick} className="relative z-[2] flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap border-none bg-transparent px-3 py-[5px] font-[inherit] text-[11.5px] font-bold transition-colors duration-250" style={{ color: m.color }}>
                    <span>{m.label}</span>
                    <span
                      aria-label={`${m.count} пин`}
                      className="inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold leading-none tabular-nums"
                      style={{ background: m.active ? 'rgba(19,42,31,.16)' : 'rgba(255,255,255,.12)', color: m.active ? '#132a1f' : 'rgba(255,255,255,.72)' }}
                    >{m.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {V.showScenicFilters && (
              <div className="flex flex-wrap justify-end gap-1.5">
                {V.scenicFilterOpts.map((f: any) => (
                  <button
                    key={f.key}
                    onClick={f.pick}
                    title={f.active ? 'Бүх пинийг харуулах' : `${f.label} ангиллыг харуулах`}
                    aria-pressed={f.active}
                    className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 font-[inherit] text-[10.5px] font-bold transition-all duration-200"
                    style={{
                      borderColor: f.active ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.16)',
                      background: f.active ? 'var(--accent,#E8B84B)' : 'rgba(52,52,52,.88)',
                      color: f.active ? '#132a1f' : 'rgba(242,237,227,.78)',
                    }}
                  >
                    <span>{f.label}</span>
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-extrabold leading-none tabular-nums" style={{ background: f.active ? 'rgba(19,42,31,.16)' : 'rgba(255,255,255,.1)' }}>{f.count}</span>
                  </button>
                ))}
              </div>
            )}

            {V.showPlaceFilters && (
              <div className="flex flex-wrap justify-end gap-1.5">
                {V.placeFilterOpts.map((f: any) => (
                  <button
                    key={f.key}
                    onClick={f.pick}
                    title={f.active ? 'Бүх газрыг харуулах' : `${f.label} ангиллыг харуулах`}
                    aria-pressed={f.active}
                    className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 font-[inherit] text-[10.5px] font-bold transition-all duration-200"
                    style={{
                      borderColor: f.active ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.16)',
                      background: f.active ? 'var(--accent,#E8B84B)' : 'rgba(52,52,52,.88)',
                      color: f.active ? '#132a1f' : 'rgba(242,237,227,.78)',
                    }}
                  >
                    <span>{f.label}</span>
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-extrabold leading-none tabular-nums" style={{ background: f.active ? 'rgba(19,42,31,.16)' : 'rgba(255,255,255,.1)' }}>{f.count}</span>
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

        {!V.isMobile && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
            {!V.nearMeActive ? (
              <button
                onClick={V.requestMyLocation}
                disabled={V.locating}
                className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.78)] px-4 py-2 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.85)] shadow-[0_4px_14px_rgba(0,0,0,.45)] backdrop-blur-[8px] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed size={13} />
                {V.locating ? 'Байршил тодорхойлж байна…' : 'Ойрхон газар олох'}
              </button>
            ) : (
              <div className="flex w-[380px] flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.82)] p-2.5 shadow-[0_4px_14px_rgba(0,0,0,.45)] backdrop-blur-[8px]">
                <div className="flex items-center justify-between gap-3 px-0.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent,#E8B84B)]"><LocateFixed size={13} /> {V.nearCount} олдлоо</span>
                  {/* The browser's own margin of error, printed only when it's
                      wide enough to put the marker somewhere you aren't — the
                      map draws the same number as a circle. Without it a
                      3km-off fix looks like the map being wrong. */}
                  {V.myLocationManual ? (
                    <span title="Та өөрөө тавьсан байршил" className="text-[10.5px] font-semibold text-[rgba(242,237,227,.45)]">гараар</span>
                  ) : V.myAccuracyLabel ? (
                    <span title="Хөтчийн мэдээлсэн байршлын нарийвчлал" className="text-[10.5px] font-semibold tabular-nums text-[rgba(242,237,227,.45)]">{V.myAccuracyLabel}</span>
                  ) : null}
                  <div className="ml-auto flex items-center gap-2.5">
                    {/* Re-asking used to mean closing the panel and pressing
                        the original button again, which reads as giving up on
                        the feature rather than retrying it. */}
                    <button
                      onClick={V.requestMyLocation}
                      disabled={V.locating}
                      title="Байршлыг дахин тодорхойлох"
                      className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-bold text-[rgba(242,237,227,.6)] hover:text-[var(--accent,#E8B84B)] disabled:cursor-wait disabled:opacity-60"
                    >
                      <LocateFixed size={11} />{V.locating ? 'Хайж байна…' : 'Дахин'}
                    </button>
                    {/* Sits beside "Дахин" because it is the answer when
                        "Дахин" keeps returning the same wrong place — an IP
                        fix doesn't move no matter how often it's asked. */}
                    <button
                      onClick={V.togglePickLocation}
                      title="Байршлаа газрын зураг дээр өөрөө тэмдэглэх"
                      className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-bold hover:text-[var(--accent,#E8B84B)]"
                      style={{ color: V.pickingLocation ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.6)' }}
                    >
                      <MapPin size={11} />Гараар
                    </button>
                    <button onClick={V.clearNearMe} className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-[rgba(242,237,227,.6)] hover:text-[var(--accent,#E8B84B)]">Хаах ×</button>
                  </div>
                </div>
                <div className="flex flex-nowrap justify-end gap-1.5">
                  {V.nearRadiusOpts.map((r: any, i: number) => (
                    <button key={i} onClick={r.pick} className="cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 font-[inherit] text-[11px] font-bold transition-all duration-200" style={{ borderColor: r.active ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.2)', background: r.active ? 'var(--accent,#E8B84B)' : 'transparent', color: r.active ? '#132a1f' : 'rgba(242,237,227,.75)' }}>{r.label}</button>
                  ))}
                </div>
              </div>
            )}
            {/* A denied or failed lookup used to be a dead end. Placing the
                point by hand needs no permission and no fix at all, so the
                offer belongs right here in the failure. */}
            {V.locationError && (
              <div className="flex max-w-[260px] flex-col items-end gap-1.5 rounded-xl border border-[rgba(240,138,138,.4)] bg-[rgba(20,20,20,.88)] px-3 py-2 text-right text-[11px] font-semibold text-[#f08a8a]">
                {V.locationError}
                <button onClick={V.togglePickLocation} className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-[inherit] text-[11px] font-bold text-[var(--accent,#E8B84B)] hover:underline">
                  <MapPin size={11} />Газрын зураг дээр гараар тэмдэглэх
                </button>
              </div>
            )}
          </div>
        )}

        </div>

        {!V.isMobile && (
          <aside className="relative z-[18] box-border min-w-0 flex-[2] overflow-hidden rounded-[18px] border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.88)] p-4 backdrop-blur-[18px]">
            {/* Keyed on the pin so picking a different one remounts the panel:
                the gallery index resets to the first photo, and the rating
                starts empty instead of showing the previous pin's average
                until its own fetch lands. */}
            {V.pinSel ? <PinPanel key={V.pinSel.ratingKey || V.pinSel.name} V={V} /> : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <MapPin size={26} className="text-[rgba(242,237,227,.25)]" />
                <div className="text-[13px] leading-[1.6] text-[rgba(242,237,227,.45)]">{V.L.panelHint}</div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile keeps the pin card as a floating sheet — there is no room
          beside the map for a rail, and halving the width would leave neither
          half usable. */}
      {V.isMobile && V.pinSel && (
        <div className="absolute inset-x-3 bottom-3 z-20 max-h-[64vh] overflow-y-auto rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.94)] p-3 backdrop-blur-[18px] [animation:bbCardIn_.45s_cubic-bezier(.22,.8,.3,1)_both]">
          <PinPanel key={V.pinSel.ratingKey || V.pinSel.name} V={V} />
        </div>
      )}
    </section>
  );
}
