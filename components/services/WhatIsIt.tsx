"use client";

import { motion } from "framer-motion";
import ServiceHeading from "@/components/services/ServiceHeading";

interface WhatIsItProps {
  title: string;
  text: string;
  /** The one phrase in the text that carries it, under the site's marker. */
  mark?: string;
}

export default function WhatIsIt({ title, text, mark }: WhatIsItProps) {
  const at = mark ? text.indexOf(mark) : -1;
  const body =
    at < 0 || !mark ? (
      text
    ) : (
      <>
        {text.slice(0, at)}
        <mark className="text-marker bg-transparent text-inherit">{mark}</mark>
        {text.slice(at + mark.length)}
      </>
    );
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
          {body}
        </motion.p>
      </div>
    </section>
  );
}
