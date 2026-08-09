"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// The opening runs as four beats, each worth this much scrolling, in screens.
// They are paced differently on purpose: the rise is slow, because it is the
// beat that has to be felt; the float is a pause and nothing else; and the
// draw is quick, since a brush stroke that took its time would look like a
// progress bar.
const RISE_VH = 0.95;
const FLOAT_VH = 0.4;
const TRAVEL_VH = 0.65;
const DRAW_VH = 0.25;
const SEQUENCE_VH = RISE_VH + FLOAT_VH + TRAVEL_VH + DRAW_VH;

// How the question enters. It does NOT fade in — it starts already at full
// opacity with its middle exactly on the bottom edge of the screen, so the
// first thing seen is the top half of it cut by that edge, and the reveal is
// the travel rather than an opacity ramp. Huge and heavily out of focus at that
// point, resolving as it comes up: the pair reads as something close to the
// lens pulling back into focus, where a blur alone reads as a filter.
const RISE_FROM_VH = 0.5;
const RISE_BLUR_PX = 48;

// It arrives large, then settles a little larger still while it floats, which
// is what makes the pause read as the question landing rather than as the
// animation having stopped. Then it shrinks to an ordinary heading.
const SCALE_ON_RISE_START = 3.1;
const SCALE_ON_ARRIVAL = 1.62;
const SCALE_WHILE_FLOATING = 1.85;

// Where the shrunk heading ends up: on the navbar logo's own line, at the logo's
// size, against the right margin — so the two read as one header row, the mark
// on one side and the section on the other. The logo sits 22px down and is 36px
// tall, giving a centre line at 40.
const LOGO_LINE_CENTRE_Y_PX = 40;

// How much of the section's last stretch the heading spends fading out.
const HEADING_EXIT_VH = 0.5;

