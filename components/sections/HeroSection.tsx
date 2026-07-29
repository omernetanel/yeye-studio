"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import LogoLiquidReveal, { type LogoLiquidRevealHandle } from "@/components/sections/hero/LogoLiquidReveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { getNavbarLogoRect, setDocked } from "@/lib/motion/heroDock";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

// Phase A — pinned (a tall wrapper + `sticky`, not a JS scroll-jack, so it
// stays smooth under Lenis): the page genuinely holds still while video
// floods the logo bottom-to-top, then recedes back to plain black while
// the mark shrinks in place to its small, final size. Scoped 0..1 across
// the wrapper's own height.
const FILL_END = 0.5;
const RECEDE_END = 0.78;
const SHRINK_START = 0.5;

// Phase B — the pin has released, so the page is scrolling normally again
// (whatever comes next can already be under way at the same time, instead
// of waiting for the Hero to fully finish). The now-small mark glides the
// rest of the way into
// the Navbar over a fixed scroll distance measured from the moment the
// pin let go, and once it lands it just scrolls up with everything else.
const TRAVEL_DISTANCE_PX = 550;
const CTA_FADE_TRAVEL_END = 0.25;
// The traveling mark dissolves away over this short window, finishing
// right as the CTA finishes fading in — starting half of the CTA's own
// fade-in window earlier, the "half a second before" feel — so by the
// moment the button is fully shown, the mark has already gone rather than
// still visibly sliding across the screen. The Navbar's own mark then
// appears at that same instant, together with the button, well before the
// physical travel or the CTA's screen-center hold actually end.
const LOGO_FADE_START = CTA_FADE_TRAVEL_END / 2;
const LOGO_FADE_END = CTA_FADE_TRAVEL_END;
const DOCK_TRAVEL_THRESHOLD = 0.96;
// Dead center of the viewport, not tied to the Hero's own layout — the
// button holds perfectly still there (a fixed element, ignoring scroll
// entirely) for the whole of the mark's travel, only letting go —
// scrolling away normally with everything else — once the mark has
// actually landed in the Navbar.
const CTA_CENTER_VH = 50;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<LogoLiquidRevealHandle>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Where Phase A left the mark (viewport-pixel center), and the exact
  // scrollY range the pin covers — computed analytically from the
  // wrapper's own geometry, rather than derived from Framer's
  // target-scoped scrollYProgress. That motion value lags a frame or two
  // behind an instant/fast scroll jump (its target rect gets re-measured
  // on its own schedule), while a live getBoundingClientRect() and the
  // raw global scrollY never do — so the phase boundary is decided from
  // those instead, with scrollYProgress dropped entirely.
  const settledRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);
  const ctaReleaseScrollYRef = useRef<number | null>(null);

  const { scrollY } = useScroll();

  const update = () => {
    const spacer = spacerRef.current;
    const floating = floatingRef.current;
    if (!spacer || !floating) return;

    const rawScrollY = scrollY.get();
    const progressA = mapRange(rawScrollY, pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1);

    if (rawScrollY < pinEndScrollYRef.current) {
      // Phase A: pinned. Position never needs to move on its own — the
      // sticky panel already holds it in place — only size animates, in
      // place, toward the Navbar mark's dimensions. (The center point
      // doesn't need a live measurement either — it's constant for all of
      // Phase A by definition, since sticky is what's holding it there —
      // settledRef already has it, precomputed in measurePinRange().)
      const settled = settledRef.current;
      const sizeT = smoothstep(mapRange(progressA, SHRINK_START, 1, 0, 1));
      const naturalRect = spacer.getBoundingClientRect();
      const currentWidth = lerp(naturalRect.width, settled.width, sizeT);
      const currentHeight = lerp(naturalRect.height, settled.height, sizeT);

      floating.style.width = `${currentWidth}px`;
      floating.style.height = `${currentHeight}px`;
      floating.style.left = `${settled.x - currentWidth / 2}px`;
      floating.style.top = `${settled.y - currentHeight / 2}px`;
      floating.style.opacity = "1";
      floating.style.pointerEvents = "auto";

      // The water level: rises 0→1 while the page is still held, then
      // recedes back to 0 while the mark shrinks — draining out, not just
      // fading, the same mechanism in reverse.
      const rise = mapRange(progressA, 0, FILL_END, 0, 1);
      const recede = 1 - mapRange(progressA, FILL_END, RECEDE_END, 0, 1);
      liquidRef.current?.setScrollReveal(Math.min(rise, recede));

      if (ctaRef.current) ctaRef.current.style.opacity = "0";
      ctaReleaseScrollYRef.current = null;
      setDocked(false);
    } else {
      // Phase B: unpinned, scrolling normally.
      const traveled = rawScrollY - pinEndScrollYRef.current;
      const travelT = clamp01(traveled / TRAVEL_DISTANCE_PX);
      const eased = smoothstep(travelT);
      // Separate from the mark's own dissolve/Navbar-reveal timing below —
      // this one is purely about when the CTA lets go of its screen-center
      // hold and starts scrolling away with everything else. Unchanged.
      const ctaReleased = travelT >= DOCK_TRAVEL_THRESHOLD;

      const navRect = getNavbarLogoRect();
      const settled = settledRef.current;
      const targetCenterX = navRect ? navRect.left + navRect.width / 2 : settled.x;
      const targetCenterY = navRect ? navRect.top + navRect.height / 2 : settled.y;
      const centerX = lerp(settled.x, targetCenterX, eased);
      const centerY = lerp(settled.y, targetCenterY, eased);

      floating.style.width = `${settled.width}px`;
      floating.style.height = `${settled.height}px`;
      floating.style.left = `${centerX - settled.width / 2}px`;
      floating.style.top = `${centerY - settled.height / 2}px`;
      const logoOpacity = 1 - smoothstep(mapRange(travelT, LOGO_FADE_START, LOGO_FADE_END, 0, 1));
      floating.style.opacity = String(logoOpacity);
      // Once it's dissolved away, stop absorbing hover so it can't shadow
      // whatever's now on top of it (the CTA, or the page beneath).
      floating.style.pointerEvents = logoOpacity > 0 ? "auto" : "none";

      liquidRef.current?.setScrollReveal(0);

      if (ctaRef.current) {
        const ctaT = smoothstep(mapRange(travelT, 0, CTA_FADE_TRAVEL_END, 0, 1));
        ctaRef.current.style.opacity = String(ctaT);

        // Holds dead still (screen-center, ignoring scroll) for the whole
        // trip, then — the instant the mark lands — starts scrolling away
        // normally: its on-screen position keeps decreasing 1:1 with
        // further scroll from that exact point, rather than snapping back
        // into document flow.
        const fixedTopPx = window.innerHeight * (CTA_CENTER_VH / 100);
        if (!ctaReleased) {
          ctaReleaseScrollYRef.current = null;
          ctaRef.current.style.top = `${fixedTopPx}px`;
        } else {
          if (ctaReleaseScrollYRef.current === null) ctaReleaseScrollYRef.current = rawScrollY;
          const scrolledSinceRelease = rawScrollY - ctaReleaseScrollYRef.current;
          ctaRef.current.style.top = `${fixedTopPx - scrolledSinceRelease}px`;
        }
      }

      // The Navbar's own mark reveal rides on the same instant the CTA
      // finishes fading in (LOGO_FADE_END === CTA_FADE_TRAVEL_END), not on
      // the traveling mark's physical arrival or the CTA's release above —
      // by this point the traveling mark has already dissolved away.
      setDocked(travelT >= LOGO_FADE_END);
    }
  };

  useEffect(() => {
    if (prefersReducedMotion) setDocked(true);
  }, [prefersReducedMotion]);

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    if (!wrapper || !spacer) return;

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    pinStartScrollYRef.current = wrapperTop;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - window.innerHeight;

    // The mark's Phase-A-final state — dead center of the sticky panel
    // (constant for all of Phase A, so a single measurement is enough)
    // at the Navbar mark's own size (the size Phase A's shrink animates
    // toward). Precomputed rather than captured from whatever the last
    // observed Phase A frame happened to be, so it's correct even if a
    // scroll jump lands past Phase A without ever rendering a frame
    // inside it.
    const naturalRect = spacer.getBoundingClientRect();
    const navRect = getNavbarLogoRect();
    settledRef.current = {
      x: naturalRect.left + naturalRect.width / 2,
      y: naturalRect.top + naturalRect.height / 2,
      width: navRect?.width ?? naturalRect.width,
      height: navRect?.height ?? naturalRect.height,
    };
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const floating = floatingRef.current;
    if (!floating) return;

    measurePinRange();
    update();
    floating.style.visibility = "visible";

    const handleResize = () => {
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (spacerRef.current) ro.observe(spacerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
    // Only needs to (re)bind once motion-preference settles — update()
    // itself always reads live refs/motion values, never stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) update();
  });

  const wipeInitial = prefersReducedMotion ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" };

  // Stays inside the Hero's sticky inner panel — normal in-flow visual
  // furniture (tagline, the logo's layout-reserving slot, the bottom row).
  const heroInFlowContent = (
    <>
      <div>
        <div className="mx-auto mt-8 -mb-8 w-full max-w-[1400px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex flex-col items-start text-right"
          >
            <p className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl">
              בואו נבנה לכם אתר שעובד ומוכר באמת.
            </p>
          </motion.div>
        </div>

        <div className="relative mt-4 w-full select-none px-4 sm:px-6 md:mt-8">
          {prefersReducedMotion ? (
            <div className="relative mx-auto aspect-[8042/2511] w-full">
              <Image
                src="/images/logo.png"
                alt="YEYE"
                fill
                priority
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                sizes="100vw"
                className="pointer-events-none object-contain"
                style={{ filter: "brightness(0)" }}
              />
            </div>
          ) : (
            // The logo's normal in-flow slot is only a spacer, reserving
            // layout space — the actual visible logo lives in the
            // fixed-position layer below so it can detach from the page
            // and travel to the Navbar as the user scrolls.
            <div ref={spacerRef} className="relative mx-auto aspect-[8042/2511] w-full" />
          )}
        </div>

        {/* Reduced motion only — the non-reduced-motion version lives
            outside the sticky panel entirely (see below), so it can hold
            still through the mark's whole travel to the Navbar without
            getting trapped in this panel's own stacking context. */}
        {prefersReducedMotion && (
          <div className="mt-8 flex justify-center px-6 md:mt-10">
            <Button
              href="/projects"
              variant="primary"
              className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg"
            >
              צפו בעבודות שלי
            </Button>
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="font-display text-[13px] text-black/50"
        >
          סטודיו דיגיטלי עצמאי
        </motion.span>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="flex items-center gap-4"
        >
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-black/50 transition-colors hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label="Email"
            className="text-black/50 transition-colors hover:text-black"
          >
            <Mail size={18} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </>
  );

  if (prefersReducedMotion) {
    return (
      <section id="hero" className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-white pt-[100px] pb-8">
        {heroInFlowContent}
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="hero" className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden bg-white pt-[100px] pb-8">
        {heroInFlowContent}
      </div>

      {/* Rendered as direct children of the Hero's own outer section — not
          nested inside the sticky panel above — because that panel's
          `sticky` + inset establishes its own stacking context, which
          would trap these fixed, high-z-index elements inside it. Trapped
          there, no z-index could ever lift them above the Services
          section's own sticky panel once it starts painting on top as a
          later sibling, regardless of how high the z-index was set. */}
      <div
        ref={ctaRef}
        // Below the Navbar's z-50 (not above it, like the floating mark) —
        // once released, this scrolls up through the header's own on-screen
        // band on its way off-screen, and needs to duck behind the header
        // there rather than paint over it. Still above Services' own
        // (unset/auto) stacking, which is all it ever needed z-index for.
        className="fixed inset-x-0 z-40 flex justify-center px-6"
        style={{ opacity: 0 }}
      >
        <Button
          href="/projects"
          variant="primary"
          className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg"
        >
          צפו בעבודות שלי
        </Button>
      </div>

      <div
        ref={floatingRef}
        className="fixed z-[60] select-none"
        style={{ visibility: "hidden" }}
      >
        <motion.div
          initial={wipeInitial}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}
          className="relative h-full w-full"
        >
          {/* The solid black logo — always the visual baseline. The canvas
              layered on top overdraws it with an identical black shape, so
              nothing looks different until the liquid reveal actually
              activates (hover, or the scroll-driven full-logo fill). */}
          <Image
            src="/images/logo.png"
            alt="YEYE"
            fill
            priority
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            sizes="100vw"
            className="pointer-events-none object-contain"
            style={{ filter: "brightness(0)" }}
          />
          <LogoLiquidReveal
            ref={liquidRef}
            logoSrc="/images/logo.png"
            videoSrc="/videos/hero-liquid.mp4"
            className="absolute inset-0 h-full w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
