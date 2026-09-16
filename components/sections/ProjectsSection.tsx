"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Button from "@/components/ui/Button";
import { type GalleryItem } from "@/components/ui/CylinderGallery";
import SkewedGallery from "@/components/ui/SkewedGallery";
import { projects } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { stackHeading } from "@/lib/motion/stack-heading";
import FoldText, { setFold } from "@/components/ui/FoldText";
import { PROJECTS_HEADING } from "@/lib/content";

// Four real projects today, and nothing here is written for four: the arc takes
// its count from this array and wraps by it, and the project pages are built
// from the same file. Adding work is adding an entry to lib/projects.
const galleryItems: GalleryItem[] = projects.map((project) => ({
  image: project.image,
  title: project.cardTitle ?? project.title,
  category: project.cardCategory ?? project.category,
  href: project.external ? project.url : `/projects/${project.slug}`,
  external: project.external,
}));

// A SHORT PIN, and that is the whole point of it: it separates how long the
// arrival takes from how far the heading travels.
//
// In ordinary flow those two are the same number. The heading is only on screen
// for about a screen of scroll, so the arrival is over by the time it reaches
// anywhere a reader looks, and it never stands still once — it finishes
// shrinking and in the same instant leaves the top of the frame. That reads as
// a fade with extra steps, and it is why this took seven tries.
//
// Pinned, the panel holds the screen for 90vh while the progress runs. The
// heading does not move; only the animation does. Then it lets go and the whole
// panel — heading and work together — travels off as one thing.
//
// 90vh, not the 310 an earlier attempt took: this is a heading arriving, not a
// section of its own.
const PIN_VH = 0.9;

// And it starts before the pin does. The progress opens with the stage's top
// edge still at the middle of the screen — the room above is holding the whole
// upper half — so the heading is already on its way up by the time the panel
// catches. Without this the arrival could not begin until the previous section
// had left entirely, which is a beat too late to read as a handover.
const LEAD_VH = 0.5;

// Within that pin. The heading folds in as a big stack — one word a line, both
// lines the same length — riding up with the panel, and settles into its one
// line straight after.
const FOLD = [0, 0.42] as const;
const SETTLE = [0.42, 0.62] as const;
// Then the work, rising WHILE the heading settles rather than after it: waiting
// for the settle left a beat of a lone heading that read as a stall.
const GALLERY = [0.45, 0.8] as const;
// And the links stay shut until it is actually up. The gallery's hit targets
// cover most of the panel, so leaving them live from the top of the section
// means a reader can click a project that is not on screen yet.
const GALLERY_LIVE_FROM = 0.9;

// The stack's line length, as a share of the screen's width, and the most of
// the screen's height it may take. THE SIZE IS A SCALE, NOT A FONT SIZE: a font
// size changes the heading's layout box, which would shove the work below it up
// and down for the whole of the settle. Scale is composited and moves nothing.
const STACK_WIDTH = 0.5;
const STACK_MAX_HEIGHT = 0.7;

const GALLERY_RISE_PX = 110;

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
 * The heading here gets the same treatment as "אני עומר." in the section above,
 * and on the same machinery: a pinned panel, progress measured off raw scrollY,
 * no easing of its own to compound with Lenis's.
 *
 * That is the whole reason it changed. It ran on GSAP before — a fold that
 * fired once when the section came into view and then played for 1.3 seconds on
 * its own clock, which made it the only thing on this page that did not answer
 * the reader's hand. Everything else here is a function of scrollY, and a
 * heading that is not reads as detached however good the effect is.
 *
 * Live in both directions, like the rest: scrolling back up takes it apart
 * again. Nothing latches, because there is nothing here that only makes sense
 * once.
 */
