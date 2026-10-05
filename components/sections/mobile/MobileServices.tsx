"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { registerLanding } from "@/lib/nav/landings";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ServiceRow from "@/components/sections/services/ServiceRow";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SERVICES_HEADING, SERVICES_LEAD, services } from "@/lib/content";
import { ScrollFrames, type FrameSequence } from "@/lib/scrub/scroll-frames";
import { SteppedPlayhead, travelScreensFor, type StoryOptions } from "@/lib/scrub/stepped-playhead";
import { isMomentum, stopMomentumAt, trackTouch } from "@/lib/scrub/momentum";
import { useLenis } from "@/lib/motion/lenis";
import { stackHeading } from "@/lib/motion/stack-heading";
import FoldText, { setFold } from "@/components/ui/FoldText";
import { PROCESS_HEADING, STAGE_LINES, STAGE_TITLES } from "../process/stages";

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
const STAGES_BEAT = { screens: 3.8, time: CUE_PAPER_FLAT };

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

// ON THE SHEET — the four stages one at a time, in the same place, while the
// clip holds. Each stage sits still for most of its share of the scroll and hands
// over to the next in a short swap: the outgoing one lifts away as the incoming
// one rises in under it. It reaches the last stage at STAGES_END of the hold
// rather than at its end, so that stage stays a moment before the words shrink
// back into the page.
//
// A step at a time, by the user's choice, over the column that moved with the
// scroll. The two stages never share the page: letting them cross, even briefly,
// stacked two icons and two titles on top of each other mid-swap. Instead the
// swap is short, so the moment between them is a flicker of scroll rather than
// a blank sheet.
const STAGE_COUNT = STAGE_TITLES.length;
// 1: the last stage arrives at the very end of the hold. It used to arrive at
// 0.76 of it and stand still for the rest, so the reader saw it for a moment
// before the fold; with the scroll picking steps, that moment IS the step, and
// a frozen quarter inside the transition would read as the page catching.
const STAGES_END = 1;
/**
 * How much of the gap between two stages the swap takes. Nearly all of it: the
 * gap is a played transition now, so this is a share of its clock, and at 0.24
 * the whole swap took an eighth of a second and read as a jump.
 */
const SWAP_SPAN = 0.9;
/** A short, soft lift: at 28px on a slower swap the drift was the event. */
const SWAP_RISE_PX = 16;
/**
 * Where the position starts, in stages: two before the first one. The heading
 * has the first of them to itself - it arrives only once the paper is open, as
 * a step of its own, like each stage after it - and the first stage then
 * arrives the same way every later one does.
 */
const FIRST_ARRIVAL = -2;
/**
 * THE HEADING, on the open sheet, in the same position space as the stages.
 * Its letters fold in as a big stack in the exact centre of the screen - the
 * same entrance as the projects heading, this share of the screen's width and
 * at most this share of its height, between one line length and one type size
 * - and it stands there alone (HEADING_ALONE, a rest state). Then it rises to
 * its place above the stages, and only after that does the first stage come in.
 * It used to fold in while the paper was still opening, and the two movements
 * competed.
 */
const HEADING_FOLD = [-2, -1.55] as const;
const HEADING_ALONE = -1.5;
const HEADING_RISE = [-1.45, -0.95] as const;
const HEADING_STACK_WIDTH = 0.8;
const HEADING_STACK_MAX_HEIGHT = 0.4;
const HEADING_STACK_SAME_SIZE = 0.5;
/**
 * How small the heading is once it has risen to its corner. It is set in the
 * big type it enters in and scaled down to this, rather than set small and
 * scaled up into the stack: enlarged four times, small type came out soft on a
 * phone. At 56px this lands on the size of a sub-heading, so the numeral under
 * it is the largest thing on the sheet and the heading only says where one is.
 */
const HEADING_REST_SCALE = 0.38;

// "1/4", the way the site sets a number: the digit as the largest thing on the
// screen and the total beside it in grey. Left to right, so it reads in order
// inside a right-to-left page, and pushed to the end of its row - the right.
const COUNT_ROW = "flex items-baseline justify-end gap-1.5 font-display";
const COUNT_DIGIT = "text-m-numeral font-extrabold tracking-[-0.04em] text-black";
const COUNT_TOTAL = "text-m-title font-bold text-black/30";

