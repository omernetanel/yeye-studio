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
// `at` per layout where the phone's section is built differently from the
// desktop's and the same fraction lands somewhere else in it.
type Target = { label: string; id: string; at: number | { desktop: number; mobile: number } };

const TARGETS: Target[] = [
  { label: "הבית", id: "hero", at: 0 },
  // The services themselves — the heading and the list, which is what the
  // label promises. Further in is the process, which is a different section in
  // all but markup.
  { label: "מה אני עושה", id: "services", at: 0 },
  // Past the greeting and the portrait's arrival, on the three claims. The
  // phone's claims are cards under the portrait, further down its section:
  // 0.42 there stopped on the paragraphs above them.
  { label: "מי אני", id: "about", at: { desktop: 0.42, mobile: 0.56 } },
  // After the heading has settled and the arc is up. 0.75 on desktop because
  // the section runs on past its pin — the button under the arc — and 0.94 of
  // the whole of it carried the heading off the top of the screen. The phone's
  // section is not pinned: its top is where the heading is already settled.
  { label: "פרויקטים", id: "projects", at: { desktop: 0.75, mobile: 0 } },
];

// The contact stage is deliberately absent: it is a section you arrive at by
// reading, not one you jump into. The way to it from here is the CTA below —
// and every "contact" link on the page lands there too.
const CTA: Target = { label: "בואו נדבר", id: "cta", at: 0 };
const ALL_TARGETS = [...TARGETS, CTA];

