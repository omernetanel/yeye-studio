"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ProjectsCarousel from "@/components/ui/ProjectsCarousel";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { stackHeading } from "@/lib/motion/stack-heading";
import { PROJECTS_HEADING } from "@/lib/content";
import FoldText, { setFold } from "@/components/ui/FoldText";

/**
 * The work, on a phone: the desktop's row under glass, at the phone's size.
 *
 * A sideways drag here would fight the vertical scroll, and the browser cancels
 * the pointer stream the moment it decides the gesture was a scroll - the trap
 * that killed the hero's ink once already. So the row claims only the sideways
 * axis (touch-action: pan-y) and lets go of any thumb that moves more up than
 * across; the page keeps scrolling natively under it.
 *
 * WHAT THIS IS NOT, because each was built and thrown away for a reason worth
 * keeping:
 *
 * - A long pinned deck. A pin costs its height in scroll in BOTH directions:
 *   let it reverse and the reader watches four handovers undo themselves to get
 *   out of the section; latch it so it cannot, and those screens become scroll
 *   that moves nothing. A page that stops answering the finger is where
 *   somebody closes the tab.
 * - A sticky heading over a padded column of bordered cards. The heading held
 *   218px — a quarter of the phone — for the whole section, and what was left
 *   showed one small card at a time inside a window. Sparse and slow.
 *
 * The row arrives once as it comes up and then stays put, so scrolling back
 * through is exactly as quick as scrolling down was.
 */

// The row arrives ONCE, when it first comes up, and then it is simply there -
// a reader leaving a section should never have to sit through it a second
// time, and a latched entrance is the only kind that cannot make them. The one
// exception is the big heading: while it stands, the row steps aside for it.
const CARD_IN_VH = 0.82;
const CARD_RISE_PX = 28;

// Where the heading's top is on the screen, as a share of its height: it folds
// in from near the bottom edge to past the lower third, and settles by 35%.
const HEADING_FOLD = [0.95, 0.6] as const;
const HEADING_SETTLE = [0.55, 0.35] as const;
// The big stack's line length against the screen's width, and the most of the
// screen's height it may take.
const STACK_WIDTH = 0.8;
const STACK_MAX_HEIGHT = 0.4;
// Half way between one line length and one type size: stretched to one length,
// "חלק" and "שלי" stood twice the height of "מהעבודות" between them.
const STACK_SAME_SIZE = 0.5;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

export default function MobileProjects() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const update = () => {
    const screen = window.innerHeight;

    // The heading folds in as a big stack — one word a line, both the same
    // length — and settles into its line, both off where its top is on the
    // screen. Only its words move, so its own box is an honest reading.
    const heading = headingRef.current;
    let settled = true;
    if (heading) {
      const at = heading.getBoundingClientRect().top / screen;
      const settle = smoothstep((HEADING_SETTLE[0] - at) / (HEADING_SETTLE[0] - HEADING_SETTLE[1]));
      // Half way down is enough: the cards arrive while the heading is still
      // shrinking, one movement rather than two in a row.
      settled = settle >= 0.5;
      heading.style.opacity = "1";
      stackHeading(
        heading,
        heading.offsetWidth / 2,
        heading.offsetHeight / 2,
        window.innerWidth * STACK_WIDTH,
        screen * STACK_MAX_HEIGHT,
        settle,
        STACK_SAME_SIZE,
      );
      setFold(heading, (HEADING_FOLD[0] - at) / (HEADING_FOLD[0] - HEADING_FOLD[1]));
    }

    // Shown only while the heading is at least half settled: standing big, it
    // reaches down over where the row sits. The ARRIVAL is latched, the
    // heading is not - scrolling back up stands the heading up again, and a
    // row left in place was drawn right through it. So the row steps back
    // whenever the heading does, and comes straight back with it.
    const carousel = carouselRef.current;
    if (!carousel) return;
    if (!seenRef.current && carousel.getBoundingClientRect().top < screen * CARD_IN_VH) seenRef.current = true;
    const shown = seenRef.current && settled;
    carousel.style.opacity = shown ? "1" : "0";
    carousel.style.transform = shown ? "translateY(0)" : `translateY(${CARD_RISE_PX}px)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      if (headingRef.current) headingRef.current.style.opacity = "1";
      if (carouselRef.current) {
        carouselRef.current.style.opacity = "1";
        carouselRef.current.style.transform = "none";
      }
      return;
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    // pb-12 against the CTA's own pt-14: 48 + 56 comes to a little over a
    // hundred, which is one beat between two sections rather than the 156 the
    // old pair left. That pairing was matched to a close that opened with a
    // 250px block of balloons; the clip is the ground of that section now, so
    // the number it was matched to is gone.
    // pt-32, up from 24: the settled line sat too close to the section above.
    <section id="projects" className="relative bg-white pt-32 pb-4">
      <h2
        ref={headingRef}
        // flex-wrap: at this size the two words do not fit one line on a
        // phone, and settled they wrap as the plain heading always did.
        className="relative mb-10 flex flex-wrap justify-center gap-x-[0.25em] px-6 font-display text-m-display font-extrabold tracking-tight whitespace-nowrap text-black"
        style={{ opacity: 0 }}
      >
        {PROJECTS_HEADING.map((word) => (
          <span key={word} className="block origin-center">
            <FoldText text={word} />
          </span>
        ))}
      </h2>

      {/* The desktop's row, at the phone's size. A sideways swipe moves it; a
          thumb going up or down is the page's, and the row lets go of it at
          once (touch-action: pan-y keeps the browser scrolling it natively). */}
      <div
        ref={carouselRef}
        className="transition-[opacity,transform] duration-700 ease-out will-change-transform"
        style={{ opacity: 0, transform: `translateY(${CARD_RISE_PX}px)` }}
      >
        <ProjectsCarousel stageClassName="!h-[56vw]" />
      </div>

      {/* No "see all the work" button. It went to /projects, which lists the
          same four projects that were just shown — a door out of the page at
          the exact moment the reader has been convinced, leading somewhere with
          nothing new in it. */}
    </section>
  );
}
