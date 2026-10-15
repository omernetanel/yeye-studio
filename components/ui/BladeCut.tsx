"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A seam cut on the slant, the way a blade leaves one: the section above ends
 * in one straight diagonal edge. Laid at the head of the section below and
 * filled with the colour of the one above (`className`, as a fill),
 * alternating sides down the page (`flip`) so that two seams in a row cross
 * like the knives in the mark they were drawn from.
 *
 * ONE STROKE, NOT A SCRUB. As the seam comes onto the screen a thin bright
 * line slashes along the diagonal, and the cut falls open behind it in one
 * short move - the stroke of a knife, and then it is done. Scrolled back
 * above the seam it closes again, out of sight, ready to be cut once more.
 * With less motion the cut is simply there.
 *
 * WHAT CAME BEFORE, so it is not built again:
 * - A wedge a sixth of the page deep, stretched with the scroll: down a page
 *   of them, the points of a backgammon board.
 * - A shallow cut drawn across the page with the scroll: the slow fill read
 *   as cheap, worst on a phone.
 * - A knife drawn across the seam (spine, belly, point): a picture of a
 *   knife, not a cut.
 * This keeps the angle of the first at a middle depth, and the moment of a
 * blade instead of a crawl.
 *
 * Drawn in real pixels from the element's own width, so the angle is the same
 * on a phone as on a desk. Decoration - hidden from assistive technology. The
 * stroke and the opening are CSS (.blade-cut in globals.css).
 */

// How deep each seam is cut, as a share of the page's width, by `variant`.
const DEPTHS = [0.1, 0.12, 0.09, 0.11];
const DEPTH_HEAVY = 0.14;
const MAX_DEPTH_PX = 170;
const MAX_DEPTH_HEAVY_PX = 220;
// The cut is made once the seam is this far up from the foot of the screen.
const CUT_AT = "0px 0px -15% 0px";

export default function BladeCut({
  className,
  flip = false,
  dark = false,
  variant = 0,
  heavy = false,
}: {
  /** The section above's colour, as a fill. */
  className: string;
  /** The deep end on the other side: the blade goes in from the left. */
  flip?: boolean;
  /** The section above is dark, so its edge is honed light rather than dark. */
  dark?: boolean;
  /** Which depth. Each seam on a page takes its own. */
  variant?: number;
  /** Deeper, for the last seam on a page. The section under it has to leave the room. */
  heavy?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const resize = new ResizeObserver(() => setWidth(svg.getBoundingClientRect().width));
    resize.observe(svg);
    // Cut on the way in; closed again only once the seam is back below the
    // screen, where nobody sees it close.
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCut(true);
        else if (entry.boundingClientRect.top > 0) setCut(false);
      },
      { rootMargin: CUT_AT },
    );
    watch.observe(svg);
    return () => {
      resize.disconnect();
      watch.disconnect();
    };
  }, []);

  const depth = Math.min(
    heavy ? MAX_DEPTH_HEAVY_PX : MAX_DEPTH_PX,
    width * (heavy ? DEPTH_HEAVY : DEPTHS[variant % DEPTHS.length]),
  );
  // The blade goes in at one top corner and comes out at the foot of the
  // other side.
  const from = flip ? 0 : width;
  const to = flip ? width : 0;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn(
        "blade-cut pointer-events-none absolute inset-x-0 -top-px block w-full overflow-visible",
        (cut || reduce) && "blade-cut--open",
        reduce && "blade-cut--still",
        className,
      )}
      height={Math.ceil(depth) + 2}
    >
      {width > 0 && (
        <>
          {/* The cut itself and its honed edge, opening together from the top.
              A pixel over the section above, so no hairline of the page shows
              between the two. */}
          <g className="blade-cut-open">
            <polygon points={`${from},-1 ${to},-1 ${to},${depth.toFixed(1)} ${from},0`} />
            <line
              x1={from}
              y1={0}
              x2={to}
              y2={depth.toFixed(1)}
              strokeWidth={1.5}
              className={dark ? "stroke-white/25" : "stroke-black/10"}
            />
          </g>
          {/* The stroke: the line the blade draws, ahead of the opening. */}
          <line
            x1={from}
            y1={0}
            x2={to}
            y2={depth.toFixed(1)}
            pathLength={1}
            strokeWidth={2}
            strokeLinecap="round"
            className={cn("blade-cut-stroke", dark ? "stroke-white" : "stroke-black/60")}
          />
        </>
      )}
    </svg>
  );
}
