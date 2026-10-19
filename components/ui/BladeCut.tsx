"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A seam cut on the slant, the way a blade leaves one: the section above ends
 * in one straight diagonal edge. Laid at the head of the section below and
 * filled with the colour of the one above (`className`, as a fill),
 * alternating sides down the page (`flip`) so that two seams in a row cross
 * like the knives in the mark they were drawn from.
 *
 * IT STRETCHES WITH THE SCROLL: shallow as the seam comes onto the screen,
 * to its full depth by the time it is past the middle, and back on the way
 * up. With less motion the cut is simply there.
 *
 * WHAT CAME BEFORE, so it is not built again:
 * - A wedge a sixth of the page deep: down a page of them, the points of a
 *   backgammon board. This is the same stretch at a middle depth.
 * - A shallow cut drawn across the page with the scroll: the slow fill read
 *   as cheap, worst on a phone.
 * - A knife drawn across the seam (spine, belly, point): a picture of a
 *   knife, not a cut.
 * - One stroke on arrival - a bright line, then the cut falling open: read
 *   as a jump.
 *
 * Drawn in real pixels from the element's own width, so the angle is the same
 * on a phone as on a desk. Decoration - hidden from assistive technology.
 */

// How deep each seam is cut, as a share of the page's width, by `variant`,
// and never deeper than the room the sections leave above their words (288px
// on a desk, 320 over the close).
const DEPTHS = [0.125, 0.15, 0.11, 0.14];
const DEPTH_HEAVY = 0.17;
const MAX_DEPTH_PX = 210;
const MAX_DEPTH_HEAVY_PX = 260;
// Where the seam is on the screen (0 top, 1 bottom) when it starts to stretch,
// and when it is at its full depth; and how deep it already is at the start.
const STRETCH = [0.98, 0.4] as const;
const STRETCH_FROM = 0.3;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function BladeCut({
  className,
  flip = false,
  variant = 0,
  heavy = false,
}: {
  /** The section above's colour, as a fill. */
  className: string;
  /** The deep end on the other side: the blade goes in from the left. */
  flip?: boolean;
  /** Which depth. Each seam on a page takes its own. */
  variant?: number;
  /** Deeper, for the last seam on a page. The section under it has to leave the room. */
  heavy?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const cutRef = useRef<SVGGElement>(null);
  const [width, setWidth] = useState(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const resize = new ResizeObserver(() => setWidth(svg.getBoundingClientRect().width));
    resize.observe(svg);
    return () => resize.disconnect();
  }, []);

  // Stretched from its top edge, which is the one thing about it that never
  // moves, so the box it is measured by is never mid-animation.
  const stretch = () => {
    const svg = svgRef.current;
    const cut = cutRef.current;
    if (!svg || !cut) return;
    const at = svg.getBoundingClientRect().top / window.innerHeight;
    const through = reduce ? 1 : clamp01((STRETCH[0] - at) / (STRETCH[0] - STRETCH[1]));
    cut.style.transform = `scaleY(${(STRETCH_FROM + (1 - STRETCH_FROM) * through).toFixed(4)})`;
  };

  useLayoutEffect(stretch);

  useMotionValueEvent(scrollY, "change", () => {
    if (!reduce) stretch();
  });

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
      className={cn("pointer-events-none absolute inset-x-0 -top-px block w-full overflow-visible", className)}
      height={Math.ceil(depth) + 2}
    >
      {width > 0 && (
        <>
          {/* The cut, stretched from the top. A pixel over the section above,
              so no hairline of the page shows between the two. No honed edge
              along it (removed 2026-10-19): it read as a shadow. */}
          <g ref={cutRef} className="[transform-box:view-box] [transform-origin:0_0]">
            <polygon points={`${from},-1 ${to},-1 ${to},${depth.toFixed(1)} ${from},0`} />
          </g>
        </>
      )}
    </svg>
  );
}
