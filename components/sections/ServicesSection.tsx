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
import { cn } from "@/lib/utils";

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
// A beat where the Services text sits fully visible once the panel pins,
// before it starts fading at all. Without it the fade begins so early in
// the pinned range that a single normal scroll flick covers the entire
// fade window, so the heading reads as vanishing the instant it arrives.
// Shifts the Services fade and About's entrance together (About's exit is
// deliberately left where it is), so the gap between the two phases —
// and About's own fade-in duration — stay exactly as tuned.
const SERVICES_HOLD_SECONDS = 0.5;
const SERVICES_FADE_START_SECONDS = 2 + 2 / 30 - 0.8 + SERVICES_HOLD_SECONDS;
const SERVICES_FADE_END_SECONDS = 2 + 29 / 30 - 1.1 + SERVICES_HOLD_SECONDS;
const ABOUT_FADE_IN_START_SECONDS = SERVICES_FADE_END_SECONDS + 0.5;
const ABOUT_FADE_IN_END_SECONDS = 3.4 - 0.8 + 0.5 + SERVICES_HOLD_SECONDS;
const ABOUT_FADE_OUT_START_SECONDS = 5 + 6 / 30 - 0.5;
const ABOUT_FADE_OUT_END_SECONDS = 6.1 - 0.5;
const CONTENT_SHRINK_SCALE = 0.6;
const VIDEO_REST_SCALE = 1.46;
const VIDEO_REST_SHIFT_X_PX = 45;

// About's entrance keeps this custom, off-center origin (matches the
// direction the paper unfolds toward), but its exit switches to the true
// panel center instead of re-using this same point — see the switch in
// update(). Safe to swap the instant the shrink phase starts: scale is
// exactly 1 at that boundary, so transform-origin has no visible effect
// yet.
const ABOUT_ENTRANCE_ORIGIN = "72% 82%";

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
const HEADING_ZONE_PADDING_TOP_PX = 44;
const HEADING_ZONE_PADDING_BOTTOM_PX = 8;

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
}

// Literal class strings (not built from interpolation) so Tailwind's JIT
// scanner — which only ever detects classes it can see verbatim in the
// source — actually generates these arbitrary-color utilities.
const ROW_HOVER_TEXT_CLASSES = [
  "group-hover:text-[#FF9D3C]",
  "group-hover:text-[#3CD9FF]",
  "group-hover:text-[#A7FF3C]",
  "group-hover:text-[#FF4FD8]",
];

const ROW_HOVER_BORDER_CLASSES = [
  "group-hover:border-[#FF9D3C]",
  "group-hover:border-[#3CD9FF]",
  "group-hover:border-[#A7FF3C]",
  "group-hover:border-[#FF4FD8]",
];

function ServiceRow({ service, index }: ServiceRowProps) {
  const Icon = service.icon;
  const hoverTextClass = ROW_HOVER_TEXT_CLASSES[index];
  const hoverBorderClass = ROW_HOVER_BORDER_CLASSES[index];
  return (
    <Link
      href={service.href}
      className="group flex items-center justify-between gap-6 border-b border-black/8 py-5 pe-10 first:pt-0 last:border-b-0"
    >
      <div className="flex items-center gap-5">
        <span className={cn("font-display text-5xl leading-none font-bold text-black transition-colors duration-200", hoverTextClass)}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="w-px self-stretch bg-black/10" />
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.02] transition-colors duration-200",
            hoverBorderClass
          )}
        >
          <Icon size={20} strokeWidth={1.5} className={cn("text-black/70 transition-colors duration-200", hoverTextClass)} />
        </div>
        <div className="text-right">
          <h3 className={cn("font-display text-lg font-bold text-black transition-colors duration-200", hoverTextClass)}>{service.title}</h3>
          <p
            className={cn(
              "mt-1 whitespace-pre-line font-body text-[13px] leading-[1.6] text-black/55 transition-colors duration-200",
              hoverTextClass
            )}
          >
            {service.description}
          </p>
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

