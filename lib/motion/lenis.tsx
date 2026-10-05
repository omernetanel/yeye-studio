"use client";

import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { noteArrival, noteForwardNavigation, noteHistoryNavigation } from "@/lib/nav/in-site-history";
import { destinationForHash } from "@/lib/nav/hash-targets";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

const LenisContext = createContext<Lenis | null>(null);

// How long an arrival keeps re-asserting where it placed the page. Long enough
// to outlast the layout settling and Next's own hash scroll, short enough that
// it is over before a reader who lands and immediately reaches for the wheel
// would notice - and their first touch ends it anyway.
const HOLD_ARRIVAL_MS = 500;
// How much longer it may keep holding while the page is still too short to
// reach its place.
const HOLD_REACH_MS = 1500;

/** The active Lenis instance, or null when smooth scroll is disabled (prefers-reduced-motion). */
export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  // The same instance, for the route effect below, which must not re-run when
  // the instance is rebuilt - see there.
  const lenisRef = useRef<Lenis | null>(null);
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
    lenisRef.current = instance;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(syncWithGsapTicker);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [prefersReducedMotion]);

  // BACK AND FORWARD ARE NOT NEW PAGES. A route change normally has to be sent
  // to the top or to its hash — see the effect below — but a history
  // navigation is the reader returning to a place they were, and the whole
  // point of it is the position they left. This flag marks those.
  const poppedRef = useRef(false);
  useEffect(() => {
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // WHERE THE READER STOOD ON EACH PAGE, kept by the site. This used to be
  // left to the browser and to Next, and on the home page it did not survive:
  // the page is still growing as it comes back - the pinned sections, the
  // frames - so the position was restored against a shorter page and clamped,
  // and back from a project landed on the hero. Restored here instead, and held
  // while the page grows, the same way a hash arrival is.
  //
  // Recorded only while the address is still the page it is recorded for: when
  // a route changes, the new page's scroll to the top must not be written over
  // the old page's place.
  const positionsRef = useRef(new Map<string, number>());
  const placedPathRef = useRef<string | null>(null);
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const onScroll = () => {
      const path = placedPathRef.current;
      if (path !== null && window.location.pathname === path) positionsRef.current.set(path, window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
  // IT RUNS ON A ROUTE CHANGE AND ON NOTHING ELSE. It used to depend on the
  // Lenis instance too, and the instance is torn down and rebuilt whenever the
  // reader switches reduced motion on or off - so flipping that switch in the
  // middle of the page ran this, found no hash, and sent them to the top. The
  // instance is read from a ref instead. Where a reader stands after that
  // switch is KeepPlace's job.
  //
  // WHICH PATH WE WERE ON LAST: the depth the back control reads is counted
  // here - this is the one place in the app that sees every route change and
  // knows which kind it was.
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const arriving = lastPathRef.current === null;
    const moved = !arriving && lastPathRef.current !== pathname;
    lastPathRef.current = pathname;
    if (arriving) noteArrival(pathname);
    placedPathRef.current = pathname;

    // Back or forward to a page the reader stood on: where they stood. A pop
    // to a page with no record (a reload lost it) goes by its address instead.
    const popped = poppedRef.current;
    poppedRef.current = false;
    const returnTo = popped ? positionsRef.current.get(pathname) : undefined;
    if (popped && moved) noteHistoryNavigation(pathname);
    else if (moved) noteForwardNavigation(pathname);

    // THE OFFSET OF A SECTION IS NOT FINAL ON THE FRAME THE ROUTE SETTLES:
    // fonts land, the paper's frame sequence arrives, and the page grows above
    // whatever was aimed at. An earlier version re-measured at two guessed
    // moments - the next frame, and a quarter of a second later - which is an
    // answer to "when is it probably done" rather than to the actual question.
    // The question is whether the page is still changing height, and a
    // ResizeObserver answers exactly that: place again on every change, and
    // fall silent on its own once the height holds.
    const place = () => {
      const top = returnTo ?? destinationForHash(window.location.hash) ?? 0;
      const instance = lenisRef.current;
      if (instance) instance.scrollTo(top, { immediate: true });
      else window.scrollTo(0, top);
      return top;
    };

    const aimed = place();
    // Nothing to hold on to: the top of the page does not move when the page
    // grows underneath it.
    if (aimed === 0 && !window.location.hash) return;

    // AN ARRIVAL HOLDS ITS PLACE FOR A MOMENT, because two other things write
    // the scroll position on the same beat and both of them are wrong here:
    // the page keeps growing above the target as fonts and the paper's frames
    // land, and Next scrolls to the hash element's own top after this runs,
    // which for a pinned section is the frame that means nothing. Re-asserting
    // every frame for half a second wins both without knowing about either.
    //
    // AND THE READER OUTRANKS ALL OF IT. Their own hand is an intention, not a
    // distance: an earlier version compared scrollY against the placement and
    // let go past two pixels, which Lenis's own settling could trip by itself
    // while nobody had touched anything.
    const until = performance.now() + HOLD_ARRIVAL_MS;
    let frame: number | null = null;

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };

    // And not over before the page has actually reached its place: a return
    // to a deep position waits for the page to grow tall enough to hold it,
    // up to a limit.
    const limit = until + HOLD_REACH_MS;
    const hold = () => {
      const now = performance.now();
      const reached = Math.abs(window.scrollY - aimed) < 2;
      if (now > limit || (now > until && reached)) return stop();
      place();
      frame = requestAnimationFrame(hold);
    };

    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    frame = requestAnimationFrame(hold);

    return stop;
  }, [pathname]);

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
