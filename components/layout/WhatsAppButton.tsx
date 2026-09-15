"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const WHATSAPP_NUMBER = "972552434775";

/**
 * The one thing on the page that is always reachable.
 *
 * Bottom LEFT, opposite the corner the menu and the mark share at the top
 * right — a floating control in the same corner as the header's would read as
 * part of it, and this is not chrome, it is a way out of the page at any point
 * in it.
 *
 * z-40 rather than the menu's z-50: it should sit over the sections, and under
 * the menu's panel when that is open.
 */
export default function WhatsAppButton() {
  const [dark, setDark] = useState(false);
  // Held back until the hero is behind the reader. Two reasons, and the second
  // is the one that forced it: the opening screen is a wordmark, one sentence
  // and one button, and a floating circle in the corner of it is a fourth thing
  // competing with three — and on a phone it landed directly on the studio line
  // at the foot, which is the one place on the page where the layout has no
  // room to give. Everything after the hero has margins it can spare.
  const [past, setPast] = useState(false);
  const rootRef = useRef<HTMLAnchorElement>(null);

  // Same contract the logo and the menu use: a section declares itself dark
  // behind the chrome with data-nav-dark, and anything floating over it asks
  // whether one of those is under its own corner.
  useEffect(() => {
    let frame: number | null = null;
    const check = () => {
      frame = null;
      const root = rootRef.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;

      // Its own rect is what the colour check below reads, so it is never taken
      // out of the layout — only made invisible and untouchable. "Left the
      // hero" is the hero's last pixel clearing the top of the screen; with no
      // hero on the page at all (the sub-pages) there is nothing to wait for.
      const hero = document.getElementById("hero");
      setPast(!hero || hero.getBoundingClientRect().bottom <= 0);

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
  }, []);

  return (
    // The wrapper carries the corner and the arrival; the link inside carries
    // only its own size. Keeping them apart is what lets the label sit beside
    // the mark without being scaled by the mark's own hover.
    <div
      className={`group fixed bottom-5 left-5 z-40 transition-[opacity,transform] duration-300 ease-out md:bottom-7 md:left-7 ${
        past ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Link
        ref={rootRef}
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        aria-hidden={!past}
        tabIndex={past ? undefined : -1}
        // No clip and no crop. The file carries a real alpha channel now, so the
        // mark cuts its own shape — an earlier version was yuv420p with the
        // transparency checkerboard exported into the pixels, and this had to be
        // a circular mask with the artwork scaled up inside it to hide the
        // corners. None of that is needed against a file that is actually
        // transparent.
        className="block h-[64px] w-[64px] transition-transform duration-200 ease-out group-hover:scale-[1.06] active:scale-100 md:h-[72px] md:w-[72px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/whatsapplogo.webp"
          alt=""
          aria-hidden="true"
          // Inverted over anything dark: the mark is a black disc, which on black
          // is nothing at all. Inverting turns the disc white and the glyph dark
          // — the same mark reading the other way round, rather than a second
          // asset to keep in step with the first.
          className={`h-full w-full object-contain transition-[filter] duration-200 ${
            dark ? "invert" : ""
          }`}
          draggable={false}
        />
      </Link>

      {/* To the RIGHT of the mark, because the mark is in the left corner and
          there is nowhere else for it to go. Absolute rather than a flex
          sibling: in flow it would widen the wrapper, and the wrapper is what
          `group-hover` is measured against — the label would then arm itself
          from empty air beside the button.
          It follows the same inversion as the mark. A black pill is the right
          note against a white page and invisible against a dark section, so
          over one it turns white with dark type, which is the same object seen
          the other way round. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 rounded-full px-4 py-2 font-display text-[13px] leading-none font-medium whitespace-nowrap opacity-0 shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 ${
          dark ? "bg-white text-black" : "bg-black text-white"
        } -translate-x-1`}
      >
        לחצו לדבר איתי בוואטסאפ
      </span>
    </div>
  );
}
