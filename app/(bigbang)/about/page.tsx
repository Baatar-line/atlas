'use client';

// Big Bang — About (/about): mission timeline, team, and the tourist-flow chart.
import { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import LanyardBadge from '@/components/bigbang/LanyardBadge';
import { BgMedia } from '@/components/bigbang/ui';

// Groups a space-separated vertical-script string 1 word per column (line),
// joined with a real `\n` — paired with `whiteSpace: 'pre'` on the element so
// the browser breaks exactly where told instead of auto-wrapping (which
// doesn't reliably clip for vertical Mongolian script and used to run the
// text past its row).
function mnVertLines(s: string, perLine = 1): string {
  const words = s.split(' ');
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) lines.push(words.slice(i, i + perLine).join(' '));
  return lines.join('\n');
}

export default function AboutPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Бидний тухай"
      className="box-border min-h-screen"
      style={{ background: 'radial-gradient(120% 60% at 12% 0%, rgba(232, 184, 75,.12) 0%, rgba(0,0,0,0) 55%), radial-gradient(100% 55% at 100% 25%, rgba(120,170,255,.07) 0%, rgba(0,0,0,0) 60%), #0b0a08' }}
    >
      {/* full-bleed hero board — large background photo + vertical icon timeline,
          inspired by the "Eiger Trail" style infographic layout. Edge-to-edge like the
          Home hero, with the fixed site nav floating over it via its own fade-gradient. */}
      <div className="relative overflow-hidden">
        <BgMedia
          bg={V.abHeroFullBg} isVideo={V.abHeroIsVideo} videoSrc={V.abHeroRawUrl}
          className="absolute inset-0" imgClassName="bg-cover bg-top saturate-[1.05]" videoClassName="saturate-[1.05]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,_rgba(0,0,0,.88)_0%,_rgba(0,0,0,.6)_34%,_rgba(0,0,0,.16)_62%,_rgba(0,0,0,.4)_100%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,.08)_14%,_rgba(0,0,0,.08)_44%,_rgba(0,0,0,.42)_60%,_rgba(0,0,0,.85)_100%)]"></div>

        {/* Title and the four timeline rows are one fold: on desktop this box
            is a full screen tall, so the whole story lands in the first view
            and the team badges below can't peek into it. Fitting it there is
            what the width and the vh-scaled spacing inside are for — the
            min-height only reserves the screen, it can't shrink anything.

            Left at auto height on mobile, where the vertical script is
            dropped and the column is a phone wide: four paragraphs don't fit
            one phone screen at any type size worth reading. 640px rather than
            Tailwind's `md`, to switch on at exactly the width V.isMobile uses
            — the two decisions are the same decision. */}
        <div className="relative z-[2] flex flex-col min-[640px]:min-h-screen">
        <div className="pt-[clamp(64px,8vh,76px)] px-5 pb-0 text-center">
          <h1 className="m-0 text-[clamp(30px,4.4vw,54px)] font-extrabold leading-[1.14] text-cream-2 [text-shadow:0_4px_30px_rgba(0,0,0,.45)] [font-family:'Marcellus_SC',serif]">{V.L.abBig}</h1>
        </div>

        {/* Wide enough that each paragraph runs two or three lines instead of
            the five or six a 640px column forced — that alone is most of the
            height this fold had to lose, and it costs nothing but whitespace
            the hero photo was showing anyway. The remaining spacing scales
            with viewport height so a short laptop tightens rather than
            overflows. */}
        <div className="mx-auto w-full max-w-[1040px] min-[1800px]:max-w-[1240px] pt-[clamp(12px,2.6vh,36px)] px-7 pb-[clamp(12px,2.6vh,36px)]">
          <div>
            {/* icon and label both sit flush at the row's top, in the same 40px
                band, so their centers line up; the connector is one stub below
                each icon (not a line running behind it) reaching down to the next */}
            {V.abTimeline.map((row: any, i: number) => (
              <div key={i} className="flex gap-4 min-[1800px]:gap-6">
                <div className="flex w-10 flex-none flex-col items-center">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[rgba(242,237,227,.32)] bg-transparent text-cream"><row.icon size={17} /></span>
                  <div className={`w-px flex-shrink-0 basis-0 bg-[rgba(242,237,227,.28)] ${i === V.abTimeline.length - 1 ? 'grow-0' : 'grow'}`}></div>
                </div>
                {/* Tightened along with the third line each paragraph just
                    gained — four extra lines is about 90px, and the fold has
                    to keep fitting the short end of the viewport range. */}
                {/* The gutter between the two columns is the gap set here and
                    nothing else. It used to be whatever the row had left
                    over — around 190px — because this column grew to fill
                    the row and pushed the script out to the far edge. The
                    25em cap now lives on the column itself rather than on
                    the paragraph inside it, so the column stops where its
                    text stops and the leftover falls past the script instead
                    of between them. That also lines the script's first
                    column up at the same x on every row: vertical Mongolian
                    runs left to right, so that edge is where each block
                    begins reading, and it was the ragged one. */}
                <div className="flex flex-1 items-start justify-start gap-10 pb-[clamp(8px,2.4vh,22px)]">
                  {/* The type size sits on the column, not on the paragraph,
                      because the 25em cap is measured in this element's own
                      em — inherited 16px would have made it a fixed 400px and
                      thrown the characters-per-line straight out of the
                      window the paragraph below is set to. The label sets its
                      own size and is unaffected. */}
                  <div className="min-w-0 max-w-[25em] flex-1 text-[clamp(13px,1.6vh,15px)] min-[1800px]:text-[16px]">
                    <div className="flex min-h-10 items-center">
                      <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--accent,#E8B84B)]">{row.label}</div>
                    </div>
                    {/* Three lines each, and the column's 25em width above is
                        the only thing that decides that. The four paragraphs
                        are 130, 128, 101 and 101 characters, so every one of
                        them lands on three lines only while a line holds
                        between 44 and 50 characters: fewer and the longest
                        spills to four, more and the two shortest collapse to
                        two. 25em is the middle of that window at roughly
                        0.53em per Cyrillic character.

                        em, not px, because the type here is fluid
                        (clamp(13px,1.6vh,15px), set on the column above). A
                        pixel width would hold still while the font grew with
                        the viewport, walking the characters-per-line straight
                        out of that window — a tall monitor would break the
                        longest paragraph onto a fourth line and a short one
                        would pull the shortest back to two. Sized in em the
                        ratio can't drift, which is why the 1800px tier bumps
                        only the type size and needs no width of its own. */}
                    <div className="mt-1.5 leading-[1.6] text-cream">{row.desc}</div>
                  </div>
                  {/* One word per column (same manual-\n approach the short
                      `vert` title already used successfully) instead of letting
                      the browser auto-wrap a whole sentence inside a fixed-height
                      box — that auto-wrap doesn't reliably clip for vertical
                      Mongolian script here, which is what was running the text
                      past the row into the next one. Width grows with the column
                      count instead of being capped, height is auto (no overflow
                      clipping needed since nothing is forced to wrap blind).
                      Needs real horizontal room next to the paragraph, so it's
                      dropped on mobile.

                      No max-width, and that is the point: whitespace-pre can't
                      wrap, so a cap never shortened this text — it just made
                      the flex row reserve less space than the script actually
                      draws, and the overflow ran on toward the viewport edge
                      where the hero's overflow-hidden was waiting to cut it.
                      Sized to its content, the row divides honestly between
                      the two columns. */}
                  {!V.isMobile && (row.vert || row.descVert) && (
                    <div
                      // 18px, up from 16. The ceiling is the row's own width,
                      // not taste: this block is flex-none and sized to its
                      // content, so every point of type size widens it by a
                      // column's worth of pitch (~21 columns on the longest
                      // row). Past roughly 20px the pair no longer fits the
                      // 928px the row has, and the paragraph — flex-1, so it
                      // yields first — would shrink under its 25em and lose
                      // the three-line setting that width exists to hold.
                      // Height is not the constraint: even the longest column
                      // stays well under the paragraph beside it.
                      className="flex-none whitespace-pre text-[18px] min-[1800px]:text-[20px] leading-tight [writing-mode:vertical-lr] [font-family:'Mongolian_Baiti','Menksoft_Tigst',sans-serif]"
                      title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй"
                    >
                      {row.vert && <span className="font-bold text-[var(--accent,#E8B84B)]">{row.vert}</span>}
                      {row.descVert && <span className="text-[rgba(242,237,227,.5)]">{row.vert ? '\n' : ''}{mnVertLines(row.descVert)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div className="relative z-[2] mx-auto max-w-[1100px] min-[1800px]:max-w-[1380px] px-7 pb-12">
          {/* Same hanging-cord badges as the nav logo — real name/role on a
              bigger card (LanyardBadge's `large` variant), swinging on the
              same verlet-rope physics, draggable/knockable the same way.
              The card itself is `position:fixed` (needed so the rope can
              swing freely without layout constraints) so it contributes
              no height here on its own — this row would otherwise collapse
              to ~1px and the next section would render right through the
              hanging cards. min-height reserves roughly ring + cord + card
              so the page below doesn't overlap them. */}
          {V.isMobile ? (
            // Keep the real cord + Verlet swing physics on phones, but give
            // every fixed-position badge a tall in-flow grid cell of its own.
            // The anchor at the top of each cell now has ~260px reserved below
            // it (cord + card), so rows and the following section cannot stack
            // through the hanging cards as they did in the one-pixel flex row.
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-2">
              {V.team.map((tm: any, i: number) => (
                <div key={i} className="flex h-[260px] min-w-0 justify-center pt-1">
                  <LanyardBadge large letter={tm.initial} name={tm.name} role={tm.role} color={tm.avatarBg} img={tm.img} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-wrap items-start justify-center gap-8 pt-2">
              {V.team.map((tm: any, i: number) => (
                <LanyardBadge key={i} large letter={tm.initial} name={tm.name} role={tm.role} color={tm.avatarBg} img={tm.img} />
              ))}
            </div>
          )}
        </div>

      {/* Same column width as the sections above — the map SVG is width:100%
          of its container (see travel-map.js VB), so narrowing this column
          scales the whole globe down with it. */}
      <div className="relative z-[2] mx-auto max-w-[1280px]" style={{ padding: V.isMobile ? '20px 18px 40px' : '20px 32px 56px' }}>
        <div className="text-cream-2">
          <div className="mb-6">
            <div className="font-display italic text-[32px] leading-[1.05] text-cream-2">{V.travelTitle}</div>
            <div className="mt-2.5 max-w-[520px] text-[13px] leading-normal text-[rgba(242,237,227,.6)]">{V.travelSub}</div>
          </div>
          <div className={V.isTablet ? 'flex flex-col gap-6' : 'flex items-center gap-6'}>
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-[20px]">
              <div className="absolute inset-[-10%] bg-[radial-gradient(60%_60%_at_50%_50%,_rgba(0,0,0,.4)_0%,_rgba(0,0,0,0)_72%)]"></div>
              {/* The mounted SVG is width:100% over a ~1184×640 viewBox (see
                  travel-map.js VB), so it takes the column's full width and
                  sets its own height from that (~1.85:1). Only a
                  pre-mount reservation here, kept under that so it can't leave
                  a dead band below the map. */}
              <div ref={V.travelMapRef} className="relative w-full overflow-hidden rounded-[14px]" style={{ minHeight: V.isMobile ? 180 : 420 }}></div>
            </div>
            {/* Desktop puts the list in its own column beside the map rather
                than floating it over the map's corner, so the rows never
                cover the arcs/labels underneath. Fixed height (20 rows scroll
                inside) and centred against the taller map column. */}
            <div className={
              V.isTablet
                ? 'bb-hscroll box-border max-h-[460px] overflow-y-auto rounded-[20px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.05)] pt-[18px] px-4 pb-2 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.1)]'
                : 'bb-hscroll box-border w-[248px] flex-none h-[440px] overflow-y-auto rounded-[20px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.05)] pt-[18px] px-4 pb-2 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.1)]'
            }>
              <div className="mb-1.5 flex items-center gap-[9px] font-mono text-[10.5px] font-bold text-white">
                <span className="inline-block h-0.5 w-5 flex-none bg-white"></span>{V.L.abReachCaption}
              </div>
              <div className="mb-3.5 font-mono text-[10px] leading-normal text-[rgba(255,255,255,.6)]">{V.travelNote}</div>
              <div className="flex flex-col">
                {V.travelRows.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-[11px] border-b border-[rgba(255,255,255,.1)] py-[11px]">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.08)] font-mono text-[11px] font-bold text-white">{r.rank}</span>
                    <span className="min-w-0 flex-1 text-[13px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.4)]">{r.country}</span>
                    <span className="flex-none font-mono text-[11.5px] text-[rgba(255,255,255,.7)]">{r.v}</span>
                    {r.est && <span className="flex-none rounded-full border border-[rgba(255,255,255,.2)] py-[3px] px-[7px] text-[9px] font-extrabold uppercase tracking-[.04em] text-[rgba(255,255,255,.6)]">Тооцоо</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </section>
  );
}
