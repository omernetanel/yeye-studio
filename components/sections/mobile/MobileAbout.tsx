"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import BalloonDrop, { type DropState } from "@/components/sections/about/BalloonDrop";
import { aboutFacts } from "@/lib/content";

/**
 * "מי אני" on a phone.
 *
 * THE DESKTOP VERSION IS NOT ADAPTED HERE, IT IS REPLACED — and the reason is
 * one number. Desktop assembles the whole argument on a single pinned panel:
 * greeting, portrait, two paragraphs and three claims all standing at once, and
 * the last of those is the point of it. A phone panel is 100svh with about
 * 568px of usable height, and that stack needs closer to twelve hundred. It has
 * been tried once and written down: scroll buys time, not screen.
 *
 * So the phone gets three movements instead of one screen. The opening is
 * pinned, because the greeting and the face have to move THROUGH each other and
 * that needs the frame to stand still. The copy and the claims simply scroll.
 * The close pins again, because something happens there.
 *
 * Everything is driven off raw scrollY against live rects, like the rest of the
 * site — not framer's scrollYProgress and not ScrollTrigger. Both ease, and that
 * easing compounds with Lenis's until a gentle scroll registers as nothing and a
 * fast one skips whole beats.
 */

// THE OPENING, pinned — and pinned for one specific job: the greeting has to
// hold still while the face climbs into the space under it. Unpinned, the two
// were a screen of type followed by a screen of black followed by a picture,
// because a full-height block for the greeting is a full screen whether or not
// anything is in the bottom of it.
//
// What was wrong with the first pinned version was not the pin, it was how much
// happened inside it: the greeting shrank AND lifted AND the face rose AND
// settled, and a frame where the only thing moving is the animation reads as
// frozen. Here the greeting arrives and then does nothing, and the picture is
// the one thing travelling.
const INTRO_VH = 1.9;
// AND IT OPENS BEFORE THE PIN CATCHES. A sticky panel's progress is zero until
// its top reaches the top of the screen — which is a whole screen of scrolling
// during which the black has arrived and is holding nothing. Opening the
// progress a screen early means the greeting comes up WITH the black instead of
// after it, and there is no dead ground.
const INTRO_LEAD_VH = 0.85;
const GREET_IN = [0, 0.22] as const;
const GREET_RISE_PX = 44;
// Up into its slot, on the stage's clock. The rise starts while the greeting is
// still settling — it used to wait for it, which left the greeting standing
// alone in a screen of empty black for a quarter of the run.
const PORTRAIT_RISE = [0.08, 0.6] as const;
// It enters from just past the bottom edge rather than a screen below it, so
// the top of it is already showing while it climbs.
const PORTRAIT_FROM_VH = 0.62;

// THE SHRINK IS NOT ON THE STAGE'S CLOCK, and that is the whole point of it.
// Everything inside a pinned panel happens against a screen that is holding
// still, so a picture changing size in there looks like a picture changing size
// on a frozen screen — which is what it was accused of, twice. This one is
// driven by the portrait's OWN position: it cannot begin until the panel has
// let go and the thing is actually travelling up the page, so the size change
// and the movement are the same gesture.
const PORTRAIT_SHRINK_FROM_VH = 0.34;
const PORTRAIT_SHRINK_RUN_VH = 0.55;
// The picture comes up at its own size and only settles a little smaller. It
// used to enter zoomed in by a third and shrink back, which cut the sides off
// the photograph for most of the way in. Scaled about its bottom edge, so the
// gap to the copy under it never changes while it settles.
const PORTRAIT_SETTLED = 0.88;

// How far the cards brighten as they come up: dim when they arrive, full once
// their middle reaches FACT_READ_AT of the screen. A function of position, so it
// only ever runs one way per direction of scroll — never dark, bright, dark.
const FACT_DIM = 0.35;
const FACT_READ_FROM = 0.78;
const FACT_READ_AT = 0.5;

// How far into the screen a scrolling element must come before it is fully in.
const RISE_VH = 0.42;
const RISE_PX = 26;

