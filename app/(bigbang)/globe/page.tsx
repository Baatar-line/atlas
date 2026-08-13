'use client';

// Big Bang — Globe (/globe): 3D country archive, mounted via the vanilla
// GlobeEngine script (see BigBangLayout.handleGlobeRef, wired via V.globeMountRef).
import { useContext, useEffect } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

// One site-card's markup — shared by the left (nature) and right (capital +
// culture/history) panels so the two six-card halves can't visually drift apart.
// `sizeClass` is the one thing the two layouts disagree about: down a column
// each card is the column's full width, along the mobile rail it is a fixed
// tile the row scrolls past. Everything else about a card is identical, which
// is the point of it being one component.
function SiteCard({ s, active, onSelect, sizeClass = 'h-[clamp(96px,10vw,140px)] min-[1920px]:h-[205px] w-full' }: { s: any; active: boolean; onSelect: () => void; sizeClass?: string }) {
  return (
    <button type="button" onClick={onSelect} className={`relative block ${sizeClass} cursor-pointer overflow-hidden rounded-2xl border bg-transparent p-0 text-left shadow-[0_16px_40px_rgba(0,0,0,.28)] transition-[border-color,box-shadow,transform] duration-200 ${active ? 'border-[var(--accent,#E8B84B)] shadow-[0_0_0_2px_rgba(232,184,75,.24),0_16px_40px_rgba(0,0,0,.28)]' : 'border-[rgba(255,255,255,.1)] hover:border-[rgba(232,184,75,.55)]'}`}>
      <BgMedia bg={s.cover} className="absolute inset-0" imgClassName="bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.12)_0%,_rgba(0,0,0,0)_34%,_rgba(0,0,0,.5)_72%,_rgba(0,0,0,.85)_100%)]"></div>
      <div className="absolute left-[11px] top-[11px] flex min-w-[30px] h-[30px] items-center justify-center rounded-[9px] border border-[rgba(255,255,255,.16)] bg-[rgba(0,0,0,.5)] px-[7px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-bold text-cream-2 backdrop-blur-[8px]">{s.n}</div>
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 px-[14px] py-3">
        <div className="mb-[5px] flex items-center gap-[5px]"><span className="text-[11px] leading-none text-[var(--accent,#E8B84B)]">★</span><span className="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] font-semibold uppercase tracking-[.06em] text-[rgba(242,237,227,.7)]">{s.tag}</span></div>
        <div className="font-display text-[clamp(14px,1.3vw,18px)] font-semibold leading-[1.15] text-cream-2 [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">{s.name}</div>
      </div>
    </button>
  );
}

