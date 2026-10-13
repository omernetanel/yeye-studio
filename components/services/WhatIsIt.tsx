"use client";

import { motion } from "framer-motion";
import ServiceHeading from "@/components/services/ServiceHeading";

interface WhatIsItProps {
  title: string;
  text: string;
}

export default function WhatIsIt({ title, text }: WhatIsItProps) {
  return (
    <section className="px-6 pt-6 pb-16">
      <div className="mx-auto max-w-[900px] text-center">
        {/* Both open as the page arrives, not as they are scrolled to: this
            block shows at the foot of the first screen, and is what says the
            page goes on. */}
        <ServiceHeading className="mb-5" auto>
          {title}
        </ServiceHeading>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mx-auto max-w-[760px] font-body text-lg leading-[1.8] text-black/70 md:text-[21px]"
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}
