"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// The name's entrance, in screens. It peeks in blurred, rises to the middle and
// sharpens, then shrinks away to the corner — three beats, paced so the arrival
// is felt and the shrink is quick.
const RISE_VH = 0.9;
const HOLD_VH = 0.35;
const SHRINK_VH = 0.55;
const NAME_STAGE_VH = RISE_VH + HOLD_VH + SHRINK_VH;

// It starts with its middle on the bottom edge — so the first thing on screen
// is the top half of it, cut — and heavily out of focus. Scale and blur
// together read as something close to the lens coming into focus; blur on its
// own reads as a filter.
const RISE_FROM_VH = 0.5;
const RISE_BLUR_PX = 44;
const NAME_SIZE_CENTRED_VW = 9.5;

// Where it ends: the navbar logo's own line, against the right margin, small.
// The logo sits 22px down and is 36px tall, so its centre line is 40.
const LOGO_LINE_CENTRE_Y_PX = 40;
const NAME_SIZE_PARKED_PX = 26;

// How much of the section's last stretch the name spends leaving. It goes with
// the black rather than being cut off by the sticky box letting go.
const NAME_EXIT_VH = 0.45;

// The closing line stops the page. It is the one line in the section that asks
// for anything and the handover to the work itself, so it gets held rather than
// scrolled past — a full stop, not a section parked to pad its length. Three
// beats: it arrives, it is held, the stroke is drawn under it.
const CLOSER_IN_VH = 0.45;
const CLOSER_HOLD_VH = 0.3;
const CLOSER_DRAW_VH = 0.5;
const CLOSER_STAGE_VH = 1 + CLOSER_IN_VH + CLOSER_HOLD_VH + CLOSER_DRAW_VH;

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
 * "אני עומר." — the section that earns the enquiry.
 *
 * One person, doing both halves of the job, with a way of working. It is the
 * only place on the page with a face on it, and the only place that speaks in
 * the first person, so it is staged like the rest of the site rather than laid
 * out as a page of copy. An earlier version was a column of paragraphs in a
 * 632px track; after the hero and the paper sequence, arriving at that says
 * there is nothing here.
 *
 * The order of it:
 *
 *   1. the name peeks in from under the bottom edge, badly out of focus, rises
 *      to the middle of an empty black screen and sharpens
 *   2. it shrinks away to the navbar's own line, on the right, and stays there
 *      for the whole section — leaving with the black at the end of it
 *   3. the face arrives with the copy beside it
 *   4. the three reasons land one at a time and stay, side by side
 *   5. the sketch arrives with its line beside it
 *   6. the closing sentence, and a stroke drawn under it to shut the story
 *
 * Only the name is scroll-driven. Everything else arrives once and stays, so
 * scrolling back up is reading rather than replaying.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);
  const endOffsetRef = useRef({ x: 0, y: 0 });

  const measure = () => {
    const name = nameRef.current;
    if (!name) return;

    // Measured at the size it PARKS at, and against the box it is centred in
    // rather than against the window: the panel is 100svh and one scrollbar
    // narrower, and using innerWidth/innerHeight instead lands it short of the
    // margin and above the line.
    const previous = name.style.fontSize;
    name.style.fontSize = `${NAME_SIZE_PARKED_PX}px`;
    const blockW = name.offsetWidth;
    const blockH = name.offsetHeight;
    name.style.fontSize = previous;

    const panel = name.offsetParent as HTMLElement | null;
    const panelW = panel ? panel.clientWidth : window.innerWidth;
    const panelH = panel ? panel.clientHeight : window.innerHeight;
    const columnW = Math.min(CONTENT_MAX_W_PX, panelW - CONTENT_PAD_PX * 2);
    const columnRight = (panelW + columnW) / 2;

    endOffsetRef.current = {
      x: columnRight - (panelW / 2 + blockW / 2),
      y: LOGO_LINE_CENTRE_Y_PX + blockH / 2 - panelH / 2 - blockH / 2,
    };
  };

  const update = () => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const name = nameRef.current;
    if (!section || !stage || !name) return;

    const screen = window.innerHeight;
    const scrolled = -stage.getBoundingClientRect().top;

    const riseEnd = screen * RISE_VH;
    const holdEnd = riseEnd + screen * HOLD_VH;
    const shrinkEnd = holdEnd + screen * SHRINK_VH;

    const rise = smoothstep(scrolled / riseEnd);
    const shrink = smoothstep((scrolled - holdEnd) / (shrinkEnd - holdEnd));

    // Up from the bottom edge, sharpening ahead of the travel so it arrives
    // already legible rather than resolving after it has stopped.
    const riseY = lerp(screen * RISE_FROM_VH, 0, rise);
    const blur = lerp(RISE_BLUR_PX, 0, clamp01(rise * 1.4));

    const size = lerp((NAME_SIZE_CENTRED_VW * window.innerWidth) / 100, NAME_SIZE_PARKED_PX, shrink);
    const end = endOffsetRef.current;

    // Leaves with the section rather than being cut off when the sticky box
    // lets go. Driven off the section's own bottom edge, so it is the section
    // ending that takes it — not a scroll distance kept in step by hand.
    const bottomGap = section.getBoundingClientRect().bottom - screen;
    const exit = 1 - clamp01(bottomGap / (screen * NAME_EXIT_VH));

    name.style.fontSize = `${size}px`;
    name.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
    name.style.opacity = String(1 - exit);
    name.style.transform =
      `translate(-50%, -50%) translate(${end.x * shrink}px, ${riseY + end.y * shrink}px)`;

    // The close. Position-driven rather than fired once, because the page is
    // held still here — an arrival that cannot be scrolled back into is a
    // one-way door, and this one has scroll on both sides of it.
    const closerStage = closerStageRef.current;
    const closerLine = closerLineRef.current;
    const closerSwash = closerSwashRef.current;
    if (closerStage && closerLine && closerSwash) {
      const held = -closerStage.getBoundingClientRect().top;
      const inEnd = screen * CLOSER_IN_VH;
      const drawStart = inEnd + screen * CLOSER_HOLD_VH;
      const drawEnd = drawStart + screen * CLOSER_DRAW_VH;

      const arrive = smoothstep(held / inEnd);
      const draw = clamp01((held - drawStart) / (drawEnd - drawStart));

      closerLine.style.opacity = String(arrive);
      closerLine.style.transform = `translateY(${lerp(38, 0, arrive)}px)`;
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
    <section ref={sectionRef} id="about" data-nav-dark="true" className="relative bg-black">
      {/* The name. Sticky against the SECTION, so once it has shrunk to the
          navbar's line it holds there for everything that follows and leaves
          with the black at the end. pointer-events-none so the copy passing
          under it stays selectable. */}
      <div className="pointer-events-none sticky top-0 z-30 h-[100svh]">
        <div
          ref={nameRef}
          className="absolute top-1/2 left-1/2 font-display leading-none font-bold whitespace-nowrap text-white will-change-transform"
          style={{ fontSize: `${NAME_SIZE_CENTRED_VW}vw` }}
        >
          אני עומר.
        </div>
      </div>

      {/* The entrance's scroll room, pulled up over the sticky box so the two
          share a screen rather than stacking. */}
      <div
        ref={stageRef}
        aria-hidden="true"
        className="-mt-[100svh]"
        style={{ height: `${NAME_STAGE_VH * 100}svh` }}
      />

      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        {/* THE FACE, with the copy beside it. They arrive together as one
            composition — the picture is not a thing placed next to text, it is
            half of the same statement. */}
        <div className="grid grid-cols-1 items-center gap-10 pt-6 pb-28 lg:grid-cols-[1fr_34vw] lg:gap-16 lg:pb-40">
          <Reveal className="text-right">
            <p className="font-display text-[32px] leading-[1.12] font-bold text-balance text-white md:text-[46px]">
              אני מעצב ובונה את מה שאתם רואים כאן.
            </p>
            {/* The one credential on this page that cannot be copied off
                another studio's site. It says the age of the practice without
                stating an age. */}
            <p className="mt-7 font-display text-[19px] leading-[1.45] font-medium text-white/75 md:text-[22px]">
              מעצב מגיל 15, מפתח מגיל 17.
            </p>
            <p className="mt-4 max-w-[52ch] font-body text-[16px] leading-[1.75] text-balance text-white/45 md:text-[17px]">
              הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
              <span className="text-white/80">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="order-first lg:order-none">
            <figure className="m-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/portrait.webp"
                alt="עומר, מייסד YEYE Digital"
                width={430}
                height={560}
                className="block h-auto w-full"
                draggable={false}
              />
            </figure>
          </Reveal>
        </div>

        {/* THE THREE REASONS. They land one at a time and stay put, ending up
            side by side in a row — three things of equal weight, which is what
            they are. A screen each would have made them a sequence, and a
            sequence is what the paper diagram already is. */}
        <ol className="grid grid-cols-1 gap-8 pb-28 sm:grid-cols-3 lg:gap-10 lg:pb-40">
          {aboutFacts.map((fact, index) => (
            <li key={fact.title}>
              <Reveal delay={index * 0.18}>
                <div className="flex h-full flex-col border-t border-white/15 pt-6 text-right">
                  <span className="font-display text-[13px] leading-none font-bold tracking-[0.18em] text-white/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 font-display text-[23px] leading-[1.15] font-bold text-balance text-white md:text-[27px]">
                    {fact.title}
                  </h3>
                  <p className="mt-3 font-body text-[15px] leading-[1.7] text-balance text-white/45 md:text-[16px]">
                    {fact.description}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        {/* THE SKETCH, with its line beside it. Show rather than tell, and the
            thing shown is from this site — which is what closes the distance
            between the claim and the proof: nobody has to trust a screenshot of
            somebody else's project. */}
        <div className="grid grid-cols-1 items-center gap-10 pb-28 lg:grid-cols-[1fr_46%] lg:gap-16 lg:pb-40">
          <Reveal className="text-right">
            <p className="font-display text-[26px] leading-[1.2] font-bold text-balance text-white md:text-[34px]">
              כל דבר כאן התחיל על נייר.
            </p>
            <p className="mt-4 max-w-[46ch] font-body text-[16px] leading-[1.75] text-balance text-white/45 md:text-[17px]">
              לא עיצוב שנבחר מתוך תבנית ולא קוד שהודבק — שרטוט, החלטה, ואז בנייה.
              <span className="text-white/80"> מה שגללתם דרכו עד עכשיו עבר בדיוק את הדרך הזאת</span>.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="order-first lg:order-none">
            {/* A slot at a known ratio until the drawing exists — composed
                rather than left as a broken-image box, so it reads as
                deliberate even while it is empty. The dimensions are written
                with the numerals apart, because "1200x900" between Hebrew runs
                gets reordered by the bidi algorithm and displays reversed. */}
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 border border-white/15 px-6 text-center">
              <span className="font-display text-[11px] font-bold tracking-[0.24em] text-white/30 uppercase">
                sketch
              </span>
              <span className="font-body text-[12px] leading-[1.7] text-white/25">
                <span dir="ltr">1200 × 900</span>
              </span>
            </div>
          </Reveal>
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
              className="mt-8"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              <HeadingSwash className="w-[260px] text-white md:w-[360px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One block arriving.
 *
 * Framer Motion rather than the site's own scroll maths: this is an element
 * appearing when it is scrolled to, which is the UI-level job the library is
 * kept for. `once` is what makes everything below the name one-way — it fires
 * and stays, so coming back up the page is reading, not replaying.
 */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

