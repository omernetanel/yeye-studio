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
const STEP_X_VW = 40;
const STEP_Z_PX = 260;
// Panels further round than this are behind the shoulder and not drawn.
const VISIBLE_SPAN = 2.6;

// Degrees a second, unattended. Slow enough to read as drift rather than as a
// carousel advancing.
const IDLE_SPEED = 0.055;
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

      position += IDLE_SPEED * dt;
      draw();
    };

    // NOTHING HERE LISTENS TO THE POINTER, AND THAT IS THE POINT.
    //
    // This carried a drag: pointer capture, a travel threshold to tell a drag
    // from a click, and a guard that suppressed the click afterwards. All three
    // compete with the links for the same events, and between them they are why
    // a panel would not open — sometimes the outer ones, sometimes the middle
    // one, depending on where the arc had drifted to. The panels are the proof
    // this section exists to show; nothing gets to stand between them and a
    // click. The arc turns on its own, every panel is a plain link, and the
    // browser decides what was clicked exactly as it does anywhere else.
    //
    // Hover is the one exception, and it is not an exception really: enter and
    // leave are notifications. Nothing is captured, nothing is prevented, and
    // no click passes through them.
    const unbind: (() => void)[] = [];
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
      className="relative z-20 h-[54svh] min-h-[320px] touch-pan-y select-none [perspective:1600px] md:h-[64svh]"
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
              // The browser starts its own link-drag on mousedown over an
              // anchor wrapping an image, and that native drag swallows the
              // click that should have followed.
              draggable={false}
              // Sized as a share of the page rather than the stage: the centre
              // panel is meant to read as a screen, not as a card in a row.
              className="absolute top-1/2 left-1/2 block w-[44vw] max-w-[760px] will-change-transform md:w-[38vw]"
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
