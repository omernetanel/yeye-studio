"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import type { GalleryItem } from "@/components/ui/CylinderGallery";

/**
 * The work as a fan of panels: the one in the middle facing you, the rest turned
 * away to either side and drifting past.
 *
 * Built here rather than installed — the reference is a paid component and none
 * of its code is in this file. What IS taken from it is how it behaves, measured
 * off its public demo rather than guessed:
 *
 *   Every panel carries its OWN perspective and stays `transform-style: flat`.
 *   That is the part worth copying. A shared preserve-3d scene sorts overlapping
 *   panels by their real depth, which is what made the arc gallery beside this
 *   one need a whole separate layer of links; projecting each panel on its own
 *   keeps the row in ordinary 2D stacking order, where z-index means what it
 *   says.
 *
 *   The rotation is per step away from the middle and the scale is a flat 0.85
 *   for everything that is not the middle — not a curve, a step.
 *
 * WHAT IS DELIBERATELY NOT COPIED IS THE ANGLE. Their panels are portrait, about
 * 3:4, and at 60° a neighbour is still a readable sliver. Ours are landscape
 * screenshots of websites: the same 60° turns a neighbour into a thin band with
 * nothing legible in it. Forty-five degrees is where a wide panel still reads as
 * a screen while clearly facing away.
 */

// Degrees a panel is turned for each step it sits from the middle.
const ROTATION_DEGREES = 45;
// How far apart the panels sit, as a share of a panel's own width. Under one, so
// the row overlaps slightly and reads as a fan rather than as a shelf.
const STEP_RATIO = 0.78;
// The depth of each panel's own projection. The reference uses 800.
const PERSPECTIVE_PX = 800;
// Everything that is not the middle panel.
const INACTIVE_SCALE = 0.85;
// Panels further out than this are off the fan and not drawn.
const VISIBLE_SPAN = 2.6;
// How quickly a panel dims with distance, and what an unhovered panel falls to.
const DIM_PER_STEP = 0.24;
const DIMMED = 0.45;