// THE CLOSE. It rides up with the copy, catches at the middle of the screen,
// and holds while the balloons fall and the rule draws under it.
// 1.6, not 2.2. The pin held for 1.2 screens after the line had arrived, which
// is a long time to look at a finished sentence — and every one of those pixels
// is also scroll the reader has to spend to get out of the section. Halved: the
// line stands, the balloons fall, the rule draws, and it lets go.
const CLOSER_STAGE_VH = 1.6;
// And it starts inside the cards' own space rather than after it. The distance
// from the last card to the line was the section's bottom padding plus the top
// half of a pinned screen; pulling the stage up by a quarter-screen halves it,
// so the line arrives while the reader is still leaving the cards.
const CLOSER_PULL_VH = 25;
// Same lead as the opening, and for the same reason turned around: without it
// the line does not begin until the cards above have already left, so it always
// arrived on an empty screen and read as a section of its own rather than as
// the end of this one.
const CLOSER_LEAD_VH = 0.7;
const CLOSER_ARRIVE = [0, 0.16] as const;
const CLOSER_BALLOONS_AT = 0.04;
const CLOSER_DRAW = [0.42, 0.82] as const;

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

function span(progress: number, range: readonly [number, number]) {
  return smoothstep((progress - range[0]) / (range[1] - range[0]));
}

