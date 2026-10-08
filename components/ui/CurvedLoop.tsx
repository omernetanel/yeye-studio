"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import "./CurvedLoop.css";

/**
 * One line of type running along a curve, end joined to start, for ever.
 *
 * A TypeScript port of CurvedLoop from React Bits (THIRD_PARTY_NOTICES.md).
 * What changed on the way in:
 * - It sizes itself. Theirs is a fixed 1440x120 box that the type and the
 *   curve both spill out of, inside a jacket a full screen tall. Here the box
 *   is worked out from the type size and the depth of the curve, so the loop
 *   takes exactly the height it draws in and nothing has to be guessed around
 *   it. `span` is how wide the drawing is in its own units: a narrower one on
 *   a phone is what makes the same type come out large there.
 * - The speed is per second, not per frame, so a 120Hz screen does not run it
 *   twice as fast.
 * - The position is written straight to the element. Theirs also put it in
 *   React state on every frame, which rendered the component sixty times a
 *   second to no end.
 * - It rests when it is off screen, and with less motion it does not run on
 *   its own at all - it stands, and can still be dragged.
 * - It is measured again once the webfont has arrived: the length of the line
 *   is what the loop wraps on, and in the fallback font it is a different
 *   length.
 * - No colour and no font are written here; `className` goes on the type.
 *
 * It is decoration: the wrapper is hidden from assistive technology, because
 * what it shows is the same few words many times over.
 */

interface CurvedLoopProps {
  /** The line. It is repeated as many times as it takes to fill the curve. */
  text: string;
  /** Units a second along the curve. */
  speed?: number;
  /** How far the curve's control point is pulled down. The line dips half of it. */
  curveAmount?: number;
  direction?: "left" | "right";
  /** Whether it can be dragged. */
  interactive?: boolean;
  /** The drawing's width in its own units. Smaller makes everything larger. */
  span?: number;
  /** The type's size, in the same units. */
  fontSize?: number;
  /** On the type: its font, weight and colour. */
  className?: string;
  /** A run of letters to set apart wherever it comes up in the line... */
  highlight?: string;
  /** ...and the class that does it, a fill for one. */
  highlightClassName?: string;
}

// Their path, in proportion: it starts and ends this far outside the box, and
// its control point sits left of centre, which is what gives the curve its
// lean.
const OVERHANG = 100;
const CONTROL_AT = 500 / 1440;
// Room under the baseline for the letters that hang below it, as a share of
// the type size.
const DESCENT = 0.3;

export default function CurvedLoop({
  text,
  speed = 120,
  curveAmount = 400,
  direction = "left",
  interactive = true,
  span = 1440,
  fontSize = 96,
  className,
  highlight,
  highlightClassName,
}: CurvedLoopProps) {
  const reduce = usePrefersReducedMotion();
  // One trailing no-break space, so the join between two copies is a gap.
  const unit = `${text.trim()} `;
  // The line cut at every highlighted run, the runs kept as pieces of their
  // own. A plain split, not a pattern: the run is letters, taken as written.
  const parts = highlight ? unit.split(highlight).flatMap((piece, index) => (index ? [highlight, piece] : [piece])) : [unit];

  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const [spacing, setSpacing] = useState(0);
  const pathId = `curve-${useId()}`;

  const offsetRef = useRef(0);
  const dragRef = useRef<{ id: number; x: number; moved: number } | null>(null);
  const directionRef = useRef(direction);
  const [held, setHeld] = useState(false);

  // The baseline runs from y=0 down to half the pull and back. The box starts
  // a type size above it and ends a descender below its lowest point.
  const dip = curveAmount / 2;
  const viewBox = `0 ${-fontSize} ${span} ${fontSize + dip + fontSize * DESCENT}`;
  const pathD = `M${-OVERHANG},0 Q${span * CONTROL_AT},${curveAmount} ${span + OVERHANG},0`;
  const copies = spacing > 0 ? Math.ceil((span + OVERHANG * 2 + 160) / spacing) + 2 : 1;

  // The length of one copy: what the loop wraps on.
  useEffect(() => {
    const measure = () => {
      if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
    };
    measure();
    void document.fonts.ready.then(measure);
  }, [unit, className, fontSize]);

  /** Moves the line by `delta`, wrapped so it never runs out. */
  const shift = (delta: number) => {
    const path = textPathRef.current;
    if (!path || spacing <= 0) return;
    let next = offsetRef.current + delta;
    if (next <= -spacing) next += spacing;
    if (next > 0) next -= spacing;
    offsetRef.current = next;
    path.setAttribute("startOffset", `${next}px`);
  };
  const shiftRef = useRef(shift);
  useEffect(() => {
    shiftRef.current = shift;
  });

  useEffect(() => {
    if (spacing <= 0) return;
    offsetRef.current = -spacing;
    shiftRef.current(0);
  }, [spacing]);

  // It runs by itself while it is on screen and nobody is holding it.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || spacing <= 0 || reduce) return;
    let frame = 0;
    let last = 0;
    const step = (now: number) => {
      // A long gap is a tab coming back, not a frame: no jump for it.
      const elapsed = last ? Math.min(now - last, 50) : 0;
      last = now;
      if (!dragRef.current) {
        shiftRef.current(((directionRef.current === "right" ? speed : -speed) * elapsed) / 1000);
      }
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      last = 0;
      if (entry.isIntersecting) frame = requestAnimationFrame(step);
    });
    observer.observe(wrapper);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [spacing, speed, reduce]);

  /** Screen pixels to the drawing's own units. */
  const toUnits = (pixels: number) => {
    const width = wrapperRef.current?.getBoundingClientRect().width;
    return width ? (pixels * span) / width : pixels;
  };

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || dragRef.current) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, moved: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHeld(true);
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    drag.x = event.clientX;
    if (dx !== 0) drag.moved = dx;
    shift(toUnits(dx));
  };

  // Let go, it carries on the way it was last pushed.
  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (drag.moved !== 0) directionRef.current = drag.moved > 0 ? "right" : "left";
    setHeld(false);
  };

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={cn("curved-loop", spacing <= 0 && "invisible")}
      data-fixed={interactive ? undefined : ""}
      data-held={held ? "" : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <svg className="curved-loop__svg" viewBox={viewBox} fontSize={fontSize}>
        {/* One copy, never shown: it is only there to be measured. */}
        <text ref={measureRef} xmlSpace="preserve" className={className} visibility="hidden">
          {unit}
        </text>
        <defs>
          <path id={pathId} d={pathD} fill="none" />
        </defs>
        <text xmlSpace="preserve" className={className}>
          <textPath ref={textPathRef} href={`#${pathId}`} xmlSpace="preserve">
            {Array.from({ length: copies }, (_, copy) =>
              parts.map((part, index) =>
                part === highlight ? (
                  <tspan key={`${copy}-${index}`} className={highlightClassName}>
                    {part}
                  </tspan>
                ) : (
                  part
                ),
              ),
            )}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
