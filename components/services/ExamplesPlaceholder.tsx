"use client";

import { motion } from "framer-motion";

interface ExamplesPlaceholderProps {
  title: string;
  labelPrefix: string;
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/6 bg-[#0f0f14] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/5 bg-[#111118] px-3" dir="ltr">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <span className="font-display text-xs text-white/15">{label}</span>
        <span className="font-display text-[11px] text-primary-light/30">בקרוב</span>
      </div>
    </div>
  );
}

export default function ExamplesPlaceholder({ title, labelPrefix }: ExamplesPlaceholderProps) {
  const labels = [`${labelPrefix} 01`, `${labelPrefix} 02`, `${labelPrefix} 03`];
  const fanX = ["-105%", "0%", "105%"];
  const fanDelay = [0.1, 0, 0.2];

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center font-display text-3xl font-bold text-white"
        >
          {title}
        </motion.h2>

        {/* Mobile: simple stack */}
        <div className="flex flex-col gap-4 sm:hidden">
          {labels.map((label) => (
            <div key={label} className="aspect-[4/3]">
              <PlaceholderCard label={label} />
            </div>
          ))}
        </div>

        {/* Desktop: fanned-out reveal */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative hidden h-[340px] items-center justify-center sm:flex"
        >
          {labels.map((label, i) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, x: "0%", scale: 0.85 },
                visible: {
                  opacity: 1,
                  x: fanX[i],
                  scale: 1,
                  transition: { duration: 0.8, ease: [0.34, 1.2, 0.64, 1], delay: fanDelay[i] },
                },
              }}
              className="absolute h-[240px] w-[320px]"
            >
              <PlaceholderCard label={label} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
