"use client";

import { motion } from "framer-motion";
import { Target, Code2, Paintbrush } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Results-Driven",
    description: "אתר יפה זה לא מספיק. אנחנו בונים כלי מכירה שמייצרים תוצאות אמיתיות.",
  },
  {
    icon: Code2,
    title: "Code Quality",
    description: "קוד נקי, מהיר וניתן להרחבה. בונים לטווח הארוך, לא רק להשקה.",
  },
  {
    icon: Paintbrush,
    title: "Design-First",
    description: "כל פרויקט מתחיל מעיצוב מדויק. אנחנו לא כותבים שורת קוד לפני שהחזון ברור.",
  },
];

function TiltCard({ value, index }: { value: typeof values[0]; index: number }) {
  const Icon = value.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: (2 - index) * 0.3 }}
      style={{ perspective: "1000px", height: "100%" }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(180deg, rgba(20,20,28,0.75) 0%, rgba(13,13,18,0.85) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "20px",
          border: "1px solid rgba(107,143,248,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(107,143,248,0.06)",
          padding: "28px 24px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "14px",
          textAlign: "right",
          cursor: "default",
          overflow: "hidden",
        }}
      >

        {/* Corner glow — subtle depth accent */}
        <div style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          width: "150px",
          height: "150px",
          background: "radial-gradient(ellipse at 100% 100%, rgba(107,143,248,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Icon in glowing gradient circle */}
        <div style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(20px)",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, rgba(42,51,243,0.35) 0%, rgba(20,20,30,0.4) 75%)",
          border: "1px solid rgba(107,143,248,0.25)",
          boxShadow: "0 0 18px rgba(42,51,243,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
        }}>
          <Icon
            size={24}
            strokeWidth={1.5}
            color="#6B8FF8"
            style={{ filter: "drop-shadow(0 0 6px rgba(42,51,243,0.7))" }}
          />
        </div>

        <span style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(20px)",
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "17px",
          color: "white",
        }}>
          {value.title}
        </span>

        <div style={{
          width: "20px",
          height: "1px",
          backgroundColor: "rgba(107,143,248,0.5)",
        }} />

        <p style={{
          position: "relative",
          zIndex: 1,
          transform: "translateZ(15px)",
          fontFamily: "'Assistant', Arial, sans-serif",
          fontSize: "13.5px",
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.7,
        }}>
          {value.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" style={{ backgroundColor: "transparent", padding: "50px 24px", scrollMarginTop: "100px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", direction: "rtl" }}>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <h2 style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontWeight: 700,
            fontSize: "34px",
            color: "white",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}>
            מי אנחנו?
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80px" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
              borderRadius: "2px",
              margin: "0 auto",
              overflow: "hidden",
            }}
          />
        </motion.div>

        {/* Main row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "56px",
            alignItems: "stretch",
          }}
        >
          {/* Photo — right in RTL, taller now to match card column */}
          <div style={{
            flexShrink: 0,
            width: "360px",
            borderRadius: "20px",
            backgroundColor: "#0f0f14",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.05em",
            }}>
              תמונה בקרוב
            </span>
          </div>

          {/* Text + tilt cards */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "right" }}>
              <p style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "19px",
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.85,
              }}>
                YEYE Studio נולד מתוך אובססיה לפרטים קטנים ואמונה עמוקה שכל עסק — גדול או קטן — ראוי לנוכחות דיגיטלית{" "}
                <strong style={{ color: "white" }}>ברמה הגבוהה ביותר</strong>.
              </p>
              <p style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "19px",
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.85,
              }}>
                אנחנו מעצבים ומפתחים מגיל צעיר, עם ניסיון של שנים בבניית חוויות דיגיטליות{" "}
                <strong style={{ color: "white" }}>שלא רק נראות טוב — אלא עובדות</strong>.
                כל פרויקט מקבל את מלוא הקשב, הדייק והאנרגיה שלנו.
              </p>
            </div>

            {/* Tilt cards row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginTop: "32px",
            }}>
              {values.map((value, i) => (
                <TiltCard key={value.title} value={value} index={i} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
