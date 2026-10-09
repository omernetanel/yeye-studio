"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { SITE_BACKGROUND } from "@/lib/site";
import { cn } from "@/lib/utils";

// The photograph's own shape, and the 24px the column keeps clear round it.
const PHOTO_W = 430;
const PHOTO_H = 560;
const MARGIN = 24;
const BOX_RATIO = `${400 + MARGIN * 2} / ${Math.round((400 * PHOTO_H) / PHOTO_W) + MARGIN * 2}`;

// The least the badge's stage reaches below the photograph, in px.
const REACH_BOTTOM = 160;
// On a phone: how far above the top of the badge the slot is that the band
// comes out of. The band is 10% of the badge across, and the slot a little
// wider (the class on it).
const SLOT_RISE = 100;
// How much of the photograph's place has to be on screen before the badge
// falls into it.
const IN_VIEW = 0.35;

// three.js is heavy and only this page uses it, so it arrives with the page
// and not before.
const Lanyard = dynamic(() => import("@/components/ui/Lanyard"), { ssr: false });

interface Stage {
  top: number;
  left: number;
  right: number;
  bottom: number;
  strapColor: string;
}

/**
 * The about page's photograph, as a name badge: it falls in from above on its
 * band and comes to rest exactly where the photograph stood, and can then be
 * pulled about, thrown and turned over. On a desk its band runs up off the
 * screen. On a phone that would be a long line down the whole screen, over the
 * text, so the band is short and comes out of a slot drawn in the page just
 * above the photograph. (A pair of bands in from the sides of the screen was
 * built first and turned down: two hoses across the text.)
 *
 * THE PLACE IS KEPT BY THE PHOTOGRAPH ITSELF, in the flow of the page and
 * unseen, so the badge changes nothing about the layout; the same image is
 * what a screen reader is given, and what is shown if the badge cannot be
 * drawn.
 *
 * With less motion it is just the photograph.
 */
export default function LanyardPortrait({ src, alt }: { src: string; alt: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const slotRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [reached, setReached] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [tried, setTried] = useState(false);

  // THE STAGE IS THE WHOLE SCREEN, so the badge can be pulled anywhere on it
  // and is never cut off: out to the edges of the screen at the sides - and no
  // further, which would give the page somewhere to scroll sideways to - up to
  // the top of the page, and down a screen's height. On a phone it is a
  // screen's height up and a little down: enough for the badge to come down
  // from above the screen and not from a line in the text.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const slot = slotRef.current;
    if (!slot) return undefined;
    const measure = () => {
      const rect = slot.getBoundingClientRect();
      const screen = document.documentElement.clientWidth;
      const fromTop = rect.top + window.scrollY;
      const next: Stage = {
        top: Math.round(Math.max(0, isMobile ? Math.min(fromTop, window.innerHeight) : fromTop)),
        left: Math.round(Math.max(0, rect.left)),
        right: Math.round(Math.max(0, screen - rect.right)),
        bottom: isMobile ? REACH_BOTTOM : Math.round(Math.max(REACH_BOTTOM, window.innerHeight - rect.height)),
        strapColor: getComputedStyle(document.documentElement).getPropertyValue("--color-black").trim(),
      };
      setStage((current) =>
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.right === next.right &&
        current.bottom === next.bottom
          ? current
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isMobile, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const slot = slotRef.current;
    if (!slot) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReached(true);
        observer.disconnect();
      },
      { threshold: IN_VIEW },
    );
    observer.observe(slot);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={PHOTO_W}
        height={PHOTO_H}
        className="block h-auto max-h-[70svh] w-auto max-w-full rounded-2xl"
        draggable={false}
      />
    );
  }

  return (
    <>
      {/* On a phone the slot and its short band need room of their own under
          the text. */}
      <div className="relative mt-14 w-full md:mt-0" style={{ aspectRatio: BOX_RATIO }}>
        <div
          ref={slotRef}
          className="absolute top-1/2 left-1/2 w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2"
        >
          {isMobile && !unavailable && (
            <span
              aria-hidden="true"
              className="absolute left-1/2 h-[7px] w-[17%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
              style={{ top: -SLOT_RISE }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={PHOTO_W}
            height={PHOTO_H}
            className={cn("block w-full motion-reduce:opacity-100", unavailable ? "opacity-100" : "opacity-0")}
            draggable={false}
          />
          {stage && reached && !unavailable && (
            <Lanyard
              // A stage of another size is another scene: the badge is hung anew.
              key={`${isMobile}-${stage.top}-${stage.left}-${stage.right}-${stage.bottom}`}
              frontImage={src}
              // The edge and the back of the card are the page's own white.
              cardColor={SITE_BACKGROUND}
              strapColor={stage.strapColor}
              aspect={PHOTO_W / PHOTO_H}
              inset={stage}
              rise={isMobile ? SLOT_RISE : undefined}
              cornerRadius={0.12}
              // On a phone the band is thinner and the air nearly still: a
              // card that keeps swinging there keeps covering the text.
              strapWidth={isMobile ? 0.5 : 0.6}
              breeze={isMobile ? 0.2 : 0.5}
              damping={isMobile ? 0.65 : 0.5}
              onUnavailable={() => setUnavailable(true)}
              onGrab={() => setTried(true)}
            />
          )}
        </div>
      </div>
      <p
        aria-hidden="true"
        className={cn(
          "text-center font-body text-m-small text-black/45 transition-opacity duration-300",
          tried || unavailable ? "opacity-0" : "opacity-100",
        )}
      >
        תנסו לתפוס ולמשוך אותי
      </p>
    </>
  );
}
