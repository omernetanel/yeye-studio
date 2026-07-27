"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";
import LogoSmearCanvas from "@/components/sections/hero/LogoSmearCanvas";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const wipeInitial = prefersReducedMotion ? { clipPath: "inset(0 0 0 0%)" } : { clipPath: "inset(0 0 0 100%)" };

  return (
    <section id="hero" className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-white pt-[100px] pb-8">
      <div>
        <div className="mx-auto w-full max-w-[1400px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex flex-col items-start text-right"
          >
            <p className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl">
              בואו נבנה לכם אתר שעובד ומוכר באמת.
            </p>
          </motion.div>
        </div>

        <div className="relative mt-4 w-full select-none px-4 sm:px-6 md:mt-8">
          <motion.div
            initial={wipeInitial}
            animate={{ clipPath: "inset(0 0 0 0%)" }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}
            className="relative mx-auto aspect-[8042/2511] w-full"
          >
            <Image
              src="/images/logo.png"
              alt="YEYE"
              fill
              priority
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              sizes="100vw"
              className="pointer-events-none object-contain"
              style={{ filter: "brightness(0)" }}
            />
            <LogoSmearCanvas src="/images/logo.png" className="absolute inset-0 h-full w-full touch-none" />
          </motion.div>
        </div>
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
