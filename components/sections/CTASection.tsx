"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import InkWash from "@/components/sections/cta/InkWash";
import CtaBalloons from "@/components/sections/cta/CtaBalloons";

const particles = [...Array(16)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#4a4a4a" : "#9a9a9a",
  left: `${8 + ((i * 7.5) % 84)}%`,
  top: `${15 + ((i * 13) % 70)}%`,
  duration: 3 + (i % 4),
  delay: i * 0.4,
}));

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} id="cta" className="relative overflow-hidden bg-white px-6 py-24 text-center md:py-32">
      {/* The ink from the opening screen, returning at the close with nothing
          behind it. z-0 and under everything: the heading blends against it. */}
      <InkWash className="pointer-events-none absolute inset-0 z-0 h-full w-full" />

      {/* And the balloons, one last time. Mounted here rather than inside the
          section's own box because the layer is fixed; it clips itself to the
          section, so nothing reaches the footer. */}
      <CtaBalloons sectionRef={sectionRef} />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          className="pointer-events-none absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: p.left, top: p.top }}
        />
      ))}

      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"
        style={{ background: "radial-gradient(ellipse, rgba(74,74,74,0.3) 0%, transparent 70%)" }}
      />

      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-6 font-display text-sm font-medium tracking-[0.08em] text-accent uppercase"
        >
          מוכנים להתחיל?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          // WHITE type, on a white page, in difference blend. That renders it
          // black here and white wherever the ink beneath has darkened the
          // page, so the words inverting under the ink is the compositor's
          // doing rather than a shader's — the same effect the Hero gets, by
          // the other route.
          //
          // The whole heading inverts together. The second line used to be a
          // gradient fill; difference blending only holds its meaning in black
          // and white, and a coloured source inverts to its complement rather
          // than to anything intended.
          className="mb-6 font-display text-[clamp(40px,5vw,72px)] leading-[1.1] font-extrabold tracking-tight text-white mix-blend-difference"
        >
          בוא נבנה משהו
          <br />
          שבאמת עובד.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 font-body text-lg text-black/45"
        >
          ייעוץ ראשוני ללא עלות. אשמח לשמוע על הפרויקט שלך.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button href="/contact" variant="primary" className="!border-black !bg-none !bg-black !shadow-none">
            בוא נתחיל ביחד
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
