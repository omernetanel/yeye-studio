"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  children: ReactNode[];
  className?: string;
  /** Width of each slide as a Tailwind arbitrary basis, e.g. "85%". */
  slideWidth?: string;
  /**
   * Which ground the dots are sitting on. The default grey reads as a marker on
   * a white section and all but disappears on a black one.
   */
  tone?: "light" | "dark";
  /**
   * Centres every slide, the first and the last included, by padding the track
   * with half the space a slide leaves over. Without it a scroller cannot bring
   * its first slide to the middle — there is nothing to its side to scroll — so
   * `snap-center` parks it against the edge and the peek is one-sided.
   */
  centred?: boolean;
}

/**
 * Touch-native horizontal browsing (CSS scroll-snap, no extra dependency)
 * with a synced dot indicator — the mobile-specific alternative to a
 * stacked grid, used by sections where the desktop layout is a row of
 * cards.
 */
export default function SwipeCarousel({
  children,
  className,
  slideWidth = "85%",
  tone = "light",
  centred = false,
}: SwipeCarouselProps) {
  // Half of what a slide leaves over, so the middle of a slide meets the middle
  // of the screen — in the SAME unit the width came in.
  //
  // That unit has to be vw, not per cent, and this is the trap: a slide's per
  // cent resolves against the track's content box, which this padding has just
  // made narrower, so the slides come out smaller than asked and the sums stop
  // adding up to a screen. Against the viewport both sides are measuring the
  // same thing.
  const sideUnit = slideWidth.replace(/[\d.\s]/g, "") || "%";
  const sidePadding = centred ? `${(100 - parseFloat(slideWidth)) / 2}${sideUnit}` : undefined;
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
      <div
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1",
          centred ? "" : "-mx-6 px-6"
        )}
        style={centred ? { paddingInline: sidePadding } : undefined}
      >
        {children.map((child, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            // Which slide is the one being read. Published as an attribute
            // rather than a class so a slide's own design decides what to do
            // with it — the claim cards light their border only here.
            data-active={i === active}
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
              // On a dark ground the dots stay round and all one size — three
              // of them, saying how many cards there are. The light version
              // stretches the active one into a bar, which reads as a progress
              // track rather than as a count.
              className={cn(
                "rounded-full transition-all duration-300",
                tone === "dark"
                  ? cn("h-2 w-2", i === active ? "bg-white" : "bg-white/25")
                  : cn("h-1.5 bg-primary", i === active ? "w-6" : "w-1.5 bg-white/15")
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
