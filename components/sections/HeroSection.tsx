"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import LogoLiquidReveal, { type LogoLiquidRevealHandle } from "@/components/sections/hero/LogoLiquidReveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { getNavbarLogoRect, setDocked, useDocked } from "@/lib/motion/heroDock";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

// The Hero itself is pinned (via a tall wrapper + `sticky`, not a JS
// scroll-jack — see the useScroll offset below) for this whole sequence,
// so it reads as "the page freezes" even though the user is still
// physically scrolling through the wrapper's extra height. Progress is
// scoped 0..1 across that wrapper:
//   0        → FILL_END   : the page holds still; video floods the logo
//                            bottom-to-top like rising water.
//   FILL_END → 1           : now scrolling actually moves things — the
//                            water recedes back to plain black while the
//                            mark shrinks and glides into the Navbar slot,
//                            landing exactly as it looks there today.
const FILL_END = 0.45;
const RECEDE_END = 0.7;
const DOCK_START_AT = FILL_END;
const DOCK_DONE_AT = 1;
const DOCKED_THRESHOLD = 0.995;

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
  const docked = useDocked();

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<LogoLiquidRevealHandle>(null);

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] });

  const applyDockTransform = (progress: number) => {
    const spacer = spacerRef.current;
    const floating = floatingRef.current;
    if (!spacer || !floating) return;

    const naturalRect = spacer.getBoundingClientRect();
    const navRect = getNavbarLogoRect();
    const dockProgress = mapRange(progress, DOCK_START_AT, DOCK_DONE_AT, 0, 1);

    if (!navRect || dockProgress <= 0) {
      floating.style.top = `${naturalRect.top}px`;
      floating.style.left = `${naturalRect.left}px`;
      floating.style.width = `${naturalRect.width}px`;
      floating.style.height = `${naturalRect.height}px`;
    } else {
      // Two clean, non-overlapping phases instead of one blend: first the
      // mark shrinks in place, centered where it's been sitting all
      // along — by the time it's small, it's already impossible for it
      // to cover the Navbar's nav links or CTA, because it's simply not
      // wide enough to reach them anymore. Only once it's fully shrunk
      // does it start gliding — now small — the rest of the way into the
      // exact Navbar slot.
      const sizeT = smoothstep(mapRange(dockProgress, 0, 0.5, 0, 1));
      const posT = smoothstep(mapRange(dockProgress, 0.5, 1, 0, 1));

      const currentWidth = lerp(naturalRect.width, navRect.width, sizeT);
      const currentHeight = lerp(naturalRect.height, navRect.height, sizeT);

      const naturalCenterX = naturalRect.left + naturalRect.width / 2;
      const naturalCenterY = naturalRect.top + naturalRect.height / 2;
      const navCenterX = navRect.left + navRect.width / 2;
      const navCenterY = navRect.top + navRect.height / 2;
      const centerX = lerp(naturalCenterX, navCenterX, posT);
      const centerY = lerp(naturalCenterY, navCenterY, posT);

      floating.style.width = `${currentWidth}px`;
      floating.style.height = `${currentHeight}px`;
      floating.style.left = `${centerX - currentWidth / 2}px`;
      floating.style.top = `${centerY - currentHeight / 2}px`;
    }

    // The water level: rises 0→1 while the page is still held (matches
    // the pin phase exactly), then recedes back to 0 while the mark
    // shrinks away — draining out, not just fading, the same mechanism
    // in reverse.
    const rise = mapRange(progress, 0, FILL_END, 0, 1);
    const recede = 1 - mapRange(progress, FILL_END, RECEDE_END, 0, 1);
    liquidRef.current?.setScrollReveal(Math.min(rise, recede));

    setDocked(progress >= DOCKED_THRESHOLD);
  };

  useEffect(() => {
    if (prefersReducedMotion) setDocked(true);
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const floating = floatingRef.current;
    if (!floating) return;

    applyDockTransform(scrollYProgress.get());
    floating.style.visibility = "visible";

    const handleResize = () => applyDockTransform(scrollYProgress.get());
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (spacerRef.current) ro.observe(spacerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
    // Only needs to (re)bind once motion-preference settles — applyDockTransform
    // itself always reads live refs/values, never stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (prefersReducedMotion) return;
    applyDockTransform(progress);
  });

  const wipeInitial = prefersReducedMotion ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" };

  const heroContent = (
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
      </div>

      {!prefersReducedMotion && (
        <div
          ref={floatingRef}
          className={cn(
            "fixed z-[60] select-none transition-opacity duration-200",
            docked ? "pointer-events-none opacity-0" : "opacity-100"
          )}
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
      )}

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
        {heroContent}
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="hero" className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden bg-white pt-[100px] pb-8">
        {heroContent}
      </div>
    </section>
  );
}
