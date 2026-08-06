"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Layers, PenTool, Rocket, ShoppingBag } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { services } from "@/lib/content";
import { cn } from "@/lib/utils";

// The words live in lib/content because the mobile page renders the same four
// services and the same three facts in a layout that shares nothing else with
// this one. The icons stay here: they belong to this row design, and the mobile
// squares do not use them, so shipping them through the shared module would put
// an icon set in a bundle that never draws it.
const SERVICE_ICONS = [ShoppingBag, Rocket, Layers, PenTool];

const VIDEO_SRC = "/videos/servicesbg.mp4";
const POSTER_SRC = "/images/servicesbg-poster.jpg";
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


// What the clip does, measured off the file frame by frame rather than taken
// from the edit — 578 frames at 30fps:
//
//   0.0 - 1.3   ball at rest, Services list beside it
//   1.3 - 3.4   the ball opens out and the process diagram is revealed
//   3.4 - 6.3   the sheet lies flat: the diagram, readable
//   6.3 - 7.0   it crumples back into a ball
//   7.0 - 12.2  the ball just sits there — dead air left over from the edit
//  12.2 - 13.0  it turns into a paper plane
//  13.0 - 18.7  the plane flies out of frame
//  18.7 - 19.27 empty white
//
// Everything below is expressed against these numbers, so re-cutting the clip
// means re-measuring it and editing this block, not hunting constants.
const CUE_PAPER_OPENS = 1.3;
const CUE_DIAGRAM_FLAT = 3.4;
const CUE_BALL_REFORMED = 7.0;
const CUE_PLANE_TURN = 12.2;
const CLIP_SECONDS = 578 / 30;

// The Services list leaves as the paper starts to open, and the same value
// carries the picture from its rest framing out to full screen — which is why
// the two are one constant and not two: the framing is meant to change exactly
// while the text is going, and to be settled by the time the diagram lands.
const SERVICES_FADE_START_SECONDS = CUE_PAPER_OPENS;
const SERVICES_FADE_END_SECONDS = 2.3;
const CONTENT_SHRINK_SCALE = 0.6;
const VIDEO_REST_SCALE = 1.10;
const VIDEO_REST_SHIFT_X_PX = 45;

// servicesbg.mp4 is 16:9; used to locate the picture's own edge inside the
// letterboxed element so it can be trimmed (see update()).
const VIDEO_ASPECT = 16 / 9;
const VIDEO_EDGE_TRIM_PX = 2;

// The closing statement rises into the bottom of the pinned frame while the
// plane is still in flight, and stays there: the clip's last second is plain
// white, so once scrolling reaches the end the whole screen is the sentence on
// white, held until the pin releases into the contact stage.
const STATEMENT_FADE_IN_START_SECONDS = 15.0;
const STATEMENT_FADE_IN_END_SECONDS = 16.8;
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


// The heading zone's rest-state padding — must be animated down to 0 in
// lockstep with its own `height` (see update()), not left as a fixed
// Tailwind class: with box-sizing: border-box, a padded box's `height`
// can never be set below its own padding sum, so a fixed pt/pb class
// would silently floor the "collapse to 0" animation at that sum instead
// of actually reaching 0.
const HEADING_ZONE_PADDING_TOP_PX = 44;
const HEADING_ZONE_PADDING_BOTTOM_PX = 8;

// Scroll does not map straight onto the clip's timeline. It runs through this
// table of (progress, clip time) points and interpolates between them, which
// makes three different things expressible with one mechanism:
//
//   two points at the same TIME  -> a hold: the clip freezes while scrolling
//                                   keeps accumulating, so the page stops on
//                                   the content instead of sliding past it
//   a wide progress span         -> that stretch reads at normal speed
//   a narrow one                 -> it passes quickly
//
// It replaces a pair of simultaneous equations that could only express holds,
// and only at one rate. The dead stretch in the middle of this clip is the
// reason: five seconds of a ball doing nothing would otherwise have cost about
// four and a half screens of scrolling to sit through.
//
// Still arithmetic in both directions, so scrolling back up runs the paper
// backwards through exactly the same frames.
//
// The moving stretches are all at the rate the opening was tuned to and is
// staying at — 88.8vh per second of clip — so the first beat feels exactly as
// it did. SCRUB_VH below is the sum of every span, and the progress column is
// each running total divided by it.
const SCRUB_VH = 1565;
const TIMELINE: readonly { progress: number; time: number }[] = [
  { progress: 0.0, time: 0 },
  { progress: 0.074, time: CUE_PAPER_OPENS },
  { progress: 0.193, time: CUE_DIAGRAM_FLAT },
  { progress: 0.321, time: CUE_DIAGRAM_FLAT }, // hold: read the diagram
  { progress: 0.525, time: CUE_BALL_REFORMED },
  { progress: 0.599, time: CUE_PLANE_TURN }, // dead air, taken at a quarter rate
  { progress: 1.0, time: CLIP_SECONDS },
];

