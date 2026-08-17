"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Button from "@/components/ui/Button";
import FallingBalloon from "@/components/sections/projects/FallingBalloon";
import CylinderGallery, { type GalleryItem } from "@/components/ui/CylinderGallery";
import { projects } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

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

// Within that pin. The rise and the settle overlap deliberately — it shrinks
// while it is still coming up, which is one movement, where back-to-back phases
// would be two.
const RISE = [0, 0.42] as const;
const SETTLE = [0.1, 0.55] as const;
// Then it stands, alone and finished, for a beat. That beat is the gap between
// SETTLE ending and GALLERY starting, and it is the only reason to pin at all.
const GALLERY = [0.54, 0.94] as const;
// And the links stay shut until it is actually up. The gallery's hit targets
// cover most of the panel, so leaving them live from the top of the section
// means a reader can click a project that is not on screen yet.
const GALLERY_LIVE_FROM = 0.9;

// It comes up out of focus, at a little over twice its final size. THE GROWTH
// IS A SCALE, NOT A FONT SIZE: a font size changes the heading's layout box,
// which would shove the work below it up and down for the whole of the settle.
// Scale is composited and moves nothing.
//
// HOW FAR BELOW IT STARTS IS NOT A CONSTANT, and that was the last thing wrong
// here. A fixed fraction of the viewport is only ever right at one screen size:
// too large and the heading spends the lead-in below the bottom edge, where the
// scroll we bought for it is spent on movement nobody sees; too small — 0.18,
// which is what it was — and it simply lights up near its final place instead
// of travelling to it. The offset is derived per frame from where the slot
// actually is, so the heading's visual top begins exactly on the bottom edge of
// the screen whatever the viewport.
const HEADING_BLUR_PX = 52;
const HEADING_FROM_SCALE = 2;

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

    // Where the heading starts, solved rather than guessed. The slot sits a
    // fixed distance down the panel; at the moment the progress opens the panel
    // is not yet pinned and its top is `lead` from the top of the screen. Add
    // the half-height that scaling past 1 pushes upward, and the offset that
    // puts the heading's visual top on the bottom edge falls straight out.
    const slotOffset = slotBox.top - panelTop;
    const overhang = (slotBox.height * (HEADING_FROM_SCALE - 1)) / 2;
    const startY = Math.max(0, screen - lead - slotOffset + overhang);

    const rise = span(progress, RISE);
    const settle = span(progress, SETTLE);
    const galleryIn = span(progress, GALLERY);

    heading.style.opacity = String(rise);
    heading.style.transform =
      `translateY(${lerp(startY, 0, rise).toFixed(1)}px) ` +
      `scale(${lerp(HEADING_FROM_SCALE, 1, settle).toFixed(3)})`;
    // The focus comes in ahead of the movement, so it is legible while it is
    // still arriving rather than sharpening in place at the end. Dropped
    // entirely once it is spent — a live blur filter on a large text node is
    // repainted every tick, and there is no reason to pay for blur(0).
    const blur = lerp(HEADING_BLUR_PX, 0, clamp01(rise * 1.4));
    heading.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "";

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
      <FallingBalloon />
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
          <div ref={slotRef} className="w-full">
            <h2
              ref={headingRef}
              className="origin-center text-center font-display text-[clamp(40px,5.2vw,78px)] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap text-black will-change-transform"
              style={{ opacity: 0 }}
            >
              פרויקטים נבחרים
            </h2>
          </div>

          {/* Full width rather than inside the old 1000px measure: the centre
              panel is meant to read as a screen. */}
          <div ref={galleryRef} className="relative w-full will-change-transform" style={{ opacity: 0 }}>
            <CylinderGallery items={galleryItems} />
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
