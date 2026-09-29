"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SITE_BACKGROUND } from "@/lib/site";

// The sheet's box: the photograph's own 430:560 at the column's 400px, plus
// the 24px the crumple keeps clear on every side.
const SHEET_W = 400;
const SHEET_H = Math.round((SHEET_W * 560) / 430);
const STAGE_RATIO = `${SHEET_W + 48} / ${SHEET_H + 48}`;

/** The photograph as the crumple lays it out, for while three.js is loading. */
function Still({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: STAGE_RATIO }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={430}
        height={560}
        className="absolute top-1/2 left-1/2 block w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2"
        draggable={false}
      />
    </div>
  );
}

// three.js is heavy and only this page uses it, so it arrives with the page
// and not before; until then the still stands in, laid out the same.
const PaperCrumple = dynamic(() => import("@/components/ui/PaperCrumple"), {
  ssr: false,
  loading: () => <Still src="/images/portrait.webp" alt="" />,
});

/**
 * The about page's photograph, which crumples like paper while it is held and
 * can be played with anywhere on the screen, and opens out back in its place
 * when let go. A wink, like the aside about the name - so the hint under it
 * says so once, and goes the moment someone has tried it.
 *
 * With less motion it is just the photograph.
 */
export default function CrumplePortrait({ src, alt }: { src: string; alt: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [tried, setTried] = useState(false);

  if (prefersReducedMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={430}
        height={560}
        className="block h-auto max-h-[70svh] w-auto max-w-full rounded-2xl"
        draggable={false}
      />
    );
  }

  return (
    <>
      <PaperCrumple
        src={src}
        alt={alt}
        width={SHEET_W}
        height={SHEET_H}
        // The back of the sheet is the page's own white.
        paperColor={SITE_BACKGROUND}
        onStateChange={(state) => {
          if (state === "holding") setTried(true);
        }}
        style={{ height: "auto", aspectRatio: STAGE_RATIO }}
      />
      <p
        aria-hidden="true"
        className={`text-center font-body text-m-small text-black/45 transition-opacity duration-300 ${
          tried ? "opacity-0" : "opacity-100"
        }`}
      >
        תנסו ללחוץ ולהחזיק אותי
      </p>
    </>
  );
}
