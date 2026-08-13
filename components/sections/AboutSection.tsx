"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import BalloonDrop, { type DropState } from "@/components/sections/about/BalloonDrop";
import { aboutFacts } from "@/lib/content";

// Where each piece starts and finishes arriving, along the stage's travel.
// The greeting finishes settling before the copy starts, so that reversed —
// which runs these backwards — the copy has cleared the screen before the
// greeting begins growing back out of its slot.
//
// Nothing arrives while the column is still travelling. The portrait used to:
// it lit at 0.50, four hundredths after the greeting landed and in the middle
// of the column's flight, so it read as arriving with the heading rather than
// after it — and a photograph is legible at fifteen percent opacity where a
// line of text at the same opacity is still invisible.
const BEATS = {
  // The two lines of the greeting arrive one after the other, not together:
  // the salutation first, and only once it is standing does the name come up
  // under it. They overlap by a hair so the pair still reads as one gesture.
//
// Every fraction here has been rescaled twice, as the stage grew from six
// screens to seven and then to nine, so that each beat lands on the exact
// scroll distance it landed on the first time. The factor is never n/(n+1),
// because a beat is a fraction of the TRAVEL, which is the stage minus one
// screen: 500vh became 600vh became 800vh.
  greetLine1: [0.0, 0.1278],
  greetLine2: [0.1579, 0.2857],
  greetSettle: [0.3308, 0.4662],
  // With the section, not with the copy. It names where you are, so it belongs
  // on screen from the moment the black arrives — waiting until the column
  // landed meant the header row sat empty through the whole opening.
  label: [0.015, 0.0902],
  content: [0.4812, 0.5714],
  portrait: [0.5564, 0.6391],
  claim: [0.5865, 0.6617],
  facts: [
    [0.6466, 0.6917],
    [0.6767, 0.7143],
    [0.7068, 0.7444],
  ],
} as const;

// Past the last fact the stage still has 170vh to run and nothing left to move.
// That stretch is the balloons': the page keeps answering the wheel the whole
// way through it, so it is a slow passage rather than a stop, but nothing else
// is competing for the eye while they come down.
//
// It was 105vh first, which sounds generous and is not — scrolling covers a
// screen height in about a second, so the hold was over before two balloons had
// landed. Three screens fixed that and overshot: with nothing else moving, a
// stretch that long stops reading as a passage and starts reading as a page
// that has stopped answering. 170vh is the middle of those two.
//
// The trigger sits just BEFORE the last fact finishes rather than after it, so
// the first balloon is already on its way down while the section finishes
// assembling instead of after a beat of nothing.
const DROP_AT = 0.7218;

// How far the portrait lifts as it arrives. It is the only picture in the
// section, so it gets an entrance of its own rather than only an opacity ramp.
const PORTRAIT_LIFT_PX = 56;

// The beats above are fractions of this, so the two numbers together decide how
// fast anything moves. Six screens rather than four: at four the greeting's two
// lines were each done inside forty screen-heights of scroll, which on a
// trackpad is a flick. The tail is the balloons' — see DROP_AT.
const STAGE_VH = 7.65;

