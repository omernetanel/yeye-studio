"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Layers, PenTool, Rocket, ShoppingBag } from "lucide-react";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import ServiceCard from "@/components/ui/ServiceCard";
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

// What is actually true about how the work gets done. No counts and no client
// logos on purpose: with a young practice those numbers are small, and putting
// a small number in large type advertises the gap rather than closing it. These
// three claims cost nothing to state and are worth more, because a studio that
// hands work to juniors or starts from a template cannot state them at all.
const aboutFacts = [
  {
    title: "איש אחד, מקצה לקצה",
    description: "העיצוב והפיתוח באותן ידיים, כך ששום כוונה לא הולכת לאיבוד בדרך.",
  },
  {
    title: "הכל נבנה מאפס",
    description: "בלי תבניות ובלי תוספים. כל פרויקט נבנה בדיוק למה שהוא צריך לעשות.",
  },
  {
    title: "מדברים ישירות איתי",
    description: "בלי מנהל פרויקט באמצע, בלי מתווך, ובלי לחכות בתור.",
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
const VIDEO_REST_SCALE = 1.10;
const VIDEO_REST_SHIFT_X_PX = 45;

// servicesbg.mp4 is 16:9; used to locate the picture's own edge inside the
// letterboxed element so it can be trimmed (see update()).
const VIDEO_ASPECT = 16 / 9;
const VIDEO_EDGE_TRIM_PX = 2;

// The video zone is deliberately TALLER than the viewport (it is pulled up
// 86px so the resting ball fits the screen), which means object-contain sizes
// the sheet to the zone rather than to the screen. While the paper is a small
// ball that is invisible, but the moment it unfolds to fill the frame it runs
// off an edge — and shifting it only ever trades a cut top for a cut bottom.
// So the open state also scales down to whatever actually fits the viewport,
// and shifts to sit centred in it.
const VIDEO_OPEN_SCALE = 0.86;
const VIDEO_OPEN_SHIFT_Y_PX = 63;

// The ball starts unfolding into the plane at ~11.1s (measured off the clip),
// so the frame finishes opening to full bleed just before that and the plane
// is never anything but edge to edge. The window starts after 8.13s, which is
// where the old clip ended — so none of the tuning above is touched.
const PLANE_FULLBLEED_START_SECONDS = 9.3;
const PLANE_FULLBLEED_END_SECONDS = 11.0;
// A hair beyond an exact cover, so a fractional viewport height can never
// leave a one-pixel seam at an edge.
const VIDEO_FULLBLEED_OVERSCAN = 0.02;

// The closing statement rises into the bottom of the pinned frame while the
// plane is still in flight, and stays there: the clip's last second is plain
// white, so once scrolling reaches the end the whole screen is the sentence on
// white, held until the pin releases into the contact stage.
const STATEMENT_FADE_IN_START_SECONDS = 13.0;
const STATEMENT_FADE_IN_END_SECONDS = 14.4;
const STATEMENT_RISE_PX = 26;

// Once the clip has run out, the pin does NOT release straight away. There is
// a tail of scroll in which the statement — now the only thing on screen —
// draws down and lifts a little, and then a shorter stretch where it is parked
// and nothing moves at all, so it reads as having settled before the page
// carries on. Both are viewport-relative, and both are part of the wrapper
// height below rather than extra range stolen from the clip's own scrub.
const STATEMENT_TAIL_VH = 60;
const STATEMENT_PARK_VH = 25;
const STATEMENT_TAIL_SCALE = 0.88;
const STATEMENT_TAIL_RISE_PX = 72;

// PANEL_STICKY_TOP_PX is the panel's *real* sticky top offset — negative,
// so once stuck its own top edge sits slightly above the viewport,
// letting the video's composition keep scrolling a bit further before
// locking instead of stopping dead the instant it reaches the top. Must
// stay in sync with the `-top-[20px]` on the panel's own className below
// (a literal Tailwind value, can't reference this constant directly).
const PANEL_STICKY_TOP_PX = -20;

// The panel is stuck slightly ABOVE the viewport top, so its own centre sits
// PANEL_STICKY_TOP_PX above the screen's. Cancelling that exactly is what puts
// the block on the centre of the SCREEN rather than the centre of the panel —
// which matters because that same point is what it scales into on the way out.
const ABOUT_SHIFT_Y_PX = -PANEL_STICKY_TOP_PX;

// The heading zone's rest-state padding — must be animated down to 0 in
// lockstep with its own `height` (see update()), not left as a fixed
// Tailwind class: with box-sizing: border-box, a padded box's `height`
// can never be set below its own padding sum, so a fixed pt/pb class
// would silently floor the "collapse to 0" animation at that sum instead
// of actually reaching 0.
const HEADING_ZONE_PADDING_TOP_PX = 44;
const HEADING_ZONE_PADDING_BOTTOM_PX = 8;

// Scroll no longer maps straight onto the clip's timeline. At each of these
// moments the clip FREEZES while scrolling keeps accumulating, so the page
// genuinely stops on the content instead of sliding past it — and because it
// is still scroll-driven, it stays exactly reversible on the way back up.
// `share` is the fraction of the whole pinned range spent held.
// The share is derived, not eyeballed. It and the wrapper height below are
// solved together from two constraints, so that lengthening the clip changes
// nothing about how the opening 8.13s feel:
//   scroll-per-second equal:  (1 - Sn)/Dn * Hn = (1 - So)/Do * Ho
//   hold length equal:        Sn * Hn          = So * Ho
// With Do = 8.133s, So = 0.13 and Dn = 18.467s that gives Hn = 2.1053 * Ho
// and Sn = 0.13 / 2.1053. Both numbers below are those results.
const TIME_HOLDS: { at: number; share: number }[] = [
  { at: 3.7, share: 0.0617 }, // "מי אני" fully up, paper flat
];
const TOTAL_HOLD_SHARE = TIME_HOLDS.reduce((sum, h) => sum + h.share, 0);

function progressToTime(progress: number, duration: number) {
  // Scroll-per-second for the moving stretches, once the holds have taken
  // their share of the range.
  const rate = (1 - TOTAL_HOLD_SHARE) / duration;
  let consumed = 0;
  let fromTime = 0;
  for (const hold of TIME_HOLDS) {
    const span = (hold.at - fromTime) * rate;
    if (progress <= consumed + span) return fromTime + (progress - consumed) / rate;
    consumed += span;
    if (progress <= consumed + hold.share) return hold.at;
    consumed += hold.share;
    fromTime = hold.at;
  }
  return fromTime + (progress - consumed) / rate;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

// Where object-contain actually puts the picture inside a box of elW x elH.
// The picture's own edge sits well inside the element's box, and both the
// hairline trim and the full-bleed scale below need to know exactly where.
function containedPictureSize(elW: number, elH: number) {
  let contentW = elW;
  let contentH = elW / VIDEO_ASPECT;
  if (contentH > elH) {
    contentH = elH;
    contentW = elH * VIDEO_ASPECT;
  }
  return { contentW, contentH };
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

// Every row hovers to the same grey. It used to be a different accent per row,
// which fought the black-and-white section around it; a single neutral reads as
// a hover state rather than as four unrelated brand colours.
// Literal class strings (not built from interpolation) so Tailwind's JIT
// scanner — which only ever detects classes it can see verbatim in the
// source — actually generates these arbitrary-color utilities.
const ROW_HOVER_TEXT_CLASS = "group-hover:text-[#8A8A8A]";
const ROW_HOVER_BORDER_CLASS = "group-hover:border-[#8A8A8A]";

function ServiceRow({ service, index }: ServiceRowProps) {
  const Icon = service.icon;
  const hoverTextClass = ROW_HOVER_TEXT_CLASS;
  const hoverBorderClass = ROW_HOVER_BORDER_CLASS;
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
      <h2 className="font-display text-4xl leading-[1.2] font-bold text-black md:text-[44px]">
        אני בונה פתרונות דיגיטליים
        <br />
        לעסקים שרוצים תוצאות.
      </h2>
      <p className="mt-2 font-body text-[15px] leading-[1.8] text-black/55">ובתכל&rsquo;ס, זה מה שאני עושה:</p>
    </div>
  );
});

function ServicesRowsBlock() {
  return (
    <div
      className="isolate mx-auto flex w-full max-w-[900px] -translate-x-[15px] translate-y-[94px] justify-end"
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

/**
 * The "who I am" block: copy and numbered value cards on one side, a portrait
 * on the other.
 *
 * The pair is laid out as one centred composition rather than two columns
 * pinned to the page edges, because the whole block is positioned — and shrunk
 * away — against the centre of the screen. Anything anchored to an edge would
 * slide sideways as it scaled instead of collapsing into the middle.
 */
/**
 * The hand-drawn underline that goes beneath a heading — a single brush stroke
 * that thickens through the middle and tapers at both ends, rather than a rule.
 * Drawn as a filled outline rather than a stroked line precisely so the weight
 * can vary along it, which is what makes it read as drawn instead of ruled.
 */
function HeadingSwash({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 16"
      fill="none"
      aria-hidden="true"
      className={cn("block h-auto", className)}
      preserveAspectRatio="none"
    >
      <path
        d="M3.5 9.2c34-3.6 68-5.4 102-5.6 34-.2 68 1.2 131.5 4.4-63.4 1.2-97.4 2.9-131.4 4-34 1.1-68 1.8-102 1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function AboutBlock() {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] items-center justify-center gap-10 lg:gap-14">
      <figure className="relative m-0 hidden shrink-0 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/portrait.webp"
          alt="עומר, מייסד YEYE Digital"
          width={430}
          height={560}
          className="h-[430px] w-[330px] rounded-2xl object-cover shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          draggable={false}
        />
        <figcaption className="mt-4 text-right font-body text-[13px] leading-[1.6] text-black/70">
          אני כאן כדי להפוך את הרעיון שלך
          <br />
          <strong className="font-semibold text-black">למוצר דיגיטלי שמייצר אימפקט.</strong>
        </figcaption>
      </figure>

      {/* No items-end: under dir="rtl" the flex END is the LEFT, so it shrank
          each paragraph to its own text width and pinned it left, leaving their
          right edges ragged against the full-width list below. */}
      <div className="flex max-w-[560px] flex-col text-right">
        {/* The heading is centred over its own column, with the swash under it
            — the rest of the column stays right-aligned. */}
        <div className="mx-auto flex flex-col items-center">
          <h2 className="font-display text-[40px] leading-none font-bold text-black sm:text-5xl md:text-[64px]">
            מי אני?
          </h2>
          <HeadingSwash className="mt-2 w-[190px] text-black md:w-[230px]" />
        </div>
        {/* The line breaks are the author's own. They are kept only from md up
            — forced at a narrow width they would break in the middle of a
            phrase, so below that the text wraps naturally. */}
        <p className="mt-6 font-body text-[15px] leading-[1.85] text-black/70">
          YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי
          <br className="hidden md:block" /> לנוכחות דיגיטלית{" "}
          <strong className="font-semibold text-black">ברמה הגבוהה ביותר</strong>.
        </p>
        <p className="mt-4 font-body text-[15px] leading-[1.85] text-black/70">
          אני עומר, מעצב מגיל 15 ומפתח מגיל 17, ואני בונה חוויות דיגיטליות
          <br className="hidden md:block" />{" "}
          <strong className="font-semibold text-black">שלא רק נראות טוב, אלא עובדות.</strong>
        </p>

        {/* Not cards, and deliberately not numbers. Every one of these is a
            plain fact about how the work is actually done, which a studio that
            subcontracts or assembles templates could not honestly write — where
            "Design-First" and a project count are things anyone can claim and
            nobody can check. Set as quiet rules-and-type rather than boxes so
            they read as substance rather than feature badges. */}
        <dl className="mt-7 w-full divide-y divide-black/10 border-y border-black/10">
          {aboutFacts.map((fact) => (
            <div key={fact.title} className="flex flex-col gap-1 py-3 text-right sm:flex-row sm:gap-4">
              <dt className="font-display text-[14px] font-bold whitespace-nowrap text-black sm:w-[150px]">
                {fact.title}
              </dt>
              <dd className="m-0 font-body text-[13px] leading-[1.6] text-black/55">{fact.description}</dd>
            </div>
          ))}
        </dl>
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
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
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
  // The heading zone's own natural (unshrunk) height — measured once on
  // mount/resize, since it needs to be known BEFORE update() starts
  // driving that same height down toward 0 as the Services text fades.
  const headingZoneNaturalHeightRef = useRef(0);
  const headingShineDoneRef = useRef(false);

  // Analytical, not scrollYProgress-derived — same reasoning as the Hero's
  // own pin: a target-scoped scrollYProgress motion value lags an instant
  // or fast scroll jump by a frame or two (its target rect is re-measured
  // on its own schedule), which is exactly the kind of drift that would
  // throw off a precise video-frame seek. A live rect measurement plus the
  // raw global scrollY never do that.
  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);
  // Where the clip's own scrub finishes. Everything between here and pinEnd is
  // the statement's tail, so the clip must not be mapped across it.
  const clipEndScrollYRef = useRef(0);
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
    // Against clipEnd, not pinEnd — the statement's tail past clipEnd is not
    // part of the clip's timeline, and mapping across it would slow the whole
    // scrub down and leave the clip finishing after the paper already had.
    const progress = clamp01(mapRange(rawScrollY, pinStartScrollYRef.current, clipEndScrollYRef.current, 0, 1));

    // video.currentTime is a pure linear function of scroll progress
    // across the whole pinned range, so it's automatically, exactly
    // reversible on scroll-up; no separate "rewind" logic needed.
    const targetTime = progressToTime(progress, videoDurationRef.current);
    if (videoReadyRef.current && Math.abs(video.currentTime - targetTime) > 0.008) {
      video.currentTime = targetTime;
    }

    const servicesShrinkT = smoothstep(mapRange(targetTime, SERVICES_FADE_START_SECONDS, SERVICES_FADE_END_SECONDS, 0, 1));

    // The ball sits slightly enlarged and shifted right at rest — clear
    // of the row text beside it — easing back to its natural scale/
    // position as the paper starts unfolding, same span as everything
    // else fading out.
    let scale = lerp(VIDEO_REST_SCALE, VIDEO_OPEN_SCALE, servicesShrinkT);
    let shiftX = lerp(VIDEO_REST_SHIFT_X_PX, 0, servicesShrinkT);
    let shiftY = lerp(0, VIDEO_OPEN_SHIFT_Y_PX, servicesShrinkT);

    // Then, once the ball is about to unfold into the plane, the frame opens
    // out to full bleed. Up to here the picture is deliberately smaller than
    // the panel, which is right for the ball but wrong for the plane: it would
    // fly off the picture's own edge with white page still around it, and read
    // as being cut in mid-air rather than leaving the screen. Everything is
    // measured live rather than hardcoded, so it covers at any viewport.
    const panel = panelRef.current;
    const videoZone = videoZoneRef.current;
    const fullBleedT = smoothstep(
      mapRange(targetTime, PLANE_FULLBLEED_START_SECONDS, PLANE_FULLBLEED_END_SECONDS, 0, 1),
    );
    if (fullBleedT > 0 && panel && videoZone) {
      const { contentW, contentH } = containedPictureSize(video.clientWidth, video.clientHeight);
      if (contentW > 0 && contentH > 0) {
        const panelW = panel.clientWidth;
        const panelH = panel.clientHeight;
        // Cover, not contain — the clip's own background is the same flat
        // white as the page, so cropping its long edge costs nothing.
        const coverScale =
          Math.max(panelW / contentW, panelH / contentH) * (1 + VIDEO_FULLBLEED_OVERSCAN);
        // The zone is pulled up above the panel, so the picture's centre and
        // the panel's centre are not the same point; close the gap or the
        // grown frame sits off-centre.
        const centreShiftY = panelH / 2 - (videoZone.offsetTop + video.clientHeight / 2);
        scale = lerp(scale, coverScale, fullBleedT);
        shiftX = lerp(shiftX, 0, fullBleedT);
        shiftY = lerp(shiftY, centreShiftY, fullBleedT);
      }
    }

    video.style.transform = `translateX(${shiftX}px) translateY(${shiftY}px) scale(${scale})`;

    const statement = statementRef.current;
    if (statement) {
      const statementT = smoothstep(
        mapRange(targetTime, STATEMENT_FADE_IN_START_SECONDS, STATEMENT_FADE_IN_END_SECONDS, 0, 1),
      );
      // Past the end of the clip the statement gets its own stretch of scroll:
      // it draws down and lifts, then holds through the park before the pin
      // releases. Driven off raw scroll rather than clip time, which has
      // nothing left to say by this point.
      const tailT = smoothstep(
        clamp01(
          mapRange(
            rawScrollY,
            clipEndScrollYRef.current,
            clipEndScrollYRef.current + (window.innerHeight * STATEMENT_TAIL_VH) / 100,
            0,
            1,
          ),
        ),
      );
      const y = lerp(STATEMENT_RISE_PX, 0, statementT) + lerp(0, -STATEMENT_TAIL_RISE_PX, tailT);
      statement.style.opacity = String(statementT);
      statement.style.transform = `translateY(${y}px) scale(${lerp(1, STATEMENT_TAIL_SCALE, tailT)})`;
    }

    // object-contain letterboxes the frame inside the element, so the picture
    // has its own edge sitting well inside the element's box — and scaling the
    // element drags that edge around with it. That edge is where a hairline has
    // been showing up. Clipping a couple of pixels off the picture's own bounds
    // removes the edge row the browser resamples, and the replacement boundary
    // is a plain CSS clip through flat white, which has nothing to resample.
    // Computed from the live box rather than hardcoded, so it tracks the
    // element at any viewport and any scale.
    const elW = video.clientWidth;
    const elH = video.clientHeight;
    if (elW > 0 && elH > 0) {
      const { contentW, contentH } = containedPictureSize(elW, elH);
      const insetX = (elW - contentW) / 2 + VIDEO_EDGE_TRIM_PX;
      const insetY = (elH - contentH) / 2 + VIDEO_EDGE_TRIM_PX;
      video.style.clipPath = `inset(${insetY}px ${insetX}px)`;
    }

    // The heading exits as a plain fade — no scale/shrink of its own
    // (explicitly requested; the rows below DO keep their shrink-to-center
    // exit). The zone collapse beneath it still happens regardless.
    heading.style.opacity = String(1 - servicesShrinkT);
    // Fired once, off the heading's own position on screen — the moment it is
    // fully in the viewport, which is the moment a reader would say it had
    // arrived. Keying it to the pin start instead put it 575px of scroll late
    // at 1280x690: the panel is only sticky after the lead-in, but the heading
    // rides into view well before that and just sat there waiting.
    if (!headingShineDoneRef.current) {
      const h2 = heading.querySelector("h2");
      const box = h2?.getBoundingClientRect();
      if (h2 && box && box.top >= 0 && box.bottom <= window.innerHeight) {
        headingShineDoneRef.current = true;
        h2.classList.add("heading-shine");
      }
    }
    // The zone around it collapses to nothing so the footage can grow into the
    // freed space, and the heading is centred in that zone — so left alone it
    // gets dragged upward as the zone shrinks, which reads as the text sliding
    // away rather than fading. Translating it back by half the collapse holds
    // it exactly still, leaving opacity as the only thing that changes.
    // With flex centring, the heading's centre sits at
    //   zoneTop + padTop + (height - padTop - padBottom) / 2
    // and every one of those three animates to zero together, so the centre
    // travels the whole of that offset. Compensating for the height alone
    // leaves the padding's share of the drift behind.
    const restCentreOffset =
      HEADING_ZONE_PADDING_TOP_PX +
      (headingZoneNaturalHeightRef.current - HEADING_ZONE_PADDING_TOP_PX - HEADING_ZONE_PADDING_BOTTOM_PX) / 2;
    heading.style.transform = `translateY(${restCentreOffset * servicesShrinkT}px)`;
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
    // Both the entrance and the exit scale about the centre of the screen, so
    // the block grows out of that point and collapses straight back into it
    // rather than drifting toward a corner on the way out.
    //
    // The origin is recomputed on every frame where the block is at its own
    // full size, from its live box: the element is centred by flex, but the
    // panel it sits in is only one screen tall while the block's own box is
    // not necessarily the same height, so "the middle of the element" and
    // "the middle of the screen" are not the same point and the difference
    // moves with the viewport. Measuring it live also means a fast flick that
    // skips the fully-grown frame entirely cannot leave a stale origin behind
    // — the fallback below is already screen-centre in element terms.
    // The block is centred on the screen, so its own centre IS the screen
    // centre and a plain 50% 50% origin grows it out of that point and
    // collapses it straight back into it. Nothing measured, so there is no
    // origin that can go stale when a fast flick skips a frame.
    aboutContent.style.transformOrigin = "50% 50%";
    aboutContent.style.opacity = String(aboutGrowT);
    aboutContent.style.transform = `translateY(${ABOUT_SHIFT_Y_PX}px) scale(${lerp(CONTENT_SHRINK_SCALE, 1, aboutGrowT)})`;
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
    clipEndScrollYRef.current =
      pinEndScrollYRef.current - (window.innerHeight * (STATEMENT_TAIL_VH + STATEMENT_PARK_VH)) / 100;
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
    // 790vh+260px scaled by the 2.1053 solved for at TIME_HOLDS. The clip is
    // 2.27x longer than the one this range was tuned against, so leaving the
    // height alone would have handed the opening 8.13s less than half the
    // scroll they had and run the whole thing at 2.27x speed.
    // 1663vh+547px of clip scrub, plus STATEMENT_TAIL_VH + STATEMENT_PARK_VH
    // for the statement's own tail after the clip has finished.
    <section ref={wrapperRef} id="services" className="relative h-[calc(1748vh+547px)] bg-white">
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
          className="relative z-10 flex shrink-0 items-center justify-center px-6"
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
        <div ref={videoZoneRef} className="relative -mt-[86px] min-h-0 flex-1 overflow-hidden">
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

          </div>
        </div>

        {/* On the PANEL, not inside the video zone. The zone is pulled up 86px
            and runs taller than a screen, so a box filling it is not centred on
            the screen — and the screen's centre is exactly the point this block
            has to grow out of and collapse back into. */}
        <div
          ref={aboutContentRef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6"
          style={{ opacity: 0 }}
        >
          <AboutBlock />
        </div>

        {/* The closing statement, delivered inside the pinned frame rather than
            as a section of its own below it. By the time it rises the clip is
            full-bleed white with the plane still in it, so the sentence reads
            as landing on the same surface the paper was on — and it is still
            there, alone on white, when the clip runs out. Sits on the panel
            rather than inside the video zone so the zone's overflow clip and
            the video's own transform can never touch it. */}
        <div
          ref={statementRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-14"
          // Scales about its own right edge, which is the edge the text is set
          // against — about the centre it would drift left as it shrank and
          // break the alignment it shares with everything else on the page.
          style={{ opacity: 0, transformOrigin: "100% 50%" }}
        >
          <p className="mx-auto max-w-[1400px] text-right font-display text-[42px] leading-[1.15] font-normal text-black md:text-[62px] lg:text-[84px]">
            עיצוב מושך תשומת לב.
            <br />
            חשיבה יוצרת תוצאה.
          </p>
        </div>
      </div>
    </section>
  );
}
