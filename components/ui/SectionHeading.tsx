"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  align?: "center" | "start";
  className?: string;
}

export default function SectionHeading({ title, eyebrow, align = "center", className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start text-start", className)}>
      {eyebrow && (
        <span className="mb-4 font-display text-sm font-medium tracking-[0.08em] text-primary-light uppercase">
          {eyebrow}
        </span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="font-display text-section-title font-bold tracking-tight text-white"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "80px" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="mt-4 h-[3px] overflow-hidden rounded-full bg-[image:var(--gradient-brand)]"
      />
    </div>
  );
}
