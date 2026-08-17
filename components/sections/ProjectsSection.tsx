"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Button from "@/components/ui/Button";
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

// How far the section has to rise through the screen for the heading to be
// fully in. A fraction of the viewport rather than a duration: this is driven
// by the reader, not by a clock.
const RUN_VH = 0.62;
// The heading arrives first and the work comes up under it, overlapping — one
// movement in two parts rather than two events.
const GALLERY_FROM = 0.42;

const HEADING_RISE_PX = 64;
const HEADING_BLUR_PX = 22;
const GALLERY_RISE_PX = 90;

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
 * The heading here gets the same treatment as "אני עומר." in the section
 * above: it rises out of focus and sharpens as it settles, driven straight off
 * the scroll position rather than off a timeline.
 *
 * That is the whole reason it changed. It ran on GSAP before — a fold that
 * fired once when the section came into view and then played for 1.3 seconds
 * on its own clock, which made it the only thing on this page that did not
 * answer the reader's hand. Everything else here is a function of scrollY, and
 * a heading that is not reads as detached however good the effect is.
 *
 * Live in both directions, like the rest: scrolling back up takes it apart
 * again. Nothing latches, because there is nothing here that only makes sense
 * once.
 */
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const update = () => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const gallery = galleryRef.current;
    if (!section || !heading || !gallery) return;

    const screen = window.innerHeight;
    const top = section.getBoundingClientRect().top;
    // 0 with the section's top edge at the bottom of the screen, 1 once it has
    // risen RUN_VH of a screen past that.
    const progress = clamp01((screen - top) / (screen * RUN_VH));

    const headingIn = smoothstep(progress);
    heading.style.opacity = String(headingIn);
    heading.style.transform = `translateY(${lerp(HEADING_RISE_PX, 0, headingIn).toFixed(1)}px)`;
    const blur = lerp(HEADING_BLUR_PX, 0, clamp01(headingIn * 1.35));
    heading.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : "";

    const galleryIn = smoothstep(clamp01((progress - GALLERY_FROM) / (1 - GALLERY_FROM)));
    gallery.style.opacity = String(galleryIn);
    gallery.style.transform = `translateY(${lerp(GALLERY_RISE_PX, 0, galleryIn).toFixed(1)}px)`;
  };

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const gallery = galleryRef.current;
    if (prefersReducedMotion) {
      // Nothing to arrive from: everything is simply here.
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
    <section ref={sectionRef} id="projects" className="relative px-6 py-20 md:py-24">
      <h2
        ref={headingRef}
        className="relative z-10 mb-16 text-center font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] font-extrabold tracking-tight text-black will-change-transform md:mb-24"
        style={{ opacity: 0 }}
      >
        פרויקטים נבחרים
      </h2>

      {/* The work comes up under the heading while it is still settling, so the
          two read as one movement. Full width rather than inside the old 1000px
          measure: the centre panel is meant to read as a screen. */}
      <div ref={galleryRef} className="will-change-transform" style={{ opacity: 0 }}>
        <CylinderGallery items={galleryItems} />
      </div>

      <div className="relative z-10 mt-16 flex justify-center md:mt-20">
        <Button href="/projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none">
          צפה בכל העבודות
        </Button>
      </div>
    </section>
  );
}
