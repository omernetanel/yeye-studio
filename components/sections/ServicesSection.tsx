"use client";

import { forwardRef, useLayoutEffect, useRef, type RefObject } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SERVICES_HEADING, SERVICES_LEAD, services } from "@/lib/content";
// The words and the artwork, shared with the phone's own arrangement of the
// same four stages. Only the layout below is the desktop's own.
import { ICONS, ICON_MOTION, IconExtras, PROCESS_HEADING, STAGE_LINES, STAGE_TITLES } from "./process/stages";
import FoldText, { setFold } from "@/components/ui/FoldText";
import StageRail, { setStageRail } from "@/components/ui/StageRail";
// The row itself is shared with the phone, which prints the same four at a
// smaller size — see there.
import ServiceRow from "./services/ServiceRow";
import { ScrollFrames, type FrameSequence } from "@/lib/scrub/scroll-frames";

// The paper, as the clip's own frames — every one of servicesbg.mp4's 554, at its
// own 1920×1080 and 30fps. lib/scrub/scroll-frames.ts has why this is not a
// <video>; MobileServices has the exact command that made them (the same one,
// pointed at this clip). `v1` is in the path because the files are served
// immutable, so a re-export goes to a new folder, never over this one.
const CLIP_FPS = 30;
const FRAME_COUNT = 554;
const CLIP_SECONDS = FRAME_COUNT / CLIP_FPS;
const PAPER: FrameSequence = {
  frameUrl: (index) => `/frames/services-desktop/v1/${String(index).padStart(3, "0")}.webp`,
  frameCount: FRAME_COUNT,
  width: 1920,
  height: 1080,
};

// Phase 0 ("lead-in"): SPACER_PX worth of perfectly ordinary scrolling
// before the panel below goes sticky at all — a plain block, not pinned
// yet. Without this the panel's own natural top sits at the very start
// of the wrapper, so it went sticky the instant the section entered view
// at all, with the illustration's own top corners still cramped right up
// against the sticky offset instead of having scrolled into a settled
// position first (confirmed: a too-small value here reads as the images
// getting clipped at the top the moment it locks). Not part of the
// pinned range itself — purely a scroll distance to cover first.
// 0, down from 35. Its original job was to keep the panel from locking the
// instant the section appeared, because the content at the panel's top edge was
// cramped against the sticky offset when it did. That is not what this was ever
// really fixing: the offset is twenty pixels and the cure for it is twenty
// pixels of clearance INSIDE the panel, which is what HEADING_ZONE_PADDING_TOP_PX
// is now carrying. Paying for it out here as well only moved the heading further
// from the hero, which is the gap that had to go.
const SPACER_PX = 0;


// This single clip now carries TWO overlaid content phases across its
// timeline, converted from the source edit's own 30fps timecodes:
//
// 0s               -> ball at rest (off-center right), Services list shown
// 00:00:02:02 (2.07s) -> clip starts playing; Services list shrinks/fades
//                        out as the paper begins unfolding
// 00:00:02:29 (2.97s) -> paper is fully open/flat; About fades in on top
//                        of it
// 00:00:05:06 (5.2s)  -> About shrinks/fades out as the paper starts
//                        re-crumpling, taking it with it — same shrink-
//                        into-the-page treatment as Services
// ~8.15s (clip end)   -> paper fully re-formed into a small, centered
//                        ball (CTASection picks up from here as a plain
//                        static image once the pin releases)
//
// The clip's time maps linearly across the ENTIRE pinned range (progress
// 0 -> 1), so it's automatically, exactly reversible on scroll-up.
// A beat where the Services text sits fully visible once the panel pins,
// before it starts fading at all. Without it the fade begins so early in
// the pinned range that a single normal scroll flick covers the entire
// fade window, so the heading reads as vanishing the instant it arrives.
// Shifts the Services fade and About's entrance together (About's exit is
// deliberately left where it is), so the gap between the two phases —
// and About's own fade-in duration — stay exactly as tuned.
const SERVICES_HOLD_SECONDS = 0.5;
const SERVICES_FADE_START_SECONDS = 2 + 2 / 30 - 0.8 + SERVICES_HOLD_SECONDS;
const SERVICES_FADE_END_SECONDS = 2 + 29 / 30 - 1.1 + SERVICES_HOLD_SECONDS;
const ABOUT_FADE_OUT_START_SECONDS = 5 + 6 / 30 - 0.5;
const ABOUT_FADE_OUT_END_SECONDS = 6.1 - 0.5;

// THE PROCESS, ONE THING AT A TIME, on the SHEET CLOCK (see sheetSeconds()):
// clip seconds that keep counting through the freeze on the open paper, so the
// choreography can run while the paper holds still. Everything here happens
// between the paper lying flat (2.97s) and the block shrinking back into it.
//
// It used to arrive all at once — heading, drawing, four stations, four icons —
// inside about a second, and read as clutter. Now: the heading alone and big,
// then it shrinks to one line at the top while the drawing fades in under it,
// then the stations one by one, each arrow drawing itself towards the next.
// It folds in a letter at a time (FoldText), at its full size — and only once
// the paper is open AND frozen (the hold starts at 3.7). Folding while the sheet
// was still settling, the fold was lost in the paper's own movement. A whole
// second of it, so there is scroll enough to see each letter turn.
const HEADING_IN = [3.8, 4.8] as const;
// A real pause standing big before it settles — at 0.2s it read as shrinking
// the moment it had arrived — and a slower settle.
const HEADING_SETTLE = [5.4, 6.2] as const;
// How much bigger the heading stands before it settles (234px against the
// settled 52).
const HEADING_BIG_SCALE = 4.5;
const DRAWING_OPACITY = 0.5;
// A stage holds the sheet for STAGE_SPAN, and STAGE_SWAP of that is the
// handover at its start. 0.95s is about eighty per cent of a screen of scroll
// each — long enough to read a name and a line without the page feeling stuck.
const STAGES_START = 6.4;
const STAGE_SPAN = 0.95;
const STAGE_SWAP = 0.3;
const STAGE_RISE_PX = 34;
const CONTENT_SHRINK_SCALE = 0.6;
const VIDEO_REST_SCALE = 1.10;
const VIDEO_REST_SHIFT_X_PX = 45;

