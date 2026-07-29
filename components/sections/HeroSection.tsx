"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import LogoLiquidReveal, { type LogoLiquidRevealHandle } from "@/components/sections/hero/LogoLiquidReveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { setDocked } from "@/lib/motion/heroDock";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

// Pinned (a tall wrapper + `sticky`, not a JS scroll-jack, so it stays
// smooth under Lenis): the page holds still while video floods the logo
// bottom-to-top, recedes back to plain black, and the mark shrinks in
// place — not all the way down to the Navbar mark's own tiny size, just
// to a modest, still clearly legible one. There's no handoff/travel
// animation to a precise target anymore, so nothing here needs to match
// the Navbar's own size or position at all.
const FILL_END = 0.5;
const RECEDE_END = 0.78;
const SHRINK_START = 0.5;
const RELEASE_WIDTH_PX = 340;

// The CTA fades in over the tail end of that same pinned phase, so by
// the moment the pin releases, both it and the now-modest-sized mark are
// already sitting there fully formed, as perfectly ordinary in-flow
// content — from that instant on they just scroll away with the rest of
// the page like anything else. No fixed positioning, no z-index games,
// no separate "travel to the Navbar" phase at all.
const CTA_FADE_START = 0.8;

// Once the pin lets go and the Navbar's own mark has taken over, the
// Hero's tagline and mark have done their job — continuing to scroll
// fades them out (the CTA stays put, fully opaque) over this many extra
// pixels past the release point, so what's left on screen for a moment
// is just the button on its own, before it too scrolls away normally.
const POST_RELEASE_FADE_PX = 220;

// The Navbar's own mark doesn't have to appear the instant the pin lets
// go — holding off for a bit of extra scroll first reads more deliberate
// than an immediate swap right as everything else starts moving again.
const DOCK_DELAY_PX = 120;

// Past the pin's release, the CTA is ordinary in-flow content — it keeps
// scrolling up with the rest of the page and would otherwise scroll right
// under the fixed Navbar. Fading it out over this range, timed off its own
// live position (not scroll progress) so it's fully gone CTA_NAVBAR_GAP_PX
// before its top edge would actually reach the Navbar's bottom edge.
const NAVBAR_HEIGHT_PX = 68;
const CTA_NAVBAR_GAP_PX = 15;
const CTA_NAVBAR_FADE_RANGE_PX = 120;

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

const TAGLINE_TEXT = "בואו נבנה לכם אתר שעובד ומוכר באמת.";
const TYPEWRITER_START_DELAY_MS = 500;
const TYPEWRITER_CHAR_MS = 45;

