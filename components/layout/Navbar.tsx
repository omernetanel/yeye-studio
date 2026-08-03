"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useDocked } from "@/lib/motion/heroDock";

// The logo's own fixed vertical center — used to sample which section is
// currently behind it.
const LOGO_CENTER_Y_PX = 40;
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

  useEffect(() => {
    checkTheme();
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
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", scheduleCheck);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: docked ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className="fixed left-6 top-[22px] z-50"
    >
      <Link href="/" tabIndex={docked ? 0 : -1} aria-label="YEYE">
        <Image
          ref={imgRef}
          src="/images/logo.png"
          alt="YEYE"
          width={8200}
          height={3500}
          className="h-9 w-auto object-contain transition-[filter] duration-200"
          style={{ filter: LIGHT_FILTER }}
          priority
        />
      </Link>
    </motion.div>
  );
}
