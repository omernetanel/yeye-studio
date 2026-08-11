"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// Where each piece starts and finishes arriving, along the stage's travel.
//
// They overlap on purpose: a piece begins moving while the one before it is
// still settling, so the screen is always mid-assembly rather than ticking
// through a queue. And they run in the order the argument does — the greeting,
// then the label, then the face, then what he does, then the three reasons — so
// the screen fills in the order it would be explained in.
const BEATS = {
  greetRise: [0.0, 0.2],
  // The settle finishes BEFORE the portrait starts. They used to overlap, and
  // for those few frames the greeting was still at arrival size on top of a
  // picture arriving underneath it — which read as the heading being broken
  // rather than as two things overlapping on purpose.
  greetSettle: [0.26, 0.44],
  label: [0.3, 0.42],
  portrait: [0.46, 0.6],
  claim: [0.56, 0.7],
  facts: [
    [0.72, 0.84],
    [0.8, 0.92],
    [0.88, 1.0],
  ],
} as const;

const STAGE_VH = 4;

// The greeting lands with its middle on the bottom edge — the first thing on
// screen is the top half of it, cut — and heavily out of focus. Size and blur
// together read as something coming into focus; blur alone reads as a filter.
const GREET_FROM_VH = 0.5;
const GREET_BLUR_PX = 44;
// How much bigger it is on arrival than at rest. A multiplier rather than a
// size, so it is measured against whatever the heading's own type scale is and
// does not have to be re-tuned when that changes.
const GREET_SIZE_CENTRED_VW = 5.4;
// Where it parks: the navbar logo's own line, mirrored across the screen — the
// logo is fixed at left-6 / top-[22px], so this is the same inset from the
// other edge and the same line. Sized so the two read as one header row.
const GREET_SIZE_PARKED_PX = 22;
const GREET_PARKED_TOP_PX = 22;
const GREET_PARKED_INSET_PX = 24;

// The closing line stops the page on its own: it arrives, it is held, the
// stroke is drawn, and then a beat before the pin releases — without that last
// one the page was let go on the exact frame the drawing finished, throwing the
// moment off screen with the scroll that completed it.
const CLOSER_IN_VH = 0.45;
const CLOSER_HOLD_VH = 0.3;
const CLOSER_DRAW_VH = 0.5;
const CLOSER_SETTLE_VH = 0.6;
const CLOSER_STAGE_VH =
  1 + CLOSER_IN_VH + CLOSER_HOLD_VH + CLOSER_DRAW_VH + CLOSER_SETTLE_VH;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

