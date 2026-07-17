"use client";

import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Dedicated mobile hero backdrop — not a shrunk version of the desktop 3D
 * scene, a distinct touch-reactive piece: two soft gradient blobs that
 * drift toward wherever the user's finger is (spring-smoothed) plus a
 * slow ambient pulse so it's alive even without interaction.
 */
export default function MobileHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.32);

  const springX = useSpring(x, { stiffness: 45, damping: 18 });
  const springY = useSpring(y, { stiffness: 45, damping: 18 });
  const left = useTransform(springX, (v) => `${v * 100}%`);
  const top = useTransform(springY, (v) => `${v * 100}%`);
  const leftDelayed = useTransform(springX, (v) => `${(1 - v) * 100}%`);
  const topDelayed = useTransform(springY, (v) => `${(v * 0.6 + 0.3) * 100}%`);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  };

  return (
    <div ref={containerRef} onPointerMove={handlePointerMove} className="absolute inset-0">
      <motion.div
        style={{
          left,
          top,
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 32%, transparent) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.95, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-[75vw] max-h-[420px] w-[75vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[65px]"
      />
      <motion.div
        style={{
          left: leftDelayed,
          top: topDelayed,
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 26%, transparent) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute h-[55vw] max-h-[300px] w-[55vw] max-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[55px]"
      />
    </div>
  );
}
