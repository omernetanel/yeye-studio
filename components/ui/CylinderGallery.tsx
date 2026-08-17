"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The work, on a slow turning arc: one panel facing you and one falling away to
 * either side.
 *
 * NOT a WebGL gallery. The obvious way to build this is to render the images
 * into a canvas, which is how the component this was modelled on does it — but
 * these are screenshots of websites and this section exists to get people into
 * them. In a canvas they stop being <a> and <img>: no click through to the
 * project, nothing for the keyboard, nothing for lazy loading, nothing for
 * search. Every panel here is a real link wrapping a real image, tilted with a
 * CSS 3D transform, and the arc costs a rotateY.
 *
 * It also suits the content better. Bending a photograph on a cylinder is
 * invisible; bending a screenshot bows every straight line in a layout that was
 * drawn straight. A flat plane turned on an axis keeps the work rectilinear and
 * still puts it on the curve.
 */

export type GalleryItem = {
  image: string;
  title: string;
  category: string;
  href: string;
  external?: boolean;
};

// How far round the arc one step is, and how the panels fall away along it.
// STEP_X_VW moves with the panel width below: the gap between neighbours is
// what it leaves over, so shrinking one without the other closes or opens the
// arc rather than resizing it.
const STEP_DEGREES = 42;
const STEP_X_VW = 46;
const STEP_Z_PX = 300;
// Panels further round than this are behind the shoulder and not drawn.
const VISIBLE_SPAN = 2.6;

// What a pixel of drag is worth, in steps, and how quickly a throw runs out.
const DRAG_PER_PX = 0.0022;
const FRICTION = 2.6;
// Past this the pointer was dragging, not clicking.
const DRAG_THRESHOLD_PX = 6;

// Degrees a second, unattended. Slow enough to read as drift rather than as a
// carousel advancing.
const IDLE_SPEED = 0.055;
// What the panels that are not under the cursor fall back to.
const DIMMED = 0.42;

export default function CylinderGallery({ items }: { items: GalleryItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<(HTMLElement | null)[]>([]);
  const hitsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;

    // Position is in STEPS, not degrees or pixels, and it is a float: the arc
    // is never on a detent, it is wherever it has drifted to.
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
    // Shortest way round, so a panel leaving one edge comes back at the other
    // rather than travelling the whole arc to get there.
    const offsetOf = (index: number) => {
      let d = (index - position) % count;
      if (d > count / 2) d -= count;
      if (d < -count / 2) d += count;
      return d;
    };

    const draw = () => {
      panelsRef.current.forEach((panel, index) => {
        if (!panel) return;
        const offset = offsetOf(index);
        const away = Math.abs(offset);
        if (away > VISIBLE_SPAN) {
          panel.style.visibility = "hidden";
          return;
        }
        panel.style.visibility = "";
        // Nearest panel on top, so the centre is never overlapped by its
        // neighbours as they pass behind it.
        panel.style.zIndex = String(Math.round(100 - away * 10));
        // Distance along the arc dims a panel, and so does the cursor being on
        // a different one. With nothing hovered the second term is 1 and this
        // is exactly the resting state.
        const byDistance = Math.max(0, 1 - away * 0.34);
        const byHover = hovered === -1 || hovered === index ? 1 : DIMMED;
        panel.style.opacity = String(byDistance * byHover);
        panel.style.transform =
          `translate(-50%, -50%) translateX(${(offset * STEP_X_VW * window.innerWidth) / 100}px)` +
          ` translateZ(${-away * STEP_Z_PX}px) rotateY(${-offset * STEP_DEGREES}deg)`;
      });

      // THE HIT TARGETS, laid flat over wherever the 3D put each panel.
      //
      // This is the whole answer to why the work could not be clicked. Inside a
      // preserve-3d context the browser decides between two overlapping boxes
      // by their computed depth rather than by z-index, and these panels
      // overlap heavily — so which one answered a click moved with the arc, and
      // for most of the turn the ones filling the middle of the screen were not
      // it. No amount of z-index fixes that while the boxes are in 3D.
      //
      // So the tilted panels are pictures now and take no pointer at all. The
      // links are plain rectangles in ordinary 2D, placed each frame over the
      // box each panel actually projects to. In two dimensions z-index means
      // what it says, the nearest is on top, and every panel is clickable
      // wherever it has got to on the arc.
      //
      // Every read below happens after every write above, in one pass, so this
      // costs one forced layout a frame rather than one per panel.
      const stageBox = stage.getBoundingClientRect();
      const boxes = panelsRef.current.map((panel) =>
        panel && panel.style.visibility !== "hidden" ? panel.getBoundingClientRect() : null,
      );
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

    // DRAGGING, and the one rule that keeps it from eating the links again:
    // THE POINTER IS NEVER CAPTURED. Capture on the stage is what swallowed the
    // click before it could reach an anchor. Tracking the move on the window
    // instead gives the same reach without taking anything from anyone, and the
    // only thing suppressed is a click that followed a real drag.
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

    // Touch is handled separately because the browser cancels the pointer
    // stream the moment it decides a drag is a scroll. touch-pan-y on the stage
    // leaves the page's vertical scroll alone and gives us the horizontal.
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
    // actually meets — the tilted panels above are pointer-deaf scenery.
    const unbind: (() => void)[] = [];
    hitsRef.current.forEach((panel, index) => {
      if (!panel) return;
      const enter = () => {
        hovered = index;
        draw();
      };
      const leave = () => {
        if (hovered === index) hovered = -1;
        draw();
      };
      panel.addEventListener("pointerenter", enter);
      panel.addEventListener("pointerleave", leave);
      unbind.push(() => {
        panel.removeEventListener("pointerenter", enter);
        panel.removeEventListener("pointerleave", leave);
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
    <div
      ref={stageRef}
      // z-20 rather than nothing: the heading above carries z-10, and a
      // positioned element with a z-index paints over a positioned one without,
      // so its box could reach down over the top of the arc.
      //
      // NOTHING GATES THIS. It used to wait on the heading finishing, expressed
      // as pointer-events-none and opacity-0 on the whole stage — so a cue that
      // did not arrive left every panel invisible AND unclickable. Reveals are
      // worth having; not in front of the one thing this section exists to do.
      className="relative z-20 h-[60svh] min-h-[340px] touch-pan-y select-none [perspective:1600px] md:h-[72svh]"
    >
      {/* THE PICTURE. Tilted, overlapping, and deliberately deaf to the
          pointer — everything in here is scenery. */}
      <div className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
        {items.map((item, index) => (
          <div
            key={item.href}
            ref={(el) => {
              panelsRef.current[index] = el;
            }}
            // Sized as a share of the page rather than the stage: the centre
            // panel is meant to read as a screen, not as a card in a row.
            className="absolute top-1/2 left-1/2 block w-[50vw] max-w-[880px] will-change-transform md:w-[44vw]"
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
            <span className="mt-4 block text-right font-display text-[15px] font-bold text-black md:text-[17px]">
              {item.title}
              <span className="ms-2 font-medium text-black/40">{item.category}</span>
            </span>
          </div>
        ))}
      </div>

      {/* THE LINKS. Flat rectangles, no transform of any kind, laid over
          wherever the picture above put each panel. This is the layer the
          pointer and the keyboard actually meet, and being ordinary 2D boxes
          they stack by z-index and the nearest one takes the click. */}
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
          aria-label={`${item.title} — ${item.category}`}
        />
      ))}
    </div>
  );
}
