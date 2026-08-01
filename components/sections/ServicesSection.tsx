"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Code2, Layers, Paintbrush, PenTool, Rocket, ShoppingBag, Target, type LucideIcon } from "lucide-react";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import ServiceCard from "@/components/ui/ServiceCard";
import Card from "@/components/ui/Card";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";

const services = [
  {
    icon: ShoppingBag,
    title: "חנויות אונליין",
    description: "חנויות מעוצבות ומדויקות\nעם חוויית קנייה שמביאה מכירות.",
    href: "/services/online-stores",
  },
  {
    icon: Rocket,
    title: "דפי נחיתה ואתרי תדמית",
    description: "דפים ואתרים ממוקדים שממירים\nגולשים ללקוחות ובונים אמון.",
    href: "/services/landing-pages",
  },
  {
    icon: Layers,
    title: "מערכות ניהול",
    description: "דשבורדים וכלי ניהול פנימיים\nשמסדרים את העסק שלך במקום אחד.",
    href: "/services/dashboards",
  },
  {
    icon: PenTool,
    title: "מיתוג עסקי",
    description: "זהות חזותית מלאה שמבדלת אותך\nמהמתחרים ובונה מותג שנשאר בזיכרון.",
    href: "/services/branding",
  },
];

interface AboutValue {
  icon: LucideIcon;
  title: string;
  description: string;
}

const aboutValues: AboutValue[] = [
  {
    icon: Target,
    title: "Results-Driven",
    description: "אתר יפה זה לא מספיק. אני בונה כלי מכירה שמייצרים תוצאות אמיתיות.",
  },
  {
    icon: Code2,
    title: "Code Quality",
    description: "קוד נקי, מהיר וניתן להרחבה. אני בונה לטווח הארוך, לא רק להשקה.",
  },
  {
    icon: Paintbrush,
    title: "Design-First",
    description: "כל פרויקט מתחיל מעיצוב מדויק. אני לא כותב שורת קוד לפני שהחזון ברור.",
  },
];

const VIDEO_SRC = "/videos/servicesbg.mp4";
const POSTER_SRC = "/images/servicesbg-poster.jpg";
// The source is ~8.15s, but the phase math below always reads the real
// value off the element once its metadata loads (see videoDurationRef) —
// this is only what renders before that, and a safety fallback if
// `loadedmetadata` never fires for some reason.
const VIDEO_DURATION_FALLBACK = 8.15;

// Phase 0 ("lead-in"): SPACER_PX worth of perfectly ordinary scrolling
// before the panel below goes sticky at all — a plain block, not pinned
// yet. Without this the panel's own natural top sits at the very start
// of the wrapper, so it went sticky the instant the section entered view
// at all, with the illustration's own top corners still cramped right up
// against the sticky offset instead of having scrolled into a settled
// position first (confirmed: a too-small value here reads as the images
// getting clipped at the top the moment it locks). Not part of the
// pinned range itself — purely a scroll distance to cover first.
const SPACER_PX = 35;

// The Services list reveals DURING this same ordinary pre-lock scroll —
// REVEAL_LEAD_PX worth of scrolling, ending exactly at the moment the
// panel goes sticky (pinStartScrollYRef) — not gated behind the video
// locking first. The clip itself stays frozen on its first frame (the
// ball at rest, off to the right of frame) the whole time; by the time
// its top reaches the Navbar and it snaps into its stuck position, the
// whole list is already fully visible. The heading/eyebrow/subtitle have
// no entrance effect at all — only the 4 list rows stagger in.
const REVEAL_LEAD_PX = 160;
const ROW_LOCAL_START = 0.34;
const ROW_STAGGER = 0.08;
const ROW_LOCAL_DURATION = 0.4;

