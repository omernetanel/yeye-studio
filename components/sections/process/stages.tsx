/**
 * The four stages of the work: what they are called, and what they look like.
 *
 * They live here rather than beside the desktop diagram because the phone draws
 * the same four stages on the same open sheet, in a vertical arrangement that
 * shares nothing else with the desktop's ellipse. The words and the artwork are
 * what both do share, and a second copy of either is the kind of duplicate that
 * quietly drifts apart — which it already had: the phone's first stage read
 * "מכירים את העסק" against the desktop's "מבינים את העסק", and the heading over
 * it was the English word "process" against "איך אני עובד?". Two files, two
 * answers to the same question. Now there is one.
 *
 * What is NOT here is anything about arrangement — coordinates, sizes, the
 * sentence under each title on the desktop. Those belong to whichever layout is
 * doing the drawing.
 *
 * Every icon is drawn around its OWN origin, so a layout only has to say where
 * the centre of a station is.
 *
 * EACH ONE MOVES THE WAY THE THING IT DRAWS WOULD, which is the difference
 * between four icons and four animations: the rocket flies and its flame
 * flickers, the reply bubble answers the first one, the brush paints, the
 * browser drifts. One shared bob across all four would read as a page that
 * wobbles. The classes are defined in globals.css, where the reduced-motion
 * switch turns every one of them off in a single rule.
 */
/**
 * The heading over the diagram, as the two lines it breaks into. The break is
 * deliberate on the desktop, where the heading sits in the corner of the sheet
 * in a column two words wide; the phone joins them back into one line. Kept as
 * lines rather than as a string with a `<br/>` in it so neither layout has to
 * parse the other's markup.
 */
export const PROCESS_HEADING = ["איך אני", "עובד?"];

/** In order. The numeral each one carries is its position, not a field. */
export const STAGE_TITLES = [
  "מבינים את העסק",
  "מעצבים את החוויה",
  "בונים את זה נכון",
  "עולים לאוויר",
];

export type IconPart = { d: string; cls?: string };

export const ICONS: Record<string, IconPart[]> = {
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
export const ICON_MOTION: Record<string, string> = {
  "01": "icon-drift",
  "02": "",
  "03": "icon-drift",
  "04": "icon-rocket",
};

/**
 * The bits that are not a path: the rocket's window, the browser's traffic
 * lights. Kept beside the paths so a station's artwork is complete in one
 * place, and rendered by whichever layout is drawing it.
 */
export function IconExtras({ number }: { number: string }) {
  if (number === "04") return <circle cx="0" cy="-8" r="9" />;
  if (number === "03") {
    return (
      <g strokeWidth="0" fill="currentColor">
        <circle cx="-40" cy="-25" r="2.6" />
        <circle cx="-30" cy="-25" r="2.6" />
        <circle cx="-20" cy="-25" r="2.6" />
      </g>
    );
  }
  return null;
}
