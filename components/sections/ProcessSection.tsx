"use client";

import { useRef, type ComponentType } from "react";
import { motion, useInView } from "framer-motion";
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

// Steps 2 and 4 mirror the illustration to the right of the text (and the
// text to the left), alternating with steps 1 and 3, instead of every step
// putting the illustration on the same side.
const REVERSED_STEP_NUMBERS = ["02", "04"];

function StepContent({ step, active, showDots = true }: { step: StepDef; active: boolean; showDots?: boolean }) {
  const Illustration = step.Illustration;
  const reverse = REVERSED_STEP_NUMBERS.includes(step.number);
  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
      <div className={cn("flex flex-col gap-5", reverse && "md:order-2")}>
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
      <div className={cn("flex items-center justify-center", reverse && "md:order-1")}>
        <Illustration active={active} />
      </div>
    </div>
  );
}

function StackedStep({ step }: { step: StepDef }) {
  const ref = useRef<HTMLDivElement>(null);
  // The default threshold fires as soon as a single pixel of the block is
  // visible, so the illustration's multi-second draw-in animation used to
  // start (and finish) while most of it was still below the fold — by the
  // time the user actually scrolled it into view, there was nothing left to
  // watch. Requiring 45% visibility first means the animation only starts
  // once there's real screen time left to see it play out.
  const inView = useInView(ref, { once: true, amount: 0.45 });

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

/**
 * Desktop and reduced-motion: a plain scroll-reveal, not a pinned/scrubbed
 * section. A pin tied to scroll progress fights the site's Lenis smooth
 * scroll — the two easing layers compound, so gentle scrolling barely
 * registers while a fast scroll blows through several steps at once.
 * Letting each step fade in natively as it scrolls into view tracks the
 * user's actual scroll input 1:1, which reads as far more comfortable for
 * a page people are scrolling to read.
 */
function StackedSteps() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-32 px-6 md:gap-40">
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

/** Mobile, motion allowed: swipe through steps instead of one long scroll — the touch equivalent of reading through the stacked steps. */
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
  const useSwipe = !prefersReducedMotion && isMobile;

  return (
    <section id="process" className="relative py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeading title="איך אנחנו עובדים?" className="mb-12 md:mb-16" />
      </div>
      {useSwipe ? <SwipeSteps /> : <StackedSteps />}
    </section>
  );
}
