"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  children: ReactNode[];
  className?: string;
  /** Width of each slide as a Tailwind arbitrary basis, e.g. "85%". */
  slideWidth?: string;
}

/**
 * Touch-native horizontal browsing (CSS scroll-snap, no extra dependency)
 * with a synced dot indicator — the mobile-specific alternative to a
 * stacked grid, used by sections where the desktop layout is a row of
 * cards.
 */
export default function SwipeCarousel({ children, className, slideWidth = "85%" }: SwipeCarouselProps) {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = itemRefs.current.findIndex((el) => el === entry.target);
          if (index !== -1) setActive(index);
        });
      },
      { threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [children.length]);

  return (
    // overflow-x-clip (not hidden) on the outer box: the track below is
    // deliberately 48px wider than its parent so the slides can bleed to the
    // screen edges, and without a clip here that extra width lands on the
    // document. Under dir="rtl" that does not just add a scrollbar — it moves
    // the whole page's paint origin sideways, which is what put a strip of
    // page background down the left of every section on mobile.
    //
    // clip rather than hidden because hidden makes this a scroll container,
    // and this site pins several sections with position: sticky, which stops
    // engaging inside one.
    <div className={cn("overflow-x-clip", className)}>
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1">
        {children.map((child, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="shrink-0 snap-center"
            style={{ width: slideWidth }}
          >
            {child}
          </div>
        ))}
      </div>

      {children.length > 1 && (
        <div className="mt-5 flex justify-center gap-1.5">
          {children.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-primary transition-all duration-300",
                i === active ? "w-6" : "w-1.5 bg-white/15"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
