"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface ServiceFinalCTAProps {
  title: string;
}

// NO RUNNING TAPE OVER IT. The home page's was tried here, on every service
// page, and taken off: it is the home page's own way into its form, and five
// more of it made it a decoration.
export default function ServiceFinalCTA({ title }: ServiceFinalCTAProps) {
  return (
    <section className="px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mb-4 font-display text-[clamp(32px,5vw,64px)] leading-[1.1] font-extrabold tracking-tight text-black">
          {title}
        </h2>
        <p className="mb-8 font-body text-lg text-black/70">ייעוץ ראשוני ללא עלות. אשמח לשמוע על הפרויקט שלכם.</p>
        <Button href="/#cta">בואו נתחיל</Button>
      </motion.div>
    </section>
  );
}
