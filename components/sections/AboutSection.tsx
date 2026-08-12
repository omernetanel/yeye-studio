"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// Where each piece starts and finishes arriving, along the stage's travel.
// The greeting finishes settling before the copy starts, so that reversed —
// which runs these backwards — the copy has cleared the screen before the
// greeting begins growing back out of its slot.
const BEATS = {
  greetRise: [0.0, 0.22],
  greetSettle: [0.28, 0.46],
  label: [0.3, 0.42],
  content: [0.48, 0.66],
  portrait: [0.5, 0.64],
  claim: [0.58, 0.72],
  facts: [
    [0.74, 0.85],
    [0.81, 0.92],
    [0.88, 0.99],
  ],
} as const;

const STAGE_VH = 4;

// The greeting lands with its middle on the bottom edge — the first thing on
// screen is the top half of it, cut — and heavily out of focus.
const GREET_FROM_VH = 0.5;
const GREET_BLUR_PX = 52;
// Its size while it is alone on the screen. Large: this is the one moment in
// the section that is only a name.
const GREET_SIZE_ALONE_VW = 8.6;
// And in the column, where it ends up as the heading of the copy. Bounded so it
// stays a heading on a phone and does not become one on a billboard.
const GREET_SIZE_IN_COLUMN = { min: 30, max: 50, ofWidth: 0.034 };

// How far the copy travels. Far enough that reversing carries it off the bottom
// of the screen rather than parking it there — the section should come apart
// on the way back up, not sit half-built.
const CONTENT_TRAVEL_VH = 0.72;

// The closing line stops the page on its own: it arrives, it is held, the
// stroke is drawn, and then a beat before the pin releases — without that last
// one the page was let go on the exact frame the drawing finished.
const CLOSER_IN_VH = 0.45;
const CLOSER_HOLD_VH = 0.3;
const CLOSER_DRAW_VH = 0.5;
const CLOSER_SETTLE_VH = 0.6;
const CLOSER_STAGE_VH =
  1 + CLOSER_IN_VH + CLOSER_HOLD_VH + CLOSER_DRAW_VH + CLOSER_SETTLE_VH;

// How wide the stroke's leading edge is, as a percentage of its own length.
// This is the difference between a stroke being drawn and a rectangle being
// slid across it.
const SWASH_TIP_SOFTNESS_PCT = 16;

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

function span(progress: number, range: readonly [number, number]) {
  return smoothstep((progress - range[0]) / (range[1] - range[0]));
}

