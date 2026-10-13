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
// How long the black opening stands whole before the first square turns: a
// beat, so that it is seen to have been black.
const HOLD_MS = 300;
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
 * The opening's own content, as it stands on white or, `dark`, on black.
 *
 * ON BLACK THE TWO LINES OF THE HEADING TRADE PLACES: the first is the grey
 * one and the second the white. Simply inverted, the grey line was grey on
 * both grounds, and the squares turning over it changed nothing that could be
 * seen. This way each line changes colour as its squares turn.
 */
function Opening({ titleLine1, titleLine2, description, ctaLabel, dark = false }: ServiceHeroProps & { dark?: boolean }) {
  return (
    <>
      <h1
        className={cn(
          "mb-7 font-display text-[clamp(40px,6.6vw,96px)] leading-[1.08] font-extrabold tracking-tight",
          dark ? "text-neutral-500" : "text-black",
        )}
      >
        {titleLine1}
        <br />
        <span
          className={dark ? "text-white" : "bg-[image:var(--gradient-brand)] bg-clip-text text-transparent"}
        >
          {titleLine2}
        </span>
      </h1>
      <p
        className={cn(
          "mx-auto mb-9 max-w-[720px] font-body text-lg leading-[1.8] md:text-[21px]",
          dark ? "text-white/70" : "text-black/70",
        )}
      >
        {description}
      </p>
      <div className="flex justify-center">
        <Button
          href="/#cta"
          className={
            dark
              ? "!border-white !bg-none !bg-white !text-black !shadow-none"
              : "!border-black !bg-none !bg-black !shadow-none"
          }
        >
          {ctaLabel}
        </Button>
      </div>
    </>
  );
}

/**
 * The opening of a service page - the heading, one sentence and one button -
 * taking the whole first screen, and TURNING FROM BLACK TO WHITE IN SQUARES as
 * the page arrives. It is there in white on black from the first paint; each
 * square is a window onto the same opening in black on white; they open in no
 * order, small and faint to full, and when the last has opened they are taken
 * away and the opening itself stands there. Once.
 *
 * It replaces three fades, one after the other - the entrance of every
 * template there is. With less motion there is no black and there are no
 * squares: the opening is simply there.
 *
 * The transition of Pixel Swap, used once: its two contents are the same
 * opening in its two colourings, and nothing triggers it but arriving. What is
 * kept is how it is done - a copy of the content inside every square, held
 * still by the exact inverse of the square's own scaling, so nothing in it is
 * seen to move or grow.
 */
export default function ServiceHero(props: ServiceHeroProps) {
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
          delay: HOLD_MS + scatter(row * columns + column + 1) * (REVEAL_MS - PIXEL_MS),
          easing: "linear",
          fill: "both",
        };
        animations.push(square.animate(windowFrames, timing), frame.animate(contentFrames, timing));
      }
    }
    grid.replaceChildren(...squares);

    const done = window.setTimeout(finish, HOLD_MS + REVEAL_MS);
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
      <div ref={contentRef} className={cn("mx-auto w-full max-w-[1100px]", shown ? "opacity-100" : "opacity-0")}>
        <Opening {...props} />
      </div>

      {/* WHAT THE SQUARES OPEN OVER: THE SAME OPENING, WHITE ON BLACK, laid out
          exactly as the one above so that every letter is in the same place.
          A square turning is then that part of the screen changing colour and
          nothing else: the heading can be read from the first paint to the
          last square, and never moves.

          It was plain black first, and the opening arrived out of nothing;
          then black with the service's name across it, and for a second two
          large texts stood on top of each other. Out of reach of the keyboard
          and of assistive technology: it is a second copy of what is above.
          Gone, with the squares, the moment the last has opened. */}
      <div
        aria-hidden="true"
        inert
        className={cn(
          "pointer-events-none absolute inset-0 bg-black motion-reduce:hidden",
          SECTION_SPACE,
          shown && "hidden",
        )}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <Opening {...props} dark />
        </div>
      </div>
      {/* The squares, over it, while they last. Filled and emptied by the
          effect above. */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 motion-reduce:hidden", shown && "hidden")}
      />
    </section>
  );
}
