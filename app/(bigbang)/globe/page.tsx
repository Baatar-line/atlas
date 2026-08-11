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
              <button onClick={V.openPin} className="mb-2 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[#858585]">{V.L.back}</button>
              <div className="pointer-events-none">
                <div className="font-display italic text-[24px] leading-[1.05] text-[#f2f2f2]">{V.globeTitle}</div>
                <div className="mt-1.5 max-w-[280px] text-[12px] leading-[1.5] text-[#777777]">{V.globeHint}</div>
              </div>
            </div>
          )}

          {V.globeHasCard && (V.gcSites || []).length > 0 && (
            <div className="absolute inset-x-2 bottom-2 z-[8] rounded-2xl border border-[#2c2c2c] bg-[rgba(14,14,14,.94)] p-3 shadow-[0_18px_44px_rgba(0,0,0,.72)] backdrop-blur-[12px] [animation:bbCardIn_.4s_cubic-bezier(.22,.8,.3,1)_both]">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[var(--accent,#E8B84B)]">{V.gcSitesLabel}</div>
                  <div className="font-display mt-[2px] truncate text-[20px] leading-[1.1] text-[#f2f2f2]">{V.gcName}</div>
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
      <div className="absolute left-12 min-[1920px]:left-14 top-[88px] z-[6] flex flex-col gap-8">
        <div>
          <button onClick={V.openPin} className="mb-3 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[#858585] transition-colors duration-[250ms] hover:text-[#E8B84B]">{V.L.back}</button>
          <div className="pointer-events-none">
            <div className="font-display italic text-[30px] leading-[1.05] text-[#f2f2f2]">{V.globeTitle}</div>
            <div className="mt-2 max-w-[clamp(200px,16vw,270px)] text-[12.5px] leading-[1.5] text-[#777777]">{V.globeHint}</div>
          </div>
        </div>
      </div>
      {/* Anchored to the bottom like the right-hand column, so the two card
          stacks end on the same line. It used to sit in flow under the intro
          text, which meant its bottom landed wherever three cards happened to
          reach from there — level with the other column only by accident, and
          only at one window height. */}
      {V.globeHasCard && leftSites.length > 0 && (
        <div className="absolute left-12 bottom-10 z-[8] flex w-[clamp(200px,16vw,270px)] min-[1920px]:left-14 min-[1920px]:w-[410px] flex-col gap-[10px]">
          {/* Matches the height of the right column's two-line header (label +
              country name) so both stacks start level as well as end level. */}
          <div className="mb-[2px] flex h-[47px] items-end text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--accent,#E8B84B)]">{V.gcNatureLabel}</div>
          {leftSites.map((s: any, i: number) => <SiteCard key={i} s={s} active={V.globeActiveSite === i + 4} onSelect={() => V.globeSelectSite(i + 4)} />)}
        </div>
      )}
      <div className="absolute right-12 min-[1920px]:right-14 top-[88px] z-[30] w-[280px] min-[1920px]:w-[350px]">
        <input
          value={V.globeQuery}
          onChange={V.globeOnQuery}
          placeholder={V.globeSearchPh}
          className="w-full box-border rounded-full border border-[#343434] bg-[rgba(28,28,28,.92)] px-[18px] py-[11px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[13px] text-[#ededed] outline-none shadow-[0_10px_30px_rgba(0,0,0,.4)] placeholder:text-[#777] focus:border-[#E8B84B]"
        />
        {V.globeHasResults && (
          <div className="relative z-[31] mt-2 overflow-hidden rounded-[14px] border border-[#343434] bg-[#191919] shadow-[0_18px_44px_rgba(0,0,0,.72)]">
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
      {V.globeShowHover && (
        <div className="absolute left-1/2 top-[88px] z-[6] -translate-x-1/2 pointer-events-none rounded-full border border-[#343434] bg-[rgba(25,25,25,.96)] px-4 py-[7px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-semibold text-[#eeeeee] shadow-[0_8px_20px_rgba(0,0,0,.45)]">{V.globeHover}</div>
      )}
      {V.globeHasCard && (
        <div className="absolute right-12 min-[1920px]:right-14 bottom-10 z-[8] flex w-[clamp(200px,16vw,270px)] min-[1920px]:w-[410px] flex-col gap-[10px]">
          <div className="mb-[2px] flex h-[47px] items-start justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--accent,#E8B84B)]">{V.gcSitesLabel}</div>
              <div className="font-display mt-[2px] text-[22px] leading-[1.1] text-[#f2f2f2]">{V.gcName}</div>
            </div>
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
