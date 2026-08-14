"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import InkWash from "@/components/sections/cta/InkWash";

const particles = [...Array(16)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#4a4a4a" : "#9a9a9a",
  left: `${8 + ((i * 7.5) % 84)}%`,
  top: `${15 + ((i * 13) % 70)}%`,
  duration: 3 + (i % 4),
  delay: i * 0.4,
}));

export default function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden bg-white px-6 py-24 text-center md:py-32">
      {/* The ink from the opening screen, returning at the close with nothing
          behind it. Under everything: the heading blends against it. */}
      <InkWash className="pointer-events-none absolute inset-0 h-full w-full" />

      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          className="pointer-events-none absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: p.left, top: p.top }}
        />
      ))}

      {/* The soft grey ellipse that used to breathe behind the heading is gone.
          Under difference blending the heading's colour is not its own any
          more, it is whatever sits behind it subtracted from white — and that
          ellipse sat exactly behind it, at 25-45% of a mid grey. Black type on
          white came back as dark grey, pulsing. The page under the heading has
          to be white for the words to read black. */}

      {/* relative, and deliberately NOT z-10. A z-index on a positioned element
          opens a stacking context, and mix-blend-mode only ever blends within
          its own — so the heading inside here could see neither the ink nor the
          white page, blended against transparency instead, and stayed white on
          white. Ordering is by DOM position instead: the canvas is declared
          first, so everything here paints over it without either side needing a
          layer of its own. */}
      <div className="relative">
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
          className="mb-6 font-display text-[clamp(40px,5vw,72px)] leading-[1.1] font-extrabold tracking-tight"
        >
          {/* Only this line takes the blend. WHITE type, on a white page, in
              difference: it renders black here and white wherever the ink
              beneath has darkened the page, so the words inverting under the
              ink is the compositor's doing rather than a shader's.

              The gradient line below stays out of it. Difference blending only
              holds its meaning in black and white — a coloured source inverts
              to its complement, so run through the same treatment the grey
              would come back as something else entirely. */}
          <span className="text-white mix-blend-difference">בוא נבנה משהו</span>
          <br />
          <span className="bg-[image:var(--gradient-accent)] bg-clip-text text-transparent">שבאמת עובד.</span>
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