// This single clip now carries TWO overlaid content phases across its
// timeline, converted from the source edit's own 30fps timecodes:
//
// 0s               -> ball at rest (off-center right), Services list shown
// 00:00:02:02 (2.07s) -> clip starts playing; Services list shrinks/fades
//                        out as the paper begins unfolding
// 00:00:02:29 (2.97s) -> paper is fully open/flat; About fades in on top
//                        of it
// 00:00:05:06 (5.2s)  -> About shrinks/fades out as the paper starts
//                        re-crumpling, taking it with it — same shrink-
//                        into-the-page treatment as Services
// ~8.15s (clip end)   -> paper fully re-formed into a small, centered
//                        ball (CTASection picks up from here as a plain
//                        static image once the pin releases)
//
// video.currentTime maps linearly across the ENTIRE pinned range (progress
// 0 -> 1), so it's automatically, exactly reversible on scroll-up.
const SERVICES_FADE_START_SECONDS = 2 + 2 / 30 - 0.8;
const SERVICES_FADE_END_SECONDS = 2 + 29 / 30 - 1.1;
const ABOUT_FADE_IN_START_SECONDS = SERVICES_FADE_END_SECONDS;
const ABOUT_FADE_IN_END_SECONDS = 3.4 - 0.8;
const ABOUT_FADE_OUT_START_SECONDS = 5 + 6 / 30 - 0.5;
const ABOUT_FADE_OUT_END_SECONDS = 6.1 - 0.5;
const CONTENT_SHRINK_SCALE = 0.6;

// PANEL_STICKY_TOP_PX is the panel's *real* sticky top offset — negative,
// so once stuck its own top edge sits slightly above the viewport,
// letting the video's composition keep scrolling a bit further before
// locking instead of stopping dead the instant it reaches the top. Must
// stay in sync with the `-top-[20px]` on the panel's own className below
// (a literal Tailwind value, can't reference this constant directly).
const PANEL_STICKY_TOP_PX = -20;

// The heading zone's rest-state padding — must be animated down to 0 in
// lockstep with its own `height` (see update()), not left as a fixed
// Tailwind class: with box-sizing: border-box, a padded box's `height`
// can never be set below its own padding sum, so a fixed pt/pb class
// would silently floor the "collapse to 0" animation at that sum instead
// of actually reaching 0.
const HEADING_ZONE_PADDING_TOP_PX = 80;
const HEADING_ZONE_PADDING_BOTTOM_PX = 24;

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

interface ServiceRowProps {
  service: (typeof services)[number];
  index: number;
  rowRef: (el: HTMLAnchorElement | null) => void;
}

function ServiceRow({ service, index, rowRef }: ServiceRowProps) {
  const Icon = service.icon;
  return (
    <Link
      ref={rowRef}
      href={service.href}
      style={{ opacity: 0, transform: "translateY(24px)" }}
      className="group flex items-center justify-between gap-6 border-b border-black/8 py-6 pe-10 first:pt-0 last:border-b-0"
    >
      <div className="flex items-center gap-5">
        <span className="font-display text-4xl font-bold text-black">{String(index + 1).padStart(2, "0")}</span>
        <span className="w-px self-stretch bg-black/10" />
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.02]">
          <Icon size={22} strokeWidth={1.5} className="text-black/70" />
        </div>
        <div className="text-right">
          <h3 className="font-display text-lg font-bold text-black">{service.title}</h3>
          <p className="mt-1 whitespace-pre-line font-body text-[13px] leading-[1.6] text-black/55">{service.description}</p>
        </div>
      </div>

      <ArrowLeft
        aria-hidden
        size={32}
        strokeWidth={2.25}
        className="shrink-0 text-black transition-transform duration-200 group-hover:-translate-x-1"
      />
    </Link>
  );
}

const ServicesHeading = forwardRef<HTMLHeadingElement>(function ServicesHeading(_props, ref) {
  return (
    <h2 ref={ref} className="font-display text-6xl font-bold text-black md:text-7xl">
      מה אני עושה
    </h2>
  );
});