const HOVER_CLOSE_MS = 220;

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoveringRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
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

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // The panel is a sibling of the button rather than a child of it, so
      // "outside" has to mean outside both of them.
      if (rootRef.current?.contains(target)) return;
      if (document.querySelector("[data-nav-panel]")?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // WITH A MOUSE THE MENU OPENS ON HOVER, on the button or on the panel; a tap
  // has no hover, so on a phone it is the click below that opens it. The close
  // waits a moment, because the pointer leaves the button before it reaches the
  // panel and the gap between them is not "outside".
  const hoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    hoveringRef.current = true;
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setOpen(true);
  };

  const hoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    hoveringRef.current = false;
    closeTimerRef.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };

  const go = (target: Target, immediate = false) => {
    setOpen(false);
    const section = document.getElementById(target.id);
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    // Zero for a section that is not pinned, so this one line serves both.
    const run = Math.max(0, section.offsetHeight - window.innerHeight);
    const at = typeof target.at === "number" ? target.at : isMobile ? target.at.mobile : target.at.desktop;
    const to = top + run * at;
    // Through Lenis, never around it: a native smooth scroll would run its own
    // easing alongside Lenis's and the two would fight the whole way down.
    if (lenis) lenis.scrollTo(to, immediate ? { immediate: true } : { duration: 1.6 });
    else window.scrollTo({ top: to, behavior: immediate ? "instant" : "smooth" });
  };

  // EVERY hash link on the page lands where the menu would, not just the
  // menu's own buttons. The hero's "my work" and "book a meeting" are plain
  // links to /#projects and /#cta, and a plain hash jump drops the reader on
  // the first frame of a pinned run — the frame that means nothing, see above.
  // Captured on the document so it runs before the link's own navigation, which
  // stands down when the event is already handled.
  //
  // And arriving from another page with a hash does the same, once.
  useEffect(() => {
    if (pathname !== "/") return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = (event.target as Element | null)?.closest?.("a[href]")?.getAttribute("href");
      const target = href && ALL_TARGETS.find((t) => href === `/#${t.id}` || href === `#${t.id}`);
      if (!target) return;
      event.preventDefault();
      go(target);
    };
    document.addEventListener("click", onClick, true);

    const arrived = ALL_TARGETS.find((t) => window.location.hash === `#${t.id}`);
    const frame = arrived ? requestAnimationFrame(() => go(arrived, true)) : null;

    return () => {
      document.removeEventListener("click", onClick, true);
      if (frame !== null) cancelAnimationFrame(frame);
    };
    // go reads lenis and isMobile, which are the deps; it is recreated each
    // render and listing it would re-arm this on every one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, lenis, isMobile]);

  // The targets only exist on the home page.
  if (pathname !== "/") return null;

  // Desktop inverts itself against the page; the phone keeps the two-colour
  // switch, because there the button is inside a box that moves.
  const blend = !isMobile;

  const trigger = (
    <button
      type="button"
      // Under a hovering mouse the menu is already open, and a click that
      // toggled would close it under the pointer that opened it.
      onClick={() => setOpen((value) => (hoveringRef.current ? true : !value))}
      aria-expanded={open}
      aria-label="תפריט"
      // White, and nothing else: the rail above does the inverting. A second
      // blend here would only mix with the rail's own empty box.
      className={`flex items-center gap-2 ${
        blend ? "text-white" : `transition-colors duration-200 ${dark ? "text-white" : "text-black"}`
      }`}
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
  );

  return (
    // The rail spans both margins; the menu is placed inside it and crosses
    // from one end to the other. `justify-end` is the LEFT under RTL — that
    // reversal has caused three separate bugs on this site, so it is worth
    // saying out loud rather than reading it as English.
    // A layout animation rather than an animated `left`: framer measures where
    // the block ended up and tweens it there, so the same code works whatever
    // the button's width or the viewport's, and nothing has to be computed.
    <>
    <div
      // 42px on a phone, 22 above it. The phone's opening screen puts its line
      // right beside this row, and nearer the top the pair sat pressed against
      // the edge of the glass. Must match the logo's own offset in Navbar — they
      // are one row.
      //
      // THE BLEND GOES HERE, ON THE FIXED RAIL, and not on the button inside
      // it. This element is fixed with a z-index, so it is a stacking context
      // of its own: a blend declared on anything INSIDE it mixes only with the
      // rail's own contents, which is nothing. Declared on the rail, it mixes
      // with the context the rail sits in — the page wrapper that also holds
      // the hero's canvas and every dark section. That is the difference
      // between this working and the earlier attempt that "did nothing".
      className={`pointer-events-none fixed inset-x-6 top-[42px] z-50 flex md:top-[22px] ${
        blend ? "mix-blend-difference" : ""
      }`}
      style={{ justifyContent: atRight ? "flex-start" : "flex-end" }}
    >
      {/* ON DESKTOP THE BUTTON IS NOT WRAPPED IN AN ANIMATED BOX, AND THAT IS
          WHAT MAKES THE BLEND WORK. `mix-blend-mode: difference` mixes with
          whatever is painted in the nearest stacking context, and a transform —
          which is what the layout animation puts on the wrapper — opens a new
          one. Wrapped, the button was blending against an empty box and looked
          like it was doing nothing at all, which is how this ended up being
          written off as "blending does not work over a canvas". It does: white
          type in difference comes out black on the white page, white inside the
          ink, and white over the black sections, pixel for pixel and with no
          state to track.
          The phone keeps the wrapper, because there the button really does
          cross the header from one side to the other as the mark docks. */}
      {blend ? (
        <div
          ref={rootRef}
          className="pointer-events-auto relative"
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
        >
          {trigger}
        </div>
      ) : (
        <motion.div
          ref={rootRef}
          layout
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto relative"
          // Opens on hover with a mouse, and still on a click or a tap. The
          // close waits a moment, so crossing the gap between the button and
          // the panel does not shut it on the way.
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
        >
          {trigger}
        </motion.div>
      )}

      </div>

      {/* THE PANEL IS A SIBLING OF THE RAIL, not a child of it, and on desktop
          that is not a preference: the rail is a blend layer, and a white sheet
          inside it would invert along with it. It is its own surface, so it
          hangs off the same corner by its own fixed position instead.
          Always white with black text, on every section — the chrome inverts
          because it sits directly on the page; a panel that inverted too would
          flicker section to section. */}
      {open && (
        <div
          data-nav-panel
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          className={`fixed top-[82px] z-50 min-w-[176px] rounded-2xl bg-white py-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] md:top-[62px] ${
            atRight ? "right-6" : "left-6"
          }`}
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
    </>
  );
}
