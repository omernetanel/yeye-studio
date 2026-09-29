"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether the middle of an element sits over a section that declares itself
 * dark (data-nav-dark="true") - the contract the logo and the menu use. For the
 * floating controls in the corner, whose labels flip to stay readable.
 */
export function useOverDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let frame: number | null = null;
    const check = () => {
      frame = null;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      let over = false;
      for (const section of document.querySelectorAll<HTMLElement>('[data-nav-dark="true"]')) {
        const r = section.getBoundingClientRect();
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
  }, [ref]);

  return dark;
}
