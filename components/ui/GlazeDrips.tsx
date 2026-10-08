"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The edge between two sections, drawn as glaze running down from the one
 * above: a line of drips in that section's colour, hanging over the next.
 *
 * Made for the MAY'S page, whose whole mark is letters with icing running off
 * them - so the page's own seams run the same way. The drips LENGTHEN AS THE
 * EDGE COMES UP THE SCREEN and shorten again on the way back: they follow the
 * scroll, like everything else here, and with less motion they hang at full
 * length and do not move.
 *
 * Drawn in real pixels, not in a stretched box: the path is rebuilt from the
 * element's own width, so a drip is as round on a phone as on a desk, and a
 * narrow screen simply gets fewer of them.
 *
 * Decoration - hidden from assistive technology. The colour is the caller's
 * (`className`, as a fill).
 */

interface Drip {
  /** Where along the edge, 0 to 1. */
  at: number;
  /** Half its width and how far it hangs, in px. */
  radius: number;
  length: number;
}

// Uneven on purpose: icing does not run in a row.
const DRIPS: Drip[] = [
  { at: 0.06, radius: 9, length: 46 },
  { at: 0.15, radius: 15, length: 104 },
  { at: 0.23, radius: 7, length: 30 },
  { at: 0.34, radius: 12, length: 72 },
  { at: 0.43, radius: 18, length: 138 },
  { at: 0.52, radius: 8, length: 38 },
  { at: 0.61, radius: 13, length: 88 },
  { at: 0.72, radius: 10, length: 54 },
  { at: 0.81, radius: 16, length: 120 },
  { at: 0.9, radius: 8, length: 34 },
  { at: 0.96, radius: 11, length: 66 },
];
// The room the longest drip needs, and a little for the bead at its end.
const HEIGHT = 150;
// Under this width every other drip is left out, so they do not crowd.
const NARROW_PX = 640;
// How short a drip starts, as a share of its length, and where the edge is on
// the screen (0 top, 1 bottom) when it starts to run and when it has run out.
const START_AT = 0.3;
const RUN = [1, 0.45] as const;

function pathFor(width: number, grown: number) {
  const drips = width < NARROW_PX ? DRIPS.filter((_, index) => index % 2 === 1) : DRIPS;
  // A pixel above the edge, so no hairline shows between it and the section
  // it hangs from.
  let d = `M0,-1 H${width} V0`;
  // Right to left along the bottom of the edge, a drip at a time.
  for (const drip of [...drips].reverse()) {
    const x = drip.at * width;
    const r = drip.radius;
    const length = Math.max(r * 2, drip.length * (START_AT + (1 - START_AT) * grown));
    d +=
      ` L${(x + r * 2).toFixed(1)},0` +
      ` C${(x + r).toFixed(1)},0 ${(x + r).toFixed(1)},0 ${(x + r).toFixed(1)},${r}` +
      ` V${(length - r).toFixed(1)}` +
      ` A${r},${r} 0 0 1 ${(x - r).toFixed(1)},${(length - r).toFixed(1)}` +
      ` V${r}` +
      ` C${(x - r).toFixed(1)},0 ${(x - r).toFixed(1)},0 ${(x - r * 2).toFixed(1)},0`;
  }
  return `${d} L0,0 Z`;
}

export default function GlazeDrips({ className }: { className?: string }) {
  const reduce = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => setWidth(svg.getBoundingClientRect().width));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const draw = () => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path || width <= 0) return;
    const at = svg.getBoundingClientRect().top / window.innerHeight;
    const grown = reduce ? 1 : Math.min(1, Math.max(0, (RUN[0] - at) / (RUN[0] - RUN[1])));
    path.setAttribute("d", pathFor(width, grown));
  };

  useLayoutEffect(draw);

  useMotionValueEvent(scrollY, "change", () => {
    if (!reduce) draw();
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 top-0 block w-full", className)}
      height={HEIGHT}
    >
      <path ref={pathRef} />
    </svg>
  );
}
