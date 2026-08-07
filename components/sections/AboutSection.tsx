"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// The opening runs as four beats, each worth this much scrolling, in screens.
// They are separate constants rather than one duration split up because they
// are paced differently on purpose: the rise is slow, because it is the beat
// that has to be felt; the float is a pause and nothing else; and the draw is
// quick, since a brush stroke that took its time would look like a progress bar.
const RISE_VH = 0.95;
const FLOAT_VH = 0.4;
const TRAVEL_VH = 0.65;
const DRAW_VH = 0.25;
const SEQUENCE_VH = RISE_VH + FLOAT_VH + TRAVEL_VH + DRAW_VH;

// How far below the fold the question starts, and how out of focus. It comes up
// from under the edge of the screen rather than fading in on the spot, so the
// blur reads as depth — something approaching — instead of as a filter.
const RISE_FROM_VH = 0.62;
const RISE_BLUR_PX = 26;

// It arrives large, then settles a little larger still while it floats, which
// is what makes the pause read as the question landing rather than as the
// animation having stopped. Then it shrinks to an ordinary heading.
const SCALE_ON_ARRIVAL = 1.62;
const SCALE_WHILE_FLOATING = 1.85;

// Where the shrunk heading comes to rest, measured from the top of the screen.
// Well clear of the navbar rather than tucked under it: it is the section's
// title, and a title crowded against the edge reads as a toolbar.
const HEADING_PINNED_TOP_PX = 132;

// The band the parked heading sits in, which is opaque black across the full
// width. Without it the heading floats over copy that is still travelling and
// the two collide — there is no resting place for a pinned title above moving
// text unless the text has something to disappear behind. Deep enough to hold
// the heading and its swash with air under them.
const BAND_HEIGHT_PX = 252;

