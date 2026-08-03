"use client";

import { motion } from "framer-motion";

export default function StatementSection() {
  return (
    <section className="relative bg-white px-6 pt-24 pb-6 md:pt-32 md:pb-8">
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
