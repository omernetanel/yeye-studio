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
const STEP_DEGREES = 42;
const STEP_X_VW = 46;
const STEP_Z_PX = 260;
// Panels further round than this are behind the shoulder and not drawn.
const VISIBLE_SPAN = 2.6;

// Degrees a second, unattended. Slow enough to read as drift rather than as a
// carousel advancing.
const IDLE_SPEED = 0.055;
// What a pixel of drag is worth, in steps.
const DRAG_PER_PX = 0.0022;
// How quickly a throw runs out.
const FRICTION = 2.6;
// Movement past this counts as a drag rather than a click, and is what decides
// whether the link underneath is allowed to fire.
const DRAG_THRESHOLD_PX = 5;
// What the panels that are not under the cursor fall back to.
const DIMMED = 0.42;

export default function CylinderGallery({ items }: { items: GalleryItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<(HTMLElement | null)[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;

    // Position is in STEPS, not degrees or pixels, and it is a float: the arc
    // is never on a detent, it is wherever it has drifted to.
    let position = 0;
    let velocity = 0;
    let pointerDown = false;
    let dragging = false;
    let travelled = 0;
    let lastPointerX = 0;
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
    };

    draw();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!visible) return;

      if (!dragging) {
        position += IDLE_SPEED * dt;
        position += velocity * dt;
        velocity -= velocity * FRICTION * dt;
        if (Math.abs(velocity) < 0.0005) velocity = 0;
      }
      draw();
    };

    // NOTHING HERE TOUCHES THE WHEEL. It drove the arc for a while, over the
    // gallery only, which meant the page would not move while the cursor was on
    // it — you had to steer around the gallery to carry on reading. The arc
    // turns on its own and answers to a drag; the wheel belongs to the page.

    // The panels are links, so the pointer has to serve two purposes without
    // spoiling either. Capture is NOT taken on pointerdown — taking it there
    // swallows the click before it ever reaches the anchor, which is what made
    // the cards unclickable. It is taken only once the pointer has actually
    // travelled, and a click that follows real travel is suppressed.
    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      dragging = false;
      travelled = 0;
      velocity = 0;
      lastPointerX = event.clientX;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) return;
      const dx = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      travelled += Math.abs(dx);
      if (!dragging && travelled > DRAG_THRESHOLD_PX) {
        dragging = true;
        stage.setPointerCapture(event.pointerId);
      }
      if (!dragging) return;
      // RTL or not, dragging left should bring the next panel from the right.
      position -= dx * DRAG_PER_PX;
      velocity = -dx * DRAG_PER_PX * 12;
      draw();
    };
    const endDrag = (event: PointerEvent) => {
      pointerDown = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    const onClickCapture = (event: MouseEvent) => {
      if (travelled > DRAG_THRESHOLD_PX) {
        event.preventDefault();
        event.stopPropagation();
      }
      travelled = 0;
    };

    // Hover lights one panel and drops the rest back. Bound per panel rather
    // than hit-testing the stage, because the panels overlap on the arc and the
    // one under the cursor is whichever the browser says it is.
    const enterHandlers: (() => void)[] = [];
    panelsRef.current.forEach((panel, index) => {
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
      enterHandlers.push(() => {
        panel.removeEventListener("pointerenter", enter);
        panel.removeEventListener("pointerleave", leave);
      });
    });

    // Touch goes through touchmove: the browser cancels the pointer stream the
    // moment it decides a drag is a scroll, which is what made the Hero's ink
    // appear and die on phones.
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
      draw();
    };
    const onTouchEnd = () => {
      lastTouchX = null;
    };

    if (!prefersReducedMotion) {
      stage.addEventListener("click", onClickCapture, true);
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
      stage.addEventListener("touchstart", onTouchStart, { passive: true });
      stage.addEventListener("touchmove", onTouchMove, { passive: true });
      stage.addEventListener("touchend", onTouchEnd, { passive: true });
    }

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
      enterHandlers.forEach((off) => off());
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("click", onClickCapture, true);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
    };
  }, [items, prefersReducedMotion]);

  return (
    <div
      ref={stageRef}
      className="relative h-[62svh] min-h-[360px] touch-pan-y select-none [perspective:1600px] md:h-[74svh]"
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        {items.map((item, index) => {
          const panel = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                draggable={false}
                className="block h-full w-full rounded-xl object-cover shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]"
              />
              <span className="mt-4 block text-right font-display text-[15px] font-bold text-black md:text-[17px]">
                {item.title}
                <span className="ms-2 font-medium text-black/40">{item.category}</span>
              </span>
            </>
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              ref={(el) => {
                panelsRef.current[index] = el;
              }}
              // Sized as a share of the page rather than the stage: the centre
              // panel is meant to read as a screen, not as a card in a row.
              className="absolute top-1/2 left-1/2 block w-[52vw] max-w-[900px] will-change-transform md:w-[46vw]"
              style={{ aspectRatio: "1672 / 941" }}
              aria-label={`${item.title} — ${item.category}`}
            >
              {panel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
