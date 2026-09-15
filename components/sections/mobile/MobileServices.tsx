"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ServiceRow from "@/components/sections/services/ServiceRow";
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
 * THERE IS ONE HOLD, AND IT IS NOT A PAUSE. There used to be two stops — a fifth
 * of the run frozen on frame zero and another fifth on the flat sheet, with
 * nothing on screen moving at all — and in a hand that reads as a page that has
 * caught on something. Everywhere else the rule the desktop follows still holds:
 * slow down over what matters, never stop.
 *
 * The flat sheet is the exception, and deliberately. The clip holds still while
 * the four stages of the work travel up across it, so the scroll never stops
 * producing movement — it moves the column instead of the paper. With both
 * moving at once, the sheet settling and the column climbing, neither could be
 * followed. Only once the last stage has been read do the words shrink back into
 * the page, and only then does the paper crumple.
 *
 * Because it is arithmetic in both directions rather than a played timeline,
 * scrolling back up runs the paper backwards through exactly the same frames.
 */

/** The hold: the clip stays on the flat sheet while the four stages go by. */
const STAGES_BEAT = { screens: 3.2, time: CUE_PAPER_FLAT };

const BEATS: readonly { screens: number; time: number }[] = [
  { screens: 0, time: 0 },
  { screens: 2.8, time: CUE_SERVICES_OUT }, // on the ball: the whole services block, read in full
  { screens: 1.3, time: CUE_PAPER_FLAT }, // it opens
  STAGES_BEAT, // the clip holds; the stages travel up the sheet
  { screens: 0.9, time: CUE_ABOUT_OUT }, // the stages shrink back into the page
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

// Where the hold starts and ends, as scroll progress. The stages are driven off
// these rather than off clip time, because clip time stands still in between.
const STAGES_FROM = TIMELINE[BEATS.indexOf(STAGES_BEAT) - 1].progress;
const STAGES_TO = TIMELINE[BEATS.indexOf(STAGES_BEAT)].progress;

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

// ON THE SHEET — the four stages as one column that travels up with the scroll,
// the stage passing through the middle of the window at full strength and its
// neighbours faded back. It reaches the last stage at STAGES_END of the hold
// rather than at its end, so that stage sits still in the middle for a moment
// before the words shrink back into the page.
//
// A column and not a sequence. The version before this faded one stage out and
// the next one in, and between them the sheet was blank for a moment on every
// swap — reading as the page losing its content under the finger. A column that
// moves with the hand always has something on it, and moves the way scrolling
// moves.
const STAGE_COUNT = STAGE_TITLES.length;
const STAGES_END = 0.76;
const STAGE_DIM_OPACITY = 0.22;
const DOT_PX = 6;
const DOT_ACTIVE_PX = 20;
/** How small the stages get as they go back into the folding paper. */
const COLLAPSED_SCALE = 0.55;

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
  const aboutLayerRef = useRef<HTMLDivElement>(null);
  const stageWindowRef = useRef<HTMLDivElement>(null);
  const stageColumnRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const statementLayerRef = useRef<HTMLDivElement>(null);

  const update = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const frames = framesRef.current;
    const servicesLayer = servicesLayerRef.current;
    const aboutLayer = aboutLayerRef.current;
    const stageWindow = stageWindowRef.current;
    const stageColumn = stageColumnRef.current;
    const statementLayer = statementLayerRef.current;
    if (!wrapper || !panel || !frames || !servicesLayer || !aboutLayer || !stageWindow || !stageColumn || !statementLayer) {
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
    const windowHeight = stageWindow.clientHeight;
    // Where each stage's middle sits inside the column. These are layout offsets,
    // which the column's own transform never changes, so they hold still while it
    // moves.
    const stageMiddles = stageRefs.current.map((stage) => (stage ? stage.offsetTop + stage.offsetHeight / 2 : 0));

    const progress = clamp01(-wrapperBox.top / travel);
    const time = progressToTime(progress);

    // The frame the scroll position lands on. ScrollFrames returns at once when
    // that is the frame already showing, so this is free on most scroll events.
    frames.show(time * CLIP_FPS);

    // ON THE BALL. Everything is already on the paper; the scroll runs the clip
    // underneath and takes the words away as the paper opens. Pointer events go
    // with them, so a list nobody can see cannot swallow a tap.
    const servicesOpacity = fadeOut(time, CUE_SERVICES_OUT);
    servicesLayer.style.opacity = String(servicesOpacity);
    servicesLayer.style.pointerEvents = servicesOpacity > 0.5 ? "auto" : "none";

    // ON THE SHEET. The layer stays whole for as long as the clip holds, and only
    // once the paper starts folding back in does it shrink into the page with it
    // and go — the clip is past CUE_PAPER_FLAT exactly then, and not before.
    const collapse = clamp01((time - CUE_PAPER_FLAT) / (CUE_ABOUT_OUT - CUE_PAPER_FLAT));
    aboutLayer.style.opacity = String(Math.min(fadeIn(time, CUE_ABOUT_IN), 1 - collapse));
    aboutLayer.style.transform = `scale(${lerp(1, COLLAPSED_SCALE, collapse)})`;

    // Which stage is in the middle of the window, as a continuous position —
    // 1.5 is halfway between the second and the third. Read off the scroll inside
    // the hold, not off clip time, which is standing still there.
    const onSheet = clamp01((progress - STAGES_FROM) / (STAGES_TO - STAGES_FROM));
    const position = clamp01(onSheet / STAGES_END) * (STAGE_COUNT - 1);
    const from = Math.floor(position);
    const to = Math.min(STAGE_COUNT - 1, from + 1);
    // Travels between the stages' real middles rather than by a fixed step, so a
    // stage whose sentence runs a line longer still lands centred.
    const middle = lerp(stageMiddles[from], stageMiddles[to], position - from);
    stageColumn.style.transform = `translateY(${windowHeight / 2 - middle}px)`;

    for (let index = 0; index < STAGE_COUNT; index++) {
      const nearness = 1 - clamp01(Math.abs(index - position));
      const stage = stageRefs.current[index];
      if (stage) stage.style.opacity = String(lerp(STAGE_DIM_OPACITY, 1, nearness));
      const dot = dotRefs.current[index];
      if (dot) {
        dot.style.width = `${lerp(DOT_PX, DOT_ACTIVE_PX, nearness)}px`;
        dot.style.opacity = String(lerp(0.2, 1, nearness));
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
        <ServicesIntro />
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

            {/* Everything on the ball at once — the desktop's full block, not a
                shorter one. The reading time is the whole stretch before the
                paper opens, rather than whatever was left after the words had
                finished arriving, which in the version before this was not
                enough. The halo keeps it legible over the crumple. */}
            <div ref={servicesLayerRef} className="paper-halo absolute inset-0 flex flex-col justify-center px-[5%]">
              <ServicesIntro />
            </div>
          </div>
        </div>

        {/* Anchored to the screen rather than to the picture: by the time this
            is up the frame is a flat sheet, so there is no composition left to
            sit beside. */}
        <div ref={aboutLayerRef} className="absolute inset-0 opacity-0">
          {/* 18%, where it was 12% and sat right under the menu row. */}
          <h2 className="paper-halo absolute inset-x-6 top-[18%] text-center font-display text-m-title font-bold text-black">
            {PROCESS_HEADING.join(" ")}
          </h2>
          {/* The window the column travels through. Its top and bottom fade into
              the page, so a stage comes up out of the paper and goes back into
              it rather than meeting a hard edge. Both spellings of mask-image:
              iOS Safari before 15.4 reads only the prefixed one. */}
          <div
            ref={stageWindowRef}
            className="absolute inset-x-8 top-[28%] bottom-[14%] overflow-clip [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
          >
            {/* relative, so the stages' offsetTop is measured from the top of
                this column — the origin update() moves it by. */}
            <div ref={stageColumnRef} className="relative flex flex-col items-center gap-14 will-change-transform">
              {STAGE_TITLES.map((title, index) => (
                <ProcessStage
                  key={title}
                  index={index}
                  stageRef={(element) => {
                    stageRefs.current[index] = element;
                  }}
                  className="flex flex-col items-center"
                />
              ))}
            </div>
          </div>
          {/* Where the reader is in the four. Decoration for sighted readers —
              each stage carries its own numeral for everyone else. */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-[8%] flex items-center justify-center gap-2">
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
 * The desktop's services block at the phone's size: the sentence, the lead, and
 * the four rows with their icons and the sentence under each — the same
 * ServiceRow the desktop prints, so there is one list and not two.
 */
function ServicesIntro() {
  return (
    <>
      <h2 className="text-center font-display text-m-statement font-bold text-balance text-black">
        {SERVICES_HEADING.join(" ")}
      </h2>
      <p className="mt-2 text-center font-body text-m-small text-black/55">{SERVICES_LEAD}</p>
      <div className="mt-5">
        {services.map((service, index) => (
          <ServiceRow key={service.title} service={service} index={index} compact />
        ))}
      </div>
    </>
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
      {/* A solid black disc with the drawing in white, heavy enough to hold its
          own on the crumpled paper. A thin grey outline straight on the sheet
          read as clip-art beside the site's heavy black type. */}
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black text-white">
        <svg viewBox="-60 -60 120 120" aria-hidden="true" className="h-12 w-12 overflow-visible">
          <g
            className={ICON_MOTION[number]}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[number].map((part) => (
              <path key={part.d} d={part.d} className={part.cls} />
            ))}
            <IconExtras number={number} />
          </g>
        </svg>
      </div>
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
