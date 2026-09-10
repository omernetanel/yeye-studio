"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * One balloon, falling past the top of the work.
 *
 * It reads as the last of the ones from "מי אני" — as though one had been left
 * hanging above the room and let go the moment the section below it began. That
 * is the whole trick of it: everything else on this page answers the hand, and
 * this does not. It falls on its own clock while the reader is scrolling, and
 * then it is gone.
 *
 * NOT the balloon simulation from lib/physics. That one exists to settle a pile
 * of seventeen against a floor, a wall and each other; this one has nothing to
 * hit. Borrowing the solver for a body in free air would be carrying a
 * collision system to move one thing in a straight line — but the FEEL is
 * copied deliberately, so the numbers below are the sim's own: foil falls slow,
 * and it rocks the whole way down.
 */

// Terminal velocity is GRAVITY / DRAG — 274px/s, which is what makes it read as
// foil and not as a stone. Roughly three seconds to cross a screen.
const GRAVITY = 520;
const DRAG = 1.9;
const ROCK_DEGREES = 30;
const ROCK_SPEED = 1.05;
const ROCK_DRIFT = 30;

const SIZE_VW = 8;
const SIZE_MIN = 90;
const SIZE_MAX = 140;
// Where it crosses, as a fraction of the width. Left of centre in RTL terms is
// the empty side here: the heading is centred and the arc has not arrived yet.
const LANE = 0.24;
const MAX_STEP_SECONDS = 1 / 30;

export default function FallingBalloon() {
  const markerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLImageElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const marker = markerRef.current;
    const ball = ballRef.current;
    if (!marker || !ball) return;

    let frame: number | null = null;
    let falling = false;
    let y = 0;
    let velocity = 0;
    let elapsed = 0;
    let last = 0;

    const size = Math.max(SIZE_MIN, Math.min(SIZE_MAX, (window.innerWidth * SIZE_VW) / 100));
    ball.style.width = `${size}px`;

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      falling = false;
      ball.style.opacity = "0";
    };

    const step = (now: number) => {
      // Clamped: a tab that was in the background hands back one enormous delta,
      // and the balloon would be below the fold before its first drawn frame.
      const dt = Math.min(MAX_STEP_SECONDS, (now - last) / 1000);
      last = now;
      elapsed += dt;

      velocity += (GRAVITY - DRAG * velocity) * dt;
      y += velocity * dt;

      const rock = Math.sin(elapsed * ROCK_SPEED);
      const x = rock * ROCK_DRIFT;
      // Never a full turn: one of these has YEYE written on it.
      ball.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(rock * ROCK_DEGREES).toFixed(1)}deg)`;

      if (y > marker.offsetHeight + size) {
        stop();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (falling) return;
      falling = true;
      // Above the section's own top edge, so it drops in over the boundary
      // rather than being switched on inside the frame.
      y = -size;
      velocity = 0;
      elapsed = 0;
      last = performance.now();
      ball.style.opacity = "1";
      frame = requestAnimationFrame(step);
    };

    // Not when the section arrives — a third of a screen after it, so the
    // heading has begun coming up out of its blur before anything falls past
    // it. The negative bottom margin pulls the root's lower edge up by that
    // much, so this only counts the section as present once it has actually
    // taken the screen. Re-arms when it leaves.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -34% 0px" },
    );
    observer.observe(marker);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    // Clipped to the section, and that is not decoration — it is the guarantee.
    // Free-falling in screen space it crossed the contact stage above, which is
    // a finished shot of a room and no place for a balloon. Bounded here, it
    // can only ever be seen inside this section: it enters over the section's
    // own top edge, as though it had been let go just above it.
    //
    // No z-index. The pinned panel below opens a stacking context of its own,
    // and this box comes first in the DOM — so the heading paints over it for
    // free, which is where the balloon belongs: behind.
    <div
      ref={markerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-clip"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ballRef}
        src="/images/ball2.webp"
        alt=""
        className="absolute h-auto will-change-transform"
        style={{ left: `${LANE * 100}%`, top: 0, opacity: 0 }}
        draggable={false}
      />
    </div>
  );
}