// The clip's aspect, taken from the frame sequence itself rather than written
// out a second time; used to locate the picture's own edge inside the
// letterboxed element so it can be trimmed (see update()).
const VIDEO_ASPECT = PAPER.width / PAPER.height;
const VIDEO_EDGE_TRIM_PX = 2;

// The video zone is deliberately TALLER than the viewport (it is pulled up
// 86px so the resting ball fits the screen), which means object-contain sizes
// the sheet to the zone rather than to the screen. While the paper is a small
// ball that is invisible, but the moment it unfolds to fill the frame it runs
// off an edge — and shifting it only ever trades a cut top for a cut bottom.
// So the open state also scales down to whatever actually fits the viewport,
// and shifts to sit centred in it.
const VIDEO_OPEN_SCALE = 0.86;
const VIDEO_OPEN_SHIFT_Y_PX = 63;

// The ball starts unfolding into the plane at ~11.1s (measured off the clip),
// so the frame finishes opening to full bleed just before that and the plane
// is never anything but edge to edge. The window starts after 8.13s, which is
// where the old clip ended — so none of the tuning above is touched.
const PLANE_FULLBLEED_START_SECONDS = 9.3;
const PLANE_FULLBLEED_END_SECONDS = 11.0;
// A hair beyond an exact cover, so a fractional viewport height can never
// leave a one-pixel seam at an edge.
const VIDEO_FULLBLEED_OVERSCAN = 0.02;

// The closing statement rises into the bottom of the pinned frame while the
// plane is still in flight, and stays there: the clip's last second is plain
// white, so once scrolling reaches the end the whole screen is the sentence on
// white, held until the pin releases into the contact stage.
const STATEMENT_FADE_IN_START_SECONDS = 13.0;
const STATEMENT_FADE_IN_END_SECONDS = 14.4;
const STATEMENT_RISE_PX = 26;

// Once the clip has run out, the pin does NOT release straight away. There is
// a tail of scroll in which the statement — now the only thing on screen —
// draws down and lifts a little, and then a shorter stretch where it is parked
// and nothing moves at all, so it reads as having settled before the page
// carries on. Both are viewport-relative, and both are part of the wrapper
// height below rather than extra range stolen from the clip's own scrub.
const STATEMENT_TAIL_VH = 60;
const STATEMENT_PARK_VH = 25;
const STATEMENT_TAIL_SCALE = 0.88;
const STATEMENT_TAIL_RISE_PX = 72;

// PANEL_STICKY_TOP_PX is the panel's *real* sticky top offset — negative,
// so once stuck its own top edge sits slightly above the viewport,
// letting the video's composition keep scrolling a bit further before
// locking instead of stopping dead the instant it reaches the top. Must
// stay in sync with the `-top-[20px]` on the panel's own className below
// (a literal Tailwind value, can't reference this constant directly).
const PANEL_STICKY_TOP_PX = -20;

// The panel is stuck slightly ABOVE the viewport top, so its own centre sits
// PANEL_STICKY_TOP_PX above the screen's. Cancelling that exactly is what puts
// the block on the centre of the SCREEN rather than the centre of the panel —
// which matters because that same point is what it scales into on the way out.
const ABOUT_SHIFT_Y_PX = -PANEL_STICKY_TOP_PX;

// The heading zone's rest-state padding — must be animated down to 0 in
// lockstep with its own `height` (see update()), not left as a fixed
// Tailwind class: with box-sizing: border-box, a padded box's `height`
// can never be set below its own padding sum, so a fixed pt/pb class
// would silently floor the "collapse to 0" animation at that sum instead
// of actually reaching 0.
// 30, down from 54 — and it cannot go to 0, which is where it was for one round
// and where the heading came out cut in half.
//
// THIS ONE NUMBER IS TWO THINGS AT ONCE, and that is the whole constraint. Sat
// still, it is the white between the end of the hero's ink run-off and the top
// of the heading. Pinned, it is the only thing holding the heading off the top
// of the SCREEN — the panel locks at PANEL_STICKY_TOP_PX, twenty pixels above
// the viewport, so the first twenty pixels of whatever is at the panel's top
// edge are simply not on screen. At 0 that was the heading's own cap line.
//
// So the gap cannot be tuned smaller than the clearance: they are the same
// pixels seen in two states. 40 leaves twenty clear when locked — about
// twenty-seven with the line box's own leading — and reads as a close gap
// rather than a hole when it is sitting still.
const HEADING_ZONE_PADDING_TOP_PX = 40;
const HEADING_ZONE_PADDING_BOTTOM_PX = 8;

// Scroll no longer maps straight onto the clip's timeline. At each of these
// moments the clip FREEZES while scrolling keeps accumulating, so the page
// genuinely stops on the content instead of sliding past it — and because it
// is still scroll-driven, it stays exactly reversible on the way back up.
// `share` is the fraction of the whole pinned range spent held.
// The share is derived, not eyeballed. It and the wrapper height below are
// solved together from two constraints, so that lengthening the clip changes
// nothing about how the opening 8.13s feel:
//   scroll-per-second equal:  (1 - Sn)/Dn * Hn = (1 - So)/Do * Ho
//   hold length equal:        Sn * Hn          = So * Ho
// With Do = 8.133s, So = 0.13 and Dn = 18.467s that gives Hn = 2.1053 * Ho
// and Sn = 0.13 / 2.1053.
//
// Since lengthened to carry the process one stage at a time: the moving
// stretches keep exactly the scroll they had (1617vh at a 900px screen), and
// the hold grew to 5.6 clip-seconds' worth of that same rate — 491vh — with the
// section height grown by the same amount. The share is 491 / 2108.
const TIME_HOLDS: { at: number; share: number }[] = [
  { at: 3.7, share: 0.2327 }, // the process, paper flat
];
const TOTAL_HOLD_SHARE = TIME_HOLDS.reduce((sum, h) => sum + h.share, 0);

// The sheet clock: clip seconds as if the clip never froze. Every hold is paid
// for at the moving rate, so this is simply progress over that rate — it runs
// on through a freeze while the clip time stands still. Past the hold it is
// ahead of the clip by the hold's length — 5.6s, so the block's exit at 4.7s
// clip time is 10.3s here, and the fourth stage is up (9.55s) before that.
function sheetSeconds(progress: number) {
  return (progress * CLIP_SECONDS) / (1 - TOTAL_HOLD_SHARE);
}

