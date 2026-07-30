"use client";

import { motion } from "framer-motion";

export default function StatementSection() {
  return (
    <section className="relative bg-white px-6 pt-20 pb-8 md:pt-28 md:pb-10">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-[1400px] text-right font-display text-6xl leading-[1.1] font-normal text-black md:text-8xl lg:text-9xl"
      >
        עיצוב מושך תשומת לב.
        <br />
        חשיבה יוצרת תוצאה.
      </motion.p>
    </section>
  );
}
