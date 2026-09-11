"use client";

import { forwardRef, useLayoutEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Layers, PenTool, Rocket, ShoppingBag } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { services } from "@/lib/content";
import { cn } from "@/lib/utils";

// The words live in lib/content because the mobile page renders the same four
// services in a layout that shares nothing else with this one. The icons stay
// here: they belong to this row design.
const SERVICE_ICONS = [ShoppingBag, Rocket, Layers, PenTool];

const VIDEO_SRC = "/videos/servicesbg.mp4";
const POSTER_SRC = "/images/servicesbg-poster.jpg";
// The source is ~8.15s, but the phase math below always reads the real
// value off the element once its metadata loads (see videoDurationRef) —
// this is only what renders before that, and a safety fallback if
// `loadedmetadata` never fires for some reason.
const VIDEO_DURATION_FALLBACK = 8.15;
// The clip's own frame rate. Scroll is quantised onto this grid so the scrub
// only ever seeks when the frame on screen would actually change.
const VIDEO_FPS = 30;

// Phase 0 ("lead-in"): SPACER_PX worth of perfectly ordinary scrolling
// before the panel below goes sticky at all — a plain block, not pinned
// yet. Without this the panel's own natural top sits at the very start
// of the wrapper, so it went sticky the instant the section entered view
// at all, with the illustration's own top corners still cramped right up
// against the sticky offset instead of having scrolled into a settled
// position first (confirmed: a too-small value here reads as the images
// getting clipped at the top the moment it locks). Not part of the
// pinned range itself — purely a scroll distance to cover first.
const SPACER_PX = 35;


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
// video.currentTime maps linearly across the ENTIRE pinned range (progress
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
const ABOUT_FADE_IN_START_SECONDS = SERVICES_FADE_END_SECONDS + 0.5;
const ABOUT_FADE_IN_END_SECONDS = 3.4 - 0.8 + 0.5 + SERVICES_HOLD_SECONDS;
const ABOUT_FADE_OUT_START_SECONDS = 5 + 6 / 30 - 0.5;
const ABOUT_FADE_OUT_END_SECONDS = 6.1 - 0.5;

// The heading on the sheet runs on its own clock, inside the drawing's: it
// comes up after the drawing has started arriving, and it leaves a full second
// before the drawing does.
//
// Those two pull against each other. The drawing is not fully in until 3.60s
// and the heading has to be gone from 3.70s, so the entrance has to finish
// inside that gap — the heading stands at full strength for about a tenth of a
// second before it starts going again. If it wants a life of its own, the
// second below is the number to reduce.
const HEADING_LEAD_SECONDS = 1;
const HEADING_IN_START_SECONDS = ABOUT_FADE_IN_START_SECONDS + 0.3;
const HEADING_IN_END_SECONDS = ABOUT_FADE_IN_END_SECONDS;
const HEADING_OUT_START_SECONDS = ABOUT_FADE_OUT_START_SECONDS - HEADING_LEAD_SECONDS;
const HEADING_OUT_END_SECONDS = ABOUT_FADE_OUT_END_SECONDS - HEADING_LEAD_SECONDS;
// How far it lifts as it comes up, in the diagram's own pixels.
const HEADING_RISE_PX = 26;
const CONTENT_SHRINK_SCALE = 0.6;
const VIDEO_REST_SCALE = 1.10;
const VIDEO_REST_SHIFT_X_PX = 45;

// servicesbg.mp4 is 16:9; used to locate the picture's own edge inside the
// letterboxed element so it can be trimmed (see update()).
const VIDEO_ASPECT = 16 / 9;
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
const HEADING_ZONE_PADDING_TOP_PX = 54;
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
// and Sn = 0.13 / 2.1053. Both numbers below are those results.
const TIME_HOLDS: { at: number; share: number }[] = [
  { at: 3.7, share: 0.0617 }, // "מי אני" fully up, paper flat
];
const TOTAL_HOLD_SHARE = TIME_HOLDS.reduce((sum, h) => sum + h.share, 0);

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
  // A degenerate range divides by zero, and 0/0 is NaN — which then flows all
  // the way to video.currentTime and throws. That is not hypothetical: on
  // mount, update() runs once BEFORE measurePinRange() has given the pin its
  // real bounds, so both ends are still 0.
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

