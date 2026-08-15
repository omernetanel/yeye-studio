"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";
import FoldText from "@/components/ui/FoldText";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { projects } from "@/lib/projects";

const TOTAL_SLOTS = 4;

// FoldText runs its own timeline and does not report back, so the moment it
// finishes is worked out from its own numbers: the last glyph starts after
// stagger x (count - 1) and then takes duration to land. 0.045 x 14 + 0.65,
// plus a beat to read it standing before it collapses.
const FOLD_SETTLED_MS = 0.045 * 14 * 1000 + 650 + 420;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.1, 0.64, 1] as const, delay: i * 0.08 },
  }),
};

function ComingSoonTile() {
  return (
    <div className="flex aspect-[1672/941] items-center justify-center rounded-xl border border-black/8 bg-black/[0.03]">
      <span className="font-display text-xs text-black/25">בקרוב</span>
    </div>
  );
}

export default function ProjectsSection() {
  const comingSoonSlots = Array.from({ length: Math.max(0, TOTAL_SLOTS - projects.length) }, (_, i) => i);

  // The heading unfolds big and stacked, then draws itself in to a single
  // centred line. The second move is what makes the first one a moment rather
  // than a layout: it is large only for as long as it takes to arrive.
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Collapsed from the start when motion is reduced: there is no fold to wait
  // for, so the settled state is the only state.
  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined"
      ? false
      : (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
  );

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || collapsed) return;

    let timer = 0;
    // The same threshold FoldText's own trigger uses, so the clock starts when
    // the fold does rather than when the section's top edge appears.
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        timer = window.setTimeout(() => setCollapsed(true), FOLD_SETTLED_MS);
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    watcher.observe(heading);
    return () => {
      watcher.disconnect();
      window.clearTimeout(timer);
    };
  }, [collapsed]);

  return (
    <section id="projects" className="relative px-6 py-20 md:py-24">
      {/* The heading unfolds rather than fades, because the section before it
          is a sheet of paper opening — same gesture, at the top of the work.

          trigger="scroll" and not "mount": mounted, it plays while the section
          is still far below the fold and is over before anyone has reached it.

          BROKEN BY HAND, not by wrapping. The line feed in the text is what
          puts "נבחרים" on its own line; letting it wrap would put the break
          wherever the width happened to fall, and at one width rather than all
          of them. Both lines sit on the same right edge, so the break reads as
          a decision.

          The size is a calculation rather than a taste, which is why it is a
          division and not a clamp. "פרויקטים" is the longer of the two lines
          and at this weight and tracking it renders 3.935px of ink per pixel of
          font size, so the page's own width over a divisor holds the same
          proportion at EVERY viewport. A clamp caps instead, and a capped
          heading stops growing the moment the page is wider than the cap —
          which is what had this stuck at 112px.

          4.6 rather than the 3.98 that put its ends exactly on the gutters: a
          shade smaller, and the left-hand end now stops short of the edge
          rather than running into it.

          AND THEN IT DRAWS ITSELF IN. Once the fold has landed the whole thing
          shrinks to a single centred line. font-size is the only property
          animated — it is what carries the size AND, since the break is a <br>
          that is switched off at the same moment, the two lines closing into
          one. The alignment changes on that frame too, under cover of the
          movement.

          The space between the words has to be put back by hand when the break
          goes: the text is broken on a bare line feed, so merged, the two words
          would meet. */}
      <h2
        ref={headingRef}
        data-collapsed={collapsed || undefined}
        className="fold-heading relative z-10 mb-12 text-right md:mb-16 data-collapsed:text-center"
      >
        <FoldText
          text={"פרויקטים\nנבחרים"}
          splitBy="char"
          hinge="top"
          trigger="scroll"
          duration={0.65}
          stagger={0.045}
          ease="power3.out"
          perspective={700}
          creaseShading={0.55}
          fontSize={collapsed ? "clamp(2rem, 5.2vw, 4.25rem)" : "calc((100vw - 3rem) / 4.6)"}
          fontWeight={800}
          color="#000000"
          className="font-display"
          // nowrap is not belt and braces here, it is required. Splitting by
          // character puts every glyph in its own inline-block, which gives the
          // line a break opportunity between EVERY PAIR OF LETTERS — the last
          // letter of the first word came off and took a line of its own. The
          // hand-placed line feed still renders as a <br> and is still honoured.
          style={{ whiteSpace: "nowrap" }}
        />
      </h2>

      <div className="relative z-10 mx-auto max-w-[1000px]">

        {/* Mobile: one swipe carousel — real projects, then "coming soon" slots */}
        <SwipeCarousel className="mb-10 sm:hidden" slideWidth="82%">
          {[
            ...projects.map((project) => (
              <ProjectCard
                key={project.slug}
                title={project.cardTitle ?? project.title}
                category={project.cardCategory ?? project.category}
                imageSrc={project.image}
                href={project.external ? project.url : `/projects/${project.slug}`}
                external={project.external}
              />
            )),
            ...comingSoonSlots.map((slot) => <ComingSoonTile key={slot} />),
          ]}
        </SwipeCarousel>

        {/* Tablet/desktop: 2x2 grid — real projects, then coming-soon slots */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-12 hidden gap-6 sm:grid sm:grid-cols-2"
        >
          {projects.map((project, i) => (
            <motion.div key={project.slug} custom={i} variants={fadeUp}>
              <ProjectCard
                title={project.cardTitle ?? project.title}
                category={project.cardCategory ?? project.category}
                imageSrc={project.image}
                href={project.external ? project.url : `/projects/${project.slug}`}
                external={project.external}
              />
            </motion.div>
          ))}
          {comingSoonSlots.map((slot, i) => (
            <motion.div key={slot} custom={i + projects.length} variants={fadeUp}>
              <ComingSoonTile />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center">
          <Button href="/projects" variant="primary" className="!border-black !bg-none !bg-black !shadow-none">
            צפה בכל העבודות
          </Button>
        </div>
      </div>
    </section>
  );
}