function ServicesRowsBlock({ getRowRef }: { getRowRef?: (i: number) => (el: HTMLAnchorElement | null) => void }) {
  return (
    <div className="w-full">
      {/* Centered across the FULL panel width (list + the paper ball's own
          space beside it) — exactly in the middle of the whole frame,
          not shifted toward either side. */}
      <div className="flex w-full flex-col items-center text-center">
        <p className="max-w-[380px] font-body text-[15px] leading-[1.8] text-black/55">
          פתרונות דיגיטליים מותאמים אישית לעסקים שצריכים תוצאות.
        </p>
        <div className="mt-8 h-[3px] w-10 rounded-full bg-[image:var(--gradient-accent)]" />
      </div>

      {/* Docked left within a centered sub-zone (not the full panel width)
          so the rows end up close to the ball's own left edge instead of
          stranded against the panel's true left edge with a big gap
          before the ball. */}
      <div className="mx-auto mt-16 flex w-full max-w-[900px] justify-end">
        <div className="flex w-full max-w-[480px] flex-col">
          {services.map((service, i) => (
            <ServiceRow key={service.title} service={service} index={i} rowRef={getRowRef ? getRowRef(i) : () => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile/reduced-motion only — the heading and rows aren't split across
    two panel zones there (no pinned video to keep clear of), so they're
    just stacked together as one plain block. */
function ServicesListBlock({ getRowRef }: { getRowRef?: (i: number) => (el: HTMLAnchorElement | null) => void }) {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center text-center">
        <ServicesHeading />
      </div>
      <div className="mt-6">
        <ServicesRowsBlock getRowRef={getRowRef} />
      </div>
    </div>
  );
}

function AboutBlock() {
  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col items-center text-center">
      <span className="font-display text-xs font-medium tracking-[0.2em] text-black/45 uppercase">Who I Am</span>
      <h2 className="mt-3 font-display text-4xl font-bold text-black md:text-5xl">מי אני</h2>
      <p className="mt-2 font-body text-[16px] leading-[1.8] text-black/70">
        YEYE נולד מתוך אובססיה לפרטים קטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
        <strong className="text-black">ברמה הגבוהה ביותר</strong>. אני מעצב ומפתח עם ניסיון של שנים בבניית חוויות
        דיגיטליות <strong className="text-black">שלא רק נראות טוב, אלא עובדות</strong>.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {aboutValues.map((value) => {
          const Icon = value.icon;
          return (
            <Card key={value.title} light className="!p-4 flex flex-col items-center gap-2 text-center">
              <Icon size={18} strokeWidth={1.5} className="text-accent" />
              <span className="font-display text-[13px] font-bold text-black">{value.title}</span>
              <p className="font-body text-[12px] leading-[1.5] text-black/50">{value.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
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
  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingZoneRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const servicesContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  // The heading zone's own natural (unshrunk) height — measured once on
  // mount/resize, since it needs to be known BEFORE update() starts
  // driving that same height down toward 0 as the Services text fades.
  const headingZoneNaturalHeightRef = useRef(0);

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
    const headingZone = headingZoneRef.current;
    const heading = headingRef.current;
    const servicesContent = servicesContentRef.current;
    const aboutContent = aboutContentRef.current;
    if (!wrapper || !video || !headingZone || !heading || !servicesContent || !aboutContent) return;

    const rawScrollY = scrollY.get();
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));

    // Reveal progress — 0 at REVEAL_LEAD_PX before the panel locks, 1
    // exactly at lock (pinStartScrollYRef), and pinned at 1 for the rest
    // of the pinned range (mapRange/clamp01 clamp past both ends), which
    // is what holds the rows at their fully-revealed state through the
    // whole rest of the sequence.
    const revealT = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current - REVEAL_LEAD_PX, pinStartScrollYRef.current, 0, 1));

    rowRefs.current.forEach((row, i) => {
      if (!row) return;
      const start = ROW_LOCAL_START + i * ROW_STAGGER;
      const rowT = smoothstep(mapRange(revealT, start, start + ROW_LOCAL_DURATION, 0, 1));
      row.style.opacity = String(rowT);
      row.style.transform = `translateY(${lerp(24, 0, rowT)}px)`;
    });

    // video.currentTime is a pure linear function of scroll progress
    // across the whole pinned range, so it's automatically, exactly
    // reversible on scroll-up; no separate "rewind" logic needed.
    const targetTime = progress * videoDurationRef.current;
    if (videoReadyRef.current && Math.abs(video.currentTime - targetTime) > 0.008) {
      video.currentTime = targetTime;
    }

    const servicesShrinkT = smoothstep(mapRange(targetTime, SERVICES_FADE_START_SECONDS, SERVICES_FADE_END_SECONDS, 0, 1));
    heading.style.opacity = String(1 - servicesShrinkT);
    heading.style.transform = `scale(${lerp(1, CONTENT_SHRINK_SCALE, servicesShrinkT)})`;
    // The heading zone's own height (and padding — see that constant's
    // own comment) collapses in step with its fade — the video zone
    // below it grows to fill the freed space, so by the time the paper
    // is fully open the video is flush with the panel's top edge (no gap
    // left exposing its own boundary against the page).
    headingZone.style.height = `${lerp(headingZoneNaturalHeightRef.current, 0, servicesShrinkT)}px`;
    headingZone.style.paddingTop = `${lerp(HEADING_ZONE_PADDING_TOP_PX, 0, servicesShrinkT)}px`;
    headingZone.style.paddingBottom = `${lerp(HEADING_ZONE_PADDING_BOTTOM_PX, 0, servicesShrinkT)}px`;

    servicesContent.style.opacity = String(1 - servicesShrinkT);
    servicesContent.style.transform = `scale(${lerp(1, CONTENT_SHRINK_SCALE, servicesShrinkT)})`;

    const aboutFadeInT = smoothstep(mapRange(targetTime, ABOUT_FADE_IN_START_SECONDS, ABOUT_FADE_IN_END_SECONDS, 0, 1));
    const aboutShrinkT = smoothstep(mapRange(targetTime, ABOUT_FADE_OUT_START_SECONDS, ABOUT_FADE_OUT_END_SECONDS, 0, 1));
    // Same combined curve drives both opacity and scale — small and
    // invisible before it starts, growing to full size as it fades in,
    // then shrinking back down as it fades out, instead of popping in at
    // full size the instant opacity starts rising.
    const aboutGrowT = aboutFadeInT * (1 - aboutShrinkT);
    aboutContent.style.opacity = String(aboutGrowT);
    aboutContent.style.transform = `scale(${lerp(CONTENT_SHRINK_SCALE, 1, aboutGrowT)})`;
  };

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    const panel = panelRef.current;
    if (!wrapper || !spacer || !panel) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    // The panel sticks at PANEL_STICKY_TOP_PX (its own real CSS top, not
    // NAVBAR_CLEARANCE_PX — see that constant's own comment for why the
    // two split), so the old "the two clearance terms cancel out"
    // shortcut (which relied on panelHeight === innerHeight exactly) no
    // longer holds — a sticky element with `top: T` releases once
    // scrollY >= wrapperTop + wrapperHeight - panelHeight - T, so T has
    // to be subtracted explicitly here regardless.
    // pinStart is likewise offset by the lead-in spacer's own height —
    // the panel's natural (unstuck) top sits that far below the
    // wrapper's own top, so it doesn't reach the sticky threshold until
    // scroll has covered that extra distance too.
    pinStartScrollYRef.current = wrapperTop + spacer.offsetHeight - PANEL_STICKY_TOP_PX;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - panel.offsetHeight - PANEL_STICKY_TOP_PX;
  };

  // The heading zone's height AND padding are JS-controlled after the
  // first update() call, so re-measuring its *natural* height on resize
  // means resetting both to their rest-state values first — otherwise
  // this would just read back whatever (possibly mid-collapse) values
  // update() last wrote.
  const measureHeadingZoneHeight = () => {
    const headingZone = headingZoneRef.current;
    if (!headingZone) return;
    const prevHeight = headingZone.style.height;
    const prevPaddingTop = headingZone.style.paddingTop;
    const prevPaddingBottom = headingZone.style.paddingBottom;
    headingZone.style.height = "auto";
    headingZone.style.paddingTop = `${HEADING_ZONE_PADDING_TOP_PX}px`;
    headingZone.style.paddingBottom = `${HEADING_ZONE_PADDING_BOTTOM_PX}px`;
    headingZoneNaturalHeightRef.current = headingZone.getBoundingClientRect().height;
    headingZone.style.height = prevHeight;
    headingZone.style.paddingTop = prevPaddingTop;
    headingZone.style.paddingBottom = prevPaddingBottom;
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

    measureHeadingZoneHeight();
    measurePinRange();
    update();

    const handleResize = () => {
      measureHeadingZoneHeight();
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapper);
    if (panelRef.current) ro.observe(panelRef.current);

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
          <ServicesListBlock />
        </div>
        <div className="relative z-10 mx-auto mt-20 max-w-[1200px]">
          <AboutBlock />
        </div>
      </section>
    );
  }

  if (isMobile) {
    // No pin, no scroll-scrub — the clip just autoplays/loops normally as
    // ambient background texture (cheap: a real-time decode loop, not a
    // seek on every scroll tick, which is what's actually janky on
    // touch/Safari), while the Services list and About block reveal with
    // plain scroll-into-view fades, stacked normally, same as the rest of
    // the site's mobile sections.
    return (
      <section id="services" className="relative overflow-hidden bg-white px-6 py-16">
        <BackgroundVideo autoPlay className="absolute inset-0 h-full w-full object-contain opacity-25" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ServicesListBlock />
          </motion.div>

          <SwipeCarousel className="mt-4">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} light tone="neutral" />
            ))}
          </SwipeCarousel>
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AboutBlock />
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} id="services" className="relative h-[calc(575.2vh+260px)] bg-white">
      {/* SPACER_PX of perfectly ordinary scrolling before the panel below
          goes sticky — see its own comment up top. */}
      <div ref={spacerRef} aria-hidden="true" style={{ height: `${SPACER_PX}px` }} />

      {/* Capped to exactly one viewport tall — the clip's own real aspect
          (servicesbg.mp4 is 16:9) is close enough to most viewports that
          object-contain (never crops/zooms the ball itself) shows it
          edge to edge with little to no visible margin, and any leftover
          margin is invisible anyway since the clip's own background and
          this container are both plain white. */}
      <div ref={panelRef} className="sticky -top-[20px] flex h-screen w-full flex-col overflow-hidden bg-white">
        {/* Heading zone — just the h2, sitting in plain white space above
            the video (not layered on top of it). Its own height collapses
            toward 0 as the Services text fades (see update()), so the
            video zone below grows to fill the whole panel by the time the
            paper is fully open, leaving no gap that would expose its own
            edge against the page. */}
        <div
          ref={headingZoneRef}
          className="relative z-10 flex shrink-0 items-center justify-center overflow-hidden px-6"
          style={{ paddingTop: HEADING_ZONE_PADDING_TOP_PX, paddingBottom: HEADING_ZONE_PADDING_BOTTOM_PX }}
        >
          <ServicesHeading ref={headingRef} />
        </div>

        {/* Video zone — the ball/paper clip, plus everything that stays
            aligned with it: the subtitle, divider, and rows (Services
            phase), then About (its own phase), positioned relative to
            *this* zone rather than the whole panel. */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <BackgroundVideo ref={videoRef} className="absolute inset-0 h-full w-full object-contain" />

          {/* Two content layers share the same on-screen slot — Services
              fades/shrinks out first (as the paper unfolds), then About
              fades in on top of the now-open paper and shrinks/fades out
              in turn (as it re-crumples) — never both visible at once,
              since aboutContent starts at opacity 0 until the paper is
              open. */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-24">
            <div ref={servicesContentRef} className="flex w-full justify-end">
              <ServicesRowsBlock
                getRowRef={(i) => (el) => {
                  rowRefs.current[i] = el;
                }}
              />
            </div>

            <div ref={aboutContentRef} className="pointer-events-none absolute inset-x-0 px-6" style={{ opacity: 0 }}>
              <AboutBlock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
