"use client";

import { useLayoutEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import HeadingSwash from "@/components/ui/HeadingSwash";
import BalloonDrop, { type DropState } from "@/components/sections/about/BalloonDrop";
import BorderGlowCard from "@/components/ui/BorderGlowCard";
import { ABOUT_FACTS_HEADING, aboutFacts } from "@/lib/content";

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
// frozen.
//
// THE GREETING IS THE DESKTOP'S, beat for beat and in proportion: each line
// comes up from half a screen below, heavily out of focus, the salutation first
// and the name after it; the pair stands large in the middle of the screen; and
// then it shrinks and lifts into its place at the top as the face climbs in
// under it. The lines keep the desktop's 0.4em / 1.34em, so the salutation is
// the same third of the name it is there.
const INTRO_VH = 3;
// AND IT OPENS BEFORE THE PIN CATCHES. A sticky panel's progress is zero until
// its top reaches the top of the screen — which is a whole screen of scrolling
// during which the black has arrived and is holding nothing. Opening the
// progress half a screen early means the greeting comes up WITH the black
// instead of after it, and there is no dead ground.
const INTRO_LEAD_VH = 0.5;
const GREET_LINE_1 = [0, 0.22] as const;
const GREET_LINE_2 = [0.24, 0.46] as const;
const GREET_SETTLE = [0.52, 0.78] as const;
const GREET_FROM_VH = 0.5;
// The desktop's 52px of blur on a 124px line, kept as that ratio.
const GREET_BLUR_EM = 0.42;
// Large while it is alone — the name then spans most of a phone's width — and
// settled so the name is the phone's display size, 56px.
const GREET_SIZE_ALONE_VW = 13;
const GREET_SIZE_SETTLED_PX = 42;
// Where it settles, as a fraction of the panel from the top.
const GREET_TOP = 0.19;
// Up into its slot on the same beat the greeting starts to settle, as on the
// desktop, where the face arrives while the name is still the thing being read.
const PORTRAIT_RISE = [0.52, 0.95] as const;
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

// THE IMPACT LINE IS KEYED TO ITSELF, not to the stage it lives in. It fades up
// as its own top crosses the bottom of the screen — which, with the gap the
// cards leave above it, is only once the card has gone past the middle of the
// page. Keyed to the stage's progress instead, it began arriving while the card
// was still being read, because a pinned stage opens its clock a screen before
// anything of it is visible. Fractions of the screen from the top.
const LINE_IN_FROM = 0.92;
const LINE_IN_TO = 0.62;

// Where a claim card opens, and how far it rises into place.
const CLAIM_IN_VH = 0.85;
const CLAIM_RISE_PX = 24;

// How far into the screen a scrolling element must come before it is fully in.
const RISE_VH = 0.42;
const RISE_PX = 26;

// THE CLOSE. It rides up behind the card, catches at the middle of the screen,
// and holds while the balloons fall and the rule draws under it.
//
// 2.8 screens, where it was 1.6. The three claims used to be three blocks the
// reader scrolled past, and the line arrived as the last of them left; now they
// are one card, which the page scrolls off in a fraction of that. The hold has
// to carry the difference, or the line reaches the middle of the screen and the
// section ends before the balloons have finished falling through it.
const CLOSER_STAGE_VH = 2.8;
// The pull up into the cards' space is gone with them. It existed to close a
// gap left by three stacked blocks; against a single card it did the opposite,
// and the brief here is a wider gap, not a tighter one.
const CLOSER_LEAD_VH = 0.7;
// How far the close is drawn up towards the last card.
const CLOSER_PULL_SVH = 28;
// THE BALLOONS WAIT FOR THE LINE. The first two — one blue, one silver — go
// when the top of the impact line has come up to 30% of the screen from the
// bottom, and the rest on the same cue, a beat behind them by their own clock
// in BalloonDrop. Cued off the stage instead, they started while the cards were
// still being read: the stage is pulled up into the cards' space, so its own
// lead-in begins long before the line is on screen. A second, later line
// position for the rest made them depend on how fast the reader scrolled, and
// at a reading pace they came far too late. Fraction of the screen from the top.
const DROP_LINE_AT = 0.7;
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
  const greetRef = useRef<HTMLDivElement>(null);
  const greetLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  // The greeting's height at its settled size. Its lines are sized in em and do
  // not wrap, so at any other size the height is this in proportion — one read
  // on layout, rather than one on every scroll frame.
  const greetHeightRef = useRef(0);
  const portraitRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  // Each claim, and whether it has already opened. One way only: a card that
  // has been read is not arriving any more, and watching three of them fold
  // themselves away on the way back up reads as the page undoing itself.
  const claimsRef = useRef<(HTMLDivElement | null)[]>([]);
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

        // THE GREETING. It is laid out at its settled place and size; the
        // transform carries it from the middle of the panel up to there, and
        // the size runs from large to settled over the same beat.
        const greet = greetRef.current;
        const panelHeight = (greet?.offsetParent as HTMLElement | null)?.offsetHeight ?? screen;
        const settle = span(progress, GREET_SETTLE);
        const aloneSize = (GREET_SIZE_ALONE_VW * window.innerWidth) / 100;
        const size = lerp(aloneSize, GREET_SIZE_SETTLED_PX, settle);
        if (greet) {
          const height = (greetHeightRef.current * size) / GREET_SIZE_SETTLED_PX;
          const fromMiddle = panelHeight / 2 - height / 2 - panelHeight * GREET_TOP;
          greet.style.fontSize = `${size.toFixed(2)}px`;
          greet.style.transform = `translateY(${lerp(fromMiddle, 0, settle).toFixed(1)}px)`;
        }
        [GREET_LINE_1, GREET_LINE_2].forEach((range, index) => {
          const line = greetLinesRef.current[index];
          if (!line) return;
          const rise = span(progress, range);
          line.style.opacity = String(rise);
          const blur = lerp(aloneSize * GREET_BLUR_EM, 0, clamp01(rise * 1.4));
          line.style.filter = blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "";
          line.style.transform = `translateY(${lerp(screen * GREET_FROM_VH, 0, rise).toFixed(1)}px)`;
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

    // THE CARD, arriving as one block — heading, card and dots together.
    //
    // It used to be three, each with a high-water mark of its own and a sweep
    // that brightened them in turn. None of that survives the three becoming one
    // thing the reader swipes: there is no order to walk the eye down, and a
    // card that dims because the page moved would fight the swipe for attention.
    const cards = cardsRef.current;
    if (cards) {
      const top = cards.getBoundingClientRect().top;
      const t = smoothstep(clamp01((screen - top) / (screen * RISE_VH)));
      cards.style.opacity = String(t);
      cards.style.transform = `translateY(${lerp(RISE_PX, 0, t).toFixed(1)}px)`;
    }

    // And each claim opens on its own as it comes up, once.
    claimsRef.current.forEach((claim, index) => {
      if (!claim || claimsSeenRef.current[index]) return;
      if (claim.getBoundingClientRect().top < screen * CLAIM_IN_VH) {
        claimsSeenRef.current[index] = true;
        claim.style.opacity = "1";
        claim.style.transform = "translateY(0)";
      }
    });

    const stage = closerStageRef.current;
    const line = closerLineRef.current;
    const swash = closerSwashRef.current;
    if (!stage || !line || !swash) return;

    const box = stage.getBoundingClientRect();
    const travel = box.height - screen;
    if (travel <= 0) return;
    const closerLead = screen * CLOSER_LEAD_VH;

    // Where the line's top sits on screen, from layout rather than its rect,
    // which would include the rise written below. The line is laid out in the
    // pinned panel, and the panel is at the stage's top until it pins, at the
    // top of the screen while pinned, and rides up with the stage's end after.
    const panelTop = Math.max(box.top, Math.min(0, box.bottom - screen));
    const lineTop = panelTop + line.offsetTop;
    // Both latch inside BalloonDrop, so reading them false again on the way back
    // up does not take a balloon back out of the air. NOT latched here: BalloonDrop
    // resets itself once the reader scrolls back above the section, and a flag
    // still stuck true from the last pass restarted the drop the moment the
    // section came back into view — two balloons over the greeting.
    dropStateRef.current.armed = lineTop < screen * DROP_LINE_AT;
    dropStateRef.current.leaving = lineTop < screen * DROP_LINE_AT;
    const progress = clamp01((closerLead - box.top) / (travel + closerLead));

    // Its own entrance, off its own place on the screen rather than off the
    // stage's clock — see LINE_IN_FROM.
    const arrive = smoothstep(
      clamp01((screen * LINE_IN_FROM - lineTop) / (screen * (LINE_IN_FROM - LINE_IN_TO))),
    );
    line.style.opacity = String(arrive);
    line.style.transform = `translateY(${lerp(30, 0, arrive).toFixed(1)}px)`;

    // The balloons may only collide with the line once it has stopped moving of
    // its own accord. A collider read off a box that is mid-entrance shifts
    // every frame, and they would judder against a wall that is not where it
    // appears to be.
    //
    // And not before the rest have started. The line finishes its fade while it
    // is still at the bottom edge of the screen, so on arrival alone the balloon
    // it knocks went ahead of the two that are meant to fall first.
    dropStateRef.current.wallLive = arrive >= 1 && lineTop < screen * DROP_LINE_AT;

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
        cardsRef.current,
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
    // The settled height, read at the settled size with the scroll-driven size
    // put back afterwards. Again once the display font has loaded, since the
    // first read runs against the fallback face.
    const measure = () => {
      const greet = greetRef.current;
      if (!greet) return;
      const current = greet.style.fontSize;
      greet.style.fontSize = `${GREET_SIZE_SETTLED_PX}px`;
      greetHeightRef.current = greet.offsetHeight;
      greet.style.fontSize = current;
    };
    const refresh = () => {
      measure();
      update();
    };
    refresh();
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) refresh();
    });
    window.addEventListener("resize", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", refresh);
    };
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
      {/* The travel this stage spends its animation over — and nothing at all
          when there is no animation, or it is screens of black to scroll past.
          See the desktop section, which had the same problem. */}
      <div ref={introStageRef} style={prefersReducedMotion ? undefined : { height: `${INTRO_VH * 100}svh` }}>
        <div
          className={
            prefersReducedMotion ? "relative overflow-clip pt-24 pb-16" : "sticky top-0 h-[100svh] overflow-clip"
          }
        >
          {/* Laid out at its settled place and size, which is also what
              reduced motion shows. The desktop's markup: em-sized lines, so
              the pair keeps its proportions at every size on the way up. */}
          <div
            ref={greetRef}
            className="absolute inset-x-0 top-[19%] text-center font-display leading-[1.06] font-bold whitespace-nowrap text-white will-change-transform"
            style={{ fontSize: `${GREET_SIZE_SETTLED_PX}px` }}
          >
            <span className="block text-[0.4em] text-white/70">
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
            <span className="block text-[1.34em]">
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

        {/* THE THREE AS ONE CARD THE READER SWIPES. Stacked, they were three
            blocks of type on a screen that already carries a face and two
            paragraphs, and they are the part a reader is least likely to work
            through. One at a time is shorter to look at, and the swipe is
            something to do rather than something to read.

            mt-16 is the same 64px the picture stands above the copy — written
            as the same number by hand, because one is a margin and the other is
            where the picture sits in a pinned panel, and nothing links them. */}
        <div
          ref={cardsRef}
          className="mt-16 will-change-transform"
          style={{ opacity: 0, transform: `translateY(${RISE_PX}px)` }}
        >
          <h3 className="text-center font-display text-m-sub font-bold text-white">
            {ABOUT_FACTS_HEADING}
          </h3>
          {/* 72%, so a slice of the card on either side shows the middle one is
              one of several. The numerals are gone with the list they belonged
              to: "01" on a card that arrives on its own says the reader has
              missed something, where the dots under it say how many there are
              without numbering anything. */}
          {/* THREE CARDS IN A COLUMN, each opening as it comes up and then
              staying. Not a carousel any more: that one wrote a scale to every
              slide on every scroll frame, slipped the track back a copy at the
              ends, and re-picked which card was "active" as it went — on a
              phone that read as sticking and flickering. Nothing here is a
              function of scroll position, so there is nothing to stutter and
              nothing to undo on the way back up. */}
          <div className="mt-6 space-y-6">
            {aboutFacts.map((fact, index) => (
              <BorderGlowCard
                key={fact.title}
                className="px-5 py-7 text-center [transition:opacity_600ms_ease-out,transform_600ms_ease-out]"
                innerRef={(el) => {
                  claimsRef.current[index] = el;
                }}
                style={{ opacity: 0, transform: `translateY(${CLAIM_RISE_PX}px)` }}
              >
                <h4 className="font-display text-m-sub font-bold text-balance text-white">
                  {fact.title}
                </h4>
                <p className="mt-3 font-body text-m-small text-balance text-white/55">
                  {fact.description}
                </p>
              </BorderGlowCard>
            ))}
          </div>
        </div>
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
        // Pulled up a little into the cards' space: laid out after them in
        // plain flow, the line sat a screen and a half below the last card. The
        // line's arrival and the balloons are both keyed to the line's own place
        // on screen, so moving the stage moves them with it.
        style={
          prefersReducedMotion
            ? undefined
            : { height: `${CLOSER_STAGE_VH * 100}svh`, marginTop: `-${CLOSER_PULL_SVH}svh` }
        }
      >
        {/* Centred in the panel. It was held near the top for one round to
            close the gap from the last card — but that gap is the lead-in's job
            (the line starts arriving while the cards are still on screen), and
            a closing line pinned against the top of the screen reads as a
            heading rather than as the end of something. */}
        <div
          className={
            prefersReducedMotion
              ? "relative z-10 flex items-center px-6 pt-8 pb-24"
              : "sticky top-0 z-10 flex h-[100svh] items-center px-6"
          }
        >
          <div className="w-full text-right">
            <p
              ref={closerLineRef}
              className="font-display text-m-lead font-bold text-balance text-white will-change-transform"
              style={{ opacity: 0 }}
            >
              {/* The manual break is gone and text-balance decides instead.
                  Same words, in the same order. The desktop break — after
                  "שלכם" — leaves a first line of twenty-eight characters, which a
                  327px column cannot hold at this size. Balanced, the lines come
                  out even: three at 25px since "שלך" became "שלכם" (two would
                  need 23px on a 375 phone, and still three on a 360 one). A
                  hand-placed break is only ever right at one width. */}
              אני כאן להפוך את הרעיון שלכם למוצר שמייצר אימפקט.
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
