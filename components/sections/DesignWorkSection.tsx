"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import ExternalNote from "@/components/ui/ExternalNote";
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

// The order each piece takes in the phone's single column. The desk deals them
// into two columns (see BrandBlock) and these are what puts them back in the
// order they were listed.
const PHONE_ORDER = ["order-1", "order-2", "order-3", "order-4", "order-5", "order-6"];

function Piece({ piece, sizes, className }: { piece: DesignPiece; sizes: string; className?: string }) {
  return (
    <figure data-design-piece className={className}>
      <Image
        src={piece.src}
        alt={piece.alt}
        width={piece.width}
        height={piece.height}
        sizes={sizes}
        className="h-auto w-full rounded-[14px]"
      />
    </figure>
  );
}

function BrandHeader({ brand, className }: { brand: DesignBrand; className?: string }) {
  return (
    <header className={className}>
      <h3 className="font-display text-m-title font-extrabold tracking-tight text-black md:text-[44px] md:leading-[1.1]">
        {brand.name}
      </h3>
      <p className="mt-2 font-body text-m-body text-black/55 md:text-[17px]">{brand.line}</p>
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
      <div ref={blockRef} className="md:grid md:grid-cols-12 md:items-end md:gap-x-10">
        <BrandHeader brand={brand} className="md:col-span-4 md:pb-2" />
        <Piece
          piece={brand.pieces[0]}
          sizes="(max-width: 768px) 100vw, 58vw"
          className="mt-8 md:col-span-8 md:mt-0"
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
    <div ref={blockRef} className="flex flex-col md:grid md:grid-cols-12 md:gap-x-10">
      <div className="contents md:col-span-5 md:block">
        <BrandHeader brand={brand} className="order-0" />
        {columns[0].map(({ piece, index }) => (
          <Piece
            key={piece.src}
            piece={piece}
            sizes="(max-width: 768px) 90vw, 38vw"
            className={cn(
              PHONE_ORDER[index],
              "mt-8 md:mt-20",
              // A square is stepped to one side on a phone; a wide one runs
              // the full width.
              piece.width === piece.height && (index % 2 === 0 ? "w-[86%] self-start" : "w-[86%] self-end"),
              "md:w-full",
            )}
          />
        ))}
      </div>
      {/* Starts lower than the first column and never lines up with it. */}
      <div ref={driftRef} className="contents will-change-transform md:col-span-6 md:col-start-7 md:mt-56 md:block">
        {columns[1].map(({ piece, index }, place) => (
          <Piece
            key={piece.src}
            piece={piece}
            sizes="(max-width: 768px) 90vw, 44vw"
            className={cn(
              PHONE_ORDER[index],
              "mt-8",
              place > 0 && "md:mt-20",
              place === 0 && "md:mt-0",
              piece.width === piece.height && (index % 2 === 0 ? "w-[86%] self-start" : "w-[86%] self-end"),
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

  // EACH PICTURE ARRIVES ONCE, as it comes up, and then it is simply there.
  // With less motion nothing is hidden to begin with: the site's calm fade
  // takes pictures by itself (CalmMotion).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    for (const piece of section.querySelectorAll("[data-design-piece]")) observer.observe(piece);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="design"
      aria-labelledby="design-heading"
      className={cn(
        "relative bg-white px-6 pt-24 pb-16 md:pt-40 md:pb-32",
        !prefersReducedMotion &&
          "[&_[data-design-piece]]:translate-y-6 [&_[data-design-piece]]:opacity-0 [&_[data-design-piece]]:transition-[opacity,translate] [&_[data-design-piece]]:duration-700 [&_[data-design-piece]]:ease-out [&_[data-design-piece][data-seen]]:translate-y-0 [&_[data-design-piece][data-seen]]:opacity-100",
      )}
    >
      <div className="mx-auto max-w-[1400px]">
        {/* The one heading on the site in English, and the mark is in it: the
            YE of YES in black, the rest of the line stepped back to grey. Two
            lines on a phone, where one would not fit at this size. */}
        <h2
          id="design-heading"
          lang="en"
          dir="ltr"
          className="text-center font-display text-m-display font-extrabold tracking-tight text-black/30 md:text-[clamp(40px,5.2vw,78px)] md:leading-[1.05]"
        >
          <span className="block md:inline">
            <span className="text-black">YE</span>S,
          </span>{" "}
          <span className="block md:inline">THAT TOO.</span>
        </h2>

        {designWork.map((brand, index) => (
          <div key={brand.name} className={index === 0 ? "mt-16 md:mt-28" : "mt-28 md:mt-48"}>
            <BrandBlock brand={brand} drifts={!isMobile && !prefersReducedMotion} />
          </div>
        ))}
      </div>
    </section>
  );
}
