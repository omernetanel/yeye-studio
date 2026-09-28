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
 * `track` lays the whole route out in grey from the start, which the phone
 * keeps; without it (the desk) nothing joins two circles until the reader
 * travels between them, so the line is the movement itself.
 *
 * Markup only. The section that owns it drives it with setStageRail() from its
 * own scroll handler, the way it drives everything else on the sheet.
 */
const SIZES = {
  // Circle diameter in px, and the classes that draw it. Literal strings so
  // Tailwind can see every class.
  sm: { px: 10, dot: "h-2.5 w-2.5", gap: "gap-3", inset: "top-[5px] bottom-[5px]", fillTop: "top-[5px]" },
  lg: { px: 16, dot: "h-4 w-4", gap: "gap-5", inset: "top-[8px] bottom-[8px]", fillTop: "top-[8px]" },
} as const;

export default function StageRail({
  count,
  size = "sm",
  track = true,
  className,
}: {
  count: number;
  size?: keyof typeof SIZES;
  track?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div
      aria-hidden="true"
      data-stage-rail
      data-dot={s.px}
      className={cn("pointer-events-none relative flex flex-col items-center", s.gap, className)}
    >
      {/* The track and its fill run from the first circle's centre to the
          last's, behind them. */}
      {track && <span className={cn("absolute inset-x-0 mx-auto w-px bg-black/15", s.inset)} />}
      <span data-rail-fill className={cn("absolute inset-x-0 mx-auto h-0 w-px bg-black", s.fillTop)} />
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          data-rail-dot
          className={cn("relative block rounded-full border border-black/25 bg-white transition-colors duration-300", s.dot)}
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
  const dot = Number(rail.dataset.dot) || 10;
  const fill = rail.querySelector<HTMLElement>("[data-rail-fill]");
  if (fill) fill.style.height = `calc((100% - ${dot}px) * ${Math.min(1, Math.max(0, progress)).toFixed(4)})`;
  rail.querySelectorAll<HTMLElement>("[data-rail-dot]").forEach((circle, index) => {
    const reached = index <= current;
    circle.style.backgroundColor = reached ? "rgb(0 0 0)" : "";
    circle.style.borderColor = reached ? "rgb(0 0 0)" : "";
  });
}
