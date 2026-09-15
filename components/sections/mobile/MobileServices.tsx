"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SERVICES_HEADING, SERVICES_LEAD, services } from "@/lib/content";
import { ScrollFrames, type FrameSequence } from "@/lib/scrub/scroll-frames";
import {
  ICONS,
  ICON_MOTION,
  IconExtras,
  PROCESS_HEADING,
  STAGE_LINES,
  STAGE_TITLES,
} from "../process/stages";

// The paper, as the clip's own frames — every one of servicesbg-mobile.mp4's 458,
// at its own 720×1280 and 30fps, so nothing is thinned out against the video it
// replaces. lib/scrub/scroll-frames.ts has why this is not a <video>. Made with:
//
//   ffmpeg -i servicesbg-mobile.mp4
//     -vf "scale=in_range=tv:in_color_matrix=bt709:out_range=pc,format=rgb24"
//     -c:v libwebp -quality 72 -compression_level 6 -start_number 0 %03d.webp
//
// The clip is stored in limited range; converting to full-range RGB explicitly
// means the encoder never has to guess it. Measured against the video as the
// browser decodes it, the whites are exact and the tones within 1–2 levels.
// Quality 72 is where lower stops saving weight (62 saves 6%) and starts
// costing detail. `v1` is in the path because the files are served immutable —
// see next.config.ts — so a re-export goes to a new folder, never over this one.
const CLIP_FPS = 30;
const FRAME_COUNT = 458;
const CLIP_SECONDS = FRAME_COUNT / CLIP_FPS;
const PAPER: FrameSequence = {
  frameUrl: (index) => `/frames/services-mobile/v1/${String(index).padStart(3, "0")}.webp`,
  frameCount: FRAME_COUNT,
  width: 720,
  height: 1280,
};

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
//
// The two reading stretches are long because each is now a sequence, not a
// single card: on the ball, the sentence rises and the four services arrive one
// by one; on the open sheet, the four stages of the work follow each other, one
// at a time. Something changes on every screen of both, so length here is
// reading time, never a hold.
const BEATS: readonly { screens: number; time: number }[] = [
  { screens: 0, time: 0 },
  { screens: 2.8, time: CUE_SERVICES_OUT }, // on the ball: the sentence, then the services
  { screens: 1.3, time: CUE_PAPER_FLAT }, // it opens
  { screens: 3.2, time: CUE_ABOUT_OUT }, // on the sheet: the four stages, 0.8 screens each
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

// ON THE BALL — the stretch before the paper opens, as fractions of it. Clip time
// is linear in scroll inside a beat, so these are fractions of scroll too.
//
// The sentence starts centred on the ball, rises and settles smaller at the top;
// the lead follows it; then the four services arrive one after another. The last
// one is in with a sixth of the stretch to spare — about half a screen to read
// the list whole before the paper opens and takes it away.
const HEADING_RISE: [number, number] = [0.12, 0.34];
const LEAD_IN: [number, number] = [0.28, 0.4];
const ROWS_START = 0.34;
const ROW_STAGGER = 0.07;
const ROW_DURATION = 0.09;
// Where the sentence sits, as fractions of the picture's height: its centre on
// the ball at the start, its top once it has settled.
const HEADING_START_CENTRE = 0.36;
const HEADING_SETTLED_TOP = 0.07;
const HEADING_SETTLED_SCALE = 0.72;
const LEAD_GAP_PX = 10;
const LIST_GAP_PX = 22;

// ON THE SHEET — the four stages, one at a time. They finish at STAGES_END of the
// flat stretch rather than at its end, so the last stage is read whole before the
// sheet starts to crumple and the layer fades, not read while it fades.
const STAGE_COUNT = STAGE_TITLES.length;
const STAGES_END = 0.76;
// How much of a stage its exit takes, before the boundary, and the next stage's
// entrance takes, after it — in stages. The two never overlap: the outgoing
// stage is gone exactly at the boundary and the next only starts there. The
// first version spread one swap across both sides at once, and mid-swap the two
// stages sat in the same slot at half strength each — two icons, two titles and
// two sentences printed over one another.
const STAGE_SWAP = 0.14;
const STAGE_TRAVEL_PX = 36;
const DOT_PX = 6;
const DOT_ACTIVE_PX = 20;

/** 0 before `range[0]`, 1 after `range[1]`, linear between. */
function ramp(value: number, [from, to]: [number, number]) {
  return clamp01((value - from) / (to - from));
}

/** Smoothstep — eases every reveal in and out instead of starting and stopping dead. */
function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * The services section, rebuilt for the phone around a 9:16 cut of the clip.
 *
 * Nothing here is the desktop layout reflowed. The desktop carries the same
 * three beats on a 16:9 clip it has to scale and shift into place; this cut is
 * already framed for the screen, so the picture never moves and the only thing
 * scroll drives is which frame is showing and which words are over it.
 *
 * Both reading stretches are sequences the reader scrolls through rather than
 * cards laid out all at once: a grid of four boxes beside a small heading read
 * as a form, and a column of four icons and titles read as a list with no story
 * in it. Here the page says one thing at a time, and the scroll is what turns it.
 */
export default function MobileServices() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ScrollFrames | null>(null);
  const servicesLayerRef = useRef<HTMLDivElement>(null);
  const servicesHeadingRef = useRef<HTMLHeadingElement>(null);
  const servicesLeadRef = useRef<HTMLParagraphElement>(null);
  const serviceListRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const aboutLayerRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const statementLayerRef = useRef<HTMLDivElement>(null);

  const update = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const frames = framesRef.current;
    const servicesLayer = servicesLayerRef.current;
    const heading = servicesHeadingRef.current;
    const lead = servicesLeadRef.current;
    const list = serviceListRef.current;
    const aboutLayer = aboutLayerRef.current;
    const statementLayer = statementLayerRef.current;
    if (!wrapper || !panel || !frames || !servicesLayer || !heading || !lead || !list || !aboutLayer || !statementLayer) {
      return;
    }

    // Every measurement first, before any style below is written: a read after a
    // write forces a layout on every scroll event. None of these boxes is resized
    // by what is written here — only transformed — so they are stable to read.
    //
    // The panel's own height, not window.innerHeight. Both are one screen, but
    // the panel is sized in svh — the height with the browser chrome showing,
    // which does not move — while innerHeight grows and shrinks as the address
    // bar hides on scroll. Measuring the moving one would shift the whole
    // mapping mid-scrub, which reads as the clip jumping under the finger.
    const wrapperBox = wrapper.getBoundingClientRect();
    const travel = wrapperBox.height - panel.offsetHeight;
    if (travel <= 0) return;
    const pictureHeight = servicesLayer.offsetHeight;
    const headingHeight = heading.offsetHeight;
    const leadHeight = lead.offsetHeight;

    const progress = clamp01(-wrapperBox.top / travel);
    const time = progressToTime(progress);

    // The frame the scroll position lands on. ScrollFrames returns at once when
    // that is the frame already showing, so this is free on most scroll events.
    frames.show(time * CLIP_FPS);

    // ON THE BALL.
    const onBall = clamp01(time / CUE_SERVICES_OUT);
    const servicesOpacity = fadeOut(time, CUE_SERVICES_OUT);
    servicesLayer.style.opacity = String(servicesOpacity);

    const rise = ease(ramp(onBall, HEADING_RISE));
    const headingTop = lerp(
      pictureHeight * HEADING_START_CENTRE - headingHeight / 2,
      pictureHeight * HEADING_SETTLED_TOP,
      rise
    );
    heading.style.transform = `translateY(${headingTop}px) scale(${lerp(1, HEADING_SETTLED_SCALE, rise)})`;

    // Laid out from where the sentence ENDS UP, not from where it is: the lead
    // and the list only appear once it has settled, so there is nothing to gain
    // from chasing it, and a target that moves every frame reads as a jump.
    const leadTop = pictureHeight * HEADING_SETTLED_TOP + headingHeight * HEADING_SETTLED_SCALE + LEAD_GAP_PX;
    const leadIn = ease(ramp(onBall, LEAD_IN));
    lead.style.opacity = String(leadIn);
    lead.style.transform = `translateY(${leadTop + (1 - leadIn) * 12}px)`;
    list.style.transform = `translateY(${leadTop + leadHeight + LIST_GAP_PX}px)`;

    rowRefs.current.forEach((row, index) => {
      if (!row) return;
      const start = ROWS_START + index * ROW_STAGGER;
      const shown = ease(ramp(onBall, [start, start + ROW_DURATION]));
      row.style.opacity = String(shown);
      row.style.transform = `translateY(${(1 - shown) * 14}px)`;
      // A link is tappable only while it can actually be seen. Both conditions,
      // because a child's pointer-events: auto would override a hidden parent's.
      row.style.pointerEvents = shown > 0.5 && servicesOpacity > 0.5 ? "auto" : "none";
    });

    // ON THE SHEET.
    const aboutOpacity = Math.min(fadeIn(time, CUE_ABOUT_IN), fadeOut(time, CUE_ABOUT_OUT));
    aboutLayer.style.opacity = String(aboutOpacity);

    const onSheet = clamp01((time - CUE_PAPER_FLAT) / (CUE_ABOUT_OUT - CUE_PAPER_FLAT));
    const stagePosition = clamp01(onSheet / STAGES_END) * STAGE_COUNT;
    for (let index = 0; index < STAGE_COUNT; index++) {
      // The first stage is already up when the sheet arrives, and the last one
      // leaves with the sheet — neither has a swap of its own on that side.
      const enter = index === 0 ? 1 : ease(ramp(stagePosition, [index, index + STAGE_SWAP]));
      const leave = index === STAGE_COUNT - 1 ? 0 : ease(ramp(stagePosition, [index + 1 - STAGE_SWAP, index + 1]));
      const shown = enter * (1 - leave);
      const stage = stageRefs.current[index];
      if (stage) {
        stage.style.opacity = String(shown);
        // Rises in from below and leaves upward, so the stages read as one
        // column moving past rather than as slides swapped in place.
        stage.style.transform = `translateY(${(1 - enter - leave) * STAGE_TRAVEL_PX}px)`;
      }
      const dot = dotRefs.current[index];
      if (dot) {
        dot.style.width = `${lerp(DOT_PX, DOT_ACTIVE_PX, shown)}px`;
        dot.style.opacity = String(lerp(0.2, 1, shown));
      }
    }

    const statementOpacity = fadeIn(time, CUE_STATEMENT_IN);
    statementLayer.style.opacity = String(statementOpacity);
    // Rises the last stretch into place rather than appearing already settled.
    statementLayer.style.transform = `translateY(${(1 - statementOpacity) * 28}px)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Owns everything about the paper from here: it starts downloading frames
    // only once the section is within a screen and a half, keeps its backing
    // store matched to the canvas, and on the way out cancels any download
    // still running and frees every decoded frame it holds.
    const frames = new ScrollFrames(canvas, PAPER);
    framesRef.current = frames;
    update();

    const handleResize = () => update();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      frames.dispose();
      framesRef.current = null;
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    // Everything the scroll would have revealed, simply laid out in order.
    return (
      <section id="services" className="bg-white px-6 py-20">
        <h2 className="text-center font-display text-m-statement font-bold text-balance text-black">
          {SERVICES_HEADING.join(" ")}
        </h2>
        <p className="mt-3 text-center font-body text-m-body text-black/60">{SERVICES_LEAD}</p>
        <ServiceList className="mt-8" />
        <h2 className="mt-20 text-center font-display text-m-title font-bold text-black">
          {PROCESS_HEADING.join(" ")}
        </h2>
        <div className="mt-12 space-y-16">
          {STAGE_TITLES.map((title, index) => (
            <ProcessStage key={title} index={index} className="flex flex-col items-center" />
          ))}
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
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

            {/* Anchored to the picture, not to the screen: the sentence starts
                ON the ball, so it has to know where the ball is. All three sit
                at top 0 and are placed by update() with transforms — their own
                boxes never change size, which is what makes them safe to
                measure on every scroll event. */}
            <div ref={servicesLayerRef} className="absolute inset-0">
              <h2
                ref={servicesHeadingRef}
                className="paper-halo absolute inset-x-[6%] top-0 origin-top text-center font-display text-m-statement font-bold text-balance text-black will-change-transform"
              >
                {SERVICES_HEADING.join(" ")}
              </h2>
              <p
                ref={servicesLeadRef}
                className="paper-halo absolute inset-x-[6%] top-0 text-center font-body text-m-body text-black/60 opacity-0"
              >
                {SERVICES_LEAD}
              </p>
              <ServiceList listRef={serviceListRef} rowRefs={rowRefs} className="absolute inset-x-[7%] top-0" />
            </div>
          </div>
        </div>

        {/* Anchored to the screen rather than to the picture: by the time this
            is up the frame is a flat sheet, so there is no composition left to
            sit beside. The four stages share one slot and take turns in it. */}
        <div ref={aboutLayerRef} className="absolute inset-0 opacity-0">
          <h2 className="paper-halo absolute inset-x-6 top-[12%] text-center font-display text-m-title font-bold text-black">
            {PROCESS_HEADING.join(" ")}
          </h2>
          <div className="absolute inset-x-8 top-[24%] bottom-[20%]">
            {STAGE_TITLES.map((title, index) => (
              <ProcessStage
                key={title}
                index={index}
                stageRef={(element) => {
                  stageRefs.current[index] = element;
                }}
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0"
              />
            ))}
          </div>
          {/* Where the reader is in the four. Decoration for sighted readers —
              each stage carries its own numeral for everyone else. */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-[13%] flex items-center justify-center gap-2">
            {STAGE_TITLES.map((title, index) => (
              <span
                key={title}
                ref={(element) => {
                  dotRefs.current[index] = element;
                }}
                className="block h-1.5 w-1.5 rounded-full bg-black opacity-20"
              />
            ))}
          </div>
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

/**
 * The four services as rows — numeral, title, arrow, a hairline under each —
 * the same shape as the desktop's list rather than four boxes. Titles only: the
 * sentence under each is what the service pages are for.
 *
 * Given refs, the rows start hidden and update() reveals them; without, they
 * are simply there (the reduced-motion layout).
 */
function ServiceList({
  listRef,
  rowRefs,
  className,
}: {
  listRef?: React.RefObject<HTMLUListElement | null>;
  rowRefs?: React.RefObject<(HTMLAnchorElement | null)[]>;
  className?: string;
}) {
  return (
    <ul ref={listRef} className={className}>
      {services.map((service, index) => (
        <li key={service.title}>
          <Link
            ref={
              rowRefs
                ? (element) => {
                    rowRefs.current[index] = element;
                  }
                : undefined
            }
            href={service.href}
            className={`flex items-center justify-between border-b border-black/10 py-3.5 ${rowRefs ? "opacity-0" : ""}`}
          >
            <span className="paper-halo flex items-baseline gap-3">
              <span className="font-display text-m-small font-bold text-black/35 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-m-sub font-bold text-black">{service.title}</span>
            </span>
            <ArrowIcon className="text-black/50" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * One stage of the work, given the whole of the open sheet: its icon large and
 * moving, the numeral, the title, and the sentence under it that says what
 * actually happens there. Printed on the sheet in the slot the "who I am" block
 * used to occupy, on the same cues.
 *
 * It used to be all four at once as a column of small icons and titles down one
 * side of the page. Four steps and no words under any of them read as a list
 * with nothing in it, and squeezing the sentences in would have made it a wall.
 * One at a time, each stage has room to say what it is.
 *
 * The icon needs no position of its own, so its animation class sits straight
 * on the group — the desktop splits position and motion across two groups only
 * because there the position is an SVG transform, which a CSS animation would
 * overwrite.
 */
function ProcessStage({
  index,
  stageRef,
  className,
}: {
  index: number;
  stageRef?: (element: HTMLDivElement | null) => void;
  className?: string;
}) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <div ref={stageRef} className={`text-center ${className ?? ""}`}>
      <svg viewBox="-60 -60 120 120" aria-hidden="true" className="h-24 w-24 overflow-visible text-black/55">
        <g
          className={ICON_MOTION[number]}
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
      </svg>
      <span className="mt-7 block font-display text-m-small font-bold tracking-[0.2em] text-black/35">{number}</span>
      <h3 className="paper-halo mt-2 font-display text-m-statement font-bold text-balance text-black">
        {STAGE_TITLES[index]}
      </h3>
      <p className="paper-halo mx-auto mt-3 max-w-[30ch] font-body text-m-body text-balance text-black/60">
        {STAGE_LINES[index].join(" ")}
      </p>
    </div>
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
