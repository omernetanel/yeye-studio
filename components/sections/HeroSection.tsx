"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";
const SPOTLIGHT_RADIUS = 260;

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLHeadingElement>(null);

  const wipeInitial = prefersReducedMotion ? { clipPath: "inset(0 0 0 0%)" } : { clipPath: "inset(0 0 0 100%)" };

  // Direct DOM mutation instead of React state — this fires on every
  // pointermove, and re-rendering the component that often would be wasted
  // work for something that's purely a paint-time visual (the mask position).
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = wordmarkRef.current?.getBoundingClientRect();
    const glow = glowRef.current;
    if (!rect || !glow) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const mask = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${x}px ${y}px, black 0%, transparent 100%)`;
    glow.style.maskImage = mask;
    glow.style.webkitMaskImage = mask;
  };

  return (
    <section id="hero" className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-white pt-[100px] pb-8">
      <div className="mx-auto w-full max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="flex flex-col items-end gap-4 text-right"
        >
          <p className="font-display text-lg leading-snug font-semibold text-black md:text-xl">
            אני לא בונה אתרים יפים.
            <br />
            אני בונה אתרים שעובדים.
          </p>
          <Button href="/contact" variant="ghost" className="!border-black !bg-black !text-white hover:!scale-[1.03]">
            קבעו שיחה
          </Button>
        </motion.div>
      </div>

      <div
        ref={wordmarkRef}
        onPointerMove={handlePointerMove}
        className="group relative mx-auto w-full px-2 text-center select-none"
      >
        <motion.h1
          initial={wipeInitial}
          animate={{ clipPath: "inset(0 0 0 0%)" }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}
          className="font-display leading-none font-black tracking-tight whitespace-nowrap text-black"
          style={{ fontSize: "clamp(6rem, 30vw, 24rem)" }}
        >
          YEYE
        </motion.h1>

        {/* Gradient fill clipped to the exact glyph shapes via
            background-clip: text, then further masked to a soft circle that
            tracks the cursor (radial-gradient mask, position updated on
            pointermove) — a cursor-following spotlight reveal, YEYE's own
            colors and a from-scratch implementation of the general pattern. */}
        <h1
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 leading-none font-black tracking-tight whitespace-nowrap text-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          style={{
            fontSize: "clamp(6rem, 30vw, 24rem)",
            backgroundImage: "var(--gradient-brand-diagonal)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            maskImage: "radial-gradient(circle 0px at 50% 50%, black 0%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(circle 0px at 50% 50%, black 0%, transparent 100%)",
          }}
        >
          YEYE
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="font-display text-[13px] text-black/50"
        >
          סטודיו דיגיטלי עצמאי
        </motion.span>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="flex items-center gap-4"
        >
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-black/50 transition-colors hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label="Email"
            className="text-black/50 transition-colors hover:text-black"
          >
            <Mail size={18} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
