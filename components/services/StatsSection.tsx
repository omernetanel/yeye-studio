"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import ServiceHeading from "@/components/services/ServiceHeading";

interface Stat {
  stat: string;
  statLabel: string;
  text: string;
  // Where a NUMBER comes from. Only a figure taken from someone else's research
  // carries one, and only after the figure was read in the source itself - a
  // stat that is a word ("24/7", "בנייד") has nothing to cite.
  source?: { name: string; href: string };
}

interface StatsSectionProps {
  title: string;
  stats: Stat[];
}

/**
 * The figure itself. One that is a single number with or without a unit
 * ("50ms") counts up to it once, as it comes onto the screen; anything else -
 * a word, "24/7" - is simply printed. With less motion nothing counts.
 */
function Figure({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = usePrefersReducedMotion();
  const parts = /^(\D*)(\d+)(\D*)$/.exec(value);
  const before = parts?.[1] ?? "";
  const target = parts ? Number(parts[2]) : null;
  const after = parts?.[3] ?? "";

  useEffect(() => {
    const element = ref.current;
    if (target === null || !inView || prefersReducedMotion || !element) return undefined;
    const controls = animate(0, target, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (current) => {
        element.textContent = `${before}${Math.round(current)}${after}`;
      },
    });
    return () => controls.stop();
  }, [after, before, inView, prefersReducedMotion, target]);

  return (
    <span ref={ref} dir={target === null ? undefined : "ltr"}>
      {value}
    </span>
  );
}

export default function StatsSection({ title, stats }: StatsSectionProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1000px]">
        <ServiceHeading className="mb-12">{title}</ServiceHeading>

        <div className="flex flex-col gap-10">
          {stats.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 }}
              className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-12 sm:text-right"
            >
              <div className="shrink-0 sm:w-[300px]">
                <div className="mb-3 font-display text-5xl leading-none font-extrabold tracking-tight text-black md:text-7xl">
                  <Figure value={item.stat} />
                </div>
                <div className="font-display text-sm leading-[1.4] font-bold text-black">{item.statLabel}</div>
                {item.source && (
                  <a
                    href={item.source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-display text-[11px] leading-[1.4] text-black/60 underline decoration-black/20 underline-offset-[3px] transition-colors hover:text-black hover:decoration-black/60"
                  >
                    מקור: {/* One left-to-right run, so the year stays after the name. */}
                    <span dir="ltr">{item.source.name}</span>
                  </a>
                )}
              </div>
              <div className="hidden h-20 w-px shrink-0 bg-gradient-to-b from-transparent via-primary-light/40 to-transparent sm:block" />
              <p className="flex-1 font-body text-[17px] leading-[1.85] text-black/70">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
