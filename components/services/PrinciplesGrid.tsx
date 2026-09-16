"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import BorderGlowCard from "@/components/ui/BorderGlowCard";
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
    // The benefit cards from the home page — see TypesGrid.
    <BorderGlowCard className="h-full p-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
          <Icon size={24} strokeWidth={1.5} className="text-white" />
        </div>
        <h3 className="font-display text-[15px] font-bold text-white">{item.title}</h3>
        <p className="font-body text-[13px] leading-[1.65] text-white/55">{item.description}</p>
      </div>
    </BorderGlowCard>
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
          className="mb-12 text-center font-display text-3xl font-bold text-black"
        >
          {title}
        </motion.h2>

        {/* Centred from the first card — see TypesGrid. */}
        <SwipeCarousel className="-mx-6 sm:hidden" slideWidth="78vw" centred>
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
