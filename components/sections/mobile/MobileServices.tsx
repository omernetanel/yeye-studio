"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { services, aboutFacts } from "@/lib/content";

const CLIP_SRC = "/mobile/videos/servicesbg-mobile.mp4";
const CLIP_POSTER = "/mobile/images/servicesbg-mobile-poster.jpg";

// The clip's own frame rate and length, measured off the file: 458 frames at
// 30fps. Scroll is quantised onto that grid so a seek only ever goes out when
// the frame on screen would actually change — without it every animation frame
// asks for a decode the viewer cannot see.
const CLIP_FPS = 30;
const CLIP_SECONDS = 458 / CLIP_FPS;

// Cues taken from the edit, written the way they were read off it —
// seconds plus frames at 30fps.
const CUE_SERVICES_OUT = 1 + 22 / 30; // the paper opens and the list goes with it
const CUE_ABOUT_IN = 2 + 17 / 30; // "who I am" starts to arrive
const CUE_PAPER_FLAT = 3 + 12 / 30; // the sheet is fully open and holds still
const CUE_ABOUT_OUT = 4 + 29 / 30; // it collapses inward with the crumple
const CUE_STATEMENT_IN = 10 + 23 / 30; // the closing line rises behind the plane

const FADE_SECONDS = 0.35;

/**
 * How much scrolling each stretch of the clip is worth, as a run of
 * (progress, clip time) points that the scrub interpolates between.
 *
 * Two points sharing a time is a hold: the clip stands still while scrolling
 * keeps accumulating, which is what buys reading time without freezing the
 * page under the finger. Because it is arithmetic in both directions rather
 * than a played timeline, scrolling back up runs the paper backwards through
 * exactly the same frames.
 *
 * The reading holds sit where the picture is still. The one for "who I am"
 * deliberately starts at CUE_PAPER_FLAT rather than at the cue that brings the
 * text in, so the sheet finishes opening behind it instead of standing
 * half-unfurled for the whole time it is being read.
 */
