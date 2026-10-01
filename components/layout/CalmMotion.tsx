"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * THE CALM VERSION OF THE SITE'S MOTION, for a reader who asked for less of it.
 *
 * "Less motion" used to mean every animation simply switched off, and the page
 * read as a document that had been dropped on the screen: correct, and dead.
 * What that reader is avoiding is MOVEMENT - pinning, zooms, things falling,
 * type flying into place. A soft change of opacity with nothing moving is the
 * accepted replacement, and it is the whole of what this does: each heading,
 * paragraph, list item, form and picture fades in as it is scrolled into view,
 * one after another.
 *
 * ONE MECHANISM FOR EVERY PAGE, found by tag rather than marked by hand in
 * each section, so a new section gets it without knowing it exists.
 *
 * WHAT IT NEVER DOES:
 * - Hide what is already on screen when it starts. That would flash on load;
 *   those elements are simply there.
 * - Make content depend on it. The hidden state is two classes this adds, and
 *   takes off again on the way out: no script, nothing hidden.
 * - Move anything. Opacity only - see .calm in globals.css.
 */

// By tag, plus anything a component marks as one piece with data-calm - a row
// whose icon and arrow should arrive with its words.
const CANDIDATES = "[data-calm], h1, h2, h3, p, li, form, figure, img, blockquote, dl";

// The site's chrome and the pieces that run their own show.
const EXCLUDED = "nav, footer, .sm-root, .paper-crumple, .flex-carousel, [aria-hidden='true'], [data-no-calm], .sr-only";

// One after another when several arrive together, and never a long queue.
const STAGGER_MS = 70;
const STAGGER_MAX = 5;

function isFixed(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node && node !== document.body; node = node.parentElement) {
    if (getComputedStyle(node).position === "fixed") return true;
  }
  return false;
}

export default function CalmMotion() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (!prefersReducedMotion) return;
    const main = document.querySelector("main");
    if (!main) return;

    const found = Array.from(main.querySelectorAll<HTMLElement>(CANDIDATES));
    const chosen = new Set<HTMLElement>();
    for (const element of found) {
      if (element.closest(EXCLUDED)) continue;
      // The outermost wins: a paragraph inside a list item fades with the item.
      let nested = false;
      for (let node = element.parentElement; node && node !== main; node = node.parentElement) {
        if (chosen.has(node)) {
          nested = true;
          break;
        }
      }
      if (nested) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      // Already on screen: it is simply there.
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) continue;
      if (isFixed(element)) continue;
      chosen.add(element);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let index = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.style.transitionDelay = `${Math.min(index, STAGGER_MAX) * STAGGER_MS}ms`;
          element.classList.remove("calm-wait");
          observer.unobserve(element);
          index++;
        }
      },
      // A little inside the bottom edge, so the fade is seen and not finished
      // under the fold.
      { rootMargin: "0px 0px -8% 0px" },
    );

    for (const element of chosen) {
      element.classList.add("calm", "calm-wait");
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      for (const element of chosen) {
        element.classList.remove("calm", "calm-wait");
        element.style.transitionDelay = "";
      }
    };
  }, [prefersReducedMotion, pathname]);

  return null;
}
