"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import FluidInkReveal from "@/components/sections/hero/FluidInkReveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { setDocked } from "@/lib/motion/heroDock";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

const TAGLINE_TEXT = "בואו נבנה לכם אתר שעובד ומוכר באמת.";
const TYPEWRITER_START_DELAY_MS = 500;
const TYPEWRITER_CHAR_MS = 45;

// Reveals `text` one character at a time, in plain logical (string) order.
// The page is globally dir="rtl" (see app/layout.tsx), so the browser's own
// bidi rendering already grows Hebrew text from the right edge toward the
// left as characters are appended — no manual reversal needed here.
function useTypewriter(text: string, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), count === 0 ? TYPEWRITER_START_DELAY_MS : TYPEWRITER_CHAR_MS);
    return () => clearTimeout(id);
  }, [active, count, text.length]);

  return { visible: text.slice(0, count), done: count >= text.length };
}

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { visible: typedTagline, done: taglineTypingDone } = useTypewriter(TAGLINE_TEXT, !prefersReducedMotion);
  const sectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  // The Navbar's own mark stays hidden while the Hero itself is on screen
  // (nothing to dock against yet), and crossfades in once the Hero has
  // mostly scrolled past — a plain visibility check, not a scroll-position
  // pin/release calculation like the old build had, since this Hero no
  // longer pins or shrinks at all.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => setDocked(entry.intersectionRatio < 0.35), {
      threshold: [0, 0.35, 1],
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative flex h-screen min-h-[640px] flex-col overflow-hidden bg-white pt-[100px] pb-8">
      {/* The wordmark is pixels (drawn into a canvas, see FluidInkReveal),
          so a real, visually-hidden heading carries the actual text for
          screen readers and search engines. */}
      <h1 className="sr-only">YEYE</h1>

      {prefersReducedMotion ? (
        <>
          <div className="mx-auto mt-8 w-full max-w-[1400px] px-6">
            <div className="flex flex-col items-start text-right">
              <p aria-label={TAGLINE_TEXT} className="font-display text-2xl leading-snug font-semibold text-black md:text-4xl">
                <span aria-hidden="true">{TAGLINE_TEXT}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="relative w-full select-none px-4 pt-8 sm:px-6 sm:pt-10">
              <div className="relative mx-auto aspect-[8200/3500] w-full">
                {/* logo.png's opaque pixels are white (a solid-fill wordmark on
                    transparent, not baked black) — brightness(0) recolors them
                    to black, same as FluidInkReveal's own canvas draw does. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.png"
                  alt="YEYE"
                  className="h-full w-full object-contain"
                  style={{ filter: "brightness(0)" }}
                  draggable={false}
                />
              </div>
            </div>

            <div className="mt-14 flex justify-center md:mt-20">
              <Button href="/#projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg">
                צפו בעבודות שלי
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* The ink canvas spans this whole region — tagline through logo,
              stopping just above the CTA — so the reveal isn't clipped to
              the logo's own box (per: "האפקט יחול על כל ה-Hero, גם מעל
              ומתחת ללוגו"). The CTA/social row below stays outside it and
              fully clickable. */}
          <div className="relative flex flex-1 flex-col">
            <div className="mx-auto mt-8 w-full max-w-[1400px] px-6">
              <div className="flex flex-col items-start text-right">
                {/* Real text, kept in the DOM for accessibility/SEO and as
                    the layout/font source FluidInkReveal measures from —
                    but visually transparent, since the canvas draws the
                    glyphs itself so they can invert under the ink. Its own
                    z-index keeps the typewriter caret (a real DOM span,
                    never drawn into the canvas) visible above the canvas. */}
                <p
                  ref={taglineRef}
                  aria-label={TAGLINE_TEXT}
                  className="relative z-10 font-display text-2xl leading-snug font-semibold md:text-4xl"
                  style={{ color: "transparent" }}
                >
                  <span aria-hidden="true">
                    {typedTagline}
                    {!taglineTypingDone && (
                      <span className="ml-0.5 inline-block h-[0.85em] w-[2px] -translate-y-[0.05em] animate-pulse bg-black align-middle" />
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="absolute inset-0 z-0 overflow-hidden">
              <FluidInkReveal
                logoSrc="/images/logo.png"
                videoSrc="/videos/herovid-loop.mp4"
                taglineText={typedTagline}
                taglineElRef={taglineRef}
                className="relative h-full w-full select-none"
              />
            </div>
          </div>

          <div className="mt-14 flex justify-center md:mt-20">
            <Button href="/#projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg">
              צפו בעבודות שלי
            </Button>
          </div>
        </>
      )}

      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6">
        <span className="font-display text-[13px] text-black/50">סטודיו דיגיטלי עצמאי</span>

        <div className="flex items-center gap-4">
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
          <Link href={`mailto:${CONTACT_EMAIL}`} aria-label="Email" className="text-black/50 transition-colors hover:text-black">
            <Mail size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
