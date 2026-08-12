'use client';

// Big Bang — Suggest (/suggest): top-rated carousel, curated collections, quick
// picks, and the travel-apps kit.
import { useContext, useEffect, useRef } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia, Isometric3DIcon } from '@/components/bigbang/ui';

// Drives a rail's scrollLeft forward a few pixels a second, so it drifts on
// its own but a visitor can still take hold of it.
//
// scrollLeft rather than a CSS transform, which is what this used to be. A
// transform moves the content under a viewport that must then be
// overflow:hidden — otherwise the translated copy counts as scrollable width
// — and hidden is exactly what stopped anyone scrolling the rail themselves.
// Animating the same property a person scrolls means there is nothing to
// reconcile: they scroll, we carry on from wherever they left it.
//
// Speed is per-second rather than a duration for the whole loop, so adding
// brands makes the rail longer instead of faster.
function useMarqueeDrift(pxPerSecond = 22) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No CSS rule can stop a scrollLeft animation, so this is where reduced
    // motion has to be honoured. The rail stays an ordinary scroll rail.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // The list is rendered twice, so one full copy — plus the gap trailing
    // it — is the distance after which the rail looks identical to itself.
    // Wrapping there rather than at scrollWidth is what makes the loop
    // seamless instead of snapping back to the start.
    //
    // Measured on a ResizeObserver rather than per frame: scrollWidth and
    // getComputedStyle both force layout, and paying that sixty times a
    // second to re-derive a number that only changes when brands load or the
    // window resizes is the kind of thing that makes a page feel heavy.
    let wrap = 0;
    const track = el.firstElementChild as HTMLElement | null;
    const measure = () => {
      const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
      wrap = (el.scrollWidth + gap) / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track) ro.observe(track);

    let raf = 0;
    let last = 0;
    // Held while the pointer is anywhere over the rail — these cards are
    // links, and a link that slides out from under the cursor is a target,
    // not a link — and for a moment after a touch lands, so a finger about to
    // swipe isn't racing the drift.
    let holdUntil = 0;
    // Set once the visitor has scrolled the rail themselves; see onScroll.
    let taken = false;
    // The last scrollLeft this hook wrote, so onScroll can tell our own
    // movement from the visitor's. -1 until the first frame runs.
    let written = -1;
    // Math.max, so a wheel tick inside a hover can only extend the hold, not
    // cut the pointer's own indefinite one short and start the rail moving
    // under a cursor that never left.
    const hold = () => { holdUntil = Math.max(holdUntil, performance.now() + 900); };
    // Mouse only. A touch pointer stops existing when the finger lifts, and
    // the browser fires pointerleave for it — which would read every swipe as
    // "the visitor moved away" and start the rail again a moment after they
    // deliberately stopped it. A phone has no hover to give, so on a phone
    // the rail simply stays where it was put.
    const enter = (e: PointerEvent) => { if (e.pointerType === 'mouse') holdUntil = Infinity; };
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      // The cursor leaving is the visitor letting go, so a rail they had
      // scrolled by hand is released too and drifts again from wherever they
      // left it — it does not jump back to where it would have got to.
      taken = false;
      holdUntil = performance.now() + 400;
      start();
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = last ? now - last : 0;
      last = now;
      // A backgrounded tab hands back a huge dt on its first frame back;
      // capping it stops the rail jumping a screen at a time.
      if (!dt || dt > 100 || now < holdUntil || wrap <= 0) return;
      const next = el.scrollLeft + (pxPerSecond * dt) / 1000;
      el.scrollLeft = next >= wrap ? next - wrap : next;
      // Read back rather than storing what we meant to set: the browser
      // rounds scrollLeft, and comparing against our intended value would
      // make every frame look like somebody else had moved the rail.
      written = el.scrollLeft;
    };

    const start = () => {
      if (raf || taken) return;
      // Reset, so the first frame after a resume measures from now instead of
      // from whenever the rail last ran.
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // The rail drifts to say "there is more along here". Once a visitor has
    // scrolled it themselves they know that, and have said which part of it
    // they want to look at — so it stops and stays put, instead of creeping
    // back a moment later and carrying their choice away with it. It is
    // released again when the cursor leaves (see `leave` above), which on a
    // desktop is the visitor moving on, and on a phone never happens.
    //
    // Detected from the scroll position rather than from input events: a
    // wheel event fires on whatever is under the cursor, so reading page
    // scroll as intent would stop the rail merely for scrolling past it, and
    // a touchstart is as likely to be a tap on a card as the start of a
    // swipe. A scrollLeft we did not write is unambiguous, and it catches
    // every way of moving a rail — swipe, trackpad, shift+wheel, keyboard,
    // dragging the bar itself.
    const onScroll = () => {
      if (taken || Math.abs(el.scrollLeft - written) <= 1.5) return;
      taken = true;
      stop();
    };

    // Nothing below the fold needs animating. Beyond saving the work, it
    // stops the rail travelling a screen's width while the visitor is reading
    // something else and then being found somewhere they never left it.
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) start(); else stop();
    });
    io.observe(el);

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', hold, { passive: true });
    el.addEventListener('touchstart', hold, { passive: true });
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', hold);
      el.removeEventListener('touchstart', hold);
    };
  }, [pxPerSecond]);
  return ref;
}

