"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function ViewWorkCTA() {
  return (
    <div className="relative flex justify-center px-6 py-12 md:py-16">
      {/* Hero above is opaque white with no grid showing through it; fading
          from white to transparent here (instead of an abrupt cut to the
          page's ambient grid) lets this section blend into the Hero. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to bottom, white 0%, white 15%, transparent 100%)" }}
      />
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Button
          href="/projects"
          variant="primary"
          className="!border-black !bg-none !bg-black !shadow-none px-10 py-4 text-lg"
        >
          צפו בעבודות שלי
        </Button>
      </motion.div>
    </div>
  );
}