// The greeting lands with its middle on the bottom edge — the first thing on
// screen is the top half of it, cut — and heavily out of focus.
const GREET_FROM_VH = 0.5;
const GREET_BLUR_PX = 52;
// Its size while it is alone on the screen. Large: this is the one moment in
// the section that is only a name.
const GREET_SIZE_ALONE_VW = 8.6;
// And in the column, where it ends up as the heading of the copy. Bounded so it
// stays a heading on a phone and does not become one on a billboard. Set well
// above the 22px body copy: at the previous size the greeting's small line came
// out the same size as a paragraph line and the pair stopped reading as a
// heading at all.
const GREET_SIZE_IN_COLUMN = { min: 34, max: 58, ofWidth: 0.042 };

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

  const sectionRef = useRef<HTMLElement>(null);
  // Handed to the balloon layer once per scroll frame. A ref rather than state
  // on purpose: this changes on almost every frame and must not re-render the
  // section, which would tear down the whole scroll pipeline underneath it.
  const dropStateRef = useRef<DropState>({ armed: false, wallLive: false, leaving: false });

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  // Where the greeting has to land, how big it is when it gets there, and how
  // far each line has to travel sideways to go from centred to right-aligned.
  const landingRef = useRef({ x: 0, y: 0, size: 30, alignShift: [0, 0] });
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

    // How far right each line sits when right-aligned rather than centred: half
    // the slack between it and the widest line. Kept as a RATIO of the size it
    // was measured at, because the greeting is nearly twice this size on its
    // way down and a fixed pixel offset would align it at one size only.
    const alignShift = greetLinesRef.current.map((line) =>
      line ? (greetBox.width - line.getBoundingClientRect().width) / 2 / size : 0,
    );

    greet.style.fontSize = previousSize;
    greet.style.transform = previousTransform;
    if (content) content.style.transform = previousContent;

    landingRef.current = {
      x: slotBox.left + slotBox.width / 2 - (panelBox.left + panel.clientWidth / 2),
      y: slotBox.top + slotBox.height / 2 - (panelBox.top + panel.clientHeight / 2),
      size,
      alignShift: [alignShift[0] ?? 0, alignShift[1] ?? 0],
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
    const settle = span(progress, BEATS.greetSettle);
    const land = landingRef.current;

    const greetSize = lerp((GREET_SIZE_ALONE_VW * window.innerWidth) / 100, land.size, settle);
    greet.style.fontSize = `${greetSize}px`;
    greet.style.opacity = "1";
    greet.style.transform =
      `translate(-50%, -50%) translate(${land.x * settle}px, ${land.y * settle}px)`;
    // Each line rises on its own beat, and slides from centred to right-aligned
    // across the settle. The slide is eased over the same span the box uses to
    // descend, so the alignment arrives as part of the landing rather than as a
    // jump on the frame it completes.
    const glide = smoothstep(settle);
    ([BEATS.greetLine1, BEATS.greetLine2] as const).forEach((range, index) => {
      const line = greetLinesRef.current[index];
      if (!line) return;
      const rise = span(progress, range);
      line.style.opacity = String(rise);
      const blur = lerp(GREET_BLUR_PX, 0, clamp01(rise * 1.4));
      line.style.filter = blur > 0.15 ? `blur(${blur}px)` : "";
      line.style.transform =
        `translate(${land.alignShift[index] * greetSize * glide}px, ${lerp(screen * GREET_FROM_VH, 0, rise)}px)`;
    });

    // THE COPY — movement live, arrival latched.
    const contentTravel = span(progress, BEATS.content);
    content.style.transform = `translateY(${lerp(screen * CONTENT_TRAVEL_VH, 0, contentTravel)}px)`;

    const fade = (el: HTMLElement, key: string, range: readonly [number, number]) => {
      el.style.opacity = String(arrived(key, range));
    };

    const labelIn = arrived("label", BEATS.label);
    label.style.transform = `translateY(${lerp(-14, 0, span(progress, BEATS.label))}px)`;
    // Live, not latched. Latched it stayed lit on the way back up, sitting on
    // the black while the greeting was still coming apart above it — the one
    // element big enough to spoil the reverse on its own.
    //
    // Eased, not linear: a linear ramp on a photograph spends its first third
    // as a grey shape sitting there before it is properly on screen.
    const portraitIn = smoothstep(span(progress, BEATS.portrait));
    portrait.style.opacity = String(portraitIn);
    portrait.style.transform = `translateY(${lerp(PORTRAIT_LIFT_PX, 0, portraitIn)}px)`;

    fade(claim, "claim", BEATS.claim);
    BEATS.facts.forEach((range, index) => {
      const item = factsRef.current[index];
      if (item) fade(item, `fact${index}`, range);
    });

    dropStateRef.current.armed = progress >= DROP_AT;
    // The hold is over and the assembled section is on its way off the top.
    // The back half of the cast is cued off this rather than off a delay,
    // because how long the reader spends in the hold is up to the reader.
    dropStateRef.current.leaving = progress >= 1;

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
      // The balloons may only collide with the line once it has stopped moving
      // of its own accord. A collider read off a box that is mid-entrance
      // shifts every frame, and the balloons would judder against a wall that
      // is not where it appears to be.
      dropStateRef.current.wallLive = arriveT >= 1;

      closerSwash.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;

      // The label leaves with the section rather than being carried out of it.
      // It holds all the way through the close and only lets go over the last
      // settle, so the header row stays whole until there is no section left to
      // name.
      const exit = clamp01((held - drawEnd) / (screen * CLOSER_SETTLE_VH));
      label.style.opacity = String(labelIn * (1 - smoothstep(exit)));
    } else {
      label.style.opacity = String(labelIn);
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
    <section id="about" ref={sectionRef} data-nav-dark="true" className="relative bg-black">
      {/* The section's label, mirrored on the logo: the logo is fixed at
          left-6 / top-[22px], so this is the same inset from the other edge and
          the same line. The two read as one header row — the mark on one side,
          where you are on the other.

          Pinned to the SECTION, in a sticky box of its own, not to the first
          stage's panel. Inside that panel it was released the moment the stage
          ended and scrolled away up the page while the fixed logo stayed put —
          the header row losing one half of itself with the close still to come.
          Zero height so it costs the layout nothing. */}
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        <div
          ref={labelRef}
          className="absolute top-[22px] right-6 will-change-transform"
          style={{ opacity: 0 }}
        >
          <span className="font-display text-[20px] leading-none font-bold text-white md:text-[24px]">
            מי אני
          </span>
        </div>
      </div>

      <div ref={stageRef} style={{ height: `${STAGE_VH * 100}svh` }}>
        {/* z-10 is load-bearing. `position: sticky` creates a stacking context
            of its own, so the copy's z-10 INSIDE this panel is sealed in here
            and never competes with the balloon layers outside it — both of them
            would paint over the whole panel. The level has to be declared on
            the panel itself, between the two layers: 5 < 10 < 25. */}
        <div className="sticky top-0 z-10 h-[100svh] overflow-clip">
          {/* THE GREETING, floating. It lands exactly on the slot the column
              reserves below, so the layout still decides where it ends up. */}
          <div
            ref={greetRef}
            className="pointer-events-none absolute top-1/2 left-1/2 z-20 text-center font-display leading-[1.06] font-bold whitespace-nowrap text-white will-change-transform"
            style={{ opacity: 0, fontSize: `${GREET_SIZE_ALONE_VW}vw` }}
          >
            {/* Each line is a block that stacks, holding an inline-block only
                as wide as its own words — the outer one is always the full
                width of the box, so anything measured on it comes out zero.

                The inner box carries both motions: the rise, on its own beat,
                and the sideways travel from centred to right-aligned. The two
                never overlap. The rises finish well before the settle starts,
                so at no point is one line climbing while the other slides, and
                the pair still reads as one greeting rather than two arrivals.

                Sizes in em, so the pair keeps its proportions through every
                size it passes through on the way down to the column. */}
            <span className="block text-[0.4em] text-white/70">
              <span
                ref={(el) => {
                  greetLinesRef.current[0] = el;
                }}
                className="inline-block will-change-transform"
              >
                נעים מאוד,
              </span>
            </span>
            <span className="block text-[1.34em]">
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

          {/* relative z-10 so the rear balloon layer, which sits at z-[5], can
              actually pass BEHIND this. Without a stacking level of its own,
              in-flow text is painted below every positioned element and the
              balloons would all be in front. */}
          <div ref={contentRef} className="relative z-10 h-full will-change-transform">
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
                    className="invisible inline-block text-center font-display leading-[1.06] font-bold whitespace-nowrap"
                  >
                    <span className="block text-[0.4em]">נעים מאוד,</span>
                    <span className="block text-[1.34em]">אני עומר.</span>
                  </div>

                  <div ref={claimRef} className="will-change-transform" style={{ opacity: 0 }}>
                    {/* One weight, one colour, all the way through. Lifting the
                        second half of each sentence in bold white against a
                        dimmed first half split both sentences in two and made
                        the page look like it was shouting the punchline.

                        Two claims here cannot be copied off another studio's
                        page: the years, which give the age of the practice
                        without giving an age, and the past tense — this site,
                        the one being read, is the exhibit. */}
                    {/* No text-balance here. Balancing evens the line lengths,
                        which on a two-line paragraph leaves a word hanging on
                        its own at the end of the first line; letting the lines
                        fill keeps the block's edge straight. */}
                    <p className="mt-8 max-w-[40ch] font-display text-[19px] leading-[1.55] font-light text-accent-light md:text-[22px]">
                      אני מעצב מגיל 15, מפתח מגיל 17, ואני עיצבתי ובניתי את מה שאתם רואים כאן.
                    </p>
                    {/* Half a line, not a full one. The two sentences are one
                        thought and were reading as two paragraphs. */}
                    <p className="mt-[0.78em] max-w-[40ch] font-display text-[19px] leading-[1.55] font-light text-accent-light md:text-[22px]">
                      הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה שאתר טוב צריך לעבוד טוב בדיוק
                      כמו שהוא נראה.
                    </p>
                  </div>
                </div>

                {/* The photograph is shown whole — its own aspect ratio, no
                    crop, no rounding. Bounded by height only, so the width
                    follows from the file rather than the file being cut to fit
                    a width. */}
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
                      className="mx-auto block h-auto max-h-[42svh] w-auto max-w-full"
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

      {/* The balloons. Mounted here, as a child of the section rather than of
          a stage, because their layers are fixed and the stage panels clip. */}
      {!prefersReducedMotion && (
        <BalloonDrop sectionRef={sectionRef} lineRef={closerLineRef} stateRef={dropStateRef} />
      )}

      {/* THE CLOSE. The page stops here. */}
      <div ref={closerStageRef} style={{ height: `${CLOSER_STAGE_VH * 100}svh` }}>
        {/* Same level as the first stage's panel, for the same reason. */}
        <div className="sticky top-0 z-10 flex h-[100svh] items-center">
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
