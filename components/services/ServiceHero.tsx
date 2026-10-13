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
      <div className="mx-auto max-w-[1100px]">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-7 font-display text-[clamp(40px,6.6vw,96px)] leading-[1.08] font-extrabold tracking-tight text-black"
        >
          {titleLine1}
          <br />
          <span className="hero-glint">{titleLine2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mb-9 max-w-[720px] font-body text-lg leading-[1.8] text-black/70 md:text-[21px]"
        >
          {description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex justify-center"
        >
          <Button href="/#cta" className="!border-black !bg-none !bg-black !shadow-none">{ctaLabel}</Button>
        </motion.div>
      </div>
    </section>
  );
}