/**
 * "מי אני" — the section that earns the enquiry.
 *
 * One person, doing both halves of the job, with a way of working. It is the
 * only place on the page with a face on it and the only one that speaks in the
 * first person, so it is staged rather than laid out.
 *
 * The screen assembles: the greeting arrives alone on the black, then the
 * section's label takes the navbar's line, then the face, then the copy, then
 * the three reasons one at a time. By the last of them the whole argument is
 * standing there at once, which is what removes the dead black — a screen that
 * only ever fills has none.
 *
 * Two different things reverse differently, and telling them apart is most of
 * what this file is:
 *
 *   MOVEMENT is live. Scrolling back up carries the copy off the bottom and
 *   grows the greeting back out into the middle of the screen, blurring as it
 *   goes, and scrolling forward does it again. The way in has to work every
 *   time, or the second visit to the site is missing its opening.
 *
 *   ARRIVAL is not. Each piece's fade-in latches at its high-water mark, so it
 *   only ever happens once — on the first pass or after a reload. A fade that
 *   replays every time the page is scrolled past is not an arrival, it is a
 *   flicker.
 *
 * The greeting floats over the panel rather than sitting in the column. It
 * lands exactly on a slot the column reserves for it, so the layout still
 * decides where it ends up — but out of the flow it cannot disturb anything on
 * its way there. In the flow it occupied its slot while transformed away, and
 * on the way back up it grew half-transparent on top of the paragraphs beside
 * it.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const stageRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const greetLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const slotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<(HTMLLIElement | null)[]>([]);

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  // Where the greeting has to land, how big it is when it gets there, and how
  // far each of its lines has to slide to go from centred to right-aligned.
  const landingRef = useRef({ x: 0, y: 0, size: 30, lineShift: [0, 0] });
  // The high-water mark of every fade. Arrival is one-way.
  const reachedRef = useRef<Record<string, number>>({});

  const measure = () => {
    const greet = greetRef.current;
    const slot = slotRef.current;
    const panel = greet?.offsetParent as HTMLElement | null;
    if (!greet || !slot || !panel) return;

    const size = Math.round(
      Math.max(
        GREET_SIZE_IN_COLUMN.min,
        Math.min(GREET_SIZE_IN_COLUMN.max, panel.clientWidth * GREET_SIZE_IN_COLUMN.ofWidth),
      ),
    );
    slot.style.fontSize = `${size}px`;

    // Measured with EVERY transform off — the greeting's own, and the content
    // wrapper's, which the slot lives inside. The wrapper starts translated
    // most of a screen down and only scroll brings it back, so measuring the
    // slot through it aimed the greeting at a landing place that low and it
    // simply descended off the bottom.
    const content = contentRef.current;
    const previousSize = greet.style.fontSize;
    const previousTransform = greet.style.transform;
    const previousContent = content?.style.transform ?? "";
    greet.style.fontSize = `${size}px`;
    greet.style.transform = "";
    if (content) content.style.transform = "";

    const greetBox = greet.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();

    // Each line slides from centred within the block to flush with its right
    // edge. Right-aligned is the resting state, so the offset is what centring
    // would add — and it is per line, because the two are different lengths.
    const lineShift = greetLinesRef.current.map((line) => {
      if (!line) return 0;
      const lineBox = line.getBoundingClientRect();
      return -(greetBox.width - lineBox.width) / 2;
    });

    greet.style.fontSize = previousSize;
    greet.style.transform = previousTransform;
    if (content) content.style.transform = previousContent;

    landingRef.current = {
      x: slotBox.left + slotBox.width / 2 - (panelBox.left + panel.clientWidth / 2),
      y: slotBox.top + slotBox.height / 2 - (panelBox.top + panel.clientHeight / 2),
      size,
      lineShift: [lineShift[0] ?? 0, lineShift[1] ?? 0],
    };
  };

  const update = () => {
    const stage = stageRef.current;
    const greet = greetRef.current;
    const label = labelRef.current;
    const content = contentRef.current;
    const portrait = portraitRef.current;
    const claim = claimRef.current;
    if (!stage || !greet || !label || !content || !portrait || !claim) return;

    const screen = window.innerHeight;
    const travel = stage.getBoundingClientRect().height - screen;
    if (travel <= 0) return;
    const progress = clamp01(-stage.getBoundingClientRect().top / travel);

    const reached = reachedRef.current;
    const arrived = (key: string, range: readonly [number, number]) => {
      reached[key] = Math.max(reached[key] ?? 0, span(progress, range));
      return reached[key];
    };

    // THE GREETING — entirely live, in both directions.
    const rise = span(progress, BEATS.greetRise);
    const settle = span(progress, BEATS.greetSettle);
    const land = landingRef.current;

    greet.style.fontSize = `${lerp((GREET_SIZE_ALONE_VW * window.innerWidth) / 100, land.size, settle)}px`;
    greet.style.opacity = String(rise);
    const blur = lerp(GREET_BLUR_PX, 0, clamp01(rise * 1.4));
    greet.style.filter = blur > 0.15 ? `blur(${blur}px)` : "";
    greet.style.transform =
      `translate(-50%, -50%) translate(${land.x * settle}px, ${lerp(screen * GREET_FROM_VH, 0, rise) + land.y * settle}px)`;

    // Centred while it is alone, right-aligned once it is a heading. The block
    // is right-aligned, so each line is pushed out to centre it and slides back
    // as it settles — which is the alignment changing as a movement rather than
    // as a jump.
    greetLinesRef.current.forEach((line, index) => {
      if (line) line.style.transform = `translateX(${land.lineShift[index] * (1 - settle)}px)`;
    });

    // THE COPY — movement live, arrival latched.
    const contentTravel = span(progress, BEATS.content);
    content.style.transform = `translateY(${lerp(screen * CONTENT_TRAVEL_VH, 0, contentTravel)}px)`;

    const fade = (el: HTMLElement, key: string, range: readonly [number, number]) => {
      el.style.opacity = String(arrived(key, range));
    };

    label.style.opacity = String(arrived("label", BEATS.label));
    label.style.transform = `translateY(${lerp(-14, 0, span(progress, BEATS.label))}px)`;
    fade(portrait, "portrait", BEATS.portrait);
    fade(claim, "claim", BEATS.claim);
    BEATS.facts.forEach((range, index) => {
      const item = factsRef.current[index];
      if (item) fade(item, `fact${index}`, range);
    });

    // The close, on its own stage. Position-driven rather than latched: the
    // page is held still here, and a one-way arrival inside a held frame is a
    // trapdoor — scroll back into it and it has already happened.
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

      // Drawn with a soft leading edge rather than clipped with a hard one. A
      // clip reveals the stroke as a rectangle sliding across it, which reads
      // as a wipe; a gradient mask lets the tip come in over a width, which is
      // how a loaded brush actually puts paint down.
      const drawn = draw * (100 + SWASH_TIP_SOFTNESS_PCT);
      const mask =
        `linear-gradient(to right, #000 0%, #000 ${Math.max(0, drawn - SWASH_TIP_SOFTNESS_PCT)}%,` +
        ` transparent ${drawn}%, transparent 100%)`;
      closerSwash.style.maskImage = mask;
      closerSwash.style.webkitMaskImage = mask;
    }
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    measure();
    update();

    // Measured again once the display font has loaded: the first pass runs
    // against the fallback face, and every number here comes off a text box.
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
      <div ref={stageRef} style={{ height: `${STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-clip">
          {/* The section's label, mirrored on the logo: the logo is fixed at
              left-6 / top-[22px], so this is the same inset from the other edge
              and the same line. The two read as one header row — the mark on
              one side, where you are on the other. */}
          <div
            ref={labelRef}
            className="pointer-events-none absolute top-[22px] right-6 z-30 will-change-transform"
            style={{ opacity: 0 }}
          >
            <span className="font-display text-[20px] leading-none font-bold text-white md:text-[24px]">
              מי אני
            </span>
          </div>

          {/* THE GREETING, floating. It lands exactly on the slot the column
              reserves below, so the layout still decides where it ends up. */}
          <div
            ref={greetRef}
            className="pointer-events-none absolute top-1/2 left-1/2 z-20 text-right font-display leading-[1.06] font-bold whitespace-nowrap text-white will-change-transform"
            style={{ opacity: 0, fontSize: `${GREET_SIZE_ALONE_VW}vw` }}
          >
            {/* In em, so the pair keeps its proportions through every size it
                passes through on the way down to the column. */}
            {/* Each line is a block that stacks, wrapping an inline-block that
                is only as wide as its own words. The measurement that centres
                them is the difference between the two widths, and a block span
                is always the full width of its parent — so measured on the
                outer span it came out zero for both lines and nothing ever
                moved. */}
            <span className="block text-[0.46em] text-white/70">
              <span
                ref={(el) => {
                  greetLinesRef.current[0] = el;
                }}
                className="inline-block will-change-transform"
              >
                נעים מאוד,
              </span>
            </span>
            <span className="block">
              <span
                ref={(el) => {
                  greetLinesRef.current[1] = el;
                }}
                className="inline-block will-change-transform"
              >
                אני עומר.
              </span>
            </span>
          </div>

          <div ref={contentRef} className="h-full will-change-transform">
            <div className="mx-auto flex h-full max-w-[1240px] flex-col justify-center px-6 pt-24 pb-14 md:px-10">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_30vw] lg:gap-14">
                <div className="text-right">
                  {/* The slot. It holds the greeting's place in the column so
                      the copy sits below it, and it is what the floating one is
                      aimed at — invisible, but never display:none, because a
                      box with no layout cannot be measured. */}
                  <div
                    ref={slotRef}
                    aria-hidden="true"
                    className="invisible font-display leading-[1.06] font-bold whitespace-nowrap"
                  >
                    <span className="block text-[0.46em]">נעים מאוד,</span>
                    <span className="block">אני עומר.</span>
                  </div>

                  <div ref={claimRef} className="will-change-transform" style={{ opacity: 0 }}>
                    {/* Both sentences are set identically — same face, size,
                        weight, colour, measure and spacing. The only difference
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

                {/* Kept portrait-shaped. Capping only the height let a wide box
                    crop a 430x560 photograph into a landscape slot. */}
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
                      className="mx-auto block aspect-[3/4] max-h-[42svh] w-auto object-cover"
                      draggable={false}
                    />
                  </figure>
                </div>
              </div>

              {/* The three join along the bottom, one at a time, and stay. By
                  the last one the whole argument is standing on one screen. */}
              <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:mt-14 lg:gap-10">
                {aboutFacts.map((fact, index) => (
                  <li
                    key={fact.title}
                    ref={(el) => {
                      factsRef.current[index] = el;
                    }}
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
            <div
              ref={closerSwashRef}
              className="mt-10"
              style={{
                maskImage: "linear-gradient(to right, #000 0%, transparent 0%)",
                WebkitMaskImage: "linear-gradient(to right, #000 0%, transparent 0%)",
              }}
            >
              <HeadingSwash className="w-[440px] text-white md:w-[680px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
