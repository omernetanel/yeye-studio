"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { LayoutDashboard, Monitor, Rocket, ShoppingCart } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { cn } from "@/lib/utils";

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

const VIDEO_SRC = "/videos/services-crumple.mp4";
const POSTER_SRC = "/images/services-crumple-poster.jpg";
// The source is ~9s, but the phase math below always reads the real
// value off the element once its metadata loads (see videoDurationRef) —
// this is only what renders before that, and a safety fallback if
// `loadedmetadata` never fires for some reason.
const VIDEO_DURATION_FALLBACK = 9;

// Phase 1 ("reading"): scroll progress 0 -> READ_END, scoped to this
// section's own tall wrapper. The clip stays frozen on its first frame —
// a flat-lay of the mockups, indistinguishable from a plain background
// image — while the title fades in and then the 4 cards reveal, staggered,
// on their own schedule (re-scoped 0..1 within this sub-range via p1
// below). Nothing here touches the video at all; it just isn't playing yet.
// Widened (0.3 -> 0.38, wrapper height bumped to match) so the cards'
// own entrance has real room to breathe before the video starts moving —
// the wrapper's total height grew by the same proportion, so the video
// scrub phase that follows keeps its original pacing instead of getting
// rushed into a smaller remaining share.
const READ_END = 0.38;
const TITLE_LOCAL_END = 0.14;
const CARDS_LOCAL_START = 0.24;
const CARD_STAGGER = 0.09;
const CARD_LOCAL_DURATION = 0.4;

// Phase 2 ("scrub"): READ_END -> 1. video.currentTime maps linearly across
// the rest of this section's scroll budget, from 0 to the clip's real
// duration — scrolling down plays it forward frame by frame, scrolling
// back up plays it in reverse, exactly like any other scroll-linked value
// here (nothing about this is a one-shot trigger). The title+cards block
// (already fully revealed by the end of phase 1) shrinks toward the
// screen's center and fades out as ONE unit, finishing exactly when the
// clip reaches TEXT_GONE_AT_SECONDS — well before the clip's own end,
// which keeps scrubbing onward (still purely scroll-driven) through the
// rest of the crumple to the final, fully-balled-up frame. Once the
// wrapper's own scroll budget runs out, the sticky panel below releases
// on its own (same passive mechanism as the Hero's pin) and that last
// frame just sits there as an ordinary paused <video>, scrolling away
// with the rest of the page like a static image.
const TEXT_GONE_AT_SECONDS = 3;
const CONTENT_SHRINK_SCALE = 0.6;

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

function TitleBlock() {
  return <h2 className="text-center font-display text-5xl font-bold text-black md:text-7xl">מה אני עושה?</h2>;
}

// One card is deliberately bigger than the other three (an asymmetric
// "bento" grid instead of a rigid uniform one) and every card is real
// glass — a strong backdrop-blur over a low-opacity fill, not an opaque
// panel — so the video keeps showing through behind them instead of
// being fully blocked out, the way the flat white cards were doing.
const BENTO_SPAN = ["col-span-2 row-span-2", "col-span-2", "col-span-1", "col-span-1"];

interface BentoServiceCardProps {
  service: (typeof services)[number];
  index: number;
  cardRef: (el: HTMLAnchorElement | null) => void;
}