interface ServiceRowProps {
  service: (typeof services)[number];
  index: number;
}

// Every row hovers to the same grey. It used to be a different accent per row,
// which fought the black-and-white section around it; a single neutral reads as
// a hover state rather than as four unrelated brand colours.
// Literal class strings (not built from interpolation) so Tailwind's JIT
// scanner — which only ever detects classes it can see verbatim in the
// source — actually generates these arbitrary-color utilities.
const ROW_HOVER_TEXT_CLASS = "group-hover:text-[#8A8A8A]";
const ROW_HOVER_BORDER_CLASS = "group-hover:border-[#8A8A8A]";

function ServiceRow({ service, index }: ServiceRowProps) {
  const Icon = SERVICE_ICONS[index];
  const hoverTextClass = ROW_HOVER_TEXT_CLASS;
  const hoverBorderClass = ROW_HOVER_BORDER_CLASS;
  return (
    <Link
      href={service.href}
      className="group flex items-center justify-between gap-6 border-b border-black/8 py-5 pe-10 first:pt-0 last:border-b-0"
    >
      <div className="flex items-center gap-5">
        <span className={cn("font-display text-5xl leading-none font-bold text-black transition-colors duration-200", hoverTextClass)}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="w-px self-stretch bg-black/10" />
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.02] transition-colors duration-200",
            hoverBorderClass
          )}
        >
          <Icon size={20} strokeWidth={1.5} className={cn("text-black/70 transition-colors duration-200", hoverTextClass)} />
        </div>
        <div className="text-right">
          <h3 className={cn("font-display text-lg font-bold text-black transition-colors duration-200", hoverTextClass)}>{service.title}</h3>
          <p
            className={cn(
              "mt-1 whitespace-pre-line font-body text-[13px] leading-[1.6] text-black/55 transition-colors duration-200",
              hoverTextClass
            )}
          >
            {service.description}
          </p>
        </div>
      </div>

      <ArrowLeft
        aria-hidden
        size={32}
        strokeWidth={2.25}
        className="shrink-0 text-black transition-transform duration-200 group-hover:-translate-x-1"
      />
    </Link>
  );
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
        אני בונה פתרונות דיגיטליים
        <br />
        לעסקים שרוצים תוצאות.
      </h2>
      <p className="mt-2 font-body text-[15px] leading-[1.8] text-black/55">ובתכל&rsquo;ס, זה מה שאני עושה:</p>
    </div>
  );
});

function ServicesRowsBlock() {
  return (
    <div
      className="isolate mx-auto flex w-full max-w-[900px] -translate-x-[15px] translate-y-[94px] justify-end"
    >
      <div className="flex w-full max-w-[480px] origin-center scale-[0.95] flex-col">
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
      <div className="mt-6">
        <ServicesRowsBlock />
      </div>
    </div>
  );
}


/**
 * The process, drawn on the open sheet.
 *
 * It sits in the slot the "who I am" block used to occupy, on the same cues and
 * with the same grow-and-shrink, because that slot is exactly "whatever is
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
function ProcessDiagram({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-6">
      {/* Held a little inside the sheet's width. At full bleed the drawing runs
          to the edges of the page it is printed on, which reads as a background
          rather than as something drawn there. */}
      <div className="relative mx-auto w-[79%]">
        {/* Top right, which under RTL is where a page begins. right-0 rather
            than a logical property on purpose: this is pinned to the physical
            corner of the sheet, not to the start of a line of text. */}
        <h3
          ref={headingRef}
          className="absolute top-0 right-0 z-10 font-display text-[26px] leading-[1.05] font-bold text-black will-change-transform md:text-[40px]"
          style={{ opacity: 0 }}
        >
          איך אני
          <br />
          עובד?
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
          alt=""
          width={1920}
          height={1080}
          className="block h-auto w-full"
          draggable={false}
        />

        <ProcessStations />
      </div>
    </div>
  );
}

