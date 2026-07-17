"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface ServiceFinalCTAProps {
  title: string;
}

export default function ServiceFinalCTA({ title }: ServiceFinalCTAProps) {
  return (
    <section className="px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mb-4 font-display text-[clamp(28px,4vw,42px)] font-extrabold text-white">{title}</h2>
        <p className="mb-8 font-body text-lg text-white/45">ייעוץ ראשוני ללא עלות. נשמח לשמוע על הפרויקט שלך.</p>
        <Button href="/contact">בוא נתחיל</Button>
      </motion.div>
    </section>
  );
}