// What a pixel of drag is worth, in steps, and how quickly a throw runs out.
const DRAG_PER_PX = 0.0035;
const FRICTION = 2.6;
// Past this the pointer was dragging, not clicking.
const DRAG_THRESHOLD_PX = 6;
// Steps a second, unattended. A drift, not a carousel advancing.
const IDLE_SPEED = 0.06;
// What one press of an arrow adds to the speed, and the most it can reach.
const NUDGE_STEP = 1.1;
const NUDGE_CAP = 2.6;

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export default function SkewedGallery({ items }: { items: GalleryItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const hitsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Which panel is facing the reader, for the indicator below. State, because
  // the indicator is React's to draw — the fan itself never re-renders.
  const [facing, setFacing] = useState(0);
  // The way in for the controls: the position the fan is drifting through lives
  // inside the effect, and this is how a click outside it asks for a move.
  const goToRef = useRef<((index: number) => void) | null>(null);
  // The arrows do not go anywhere: they push the fan along in the direction
  // pressed and let it run down, which is the same motion a drag produces. A
  // jump to the next piece of work was the one thing in the section that moved
  // without the reader moving it.
  const nudgeRef = useRef<((direction: number) => void) | null>(null);
  // The same number as `facing`, readable inside the draw loop without making
  // the effect depend on it.
  const facingRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;

    // Position is in PANELS, and it is a float: the fan is never on a detent, it
    // is wherever it has drifted to.
    let position = 0;
    let velocity = 0;
    let down = false;
    let moved = 0;
    let didDrag = false;
    let lastX = 0;
    let hovered = -1;
    let previous = 0;
    let frame = 0;
    let visible = false;

    const count = items.length;
    // Shortest way round, so a panel leaving one end comes back at the other
    // instead of travelling the length of the row. This is what makes it endless
    // in both directions.
    const offsetOf = (index: number) => {
      let d = (index - position) % count;
      if (d > count / 2) d -= count;
      if (d < -count / 2) d += count;
      return d;
    };

    const draw = () => {
      const step = (panelsRef.current[0]?.offsetWidth ?? 0) * STEP_RATIO;

      slotsRef.current.forEach((slot, index) => {
        const panel = panelsRef.current[index];
        if (!slot || !panel) return;
        const offset = offsetOf(index);
        const away = Math.abs(offset);
        if (away > VISIBLE_SPAN) {
          slot.style.visibility = "hidden";
          return;
        }
        slot.style.visibility = "";
        // Nearest on top. In 2D stacking order this is all it takes — which is
        // the whole reason each panel is projected on its own.
        slot.style.zIndex = String(Math.round(100 - away * 10));
        slot.style.transform = `translate(-50%, -50%) translateX(${(offset * step).toFixed(1)}px)`;

        // The middle panel is flat and full size; everything else is turned by
        // its distance and held at one scale.
        const settled = Math.max(0, 1 - away);
        panel.style.transform =
          `rotateY(${(-offset * ROTATION_DEGREES).toFixed(2)}deg)` +
          ` scale(${lerp(INACTIVE_SCALE, 1, settled).toFixed(3)})`;

        const byDistance = Math.max(0, 1 - away * DIM_PER_STEP);
        const byHover = hovered === -1 || hovered === index ? 1 : DIMMED;
        slot.style.opacity = String(byDistance * byHover);

        // The label belongs to the panel being looked at, and goes with the turn
        // rather than hanging on beside a panel edge-on to the reader.
        const label = labelsRef.current[index];
        if (label) label.style.opacity = settled.toFixed(3);
      });

      // THE HIT TARGETS, laid flat over wherever the fan put each panel. Every
      // read below happens after every write above, in one pass, so this costs
      // one forced layout a frame rather than one per panel.
      const stageBox = stage.getBoundingClientRect();
      const boxes = slotsRef.current.map((slot) =>
        slot && slot.style.visibility !== "hidden" ? slot.getBoundingClientRect() : null,
      );
      // Which one is facing the reader, for the indicator underneath. Only on a
      // change: this runs every frame, and setting state each time would
      // re-render the component sixty times a second for nothing.
      let nearest = 0;
      let nearestAway = Infinity;
      slotsRef.current.forEach((_, index) => {
        const away = Math.abs(offsetOf(index));
        if (away < nearestAway) {
          nearestAway = away;
          nearest = index;
        }
      });
      if (nearest !== facingRef.current) {
        facingRef.current = nearest;
        setFacing(nearest);
      }

      boxes.forEach((box, index) => {
        const hit = hitsRef.current[index];
        if (!hit) return;
        if (!box) {
          hit.style.display = "none";
          return;
        }
        hit.style.display = "";
        hit.style.zIndex = String(Math.round(100 - Math.abs(offsetOf(index)) * 10));
        hit.style.left = `${box.left - stageBox.left}px`;
        hit.style.top = `${box.top - stageBox.top}px`;
        hit.style.width = `${box.width}px`;
        hit.style.height = `${box.height}px`;
      });
    };

    draw();

    // Asked for by the arrows and the dashes below. It sets the position rather
    // than animating to it and lets the drift carry on from there — the fan is
    // never on a detent anyway, so a tween to an exact index would be the only
    // moment in the whole thing that snaps.
    goToRef.current = (index: number) => {
      position = index;
      velocity = 0;
      draw();
    };

    // A press adds to whatever the fan is already doing, so holding the arrow
    // down builds speed rather than restarting the same hop. Capped, or a row
    // of quick presses throws it across several panels at once.
    nudgeRef.current = (direction: number) => {
      velocity = Math.max(-NUDGE_CAP, Math.min(NUDGE_CAP, velocity + direction * NUDGE_STEP));
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!visible) return;

      if (!down) {
        position += IDLE_SPEED * dt + velocity * dt;
        velocity -= velocity * FRICTION * dt;
        if (Math.abs(velocity) < 0.0005) velocity = 0;
      }
      draw();
    };

    // THE POINTER IS NEVER CAPTURED. Capture on the stage swallows the click
    // before it can reach an anchor; tracking the move on the window gives the
    // same reach and takes nothing from anyone. The only thing suppressed is a
    // click that followed a real drag.
    const onDown = (event: PointerEvent) => {
      down = true;
      didDrag = false;
      moved = 0;
      velocity = 0;
      lastX = event.clientX;
    };
    const onMove = (event: PointerEvent) => {
      if (!down) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      moved += Math.abs(dx);
      if (moved > DRAG_THRESHOLD_PX) didDrag = true;
      if (!didDrag) return;
      position -= dx * DRAG_PER_PX;
      velocity = -dx * DRAG_PER_PX * 12;
      draw();
    };
    const onUp = () => {
      down = false;
      // Held one frame past the release: the click arrives after pointerup and
      // the guard below still has to know what just happened.
      requestAnimationFrame(() => {
        didDrag = false;
      });
    };
    const onClick = (event: MouseEvent) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
    };

    // Touch is handled separately because the browser cancels the pointer stream
    // the moment it decides a drag is a scroll. touch-pan-y on the stage leaves
    // the page's vertical scroll alone and gives us the horizontal.
    let lastTouchX: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastTouchX = event.touches[0]?.clientX ?? null;
      velocity = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const x = event.touches[0]?.clientX;
      if (x == null || lastTouchX == null) return;
      const dx = x - lastTouchX;
      lastTouchX = x;
      position -= dx * DRAG_PER_PX;
      velocity = -dx * DRAG_PER_PX * 12;
      draw();
    };
    const onTouchEnd = () => {
      lastTouchX = null;
    };

    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    stage.addEventListener("click", onClick, true);
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });

    // Hover is bound to the LINK layer, since that is the layer the pointer
    // actually meets — the turned panels above are pointer-deaf scenery.
    const unbind: (() => void)[] = [];
    hitsRef.current.forEach((hit, index) => {
      if (!hit) return;
      const enter = () => {
        hovered = index;
        draw();
      };
      const leave = () => {
        if (hovered === index) hovered = -1;
        draw();
      };
      hit.addEventListener("pointerenter", enter);
      hit.addEventListener("pointerleave", leave);
      unbind.push(() => {
        hit.removeEventListener("pointerenter", enter);
        hit.removeEventListener("pointerleave", leave);
      });
    });

    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) previous = 0;
      },
      { rootMargin: "15% 0px" },
    );
    watcher.observe(stage);

    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    if (!prefersReducedMotion) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      unbind.forEach((off) => off());
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("click", onClick, true);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
    };
  }, [items, prefersReducedMotion]);


  return (
    <>
    <div
      ref={stageRef}
      // z-20 for the same reason the arc carries one: the heading above is at
      // z-10, and a positioned element with a z-index paints over one without.
      // grab / grabbing, which the reference does not have: every element in its
      // demo reports `cursor: auto`, so a mouse is given no sign the row can be
      // pulled. The affordance costs nothing and is the one the pointer already
      // knows.
      className="relative z-20 h-[56svh] min-h-[320px] cursor-grab touch-pan-y select-none overflow-clip active:cursor-grabbing md:h-[66svh]"
    >
      {/* THE FAN. Every panel is positioned in plain 2D and turned inside its
          own perspective — nothing here shares a 3D scene, and nothing here
          takes a pointer. */}
      <div className="pointer-events-none absolute inset-0">
        {items.map((item, index) => (
          <div
            key={item.href}
            ref={(el) => {
              slotsRef.current[index] = el;
            }}
            className="absolute top-1/2 left-1/2 will-change-transform"
            style={{ perspective: `${PERSPECTIVE_PX}px` }}
          >
            <div
              ref={(el) => {
                panelsRef.current[index] = el;
              }}
              // Sized as a share of the page rather than of the stage: the middle
              // panel is meant to read as a screen, not as a tile in a row.
              className="w-[62vw] max-w-[760px] will-change-transform md:w-[36vw]"
              style={{ aspectRatio: "1672 / 941" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                loading="lazy"
                draggable={false}
                className="block h-full w-full rounded-xl object-cover shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]"
              />
            </div>
            <span
              ref={(el) => {
                labelsRef.current[index] = el;
              }}
              className="mt-4 block text-center font-display text-[15px] font-bold text-black md:text-[17px]"
              style={{ opacity: 0 }}
            >
              {item.title}
              <span className="ms-2 font-medium text-black/40">{item.category}</span>
            </span>
          </div>
        ))}
      </div>

      {/* THE LINKS. Flat rectangles with no transform of any kind, laid over
          wherever the fan put each panel. This is the layer the pointer and the
          keyboard actually meet. */}
      {items.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          ref={(el) => {
            hitsRef.current[index] = el;
          }}
          // The browser starts its own link-drag on mousedown over an anchor,
          // and that native drag swallows the click that should have followed.
          draggable={false}
          className="absolute block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label={`${item.title}, ${item.category}`}
        />
      ))}
    </div>

    {/* THE INDICATOR, as the reference has it: a dash per piece of work with
        an arrow either side. It is not decoration — the fan drifts on its own,
        and without this there is nothing on the page saying how many there are
        or which one is facing you.

        Real buttons, not divs with handlers: this is the only keyboard way
        through the work, since the panels themselves are a picture layer and
        the links over them are reached by tab in their own order. */}
    {/* dir="ltr" ON THE ROW, and this is the whole fix. Which side a button
        lands on was being decided by the page's RTL, and that mapping did not
        agree between what was measured here and what the reader actually saw —
        the arrows came out mirrored twice. Forced to LTR, the first button is
        the left one everywhere, so "left arrow moves the work left" is true by
        construction rather than by luck. The labels stay Hebrew. */}
    <div dir="ltr" className="mt-8 flex items-center justify-center gap-5">
      {/* THE FAN MOVES TOWARDS THE ARROW THAT WAS PRESSED. A positive nudge
          carries the panels left, so the left-hand button takes it. */}
      <button
        type="button"
        onClick={() => nudgeRef.current?.(1)}
        aria-label="העבודה הבאה"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[18px] leading-none text-black/45 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        ‹
      </button>

      <div className="flex items-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.href}
            type="button"
            onClick={() => {
              goToRef.current?.(index);
              facingRef.current = index;
              setFacing(index);
            }}
            aria-label={item.title}
            aria-current={index === facing}
            // 4px thick and longer: at two pixels the indicator was easy to miss.
            className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${
              index === facing ? "w-12 bg-black" : "w-7 bg-black/25 hover:bg-black/45"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => nudgeRef.current?.(-1)}
        aria-label="העבודה הקודמת"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[18px] leading-none text-black/45 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        ›
      </button>
    </div>
    </>
  );
}
