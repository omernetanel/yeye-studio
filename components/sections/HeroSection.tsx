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

/**
 * TEMPORARY, and here to be flipped rather than read.
 *
 * Set this to false and the line is gone from all four places it lives —
 * painted on the canvas on desktop, real type on mobile, and the two
 * measuring/reduced-motion copies behind them. Set it back to true and it
 * returns. Nothing else has to be edited either way.
 *
 * It exists because the question is one for the eye and not for argument, and
 * the two states are not the same layout: the logo is sized from whatever is
 * left after the line and the buttons have taken theirs, so WITHOUT THE LINE
 * THE WORDMARK GROWS. Comparing them from memory would be comparing the wrong
 * thing.
 *
 * DELETE THIS once the call is made — either the line stays as it is now, or it
 * comes out for good. A switch nobody flips is dead code with a comment on it.
 */
const SHOW_TAGLINE = true;

// How far the phone's CTA sits BELOW the exact midpoint between the wordmark
// and the line at the foot (see where it is applied). Dead centre is where the
// arithmetic lands; a little under it is where the eye wants it, because the
// mark above is a solid black block and the row below is a thin grey line — the
// heavier neighbour needs the bigger gap or the button reads as crowding it.
const CTA_DROP_PX = 24;

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
  // Mobile only: the CTA hanging under the mark, and the line at the foot of
  // the screen. The button is placed halfway between them — see the sizing
  // effect below.
  const ctaSlotRef = useRef<HTMLDivElement>(null);
  const footRowRef = useRef<HTMLDivElement>(null);
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
    // Settled from geometry before the observer is attached. The flag lives in
    // a module-level store that outlives this component, so arriving on the
    // homepage from a sub-page inherits whatever it was last set to — and
    // arriving on a hash link puts the Hero out of view before this even runs.
    // Measuring first means the mark is right on the frame it appears rather
    // than on whichever frame the observer gets round to.
    const measure = () => {
      const rect = section.getBoundingClientRect();
      const shown = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      setDocked(rect.height > 0 && shown / rect.height < 0.35);
    };
    measure();

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
    const LOGO_FIT_SCALE = isMobile ? 1 : 0.89;
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

      // THE BUTTON, PUT HALFWAY BETWEEN THE MARK AND THE LINE AT THE FOOT.
      //
      // It used to hang off the wordmark at a fixed distance, which meant the
      // air was all in one place: a measured gap above it and whatever was left
      // over below. Centring it in the space between the two things it sits
      // between splits that evenly, and it stays even at any screen height —
      // which a fixed offset cannot, because the leftover shrinks as the phone
      // does while the offset does not.
      //
      // Measured rather than expressed in CSS because one of the two edges is
      // the bottom of a mark whose height is computed right here.
      const cta = ctaSlotRef.current;
      const foot = footRowRef.current;
      if (cta && foot) {
        const slotBox = slot.getBoundingClientRect();
        const footBox = foot.getBoundingClientRect();
        const ctaBox = cta.getBoundingClientRect();
        const middle = (slotBox.bottom + footBox.top) / 2;
        // `top` is measured from the slot's TOP edge, not its bottom — the
        // button is positioned inside the mark's own box. Subtracting the wrong
        // edge put it a mark's height too high.
        cta.style.top = `${middle - ctaBox.height / 2 - slotBox.top + CTA_DROP_PX}px`;
      }
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
            reaches the ink canvas underneath; the controls opt back in.
            NOTHING HERE BLENDS ANY MORE. Every element in this block used to be
            written in inverted colours — a white fill with black text — and
            turned right way round by mix-blend-mode: difference against the ink
            canvas, so it would flip again wherever ink ran under it. Mobile
            Safari does not apply that blend over a WebGL canvas, and the result
            on a real phone was not "fails to invert" but "is not there": the
            white fills vanished into the white page and left the tagline, the
            button's body, the second link and the studio line all missing.
            They are plain black now. The cost is that dark ink dragged directly
            over them swallows them for the moment it is there, which is a fair
            price for existing. The wordmark is untouched — it comes off the
            canvas, not out of a blend, and the ink revealing it is the whole
            screen.
            THIS SAID EXACTLY THIS AND WAS NOT TRUE. Three of them — the line
            above, the button under the mark, and the row at the foot — kept
            their white fills and their difference blend through the rewrite, so
            on a real phone the hero was a wordmark alone on an empty page: no
            sentence, no button body, no row. If a rule like this is worth
            writing down, every element it covers has to actually follow it. */}
        <div className="pointer-events-none relative flex h-full flex-col px-6 pt-[20px] pb-8">
          <h1 className="sr-only">YEYE</h1>

          {SHOW_TAGLINE && (
            // Two lines now, not one, and no longer nowrap: at 18px on a single
            // line it was a caption. Broken and set larger it carries the
            // weight of being the only sentence on the screen. Balanced rather
            // than hand-broken — a manual break is only ever right at one width.
            //
            // WHITE, and inverted by the blend — see the block comment above.
            <p className="text-right font-display text-[21px] leading-[1.3] font-bold text-balance text-black">
              {TAGLINE_TEXT}
            </p>
          )}

          {/* The space the wordmark is SIZED from — it is still the leftover
              between the line above and the row below, which is what keeps the
              mark from ever colliding with either. It holds nothing: the mark
              itself is drawn in the centred layer further down, because being
              sized by this column and being centred in it are two different
              things, and only the first is wanted. */}
          <div ref={logoAreaRef} className="min-h-0 w-full flex-1" />

          {/* ONE LINE at the foot of the screen, where three stacked blocks
              used to be. Those three came to a hundred pixels of content and
              took the bottom third of the hero with them; this is twenty, and
              the difference goes to the wordmark, which is sized from whatever
              is left over. The empty middle is the point — it is what the
              screens this is modelled on all have and this did not. */}
          <div
            ref={footRowRef}
            className="pointer-events-auto flex w-full items-baseline justify-between font-display text-m-small"
          >
            <Link href="/#projects" className="inline-flex items-center gap-1.5 font-medium text-black">
              העבודות שלי
              <ArrowIcon />
            </Link>
            <span className="text-black/45">סטודיו דיגיטלי עצמאי</span>
          </div>
        </div>

        {/* THE WORDMARK, ON THE SCREEN'S OWN CENTRE — not on the centre of the
            column above it. Those two are not the same point: the line at the
            top is taller than the row at the bottom, so a mark centred in what
            is left over sits some forty pixels low. This layer spans the whole
            section, so its middle is the middle.
            The button hangs off the mark rather than off the screen, so it
            keeps its distance from the letters at any size — `top-full` is the
            wordmark's own bottom edge. */}
        {/* pb-[20svh] lifts the pair by half of it — ten percent of the screen.
            Not centred any more, and that is the point: the button hangs under
            the wordmark here rather than sitting under the line at the top the
            way the screens this is modelled on do, so a centred mark pushed the
            lowest thing on the page down to 72% and split the empty half of the
            screen in two. Theirs ends at 57% and leaves one unbroken void below
            it, which is what reads as calm. Raising the pair buys that void
            back without moving the button off the mark. */}
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center px-6 pb-[20svh]">
          {prefersReducedMotion ? (
            <div ref={logoSlotRef} className="relative overflow-hidden">
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
            <div ref={logoSlotRef} className="relative">
              <div
                ref={ctaSlotRef}
                className="pointer-events-auto absolute inset-x-0 top-full flex justify-center"
              >
                {/* A black pill with white type, written as what it is. It used
                    to be the inverse of that — white on white — because the
                    blend on the wrapper was going to turn it round, and on a
                    real phone it simply stayed white on white: the button's
                    body disappeared into the page and only the label was left
                    floating there. */}
                <Button
                  href="/#contact"
                  variant="primary"
                  className="!border-black !bg-none !bg-black !text-white !shadow-none py-3.5 text-[16px]"
                >
                  קבעו פגישה
                </Button>
              </div>
            </div>
          )}
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
        //
        // No mask on the bottom. There was one for a round — a gradient over
        // the last 170px so drifting ink dissolved instead of meeting the edge
        // — but it faded the paper along with the ink, and what it actually
        // read as was a grey wash across the foot of the screen. The run-off
        // strip below stays; the room is what the ink needed, not the fade.
        <div className="absolute inset-x-0 bottom-0 -top-[48px] overflow-hidden">
          <FluidInkReveal
            logoSrc="/images/logo.png"
            videoSrc="/videos/herobg.mp4"
            taglineText={SHOW_TAGLINE ? TAGLINE_TEXT : ""}
            taglineElRef={SHOW_TAGLINE ? taglineRef : undefined}
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

        {!SHOW_TAGLINE ? null : prefersReducedMotion ? (
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
                  className="inline-flex items-center gap-2 rounded-full px-10 py-4 font-display text-lg font-medium text-transparent"
                >
                  <span ref={ctaPrimaryLabelRef}>העבודות שלי</span>
                  <span ref={ctaPrimaryArrowRef} aria-hidden className="block h-[14px] w-[14px]" />
                </Link>
                <Link
                  ref={ctaSecondaryRef}
                  href="/#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-transparent px-10 py-4 font-display text-lg font-medium text-transparent"
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
          being driven straight into the section's hard bottom edge.
          170, not the 15 it was: fifteen pixels is a gap, not a run-off. Ink
          that drifted down still met the edge and was cut across, which is the
          one thing on this screen that looks like a mistake rather than an
          effect. This is white space on a white page — the only thing it
          changes is how much room the ink has to end in. */}
      <div aria-hidden="true" className="h-[170px] w-full shrink-0" />
    </section>
  );
}
