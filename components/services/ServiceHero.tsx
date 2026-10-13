"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { isMotionReduced } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

interface ServiceHeroProps {
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
}

// The entrance, from Pixel Swap of React Bits (THIRD_PARTY_NOTICES.md), with
// that component's own defaults: the size a square starts at against its full
// size, how long the whole entrance takes and how long one square takes to
// open.
const PIXEL_START_SCALE = 0.35;
const REVEAL_MS = 1400;
const PIXEL_MS = 450;
const KEYFRAME_STEPS = 14;
// THE SQUARES ARE SIZED BY HOW MANY CROSS THE SCREEN, NOT IN PIXELS. Their
// demonstration is a card some 770px wide with 64px squares: twelve across,
// large against what they cover, and that proportion is the whole look. At
// 64px on a full screen there were thirty across and five hundred in all, and
// it read as static, not as blocks. Twelve across, and never under their 64px
// - which on a phone is six.
const COLUMNS = 12;
const PIXEL_MIN_PX = 64;

// The same layout the section gives its content, for the copies the squares
// show (the section's own classes are these plus what places the squares).
const SECTION_SPACE = "flex min-h-[100svh] flex-col justify-center px-6 pt-28 pb-20 text-center";

// A square's place in the order: a fixed scatter, not chance, so the entrance
// is the same every time the page is opened.
const scatter = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Out fast and settling: the curve of cubic-bezier(0.22, 1, 0.36, 1), near enough.
const ease = (progress: number) => 1 - (1 - progress) ** 4;

/**
 * The opening of a service page: the heading, one sentence and one button,
 * ARRIVING IN SQUARES. Each square is a window onto the finished opening; they
 * open in no order, small and faint to full, and when the last has opened
 * they are taken away and the opening itself stands there. Once, as the page
 * arrives.
 *
 * It replaces three fades, one after the other - the entrance of every
 * template there is. With less motion there are no squares: the opening is
 * simply there.
 *
 * Only the arriving half of Pixel Swap: there is no second content to swap to
 * and nothing to trigger. What is kept is how it is done - a copy of the
 * content inside every square, held still by the exact inverse of the
 * square's own scaling, so nothing in it is seen to move or grow.
 */
export default function ServiceHero({ titleLine1, titleLine2, description, ctaLabel }: ServiceHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const grid = gridRef.current;
    if (!section || !content || !grid) return undefined;

    const finish = () => {
      grid.replaceChildren();
      setShown(true);
    };
    if (isMotionReduced()) {
      finish();
      return undefined;
    }

    const width = section.clientWidth;
    const height = section.clientHeight;
    const size = Math.max(PIXEL_MIN_PX, Math.ceil(width / COLUMNS));
    const columns = Math.max(1, Math.ceil(width / size));
    const rows = Math.max(1, Math.ceil(height / size));
    // The grid overhangs the section evenly, so the squares at its edges are
    // whole squares and not slivers.
    const originX = (width - columns * size) / 2;
    const originY = (height - rows * size) / 2;

    // One pair of keyframe lists for every square: the window's own scaling,
    // and its exact inverse for what is inside it.
    const windowFrames: Keyframe[] = [];
    const contentFrames: Keyframe[] = [];
    for (let step = 0; step <= KEYFRAME_STEPS; step++) {
      const progress = step / KEYFRAME_STEPS;
      const eased = ease(progress);
      const scale = PIXEL_START_SCALE + (1 - PIXEL_START_SCALE) * eased;
      windowFrames.push({ offset: progress, opacity: Math.min(1, eased * 1.6), transform: `scale(${scale})` });
      contentFrames.push({ offset: progress, transform: `scale(${1 / scale})` });
    }

    const animations: Animation[] = [];
    const squares: HTMLElement[] = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const left = originX + column * size;
        const top = originY + row * size;

        const square = document.createElement("div");
        square.className = "absolute overflow-hidden opacity-0 [contain:paint]";
        square.style.cssText = `left:${left}px;top:${top}px;width:${size}px;height:${size}px`;

        // The whole opening, laid out as the section lays it out and shifted
        // so that this square shows its own part of it.
        const frame = document.createElement("div");
        frame.className = cn("absolute bg-white", SECTION_SPACE);
        frame.style.cssText = `left:${-left}px;top:${-top}px;width:${width}px;height:${height}px;transform-origin:${left + size / 2}px ${top + size / 2}px`;
        const copy = content.cloneNode(true) as HTMLElement;
        copy.style.opacity = "1";
        frame.appendChild(copy);
        square.appendChild(frame);
        squares.push(square);

        const timing: KeyframeAnimationOptions = {
          duration: PIXEL_MS,
          delay: scatter(row * columns + column + 1) * (REVEAL_MS - PIXEL_MS),
          easing: "linear",
          fill: "both",
        };
        animations.push(square.animate(windowFrames, timing), frame.animate(contentFrames, timing));
      }
    }
    grid.replaceChildren(...squares);

    const done = window.setTimeout(finish, REVEAL_MS);
    return () => {
      window.clearTimeout(done);
      animations.forEach((animation) => animation.cancel());
      grid.replaceChildren();
    };
  }, []);

  return (
    <section ref={sectionRef} className={cn("relative overflow-hidden", SECTION_SPACE)}>
      {/* Unseen while the squares are showing copies of it, and from the first
          paint: the page is sent with the opening in it, and it would show
          whole for a moment before the squares began. */}
      <div ref={contentRef} className={cn("mx-auto max-w-[1100px]", shown ? "opacity-100" : "opacity-0")}>
        <h1 className="mb-7 font-display text-[clamp(40px,6.6vw,96px)] leading-[1.08] font-extrabold tracking-tight text-black">
          {titleLine1}
          <br />
          <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">{titleLine2}</span>
        </h1>
        <p className="mx-auto mb-9 max-w-[720px] font-body text-lg leading-[1.8] text-black/70 md:text-[21px]">
          {description}
        </p>
        <div className="flex justify-center">
          <Button href="/#cta" className="!border-black !bg-none !bg-black !shadow-none">
            {ctaLabel}
          </Button>
        </div>
      </div>

      {/* THE SQUARES, AND THE BLACK THEY OPEN OVER. The black is what makes them
          squares: opening white onto a white page, each was only a scrap of
          the heading appearing from nowhere, and the entrance read as a page
          that had failed to draw. It is there from the first paint, so the
          page does not show white, then black, then squares; and gone, with
          the squares, the moment the last has opened. */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 bg-black motion-reduce:hidden", shown && "hidden")}
      />
    </section>
  );
}
