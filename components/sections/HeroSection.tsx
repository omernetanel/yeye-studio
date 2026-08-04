"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import FluidInkReveal from "@/components/sections/hero/FluidInkReveal";
import ArrowIcon from "@/components/ui/ArrowIcon";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { setDocked } from "@/lib/motion/heroDock";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

const TAGLINE_TEXT = "בואו נבנה לכם אתר שעובד ומוכר באמת.";

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
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
  // The two Hero CTAs are painted onto the ink's paper layer rather than
  // rendered as ordinary DOM, so the ink can wash over them the same way it
  // does the wordmark and the tagline. The DOM elements stay in place —
  // real links, real hit areas, keyboard focusable — but are visually
  // transparent; these refs are what the canvas measures to know where to
  // paint each box, its label, and its arrow.
  const ctaPrimaryRef = useRef<HTMLAnchorElement>(null);
  const ctaPrimaryLabelRef = useRef<HTMLSpanElement>(null);
  const ctaPrimaryArrowRef = useRef<HTMLSpanElement>(null);
  const ctaSecondaryRef = useRef<HTMLAnchorElement>(null);
  const ctaSecondaryLabelRef = useRef<HTMLSpanElement>(null);
  const ctaSecondaryArrowRef = useRef<HTMLSpanElement>(null);

  const ctas = [
    {
      ref: ctaPrimaryRef,
      labelRef: ctaPrimaryLabelRef,
      arrowRef: ctaPrimaryArrowRef,
      fill: "#ffffff",
      textColor: "#000000",
      borderColor: "#000000",
    },
    {
      ref: ctaSecondaryRef,
      labelRef: ctaSecondaryLabelRef,
      arrowRef: ctaSecondaryArrowRef,
      fill: "#000000",
      textColor: "#ffffff",
      borderColor: "#000000",
    },
  ];

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
    const CROPPED_ASPECT = 2434 / 8200; // height/width of the visible (post-crop) box
    // Applied AFTER the fit below, so the mark reads a touch smaller than
    // the space it's given without ever being able to overflow it — the
    // fit already guarantees it fits, and scaling both axes by the same
    // factor keeps the aspect ratio and the centring intact.
    // On mobile the mark and the button beneath it share one column and have to
    // line up on the same two edges, so it fills its box exactly.
    const LOGO_FIT_SCALE = isMobile ? 1 : 0.96;
    // A flat trim off the fitted width, not another ratio: a ratio would
    // take a different number of pixels off at every viewport, and this is
    // meant to be exactly 10px wherever it renders.
    const LOGO_TRIM_PX = isMobile ? 0 : 10;

    const resize = () => {
      const rect = area.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      let width = rect.width;
      let height = width * CROPPED_ASPECT;
      if (height > rect.height) {
        height = rect.height;
        width = height / CROPPED_ASPECT;
      }
      // Height is derived from the final width rather than trimmed on its
      // own, so the aspect ratio survives the trim exactly.
      const finalWidth = Math.max(0, width * LOGO_FIT_SCALE - LOGO_TRIM_PX);
      slot.style.width = `${finalWidth}px`;
      slot.style.height = `${finalWidth * CROPPED_ASPECT}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(area);
    return () => ro.disconnect();
  }, [prefersReducedMotion, isMobile]);

  // Mobile gets its own arrangement rather than the desktop one squeezed down.
  // One screen, three anchored blocks — line at the top, wordmark in the middle,
  // actions and studio line at the bottom — with the wordmark and the button
  // sharing the column's exact width so the whole thing lines up on two edges.
  // 100svh — the SMALL viewport height, which is the height with the browser
  // chrome showing and, crucially, a constant. 100vh is too tall (it puts the
  // bottom row under the address bar) and 100dvh, which was here first, is
  // worse: it tracks the chrome hiding and showing as you scroll, so the hero
  // resized on every scroll and the ink simulation was rebuilt each time —
  // which is what made the white flicker and show the clip underneath.
  if (isMobile) {
    return (
      <section ref={sectionRef} id="hero" className="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-white">
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden">
            {/* No taglineElRef on mobile: the canvas is capped at 2x device
                pixels, and a phone runs at 3x — so canvas-painted text is drawn
                at 2x and stretched to 3x, which is the soft, doubled-looking
                edge. The line is rendered as ordinary black text instead, which
                the device draws at its own density. Only the wordmark still
                comes from the canvas, because the ink has to reveal it. */}
            <FluidInkReveal
              logoSrc="/images/logo.png"
              videoSrc="/videos/herobg.mp4"
              taglineText=""
              logoSlotRef={logoSlotRef}
              className="relative h-full w-full select-none"
            />
          </div>
        )}

        {/* pointer-events-none so a touch anywhere in the empty space still
            reaches the ink canvas underneath; the controls opt back in. */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col px-6 pt-[72px] pb-8">
          <h1 className="sr-only">YEYE</h1>

          {/* 18px, not 19: at 19 the line measures 343px against 342 available,
              so it wrapped by a single pixel — which is the break that had no
              business being there. No text-balance either; balancing a line
              that now fits would only split it again. */}
          <p className="text-right font-display text-[18px] leading-[1.4] font-semibold whitespace-nowrap text-black">
            {TAGLINE_TEXT}
          </p>

          <div ref={logoAreaRef} className="relative flex min-h-0 w-full flex-1 select-none items-center justify-center">
            {prefersReducedMotion ? (
              <div ref={logoSlotRef} className="relative mx-auto overflow-hidden">
                <div className="absolute inset-x-0" style={{ top: "-23.0074%", height: "143.7962%" }}>
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
            ) : (
              <div ref={logoSlotRef} className="relative mx-auto" />
            )}
          </div>

          {/* One real button, with the second route as a text link under it.
              Two buttons of equal weight split the attention and read as
              indecision; the studios this is modelled on all commit to one. */}
          <div className="pointer-events-auto flex w-full flex-col items-center" style={{ touchAction: "pan-y" }}>
            <Button
              href="/#contact"
              variant="primary"
              className="!border-black !bg-none !bg-black !shadow-none w-full justify-center py-4 text-[17px]"
            >
              קבעו פגישה
            </Button>
            <Link
              href="/#projects"
              className="mt-4 inline-flex items-center gap-2 font-display text-[15px] font-medium text-black/70"
            >
              העבודות שלי
              <ArrowIcon />
            </Link>
          </div>

          <span className="mt-7 text-center font-display text-[12px] text-black/45">סטודיו דיגיטלי עצמאי</span>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="hero" className="relative flex flex-col overflow-hidden bg-white">
      {!prefersReducedMotion && (
        // The ink canvas spans the WHOLE section — the Navbar's own
        // breathing room above the tagline, down through the tagline, the
        // logo, and the merged bottom row (label, CTA button, contact
        // icons, all now on one line — see that row's own comment) at the
        // very end. It does NOT extend past the section's own natural
        // height (unlike an earlier pass that appended extra blank
        // buffer past the bottom row) — see FluidInkReveal's own
        // INTERACTIVE_BOTTOM_MARGIN_PX for how "space to settle without
        // spreading past the Hero" is handled instead, entirely inside
        // the canvas's existing footprint. -top-[100px] pulls it up to
        // the section's own top edge (matching the h-screen block's own
        // pt-[48px] exactly, not a value derived from the Navbar's
        // current height) — the ink already covers the small strip
        // the Navbar's floating logo sits over too. bottom-0 is relative
        // to the section itself, reaching the bottom row's own bottom
        // edge, which is the section's true bottom edge too. It's the
        // bottom-most layer (first in DOM, no z-index): the h-screen
        // block and the bottom row both get pointer-events-none (and so
        // do their own interactive-adjacent containers), so a hover
        // anywhere over either — including their own "empty" gaps —
        // still reaches this element and splats, with pointer-events-auto
        // opted back in specifically on the CTA button and the two
        // contact icons so they stay genuinely, unaffectedly clickable.
        <div className="absolute inset-x-0 bottom-0 -top-[48px] overflow-hidden">
          <FluidInkReveal
            logoSrc="/images/logo.png"
            videoSrc="/videos/herobg.mp4"
            taglineText={TAGLINE_TEXT}
            taglineElRef={taglineRef}
            logoSlotRef={logoSlotRef}
            ctas={ctas}
            className="relative h-full w-full select-none"
          />
        </div>
      )}

      <div
        className={
          prefersReducedMotion
            ? "relative flex h-[calc(100vh-96px)] min-h-[544px] flex-col pt-[48px] pb-4"
            : "relative flex h-[calc(100vh-96px)] min-h-[544px] flex-col pt-[48px] pb-4 pointer-events-none"
        }
      >
        {/* The wordmark is pixels (drawn into a canvas, see FluidInkReveal),
            so a real, visually-hidden heading carries the actual text for
            screen readers and search engines. */}
        <h1 className="sr-only">YEYE</h1>

        {prefersReducedMotion ? (
          <div className="mx-auto mt-4 w-full max-w-[1400px] px-6">
            <div className="flex flex-col items-start text-right">
              <p className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl">{TAGLINE_TEXT}</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mx-auto mt-4 w-full max-w-[1400px] px-6 pointer-events-none">
            <div className="flex flex-col items-start text-right">
              {/* Real text, kept in the DOM for accessibility/SEO and as the
                  layout/font source FluidInkReveal measures from — but
                  visually transparent, since the canvas draws the glyphs
                  itself so they can invert under the ink. */}
              <p
                ref={taglineRef}
                className="font-display text-2xl leading-snug font-semibold md:text-4xl"
                style={{ color: "transparent" }}
              >
                {TAGLINE_TEXT}
              </p>
            </div>
          </div>
        )}

        {/* Logo gets this block's entire remaining height. The bottom row
            (label, CTAs, icons) lives in its own strip after this block
            rather than sharing this flex-1 column — but the block is sized
            to the viewport MINUS that strip's own height, so the two
            together come to exactly one screen and the buttons land above
            the fold with the logo instead of just below it. The 120px in
            that calc is the bottom strip's own h-[120px]; the two have to
            move together. That strip was trimmed from 150px because it was
            mostly dead air above its bottom-aligned content — cutting it
            closes the gap under the logo and hands the height back to the
            logo rather than to empty space. */}
        <div
          className={
            prefersReducedMotion
              ? "flex min-h-0 flex-1 flex-col items-center justify-start px-3"
              : "relative z-10 flex min-h-0 flex-1 flex-col items-center justify-start px-3 pointer-events-none"
          }
        >
          {/* Invisible spacer marking exactly where the (cropped) logo
              sits — same box a static <img> would need, just with nothing
              drawn here in the ink build; FluidInkReveal measures it and
              paints the actual pixels on the canvas behind. logoSlotRef's
              own width/height are set explicitly in JS (see the effect
              above), not a plain CSS aspect-ratio, so it shrinks to fit
              both the available width AND height instead of only ever
              being driven by width. */}
          {/* pt offsets this box so the mark lands optically centred between the
              tagline above and the buttons below, rather than centred in its
              own box — both reference points sit a fixed distance outside
              this box's own edges. */}
          <div ref={logoAreaRef} className="relative flex min-h-0 w-full flex-1 select-none items-center justify-center px-0 pt-[18px] sm:px-2">
            {prefersReducedMotion && (
              <div ref={logoSlotRef} className="relative mx-auto overflow-hidden">
                <div className="absolute inset-x-0" style={{ top: "-23.0074%", height: "143.7962%" }}>
                  {/* logo.png's opaque pixels are white (a solid-fill wordmark on
                      transparent, not baked black) — brightness(0) recolors them
                      to black, same as FluidInkReveal's own canvas draw does. logo.png
                      has a ~16% blank margin baked in above the lettering (the fluid
                      sim's own breathing room in the ink build) — cropping to the
                      bottom 84% via overflow-hidden + an oversized, shifted-up
                      absolute inner box removes that margin from the visible box
                      without distorting the artwork. */}
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
            )}
            {!prefersReducedMotion && <div ref={logoSlotRef} className="relative mx-auto" />}
          </div>
        </div>
      </div>

      {/* Bottom row — label, CTA button, and contact icons all on one
          line now (moved down from two separate rows), in its own strip
          well clear of the h-screen block above so it no longer competes
          with the logo for that block's height budget. The button sits
          absolutely centered (not flex-centered among the label/icons)
          so its position doesn't shift with their widths. items-end (not
          items-center) on both this row and the label/icons group, plus
          bottom-0 on the button's wrapper, lines up the label text and
          icons' bottom edges with the button's own bottom edge, rather
          than all three sharing a vertical center that made the visually
          taller button appear to hang lower than the label/icons. The ink
          canvas extends through this whole strip — it's the ink's actual
          stopping point — so this needs the same
          pointer-events-none-on-the-empty-space,
          pointer-events-auto-on-the-real-controls treatment as everything
          else the canvas passes under. */}
      <div
        className={
          prefersReducedMotion
            ? "flex h-[96px] w-full shrink-0 items-end pb-8"
            : "relative z-10 flex h-[96px] w-full shrink-0 items-end pb-8 pointer-events-none"
        }
      >
        <div className="relative mx-auto flex w-full max-w-[1400px] items-end justify-between px-6">
          <span className="font-display text-[13px] text-black/50">סטודיו דיגיטלי עצמאי</span>

          <div
            className={
              prefersReducedMotion
                ? "absolute inset-x-0 bottom-0 flex animate-fade-in justify-center"
                : "absolute inset-x-0 bottom-0 flex animate-fade-in justify-center pointer-events-auto"
            }
            style={{ animationDelay: "0.4s" }}
          >
            {prefersReducedMotion ? (
              <div className="flex items-center gap-3">
                <Button href="/#projects" variant="primary" className="!border !border-black !bg-none !bg-white !text-black !shadow-none px-10 py-4 text-lg">
                  העבודות שלי
                </Button>
                <Button href="/#contact" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg">
                  קבעו פגישה
                </Button>
              </div>
            ) : (
              /* Transparent on purpose — the canvas paints these. No scale or
                 shimmer here unlike the site's other buttons: the paper layer
                 only repaints on layout changes, so a per-frame hover effect
                 would either not show or cost a full repaint every mouse move.
                 The arrow's slide is the one exception, and it only needs a
                 repaint on enter and leave. */
              <div className="flex items-center gap-3">
                <Link
                  ref={ctaPrimaryRef}
                  href="/#projects"
                  className="inline-flex items-center gap-2 rounded-lg px-10 py-4 font-display text-lg font-medium text-transparent"
                >
                  <span ref={ctaPrimaryLabelRef}>העבודות שלי</span>
                  <span ref={ctaPrimaryArrowRef} aria-hidden className="block h-[14px] w-[14px]" />
                </Link>
                <Link
                  ref={ctaSecondaryRef}
                  href="/#contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-transparent px-10 py-4 font-display text-lg font-medium text-transparent"
                >
                  <span ref={ctaSecondaryLabelRef}>קבעו פגישה</span>
                  <span ref={ctaSecondaryArrowRef} aria-hidden className="block h-[14px] w-[14px]" />
                </Link>
              </div>
            )}
          </div>

          <div className={prefersReducedMotion ? "flex items-end gap-4" : "pointer-events-auto flex items-end gap-4"}>
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

      {/* Pure breathing room appended below the fold — nothing is moved or
          resized to make space for it, so the logo, tagline and CTAs sit
          exactly where they did. The ink canvas spans the whole section, so
          this simply hands the ink somewhere to drift and settle instead of
          being driven straight into the section's hard bottom edge. */}
      <div aria-hidden="true" className="h-[15px] w-full shrink-0" />
    </section>
  );
}