/** Eases both ends of a 0 → 1 move, so the heading lifts off and lands softly. */
function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}
/** How small the stages get as they go back into the folding paper. */
const COLLAPSED_SCALE = 0.55;
/**
 * How much of the fold back in the last stage stays whole before it starts to
 * go. Leaving at the first frame of the fold, it was gone before the paper had
 * visibly started to crumple.
 */
const COLLAPSE_DELAY = 0.5;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * The progress at which the clip reaches a moment in time: the inverse of
 * progressToTime, over the beats in which time actually moves. The hold, where
 * it stands still, has no single answer and is never asked for - a stage is
 * found by progressAtStage instead.
 */
function progressAtTime(time: number) {
  for (let i = 1; i < TIMELINE.length; i++) {
    const from = TIMELINE[i - 1];
    const to = TIMELINE[i];
    if (to.time > from.time && time >= from.time && time <= to.time) {
      return from.progress + ((time - from.time) / (to.time - from.time)) * (to.progress - from.progress);
    }
  }
  throw new Error(`No beat runs through ${time}s`);
}

/**
 * The progress at which the open sheet is at `position`, in stages - so a whole
 * number is that stage standing alone, fully shown: the inverse of the position
 * arithmetic in the render below.
 */
function progressAtPosition(position: number) {
  const onSheet = (STAGES_END * (position - FIRST_ARRIVAL)) / (STAGE_COUNT - 1 - FIRST_ARRIVAL);
  return STAGES_FROM + onSheet * (STAGES_TO - STAGES_FROM);
}

/**
 * THE STORY, AS REST STATES AND THE WAYS BETWEEN THEM - see
 * lib/scrub/stepped-playhead.ts for the mechanism and why a phone needs it.
 *
 * Three moments are there to be watched, and each plays in full on its own
 * clock once the scroll crosses its line: the paper opening onto "איך אני
 * עובד?", the paper crumpling into a ball, and the ball turning into a plane as
 * the closing line rises. Everything else is the reader's own pace:
 *
 * - The ball with the services on it is scrubbed by the finger, as it always
 *   was. The list is something to read, and every frame there is a good frame.
 *   It ends just before the list starts to fade, so the fade belongs to the
 *   opening and a reader can never be left looking at a half-faded list.
 * - The stages are read one at a time. The scroll picks which, and the swap
 *   between two is a short clock of its own, so a reader stopping anywhere is
 *   looking at a whole stage and never at the empty sheet between two.
 * - The plane flying off is scrubbed again. It is the last thing before the
 *   page moves on, and every frame of it is a plane and a line on white.
 *
 * The rest states were chosen from the footage, not from the beats: frame 250
 * is the last one on which the ball is whole and still, before it starts to
 * turn, so the crumple ends on a ball that has landed and the next moment
 * starts turning at once instead of after a pause.
 *
 * The pace of each moment is in seconds and is the number to tune against a
 * real hand. Where the footage is long, the moment is shorter than the footage:
 * a reader waiting seven seconds for a plane is a reader gone.
 */
const FREE_END_TIME = CUE_SERVICES_OUT - FADE_SECONDS;
const BALL_REST_TIME = 250 / CLIP_FPS;
const PLANE_REST_TIME = CUE_STATEMENT_IN + FADE_SECONDS;
const PLANE_REST = progressAtTime(PLANE_REST_TIME);

const STORY = {
  anchors: [
    0,
    progressAtTime(FREE_END_TIME), // the ball, the list still whole
    STAGES_FROM, // the paper open and still, nothing on it yet - passed through, see below
    progressAtPosition(HEADING_ALONE), // "איך אני עובד?" alone in the middle
    ...STAGE_TITLES.map((_, index) => progressAtPosition(index)), // each stage alone on the sheet
    progressAtTime(BALL_REST_TIME), // crumpled, the ball landed
    PLANE_REST, // a plane, the closing line up behind it
    1, // the plane gone, the line on white
  ],
  // The spacing is one ordinary swipe per moment. It was 1.1 screens a stage and
  // two on the ball, and on a real phone that was a fight: a normal swipe fell
  // short of the next line, and only one long throw of just the right length
  // turned a page. The brake is what keeps a strong throw from running past, so
  // the room no longer has to.
  transitions: [
    { kind: "scrub", screens: 1 }, // the ball with the list on it
    // The clocks were slowed by about half after a real hand: at 1.8 / 0.5 /
    // 2.8 / 2.2 seconds everything happened before it could be watched.
    // NO ROOM OF ITS OWN (screens: 0): the open sheet with nothing on it was a
    // rest state, and every reader who stopped there took the page for stuck -
    // a blank sheet and no sign that another swipe would bring anything. The
    // paper still opens whole and comes to a stop, and the heading then folds
    // in by itself, on the same swipe.
    { kind: "play", screens: 0, seconds: 2.6 }, // the list goes and the paper opens
    { kind: "play", screens: 0.55, seconds: 1.2 }, // the heading folds in, alone, once the paper is still
    { kind: "play", screens: 0.55, seconds: 1.6 }, // the heading settles into its place and the first stage comes in
    { kind: "play", screens: 0.55, seconds: 1.2 }, // stage to stage
    { kind: "play", screens: 0.55, seconds: 1.2 },
    { kind: "play", screens: 0.55, seconds: 1.2 },
    { kind: "play", screens: 0.6, seconds: 3.6 }, // the stages go back in and the paper crumples to a ball
    { kind: "play", screens: 0.6, seconds: 3.0 }, // the ball turns into a plane and the line rises
    { kind: "scrub", screens: 0.8 }, // the plane flies off
  ],
} as const satisfies Pick<StoryOptions, "anchors" | "transitions">;

