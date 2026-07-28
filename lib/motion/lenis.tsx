"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  // A client-side route change unmounts/mounts new page content at whatever
  // scroll position the previous page was left at — the browser's own
  // scroll-restoration doesn't help here since Lenis owns the actual scroll
  // animation loop and would just re-assert its old position on the next
  // frame. Resetting through Lenis itself (not a raw window.scrollTo) is
  // what actually sticks.
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
