"use client";

import { useEffect, useRef, type RefObject } from "react";
import { stepBalloons, type Balloon, type World } from "@/lib/physics/balloons";

/**
 * The balloons that fall through the closing half of "who I am".
 *
 * The one thing on this page that is not driven by scroll. Everything else
 * here is a function of scrollY, which is what makes this land: the visitor has
 * spent six screens learning that nothing moves unless they move it, and then
 * something falls on its own.
 *
 * Scroll still shapes it, but only through the world the simulation runs
 * inside — the floor is the bottom of the black, and the impact line is a wall
 * that rises up through the balloons as the page is scrolled. Neither balloon
 * position nor balloon velocity is ever derived from the scroll position, so
 * scrolling back up does not rewind them. They stay exactly where they came to
 * rest until the section itself is gone.
 */

/** What AboutSection tells this layer, once per scroll frame. */
export type DropState = {
  /** The section has finished assembling: every fact has arrived. */
  armed: boolean;
  /** The impact line has finished its own entrance and can be collided with. */
  wallLive: boolean;
};

type Props = {
  sectionRef: RefObject<HTMLElement | null>;
  lineRef: RefObject<HTMLElement | null>;
  stateRef: RefObject<DropState>;
};

const SOURCES = ["/images/ball1.webp", "/images/ball2.webp"];

/**
 * The cast, authored rather than generated. With a fixed timestep and fixed
 * initial conditions the whole sequence is deterministic, so every visitor sees
 * the same choreography and it can be directed. Randomised drops can never be
 * corrected, only reshuffled.
 *
 * `at` is milliseconds from the first release; `x` is a fraction of the screen
 * width; `drift` is the sideways speed it leaves with, because nothing this
 * light falls in a straight line. Depth runs the three bands, and the near band
 * is the silver one with the logo — it is the readable object, it is drawn over
 * the copy, and it is the only band the impact line can throw.
 *
 * The x values are spread across the full width and then SHUFFLED in time. Laid
 * out in order they read as a wipe across the screen; clustered, they land in a
 * heap in the middle. Neither looks like weather. Ten seconds for fifteen of
 * them, so that at any moment one or two are in the air and never a shower.
 */
const CAST = [
  { at: 0, x: 0.62, depth: 1, type: 0, drift: -14 },
  { at: 620, x: 0.25, depth: 0, type: 1, drift: 11 },
  { at: 1180, x: 0.81, depth: 0, type: 1, drift: -9 },
  { at: 1900, x: 0.44, depth: 0.5, type: 1, drift: 16 },
  { at: 2520, x: 0.12, depth: 1, type: 0, drift: 13 },
  { at: 3080, x: 0.69, depth: 0, type: 1, drift: -12 },
  { at: 3820, x: 0.37, depth: 0, type: 1, drift: 8 },
  { at: 4460, x: 0.93, depth: 0.5, type: 0, drift: -18 },
  { at: 5180, x: 0.56, depth: 1, type: 0, drift: 10 },
  { at: 5800, x: 0.06, depth: 0, type: 1, drift: 15 },
  { at: 6520, x: 0.75, depth: 0.5, type: 1, drift: -11 },
  { at: 7180, x: 0.31, depth: 0, type: 1, drift: 9 },
  { at: 7900, x: 0.87, depth: 1, type: 0, drift: -15 },
  { at: 8560, x: 0.5, depth: 0, type: 1, drift: -8 },
  { at: 9280, x: 0.19, depth: 0.5, type: 0, drift: 12 },
] as const;

// Rendered width, as a fraction of the screen's short side. Sized off the short
// side so a balloon is the same share of the picture on a phone as on a laptop.
//
// The near band is twice the far band, not one and a half times. That ratio is
// the depth: three sizes bunched together read as three balloons that happen to
// differ, where a clear doubling reads as distance. Big enough that the near
// ones carry their printing at a glance — a logo you have to look for is not a
// logo, and at the first pass at these sizes they were beads.
const SIZE_BY_DEPTH = { far: 0.13, mid: 0.185, near: 0.26 };

// The physics runs at a fixed rate regardless of the display's. Without this
// the balloons bounce visibly higher on a 144Hz screen than on a 60Hz one.
const TIMESTEP = 1 / 120;
// Ceiling on the catch-up after a stall, so a backgrounded tab does not come
// back and try to simulate a minute of falling in one frame.
const MAX_SUBSTEPS = 5;

// Ceiling on the scroll velocity handed to the simulation. A trackpad flick or
// a jump to an anchor can register thousands of pixels in a frame, and the heap
// should not be launched off the screen because someone hit End.
const SWAY_LIMIT = 2400;

