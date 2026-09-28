import { cn } from "@/lib/utils";

/**
 * Where the reader is in a run of stages the page scrolls through: a column of
 * 10px circles on a hairline, the line filling downward as they go.
 *
 * A column, not a row. Circles in a row are the sign of a carousel, and under
 * the stages they asked for a sideways swipe on a section that only moves on
 * with ordinary scrolling. Stacked, they say "four, you are on this one, keep
 * going down", and the filling line says how much is left.
 *
 * Markup only. The section that owns it drives it with setStageRail() from its
 * own scroll handler, the way it drives everything else on the sheet.
 */
export default function StageRail({ count, className }: { count: number; className?: string }) {
  return (
    <div aria-hidden="true" data-stage-rail className={cn("pointer-events-none relative flex flex-col items-center gap-3", className)}>
      {/* The track and its fill run from the first circle's centre to the
          last's, behind them. */}
      <span className="absolute inset-x-0 top-[5px] bottom-[5px] mx-auto w-px bg-black/15" />
      <span data-rail-fill className="absolute inset-x-0 top-[5px] mx-auto h-0 w-px bg-black" />
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          data-rail-dot
          className="relative block h-2.5 w-2.5 rounded-full border border-black/25 bg-white transition-colors duration-300"
        />
      ))}
    </div>
  );
}

/**
 * `progress` runs 0 → 1 from the first stage to the last and fills the line;
 * `current` is the stage on the sheet now, and it and every one before it are
 * filled in.
 */
export function setStageRail(root: HTMLElement, progress: number, current: number) {
  const fill = root.querySelector<HTMLElement>("[data-rail-fill]");
  if (fill) fill.style.height = `calc((100% - 10px) * ${Math.min(1, Math.max(0, progress)).toFixed(4)})`;
  root.querySelectorAll<HTMLElement>("[data-rail-dot]").forEach((dot, index) => {
    const reached = index <= current;
    dot.style.backgroundColor = reached ? "rgb(0 0 0)" : "";
    dot.style.borderColor = reached ? "rgb(0 0 0)" : "";
  });
}