// Reveals `text` one character at a time, in plain logical (string) order.
// The page is globally dir="rtl" (see app/layout.tsx), so the browser's own
// bidi rendering already grows Hebrew text from the right edge toward the
// left as characters are appended — no manual reversal needed here.
function useTypewriter(text: string, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), count === 0 ? TYPEWRITER_START_DELAY_MS : TYPEWRITER_CHAR_MS);
    return () => clearTimeout(id);
  }, [active, count, text.length]);

  return { visible: text.slice(0, count), done: count >= text.length };
}

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { visible: typedTagline, done: taglineTypingDone } = useTypewriter(TAGLINE_TEXT, !prefersReducedMotion);

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoFadeRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<LogoLiquidRevealHandle>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const naturalWidthRef = useRef(0);
  const naturalAspectRef = useRef(8042 / 2297);
  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);

  const { scrollY } = useScroll();

  const update = () => {
    const logo = logoRef.current;
    if (!logo) return;

    const rawScrollY = scrollY.get();
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));

    const sizeT = smoothstep(mapRange(progress, SHRINK_START, 1, 0, 1));
    const currentWidth = lerp(naturalWidthRef.current || RELEASE_WIDTH_PX, RELEASE_WIDTH_PX, sizeT);
    logo.style.width = `${currentWidth}px`;
    logo.style.height = `${currentWidth / naturalAspectRef.current}px`;

    // The water level: rises 0→1 while the page is still held, then
    // recedes back to 0 while the mark shrinks — draining out, not just
    // fading, the same mechanism in reverse.
    const rise = mapRange(progress, 0, FILL_END, 0, 1);
    const recede = 1 - mapRange(progress, FILL_END, RECEDE_END, 0, 1);
    liquidRef.current?.setScrollReveal(Math.min(rise, recede));

    if (ctaRef.current) {
      const fadeInT = smoothstep(mapRange(progress, CTA_FADE_START, 1, 0, 1));

      // distance from the CTA's top edge to the point NAVBAR_GAP_PX above
      // the Navbar's own bottom edge — 0 (or negative) once it's reached
      // that point, large and positive while it's still far below it.
      const ctaTop = ctaRef.current.getBoundingClientRect().top;
      const distanceToNavbar = ctaTop - NAVBAR_HEIGHT_PX - CTA_NAVBAR_GAP_PX;
      const navbarFadeT = 1 - smoothstep(clamp01(distanceToNavbar / CTA_NAVBAR_FADE_RANGE_PX));

      ctaRef.current.style.opacity = String(Math.min(fadeInT, 1 - navbarFadeT));
    }

    // Purely a function of how far past the release point the scroll is —
    // 0 the entire time the pin is held (mapRange/clamp01 keep it pinned
    // at the "value" input's lower bound until rawScrollY actually passes
    // pinEnd), so it never interferes with anything above, and it's just
    // as reversible on scroll-up as everything else here.
    const postReleaseT = smoothstep(mapRange(rawScrollY, pinEndScrollYRef.current, pinEndScrollYRef.current + POST_RELEASE_FADE_PX, 0, 1));
    const fadeOpacity = String(1 - postReleaseT);
    if (taglineRef.current) taglineRef.current.style.opacity = fadeOpacity;
    if (logoFadeRef.current) logoFadeRef.current.style.opacity = fadeOpacity;

    // A little after the pin lets go — not the same instant — the
    // Navbar's own mark takes over. Nothing to hand off, no size/position
    // to match, just a plain opacity crossfade on the Navbar's side (see
    // heroDock.ts).
    setDocked(rawScrollY >= pinEndScrollYRef.current + DOCK_DELAY_PX);
  };

  const measure = () => {
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    if (!wrapper || !spacer) return;

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    pinStartScrollYRef.current = wrapperTop;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - window.innerHeight;

    // The spacer is an invisible, absolutely-positioned twin at the
    // logo's natural (unshrunk) size — reading its width here, rather
    // than the real logo's own box, is what keeps this accurate across a
    // responsive resize instead of measuring an element whose width this
    // same code is actively overwriting.
    naturalWidthRef.current = spacer.getBoundingClientRect().width;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    measure();
    update();

    const handleResize = () => {
      measure();
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

  const logoBlock = prefersReducedMotion ? (
    <div className="relative mx-auto aspect-[8042/2297] w-full">
      <Image
        src="/images/logo.png"
        alt="YEYE"
        fill
        priority
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        sizes="100vw"
        className="pointer-events-none object-cover"
        style={{ filter: "brightness(0)" }}
      />
    </div>
  ) : (
    <div className="relative mx-auto">
      {/* Invisible natural-size reference, purely for measurement (see
          measure() above) — absolutely positioned so it reserves no
          layout space of its own; the actual space here comes from the
          real logo below, which is the thing that's actually shrinking. */}
      <div ref={spacerRef} className="invisible absolute inset-x-0 top-0 aspect-[8042/2297] w-full" aria-hidden />

      <div ref={logoRef} className="relative mx-auto aspect-[8042/2297] w-full select-none">
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
            className="pointer-events-none object-cover"
            style={{ filter: "brightness(0)" }}
          />
          <LogoLiquidReveal
            ref={liquidRef}
            logoSrc="/images/logo.png"
            videoSrc="/videos/herovid.mp4"
            className="absolute inset-0 h-full w-full"
          />
        </motion.div>
      </div>
    </div>
  );

  const heroInFlowContent = (
    <>
      <div ref={taglineRef} className="mx-auto mt-8 w-full max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="flex flex-col items-start text-right"
        >
          <p
            aria-label={TAGLINE_TEXT}
            className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl"
          >
            <span aria-hidden="true">
              {prefersReducedMotion ? TAGLINE_TEXT : typedTagline}
              {!prefersReducedMotion && !taglineTypingDone && (
                <span className="ml-0.5 inline-block h-[0.85em] w-[2px] -translate-y-[0.05em] animate-pulse bg-black align-middle" />
              )}
            </span>
          </p>
        </motion.div>
      </div>

      {/* Its own centered flex region between the tagline and the bottom
          row, not just packed up against the tagline — once the mark
          shrinks down to its modest in-flow size, `justify-between` on
          the outer panel alone left it (and the CTA) stranded up near the
          top with a huge dead gap below, instead of sitting centered in
          the space actually available for them. */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div ref={logoFadeRef} className="relative w-full select-none px-4 sm:px-6">{logoBlock}</div>

        {/* Ordinary in-flow content, right below the logo, in both
            branches — the reduced-motion version just skips the initial
            opacity:0 so it's visible immediately, no separate markup. */}
        <div
          ref={ctaRef}
          className="mt-14 flex justify-center md:mt-20"
          style={prefersReducedMotion ? undefined : { opacity: 0 }}
        >
          <Button
            href="/#projects"
            variant="primary"
            className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg"
          >
            צפו בעבודות שלי
          </Button>
        </div>
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
      <section id="hero" className="relative flex min-h-screen flex-col overflow-hidden bg-white pt-[100px] pb-8">
        {heroInFlowContent}
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="hero" className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden bg-white pt-[100px] pb-8">
        {heroInFlowContent}
      </div>
    </section>
  );
}