function progressToTime(progress: number) {
  const p = clamp01(progress);
  for (let i = 1; i < TIMELINE.length; i++) {
    const from = TIMELINE[i - 1];
    const to = TIMELINE[i];
    if (p <= to.progress) {
      const span = to.progress - from.progress;
      const t = span <= 0 ? 1 : (p - from.progress) / span;
      return from.time + (to.time - from.time) * t;
    }
  }
  return CLIP_SECONDS;
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
  // Only ever rendered on desktop — HomeSwitch hands phones MobileServices
  // instead, which is a design of its own rather than this one narrowed.
  const skipDesktopMotion = usePrefersReducedMotion();

  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingZoneRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const servicesContentRef = useRef<HTMLDivElement>(null);
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
    if (!wrapper || !video || !headingZone || !heading || !servicesContent) return;

    const rawScrollY = scrollY.get();
    // Against clipEnd, not pinEnd — the statement's tail past clipEnd is not
    // part of the clip's timeline, and mapping across it would slow the whole
    // scrub down and leave the clip finishing after the paper already had.
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, clipEndScrollYRef.current, 0, 1));

    // video.currentTime is a pure linear function of scroll progress
    // across the whole pinned range, so it's automatically, exactly
    // reversible on scroll-up; no separate "rewind" logic needed.
    const targetTime = progressToTime(progress);
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

    // The rest state is left exactly as it was tuned: the ball slightly
    // enlarged and shifted right, clear of the row text beside it.
    //
    // Where it eases TO is the part that changed. It used to shrink to a fixed
    // 0.86 and nudge down 63px, numbers picked by eye against one window — and
    // the sheet still ran off an edge, because the zone it is contained in is
    // taller than the screen, so "fits the zone" never meant "fits the screen".
    // That was tolerable while the paper was a texture. It now carries the
    // process diagram, which has to be read, so the open state is solved rather
    // than guessed: the picture ends up exactly contained in the viewport and
    // centred on it, at any window size. Nothing is ever cropped.
    const videoZone = videoZoneRef.current;
    let scale = VIDEO_REST_SCALE;
    let shiftY = 0;
    const shiftX = lerp(VIDEO_REST_SHIFT_X_PX, 0, servicesShrinkT);

    if (videoZone) {
      const { contentW, contentH } = containedPictureSize(video.clientWidth, video.clientHeight);
      if (contentW > 0 && contentH > 0) {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        // The largest the picture can be while still whole on screen.
        const openScale = Math.min(viewportW / contentW, viewportH / contentH);
        // The zone is pulled up above the panel, so the picture's own centre
        // and the screen's centre are not the same point — close the gap, or a
        // correctly sized frame still sits high.
        const zoneTop = videoZone.getBoundingClientRect().top;
        const openShiftY = viewportH / 2 - (zoneTop + video.clientHeight / 2);

        scale = lerp(VIDEO_REST_SCALE, openScale, servicesShrinkT);
        shiftY = lerp(0, openShiftY, servicesShrinkT);
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

  // No AboutBlock here any more: "who I am" is its own section now, and it
  // renders on the page either way.
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
    // Derived rather than written out, so the scrub range and the height that
    // has to contain it cannot drift apart: SCRUB_VH of clip, plus the
    // statement's own tail and park after the clip has finished. The 547px is
    // the fixed lead-in and pin offset, which are in pixels rather than vh.
    <section
      ref={wrapperRef}
      id="services"
      className="relative bg-white"
      style={{ height: `calc(${SCRUB_VH + STATEMENT_TAIL_VH + STATEMENT_PARK_VH}vh + 547px)` }}
    >
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