function progressToTime(progress: number, duration: number) {
  // Scroll-per-second for the moving stretches, once the holds have taken
  // their share of the range.
  const rate = (1 - TOTAL_HOLD_SHARE) / duration;
  let consumed = 0;
  let fromTime = 0;
  for (const hold of TIME_HOLDS) {
    const span = (hold.at - fromTime) * rate;
    if (progress <= consumed + span) return fromTime + (progress - consumed) / rate;
    consumed += span;
    if (progress <= consumed + hold.share) return hold.at;
    consumed += hold.share;
    fromTime = hold.at;
  }
  return fromTime + (progress - consumed) / rate;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

// Where object-contain actually puts the picture inside a box of elW x elH.
// The picture's own edge sits well inside the element's box, and both the
// hairline trim and the full-bleed scale below need to know exactly where.
function containedPictureSize(elW: number, elH: number) {
  let contentW = elW;
  let contentH = elW / VIDEO_ASPECT;
  if (contentH > elH) {
    contentH = elH;
    contentW = elH * VIDEO_ASPECT;
  }
  return { contentW, contentH };
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  // A degenerate range divides by zero, and 0/0 is NaN — which then flows into
  // the frame index and every transform written from it. That is not
  // hypothetical: on mount, update() runs once BEFORE measurePinRange() has
  // given the pin its real bounds, so both ends are still 0.
  if (inMax === inMin) return outMin;
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

// Heading zone content — the h2 AND the subtitle/divider beneath it live
// together here now, not split across the heading zone and the video
// zone's row block. The video zone's own height (and therefore this
// group's vertical centering within it) depends on viewport resolution,
// so a resolution where that centering pushed the subtitle above the
// zone's clipped (overflow-hidden) bounds was rendering it invisible even
// though it was still technically "there" in the DOM.
const ServicesHeading = forwardRef<HTMLDivElement>(function ServicesHeading(_props, ref) {
  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      {/* Sized well below the old two-word heading: this is a full sentence
          on two lines, so 72px would tower over the rest of the panel and
          eat the height the list and the ball need. */}
      <h2 className="font-display text-4xl leading-[1.2] font-bold text-black md:text-[44px]">
        {SERVICES_HEADING[0]}
        <br />
        {SERVICES_HEADING[1]}
      </h2>
      <p className="mt-2 font-body text-[15px] leading-[1.8] text-black/70">{SERVICES_LEAD}</p>
    </div>
  );
});

/**
 * `plain` is the version with no composition around it.
 *
 * The offsets below — pushed down 94px, left 15, scaled to 0.95 — place this
 * block against the paper ball in the pinned panel. Standing on its own, with
 * no ball and no panel, they are just a list that sits low and off-centre.
 */
function ServicesRowsBlock({ plain = false }: { plain?: boolean }) {
  return (
    <div
      className={
        plain
          ? "isolate mx-auto flex w-full max-w-[900px] justify-center"
          : "isolate mx-auto flex w-full max-w-[900px] -translate-x-[15px] translate-y-[94px] justify-end"
      }
    >
      <div
        className={
          plain
            ? "flex w-full max-w-[560px] flex-col"
            : "flex w-full max-w-[480px] origin-center scale-[0.95] flex-col"
        }
      >
        {services.map((service, i) => (
          <ServiceRow key={service.title} service={service} index={i} />
        ))}
      </div>
    </div>
  );
}

/** Mobile/reduced-motion only — the heading and rows aren't split across
    two panel zones there (no pinned video to keep clear of), so they're
    just stacked together as one plain block. */
function ServicesListBlock() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center text-center">
        <ServicesHeading />
      </div>
      <div className="mt-10">
        <ServicesRowsBlock plain />
      </div>
    </div>
  );
}


/**
 * The process, drawn on the open sheet.
 *
 * It sits in the slot the "who I am" block used to occupy, and shrinks back
 * into the paper on the same cue, because that slot is exactly "whatever is
 * printed on the paper while it is open" — and a diagram is a better use of an
 * open page than a column of prose was, since it is a thing to look at rather
 * than to read around.
 *
 * SPLIT DOWN THE MIDDLE, on purpose. The pencil is a file: hatching, texture,
 * the little construction sketches of the letters — none of that can be faked
 * in markup and there is no reason to try. Everything with structure to it —
 * the four stations, their numbers, their copy and the arrows between them —
 * is type and SVG, in the drawing's own 1920x1080 space.
 *
 * The reason is not sharpness, though it is sharper. It is that this is the
 * one section on the page where nothing happens: the hero is a fluid
 * simulation, the room is a real zoom, the work is an arc you can turn, and
 * this was a picture that changed size. Four stages around a circle are the
 * content that gains most from being revealed over time, and a flat plate
 * cannot take part in the scrub it is printed on. As SVG the arrows can draw
 * themselves between the stations.
 *
 * The overlay is laid over the existing plate rather than replacing it, and
 * that doubling is the alignment test: type that lands exactly on what is
 * printed underneath reads as one drawing. Anything out of place shows up as a
 * ghost. When the background-only plate arrives, only the src changes.
 */
