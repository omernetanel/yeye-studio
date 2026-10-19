/**
 * THE DRAWINGS OF THE FOUR STAGES - Omer's own pencil work, one for each - and
 * the small story each one tells as its stage comes in. Shared by the phone's
 * sheet (MobileServices) and the desk's (ServicesSection); where each drawing
 * stands is the layout's business, and how it moves is decided here, once.
 *
 * WHAT EACH ONE DOES on its way in, on a clock of its own that starts when its
 * stage does (see STORY_SECONDS):
 * 1. The magnifier goes over the words in a circle, the way you search a page
 *    with one, and settles in its place.
 * 2. A brush comes in from the side and works across the screen, as if it is
 *    painting it, and comes to rest beside it.
 * 3. The code tilts up into its place.
 * 4. A cursor comes up to "Publish" and presses it.
 *
 * On the desk at half strength, over the pencil sheet printed under them; on
 * the phone at full strength, as the subject of the page (see showStageArt).
 *
 * The files are the drawings cut to their own edges (so a place on the drawing
 * is a place on its box) and kept to 900 across - more than either layout
 * shows them at. Made from the PNGs in the same folder, which stay out of git:
 *   ffmpeg -i hiw_1.png -vf "crop=<drawn area>,scale='min(900,iw)':-2:flags=lanczos"
 *     -c:v libwebp -quality 82 -compression_level 6 -pix_fmt yuva420p hiw_1.webp
 */

import { useEffect, useState } from "react";

/**
 * A picture, its shape as a Tailwind aspect class (a class, so it is in the
 * stylesheet), and the same shape as a number - height over width.
 */
type Drawing = { src: string; aspect: string; ratio: number };

/**
 * A second drawing that moves over the first: its width, as a share of the
 * first's, and where its own anchor point comes to rest on the first, as
 * shares of the first's width and height. `anchor` is the point of the second
 * drawing that is placed there, as shares of its own box.
 */
type Visitor = Drawing & { width: number; rest: [number, number]; anchor: [number, number] };

type StageArt = { main: Drawing; visitor?: Visitor };

export const STAGE_ART: StageArt[] = [
  { main: { src: "/images/hiw/hiw_1.webp", aspect: "aspect-[900/1076]", ratio: 1076 / 900 } },
  {
    main: { src: "/images/hiw/hiw_2_1.webp", aspect: "aspect-[900/984]", ratio: 984 / 900 },
    // The brush, stopped on the screen: its middle on the left edge, high up,
    // so the bristles lie on the picture as if it has just put them down.
    visitor: {
      src: "/images/hiw/hiw_2_2.webp",
      aspect: "aspect-[900/922]",
      ratio: 922 / 900,
      width: 0.46,
      rest: [0.02, 0.4],
      anchor: [0.5, 0.5],
    },
  },
  { main: { src: "/images/hiw/hiw_3.webp", aspect: "aspect-[900/804]", ratio: 804 / 900 } },
  {
    main: { src: "/images/hiw/hiw_4_1.webp", aspect: "aspect-[900/708]", ratio: 708 / 900 },
    // The cursor, its tip on the end of the "Publish" button, past the word so
    // the word stays readable - 72% across and 79% down the screen.
    visitor: {
      src: "/images/hiw/hiw_4_2.webp",
      aspect: "aspect-[646/882]",
      ratio: 882 / 646,
      width: 0.17,
      rest: [0.72, 0.79],
      anchor: [0.03, 0.03],
    },
  },
];

/**
 * Where a visitor stands at rest, in CSS - shares of the main drawing's box -
 * so that at rest it is right at any size, and without a script at all (less
 * motion). The script only ever moves it away from here and back.
 */
function visitorRest(main: Drawing, v: Visitor) {
  return {
    left: (v.rest[0] - v.anchor[0] * v.width) * 100,
    top: (v.rest[1] - (v.anchor[1] * v.width * v.ratio) / main.ratio) * 100,
  };
}

/** The strength the drawings are printed at. */
export const ART_OPACITY = 0.5;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Piecewise-linear through points spaced evenly over 0..1. */
function along(points: [number, number][], t: number): [number, number] {
  const at = clamp01(t) * (points.length - 1);
  const i = Math.min(Math.floor(at), points.length - 2);
  const f = at - i;
  return [lerp(points[i][0], points[i + 1][0], f), lerp(points[i][1], points[i + 1][1], f)];
}

// The brush's way across the screen, as shares of the screen's width and
// height: in from the left and one slow stroke over it, back and across - and
// then to its place (its `rest`).
const BRUSH_STROKES: [number, number][] = [
  [-0.55, 0.3],
  [0.62, 0.4],
  [0.22, 0.56],
];

/**
 * One stage's drawing at `progress` (0 = not in yet, 1 = in its place). Writes
 * transforms only, and reads the box's own layout width first.
 *
 * `from` is where the magnifier starts its circle, from the middle of the
 * drawing at rest, in the drawing's own widths. Each layout picks it.
 *
 * GENTLE: one turn of the magnifier, not two and a half; one stroke of the
 * brush, not three; a press of the cursor you see rather than a twitch. The
 * first cut of these was all of that inside a second, and read as busy.
 */
