"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

// The section assembles on one held screen: every piece arrives, takes the
// place the layout already gives it, and stays. These are the points along the
// stage's travel where each piece starts and finishes arriving.
const BEATS = {
  nameRise: [0.0, 0.18],
  nameSettle: [0.22, 0.36],
  portrait: [0.34, 0.5],
  copy: [0.42, 0.58],
  facts: [0.6, 0.82],
} as const;

const STAGE_VH = 3.6;

// The name lands with its middle on the bottom edge — so the first thing on
// screen is the top half of it, cut — and heavily out of focus. Size and blur
// together read as something coming into focus; blur alone reads as a filter.
const NAME_FROM_VH = 0.5;
const NAME_BLUR_PX = 44;
const NAME_SIZE_BIG_VW = 9.5;
const NAME_SIZE_SMALL_PX = 26;

// Where the name ends: the navbar logo's own line, against the right margin.
// The logo sits 22px down and is 36px tall, so its centre line is at 40.
const LOGO_LINE_CENTRE_Y_PX = 40;

// The closing line stops the page on its own. It is the one line in the section
// that asks for anything and the handover to the work, so it is held rather
// than scrolled past: it arrives, it is held, the stroke is drawn, and then a
// beat before the pin releases — without that last one the page was let go on
// the exact frame the drawing finished, throwing the moment off screen.
const CLOSER_IN_VH = 0.45;
const CLOSER_HOLD_VH = 0.3;
const CLOSER_DRAW_VH = 0.5;
const CLOSER_SETTLE_VH = 0.6;
const CLOSER_STAGE_VH =
  1 + CLOSER_IN_VH + CLOSER_HOLD_VH + CLOSER_DRAW_VH + CLOSER_SETTLE_VH;

const CONTENT_MAX_W_PX = 1120;
const CONTENT_PAD_PX = 24;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

