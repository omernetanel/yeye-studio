"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * Two balloons, let go over the end of the site.
 *
 * They fall into the frame, strike the YEYE letters lying in the corner of the
 * closing clip, and are thrown off them and out of the page to the left. It is
 * the last thing that happens here, and the only thing on the screen that the
 * reader did not cause.
 *
 * THE LETTERS ARE VIDEO. There is nothing there to hit — they are pixels in a
 * looping clip, so the collision is against four invisible circles laid over
 * where the letters are in the clip's own frame (LETTERS below). That is why
 * every number in this file is a fraction of the FRAME rather than of the
 * section: the clip is object-cover inside an element that is itself scaled and
 * shifted, so the only stable thing to measure against is the picture, and the
 * picture's position on screen is worked out at run time.
 *
 * NOT the balloon simulation in lib/physics. That one settles a pile of
 * seventeen against a floor, a wall and each other; these two touch one thing
 * once and are gone. But the FEEL is its own — foil falls slowly and rocks the
 * whole way down, so the constants below are the sim's.
 */

// Terminal velocity is GRAVITY / DRAG — 274px/s, which is what makes them read
// as foil and not as stones.
const GRAVITY = 520;
const DRAG = 1.9;
const ROCK_DEGREES = 26;
const ROCK_SPEED = 1.05;

const MAX_STEP_SECONDS = 1 / 30;

// The four letters of YEYE as they lie in the clip's last frame, measured off
// it: centre and radius as fractions of the frame's own WIDTH (fy uses the
// frame's height, so a fraction of each is in its own axis, but the radius is
// width-based because the picture keeps its aspect ratio at any size).
//
// All four, not just the two that get hit. A balloon aimed at a gap between two
// letters would otherwise fall straight through the middle of the word.
const LETTERS = [
  { fx: 0.086, fy: 0.702, fr: 0.086 },
  { fx: 0.259, fy: 0.681, fr: 0.086 },
  { fx: 0.364, fy: 0.723, fr: 0.082 },
  { fx: 0.5, fy: 0.745, fr: 0.086 },
];

// How much of the incoming speed survives the bounce, and the sideways shove
// that goes with it. The shove is what makes this an exit rather than a
// tumble: a ball dropped onto a round shoulder does come off sideways, but how
// far it then travels is a matter of how hard it was thrown, and "out of the
// page" is not something to leave to the arithmetic.
const RESTITUTION = 0.72;
// 640px/s clears the widest gap between a letter and the left edge in about six
// tenths of a second, which is well before the fall would carry them out of the
// bottom of the section instead.
const LEFT_EXIT_SPEED = 640;

/**
 * Each balloon: which art, how big, where it comes down, and when.
 *
 * `lane` is a fraction of the frame's width, and the two are deliberately on
 * OPPOSITE SHOULDERS of the same letter — the tallest one in the word, which is
 * the one anything falling here reaches first whatever else is under it. The
 * silver one lands left of its crown and is thrown straight off the end; the
 * blue one lands right of it a beat later and is carried back across the whole
 * word on the way out, which is the longer and better of the two flights.
 *
 * One silver and one blue, and the silver one is the same balloon that is
 * printed on the letters it hits.
 */
const CAST = [
  { src: "/images/ball1.webp", size: 118, lane: 0.3, delay: 0 },
  { src: "/images/ball2.webp", size: 96, lane: 0.19, delay: 0.42 },
];

type Body = {
  el: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  delay: number;
  age: number;
  bounced: boolean;
  alive: boolean;
};