export function poseStageArt(box: HTMLElement, index: number, progress: number, from: [number, number]) {
  const width = box.offsetWidth;
  const height = box.offsetHeight;
  const main = box.firstElementChild as HTMLElement | null;
  const visitor = box.children[1] as HTMLElement | undefined;
  if (!main) return;
  const art = STAGE_ART[index];
  const t = clamp01(progress);
  const e = easeInOut(t);

  if (index === 0) {
    // Once round as it searches its way in, the circle closing as it comes home.
    const turn = Math.PI * 0.5 + e * Math.PI * 2;
    const radius = 0.2 * (1 - e);
    const x = lerp(from[0], 0, e) + Math.cos(turn) * radius;
    const y = lerp(from[1], 0, e) + Math.sin(turn) * radius;
    main.style.transform = `translate(${(x * width).toFixed(1)}px, ${(y * width).toFixed(1)}px) rotate(${((1 - e) * -8).toFixed(2)}deg)`;
  } else if (index === 2) {
    main.style.transform = `translateY(${((1 - e) * 0.06 * width).toFixed(1)}px) rotate(${((1 - e) * -4).toFixed(2)}deg)`;
  } else {
    main.style.transform = `translateY(${((1 - e) * 0.04 * width).toFixed(1)}px)`;
  }

  if (!visitor || !art.visitor) return;
  const v = art.visitor;
  // Where the visitor's anchor is, in the main box, at this point of its way.
  // It is moved by how far that is from its rest, where CSS has put it.
  let point: [number, number];
  let scale = 1;
  let rotate = 0;
  if (index === 1) {
    point = along([...BRUSH_STROKES, v.rest], e);
    // A brush leans a little the way it is drawn, and settles upright.
    rotate = Math.sin(t * Math.PI * 2) * 5 * (1 - t);
  } else {
    // Up to the button over most of the time, a pause, then one soft press.
    const come = easeInOut(clamp01(t / 0.7));
    point = [lerp(0.95, v.rest[0], come), lerp(1.2, v.rest[1], come)];
    const press = clamp01((t - 0.78) / 0.2);
    scale = 1 - Math.sin(press * Math.PI) * 0.1;
  }
  const dx = (point[0] - v.rest[0]) * width;
  const dy = (point[1] - v.rest[1]) * height;
  visitor.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
}

// THE DRAWINGS KEEP THEIR OWN TIME. The swap that brings a stage in lasts a
// second or so, and a story told inside it was rushed: the drawing begins as
// its stage begins, and takes this long, whether the words have settled or
// not. It goes faster than it came: a drawing leaving fades, it does not play
// its story backwards.
const STORY_SECONDS = 2.8;
const FADE_IN_SECONDS = 0.6;
const FADE_OUT_SECONDS = 0.4;

type Run = { shown: boolean; progress: number; opacity: number; frame: number | null; last: number };
const runs = new WeakMap<HTMLElement, Run>();

/**
 * Bring one stage's drawing in (`shown`) or send it out. Called as often as
 * the layout likes - only a change does anything. Once out, the story starts
 * again from the beginning the next time it comes in. `strength` is the
 * opacity it comes in to: the desk prints it over a pencil sheet, the phone
 * gives it the page.
 */
export function showStageArt(
  box: HTMLElement,
  index: number,
  shown: boolean,
  from: [number, number],
  strength = ART_OPACITY,
) {
  let run = runs.get(box);
  if (!run) {
    run = { shown: false, progress: 0, opacity: 0, frame: null, last: 0 };
    runs.set(box, run);
    box.style.opacity = "0";
  }
  if (run.shown === shown) return;
  run.shown = shown;
  if (run.frame !== null) return;
  const live = run;
  live.last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.1, (now - live.last) / 1000);
    live.last = now;
    if (live.shown) {
      live.progress = Math.min(1, live.progress + dt / STORY_SECONDS);
      live.opacity = Math.min(1, live.opacity + dt / FADE_IN_SECONDS);
    } else {
      live.opacity = Math.max(0, live.opacity - dt / FADE_OUT_SECONDS);
      if (live.opacity === 0) live.progress = 0;
    }
    box.style.opacity = String(live.opacity * strength);
    poseStageArt(box, index, live.progress, from);
    const moving = live.shown ? live.progress < 1 || live.opacity < 1 : live.opacity > 0;
    live.frame = moving ? requestAnimationFrame(step) : null;
  };
  live.frame = requestAnimationFrame(step);
}

/** Stops a drawing's clock - its layout is going away. */
export function stopStageArt(box: HTMLElement) {
  const run = runs.get(box);
  if (run?.frame != null) cancelAnimationFrame(run.frame);
  runs.delete(box);
}

/**
 * One stage's drawing in its box. The box is the main drawing's own shape; a
 * layout places and sizes it, and sets its opacity. `className` places it.
 */
export function StageArtBox({
  index,
  className,
  boxRef,
}: {
  index: number;
  className?: string;
  boxRef?: (element: HTMLDivElement | null) => void;
}) {
  const art = STAGE_ART[index];
  const rest = art.visitor && visitorRest(art.main, art.visitor);
  // AFTER THE PAGE, like the sheet's own frames: the section is straight under
  // the hero, so its drawings would otherwise share the connection with the
  // hero's clip while that is what is on screen.
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    const loaded = () => setPageLoaded(true);
    if (document.readyState === "complete") {
      loaded();
      return;
    }
    window.addEventListener("load", loaded, { once: true });
    return () => window.removeEventListener("load", loaded);
  }, []);
  return (
    <div ref={boxRef} aria-hidden="true" className={`pointer-events-none ${art.main.aspect} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pageLoaded ? art.main.src : undefined} alt="" className="absolute inset-0 h-full w-full will-change-transform" draggable={false} />
      {art.visitor && rest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pageLoaded ? art.visitor.src : undefined}
          alt=""
          className={`absolute max-w-none will-change-transform ${art.visitor.aspect}`}
          // Its place and size come from the data above, so they are set here
          // and not as classes.
          style={{ width: `${art.visitor.width * 100}%`, left: `${rest.left}%`, top: `${rest.top}%` }}
          draggable={false}
        />
      )}
    </div>
  );
}