function BentoServiceCard({ service, index, cardRef }: BentoServiceCardProps) {
  const Icon = service.icon;
  const large = index === 0;

  return (
    <Link
      ref={cardRef}
      href={service.href}
      style={{ opacity: 0, transform: "translateY(36px) scale(0.92)" }}
      className={cn(
        "group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/50 bg-white/25 text-center shadow-[0_8px_40px_rgba(0,0,0,0.1)] backdrop-blur-2xl transition-transform duration-200 hover:scale-[1.015]",
        BENTO_SPAN[index],
        large ? "gap-5 p-9" : "gap-3 p-7"
      )}
    >
      {/* A large, faint watermark numeral — the quiet "premium feature
          card" flourish (Apple/Stripe-style), not another loud icon. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-3 -left-2 font-display leading-none font-light text-black/[0.07] select-none",
          large ? "text-[10rem]" : "text-7xl"
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full border border-black/10 bg-white/50",
          large ? "h-16 w-16" : "h-14 w-14"
        )}
      >
        <Icon size={large ? 30 : 26} strokeWidth={1.5} className="text-black/70" />
      </div>

      <div className="relative z-10">
        <h3 className={cn("font-display font-bold text-black", large ? "text-2xl" : "text-lg")}>{service.title}</h3>
        <p className={cn("mt-2 whitespace-pre-line font-body text-black/60", large ? "text-[15px] leading-[1.8]" : "text-[13.5px] leading-[1.75]")}>
          {service.description}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 font-display text-sm text-black/70 transition-transform duration-200 group-hover:scale-105">
          <span aria-hidden>←</span>
          לפרטים נוספים
        </span>
      </div>
    </Link>
  );
}

const BackgroundVideo = forwardRef<HTMLVideoElement, { className?: string; autoPlay?: boolean }>(
  function BackgroundVideo({ className, autoPlay = false }, ref) {
    return (
      <video
        ref={ref}
        aria-hidden="true"
        tabIndex={-1}
        muted
        playsInline
        loop={autoPlay}
        autoPlay={autoPlay}
        preload="auto"
        poster={POSTER_SRC}
        disablePictureInPicture
        className={className}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    );
  }
);

export default function ServicesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const skipDesktopMotion = prefersReducedMotion || isMobile;

  const wrapperRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // Analytical, not scrollYProgress-derived — same reasoning as the Hero's
  // own pin: a target-scoped scrollYProgress motion value lags an instant
  // or fast scroll jump by a frame or two (its target rect is re-measured
  // on its own schedule), which is exactly the kind of drift that would
  // throw off a precise video-frame seek. A live rect measurement plus the
  // raw global scrollY never do that.
  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);
  const videoDurationRef = useRef(VIDEO_DURATION_FALLBACK);
  const videoReadyRef = useRef(false);

  const { scrollY } = useScroll();

  const update = () => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    const content = contentRef.current;
    if (!wrapper || !video || !content) return;

    const rawScrollY = scrollY.get();
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));

    // Phase 1 sub-progress — clamps at 1 once `progress` passes READ_END,
    // which is exactly what holds the title/cards at their fully-revealed
    // state (not fading back out) all through phase 2 below.
    const p1 = clamp01(progress / READ_END);

    if (titleRef.current) {
      const titleT = smoothstep(mapRange(p1, 0, TITLE_LOCAL_END, 0, 1));
      titleRef.current.style.opacity = String(titleT);
    }

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const start = CARDS_LOCAL_START + i * CARD_STAGGER;
      const cardT = smoothstep(mapRange(p1, start, start + CARD_LOCAL_DURATION, 0, 1));
      card.style.opacity = String(cardT);
      card.style.transform = `translateY(${lerp(36, 0, cardT)}px) scale(${lerp(0.92, 1, cardT)})`;
    });

    // Phase 2 — video.currentTime is a pure linear function of scroll
    // progress across the whole READ_END..1 range, so it's automatically,
    // exactly reversible on scroll-up; no separate "rewind" logic needed.
    const scrubT = mapRange(progress, READ_END, 1, 0, 1);
    const targetTime = scrubT * videoDurationRef.current;
    if (videoReadyRef.current && Math.abs(video.currentTime - targetTime) > 0.008) {
      video.currentTime = targetTime;
    }

    const textGoneT = smoothstep(mapRange(targetTime, 0, TEXT_GONE_AT_SECONDS, 0, 1));
    const shrinkT = progress <= READ_END ? 0 : textGoneT;
    content.style.opacity = String(1 - shrinkT);
    content.style.transform = `scale(${lerp(1, CONTENT_SHRINK_SCALE, shrinkT)})`;
  };

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    pinStartScrollYRef.current = wrapperTop;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - window.innerHeight;
  };

  useLayoutEffect(() => {
    if (skipDesktopMotion) return;
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    // iOS Safari can leave programmatic currentTime seeks doing nothing
    // visually until the video has been through one real play/pause cycle
    // — priming it here (safe without a user gesture since it's muted)
    // is what makes every seek afterward actually paint.
    const handleLoadedMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        videoDurationRef.current = video.duration;
      }
      video.play().then(() => video.pause()).catch(() => {});
      videoReadyRef.current = true;
      update();
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    }

    measurePinRange();
    update();

    const handleResize = () => {
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapper);

    return () => {
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipDesktopMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!skipDesktopMotion) update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="services" className="relative bg-white px-6 py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mb-12 flex flex-col items-center md:mb-16">
            <TitleBlock />
          </div>
          <div className="mx-auto hidden max-w-[760px] gap-6 sm:grid sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} light tone="neutral" />
            ))}
          </div>
          <SwipeCarousel className="sm:hidden">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} light tone="neutral" />
            ))}
          </SwipeCarousel>
        </div>
      </section>
    );
  }

  if (isMobile) {
    // No pin, no scroll-scrub — the clip just autoplays/loops normally as
    // ambient background texture (cheap: a real-time decode loop, not a
    // seek on every scroll tick, which is what's actually janky on
    // touch/Safari), while the title and cards reveal with a plain
    // scroll-into-view fade, same as the rest of the site's mobile sections.
    return (
      <section id="services" className="relative overflow-hidden bg-white px-6 py-16">
        <BackgroundVideo autoPlay className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-0 bg-white/55" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 flex flex-col items-center"
          >
            <TitleBlock />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <SwipeCarousel>
              {services.map((service) => (
                <ServiceCard key={service.title} {...service} light tone="neutral" />
              ))}
            </SwipeCarousel>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="services" className="relative h-[560vh] bg-white">
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        {/* object-cover — fills the section edge-to-edge with no white
            pillarboxing on wide viewports, the way this background is
            meant to read. The clip's own generous white margins around
            the mockups (deliberately shot that way to blend into this
            section's white bg) mean cover's crop mostly eats into that
            margin rather than the mockups themselves. top-[100px], full
            h-full (not a shorter calc()'d box) — the box stays exactly
            the size the clip was composed for, just shifted down so its
            top clears the fixed Navbar; shrinking the box instead would
            scale the whole composition down with it. The bit that now
            overflows past the panel's own bottom edge is simply clipped
            by overflow-hidden above, same as being off-screen either way.
            A `video` is a replaced element with its own intrinsic aspect
            ratio — leaving height as `auto` (relying on top+bottom alone)
            makes the browser size the box from that intrinsic ratio
            instead of the actual container, so height has to stay
            explicit. */}
        <BackgroundVideo ref={videoRef} className="absolute inset-x-0 top-[100px] h-full w-full object-cover" />

        {/* pt-[100px] — matches the Navbar's own fixed height plus
            breathing room (same convention as the Hero's sticky panel).
            Without it, centering this content within the full h-screen
            box ignored the fact that the fixed header covers its own
            top slice, so tall content pushed the title up underneath it. */}
        <div
          ref={contentRef}
          className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-[100px]"
        >
          <div ref={titleRef} style={{ opacity: 0 }}>
            <TitleBlock />
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-[900px] grid-cols-4 grid-rows-2 gap-5">
            {services.map((service, i) => (
              <BentoServiceCard
                key={service.title}
                service={service}
                index={i}
                cardRef={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
