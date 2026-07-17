"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import SwipeCarousel from "@/components/ui/SwipeCarousel";

interface TypeItem {
  title: string;
  description: string;
  use: string;
}

interface TypesGridProps {
  title: string;
  items: TypeItem[];
}

function TypeCardContent({ item }: { item: TypeItem }) {
  return (
    <Card className="flex h-full flex-col gap-3">
      <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
      <p className="font-body text-sm leading-[1.7] text-white/50">{item.description}</p>
      <p className="mt-1 font-display text-[12.5px] text-primary-light">{item.use}</p>
    </Card>
  );
}

export default function TypesGrid({ title, items }: TypesGridProps) {
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

        <SwipeCarousel className="sm:hidden" slideWidth="82%">
          {items.map((item) => (
            <TypeCardContent key={item.title} item={item} />
          ))}
        </SwipeCarousel>

        <div className="hidden gap-5 sm:grid sm:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.12 }}
            >
              <TypeCardContent item={item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
