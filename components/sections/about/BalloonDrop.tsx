"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
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
  /** The assembled section has started scrolling away towards the close. */
  leaving: boolean;
};

type Props = {
  sectionRef: RefObject<HTMLElement | null>;
  /** The impact line the balloons collide with. The contact stage has none. */
  lineRef?: RefObject<HTMLElement | null>;
  stateRef: RefObject<DropState>;
  /**
   * "mobile": nine balloons instead of seventeen. Not a screen-size tweak — a
   * phone has to solve the same collisions in three passes on a tenth of the
   * silicon, and this is the one thing in the section with a per-frame cost that
   * grows with the count. The choreography is the same shape either way: a
   * couple over the copy, a handful at the close.
   *
   * "contact": the phone's last two, one silver and one blue, falling through
   * the contact stage as its picture leaves the top of the screen.
   */
  variant?: "desktop" | "mobile" | "contact";
};

const SOURCES = ["/images/ball1.webp", "/images/ball2.webp"];

/** One balloon's brief: when it is released, where from, and how far back. */
type CastEntry = {
  cue: "drop" | "leaving" | "wall";
  at: number;
  x: number;
  depth: number;
  type: number;
  settles: boolean;
  front: boolean;
};

/**
 * The cast, authored rather than generated. With a fixed timestep and fixed
 * initial conditions the whole sequence is deterministic, so every visitor sees
 * the same choreography and it can be directed. Randomised drops can never be
 * corrected, only reshuffled.
 *
 * `x` is a fraction of the screen width and `at` is milliseconds — but from
 * WHICH moment depends on the cue, and only the first group runs off a clock
 * that starts with the drop. The other two wait for something on the page,
 * because how long a reader takes to get from one part of the section to the
 * next is not something a delay can predict.
 *
 * The x values are spread across the full width and then SHUFFLED in time. Laid
 * out in order they read as a wipe across the screen; clustered, they land in a
 * heap in the middle. Neither looks like weather.
 */
const CAST: readonly CastEntry[] = [
  // OVER THE COPY, while the section is still standing. Spaced wide: with
  // nothing else moving, one balloon a second is an event and three a second is
  // a shower. Five is all this stretch can hold at that spacing.
  { cue: "drop", at: 0, x: 0.62, depth: 1, type: 0, settles: false, front: true },
  { cue: "drop", at: 1150, x: 0.25, depth: 0, type: 1, settles: false, front: false },
  { cue: "drop", at: 2250, x: 0.81, depth: 0.5, type: 1, settles: false, front: false },
  { cue: "drop", at: 3400, x: 0.44, depth: 0, type: 1, settles: false, front: false },
  { cue: "drop", at: 4500, x: 0.12, depth: 1, type: 0, settles: false, front: true },

  // ON THE WAY OUT. Released once the section starts leaving, so the back half
  // of the cast falls through a screen that is already travelling towards the
  // impact line rather than piling into the one being read.
  { cue: "leaving", at: 0, x: 0.69, depth: 0, type: 1, settles: false, front: false },
  { cue: "leaving", at: 780, x: 0.37, depth: 0.5, type: 1, settles: false, front: false },
  { cue: "leaving", at: 1500, x: 0.93, depth: 1, type: 0, settles: false, front: true },
  { cue: "leaving", at: 2300, x: 0.56, depth: 0, type: 1, settles: false, front: false },
  { cue: "leaving", at: 3050, x: 0.06, depth: 0.5, type: 1, settles: false, front: false },
  { cue: "leaving", at: 3800, x: 0.75, depth: 0, type: 1, settles: false, front: false },
  { cue: "leaving", at: 4600, x: 0.31, depth: 1, type: 0, settles: false, front: true },
  { cue: "leaving", at: 5350, x: 0.87, depth: 0, type: 1, settles: false, front: false },
  { cue: "leaving", at: 6100, x: 0.5, depth: 0.5, type: 1, settles: false, front: false },
  { cue: "leaving", at: 6900, x: 0.19, depth: 0, type: 1, settles: false, front: false },

  // ON THE LINE, and the only two the world is solid for.
  //
  // The line only becomes collidable once it has finished arriving, and by then
  // anything cued earlier has long fallen past the height it appears at. No
  // fixed delay can fix that — how long the reader takes to get from one to the
  // other is up to the reader — so these two wait for the line itself.
  //
  // They are also the only two that land: everything before them falls straight
  // through the bottom of the black. What is left at the end is the pair that
  // the line just knocked around, sitting under it, rather than a heap of
  // seventeen that arrived by gravity alone.
  { cue: "wall", at: 120, x: 0.42, depth: 1, type: 0, settles: true, front: true },
  { cue: "wall", at: 900, x: 0.66, depth: 0, type: 1, settles: true, front: true },
] as const;

