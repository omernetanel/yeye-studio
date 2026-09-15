"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLenis } from "@/lib/motion/lenis";
import { useDocked } from "@/lib/motion/heroDock";
import { useIsMobile } from "@/lib/use-mobile";

/**
 * THE HARD PART OF THIS MENU IS NOT THE MENU — it is where each link lands.
 *
 * Half the sections on this page are pinned panels that play out over screens
 * of scroll, and their `id` sits at the TOP of that run: at the very start of
 * the animation, where #services is a shrunken sheet, #about is an empty black
 * panel and #projects is a blurred heading below the bottom edge. A hash link
 * would drop the reader on exactly the frame that means nothing.
 *
 * So a target is a section plus how far into its own run to go. The fraction is
 * of the section's pin travel — its height less a viewport — which is zero for
 * an ordinary section, so the same arithmetic covers both kinds.
 */
type Target = { label: string; id: string; at: number };

const TARGETS: Target[] = [
  { label: "הבית", id: "hero", at: 0 },
  // The sheet open and the drawing on it, rather than the sheet still inset.
  { label: "מה אני עושה", id: "services", at: 0.55 },
  // Past the greeting and the portrait's arrival, on the three claims.
  { label: "מי אני", id: "about", at: 0.42 },
  // After the heading has settled and the arc is up.
  { label: "פרויקטים", id: "projects", at: 0.94 },
];

// The contact stage is deliberately absent: it is a section you arrive at by
// reading, not one you jump into. The way to it from here is the CTA below.
const CTA: Target = { label: "בואו נדבר", id: "cta", at: 0 };

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const lenis = useLenis();
  const isMobile = useIsMobile();
  const docked = useDocked();

  // WHICH CORNER THE MENU SITS IN, and it is not a preference — it is whether
  // the wordmark is currently occupying the other one.
  //
  // At the top of the page on a phone the fixed logo is faded out, so the left
  // corner is empty and the menu takes it: menu on the left, the hero's line on
  // the right, one header row. The moment the logo docks in, the two would be
  // on top of each other — so the menu crosses to the right as the logo arrives
  // and they trade places instead of colliding.
  //
  // Desktop never moves. There the logo's corner is claimed the whole way down
  // and the right side carries the section labels, so a menu that wandered
  // would only ever be in the way.
  const atRight = !isMobile || docked;

  // Same contract the logo across the page uses: a section declares itself dark
  // behind the chrome with data-nav-dark, and anything floating over it asks
  // whether one of those is under its own corner.
  //
  // NOT a blend, which is what this was for one round. Difference against the
  // page would have let the ink wash over the menu the way it washes over the
  // wordmark — but this element is `fixed` with a z-index, which puts it in a
  // compositing layer of its own, and a blend cannot mix with a WebGL canvas
  // sitting in a different layer. It silently does nothing and the white button
  // stays white on a white page. The hero's own tagline and CTA blend correctly
  // because they are INSIDE the hero, next to the canvas. Position is what
  // decides this, not the blend mode.
  useEffect(() => {
    if (pathname !== "/") return;
    let frame: number | null = null;
    const check = () => {
      frame = null;
      const root = rootRef.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      let over = false;
      for (const el of document.querySelectorAll<HTMLElement>('[data-nav-dark="true"]')) {
        const r = el.getBoundingClientRect();
        if (r.left <= x && r.right >= x && r.top <= y && r.bottom >= y) {
          over = true;
          break;
        }
      }
      setDark(over);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const go = (target: Target) => {
    setOpen(false);
    const section = document.getElementById(target.id);
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    // Zero for a section that is not pinned, so this one line serves both.
    const run = Math.max(0, section.offsetHeight - window.innerHeight);
    const to = top + run * target.at;
    // Through Lenis, never around it: a native smooth scroll would run its own
    // easing alongside Lenis's and the two would fight the whole way down.
    if (lenis) lenis.scrollTo(to, { duration: 1.6 });
    else window.scrollTo({ top: to, behavior: "smooth" });
  };

  // The targets only exist on the home page.
  if (pathname !== "/") return null;

  return (
    // The rail spans both margins; the menu is placed inside it and crosses
    // from one end to the other. `justify-end` is the LEFT under RTL — that
    // reversal has caused three separate bugs on this site, so it is worth
    // saying out loud rather than reading it as English.
    // A layout animation rather than an animated `left`: framer measures where
    // the block ended up and tweens it there, so the same code works whatever
    // the button's width or the viewport's, and nothing has to be computed.
    <div
      // 32px on a phone, 22 above it. The phone's opening screen puts its line
      // right beside this row, and at 22 the pair sat pressed against the top
      // of the glass. Must match the logo's own offset in Navbar — they are one
      // row.
      className="pointer-events-none fixed inset-x-6 top-[32px] z-50 flex md:top-[22px]"
      style={{ justifyContent: atRight ? "flex-start" : "flex-end" }}
    >
      <motion.div
        ref={rootRef}
        layout
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative"
      >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="תפריט"
        className={`flex items-center gap-2 transition-colors duration-200 ${dark ? "text-white" : "text-black"}`}
      >
        <span className="font-body text-[15px] font-medium tracking-tight">תפריט</span>
        {/* Four squares. Drawn with a grid rather than four positioned boxes so
            the gap is one number and it stays square at any size. */}
        <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
          {[0, 1, 2, 3].map((square) => (
            <span key={square} className="block h-[6px] w-[6px] bg-current" />
          ))}
        </span>
      </button>

      {open && (
        // Always white on black text, on every section. The chrome inverts
        // because it sits directly on the page; a panel is its own surface and
        // inverting it too would make it flicker section to section.
        // Hangs off whichever edge the menu is currently standing on, so it
        // never opens off the side of the screen.
        <div
          className={`absolute top-[calc(100%+12px)] min-w-[176px] rounded-2xl bg-white py-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] ${atRight ? "right-0" : "left-0"}`}
        >
          {TARGETS.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => go(target)}
              className="block w-full px-5 py-2 text-right font-body text-[15px] text-black/70 transition-colors hover:text-black"
            >
              {target.label}
            </button>
          ))}

          <div className="mt-2 px-3 pb-1">
            <button
              type="button"
              onClick={() => go(CTA)}
              className="block w-full rounded-full bg-black px-5 py-2.5 text-center font-body text-[15px] font-medium text-white"
            >
              {CTA.label}
            </button>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}
