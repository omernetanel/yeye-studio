"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useDocked } from "@/lib/motion/heroDock";

// The row the header samples to decide which section is behind it. 43, not the
// mark's centre on either layout: the mark spans 22–44 on a desktop and 42–64 on
// a phone, and 43 is the one row inside it on both.
const LOGO_CENTER_Y_PX = 43;
const DARK_FILTER = "brightness(0) invert(1)";
const LIGHT_FILTER = "brightness(0)";

/**
 * Just the wordmark now — no bar, no links, no CTA. Hidden until the
 * Hero's own pin releases (see lib/motion/heroDock.ts), at which point it
 * crossfades in on its own — tabIndex keeps keyboard focus off an
 * invisible link before that happens. That "docked" flag is only ever
 * flipped by the Hero's own IntersectionObserver, which only exists on
 * the homepage — everywhere else there's no Hero to scroll past, so the
 * logo would otherwise stay invisible forever; those pages just show it
 * immediately instead.
 *
 * Color-switching is done by explicitly checking which section sits
 * behind the logo's fixed position (currently only #process is dark —
 * every other section is white), applied as a direct style mutation on
 * the image (like ServicesSection's own scroll-driven styling) rather
 * than React state, not via mix-blend-mode: difference either. That CSS
 * trick looks right in isolation, but on a page this deep in transforms
 * (Lenis smooth scroll, GSAP ScrollTrigger pins, Framer Motion
 * animations) it's fragile — any of those can quietly promote a new
 * compositing layer between the logo and the page content, which breaks
 * live blending and leaves the logo stuck on whatever color it last
 * blended correctly against. Reading the DOM directly has none of that
 * fragility.
 */
export default function Navbar() {
  const pathname = usePathname();
  const heroDocked = useDocked();
  const docked = pathname === "/" ? heroDocked : true;
  const imgRef = useRef<HTMLImageElement>(null);
  const { scrollY } = useScroll();

  const checkTheme = () => {
    const img = imgRef.current;
    if (!img) return;
    // Any section can declare itself dark behind the logo via data-nav-dark.
    // Sections whose darkness changes as you scroll — the contact stage opens
    // on full-bleed footage and ends on a white room — flip that flag
    // themselves, so this stays a simple "is something dark under me" check
    // rather than needing to know how each section works.
    let onDark = false;
    for (const el of document.querySelectorAll<HTMLElement>('[data-nav-dark="true"]')) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= LOGO_CENTER_Y_PX && rect.bottom >= LOGO_CENTER_Y_PX) {
        onDark = true;
        break;
      }
    }
    img.style.filter = onDark ? DARK_FILTER : LIGHT_FILTER;
  };

  // Arriving from another page on a hash link — /#services from a sub-page's
  // menu — the router renders first and jumps to the anchor afterwards. A
  // single check here therefore samples the page at the TOP, decides the white
  // hero is behind the logo, paints it black, and never looks again: the jump
  // that follows is not a gesture and produces no scroll the subscription
  // below reacts to. That is the logo stuck black on a dark section.
  //
  // So the check is repeated across the frames the jump lands in. Three frames
  // and a backstop, not a fixed delay, because how long the router takes is not
  // ours to know.
  useEffect(() => {
    checkTheme();
    const frames: number[] = [];
    const again = (left: number) => {
      frames.push(
        requestAnimationFrame(() => {
          checkTheme();
          if (left > 0) again(left - 1);
        }),
      );
    };
    again(3);
    const backstop = window.setTimeout(checkTheme, 250);
    return () => {
      frames.forEach(cancelAnimationFrame);
      window.clearTimeout(backstop);
    };
  }, [pathname]);

  // Deferred a frame on purpose. Sections that compute their own darkness
  // write data-nav-dark from their own scroll handler, and this component
  // subscribes to the same motion value earlier, so reading it inline meant
  // sampling the previous frame's value — which then stuck if the user
  // stopped scrolling on the very frame it changed. A rAF hop guarantees
  // every writer has run first; the ref keeps it to one check per frame.
  const rafRef = useRef<number | null>(null);
  const scheduleCheck = () => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      checkTheme();
    });
  };

  useEffect(() => {
    // The motion value tracks scrolling; this catches the page being MOVED —
    // an anchor jump, a restored position, anything that repositions the
    // document without a gesture behind it.
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("hashchange", scheduleCheck);
    return () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("hashchange", scheduleCheck);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollY, "change", scheduleCheck);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: docked ? 1 : 0 }}
      // Long enough to read as arriving rather than switching on, and on the
      // same curve and duration as the menu crossing the header to make room
      // for it — the two are one movement, so they have to be one easing.
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      // Same offset as NavMenu's row, phone and desktop both — see there.
      className="fixed left-6 top-[42px] z-50 md:top-[22px]"
    >
      <Link href="/" tabIndex={docked ? 0 : -1} aria-label="YEYE">
        <Image
          ref={imgRef}
          src="/images/logo.png"
          alt="YEYE"
          width={8200}
          height={3500}
          // 22px, matched to the menu's own height on the other side of the
          // row. At 36 the mark was half again as tall as the word opposite it
          // and the two read as two different pieces of furniture rather than
          // as one header.
          className="h-[22px] w-auto object-contain transition-[filter] duration-200"
          style={{ filter: LIGHT_FILTER }}
          priority
        />
      </Link>
    </motion.div>
  );
}
