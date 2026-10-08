"use client";

import Image from "next/image";
import { useLayoutEffect, type RefObject } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import type { DesignPiece } from "@/lib/design-work";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * A picture of a piece of work that moves with the scroll, and the hook that
 * moves every one of them inside a root.
 *
 * Used wherever the design work is shown - the section on the home page and a
 * brand's own page - so the pictures behave the same in both.
 *
 * Each comes up zoomed in inside its window and settles to its own size as its
 * place comes up the screen, and the window rides a little ahead of the scroll,
 * each by its own amount, so no two pass at the same pace. Nothing is on a
 * clock: stop scrolling and it stops; scroll back and it undoes itself. With
 * less motion they stand still.
 */

// Each comes in PIECE_ZOOM larger than its window and settles to exactly its
// size over the first PIECE_SETTLE of a screen, eased so that most of it is
// done early. The ride is how far, in px, each window is carried ahead of the
// scroll while it crosses the screen: alternating, and the difference between
// the two is less than the gap between neighbours, so they never touch.
const PIECE_ZOOM = 0.16;
const PIECE_SETTLE = 0.6;
const PIECE_RIDE_PX = [8, 18];

export function ScrollPiece({
  piece,
  sizes,
  className,
}: {
  piece: DesignPiece;
  sizes: string;
  className?: string;
}) {
  return (
    // Three boxes, each for one job. The figure is the place the picture
    // stands in and the only one measured, so it never moves. The window
    // inside it rides with the scroll and cuts what is in it. The picture
    // zooms inside the window - and ENDS AT EXACTLY ITS OWN SIZE: held larger
    // than the window at rest, as it first was, it lost its edges, and these
    // are pictures of whole things - a sheet of stickers, two cards.
    <figure data-scroll-piece className={className}>
      <span className="block overflow-hidden will-change-transform">
        <Image
          src={piece.src}
          alt={piece.alt}
          width={piece.width}
          height={piece.height}
          sizes={sizes}
          className="h-auto w-full will-change-transform"
        />
      </span>
    </figure>
  );
}

/** Moves every ScrollPiece inside `rootRef` as the page scrolls. */
export function useScrollPieces(rootRef: RefObject<HTMLElement | null>) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const move = () => {
    const root = rootRef.current;
    if (!root) return;
    const screen = window.innerHeight;
    const frames = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-piece]"));
    // Every box read before any style is written.
    const boxes = frames.map((frame) => frame.getBoundingClientRect());
    frames.forEach((frame, index) => {
      const frameWindow = frame.firstElementChild as HTMLElement | null;
      const picture = frameWindow?.firstElementChild as HTMLElement | null;
      if (!frameWindow || !picture) return;
      const box = boxes[index];
      if (box.bottom < -screen || box.top > screen * 2) return;
      const arrived = Math.min(1, Math.max(0, (screen - box.top) / (screen * PIECE_SETTLE)));
      const eased = 1 - (1 - arrived) ** 3;
      const through = Math.min(1, Math.max(-1, (screen / 2 - (box.top + box.height / 2)) / screen));
      const ride = -through * PIECE_RIDE_PX[index % PIECE_RIDE_PX.length];
      frameWindow.style.transform = `translateY(${ride.toFixed(1)}px)`;
      picture.style.transform = `scale(${(1 + PIECE_ZOOM * (1 - eased)).toFixed(4)})`;
    });
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion) {
      for (const frame of root.querySelectorAll<HTMLElement>("[data-scroll-piece]")) {
        const frameWindow = frame.firstElementChild as HTMLElement | null;
        frameWindow?.style.removeProperty("transform");
        (frameWindow?.firstElementChild as HTMLElement | null)?.style.removeProperty("transform");
      }
      return;
    }
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
    // `move` reads the ref and the window each time it runs; it holds nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, rootRef]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) move();
  });
}
