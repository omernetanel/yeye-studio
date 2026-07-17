"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import LiveProjectPreview from "@/components/projects/LiveProjectPreview";
import type { Project } from "@/lib/projects";

interface Props {
  project: Project;
}

export default function ProjectPageClient({ project }: Props) {
  return (
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

        {project.url && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.45 }}
            className="mt-2 w-fit"
          >
            <Button href={project.url} external>
              צפה באתר
            </Button>
          </motion.div>
        )}
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
  );
}
