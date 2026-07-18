"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { cn } from "@/lib/utils";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import {
  CodeIllustration,
  DesignIllustration,
  DiscoveryIllustration,
  LaunchIllustration,
  type IllustrationProps,
} from "./process/illustrations";

interface StepDef {
  number: string;
  title: string;
  description: string;
  Illustration: ComponentType<IllustrationProps>;
}

const steps: StepDef[] = [
  {
    number: "01",
    title: "היכרות והבנה",
    description:
      "לפני שאנחנו כותבים שורת קוד אחת, אנחנו לומדים את העסק שלך לעומק. המטרות, הקהל, המתחרים. רק ככה אפשר לבנות משהו שבאמת עובד.",
    Illustration: DiscoveryIllustration,
  },
  {
    number: "02",
    title: "עיצוב ואפיון",
    description:
      "מגבשים את הרעיונות לחזון ויזואלי מדויק. כל אלמנט, כל צבע, כל מרחק — בכוונה. לא אסתטיקה בשביל אסתטיקה — UX שמוביל לפעולה.",
    Illustration: DesignIllustration,
  },
  {
    number: "03",
    title: "פיתוח",
    description: "קוד נקי, מהיר ומדויק. Next.js, TypeScript, ביצועים מעולים, נגישות מלאה. בונים לטווח הארוך, לא רק להשקה.",
    Illustration: CodeIllustration,
  },
  {
    number: "04",
    title: "השקה ותמיכה",
    description: "ביום ההשקה אנחנו שם. אחרי ההשקה — גם. ליווי מלא, תיקונים מהירים, ומערכת שגדלה איתך.",
    Illustration: LaunchIllustration,
  },
];

function StepContent({ step, active, showDots = true }: { step: StepDef; active: boolean; showDots?: boolean }) {
  const Illustration = step.Illustration;
  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
      <div className="flex flex-col gap-5">
        <span className="font-display text-6xl leading-none font-extrabold tracking-tight text-primary/20 md:text-7xl">
          {step.number}
        </span>
        <h3 className="font-display text-3xl leading-tight font-bold text-white md:text-4xl">{step.title}</h3>
        <p className="max-w-[420px] font-body text-lg leading-[1.85] text-white/55">{step.description}</p>
        {showDots && (
          <div className="mt-2 flex gap-2">
            {steps.map((s) => (
              <div
                key={s.number}
                className={cn(
                  "h-1.5 rounded-full bg-primary transition-all duration-300",
                  s.number === step.number ? "w-6" : "w-1.5 bg-white/15"
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        <Illustration active={active} />
      </div>
    </div>
  );
}

function PinnedSteps() {
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  // The pin section mounts wherever it sits in the page — often far below the
  // fold — so activeStep's default (0) would otherwise mark step 1 "active"
  // and play its illustration immediately on page load, long before the user
  // scrolls down to see it. Gate all illustration playback on the section
  // having actually entered the viewport at least once.
  const hasEnteredView = useInView(pinRef, { once: true, amount: 0.4 });

  useEffect(() => {
    if (!pinRef.current) return;

    // The pin/scroll mechanics stay in GSAP (per the project's scroll-driven
    // convention), but the actual step transition is handled by Framer
    // Motion below as a discrete, sequential crossfade — not a continuous
    // scrub of overlapping panels. A scrub-linked opacity blend can rest at
    // any in-between value, which meant two steps' text could sit on top of
    // each other, half-visible, whenever the user paused mid-scroll (snap
    // only resolved this once scrolling stopped, not during it). Driving the
    // step index off of scroll progress and letting Framer Motion's
    // mode="wait" fully exit one step before mounting the next removes the
    // possibility of overlap altogether, regardless of scroll speed.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: `+=${(steps.length - 1) * 100}%`,
        scrub: 1,
        pin: true,
        snap: {
          snapTo: 1 / (steps.length - 1),
          duration: { min: 0.25, max: 0.6 },
          ease: "power1.inOut",
        },
        onUpdate: (self) => {
          const index = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)));
          setActiveStep((current) => (current === index ? current : index));
        },
      });
    }, pinRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pinRef} className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={steps[activeStep].number}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-0 flex items-center"
        >
          <StepContent step={steps[activeStep]} active={hasEnteredView} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StackedStep({ step }: { step: StepDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <StepContent step={step} active={inView} />
    </motion.div>
  );
}

function StackedSteps() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-20 px-6">
      {steps.map((step) => (
        <StackedStep key={step.number} step={step} />
      ))}
    </div>
  );
}

function SwipeStepSlide({ step }: { step: StepDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.6 });

  return (
    <div ref={ref}>
      <StepContent step={step} active={inView} showDots={false} />
    </div>
  );
}

/** Mobile, motion allowed: swipe through steps instead of one long scroll — the touch equivalent of the desktop pin-advance. */
function SwipeSteps() {
  return (
    <SwipeCarousel slideWidth="88%">
      {steps.map((step) => (
        <SwipeStepSlide key={step.number} step={step} />
      ))}
    </SwipeCarousel>
  );
}

export default function ProcessSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  // The server always assumes desktop (no viewport to check), so mounting
  // PinnedSteps before the real client value is known — then immediately
  // tearing it down once useIsMobile resolves to true — races GSAP's
  // ScrollTrigger pin-spacer against React's own unmount and crashes with
  // a removeChild error. Default to the DOM-safe stacked layout until the
  // real viewport is confirmed client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard client-mount gate — there's no external system to subscribe
    // to here (unlike useSyncExternalStore elsewhere in this file), just a
    // one-time "we're on the client now" flip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const usePinned = mounted && !prefersReducedMotion && !isMobile;
  const useSwipe = mounted && !prefersReducedMotion && isMobile;

  return (
    <section id="process" className="relative py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeading title="איך אנחנו עובדים?" className="mb-12 md:mb-16" />
      </div>
      {usePinned ? <PinnedSteps /> : useSwipe ? <SwipeSteps /> : <StackedSteps />}
    </section>
  );
}
