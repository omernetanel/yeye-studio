"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import MobileHeroBackground from "./MobileHeroBackground";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const headline = ["אנחנו בונים אתרים", "ומערכות שמייצרות", "לקוחות לעסקים."];

export default function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const show3D = !prefersReducedMotion && !isMobile;
  const showMobileBackground = !prefersReducedMotion && isMobile;

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        {show3D ? (
          <SceneCanvas camera={{ position: [0, 0, 7], fov: 38 }}>
            <HeroScene />
          </SceneCanvas>
        ) : showMobileBackground ? (
          <MobileHeroBackground />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, transparent 70%)",
            }}
          />
        )}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[960px] flex-col items-center px-6 pt-[156px] pb-[60px] text-center">
        <motion.h1
          initial="hidden"
          animate="visible"
          className="font-display text-hero font-semibold tracking-tight text-white"
        >
          {headline.map((line, i) => (
            <motion.span
              key={line}
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.3 + i * 0.12 }}
              className={cn(
                "block",
                i === 1 && "bg-[image:var(--gradient-brand)] bg-clip-text text-transparent"
              )}
            >
              {line}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.7 }}
          className="mt-8 max-w-[380px] font-display text-[17px] leading-[1.8] text-white/72"
        >
          עיצוב UX מדויק, פיתוח מהיר, וחוויית משתמש
          <br />
          שמביאה תוצאות אמיתיות.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.85 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
        >
          <Button href="/contact" variant="outline">
            בוא נתחיל פרויקט
          </Button>
          <Button href="#projects" variant="primary">
            צפה בעבודות
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