const CONTENT_MAX_W_PX = 1120;
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
 * "Who I am", on black.
 *
 * It used to be a block of copy laid over the open sheet of paper in the
 * services sequence, competing with the picture it sat on. The paper now
 * carries the process diagram, which is a thing to look at rather than read
 * around — so this moved out to a section of its own and took over the black
 * ground the process steps used to occupy.
 *
 * The section opens on the question and then becomes a heading:
 *
 *   1. "רגע, מי אני בעצם?" rises from under the bottom edge, oversized and out
 *      of focus, sharpening as it comes up
 *   2. it floats on an empty screen, growing very slightly and now sharp
 *   3. "רגע," and "בעצם" are erased — the question mark closing up against
 *      "מי אני" — while the whole thing shrinks and moves to the top right
 *   4. the swash is drawn under it, left to right, like a stroke
 *
 * Then the pin lets go and the section scrolls like any other.
 *
 * That last part is deliberate, and was arrived at the hard way. Keeping the
 * heading pinned while the copy travelled underneath meant there was no scroll
 * position at which the two did not overlap — a pinned title has nowhere to
 * rest above moving text — and every fix for that (masks, bands, offsets) was
 * one more thing to keep in sync, and one more thing to get wrong. The heading
 * leaves with the section now. What the pinning was buying is already bought
 * by the opening, which is over two screens of scrolling on its own.
 *
 * Same analytical pin the rest of the site uses: sticky positioning plus a
 * number worked out from scrollY. No ScrollTrigger and no scrollYProgress —
 * both were tried and removed, because their easing compounds with the smooth
 * scroll and a gentle scroll then barely registers.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const firstLineRef = useRef<HTMLSpanElement>(null);
  const qualifierRef = useRef<HTMLSpanElement>(null);
  const swashRef = useRef<HTMLDivElement>(null);

  // Both of these are collapsed to nothing by the morph, so their natural sizes
  // have to be read while they still have one — once the inline styles are on,
  // the element only reports what was last written to it.
  const firstLineHeightRef = useRef(0);
  const qualifierWidthRef = useRef(0);
  // Where the heading has to land, worked out once per layout rather than on
  // every frame. Reading boxes inside the scroll handler is a forced reflow per
  // scroll event, on top of the decode the paper scrub is already paying for.
  const endOffsetRef = useRef({ x: 0, y: 0 });

  const measure = () => {
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    const heading = headingRef.current;
    if (!firstLine || !qualifier || !heading) return;

    const prevFirst = firstLine.style.height;
    const prevQualifier = qualifier.style.width;
    firstLine.style.height = "auto";
    qualifier.style.width = "auto";
    // offsetWidth/offsetHeight, NOT getBoundingClientRect: the rect is the box
    // AFTER the transform, so measuring while the heading is scaled up returns
    // a width several times the real one — which then got written back as the
    // span's width and scaled again, leaving the word floating in a gap much
    // wider than itself. offsetWidth is layout, which transforms do not touch.
    firstLineHeightRef.current = firstLine.offsetHeight;
    qualifierWidthRef.current = qualifier.offsetWidth;
    firstLine.style.height = prevFirst;
    qualifier.style.width = prevQualifier;

    // The heading is centred on the screen at rest and finishes against the
    // right margin on the logo's line.
    //
    // Measured in the state it FINISHES in, not the one it starts in. It opens
    // as two long lines and ends as one short one, so the block's width and the
    // words' position inside it are different numbers at each end — using the
    // opening ones put the finished heading 56px short of the margin and 32px
    // above the line. So the end state is applied here, measured, and undone.
    const restoreFirst = firstLine.style.height;
    const restoreQualifier = qualifier.style.width;
    firstLine.style.height = "0px";
    qualifier.style.width = "0px";

    const words = heading.querySelector("h2");
    const blockW = heading.offsetWidth;
    const blockH = heading.offsetHeight;
    // Aimed at the h2, not at the block: the swash hangs below it, so centring
    // the pair would sit the words above the line by half a swash.
    const wordsOffsetFromBlockCentre = words
      ? words.offsetTop + words.offsetHeight / 2 - blockH / 2
      : 0;

    firstLine.style.height = restoreFirst;
    qualifier.style.width = restoreQualifier;

    // Against the panel the heading is centred in, NOT against the window. The
    // panel is 100svh and one scrollbar narrower than the viewport, and using
    // innerHeight/innerWidth instead put the finished heading 32px above the
    // logo line and 8px shy of the margin — exactly those two differences.
    const panel = heading.offsetParent as HTMLElement | null;
    const panelW = panel ? panel.clientWidth : window.innerWidth;
    const panelH = panel ? panel.clientHeight : window.innerHeight;
    const columnW = Math.min(CONTENT_MAX_W_PX, panelW - CONTENT_PAD_PX * 2);
    const columnRight = (panelW + columnW) / 2;

    endOffsetRef.current = {
      x: columnRight - (panelW / 2 + blockW / 2),
      y: LOGO_LINE_CENTRE_Y_PX - wordsOffsetFromBlockCentre - panelH / 2,
    };
  };

  const update = () => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const heading = headingRef.current;
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    const swash = swashRef.current;
    if (!section || !stage || !heading || !firstLine || !qualifier || !swash) return;

    const screen = window.innerHeight;
    const scrolled = -stage.getBoundingClientRect().top;

    const riseEnd = screen * RISE_VH;
    const floatEnd = riseEnd + screen * FLOAT_VH;
    const travelEnd = floatEnd + screen * TRAVEL_VH;
    const drawEnd = travelEnd + screen * DRAW_VH;

    const rise = smoothstep(scrolled / riseEnd);
    const float = smoothstep((scrolled - riseEnd) / (floatEnd - riseEnd));
    const travel = smoothstep((scrolled - floatEnd) / (travelEnd - floatEnd));
    const draw = clamp01((scrolled - travelEnd) / (drawEnd - travelEnd));

    // Rise: up from the bottom edge, shrinking and sharpening on the way. The
    // blur clears ahead of the travel so it arrives already legible rather than
    // resolving after it has stopped.
    const riseY = lerp(screen * RISE_FROM_VH, 0, rise);
    const blur = lerp(RISE_BLUR_PX, 0, clamp01(rise * 1.35));
    const risenScale = lerp(SCALE_ON_RISE_START, SCALE_ON_ARRIVAL, rise);

    // Grows a little once it has arrived, then shrinks on its way to the corner.
    const floatedScale = lerp(risenScale, SCALE_WHILE_FLOATING, float);
    const scale = lerp(floatedScale, 1, travel);
    const end = endOffsetRef.current;

    // Leaves as the section runs out, instead of being cut off by the sticky
    // box letting go. Measured from the section's own bottom edge so it is the
    // section ending that takes it, not a scroll distance that would have to be
    // kept in step with the copy's length.
    const bottomGap = section.getBoundingClientRect().bottom - screen;
    const exit = 1 - clamp01(bottomGap / (screen * HEADING_EXIT_VH));

    heading.style.opacity = String(1 - exit);
    heading.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
    heading.style.transform =
      `translate(-50%, -50%) translate(${end.x * travel}px, ${riseY + end.y * travel}px) scale(${scale})`;

    // Erased rather than faded: the line's own height and the word's own width
    // go to nothing, so the second line rises to meet the first and the
    // question mark closes up against "מי אני" instead of leaving a hole where
    // the word used to be.
    firstLine.style.height = `${lerp(firstLineHeightRef.current, 0, travel)}px`;
    firstLine.style.opacity = String(clamp01(1 - travel * 2.2));
    qualifier.style.width = `${lerp(qualifierWidthRef.current, 0, travel)}px`;
    qualifier.style.opacity = String(clamp01(1 - travel * 2.2));

    // Drawn, not faded in: revealed from its left end to its right, which is
    // the direction a stroke is made in whichever way the text runs.
    swash.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;
    swash.style.opacity = draw > 0 ? "1" : "0";
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    measure();
    update();

    // Measured again once the display font has actually loaded. The first pass
    // runs against the fallback face, and "בעצם" is a different width in it —
    // which is the width the morph would then close, leaving the question mark
    // short of the words or pushed past them.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      update();
    });

    const handleResize = () => {
      measure();
      update();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="about" data-nav-dark="true" className="relative bg-black py-24 md:py-32">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="text-right">
            <h2 className="font-display text-[40px] leading-none font-bold text-white md:text-[52px]">
              מי אני?
            </h2>
            <HeadingSwash className="mt-3 w-[150px] text-white md:w-[190px]" />
          </div>
          <div className="mt-16">
            <AboutBody />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="about" data-nav-dark="true" className="relative bg-black">
      {/* Sticky against the SECTION, not against the opening's scroll room, so
          the heading stays on the logo's line for the whole section once it has
          shrunk to it — and then leaves, on its own fade, as the section ends.
          pointer-events-none so the copy passing under it stays selectable. */}
      <div className="pointer-events-none sticky top-0 z-20 h-[100svh]">
        <div ref={headingRef} className="absolute top-1/2 left-1/2 will-change-transform">
            {/* Deliberately smaller than the logo it sits level with. Matching
                its height made the two compete for the same line; set under it,
                the mark stays the thing in the corner and this reads as the
                label of the section under it. */}
            <h2 className="text-center font-display text-[26px] leading-none font-bold whitespace-nowrap text-white">
              {/* Height animated to 0, so it is a block that can collapse
                  rather than a <br> that cannot. */}
              <span ref={firstLineRef} className="block overflow-hidden">
                רגע,
              </span>
              {/* No line breaks between these three: JSX turns a newline into a
                  space, and with the middle one an inline-block that is two
                  extra word gaps — which the opening scale then multiplies. */}
              <span>
                {"מי אני"}
                {/* The space that belongs before the word lives INSIDE this
                    span, because the span is what collapses — left outside it,
                    it survives the erase and the finished heading reads
                    "מי אני ?" with a gap before the question mark. It looked
                    like a chasm until the width measurement was fixed; that was
                    the transform being counted twice, not the space. */}
                <span ref={qualifierRef} className="inline-block overflow-hidden align-bottom">
                  {" בעצם"}
                </span>
                {"?"}
              </span>
            </h2>
          <div ref={swashRef} className="flex justify-center" style={{ opacity: 0 }}>
            <HeadingSwash className="mt-2 w-[62px] text-white" />
          </div>
        </div>
      </div>

      {/* The opening's scroll room. Pulled up over the sticky box above so the
          two share the same screen rather than stacking. */}
      <div ref={stageRef} aria-hidden="true" className="-mt-[100svh]" style={{ height: `${SEQUENCE_VH * 100}svh` }} />

      <div className="mx-auto max-w-[1120px] px-6 pt-[212px] pb-32 md:pb-40">
        <AboutBody />
      </div>
    </section>
  );
}

