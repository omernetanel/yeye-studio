/**
 * Text that folds into place a letter at a time, each letter a panel hinged at
 * its top edge.
 *
 * Derived from React Bits' FoldText (MIT). Theirs plays once on its own GSAP
 * clock when it scrolls into view; this one has no clock at all. setFold() puts
 * every letter where it belongs for a progress between 0 and 1, and the section
 * that owns the heading calls it from its scroll handler — so the fold stops
 * when the reader stops and unfolds back when they scroll up, like everything
 * else on the page. That is the reason the earlier GSAP fold on the projects
 * heading was taken out.
 *
 * Their crease shading is left out: it is a dark gradient over each panel,
 * which reads as a fold on light type over dark and as a grey box behind black
 * type on white.
 */

// Their defaults, restated as fractions of one progress run: each letter takes
// DURATION, the next starts STAGGER later.
const DURATION = 0.65;
const STAGGER = 0.045;
const FOLDED_DEG = -92;

export default function FoldText({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((char, index) => (
          <span key={index} className="fold-segment">
            <span className="fold-piece">{char === " " ? " " : char}</span>
          </span>
        ))}
      </span>
    </>
  );
}

const pieceCache = new WeakMap<HTMLElement, HTMLElement[]>();

/** Every FoldText letter inside `root`, in reading order, at `progress`. */
export function setFold(root: HTMLElement, progress: number) {
  let pieces = pieceCache.get(root);
  if (!pieces) {
    pieces = Array.from(root.querySelectorAll<HTMLElement>(".fold-piece"));
    pieceCache.set(root, pieces);
  }
  const total = DURATION + STAGGER * Math.max(0, pieces.length - 1);
  const clock = Math.min(1, Math.max(0, progress)) * total;
  pieces.forEach((piece, index) => {
    const t = Math.min(1, Math.max(0, (clock - index * STAGGER) / DURATION));
    // power3.out, the ease theirs runs on.
    const eased = 1 - (1 - t) ** 3;
    piece.style.opacity = String(eased);
    piece.style.transform = eased >= 1 ? "" : `rotateX(${(FOLDED_DEG * (1 - eased)).toFixed(2)}deg)`;
  });
}
