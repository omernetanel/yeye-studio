"use client";

import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { motion, useInView, useMotionValueEvent, useScroll } from "framer-motion";
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
  label: string;
  title: string;
  description: string;
  Illustration: ComponentType<IllustrationProps>;
}

const steps: StepDef[] = [
  {
    number: "01",
    label: "Discovery",
    title: "מבינים את העסק",
    description:
      "המטרות, הקהל והמתחרים. לפני שורת קוד אחת אני לומד למה אנחנו בונים ובשביל מי, כי בלי זה גם אתר יפה לא יביא תוצאות.",
    Illustration: DiscoveryIllustration,
  },
  {
    number: "02",
    label: "Design",
    title: "מעצבים את החוויה",
    description:
      "כל מסך, כל צבע וכל מרווח נבחרים בכוונה. עיצוב שמוביל את הגולש לפעולה, לא רק נראה טוב בצילום מסך.",
    Illustration: DesignIllustration,
  },
  {
    number: "03",
    label: "Build",
    title: "בונים את זה נכון",
    description:
      "קוד נקי ומהיר שבנוי להחזיק שנים. Next.js ו-TypeScript, ביצועים גבוהים ונגישות מלאה מהיום הראשון.",
    Illustration: CodeIllustration,
  },
  {
    number: "04",
    label: "Launch",
    title: "עולים לאוויר",
    description: "ביום ההשקה אני שם, וגם הרבה אחריו. ליווי צמוד, תיקונים מהירים ומערכת שממשיכה לגדול איתך.",
    Illustration: LaunchIllustration,
  },
];

// Scroll distance each step owns while the panel is pinned. The wrapper is
// this much taller than the panel itself, which is exactly what gives the
// sticky panel something to stay stuck through.
const STEP_SCROLL_VH = 80;

// A short run of ordinary scrolling before the panel reaches the top and
// locks — the same lead-in the Services panel uses. It also preserves the
// breathing room between the white band above and the heading, which would
// otherwise be swallowed once the panel pins flush to the viewport top.
const PRE_PIN_SPACER_PX = 48;

// Width of the crossfade between two steps, in step units. Adjacent steps
// overlap across this window so one is always arriving as the other leaves,
// rather than the screen passing through an empty gap between them.
const STEP_CROSSFADE = 0.45;

// How far a step slides while entering/leaving. Small on purpose: the point
// is that the steps advance, not that they fly around.
const STEP_SHIFT_PX = 28;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  // A degenerate range divides by zero, and 0/0 is NaN, which then spreads into
  // every value derived from it. Not hypothetical: update() runs once on mount
  // BEFORE the pin range has been measured, so both ends are still 0. See the
  // same guard in ServicesSection, where an unguarded NaN reached
  // video.currentTime and threw.
  if (inMax === inMin) return outMin;
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {steps.map((s, i) => (
        <div
          key={s.number}
          className={cn(
            "h-1 rounded-full transition-all duration-500",
            i === current ? "w-8 bg-[image:var(--gradient-brand)]" : "w-1.5 bg-white/15"
          )}
        />
      ))}
    </div>
  );
}

function StepContent({
  step,
  active,
  dots,
}: {
  step: StepDef;
  active: boolean;
  /** Rendered under the copy. Omitted while pinned, where one shared row sits below all steps instead. */
  dots?: React.ReactNode;
}) {
  const Illustration = step.Illustration;
  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-20">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <span className="font-display text-6xl leading-none font-bold text-white md:text-7xl">{step.number}</span>
          <span className="h-12 w-px bg-white/15" />
          <span className="font-display text-[11px] font-medium tracking-[0.28em] text-white/35 uppercase">
            {step.label}
          </span>
        </div>
        <h3 className="font-display text-[32px] leading-[1.15] font-bold text-white md:text-[44px]">{step.title}</h3>
        <p className="max-w-[440px] font-body text-[17px] leading-[1.85] text-white/50">{step.description}</p>
        {dots}
      </div>
      <div className="illustration-float flex items-center justify-center">
        <Illustration active={active} />
      </div>
    </div>
  );
}

function StackedStep({ step, index }: { step: StepDef; index: number }) {
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
      <StepContent step={step} active={inView} dots={<StepDots current={index} />} />
    </motion.div>
  );
}

/** Reduced motion: no pin, no scrubbing — just the steps, one after another down the page. */
function StackedSteps() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-44 px-6 md:gap-64">
      {steps.map((step, i) => (
        <StackedStep key={step.number} step={step} index={i} />
      ))}
    </div>
  );
}

function SwipeStepSlide({ step }: { step: StepDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.6 });

  return (
    <div ref={ref}>
      <StepContent step={step} active={inView} />
    </div>
  );
}

/** Mobile, motion allowed: swipe through steps instead of one long scroll — the touch equivalent of the pinned desktop sequence. */
function SwipeSteps() {
  return (
    <SwipeCarousel slideWidth="88%">
      {steps.map((step) => (
        <SwipeStepSlide key={step.number} step={step} />
      ))}
    </SwipeCarousel>
  );
}

