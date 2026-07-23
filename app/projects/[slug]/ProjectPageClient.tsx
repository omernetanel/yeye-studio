"use client";

import { motion } from "framer-motion";
import { BarChart3, Bell, Calendar, Compass, Smartphone, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LiveProjectPreview from "@/components/projects/LiveProjectPreview";
import type { Project, ProjectFeatureIcon } from "@/lib/projects";

const FEATURE_ICONS: Record<ProjectFeatureIcon, typeof Calendar> = {
  calendar: Calendar,
  users: Users,
  chart: BarChart3,
  bell: Bell,
  compass: Compass,
  smartphone: Smartphone,
};

interface Props {
  project: Project;
}

export default function ProjectPageClient({ project }: Props) {
  const { story } = project;

  return (
    <>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 pt-[140px] pb-20 md:flex-row md:items-start md:gap-12">
        {/* Info panel */}
        <div className="flex shrink-0 flex-col gap-2 md:mt-14 md:w-[380px]">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-white md:text-5xl"
          >
            {project.title}
          </motion.h1>

          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="font-display text-[15px] font-semibold text-primary-light"
          >
            {project.category}
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="mt-2 font-body text-[15px] leading-[1.8] text-white/55"
          >
            {project.description}
          </motion.p>

          {project.tags && project.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/50"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="mt-3 w-fit"
          >
            {story ? (
              <Button href="/contact">בוא נדבר</Button>
            ) : (
              project.url && (
                <Button href={project.url} external>
                  צפה באתר
                </Button>
              )
            )}
          </motion.div>
        </div>

        {/* Live preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="flex-1"
        >
          <LiveProjectPreview url={project.url} title={project.title} fallbackImage={project.image} />
        </motion.div>
      </div>

      {story && (
        <div className="mx-auto max-w-[1100px] px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-[720px] text-center"
          >
            <h2 className="mb-5 font-display text-2xl font-bold text-white md:text-3xl">{story.storyTitle}</h2>
            <p className="font-body text-[17px] leading-[1.9] text-white/50">{story.problem}</p>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mt-20 mb-10 text-center font-display text-2xl font-bold text-white md:text-3xl"
          >
            {story.featuresTitle}
          </motion.h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {story.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: (i % 3) * 0.1 }}
                >
                  <Card className="flex h-full flex-col items-center gap-3 text-center">
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-primary-light/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-primary)_35%,transparent)_0%,rgba(20,20,30,0.4)_75%)]">
                      <Icon size={24} strokeWidth={1.5} className="text-primary-light drop-shadow-[0_0_6px_rgba(42,51,243,0.7)]" />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-white">{feature.title}</h3>
                    <p className="font-body text-[13px] leading-[1.65] text-white/50">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mt-20"
          >
            <h2 className="mb-6 text-center font-display text-2xl font-bold text-white md:text-3xl">
              {story.techNotesTitle}
            </h2>
            <ul className="mx-auto flex max-w-[640px] flex-col gap-3">
              {story.techNotes.map((note) => (
                <li
                  key={note}
                  className="flex gap-3 font-body text-[14px] leading-[1.8] text-white/45"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-light" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mt-24 text-center"
          >
            <h2 className="mb-4 font-display text-[clamp(24px,3.5vw,34px)] font-extrabold text-white">
              {story.ctaTitle}
            </h2>
            <p className="mx-auto mb-8 max-w-[560px] font-body text-[16px] leading-[1.8] text-white/50">
              {story.ctaText}
            </p>
            <Button href="/contact">בוא נדבר</Button>
          </motion.div>
        </div>
      )}
    </>
  );
}
