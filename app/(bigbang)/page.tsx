'use client';

// Big Bang — Home (/): category nav list + aimag hero picker + preview cards.
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

export default function Home() {
  const V: any = useContext(BigBangContext);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const markBackgroundReady = useCallback(() => setBackgroundReady(true), []);
  useEffect(() => {
    if (backgroundReady) window.dispatchEvent(new Event('atlas:home-ready'));
  }, [backgroundReady]);
  return (
    <section
      data-screen-label="Нүүр — ангилал хайлт"
      className={`relative bg-ink ${V.isTablet ? 'min-h-screen' : 'h-screen overflow-hidden'}`}
    >
      {/* Real admin-managed home background (Admin Panel → Фон зураг → Нүүр
          хуудас) — was sitting unused in settings while the procedural
          moss-cliff scene stood in for it; that's gone now, so this renders
          for real again. */}
      <BgMedia
        bg={V.homeHeroBg} isVideo={V.homeBgIsVideo} videoSrc={V.homeBgRawUrl}
        className="absolute inset-0" imgClassName="bg-cover bg-center" videoClassName="bg-cover"
        onReady={markBackgroundReady}
      />
      {/* Aimag hero — every aimag keeps its own stable layer (never a shared
          element whose background-image url gets swapped), and switching
          straight from one aimag's photo to another's is a real two-photo
          dissolve (both layers fade at once). aimagBgBackstop is a solid
          (non-transitioning) copy of whichever aimag was showing right
          before the dissolve started, painted just below the two dissolving
          layers — without it, the moment in the middle where neither is
          fully opaque would let the plain Home hero flash through instead
          of the outgoing aimag's own photo. While the picked aimag's photo
          hasn't loaded yet, a skeleton shows through instead of the flat
          black scrim. */}
      {/* Category hover/selection preview — always a still photo, even for a
          category with an uploaded background video (that only plays once
          you're inside the category's own page). */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,_rgba(3,8,5,.74)_0%,_rgba(3,8,5,.2)_42%,_transparent_72%)]"></div>

      <div
        onMouseLeave={V.clearActive}
        className={V.isTablet
          ? 'relative z-10 flex flex-col items-center gap-3 pt-24 px-5 pb-10 text-center'
          : 'absolute left-12 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3'}
      >
        <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[.2em] text-[rgba(242,237,227,.4)]">{V.L.catLabel}</div>
        {/* Mobile: a centered, wrapping horizontal row instead of the
            desktop's left-pinned vertical stack — `contents` on desktop so
            this wrapper doesn't add an extra flex item to the outer column. */}
        <div className={V.isTablet ? 'flex flex-wrap items-center justify-center gap-x-5 gap-y-2' : 'contents'}>
          {V.navCats.map((c: any, i: number) => (
            <React.Fragment key={i}>
              <button
                onClick={c.open}
                onMouseEnter={c.activate}
                onFocus={c.activate}
                className="flex cursor-pointer items-center gap-[14px] border-0 bg-transparent px-0 py-2 text-left transition-[transform_.4s_cubic-bezier(.22,.8,.3,1),_color_.3s_ease]"
                style={{ color: c.color, transform: V.isTablet ? 'none' : c.shift }}
              >
                <span className="font-mono text-[10.5px] opacity-50">{c.num}</span>
                <span className="text-[clamp(14px,1.1vw,18px)] font-bold leading-[1.3] tracking-[-0.01em]">{c.name}</span>
                <span className="text-[11px] font-extrabold text-[var(--accent,#E8B84B)]">{c.count}</span>
                {!V.isTablet && (
                  <span
                    className="inline-block h-[2px] w-8 bg-[var(--accent,#E8B84B)] transition-opacity duration-[300ms] ease-in-out"
                    style={{ opacity: c.barOpacity }}
                  ></span>
                )}
              </button>
              {/* Sub-category flyout — desktop-only hover affordance, same trigger
                  as the background preview swap. Sits in normal document flow
                  (pushes the categories below it down while open) rather than
                  overlaying them, so a category with many subs never covers its
                  neighbors. Each sub is its own bordered pill, not one shared
                  bordered container, and they cascade in one after another via
                  a staggered animation delay. */}
              {!V.isTablet && c.isActive && c.subs.length > 0 && (
                <div className="flex max-w-[calc(100vw-96px)] flex-row flex-nowrap items-center gap-[6px] overflow-x-auto">
                  {c.subs.map((s: any, si: number) => (
                    <button
                      key={si}
                      onClick={s.open}
                      className="animate-bbFadeDown cursor-pointer whitespace-nowrap rounded-full border border-[rgba(255,255,255,.16)] bg-[#16130e] px-[15px] py-[7px] text-left text-[12px] font-semibold text-[rgba(242,237,227,.75)] shadow-[0_8px_20px_rgba(0,0,0,.35)] transition-colors duration-[200ms] hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"
                      style={{ animationDelay: (si * 60) + 'ms' }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tablet/mobile: the map moves into normal document flow below the
          category list (the desktop block below is absolutely positioned
          against a fixed-height hero, which a phone-width screen can't fit)
          — same interactive map either way, just not side-by-side with
          preview cards, which stay desktop-only. Hidden until the header's
          "Бүгд" (aimag) button opens it — same V.locOpen toggle that already
          drives that button's chip-list dropdown. */}
      {V.isTablet && V.locOpen && (
        <div className="relative z-10 mx-auto mt-1 w-full max-w-[480px] px-6 pb-8 animate-bbFadeDown">
          <div className="mb-2 text-center text-[11px] text-[rgba(242,237,227,.5)]">{V.L.mapHint}</div>
          <div ref={V.pickerWrapRef} className="relative aspect-[4/3] w-full">
            {V.pickerSvg}
            {V.heroVertLabel && V.heroVertPos && (
              <div
                className="absolute z-[6] pointer-events-none [writing-mode:vertical-lr] font-[Mongolian_Baiti,Menksoft_Tigst,sans-serif] text-[16px] text-[var(--accent,#E8B84B)] [text-shadow:0_1px_4px_rgba(6,9,14,.8),_0_0_2px_rgba(6,9,14,.8)]"
                style={{ left: V.heroVertPos.left, top: V.heroVertPos.top - 10 }}
                title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй"
              >{V.heroVertLabel}</div>
            )}
          </div>
        </div>
      )}

      {/* map picker + preview cards — the absolute side-by-side hero
          layout doesn't fit a phone screen, so this desktop version stays
          desktop/tablet only; the block above covers the map on mobile.
          Preview cards stay unaffected by locOpen — only the map itself is
          gated behind the "Бүгд" button. */}
      {!V.isTablet && (
        <>
          {V.locOpen && (
            <>
              {/* top/bottom shifted together (not just top) so nudging the
                  map down the page doesn't also squash the picker's height. */}
              <div className="absolute left-[30%] right-[30px] top-[136px] bottom-[114px] z-[6] animate-bbFadeDown">
                <div ref={V.pickerWrapRef} className="relative h-full">
                  {V.pickerSvg}
                  {V.heroVertLabel && V.heroVertPos && (
                    <div
                      className="absolute z-[6] pointer-events-none [writing-mode:vertical-lr] font-[Mongolian_Baiti,Menksoft_Tigst,sans-serif] text-[16px] text-[var(--accent,#E8B84B)] [text-shadow:0_1px_4px_rgba(6,9,14,.8),_0_0_2px_rgba(6,9,14,.8)]"
                      style={{ left: V.heroVertPos.left, top: V.heroVertPos.top - 10 }}
                      title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй"
                    >{V.heroVertLabel}</div>
                  )}
                </div>
              </div>

              {/* Sits in the otherwise-empty background above the map's
                  right edge — the spot the map itself doesn't reach. */}
              <div className="absolute right-[80px] top-[110px] z-[7] max-w-[240px] text-right text-[12px] text-[rgba(242,237,227,.45)] animate-bbFadeDown">{V.L.mapHint}</div>
            </>
          )}
          {/* The three best-rated places in whichever category the cursor is
              on. It reads as the other half of the hover: the background photo
              behind the list changes to say which category you are on, and
              this says what is actually in it.

              Bottom-right because the category list owns the left side and the
              corner is otherwise empty photograph. The one thing it does share
              the space with is the aimag map, which reaches down to
              bottom-[114px] while these stand 200px off a bottom-11 edge — so
              with the map open the top half of the cards covers its lower-right
              corner. Left that way rather than gated behind locOpen: hovering a
              category with the map open is a normal thing to do, and answering
              the hover with nothing at all would be the worse of the two.

              Absent, not empty, when the hovered category has no places in the
              chosen aimag: three blank frames would say the category is broken
              rather than that this aimag has nothing in it yet. */}
          {V.previewCards.length > 0 && (
            <div
              key={V.previewCards[0].key}
              // The list clears the hover on mouseleave, and the cursor has to
              // leave it to get all the way over here — so the row holds the
              // clear off for as long as it is under the cursor, and lets it
              // run again on the way out.
              onMouseEnter={V.holdActive}
              onMouseLeave={V.clearActive}
              className="absolute right-12 bottom-11 z-10 flex items-end gap-[14px]"
            >
              {V.previewCards.map((c: any, i: number) => (
                <button
                  key={c.key}
                  onClick={c.open}
                  aria-label={c.name}
                  // Staggered so the three read as one group arriving rather
                  // than three things appearing at once. The wrapper's `key` is
                  // the first card's, which makes React rebuild the row when
                  // the hover moves to another category — otherwise the cards
                  // are reused in place, the animation never re-runs, and the
                  // photos swap under a stack that never moved.
                  style={{ animationDelay: (i * 80) + 'ms' }}
                  className="animate-bbCardIn relative block h-[200px] w-[160px] cursor-pointer overflow-hidden rounded-[18px] border border-[rgba(255,255,255,.1)] bg-transparent p-0 text-left transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-[var(--accent,#E8B84B)]"
                >
                  <BgMedia bg={c.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.18)_0%,_rgba(0,0,0,0)_35%,_rgba(0,0,0,.32)_62%,_rgba(0,0,0,.92)_100%)]"></div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[15px] py-[13px]">
                    <div className="mb-[7px] flex items-center gap-1">
                      <span className="text-[11px] leading-none text-[var(--accent,#E8B84B)]">★</span>
                      <span className="text-[11.5px] font-extrabold leading-none text-cream-2">{c.rating}</span>
                    </div>
                    <div className="text-[14px] font-extrabold leading-[1.2] tracking-[-0.01em] text-cream-2">{c.name}</div>
                    {c.meta && <div className="mt-1 truncate text-[11.5px] text-[rgba(242,237,227,.62)]">{c.meta}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
