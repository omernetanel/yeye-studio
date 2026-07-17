"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface ServiceHeroProps {
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
}

export default function ServiceHero({ titleLine1, titleLine2, description, ctaLabel }: ServiceHeroProps) {
  return (
    <section className="px-6 pt-[160px] pb-20 text-center">
      <div className="mx-auto max-w-[800px]">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 font-display text-[clamp(38px,5vw,60px)] leading-[1.15] font-extrabold tracking-tight text-white"
        >
          {titleLine1}
          <br />
          <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">{titleLine2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-9 font-body text-lg leading-[1.8] text-white/55"
        >
          {description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex justify-center"
        >
          <Button href="/contact">{ctaLabel}</Button>
        </motion.div>
      </div>
    </section>
  );
}