// Bento-style spans (desktop only — collapses to a plain single column on
// mobile) for the 6 travel-app cards, matched by index to V.travelApps'
// order (Maps.me, Russian Topo Maps, Windy, Ventusky, Avis Mongolia, Drive
// Mongolia — see TRAVEL_APPS in data.ts). A 4-column grid: one big square
// card, one tall card beside it, two small stacked squares, then two wide
// cards underneath — mixing big/small like a real bento layout instead of
// a flat uniform grid.
const TRAVEL_SPANS = [
  { gridColumn: '1 / 3', gridRow: '1 / 3' },
  { gridColumn: '3 / 4', gridRow: '1 / 3' },
  { gridColumn: '4 / 5', gridRow: '1 / 2' },
  { gridColumn: '4 / 5', gridRow: '2 / 3' },
  // Avis Mongolia / Drive Mongolia — only they sit in this grid row, so their
  // own min-height drives the row height.
  { gridColumn: '1 / 3', gridRow: '3 / 4', minHeight: 280 },
  { gridColumn: '3 / 5', gridRow: '3 / 4', minHeight: 280 },
];

export default function SuggestPage() {
  const V: any = useContext(BigBangContext);
  const brandRail = useMarqueeDrift();
  return (
    <section
      data-screen-label="Санал болгох"
      className="box-border min-h-screen"
      style={{ padding: V.isMobile ? '96px 18px 14px' : '110px 48px 18px' }}
    >
      {/* Fills the first screen after the section's own top/bottom padding,
          so the brand row and the top-rated row form a clean first fold —
          closing this off at a hard height (rather than just letting the two
          blocks take their natural, smaller height) is what stops the next
          section (the big collection banners) from peeking a sliver of
          itself in at the very bottom of the initial view. The two rows
          themselves are unchanged size; the leftover space (more on a tall
          monitor, ~0 on a short laptop) just becomes blank space below them
          within this box.

          The subtracted amount is padding(128/110) plus a safety margin — a
          first attempt at 56px still left a sliver of the next section
          peeking in, so this is a more generous 136px. Windows' own taskbar
          and the browser's vertical scrollbar both shave real, variable
          amounts off `100vh` that CSS has no way to know about; the margin
          trades a bit more blank space on a tall monitor for actually
          guaranteeing no peek rather than chasing the exact number. */}
      <div style={{ minHeight: V.isMobile ? 'calc(100vh - 246px)' : 'calc(100vh - 264px)' }}>
        {V.brands.length > 0 && (
          // mb-6 rather than the old mb-10 — this section and the one below it
          // are each a title plus a card row, so the two together used to run
          // past a typical laptop's viewport height before either row's second
          // line of text came into view. Tightening the gap between them buys
          // back real space without touching the cards themselves.
          <div className="mb-6">
            <h2 className="m-0 mb-2 text-lg font-extrabold tracking-[-0.02em] text-cream">{V.L.brandsTitle}</h2>
            {/* Drifts on its own instead of waiting to be scrolled — a partner
                rail nobody scrolls shows the same three logos forever — and
                scrolls by hand as well, resuming from wherever it was left.
                See useMarqueeDrift above for why one property does both.

                The list is rendered twice so the wrap has no seam; the
                duplicate is aria-hidden so screen readers and tab order still
                see each brand once. */}
            <div ref={brandRail} className="bb-marquee bb-hscroll pt-3 pb-1.5">
              <div className="bb-marquee-track flex gap-4">
              {[...V.brands, ...V.brands].map((b: any, i: number) => {
                const isClone = i >= V.brands.length;
                // The sizing/flex-item classes live on whichever element ends
                // up as the actual direct child of the scroll rail (<a> when
                // there's a link, <div> otherwise) — putting them one level
                // deeper instead left the wrapper with no size of its own.
                // Portrait (3/4) on purpose, unlike the landscape "Хамгийн
                // өндөр үнэлгээтэй" rail below: the differing shape is what
                // tells the two stacked rails apart at a glance, and a brand
                // logo plus two short lines needs height more than width.
                // 200px wide (267 tall) keeps this row and the landscape row
                // below within ~70px of each other in height, so the pair
                // still reads as one fold rather than one rail towering over
                // the other.
                const cardClass = `relative block grow-0 shrink-0 basis-[200px] min-[1800px]:basis-[270px] aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] no-underline transition-transform duration-300 ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-2${isClone ? ' bb-marquee-clone' : ''}`;
                const inner = (
                  <>
                    <BgMedia bg={b.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                    {/* The transparent stop sits higher than on a landscape
                        card — same scrim depth in pixels under a taller
                        card, so the caption keeps its contrast without the
                        dark half creeping up over the photo. */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,.85)_100%)]"></div>
                    {/* Logo on the same line as the caption, ahead of it. It
                        costs the name ~46px of an already narrow card, so
                        both lines truncate rather than wrap — a wrapped name
                        would push the caption off the card's bottom edge. */}
                    <div className="absolute left-3.5 right-3.5 bottom-3.5 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full border border-[rgba(255,255,255,.25)] bg-[#f2ede3]">
                        {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-[13px] font-extrabold text-[#171410]">{b.name.charAt(0)}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-extrabold leading-[1.2] text-cream-2">{b.name}</div>
                        <div className="truncate text-[11.5px] text-[rgba(242,237,227,.6)]">{b.category}</div>
                      </div>
                    </div>
                  </>
                );
                return b.link && !isClone ? (
                  <a key={i} href={b.link} target="_blank" rel="noopener noreferrer" className={cardClass}>{inner}</a>
                ) : (
                  <div key={i} className={cardClass} aria-hidden={isClone || undefined}>{inner}</div>
                );
              })}
              </div>
            </div>
          </div>
        )}

        <div className="mb-10">
          <h2 className="m-0 mb-3.5 text-lg font-extrabold tracking-[-0.02em] text-cream">{V.L.topRowTitle}</h2>
          {/* overflow-x:auto here forces overflow-y to compute as 'auto' too (CSS
              spec — you can't leave one axis 'visible' once the other isn't),
              so a card's hover lift (translateY(-8px) below) got clipped by the
              row's own top edge with zero padding-top to absorb it. */}
          <div className="bb-hscroll flex gap-4 overflow-x-auto pt-3 pb-1.5">
            {V.topItems.filter(Boolean).map((it: any, i: number) => (
              // 340px wide (227 tall), up from 190: at 190 the two top corner
              // pills (category and ★rating) met in the middle, so the
              // longest category label ("ҮЗЭСГЭЛЭНТ ГАЗРУУД") ran under the
              // rating and got clipped. The extra width leaves room for both
              // and gives the photo — the actual draw of this rail — a size
              // worth looking at.
              <div
                key={i}
                onClick={it.onClick}
                className="relative grow-0 shrink-0 basis-[340px] min-[1800px]:basis-[450px] aspect-[3/2] cursor-pointer overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] transition-transform duration-300 ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-2"
              >
                <BgMedia bg={it.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.1)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,.92)_100%)]"></div>
                <span className="absolute top-3 left-3 rounded-full border border-[rgba(255,255,255,.2)] bg-[rgba(0,0,0,.55)] px-[11px] py-1 text-[10.5px] font-bold tracking-[.05em] text-[var(--accent,#E8B84B)] uppercase backdrop-blur-[8px]">{it.kind}</span>
                <span className="absolute top-3 right-3 rounded-full border border-[rgba(255,255,255,.2)] bg-[rgba(0,0,0,.55)] px-[10px] py-[3.5px] text-[11.5px] font-bold text-cream-2 backdrop-blur-[8px]">★ {it.rating}</span>
                <div className="absolute right-3.5 bottom-3.5 left-3.5">
                  <div className="truncate text-[16.5px] font-extrabold leading-[1.25] text-cream-2">{it.name}</div>
                  <div className="truncate mt-1 text-[12.5px] text-[rgba(242,237,227,.65)]">{it.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-7">
        {V.suggests.map((s: any, i: number) => (
          <div
            key={i}
            onClick={s.open}
            className="relative cursor-pointer overflow-hidden rounded-[22px] transition-transform duration-300 ease-in-out hover:-translate-y-[3px]"
            style={{ height: V.isMobile ? '390px' : '470px' }}
          >
            <BgMedia bg={s.cover} isVideo={s.coverIsVideo} videoSrc={s.coverRawUrl} className="absolute inset-0" imgClassName="bg-cover bg-center" />
            <div style={{ position: 'absolute', inset: 0, background: s.scrim }}></div>
            <div style={V.isMobile
              ? { position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px 24px', boxSizing: 'border-box' }
              : { position: 'absolute', top: 0, bottom: 0, width: 'min(440px,46%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 48px', boxSizing: 'content-box', left: s.textLeft, right: s.textRight }}>
              <span className="self-start rounded-full border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.1)] px-3 py-1 text-[10.5px] font-bold tracking-[.08em] text-[rgba(242,237,227,.9)] uppercase backdrop-blur-[8px]">{s.tag}</span>
              <div className="text-[clamp(24px,2.4vw,34px)] font-extrabold tracking-[-0.02em] text-cream-2 uppercase leading-[1.12]">{s.title}</div>
              <div className="flex flex-col gap-[7px]">
                <div className="flex items-center gap-[9px] text-[13.5px] text-[rgba(242,237,227,.85)]"><span className="h-1 w-1 rounded-full bg-[var(--accent,#E8B84B)]"></span>{s.count}</div>
                <div className="flex items-center gap-[9px] text-[13.5px] text-[rgba(242,237,227,.85)]"><span className="h-1 w-1 rounded-full bg-[var(--accent,#E8B84B)]"></span>atlas багийн сонголт</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TRAVEL APPS ── */}
      <div className="relative">
        {/* Horizontal padding dropped — that was interior padding for the
            card border this section used to have; now that the border's
            gone, the grid should reach the same left/right edges as the
            carousel/banners above instead of sitting inset from them. */}
        <div className="relative" style={{ padding: V.isMobile ? '22px 0 6px' : '32px 0 8px' }}>
          <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <Isometric3DIcon kind="travel" size={56} />
              <div>
                <h3 className="m-0 text-[clamp(22px,2.2vw,30px)] font-extrabold tracking-[-0.02em] text-cream-2">{V.L.appsTitle}</h3>
                <p className="mt-2 mb-0 max-w-[520px] text-[13.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.L.appsSub}</p>
              </div>
            </div>
          </div>
          <div className={V.isTablet ? 'flex flex-col gap-4' : 'grid grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4'}>
            {V.travelApps.map((a: any, i: number) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col overflow-hidden rounded-[20px] px-[22px] pt-[22px] pb-6 no-underline shadow-[0_14px_34px_rgba(0,0,0,.28)] backdrop-blur-[14px] transition-transform duration-[350ms] ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-[6px] hover:shadow-[0_24px_48px_rgba(0,0,0,.4)]"
                style={{
                  background: a.hasBg ? undefined : 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.1)',
                  ...(V.isTablet ? {} : { gridColumn: TRAVEL_SPANS[i].gridColumn, gridRow: TRAVEL_SPANS[i].gridRow, minHeight: TRAVEL_SPANS[i].minHeight }),
                }}
              >
                {a.hasBg && (
                  <>
                    <BgMedia bg={a.bg} isVideo={a.bgIsVideo} videoSrc={a.bgRawUrl} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                    <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(0,0,0,.1)_0%,rgba(0,0,0,.4)_40%,rgba(0,0,0,.82)_100%)]"></div>
                  </>
                )}
                <span className="absolute top-[18px] right-[18px] z-[1] flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-[rgba(255,255,255,.22)] bg-[rgba(0,0,0,.22)] text-[13px] text-cream-2 opacity-75 transition-[opacity,transform] duration-[250ms]">↗</span>
                <div className="relative flex items-center gap-3">
                  {/* One neutral white treatment for all six, not a per-app
                      brand colour (the tint/ring pair these used to carry):
                      six differently-coloured chips on top of six photo
                      backgrounds read as noise, and the colours weren't the
                      apps' real brand colours anyway. The lucide glyph draws
                      in currentColor, so the text colour here is what makes
                      it white. */}
                  <div className="box-border flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl border border-[rgba(255,255,255,.22)] p-[3px]">
                    {/* A faint white plate (not gray, not the fully-opaque
                        dark one tried before) — the drop-shadow on the glyph
                        is what actually keeps it legible against a bright
                        photo (Maps.me/Russian Topo Maps), so the plate itself
                        can stay light without that contrast job falling on it. */}
                    <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-[rgba(255,255,255,.16)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)] [filter:drop-shadow(0_1px_3px_rgba(0,0,0,.85))]">
                      {/* A real logo file would arrive in its own brand
                          colours, so it's knocked out to flat white to match
                          the glyphs beside it. */}
                      {a.logo ? <img src={a.logo} alt={a.name} style={{ width: '58%', height: '58%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> : <a.icon size={16} />}
                    </div>
                  </div>
                  <div className="relative min-w-0">
                    <div className="text-[16.5px] font-extrabold tracking-[-0.01em] text-cream-2 leading-[1.2]">{a.name}</div>
                    <div className="mt-1.5 text-[12.5px] leading-[1.4] text-[rgba(242,237,227,.68)]">{a.purpose}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
