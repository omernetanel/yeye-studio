"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { services } from "@/lib/content";
import {
  ICONS,
  ICON_MOTION,
  IconExtras,
  PROCESS_HEADING,
  STAGE_TITLES,
} from "../process/stages";

const CLIP_SRC = "/mobile/videos/servicesbg-mobile.mp4";
const CLIP_POSTER = "/mobile/images/servicesbg-mobile-poster.jpg";

// The clip's own frame rate and length, measured off the file: 458 frames at
// 30fps. Scroll is quantised onto that grid so a seek only ever goes out when
// the frame on screen would actually change — without it every animation frame
// asks for a decode the viewer cannot see.
const CLIP_FPS = 30;
const CLIP_SECONDS = 458 / CLIP_FPS;

// Cues taken from the edit, written the way they were read off it —
// seconds plus frames at 30fps.
const CUE_SERVICES_OUT = 1 + 22 / 30; // the paper opens and the list goes with it
const CUE_ABOUT_IN = 2 + 17 / 30; // "who I am" starts to arrive
const CUE_PAPER_FLAT = 3 + 12 / 30; // the sheet is fully open and holds still
const CUE_ABOUT_OUT = 4 + 29 / 30; // it collapses inward with the crumple
const CUE_STATEMENT_IN = 10 + 23 / 30; // the closing line rises behind the plane

const FADE_SECONDS = 0.35;

/**
 * How much scrolling each stretch of the clip is worth, written as the number
 * of screen-heights it takes to REACH each cue from the one before it.
 *
 * NOTHING HERE EVER HOLDS. There used to be two stops — a fifth of the run on
 * frame zero, and another fifth frozen on the flat sheet — which together left
 * four and a half screens of scrolling where the picture did not move at all.
 * On a desk that reads as a beat. In a hand it reads as a page that has caught
 * on something, because the finger is still travelling and nothing is coming
 * back. The rule the desktop already follows applies here too: slow down over
 * what matters, never stop.
 *
 * So the reading beats are paid for with a slower rate instead of a stop. The
 * open-sheet stretch runs at about a third of the speed of the crumple — and
 * the clip is nearly still through it anyway, so a slow rate there looks calm
 * rather than sluggish, while the long empty stretch after it is over quickly.
 *
 * Because it is arithmetic in both directions rather than a played timeline,
 * scrolling back up runs the paper backwards through exactly the same frames.
 */
const BEATS: readonly { screens: number; time: number }[] = [
  { screens: 0, time: 0 },
  { screens: 1.5, time: CUE_SERVICES_OUT }, // the ball sits still; read the four services
  { screens: 1.3, time: CUE_PAPER_FLAT }, // it opens
  { screens: 1.9, time: CUE_ABOUT_OUT }, // flat and legible: the process is on it
  { screens: 2.2, time: CUE_STATEMENT_IN }, // crumple and flight, at speed
  { screens: 1.8, time: CLIP_SECONDS }, // the closing line rises as the sheet lands
];

const SCROLL_SCREENS = BEATS.reduce((total, beat) => total + beat.screens, 0);

/** The same beats as (progress, time) points, which is what the scrub reads. */
const TIMELINE = BEATS.reduce<{ progress: number; time: number }[]>((points, beat, index) => {
  const previous = index === 0 ? 0 : points[index - 1].progress;
  points.push({ progress: previous + beat.screens / SCROLL_SCREENS, time: beat.time });
  return points;
}, []);

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

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

/** 0 before `from`, 1 after `from + FADE_SECONDS`. */
function fadeIn(time: number, from: number) {
  return clamp01((time - from) / FADE_SECONDS);
}

/** 1 until `FADE_SECONDS` before `until`, 0 at it. */
function fadeOut(time: number, until: number) {
  return clamp01((until - time) / FADE_SECONDS);
}