// The history bar under the globe: two tabs over one strip, because both of
// them drive the overlay on the same globe, and thirty pills at once would
// take a third of a phone screen.
//
//   Монголын эзэнт гүрэн — the five dates of the Mongol timeline, one at a time
//   Хамгийн том 25       — the 25 largest empires, up to five on the globe at once
//
// Controls only — what a selection reads out is HistoryReadout's card, which
// the caller places: beside the title on desktop, stacked on this one on a
// phone. Same component on both since it is the same control; only the
// wrapper's position differs, and the wrapper is the caller's. Pills sit in a
// scroll rail rather than wrapping — 25 of them wrap to five ragged rows at
// 360px.
function HistoryBar({ V }: { V: any }) {
  const empires = V.globeTab === 'top';
  return (
    <div>
      <div className="rounded-2xl border border-[#2c2c2c] bg-[rgba(14,14,14,.88)] px-3 py-2.5 shadow-[0_18px_44px_rgba(0,0,0,.6)] backdrop-blur-[12px]">
        <div className="mb-2.5 flex items-center justify-center gap-1">
          {(V.globeTabs || []).map((t: any) => (
            <button
              key={t.id}
              onClick={() => V.globeSetTab(t.id)}
              aria-pressed={t.on}
              className={`cursor-pointer rounded-full border px-3 py-[5px] text-[10px] font-bold uppercase tracking-[.08em] transition-colors duration-200 ${t.on ? 'border-[rgba(255,255,255,.16)] bg-[rgba(255,255,255,.09)] text-[#f2f2f2]' : 'border-transparent bg-transparent text-[rgba(242,237,227,.4)] hover:text-[#cfcfcf]'}`}
            >{t.label}</button>
          ))}
        </div>

        {/* justify-center on an overflowing flex row makes its first children
            unreachable — the overflow spills off the left edge where scroll
            can't go. Only the five-year row is short enough to be safe. */}
        <div className={`bb-hscroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 ${empires ? 'justify-start' : 'justify-center'}`}>
          {empires
            ? (V.globeEmpires || []).map((e: any) => (
                <button
                  key={e.id}
                  onClick={e.set}
                  aria-pressed={e.on}
                  // Inert, not hidden, once five are on the globe: the pill
                  // stays where it was so the row doesn't reshuffle, and dims
                  // to say that this one is unavailable until a lit one is
                  // switched back off. `disabled` also takes it out of the tab
                  // order, so it can't be reached and pressed to no effect.
                  disabled={e.disabled}
                  title={e.disabled ? V.globeEmpireHint : undefined}
                  style={e.on
                    ? { borderColor: e.color, background: e.color, color: '#141414' }
                    : { borderColor: '#3a3a3a' }}
                  className={`flex-none rounded-full border px-3 py-[4px] text-[11.5px] font-bold transition-[color,opacity] duration-200 ${
                    e.on
                      ? 'cursor-pointer'
                      : e.disabled
                        ? 'cursor-not-allowed bg-[rgba(24,24,24,.55)] text-[#5a5a5a] opacity-45'
                        : 'cursor-pointer bg-[rgba(24,24,24,.9)] text-[#bdbdbd] hover:text-[#f2f2f2]'
                  }`}
                >
                  <span className="mr-1.5 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] opacity-60">{e.rank}</span>
                  {e.label}
                </button>
              ))
            : (V.globeEras || []).map((e: any) => (
                <button
                  key={e.year}
                  onClick={e.set}
                  aria-pressed={e.on}
                  className={`flex-none cursor-pointer rounded-full border px-3.5 py-[4px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-bold transition-colors duration-200 ${e.on ? 'border-[var(--accent,#E8B84B)] bg-[var(--accent,#E8B84B)] text-[#141414]' : 'border-[#3a3a3a] bg-[rgba(24,24,24,.9)] text-[#bdbdbd] hover:border-[var(--accent,#E8B84B)] hover:text-[#f2f2f2]'}`}
                >{e.year}</button>
              ))}
        </div>

      </div>
    </div>
  );
}

