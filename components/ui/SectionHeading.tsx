"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  align?: "center" | "start";
  className?: string;
  /** Renders for a white-background section (dark text, accent underline) instead of the default dark theme. */
  light?: boolean;
}

export default function SectionHeading({ title, eyebrow, align = "center", className, light = false }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start text-start", className)}>
      {eyebrow && (
        <span
          className={cn(
            "mb-4 font-display text-sm font-medium tracking-[0.08em] uppercase",
            light ? "text-accent" : "text-primary-light"
          )}
        >
          {eyebrow}
        </span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`font-display text-section-title font-bold tracking-tight ${light ? "text-black" : "text-white"}`}
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "140px" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className={cn("mt-4 h-[3px] overflow-hidden rounded-full", light ? "bg-[image:var(--gradient-accent)]" : "bg-[image:var(--gradient-brand)]")}
      />
    </div>
  );
}
