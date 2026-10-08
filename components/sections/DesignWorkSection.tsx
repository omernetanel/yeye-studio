"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import CurvedLoop from "@/components/ui/CurvedLoop";
import ExternalNote from "@/components/ui/ExternalNote";
import FoldText, { setFold } from "@/components/ui/FoldText";
import { DESIGN_LOOP_TEXT } from "@/lib/content";
import { designWork, type DesignBrand, type DesignPiece } from "@/lib/design-work";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { cn } from "@/lib/utils";

/**
 * The work that is not a website, between the gallery of sites and the form
 * the page closes on.
 *
 * NOT A SECOND CAROUSEL. The sites above are a row to be turned through; this
 * is read by scrolling, the way the rest of the page is. On the desk the
 * pictures of a brand stand in two columns that do not line up, and the second
 * drifts a little against the scroll, so the group reads as things laid out on
 * a table rather than as a grid. On a phone they are one column, stepped to
 * either side for the same reason.
 *
 * NO SENTENCES AND NO CAPTIONS. A name and one line per brand. Lines that tried
 * to describe the pictures cheapened them, and a label under each one said what
 * was already in front of the reader; what each picture shows is its `alt`.
 *
 * One section for both layouts, unlike its neighbours: nothing here is pinned
 * or scrubbed, so there is no second design to keep in step.
 */

// How far the second column travels against the scroll while its brand crosses
// the screen, in px. Enough to be felt, not enough to open a gap.
const DRIFT_PX = 70;

// Where the heading's top is on the screen, as a share of its height, while
// its letters fold in: from just inside the bottom edge to past the middle.
const HEADING_FOLD = [0.95, 0.55] as const;

// The pictures in their windows. Each comes in PIECE_ZOOM larger than its
// window and settles to exactly its size over the first PIECE_SETTLE of a
// screen, eased so that most of it is done early. The ride is how far, in px,
// each window is carried ahead of the scroll while it crosses the screen:
// alternating, and the difference between the two is less than the gap
// between neighbours, so they never touch.
const PIECE_ZOOM = 0.16;
const PIECE_SETTLE = 0.6;
const PIECE_RIDE_PX = [8, 18];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

// The order each piece takes in the phone's single column. The desk deals them
// into two columns (see BrandBlock) and these are what puts them back in the
// order they were listed.
const PHONE_ORDER = ["order-1", "order-2", "order-3", "order-4", "order-5", "order-6"];

