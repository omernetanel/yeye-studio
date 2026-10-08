"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ExternalNote from "@/components/ui/ExternalNote";
import FlexCarousel, { type FlexCarouselHandle } from "@/components/ui/FlexCarousel";
import { projects } from "@/lib/projects";
import { PROJECTS_HEADING } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// The name of a piece, wherever it is printed: as a link where the piece opens
// something, as plain type where it does not.
const TITLE_CLASS = "font-display text-m-sub font-bold text-black md:text-[22px]";

// Four real projects today, and nothing here is written for four: the row takes
// its count from this array and wraps by it, and the project pages are built
// from the same file. Adding work is adding an entry to lib/projects.
const entries = projects.map((project) => ({
  src: project.image,
  alt: project.cardTitle ?? project.title,
  title: project.cardTitle ?? project.title,
  category: project.cardCategory ?? project.category,
  href: project.external ? project.url : `/projects/${project.slug}`,
  // Really another site, and not merely "has no page here": one piece is marked
  // external and still points at an address on this one.
  leavesSite: Boolean(project.external) && project.url.startsWith("http"),
  // And whether it has a page of its own here. Neither is true of a piece that
  // is marked external but has no live address yet: it gets no note at all.
  hasPage: !project.external,
  // And so, whether there is anywhere to go at all. A piece that neither
  // leaves the site nor has a page here is shown and is not a link: pressed,
  // it led to a page that does not exist.
  opens: !project.external || project.url.startsWith("http"),
}));

/**
 * The work, as one row under glass, and the caption of whichever piece is in
 * the middle. Desktop and phone share it; only the size of the stage differs.
 *
 * The caption is HTML, not paint: the name is a real link a keyboard and a
 * screen reader can reach, and the canvas above is only the picture of it.
 */
export default function ProjectsCarousel({
  stageClassName,
  cardHeight = 0.7,
  bend,
  dispersion,
  wheelZone,
  contain,
  blur,
  sideOpacity,
  edgeDim,
  overdraw,
}: {
  stageClassName: string;
  cardHeight?: number;
  bend?: number;
  dispersion?: number;
  wheelZone?: number;
  contain?: boolean;
  blur?: number;
  sideOpacity?: number;
  edgeDim?: number;
  overdraw?: number;
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const carouselRef = useRef<FlexCarouselHandle>(null);
  const current = entries[active];

  const open = (index: number) => {
    const entry = entries[index];
    if (!entry.opens) return;
    if (entry.leavesSite) window.open(entry.href, "_blank", "noopener,noreferrer");
    else router.push(entry.href);
  };

  // WITH LESS MOTION, NO CAROUSEL AT ALL: every piece at once, still, whole.
  // The row exists to move - bend, drift, swap - and a reader who asked for
  // less of that should not have to step through the work one card at a time
  // to see it. Two columns on the desk, one on a phone; each card a plain link.
  if (prefersReducedMotion) {
    return (
      <ul className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 px-6 md:grid-cols-2 md:gap-10">
        {entries.map((entry) => {
          const card = (
            <>
              <Image
                src={entry.src}
                alt={entry.alt}
                width={1672}
                height={941}
                sizes="(min-width: 768px) 540px, 100vw"
                className="block aspect-[1672/941] w-full rounded-2xl object-cover"
              />
              <span
                className={`mt-4 block ${TITLE_CLASS} ${entry.opens ? "underline-offset-4 group-hover:underline" : ""}`}
              >
                {entry.title}
              </span>
              <span className="mt-1 block font-body text-m-small text-black/55 md:text-[15px]">{entry.category}</span>
              {(entry.leavesSite || entry.hasPage) && (
                <ExternalNote inSite={entry.hasPage} className="mt-1.5 text-black/50" />
              )}
            </>
          );
          return (
            <li key={entry.href}>
              {entry.opens ? (
                <Link
                  href={entry.href}
                  target={entry.leavesSite ? "_blank" : undefined}
                  rel={entry.leavesSite ? "noopener noreferrer" : undefined}
                  className="group block text-right"
                >
                  {card}
                </Link>
              ) : (
                // Shown, with nowhere to open: a card and not a link.
                <div className="text-right">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <FlexCarousel
        items={entries}
        // The section's own heading, so a screen reader names the region the
        // way the page does.
        label={PROJECTS_HEADING.join(" ")}
        cardHeight={cardHeight}
        wheelZone={wheelZone}
        contain={contain}
        blur={blur}
        sideOpacity={sideOpacity}
        edgeDim={edgeDim}
        overdraw={overdraw}
        gap={16}
        radius={16}
        // An upright, nearly square pane taller than the row, sized from the
        // centred card: its edges fall only on the cards beside it, so the
        // piece being read stays straight and only its neighbours curve away.
        tilt={0}
        roundness={0.2}
        lensHeight={1.6}
        reach={0.2}
        bend={bend}
        dispersion={dispersion}
        flatMargin={12}
        rtl
        reducedMotion={prefersReducedMotion}
        ref={carouselRef}
        onChange={setActive}
        onSelect={open}
        className={stageClassName}
      />

      {/* relative: painted over a canvas that reaches down behind it. */}
      <div className="relative mt-6 flex flex-col items-center px-6 text-center md:mt-0">
        {/* Straight under the picture, in the gap that was already there, and
            out of the flow: as a line of its own under the category it pushed
            the arrows down, and the caption was right as it stood. */}
        <ExternalNote
          shown={current.leavesSite || current.hasPage}
          inSite={current.hasPage}
          href={current.href}
          className="absolute -top-[21px] left-1/2 -translate-x-1/2 whitespace-nowrap text-black/50"
        />
        {current.opens ? (
          <Link
            href={current.href}
            target={current.leavesSite ? "_blank" : undefined}
            rel={current.leavesSite ? "noopener noreferrer" : undefined}
            className={`${TITLE_CLASS} underline-offset-4 hover:underline`}
          >
            {current.title}
          </Link>
        ) : (
          // Shown, with nowhere to open: its name is a name and not a link.
          <span className={TITLE_CLASS}>{current.title}</span>
        )}
        <span className="mt-1 font-body text-m-small text-black/55 md:text-[15px]">{current.category}</span>

        {/* Previous, where you are, next. The arrows are real buttons, for
            everyone who does not drag, swipe or scroll a wheel sideways - and
            the row itself is laid right to left, so the "next" arrow on the
            left brings the next piece in from the left, where the circles
            count on to. The circles are the site's one indicator: 10px, the
            current one black, decoration for sighted readers. */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => carouselRef.current?.step(-1)}
            aria-label="העבודה הקודמת"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black transition-colors duration-200 hover:border-black hover:bg-black hover:text-white"
          >
            <ChevronRight aria-hidden size={18} strokeWidth={2} />
          </button>
          <div aria-hidden="true" className="flex items-center gap-2.5">
            {entries.map((entry, index) => (
              <span
                key={entry.href}
                className={`block h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
                  index === active ? "bg-black" : "bg-black/20"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => carouselRef.current?.step(1)}
            aria-label="העבודה הבאה"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black transition-colors duration-200 hover:border-black hover:bg-black hover:text-white"
          >
            <ChevronLeft aria-hidden size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
