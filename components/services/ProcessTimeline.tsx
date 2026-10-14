"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import ServiceHeading from "@/components/services/ServiceHeading";
import FoldText, { setFold } from "@/components/ui/FoldText";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

interface Step {
  title: string;
  description: string;
}

interface ProcessTimelineProps {
  title: string;
  steps: Step[];
}

// Where a numeral's top is on the screen, as a share of its height, while it
// folds in: the range the headings on these pages fold over (ServiceHeading).
const FOLD = [0.95, 0.6] as const;

/**
 * HOW THE WORK GOES, IN THE SITE'S OWN SET OF A STAGE: a numeral as the
 * largest thing on the row with the total beside it in grey, a heavy title,
 * and one sentence - the way the home page shows its four stages on the phone,
 * without the pin. A service page is an answer, not a show.
 *
 * It was a timeline of dark cards with an icon in a ring on a line down the
 * middle: a template, and the one block on these pages that looked like one.
 *
 * The numerals fold in with the scroll and back out on the way up, like the
 * headings; the words arrive once.
 */
export default function ProcessTimeline({ title, steps }: ProcessTimelineProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const fold = () => {
    const list = listRef.current;
    if (!list) return;
    const screen = window.innerHeight;
    const numerals = Array.from(list.querySelectorAll<HTMLElement>("[data-step-numeral]"));
    // Every box read before any letter is written.
    const tops = numerals.map((numeral) => numeral.getBoundingClientRect().top / screen);
    numerals.forEach((numeral, index) => setFold(numeral, (FOLD[0] - tops[index]) / (FOLD[0] - FOLD[1])));
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // With less motion the numerals are simply open: no scroll does it there.
    if (prefersReducedMotion) {
      for (const numeral of list.querySelectorAll<HTMLElement>("[data-step-numeral]")) setFold(numeral, 1);
      return;
    }
    fold();
    window.addEventListener("resize", fold);
    return () => window.removeEventListener("resize", fold);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!prefersReducedMotion) fold();
  });

  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <ServiceHeading className="mb-12 md:mb-16">{title}</ServiceHeading>

        <ol ref={listRef}>
          {steps.map((step, index) => (
            <li
              key={step.title}
              // The numeral against the reading edge, the words beside it; a
              // hairline between the rows and under the last.
              className="grid grid-cols-[auto_1fr] items-start gap-x-6 border-t border-black/10 py-8 last:border-b md:grid-cols-12 md:gap-x-10 md:py-12"
            >
              {/* "1/4", set left to right inside the right-to-left page, the
                  way the home page sets it. Decoration: the title carries the
                  same count for a screen reader. */}
              <p
                dir="ltr"
                aria-hidden="true"
                className="flex items-baseline justify-end gap-1 font-display select-none md:col-span-3"
              >
                <span
                  data-step-numeral
                  className="text-[72px] leading-[0.85] font-extrabold tracking-[-0.04em] text-black md:text-[clamp(96px,10vw,150px)]"
                >
                  <FoldText text={String(index + 1)} silent />
                </span>
                <span className="text-[24px] font-bold text-black/30 md:text-[36px]">/{steps.length}</span>
              </p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-right md:col-span-9 md:pt-3"
              >
                <h3 className="font-display text-[26px] leading-[1.15] font-extrabold text-black md:text-[clamp(30px,2.8vw,42px)]">
                  <span className="sr-only">{`שלב ${index + 1} מתוך ${steps.length}: `}</span>
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[640px] font-body text-lg leading-[1.8] text-black/70 md:text-[21px]">
                  {step.description}
                </p>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
