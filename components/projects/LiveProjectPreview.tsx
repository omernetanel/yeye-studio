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
              view === "desktop" ? "bg-accent text-white" : "text-black/50 hover:text-black/80"
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
              view === "mobile" ? "bg-accent text-white" : "text-black/50 hover:text-black/80"
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
            : "aspect-[9/19.5] w-[300px] rounded-[2.75rem] border-[10px] border-[#1a1a1a]"
        )}
      >
        {(view === "desktop" || !hasUrl) && (
          <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-black/10 bg-black/[0.03] px-4" dir="ltr">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          {hasUrl && loaded && (
            <iframe src={url} title={title} className="h-full w-full border-0" loading="eager" referrerPolicy="no-referrer" />
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

          {view === "mobile" && hasUrl && loaded && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2">
                <div className="h-6 w-24 rounded-full bg-[#1a1a1a]" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
                <div className="h-1 w-28 rounded-full bg-white/40" />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {hasUrl && (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-display text-sm text-black/40 transition-colors hover:text-accent"
        >
          <ExternalLink size={14} />
          פתח את האתר בלשונית חדשה
        </Link>
      )}
    </div>
  );
}
