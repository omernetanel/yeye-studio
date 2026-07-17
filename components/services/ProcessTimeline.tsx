"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProcessTimelineProps {
  title: string;
  steps: Step[];
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-primary-light/15 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
      <span className="font-display text-[11px] tracking-[0.08em] text-primary-light">{step.number}</span>
      <h3 className="font-display text-[15px] font-bold text-white">{step.title}</h3>
      <p className="font-body text-[13px] leading-[1.7] text-white/45">{step.description}</p>
    </div>
  );
}

function StepIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-light/50 bg-primary/20 shadow-[0_0_12px_rgba(42,51,243,0.3)]">
      <Icon size={14} strokeWidth={1.5} className="text-primary-light" />
    </div>
  );
}

export default function ProcessTimeline({ title, steps }: ProcessTimelineProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[700px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center font-display text-3xl font-bold text-white"
        >
          {title}
        </motion.h2>

        {/* Mobile: simple right-aligned vertical timeline */}
        <div className="relative sm:hidden">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            style={{ transformOrigin: "top" }}
            className="absolute top-4 right-4 bottom-4 w-px bg-gradient-to-b from-transparent via-primary-light/40 to-transparent"
          />
          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.12 }}
                className="flex items-start gap-4"
              >
                <StepIcon Icon={step.icon} />
                <div className="flex-1">
                  <StepCard step={step} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: alternating connected timeline */}
        <div className="relative hidden sm:block">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            style={{ transformOrigin: "top" }}
            className="absolute top-6 right-1/2 bottom-6 w-px bg-gradient-to-b from-transparent via-primary-light/40 to-transparent"
          />
          {steps.map((step, i) => {
            const isRight = i % 2 === 0;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isRight ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}
                className={`relative mb-10 flex items-center ${isRight ? "justify-end" : "justify-start"}`}
              >
                <div className="w-[44%]">
                  <StepCard step={step} />
                </div>
                <div className="absolute right-[calc(50%-16px)]">
                  <StepIcon Icon={step.icon} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
