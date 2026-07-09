"use client";

import { motion } from "framer-motion";
import ShimmerButton from "@/components/ui/ShimmerButton";

export default function HeroSection() {
  return (
    <div style={{ position: "relative" }}>
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        {/* Plus decorators */}
        <span style={{ position: "absolute", top: "16%", right: "10%", color: "rgba(255,255,255,0.15)", fontSize: "16px", zIndex: 1, userSelect: "none" }}>+</span>
        <span style={{ position: "absolute", top: "12%", left: "22%", color: "rgba(255,255,255,0.07)", fontSize: "16px", zIndex: 1, userSelect: "none" }}>+</span>
        <span style={{ position: "absolute", bottom: "28%", left: "10%", color: "rgba(255,255,255,0.06)", fontSize: "16px", zIndex: 1, userSelect: "none" }}>+</span>

        {/* Content */}
        <div style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
          padding: "180px 24px 60px",
          textAlign: "center",
          direction: "rtl",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
              fontSize: "clamp(52px, 6.5vw, 80px)",
              width: "100%",
            }}
          >
            <motion.span
              style={{ display: "block", color: "white" }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.3 }}
            >
              אנחנו בונים אתרים
            </motion.span>
            <motion.span
              style={{
                display: "block",
                backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.42 }}
            >
              ומערכות שמייצרות
            </motion.span>
            <motion.span
              style={{ display: "block", color: "white" }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.54 }}
            >
              לקוחות לעסקים.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.7 }}
            style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "17px",
              color: "rgba(255,255,255,0.72)",
              maxWidth: "380px",
              lineHeight: 1.8,
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            עיצוב UX מדויק, פיתוח מהיר, וחווית משתמש
            <br />
            שמביאה תוצאות אמיתיות.
          </motion.p>
        </div>
      </section>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: "easeOut", delay: 0.85 }}
        style={{
          marginTop: "-56px",
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          paddingBottom: "60px",
        }}
      >
        <ShimmerButton href="/contact" variant="outline">בוא נתחיל פרויקט</ShimmerButton>
        <ShimmerButton href="#projects" variant="primary">צפה בעבודות</ShimmerButton>
      </motion.div>
    </div>
  );
}