function sizeFor(depth: number, short: number) {
  const fraction =
    depth >= 1 ? SIZE_BY_DEPTH.near : depth >= 0.5 ? SIZE_BY_DEPTH.mid : SIZE_BY_DEPTH.far;
  return Math.round(short * fraction);
}

export default function BalloonDrop({ sectionRef, lineRef, stateRef }: Props) {
  const nodesRef = useRef<(HTMLImageElement | null)[]>([]);
  const balloonsRef = useRef<Balloon[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    let started = 0;
    let carry = 0;
    let previous = 0;
    let lastFloor = 0;
    let lastWallTop = 0;
    let lastScroll = window.scrollY;
    let visible = false;

    const build = () => {
      const short = Math.min(window.innerWidth, window.innerHeight);
      balloonsRef.current = CAST.map((entry, index) => {
        const size = sizeFor(entry.depth, short);
        return {
          x: entry.x * window.innerWidth,
          // Staged above the fold, spread out so they do not enter in a line.
          y: -size * (1.2 + (index % 3) * 0.9),
          vx: entry.drift,
          vy: 0,
          r: size / 2,
          tilt: 0,
          tiltVelocity: 0,
          depth: entry.depth,
          front: entry.depth >= 1,
          type: entry.type,
          swayPhase: index % 2 === 0 ? 1 : -1,
          released: false,
        } satisfies Balloon;
      });

      balloonsRef.current.forEach((balloon, index) => {
        const node = nodesRef.current[index];
        if (!node) return;
        node.style.width = `${balloon.r * 2}px`;
        node.style.opacity = "0";
      });
      started = 0;
    };

    build();

    const draw = () => {
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

      // EVERY READ FIRST. A getBoundingClientRect after a style write forces a
      // synchronous layout, and inside a per-frame loop that is the difference
      // between this being free and this being the reason the page stutters.
      const sectionBox = section.getBoundingClientRect();
      const line = lineRef.current;
      const wallBox = stateRef.current?.wallLive && line ? line.getBoundingClientRect() : null;
      const scroll = window.scrollY;
      const screen = window.innerHeight;

      // Scrolled clear above the section — everything resets, and going back
      // down runs the whole sequence again from the top.
      if (sectionBox.top > screen) {
        if (started !== 0) {
          build();
          draw();
        }
        previous = now;
        lastScroll = scroll;
        return;
      }

      const elapsed = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.25);
      previous = now;

      if (started === 0) {
        if (!stateRef.current?.armed) {
          lastScroll = scroll;
          return;
        }
        started = now;
      }

      // The balloons never leave the black: their floor is whichever is higher,
      // the bottom of the screen or the bottom of the section.
      const floorY = Math.min(screen, sectionBox.bottom);
      const wallTop = wallBox ? wallBox.top : 0;
      const floorVelocity = elapsed > 0 ? (floorY - lastFloor) / elapsed : 0;
      const wallVelocity = wallBox && lastWallTop !== 0 && elapsed > 0 ? (wallTop - lastWallTop) / elapsed : 0;
      const scrolled = elapsed > 0 ? (scroll - lastScroll) / elapsed : 0;

      const world: World = {
        width: window.innerWidth,
        floorY,
        floorVelocity,
        wall: wallBox
          ? { left: wallBox.left, top: wallBox.top, right: wallBox.right, bottom: wallBox.bottom }
          : null,
        wallVelocity,
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
      lastWallTop = wallTop;
      lastScroll = scroll;
      draw();
    };

    // Nothing simulates while the section is off screen. It is six screens tall
    // and the rest of the page is longer still.
    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) previous = 0;
      },
      { rootMargin: "20% 0px" },
    );
    watcher.observe(section);

    const onResize = () => {
      build();
      draw();
    };
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef, lineRef, stateRef]);

  const layer = (front: boolean, z: string) => (
    <div className={`pointer-events-none fixed inset-0 ${z}`} aria-hidden="true">
      {CAST.map((entry, index) =>
        entry.depth >= 1 === front ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={index}
            ref={(el) => {
              nodesRef.current[index] = el;
            }}
            src={SOURCES[entry.type]}
            alt=""
            className="absolute top-0 left-0 h-auto will-change-transform"
            style={{ opacity: 0 }}
            draggable={false}
          />
        ) : null,
      )}
    </div>
  );

  return (
    <>
      {/* Behind the copy, which is lifted to z-10 for exactly this. Two layers
          rather than one is what makes the depth read as depth: some of them
          pass behind the text instead of over it. */}
      {layer(false, "z-[5]")}
      {/* Over everything but the section's label. */}
      {layer(true, "z-[25]")}
    </>
  );
}
