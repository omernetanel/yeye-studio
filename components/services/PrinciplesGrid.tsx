"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import SwipeCarousel from "@/components/ui/SwipeCarousel";

interface Principle {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PrinciplesGridProps {
  title: string;
  items: Principle[];
}

function PrincipleCardContent({ item }: { item: Principle }) {
  const Icon = item.icon;
  return (
    <Card className="flex h-full flex-col items-center gap-3 text-center">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-primary-light/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_35%,transparent)_0%,rgba(20,20,30,0.4)_75%)]">
        <Icon size={24} strokeWidth={1.5} className="text-primary-light drop-shadow-[0_0_6px_rgba(42,51,243,0.7)]" />
      </div>
      <h3 className="font-display text-[15px] font-bold text-white">{item.title}</h3>
      <p className="font-body text-[13px] leading-[1.65] text-white/50">{item.description}</p>
    </Card>
  );
}

export default function PrinciplesGrid({ title, items }: PrinciplesGridProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center font-display text-3xl font-bold text-white"
        >
          {title}
        </motion.h2>

        <SwipeCarousel className="sm:hidden" slideWidth="78%">
          {items.map((item) => (
            <PrincipleCardContent key={item.title} item={item} />
          ))}
        </SwipeCarousel>

        <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
            >
              <PrincipleCardContent item={item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