/**
 * The services section, rebuilt for the phone around a 9:16 cut of the clip.
 *
 * Nothing here is the desktop layout reflowed. The desktop carries the same
 * three beats on a 16:9 clip it has to scale and shift into place; this cut is
 * already framed for the screen, so the picture never moves and the only thing
 * scroll drives is which frame is showing and which words are over it.
 */
export default function MobileServices() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const servicesLayerRef = useRef<HTMLDivElement>(null);
  const aboutLayerRef = useRef<HTMLDivElement>(null);
  const statementLayerRef = useRef<HTMLDivElement>(null);
  const seekFrameRef = useRef(-1);

  const update = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const video = videoRef.current;
    const servicesLayer = servicesLayerRef.current;
    const aboutLayer = aboutLayerRef.current;
    const statementLayer = statementLayerRef.current;
    if (!wrapper || !panel || !video || !servicesLayer || !aboutLayer || !statementLayer) return;

    // The panel's own height, not window.innerHeight. Both are one screen, but
    // the panel is sized in svh — the height with the browser chrome showing,
    // which does not move — while innerHeight grows and shrinks as the address
    // bar hides on scroll. Measuring the moving one would shift the whole
    // mapping mid-scrub, which reads as the clip jumping under the finger.
    const travel = wrapper.getBoundingClientRect().height - panel.offsetHeight;
    if (travel <= 0) return;

    const progress = clamp01(-wrapper.getBoundingClientRect().top / travel);
    const time = progressToTime(progress);

    const frame = Math.min(Math.round(time * CLIP_FPS), 458 - 1);
    if (frame !== seekFrameRef.current) {
      seekFrameRef.current = frame;
      // Seek to the middle of the frame's own slot rather than its edge, so
      // rounding never lands a hair before it and decodes the one before.
      video.currentTime = (frame + 0.5) / CLIP_FPS;
    }

    servicesLayer.style.opacity = String(fadeOut(time, CUE_SERVICES_OUT));

    const aboutOpacity = Math.min(fadeIn(time, CUE_ABOUT_IN), fadeOut(time, CUE_ABOUT_OUT));
    aboutLayer.style.opacity = String(aboutOpacity);

    const statementOpacity = fadeIn(time, CUE_STATEMENT_IN);
    statementLayer.style.opacity = String(statementOpacity);
    // Rises the last stretch into place rather than appearing already settled.
    statementLayer.style.transform = `translateY(${(1 - statementOpacity) * 28}px)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    // iOS Safari can leave programmatic currentTime seeks doing nothing
    // visually until the video has been through one real play/pause cycle —
    // priming it here (safe without a gesture since it is muted) is what makes
    // every seek afterwards actually paint.
    const handleLoadedMetadata = () => {
      video.play().then(() => video.pause()).catch(() => {});
      update();
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    }

    update();

    const handleResize = () => update();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="services" className="bg-white px-6 py-20 text-right">
        <ServicesHeading />
        <ServiceGrid className="mt-8" />
        <div className="mt-20">
          <ProcessDiagram />
        </div>
        <Statement className="mt-20" />
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      id="services"
      className="relative bg-white"
      style={{ height: `calc(${SCROLL_SCREENS} * 100svh)` }}
    >
      {/* overflow-clip, never overflow-hidden: hidden turns this into a scroll
          container, which would stop the panel below from sticking at all. */}
      <div ref={panelRef} className="sticky top-0 h-[100svh] overflow-clip">
        {/* The contained box for a 9:16 clip, worked out in CSS rather than
            measured: as wide as the panel, but never taller than it. The clip
            was framed at this ratio deliberately, so it is shown whole instead
            of being cropped to fill — and because it is white on white, the
            margins that leaves are invisible against the page. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-[9/16] w-[min(100%,calc(100svh*9/16))]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              src={CLIP_SRC}
              poster={CLIP_POSTER}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />

            {/* Anchored to the picture, not to the screen, because both of
                these sit in the gaps the paper ball leaves: the heading in the
                empty column beside it, the grid in the empty band below. */}
            <div ref={servicesLayerRef} className="absolute inset-0">
              <ServicesHeading className="absolute top-[7%] left-[6%] w-[44%]" />
              <ServiceGrid className="absolute inset-x-[5%] bottom-[3%]" />
            </div>
          </div>
        </div>

        {/* Anchored to the screen rather than to the picture: by the time
            either of these is up the frame is a flat sheet or empty white, so
            there is no composition left to sit beside. */}
        <div
          ref={aboutLayerRef}
          className="absolute inset-0 flex flex-col justify-center px-7 opacity-0"
        >
          <ProcessDiagram />
        </div>

        {/* 22%, not 11%. The clip is 9:16 inside a screen that is taller than
            that, so the bottom eighth of this panel is the letterbox — the line
            was sitting half on the footage and half on white. */}
        <div ref={statementLayerRef} className="absolute inset-x-0 bottom-[22%] px-6 opacity-0">
          <Statement />
        </div>
      </div>
    </section>
  );
}

function ServicesHeading({ className }: { className?: string }) {
  return (
    <h2
      className={`font-display text-m-title font-bold text-balance text-black ${className ?? ""}`}
    >
      מה אני עושה
    </h2>
  );
}

/**
 * Titles only. The sentence under each one is what the service pages are for,
 * and at this size four of them turns a glance into a wall of text.
 */
function ServiceGrid({ className }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 ${className ?? ""}`}>
      {services.map((service, index) => (
        <li key={service.title}>
          <Link
            href={service.href}
            className="flex aspect-[4/3] flex-col justify-between rounded-lg border border-black/12 bg-white/70 p-3 text-right backdrop-blur-[2px]"
          >
            <span className="font-display text-m-small leading-none font-bold text-black/35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-m-sub font-bold text-balance text-black">
              {service.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// The drawing's own coordinate space. Everything below is in these units, and
// the viewBox is what turns them into whatever width the phone gives us — so
// the whole diagram scales as one piece and nothing has to be measured.
const ART_W = 600;
const ART_H = 1000;
// The column the icons stand in, and the four heights they stand at. The right
// side, because this is RTL and that is where a line starts.
const ICON_X = 498;
const ROW_Y = [140, 380, 620, 860];
// Where the connector leaves one icon and where it arrives at the next: the
// icons are about 110 units tall, so this clears the tallest of them.
const CONNECTOR_CLEARANCE = 66;
// How far each connector bows sideways. Alternating, so the four stations read
// as one line winding down the page rather than a stack joined by dashes —
// the same idea as the desktop's single broken ellipse, stood on end.
const CONNECTOR_BOW = 52;

/**
 * The process, drawn on the open sheet — in the slot the "who I am" block used
 * to occupy and on the same cues: that slot is "whatever is printed on the
 * paper while it is open", and a diagram uses an open page better than a column
 * of prose did. "Who I am" is a section of its own now, so leaving it here as
 * well showed it twice on the phone.
 *
 * This is the desktop's diagram rearranged, not a different idea: same four
 * stations, same artwork, same numerals, connected by one line that turns four
 * separate items into a route. What changes is the shape it is laid out on. The
 * desktop has a landscape sheet and puts the stations on an ellipse; a phone
 * sheet is a tall column, and a ring in a column is a ring with nothing in it.
 *
 * Titles only, no copy under them. This is printed on a sheet that is open for
 * about two screens of scrolling — long enough to take in four steps, nowhere
 * near long enough to read eight lines of explanation. The service pages carry
 * the words.
 *
 * Drawn as one SVG rather than laid out in HTML for the same reason the desktop
 * is: the sheet it sits on is a video frame that shrinks, and a drawing that
 * scales as a unit stays in proportion with it. An HTML stack would reflow.
 */
function ProcessDiagram() {
  return (
    <svg
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      className="mx-auto max-h-[76svh] w-full"
      role="img"
      aria-label={`ארבעת שלבי העבודה: ${STAGE_TITLES.join(", ")}`}
    >
      <defs>
        <marker
          id="mobile-process-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </marker>

        {/* The same halo the desktop uses, and gentler than it on purpose: the
            sheet under the desktop diagram is covered in pencil work, and this
            one is bare white with nothing but the crumple's own shadows on it.
            Set as strong as the desktop's, it would read as a white cloud on
            white paper. Enough to keep the type off the creases, no more. */}
        <filter id="mobile-process-halo" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="spread" />
          <feGaussianBlur in="spread" stdDeviation="5" result="soft" />
          <feComponentTransfer in="soft" result="halo">
            <feFuncR type="linear" slope="0" intercept="1" />
            <feFuncG type="linear" slope="0" intercept="1" />
            <feFuncB type="linear" slope="0" intercept="1" />
            <feFuncA type="linear" slope="1.4" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        className="text-black/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {ROW_Y.slice(0, -1).map((y, index) => {
          const from = y + CONNECTOR_CLEARANCE;
          const to = ROW_Y[index + 1] - CONNECTOR_CLEARANCE;
          const bow = index % 2 === 0 ? -CONNECTOR_BOW : CONNECTOR_BOW;
          const lean = (to - from) * 0.34;
          return (
            <path
              key={y}
              d={`M ${ICON_X} ${from} C ${ICON_X + bow} ${from + lean} ${ICON_X + bow} ${to - lean} ${ICON_X} ${to}`}
              markerEnd="url(#mobile-process-arrowhead)"
            />
          );
        })}
      </g>

      {/* One filter over the whole block, not one per element: applied per
          piece, every glyph would glow onto its neighbour and the words would
          end up sitting in a bank of white. */}
      <g direction="rtl" filter="url(#mobile-process-halo)">
        {/* The desktop's heading, on one line instead of two: it sits in the
            corner of a landscape sheet there and has to fold, and there is no
            reason to fold it in a column that is wider than it is.
            Right-aligned to the icon column rather than centred over the page —
            the drawing hangs off that column, and a heading floating in the
            middle of the sheet reads as belonging to nothing. */}
        <text
          x={ICON_X + 52}
          y={40}
          textAnchor="start"
          className="fill-black font-display text-[40px] font-bold"
        >
          {PROCESS_HEADING.join(" ")}
        </text>

        {STAGE_TITLES.map((step, index) => {
          const number = String(index + 1).padStart(2, "0");
          const y = ROW_Y[index];
          return (
            <g key={step}>
              {/* TWO GROUPS, AND THAT IS THE POINT OF THEM. The outer one
                  carries the position as an SVG `transform` attribute; the
                  inner one carries the animation, which is a CSS `transform`
                  property. On one element they do not combine — the CSS
                  property wins outright and the attribute is thrown away, so
                  every animated icon loses its placement and stacks up at 0,0. */}
              <g transform={`translate(${ICON_X} ${y})`}>
                <g
                  className={`text-black/45 ${ICON_MOTION[number]}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[number].map((part) => (
                    <path key={part.d} d={part.d} className={part.cls} />
                  ))}
                  <IconExtras number={number} />
                </g>
              </g>

              {/* textAnchor start under direction rtl is the RIGHT edge, so
                  both of these hang off the same line beside the icon column
                  and run leftward into the page. */}
              <text
                x={ICON_X - 92}
                y={y - 24}
                textAnchor="start"
                className="fill-black/30 font-display text-[34px] font-bold"
              >
                {number}
              </text>
              <text
                x={ICON_X - 92}
                y={y + 32}
                textAnchor="start"
                className="fill-black font-display text-[42px] font-bold"
              >
                {step}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function Statement({ className }: { className?: string }) {
  return (
    <p
      className={`text-right font-display text-m-statement font-normal text-black ${className ?? ""}`}
    >
      עיצוב מושך תשומת לב.
      <br />
      חשיבה יוצרת תוצאה.
    </p>
  );
}