/**
 * "מי אני" — the section that earns the enquiry.
 *
 * One person, doing both halves of the job, with a way of working. It is the
 * only place on the page with a face on it and the only one that speaks in the
 * first person, so it is staged rather than laid out.
 *
 * The screen ASSEMBLES. It is held while each piece arrives onto the place the
 * layout already gives it, and none of them leave: the greeting, then the
 * section's own label on the navbar's line, then the face, then what he does,
 * then the three reasons one at a time. By the last of them the whole argument
 * is standing there at once, which is what removes the dead black — a screen
 * that only ever fills has none.
 *
 * It assembles once. Every beat latches at its high-water mark, so scrolling
 * back leaves the section built rather than taking it apart to be read again.
 *
 * The greeting is the one piece that is not simply faded into place: it lives
 * in the layout, and scroll carries it BACK from the middle of the screen into
 * the slot it already owns. That is why the layout stays authoritative — the
 * composition can be redesigned without touching the timing, because the
 * timing only ever describes a journey to a position CSS decided.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const stageRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<(HTMLLIElement | null)[]>([]);

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  // How far the greeting has to travel from the centre of the screen back to
  // its own place in the column, and how much bigger it is allowed to be when
  // it gets there — see measure().
  const greetOffsetRef = useRef({ x: 0, y: 0 });
  // The high-water mark of every beat. Assembly is one-way: a piece that has
  // arrived does not come apart when the page is scrolled back through it.
  const reachedRef = useRef<Record<string, number>>({});

  const measure = () => {
    const greet = greetRef.current;
    const panel = greet?.offsetParent as HTMLElement | null;
    if (!greet || !panel) return;

    // Measured at the size it PARKS at, and against the panel it is centred in
    // rather than against the window — the panel is 100svh and one scrollbar
    // narrower, and measuring against the window lands it short of the margin.
    const previousSize = greet.style.fontSize;
    const previousTransform = greet.style.transform;
    greet.style.fontSize = `${GREET_SIZE_PARKED_PX}px`;
    greet.style.transform = "";
    const width = greet.offsetWidth;
    const height = greet.offsetHeight;
    greet.style.fontSize = previousSize;
    greet.style.transform = previousTransform;

    greetOffsetRef.current = {
      x: panel.clientWidth / 2 - GREET_PARKED_INSET_PX - width / 2,
      y: GREET_PARKED_TOP_PX + height / 2 - panel.clientHeight / 2,
    };
  };

  const update = () => {
    const stage = stageRef.current;
    const greet = greetRef.current;
    const portrait = portraitRef.current;
    const claim = claimRef.current;
    if (!stage || !greet || !portrait || !claim) return;

    const screen = window.innerHeight;
    const travel = stage.getBoundingClientRect().height - screen;
    if (travel <= 0) return;
    const progress = clamp01(-stage.getBoundingClientRect().top / travel);

    const reached = reachedRef.current;
    const beat = (key: string, range: readonly [number, number]) => {
      const now = smoothstep((progress - range[0]) / (range[1] - range[0]));
      reached[key] = Math.max(reached[key] ?? 0, now);
      return reached[key];
    };

    // The greeting: up from under the bottom edge into focus at the centre of
    // the screen, then back to its own line in the column, shrinking as it goes.
    //
    // The ONE part of this section that is not latched. Everything else stays
    // put once it has arrived, because a reader scrolling back up is re-reading
    // and should not have the page taken apart around them — but the greeting
    // is the way in, and a way in that only works once means the second pass
    // through the site is missing its opening. It runs backwards with the
    // scroll, and forwards again on the way down.
    const rise = smoothstep((progress - BEATS.greetRise[0]) / (BEATS.greetRise[1] - BEATS.greetRise[0]));
    const settle = smoothstep(
      (progress - BEATS.greetSettle[0]) / (BEATS.greetSettle[1] - BEATS.greetSettle[0]),
    );
    const off = greetOffsetRef.current;
    const blur = lerp(GREET_BLUR_PX, 0, clamp01(rise * 1.4));

    // Driven by font size rather than by a scale transform. A transform
    // magnifies the blur with it — 44px through a 2.6x arrives as 114px, which
    // is not a blur but an absence — and it also leaves the element's layout
    // box at its small size, so nothing about the composition can be reasoned
    // about from it.
    greet.style.fontSize = `${lerp((GREET_SIZE_CENTRED_VW * window.innerWidth) / 100, GREET_SIZE_PARKED_PX, settle)}px`;
    greet.style.opacity = String(rise);
    greet.style.filter = blur > 0.15 ? `blur(${blur}px)` : "";
    greet.style.transform =
      `translate(-50%, -50%) translate(${off.x * settle}px, ${lerp(screen * GREET_FROM_VH, 0, rise) + off.y * settle}px)`;

    // Position is reversible; the reveal is not.
    //
    // Two different things were being asked of one number. Scrolling back up
    // should carry the copy back down with the greeting and bring it up again
    // on the way forward — that is the movement, and it belongs to wherever the
    // page is. But the fade in is an arrival, and an arrival that replays every
    // time the page is scrolled past is not an arrival, it is a flicker. So the
    // transform reads live and the opacity reads the high-water mark: the copy
    // travels on every pass and only ever appears once, on the first.
    const arrive = (el: HTMLElement, key: string, range: readonly [number, number], dy: number) => {
      const live = smoothstep((progress - range[0]) / (range[1] - range[0]));
      el.style.opacity = String(beat(key, range));
      el.style.transform = `translateY(${lerp(dy, 0, live)}px)`;
    };

    arrive(portrait, "portrait", BEATS.portrait, 60);
    arrive(claim, "claim", BEATS.claim, 44);
    BEATS.facts.forEach((range, index) => {
      const item = factsRef.current[index];
      if (item) arrive(item, `fact${index}`, range, 40);
    });

    // The close, on its own stage. Position-driven rather than latched: the
    // page is held still here, and a one-way arrival inside a held frame is a
    // trapdoor — scroll back into it and it has already happened, with no way
    // to see it again.
    const closerStage = closerStageRef.current;
    const closerLine = closerLineRef.current;
    const closerSwash = closerSwashRef.current;
    if (closerStage && closerLine && closerSwash) {
      const held = -closerStage.getBoundingClientRect().top;
      const inEnd = screen * CLOSER_IN_VH;
      const drawStart = inEnd + screen * CLOSER_HOLD_VH;
      const drawEnd = drawStart + screen * CLOSER_DRAW_VH;

      const arriveT = smoothstep(held / inEnd);
      const draw = clamp01((held - drawStart) / (drawEnd - drawStart));

      closerLine.style.opacity = String(arriveT);
      closerLine.style.transform = `translateY(${lerp(38, 0, arriveT)}px)`;
      closerSwash.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;
    }
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    measure();
    update();

    // Measured again once the display font has loaded: the first pass runs
    // against the fallback face, and the greeting's resting box — which is what
    // the whole journey is aimed at — is a different size in it.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      update();
    });

    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    <section id="about" data-nav-dark="true" className="relative bg-black">
      {/* THE ASSEMBLY. One screen, held, filling up — and staying full. */}
      <div ref={stageRef} style={{ height: `${STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-clip">
          {/* THE GREETING. Out of the flow entirely, floating over the panel.
              It used to live inside the column so it could shrink into it, and
              that was the mistake: an element in the flow still occupies its
              slot while it is transformed elsewhere, so on the way back up it
              was a half-transparent heading shrinking on top of the paragraphs
              that had latched into place beside it. Nothing it does can disturb
              the composition from out here. */}
          <div
            ref={greetRef}
            className="pointer-events-none absolute top-1/2 left-1/2 z-20 font-display leading-[1.06] font-bold whitespace-nowrap text-white will-change-transform"
            style={{ opacity: 0, fontSize: `${GREET_SIZE_CENTRED_VW}vw` }}
          >
            {/* The greeting is the smaller half of its own heading: the
                throat-clear before the name, and the name is what is being
                said. Both in em, so the pair keeps its proportions through
                every size it passes through on the way to the corner. */}
            <span className="block text-[0.48em] text-white/70">נעים מאוד,</span>
            <span className="block">אני עומר.</span>
          </div>

          <div className="mx-auto flex h-full max-w-[1240px] flex-col justify-center px-6 pt-24 pb-14 md:px-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_30vw] lg:gap-14">
              <div className="text-right">
                <div ref={claimRef} className="will-change-transform" style={{ opacity: 0 }}>
                  {/* Both sentences are set identically — same face, size,
                      weight, colour, measure and spacing. They were a bold
                      25px over a light 16px before, which made the block look
                      like it was stepping down to fill a space rather than
                      saying two things of equal weight. The only difference
                      left between them is which words are lifted, and that is
                      the difference that should be doing the work.

                      Two claims here cannot be copied off another studio's
                      page: the years, which give the age of the practice
                      without giving an age, and the past tense — this site,
                      the one being read, is the exhibit. */}
                  <p className="mt-8 max-w-[44ch] font-display text-[19px] leading-[1.55] font-medium text-balance text-white/60 md:text-[22px]">
                    אני מעצב מגיל 15, מפתח מגיל 17, ואני{" "}
                    <span className="font-bold text-white">עיצבתי ובניתי את מה שאתם רואים כאן</span>.
                  </p>
                  <p className="mt-6 max-w-[44ch] font-display text-[19px] leading-[1.55] font-medium text-balance text-white/60 md:text-[22px]">
                    הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
                    <span className="font-bold text-white">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
                  </p>
                </div>
              </div>

              {/* Kept portrait-shaped. Capping only the height let a 432-wide
                  box crop a 430x560 photograph into a 378-tall landscape slot,
                  which squashed the face. */}
              <div
                ref={portraitRef}
                className="order-first will-change-transform lg:order-none"
                style={{ opacity: 0 }}
              >
                <figure className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/portrait.webp"
                    alt="עומר, מייסד YEYE Digital"
                    width={430}
                    height={560}
                    className="mx-auto block aspect-[3/4] max-h-[46svh] w-auto object-cover"
                    draggable={false}
                  />
                </figure>
              </div>
            </div>

            {/* The three join along the bottom, one at a time, and stay. By the
                last one the whole argument is standing on one screen. */}
            <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:mt-14 lg:gap-10">
              {aboutFacts.map((fact, index) => (
                <li
                  key={fact.title}
                  ref={(el) => {
                    factsRef.current[index] = el;
                  }}
                  className="will-change-transform"
                  style={{ opacity: 0 }}
                >
                  <div className="border-t border-white/20 pt-4 text-right">
                    <span className="font-display text-[12px] leading-none font-bold tracking-[0.18em] text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 font-display text-[19px] leading-[1.15] font-bold text-balance text-white md:text-[23px]">
                      {fact.title}
                    </h3>
                    <p className="mt-2 font-body text-[14px] leading-[1.65] text-balance text-white/45 md:text-[15px]">
                      {fact.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* THE CLOSE. The page stops here. */}
      <div ref={closerStageRef} style={{ height: `${CLOSER_STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto w-full max-w-[1240px] px-6 text-right md:px-10">
            <p
              ref={closerLineRef}
              className="font-display text-[36px] leading-[1.12] font-bold text-balance text-white will-change-transform md:text-[60px]"
              style={{ opacity: 0 }}
            >
              אני כאן להפוך את הרעיון שלך
              <br />
              למוצר שמייצר אימפקט.
            </p>
            <div ref={closerSwashRef} className="mt-8" style={{ clipPath: "inset(0 100% 0 0)" }}>
              <HeadingSwash className="w-[260px] text-white md:w-[360px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
