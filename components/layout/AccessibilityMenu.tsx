"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resetA11yPrefs, setA11yPref, useA11yPrefs, type A11yPrefs } from "@/lib/a11y/preferences";
import { useOverDark } from "@/lib/use-over-dark";

/**
 * THE WHEELCHAIR SYMBOL, drawn rather than imported.
 *
 * lucide's Accessibility is the "active" mark - an abstract figure with its
 * limbs thrown out - and at 32 pixels it read as a shape rather than as the one
 * sign everyone already knows. This is the familiar seated figure.
 *
 * THE REVERSE OF THE WHATSAPP MARK BELOW IT, on purpose: that one is a dark
 * disc, this one is a light disc with a dark figure. Two dark discs stacked in
 * the same corner read as one object.
 *
 * IT DOES NOT SWITCH COLOUR. The WhatsApp mark inverts over a dark section
 * because it is a dark disc and would otherwise vanish into one; a light disc
 * has no such problem, and inverting it would take the white away exactly where
 * it is doing the work. So it stays as it is over every section.
 *
 * It fills its box edge to edge, so the disc IS the button: no ring, no border,
 * nothing that would make it a different size from the mark below it.
 */
function WheelchairMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#fff" />
      {/* CENTRED BY ARITHMETIC, NOT BY EYE. The figure's own extents, strokes
          included, run 13.1 to 51.3 across and 9.5 to 54.3 down, so its middle
          is (32.2, 31.9) and not the middle of the box. This group moves that
          point onto the disc's centre and shrinks the whole thing to 0.82, which
          is what keeps the head and the foot off the curve of the disc - at full
          size the glyph was 45 tall inside a circle whose inscribed square is
          about 45, and it crowded all four corners. */}
      <g transform="translate(32 32) scale(0.82) translate(-32.2 -31.9)">
        <g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
          {/* THE WHEEL, as a ring with one opening. Drawn as a dashed circle
              rather than as an arc: the dash is a length along the rim and the
              rotation is where it starts, so the opening can be placed by angle
              instead of by solving for two endpoints. Circumference here is
              2 x pi x 14.6 = 91.7; a 19.7 gap is about 77 degrees, and starting
              the dash at 22 degrees puts that gap from -55 to 22 - the top
              right, which is exactly where the body crosses the rim. */}
          <circle
            cx="29.6"
            cy="37.8"
            r="14.6"
            strokeWidth="3.8"
            strokeDasharray="72 19.7"
            transform="rotate(22 29.6 37.8)"
          />
          {/* Back, seat, leg and foot in one stroke, in the order the eye reads
              them: down from the shoulder, across the seat, down the shin, and a
              short foot pointing forward. */}
          <path d="M34.4 21.8 L30.2 34.4 L41.6 34.4 L45.8 46.4 L48.5 46.4" strokeWidth="5.6" />
        </g>
        <circle cx="36.8" cy="14.6" r="5.1" fill="#000" />
      </g>
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dark = useOverDark(buttonRef);

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
    // Above the WhatsApp mark, with the same gap from the edge, and the offset
    // is the mark's own height plus ten: 20 + 50 + 10 on a phone, 28 + 64 +
    // 12 on a desktop. z-40 for the same reason it has: over the page, under
    // the menu's own panel.
    <div ref={rootRef} className="group fixed bottom-[80px] left-5 z-40 md:bottom-[104px] md:left-7">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="הגדרות נגישות"
        // THE SAME CIRCLE AS THE WHATSAPP MARK, to the pixel: 50 on a phone, 64
        // on a desktop. It was 52/58, and since both are anchored to the same
        // left edge, the narrower one sat six pixels further right - two
        // floating buttons in one column that did not line up.
        // The disc is the artwork itself, so there is no border or padding to
        // make the drawn circle smaller than the box it is measured by.
        className="block h-[50px] w-[50px] rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out hover:scale-[1.06] active:scale-100 md:h-[64px] md:w-[64px]"
      >
        <WheelchairMark />
      </button>

      {/* The same label the WhatsApp mark carries, on the same side, with the
          same arming and the same flip: a floating circle with an icon in it
          says nothing about what pressing it does, and this is the one control
          on the page where guessing wrong costs the most. A black pill vanishes
          over a dark section, so over one it turns white with dark type. Its
          words are the panel's own title.
          Hidden while the panel is open - the panel says what the button was
          going to. */}
      {!open && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 left-full ml-3 -translate-x-1 -translate-y-1/2 rounded-full px-4 py-2 font-display text-[13px] leading-none font-medium whitespace-nowrap opacity-0 shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 ${
            dark ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          הגדרות נגישות
        </span>
      )}

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