// The four stations, in the plate's own pixel space, each a self-contained
// block centred on its point: the numeral, the heading under it, the copy under
// that. The plate carries no icons any more, so a station is type and nothing
// else — and type stacked on its own centre is the one arrangement that does
// not look like it is missing the picture that used to sit beside it.
//
// `titleY` is the baseline of the heading; everything else is measured off it.
// Lines are split by hand because SVG text does not wrap. That is the price of
// placing every glyph exactly where it belongs on the page.
const STATIONS = [
  {
    number: "01",
    cx: 960,
    titleY: 305,
    iconDy: -20,
    title: "מבינים את העסק",
    lines: ["לפני הכול יושבים ומדברים: מה המטרה, מי הקהל,", "ומה כבר לא עובד. אתר טוב מתחיל בהבנה."],
  },
  {
    number: "02",
    cx: 1625,
    titleY: 616,
    iconDy: -10,
    title: "מעצבים את החוויה",
    lines: ["כל מסך, כל מרווח וכל צבע נבחרים בכוונה —", "שהגולש ידע לאן ללכת, לא רק שיהיה לו יפה."],
  },
  {
    number: "03",
    cx: 960,
    titleY: 928,
    iconDy: 0,
    title: "בונים את זה נכון",
    lines: ["קוד נקי ומהיר שבנוי להחזיק שנים, בלי הפתעות", "כשתרצו לשנות או להוסיף משהו."],
  },
  {
    number: "04",
    cx: 295,
    titleY: 616,
    iconDy: -9,
    title: "עולים לאוויר",
    lines: ["ביום ההשקה אני שם, וגם הרבה אחריו —", "ממשיכים לתקן, לשפר ולגדול יחד."],
  },
] as const;

// The arrows, as arcs of ONE ellipse — the one that passes through all four
// station centres, centred between them at (960, 616) with radii 665 and 311.
// Each runs from 32 degrees past one station to 32 short of the next, so they
// read as a single circle broken four times rather than four curves that happen
// to line up. Clockwise throughout, which is why every sweep flag is 1.
const ARROWS = [
  "M 1312.4 352.4 A 665 311 0 0 1 1523.9 451.4",
  "M 1523.9 781.6 A 665 311 0 0 1 1312.4 880.6",
  "M 607.6 880.6 A 665 311 0 0 1 396.1 781.6",
  "M 396.1 451.4 A 665 311 0 0 1 607.6 352.4",
];

// One icon per station, drawn around its own origin so a station only has to
// say where its centre is. Stroked, not filled, at the same weight as the
// arrows — the plate under them is pencil, and a solid shape would read as
// pasted onto the page rather than drawn on it.
//
// EACH ONE MOVES THE WAY THE THING IT DRAWS WOULD, which is the difference
// between four icons and four animations: the rocket flies and its flame
// flickers, the reply bubble answers the first one, the brackets breathe apart,
// the browser drifts. One shared bob across all four would read as a page that
// wobbles. The classes are defined in globals.css, where the reduced-motion
// switch turns every one of them off in a single rule.
type IconPart = { d: string; cls?: string };

