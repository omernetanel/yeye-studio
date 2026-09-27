"use client";

import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when smooth scroll is disabled (prefers-reduced-motion). */
export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    // On the transition into reduced-motion, the previous effect's cleanup
    // (below) already destroys the instance and clears state — nothing to
    // do here on the first run either, since state already starts at null.
    if (prefersReducedMotion) return;

    const instance = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    instance.on("scroll", ScrollTrigger.update);

    const syncWithGsapTicker = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(syncWithGsapTicker);
    gsap.ticker.lagSmoothing(0);

    // Exposing the freshly constructed instance requires state — it's an
    // imperative external-system handle, not something derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(syncWithGsapTicker);
      instance.destroy();
      setLenis(null);
    };
  }, [prefersReducedMotion]);

  // BACK AND FORWARD ARE NOT NEW PAGES. A route change normally has to be sent
  // to the top — see the effect below — but a history navigation is the reader
  // returning to a place they were, and the whole point of it is the position
  // they left. This flag marks those so the reset below stands down for one
  // route change; the browser and Next restore the position themselves.
  const poppedRef = useRef(false);
  useEffect(() => {
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A client-side route change unmounts/mounts new page content at whatever
  // scroll position the previous page was left at — the browser's own
  // scroll-restoration doesn't help here since Lenis owns the actual scroll
  // animation loop and would just re-assert its old position on the next
  // frame. Resetting through Lenis itself (not a raw window.scrollTo) is
  // what actually sticks.
  useEffect(() => {
    if (poppedRef.current) {
      poppedRef.current = false;
      return;
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return (
    // reducedMotion="user" is the one line that makes every framer-motion
    // animation on the site answer the reader's own setting. The sections that
    // drive themselves from scrollY already check the preference by hand; this
    // covers everything else — the fades and rises on the sub-pages, the
    // closing section, the menu — without touching a single one of them.
    // Transforms and opacity are skipped for those readers; colour and layout
    // still change, so nothing goes missing.
    <MotionConfig reducedMotion="user">
      <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
    </MotionConfig>
  );
}
