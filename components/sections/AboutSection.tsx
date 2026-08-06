"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// How far into the section the heading finishes changing, as a fraction of one
// screen. Short on purpose: it is a transition between two states, not a thing
// to be scrolled through, and stretching it turns the arrival into a chore.
const HEADING_TRANSITION_VH = 0.75;

// Where the heading ends up once it has shrunk — measured from the top of the
// screen, clear of the navbar.
const HEADING_PINNED_TOP_PX = 104;

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
 * The section opens on the question at full size, in the middle of an empty
 * screen: "רגע, מי אני בעצם?". Scrolling shrinks it to an ordinary heading and
 * parks it at the top, where it stays as the answer rises underneath. The long
 * form buys the beat — after the paper sequence the page needs to visibly
 * change its footing before it starts talking in the first person — and the
 * short one is what a section heading should be once the beat has landed.
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
  const longRef = useRef<HTMLDivElement>(null);
  const shortRef = useRef<HTMLDivElement>(null);

  const update = () => {
    const wrapper = wrapperRef.current;
    const long = longRef.current;
    const short = shortRef.current;
    if (!wrapper || !long || !short) return;

    const screen = window.innerHeight;
    const travel = screen * HEADING_TRANSITION_VH;
    const scrolled = -wrapper.getBoundingClientRect().top;
    const t = smoothstep(clamp01(scrolled / travel));

    // Both forms are anchored to the same point and centred on it, so the eye
    // tracks one shape through the change rather than watching two headings
    // trade places. The point itself travels from the middle of the screen to
    // its resting place at the top.
    const centreY = screen / 2;
    const restY = HEADING_PINNED_TOP_PX + short.offsetHeight / 2;
    const y = lerp(centreY, restY, t);

    // The long form leaves over the first half and the short one arrives over
    // the second, so they are never both solid at once — what overlaps is one
    // fading out at the size the other is fading in at.
    const longOut = clamp01(t / 0.55);
    const shortIn = clamp01((t - 0.45) / 0.55);

    long.style.opacity = String(1 - longOut);
    long.style.transform = `translate(-50%, -50%) translateY(${y - centreY}px) scale(${lerp(1, 0.42, t)})`;

    short.style.opacity = String(shortIn);
    short.style.transform = `translate(-50%, -50%) translateY(${y - centreY}px) scale(${lerp(2.4, 1, t)})`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    update();
    const handleResize = () => update();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="about" data-nav-dark="true" className="relative bg-black py-28 md:py-36">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="flex flex-col items-center">
            <ShortHeading />
            <HeadingSwash className="mt-3 w-[190px] text-white md:w-[230px]" />
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
      {/* The heading's stage. pointer-events-none so the copy that scrolls
          underneath stays selectable and its links stay clickable. */}
      <div className="pointer-events-none sticky top-0 z-20 h-[100svh]">
        <div ref={longRef} className="absolute top-1/2 left-1/2 w-full px-6 text-center">
          <h2 className="font-display text-[54px] leading-[1.02] font-bold text-white text-balance md:text-[92px]">
            רגע,
            <br />
            מי אני בעצם?
          </h2>
        </div>

        <div ref={shortRef} className="absolute top-1/2 left-1/2 flex w-full flex-col items-center px-6" style={{ opacity: 0 }}>
          <ShortHeading />
          <HeadingSwash className="mt-2 w-[150px] text-white md:w-[190px]" />
        </div>
      </div>

      {/* Pulled back up over the stage so the two share the same screen: the
          heading holds still at the top while this travels past it. The spacer
          is what keeps the copy below the fold until the question has been
          asked and answered. */}
      <div className="relative z-10 -mt-[100svh]">
        <div aria-hidden="true" className="h-[100svh]" />
        {/* No bottom padding: the portrait inside sits flush on the section's
            bottom edge, and the copy carries its own padding instead. */}
        <div className="mx-auto max-w-[1120px] px-6">
          <AboutBody />
        </div>
      </div>
    </section>
  );
}

function ShortHeading() {
  return (
    <h2 className="font-display text-[40px] leading-none font-bold text-white md:text-[56px]">מי אני?</h2>
  );
}

/**
 * The answer.
 *
 * The portrait is placed rather than floated: square corners, no shadow, its
 * base sitting on the section's own bottom edge with clear space between it
 * and the copy. A rounded card floating in the middle of the black read as an
 * image that had been dropped in; sitting it on an edge makes it part of the
 * layout. It stays this size rather than going full height because the picture
 * is a snapshot — blown up, its casualness becomes the loudest thing here.
 */
function AboutBody() {
  return (
    <div className="flex flex-col items-start gap-12 lg:flex-row-reverse lg:items-end lg:gap-20">
      {/* flex-row-reverse under dir="rtl" puts this first item on the RIGHT,
          which is where the reading starts. */}
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
            nobody can check. Title and line stacked rather than set side by
            side: at this measure a fixed-width term left a trough of empty
            space down the middle of the list. */}
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

      <figure className="m-0 w-full max-w-[340px] shrink-0 self-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/portrait.webp"
          alt="עומר, מייסד YEYE Digital"
          width={430}
          height={560}
          className="block h-[420px] w-full object-cover md:h-[520px]"
          draggable={false}
        />
      </figure>
    </div>
  );
}
