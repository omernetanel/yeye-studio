"use client";

import { motion } from "framer-motion";

export default function StatementSection() {
  return (
    <section className="relative bg-white px-6 py-20 md:py-28">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-[1400px] text-right font-display text-4xl leading-[1.15] font-bold text-black md:text-6xl"
      >
        עיצוב מושך תשומת לב.
        <br />
        חשיבה יוצרת תוצאה.
      </motion.p>
    </section>
  );
}
