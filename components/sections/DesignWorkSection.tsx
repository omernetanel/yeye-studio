"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import CurvedLoop from "@/components/ui/CurvedLoop";
import ExternalNote from "@/components/ui/ExternalNote";
import FoldText, { setFold } from "@/components/ui/FoldText";
import { ScrollPiece, useScrollPieces } from "@/components/ui/ScrollPiece";
import { DESIGN_LOOP_MARKS, DESIGN_LOOP_TEXT } from "@/lib/content";
import { designWork, type DesignBrand } from "@/lib/design-work";
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

// The order each piece takes in the phone's single column. The desk deals them
// into two columns (see BrandBlock) and these are what puts them back in the
// order they were listed.
const PHONE_ORDER = ["order-1", "order-2", "order-3", "order-4", "order-5", "order-6"];

function BrandHeader({ brand, className }: { brand: DesignBrand; className?: string }) {
  return (
    <header className={className}>
      <h3 className="font-display text-m-title font-extrabold tracking-tight text-black md:text-[44px] md:leading-[1.1]">
        {/* A brand with a page of its own is a link to it, with the site's
            arrow beside the name and no words about it: the arrow says it. */}
        {brand.page ? (
          <Link href={brand.page} className="group inline-flex items-center gap-3 underline-offset-8 hover:underline">
            {brand.name}
            <ArrowIcon className="h-[0.42em] w-[0.42em] transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        ) : (
          brand.name
        )}
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
        <ScrollPiece
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
          <ScrollPiece
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
          <ScrollPiece
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
  // The pictures move with the scroll - see ScrollPiece.
  useScrollPieces(sectionRef);

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


  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    foldHeading();
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
          // The line is cut in three for its two colours, and each piece's own
          // copy for a screen reader would be a fragment ("YE", then "S,"). So
          // the pieces are silent and the sentence is here once, whole.
          className="text-center font-display text-m-display font-extrabold tracking-tight text-heading-soft md:text-[clamp(48px,6.4vw,96px)] md:leading-[1.05]"
        >
          <span className="sr-only">Yes, that too.</span>
          <span className="block md:inline">
            <span className="text-black">
              <FoldText text="YE" silent />
            </span>
            <FoldText text="S," silent />
          </span>{" "}
          <span className="block md:inline">
            <FoldText text="THAT TOO." silent />
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
          the form it is meant to lead to. It is a passage, not an event.
          A BLACK TAPE WITH THE LINE ON IT: the mark and the stars in full
          white, the rest of the line in a SOLID grey - never a see-through
          white: on a curve the letters lap over one another, and where two
          see-through shapes cross they add up, so the dimmed type looked
          printed twice on a phone. The desk has its own lighter grey, the one
          it was approved in (tape-dim), solid as well, so that no browser's
          spacing of letters on a curve can change it. It is the heading's own emphasis, turned over for a dark
          ground. The mark in grey read as switched off and broke YEP in two.
          All in grey on white it was faint; a straight black band would
          have put a rectangle where the curve was chosen to avoid one.
          The phone draws it in a narrower box, which is what brings the type
          up to a size worth reading there. */}
      <div className="-mx-6 mt-16 overflow-x-clip text-neutral-400 md:mt-24 md:text-tape-dim">
        <CurvedLoop
          text={DESIGN_LOOP_TEXT}
          highlight={DESIGN_LOOP_MARKS}
          highlightClassName="fill-white"
          ribbonClassName="stroke-black"
          className="font-display font-extrabold [word-spacing:0.12em]"
          // Not to be taken hold of: it is a line running in the background,
          // and a line that can be dragged is a control.
          interactive={false}
          {...(isMobile
            ? { span: 560, fontSize: 68, curveAmount: 220, speed: 115 }
            : { fontSize: 62, curveAmount: 200, speed: 80 })}
        />
      </div>
    </section>
  );
}