const ICONS: Record<string, IconPart[]> = {
  // Two speech bubbles: a conversation, which is what the first stage is. The
  // second one arrives late and holds, the way a reply does.
  "01": [
    {
      d: "M -42 -30 h 54 a 10 10 0 0 1 10 10 v 26 a 10 10 0 0 1 -10 10 h -32 l -16 14 v -14 h -6 a 10 10 0 0 1 -10 -10 v -26 a 10 10 0 0 1 10 -10 z",
    },
    {
      d: "M 4 6 h 32 a 9 9 0 0 1 9 9 v 15 a 9 9 0 0 1 -9 9 h -5 v 12 l -13 -12 h -14 a 9 9 0 0 1 -9 -9 v -15 a 9 9 0 0 1 9 -9 z",
      cls: "icon-reply",
    },
  ],
  // A sheet being painted on. The three marks draw themselves in turn and then
  // clear, and the brush works along with them — design as something happening,
  // not a finished page.
  "02": [
    { d: "M -34 -44 h 58 a 7 7 0 0 1 7 7 v 74 a 7 7 0 0 1 -7 7 h -58 a 7 7 0 0 1 -7 -7 v -74 a 7 7 0 0 1 7 -7 z" },
    { d: "M -22 -22 q 22 -11 44 0", cls: "icon-paint-1" },
    { d: "M -22 0 q 22 -11 44 0", cls: "icon-paint-2" },
    { d: "M -22 22 q 14 -9 28 -3", cls: "icon-paint-3" },
    // A real brush rather than a line with a blob on it: a long handle that
    // tapers, the metal ferrule, and bristles that come to a point. Three
    // shapes is the fewest that reads as a brush at this size — two reads as a
    // pencil.
    { d: "M 32 -54 L 40 -52 L 28 -4 L 20 -6 Z", cls: "icon-brush" },
    { d: "M 20 -6 L 28 -4 L 26 8 L 18 6 Z", cls: "icon-brush" },
    { d: "M 18 6 L 26 8 L 20 30 Z", cls: "icon-brush" },
  ],
  // A browser window with a wireframe in it — the thing that actually gets
  // built. It carried stage two until the sheet took that over.
  "03": [
    {
      d: "M -46 -34 h 92 a 6 6 0 0 1 6 6 v 56 a 6 6 0 0 1 -6 6 h -92 a 6 6 0 0 1 -6 -6 v -56 a 6 6 0 0 1 6 -6 z",
    },
    { d: "M -52 -16 h 104" },
    { d: "M -36 -4 h 30 v 28 h -30 z" },
    { d: "M 6 -2 h 38" },
    { d: "M 6 10 h 38" },
    { d: "M 6 22 h 24" },
  ],
  // A rocket, mid-launch: the body rides up and down and the three exhaust
  // ticks flicker on their own, much faster clock.
  "04": [
    { d: "M 0 -46 C 16 -28 22 -6 22 12 L 22 26 L -22 26 L -22 12 C -22 -6 -16 -28 0 -46 Z" },
    { d: "M -22 6 L -38 30 L -22 26" },
    { d: "M 22 6 L 38 30 L 22 26" },
    { d: "M -10 32 L -6 44", cls: "icon-flame" },
    { d: "M 0 32 L 0 48", cls: "icon-flame" },
    { d: "M 10 32 L 6 44", cls: "icon-flame" },
  ],
};

/** The motion carried by the icon as a whole, rather than by one of its parts. */
const ICON_MOTION: Record<string, string> = {
  "01": "icon-drift",
  "02": "",
  "03": "icon-drift",
  "04": "icon-rocket",
};

