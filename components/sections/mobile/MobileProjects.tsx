"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { projects } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The work, on a phone.
 *
 * NOT THE CYLINDER. The desktop's arc is the one thing on this site that asks
 * for a gesture other than scrolling, and on a phone it costs more than it
 * gives: it shows one project at a time and hides three behind a sideways drag
 * a reader on a quick pass will never make — in the section whose whole job is
 * proof. A horizontal drag also fights the vertical scroll, and the browser
 * cancels the pointer stream the moment it decides the gesture was a scroll,
 * which is the trap that killed the hero's ink once already.
 *
 * WHAT ELSE THIS IS NOT, because each was built and thrown away for a reason
 * worth keeping:
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
 * So: four pictures, edge to edge, one after another, with the name printed on
 * the image. The picture is the argument; a frame and a shadow around it only
 * make it smaller. Each arrives once as it comes up and then stays put, so
 * scrolling back through is exactly as quick as scrolling down was.
 */

// Each card arrives ONCE, when it first comes up, and then it is simply there.
// Nothing here is a function of scroll position, and that is deliberate: a
// reader leaving a section should never have to sit through it a second time,
// and a latched entrance is the only kind that cannot make them.
const CARD_IN_VH = 0.82;
const CARD_RISE_PX = 28;

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

export default function MobileProjects() {
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const seenRef = useRef<boolean[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  // The line under the strip. Read straight off the scroller rather than from a
  // card index, so it moves continuously with the finger instead of jumping a
  // quarter at a time as each card snaps.
  const onTrackScroll = () => {
    const track = trackRef.current;
    const bar = progressRef.current;
    if (!track || !bar) return;
    const travel = track.scrollWidth - track.clientWidth;
    // RTL scrollers count leftwards from zero, so scrollLeft runs negative
    // here — the magnitude is the distance travelled either way.
    const t = travel <= 0 ? 1 : Math.min(1, Math.abs(track.scrollLeft) / travel);
    bar.style.transform = `scaleX(${Math.max(0.08, t).toFixed(3)})`;
  };

  const update = () => {
    const screen = window.innerHeight;

    const heading = headingRef.current;
    if (heading) {
      const top = heading.getBoundingClientRect().top;
      const t = smoothstep(clamp01((screen - top) / (screen * 0.5)));
      heading.style.opacity = String(t);
      heading.style.transform = `translateY(${lerp(34, 0, t).toFixed(1)}px)`;
    }

    cardsRef.current.forEach((card, index) => {
      if (!card || seenRef.current[index]) return;
      if (card.getBoundingClientRect().top < screen * CARD_IN_VH) {
        seenRef.current[index] = true;
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }
    });
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      if (headingRef.current) headingRef.current.style.opacity = "1";
      for (const card of cardsRef.current) {
        if (card) {
          card.style.opacity = "1";
          card.style.transform = "none";
        }
      }
      return;
    }
    update();
    onTrackScroll();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    // pb-[92px] against the CTA's own pt-16: the two together come to the same
    // 128px the clip leaves above "בואו נבנה משהו" inside that section, so the
    // seam between the work and the close reads as the same beat as the one
    // inside it rather than as a wider or narrower one. Measured, not guessed —
    // 92 is what was left after the round number came out 28px short.
    <section id="projects" className="relative bg-white pt-24 pb-[92px]">
      <h2
        ref={headingRef}
        className="mb-10 px-6 text-center font-display text-m-display font-extrabold tracking-tight text-black will-change-transform"
        style={{ opacity: 0 }}
      >
        פרויקטים נבחרים
      </h2>

      {/* A NATIVE horizontal scroller, not a drag-driven one. The browser owns
          both axes, so there is nothing here to fight the page's own scrolling
          — which is what ruled out the desktop's arc on a phone: a hand-rolled
          drag loses the pointer stream the moment the browser decides the
          gesture was a scroll.
          px-[7vw] on the track with 86vw cards centres the current card and
          leaves the next one peeking at the edge. The peek is the whole
          affordance: no arrows, no dots, no "swipe" label. */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[7vw]"
      >
        {projects.map((project, index) => {
          const href = project.external ? project.url : `/projects/${project.slug}`;
          return (
            <Link
              key={project.slug}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              href={href}
              target={project.external ? "_blank" : undefined}
              rel={project.external ? "noopener noreferrer" : undefined}
              className="relative block w-[86vw] shrink-0 snap-center overflow-hidden rounded-2xl transition-[opacity,transform] duration-700 ease-out will-change-transform"
              style={{ opacity: 0, transform: `translateY(${CARD_RISE_PX}px)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.cardTitle ?? project.title}
                className="block aspect-[1672/941] w-full object-cover"
                draggable={false}
              />

              {/* Printed on the picture rather than under it. A caption below
                  the image turns each one back into a card; on it, the picture
                  keeps the full height it was given.
                  The wash is what makes the type legible over four very
                  different screenshots — some of these are pale. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pt-16 pb-4 text-right">
                <span className="block font-display text-m-sub font-bold text-white">
                  {project.cardTitle ?? project.title}
                </span>
                <span className="mt-0.5 block font-body text-m-small text-white/60">
                  {project.cardCategory ?? project.category}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* How far through the work you are, as one line rather than a row of
          dots. Dots count the projects, which is a number nobody needs; a line
          answers the only question the reader actually has, which is whether
          there is more. */}
      <div className="mx-[7vw] mt-7 h-px bg-black/10">
        <div
          ref={progressRef}
          className="h-px origin-left bg-black/45 transition-transform duration-150 ease-out"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* No "see all the work" button. It went to /projects, which lists the
          same four projects that were just shown — a door out of the page at
          the exact moment the reader has been convinced, leading somewhere with
          nothing new in it. */}
    </section>
  );
}
