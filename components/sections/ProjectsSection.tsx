"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Button from "@/components/ui/Button";
import { projects } from "@/lib/projects";

export default function ProjectsSection() {
  const featured = projects[0];

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
            העבודה האחרונה שלי
          </h2>
          <p className="mb-[18px] font-body text-[17px] text-white/40">פרויקט מלא שבניתי מהיסוד</p>
          <div className="mx-auto h-[3px] w-[50px] rounded-full bg-[image:var(--gradient-brand)]" />
        </motion.div>

        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-12"
          >
            <Link
              href={`/projects/${featured.slug}`}
              className="mx-auto block max-w-[720px] transition-transform duration-200 ease-out hover:scale-[1.015]"
            >
              <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover object-top"
                />
              </div>
              <div className="mx-auto flex max-w-[520px] flex-col items-center gap-3 text-center">
                <span className="font-display text-sm font-semibold text-primary-light">{featured.category}</span>
                <h3 className="font-display text-2xl font-bold text-white md:text-3xl">{featured.title}</h3>
                <p className="font-body text-[15px] leading-[1.8] text-white/55">{featured.description}</p>
                <span className="mt-2 inline-flex items-center gap-2 font-display text-sm text-primary-light">
                  לפרויקט המלא
                  <ArrowIcon />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        <div className="flex justify-center">
          <Button href="/projects" variant="primary">
            צפה בכל העבודות
          </Button>
        </div>
      </div>
    </section>
  );
}
