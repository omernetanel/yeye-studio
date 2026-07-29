"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { LayoutDashboard, Monitor, Rocket, ShoppingCart } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

const services = [
  {
    icon: ShoppingCart,
    title: "חנויות אונליין",
    description: "חנויות מעוצבות ומדויקות\nעם חוויית קנייה שמביאה מכירות.",
    href: "/services/online-stores",
  },
  {
    icon: Rocket,
    title: "דפי נחיתה",
    description: "דפי נחיתה ממוקדים שממירים\nגולשים ללקוחות ומביאים תוצאות.",
    href: "/services/landing-pages",
  },
  {
    icon: Monitor,
    title: "אתרי תדמית",
    description: "אתרים יוקרתיים שבונים אמון\nומציגים את העסק שלך ברמה הגבוהה ביותר.",
    href: "/services/business-sites",
  },
  {
    icon: LayoutDashboard,
    title: "מערכות ניהול",
    description: "דשבורדים וכלי ניהול פנימיים\nשמסדרים את העסק שלך במקום אחד.",
    href: "/services/dashboards",
  },
];

// Scroll-progress phase boundaries (0..1 across this section's own tall
// wrapper — see the sticky structure below). A solid black panel rises
// from the bottom with a hard edge (no color-fade — this is a shape
// covering white, not a background transitioning), then once it's passed
// halfway up the viewport the title rises out of the bottom, small, and
// grows into its resting size at the top as scrolling continues, and the
// 4 cards open right after.
// Tuned so the black panel is already fully risen by the time the Hero's
// logo lands in the Navbar (a fixed ~550px of scroll into this section's
// own range) — the two sections hand off to each other mid-motion instead
// of the black screen still visibly climbing after the Hero's already done.
const RISE_END = 0.22;
const TITLE_START = RISE_END / 2; // exactly when the black panel has covered half the viewport
const TITLE_END = 0.82;
const CARDS_START = 0.8;
const CARDS_END = 1;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function ServiceCards() {
  return (
    <>
      {/* Mobile: touch-native swipe carousel, one card at a time */}
      <SwipeCarousel className="sm:hidden">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} light={false} />
        ))}
      </SwipeCarousel>

      {/* Tablet/desktop: grid */}
      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} light={false} />
        ))}
      </div>
    </>
  );
}

function TitleBlock() {
  return (
    <>
      <h2 className="text-center font-display text-3xl font-bold text-white md:text-5xl">מה אני עושה?</h2>
      <div className="mx-auto mt-4 h-[3px] w-[140px] rounded-full bg-[image:var(--gradient-brand)]" />
    </>
  );
}

export default function ServicesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const wrapperRef = useRef<HTMLElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // "start end" (not "start start") — progress begins the instant this
  // section's top starts entering the viewport from the bottom, not only
  // once it's fully reached the top. Otherwise there's a dead gap of a
  // full extra viewport height, right after the Hero's pin releases,
  // where this section is still plain scrolling white space — the black
  // rise couldn't possibly "already be under way" during the Hero's own
  // final leg like that.
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start end", "end end"] });

  const applyIntro = (progress: number) => {
    const black = blackRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current;
    if (!black || !title || !cards) return;

    const riseT = smoothstep(mapRange(progress, 0, RISE_END, 0, 1));
    black.style.height = `${riseT * 100}vh`;

    const titleT = smoothstep(mapRange(progress, TITLE_START, TITLE_END, 0, 1));
    title.style.opacity = String(mapRange(progress, TITLE_START, TITLE_START + 0.05, 0, 1));
    title.style.transform = `translate(-50%, ${lerp(60, 0, titleT)}vh) scale(${lerp(0.45, 1, titleT)})`;

    const cardsT = smoothstep(mapRange(progress, CARDS_START, CARDS_END, 0, 1));
    cards.style.opacity = String(cardsT);
    cards.style.transform = `translateY(${lerp(40, 0, cardsT)}px)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    applyIntro(scrollYProgress.get());
    // Only needs to run once on mount — applyIntro always reads the live
    // motion value itself, never a stale closure over `progress`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (prefersReducedMotion) return;
    applyIntro(progress);
  });

  if (prefersReducedMotion) {
    return (
      <section id="services" className="relative bg-[#0a0a0a] px-6 py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mb-12 flex flex-col items-center md:mb-16">
            <TitleBlock />
          </div>
          <ServiceCards />
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="services" className="relative h-[280vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        <div ref={blackRef} className="absolute inset-x-0 bottom-0 bg-[#0a0a0a]" style={{ height: 0 }} />

        <div
          ref={titleRef}
          className="absolute top-[11%] left-1/2 w-full max-w-[600px] px-6"
          style={{ transform: "translate(-50%, 60vh) scale(0.45)", opacity: 0 }}
        >
          <TitleBlock />
        </div>

        <div ref={cardsRef} className="absolute inset-x-0 top-[27%] px-6" style={{ opacity: 0, transform: "translateY(40px)" }}>
          <div className="relative z-10 mx-auto max-w-[1200px]">
            <ServiceCards />
          </div>
        </div>
      </div>
    </section>
  );
}
