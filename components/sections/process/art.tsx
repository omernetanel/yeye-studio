/**
 * THE DRAWINGS OF THE FOUR STAGES - Omer's own pencil work, one for each - and
 * the small story each one tells as its stage comes in. Shared by the phone's
 * sheet (MobileServices) and the desk's (ServicesSection); where each drawing
 * stands is the layout's business, and how it moves is decided here, once.
 *
 * WHAT EACH ONE DOES on its way in, as a function of how far in it is (0 to 1),
 * so it follows the scroll like everything else on the sheet:
 * 1. The magnifier goes over the words in a circle, the way you search a page
 *    with one, and settles in its place.
 * 2. A brush comes in from the side and works across the screen, as if it is
 *    painting it, and comes to rest beside it.
 * 3. The code tilts up into its place.
 * 4. A cursor comes up to "Publish" and presses it.
 *
 * Drawn on the sheet at half strength, like the drawing the desk prints under
 * them: the words are what is read, the drawings are the room.
 *
 * The files are the drawings cut to their own edges (so a place on the drawing
 * is a place on its box) and kept to 900 across - more than either layout
 * shows them at. Made from the PNGs in the same folder, which stay out of git:
 *   ffmpeg -i hiw_1.png -vf "crop=<drawn area>,scale='min(900,iw)':-2:flags=lanczos"
 *     -c:v libwebp -quality 82 -compression_level 6 -pix_fmt yuva420p hiw_1.webp
 */

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
    // The brush, its middle resting just off the screen's left edge.
    visitor: {
      src: "/images/hiw/hiw_2_2.webp",
      aspect: "aspect-[900/922]",
      ratio: 922 / 900,
      width: 0.46,
      rest: [-0.12, 0.62],
      anchor: [0.5, 0.5],
    },
  },
  { main: { src: "/images/hiw/hiw_3.webp", aspect: "aspect-[900/804]", ratio: 804 / 900 } },
  {
    main: { src: "/images/hiw/hiw_4_1.webp", aspect: "aspect-[900/708]", ratio: 708 / 900 },
    // The cursor, its tip on "Publish" - 53% across and 74% down the screen.
    visitor: {
      src: "/images/hiw/hiw_4_2.webp",
      aspect: "aspect-[646/882]",
      ratio: 882 / 646,
      width: 0.17,
      rest: [0.53, 0.74],
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
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Piecewise-linear through points spaced evenly over 0..1. */
function along(points: [number, number][], t: number): [number, number] {
  const at = clamp01(t) * (points.length - 1);
  const i = Math.min(Math.floor(at), points.length - 2);
  const f = at - i;
  return [lerp(points[i][0], points[i + 1][0], f), lerp(points[i][1], points[i + 1][1], f)];
}

// The brush's way across the screen, as shares of the screen's width and
// height: in from the left and three strokes over it - and then to its place
// (its `rest`).
const BRUSH_STROKES: [number, number][] = [
  [-0.9, 0.15],
  [0.3, 0.28],
  [0.75, 0.38],
  [0.32, 0.52],
  [0.78, 0.6],
];

/**
 * One stage's drawing at `progress` (0 = not in yet, 1 = in its place). Writes
 * transforms only, and reads the box's own layout width first.
 *
 * `toward` is where the words are, from the middle of the drawing at rest, in
 * the drawing's own widths: the magnifier's circle is drawn around there.
 */
export function poseStageArt(box: HTMLElement, index: number, progress: number, toward: [number, number]) {
  const width = box.offsetWidth;
  const height = box.offsetHeight;
  const main = box.firstElementChild as HTMLElement | null;
  const visitor = box.children[1] as HTMLElement | undefined;
  if (!main) return;
  const art = STAGE_ART[index];
  const t = clamp01(progress);

  if (index === 0) {
    // Round and round over the words, the circle tightening as it comes home.
    const e = easeInOut(t);
    const turn = Math.PI * 0.5 + e * Math.PI * 2.5;
    const radius = 0.3 * (1 - e);
    const x = lerp(toward[0], 0, e) + Math.cos(turn) * radius;
    const y = lerp(toward[1], 0, e) + Math.sin(turn) * radius;
    main.style.transform = `translate(${(x * width).toFixed(1)}px, ${(y * width).toFixed(1)}px) rotate(${((1 - e) * -14).toFixed(2)}deg)`;
  } else if (index === 2) {
    const e = easeOut(t);
    main.style.transform = `translateY(${((1 - e) * 0.12 * width).toFixed(1)}px) rotate(${((1 - e) * -7).toFixed(2)}deg)`;
  } else {
    main.style.transform = `translateY(${((1 - easeOut(t)) * 0.06 * width).toFixed(1)}px)`;
  }

  if (!visitor || !art.visitor) return;
  const v = art.visitor;
  // Where the visitor's anchor is, in the main box, at this point of its way.
  // It is moved by how far that is from its rest, where CSS has put it.
  let point: [number, number];
  let scale = 1;
  let rotate = 0;
  if (index === 1) {
    point = along([...BRUSH_STROKES, v.rest], easeInOut(t));
    // A brush tilts as it is dragged one way and the other.
    rotate = Math.sin(t * Math.PI * 5) * 8 * (1 - t);
  } else {
    // Up from below to the button over the first three quarters, then a press.
    const come = easeOut(clamp01(t / 0.75));
    point = [lerp(1.1, v.rest[0], come), lerp(1.35, v.rest[1], come)];
    const press = clamp01((t - 0.8) / 0.18);
    scale = 1 - Math.sin(press * Math.PI) * 0.16;
  }
  const dx = (point[0] - v.rest[0]) * width;
  const dy = (point[1] - v.rest[1]) * height;
  visitor.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
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
  return (
    <div ref={boxRef} aria-hidden="true" className={`pointer-events-none ${art.main.aspect} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art.main.src} alt="" className="absolute inset-0 h-full w-full will-change-transform" draggable={false} />
      {art.visitor && rest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art.visitor.src}
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