export default function EndBalloons() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const ballRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const layer = layerRef.current;
    if (!layer) return;
    const video = layer.parentElement?.querySelector("video");
    if (!video) return;

    let frame: number | null = null;
    let running = false;
    let last = 0;
    let bodies: Body[] = [];

    /**
     * Where the clip's picture actually is, in the layer's own coordinates.
     *
     * getBoundingClientRect already has the element's CSS transform in it, so
     * the scale and shift on the video need no handling here. What it does NOT
     * account for is object-cover, which crops the picture to the element: the
     * picture is the intrinsic frame blown up by whichever axis needs it more,
     * anchored bottom-left by object-position.
     */
    const picture = () => {
      if (!video.videoWidth || !video.videoHeight) return null;
      const box = video.getBoundingClientRect();
      const host = layer.getBoundingClientRect();
      const scale = Math.max(box.width / video.videoWidth, box.height / video.videoHeight);
      const w = video.videoWidth * scale;
      const h = video.videoHeight * scale;
      return { left: box.left - host.left, bottom: box.bottom - host.top, w, h };
    };

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      running = false;
      for (const body of bodies) body.el.style.opacity = "0";
      bodies = [];
    };

    const step = (now: number) => {
      // Clamped: a tab that was in the background hands back one enormous delta
      // and everything would be off the screen before its first drawn frame.
      const dt = Math.min(MAX_STEP_SECONDS, (now - last) / 1000);
      last = now;

      const pic = picture();
      if (!pic) {
        frame = requestAnimationFrame(step);
        return;
      }

      let anyAlive = false;
      for (const body of bodies) {
        if (!body.alive) continue;
        body.age += dt;
        if (body.age < body.delay) {
          anyAlive = true;
          continue;
        }
        body.el.style.opacity = "1";

        // Drag on the FALL only. Air resistance is what makes foil drift down
        // instead of dropping, and it belongs there — but applied sideways as
        // well it eats the shove off the letters: at this drag a balloon thrown
        // at 560px/s covers 295 pixels before it stops, and it has 350 to go to
        // clear the edge. It slowed to a halt in mid-air over the form, which
        // is not an exit, it is a balloon giving up.
        body.vy += (GRAVITY - DRAG * body.vy) * dt;
        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // One bounce each, and only one: a balloon still solid on the way out
        // would clip the next letter along and lose the shove that is carrying
        // it off the page.
        if (!body.bounced) {
          for (const letter of LETTERS) {
            const cx = pic.left + letter.fx * pic.w;
            const cy = pic.bottom - pic.h + letter.fy * pic.h;
            const reach = letter.fr * pic.w + body.r;
            const dx = body.x - cx;
            const dy = body.y - cy;
            const distance = Math.hypot(dx, dy);
            if (distance > reach || distance === 0) continue;

            // Put it exactly on the surface first. Resolving from inside the
            // circle is what makes a bounce look like a body passing through
            // and being yanked back.
            const nx = dx / distance;
            const ny = dy / distance;
            body.x = cx + nx * reach;
            body.y = cy + ny * reach;

            const along = body.vx * nx + body.vy * ny;
            body.vx = (body.vx - 2 * along * nx) * RESTITUTION - LEFT_EXIT_SPEED;
            body.vy = (body.vy - 2 * along * ny) * RESTITUTION;
            body.bounced = true;
            break;
          }
        }

        const rock = Math.sin(body.age * ROCK_SPEED);
        // Never a full turn: one of these has YEYE written on it.
        body.el.style.transform = `translate3d(${(body.x - body.r).toFixed(1)}px, ${(body.y - body.r).toFixed(1)}px, 0) rotate(${(rock * ROCK_DEGREES).toFixed(1)}deg)`;

        const host = layer.getBoundingClientRect();
        if (body.x + body.r < 0 || body.y - body.r > host.height) {
          body.alive = false;
          body.el.style.opacity = "0";
        } else {
          anyAlive = true;
        }
      }

      if (!anyAlive) {
        stop();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      const pic = picture();
      if (!pic) return;
      running = true;
      bodies = CAST.map((entry, index) => {
        const el = ballRefs.current[index]!;
        el.style.width = `${entry.size}px`;
        const r = entry.size / 2;
        return {
          el,
          // Above the frame, so they drop in over its edge rather than being
          // switched on inside it.
          x: pic.left + entry.lane * pic.w,
          y: -r,
          vx: 0,
          vy: 0,
          r,
          delay: entry.delay,
          age: 0,
          bounced: false,
          alive: true,
        };
      });
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    // The end of the site is "this section has the screen", not "this section
    // has appeared" — the negative bottom margin pulls the observer's lower
    // edge up so the drop begins once the close is actually being read. It
    // re-arms on the way out, so scrolling back up and down again runs it
    // afresh rather than leaving a page that can only do this once.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -45% 0px" },
    );
    observer.observe(layer);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    // No z-index, and that is the placement: this comes after the clip in the
    // DOM so it paints over it, and before the copy's own z-10 so it passes
    // behind the words. The section's overflow-hidden is what they leave
    // through — it crops them at its left edge, which is the page's.
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {CAST.map((entry, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={entry.src}
          ref={(el) => {
            ballRefs.current[index] = el;
          }}
          src={entry.src}
          alt=""
          className="absolute top-0 left-0 h-auto will-change-transform"
          style={{ opacity: 0 }}
          draggable={false}
        />
      ))}
    </div>
  );
}
