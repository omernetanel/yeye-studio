"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FlexCarousel from "@/components/ui/FlexCarousel";
import { projects } from "@/lib/projects";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Four real projects today, and nothing here is written for four: the row takes
// its count from this array and wraps by it, and the project pages are built
// from the same file. Adding work is adding an entry to lib/projects.
const entries = projects.map((project) => ({
  src: project.image,
  alt: project.cardTitle ?? project.title,
  title: project.cardTitle ?? project.title,
  category: project.cardCategory ?? project.category,
  href: project.external ? project.url : `/projects/${project.slug}`,
  external: project.external,
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
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const current = entries[active];

  const open = (index: number) => {
    const entry = entries[index];
    if (entry.external) window.open(entry.href, "_blank", "noopener,noreferrer");
    else router.push(entry.href);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <FlexCarousel
        items={entries}
        label="עבודות נבחרות"
        cardHeight={cardHeight}
        wheelZone={wheelZone}
        contain={contain}
        blur={blur}
        sideOpacity={sideOpacity}
        edgeDim={edgeDim}
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
        reducedMotion={prefersReducedMotion}
        onChange={setActive}
        onSelect={open}
        className={stageClassName}
      />

      <div className="mt-6 flex flex-col items-center px-6 text-center">
        <Link
          href={current.href}
          target={current.external ? "_blank" : undefined}
          rel={current.external ? "noopener noreferrer" : undefined}
          className="font-display text-m-sub font-bold text-black underline-offset-4 hover:underline md:text-[22px]"
        >
          {current.title}
        </Link>
        <span className="mt-1 font-body text-m-small text-black/55 md:text-[15px]">{current.category}</span>

        {/* Where you are in the work: a 10px circle per piece, the current one
            black. The same indicator as the stages on the paper above, so it
            reads as one thing across the site. */}
        <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-2.5">
          {entries.map((entry, index) => (
            <span
              key={entry.href}
              className={`block h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
                index === active ? "bg-black" : "bg-black/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
