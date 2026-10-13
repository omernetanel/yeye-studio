"use client";

import { useLayoutEffect, type RefObject } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { setFold } from "@/components/ui/FoldText";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

// Where a folding line's top is on the screen, as a share of its height, while
// its letters fold in: from just inside the bottom edge to the middle.
const FOLD = [0.92, 0.5] as const;

/**
 * Folds in every `[data-fold-line]` inside `rootRef` as it comes up the screen
 * (see FoldText and FoldWords), and unfolds it again on the way back. With
 * less motion the lines simply stand open.
 */
export function useFoldLines(rootRef: RefObject<HTMLElement | null>) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const move = () => {
    const root = rootRef.current;
    if (!root) return;
    const screen = window.innerHeight;
    // Every box read before any style is written.
    const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-fold-line]"));
    const tops = lines.map((line) => line.getBoundingClientRect().top / screen);
    lines.forEach((line, index) => setFold(line, (FOLD[0] - tops[index]) / (FOLD[0] - FOLD[1])));
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion) {
      for (const line of root.querySelectorAll<HTMLElement>("[data-fold-line]")) setFold(line, 1);
      return;
    }
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
    // move reads the DOM at the moment it runs; it has nothing to be stale about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, rootRef]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) move();
  });
}
