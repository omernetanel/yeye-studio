"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";

/**
 * The closing statement — but only where the paper sequence cannot deliver it.
 *
 * On a desktop with motion enabled the sentence now rises into the bottom of
 * ServicesSection's own pinned frame, on top of the clip, so rendering it here
 * as well would show it twice. That branch keeps only the breathing space
 * before the contact stage, which this section was also providing.
 *
 * The condition mirrors ServicesSection's `skipDesktopMotion` exactly. If the
 * two ever drift apart the sentence is either duplicated or lost entirely.
 */
export default function StatementSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const skipDesktopMotion = prefersReducedMotion || isMobile;

  if (!skipDesktopMotion) {
    return <div aria-hidden="true" className="h-32 bg-white md:h-44" />;
  }

  return (
    <section className="relative bg-white px-6 pt-4 pb-32 md:pt-6 md:pb-44">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-[1400px] text-right font-display text-[42px] leading-[1.15] font-normal text-black md:text-[62px] lg:text-[84px]"
      >
        עיצוב מושך תשומת לב.
        <br />
        חשיבה יוצרת תוצאה.
      </motion.p>
    </section>
  );
}
