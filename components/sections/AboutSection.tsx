"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// The opening runs as four beats, each worth this much scrolling, in screens.
// They are separate constants rather than one duration split up because they
// are paced differently on purpose: the rise is slow enough to read as an
// arrival, the float is a pause and nothing else, and the draw is quick — a
// brush stroke that took its time would look like a loading bar.
const RISE_VH = 0.55;
const FLOAT_VH = 0.25;
const MORPH_VH = 0.55;
const DRAW_VH = 0.3;
const SEQUENCE_VH = RISE_VH + FLOAT_VH + MORPH_VH + DRAW_VH;

// How far below the fold the heading starts, and how out of focus. It comes up
// from under the edge of the screen rather than fading in on the spot, so the
// blur reads as depth — something approaching — instead of as a filter.
const RISE_FROM_VH = 0.62;
const RISE_BLUR_PX = 26;

// Full size on arrival, against the size it parks at. The question is asked at
// a size the answer is not written in.
const HEADING_OPEN_SCALE = 1.85;

// Where the shrunk heading comes to rest, measured from the top of the screen.
const HEADING_PINNED_TOP_PX = 96;

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
 *   1. "רגע, מי אני בעצם?" rises from under the bottom edge, out of focus and
 *      oversized, sharpening as it comes up
 *   2. it floats in the middle of an empty screen for a beat
 *   3. "רגע," and "בעצם" are erased — the question mark closes up against
 *      "מי אני" — while the whole thing shrinks toward the top of the screen
 *   4. the swash is drawn underneath it, left to right, like a stroke
 *
 * The long form buys the beat the page needs after the paper sequence, where
 * it changes footing and starts talking in the first person. The short one is
 * what a section heading should be once that has landed — and because it is
 * the same words losing two of them rather than a crossfade between two
 * headings, the change reads as a sentence being edited down.
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

  // Both are collapsed to nothing by the morph, so their natural sizes have to
  // be read while they still have one — once the inline styles are on, the
  // element only ever reports what was last written to it.
  const firstLineHeightRef = useRef(0);
  const qualifierWidthRef = useRef(0);

  const measure = () => {
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    if (!firstLine || !qualifier) return;

    const prevFirst = firstLine.style.height;
    const prevQualifier = qualifier.style.width;
    firstLine.style.height = "auto";
    qualifier.style.width = "auto";
    firstLineHeightRef.current = firstLine.getBoundingClientRect().height;
    qualifierWidthRef.current = qualifier.getBoundingClientRect().width;
    firstLine.style.height = prevFirst;
    qualifier.style.width = prevQualifier;
  };

  const update = () => {
    const wrapper = wrapperRef.current;
    const heading = headingRef.current;
    const firstLine = firstLineRef.current;
    const qualifier = qualifierRef.current;
    const swash = swashRef.current;
    if (!wrapper || !heading || !firstLine || !qualifier || !swash) return;

    const screen = window.innerHeight;
    const scrolled = -wrapper.getBoundingClientRect().top;

    const riseEnd = screen * RISE_VH;
    const floatEnd = riseEnd + screen * FLOAT_VH;
    const morphEnd = floatEnd + screen * MORPH_VH;
    const drawEnd = morphEnd + screen * DRAW_VH;

    const rise = smoothstep(scrolled / riseEnd);
    const morph = smoothstep((scrolled - floatEnd) / (morphEnd - floatEnd));
    const draw = clamp01((scrolled - morphEnd) / (drawEnd - morphEnd));

    // Rise: up from under the bottom edge, sharpening on the way. Blur is
    // cleared slightly ahead of the travel so it arrives already legible
    // rather than resolving after it has stopped.
    const y = lerp(screen * RISE_FROM_VH, 0, rise);
    const blur = lerp(RISE_BLUR_PX, 0, clamp01(rise * 1.35));

    // Morph: down to the parked size, and up to the parked position. The
    // centre it scales about is the centre of the screen, so it shrinks in
    // place instead of drifting toward a corner, and the travel is applied
    // separately on top.
    const parkY = -(screen / 2 - HEADING_PINNED_TOP_PX - heading.offsetHeight / 2);
    const scale = lerp(HEADING_OPEN_SCALE, 1, morph);

    heading.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
    heading.style.opacity = String(clamp01(rise * 1.6));
    heading.style.transform = `translate(-50%, -50%) translateY(${y + parkY * morph}px) scale(${scale})`;

    // Erased rather than faded: the line's own height and the word's own width
    // go to nothing, so the second line rises to meet the first and the
    // question mark closes up against "מי אני" instead of leaving a hole where
    // the word used to be.
    firstLine.style.height = `${lerp(firstLineHeightRef.current, 0, morph)}px`;
    firstLine.style.opacity = String(clamp01(1 - morph * 2.2));
    qualifier.style.width = `${lerp(qualifierWidthRef.current, 0, morph)}px`;
    qualifier.style.opacity = String(clamp01(1 - morph * 2.2));

    // Drawn, not faded in: revealed from its left end to its right, which is
    // the direction a stroke is made in regardless of the text's direction.
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
      <section id="about" data-nav-dark="true" className="relative bg-black pt-28 md:pt-36">
        <div className="mx-auto max-w-[1120px] px-6">
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
      {/* The heading's stage. pointer-events-none so the copy travelling
          underneath stays selectable and its links stay clickable. */}
      <div className="pointer-events-none sticky top-0 z-20 h-[100svh]">
        <div
          ref={headingRef}
          className="absolute top-1/2 left-1/2 flex w-full flex-col items-center px-6 will-change-transform"
        >
          <h2 className="text-center font-display text-[40px] leading-[1.05] font-bold text-white md:text-[56px]">
            {/* Height animated to 0, so it is a block that can collapse rather
                than a <br> that cannot. */}
            <span ref={firstLineRef} className="block overflow-hidden">
              רגע,
            </span>
            <span className="whitespace-nowrap">
              מי אני
              {/* inline-block so it has a width of its own to close; the
                  trailing space is inside it, or the gap outlives the word. */}
              <span ref={qualifierRef} className="inline-block overflow-hidden align-bottom">
                &nbsp;בעצם
              </span>
              ?
            </span>
          </h2>
          <div ref={swashRef} style={{ opacity: 0 }}>
            <HeadingSwash className="mt-2 w-[150px] text-white md:w-[190px]" />
          </div>
        </div>
      </div>

      {/* Pulled back up over the stage so the two share the same screen: the
          heading holds still at the top while this travels past it. The spacer
          is what keeps the copy below the fold until the question has finished
          being asked. */}
      <div className="relative z-10 -mt-[100svh]">
        <div aria-hidden="true" style={{ height: `${SEQUENCE_VH * 100}svh` }} />
        <div className="mx-auto max-w-[1120px] px-6">
          <AboutBody />
        </div>
      </div>
    </section>
  );
}

