import { cn } from "@/lib/utils";

/**
 * A seam cut on the slant: the section above ends in one straight diagonal
 * edge, the way a blade leaves one. Laid at the head of the section below and
 * given the colour of the one above (`className`), alternating sides down the
 * page (`flip`) so that two seams in a row cross like the knives in the mark
 * they were drawn from.
 *
 * The page that uses it deepens the cut as the seam comes up the screen: it
 * finds these by `data-blade` and scales them from their top edge.
 */
export default function BladeCut({ className, flip = false }: { className: string; flip?: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-blade
      className={cn(
        // A pixel over the section above, so no hairline of the page shows
        // between the two.
        "pointer-events-none absolute inset-x-0 -top-px h-[16vw] max-h-[240px] origin-top will-change-transform",
        flip ? "[clip-path:polygon(0_0,100%_0,100%_100%)]" : "[clip-path:polygon(0_0,100%_0,0_100%)]",
        className,
      )}
    />
  );
}
