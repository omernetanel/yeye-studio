"use client";

import { motion } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import ShimmerButton from "@/components/ui/ShimmerButton";
import { projects as allProjects } from "@/lib/projects";

const projectList = allProjects.map((p) => ({
  title: p.title,
  category: p.category,
  imageSrc: p.image,
  href: `/projects/${p.slug}`,
}));

const placeholders = [1, 2, 3];

export default function ProjectsSection() {
  return (
    <section
      id="projects"
      style={{ position: "relative", padding: "100px 24px 80px", direction: "rtl" }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <h2 style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 56px)",
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            marginBottom: "14px",
          }}>
            פרויקטים נבחרים
          </h2>
          <p style={{
            fontFamily: "'Assistant', Arial, sans-serif",
            fontSize: "17px",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "18px",
          }}>
            עבודות שמדברות בעד עצמן
          </p>
          <div style={{
            width: "50px", height: "3px",
            background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
            borderRadius: "2px", margin: "0 auto",
          }} />
        </motion.div>

        {/* Row 1 - real projects - fan out from center */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}
        >
          {projectList.slice(0, 3).map((project, i) => (
            <motion.div
              key={project.title}
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.85,
                  x: i === 0 ? 120 : i === 2 ? -120 : 0,
                  y: 20,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                  transition: {
                    duration: 0.7,
                    ease: [0.34, 1.1, 0.64, 1],
                    delay: i * 0.08,
                  },
                },
              }}
            >
              <ProjectCard
                title={project.title}
                category={project.category}
                imageSrc={project.imageSrc}
                href={project.href}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Row 2 - placeholders - fan out from center */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "48px" }}
        >
          {placeholders.map((n, i) => (
            <motion.div
              key={n}
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.85,
                  x: i === 0 ? 120 : i === 2 ? -120 : 0,
                  y: 20,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                  transition: {
                    duration: 0.7,
                    ease: [0.34, 1.1, 0.64, 1],
                    delay: 0.2 + i * 0.08,
                  },
                },
              }}
              style={{
                aspectRatio: "16/10",
                borderRadius: "14px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontSize: "12px",
                color: "rgba(255,255,255,0.15)",
              }}>
                בקרוב
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <ShimmerButton href="/projects" variant="primary">
            צפה בכל העבודות
          </ShimmerButton>
        </motion.div>

      </div>
    </section>
  );
}