/**
 * The answer.
 *
 * Two columns sharing one bottom edge: the copy on the right where the reading
 * starts, the portrait on the left sitting on the section's own bottom. It is
 * shown at its own proportions — given a width and left to work out its height
 * — rather than cropped to a shape the layout would have preferred. Square
 * corners and no shadow, so it reads as placed rather than pasted on.
 */
function AboutBody() {
  return (
    <div className="grid grid-cols-1 items-end gap-14 lg:grid-cols-[1fr_430px] lg:gap-20">
      <div className="max-w-[560px] pb-28 text-right md:pb-40">
        <p className="font-body text-[16px] leading-[1.85] text-balance text-white/60">
          YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
          <strong className="font-semibold text-white">ברמה הגבוהה ביותר</strong>.
        </p>
        <p className="mt-4 font-body text-[16px] leading-[1.85] text-balance text-white/60">
          אני עומר, מעצב מגיל 15 ומפתח מגיל 17, ואני בונה חוויות דיגיטליות{" "}
          <strong className="font-semibold text-white">שלא רק נראות טוב, אלא עובדות.</strong>
        </p>

        {/* Not cards, and deliberately not numbers. Every one of these is a
            plain fact about how the work is actually done, which a studio that
            subcontracts or assembles templates could not honestly write — where
            "Design-First" and a project count are things anyone can claim and
            nobody can check. Title above its line rather than beside it: at a
            fixed term width, RTL left a trough of empty space down the middle
            of the list. */}
        <dl className="mt-8 w-full divide-y divide-white/12 border-y border-white/12">
          {aboutFacts.map((fact) => (
            <div key={fact.title} className="py-4">
              <dt className="font-display text-[15px] font-bold text-white">{fact.title}</dt>
              <dd className="m-0 mt-1 font-body text-[14px] leading-[1.65] text-white/45">
                {fact.description}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 font-body text-[16px] leading-[1.7] text-white/60">
          אני כאן כדי להפוך את הרעיון שלך{" "}
          <strong className="font-semibold text-white">למוצר דיגיטלי שמייצר אימפקט.</strong>
        </p>
      </div>

      <figure className="m-0 w-full max-w-[430px] justify-self-start">
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
  );
}
