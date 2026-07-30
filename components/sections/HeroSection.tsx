"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import FluidInkReveal from "@/components/sections/hero/FluidInkReveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { setDocked } from "@/lib/motion/heroDock";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

const TAGLINE_TEXT = "בואו נבנה לכם אתר שעובד ומוכר באמת.";
const TYPEWRITER_START_DELAY_MS = 500;
const TYPEWRITER_CHAR_MS = 45;

// Reveals `text` one character at a time, in plain logical (string) order.
// The page is globally dir="rtl" (see app/layout.tsx), so the browser's own
// bidi rendering already grows Hebrew text from the right edge toward the
// left as characters are appended — no manual reversal needed here.
function useTypewriter(text: string, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), count === 0 ? TYPEWRITER_START_DELAY_MS : TYPEWRITER_CHAR_MS);
    return () => clearTimeout(id);
  }, [active, count, text.length]);

  return { visible: text.slice(0, count), done: count >= text.length };
}

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { visible: typedTagline, done: taglineTypingDone } = useTypewriter(TAGLINE_TEXT, !prefersReducedMotion);
  const sectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const bottomLabelRef = useRef<HTMLSpanElement>(null);
  // logoAreaRef is the flex-1/min-h-0 space left over once the tagline and
  // the CTA row have taken what they need; logoSlotRef is the actual
  // (cropped-view) logo box, explicitly sized in JS below to fit inside
  // that space at its correct aspect ratio. A plain CSS aspect-ratio box
  // sized by width alone (the previous approach) has no ceiling on the
  // resulting height, so on wide-but-short viewports (a common laptop
  // window, not just a phone) it could grow taller than the space actually
  // left for it and push the CTA button below the Hero's own bottom edge,
  // clipped invisibly by the section's overflow-hidden.
  const logoAreaRef = useRef<HTMLDivElement>(null);
  const logoSlotRef = useRef<HTMLDivElement>(null);

  // The Navbar's own mark stays hidden while the Hero itself is on screen
  // (nothing to dock against yet), and crossfades in once the Hero has
  // mostly scrolled past — a plain visibility check, not a scroll-position
  // pin/release calculation like the old build had, since this Hero no
  // longer pins or shrinks at all.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => setDocked(entry.intersectionRatio < 0.35), {
      threshold: [0, 0.35, 1],
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Sizes the logo box to fit fully inside whatever space logoAreaRef
  // actually has left (after the tagline and CTA take theirs), the same
  // "shrink to fit both dimensions, preserving aspect ratio" behavior
  // object-fit: contain gives an <img> for free — but logoAreaRef isn't a
  // replaced element, so it's done by hand: prefer full width, and only
  // fall back to fitting by height when that would overflow.
  useEffect(() => {
    const area = logoAreaRef.current;
    const slot = logoSlotRef.current;
    if (!area || !slot) return;
    const CROPPED_ASPECT = 2940 / 8200; // height/width of the visible (post-crop) box

    const resize = () => {
      const rect = area.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      let width = rect.width;
      let height = width * CROPPED_ASPECT;
      if (height > rect.height) {
        height = rect.height;
        width = height / CROPPED_ASPECT;
      }
      slot.style.width = `${width}px`;
      slot.style.height = `${height}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(area);
    return () => ro.disconnect();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="hero" className="relative flex flex-col overflow-hidden bg-white">
      <div className="relative flex h-screen min-h-[640px] flex-col pt-[100px] pb-4">
        {/* The wordmark is pixels (drawn into a canvas, see FluidInkReveal),
            so a real, visually-hidden heading carries the actual text for
            screen readers and search engines. */}
        <h1 className="sr-only">YEYE</h1>

        {prefersReducedMotion ? (
        <>
          <div className="mx-auto mt-4 w-full max-w-[1400px] px-6">
            <div className="flex flex-col items-start text-right">
              <p aria-label={TAGLINE_TEXT} className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl">
                <span aria-hidden="true">{TAGLINE_TEXT}</span>
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-start px-3">
            <div ref={logoAreaRef} className="relative min-h-0 w-full flex-1 select-none px-0 pt-[24px] sm:px-2">
              {/* logo.png has a ~16% blank margin baked in above the
                  lettering (the fluid sim's own breathing room in the
                  non-reduced-motion build). Cropping to the bottom 84% via
                  overflow-hidden + an oversized, shifted-up absolute inner
                  box removes that margin from the visible box without
                  distorting the artwork. logoSlotRef's own width/height are
                  set explicitly in JS (see the effect above) instead of a
                  plain CSS aspect-ratio, so the box shrinks to fit both the
                  available width AND height — a fixed aspect-ratio is only
                  ever driven by width, with no ceiling on the resulting
                  height, which could grow past what's actually free on a
                  wide-but-short viewport (a normal laptop window, not just
                  a phone) and get clipped by the section's own
                  overflow-hidden together with the CTA button below it. */}
              <div ref={logoSlotRef} className="relative mx-auto overflow-hidden">
                <div className="absolute inset-x-0" style={{ top: "-19.0476%", height: "119.0476%" }}>
                  {/* logo.png's opaque pixels are white (a solid-fill wordmark on
                      transparent, not baked black) — brightness(0) recolors them
                      to black, same as FluidInkReveal's own canvas draw does. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logo.png"
                    alt="YEYE"
                    className="h-full w-full object-contain"
                    style={{ filter: "brightness(0)" }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center md:mt-10">
              <Button href="/#projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg">
                צפו בעבודות שלי
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* The ink canvas spans the WHOLE section now — the Navbar's own
              breathing room above the tagline, down through the tagline,
              the logo, the CTA button, and the bottom social/label row, all
              the way to the section's own bottom edge — so there's no flat,
              uncovered strip of plain white page anywhere in the Hero.
              -top-[100px] pulls it up to the section's own top edge
              (matching the section's own pt-[100px] exactly, not a value
              derived from the Navbar's current height) — safe since the
              Navbar is fixed, opaque, and stacked above everything else
              regardless. bottom-0 here is relative to the SECTION itself
              (this is now a direct child of it), so it reaches the section's
              own bottom edge rather than stopping at the flex column above
              the label row. It's the bottom-most layer (first in DOM, no
              z-index): the tagline, logo-slot, and bottom-row containers
              below get pointer-events-none, and so does the shared flex
              column wrapping the tagline/logo/CTA (a hover landing in that
              wrapper's own box but outside either child — e.g. anywhere
              below the logo — would otherwise be silently swallowed by the
              wrapper itself instead of reaching this element), so a hover
              anywhere over the wordmark, the tagline text, the bottom label,
              or the empty space around any of them still reaches this
              element and splats. The CTA button and the two contact icons
              opt back in with pointer-events-auto so they keep default
              handling and a real stacking position — on top, fully
              clickable, genuinely unaffected by the ink rather than merely
              visually covered by it. */}
          <div className="absolute inset-x-0 bottom-0 -top-[100px] overflow-hidden">
            <FluidInkReveal
              logoSrc="/images/logo.png"
              videoSrc="/videos/herovid-loop.mp4"
              taglineText={typedTagline}
              taglineElRef={taglineRef}
              logoSlotRef={logoSlotRef}
              bottomLabelElRef={bottomLabelRef}
              className="relative h-full w-full select-none"
            />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
            <div className="relative z-10 mx-auto mt-4 w-full max-w-[1400px] px-6 pointer-events-none">
              <div className="flex flex-col items-start text-right">
                {/* Real text, kept in the DOM for accessibility/SEO and as the
                    layout/font source FluidInkReveal measures from — but
                    visually transparent, since the canvas draws the glyphs
                    itself so they can invert under the ink. */}
                <p
                  ref={taglineRef}
                  aria-label={TAGLINE_TEXT}
                  className="font-display text-2xl leading-snug font-semibold md:text-4xl"
                  style={{ color: "transparent" }}
                >
                  <span aria-hidden="true">
                    {typedTagline}
                    {!taglineTypingDone && (
                      <span className="ml-0.5 inline-block h-[0.85em] w-[2px] -translate-y-[0.05em] animate-pulse bg-black align-middle" />
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-start px-3 pointer-events-none">
              {/* Invisible spacer marking exactly where the (cropped) logo
                  sits — same box a static <img> would need, just with
                  nothing drawn here; FluidInkReveal measures it and paints
                  the actual pixels on the canvas behind. logoSlotRef's own
                  width/height are set explicitly in JS (see the effect
                  above), not a plain CSS aspect-ratio, so it shrinks to fit
                  both the available width AND height instead of only ever
                  being driven by width. */}
              <div ref={logoAreaRef} className="relative min-h-0 w-full flex-1 select-none px-0 pt-[24px] sm:px-2">
                <div ref={logoSlotRef} className="relative mx-auto" />
              </div>

              <div className="pointer-events-auto mt-6 flex justify-center md:mt-10">
                <Button href="/#projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg">
                  צפו בעבודות שלי
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={
          prefersReducedMotion
            ? "mx-auto flex w-full max-w-[1400px] items-center justify-between px-6"
            : "relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 pointer-events-none"
        }
      >
        {/* Same treatment as the tagline above: real text stays in the DOM
            for accessibility, but turns transparent once the ink canvas is
            active so FluidInkReveal can draw and invert the glyphs itself
            instead of a plain translucent label going unreadable once the
            black backdrop shows through behind it. */}
        <span
          ref={bottomLabelRef}
          className="font-display text-[13px] text-black/50"
          style={prefersReducedMotion ? undefined : { color: "transparent" }}
        >
          סטודיו דיגיטלי עצמאי
        </span>

        <div className={prefersReducedMotion ? "flex items-center gap-4" : "pointer-events-auto flex items-center gap-4"}>
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-black/50 transition-colors hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
          <Link href={`mailto:${CONTACT_EMAIL}`} aria-label="Email" className="text-black/50 transition-colors hover:text-black">
            <Mail size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
      </div>

      {/* Plain extra breathing room after the Hero's own (full-viewport,
          ink-covered) content — not part of the h-screen block above, so
          the ink canvas (bounded to that block, see its -top-[100px]/
          bottom-0 positioning) never extends into it. */}
      <div aria-hidden="true" className="h-[150px] w-full shrink-0 bg-white" />
    </section>
  );
}
