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
    <Link
      ref={rootRef}
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      // No clip and no crop. The file carries a real alpha channel now, so the
      // mark cuts its own shape — an earlier version was yuv420p with the
      // transparency checkerboard exported into the pixels, and this had to be
      // a circular mask with the artwork scaled up inside it to hide the
      // corners. None of that is needed against a file that is actually
      // transparent.
      className="fixed bottom-5 left-5 z-40 block h-[64px] w-[64px] transition-transform duration-200 ease-out hover:scale-[1.06] active:scale-100 md:bottom-7 md:left-7 md:h-[72px] md:w-[72px]"
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
  );
}
