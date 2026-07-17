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
    <div className={className}>
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