function ProcessDiagram({ sheetRef }: { sheetRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-6">
      {/* Held a little inside the sheet's width. At full bleed the drawing runs
          to the edges of the page it is printed on, which reads as a background
          rather than as something drawn there. */}
      <div ref={sheetRef} className="relative mx-auto w-[79%] -translate-y-[6%]">
        {/* Laid out in its SETTLED form — one line, near the top of the sheet,
            with the stage below holding the middle — and each half moved from
            there by update().

            Two lines standing big and one line settled are different line
            breaks, which a transform on one block cannot turn into each other;
            two halves that travel can. The offsets are layout values, so they
            are never read off anything mid-animation. A zero-height row, so
            the line is centred on that point rather than hanging from it. */}
        <h3
          data-process-heading
          aria-label={PROCESS_HEADING.join(" ")}
          className="absolute inset-x-0 top-[10%] z-10 flex h-0 items-center justify-center gap-[0.28em] font-display text-[52px] leading-[1.05] font-bold text-black"
        >
          {PROCESS_HEADING.map((line) => (
            <span
              key={line}
              aria-hidden="true"
              // No will-change: it would rasterise the line once at its small
              // size and stretch that bitmap to 4.5x — blurry type at the one
              // moment the heading is the whole screen.
              className="block whitespace-nowrap"
              style={{ opacity: 0 }}
            >
              <FoldText text={line} />
            </span>
          ))}
        </h3>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // whatido-alpha.png, keyed from whatidopng.png — which ships as rgb24,
          // a solid white background with the pencil work on top of it, and so
          // covered the paper instead of being drawn on it.
          //
          // A BLEND CANNOT FIX THAT HERE, which is why this is a second file
          // rather than a class. darken and multiply both need to see the video
          // behind them, and this image sits inside a layer whose opacity is
          // animated — any opacity below 1 opens a stacking context, and a blend
          // only ever mixes within its own. It was blending against the layer's
          // transparent backdrop and doing nothing at all.
          //
          // The key is by luminance at a tight threshold (0.97, tolerance 0.03),
          // so only near-white goes: the corner hatching, the construction
          // sketches and every grey in the drawing survive untouched.
          // ffmpeg -i whatidopng.png -vf
          //   "format=rgba,lumakey=threshold=0.97:tolerance=0.03:softness=0.12"
          //   whatido-alpha.png
          src="/images/whatido-alpha.png"
          data-process-drawing
          // THE CENTRAL YEYE IS MASKED OUT, not cut from the file: the heading
          // takes that spot now, and a pencil wordmark behind it read as a
          // second title. An ellipse over the sketch and its dimension lines,
          // feathered so no edge of the cut shows in the paper texture.
          className="block h-auto w-full [mask-image:radial-gradient(ellipse_25%_19%_at_50%_50%,transparent_72%,black_100%)]"
          alt=""
          width={1920}
          height={1080}
          style={{ opacity: 0 }}
          draggable={false}
        />

        <ProcessStages />
      </div>
    </div>
  );
}

