"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Project } from "@/lib/projects";

interface Props {
  project: Project;
}

export default function ProjectPageClient({ project }: Props) {
  return (
    <div style={{
      marginTop: "69px",
      height: "calc(100vh - 69px)",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        maxWidth: "1400px",
        width: "100%",
        margin: "0 auto",
        padding: "24px 24px 32px",
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "flex-start",
          gap: "48px",
        }}>
          {/* Info panel */}
          <div style={{
            width: "440px",
            flexShrink: 0,
            marginTop: "56px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 800,
                fontSize: "52px",
                color: "white",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {project.title}
            </motion.h1>

            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontSize: "15px",
                color: "#2a33f3",
                fontWeight: 600,
              }}
            >
              {project.category}
            </motion.span>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "15px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8,
                marginTop: "8px",
              }}
            >
              {project.description}
            </motion.p>

            {project.url ? (
              <motion.a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "white",
                  fontSize: "14px",
                  fontFamily: "'GoogleSans', Arial, sans-serif",
                  fontWeight: 500,
                  padding: "11px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  width: "fit-content",
                  marginTop: "8px",
                  background: "linear-gradient(160deg, #6B8FF8 0%, #2a33f3 50%, #1e28d4 100%)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <span>צפה באתר</span>
              </motion.a>
            ) : null}
          </div>

          {/* Browser mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
            style={{
              flex: 1,
              minWidth: 0,
              alignSelf: "stretch",
              maxHeight: "560px",
              minHeight: "310px",
              display: "flex",
              flexDirection: "column",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #1e1e1e",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              backgroundColor: "#111111",
            }}
          >
            <div style={{
              direction: "ltr",
              backgroundColor: "#1a1a1a",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #2a2a2a",
              flexShrink: 0,
            }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ff5f57" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#febc2e", marginLeft: "8px" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#28c840", marginLeft: "8px" }} />
              <div style={{
                flex: 1,
                marginLeft: "16px",
                backgroundColor: "#2a2a2a",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "12px",
                fontFamily: "'GoogleSans', Arial, sans-serif",
                color: "rgba(255,255,255,0.3)",
                textAlign: "center",
              }}>
                {project.url || ""}
              </div>
            </div>

            {project.url ? (
              <iframe
                src={project.url}
                style={{ width: "100%", flex: 1, border: "none", display: "block" }}
                title={project.title}
              />
            ) : (
              <div style={{ position: "relative", width: "100%", flex: 1 }}>
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  style={{ objectFit: "cover", objectPosition: "top" }}
                  sizes="70vw"
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
