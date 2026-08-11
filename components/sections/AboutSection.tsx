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
// through a queue. And they are ordered the way the argument is — the name,
// then the face, then what he does, then the three reasons — so the screen
// fills in the order it would be explained in.
const BEATS = {
  nameRise: [0.0, 0.16],
  nameSettle: [0.2, 0.34],
  portrait: [0.3, 0.46],
  claim: [0.4, 0.54],
  facts: [
    [0.56, 0.7],
    [0.65, 0.79],
    [0.74, 0.88],
  ],
} as const;

const STAGE_VH = 4;

// The name lands with its middle on the bottom edge — the first thing on screen
// is the top half of it, cut — and heavily out of focus. Size and blur together
// read as something coming into focus; blur alone reads as a filter.
const NAME_FROM_VH = 0.5;
const NAME_BLUR_PX = 44;
const NAME_SIZE_BIG_VW = 9.5;
const NAME_SIZE_SMALL_PX = 26;

// Where the name ends: the navbar logo's own line, against the right margin.
// The logo sits 22px down and is 36px tall, so its centre line is at 40.
const LOGO_LINE_CENTRE_Y_PX = 40;

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

const CONTENT_MAX_W_PX = 1240;
const CONTENT_PAD_PX = 24;

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
 * layout already gives it, and none of them leave — the name, then the face,
 * then the claim, then the three reasons one at a time. By the last of them the
 * whole argument is standing there at once.
 *
 * That is the answer to two separate faults at the same time. Bands of copy
 * scrolling past each other left wide stretches of black that read as
 * emptiness rather than as room, and nothing ever accumulated, so the section
 * was never more than whatever happened to be in the viewport. A screen that
 * only ever fills has neither problem.
 *
 * It assembles once: every beat latches at its high-water mark, so scrolling
 * back up leaves the section built rather than taking it apart to be read
 * again.
 *
 * The final layout is ordinary CSS. Scroll only carries each piece from an
 * offset into the place it already has, which is what keeps this maintainable —
 * the composition can be redesigned without touching the timing, and the timing
 * without touching the composition.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<(HTMLLIElement | null)[]>([]);

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  const nameEndRef = useRef({ x: 0, y: 0 });
  // The high-water mark of every beat. Assembly is one-way: a piece that has
  // arrived does not come apart when the page is scrolled back through it.
  const reachedRef = useRef<Record<string, number>>({});

  const measure = () => {
    const name = nameRef.current;
    if (!name) return;

    // Measured at the size it ENDS at, and against the panel it is centred in
    // rather than against the window — the panel is 100svh and one scrollbar
    // narrower, and using the window instead lands it short of the margin.
    const previous = name.style.fontSize;
    name.style.fontSize = `${NAME_SIZE_SMALL_PX}px`;
    const width = name.offsetWidth;
    name.style.fontSize = previous;

    const panel = name.offsetParent as HTMLElement | null;
    const panelW = panel ? panel.clientWidth : window.innerWidth;
    const panelH = panel ? panel.clientHeight : window.innerHeight;
    const columnW = Math.min(CONTENT_MAX_W_PX, panelW - CONTENT_PAD_PX * 2);

    nameEndRef.current = {
      x: (panelW + columnW) / 2 - (panelW / 2 + width / 2),
      y: LOGO_LINE_CENTRE_Y_PX - panelH / 2,
    };
  };

  const update = () => {
    const stage = stageRef.current;
    const name = nameRef.current;
    const portrait = portraitRef.current;
    const claim = claimRef.current;
    if (!stage || !name || !portrait || !claim) return;

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

    const rise = beat("nameRise", BEATS.nameRise);
    const settle = beat("nameSettle", BEATS.nameSettle);
    const end = nameEndRef.current;

    name.style.fontSize = `${lerp((NAME_SIZE_BIG_VW * window.innerWidth) / 100, NAME_SIZE_SMALL_PX, settle)}px`;
    name.style.filter = rise < 0.98 ? `blur(${lerp(NAME_BLUR_PX, 0, clamp01(rise * 1.4))}px)` : "";
    name.style.transform =
      `translate(-50%, -50%) translate(${end.x * settle}px, ${lerp(screen * NAME_FROM_VH, 0, rise) + end.y * settle}px)`;

    const arrive = (el: HTMLElement, t: number, dy: number) => {
      el.style.opacity = String(t);
      el.style.transform = `translateY(${lerp(dy, 0, t)}px)`;
    };

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
          <div className="mx-auto flex h-full max-w-[1240px] flex-col justify-center px-6 pt-24 pb-14 md:px-10">
            {/* The face and what he does, side by side. Under lg the picture
                leads the column instead. */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_30vw] lg:gap-14">
              <div ref={claimRef} className="text-right will-change-transform" style={{ opacity: 0 }}>
                <p className="font-display text-[30px] leading-[1.12] font-bold text-balance text-white md:text-[44px]">
                  אני מעצב ובונה את מה שאתם רואים כאן.
                </p>
                {/* The one credential on this page that cannot be copied off
                    another studio's site: it gives the age of the practice
                    without giving an age. */}
                <p className="mt-6 font-display text-[18px] leading-[1.45] font-medium text-white/75 md:text-[21px]">
                  מעצב מגיל 15, מפתח מגיל 17.
                </p>
                <p className="mt-3 max-w-[50ch] font-body text-[15px] leading-[1.75] text-balance text-white/45 md:text-[16px]">
                  הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
                  <span className="text-white/80">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
                </p>
              </div>

              <div
                ref={portraitRef}
                className="order-first will-change-transform lg:order-none"
                style={{ opacity: 0 }}
              >
                {/* Kept portrait-shaped. Capping only the height let a
                    432-wide box crop a 430x560 photograph into a 378-tall
                    landscape slot, which squashed the face. */}
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

          {/* Above the assembly, so the pieces arriving underneath pass behind
              it rather than through it. */}
          <div
            ref={nameRef}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 font-display leading-none font-bold whitespace-nowrap text-white will-change-transform"
            style={{ fontSize: `${NAME_SIZE_BIG_VW}vw` }}
          >
            אני עומר.
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
