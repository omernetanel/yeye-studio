"use client";

import { useEffect, useRef, type RefObject } from "react";
import { stepBalloons, type Balloon, type World } from "@/lib/physics/balloons";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * Three balloons for the end of the page.
 *
 * Its own component rather than a second instance of the one in "who I am":
 * that one is seventeen balloons on three different cues, half of them falling
 * through the floor, two of them waiting for a line of type to become solid.
 * None of that belongs here, and threading it all through as options would make
 * a working thing configurable for the benefit of a thing that needs none of
 * the configuration.
 *
 * What IS shared is the part worth sharing: the solver in lib/physics, which
 * has no DOM in it and no idea which section it is running for.
 *
 * These three land and stay. They are the last thing on the page and they are
 * meant to still be sitting there when the reader stops.
 */
// Two, over the left of the screen and close enough together to end up leaning
// on each other. Spread along the foot of the section they read as decoration
// on a border; in one corner they read as the last thing that happened.
const CAST = [
  { at: 0, x: 0.1, type: 0, size: 0.15 },
  { at: 850, x: 0.19, type: 1, size: 0.12 },
] as const;

// They wait for the actual END of the document, not for the section to come
// into view. The section is on screen for a good while before the reader is
// finished with it, and something falling then is an interruption; falling once
// there is nothing left below is a full stop.
const PAGE_END_SLACK_PX = 8;

const SOURCES = ["/images/ball1.webp", "/images/ball2.webp"];

const TIMESTEP = 1 / 120;
const MAX_SUBSTEPS = 5;
const SWAY_LIMIT = 2400;

export default function CtaBalloons({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const nodesRef = useRef<(HTMLImageElement | null)[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    let started = 0;
    let carry = 0;
    let previous = 0;
    let lastFloor = 0;
    let lastScroll = window.scrollY;
    let visible = false;

    const floorYOf = (box: DOMRect) => box.bottom;

    const build = () => {
      const short = Math.min(window.innerWidth, window.innerHeight);
      balloonsRef.current = CAST.map((entry, index) => {
        const size = Math.round(short * entry.size);
        return {
          x: entry.x * window.innerWidth,
          y: -size * (0.6 + (index % 3) * 0.22),
          vx: index % 2 === 0 ? -12 : 10,
          vy: 0,
          r: size / 2,
          tilt: 0,
          tiltVelocity: 0,
          phase: index * 2.39996,
          age: 0,
          depth: 1,
          front: false,
          type: entry.type,
          swayPhase: index % 2 === 0 ? 1 : -1,
          contained: true,
          released: false,
          alive: true,
          resting: false,
        } satisfies Balloon;
      });
      balloonsRef.current.forEach((balloon, index) => {
        const node = nodesRef.current[index];
        if (!node) return;
        node.style.width = `${balloon.r * 2}px`;
        node.style.opacity = "0";
      });
      started = 0;
      lastFloor = 0;
    };

    build();

    const draw = (sectionBottom: number) => {
      // Clipped to the section, so nothing can ever be seen over the footer
      // below it however the heap settles.
      const below = Math.max(0, window.innerHeight - sectionBottom);
      const layer = layerRef.current;
      if (layer) layer.style.clipPath = below > 0 ? `inset(0 0 ${below}px 0)` : "";

      balloonsRef.current.forEach((balloon, index) => {
        const node = nodesRef.current[index];
        if (!node) return;
        if (!balloon.released) {
          node.style.opacity = "0";
          return;
        }
        node.style.opacity = "1";
        node.style.transform =
          `translate3d(${balloon.x - balloon.r}px, ${balloon.y - balloon.r}px, 0) rotate(${balloon.tilt.toFixed(2)}deg)`;
      });
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;

      const box = section.getBoundingClientRect();
      const scroll = window.scrollY;

      // Scrolled back above the section entirely: reset, so coming down to the
      // end of the page a second time drops them again.
      if (box.top > window.innerHeight) {
        if (started !== 0) {
          build();
          draw(box.bottom);
        }
        previous = now;
        lastScroll = scroll;
        return;
      }

      const elapsed = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.25);
      previous = now;

      // Nothing is released until the document has actually run out underneath.
      const atEnd =
        scroll + window.innerHeight >=
        document.documentElement.scrollHeight - PAGE_END_SLACK_PX;
      if (started === 0) {
        if (!atEnd) {
          lastFloor = floorYOf(box);
          lastScroll = scroll;
          return;
        }
        started = now;
      }

      const floorY = box.bottom;
      const floorVelocity = elapsed > 0 ? (floorY - lastFloor) / elapsed : 0;
      const scrolled = elapsed > 0 ? (scroll - lastScroll) / elapsed : 0;

      const world: World = {
        width: window.innerWidth,
        floorY,
        floorVelocity: lastFloor === 0 ? 0 : floorVelocity,
        wall: null,
        wallVelocity: 0,
        sway: Math.max(-SWAY_LIMIT, Math.min(SWAY_LIMIT, scrolled)),
      };

      const since = now - started;
      balloonsRef.current.forEach((balloon, index) => {
        if (since >= CAST[index].at) balloon.released = true;
      });

      carry = Math.min(carry + elapsed, TIMESTEP * MAX_SUBSTEPS);
      while (carry >= TIMESTEP) {
        stepBalloons(balloonsRef.current, TIMESTEP, world);
        carry -= TIMESTEP;
      }

      lastFloor = floorY;
      lastScroll = scroll;
      draw(box.bottom);
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) previous = 0;
      },
      { rootMargin: "15% 0px" },
    );
    watcher.observe(section);

    const onResize = () => {
      build();
      draw(section.getBoundingClientRect().bottom);
    };
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-20" aria-hidden="true">
      {CAST.map((entry, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          ref={(el) => {
            nodesRef.current[index] = el;
          }}
          src={SOURCES[entry.type]}
          alt=""
          className="absolute top-0 left-0 will-change-transform"
          style={{ opacity: 0 }}
          draggable={false}
        />
      ))}
    </div>
  );
}
