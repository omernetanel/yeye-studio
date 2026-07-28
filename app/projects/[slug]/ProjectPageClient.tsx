"use client";

import { motion } from "framer-motion";
import { BarChart3, Bell, Calendar, Compass, Gauge, Languages, Layers, Palette, Smartphone, Sparkles, Users } from "lucide-react";
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
  sparkles: Sparkles,
  layers: Layers,
  palette: Palette,
  languages: Languages,
  gauge: Gauge,
};

interface Props {
  project: Project;
}

export default function ProjectPageClient({ project }: Props) {
  const { story } = project;

  return (
    <>
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 px-6 pt-[140px] pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-black md:text-5xl"
        >
          {project.title}
        </motion.h1>

        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 font-display text-[13px] font-semibold text-accent"
        >
          {project.category}
        </motion.span>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="mt-1 max-w-[560px] font-body text-[16px] leading-[1.85] whitespace-pre-line text-black/55"
        >
          {project.description}
        </motion.p>

        {project.tags && project.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="mt-2 flex flex-wrap justify-center gap-2"
          >
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 font-mono text-[11px] text-black/50"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Live preview */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        className="mx-auto max-w-[1100px] px-6 pb-20"
      >
        <LiveProjectPreview url={project.url} title={project.title} fallbackImage={project.image} />
      </motion.div>

      {story && (
        <div className="mx-auto max-w-[1100px] px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-[720px] text-center"
          >
            <h2 className="mb-5 font-display text-2xl font-bold text-black md:text-3xl">{story.storyTitle}</h2>
            <p className="font-body text-[17px] leading-[1.9] text-black/55">{story.problem}</p>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mt-20 mb-10 text-center font-display text-2xl font-bold text-black md:text-3xl"
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
                  <Card light className="flex h-full flex-col items-center gap-3 text-center">
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-accent/25 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-accent)_35%,transparent)_0%,rgba(255,255,255,0.4)_75%)]">
                      <Icon size={24} strokeWidth={1.5} className="text-accent drop-shadow-[0_0_6px_rgba(42,51,243,0.35)]" />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-black">{feature.title}</h3>
                    <p className="font-body text-[13px] leading-[1.65] text-black/50">{feature.description}</p>
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
            <h2 className="mb-6 text-center font-display text-2xl font-bold text-black md:text-3xl">
              {story.techNotesTitle}
            </h2>
            <ul className="mx-auto flex max-w-[640px] flex-col gap-3">
              {story.techNotes.map((note) => (
                <li
                  key={note}
                  className="flex gap-3 font-body text-[14px] leading-[1.8] text-black/50"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
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
            className="relative mt-24 overflow-hidden rounded-3xl border border-black/10 bg-white/30 px-6 py-16 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] md:py-20"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
              style={{ background: "radial-gradient(ellipse, rgba(42,51,243,0.3) 0%, transparent 70%)" }}
            />

            <div className="relative z-10">
              <h2 className="mb-4 font-display text-[clamp(28px,4vw,44px)] leading-[1.15] font-extrabold text-black">
                {story.ctaTitle}
              </h2>
              <p className="mx-auto mb-8 max-w-[560px] font-body text-[16px] leading-[1.8] text-black/55">
                {story.ctaText}
              </p>
              <Button href="/contact">בוא נדבר</Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
