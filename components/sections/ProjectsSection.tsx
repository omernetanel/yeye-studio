"use client";

import { motion, type Variants } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
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
      <div className="relative z-10 mx-auto max-w-[1000px]">
        <SectionHeading title="פרויקטים נבחרים" className="mb-12 md:mb-16" light />

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
