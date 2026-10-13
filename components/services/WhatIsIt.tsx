"use client";

import { motion } from "framer-motion";
import ServiceHeading from "@/components/services/ServiceHeading";

interface WhatIsItProps {
  title: string;
  text: string;
}

export default function WhatIsIt({ title, text }: WhatIsItProps) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[900px] text-center">
        <ServiceHeading className="mb-5">{title}</ServiceHeading>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-m-sub leading-[1.6] font-medium text-black/80 md:text-[28px] md:leading-[1.5]"
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}