// THE STAGES, ONE AT A TIME, and there is no diagram any more.
//
// It was four blocks of type scattered around a ring with thin arrows between
// them: a template, and it read like one — nothing for the eye to rest on, and
// a closed circle that said the work goes back to "understanding the business"
// once a site is live, which it does not.
//
// So the sheet holds ONE stage at a time: a numeral the size of the page, the
// stage's name over it, a line under that, and a rail at the foot counting
// four. Scrolling swaps them. The pencil drawing stays exactly where it was,
// as texture on the paper rather than something to read.
function ProcessStages() {
  return (
    // The band between the settled heading and the foot of the sheet. Every
    // stage is absolutely placed inside it, so they share one slot and a swap
    // moves nothing around them.
    <div className="absolute inset-x-0 top-[20%] bottom-[18%]">
      {STAGE_TITLES.map((title, index) => (
        <div
          key={title}
          data-process-stage
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ opacity: 0 }}
        >
          {/* The drawing of the stage, over its numeral: the same artwork the
              phone prints, at the size the sheet can afford. It is drawn around
              its own origin, so the viewBox is simply a box around zero. */}
          <svg
            viewBox="-64 -64 128 128"
            aria-hidden="true"
            className={`mb-2 h-[112px] w-[112px] text-black/45 ${ICON_MOTION[String(index + 1).padStart(2, "0")]}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[String(index + 1).padStart(2, "0")].map((part) => (
              <path key={part.d} d={part.d} className={part.cls} />
            ))}
            <IconExtras number={String(index + 1).padStart(2, "0")} />
          </svg>

          {/* The numeral is the ground the name sits on: faint, enormous, and
              BEHIND it rather than beside it, so the two read as one mark. */}
          <span
            aria-hidden="true"
            className="font-display text-[clamp(120px,15vw,230px)] leading-[0.8] font-extrabold text-black/10"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {/* Pulled up into the numeral's own space. The white glow is what
              lifts the type off the pencil work behind it — the same job the
              SVG halo did for the diagram this replaces. */}
          <h4 className="-mt-[0.34em] font-display text-[clamp(38px,4.6vw,68px)] leading-[1.05] font-bold text-black [text-shadow:0_0_24px_#fff,0_0_10px_#fff]">
            {title}
          </h4>
          <p className="mt-7 max-w-[620px] font-body text-[clamp(17px,1.5vw,24px)] leading-[1.75] text-balance text-black/70 [text-shadow:0_0_20px_#fff,0_0_8px_#fff]">
            {STAGE_LINES[index].join(" ")}
          </p>
        </div>
      ))}

      {/* Four of four, as a column down the right side of the sheet - see
          StageRail for why not a row. HIDDEN UNTIL THE FIRST STAGE ARRIVES, so
          it never counts stages that have not appeared. */}
      <div data-process-dots style={{ opacity: 0 }} className="absolute top-1/2 right-[3%] -translate-y-1/2">
        <StageRail count={STAGE_TITLES.length} />
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Only ever rendered on desktop — HomeSwitch hands phones MobileServices.
  const skipDesktopMotion = prefersReducedMotion;

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ScrollFrames | null>(null);
  const headingZoneRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const servicesContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // About's exit-phase transform-origin (screen center, in pixels relative
  // to its own box) — measured live in update() while About is fully
  // visible. "50% 50%" (its own center, which sits near screen center
  // anyway) is only the fallback for a scroll jump so fast the fully-
  // visible window was never sampled.
  // The heading zone's own natural (unshrunk) height — measured once on
  // mount/resize, since it needs to be known BEFORE update() starts
  // driving that same height down toward 0 as the Services text fades.
  const headingZoneNaturalHeightRef = useRef(0);
  const headingShineDoneRef = useRef(false);

  // Analytical, not scrollYProgress-derived — same reasoning as the Hero's
  // own pin: a target-scoped scrollYProgress motion value lags an instant
  // or fast scroll jump by a frame or two (its target rect is re-measured
  // on its own schedule), which is exactly the kind of drift that would
  // throw off a precise video-frame seek. A live rect measurement plus the
  // raw global scrollY never do that.
  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);
  // Where the clip's own scrub finishes. Everything between here and pinEnd is
  // the statement's tail, so the clip must not be mapped across it.
  const clipEndScrollYRef = useRef(0);
  const { scrollY } = useScroll();

  const update = () => {
    const wrapper = wrapperRef.current;
    // The canvas the paper is drawn on. It stands where the video stood and
    // takes exactly the same transform and clip below: it fits each frame the
    // way object-fit: contain fitted the video, so every measurement of "the
    // picture inside the element" still holds.
    const picture = canvasRef.current;
    const frames = framesRef.current;
    const headingZone = headingZoneRef.current;
    const heading = headingRef.current;
    const servicesContent = servicesContentRef.current;
    const aboutContent = aboutContentRef.current;
    if (!wrapper || !picture || !frames || !headingZone || !heading || !servicesContent || !aboutContent) return;

    const rawScrollY = scrollY.get();
    // Against clipEnd, not pinEnd — the statement's tail past clipEnd is not
    // part of the clip's timeline, and mapping across it would slow the whole
    // scrub down and leave the clip finishing after the paper already had.
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, clipEndScrollYRef.current, 0, 1));

    // The clip's time is a pure linear function of scroll progress across the
    // whole pinned range, so it is automatically, exactly reversible on
    // scroll-up; no separate "rewind" logic needed.
    const targetTime = progressToTime(progress, CLIP_SECONDS);
    // The frame the target time falls in. ScrollFrames returns at once when
    // that is the frame already showing, so most ticks cost nothing.
    frames.show(Math.floor(targetTime * CLIP_FPS));

    const servicesShrinkT = smoothstep(mapRange(targetTime, SERVICES_FADE_START_SECONDS, SERVICES_FADE_END_SECONDS, 0, 1));

    // The ball sits slightly enlarged and shifted right at rest — clear
    // of the row text beside it — easing back to its natural scale/
    // position as the paper starts unfolding, same span as everything
    // else fading out.
    let scale = lerp(VIDEO_REST_SCALE, VIDEO_OPEN_SCALE, servicesShrinkT);
    let shiftX = lerp(VIDEO_REST_SHIFT_X_PX, 0, servicesShrinkT);
    let shiftY = lerp(0, VIDEO_OPEN_SHIFT_Y_PX, servicesShrinkT);

    // Then, once the ball is about to unfold into the plane, the frame opens
    // out to full bleed. Up to here the picture is deliberately smaller than
    // the panel, which is right for the ball but wrong for the plane: it would
    // fly off the picture's own edge with white page still around it, and read
    // as being cut in mid-air rather than leaving the screen. Everything is
    // measured live rather than hardcoded, so it covers at any viewport.
    const panel = panelRef.current;
    const videoZone = videoZoneRef.current;
    const fullBleedT = smoothstep(
      mapRange(targetTime, PLANE_FULLBLEED_START_SECONDS, PLANE_FULLBLEED_END_SECONDS, 0, 1),
    );
    if (fullBleedT > 0 && panel && videoZone) {
      const { contentW, contentH } = containedPictureSize(picture.clientWidth, picture.clientHeight);
      if (contentW > 0 && contentH > 0) {
        const panelW = panel.clientWidth;
        const panelH = panel.clientHeight;
        // Cover, not contain — the clip's own background is the same flat
        // white as the page, so cropping its long edge costs nothing.
        const coverScale =
          Math.max(panelW / contentW, panelH / contentH) * (1 + VIDEO_FULLBLEED_OVERSCAN);
        // The zone is pulled up above the panel, so the picture's centre and
        // the panel's centre are not the same point; close the gap or the
        // grown frame sits off-centre.
        const centreShiftY = panelH / 2 - (videoZone.offsetTop + picture.clientHeight / 2);
        scale = lerp(scale, coverScale, fullBleedT);
        shiftX = lerp(shiftX, 0, fullBleedT);
        shiftY = lerp(shiftY, centreShiftY, fullBleedT);
      }
    }

    picture.style.transform = `translateX(${shiftX}px) translateY(${shiftY}px) scale(${scale})`;

    const statement = statementRef.current;
    if (statement) {
      const statementT = smoothstep(
        mapRange(targetTime, STATEMENT_FADE_IN_START_SECONDS, STATEMENT_FADE_IN_END_SECONDS, 0, 1),
      );
      // Past the end of the clip the statement gets its own stretch of scroll:
      // it draws down and lifts, then holds through the park before the pin
      // releases. Driven off raw scroll rather than clip time, which has
      // nothing left to say by this point.
      const tailT = smoothstep(
        clamp01(
          mapRange(
            rawScrollY,
            clipEndScrollYRef.current,
            clipEndScrollYRef.current + (window.innerHeight * STATEMENT_TAIL_VH) / 100,
            0,
            1,
          ),
        ),
      );
      const y = lerp(STATEMENT_RISE_PX, 0, statementT) + lerp(0, -STATEMENT_TAIL_RISE_PX, tailT);
      statement.style.opacity = String(statementT);
      statement.style.transform = `translateY(${y}px) scale(${lerp(1, STATEMENT_TAIL_SCALE, tailT)})`;
    }

    // The contain fit letterboxes the frame inside the element, so the picture
    // has its own edge sitting well inside the element's box — and scaling the
    // element drags that edge around with it. That edge is where a hairline has
    // been showing up. Clipping a couple of pixels off the picture's own bounds
    // removes the edge row the browser resamples, and the replacement boundary
    // is a plain CSS clip through flat white, which has nothing to resample.
    // Computed from the live box rather than hardcoded, so it tracks the
    // element at any viewport and any scale.
    const elW = picture.clientWidth;
    const elH = picture.clientHeight;
    if (elW > 0 && elH > 0) {
      const { contentW, contentH } = containedPictureSize(elW, elH);
      const insetX = (elW - contentW) / 2 + VIDEO_EDGE_TRIM_PX;
      const insetY = (elH - contentH) / 2 + VIDEO_EDGE_TRIM_PX;
      picture.style.clipPath = `inset(${insetY}px ${insetX}px)`;
    }

    // The heading exits as a plain fade — no scale/shrink of its own
    // (explicitly requested; the rows below DO keep their shrink-to-center
    // exit). The zone collapse beneath it still happens regardless.
    heading.style.opacity = String(1 - servicesShrinkT);
    // Fired once, off the heading's own position on screen — the moment it is
    // fully in the viewport, which is the moment a reader would say it had
    // arrived. Keying it to the pin start instead put it 575px of scroll late
    // at 1280x690: the panel is only sticky after the lead-in, but the heading
    // rides into view well before that and just sat there waiting.
    if (!headingShineDoneRef.current) {
      const h2 = heading.querySelector("h2");
      const box = h2?.getBoundingClientRect();
      if (h2 && box && box.top >= 0 && box.bottom <= window.innerHeight) {
        headingShineDoneRef.current = true;
        h2.classList.add("heading-shine");
      }
    }
    // The zone around it collapses to nothing so the footage can grow into the
    // freed space, and the heading is centred in that zone — so left alone it
    // gets dragged upward as the zone shrinks, which reads as the text sliding
    // away rather than fading. Translating it back by half the collapse holds
    // it exactly still, leaving opacity as the only thing that changes.
    // With flex centring, the heading's centre sits at
    //   zoneTop + padTop + (height - padTop - padBottom) / 2
    // and every one of those three animates to zero together, so the centre
    // travels the whole of that offset. Compensating for the height alone
    // leaves the padding's share of the drift behind.
    const restCentreOffset =
      HEADING_ZONE_PADDING_TOP_PX +
      (headingZoneNaturalHeightRef.current - HEADING_ZONE_PADDING_TOP_PX - HEADING_ZONE_PADDING_BOTTOM_PX) / 2;
    heading.style.transform = `translateY(${restCentreOffset * servicesShrinkT}px)`;
    // The heading zone's own height (and padding — see that constant's
    // own comment) collapses in step with its fade — the video zone
    // below it grows to fill the freed space, so by the time the paper
    // is fully open the video is flush with the panel's top edge (no gap
    // left exposing its own boundary against the page).
    headingZone.style.height = `${lerp(headingZoneNaturalHeightRef.current, 0, servicesShrinkT)}px`;
    headingZone.style.paddingTop = `${lerp(HEADING_ZONE_PADDING_TOP_PX, 0, servicesShrinkT)}px`;
    headingZone.style.paddingBottom = `${lerp(HEADING_ZONE_PADDING_BOTTOM_PX, 0, servicesShrinkT)}px`;

    servicesContent.style.opacity = String(1 - servicesShrinkT);
    servicesContent.style.transform = `scale(${lerp(1, CONTENT_SHRINK_SCALE, servicesShrinkT)})`;
    // Once faded out, the row links must stop intercepting clicks meant
    // for whatever's now on top (About) — opacity alone doesn't disable
    // pointer-events, so a "fully invisible" row would otherwise still
    // swallow a click/hover.
    servicesContent.style.pointerEvents = servicesShrinkT > 0.5 ? "none" : "auto";

    // The block as a whole only LEAVES: it shrinks back into the centre of the
    // screen as the paper re-crumples. Its arrival is its parts, one at a time,
    // below — so the block itself is simply there, at full size, until then.
    const aboutShrinkT = smoothstep(mapRange(targetTime, ABOUT_FADE_OUT_START_SECONDS, ABOUT_FADE_OUT_END_SECONDS, 0, 1));
    aboutContent.style.transformOrigin = "50% 50%";
    aboutContent.style.opacity = String(1 - aboutShrinkT);
    aboutContent.style.transform = `translateY(${ABOUT_SHIFT_Y_PX}px) scale(${lerp(1, CONTENT_SHRINK_SCALE, aboutShrinkT)})`;

    const sheet = sheetRef.current;
    if (sheet) animateProcess(sheet, sheetSeconds(progress));
  };

  // The process on the open sheet, on the sheet clock — see HEADING_IN. Every
  // position read here is a layout offset, never a live rect, so nothing is
  // measured off an element that is itself moving.
  const animateProcess = (sheet: HTMLDivElement, seconds: number) => {
    const heading = sheet.querySelector<HTMLElement>("[data-process-heading]");
    const drawing = sheet.querySelector<HTMLElement>("[data-process-drawing]");
    if (!heading || !drawing) return;

    // Linear: the fold carries its own ease, letter by letter.
    setFold(heading, mapRange(seconds, HEADING_IN[0], HEADING_IN[1], 0, 1));
    const settle = smoothstep(mapRange(seconds, HEADING_SETTLE[0], HEADING_SETTLE[1], 0, 1));

    // The two halves of the heading, each from its place in the big two-line
    // stack at the middle of the sheet to its place in the settled line.
    const lines = heading.children;
    const sheetW = sheet.offsetWidth;
    const sheetH = sheet.offsetHeight;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as HTMLElement;
      const settledX = heading.offsetLeft + line.offsetLeft + line.offsetWidth / 2;
      const settledY = heading.offsetTop + line.offsetTop + line.offsetHeight / 2;
      // Already at full size where it stands: the entrance is the fold alone.
      // 56%: the middle of the screen, since the sheet is raised 6%.
      const bigY = sheetH * 0.56 + (i - (lines.length - 1) / 2) * line.offsetHeight * HEADING_BIG_SCALE;
      const x = lerp(sheetW / 2 - settledX, 0, settle);
      const y = lerp(bigY - settledY, 0, settle);
      line.style.opacity = "1";
      line.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${lerp(HEADING_BIG_SCALE, 1, settle).toFixed(4)})`;
    }

    // The drawing fades in while the heading makes room for it — to half, so
    // the pencil stays a texture on the paper and the stages read over it.
    drawing.style.opacity = String(settle * DRAWING_OPACITY);

    // ONE STAGE AT A TIME, in one slot. The one leaving rises and goes before
    // the one arriving comes up under it — they never cross, which is the whole
    // reason the swap is readable at this size. The last one does not leave at
    // all: the block itself shrinks into the paper on its own cue.
    const stages = sheet.querySelectorAll<HTMLElement>("[data-process-stage]");
    const last = stages.length - 1;
    let current = -1;
    stages.forEach((stage, i) => {
      const start = STAGES_START + i * STAGE_SPAN;
      const arrive = smoothstep(mapRange(seconds, start, start + STAGE_SWAP, 0, 1));
      const leave = i === last ? 0 : smoothstep(mapRange(seconds, start + STAGE_SPAN - STAGE_SWAP, start + STAGE_SPAN, 0, 1));
      const shown = arrive * (1 - leave);
      stage.style.opacity = String(shown);
      stage.style.transform = `translateY(${(lerp(STAGE_RISE_PX, 0, arrive) + lerp(0, -STAGE_RISE_PX, leave)).toFixed(2)}px)`;
      if (shown > 0.5) current = i;
    });

    // The row arrives on the first stage's own cue, so the count never appears
    // before the thing it counts.
    const dots = sheet.querySelector<HTMLElement>("[data-process-dots]");
    if (dots) {
      dots.style.opacity = String(smoothstep(mapRange(seconds, STAGES_START, STAGES_START + STAGE_SWAP, 0, 1)));
      // The line fills from the first stage's arrival to the last's.
      setStageRail(dots, mapRange(seconds, STAGES_START, STAGES_START + last * STAGE_SPAN, 0, 1), current);
    }
  };

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    const panel = panelRef.current;
    if (!wrapper || !spacer || !panel) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    // The panel sticks at PANEL_STICKY_TOP_PX (its own real CSS top, not
    // NAVBAR_CLEARANCE_PX — see that constant's own comment for why the
    // two split), so the old "the two clearance terms cancel out"
    // shortcut (which relied on panelHeight === innerHeight exactly) no
    // longer holds — a sticky element with `top: T` releases once
    // scrollY >= wrapperTop + wrapperHeight - panelHeight - T, so T has
    // to be subtracted explicitly here regardless.
    // pinStart is likewise offset by the lead-in spacer's own height —
    // the panel's natural (unstuck) top sits that far below the
    // wrapper's own top, so it doesn't reach the sticky threshold until
    // scroll has covered that extra distance too.
    pinStartScrollYRef.current = wrapperTop + spacer.offsetHeight - PANEL_STICKY_TOP_PX;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - panel.offsetHeight - PANEL_STICKY_TOP_PX;
    clipEndScrollYRef.current =
      pinEndScrollYRef.current - (window.innerHeight * (STATEMENT_TAIL_VH + STATEMENT_PARK_VH)) / 100;
  };

  // The heading zone's height AND padding are JS-controlled after the
  // first update() call, so re-measuring its *natural* height on resize
  // means resetting both to their rest-state values first — otherwise
  // this would just read back whatever (possibly mid-collapse) values
  // update() last wrote.
  const measureHeadingZoneHeight = () => {
    const headingZone = headingZoneRef.current;
    if (!headingZone) return;
    const prevHeight = headingZone.style.height;
    const prevPaddingTop = headingZone.style.paddingTop;
    const prevPaddingBottom = headingZone.style.paddingBottom;
    headingZone.style.height = "auto";
    headingZone.style.paddingTop = `${HEADING_ZONE_PADDING_TOP_PX}px`;
    headingZone.style.paddingBottom = `${HEADING_ZONE_PADDING_BOTTOM_PX}px`;
    headingZoneNaturalHeightRef.current = headingZone.getBoundingClientRect().height;
    headingZone.style.height = prevHeight;
    headingZone.style.paddingTop = prevPaddingTop;
    headingZone.style.paddingBottom = prevPaddingBottom;
  };

  // The rows' *exit* should shrink toward the true center of the panel,
  // not whichever point their own (much smaller/off-center) box happens
  // to center on. (The heading isn't involved — it exits as a plain fade,
  // no transform.) transform-origin only ever measures relative to the
  // element's own box, so hitting an arbitrary point like "panel center"
  // means computing that offset by hand, once at rest (before the element
  // has started shrinking, since the heading zone's own collapse would
  // throw off a mid-animation re-measurement).
  const measureShrinkOrigins = () => {
    const servicesContent = servicesContentRef.current;
    if (!servicesContent) return;
    // Computed directly from the panel's own known (fixed) sticky
    // geometry rather than panelRef.getBoundingClientRect() — the panel
    // is only actually *at* PANEL_STICKY_TOP_PX once scrolled into its
    // stuck state, so measuring its rect at mount (before that) would
    // read wherever it naturally sits in the page flow instead.
    const panelCenterX = window.innerWidth / 2;
    const panelCenterY = PANEL_STICKY_TOP_PX + window.innerHeight / 2;

    const servicesRect = servicesContent.getBoundingClientRect();
    servicesContent.style.transformOrigin = `${panelCenterX - servicesRect.left}px ${panelCenterY - servicesRect.top}px`;
  };

  useLayoutEffect(() => {
    if (skipDesktopMotion) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    // Loads itself as the section comes within reach, sizes itself to the
    // canvas, and releases everything it holds on the way out.
    const frames = new ScrollFrames(canvas, PAPER);
    framesRef.current = frames;

    measureHeadingZoneHeight();
    measureShrinkOrigins();
    measurePinRange();
    update();

    const handleResize = () => {
      measureHeadingZoneHeight();
      measureShrinkOrigins();
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapper);
    if (panelRef.current) ro.observe(panelRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      frames.dispose();
      framesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipDesktopMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!skipDesktopMotion) update();
  });

  if (skipDesktopMotion) {
    return (
      // EVERYTHING THE SCROLL WOULD HAVE SHOWN, laid out in order. This branch
      // used to render the services list alone, which meant a reader who asked
      // for less motion lost the whole process — the heading, the four stages
      // and the closing line simply did not exist for them. Less motion is not
      // less content; the phone's own reduced branch has always done this and
      // the desktop one was the odd one out.
      <section id="services" className="relative bg-white px-6 py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ServicesListBlock />

          <h3 className="mt-28 text-center font-display text-[clamp(32px,4vw,52px)] leading-[1.05] font-bold text-black">
            {PROCESS_HEADING.join(" ")}
          </h3>

          {/* Four stages, two by two, with the same air between them as the
              cards elsewhere on the site: 40 across, 64 down. */}
          <ol className="mt-14 grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2">
            {STAGE_TITLES.map((title, index) => (
              <li key={title} className="flex flex-col items-center text-center">
                <svg
                  viewBox="-64 -64 128 128"
                  aria-hidden="true"
                  className="h-[96px] w-[96px] text-black/45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[String(index + 1).padStart(2, "0")].map((part) => (
                    <path key={part.d} d={part.d} className={part.cls} />
                  ))}
                  <IconExtras number={String(index + 1).padStart(2, "0")} />
                </svg>
                <span className="mt-3 font-display text-[13px] font-bold tracking-[0.18em] text-black/35">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="mt-2 font-display text-[26px] leading-[1.15] font-bold text-black">{title}</h4>
                <p className="mt-3 max-w-[420px] font-body text-[17px] leading-[1.7] text-black/70">
                  {STAGE_LINES[index].join(" ")}
                </p>
              </li>
            ))}
          </ol>

          {/* No closing statement here. StatementSection renders it on exactly
              this condition — see its own note — and a copy here showed the
              sentence twice, once small and once huge. */}
        </div>
      </section>
    );
  }

  return (
    // 790vh+260px scaled by the 2.1053 solved for at TIME_HOLDS. The clip is
    // 2.27x longer than the one this range was tuned against, so leaving the
    // height alone would have handed the opening 8.13s less than half the
    // scroll they had and run the whole thing at 2.27x speed.
    // 1663vh+547px of clip scrub, plus STATEMENT_TAIL_VH + STATEMENT_PARK_VH
    // for the statement's own tail after the clip has finished.
    // Then 384vh more for the longer hold on the open sheet — see TIME_HOLDS.
    <section ref={wrapperRef} id="services" className="relative h-[calc(2132vh+547px)] bg-white">
      {/* SPACER_PX of perfectly ordinary scrolling before the panel below
          goes sticky — see its own comment up top. */}
      <div ref={spacerRef} aria-hidden="true" style={{ height: `${SPACER_PX}px` }} />

      {/* Capped to exactly one viewport tall — the clip's own real aspect
          (servicesbg.mp4 is 16:9) is close enough to most viewports that
          object-contain (never crops/zooms the ball itself) shows it
          edge to edge with little to no visible margin, and any leftover
          margin is invisible anyway since the clip's own background and
          this container are both plain white. */}
      <div ref={panelRef} className="sticky -top-[20px] flex h-screen w-full flex-col overflow-hidden bg-white">
        {/* Heading zone — just the h2, sitting in plain white space above
            the video (not layered on top of it). Its own height collapses
            toward 0 as the Services text fades (see update()), so the
            video zone below grows to fill the whole panel by the time the
            paper is fully open, leaving no gap that would expose its own
            edge against the page. */}
        <div
          ref={headingZoneRef}
          className="relative z-10 flex shrink-0 items-center justify-center px-6"
          style={{ paddingTop: HEADING_ZONE_PADDING_TOP_PX, paddingBottom: HEADING_ZONE_PADDING_BOTTOM_PX }}
        >
          <ServicesHeading ref={headingRef} />
        </div>

        {/* Video zone — the ball/paper clip, plus everything that stays
            aligned with it: the subtitle, divider, and rows (Services
            phase), then About (its own phase), positioned relative to
            *this* zone rather than the whole panel.

            Pulled up under the heading rather than starting below it: the
            heading zone sits above at z-10 and simply overlaps the top of
            the footage, which buys the ball the height it needs to fit the
            screen instead of being pushed down and cropped. */}
        <div ref={videoZoneRef} className="relative -mt-[86px] min-h-0 flex-1 overflow-hidden">
          {/* The paper, drawn frame by frame by ScrollFrames — see
              lib/scrub/scroll-frames.ts for why this is no longer a <video>.
              It fits each frame the way object-fit: contain fitted the clip,
              and bg-white keeps that fit's letterbox margin the colour of the
              page.

              SOLVED: the thin vertical line that used to show beside the ball
              was the letterbox's own edge. The picture sits well inside the
              element's box, and scaling the element dragged that edge around
              with it, leaving a row of resampled pixels. It is cut off with a
              clip-path inset in update() — computed from the live box, so it
              holds at any viewport and any scale.

              Two earlier theories were measured against the video and ruled
              out, and are recorded so they are not re-tried: the letterbox
              margin's default black backing (bg-white changed nothing), and
              the clip's limited colour range rendering the picture as #EBEBEB
              (a full-range re-encode changed nothing). */}
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full bg-white" />

          {/* Two content layers share the same on-screen slot — Services
              fades/shrinks out first (as the paper unfolds), then About
              fades in on top of the now-open paper and shrinks/fades out
              in turn (as it re-crumples) — never both visible at once,
              since aboutContent starts at opacity 0 until the paper is
              open. */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-24">
            <div ref={servicesContentRef} className="flex w-full justify-end">
              <ServicesRowsBlock />
            </div>

          </div>
        </div>

        {/* On the PANEL, not inside the video zone. The zone is pulled up 86px
            and runs taller than a screen, so a box filling it is not centred on
            the screen — and the screen's centre is exactly the point this block
            has to grow out of and collapse back into. */}
        <div
          ref={aboutContentRef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6"
          style={{ opacity: 0 }}
        >
          <ProcessDiagram sheetRef={sheetRef} />
        </div>

        {/* The closing statement, delivered inside the pinned frame rather than
            as a section of its own below it. By the time it rises the clip is
            full-bleed white with the plane still in it, so the sentence reads
            as landing on the same surface the paper was on — and it is still
            there, alone on white, when the clip runs out. Sits on the panel
            rather than inside the video zone so the zone's overflow clip and
            the video's own transform can never touch it. */}
        <div
          ref={statementRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-14"
          // Scales about its own right edge, which is the edge the text is set
          // against — about the centre it would drift left as it shrank and
          // break the alignment it shares with everything else on the page.
          style={{ opacity: 0, transformOrigin: "100% 50%" }}
        >
          <p className="mx-auto max-w-[1400px] text-right font-display text-[42px] leading-[1.15] font-normal text-black md:text-[62px] lg:text-[84px]">
            עיצוב מושך תשומת לב.
            <br />
            חשיבה יוצרת תוצאה.
          </p>
        </div>
      </div>
    </section>
  );
}
