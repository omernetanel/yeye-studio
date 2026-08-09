"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import { aboutFacts } from "@/lib/content";

/**
 * "Who I am", on black.
 *
 * The section the page needs before it is allowed to ask for anything: one
 * person, doing both halves of the job, with a way of working. It is the only
 * place on the page with a face on it — everything else is ink, paper and
 * typography — and that contrast does more work than any effect could.
 *
 * It opens on the face and the name. An earlier version opened on the question
 * "רגע, מי אני בעצם?", rising oversized and out of focus across two and a half
 * screens. It was the most theatrical moment on a page that already has a paper
 * aeroplane, and it argued against itself: a section meant to read as clean,
 * personal and sure of itself cannot open by hesitating. Someone confident says
 * their name.
 *
 * Nothing here is scroll-scrubbed. The portrait is sticky — which is position,
 * not animation, and has no state to run backwards — and every piece of copy
 * arrives once and stays. Scrolling back up is reading, not replaying.
 *
 * data-nav-dark tells the navbar to invert the logo while this is behind it.
 */
export default function AboutSection() {
  return (
    <section id="about" data-nav-dark="true" className="relative bg-black">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_46%] lg:gap-16">
          <div>
            {/* The arrival. A screen of its own, composed and centred in it, so
                the section opens as a moment rather than as the top of a column
                that happens to be scrolling past. */}
            <div className="flex min-h-[86svh] flex-col justify-center py-16 text-right">
              <Reveal>
                <h2 className="font-display text-[54px] leading-[0.95] font-bold text-white md:text-[78px]">
                  אני עומר.
                </h2>
                <HeadingSwash className="mt-5 w-[150px] text-white md:w-[190px]" />
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-9 font-display text-[28px] leading-[1.22] font-bold text-balance text-white md:text-[38px]">
                  אני מעצב ובונה את מה שאתם רואים כאן.
                </p>
                <p className="mt-6 max-w-[58ch] font-body text-[16px] leading-[1.75] text-balance text-white/50 md:text-[17px]">
                  הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה ש
                  <span className="text-white/80">אתר טוב צריך לעבוד טוב בדיוק כמו שהוא נראה</span>.
                </p>
              </Reveal>
            </div>

            {/* The three reasons. Each one lands and stays; they are spaced to
                arrive separately rather than to be taken in as a list, but not
                so far apart that the space between them reads as emptiness. */}
            <ol className="space-y-14 pb-24 md:space-y-16 md:pb-32">
              {aboutFacts.map((fact, index) => (
                <li key={fact.title}>
                  <Reveal>
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-[13px] leading-none font-bold tracking-[0.16em] text-white/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="h-px flex-1 bg-white/12" />
                    </div>
                    <h3 className="mt-5 font-display text-[26px] leading-[1.15] font-bold text-balance text-white md:text-[32px]">
                      {fact.title}
                    </h3>
                    <p className="mt-3 max-w-[56ch] font-body text-[16px] leading-[1.7] text-balance text-white/50 md:text-[17px]">
                      {fact.description}
                    </p>
                  </Reveal>

                  {/* The proof sits against the claim it proves, not at the end
                      of the section where attention has thinned. */}
                  {index === 1 && (
                    <Reveal delay={0.1}>
                      <SketchToLive />
                    </Reveal>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* The face, held for the whole argument: it arrives with the name and
              then stays while the reasons pass beside it, so the person is never
              off screen while the case for the person is being made. Below lg it
              simply leads the column. */}
          <div className="order-first lg:order-none lg:sticky lg:top-0 lg:h-[100svh] lg:self-start">
            <div className="flex h-full items-center">
              <Reveal>
                <figure className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/portrait.webp"
                    alt="עומר, מייסד YEYE Digital"
                    width={430}
                    height={560}
                    className="block h-auto w-full"
                    draggable={false}
                  />
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One block arriving.
 *
 * Framer Motion rather than the site's own scroll maths, deliberately: this is
 * an element appearing when it is scrolled to, which is the UI-level job the
 * library is kept for. `once` is what makes the whole section one-way — it
 * fires and stays, so coming back up the page is reading, not replaying.
 */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 44 }}
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
 * site rendered live. Not a screenshot of it: the real thing, which answers a
 * cursor.
 *
 * Two states rather than a four-step sketch → design → build → live story. The
 * paper sequence two sections up already tells a four-step process, and a
 * second one would compete with it — and two states is not a process at all,
 * it is evidence. The designing and the building are what the jump between
 * them implies.
 *
 * The element is one the visitor has already scrolled past on this same page,
 * which is what closes the distance between the claim and the proof: nobody
 * has to trust a screenshot of somebody else's project. They can scroll up.
 */
function SketchToLive() {
  return (
    <figure className="m-0 mt-10">
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

      <figcaption className="mt-4 max-w-[52ch] font-body text-[13px] leading-[1.6] text-white/35">
        משמאל השרבוט. מימין <span className="text-white/70">הרכיב עצמו</span> — לא צילום מסך אלא
        הקוד שרץ בדף הזה, אותו אחד שגללתם דרכו למעלה.
      </figcaption>
    </figure>
  );
}

/**
 * The specimen: the services row's own markup, weights and hover, kept here
 * rather than imported. The services section stays free to change without
 * silently changing what this exhibit is showing — a specimen has to hold
 * still to be one.
 */
function LiveServiceRow() {
  return (
    <div className="group w-full max-w-[300px] cursor-default border-b border-white/15 pb-4 text-right">
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
