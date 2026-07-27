"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function ViewWorkCTA() {
  return (
    <div className="flex justify-center px-6 py-12 md:py-16">
      <motion.div
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
