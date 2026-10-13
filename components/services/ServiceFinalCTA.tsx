"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import CurvedLoop from "@/components/ui/CurvedLoop";
import { DESIGN_LOOP_MARKS, DESIGN_LOOP_TEXT } from "@/lib/content";
import { useIsMobile } from "@/lib/use-mobile";

interface ServiceFinalCTAProps {
  title: string;
}

export default function ServiceFinalCTA({ title }: ServiceFinalCTAProps) {
  const isMobile = useIsMobile();

  return (
    <section className="pt-10 pb-24 text-center">
      {/* THE TAPE FROM THE HOME PAGE leads into the close here too: the same
          line running on its curve, set the same way (see DesignWorkSection).
          These pages ended on a heading and a button on plain white, and the
          last thing on them was the least like the rest of the site. */}
      <div className="overflow-x-clip text-neutral-400 md:text-tape-dim">
        <CurvedLoop
          text={DESIGN_LOOP_TEXT}
          highlight={DESIGN_LOOP_MARKS}
          highlightClassName="fill-white"
          ribbonClassName="stroke-black"
          className="font-display font-extrabold [word-spacing:0.12em]"
          interactive={false}
          {...(isMobile
            ? { span: 560, fontSize: 68, curveAmount: 220, speed: 115 }
            : { fontSize: 62, curveAmount: 200, speed: 80 })}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mt-16 px-6"
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
