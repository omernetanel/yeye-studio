"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onBeforeMotionChange } from "@/lib/a11y/preferences";
import { destinationForHash } from "@/lib/nav/hash-targets";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * A READER WHO SWITCHES REDUCED MOTION IN THE MIDDLE OF THE PAGE STAYS IN THE
 * SECTION THEY WERE READING.
 *
 * The switch re-lays the whole home page: every pinned section collapses to
 * its content, or unfolds back into tens of thousands of pixels of travel. The
 * scroll position is a number, and the same number after that is a different
 * place altogether - usually far past what was on screen, or the very bottom.
 * (For a while it was the top: see the route effect in lib/motion/lenis.tsx.)
 *
 * So the section under the middle of the screen is noted just before the
 * change, and the page is put back on it once the new layout is there - at the
 * place a menu link to that section would land, which with less motion is its
 * top and with motion is wherever the section says it is whole.
 *
 * Both ways the setting can change come through here: the site's own panel,
 * and the operating system's setting changing while the page is open.
 */

// In page order. The last one whose top is above the middle of the screen is
// the one being read.
const SECTIONS = ["hero", "services", "about", "contact", "projects", "cta"];

function sectionBeingRead() {
  const middle = window.innerHeight / 2;
  let found: string | null = null;
  for (const id of SECTIONS) {
    const section = document.getElementById(id);
    if (section && section.getBoundingClientRect().top <= middle) found = id;
  }
  return found;
}

export default function KeepPlace() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const noted = useRef<string | null>(null);

  useEffect(() => {
    const note = () => {
      noted.current = sectionBeingRead();
    };
    const system = window.matchMedia("(prefers-reduced-motion: reduce)");
    system.addEventListener("change", note);
    const stopPanel = onBeforeMotionChange(note);
    return () => {
      system.removeEventListener("change", note);
      stopPanel();
    };
  }, []);

  useLayoutEffect(() => {
    const id = noted.current;
    noted.current = null;
    // Nothing was noted on the first render, or on a page with none of these
    // sections - a sub-page barely changes shape, and keeps its own scroll.
    if (!id) return;

    // Two frames on: the sections measure themselves in their own layout
    // effects and say where they land in effects after that, and both have to
    // have run before the place is asked for.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const top = destinationForHash(id);
        if (top !== null) window.scrollTo(0, top);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  return null;
}