// How fast the answer travels compared to the page.
//
// The section was passing in a single flick, and the fix for that is NOT to
// pin it and let scrolling accumulate against a still picture — a page with
// several sections that each stop dead is a page that feels stuck. So it is
// slowed instead: the copy moves at this fraction of the scroll, so the
// section takes about half again as long to cross while everything on it is
// moving the entire time. Nothing ever holds still, it just holds back.
const CONTENT_SCROLL_RATE = 0.62;

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
 *   2. it floats on an empty screen, growing very slightly and now perfectly
 *      sharp
 *   3. "רגע," and "בעצם" are erased — the question mark closing up against
 *      "מי אני" — while the whole thing shrinks and travels to the top, where
 *      it stays
 *   4. the swash is drawn under it, left to right, like a stroke
 *
 * Nothing else is on screen until that has finished. Only then does the answer
 * start to arrive, and it arrives slowly — see CONTENT_SCROLL_RATE.
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

  const wrapperRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const firstLineRef = useRef<HTMLSpanElement>(null);
  const qualifierRef = useRef<HTMLSpanElement>(null);
  const swashRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Both of these are collapsed to nothing by the morph, so their natural sizes
  // have to be read while they still have one — once the inline styles are on,
  // the element only reports what was last written to it.
  const firstLineHeightRef = useRef(0);
  const qualifierWidthRef = useRef(0);

  const measure = () => {
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!firstLine || !qualifier || !wrapper || !content) return;

    const prevFirst = firstLine.style.height;
    const prevQualifier = qualifier.style.width;
    firstLine.style.height = "auto";
    qualifier.style.width = "auto";
    firstLineHeightRef.current = firstLine.getBoundingClientRect().height;
    qualifierWidthRef.current = qualifier.getBoundingClientRect().width;
    firstLine.style.height = prevFirst;
    qualifier.style.width = prevQualifier;

    // The wrapper has to be tall enough to contain the opening plus however
    // much scrolling the answer's slowed-down travel actually consumes — which
    // depends on how tall the answer is, so it is measured rather than guessed.
    // Guessing it means either a section that ends before its own content has
    // left, or a stretch of empty black after it has.
    const screen = window.innerHeight;
    const contentHeight = content.getBoundingClientRect().height;
    const travel = (screen + contentHeight) / CONTENT_SCROLL_RATE;
    wrapper.style.height = `${SEQUENCE_VH * screen + travel}px`;
  };

  const update = () => {
    const wrapper = wrapperRef.current;
    const heading = headingRef.current;
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    const swash = swashRef.current;
    const band = bandRef.current;
    const content = contentRef.current;
    if (!wrapper || !heading || !firstLine || !qualifier || !swash || !band || !content) return;

    const screen = window.innerHeight;
    const scrolled = -wrapper.getBoundingClientRect().top;

    const riseEnd = screen * RISE_VH;
    const floatEnd = riseEnd + screen * FLOAT_VH;
    const travelEnd = floatEnd + screen * TRAVEL_VH;
    const drawEnd = travelEnd + screen * DRAW_VH;

    const rise = smoothstep(scrolled / riseEnd);
    const float = smoothstep((scrolled - riseEnd) / (floatEnd - riseEnd));
    const travel = smoothstep((scrolled - floatEnd) / (travelEnd - floatEnd));
    const draw = clamp01((scrolled - travelEnd) / (drawEnd - travelEnd));

    // Rise: up from under the bottom edge, sharpening on the way. The blur
    // clears ahead of the travel so it arrives already legible rather than
    // resolving after it has stopped.
    const y = lerp(screen * RISE_FROM_VH, 0, rise);
    const blur = lerp(RISE_BLUR_PX, 0, clamp01(rise * 1.35));

    // Grows a little on arrival, then shrinks to the parked size. Scaled about
    // the middle of the screen so it never drifts toward a corner; the travel
    // to the top is applied on top of that.
    const floatedScale = lerp(SCALE_ON_ARRIVAL, SCALE_WHILE_FLOATING, float);
    const scale = lerp(floatedScale, 1, travel);
    const parkY = -(screen / 2 - HEADING_PINNED_TOP_PX - heading.offsetHeight / 2);

    heading.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
    heading.style.opacity = String(clamp01(rise * 1.6));
    heading.style.transform = `translate(-50%, -50%) translateY(${y + parkY * travel}px) scale(${scale})`;

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

    // The band appears with the heading it holds, so it is not a black bar
    // sitting over an empty screen for the whole opening.
    band.style.opacity = String(travel);

    // The answer starts one screen below and comes up at CONTENT_SCROLL_RATE,
    // so it is still travelling the whole time rather than arriving and then
    // waiting. Nothing of it is on screen until the heading has parked.
    const contentScrolled = Math.max(0, scrolled - drawEnd);
    content.style.transform = `translateY(${screen - contentScrolled * CONTENT_SCROLL_RATE}px)`;
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
    const observer = new ResizeObserver(handleResize);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="about" data-nav-dark="true" className="relative bg-black py-28 md:py-36">
        <div className="mx-auto max-w-[1040px] px-6">
          <div className="flex flex-col items-center">
            <h2 className="font-display text-[40px] leading-none font-bold text-white md:text-[56px]">
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
    <section ref={wrapperRef} id="about" data-nav-dark="true" className="relative bg-black">
      <div className="sticky top-0 h-[100svh] overflow-clip">
        {/* The answer, travelling. Behind the heading in z order so the parked
            heading stays legible over whatever is passing under it. */}
        <div ref={contentRef} className="absolute inset-x-0 top-0 will-change-transform">
          <div className="mx-auto max-w-[1120px] px-6 pt-[312px] pb-24">
            <AboutBody />
          </div>
        </div>

        {/* What the copy disappears behind once the heading has parked. */}
        <div
          ref={bandRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-5 bg-black"
          style={{ height: `${BAND_HEIGHT_PX}px`, opacity: 0 }}
        />

        {/* pointer-events-none so the copy travelling underneath stays
            selectable and its links stay clickable. */}
        <div
          ref={headingRef}
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex w-full flex-col items-center px-6 will-change-transform"
        >
          <h2 className="text-center font-display text-[40px] leading-[1.08] font-bold text-white md:text-[52px]">
            {/* Height animated to 0, so it is a block that can collapse rather
                than a <br> that cannot. */}
            <span ref={firstLineRef} className="block overflow-hidden">
              רגע,
            </span>
            {/* No line breaks between these three: JSX turns a newline into a
                space, and with the middle one an inline-block that is two extra
                word gaps — which the opening scale then multiplies. */}
            <span className="whitespace-nowrap">
              {"מי אני"}
              {/* The space belongs INSIDE the part that collapses. Left outside
                  it, it survives the erase and the finished heading reads
                  "מי אני ?" with a gap before the question mark. */}
              <span ref={qualifierRef} className="inline-block overflow-hidden align-bottom">
                {" בעצם"}
              </span>
              {"?"}
            </span>
          </h2>
          <div ref={swashRef} style={{ opacity: 0 }}>
            <HeadingSwash className="mt-3 w-[150px] text-white md:w-[190px]" />
          </div>
        </div>
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
function AboutBody() {
  return (
    <div className="text-right">
      {/* The claim and the face share a bottom edge, so the picture sits beside
          the sentence it belongs to rather than in a column of its own running
          down the side of everything. */}
      <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div>
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
        </div>

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
      </div>

      {/* Three across rather than three down. They are parallel promises, and a
          vertical list reads them as a sequence — one after another — where
          columns read them as three things of equal weight. It also uses the
          width the two-column block above leaves empty.

          Still rules and type, not cards: every one is a plain fact about how
          the work is done, which a studio that subcontracts or assembles
          templates could not honestly write. Boxing them would make them look
          like feature badges, which is exactly what they are not. */}
      <ol className="mt-16 grid grid-cols-1 gap-x-12 border-t border-white/12 sm:grid-cols-3">
        {aboutFacts.map((fact, index) => (
          <li key={fact.title} className="border-b border-white/12 pt-6 pb-7 sm:border-b-0">
            <span className="font-display text-[12px] leading-none font-bold tracking-[0.12em] text-white/25">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-[19px] leading-[1.15] font-bold text-balance text-white">
              {fact.title}
            </h3>
            <p className="mt-2 font-body text-[14px] leading-[1.6] text-white/45">
              {fact.description}
            </p>
          </li>
        ))}
      </ol>

      {/* Set apart rather than tacked on as one more paragraph — it is the only
          line in the section that asks for anything. */}
      <p className="mt-14 font-display text-[20px] leading-[1.5] font-medium text-balance text-white/50 md:text-[23px]">
        אני כאן כדי להפוך את הרעיון שלך{" "}
        <strong className="font-bold text-white">למוצר דיגיטלי שמייצר אימפקט.</strong>
      </p>
    </div>
  );
}
