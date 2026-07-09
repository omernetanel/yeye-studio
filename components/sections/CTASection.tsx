"use client";

import { motion } from "framer-motion";
import ShimmerButton from "@/components/ui/ShimmerButton";

export default function CTASection() {
  return (
    <section id="contact" style={{
      backgroundColor: "transparent",
      padding: "120px 24px",
      position: "relative",
      overflow: "hidden",
      textAlign: "center",
    }}>
      {/* Floating particles */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
          style={{
            position: "absolute",
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
            left: `${8 + (i * 7.5) % 84}%`,
            top: `${15 + (i * 13) % 70}%`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Pulsing background glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "350px",
          background: "radial-gradient(ellipse, rgba(42,51,243,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontSize: "14px",
            color: "#6B8FF8",
            fontWeight: 500,
            letterSpacing: "0.08em",
            marginBottom: "24px",
            textTransform: "uppercase",
          }}
        >
          מוכנים להתחיל?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(40px, 5vw, 72px)",
            color: "white",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "24px",
          }}
        >
          בוא נבנה משהו
          <br />
          <span style={{
            backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            שבאמת עובד.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontFamily: "'Assistant', Arial, sans-serif",
            fontSize: "18px",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "40px",
            lineHeight: 1.7,
          }}
        >
          ייעוץ ראשוני ללא עלות. נשמח לשמוע על הפרויקט שלך.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <ShimmerButton href="/contact" variant="primary">בוא נתחיל ביחד</ShimmerButton>
        </motion.div>
      </div>
    </section>
  );
}
