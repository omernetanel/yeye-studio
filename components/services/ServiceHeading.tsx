"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { setFold } from "@/components/ui/FoldText";
import FoldWords from "@/components/ui/FoldWords";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

// Where the heading's top is on the screen, as a share of its height, while
// its letters fold in: from just inside the bottom edge to past the middle.
const FOLD = [0.95, 0.55] as const;

/**
 * The heading over a section of a service page, at the site's own size and
 * with the site's own entrance: its letters fold in as it comes up the screen
 * and out again on the way back, like the headings on the home page.
 *
 * Every block on these pages used to carry its own copy of a 30px heading that
 * faded up once. Seven of those down one page is what made it read as an
 * encyclopaedia entry: nothing was larger than anything else.
 */
export default function ServiceHeading({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const move = () => {
    const heading = ref.current;
    if (!heading) return;
    const top = heading.getBoundingClientRect().top / window.innerHeight;
    setFold(heading, (FOLD[0] - top) / (FOLD[0] - FOLD[1]));
  };

  useLayoutEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    if (prefersReducedMotion) {
      setFold(heading, 1);
      return;
    }
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) move();
  });

  return (
    <h2
      ref={ref}
      className={cn(
        "text-center font-display text-m-title font-extrabold tracking-tight text-black md:text-[clamp(40px,4.4vw,64px)] md:leading-[1.1]",
        className,
      )}
    >
      <span className="sr-only">{children}</span>
      <FoldWords text={children} />
    </h2>
  );
}