/**
 * The phone's cast. Two over the copy where the desktop has five, and seven at
 * the close where it has twelve — the same three cues and the same reading of
 * them, thinned.
 *
 * Spread wider across the width than the desktop set, because a narrow screen
 * turns a spacing that reads as scattered on a laptop into a single column
 * falling down the middle.
 */
const MOBILE_CAST: readonly CastEntry[] = [
  // Two just ahead of the close. MobileAbout arms them a little before the
  // close's own cue rather than on the first card, so they lead the fall
  // instead of arriving on their own early in the section. Closer together than
  // they were, so both are in the air before the rest begin.
  { cue: "drop", at: 0, x: 0.71, depth: 1, type: 0, settles: false, front: true },
  { cue: "drop", at: 1100, x: 0.21, depth: 0, type: 1, settles: false, front: false },

  // Falling past on the way to the close. Spread wide and unevenly: at a second
  // apart, balloons on a 375px column are never fewer than three on screen at
  // once and read as one falling mass, and even gaps read as a machine feeding
  // them in.
  //
  // On the same cue as the first two, so each time is measured from the moment
  // those two went: 800ms leaves them a clear head start without the rest
  // arriving late.
  { cue: "leaving", at: 800, x: 0.86, depth: 0, type: 1, settles: false, front: false },
  { cue: "leaving", at: 2000, x: 0.33, depth: 0.5, type: 1, settles: false, front: false },

  // AND THREE THAT STAY. Everything above falls straight through the bottom of
  // the black; these come to rest on the floor of the section and are still
  // there when the reader leaves it. Without them the close is one balloon on a
  // line and a great deal of empty black under it — the pile is what gives the
  // end of the section any weight at all.
  { cue: "leaving", at: 3300, x: 0.16, depth: 0.5, type: 1, settles: true, front: false },
  { cue: "leaving", at: 4500, x: 0.62, depth: 0, type: 1, settles: true, front: false },
  { cue: "leaving", at: 5900, x: 0.4, depth: 1, type: 0, settles: true, front: true },

  // ONE on the line, and the biggest of them: depth 1 puts it in the near band
  // and type 0 is the silver. A single balloon knocked by the impact line reads
  // as the line having done it; three read as weather.
  { cue: "wall", at: 500, x: 0.44, depth: 1, type: 0, settles: true, front: true },
] as const;

/**
 * The contact stage's pair on a phone: silver first, then blue, falling from the
 * top of the section as its picture starts to leave the screen, and gone at the
 * section's bottom edge — the clip there is what keeps them off the projects.
 * Neither settles; there is no heap to leave at the foot of a form.
 */
const CONTACT_CAST: readonly CastEntry[] = [
  { cue: "drop", at: 0, x: 0.3, depth: 1, type: 0, settles: false, front: true },
  { cue: "drop", at: 900, x: 0.72, depth: 0.5, type: 1, settles: false, front: false },
] as const;

const CASTS = { desktop: CAST, mobile: MOBILE_CAST, contact: CONTACT_CAST } as const;

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