function ProcessStations() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="ארבעת שלבי העבודה: מבינים את העסק, מעצבים את החוויה, בונים את זה נכון, עולים לאוויר"
    >
      <defs>
        {/* orient="auto" turns the head to follow the path, so one marker
            serves all four arrows whichever way they curve. */}
        <marker
          id="process-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </marker>

        {/* THE HALO, as a filter rather than a stroke.
            A thick white stroke under the fill reads as exactly that — a hard
            outline traced around every letter, with its own edge. This takes
            the type's alpha, spreads it a little, blurs it, and floods the
            result white: a soft field that fades out with no edge of its own,
            which is what lifts the words off a pencil drawing without
            announcing itself.
            dilate before blur is what gives it body. Blur alone puts the glow's
            half-strength right at the glyph's own edge, so the letters end up
            sitting in a grey fringe instead of a clean white one. */}
        <filter id="process-halo" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="spread" />
          <feGaussianBlur in="spread" stdDeviation="7" result="soft" />
          {/* NO feFlood. A flood fills the filter's whole region and then
              relies on a composite to cut it back to the blur — and when that
              clip does not take, what is left is a pale rectangle across the
              entire drawing, which is exactly what happened. This recolours the
              blurred alpha in place instead: the channel transfer forces RGB to
              white while leaving alpha alone, so the halo can only ever exist
              where the type does. The A ramp is what makes it translucent. */}
          <feComponentTransfer in="soft" result="halo">
            <feFuncR type="linear" slope="0" intercept="1" />
            <feFuncG type="linear" slope="0" intercept="1" />
            <feFuncB type="linear" slope="0" intercept="1" />
            {/* slope above 1 on purpose: alpha clamps at 1, so the inner part
                of the blur saturates to solid white and only the outer edge
                keeps its falloff. That is what a halo needs against a drawing —
                opaque where it is clearing the line work, soft where it meets
                the paper. At 0.9 the whole thing was translucent and the pencil
                read straight through the type. */}
            <feFuncA type="linear" slope="2.1" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="text-black/45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        {ARROWS.map((d) => (
          <path key={d} d={d} markerEnd="url(#process-arrowhead)" />
        ))}
      </g>

      {/* Each station stacks on its own centre: icon, numeral, heading, copy.
          direction rtl and a middle anchor because the copy is Hebrew and every
          station is centred on itself, not set in a column. */}
      {/* The halo is on the whole block rather than on each piece: applied per
          element, every glyph would glow onto its neighbour and the words would
          sit in a bank of white. One filter over the group means the halo is
          computed from the block's silhouette. */}
      <g direction="rtl" textAnchor="middle" filter="url(#process-halo)">
        {STATIONS.map((station) => (
          <g key={station.number}>
            {/* TWO GROUPS, AND THAT IS THE POINT OF THEM.
                The outer one carries the position as an SVG `transform`
                attribute; the inner one carries the animation, which is a CSS
                `transform` property. Put on one element they do not combine —
                the CSS property wins outright and the attribute is discarded,
                so every animated icon lost its placement and stacked up in the
                corner of the drawing at 0,0.
                iconDy on the outer one corrects for the artwork: the four icons
                are not the same height, so one shared offset left the rocket
                sitting closer to its numeral than the browser window was to
                its. Measured per station, so all four gaps come out the same. */}
            <g transform={`translate(${station.cx} ${station.titleY - 246 + station.iconDy})`}>
              <g
                className={`text-black/45 ${ICON_MOTION[station.number]}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[station.number].map((part) => (
                  <path key={part.d} d={part.d} className={part.cls} />
                ))}
                {station.number === "04" && <circle cx="0" cy="-8" r="9" />}
                {station.number === "03" && (
                  <g strokeWidth="0" fill="currentColor">
                    <circle cx="-40" cy="-25" r="2.6" />
                    <circle cx="-30" cy="-25" r="2.6" />
                    <circle cx="-20" cy="-25" r="2.6" />
                  </g>
                )}
              </g>
            </g>

            <text
              x={station.cx}
              y={station.titleY - 92}
              className="fill-black/25 font-display text-[76px] font-bold"
            >
              {station.number}
            </text>
            <text x={station.cx} y={station.titleY} className="fill-black font-display text-[44px] font-bold">
              {station.title}
            </text>
            {station.lines.map((line, index) => (
              <text
                key={line}
                x={station.cx}
                y={station.titleY + 61 + index * 34}
                className="fill-black/55 font-body text-[24px]"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

const BackgroundVideo = forwardRef<HTMLVideoElement, { className?: string; autoPlay?: boolean }>(
  function BackgroundVideo({ className, autoPlay = false }, ref) {
    return (
      <video
        ref={ref}
        aria-hidden="true"
        tabIndex={-1}
        muted
        playsInline
        loop={autoPlay}
        autoPlay={autoPlay}
        preload="auto"
        poster={POSTER_SRC}
        disablePictureInPicture
        className={className}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    );
  }
);

export default function ServicesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Only ever rendered on desktop — HomeSwitch hands phones MobileServices.
  const skipDesktopMotion = prefersReducedMotion;

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingZoneRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const servicesContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const processHeadingRef = useRef<HTMLHeadingElement>(null);
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
  const videoDurationRef = useRef(VIDEO_DURATION_FALLBACK);
  const videoReadyRef = useRef(false);
  // Which video frame was last asked for, so an unchanged frame costs nothing.
  const lastSeekFrameRef = useRef(-1);

  const { scrollY } = useScroll();

  const update = () => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    const headingZone = headingZoneRef.current;
    const heading = headingRef.current;
    const servicesContent = servicesContentRef.current;
    const aboutContent = aboutContentRef.current;
    if (!wrapper || !video || !headingZone || !heading || !servicesContent || !aboutContent) return;

    const rawScrollY = scrollY.get();
    // Against clipEnd, not pinEnd — the statement's tail past clipEnd is not
    // part of the clip's timeline, and mapping across it would slow the whole
    // scrub down and leave the clip finishing after the paper already had.
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, clipEndScrollYRef.current, 0, 1));

    // video.currentTime is a pure linear function of scroll progress
    // across the whole pinned range, so it's automatically, exactly
    // reversible on scroll-up; no separate "rewind" logic needed.
    const targetTime = progressToTime(progress, videoDurationRef.current);
    // Seek to the FRAME the target time falls in, not to the exact time, and
    // only when that frame actually changes.
    //
    // The old test fired whenever the target moved more than 8ms — a quarter of
    // a frame at 30fps — so most frames issued a seek that could not change a
    // single displayed pixel, and each one still costs a full decode. Landing
    // on the frame's own midpoint also keeps the browser from picking the
    // neighbouring frame on a rounding boundary, which is what makes a slow
    // drag flicker between two frames instead of holding one.
    // Number.isFinite guards the boundary itself: setting currentTime to a
    // non-finite value throws a TypeError, and this is the one place a bad
    // number can reach the media element.
    if (videoReadyRef.current && Number.isFinite(targetTime)) {
      const frame = Math.round(targetTime * VIDEO_FPS - 0.5);
      const snapped = (frame + 0.5) / VIDEO_FPS;
      if (frame !== lastSeekFrameRef.current) {
        lastSeekFrameRef.current = frame;
        video.currentTime = snapped;
      }
    }

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
      const { contentW, contentH } = containedPictureSize(video.clientWidth, video.clientHeight);
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
        const centreShiftY = panelH / 2 - (videoZone.offsetTop + video.clientHeight / 2);
        scale = lerp(scale, coverScale, fullBleedT);
        shiftX = lerp(shiftX, 0, fullBleedT);
        shiftY = lerp(shiftY, centreShiftY, fullBleedT);
      }
    }

    video.style.transform = `translateX(${shiftX}px) translateY(${shiftY}px) scale(${scale})`;

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

    // object-contain letterboxes the frame inside the element, so the picture
    // has its own edge sitting well inside the element's box — and scaling the
    // element drags that edge around with it. That edge is where a hairline has
    // been showing up. Clipping a couple of pixels off the picture's own bounds
    // removes the edge row the browser resamples, and the replacement boundary
    // is a plain CSS clip through flat white, which has nothing to resample.
    // Computed from the live box rather than hardcoded, so it tracks the
    // element at any viewport and any scale.
    const elW = video.clientWidth;
    const elH = video.clientHeight;
    if (elW > 0 && elH > 0) {
      const { contentW, contentH } = containedPictureSize(elW, elH);
      const insetX = (elW - contentW) / 2 + VIDEO_EDGE_TRIM_PX;
      const insetY = (elH - contentH) / 2 + VIDEO_EDGE_TRIM_PX;
      video.style.clipPath = `inset(${insetY}px ${insetX}px)`;
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

    const aboutFadeInT = smoothstep(mapRange(targetTime, ABOUT_FADE_IN_START_SECONDS, ABOUT_FADE_IN_END_SECONDS, 0, 1));
    const aboutShrinkT = smoothstep(mapRange(targetTime, ABOUT_FADE_OUT_START_SECONDS, ABOUT_FADE_OUT_END_SECONDS, 0, 1));
    // Same combined curve drives both opacity and scale — small and
    // invisible before it starts, growing to full size as it fades in,
    // then shrinking back down as it fades out, instead of popping in at
    // full size the instant opacity starts rising.
    const aboutGrowT = aboutFadeInT * (1 - aboutShrinkT);
    // Both the entrance and the exit scale about the centre of the screen, so
    // the block grows out of that point and collapses straight back into it
    // rather than drifting toward a corner on the way out.
    //
    // The origin is recomputed on every frame where the block is at its own
    // full size, from its live box: the element is centred by flex, but the
    // panel it sits in is only one screen tall while the block's own box is
    // not necessarily the same height, so "the middle of the element" and
    // "the middle of the screen" are not the same point and the difference
    // moves with the viewport. Measuring it live also means a fast flick that
    // skips the fully-grown frame entirely cannot leave a stale origin behind
    // — the fallback below is already screen-centre in element terms.
    // The block is centred on the screen, so its own centre IS the screen
    // centre and a plain 50% 50% origin grows it out of that point and
    // collapses it straight back into it. Nothing measured, so there is no
    // origin that can go stale when a fast flick skips a frame.
    aboutContent.style.transformOrigin = "50% 50%";
    aboutContent.style.opacity = String(aboutGrowT);
    aboutContent.style.transform = `translateY(${ABOUT_SHIFT_Y_PX}px) scale(${lerp(CONTENT_SHRINK_SCALE, 1, aboutGrowT)})`;

    // The heading over the drawing, on its own clock inside the block's. Its
    // opacity multiplies with the block's, so this is only ever a fraction of
    // whatever the sheet is already showing — it can come up later and leave
    // earlier, but it can never outlive the page it is printed on.
    const processHeading = processHeadingRef.current;
    if (processHeading) {
      const headingIn = smoothstep(
        mapRange(targetTime, HEADING_IN_START_SECONDS, HEADING_IN_END_SECONDS, 0, 1),
      );
      const headingOut = smoothstep(
        mapRange(targetTime, HEADING_OUT_START_SECONDS, HEADING_OUT_END_SECONDS, 0, 1),
      );
      const headingT = headingIn * (1 - headingOut);
      processHeading.style.opacity = String(headingT);
      processHeading.style.transform = `translateY(${lerp(HEADING_RISE_PX, 0, headingIn).toFixed(2)}px)`;
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
    const video = videoRef.current;
    if (!wrapper || !video) return;

    // iOS Safari can leave programmatic currentTime seeks doing nothing
    // visually until the video has been through one real play/pause cycle
    // — priming it here (safe without a user gesture since it's muted)
    // is what makes every seek afterward actually paint.
    const handleLoadedMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        videoDurationRef.current = video.duration;
      }
      video.play().then(() => video.pause()).catch(() => {});
      videoReadyRef.current = true;
      update();
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    }

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
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipDesktopMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!skipDesktopMotion) update();
  });

  if (skipDesktopMotion) {
    return (
      <section id="services" className="relative bg-white px-6 py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ServicesListBlock />
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
    <section ref={wrapperRef} id="services" className="relative h-[calc(1748vh+547px)] bg-white">
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
          {/* bg-white keeps object-contain's letterbox margin the same colour
              as the page.

              SOLVED: the thin vertical line that used to show beside the ball
              was object-contain's own letterbox edge. The picture sits well
              inside the element's box, and scaling the element dragged that
              edge around with it, leaving a row of resampled pixels. It is cut
              off with a clip-path inset in update() — computed from the live
              box, so it holds at any viewport and any scale.

              Two earlier theories were measured and ruled out, and are recorded
              so they are not re-tried: the letterbox margin's default black
              backing (bg-white changed nothing), and the clip's limited colour
              range rendering the video rect as #EBEBEB (a full-range re-encode
              changed nothing, and broke the GOP in the process).

              If this clip is ever re-encoded, it MUST keep a dense GOP
              (-g 5; the source carries a keyframe every 5 frames). The
              scroll scrub seeks currentTime on every tick, so a default
              GOP makes each seek decode dozens of frames and visibly
              wrecks the animation. */}
          <BackgroundVideo ref={videoRef} className="absolute inset-0 h-full w-full bg-white object-contain" />

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
          <ProcessDiagram headingRef={processHeadingRef} />
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
