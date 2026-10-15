"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A seam cut by two blades: one in from each top corner of the section below,
 * meeting in a V - and once the seam is at its full depth, each blade's point
 * runs on past the meeting and the two cross, as the knives do in the mark.
 * Laid at the head of the section below and filled with the colour of the one
 * above (`className`, as a fill). Where they meet moves from seam to seam
 * (`variant`, mirrored by `flip`).
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

// How deep each seam is cut, as a share of the page's width, by `variant`.
const DEPTHS = [0.1, 0.12, 0.09, 0.11];
const DEPTH_HEAVY = 0.14;
const MAX_DEPTH_PX = 170;
const MAX_DEPTH_HEAVY_PX = 220;
// Where the seam is on the screen (0 top, 1 bottom) when it starts to stretch,
// and when it is at its full depth; and how deep it already is at the start.
const STRETCH = [0.98, 0.4] as const;
const STRETCH_FROM = 0.3;
// Where the two blades meet, as a share of the width, by `variant` - never
// twice in the same place down a page.
const CROSS = [0.5, 0.42, 0.58, 0.46];
// How far each blade's point runs on past the meeting, as a share of its
// length to it, and how broad a point is where it leaves the edge, px. The
// points cross only over the last part of the stretch.
const TIP = 0.45;
const TIP_HEAVY = 0.6;
const TIP_BASE_PX = 2.5;
const TIPS_FROM = 0.55;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function BladeCut({
  className,
  flip = false,
  dark = false,
  variant = 0,
  heavy = false,
}: {
  /** The section above's colour, as a fill. */
  className: string;
  /** The meeting mirrored across the page. */
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
  const cutRef = useRef<SVGGElement>(null);
  const leftTipRef = useRef<SVGPolygonElement>(null);
  const rightTipRef = useRef<SVGPolygonElement>(null);
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
  const depth = Math.min(
    heavy ? MAX_DEPTH_HEAVY_PX : MAX_DEPTH_PX,
    width * (heavy ? DEPTH_HEAVY : DEPTHS[variant % DEPTHS.length]),
  );
  // One blade in from each top corner, meeting at the point of the V.
  const cross = flip ? 1 - CROSS[variant % CROSS.length] : CROSS[variant % CROSS.length];
  const meetX = width * cross;
  const tip = heavy ? TIP_HEAVY : TIP;

  const stretch = () => {
    const svg = svgRef.current;
    const cut = cutRef.current;
    const leftTip = leftTipRef.current;
    const rightTip = rightTipRef.current;
    if (!svg || !cut || !leftTip || !rightTip) return;
    const at = svg.getBoundingClientRect().top / window.innerHeight;
    const through = reduce ? 1 : clamp01((STRETCH[0] - at) / (STRETCH[0] - STRETCH[1]));
    cut.style.transform = `scaleY(${(STRETCH_FROM + (1 - STRETCH_FROM) * through).toFixed(4)})`;
    // Past the meeting, each blade's point runs on along its own line - the
    // left one down to the right, the right one down to the left - and the
    // two cross under the V, as the knives do in the mark.
    const run = tip * clamp01((through - TIPS_FROM) / (1 - TIPS_FROM));
    const n = (value: number) => value.toFixed(1);
    const base = `${n(meetX - TIP_BASE_PX)},${n(depth)} ${n(meetX + TIP_BASE_PX)},${n(depth)}`;
    leftTip.setAttribute("points", `${base} ${n(meetX + meetX * run)},${n(depth + depth * run)}`);
    rightTip.setAttribute("points", `${base} ${n(meetX - (width - meetX) * run)},${n(depth + depth * run)}`);
  };

  useLayoutEffect(stretch);

  useMotionValueEvent(scrollY, "change", () => {
    if (!reduce) stretch();
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 -top-px block w-full overflow-visible", className)}
      height={Math.ceil(depth * (1 + tip)) + 2}
    >
      {width > 0 && (
        <>
          {/* The two blades and their honed edges, stretched together from
              the top. A pixel over the section above, so no hairline of the
              page shows between the two. */}
          <g ref={cutRef} className="[transform-box:view-box] [transform-origin:0_0]">
            <polygon points={`0,-1 ${width},-1 ${width},0 ${meetX},${depth.toFixed(1)} 0,0`} />
            <polygon ref={leftTipRef} />
            <polygon ref={rightTipRef} />
            {[0, width].map((x) => (
              <line
                key={x}
                x1={x}
                y1={0}
                x2={meetX}
                y2={depth.toFixed(1)}
                strokeWidth={1.5}
                // The same hairline at every depth, however far it is stretched.
                vectorEffect="non-scaling-stroke"
                className={dark ? "stroke-white/25" : "stroke-black/10"}
              />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