/**
 * "מי אני" — the section that earns the enquiry.
 *
 * One person, doing both halves of the job, with a way of working. It is the
 * only place on the page with a face on it and the only one that speaks in the
 * first person.
 *
 * The composition is the one this section had when it lived on the open sheet
 * of paper, brought back deliberately: portrait beside a single 560px column,
 * the copy right-aligned against one edge, and the three facts as ruled type
 * rather than cards. Several attempts at something more elaborate were made and
 * all of them were worse — wide bands of black with paragraphs floating in
 * them, which read as emptiness rather than as room. This one is legible at a
 * glance and holds a shape, which is what it needed to be.
 *
 * What is new is that it ASSEMBLES. The screen is held while each piece arrives
 * onto it and none of them leave, so by the end the whole argument is standing
 * there at once and there is no dead black between parts.
 *
 * And it only assembles once. Every beat latches at its high-water mark, so
 * scrolling back up leaves the section built — the way in is a way in, not a
 * thing to be taken apart by reading it again.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);

  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);

  const nameEndRef = useRef({ x: 0, y: 0 });
  // The high-water mark of every beat. Assembly is one-way: a piece that has
  // arrived does not come apart when the page is scrolled back through it.
  const reachedRef = useRef({ nameRise: 0, nameSettle: 0, portrait: 0, copy: 0, facts: 0 });

  const measure = () => {
    const name = nameRef.current;
    if (!name) return;

    // Measured at the size it ENDS at, and against the panel it is centred in
    // rather than against the window — the panel is 100svh and one scrollbar
    // narrower, and using the window instead lands it short of the margin.
    const previous = name.style.fontSize;
    name.style.fontSize = `${NAME_SIZE_SMALL_PX}px`;
    const width = name.offsetWidth;
    name.style.fontSize = previous;

    const panel = name.offsetParent as HTMLElement | null;
    const panelW = panel ? panel.clientWidth : window.innerWidth;
    const panelH = panel ? panel.clientHeight : window.innerHeight;
    const columnW = Math.min(CONTENT_MAX_W_PX, panelW - CONTENT_PAD_PX * 2);

    nameEndRef.current = {
      x: (panelW + columnW) / 2 - (panelW / 2 + width / 2),
      y: LOGO_LINE_CENTRE_Y_PX - panelH / 2,
    };
  };

  const update = () => {
    const stage = stageRef.current;
    const name = nameRef.current;
    const portrait = portraitRef.current;
    const copy = copyRef.current;
    const facts = factsRef.current;
    if (!stage || !name || !portrait || !copy || !facts) return;

    const screen = window.innerHeight;
    const travel = stage.getBoundingClientRect().height - screen;
    if (travel <= 0) return;
    const progress = clamp01(-stage.getBoundingClientRect().top / travel);

    const reached = reachedRef.current;
    const beat = (key: keyof typeof reached, range: readonly [number, number]) => {
      const now = smoothstep((progress - range[0]) / (range[1] - range[0]));
      reached[key] = Math.max(reached[key], now);
      return reached[key];
    };

    const rise = beat("nameRise", BEATS.nameRise);
    const settle = beat("nameSettle", BEATS.nameSettle);
    const end = nameEndRef.current;

    name.style.fontSize = `${lerp((NAME_SIZE_BIG_VW * window.innerWidth) / 100, NAME_SIZE_SMALL_PX, settle)}px`;
    name.style.filter = rise < 0.98 ? `blur(${lerp(NAME_BLUR_PX, 0, clamp01(rise * 1.4))}px)` : "";
    name.style.transform =
      `translate(-50%, -50%) translate(${end.x * settle}px, ${lerp(screen * NAME_FROM_VH, 0, rise) + end.y * settle}px)`;

    const arrive = (el: HTMLElement, t: number, dy: number) => {
      el.style.opacity = String(t);
      el.style.transform = `translateY(${lerp(dy, 0, t)}px)`;
    };

    arrive(portrait, beat("portrait", BEATS.portrait), 56);
    arrive(copy, beat("copy", BEATS.copy), 44);
    arrive(facts, beat("facts", BEATS.facts), 36);

    // The close, on its own stage. Position-driven rather than latched: the
    // page is held still here, and a one-way arrival inside a held frame is a
    // trapdoor — scroll back into it and it has already happened, with no way
    // to see it again.
    const closerStage = closerStageRef.current;
    const closerLine = closerLineRef.current;
    const closerSwash = closerSwashRef.current;
    if (closerStage && closerLine && closerSwash) {
      const held = -closerStage.getBoundingClientRect().top;
      const inEnd = screen * CLOSER_IN_VH;
      const drawStart = inEnd + screen * CLOSER_HOLD_VH;
      const drawEnd = drawStart + screen * CLOSER_DRAW_VH;

      const arriveT = smoothstep(held / inEnd);
      const draw = clamp01((held - drawStart) / (drawEnd - drawStart));

      closerLine.style.opacity = String(arriveT);
      closerLine.style.transform = `translateY(${lerp(38, 0, arriveT)}px)`;
      closerSwash.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;
    }
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    measure();
    update();

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      update();
    });

    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    <section id="about" data-nav-dark="true" className="relative bg-black">
      {/* THE ASSEMBLY. One screen, held, filling up — and staying full. */}
      <div ref={stageRef} style={{ height: `${STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-clip">
          <div className="flex h-full items-center px-6 pt-20 pb-12 md:px-10">
            {/* No items-end: under dir="rtl" the flex END is the LEFT, which
                shrank each paragraph to its own text width and pinned it left,
                leaving the right edges ragged against the list below. */}
            <div className="mx-auto flex w-full max-w-[1120px] items-center justify-center gap-10 lg:gap-14">
              <div ref={portraitRef} className="hidden shrink-0 will-change-transform lg:block" style={{ opacity: 0 }}>
                <figure className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/portrait.webp"
                    alt="עומר, מייסד YEYE Digital"
                    width={430}
                    height={560}
                    className="h-[430px] w-[330px] rounded-2xl object-cover"
                    draggable={false}
                  />
                </figure>
              </div>

              <div className="flex max-w-[560px] flex-col text-right">
                <div ref={copyRef} className="will-change-transform" style={{ opacity: 0 }}>
                  {/* text-balance rather than hand-placed breaks: a fixed break
                      only holds at one width, and the browser evens the lines
                      out at every width without splitting a phrase to do it. */}
                  <p className="font-body text-[15px] leading-[1.85] text-balance text-white/60">
                    YEYE הוקם מתוך אובססיה לפרטים הקטנים ואמונה עמוקה שכל עסק ראוי לנוכחות דיגיטלית{" "}
                    <strong className="font-semibold text-white">ברמה הגבוהה ביותר</strong>.
                  </p>
                  <p className="mt-4 font-body text-[15px] leading-[1.85] text-balance text-white/60">
                    אני עומר, מעצב מגיל 15 ומפתח מגיל 17, ואני בונה חוויות דיגיטליות{" "}
                    <strong className="font-semibold text-white">שלא רק נראות טוב, אלא עובדות.</strong>
                  </p>
                </div>

                {/* Not cards, and deliberately not numbers. Every one of these
                    is a plain fact about how the work is actually done, which a
                    studio that subcontracts or assembles templates could not
                    honestly write — where "Design-First" and a project count
                    are things anyone can claim and nobody can check. Set as
                    quiet rules and type so they read as substance rather than
                    as feature badges. */}
                <dl
                  ref={factsRef}
                  className="mt-7 w-full divide-y divide-white/12 border-y border-white/12 will-change-transform"
                  style={{ opacity: 0 }}
                >
                  {aboutFacts.map((fact) => (
                    <div
                      key={fact.title}
                      className="flex flex-col gap-1 py-3 text-right sm:flex-row sm:gap-4"
                    >
                      <dt className="font-display text-[14px] font-bold whitespace-nowrap text-white sm:w-[150px]">
                        {fact.title}
                      </dt>
                      <dd className="m-0 font-body text-[13px] leading-[1.6] text-white/50">
                        {fact.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {/* Above the assembly, so the pieces arriving pass behind it rather
              than through it. */}
          <div
            ref={nameRef}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 font-display leading-none font-bold whitespace-nowrap text-white will-change-transform"
            style={{ fontSize: `${NAME_SIZE_BIG_VW}vw` }}
          >
            אני עומר.
          </div>
        </div>
      </div>

      {/* THE CLOSE. The page stops here. */}
      <div ref={closerStageRef} style={{ height: `${CLOSER_STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto w-full max-w-[1120px] px-6 text-right md:px-10">
            <p
              ref={closerLineRef}
              className="font-display text-[36px] leading-[1.12] font-bold text-balance text-white will-change-transform md:text-[60px]"
              style={{ opacity: 0 }}
            >
              אני כאן להפוך את הרעיון שלך
              <br />
              למוצר שמייצר אימפקט.
            </p>
            <div ref={closerSwashRef} className="mt-8" style={{ clipPath: "inset(0 100% 0 0)" }}>
              <HeadingSwash className="w-[260px] text-white md:w-[360px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