export default function BalloonDrop({ sectionRef, lineRef, stateRef, variant = "desktop" }: Props) {
  const cast = useMemo<readonly CastEntry[]>(() => CASTS[variant], [variant]);
  const nodesRef = useRef<(HTMLImageElement | null)[]>([]);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const balloonsRef = useRef<Balloon[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // ON A PHONE THE BLACK ENDS AT A PICTURE, not at this section's edge. The
    // contact stage that follows is pulled up over the last of it, so this
    // section's bottom sits partway down that stage's photograph: clipped there,
    // balloons vanished over a band of open black above the picture and cut
    // across the picture itself. The stage's picture is where the black really
    // stops, so that is the clip. Marked with an attribute rather than found as
    // "the first image": the stage carries balloons of its own now, and theirs
    // come first. Found once — the order of the page does not change under it.
    const edge =
      variant === "mobile"
        ? (section.nextElementSibling?.querySelector<HTMLElement>("[data-balloon-floor]") ?? null)
        : null;

    let frame = 0;
    let started = 0;
    // The two clocks that are not the drop's: when the section began leaving,
    // and when the impact line first went solid.
    let leavingSince = 0;
    let wallSince = 0;
    let carry = 0;
    let previous = 0;
    let lastFloor = 0;
    let lastWallTop = 0;
    let lastScroll = window.scrollY;
    let visible = false;
    // Made once and re-pointed each frame. Creating a Range per frame is a
    // needless allocation in the hot loop.
    const textRange = document.createRange();

    const build = () => {
      const short = Math.min(window.innerWidth, window.innerHeight);
      balloonsRef.current = cast.map((entry, index) => {
        const size = sizeFor(entry.depth, short);
        return {
          x: entry.x * window.innerWidth,
          // Staged JUST above the fold. They used to start up to three
          // balloon-heights clear of it, which at a terminal velocity of
          // 213px/s meant two and a half seconds of falling before the first
          // one was even visible — the entire hold spent on an empty screen.
          y: -size * (0.6 + (index % 3) * 0.22),
          // A little sideways to start with, alternating, because nothing this
          // light falls in a straight line.
          vx: index % 2 === 0 ? -13 : 11,
          vy: 0,
          r: size / 2,
          tilt: 0,
          tiltVelocity: 0,
          // Spread around the circle by an irrational step, so no two of the
          // seventeen share a phase and the pattern never repeats down the cast.
          phase: index * 2.39996,
          age: 0,
          depth: entry.depth,
          front: entry.front,
          type: entry.type,
          swayPhase: index % 2 === 0 ? 1 : -1,
          contained: entry.settles,
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
      leavingSince = 0;
      wallSince = 0;
      // Cleared too, or the frame after a reset computes a floor velocity out
      // of the gap between two unrelated positions and launches the heap.
      lastFloor = 0;
      lastWallTop = 0;
    };

    build();

    const draw = (sectionBottom: number) => {
      // Both layers are clipped to the section's bottom edge. This is what lets
      // a balloon leave without being faded out: it falls past the boundary and
      // is hidden BY it, the way it would be by anything solid, instead of
      // dissolving in open air. It is also the guarantee that nothing ever
      // appears over the section below, whatever the simulation does.
      const below = Math.max(0, window.innerHeight - sectionBottom);
      const clip = below > 0 ? `inset(0 0 ${below}px 0)` : "";
      layersRef.current.forEach((layer) => {
        if (layer) layer.style.clipPath = clip;
      });

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
      const blackBottom = edge ? Math.min(sectionBox.bottom, edge.getBoundingClientRect().top) : sectionBox.bottom;
      const line = lineRef?.current;
      // The GLYPHS, not the paragraph. A Range over the element's contents
      // yields one rect per line box, each only as wide as the words actually
      // on it — where the element's own box is the full width of the column and
      // would have balloons resting on empty black beside the text.
      let wallBox: DOMRect[] | null = null;
      if (stateRef.current?.wallLive && line) {
        textRange.selectNodeContents(line);
        wallBox = [...textRange.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
        if (wallBox.length === 0) wallBox = null;
      }
      const scroll = window.scrollY;
      const screen = window.innerHeight;

      // Scrolled clear above the section — everything resets, and going back
      // down runs the whole sequence again from the top.
      if (sectionBox.top > screen) {
        if (started !== 0) {
          build();
          draw(sectionBox.bottom);
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
      // The floor stays at the section's own bottom even where the clip is
      // higher. On a phone that is behind the contact stage's picture, so the
      // balloons meant to come to rest fall on into it and are gone. With the
      // floor on the picture's top edge they stopped there and sat on it.
      const floorY = sectionBox.bottom;
      const wallTop = wallBox ? wallBox[0].top : 0;
      const floorVelocity = elapsed > 0 ? (floorY - lastFloor) / elapsed : 0;
      const wallVelocity = wallBox && lastWallTop !== 0 && elapsed > 0 ? (wallTop - lastWallTop) / elapsed : 0;
      const scrolled = elapsed > 0 ? (scroll - lastScroll) / elapsed : 0;

      const world: World = {
        width: window.innerWidth,
        floorY,
        floorVelocity,
        wall:
          wallBox?.map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })) ??
          null,
        wallVelocity,
        sway: Math.max(-SWAY_LIMIT, Math.min(SWAY_LIMIT, scrolled)),
      };

      if (wallBox && wallSince === 0) wallSince = now;
      if (stateRef.current.leaving && leavingSince === 0) leavingSince = now;

      // Three clocks. Only the first is a stopwatch; the other two start when
      // the page reaches somewhere, and read as -1 until it has.
      const clocks = {
        drop: now - started,
        leaving: leavingSince === 0 ? -1 : now - leavingSince,
        wall: wallSince === 0 ? -1 : now - wallSince,
      };
      balloonsRef.current.forEach((balloon, index) => {
        const entry = cast[index];
        const clock = clocks[entry.cue];
        if (clock >= 0 && clock >= entry.at) balloon.released = true;
      });

      carry = Math.min(carry + elapsed, TIMESTEP * MAX_SUBSTEPS);
      while (carry >= TIMESTEP) {
        stepBalloons(balloonsRef.current, TIMESTEP, world);
        carry -= TIMESTEP;
      }

      lastFloor = floorY;
      lastWallTop = wallTop;
      lastScroll = scroll;
      draw(blackBottom);
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
      draw(section.getBoundingClientRect().bottom);
    };
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef, lineRef, stateRef, cast, variant]);

  const layer = (front: boolean, z: string) => (
    <div
      ref={(el) => {
        layersRef.current[front ? 1 : 0] = el;
      }}
      className={`pointer-events-none fixed inset-0 ${z}`}
      aria-hidden="true"
    >
      {cast.map((entry, index) =>
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
