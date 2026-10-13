import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The dark card the service pages are built from: charcoal, a step lighter
 * than black, with nothing turning round its edge.
 *
 * These were the home page's glowing cards (BorderGlowCard). A dozen of them
 * down a white page were the heaviest thing on it at full black, and once
 * they were lightened the light travelling round the border could not be
 * seen against them at all.
 *
 * Inside a SwipeCarousel a card still stands back by how far it is from the
 * middle: the carousel writes --card-scale on every slide, as it does for the
 * glowing cards.
 */
export default function ServiceCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl bg-neutral-800 [transform:scale(var(--card-scale,1))]", className)}>
      {children}
    </div>
  );
}
