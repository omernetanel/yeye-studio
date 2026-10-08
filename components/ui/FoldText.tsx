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
// A plain space in a box of its own has no width; this one keeps it.
const NO_BREAK_SPACE = " ";

// THE LETTERS ARE DRAWN, NOT WRITTEN. Each box carries its letter in an
// attribute and CSS prints it (.fold-piece::before in globals.css), so the
// page's text holds every heading ONCE - the copy for screen readers - and not
// a second time as a run of single letters. Written into the boxes as text,
// anything that reads the page as text (a search engine, a link preview, a
// reader mode) got each word twice and run together: "חלקחלקמהעבודותמהעבודות".

export default function FoldText({
  text,
  silent = false,
}: {
  text: string;
  /**
   * Leave out the copy for screen readers. For a heading cut into several
   * FoldTexts - by colour, or a word at a time - where each piece's own copy
   * would be read as a fragment ("YE", then "S,"): the heading then carries
   * the whole sentence once itself, in an sr-only span, and its pieces are
   * silent.
   */
  silent?: boolean;
}) {
  return (
    <>
      {/* With a space after it: a heading set a word to a box would otherwise
          read, as text, with its words run together. */}
      {!silent && <span className="sr-only">{text} </span>}
      <span aria-hidden="true">
        {Array.from(text).map((char, index) => (
          <span key={index} className="fold-segment">
            <span className="fold-piece" data-char={char === " " ? NO_BREAK_SPACE : char} />
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
