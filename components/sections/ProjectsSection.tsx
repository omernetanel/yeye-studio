"use client";

import { motion, type Variants } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";
import FoldText from "@/components/ui/FoldText";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { projects } from "@/lib/projects";

const TOTAL_SLOTS = 4;

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

  return (
    <section id="projects" className="relative px-6 py-20 md:py-24">
      {/* The heading unfolds rather than fades, because the section before it
          is a sheet of paper opening — same gesture, at the top of the work.

          trigger="scroll" and not "mount": mounted, it plays while the section
          is still far below the fold and is over before anyone has reached it.

          OUTSIDE the measure the cards sit in, and sized to fill the page's
          full width instead. 12.9vw is not a taste: the string is fixed, and at
          this weight and tracking it renders 7.267px of ink per pixel of font
          size, so that figure is what puts its two ends near the gutters — one
          line at any width, from 51px on a phone to 195px on a laptop. A clamp
          cannot do that; it caps, and a capped heading stops filling the page
          the moment the page gets wider than the cap.

          The exact fit, 13.24vw, wrapped: it came to 1231.6px of ink in 1232px
          of room and the space between the words took the second line. The gap
          here is that margin, and nowrap makes the intent explicit — the size
          is derived from the viewport, so there is no width at which one line
          cannot hold it.

          It is the heading that sets this edge, not the grid. The work below is
          being rebuilt next and should come to meet it. */}
      <h2 className="relative z-10 mb-12 text-right md:mb-16">
        <FoldText
          text="פרויקטים נבחרים"
          splitBy="char"
          hinge="top"
          trigger="scroll"
          duration={0.65}
          stagger={0.045}
          ease="power3.out"
          perspective={700}
          creaseShading={0.55}
          fontSize="12.9vw"
          fontWeight={800}
          color="#000000"
          className="font-display"
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
