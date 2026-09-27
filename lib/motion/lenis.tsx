"use client";

import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { noteArrival, noteForwardNavigation, noteHistoryNavigation } from "@/lib/nav/in-site-history";
import { destinationForHash } from "@/lib/nav/hash-targets";
import { useIsMobile } from "@/lib/use-mobile";
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
  // frame. Placing the page through Lenis itself (not a raw window.scrollTo)
  // is what actually sticks.
  //
  // IT PLACES THE PAGE WHERE THE URL ASKED FOR, which for most routes is the
  // top and for a link like /#cta is that section. It used to send every
  // arrival to zero without reading the address, so /#cta, /#about and the
  // /contact redirect all landed at the head of a 16,000px page with the thing
  // they asked for far below and nothing saying so. Everything that used to
  // work around that belongs here instead.
  //
  // WHICH PATH WE WERE ON LAST, because this effect also runs when the Lenis
  // instance itself appears or is rebuilt, and those are not route changes. The
  // depth the back control reads is counted here - this is the one place in the
  // app that sees every route change and knows which kind it was - and counting
  // an instance rebuild as a move put it four steps deep on a plain reload.
  const lastPathRef = useRef<string | null>(null);

  // Held in a ref rather than in the effect's deps: which layout is on screen
  // decides where a hash lands, but a window crossing the breakpoint is not a
  // reason to pick the reader up and move them.
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  useEffect(() => {
    const arriving = lastPathRef.current === null;
    const moved = !arriving && lastPathRef.current !== pathname;
    lastPathRef.current = pathname;
    if (arriving) noteArrival(pathname);

    if (poppedRef.current) {
      poppedRef.current = false;
      if (moved) noteHistoryNavigation(pathname);
      return;
    }

    if (moved) noteForwardNavigation(pathname);

    // The offset of a section on this page is not final on the frame the route
    // settles: fonts land, the paper's frames arrive, and the page grows above
    // whatever was aimed at. So the placement is measured again twice - on the
    // next frame and once more a quarter of a second later - and gives up the
    // moment the reader has moved themselves, which is the only thing that
    // outranks their own address bar.
    let frame: number | null = null;
    let timer: number | null = null;

    const place = (attempt: number) => {
      const top = destinationForHash(window.location.hash, isMobileRef.current);

      if (lenis) lenis.scrollTo(top ?? 0, { immediate: true });
      else window.scrollTo(0, top ?? 0);

      if (top === null || attempt >= 2) return;

      const again = () => {
        if (Math.abs(window.scrollY - top) > 2) return;
        place(attempt + 1);
      };

      if (attempt === 0) frame = requestAnimationFrame(() => requestAnimationFrame(again));
      else timer = window.setTimeout(again, 250);
    };

    place(0);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (timer !== null) clearTimeout(timer);
    };
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
