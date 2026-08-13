"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ESCAPE_DRAG, stepBalloons, type Balloon, type World } from "@/lib/physics/balloons";

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
  { at: 0, x: 0.62, depth: 1, type: 0, drift: -14, leaves: false, front: true },
  { at: 470, x: 0.25, depth: 0, type: 1, drift: 11, leaves: true, front: false },
  { at: 890, x: 0.81, depth: 0, type: 1, drift: -9, leaves: false, front: false },
  { at: 1430, x: 0.44, depth: 0.5, type: 1, drift: 16, leaves: true, front: false },
  { at: 1890, x: 0.12, depth: 1, type: 0, drift: 13, leaves: false, front: true },
  { at: 2310, x: 0.69, depth: 0, type: 1, drift: -12, leaves: true, front: false },
  { at: 2870, x: 0.37, depth: 0, type: 1, drift: 8, leaves: false, front: false },
  { at: 3350, x: 0.93, depth: 0.5, type: 0, drift: -18, leaves: true, front: false },
  { at: 3890, x: 0.56, depth: 1, type: 0, drift: 10, leaves: false, front: true },
  { at: 4350, x: 0.06, depth: 0, type: 1, drift: 15, leaves: true, front: false },
  // The one blue balloon up front, so the line is not exclusively a silver
  // event. Middle depth, so it is visibly smaller than the three it shares the
  // bounce with.
  { at: 4890, x: 0.75, depth: 0.5, type: 1, drift: -11, leaves: false, front: true },
  { at: 5390, x: 0.31, depth: 0, type: 1, drift: 9, leaves: true, front: false },
  { at: 5930, x: 0.87, depth: 1, type: 0, drift: -15, leaves: false, front: true },
  { at: 6420, x: 0.5, depth: 0, type: 1, drift: -8, leaves: true, front: false },
  { at: 6960, x: 0.19, depth: 0.5, type: 0, drift: 12, leaves: false, front: false },
] as const;

/**
 * Two more, released off the impact line rather than off the clock.
 *
 * The line only becomes solid once it has finished arriving, and by then the
 * balloons cued at the start of the hold have already fallen past the height it
 * appears at. Timing these from the drop cannot fix that: how long the reader
 * takes to get from one to the other is up to the reader. So these two wait for
 * the line itself and fall onto it while it is there.
 *
 * `at` is milliseconds after the line goes solid, not after the drop. Both are
 * in front, one silver at the near size and one blue at the far one — the same
 * event at two distances, with the logo as the larger of them.
 */
const WALL_CAST = [
  { at: 120, x: 0.42, depth: 1, type: 0, drift: -10, leaves: false, front: true },
  { at: 860, x: 0.66, depth: 0, type: 1, drift: 8, leaves: false, front: true },
] as const;

const ALL = [...CAST, ...WALL_CAST];
// Everything from this index on waits for the line instead of the clock.
const WALL_CUED_FROM = CAST.length;

// Headroom on the push given to a leaver, over the distance it actually has to
// cover. Drag is exponential, so the theoretical figure only just reaches the
// edge and only after a long time; a third again gets it out of frame while it
// is still worth watching.
const ESCAPE_MARGIN = 1.35;

// Rendered width, as a fraction of the screen's short side. Sized off the short
// side so a balloon is the same share of the picture on a phone as on a laptop.
//
// The near band is only a hair above the middle one. It was half again as big,
// which made the silver balloons in front dominate the screen and swallow the
// headings behind them — the depth was reading, but at the cost of the section.
// Distance is carried by the far band, which stays clearly smaller, and by the
// fall speed, which is the cue that does not cost any screen.
const SIZE_BY_DEPTH = { far: 0.13, mid: 0.185, near: 0.195 };

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
    // When the impact line first went solid. The second pair is cued off this
    // rather than off the drop.
    let wallSince = 0;
    let carry = 0;
    let previous = 0;
    let lastFloor = 0;
    let lastWallTop = 0;
    let lastScroll = window.scrollY;
    let visible = false;

    const build = () => {
      const short = Math.min(window.innerWidth, window.innerHeight);
      balloonsRef.current = ALL.map((entry, index) => {
        const size = sizeFor(entry.depth, short);
        return {
          x: entry.x * window.innerWidth,
          // Staged JUST above the fold. They used to start up to three
          // balloon-heights clear of it, which at a terminal velocity of
          // 213px/s meant two and a half seconds of falling before the first
          // one was even visible — the entire hold spent on an empty screen.
          y: -size * (0.6 + (index % 3) * 0.22),
          vx: entry.drift,
          vy: 0,
          r: size / 2,
          tilt: 0,
          tiltVelocity: 0,
          depth: entry.depth,
          front: entry.front,
          type: entry.type,
          swayPhase: index % 2 === 0 ? 1 : -1,
          contained: !entry.leaves,
          released: false,
          alive: true,
          resting: false,
        } satisfies Balloon;
      });

      // The push a leaver needs to clear the edge it is aimed at. Sized from
      // its own distance to that edge rather than picked as a number, so the
      // one starting at 0.06 is not fired across the whole screen and the one
      // in the middle actually makes it out.
      balloonsRef.current.forEach((balloon, index) => {
        if (ALL[index].leaves) {
          const outward = Math.sign(ALL[index].drift) || 1;
          const distance =
            outward > 0 ? window.innerWidth - balloon.x + balloon.r : balloon.x + balloon.r;
          balloon.vx = outward * distance * ESCAPE_DRAG * ESCAPE_MARGIN;
        }
        const node = nodesRef.current[index];
        if (!node) return;
        node.style.width = `${balloon.r * 2}px`;
        node.style.opacity = "0";
      });
      started = 0;
      wallSince = 0;
      // Cleared too, or the frame after a reset computes a floor velocity out
      // of the gap between two unrelated positions and launches the heap.
      lastFloor = 0;
      lastWallTop = 0;
    };

    build();

    const draw = () => {
      balloonsRef.current.forEach((balloon, index) => {
        const node = nodesRef.current[index];
        if (!node) return;
        if (!balloon.released || !balloon.alive) {
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

      // The one real floor is the bottom of the black. The bottom of the SCREEN
      // is not a surface — it is the edge of what is currently visible, and
      // resting a balloon on it means that scrolling down opens a void beneath
      // something already at rest. Stopping to read would leave balloons
      // standing on nothing, and moving on again would have them hanging there
      // rather than falling into the space that just appeared.
      //
      // So they keep falling the whole way down and the heap gathers at the end
      // of the section, which is also the only place it can gather without ever
      // crossing into the next one.
      const floorY = sectionBox.bottom;
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

      if (wallBox && wallSince === 0) wallSince = now;
      const since = now - started;
      const sinceWall = wallSince === 0 ? -1 : now - wallSince;
      balloonsRef.current.forEach((balloon, index) => {
        const clock = index >= WALL_CUED_FROM ? sinceWall : since;
        if (clock >= 0 && clock >= ALL[index].at) balloon.released = true;
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
      {ALL.map((entry, index) =>
        entry.front === front ? (
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