// What the bar produced, in a card of its own: which colour on the globe is
// which empire, and on the other tab what the year's outlines mean.
//
// It used to be four more blocks inside the bar. Two tabs, a scroll rail of 25
// pills, five legend rows and two footnotes stacked into one panel read as a
// single dense slab — nothing in it announced itself as the answer rather than
// more controls. Split in two, the bar is what you press and this is what you
// read, and each can be scanned without the other's rows in the way.
//
// Renders nothing at all until there is something to say, so an untouched
// globe carries one card, not an empty second one.
function HistoryReadout({ V, className = '' }: { V: any; className?: string }) {
  const empires = V.globeTab === 'top';
  const legend: any[] = empires ? V.globeEmpireLegend || [] : [];
  const eraLegend: any[] = empires ? [] : V.globeEraLegend || [];
  const note = empires ? '' : V.globeEraNote;
  if (!legend.length && !eraLegend.length && !note) return null;
  // 10px more room above than below: the first legend row was sitting hard
  // against the top edge, while the footnotes below already had the hairline
  // holding them off it.
  return (
    <div className={`rounded-2xl border border-[#2c2c2c] bg-[rgba(14,14,14,.88)] px-3 pb-2.5 pt-[20px] shadow-[0_18px_44px_rgba(0,0,0,.6)] backdrop-blur-[12px] ${className}`}>
      {note && <div className="text-center text-[12px] leading-[1.45] text-[#a8a8a8]">{note}</div>}

      {/* One row per selected empire. With up to five territories overlapping
          on the globe, this list is what ties each colour to a name — and it
          doubles as the comparison, since the peak year and area line up in
          columns down the rows. */}
      {legend.length > 0 && (
        <div className="flex flex-col">
          {legend.map((l: any) => (
            <div key={l.id} className="flex items-center gap-2.5 py-[3px] text-[12px] leading-[1.5]">
              {/* Ringed rather than bare: #E8B84B and #8FD14F on this near-black
                  card bloom at 12px, and the ring gives every swatch the same
                  hard edge whatever its colour. */}
              <span className="h-[12px] w-[12px] flex-none rounded-[4px] ring-1 ring-inset ring-[rgba(0,0,0,.4)]" style={{ background: l.color }}></span>
              {/* The rank is the one column a 320px phone can spare — the
                  pills carry it too, and the rows are already in rank order. */}
              <span className="hidden w-[18px] flex-none text-right font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] text-[#6d6d6d] min-[420px]:inline">{l.rank}</span>
              <span className="min-w-0 flex-1 truncate text-[#e8e8e8]">{l.name}</span>
              {/* The year is the column being compared down the rows, so it
                  gets its own fixed width, tabular figures and the brightest
                  text of the three — right-aligned, 1270–1309 and 1920 line
                  up under each other instead of drifting with the name. */}
              <span className="w-[74px] flex-none text-right font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12.5px] font-bold tabular-nums text-[#f5f5f5]">{l.peak}</span>
              <span className="w-[78px] flex-none text-right text-[11px] tabular-nums text-[#9a9a9a] min-[420px]:w-[92px]">{l.area}</span>
              {l.approx && <span className="flex-none text-[9.5px] uppercase tracking-[.06em] text-[#6b6b6b]">{l.approx}</span>}
            </div>
          ))}
        </div>
      )}

      {eraLegend.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {eraLegend.map((l: any, i: number) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-[#9a9a9a]">
              <span
                className="h-[9px] w-[14px] rounded-[3px]"
                style={l.dashed
                  ? { border: `1.5px dashed ${l.color}`, background: 'transparent' }
                  : { background: l.color, opacity: 0.85 }}
              ></span>
              {l.label}
            </span>
          ))}
        </div>
      )}

      {/* Both footnotes are about the selection above them, so they sit under a
          hairline — otherwise they read as two more legend rows in a dimmer
          grey, which is what made the old single panel hard to scan. */}
      {empires && (V.globeUndiscoveredNote || V.globeEmpireHint) && (
        <div className="mt-2 border-t border-[rgba(255,255,255,.07)] pt-2">
          {V.globeUndiscoveredNote && (
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#8a8a8a]">
              <span className="h-[9px] w-[14px] flex-none rounded-[3px] border border-[#3a3a3a] bg-[rgba(3,3,3,.72)]"></span>
              {V.globeUndiscoveredNote}
            </div>
          )}
          {V.globeEmpireHint && (
            <div className={`text-center text-[11px] tracking-[.04em] text-[#8a8a8a] ${V.globeUndiscoveredNote ? 'mt-1.5' : ''}`}>{V.globeEmpireHint}</div>
          )}
        </div>
      )}
    </div>
  );
}