/**
 * The answer.
 *
 * Same sentences as before, ordered and weighted rather than poured out at one
 * size: the claim, then who is making it, then why, then the three things that
 * back it, then the invitation. Everything used to be set at roughly the same
 * weight in one right-aligned column, so there was nothing for the eye to land
 * on and no reason to start at the top.
 *
 * The portrait sits at its own proportions — given a width and left to work out
 * its height — instead of cropped to a shape the layout preferred. Square
 * corners and no shadow, so it reads as placed rather than pasted on.
 */
/**
 * One block arriving.
 *
 * Framer Motion rather than the section's own scroll maths, deliberately: this
 * is an element appearing when it comes into view, which is exactly the UI-level
 * job the library is kept around for — the same treatment SectionHeading and
 * StatementSection already use. The scroll maths is for things that have to run
 * backwards frame by frame, which this does not.
 */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function AboutBody() {
  return (
    <div className="text-right">
      {/* The claim and the face share a bottom edge, so the picture sits beside
          the sentence it belongs to rather than in a column of its own running
          down the side of everything.

          The gaps down this section are wide on purpose. The copy arrives a
          block at a time as it comes into view, and the space between blocks is
          what gives each arrival room to be seen instead of all of them landing
          in one flick. */}
      <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        <Reveal>
          {/* The largest thing in the section after the heading. It used to be
              the tail of a paragraph — the sentence the whole block is built to
              deliver, reading as an afterthought. The concessive half is greyed
              so the turn lands on "אלא עובדות". */}
          <p className="font-display text-[28px] leading-[1.28] font-bold text-balance text-white md:text-[36px]">
            אני בונה חוויות דיגיטליות
            <br />
            <span className="text-white/35">שלא רק נראות טוב,</span> אלא עובדות.
          </p>

          {/* Specific, and the one credential here that cannot be copied off
              another studio's page. */}
          <p className="mt-6 font-display text-[16px] leading-[1.6] font-medium text-white/70 md:text-[17px]">
            אני עומר — מעצב מגיל 15, מפתח מגיל 17.
          </p>

          <p className="mt-3 max-w-[46ch] font-body text-[15px] leading-[1.75] text-balance text-white/45">
            YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
            <span className="text-white/80">ברמה הגבוהה ביותר</span>.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <figure className="m-0 w-full max-w-[300px] justify-self-start">
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

      {/* Three across rather than three down. They are parallel promises, and a
          vertical list reads them as a sequence — one after another — where
          columns read them as three things of equal weight. It also uses the
          width the two-column block above leaves empty.

          Still rules and type, not cards: every one is a plain fact about how
          the work is done, which a studio that subcontracts or assembles
          templates could not honestly write. Boxing them would make them look
          like feature badges, which is exactly what they are not. */}
      <ol className="mt-28 grid grid-cols-1 gap-x-12 border-t border-white/12 sm:grid-cols-3">
        {aboutFacts.map((fact, index) => (
          <li key={fact.title} className="border-b border-white/12 pt-6 pb-7 sm:border-b-0">
            {/* Staggered, so the three arrive in their numbered order rather
                than snapping in together as one row. */}
            <Reveal delay={index * 0.1}>
              <span className="font-display text-[12px] leading-none font-bold tracking-[0.12em] text-white/25">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-[19px] leading-[1.15] font-bold text-balance text-white">
                {fact.title}
              </h3>
              <p className="mt-2 font-body text-[14px] leading-[1.6] text-white/45">
                {fact.description}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>

      {/* Set apart rather than tacked on as one more paragraph — it is the only
          line in the section that asks for anything. */}
      <Reveal>
        <p className="mt-24 font-display text-[20px] leading-[1.5] font-medium text-balance text-white/50 md:text-[23px]">
          אני כאן כדי להפוך את הרעיון שלך{" "}
          <strong className="font-bold text-white">למוצר דיגיטלי שמייצר אימפקט.</strong>
        </p>
      </Reveal>
    </div>
  );
}