const TRAVEL_SCREENS = travelScreensFor(STORY);

// The rest state in STORY.anchors where the first stage stands alone: after the
// start, the ball, the open sheet and the heading alone.
const FIRST_STAGE_ANCHOR = 4;

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
  const headingBoxRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const statementLayerRef = useRef<HTMLDivElement>(null);

  const playheadRef = useRef<SteppedPlayhead | null>(null);
  const lenis = useLenis();
  // Read by onScroll, which the playhead's closure outlives, so it is kept in a
  // ref rather than read from the render it was created in.
  const lenisRef = useRef(lenis);
  useLayoutEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  // Scroll in, playhead out. The scroll only reports where the reader is and
  // how the page is moving; what is shown is whatever the playhead hands to
  // render below.
  const onScroll = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const playhead = playheadRef.current;
    if (!wrapper || !panel || !playhead) return;
    // The panel's own height, not window.innerHeight. Both are one screen, but
    // the panel is sized in svh — the height with the browser chrome showing,
    // which does not move — while innerHeight grows and shrinks as the address
    // bar hides on scroll. Measuring the moving one would shift every line the
    // moments are picked by, mid-scroll.
    //
    // A glide counts as momentum only when it is not the site moving itself -
    // a smooth scroll Lenis is running to a link.
    const momentum = isMomentum() && lenisRef.current?.isScrolling !== "smooth";
    playhead.setScroll(-wrapper.getBoundingClientRect().top / panel.offsetHeight, momentum);
  };

  // WHERE THE MENU'S "איך אני עובד" LANDS: the first stage alone on the open
  // sheet. Its rest state is reached once the scroll is past the line of the
  // transition that brings it in, so the landing is the middle of that
  // transition's room - clear of the line on both sides.
  useEffect(() => {
    if (prefersReducedMotion) return;
    return registerLanding("process", () => {
      const wrapper = wrapperRef.current;
      const panel = panelRef.current;
      if (!wrapper || !panel) return null;
      const into = FIRST_STAGE_ANCHOR - 1;
      const line = STORY.transitions.slice(0, into).reduce((total, transition) => total + transition.screens, 0);
      const screens = line + STORY.transitions[into].screens / 2;
      return wrapper.getBoundingClientRect().top + window.scrollY + screens * panel.offsetHeight;
    });
  }, [prefersReducedMotion]);

  // Where the playhead asks a throw to stop, in screens from where the panel
  // pins, turned into a place on the page.
  const brake = (screens: number) => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    if (!wrapper || !panel) return;
    stopMomentumAt(wrapper.getBoundingClientRect().top + window.scrollY + screens * panel.offsetHeight);
  };

  const render = (progress: number) => {
    const panel = panelRef.current;
    const frames = framesRef.current;
    const servicesLayer = servicesLayerRef.current;
    const aboutLayer = aboutLayerRef.current;
    const headingBox = headingBoxRef.current;
    const heading = headingRef.current;
    const count = countRef.current;
    const cue = cueRef.current;
    const statementLayer = statementLayerRef.current;
    if (!panel || !frames || !servicesLayer || !aboutLayer || !headingBox || !heading || !count || !cue || !statementLayer) {
      return;
    }

    // Every measurement first, before any style below is written: a read after a
    // write forces a layout on every frame.
    //
    // The middle of the screen, in the heading's own box - where its stack
    // stands before it rises to its corner. Layout offsets, which ignore the
    // transforms written below - the words' own, the box's shrink and the
    // layer's - so this target never moves under its own animation.
    const stackX = panel.offsetWidth / 2 - (headingBox.offsetLeft + heading.offsetLeft);
    const stackY = panel.offsetHeight / 2 - (headingBox.offsetTop + heading.offsetTop);
    const stackWidth = panel.offsetWidth * HEADING_STACK_WIDTH;
    const stackMaxHeight = panel.offsetHeight * HEADING_STACK_MAX_HEIGHT;

    const time = progressToTime(progress);

    // The frame the playhead is on. ScrollFrames returns at once when that is
    // the frame already showing, so this is free on most calls.
    frames.show(time * CLIP_FPS);

    // ON THE BALL. Everything is already on the paper; the scroll runs the clip
    // underneath and takes the words away as the paper opens. Pointer events go
    // with them, so a list nobody can see cannot swallow a tap.
    const servicesOpacity = fadeOut(time, CUE_SERVICES_OUT);
    servicesLayer.style.opacity = String(servicesOpacity);
    servicesLayer.style.pointerEvents = servicesOpacity > 0.5 ? "auto" : "none";

    // ON THE SHEET. The layer stays whole for as long as the clip holds and into
    // the start of the fold, and only once the paper is visibly going back in
    // does it shrink into the page with it and go.
    const fold = clamp01((time - CUE_PAPER_FLAT) / (CUE_ABOUT_OUT - CUE_PAPER_FLAT));
    const collapse = clamp01((fold - COLLAPSE_DELAY) / (1 - COLLAPSE_DELAY));
    aboutLayer.style.opacity = String(Math.min(fadeIn(time, CUE_ABOUT_IN), 1 - collapse));
    aboutLayer.style.transform = `scale(${lerp(1, COLLAPSED_SCALE, collapse)})`;

    // Where the reader is on the open sheet, as a continuous position in stages
    // — 1.5 is halfway between the second and the third, and below zero is the
    // heading's own stretch. Read off the scroll inside the hold, not off clip
    // time, which is standing still there.
    const onSheet = clamp01((progress - STAGES_FROM) / (STAGES_TO - STAGES_FROM));
    const position = lerp(FIRST_ARRIVAL, STAGE_COUNT - 1, clamp01(onSheet / STAGES_END));

    // The heading folds in as a big stack centred on the screen once the paper
    // is still, and settles into one small line in its corner as it rises: the
    // words run back into their line while the box they sit in shrinks towards
    // its own top right.
    const folded = clamp01((position - HEADING_FOLD[0]) / (HEADING_FOLD[1] - HEADING_FOLD[0]));
    const rise = smoothstep(clamp01((position - HEADING_RISE[0]) / (HEADING_RISE[1] - HEADING_RISE[0])));
    stackHeading(heading, stackX, stackY, stackWidth, stackMaxHeight, rise, HEADING_STACK_SAME_SIZE);
    headingBox.style.transform = `scale(${lerp(1, HEADING_REST_SCALE, rise)})`;
    setFold(heading, folded);

    // THE CUE comes in with the heading - the first thing that stands still on
    // the open sheet - and stays for everything after it: the four stages, the
    // crumple and the plane. It goes as the plane flies off, which the finger
    // drives, so by then nobody needs telling.
    cue.style.opacity = String(Math.min(folded, clamp01((1 - progress) / (1 - PLANE_REST))));

    for (let index = 0; index < STAGE_COUNT; index++) {
      // 0 → 1 across the swap into this stage, and across the swap out of it.
      const swapIn = clamp01((position - (index - 0.5 - SWAP_SPAN / 2)) / SWAP_SPAN);
      const swapOut =
        index === STAGE_COUNT - 1 ? 0 : clamp01((position - (index + 0.5 - SWAP_SPAN / 2)) / SWAP_SPAN);
      // The outgoing stage takes the first half of the swap, the incoming one the
      // second, so they meet at nothing and never overlap. Eased at both ends,
      // so each goes and comes softly instead of at a constant rate.
      const arriving = smoothstep(clamp01(swapIn * 2 - 1));
      const leaving = smoothstep(clamp01(swapOut * 2));
      const visibility = String(Math.min(arriving, 1 - leaving));
      const lift = `translateY(${((1 - arriving) - leaving) * SWAP_RISE_PX}px)`;
      // The "/4" counts stages, so it waits for the first one rather than
      // showing under the heading while that is still alone on the sheet. Then
      // it stays put, and only the digit in front of it changes.
      if (index === 0) count.style.opacity = String(arriving);

      // The digit and the words of a stage go and come as one.
      for (const part of [digitRefs.current[index], stageRefs.current[index]]) {
        if (!part) continue;
        part.style.opacity = visibility;
        part.style.transform = lift;
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
    // The playhead outlives this render, so it keeps this render's `render` -
    // which is safe only because render reads nothing but refs and module
    // constants. Anything added to it that reads props or state would go stale.
    trackTouch();
    const playhead = new SteppedPlayhead({ ...STORY, render, brake });
    playheadRef.current = playhead;
    onScroll();

    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("resize", onScroll);
      playhead.dispose();
      playheadRef.current = null;
      frames.dispose();
      framesRef.current = null;
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    onScroll();
  });

  if (prefersReducedMotion) {
    // Everything the scroll would have revealed, simply laid out in order.
    return (
      <section id="services" className="bg-white px-6 py-20">
        <ServicesIntro />
        <h2 className="mt-20 text-right font-display text-m-title font-bold text-black">
          {PROCESS_HEADING.join(" ")}
        </h2>
        <div className="mt-12 space-y-16">
          {STAGE_TITLES.map((title, index) => (
            <ProcessStage key={title} index={index} withCount />
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
      // The travel plus the one screen the panel itself stands in.
      style={{ height: `calc(${TRAVEL_SCREENS + 1} * 100svh)` }}
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
            {/* The frame's own edges cut the paper in a straight line where
                the clip ends, at the bottom and at the top. A short fade to
                the page's white at each lets the sheet run out instead of
                being cut off. Over the picture only - the words above it are
                later layers. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-white to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-white to-transparent"
            />
          </div>
        </div>

        {/* Everything on the ball at once — the desktop's full block, not a
            shorter one. The reading time is the whole stretch before the paper
            opens, rather than whatever was left after the words had finished
            arriving, which in the version before this was not enough. The halo
            keeps it legible over the crumple.

            Centred in the panel BELOW the menu row, not in the picture box: on a
            short phone the box is the whole screen, and centred in it the top
            of the block sat under the menu. */}
        <div
          ref={servicesLayerRef}
          className="paper-halo absolute inset-x-0 top-16 bottom-3 flex flex-col justify-center px-[5%]"
        >
          <ServicesIntro />
        </div>

        {/* Anchored to the screen rather than to the picture: by the time this
            is up the frame is a flat sheet, so there is no composition left to
            sit beside. */}
        {/* pointer-events-none: this layer covers the whole panel, invisible
            until the paper opens, and it sat over the four service rows and
            swallowed every tap on them. Nothing in it is a link. */}
        <div ref={aboutLayerRef} className="pointer-events-none absolute inset-0 opacity-0">
          {/* THE SHEET, SET THE WAY THE SITE SETS A PAGE: against the right
              edge, a numeral as the largest thing on it, a heavy title and one
              sentence. It was a black disc with a line drawing in it over a
              centred title - a "features" card, and the one screen on the
              phone that did not look like this studio.

              NOTHING IS DRAWN BEHIND THE WORDS YET. The studio's own
              illustrations go there, one for each stage, the way the desk
              prints its diagram on the paper: a layer in this div before the
              block below, each picture given the same opacity and lift its
              stage gets in render. */}

          {/* The projects heading's entrance: it folds in as a big stack in the
              middle of the opened sheet, then runs back into one line as it
              rises to this corner. Set in the type it enters in - the projects
              heading's exactly, with no halo, which grew into a glow when it
              was scaled up - and the box is what shrinks (HEADING_REST_SCALE).
              w-max and no wrapping: at this size the line is wider than the
              screen, and it is the shrunk line that has to fit, not this one. */}
          <div ref={headingBoxRef} className="absolute top-[max(76px,11%)] right-6 w-max origin-top-right">
            <h2
              ref={headingRef}
              className="flex gap-x-[0.25em] font-display text-m-display font-extrabold tracking-tight whitespace-nowrap text-black"
            >
              {PROCESS_HEADING.map((words) => (
                <span key={words} className="block origin-center">
                  <FoldText text={words} />
                </span>
              ))}
            </h2>
          </div>

          {/* From a fixed line under the heading, not centred in what is left:
              centred, the numeral hung in the middle of the sheet with a field
              of empty paper between it and the heading it belongs to. */}
          <div className="absolute inset-x-6 top-[23%]">
            {/* "1/4", and it is also the plainest sign that there is more: the
                "/4" stands still while the digit in front of it changes. All
                four digits share one grid cell, set against the slash. */}
            <p ref={countRef} dir="ltr" aria-hidden="true" className={`${COUNT_ROW} opacity-0`}>
              <span className="grid justify-items-end">
                {STAGE_TITLES.map((title, index) => (
                  <span
                    key={title}
                    ref={(element) => {
                      digitRefs.current[index] = element;
                    }}
                    className={`${COUNT_DIGIT} opacity-0 [grid-area:1/1]`}
                  >
                    {index + 1}
                  </span>
                ))}
              </span>
              <span className={COUNT_TOTAL}>/{STAGE_COUNT}</span>
            </p>
            {/* All four stacked in one grid cell, so each stage takes the same
                place as the one before and the block holds still as they swap. */}
            <div className="mt-6 grid">
              {STAGE_TITLES.map((title, index) => (
                <ProcessStage
                  key={title}
                  index={index}
                  stageRef={(element) => {
                    stageRefs.current[index] = element;
                  }}
                  className="opacity-0 [grid-area:1/1]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* KEEP SCROLLING. Nothing on a pinned screen says that the page is not
            stuck, and every reader who was handed the phone thought it was. A
            dot travelling up a short line - a thumb's own movement - and two
            words, at the foot of the screen from the moment the heading stands
            on the open sheet until the section lets go. On the panel and not in
            the layer above, which shrinks away with the crumple. Decoration: a
            reader who cannot see it is not on a pinned screen to begin with. */}
        <div
          ref={cueRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] flex flex-col items-center gap-2 opacity-0"
        >
          <span className="relative block h-8 w-px bg-black/20">
            <span className="scroll-cue-dot absolute top-1/2 -left-[3px] block h-[7px] w-[7px] rounded-full bg-black" />
          </span>
          <span className="paper-halo font-display text-m-small font-medium text-black/60">גללו להמשך</span>
        </div>

        {/* 22%, not 11%. The clip is 9:16 inside a screen that is taller than
            that, so the bottom eighth of this panel is the letterbox — the line
            was sitting half on the footage and half on white. */}
        <div ref={statementLayerRef} className="pointer-events-none absolute inset-x-0 bottom-[22%] px-6 opacity-0">
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
      <p className="mt-3 text-center font-body text-m-body text-black/70">{SERVICES_LEAD}</p>
      <div className="mt-7 [@media(max-height:700px)]:mt-4">
        {services.map((service, index) => (
          <ServiceRow key={service.title} service={service} index={index} compact />
        ))}
      </div>
    </>
  );
}

/**
 * One stage of the work, given the whole of the open sheet: its title and the
 * sentence under it that says what actually happens there, set against the
 * right edge. On the pinned sheet the numeral stands above all four as one
 * shared "1/4"; laid out as a plain list, each prints its own (`withCount`).
 *
 * It used to be all four at once as a column of small icons and titles down one
 * side of the page. Four steps and no words under any of them read as a list
 * with nothing in it, and squeezing the sentences in would have made it a wall.
 * One at a time, each stage has room to say what it is.
 */
function ProcessStage({
  index,
  stageRef,
  className,
  withCount = false,
}: {
  index: number;
  stageRef?: (element: HTMLDivElement | null) => void;
  className?: string;
  /** Print the stage's own "1/4" above it - where no shared one stands beside it. */
  withCount?: boolean;
}) {
  return (
    <div ref={stageRef} className={`text-right ${className ?? ""}`}>
      {withCount && (
        <p dir="ltr" aria-hidden="true" className={`${COUNT_ROW} mb-5`}>
          <span className={COUNT_DIGIT}>{index + 1}</span>
          <span className={COUNT_TOTAL}>/{STAGE_COUNT}</span>
        </p>
      )}
      <h3 className="paper-halo font-display text-m-statement leading-[1.15] font-extrabold text-balance text-black">
        {/* The big numeral is decoration; this is the same count, read out. */}
        <span className="sr-only">{`שלב ${index + 1} מתוך ${STAGE_COUNT}: `}</span>
        {STAGE_TITLES[index]}
      </h3>
      <p className="paper-halo mt-3 max-w-[32ch] font-body text-m-body text-pretty text-black/65">
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
