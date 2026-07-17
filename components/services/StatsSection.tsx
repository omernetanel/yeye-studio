"use client";

import { motion } from "framer-motion";

interface Stat {
  stat: string;
  statLabel: string;
  text: string;
}

interface StatsSectionProps {
  title: string;
  stats: Stat[];
}

export default function StatsSection({ title, stats }: StatsSectionProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1000px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center font-display text-3xl font-bold text-white"
        >
          {title}
        </motion.h2>

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
              <div className="shrink-0 sm:w-[220px]">
                <div className="mb-2 bg-[image:var(--gradient-brand)] bg-clip-text font-display text-5xl leading-none font-extrabold text-transparent">
                  {item.stat}
                </div>
                <div className="font-display text-xs leading-[1.4] text-white/35">{item.statLabel}</div>
              </div>
              <div className="hidden h-20 w-px shrink-0 bg-gradient-to-b from-transparent via-primary-light/40 to-transparent sm:block" />
              <p className="flex-1 font-body text-[17px] leading-[1.85] text-white/55">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
