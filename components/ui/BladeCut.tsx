"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The seam between two sections, drawn as a knife: the section above ends in
 * a straight edge, and from it a blade lies across the next one - its spine
 * flush with the edge, its belly curving up to the point, its handle off the
 * side of the screen. Filled with the colour of the section above
 * (`className`, as a fill), from alternate sides down the page (`flip`), so
 * that two seams in a row cross like the knives in the mark.
 *
 * THE BLADE IS DRAWN AS THE SEAM COMES UP THE SCREEN - slid in from its own
 * side - and once it is all the way in, a glint runs down its edge. Scrolled
 * back, it slides out again, and the glint is there to be seen next time.
 *
 * NOT A TRIANGLE. The seam was one before: a wedge the width of the page,
 * stretched with the scroll, and down a page of them it read as the points of
 * a backgammon board. A blade is the shape of the mark itself, the way the
 * glaze on the page for MAY'S is the shape of that one.
 *
 * Each seam has its own length (`variant`), and the last on a page can be
 * longer and broader (`heavy`). Drawn in real pixels from the element's own
 * width. With less motion the blade is simply there. Decoration - hidden from
 * assistive technology.
 */

// How much of the page's width each blade runs, by `variant`.
const LENGTHS = [0.62, 0.74, 0.56, 0.68];
const LENGTH_HEAVY = 0.84;
// How broad a blade is at the heel, as a share of the width, between these.
const BREADTH = 0.032;
const BREADTH_PX = [14, 46] as const;
const HEAVY_BREADTH = 1.35;
// How much of the blade's length runs straight before the belly curves up to
// the point.
const STRAIGHT = 0.45;
// Where the seam is on the screen (0 top, 1 bottom) when the blade starts in,
// and when it is home.
const DRAW = [1, 0.5] as const;

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
  /** The handle on the left, the point to the right. */
  flip?: boolean;
  /** The section above is dark, so the edge is honed light rather than dark. */
  dark?: boolean;
  /** Which length. Each seam on a page takes its own. */
  variant?: number;
  /** Longer and broader, for the last seam on a page. */
  heavy?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const bladeRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const glintRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const [home, setHome] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => setWidth(svg.getBoundingClientRect().width));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const breadth =
    Math.min(BREADTH_PX[1], Math.max(BREADTH_PX[0], width * BREADTH)) * (heavy ? HEAVY_BREADTH : 1);

  const draw = () => {
    const svg = svgRef.current;
    const blade = bladeRef.current;
    const edge = edgeRef.current;
    const glint = glintRef.current;
    if (!svg || !blade || !edge || !glint || width <= 0) return;
    const at = svg.getBoundingClientRect().top / window.innerHeight;
    // Eased out: it comes in fast and settles.
    const t = reduce ? 1 : 1 - (1 - clamp01((DRAW[0] - at) / (DRAW[0] - DRAW[1]))) ** 3;

    const length = width * (heavy ? LENGTH_HEAVY : LENGTHS[variant % LENGTHS.length]);
    // Out past its own side of the screen until it slides in.
    const out = (1 - t) * (length + breadth);
    // Laid out with the heel on the right, and mirrored for a flipped seam.
    const x = (value: number) => (flip ? width - value - out : value + out).toFixed(1);
    const heel = width;
    const turn = width - length * STRAIGHT;
    const point = width - length;
    const h = breadth.toFixed(1);
    const belly =
      `M${x(heel)},${h} L${x(turn)},${h}` +
      ` C${x(width - length * 0.75)},${h} ${x(width - length * 0.95)},${(breadth * 0.5).toFixed(1)} ${x(point)},0`;
    // A pixel over the section above, so no hairline of the page shows
    // between the two.
    blade.setAttribute("d", `M${x(heel)},-1 L${x(heel)},${h}` + belly.slice(belly.indexOf(" L")) + ` L${x(point)},-1 Z`);
    edge.setAttribute("d", belly);
    glint.setAttribute("d", belly);
    setHome(!reduce && t >= 1);
  };

  useLayoutEffect(draw);

  useMotionValueEvent(scrollY, "change", () => {
    if (!reduce) draw();
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 -top-px block w-full overflow-hidden", className)}
      height={Math.ceil(breadth) + 3}
    >
      <path ref={bladeRef} />
      {/* The honed edge, and the glint that runs down it from the heel to the
          point once the blade is home (.blade-glint in globals.css).
          pathLength 1, so the glint is the same share of the edge on every
          screen. */}
      <path ref={edgeRef} fill="none" strokeWidth={1.5} className={dark ? "stroke-white/30" : "stroke-black/15"} />
      <path
        ref={glintRef}
        fill="none"
        pathLength={1}
        strokeWidth={2}
        strokeLinecap="round"
        className={cn("blade-glint", dark ? "stroke-white" : "stroke-black/50", home && "blade-glint--run")}
      />
    </svg>
  );
}