/**
 * Desktop: the panel pins once the heading reaches the top and stays there
 * for the whole section, with only the steps advancing underneath it.
 *
 * Driven by a sticky panel plus arithmetic on the raw scrollY, NOT by
 * ScrollTrigger — an earlier pin here was built that way and had to be torn
 * out, because its easing compounded with the site's Lenis smooth scroll and
 * gentle scrolling barely registered while a fast flick blew through several
 * steps at once. Reading the real scroll position directly tracks the user's
 * input 1:1, which is the same approach the Services panel already uses.
 */
function PinnedSteps() {
  const wrapperRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);

  // Which step's dots are lit, and how far the sequence has been played
  // through. `reached` is a high-water mark rather than the current index so
  // each illustration's draw-in runs once, matching how it behaves elsewhere,
  // instead of restarting every time the user scrolls back over it.
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(-1);
  const currentRef = useRef(0);
  const reachedRef = useRef(-1);

  const { scrollY } = useScroll();

  const update = () => {
    const panel = panelRef.current;
    if (!panel) return;

    const rawScrollY = scrollY.get();
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));
    const t = progress * steps.length;

    for (let i = 0; i < steps.length; i += 1) {
      const el = stepRefs.current[i];
      if (!el) continue;
      // The first step is already on screen as the panel arrives and the last
      // one has to survive to the end of the pin, so neither gets a fade on
      // that outer side — only the boundaries between steps crossfade.
      const fadeIn =
        i === 0 ? 1 : smoothstep(mapRange(t, i - STEP_CROSSFADE / 2, i + STEP_CROSSFADE / 2, 0, 1));
      const fadeOut =
        i === steps.length - 1
          ? 1
          : 1 - smoothstep(mapRange(t, i + 1 - STEP_CROSSFADE / 2, i + 1 + STEP_CROSSFADE / 2, 0, 1));
      const opacity = fadeIn * fadeOut;

      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${(1 - fadeIn) * STEP_SHIFT_PX - (1 - fadeOut) * STEP_SHIFT_PX}px)`;
      // Opacity alone leaves a faded-out step still catching text selection
      // and hover from the step layered on top of it.
      el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    }

    const index = Math.min(steps.length - 1, Math.max(0, Math.floor(t)));
    if (index !== currentRef.current) {
      currentRef.current = index;
      setCurrent(index);
    }
    // Held back until the panel is actually pinned, so an illustration never
    // plays out while the section is still well below the fold.
    if (rawScrollY >= pinStartScrollYRef.current && index > reachedRef.current) {
      reachedRef.current = index;
      setReached(index);
    }
  };

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    const panel = panelRef.current;
    if (!wrapper || !spacer || !panel) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    // The panel sticks at top: 0, so it locks once its own natural top — the
    // wrapper's top plus the lead-in spacer — reaches the viewport top, and
    // releases once the wrapper's bottom edge catches up with it.
    pinStartScrollYRef.current = wrapperTop + spacer.offsetHeight;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - panel.offsetHeight;
  };

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    measurePinRange();
    update();

    const handleResize = () => {
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapper);
    if (panelRef.current) ro.observe(panelRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollY, "change", update);

  return (
    <section
      ref={wrapperRef}
      id="process"
      data-nav-dark="true"
      className="relative bg-black"
      style={{ height: `calc(100vh + ${steps.length * STEP_SCROLL_VH}vh + ${PRE_PIN_SPACER_PX}px)` }}
    >
      <div ref={spacerRef} aria-hidden="true" style={{ height: `${PRE_PIN_SPACER_PX}px` }} />

      <div ref={panelRef} className="sticky top-0 flex h-screen w-full flex-col overflow-hidden bg-black">
        <div className="shrink-0 px-6 pt-20 md:pt-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading title="איך אני עובד?" />
          </div>
        </div>

        {/* All four steps share one slot and crossfade through it, so the
            frame around them never moves — only the step inside it changes. */}
        <div className="relative min-h-0 flex-1">
          {steps.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <StepContent step={step} active={i <= reached} />
            </div>
          ))}
        </div>

        <div className="shrink-0 pb-14 md:pb-16">
          <div className="mx-auto flex max-w-[1100px] justify-center px-6">
            <StepDots current={current} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProcessSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion) {
    return (
      <section id="process" data-nav-dark="true" className="relative bg-black pt-32 pb-16 md:pt-36 md:pb-20">
        <div className="relative z-10 mx-auto max-w-[1200px] px-6">
          <SectionHeading title="איך אני עובד?" className="mb-12 md:mb-16" />
        </div>
        <div className="relative z-10">
          <StackedSteps />
        </div>
      </section>
    );
  }

  if (isMobile) {
    return (
      <section id="process" data-nav-dark="true" className="relative bg-black pt-32 pb-16 md:pt-36 md:pb-20">
        <div className="relative z-10 mx-auto max-w-[1200px] px-6">
          <SectionHeading title="איך אני עובד?" className="mb-12 md:mb-16" />
        </div>
        <div className="relative z-10">
          <SwipeSteps />
        </div>
      </section>
    );
  }

  return <PinnedSteps />;
}