function Piece({ piece, sizes, className }: { piece: DesignPiece; sizes: string; className?: string }) {
  return (
    // Three boxes, each for one job. The figure is the place the picture
    // stands in and the only one measured, so it never moves. The window
    // inside it rides with the scroll and cuts what is in it. The picture
    // zooms inside the window - and ENDS AT EXACTLY ITS OWN SIZE: held larger
    // than the window at rest, as it first was, it lost its edges, and these
    // are pictures of whole things - a sheet of stickers, two cards.
    <figure data-design-piece className={className}>
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

function BrandHeader({ brand, className }: { brand: DesignBrand; className?: string }) {
  return (
    <header className={className}>
      <h3 className="font-display text-m-title font-extrabold tracking-tight text-black md:text-[44px] md:leading-[1.1]">
        {brand.name}
      </h3>
      <p className="mt-0.5 font-body text-m-body text-black/55 md:text-[17px]">{brand.line}</p>
      {brand.link && (
        <p className="mt-5 flex flex-col items-start gap-1.5">
          <Link
            href={brand.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-display text-m-body font-medium text-black underline-offset-4 hover:underline md:text-[17px]"
          >
            {brand.link.label}
            <ArrowIcon />
          </Link>
          <ExternalNote className="text-black/50" />
        </p>
      )}
    </header>
  );
}

function BrandBlock({ brand, drifts }: { brand: DesignBrand; drifts: boolean }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    const block = blockRef.current;
    const column = driftRef.current;
    if (!drifts || !block || !column) return;
    // Where the block's middle is against the screen's: -1 a screen below, 0
    // centred, 1 a screen above. Read first, written after.
    const box = block.getBoundingClientRect();
    const screen = window.innerHeight;
    const through = Math.min(1, Math.max(-1, (screen / 2 - (box.top + box.height / 2)) / screen));
    column.style.transform = `translateY(${(-through * DRIFT_PX).toFixed(1)}px)`;
  });

  // Without the drift the column stands where the layout put it.
  useEffect(() => {
    if (!drifts && driftRef.current) driftRef.current.style.transform = "";
  }, [drifts]);

  // ONE PICTURE: the name beside it, the picture wide.
  if (brand.pieces.length === 1) {
    return (
      <div ref={blockRef} className="md:grid md:grid-cols-12 md:items-start md:gap-x-6">
        <BrandHeader brand={brand} className="md:col-span-4" />
        <Piece
          piece={brand.pieces[0]}
          sizes="(max-width: 768px) 100vw, 58vw"
          // A touch under the full eight columns, and kept against the page's
          // far edge: seven columns was a great deal too small.
          className="mt-5 md:col-span-8 md:mt-0 md:w-[94%] md:justify-self-end"
        />
      </div>
    );
  }

  // SEVERAL: dealt into two columns, first to the right. The wrappers are
  // `contents` on a phone, where the pieces are one column in listed order.
  const columns = [0, 1].map((side) =>
    brand.pieces
      .map((piece, index) => ({ piece, index }))
      .filter(({ index }) => index % 2 === side),
  );

  return (
    <div ref={blockRef} className="flex flex-col md:grid md:grid-cols-12 md:gap-x-6">
      <div className="contents md:col-span-6 md:block">
        <BrandHeader brand={brand} className="order-0" />
        {columns[0].map(({ piece, index }) => (
          <Piece
            key={piece.src}
            piece={piece}
            sizes="(max-width: 768px) 90vw, 46vw"
            className={cn(
              PHONE_ORDER[index],
              "mt-5 md:mt-6",
              // A square is stepped to one side on a phone; a wide one runs
              // the full width.
              piece.width === piece.height && (index % 2 === 0 ? "w-[90%] self-start" : "w-[90%] self-end"),
              "md:w-full",
            )}
          />
        ))}
      </div>
      {/* Starts lower than the first column and never lines up with it. */}
      <div ref={driftRef} className="contents will-change-transform md:col-span-6 md:mt-28 md:block">
        {columns[1].map(({ piece, index }, place) => (
          <Piece
            key={piece.src}
            piece={piece}
            sizes="(max-width: 768px) 90vw, 46vw"
            className={cn(
              PHONE_ORDER[index],
              "mt-5",
              place > 0 && "md:mt-6",
              place === 0 && "md:mt-0",
              piece.width === piece.height && (index % 2 === 0 ? "w-[90%] self-start" : "w-[90%] self-end"),
              "md:w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function DesignWorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { scrollY } = useScroll();

  // Read off where the heading is on the screen. Only its letters move, so its
  // own box is an honest reading.
  const foldHeading = () => {
    const heading = headingRef.current;
    if (!heading) return;
    const at = heading.getBoundingClientRect().top / window.innerHeight;
    setFold(heading, (HEADING_FOLD[0] - at) / (HEADING_FOLD[0] - HEADING_FOLD[1]));
  };

  useLayoutEffect(() => {
    // With less motion the letters are simply open: no scroll does it there.
    if (prefersReducedMotion) {
      if (headingRef.current) setFold(headingRef.current, 1);
      return;
    }
    foldHeading();
    window.addEventListener("resize", foldHeading);
    return () => window.removeEventListener("resize", foldHeading);
  }, [prefersReducedMotion]);

  // THE PICTURES MOVE WITH THE SCROLL, every one of them, the whole way
  // through. Standing still in their frames they made this the one stretch of
  // the page that only went past. Each comes up zoomed in inside its window
  // and settles to its own size as its place comes up the screen, and the
  // window rides a little ahead of the scroll, each by its own amount, so no
  // two pass at the same pace. Nothing is on a clock - stop scrolling and it stops; scroll back
  // and it undoes itself.
  const movePieces = () => {
    const section = sectionRef.current;
    if (!section) return;
    const screen = window.innerHeight;
    const frames = Array.from(section.querySelectorAll<HTMLElement>("[data-design-piece]"));
    // Every box read before any style is written.
    const boxes = frames.map((frame) => frame.getBoundingClientRect());
    frames.forEach((frame, index) => {
      const frameWindow = frame.firstElementChild as HTMLElement | null;
      const picture = frameWindow?.firstElementChild as HTMLElement | null;
      if (!frameWindow || !picture) return;
      const box = boxes[index];
      if (box.bottom < -screen || box.top > screen * 2) return;
      const arrived = clamp01((screen - box.top) / (screen * PIECE_SETTLE));
      const eased = 1 - (1 - arrived) ** 3;
      const through = Math.min(1, Math.max(-1, (screen / 2 - (box.top + box.height / 2)) / screen));
      const ride = -through * PIECE_RIDE_PX[index % PIECE_RIDE_PX.length];
      frameWindow.style.transform = `translateY(${ride.toFixed(1)}px)`;
      picture.style.transform = `scale(${(1 + PIECE_ZOOM * (1 - eased)).toFixed(4)})`;
    });
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion) {
      for (const frame of section.querySelectorAll<HTMLElement>("[data-design-piece]")) {
        const frameWindow = frame.firstElementChild as HTMLElement | null;
        frameWindow?.style.removeProperty("transform");
        (frameWindow?.firstElementChild as HTMLElement | null)?.style.removeProperty("transform");
      }
      return;
    }
    movePieces();
    window.addEventListener("resize", movePieces);
    return () => window.removeEventListener("resize", movePieces);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    foldHeading();
    movePieces();
  });

  return (
    <section
      ref={sectionRef}
      id="design"
      aria-labelledby="design-heading"
      className="relative bg-white px-6 pt-24 pb-6 md:pt-16 md:pb-16"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* The one heading on the site in English, and the mark is in it: the
            YE of YES in black, the rest of the line stepped back to grey. Two
            lines on a phone, where one would not fit at this size.
            It folds in a letter at a time as it comes up the screen, the way
            the heading over the sites does, and unfolds again on the way back
            down - it follows the scroll, it does not play. */}
        <h2
          ref={headingRef}
          id="design-heading"
          lang="en"
          dir="ltr"
          // The letters are split for the fold, so the line is named whole.
          aria-label="Yes, that too."
          className="text-center font-display text-m-display font-extrabold tracking-tight text-black/30 md:text-[clamp(48px,6.4vw,96px)] md:leading-[1.05]"
        >
          <span className="block md:inline">
            <span className="text-black">
              <FoldText text="YE" />
            </span>
            <FoldText text="S," />
          </span>{" "}
          <span className="block md:inline">
            <FoldText text="THAT TOO." />
          </span>
        </h2>

        {/* On a phone the first brand stands as far under the heading as the
            gallery's arrows stand over it, letter to letter. */}
        {designWork.map((brand, index) => (
          <div key={brand.name} className={index === 0 ? "mt-26 md:mt-16" : "mt-16 md:mt-24"}>
            <BrandBlock brand={brand} drifts={!isMobile && !prefersReducedMotion} />
          </div>
        ))}
      </div>

      {/* BETWEEN THE WORK AND THE FORM. The section used to end on a picture,
          then white, then the form starting from nothing - a hard cut with
          nothing in it. This runs on its own, not with the scroll, and it is
          the one shape down here that is not a rectangle. Full width: it
          steps out of the section's side padding.
          ON THE DESK IT IS SMALL AND SHALLOW ON PURPOSE. At the size it first
          came in - type a hundred pixels tall on a curve most of a screen deep
          - it was the loudest thing down here and stood over the heading of
          the form it is meant to lead to. It is a passage, in the grey of the
          heading above, not an event.
          The phone draws it in a narrower box, which is what brings the type
          up to a size worth reading there. */}
      <div className="-mx-6 mt-16 overflow-x-clip text-black/30 md:mt-14">
        <CurvedLoop
          text={DESIGN_LOOP_TEXT}
          className="font-display font-extrabold tracking-tight"
          {...(isMobile
            ? { span: 560, fontSize: 84, curveAmount: 220, speed: 70 }
            : { fontSize: 62, curveAmount: 200, speed: 80 })}
        />
      </div>
    </section>
  );
}
