"use client";

import { motion } from "framer-motion";

const particles = [...Array(20)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
  left: `${5 + ((i * 4.8) % 90)}%`,
  top: `${10 + ((i * 11) % 80)}%`,
  duration: 3 + (i % 4),
  delay: i * 0.35,
}));

/** Shared decorative backdrop for every service page — glow, grid, drifting particles. */
export default function ServiceAmbientBackground() {
  return (
    <>
      <motion.div
        animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed top-[5%] left-1/2 z-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[60px]"
        style={{ background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-primary) 30%, transparent) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[size:60px_60px]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--color-primary-light) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-primary-light) 4%, transparent) 1px, transparent 1px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 80%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 80%)",
        }}
      />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          className="pointer-events-none fixed z-0 rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: p.left, top: p.top }}
        />
      ))}
    </>
  );
}
