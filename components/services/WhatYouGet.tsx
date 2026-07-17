"use client";

import { motion } from "framer-motion";

interface FeatureItem {
  number: string;
  title: string;
  description: string;
}

interface WhatYouGetProps {
  title: string;
  subtitle: string;
  rows: FeatureItem[][];
}

export default function WhatYouGet({ title, subtitle, rows }: WhatYouGetProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[800px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 font-display text-3xl font-bold text-white">{title}</h2>
          <p className="font-body text-base text-white/45">{subtitle}</p>
        </motion.div>

        <div className="flex flex-col gap-12">
          {rows.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: rowIndex * 0.15 }}
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-14"
            >
              {row.map((item) => (
                <div key={item.number} className="flex items-start gap-5">
                  <span className="mt-0.5 shrink-0 font-display text-4xl leading-none font-extrabold text-primary/20">
                    {item.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="mb-2.5 font-display text-xl font-bold text-white">{item.title}</h3>
                    <p className="font-body text-[15px] leading-[1.85] text-white/50">{item.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
