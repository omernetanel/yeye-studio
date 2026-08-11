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
  greetRise: [0.0, 0.18],
  greetSettle: [0.24, 0.42],
  label: [0.26, 0.38],
  portrait: [0.34, 0.5],
  claim: [0.44, 0.58],
  facts: [
    [0.6, 0.74],
    [0.69, 0.83],
    [0.78, 0.92],
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
const GREET_SCALE_ON_ARRIVAL = 2.6;

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
  const labelRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<(HTMLLIElement | null)[]>([]);

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  // How far the greeting has to travel from the centre of the screen back to
  // its own place in the column.
  const greetOffsetRef = useRef({ x: 0, y: 0 });
  // The high-water mark of every beat. Assembly is one-way: a piece that has
  // arrived does not come apart when the page is scrolled back through it.
  const reachedRef = useRef<Record<string, number>>({});

  const measure = () => {
    const greet = greetRef.current;
    const panel = greet?.offsetParent as HTMLElement | null;
    if (!greet || !panel) return;

    // Measured with the transform off, so this is the resting box the layout
    // gives it — reading it while transformed would return wherever the last
    // frame happened to put it.
    const previous = greet.style.transform;
    greet.style.transform = "";
    const box = greet.getBoundingClientRect();
    greet.style.transform = previous;

    const panelBox = panel.getBoundingClientRect();
    greetOffsetRef.current = {
      x: panelBox.left + panel.clientWidth / 2 - (box.left + box.width / 2),
      y: panelBox.top + panel.clientHeight / 2 - (box.top + box.height / 2),
    };
  };

  const update = () => {
    const stage = stageRef.current;
    const greet = greetRef.current;
    const label = labelRef.current;
    const portrait = portraitRef.current;
    const claim = claimRef.current;
    if (!stage || !greet || !label || !portrait || !claim) return;

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
    const rise = beat("greetRise", BEATS.greetRise);
    const settle = beat("greetSettle", BEATS.greetSettle);
    const off = greetOffsetRef.current;
    const away = 1 - settle;

    greet.style.opacity = String(rise);
    greet.style.filter = rise < 0.98 ? `blur(${lerp(GREET_BLUR_PX, 0, clamp01(rise * 1.4))}px)` : "";
    greet.style.transform =
      `translate(${off.x * away}px, ${off.y * away + lerp(screen * GREET_FROM_VH, 0, rise) * away}px)` +
      ` scale(${lerp(1, GREET_SCALE_ON_ARRIVAL, away)})`;

    const arrive = (el: HTMLElement, t: number, dy: number) => {
      el.style.opacity = String(t);
      el.style.transform = `translateY(${lerp(dy, 0, t)}px)`;
    };

    arrive(label, beat("label", BEATS.label), -14);
    arrive(portrait, beat("portrait", BEATS.portrait), 60);
    arrive(claim, beat("claim", BEATS.claim), 44);
    BEATS.facts.forEach((range, index) => {
      const item = factsRef.current[index];
      if (item) arrive(item, beat(`fact${index}`, range), 40);
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
          {/* The section's own label, on the navbar logo's line and against the
              right margin, so the two read as one header row: the mark on one
              side, where you are on the other. "מי אני" rather than "קצת עלי"
              — it is what the sub-page nav already calls this destination, and
              a section arguing for confidence should not label itself "a bit". */}
          <div
            ref={labelRef}
            className="pointer-events-none absolute top-0 right-0 left-0 z-10 mx-auto flex h-[80px] max-w-[1240px] items-center justify-start px-6 will-change-transform md:px-10"
            style={{ opacity: 0 }}
          >
            <span className="font-display text-[15px] leading-none font-bold tracking-[0.14em] text-white/45">
              מי אני
            </span>
          </div>

          <div className="mx-auto flex h-full max-w-[1240px] flex-col justify-center px-6 pt-24 pb-14 md:px-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_30vw] lg:gap-14">
              <div className="text-right">
                {/* The greeting. It lives here, in the column, and scroll only
                    carries it back from the middle of the screen. */}
                <div
                  ref={greetRef}
                  className="origin-center font-display text-[30px] leading-[1.08] font-bold whitespace-nowrap text-white will-change-transform md:text-[44px]"
                  style={{ opacity: 0 }}
                >
                  נעים מאוד,
                  <br />
                  אני עומר.
                </div>

                <div ref={claimRef} className="will-change-transform" style={{ opacity: 0 }}>
                  {/* Two claims that cannot be copied off another studio's
                      page: the years, which give the age of the practice
                      without giving an age, and the past tense — this site, the
                      one being read, is the exhibit. */}
                  <p className="mt-7 max-w-[46ch] font-display text-[20px] leading-[1.4] font-bold text-balance text-white md:text-[25px]">
                    אני מעצב מגיל 15, מפתח מגיל 17, ואני{" "}
                    <span className="text-white">עיצבתי ובניתי את מה שאתם רואים כאן</span>.
                  </p>
                  <p className="mt-5 max-w-[52ch] font-body text-[15px] leading-[1.8] text-balance text-white/50 md:text-[16px]">
                    הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
                    <span className="text-white/80">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
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
