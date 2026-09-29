"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLenis } from "@/lib/motion/lenis";
import { useDocked } from "@/lib/motion/heroDock";
import { useIsMobile } from "@/lib/use-mobile";
import { useChromePaintedByHero } from "@/lib/motion/chromeBackdrop";
import { ALL_TARGETS, CTA, TARGETS, destinationOf, type HashTarget } from "@/lib/nav/hash-targets";

/**
 * THE HARD PART OF THIS MENU IS NOT THE MENU — it is where each link lands, and
 * that now lives in lib/nav/hash-targets.ts, which both this and the scroll
 * provider read. What is left here is the travel: a click is a journey with a
 * duration, where an arrival is a placement, and the provider owns arrivals.
 */

const HOVER_CLOSE_MS = 220;

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // WHILE THE HERO IS ON SCREEN IT PAINTS THIS BUTTON ITSELF, on a layer inside
  // its own shader, so that the ink inverts it pixel for pixel exactly as it
  // does the wordmark and the hero's CTAs. The real element stays here and
  // stays clickable; only its ink goes transparent, or the two would show at
  // once. See lib/motion/chromeBackdrop for what was tried before this.
  //
  // Everywhere else the old contract holds: a section declares itself dark and
  // the button turns white over it.
  const heroPaints = useChromePaintedByHero();

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

  // OPENED FROM THE KEYBOARD, THE FIRST ITEM TAKES THE FOCUS, and Escape hands
  // it back to the button. Without this the panel opened somewhere behind the
  // reader: the next Tab went to whatever followed the button in the document,
  // not into the menu that had just appeared.
  //
  // Only when the pointer is not the one doing the opening — a mouse hovering
  // the corner should not steal focus from what someone is reading.
  useEffect(() => {
    if (!open || hoveringRef.current) return;
    panelRef.current?.querySelector("button")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
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

  const go = (target: HashTarget) => {
    setOpen(false);
    const to = destinationOf(target);
    if (to === null) return;
    // Through Lenis, never around it: a native smooth scroll would run its own
    // easing alongside Lenis's and the two would fight the whole way down.
    if (lenis) lenis.scrollTo(to, { duration: 1.6 });
    else window.scrollTo({ top: to, behavior: "smooth" });
  };

  // EVERY hash link on the page travels the way the menu's own do, not just the
  // menu's buttons. The hero's "my work" and "book a meeting" are plain links
  // to /#projects and /#cta, and a plain hash jump drops the reader on the
  // first frame of a pinned run — the frame that means nothing. Captured on the
  // document so it runs before the link's own navigation, which stands down
  // when the event is already handled.
  //
  // ARRIVING with a hash is not handled here any more: that is a placement, not
  // a journey, and the scroll provider does it for every route in one place.
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

    return () => {
      document.removeEventListener("click", onClick, true);
    };
    // go reads lenis, which is the dep; it is recreated each render and listing
    // it would re-arm this on every one. The layout is no longer among them:
    // destinationOf asks the window itself at the moment of the click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, lenis]);

  // The targets only exist on the home page.
  if (pathname !== "/") return null;


  const trigger = (
    <button
      type="button"
      // Under a hovering mouse the menu is already open, and a click that
      // toggled would close it under the pointer that opened it.
      onClick={() => setOpen((value) => (hoveringRef.current ? true : !value))}
      aria-expanded={open}
      aria-controls="nav-menu-panel"
      aria-label="תפריט"
      // What the hero measures, copies and repaints on its own layer.
      data-chrome-paint
      // No colour transition until the hero is behind the reader: there the
      // button and the hero's copy of it hand over every time a scroll starts
      // and stops, and a 200ms fade between them left the menu half gone.
      className={`flex items-center gap-2 ${docked ? "transition-colors duration-200" : ""} ${
        heroPaints ? "text-transparent" : dark ? "text-white" : "text-black"
      }`}
    >
      <span data-chrome-label className="font-body text-[15px] font-medium tracking-tight">
        תפריט
      </span>
      {/* Four squares. Drawn with a grid rather than four positioned boxes so
          the gap is one number and it stays square at any size. bg-current, so
          they go transparent with the label when the hero takes over. */}
      <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((square) => (
          <span key={square} data-chrome-square className="block h-[6px] w-[6px] bg-current" />
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
      // 20px on a phone, 22 above it. The phone's opening screen puts its line
      // right beside this row (the hero's pt-[18px]), and the two move as one.
      // Must match the logo's own offset in Navbar — they are one row.
      //
      // THE BLEND GOES HERE, ON THE FIXED RAIL, and not on the button inside
      // it. This element is fixed with a z-index, so it is a stacking context
      // of its own: a blend declared on anything INSIDE it mixes only with the
      // rail's own contents, which is nothing. Declared on the rail, it mixes
      // with the context the rail sits in — the page wrapper that also holds
      // the hero's canvas and every dark section. That is the difference
      // between this working and the earlier attempt that "did nothing".
      className="pointer-events-none fixed inset-x-6 top-[20px] z-50 flex md:top-[22px]"
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
      <motion.div
        ref={rootRef}
        layout
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative"
        // Opens on hover with a mouse, and still on a click or a tap. The close
        // waits a moment, so crossing the gap between the button and the panel
        // does not shut it on the way.
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
      >
        {trigger}
      </motion.div>

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
          id="nav-menu-panel"
          data-nav-panel
          ref={panelRef}
          role="menu"
          aria-label="ניווט באתר"
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          className={`fixed top-[60px] z-50 min-w-[176px] rounded-2xl bg-white py-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] md:top-[62px] ${
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