// Heading zone content — the h2 AND the subtitle/divider beneath it live
// together here now, not split across the heading zone and the video
// zone's row block. The video zone's own height (and therefore this
// group's vertical centering within it) depends on viewport resolution,
// so a resolution where that centering pushed the subtitle above the
// zone's clipped (overflow-hidden) bounds was rendering it invisible even
// though it was still technically "there" in the DOM.
const ServicesHeading = forwardRef<HTMLDivElement>(function ServicesHeading(_props, ref) {
  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      {/* Sized well below the old two-word heading: this is a full sentence
          on two lines, so 72px would tower over the rest of the panel and
          eat the height the list and the ball need. */}
      <h2 className="font-display text-4xl leading-[1.2] font-bold text-black md:text-5xl">
        אני בונה פתרונות דיגיטליים
        <br />
        לעסקים שרוצים תוצאות.
      </h2>
      <p className="mt-2 font-body text-[15px] leading-[1.8] text-black/55">ובתכל&rsquo;ס, זה מה שאני עושה:</p>
      <div className="mt-4 h-[3px] w-10 rounded-full bg-[image:var(--gradient-accent)]" />
    </div>
  );
});

function ServicesRowsBlock() {
  return (
    <div
      className="isolate mx-auto flex w-full max-w-[900px] -translate-x-[15px] translate-y-[82px] justify-end"
    >
      <div className="flex w-full max-w-[480px] origin-center scale-[0.95] flex-col">
        {services.map((service, i) => (
          <ServiceRow key={service.title} service={service} index={i} />
        ))}
      </div>
    </div>
  );
}

/** Mobile/reduced-motion only — the heading and rows aren't split across
    two panel zones there (no pinned video to keep clear of), so they're
    just stacked together as one plain block. */