// One photo card of the dossier. Same shape as SiteCard — a picture with the
// caption burnt into its bottom edge — so the empire column and the country
// column read as the same kind of object rather than two designs.
//
// `note` is the escape hatch for the handful of subjects Wikipedia has no
// direct likeness of: it prints what the picture actually shows, so a
// reconstruction of a Xiongnu chief is never mistaken for a portrait of Modu.
function DossierCard({ label, name, sub, img, note, accent, heightClass = 'h-[clamp(96px,10vw,140px)] min-[1920px]:h-[168px]', focus = 'bg-center' }: { label: string; name: string; sub?: string; img?: string; note?: string; accent: string; heightClass?: string; focus?: string }) {
  return (
    <div className={`relative block ${heightClass} overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] bg-[#141414] shadow-[0_16px_40px_rgba(0,0,0,.28)]`}>
      {img
        ? <BgMedia bg={img} className="absolute inset-0" imgClassName={`bg-cover ${focus}`} />
        // Nothing to show is a real answer for a 6th-century khagan, so the card
        // keeps its size and states the gap instead of collapsing the column.
        : <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,_#1f1f1f_0%,_#101010_70%)]"></div>}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.12)_0%,_rgba(0,0,0,0)_34%,_rgba(0,0,0,.5)_72%,_rgba(0,0,0,.9)_100%)]"></div>
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 px-[14px] py-3">
        <div className="mb-[5px] flex items-center gap-[5px]">
          <span className="h-[8px] w-[8px] flex-none rounded-[3px] ring-1 ring-inset ring-[rgba(0,0,0,.4)]" style={{ background: accent }}></span>
          <span className="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] font-semibold uppercase tracking-[.06em] text-[rgba(242,237,227,.7)]">{label}</span>
        </div>
        <div className="font-display text-[clamp(14px,1.3vw,18px)] font-semibold leading-[1.15] text-cream-2 [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">{name}</div>
        {sub && <div className="mt-[2px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10.5px] tabular-nums text-[rgba(242,237,227,.62)]">{sub}</div>}
        {note && <div className="mt-[3px] text-[9.5px] leading-[1.3] text-[rgba(242,237,227,.45)]">{note}</div>}
      </div>
    </div>
  );
}

// A desk globe: sphere on a stand, standing straight. Drawn rather than fetched
// so it inherits currentColor and turns gold when the lock is on.
//
// Upright on purpose — the ball, its meridian and the stand all share one
// vertical, which is the state the button puts the globe in. An icon leaning
// at 23° would be promising a lean the lock does not apply.
function DeskGlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="11.2" cy="9.6" r="6.2" />
      {/* meridian + equator: enough to read as a globe at 18px, no more */}
      <ellipse cx="11.2" cy="9.6" rx="2.5" ry="6.2" />
      <path d="M5 9.6h12.4" />
      {/* the C-ring the ball hangs in, then pillar and foot */}
      <path d="M18.4 4.4a7.6 7.6 0 0 1 .2 10.7" />
      <path d="M11.2 16.4v3.1" />
      <path d="M7.9 20.6h6.6" />
    </svg>
  );
}

