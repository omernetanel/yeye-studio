"use client";

import { motion } from "framer-motion";

interface WhatIsItProps {
  title: string;
  text: string;
}

export default function WhatIsIt({ title, text }: WhatIsItProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[800px] text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-5 font-display text-3xl font-bold text-white"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-body text-[17px] leading-[1.9] text-white/50"
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}
