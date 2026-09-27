"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resetA11yPrefs, setA11yPref, useA11yPrefs, type A11yPrefs } from "@/lib/a11y/preferences";

/**
 * THE WHEELCHAIR SYMBOL, drawn rather than imported.
 *
 * lucide's Accessibility is the "active" mark - an abstract figure with its
 * limbs thrown out - and at 32 pixels it read as a shape rather than as the one
 * sign everyone already knows. This is the familiar seated figure on a blue
 * disc, which is what a visitor is looking for in that corner.
 *
 * It fills its box edge to edge, so the disc IS the button: no ring, no border,
 * nothing that would make it a different size from the mark below it.
 */
function WheelchairMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#1D3FA8" />
      {/* The head, then the back, seat and leg as one stroke, then the wheel
          behind them - the order the eye reads it in. */}
      <circle cx="38.6" cy="15.8" r="5.4" fill="#fff" />
      <path
        d="M35.6 24.2 L31.8 37.2 L43.4 37.2 L48.6 49.6"
        fill="none"
        stroke="#fff"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* An open ring: the gap at the top right is where the body crosses it,
          which is what keeps the two apart at this size. */}
      <path
        d="M41.2 27.6 A13.6 13.6 0 1 1 27.4 25.4"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The reader's own controls, in the corner they already look to.
 *
 * It sits directly above the WhatsApp mark, in the same size and the same
 * corner, because those two are the only floating things on the page and they
 * read as a pair rather than as clutter. What it offers is deliberately short:
 * three switches that actually change something here, and the statement that
 * says what the site can and cannot claim.
 *
 * WHAT IT IS NOT: a widget that overlays the site with its own styling, or a
 * substitute for building the page properly. The switches lean on CSS the site
 * already has and on the same reduced-motion path the operating system's own
 * setting uses.
 */

const SWITCHES: { key: keyof A11yPrefs; label: string; hint: string }[] = [
  { key: "contrast", label: "ניגודיות גבוהה", hint: "מכהה את הטקסטים הקטנים" },
  { key: "motion", label: "הפחתת תנועה", hint: "עוצר אנימציות ותנועה בגלילה" },
  { key: "links", label: "הדגשת קישורים", hint: "קו תחתון לכל קישור" },
];

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const prefs = useA11yPrefs();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
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

  useEffect(() => {
    if (open) panelRef.current?.querySelector("button")?.focus();
  }, [open]);

  return (
    // Above the WhatsApp mark, which stands 64px tall on a phone and 72 above
    // it, with the same gap from the edge. z-40 for the same reason it has:
    // over the page, under the menu's own panel.
    <div ref={rootRef} className="fixed bottom-[96px] left-5 z-40 md:bottom-[112px] md:left-7">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="הגדרות נגישות"
        // THE SAME CIRCLE AS THE WHATSAPP MARK, to the pixel: 64 on a phone, 72
        // on a desktop. It was 52/58, and since both are anchored to the same
        // left edge, the narrower one sat six pixels further right - two
        // floating buttons in one column that did not line up.
        // The disc is the artwork itself, so there is no border or padding to
        // make the drawn circle smaller than the box it is measured by.
        className="block h-[64px] w-[64px] rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out hover:scale-[1.06] active:scale-100 md:h-[72px] md:w-[72px]"
      >
        <WheelchairMark />
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          className="absolute bottom-[calc(100%+12px)] left-0 w-[260px] rounded-2xl bg-white p-4 text-right shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/10"
        >
          <p className="mb-3 font-display text-[15px] font-bold text-black">הגדרות נגישות</p>

          <div className="flex flex-col gap-1">
            {SWITCHES.map((item) => {
              const on = prefs[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => setA11yPref(item.key, !on)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl px-2 py-2 text-right transition-colors hover:bg-black/[0.04]"
                >
                  <span className="mt-[3px] flex h-[18px] w-[32px] shrink-0 items-center rounded-full bg-black/15 px-[2px] transition-colors data-[on=true]:bg-black" data-on={on}>
                    <span
                      className="block h-[14px] w-[14px] rounded-full bg-white transition-transform duration-200"
                      style={{ transform: on ? "translateX(-14px)" : "translateX(0)" }}
                    />
                  </span>
                  <span className="flex-1">
                    <span className="block font-body text-[14px] text-black">{item.label}</span>
                    {/* Halfway between where this started (/70) and where it
                        briefly went (/80). At 12px the hint was the hardest line
                        in the panel to read, and this is the panel someone opens
                        because reading is hard - but /80 made the whole panel
                        feel heavy and pulled the hint level with its label.
                        Still clearly short of the black above it. */}
                    <span className="block font-body text-[12px] text-black/75">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
            <button
              type="button"
              onClick={resetA11yPrefs}
              className="rounded-full px-3 py-1.5 font-body text-[13px] text-black/60 transition-colors hover:text-black"
            >
              איפוס
            </button>
            <Link
              href="/accessibility"
              className="rounded-full px-3 py-1.5 font-body text-[13px] text-black underline underline-offset-4"
            >
              הצהרת נגישות
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
