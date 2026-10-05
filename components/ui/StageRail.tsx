import { cn } from "@/lib/utils";

/**
 * Where the reader is in a run of stages the page scrolls through: a column of
 * circles, joined by a line that draws itself down to each one as it arrives.
 *
 * A column, not a row. Circles in a row are the sign of a carousel, and under
 * the stages they asked for a sideways swipe on a section that only moves on
 * with ordinary scrolling. Stacked, they say "four, you are on this one, keep
 * going down".
 *
 * Nothing joins two circles until the reader travels between them, so the line
 * is the movement itself.
 *
 * The desk's only. The phone had a smaller one with its whole route laid out in
 * grey; it now prints "1/4" on the sheet instead, which says the same thing in
 * the site's own type.
 *
 * Markup only. The section that owns it drives it with setStageRail() from its
 * own scroll handler, the way it drives everything else on the sheet.
 */

// The circle's diameter. The fill starts and ends at a circle's centre, so the
// classes below and setStageRail both work from it.
const DOT_PX = 16;

export default function StageRail({ count, className }: { count: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-stage-rail
      className={cn("pointer-events-none relative flex flex-col items-center gap-5", className)}
    >
      {/* The fill runs from the first circle's centre towards the last's,
          behind them. */}
      <span data-rail-fill className="absolute inset-x-0 top-[8px] mx-auto h-0 w-px bg-black" />
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          data-rail-dot
          className="relative block h-4 w-4 rounded-full border border-black/25 bg-white transition-colors duration-300"
        />
      ))}
    </div>
  );
}

/**
 * `progress` runs 0 → 1 from the first stage to the last and draws the line;
 * `current` is the stage on the sheet now, and it and every one before it are
 * filled in.
 */
export function setStageRail(root: HTMLElement, progress: number, current: number) {
  const rail = root.matches("[data-stage-rail]") ? root : root.querySelector<HTMLElement>("[data-stage-rail]");
  if (!rail) return;
  const fill = rail.querySelector<HTMLElement>("[data-rail-fill]");
  if (fill) fill.style.height = `calc((100% - ${DOT_PX}px) * ${Math.min(1, Math.max(0, progress)).toFixed(4)})`;
  rail.querySelectorAll<HTMLElement>("[data-rail-dot]").forEach((circle, index) => {
    const reached = index <= current;
    circle.style.backgroundColor = reached ? "rgb(0 0 0)" : "";
    circle.style.borderColor = reached ? "rgb(0 0 0)" : "";
  });
}
