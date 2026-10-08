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
  /** Half the width of the thin run it narrows to, and how far it hangs, px. */
  neck: number;
  length: number;
}

// Uneven on purpose: icing does not run in a row.
const DRIPS: Drip[] = [
  { at: 0.06, neck: 2.6, length: 52 },
  { at: 0.15, neck: 4.2, length: 118 },
  { at: 0.24, neck: 2.2, length: 34 },
  { at: 0.34, neck: 3.4, length: 80 },
  { at: 0.44, neck: 4.8, length: 142 },
  { at: 0.53, neck: 2.4, length: 44 },
  { at: 0.62, neck: 3.8, length: 98 },
  { at: 0.72, neck: 2.8, length: 60 },
  { at: 0.81, neck: 4.4, length: 128 },
  { at: 0.9, neck: 2.2, length: 38 },
  { at: 0.96, neck: 3, length: 72 },
];
// THE SHAPE OF ONE, taken from the mark itself: wide where it leaves the edge,
// drawn out to a thin run, and a bead at the end a little wider than the run.
// With one width all the way down and a round end they were the teeth of a
// comb. Each is so many times the neck: how wide the root is, how much of the
// length the narrowing takes, and the bead.
const ROOT = 4.2;
const TAPER = 0.5;
const BEAD = 1.75;
// The icing along the edge itself, between the drips: a thin band whose lower
// side sags unevenly, so the drips come off something and not off a ruled line.
const BAND = 5;
const SAGS = [7, 2, 9, 4, 6, 1, 8, 3, 5, 2, 7, 4];
// The room the longest drip needs, bead included.
const HEIGHT = 230;
// Under this width every other drip is left out, so they do not crowd.
const NARROW_PX = 640;
// How short a drip starts, as a share of its length, and where the edge is on
// the screen (0 top, 1 bottom) when it starts to run and when it has run out.
const START_AT = 0.22;
// It goes on running nearly until the edge has left the top of the screen: the
// drips smear down the page with the scroll rather than stopping half way.
const RUN = [1, 0.08] as const;
// How much further than its listed length a drip runs when it has run out. A
// phone leaves less room above the words under the edge, so less there.
const REACH = 1.4;
const REACH_NARROW = 1.1;

function pathFor(width: number, grown: number, variant: number) {
  // The same eleven places along the edge, with the runs dealt to them from a
  // different start for each variant - and every other variant the other way
  // round - so no two seams hang alike.
  const dealt = DRIPS.map((drip, index) => {
    const from = DRIPS[(index * (variant % 2 ? -1 : 1) + variant * 4 + DRIPS.length * 8) % DRIPS.length];
    return { at: drip.at, neck: from.neck, length: from.length };
  });
  const narrow = width < NARROW_PX;
  const drips = narrow ? dealt.filter((_, index) => index % 2 === variant % 2) : dealt;
  const reach = narrow ? REACH_NARROW : REACH;
  const n = (value: number) => value.toFixed(1);
  // A pixel above the edge, so no hairline shows between it and the section
  // it hangs from.
  let d = `M0,-1 H${n(width)} V${BAND}`;
  let from = width;
  // Right to left along the bottom of the edge, a drip at a time.
  [...drips].reverse().forEach((drip, index) => {
    const x = drip.at * width;
    const neck = drip.neck;
    const root = neck * ROOT;
    const bead = neck * BEAD;
    // Never shorter than its own root and bead need to be told apart.
    const length = Math.max(root + bead * 3, drip.length * reach * (START_AT + (1 - START_AT) * grown));
    const taper = BAND + (length - bead * 2) * TAPER;
    const beadTop = length - bead * 2.2;
    const beadMid = length - bead;
    // The band sagging between the last drip and this one.
    d += ` Q${n((from + x + root) / 2)},${n(BAND + SAGS[index % SAGS.length])} ${n(x + root)},${BAND}`;
    d +=
      // Down the right side: the root narrowing to the run...
      ` C${n(x + root * 0.3)},${BAND} ${n(x + neck)},${n(taper * 0.45)} ${n(x + neck)},${n(taper)}` +
      ` L${n(x + neck)},${n(beadTop)}` +
      // ...the run swelling into the bead, round its foot, and back up.
      ` C${n(x + neck)},${n(beadTop + bead * 0.6)} ${n(x + bead)},${n(beadMid - bead * 0.5)} ${n(x + bead)},${n(beadMid)}` +
      ` A${n(bead)},${n(bead)} 0 0 1 ${n(x - bead)},${n(beadMid)}` +
      ` C${n(x - bead)},${n(beadMid - bead * 0.5)} ${n(x - neck)},${n(beadTop + bead * 0.6)} ${n(x - neck)},${n(beadTop)}` +
      ` L${n(x - neck)},${n(taper)}` +
      ` C${n(x - neck)},${n(taper * 0.45)} ${n(x - root * 0.3)},${BAND} ${n(x - root)},${BAND}`;
    from = x - root;
  });
  d += ` Q${n(from / 2)},${n(BAND + SAGS[drips.length % SAGS.length])} 0,${BAND}`;
  return `${d} L0,-1 Z`;
}

export default function GlazeDrips({
  className,
  variant = 0,
}: {
  className?: string;
  /** Which arrangement of the drips. Each seam on a page takes its own, so
   *  the long one is not in the same place every time. */
  variant?: number;
}) {
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
    path.setAttribute("d", pathFor(width, grown, variant));
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
