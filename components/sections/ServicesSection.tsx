"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { LayoutDashboard, Monitor, Rocket, ShoppingCart } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";

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

const VIDEO_SRC = "/videos/services-bg.mp4";
const POSTER_SRC = "/images/services-bg-poster.jpg";
// The source is ~9s, but the phase math below always reads the real
// value off the element once its metadata loads (see videoDurationRef) —
// this is only what renders before that, and a safety fallback if
// `loadedmetadata` never fires for some reason.
const VIDEO_DURATION_FALLBACK = 9;

// Phase 1 ("reading"): scroll progress 0 -> READ_END, scoped to this
// section's own tall wrapper. The clip stays frozen on its first frame —
// a flat-lay of the mockups, indistinguishable from a plain background
// image — for a beat on its own (TITLE_LOCAL_START), then the title
// fades/grows in, holds for a short pause, and then the 4 cards reveal,
// staggered, on their own schedule (re-scoped 0..1 within this sub-range
// via p1 below). Nothing here touches the video at all; it just isn't
// playing yet. Widened (0.3 -> 0.38, wrapper height bumped to match) so
// the cards' own entrance has real room to breathe before the video
// starts moving — the wrapper's total height grew by the same
// proportion, so the video scrub phase that follows keeps its original
// pacing instead of getting rushed into a smaller remaining share.
const READ_END = 0.38;
const TITLE_LOCAL_START = 0.1;
const TITLE_LOCAL_END = 0.22;
const CARDS_LOCAL_START = 0.34;
const CARD_STAGGER = 0.08;
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
const TEXT_GONE_AT_SECONDS = 4.5;
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

interface BentoServiceCardProps {
  service: (typeof services)[number];
  index: number;
  cardRef: (el: HTMLAnchorElement | null) => void;
}

function BentoServiceCard({ service, index, cardRef }: BentoServiceCardProps) {
  const Icon = service.icon;

  return (
    <Link
      ref={cardRef}
      href={service.href}
      style={{ opacity: 0, transform: "translateY(36px) scale(0.92)" }}
      className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-7 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.015]"
    >
      {/* A large, faint watermark numeral — the quiet "premium feature
          card" flourish (Apple/Stripe-style), not another loud icon. A
          much heavier fill (white/70, not the original white/25) than a
          typical glass panel — a lighter fill let the busy video behind
          it bleed through unevenly frame to frame, reading as a smeared,
          "dirty" pane instead of a clean frosted one; this keeps the
          material readable as consistently white first, with only a
          faint hint of motion behind it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 -left-2 font-display text-7xl leading-none font-light text-black/[0.07] select-none"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white/60">
        <Icon size={26} strokeWidth={1.5} className="text-black/70" />
      </div>

      <div className="relative z-10">
        <h3 className="font-display text-lg font-bold text-black">{service.title}</h3>
        <p className="mt-2 whitespace-pre-line font-body text-[13.5px] leading-[1.75] text-black/60">{service.description}</p>
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
      const titleT = smoothstep(mapRange(p1, TITLE_LOCAL_START, TITLE_LOCAL_END, 0, 1));
      titleRef.current.style.opacity = String(titleT);
      titleRef.current.style.transform = `translateY(${lerp(48, 0, titleT)}px) scale(${lerp(0.82, 1, titleT)})`;
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
    <>
      {/* A plain, non-sticky block showing the clip's full, uncropped
          first frame at its true 16:9 aspect ratio (w-full, height
          following from that — never viewport-capped). It just scrolls
          into and out of view normally, like any full-bleed image, so the
          whole composition (including the top/bottom margins the pinned
          section below has to crop into) is genuinely seen in full at
          least once. That natural height is also exactly what puts real
          breathing room between the Hero above and the interactive pin
          below, instead of the two butting up against each other. */}
      <div className="relative w-full overflow-hidden bg-white">
        <Image
          src={POSTER_SRC}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          sizes="100vw"
          className="block h-auto w-full"
        />
      </div>

      <section ref={wrapperRef} id="services" className="relative h-[560vh] bg-white">
        <div className="sticky top-0 h-screen overflow-hidden bg-white">
          {/* object-cover, default (center) object-position — fills the
              section edge-to-edge with no white pillarboxing on wide
              viewports. The box here (viewport width x visible height below
              the Navbar) is wider relative to its height than the clip's own
              16:9 native aspect, so cover has to crop vertically to fill it;
              splitting that crop evenly top/bottom (the default) keeps the
              single largest per-side loss as small as it can be — pinning it
              to one edge (object-top/object-bottom) was tried and made that
              one edge's loss roughly double, chewing into real content (the
              crumple ball's own edges) instead of just margin. The intro
              block above already showed the whole frame uncropped once, so
              this modest, balanced crop during the interactive scrub isn't
              anyone's first impression of the composition.
              top-[76px] h-[calc(100%-76px)] — an *explicit* height that's
              already shrunk by the Navbar clearance, not h-full. h-full here
              would leave the box exactly panel-height (100vh) and then push
              it down by top-76, so its own bottom 76px silently hangs past
              the panel's bottom edge and gets clipped a second time by
              overflow-hidden on top of the object-cover crop above — an
              invisible, uncontrollable extra bite out of the bottom that was
              exactly what made the crumple ball read as cut off. Sizing the
              box to the actually-visible height up front means the one
              object-cover crop above is the *only* crop, and it's exactly
              as calculated. A `video` is a replaced element with its own
              intrinsic aspect ratio — leaving height as `auto` (relying on
              top+bottom alone) makes the browser size the box from that
              intrinsic ratio instead of the actual container, so height has
              to stay an explicit value either way. */}
          <BackgroundVideo ref={videoRef} className="absolute inset-x-0 top-[76px] h-[calc(100%-76px)] w-full object-cover" />

          {/* pt-[96px] — just past the Navbar's own fixed height, for real
              breathing room above the title (same convention as the Hero's
              sticky panel). Without some top padding here at all, centering
              this content within the full h-screen box ignored the fact
              that the fixed header covers its own top slice, so tall
              content pushed the title up underneath it. */}
          <div
            ref={contentRef}
            className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-[96px]"
          >
            <div ref={titleRef} style={{ opacity: 0, transform: "translateY(48px) scale(0.82)" }}>
              <TitleBlock />
            </div>

            <div className="mx-auto mt-10 grid w-full max-w-[1240px] grid-cols-4 gap-5">
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
    </>
  );
}