function ServicesListBlock() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center text-center">
        <ServicesHeading />
      </div>
      <div className="mt-6">
        <ServicesRowsBlock />
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
  const headingRef = useRef<HTMLDivElement>(null);
  const servicesContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  // About's exit-phase transform-origin (screen center, in pixels relative
  // to its own box) — measured live in update() while About is fully
  // visible. "50% 50%" (its own center, which sits near screen center
  // anyway) is only the fallback for a scroll jump so fast the fully-
  // visible window was never sampled.
  const aboutCenterOriginRef = useRef("50% 50%");
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

    // video.currentTime is a pure linear function of scroll progress
    // across the whole pinned range, so it's automatically, exactly
    // reversible on scroll-up; no separate "rewind" logic needed.
    const targetTime = progress * videoDurationRef.current;
    if (videoReadyRef.current && Math.abs(video.currentTime - targetTime) > 0.008) {
      video.currentTime = targetTime;
    }

    const servicesShrinkT = smoothstep(mapRange(targetTime, SERVICES_FADE_START_SECONDS, SERVICES_FADE_END_SECONDS, 0, 1));

    // The ball sits slightly enlarged and shifted right at rest — clear
    // of the row text beside it — easing back to its natural scale/
    // position as the paper starts unfolding, same span as everything
    // else fading out.
    video.style.transform = `translateX(${lerp(VIDEO_REST_SHIFT_X_PX, 0, servicesShrinkT)}px) scale(${lerp(VIDEO_REST_SCALE, 1, servicesShrinkT)})`;

    // The heading exits as a plain fade — no scale/shrink of its own
    // (explicitly requested; the rows below DO keep their shrink-to-center
    // exit). The zone collapse beneath it still happens regardless.
    heading.style.opacity = String(1 - servicesShrinkT);
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
    // Once faded out, the row links must stop intercepting clicks meant
    // for whatever's now on top (About) — opacity alone doesn't disable
    // pointer-events, so a "fully invisible" row would otherwise still
    // swallow a click/hover.
    servicesContent.style.pointerEvents = servicesShrinkT > 0.5 ? "none" : "auto";

    const aboutFadeInT = smoothstep(mapRange(targetTime, ABOUT_FADE_IN_START_SECONDS, ABOUT_FADE_IN_END_SECONDS, 0, 1));
    const aboutShrinkT = smoothstep(mapRange(targetTime, ABOUT_FADE_OUT_START_SECONDS, ABOUT_FADE_OUT_END_SECONDS, 0, 1));
    // Same combined curve drives both opacity and scale — small and
    // invisible before it starts, growing to full size as it fades in,
    // then shrinking back down as it fades out, instead of popping in at
    // full size the instant opacity starts rising.
    const aboutGrowT = aboutFadeInT * (1 - aboutShrinkT);
    // Entrance and exit intentionally use different origins: growing in
    // keeps the custom off-center point, but the shrink-out re-centers on
    // the screen like Services' own exit does — switching exactly at
    // aboutShrinkT > 0 lands on scale === 1, so the origin change itself
    // causes no visible jump.
    aboutContent.style.transformOrigin = aboutShrinkT > 0 ? aboutCenterOriginRef.current : ABOUT_ENTRANCE_ORIGIN;
    aboutContent.style.opacity = String(aboutGrowT);
    aboutContent.style.transform = `scale(${lerp(CONTENT_SHRINK_SCALE, 1, aboutGrowT)})`;
    // The screen-center exit origin can only be measured HERE, live, while
    // About is fully grown and the panel is actually stuck — a mount-time
    // measurement reads the panel at its unstuck page position (and About
    // at its initial 0.6 scale), producing an origin thousands of pixels
    // off. Measured AFTER this frame's scale(1) write lands, so the rect
    // isn't skewed by a previous frame's leftover mid-grow scale.
    // getBoundingClientRect is already in viewport coordinates, so screen
    // center is just innerWidth/2 × innerHeight/2, no sticky-offset math.
    if (aboutFadeInT === 1 && aboutShrinkT === 0) {
      const rect = aboutContent.getBoundingClientRect();
      aboutCenterOriginRef.current = `${window.innerWidth / 2 - rect.left}px ${window.innerHeight / 2 - rect.top}px`;
    }
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

  // The rows' *exit* should shrink toward the true center of the panel,
  // not whichever point their own (much smaller/off-center) box happens
  // to center on. (The heading isn't involved — it exits as a plain fade,
  // no transform.) transform-origin only ever measures relative to the
  // element's own box, so hitting an arbitrary point like "panel center"
  // means computing that offset by hand, once at rest (before the element
  // has started shrinking, since the heading zone's own collapse would
  // throw off a mid-animation re-measurement).
  const measureShrinkOrigins = () => {
    const servicesContent = servicesContentRef.current;
    if (!servicesContent) return;
    // Computed directly from the panel's own known (fixed) sticky
    // geometry rather than panelRef.getBoundingClientRect() — the panel
    // is only actually *at* PANEL_STICKY_TOP_PX once scrolled into its
    // stuck state, so measuring its rect at mount (before that) would
    // read wherever it naturally sits in the page flow instead.
    const panelCenterX = window.innerWidth / 2;
    const panelCenterY = PANEL_STICKY_TOP_PX + window.innerHeight / 2;

    const servicesRect = servicesContent.getBoundingClientRect();
    servicesContent.style.transformOrigin = `${panelCenterX - servicesRect.left}px ${panelCenterY - servicesRect.top}px`;
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
    measureShrinkOrigins();
    measurePinRange();
    update();

    const handleResize = () => {
      measureHeadingZoneHeight();
      measureShrinkOrigins();
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
        <BackgroundVideo autoPlay className="absolute inset-0 h-full w-full bg-white object-contain opacity-25" />

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
            *this* zone rather than the whole panel.

            Pulled up under the heading rather than starting below it: the
            heading zone sits above at z-10 and simply overlaps the top of
            the footage, which buys the ball the height it needs to fit the
            screen instead of being pushed down and cropped. */}
        <div className="relative -mt-[86px] min-h-0 flex-1 overflow-hidden">
          {/* bg-white keeps object-contain's letterbox margin the same colour
              as the page.

              A thin vertical line reported beside the ball is NOT explained
              by either of these, both tried and ruled out against a real
              browser: (1) the letterbox margin's default black backing —
              bg-white changed nothing; (2) the clip's limited colour range
              (color_range=tv, white at Y=235) rendering the video rect as
              #EBEBEB on decoders that skip the limited->full expansion — a
              full-range re-encode changed nothing either. Cause still
              unknown; note it is invisible to headless testing here, which
              cannot decode H.264 at all and only ever shows the poster.

              If this clip is ever re-encoded, it MUST keep a dense GOP
              (-g 5; the source carries a keyframe every 5 frames). The
              scroll scrub seeks currentTime on every tick, so a default
              GOP makes each seek decode dozens of frames and visibly
              wrecks the animation. */}
          <BackgroundVideo ref={videoRef} className="absolute inset-0 h-full w-full bg-white object-contain" />

          {/* Two content layers share the same on-screen slot — Services
              fades/shrinks out first (as the paper unfolds), then About
              fades in on top of the now-open paper and shrinks/fades out
              in turn (as it re-crumples) — never both visible at once,
              since aboutContent starts at opacity 0 until the paper is
              open. */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-24">
            <div ref={servicesContentRef} className="flex w-full justify-end">
              <ServicesRowsBlock />
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