// The three cards that answer "so what was this one?" — shown only while a
// single empire is lit, because every line on them is about that one empire.
function EmpireDossier({ V, className }: { V: any; className: string }) {
  const d = V.globeEmpireDossier;
  if (!d) return null;
  return (
    <div className={className}>
      {/* The ruler leads, and gets roughly half again the height of the others.
          These are portraits — paintings and busts, taller than they are wide —
          and in a landscape card the crop keeps a face and throws the rest away.
          Anchored to the top of the frame for the same reason: on a portrait the
          head is up there, and centring a tall picture in a short card cuts it. */}
      {/* The ruler card takes whatever the other two leave. Fixed heights can't
          do this: the facts card runs 2–3 paragraphs depending on the empire and
          the column's own height depends on the window, so any number tuned to
          fill one screen leaves a hole on a taller one and overflows a 768px
          laptop. Letting one card absorb the remainder fills the column exactly,
          at every size, whatever the facts happen to run to.

          Its floor and ceiling are the two things flex can get wrong: without
          the floor a long set of facts squashes the portrait to a strip, and
          without the ceiling a tall empty window stretches it past the point
          where the crop still looks like a portrait.

          The floor is also what the portrait gets on most real windows, so it,
          not the ceiling, is the number that decides how big this card reads —
          190px cropped a painting down to a head and a collar. It gives way on
          a short window rather than pushing the stack off the bottom: a minimum
          height taller than the room going spare is exactly what forces the
          scroll it exists to prevent. Past about 920px of viewport the 240
          wins and none of this moves. */}
      <DossierCard
        label={d.labels.ruler} name={d.ruler.name} sub={d.ruler.reign} img={d.ruler.img} note={d.ruler.photo} accent={d.color}
        heightClass="min-h-[min(240px,26dvh)] max-h-[640px] flex-1"
        focus="bg-top"
      />
      {/* A cityscape reads fine in a letterbox — a portrait does not — so when
          the column is tight this is the card that gives its pixels up to the
          one above it. */}
      <DossierCard
        label={d.labels.capital} name={d.capital.name} img={d.capital.img} note={d.capital.photo} accent={d.color}
        heightClass="h-[clamp(104px,12dvh,180px)] flex-none"
      />
      {/* The tallest thing in the column and the only one whose height comes
          from its content, so it is what pushes the stack past the bottom of
          the screen. Set tight on purpose: three facts run long in Mongolian,
          and every line saved here is a line the portrait above gets back. */}
      {d.facts.length > 0 && (
        <div className="flex-none rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(14,14,14,.92)] px-[14px] py-2.5 shadow-[0_16px_40px_rgba(0,0,0,.28)] backdrop-blur-[12px]">
          <div className="mb-1.5 flex items-center gap-[5px]">
            <span className="h-[8px] w-[8px] flex-none rounded-[3px] ring-1 ring-inset ring-[rgba(0,0,0,.4)]" style={{ background: d.color }}></span>
            <span className="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] font-semibold uppercase tracking-[.06em] text-[rgba(242,237,227,.7)]">{d.labels.facts}</span>
          </div>
          {/* Marked with the empire's own colour rather than a bullet, so the
              three cards keep saying which empire they belong to even once the
              reader has scrolled the legend out of the corner of their eye. */}
          <ul className="flex flex-col gap-[5px]">
            {d.facts.map((f: string, i: number) => (
              <li key={i} className="flex gap-2 text-[11px] leading-[1.4] text-[#cfcfcf]">
                <span className="mt-[5px] h-[4px] w-[4px] flex-none rounded-full" style={{ background: d.color }}></span>
                <span className="min-w-0">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function GlobePage() {
  const V: any = useContext(BigBangContext);
  useEffect(() => {
    document.body.classList.add('bb-globe-black-theme');
    return () => document.body.classList.remove('bb-globe-black-theme');
  }, []);
  // sitesFor() returns 6 entries per country: 0-2 = capital city + 2 culture/
  // history landmarks (right panel, unchanged position), 3-5 = 3 natural
  // scenic spots (new left panel, under the intro text).
  const rightSites = (V.gcSites || []).slice(0, 3);
  const leftSites = (V.gcSites || []).slice(3, 6);
  return (
    // h-dvh rather than h-screen — on a phone `100vh` measures the viewport
    // with the URL bar retracted, so a locked overflow-hidden screen runs
    // taller than what is on show and its bottom edge (the card stacks) is
    // stranded under the browser chrome. Same note as the maps page.
    <section
      data-screen-label="Дэлхий"
      className="relative h-dvh overflow-hidden bg-[radial-gradient(120%_110%_at_50%_20%,_#111111_0%,_#060606_60%,_#000000_100%)]"
    >
      {/* Fills the frame and stays there. The four bottom-pinned panels sit 24px
          lower than they used to (bottom-4 where they carried bottom-10), but the
          sphere is deliberately left alone: it is the fixed thing the panels are
          arranged over, and moving it too only shifted the whole picture without
          buying the panels any room. */}
      <div id="bb-globe-mount" ref={V.globeMountRef} className="absolute inset-0"></div>

      {V.isMobile ? (
        // The desktop layout is four panels pinned to four corners of a wide
        // screen, and it doesn't survive being narrowed: the two card columns
        // are 200px each at 48px from either edge, which needs 496px of width
        // to sit apart and had them overlapping across the middle of a 360px
        // phone, with the search box landing on top of the title as well.
        //
        // So on a phone it becomes one thing at the top and one at the bottom,
        // with the globe — the whole point of the screen — left uncovered in
        // between. Nothing is dropped: the same six sites are here, the two
        // columns merged into a single rail you swipe rather than two stacks
        // that would take two thirds of the screen between them.
        <>
          <div className="absolute inset-x-3 top-[70px] z-[30]">
            <input
              value={V.globeQuery}
              onChange={V.globeOnQuery}
              placeholder={V.globeSearchPh}
              // 16px type, not the desktop's 13px: anything under 16 makes iOS
              // Safari zoom the whole page in when the field takes focus, and
              // it does not zoom back out afterwards.
              className="w-full box-border rounded-full border border-[#343434] bg-[rgba(28,28,28,.92)] px-[18px] py-3 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-base text-[#ededed] outline-none shadow-[0_10px_30px_rgba(0,0,0,.4)] placeholder:text-[#777] focus:border-[#E8B84B]"
            />
            {V.globeHasResults && (
              // Capped and scrolled — an uncapped list of matches covered the
              // globe it is meant to be steering.
              <div className="relative z-[31] mt-2 max-h-[46vh] overflow-y-auto rounded-[14px] border border-[#343434] bg-[#191919] shadow-[0_18px_44px_rgba(0,0,0,.72)]">
                {V.globeResults.map((r: any, i: number) => (
                  <button
                    key={i}
                    onClick={r.pick}
                    className="block w-full cursor-pointer box-border border-0 border-t border-[rgba(255,255,255,.06)] bg-transparent px-4 py-3 text-left first:border-t-0"
                  >
                    <div className="text-[13.5px] font-bold text-[#eeeeee]">{r.name}</div>
                    <div className="mt-[2px] text-[11px] text-[#777777]">{r.region}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stands down once a country is picked. The sheet below carries
              that country's own name and label, and holding both on screen
              would leave the globe itself a letterbox between them. */}
          {!V.globeHasCard && (
            <div className="absolute inset-x-4 top-[128px] z-[6]">
              {/* Same one-line pairing as the desktop column above, and the
                  same italic-lean problem — a little less of it at 24px, and a
                  phone has less width to spend, so 20 here against the 28. */}
              <div className="flex items-center gap-5">
                <button onClick={V.openPin} className="inline-flex flex-none cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[#858585]">{V.L.back}</button>
                <div className="pointer-events-none font-display italic text-[24px] leading-[1.05] text-[#f2f2f2]">{V.globeTitle}</div>
              </div>
            </div>
          )}

          {/* Above the bottom sheet is where this would like to live, but the
              sheet is 6 cards tall and there is no room left over — so with a
              country open it takes the slot the intro text vacates instead.

              The readout is the child that changes height, so it has to be the
              one that moves: whichever edge the stack is pinned to, the bar sits
              against it and the readout grows away from it. Anchored to the
              bottom that is the natural order; anchored to the top the column
              reverses, because a bar that slid down a row every time a pill was
              pressed would walk out from under the thumb still pressing it. */}
          <div className={`absolute inset-x-3 z-[9] flex gap-2 ${V.globeHasCard ? 'top-[128px] flex-col-reverse' : 'bottom-4 flex-col'}`}>
            <HistoryReadout V={V} />
            <HistoryBar V={V} />
          </div>

          {V.globeHasCard && (V.gcSites || []).length > 0 && (
            <div className="absolute inset-x-2 bottom-2 z-[8] rounded-2xl border border-[#2c2c2c] bg-[rgba(14,14,14,.94)] p-3 shadow-[0_18px_44px_rgba(0,0,0,.72)] backdrop-blur-[12px] [animation:bbCardIn_.4s_cubic-bezier(.22,.8,.3,1)_both]">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display truncate text-[20px] leading-[1.1] text-[#f2f2f2]">{V.gcName}</div>
                </div>
                <button
                  onClick={V.globeCloseCard}
                  aria-label="Хаах"
                  className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border border-[#3a3a3a] bg-[rgba(22,22,22,.94)] font-[inherit] text-[18px] leading-none text-[#999]"
                >×</button>
              </div>
              {/* One rail of all six rather than the desktop's two columns.
                  Stacked, three cards and a heading per group came to about
                  two thirds of a phone screen; side by side they collide. The
                  order is the array's own — capital and culture first, then
                  nature — and each card's tag line already says which it is,
                  so the two group headings the columns needed are redundant
                  here. Site numbering is 1-based to match globeSelectSite. */}
              <div className="bb-hscroll -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5">
                {(V.gcSites || []).map((s: any, j: number) => (
                  <SiteCard
                    key={j}
                    s={s}
                    active={V.globeActiveSite === j + 1}
                    onSelect={() => V.globeSelectSite(j + 1)}
                    sizeClass="h-[104px] w-[168px] flex-none"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
      <>
      {/* 64px is the floor, not a preference. The nav is fixed at top-0 with
          z-[60] and 18px of padding over a 28px row (the avatar, the tallest
          thing in it), so it ends at 64px — and this column starts at the same
          x as the "Atlas" logo, which means anything higher slides behind it.
          Sitting exactly on that floor read as tucked under the nav, so the
          column carries 20px of air below it instead. */}
      <div className="absolute left-12 min-[1920px]:left-14 top-[84px] z-[6] flex flex-col gap-4">
        <div>
          {/* Back and title on one line, back first. Centred, not baseline-
              aligned: sharing the title's baseline drops a 13px label to the
              foot of a 30px italic and reads as sunk. Centring lifts it about
              six pixels, onto the title's optical middle.

              28px rather than the 16 it used to carry. An italic display face
              leans its first letter back over the gap, so the metric space and
              the space you see are not the same number — at 16px the "Д" was
              sitting on the end of the label. */}
          <div className="flex items-center gap-7">
            <button onClick={V.openPin} className="inline-flex flex-none cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[#858585] transition-colors duration-[250ms] hover:text-[#E8B84B]">{V.L.back}</button>
            <div className="pointer-events-none font-display italic text-[30px] leading-[1.05] text-[#f2f2f2]">{V.globeTitle}</div>
          </div>
          {/* Under the title, in the slot the intro line used to hold. Outside
              the block above rather than in it — that one is pointer-events-none
              so the globe can be dragged through the words, and a field inside
              it could not be clicked into.

              z-[31] because the column is a stacking context of its own and the
              readout card is a later sibling: without it the list of matches
              opens behind that card.

              The tilt lock rides on the end of this row. It is the one other
              control that changes nothing about what the globe shows, only how
              it is held, so it belongs beside the field rather than off in a
              corner of its own. */}
          <div className="mt-1 flex items-center gap-2">
          <div className="relative z-[31] w-[280px] min-[1920px]:w-[350px]">
            <input
              value={V.globeQuery}
              onChange={V.globeOnQuery}
              placeholder={V.globeSearchPh}
              className="w-full box-border rounded-full border border-[#343434] bg-[rgba(28,28,28,.92)] px-[18px] py-[11px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[13px] text-[#ededed] outline-none shadow-[0_10px_30px_rgba(0,0,0,.4)] placeholder:text-[#777] focus:border-[#E8B84B]"
            />
            {V.globeHasResults && (
              <div className="absolute left-0 right-0 top-full z-[31] mt-2 overflow-hidden rounded-[14px] border border-[#343434] bg-[#191919] shadow-[0_18px_44px_rgba(0,0,0,.72)]">
                {V.globeResults.map((r: any, i: number) => (
                  <button
                    key={i}
                    onClick={r.pick}
                    className="block w-full cursor-pointer box-border border-0 bg-transparent px-4 py-[10px] text-left hover:bg-[rgba(232,184,75,.14)]"
                  >
                    <div className="text-[13px] font-bold text-[#eeeeee]">{r.name}</div>
                    <div className="mt-[2px] text-[10.5px] text-[#777777]">{r.region}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={V.globeToggleTilt}
            aria-pressed={V.globeTiltOn}
            title={V.globeTiltLabel}
            aria-label={V.globeTiltLabel}
            className={`flex h-[40px] w-[40px] flex-none cursor-pointer items-center justify-center rounded-full border bg-[rgba(28,28,28,.92)] shadow-[0_10px_30px_rgba(0,0,0,.4)] transition-colors duration-200 ${
              V.globeTiltOn
                ? 'border-[var(--accent,#E8B84B)] text-[var(--accent,#E8B84B)]'
                : 'border-[#343434] text-[#9a9a9a] hover:border-[var(--accent,#E8B84B)] hover:text-[#e8e8e8]'
            }`}
          >
            <DeskGlobeIcon className="h-[21px] w-[21px]" />
          </button>
          </div>
        </div>
        {/* Under the intro text, in the column's own empty half — the bar down
            at the bottom centre is the control, and the answer reads better up
            here next to the title than stacked on top of the thing you press.
            Wider than the intro's own text measure on purpose: the rows carry a
            name against two number columns, and at the 270px the paragraph
            wants, every empire's name would truncate. */}
        <HistoryReadout V={V} className="w-[min(430px,36vw)] min-[1920px]:w-[470px]" />
      </div>
      {/* Anchored to the bottom like the right-hand column, so the two card
          stacks end on the same line. It used to sit in flow under the intro
          text, which meant its bottom landed wherever three cards happened to
          reach from there — level with the other column only by accident, and
          only at one window height. */}
      {V.globeHasCard && leftSites.length > 0 && (
        <div className="absolute left-12 bottom-4 z-[8] flex w-[clamp(200px,16vw,270px)] min-[1920px]:left-14 min-[1920px]:w-[410px] flex-col gap-[10px]">
          {/* No heading over this column any more. The cards still line up with
              the other side's: both stacks are pinned to the same bottom edge
              and hold three cards of the same height, so the header the right
              column keeps for the country name only ever sat above that line —
              dropping this one moves nothing the eye follows. */}
          {leftSites.map((s: any, i: number) => <SiteCard key={i} s={s} active={V.globeActiveSite === i + 4} onSelect={() => V.globeSelectSite(i + 4)} />)}
        </div>
      )}
      {/* Bottom centre — the two card columns are pinned to the far left and
          right edges, so this strip stays clear of both at every width. Just the
          control here; what it selects reads out under the intro text, top left. */}
      <div className="absolute left-1/2 bottom-4 z-[9] w-[min(620px,46vw)] -translate-x-1/2">
        <HistoryBar V={V} />
      </div>
      {V.globeShowHover && (
        <div className="absolute left-1/2 top-[88px] z-[6] -translate-x-1/2 pointer-events-none rounded-full border border-[#343434] bg-[rgba(25,25,25,.96)] px-4 py-[7px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-semibold text-[#eeeeee] shadow-[0_8px_20px_rgba(0,0,0,.45)]">{V.globeHover}</div>
      )}
      {/* Opposite the readout, in the same slot and at the same width as the
          country column below — the two never show at once, because a country
          the viewer just clicked is the more specific answer and gets the
          space. Capped and scrollable rather than bottom-anchored alone: three
          facts run long in Mongolian, and on a short window the stack would
          otherwise grow up past the top of the screen. */}
      {!V.globeHasCard && (
        <EmpireDossier
          V={V}
          // A definite height, not a max: flex-1 on the ruler card has nothing
          // to divide up unless the column knows how tall it is. The bottom is
          // pinned at bottom-4, so 100px puts the top at 84px — level with the
          // title column opposite, and the first line clear of the nav. It used
          // to start 80px lower than that for no reason the layout needed, and
          // those were 80px the stack had to scroll to get back.
          // Wider than the country column it replaces, which is the cheapest
          // vertical room on the screen: the facts card is a paragraph, so
          // every 60px of width takes two or three lines off its height and
          // hands them to the portrait. It can afford them — the dossier and
          // the country cards never show at once, so the only thing to stay
          // clear of is the history bar across the bottom centre, and 20vw
          // keeps a margin from it down to about 1024px.
          className="absolute right-12 min-[1920px]:right-14 bottom-4 z-[8] flex h-[calc(100dvh-100px)] w-[clamp(200px,20vw,330px)] min-[1920px]:w-[410px] flex-col gap-[10px] overflow-y-auto"
        />
      )}
      {V.globeHasCard && (
        <div className="absolute right-12 min-[1920px]:right-14 bottom-4 z-[8] flex w-[clamp(200px,16vw,270px)] min-[1920px]:w-[410px] flex-col gap-[10px]">
          <div className="mb-[2px] flex h-[47px] items-end justify-between gap-3">
            <div className="font-display text-[22px] leading-[1.1] text-[#f2f2f2]">{V.gcName}</div>
            <button
              onClick={V.globeCloseCard}
              className="flex-none w-[30px] h-[30px] cursor-pointer rounded-full border border-[#3a3a3a] bg-[rgba(22,22,22,.94)] font-[inherit] text-[18px] leading-none text-[#999] shadow-sm hover:border-[#E8B84B] hover:text-[#E8B84B]"
            >
              ×
            </button>
          </div>
          {rightSites.map((s: any, i: number) => <SiteCard key={i} s={s} active={V.globeActiveSite === i + 1} onSelect={() => V.globeSelectSite(i + 1)} />)}
        </div>
      )}
      </>
      )}
    </section>
  );
}
