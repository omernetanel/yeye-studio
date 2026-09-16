"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  children: ReactNode[];
  className?: string;
  /** Width of each slide, e.g. "85%" or "72vw". */
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
  /** Which slide the carousel opens on, centred. */
  initialIndex?: number;
  /**
   * Repeats the slides either side and slips back to the middle copy when the
   * reader reaches an end, so the row has no first and no last.
   */
  loop?: boolean;
  /**
   * How small a slide gets at the edge of the track. 1 keeps every slide the
   * same size; the default stands the outer ones back a little, which on a flat
   * row reads as depth.
   */
  minScale?: number;
}

/**
 * Touch-native horizontal browsing (CSS scroll-snap, no extra dependency) with
 * a synced dot indicator — the mobile-specific alternative to a stacked grid,
 * used by sections where the desktop layout is a row of cards.
 *
 * Two things here follow the finger rather than the settled state: the scale of
 * each slide, written as a custom property from its distance to the middle of
 * the track, and `data-active`, which a slide's own design can style. Both are
 * updated on scroll, in one rAF per frame.
 */
export default function SwipeCarousel({
  children,
  className,
  slideWidth = "85%",
  tone = "light",
  centred = false,
  initialIndex = 0,
  loop = false,
  minScale = 0.88,
}: SwipeCarouselProps) {
  const count = children.length;
  // Three copies when looping: one to scroll back into, the one being read, and
  // one to scroll forward into. Any fewer and an end is reachable.
  const slides = loop ? [...children, ...children, ...children] : children;
  const startIndex = loop ? count + initialIndex : initialIndex;

  const [active, setActive] = useState(startIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);

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

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const centreOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    };

    /** Scale, nearness and the active index, all from one set of measurements. */
    const measure = () => {
      frameRef.current = null;
      const trackRect = track.getBoundingClientRect();
      const middle = trackRect.left + trackRect.width / 2;
      // The distance at which a slide has receded as far as it goes: one slide
      // plus its gap, so the neighbours sit at the far end of the range and
      // anything beyond them is simply at minimum.
      const span = itemRefs.current[0]?.offsetWidth || trackRect.width;

      let nearestIndex = 0;
      let nearestDistance = Infinity;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const distance = Math.abs(centreOf(item) - middle);
        const near = Math.max(0, 1 - distance / span);
        item.style.setProperty("--card-scale", String(minScale + (1 - minScale) * near));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      itemRefs.current.forEach((item, index) => {
        if (item) item.dataset.active = String(index === nearestIndex);
      });
      setActive(nearestIndex);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(measure);
    };

    // The opening position, moved by a measured distance rather than set as a
    // scrollLeft figure: RTL reports that differently across engines, where the
    // gap between two elements' rects is the same number everywhere.
    const start = itemRefs.current[startIndex];
    if (start) {
      const trackRect = track.getBoundingClientRect();
      track.scrollBy({
        left: centreOf(start) - (trackRect.left + trackRect.width / 2),
        behavior: "instant",
      });
    }
    measure();

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [count, loop, minScale, startIndex]);

  // THE SLIP BACK TO THE MIDDLE COPY, once the reader has settled on a slide in
  // one of the outer ones. Done here rather than in the scroll handler so it
  // never moves the track while a finger is still on it: React has re-rendered
  // with the new active index by the time this runs.
  useEffect(() => {
    if (!loop) return;
    const track = trackRef.current;
    if (!track) return;
    if (active >= count && active < count * 2) return;
    const twin = itemRefs.current[(active % count) + count];
    const current = itemRefs.current[active];
    if (!twin || !current) return;
    const delta =
      twin.getBoundingClientRect().left - current.getBoundingClientRect().left;
    track.scrollBy({ left: delta, behavior: "instant" });
  }, [active, count, loop]);

  const activeDot = active % count;

  return (
    // overflow-x-clip (not hidden) on the outer box: the track below can be
    // wider than its parent so the slides bleed to the screen edges, and
    // without a clip here that extra width lands on the document. Under
    // dir="rtl" that does not just add a scrollbar — it moves the whole page's
    // paint origin sideways, which is what put a strip of page background down
    // the left of every section on mobile.
    //
    // clip rather than hidden because hidden makes this a scroll container, and
    // this site pins several sections with position: sticky, which stops
    // engaging inside one.
    <div className={cn("overflow-x-clip", className)}>
      <div
        ref={trackRef}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1",
          centred ? "" : "-mx-6 px-6"
        )}
        style={centred ? { paddingInline: sidePadding } : undefined}
      >
        {slides.map((child, i) => (
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

      {count > 1 && (
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
                  ? cn("h-2 w-2", i === activeDot ? "bg-white" : "bg-white/25")
                  // The resting dots were white at 15% — invisible on the white
                  // pages this tone is for, so only the active one ever showed.
                  : cn("h-1.5", i === activeDot ? "w-6 bg-black" : "w-1.5 bg-black/20")
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
