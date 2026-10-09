"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Monitor, Play, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveProjectPreviewProps {
  url: string;
  title: string;
  fallbackImage: string;
}

type View = "desktop" | "mobile";

/**
 * The project stays embedded live, in-page — no need to leave YEYE Digital
 * to see it work. The mobile toggle doesn't fake a phone screenshot: it
 * actually resizes the iframe's viewport to phone width, so the embedded
 * site's own responsive breakpoints kick in for real.
 */
export default function LiveProjectPreview({ url, title, fallbackImage }: LiveProjectPreviewProps) {
  const [view, setView] = useState<View>("desktop");
  // The iframe only mounts after an explicit click. Loading it eagerly meant
  // a visitor scrolling the page with their cursor over the panel would get
  // their scroll captured by the embedded site instead of the page — a
  // click-to-load gate keeps the page scrollable until they actually mean
  // to interact with the embedded site.
  const [loaded, setLoaded] = useState(false);
  // Only ever hand an http(s) URL to the iframe src or the "open in a new
  // tab" link — guards against a stray javascript: or data: scheme ending up
  // somewhere it could execute, in case a future project entry gets a typo.
  const hasUrl = /^https?:\/\//i.test(url.trim());

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {hasUrl && (
        <div className="inline-flex rounded-full border border-black/10 bg-black/[0.02] p-1">
          <button
            type="button"
            onClick={() => setView("desktop")}
            aria-pressed={view === "desktop"}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors",
              view === "desktop" ? "bg-accent text-white" : "text-black/70 hover:text-black"
            )}
          >
            <Monitor size={16} /> מחשב
          </button>
          <button
            type="button"
            onClick={() => setView("mobile")}
            aria-pressed={view === "mobile"}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors",
              view === "mobile" ? "bg-accent text-white" : "text-black/70 hover:text-black"
            )}
          >
            <Smartphone size={16} /> מובייל
          </button>
        </div>
      )}

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "relative flex flex-col overflow-hidden bg-black/[0.04] shadow-[0_20px_50px_rgba(0,0,0,0.12)]",
          view === "desktop" || !hasUrl
            ? "aspect-[16/10] w-full max-w-[1100px] rounded-2xl border border-black/10"
            : // THE PHONE IS A DRAWING; THE SITE INSIDE IT IS A REAL PHONE'S WIDTH.
              // A dark handset with rounded shoulders, and inside it a plain
              // rectangular screen at 9:16 - no notch and no home bar laid over
              // the site, and no rounded corners cutting into it.
              // The screen is 288px wide on the page, but the site is not
              // rendered at 288: it is rendered at 405x720 and scaled down to
              // fit (see the iframe below). At the handset's own width it broke
              // its lines where no phone does; shown at a phone's true size
              // instead, it was far too tall and had no handset round it.
              // The 12px of padding is what keeps the square screen inside the
              // rounded shell: any less and the shell's curve would cut it.
              "h-[536px] w-[312px] rounded-[2rem] bg-neutral-900 p-3"
        )}
      >
        {(view === "desktop" || !hasUrl) && (
          <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-black/10 bg-black/[0.03] px-4" dir="ltr">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
          </div>
        )}

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {hasUrl && loaded && (
            <iframe
              src={url}
              title={title}
              // In the phone: the site's own viewport is 405x720 - a phone's width,
              // with room for a scrollbar where the browser draws one - and
              // the whole thing is scaled by 288/405 to sit in the drawn
              // screen. Pinned to a corner so the scale has one fixed point.
              className={cn(
                "border-0",
                view === "mobile"
                  ? "absolute top-0 left-0 h-[720px] w-[405px] max-w-none origin-top-left scale-[0.7111]"
                  : "h-full w-full",
              )}
              loading="eager"
              referrerPolicy="no-referrer"
            />
          )}

          {(!hasUrl || !loaded) && (
            <Image
              src={fallbackImage}
              alt={title}
              fill
              sizes="(max-width: 1100px) 100vw, 1100px"
              className="object-contain"
            />
          )}

          {hasUrl && !loaded && (
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-center transition-colors hover:bg-black/25"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_30px_rgba(74,74,74,0.5)]">
                <Play size={22} fill="currentColor" className="mr-[-2px]" />
              </span>
              <span className="font-display text-sm font-semibold text-white">זהו אתר חי ומגיב</span>
              <span className="max-w-[240px] font-body text-xs leading-[1.6] text-white/60">
                לחצו כדי לטעון אותו ולגלול בתוכו בחופשיות
              </span>
            </button>
          )}

        </div>
      </motion.div>

      {hasUrl && (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-display text-sm text-black/70 transition-colors hover:text-accent"
        >
          <ExternalLink size={14} />
          לפתוח את האתר בלשונית חדשה
        </Link>
      )}
    </div>
  );
}
