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
 * THE CUT IS MADE AS THE SEAM COMES UP THE SCREEN. The blade goes in at one
 * top corner and runs across and down to the other, and the edge it leaves is
 * honed: a thin lighter line along it, where steel catches the light. When the
 * cut is through, a glint runs down that line once. Scrolled back, the cut
 * closes again, and the glint is there to be seen the next time.
 *
 * It used to be one triangle stretched taller with the scroll, the same at
 * every seam. Each now has its own depth (`variant`), and the last on a page
 * can cut deeper (`heavy`) - the way the glaze on the page for MAY'S runs
 * longest at its last seam.
 *
 * SHALLOW, AND THAT IS THE POINT. At a sixth of the page's width deep, a cut
 * was a shape: down a page of them, a row of wedges like the points of a
 * backgammon board. A cut a blade leaves is a line at a low angle.
 *
 * NOT A BLADE EITHER. A knife drawn across the seam - spine, belly, point -
 * was built and taken out: it read as a picture of a knife, not as a cut.
 *
 * Drawn in real pixels from the element's own width, so the angle is the same
 * on a phone as on a desk. With less motion the cut is simply there.
 * Decoration - hidden from assistive technology.
 */

// How deep each seam is cut, as a share of the page's width, by `variant`.
const DEPTHS = [0.055, 0.075, 0.045, 0.065];
const DEPTH_HEAVY = 0.09;
const MAX_DEPTH_PX = 110;
const MAX_DEPTH_HEAVY_PX = 140;
// Where the seam is on the screen (0 top, 1 bottom) when the blade goes in,
// and when it is through.
const CUT = [1, 0.45] as const;

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
  const fillRef = useRef<SVGPolygonElement>(null);
  const edgeRef = useRef<SVGLineElement>(null);
  const glintRef = useRef<SVGLineElement>(null);
  const [width, setWidth] = useState(0);
  const [through, setThrough] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => setWidth(svg.getBoundingClientRect().width));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const depth = Math.min(
    heavy ? MAX_DEPTH_HEAVY_PX : MAX_DEPTH_PX,
    width * (heavy ? DEPTH_HEAVY : DEPTHS[variant % DEPTHS.length]),
  );

  const draw = () => {
    const svg = svgRef.current;
    const fill = fillRef.current;
    const edge = edgeRef.current;
    const glint = glintRef.current;
    if (!svg || !fill || !edge || !glint || width <= 0) return;
    const at = svg.getBoundingClientRect().top / window.innerHeight;
    // Eased out: the blade goes in fast and slows as it comes through.
    const t = reduce ? 1 : 1 - (1 - clamp01((CUT[0] - at) / (CUT[0] - CUT[1]))) ** 3;
    const from = flip ? 0 : width;
    const tipX = from + ((flip ? width : 0) - from) * t;
    const tipY = depth * t;
    // A pixel over the section above, so no hairline of the page shows
    // between the two.
    fill.setAttribute("points", `${from},-1 ${tipX},-1 ${tipX},${tipY} ${from},0`);
    for (const line of [edge, glint]) {
      line.setAttribute("x1", String(from));
      line.setAttribute("y1", "0");
      line.setAttribute("x2", tipX.toFixed(1));
      line.setAttribute("y2", tipY.toFixed(1));
    }
    setThrough(!reduce && t >= 1);
  };

  useLayoutEffect(draw);

  useMotionValueEvent(scrollY, "change", () => {
    if (!reduce) draw();
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 -top-px block w-full overflow-visible", className)}
      height={Math.ceil(depth) + 2}
    >
      <polygon ref={fillRef} />
      {/* The honed edge, and the glint that runs down it once the cut is
          through (.blade-glint in globals.css). pathLength 1, so the glint is
          the same share of the edge on every screen. */}
      <line ref={edgeRef} strokeWidth={1.5} className={dark ? "stroke-white/25" : "stroke-black/10"} />
      <line
        ref={glintRef}
        pathLength={1}
        strokeWidth={2}
        strokeLinecap="round"
        className={cn("blade-glint", dark ? "stroke-white" : "stroke-black/45", through && "blade-glint--run")}
      />
    </svg>
  );
}
