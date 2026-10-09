"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BatteryFull, ExternalLink, Monitor, Play, Signal, Smartphone, Wifi } from "lucide-react";
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
  // The handset is drawn only round a real site: with no address the picture
  // stands in the browser frame, whichever view is chosen.
  const phone = view === "mobile" && hasUrl;

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
          "relative flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.12)]",
          phone
            ? // AN IPHONE, DRAWN: its proportions (300 x 618, the 71.6 x 147.6mm
              // of the real one), a metal band with its buttons, and a screen
              // with the island in the status bar. A 9:16 slab with a thick
              // dark edge read as a music player.
              "h-[618px] w-[300px] rounded-[2.9rem] bg-neutral-800 p-[11px] ring-1 ring-black/40"
            : "aspect-[16/10] w-full max-w-[1100px] overflow-hidden rounded-2xl border border-black/10 bg-black/[0.04]"
        )}
      >
        {/* The band's buttons: the action button and the two volume keys on one
            side, the side button on the other. Decoration, like the rest of
            the handset. */}
        {phone && (
          <div aria-hidden="true">
            <span className="absolute top-[104px] -left-[2px] h-[22px] w-[3px] rounded-l bg-neutral-700" />
            <span className="absolute top-[148px] -left-[2px] h-[40px] w-[3px] rounded-l bg-neutral-700" />
            <span className="absolute top-[198px] -left-[2px] h-[40px] w-[3px] rounded-l bg-neutral-700" />
            <span className="absolute top-[168px] -right-[2px] h-[64px] w-[3px] rounded-r bg-neutral-700" />
          </div>
        )}

        {/* THE SCREEN. On the phone it is three strips, the way the real one is
            laid out: the status bar with the island in it, the site, and the
            home indicator's strip. THE SITE HAS THE MIDDLE TO ITSELF - a plain
            rectangle with nothing over it. The island and the bar are in strips
            of their own, where they are on a phone, instead of laid on top of
            the page as they were. Only the screen's outer corners are round. */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            phone && "rounded-[2.2rem] bg-black",
          )}
        >
          {phone ? (
            <div
              aria-hidden="true"
              dir="ltr"
              className="relative flex h-[38px] shrink-0 items-center justify-between px-6 font-display text-[11px] font-semibold text-white"
            >
              <span>9:41</span>
              <span className="absolute top-[9px] left-1/2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-neutral-900 ring-1 ring-white/5" />
              <span className="flex items-center gap-1">
                <Signal size={11} strokeWidth={2.5} />
                <Wifi size={11} strokeWidth={2.5} />
                <BatteryFull size={15} strokeWidth={2} />
              </span>
            </div>
          ) : (
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
                // In the phone the site's own viewport is 410 x 797 - an iPhone's
                // 393 and the 17 a desktop browser takes for its scrollbar, so
                // that the page itself still has the full 393 and does not
                // scroll sideways - an
                // iPhone's screen less its two strips - and the whole of it is
                // scaled by 278/410 to sit in the drawn one. So its lines break
                // where they do on a phone, which at the drawing's own width
                // they did not. Pinned to a corner so the scale has one fixed
                // point.
                className={cn(
                  "border-0",
                  phone
                    ? "absolute top-0 left-0 h-[797px] w-[410px] max-w-none origin-top-left scale-[0.678]"
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

          {phone && (
            <div aria-hidden="true" className="flex h-[18px] shrink-0 items-center justify-center">
              <span className="h-[4px] w-[96px] rounded-full bg-white/70" />
            </div>
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