export default function MobileAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const introStageRef = useRef<HTMLDivElement>(null);
  const greetLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const portraitRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const claimsRef = useRef<(HTMLElement | null)[]>([]);
  // High-water marks for the cards. Everything else here reverses with the
  // scroll; these do not — see the comment where they are read.
  const claimsSeenRef = useRef<boolean[]>([]);
  const closerStageRef = useRef<HTMLDivElement>(null);
  const closerLineRef = useRef<HTMLParagraphElement>(null);
  const closerSwashRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  const dropStateRef = useRef<DropState>({ armed: false, wallLive: false, leaving: false });

  const update = () => {
    const screen = window.innerHeight;

    const intro = introStageRef.current;
    const portrait = portraitRef.current;
    if (intro && portrait) {
      const box = intro.getBoundingClientRect();
      const travel = box.height - screen;
      if (travel > 0) {
        const lead = screen * INTRO_LEAD_VH;
        const progress = clamp01((lead - box.top) / (travel + lead));

        // The greeting: both lines on one beat, each rising a little later than
        // the last so the pair reads as one arrival rather than two.
        greetLinesRef.current.forEach((line, index) => {
          if (!line) return;
          const t = span(progress, [
            GREET_IN[0] + index * 0.06,
            GREET_IN[1] + index * 0.06,
          ] as const);
          line.style.opacity = String(t);
          line.style.transform = `translateY(${lerp(GREET_RISE_PX, 0, t).toFixed(1)}px)`;
        });

        const rise = span(progress, PORTRAIT_RISE);
        const lift = lerp(screen * PORTRAIT_FROM_VH, 0, rise);
        // The shrink is a function of where the portrait's box IS, which is the
        // pinned panel's position once it has let go, plus the box's place in it
        // and the rise. Worked out from layout rather than read off the element,
        // whose rect would include the very scale this is computing.
        const panel = portrait.offsetParent as HTMLElement | null;
        const held = (panel?.getBoundingClientRect().top ?? 0) + portrait.offsetTop + lift;
        const shrink = smoothstep(
          clamp01((screen * PORTRAIT_SHRINK_FROM_VH - held) / (screen * PORTRAIT_SHRINK_RUN_VH)),
        );
        portrait.style.opacity = String(rise);
        portrait.style.transform =
          `translateY(${lift.toFixed(1)}px) scale(${lerp(1, PORTRAIT_SETTLED, shrink).toFixed(3)})`;
      }
    }

    // The copy, against its own box, once the pin has let go of it.
    const copy = copyRef.current;
    if (copy) {
      const top = copy.getBoundingClientRect().top;
      const t = smoothstep(clamp01((screen - top) / (screen * RISE_VH)));
      copy.style.opacity = String(t);
      copy.style.transform = `translateY(${lerp(RISE_PX, 0, t).toFixed(1)}px)`;
    }

    // THE CARDS, and they are the one thing here that does not reverse.
    //
    // Everything else on this page is a function of scroll position, so
    // scrolling back up takes it apart again — which is right for a thing that
    // is arriving. A card that has been read is not arriving any more, and
    // watching all three fold themselves away on the way back up reads as the
    // page undoing itself. Latched with a high-water mark: once in, in.
    //
    // What does follow the scroll is how bright a card is: it arrives dim and
    // comes up to full as it reaches the middle of the screen, which walks the
    // eye down the three the way the desktop's sweep does.
    claimsRef.current.forEach((el, index) => {
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!claimsSeenRef.current[index] && box.top < screen * 0.82) claimsSeenRef.current[index] = true;
      const seen = claimsSeenRef.current[index];
      const middle = box.top + box.height / 2;
      const read = smoothstep(
        clamp01((screen * FACT_READ_FROM - middle) / (screen * (FACT_READ_FROM - FACT_READ_AT))),
      );
      el.style.opacity = seen ? String(lerp(FACT_DIM, 1, read)) : "0";
      el.style.transform = seen ? "translateY(0)" : "translateY(30px)";
    });

    // THE FIRST BALLOONS ARE ARMED HERE, on the cards — not on the close.
    //
    // They were armed by the closing stage, which meant every one of them
    // arrived inside the same pinned panel, in a heap, and the one thing they
    // exist to do was lost. The whole trick is that the reader has spent the
    // section learning that nothing moves unless they move it, and then
    // something falls on its own. That has to happen while there is still
    // something to fall past.
    //
    // Not the same threshold the card itself uses. A card counts as seen the
    // moment its top edge crosses 82% of the screen, which is while it is still
    // sliding up from the bottom; arming there put the first balloon in the air
    // before the card had finished arriving. This waits until the card is
    // properly on screen.
    const first = claimsRef.current[0];
    if (first && !dropStateRef.current.armed) {
      dropStateRef.current.armed = first.getBoundingClientRect().top < screen * 0.5;
    }

    const stage = closerStageRef.current;
    const line = closerLineRef.current;
    const swash = closerSwashRef.current;
    if (!stage || !line || !swash) return;

    const box = stage.getBoundingClientRect();
    const travel = box.height - screen;
    if (travel <= 0) return;
    const closerLead = screen * CLOSER_LEAD_VH;
    const progress = clamp01((closerLead - box.top) / (travel + closerLead));

    const arrive = span(progress, CLOSER_ARRIVE);
    line.style.opacity = String(arrive);
    line.style.transform = `translateY(${lerp(30, 0, arrive).toFixed(1)}px)`;

    // The balloons may only collide with the line once it has stopped moving of
    // its own accord. A collider read off a box that is mid-entrance shifts
    // every frame, and they would judder against a wall that is not where it
    // appears to be.
    dropStateRef.current.wallLive = arrive >= 1;
    // The second group goes as the close comes INTO view rather than a third of
    // the way through it, so they are falling while the line is still arriving
    // instead of raining down onto a picture that has already settled.
    dropStateRef.current.leaving = progress > CLOSER_BALLOONS_AT;

    const draw = span(progress, CLOSER_DRAW);
    swash.style.clipPath = `inset(0 ${((1 - draw) * 100).toFixed(1)}% 0 0)`;
  };

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      // Everything simply here. The desktop section has a standing bug where
      // reduced motion leaves a blank black screen — every element starts at
      // opacity 0 and the driver never runs — and there is no reason to carry
      // it across.
      for (const el of [
        portraitRef.current,
        copyRef.current,
        closerLineRef.current,
        ...greetLinesRef.current,
        ...claimsRef.current,
      ]) {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      }
      if (closerSwashRef.current) closerSwashRef.current.style.clipPath = "none";
      return;
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollY, "change", () => {
    if (prefersReducedMotion) return;
    update();
  });

  return (
    <section id="about" ref={sectionRef} data-nav-dark="true" className="relative bg-black">
      {/* The greeting holds the top of the panel while the face climbs in under
          it. overflow-clip because the picture is wider than the screen on the
          way in, and horizontal overflow in RTL moves the whole document's
          drawing origin rather than just adding a bar. */}
      <div ref={introStageRef} style={{ height: `${INTRO_VH * 100}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-clip">
          <div className="absolute inset-x-0 top-[19%] px-6 text-center">
            <span className="block font-display text-m-small leading-none font-bold text-white/70">
              <span
                ref={(el) => {
                  greetLinesRef.current[0] = el;
                }}
                className="inline-block will-change-transform"
                style={{ opacity: 0 }}
              >
                נעים מאוד,
              </span>
            </span>
            <span className="mt-3 block font-display text-m-display font-bold text-white">
              <span
                ref={(el) => {
                  greetLinesRef.current[1] = el;
                }}
                className="inline-block will-change-transform"
                style={{ opacity: 0 }}
              >
                אני עומר.
              </span>
            </span>
          </div>

          {/* Anchored to the bottom of the panel, 64px up — the same 64px the
              copy leaves above the cards, so the three blocks keep one rhythm.
              Bounded by height as well as width: at 86% of a small phone's
              width the picture alone was taller than the space under the
              greeting. */}
          <div
            ref={portraitRef}
            className="absolute inset-x-0 bottom-16 mx-auto w-[min(86%,420px,calc(50svh*430/560))] origin-bottom will-change-transform"
            style={{ opacity: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/portrait.webp"
              alt="עומר, מייסד YEYE Digital"
              width={430}
              height={560}
              className="block h-auto w-full rounded-2xl"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-10">
        <div
          ref={copyRef}
          className="mx-auto max-w-[420px] text-right will-change-transform"
          style={{ opacity: 0 }}
        >
          <p className="font-display text-m-body font-light text-accent-light">
            אני מעצב מגיל 15, מפתח מגיל 17, ואני עיצבתי ובניתי את מה שאתם רואים כאן.
          </p>
          <p className="mt-[0.78em] font-display text-m-body font-light text-accent-light">
            הקמתי את YEYE מתוך אובססיה לפרטים הקטנים ואמונה שאתר טוב צריך לעבוד טוב בדיוק כמו שהוא
            נראה.
          </p>
        </div>

        {/* The three as the desktop sets them: a hairline, the numeral, the
            claim and its sentence, right-aligned under the copy. They were glass
            cards, which nothing else on the site looks like.

            mt-16 is the same 64px the picture stands above the copy — written
            as the same number by hand, because one is a margin and the other is
            where the picture sits in a pinned panel, and nothing links them.

            Opacity follows the scroll closely and the arrival glides, so the
            two get different transition lengths. */}
        <ol className="mx-auto mt-16 max-w-[420px] space-y-9">
          {aboutFacts.map((fact, index) => (
            <li
              key={fact.title}
              ref={(el) => {
                claimsRef.current[index] = el;
              }}
              className="border-t border-white/20 pt-5 text-right [transition:opacity_200ms_ease-out,transform_700ms_ease-out] will-change-transform"
              style={{ opacity: 0, transform: "translateY(30px)" }}
            >
              <span className="font-display text-m-small leading-none font-bold tracking-[0.18em] text-white/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-m-sub font-bold text-balance text-white">
                {fact.title}
              </h3>
              <p className="mt-2 font-body text-m-small text-balance text-white/55">
                {fact.description}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* The balloons. A child of the section rather than of a stage, because
          their layers are fixed and the stage panels clip. */}
      {!prefersReducedMotion && (
        <BalloonDrop
          sectionRef={sectionRef}
          lineRef={closerLineRef}
          stateRef={dropStateRef}
          variant="mobile"
        />
      )}

      {/* THE CLOSE. Pinned, because three things happen here in order: the copy
          above finishes leaving, the balloons fall, and the rule draws. */}
      <div
        ref={closerStageRef}
        style={{
          height: `${CLOSER_STAGE_VH * 100}svh`,
          marginTop: `-${CLOSER_PULL_VH}svh`,
        }}
      >
        {/* Centred in the panel. It was held near the top for one round to
            close the gap from the last card — but that gap is the lead-in's job
            (the line starts arriving while the cards are still on screen), and
            a closing line pinned against the top of the screen reads as a
            heading rather than as the end of something. */}
        <div className="sticky top-0 z-10 flex h-[100svh] items-center px-6">
          <div className="w-full text-right">
            <p
              ref={closerLineRef}
              className="font-display text-m-lead font-bold text-balance text-white will-change-transform"
              style={{ opacity: 0 }}
            >
              {/* The manual break is gone and text-balance decides instead.
                  Same words, in the same order. The desktop break — after
                  "שלך" — leaves a first line of twenty-seven characters, and on
                  a 327px column that caps the type at 23px before it wraps to
                  four lines. Balanced, the two halves come out even and the
                  same two lines hold at 27. A hand-placed break is only ever
                  right at one width, and this is not that width. */}
              אני כאן להפוך את הרעיון שלך למוצר שמייצר אימפקט.
            </p>
            <div ref={closerSwashRef} className="mt-7" style={{ clipPath: "inset(0 100% 0 0)" }}>
              <HeadingSwash className="w-[220px] text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
