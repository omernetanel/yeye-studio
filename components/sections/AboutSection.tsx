"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { aboutFacts } from "@/lib/content";

// The name holds the screen for this long while it settles out of its opening
// size. Long enough to be an arrival, short enough that it is not a puzzle.
const NAME_STAGE_VH = 1.5;

// It lands enormous and comes to rest large. Both in vw, so the moment is the
// same shape on every width instead of being tuned against one.
const NAME_SIZE_ON_ARRIVAL_VW = 21;
const NAME_SIZE_AT_REST_VW = 11;

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
 * "Who I am", on black.
 *
 * The section the page has to earn its enquiry with: one person, doing both
 * halves of the job, with a way of working. It is the only place on the page
 * with a face on it — everything else is ink, paper and typography.
 *
 * It is built as moments, not as a column. An earlier version laid the whole
 * thing out as copy in a 632px track with the portrait in a slot beside it, and
 * it read as exactly what it was: text scrolling past. After the hero and the
 * paper sequence, arriving at a column of paragraphs says there is nothing here
 * — which is the opposite of what this section is for.
 *
 * So: the name takes a screen and settles into it at size. The face runs off
 * the edge instead of sitting in a box. Each of the three reasons gets its own
 * stretch and its own arrival. Nothing is crowded, because what is being sold
 * here is confidence, and confidence takes room.
 *
 * The only scroll-driven part is the name settling. Everything after it arrives
 * once and stays — scrolling back up is reading, not replaying.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const nameStageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  const update = () => {
    const stage = nameStageRef.current;
    const name = nameRef.current;
    if (!stage || !name) return;

    const travel = window.innerHeight * (NAME_STAGE_VH - 1);
    if (travel <= 0) return;
    const settled = smoothstep(-stage.getBoundingClientRect().top / travel);
    name.style.fontSize = `${lerp(NAME_SIZE_ON_ARRIVAL_VW, NAME_SIZE_AT_REST_VW, settled)}vw`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    <section id="about" data-nav-dark="true" className="relative overflow-x-clip bg-black">
      {/* THE NAME. A screen to itself with nothing else on it. It arrives at
          21vw and settles to 11 as you scroll through — the one scroll-driven
          thing in the section, and the only place it is warranted. */}
      <div ref={nameStageRef} style={{ height: `${NAME_STAGE_VH * 100}svh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-clip">
          <h2
            ref={nameRef}
            className="font-display leading-[0.82] font-bold whitespace-nowrap text-white"
            style={{ fontSize: `${NAME_SIZE_ON_ARRIVAL_VW}vw` }}
          >
            אני עומר.
          </h2>
        </div>
      </div>

      {/* THE FACE AND THE CLAIM. The portrait runs off the left edge at full
          height — a presence, not a picture in a slot — and the sentence takes
          the rest of the width beside it. */}
      <div className="grid grid-cols-1 items-center gap-10 lg:min-h-[100svh] lg:grid-cols-[1fr_46vw] lg:gap-0">
        <div className="px-6 pb-16 text-right md:px-12 lg:ps-16 lg:pe-12 lg:pb-0">
          <Reveal delay={0.1}>
            <p className="font-display text-[34px] leading-[1.12] font-bold text-balance text-white md:text-[52px] lg:text-[3.4vw]">
              אני מעצב ובונה את מה שאתם רואים כאן.
            </p>
            <p className="mt-8 max-w-[54ch] font-body text-[16px] leading-[1.8] text-balance text-white/50 md:text-[18px]">
              הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
              <span className="text-white/85">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <figure className="order-first m-0 lg:order-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/portrait.webp"
              alt="עומר, מייסד YEYE Digital"
              width={430}
              height={560}
              className="block h-auto w-full lg:h-[86svh] lg:object-cover"
              draggable={false}
            />
          </figure>
        </Reveal>
      </div>

      {/* THE THREE REASONS. A stretch each, full width, the numeral set large
          enough to be a landmark rather than a label. They are plain facts about
          how the work is arranged — a studio that subcontracts or assembles
          templates could not honestly write any of them, which is exactly why
          these are the ones worth stating. */}
      <ol className="mx-auto max-w-[1320px] px-6 md:px-12">
        {aboutFacts.map((fact, index) => (
          <li key={fact.title} className="border-t border-white/12 py-20 md:py-28">
            <Reveal>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
                <div className="text-right">
                  <h3 className="font-display text-[30px] leading-[1.1] font-bold text-balance text-white md:text-[46px]">
                    {fact.title}
                  </h3>
                  <p className="mt-5 max-w-[52ch] font-body text-[16px] leading-[1.75] text-balance text-white/50 md:text-[18px]">
                    {fact.description}
                  </p>
                </div>
                <span className="order-first font-display text-[54px] leading-[0.8] font-bold text-white/12 md:order-none md:text-[92px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </Reveal>

            {/* The proof sits against the claim it proves, not at the end of the
                section where attention has thinned. */}
            {index === 1 && (
              <Reveal delay={0.1}>
                <SketchToLive />
              </Reveal>
            )}
          </li>
        ))}
      </ol>

      <div className="h-24 md:h-32" />
    </section>
  );
}

/**
 * One block arriving.
 *
 * Framer Motion rather than the site's own scroll maths: this is an element
 * appearing when it is scrolled to, which is the UI-level job the library is
 * kept for. `once` is what makes the section one-way — it fires and stays, so
 * coming back up the page is reading, not replaying. Far enough and slow enough
 * to register as an arrival; a 24px nudge reads as nothing at all.
 */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-140px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Show, don't tell — attached to "אני מעצב וגם בונה".
 *
 * The drawing on one side and, on the other, the actual component from this
 * site rendered live. Not a screenshot: the real thing, which answers a cursor.
 *
 * Two states rather than a four-step sketch → design → build → live story. The
 * paper sequence two sections up already tells a four-step process, and a
 * second one would compete with it — and two states is not a process at all, it
 * is evidence. The designing and the building are what the jump implies.
 *
 * The element is one the visitor has already scrolled past on this same page,
 * which closes the distance between the claim and the proof: nobody has to
 * trust a screenshot of somebody else's project. They can scroll up.
 */
function SketchToLive() {
  return (
    <figure className="m-0 mt-16">
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/12 bg-white/12 sm:grid-cols-2">
        {/* The drawing. A slot at a known ratio until the real one exists —
            composed rather than left as a broken-image box, so it reads as
            deliberate even while it is empty. */}
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-black px-6 text-center">
          <span className="font-display text-[11px] font-bold tracking-[0.22em] text-white/30 uppercase">
            sketch
          </span>
          <span className="font-body text-[12px] leading-[1.6] text-white/25">
            שרבוט ראשוני של הרכיב
            <br />
            1200×900
          </span>
        </div>

        {/* The same thing, running. */}
        <div className="flex aspect-[4/3] items-center justify-center bg-black px-6">
          <LiveServiceRow />
        </div>
      </div>

      <figcaption className="mt-5 max-w-[56ch] font-body text-[14px] leading-[1.65] text-white/35">
        משמאל השרבוט. מימין <span className="text-white/70">הרכיב עצמו</span> — לא צילום מסך אלא
        הקוד שרץ בדף הזה, אותו אחד שגללתם דרכו למעלה.
      </figcaption>
    </figure>
  );
}

/**
 * The specimen: the services row's own markup, weights and hover, kept here
 * rather than imported. The services section stays free to change without
 * silently changing what this exhibit shows — a specimen has to hold still to
 * be one.
 */
function LiveServiceRow() {
  return (
    <div className="group w-full max-w-[320px] cursor-default border-b border-white/15 pb-4 text-right">
      <div className="flex items-center gap-4">
        <span className="font-display text-4xl leading-none font-bold text-white transition-colors duration-200 group-hover:text-[#8A8A8A]">
          02
        </span>
        <span className="h-9 w-px bg-white/15" />
        <div className="flex-1">
          <span className="block font-display text-[15px] leading-tight font-bold text-white transition-colors duration-200 group-hover:text-[#8A8A8A]">
            דפי נחיתה ואתרי תדמית
          </span>
          <span className="mt-1 block font-body text-[12px] leading-[1.5] text-white/45">
            דפים ואתרים ממוקדים שממירים גולשים ללקוחות.
          </span>
        </div>
      </div>
    </div>
  );
}