export default function ProjectsSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The slot the heading lands in. It is measured, and the heading is not:
  // never measure a box that is in the middle of an animation of its own — the
  // target moves every frame and that reads as a jump. This wrapper carries no
  // transform, so it is the one honest reading of where the heading belongs.
  const slotRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const update = () => {
    const stage = stageRef.current;
    const panel = panelRef.current;
    const slot = slotRef.current;
    const heading = headingRef.current;
    const gallery = galleryRef.current;
    if (!stage || !panel || !slot || !heading || !gallery) return;

    // Every read first. A read after a write forces a layout flush, and this
    // runs on every scroll tick.
    const screen = window.innerHeight;
    const box = stage.getBoundingClientRect();
    const panelTop = panel.getBoundingClientRect().top;
    const slotBox = slot.getBoundingClientRect();

    const travel = box.height - screen;
    if (travel <= 0) return;
    // Opens LEAD_VH before the pin catches and closes when the pin lets go.
    const lead = screen * LEAD_VH;
    const progress = clamp01((lead - box.top) / (travel + lead));

    // The stack stands in the middle of the PANEL, not of the screen: before
    // the pin catches the panel is still coming up, and the stack comes up
    // with it while it folds. Centred on the screen it would sit on the
    // panel's top edge at the start, where the panel's clip cuts it.
    heading.style.opacity = "1";
    stackHeading(
      heading,
      slot.offsetWidth / 2,
      panelTop + screen / 2 - slotBox.top,
      window.innerWidth * STACK_WIDTH,
      screen * STACK_MAX_HEIGHT,
      span(progress, SETTLE),
    );
    setFold(heading, span(progress, FOLD));
    const galleryIn = span(progress, GALLERY);

    gallery.style.opacity = String(galleryIn);
    gallery.style.transform = `translateY(${lerp(GALLERY_RISE_PX, 0, galleryIn).toFixed(1)}px)`;
    gallery.style.pointerEvents = galleryIn > GALLERY_LIVE_FROM ? "auto" : "none";
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      // Nothing to arrive from: everything is simply here, and the pin's extra
      // scroll would be 90vh of empty page.
      const heading = headingRef.current;
      const gallery = galleryRef.current;
      if (heading) heading.style.opacity = "1";
      if (gallery) gallery.style.opacity = "1";
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
    <section id="projects" className="relative pb-20 md:pb-24">
      <div
        ref={stageRef}
        style={prefersReducedMotion ? undefined : { height: `${(1 + PIN_VH) * 100}svh` }}
      >
        {/* Heading and work sit in one column from the first frame, both in
            their final places. Only their arrival is animated — nothing here
            re-lays out, so nothing shifts under the reader.
            clip, not hidden: hidden would make this a scroll container and kill
            its own sticky. */}
        <div
          ref={panelRef}
          className={
            prefersReducedMotion
              ? "flex flex-col items-center justify-center gap-10 py-24"
              : "sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-10 overflow-clip md:gap-14"
          }
        >
          {/* mt: the settled line sat too close to the top of the screen. On
              the slot, not the heading, so the slot's box stays the heading's. */}
          <div ref={slotRef} className="mt-12 w-full">
            <h2
              ref={headingRef}
              className="relative flex justify-center gap-[0.25em] font-display text-[clamp(40px,5.2vw,78px)] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap text-black"
              style={{ opacity: 0 }}
            >
              {PROJECTS_HEADING.map((word) => (
                <span key={word} className="block origin-center">
                  <FoldText text={word} />
                </span>
              ))}
            </h2>
          </div>

          {/* Full width rather than inside the old 1000px measure: the centre
              panel is meant to read as a screen. */}
          <div ref={galleryRef} className="relative w-full will-change-transform" style={{ opacity: 0 }}>
            <SkewedGallery items={galleryItems} />
          </div>
        </div>
      </div>

      {/* The section carries no side padding any more — the panel has to span
          the full width or its clip cuts the arc 24px in from each edge, which
          is a hard line in the middle of the picture. The padding lives here
          instead, on the only thing that needs a measure. */}
      <div className="relative z-10 mt-16 flex justify-center px-6 md:mt-20">
        <Button href="/projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none">
          צפה בכל העבודות
        </Button>
      </div>
    </section>
  );
}
