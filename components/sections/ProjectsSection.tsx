"use client";

import { motion, type Variants } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import Button from "@/components/ui/Button";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { projects } from "@/lib/projects";

const comingSoonSlots = [1, 2, 3];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.1, 0.64, 1] as const, delay: i * 0.08 },
  }),
};

export default function ProjectsSection() {
  return (
    <section id="projects" className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1000px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-16 text-center"
        >
          <h2 className="mb-3.5 font-display text-[clamp(36px,5vw,56px)] leading-[1.05] font-extrabold tracking-tight text-white">
            פרויקטים נבחרים
          </h2>
          <p className="mb-[18px] font-body text-[17px] text-white/40">עבודות שמדברות בעד עצמן</p>
          <div className="mx-auto h-[3px] w-[50px] rounded-full bg-[image:var(--gradient-brand)]" />
        </motion.div>

        {/* Mobile: one swipe carousel — real projects, then "coming soon" slots */}
        <SwipeCarousel className="mb-10" slideWidth="82%">
          {[
            ...projects.map((project) => (
              <ProjectCard
                key={project.slug}
                title={project.title}
                category={project.category}
                imageSrc={project.image}
                href={`/projects/${project.slug}`}
              />
            )),
            ...comingSoonSlots.map((slot) => (
              <div
                key={slot}
                className="flex aspect-[16/10] items-center justify-center rounded-[14px] border border-white/6 bg-white/[0.03]"
              >
                <span className="font-display text-xs text-white/15">בקרוב</span>
              </div>
            )),
          ]}
        </SwipeCarousel>

        {/* Tablet/desktop: full grid, real projects then coming-soon row */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-4 hidden gap-4 sm:grid sm:grid-cols-3"
        >
          {projects.map((project, i) => (
            <motion.div key={project.slug} custom={i} variants={fadeUp}>
              <ProjectCard title={project.title} category={project.category} imageSrc={project.image} href={`/projects/${project.slug}`} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-12 hidden gap-4 sm:grid sm:grid-cols-3"
        >
          {comingSoonSlots.map((slot, i) => (
            <motion.div
              key={slot}
              custom={i + projects.length}
              variants={fadeUp}
              className="flex aspect-[16/10] items-center justify-center rounded-[14px] border border-white/6 bg-white/[0.03]"
            >
              <span className="font-display text-xs text-white/15">בקרוב</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center">
          <Button href="/projects" variant="primary">
            צפה בכל העבודות
          </Button>
        </div>
      </div>
    </section>
  );
}
