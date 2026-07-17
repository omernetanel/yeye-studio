"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveProjectPreviewProps {
  url: string;
  title: string;
  fallbackImage: string;
}

type View = "desktop" | "mobile";

/**
 * The project stays embedded live, in-page — no need to leave YEYE LABS
 * to see it work. The mobile toggle doesn't fake a phone screenshot: it
 * actually resizes the iframe's viewport to phone width, so the embedded
 * site's own responsive breakpoints kick in for real.
 */
export default function LiveProjectPreview({ url, title, fallbackImage }: LiveProjectPreviewProps) {
  const [view, setView] = useState<View>("desktop");
  const hasUrl = url.trim().length > 0;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {hasUrl && (
        <div className="inline-flex rounded-full border border-white/10 bg-surface p-1">
          <button
            type="button"
            onClick={() => setView("desktop")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors",
              view === "desktop" ? "bg-primary text-white" : "text-white/50 hover:text-white/80"
            )}
          >
            <Monitor size={16} /> מחשב
          </button>
          <button
            type="button"
            onClick={() => setView("mobile")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors",
              view === "mobile" ? "bg-primary text-white" : "text-white/50 hover:text-white/80"
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
          "relative flex flex-col overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          view === "desktop" || !hasUrl
            ? "aspect-[16/10] w-full max-w-[900px] rounded-2xl border border-white/10"
            : "aspect-[9/19.5] w-[300px] rounded-[2.75rem] border-[10px] border-[#1a1a1a]"
        )}
      >
        {(view === "desktop" || !hasUrl) && (
          <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-white/10 bg-[#161616] px-4" dir="ltr">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
            <span className="mx-auto rounded-full bg-white/5 px-4 py-1 font-mono text-[11px] text-white/30">
              {hasUrl ? url.replace(/^https?:\/\//, "") : "coming-soon.yeyelabs.com"}
            </span>
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          {hasUrl ? (
            <iframe src={url} title={title} className="h-full w-full border-0" loading="lazy" />
          ) : (
            <Image
              src={fallbackImage}
              alt={title}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              className="object-cover object-top"
            />
          )}

          {view === "mobile" && hasUrl && (
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
          className="flex items-center gap-1.5 font-display text-sm text-white/40 transition-colors hover:text-primary-light"
        >
          <ExternalLink size={14} />
          פתח את האתר בלשונית חדשה
        </Link>
      )}
    </div>
  );
}