const SCROLL_SCREENS = 11;
const TIMELINE: readonly { progress: number; time: number }[] = [
  { progress: 0.0, time: 0 },
  { progress: 0.2, time: 0 }, // hold: read the four services
  { progress: 0.27, time: CUE_SERVICES_OUT },
  { progress: 0.31, time: CUE_ABOUT_IN },
  { progress: 0.37, time: CUE_PAPER_FLAT },
  { progress: 0.59, time: CUE_PAPER_FLAT }, // hold: read "who I am"
  { progress: 0.66, time: CUE_ABOUT_OUT },
  { progress: 0.76, time: CUE_STATEMENT_IN }, // the empty stretch runs fast
  { progress: 0.94, time: CLIP_SECONDS },
  { progress: 1.0, time: CLIP_SECONDS }, // tail: frozen white, the line travels out
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function progressToTime(progress: number) {
  const p = clamp01(progress);
  for (let i = 1; i < TIMELINE.length; i++) {
    const from = TIMELINE[i - 1];
    const to = TIMELINE[i];
    if (p <= to.progress) {
      const span = to.progress - from.progress;
      const t = span <= 0 ? 1 : (p - from.progress) / span;
      return from.time + (to.time - from.time) * t;
    }
  }
  return CLIP_SECONDS;
}

/** 0 before `from`, 1 after `from + FADE_SECONDS`. */
function fadeIn(time: number, from: number) {
  return clamp01((time - from) / FADE_SECONDS);
}

/** 1 until `FADE_SECONDS` before `until`, 0 at it. */
function fadeOut(time: number, until: number) {
  return clamp01((until - time) / FADE_SECONDS);
}

/**
 * The services section, rebuilt for the phone around a 9:16 cut of the clip.
 *
 * Nothing here is the desktop layout reflowed. The desktop carries the same
 * three beats on a 16:9 clip it has to scale and shift into place; this cut is
 * already framed for the screen, so the picture never moves and the only thing
 * scroll drives is which frame is showing and which words are over it.
 */
export default function MobileServices() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const servicesLayerRef = useRef<HTMLDivElement>(null);
  const aboutLayerRef = useRef<HTMLDivElement>(null);
  const statementLayerRef = useRef<HTMLDivElement>(null);
  const seekFrameRef = useRef(-1);

  const update = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const video = videoRef.current;
    const servicesLayer = servicesLayerRef.current;
    const aboutLayer = aboutLayerRef.current;
    const statementLayer = statementLayerRef.current;
    if (!wrapper || !panel || !video || !servicesLayer || !aboutLayer || !statementLayer) return;

    // The panel's own height, not window.innerHeight. Both are one screen, but
    // the panel is sized in svh — the height with the browser chrome showing,
    // which does not move — while innerHeight grows and shrinks as the address
    // bar hides on scroll. Measuring the moving one would shift the whole
    // mapping mid-scrub, which reads as the clip jumping under the finger.
    const travel = wrapper.getBoundingClientRect().height - panel.offsetHeight;
    if (travel <= 0) return;

    const progress = clamp01(-wrapper.getBoundingClientRect().top / travel);
    const time = progressToTime(progress);

    const frame = Math.min(Math.round(time * CLIP_FPS), 458 - 1);
    if (frame !== seekFrameRef.current) {
      seekFrameRef.current = frame;
      // Seek to the middle of the frame's own slot rather than its edge, so
      // rounding never lands a hair before it and decodes the one before.
      video.currentTime = (frame + 0.5) / CLIP_FPS;
    }

    servicesLayer.style.opacity = String(fadeOut(time, CUE_SERVICES_OUT));

    const aboutOpacity = Math.min(fadeIn(time, CUE_ABOUT_IN), fadeOut(time, CUE_ABOUT_OUT));
    aboutLayer.style.opacity = String(aboutOpacity);

    const statementOpacity = fadeIn(time, CUE_STATEMENT_IN);
    statementLayer.style.opacity = String(statementOpacity);
    // Rises the last stretch into place rather than appearing already settled.
    statementLayer.style.transform = `translateY(${(1 - statementOpacity) * 28}px)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    // iOS Safari can leave programmatic currentTime seeks doing nothing
    // visually until the video has been through one real play/pause cycle —
    // priming it here (safe without a gesture since it is muted) is what makes
    // every seek afterwards actually paint.
    const handleLoadedMetadata = () => {
      video.play().then(() => video.pause()).catch(() => {});
      update();
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    }

    update();

    const handleResize = () => update();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  if (prefersReducedMotion) {
    return (
      <section id="services" className="bg-white px-6 py-20 text-right">
        <ServicesHeading />
        <ServiceGrid className="mt-8" />
        <div className="mt-20">
          <AboutBlock />
        </div>
        <Statement className="mt-20" />
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      id="services"
      className="relative bg-white"
      style={{ height: `calc(${SCROLL_SCREENS} * 100svh)` }}
    >
      {/* overflow-clip, never overflow-hidden: hidden turns this into a scroll
          container, which would stop the panel below from sticking at all. */}
      <div ref={panelRef} className="sticky top-0 h-[100svh] overflow-clip">
        {/* The contained box for a 9:16 clip, worked out in CSS rather than
            measured: as wide as the panel, but never taller than it. The clip
            was framed at this ratio deliberately, so it is shown whole instead
            of being cropped to fill — and because it is white on white, the
            margins that leaves are invisible against the page. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-[9/16] w-[min(100%,calc(100svh*9/16))]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              src={CLIP_SRC}
              poster={CLIP_POSTER}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />

            {/* Anchored to the picture, not to the screen, because both of
                these sit in the gaps the paper ball leaves: the heading in the
                empty column beside it, the grid in the empty band below. */}
            <div ref={servicesLayerRef} className="absolute inset-0">
              <ServicesHeading className="absolute top-[7%] left-[6%] w-[44%]" />
              <ServiceGrid className="absolute inset-x-[5%] bottom-[3%]" />
            </div>
          </div>
        </div>

        {/* Anchored to the screen rather than to the picture: by the time
            either of these is up the frame is a flat sheet or empty white, so
            there is no composition left to sit beside. */}
        <div
          ref={aboutLayerRef}
          className="absolute inset-0 flex flex-col justify-center px-7 opacity-0"
        >
          <AboutBlock />
        </div>

        <div ref={statementLayerRef} className="absolute inset-x-0 bottom-[11%] px-6 opacity-0">
          <Statement />
        </div>
      </div>
    </section>
  );
}

function ServicesHeading({ className }: { className?: string }) {
  return (
    <h2
      className={`font-display text-[30px] leading-[1.05] font-bold text-balance text-black ${className ?? ""}`}
    >
      מה אני עושה
    </h2>
  );
}

/**
 * Titles only. The sentence under each one is what the service pages are for,
 * and at this size four of them turns a glance into a wall of text.
 */
function ServiceGrid({ className }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 ${className ?? ""}`}>
      {services.map((service, index) => (
        <li key={service.title}>
          <Link
            href={service.href}
            className="flex aspect-[4/3] flex-col justify-between rounded-lg border border-black/12 bg-white/70 p-3 text-right backdrop-blur-[2px]"
          >
            <span className="font-display text-[13px] leading-none font-bold text-black/35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[15px] leading-[1.15] font-bold text-balance text-black">
              {service.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AboutBlock() {
  return (
    <div className="text-right">
      <h2 className="font-display text-[34px] leading-none font-bold text-black">מי אני?</h2>

      <p className="mt-5 font-body text-[14px] leading-[1.8] text-balance text-black/70">
        YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
        <strong className="font-semibold text-black">ברמה הגבוהה ביותר</strong>.
      </p>
      <p className="mt-3 font-body text-[14px] leading-[1.8] text-balance text-black/70">
        אני עומר, מעצב מגיל 15 ומפתח מגיל 17, ואני בונה חוויות דיגיטליות{" "}
        <strong className="font-semibold text-black">שלא רק נראות טוב, אלא עובדות.</strong>
      </p>

      {/* Rules and type rather than boxes, the same reasoning as the desktop:
          these are plain facts about how the work is done, and setting them as
          cards would read as feature badges instead. */}
      <dl className="mt-5 w-full divide-y divide-black/10 border-y border-black/10">
        {aboutFacts.map((fact) => (
          <div key={fact.title} className="py-2.5">
            <dt className="font-display text-[13px] font-bold text-black">{fact.title}</dt>
            <dd className="m-0 mt-0.5 font-body text-[12px] leading-[1.55] text-black/55">
              {fact.description}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 font-body text-[14px] leading-[1.7] text-black/70">
        אני כאן כדי להפוך את הרעיון שלך{" "}
        <strong className="font-semibold text-black">למוצר דיגיטלי שמייצר אימפקט.</strong>
      </p>
    </div>
  );
}

function Statement({ className }: { className?: string }) {
  return (
    <p
      className={`text-right font-display text-[38px] leading-[1.12] font-normal text-black ${className ?? ""}`}
    >
      עיצוב מושך תשומת לב.
      <br />
      חשיבה יוצרת תוצאה.
    </p>
  );
}
