"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Zap, Smartphone, Users, MessageSquare, Paintbrush, Code2, Rocket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ShimmerButton from "@/components/ui/ShimmerButton";

const principles = [
  {
    icon: Target,
    title: "מטרה אחת ברורה",
    description: "כל דף נבנה סביב פעולה יחידה — בלי הסחות דעת, בלי תפריטים מתחרים.",
  },
  {
    icon: Zap,
    title: "מהירות טעינה",
    description: "כל שנייה של עיכוב פוגעת בהמרה. אנחנו בונים דפים שטוענים מהר, תמיד.",
  },
  {
    icon: Smartphone,
    title: "מובייל קודם",
    description: "רוב התנועה מגיעה מהטלפון — כך גם אנחנו מתכננים, מההתחלה.",
  },
  {
    icon: Users,
    title: "הוכחה חברתית",
    description: "ממוקם נכון, אמון מלקוחות קודמים יכול להכריע את ההחלטה.",
  },
];

const pageTypes = [
  {
    title: "איסוף לידים",
    description: "פרטי קשר תמורת הצעה אמיתית — שיחת ייעוץ, קטלוג, או הצעת מחיר.",
    use: "מתאים כש: אתה רוצה לבנות רשימת לקוחות פוטנציאליים",
  },
  {
    title: "מכירה ישירה",
    description: "דף ממוקד שמוביל ישר לרכישה — מוצר, שירות, או חבילה.",
    use: "מתאים כש: יש לך הצעה ברורה ומוכנה לסגירה",
  },
  {
    title: "חימום לפני פנייה",
    description: "מציג מידע מעמיק ובונה אמון, לפני שמבקש מהמבקר לפעול.",
    use: "מתאים כש: התנועה שלך \"קרה\" וזקוקה להסבר",
  },
];

const processSteps = [
  { number: "01", icon: MessageSquare, title: "הבנת המטרה והקהל" },
  { number: "02", icon: Paintbrush, title: "כתיבת מסר ממוקד" },
  { number: "03", icon: Code2, title: "עיצוב ופיתוח" },
  { number: "04", icon: Rocket, title: "בדיקות והשקה" },
];

function TiltCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      style={{ height: "100%" }}
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
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", bottom: 0, right: 0, width: "150px", height: "150px",
          background: "radial-gradient(ellipse at 100% 100%, rgba(107,143,248,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPagesService() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", position: "relative", overflow: "hidden" }}>
      <ScrollToTop />

      {/* Ambient background glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "fixed",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(42,51,243,0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Grid background */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(107,143,248,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(107,143,248,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
        zIndex: 0,
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }} />
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
          style={{
            position: "fixed",
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
            left: `${5 + (i * 4.8) % 90}%`,
            top: `${10 + (i * 11) % 80}%`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <Navbar />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <section style={{ padding: "160px 24px 80px", textAlign: "center", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
<motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(38px, 5vw, 60px)",
                color: "white",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: "24px",
              }}
            >
              דפי נחיתה שממירים,
              <br />
              <span style={{
                backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                לא רק נראים טוב
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "18px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8,
                marginBottom: "36px",
              }}
            >
              כל דף נחיתה שאנחנו בונים נועד למטרה אחת: להפוך מבקרים ללקוחות.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <ShimmerButton href="/contact" variant="primary">בוא נבנה את הדף שלך</ShimmerButton>
            </motion.div>
          </div>
        </section>

        {/* What is it */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                marginBottom: "20px",
              }}
            >
              מה זה דף נחיתה?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "17px",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.9,
              }}
            >
              דף נחיתה הוא עמוד עצמאי שמטרתו פעולה אחת וברורה — השארת פרטים, רכישה, או הרשמה. בשונה מאתר מלא, אין בו תפריט מסיח או קישורים יוצאים. כל אלמנט בדף מכוון למטרה אחת, מה שהופך אותו לכלי המרה ולא רק לעמוד תדמית.
            </motion.p>
          </div>
        </section>

        {/* Why you need a landing page */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                marginBottom: "48px",
                textAlign: "center",
              }}
            >
              למה דף נחיתה הוא חובה
            </motion.h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {[
                {
                  stat: "-7%",
                  statLabel: "על כל שנייה של טעינה",
                  text: "כשמישהו לוחץ על מודעה שלך, יש לו שנייה אחת להחליט אם להישאר. אתר רגיל מציג לו תפריט, עמוד בית, ועשר דרכים לאבד אותו. דף נחיתה עושה דבר אחד: מוביל אותו ישר לפעולה.",
                },
                {
                  stat: "19.3%",
                  statLabel: "המרה מתנועת אימייל ממוקדת",
                  text: "ההבדל בין עסק שמייצר לידים לבין עסק שלא, הוא לרוב לא תקציב הפרסום — זה המקום שאליו אתה שולח את התנועה. תנועה ממוקדת לדף ייעודי ממירה פי כמה מתנועה לעמוד הבית.",
                },
                {
                  stat: "×3",
                  statLabel: "יותר המרות לדפים שנטענים תוך שנייה",
                  text: "דף נחיתה טוב לא רק נראה טוב — הוא בנוי להמיר. מסר אחד, פעולה אחת, ללא הסחות דעת. זה ההבדל בין אתר שנראה טוב לדף שמייצר כסף.",
                },
              ].map((item, i) => {
                const isEven = true;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "48px",
                      flexDirection: isEven ? "row" : "row-reverse",
                    }}
                  >
                    {/* Stat */}
                    <div style={{
                      flexShrink: 0,
                      width: "220px",
                      textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: "'GoogleSans', Arial, sans-serif",
                        fontWeight: 800,
                        fontSize: "56px",
                        backgroundImage: "linear-gradient(135deg, #2a33f3 0%, #6B8FF8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        lineHeight: 1,
                        marginBottom: "8px",
                      }}>
                        {item.stat}
                      </div>
                      <div style={{
                        fontFamily: "'GoogleSans', Arial, sans-serif",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.35)",
                        lineHeight: 1.4,
                      }}>
                        {item.statLabel}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                      width: "1px",
                      height: "80px",
                      background: "linear-gradient(to bottom, transparent, rgba(107,143,248,0.4), transparent)",
                      flexShrink: 0,
                    }} />

                    {/* Text */}
                    <p style={{
                      flex: 1,
                      fontFamily: "'Assistant', Arial, sans-serif",
                      fontSize: "17px",
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.85,
                      textAlign: isEven ? "right" : "left",
                    }}>
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Page types */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                textAlign: "center",
                marginBottom: "48px",
              }}
            >
              איזה סוג דף מתאים לך?
            </motion.h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {pageTypes.map((type, i) => (
                <TiltCard key={type.title} delay={i * 0.12}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "right" }}>
                    <h3 style={{
                      fontFamily: "'GoogleSans', Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: "18px",
                      color: "white",
                    }}>
                      {type.title}
                    </h3>
                    <p style={{
                      fontFamily: "'Assistant', Arial, sans-serif",
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.7,
                    }}>
                      {type.description}
                    </p>
                    <p style={{
                      fontFamily: "'GoogleSans', Arial, sans-serif",
                      fontSize: "12.5px",
                      color: "#6B8FF8",
                      marginTop: "4px",
                    }}>
                      {type.use}
                    </p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* Process — Vertical Timeline */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                textAlign: "center",
                marginBottom: "56px",
              }}
            >
              איך זה עובד?
            </motion.h2>

            <div style={{ position: "relative" }}>
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                style={{
                  position: "absolute",
                  right: "50%",
                  top: "24px",
                  bottom: "24px",
                  width: "1px",
                  background: "linear-gradient(to bottom, transparent, rgba(107,143,248,0.4) 20%, rgba(107,143,248,0.4) 80%, transparent)",
                  transformOrigin: "top",
                }}
              />

              {[
                {
                  number: "01",
                  icon: MessageSquare,
                  title: "הבנת המטרה והקהל",
                  description: "לפני שנכתב מילה אחת, אנחנו יושבים איתך ולומדים את העסק לעומק. מי הלקוח האידיאלי שלך? מה הוא מרגיש? מה עוצר אותו מלפעול? התשובות האלה הן הבסיס לכל דף שנבנה.",
                },
                {
                  number: "02",
                  icon: Paintbrush,
                  title: "כתיבת מסר ממוקד",
                  description: "כותבים כותרת שקולעת ישר ללב הבעיה, תיאור שבונה אמון, ו-CTA שמוביל לפעולה. כל מילה נבחרת בכוונה — אין מילות מילוי, אין ז'רגון מיותר.",
                },
                {
                  number: "03",
                  icon: Code2,
                  title: "עיצוב ופיתוח",
                  description: "בונים את הדף מאפס — לא תבנית מוכנה. עיצוב שמתאים לקהל שלך, פיתוח מהיר עם Next.js, וחוויית מובייל מושלמת. כל פיקסל נועד לשרת את המטרה.",
                },
                {
                  number: "04",
                  icon: Rocket,
                  title: "בדיקות, אופטימיזציה והשקה",
                  description: "לפני שהדף עולה לאוויר, בודקים אותו על כל מכשיר ודפדפן, מוודאים מהירות טעינה מיטבית, ומכוונים אחרון אחרון. ביום ההשקה — אנחנו שם.",
                },
              ].map((step, i) => {
                const Icon = step.icon;
                const isRight = i % 2 === 0;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: isRight ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isRight ? "flex-end" : "flex-start",
                      marginBottom: "40px",
                      position: "relative",
                    }}
                  >
                    <div style={{
                      width: "44%",
                      background: "linear-gradient(180deg, rgba(20,20,28,0.8) 0%, rgba(13,13,18,0.9) 100%)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(107,143,248,0.15)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      textAlign: isRight ? "right" : "left",
                    }}>
                      <span style={{
                        fontFamily: "'GoogleSans', Arial, sans-serif",
                        fontSize: "11px",
                        color: "#6B8FF8",
                        letterSpacing: "0.08em",
                      }}>
                        {step.number}
                      </span>
                      <h3 style={{
                        fontFamily: "'GoogleSans', Arial, sans-serif",
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "white",
                      }}>
                        {step.title}
                      </h3>
                      <p style={{
                        fontFamily: "'Assistant', Arial, sans-serif",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.7,
                      }}>
                        {step.description}
                      </p>
                    </div>

                    <div style={{
                      position: "absolute",
                      right: "calc(50% - 16px)",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(42,51,243,0.2)",
                      border: "1px solid rgba(107,143,248,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      boxShadow: "0 0 12px rgba(42,51,243,0.3)",
                    }}>
                      <Icon size={14} strokeWidth={1.5} color="#6B8FF8" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                textAlign: "center",
                marginBottom: "48px",
              }}
            >
              העקרונות שלנו
            </motion.h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              {principles.map((p, i) => {
                const Icon = p.icon;
                return (
                  <TiltCard key={p.title} delay={i * 0.1}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px" }}>
                      <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "radial-gradient(circle at 30% 30%, rgba(42,51,243,0.35) 0%, rgba(20,20,30,0.4) 75%)",
                        border: "1px solid rgba(107,143,248,0.25)",
                        boxShadow: "0 0 18px rgba(42,51,243,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
                      }}>
                        <Icon size={24} strokeWidth={1.5} color="#6B8FF8" style={{ filter: "drop-shadow(0 0 6px rgba(42,51,243,0.7))" }} />
                      </div>
                      <h3 style={{ fontFamily: "'GoogleSans', Arial, sans-serif", fontWeight: 700, fontSize: "15px", color: "white" }}>
                        {p.title}
                      </h3>
                      <p style={{ fontFamily: "'Assistant', Arial, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                        {p.description}
                      </p>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: "center", marginBottom: "56px" }}
            >
              <h2 style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                marginBottom: "12px",
              }}>
                וזה לא הכל
              </h2>
              <p style={{
                fontFamily: "'Assistant', Arial, sans-serif",
                fontSize: "16px",
                color: "rgba(255,255,255,0.45)",
              }}>
                כל פרויקט מגיע עם שכבת שירות שמעטים מציעים
              </p>
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
              {[
                [
                  { number: "01", title: "ידע שיווקי שמגיע איתך", description: "לא מסתפקים בלבנות דף יפה. אנחנו חולקים איתך את הידע שנצבר מעבודה על עשרות פרויקטים — מה עובד, מה לא, ואיך למקסם את התוצאות מהדף שבנינו." },
                  { number: "02", title: "זמינות אמיתית", description: "לא עוברים לפקיד אחר אחרי שהפרויקט נסגר. תוכלו לפנות אלינו ישירות, לקבל מענה מהיר, ולדעת שמישהו שמכיר את הפרויקט שלך עומד מאחוריו." },
                ],
                [
                  { number: "03", title: "ליווי טכני מקצה לקצה", description: "דומיין, שרת, חיבורים, אינטגרציות — מטפלים בכל הבירוקרטיה הדיגיטלית. לא צריך להיות מומחה כדי להשיק דף נחיתה מקצועי." },
                  { number: "04", title: "תמיכה לאחר ההשקה", description: "חודש תמיכה מלאה אחרי ההשקה, ללא עלות נוספת. תיקונים, עדכונים קטנים, שאלות — אנחנו כאן כדי לוודא שהכל עובד בדיוק כמו שצריך." },
                ],
              ].map((row, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: rowIndex * 0.15 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "60px",
                    paddingBottom: "56px",
                    borderBottom: "none",
                  }}
                >
                  {row.map((item) => (
                    <div key={item.number} style={{ display: "flex", gap: "20px", alignItems: "flex-start", textAlign: "right" }}>
                      <span style={{
                        fontFamily: "'GoogleSans', Arial, sans-serif",
                        fontWeight: 800,
                        fontSize: "44px",
                        color: "rgba(42,51,243,0.2)",
                        lineHeight: 1,
                        flexShrink: 0,
                        marginTop: "2px",
                      }}>
                        {item.number}
                      </span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontFamily: "'GoogleSans', Arial, sans-serif",
                          fontWeight: 700,
                          fontSize: "20px",
                          color: "white",
                          marginBottom: "12px",
                        }}>
                          {item.title}
                        </h3>
                        <p style={{
                          fontFamily: "'Assistant', Arial, sans-serif",
                          fontSize: "16px",
                          color: "rgba(255,255,255,0.5)",
                          lineHeight: 1.85,
                        }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Examples placeholder gallery */}
        <section style={{ padding: "60px 24px", direction: "rtl" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "'GoogleSans', Arial, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                color: "white",
                textAlign: "center",
                marginBottom: "64px",
              }}
            >
              דוגמאות מהעבודה שלנו
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              style={{
                position: "relative",
                height: "340px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {[
                { label: "דף נחיתה 01", x: "-105%", delay: 0.1 },
                { label: "דף נחיתה 02", x: "0%", delay: 0 },
                { label: "דף נחיתה 03", x: "105%", delay: 0.2 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: "0%", scale: 0.85 },
                    visible: {
                      opacity: 1,
                      x: item.x,
                      scale: 1,
                      transition: {
                        duration: 0.8,
                        ease: [0.34, 1.2, 0.64, 1],
                        delay: item.delay,
                      },
                    },
                  }}
                  style={{
                    position: "absolute",
                    width: "320px",
                    height: "240px",
                    borderRadius: "16px",
                    backgroundColor: "#0f0f14",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Browser chrome */}
                  <div style={{
                    height: "32px",
                    backgroundColor: "#111118",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    gap: "6px",
                    flexShrink: 0,
                  }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ff5f57" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#febc2e" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#28c840" }} />
                  </div>

                  {/* Content area */}
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "8px",
                  }}>
                    <span style={{
                      fontFamily: "'GoogleSans', Arial, sans-serif",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.15)",
                    }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontFamily: "'GoogleSans', Arial, sans-serif",
                      fontSize: "11px",
                      color: "rgba(107,143,248,0.3)",
                    }}>
                      בקרוב
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: "100px 24px", textAlign: "center", direction: "rtl" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "white",
              marginBottom: "16px",
            }}>
              רוצה דף נחיתה שבאמת ממיר?
            </h2>
            <p style={{
              fontFamily: "'Assistant', Arial, sans-serif",
              fontSize: "17px",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "32px",
            }}>
              ייעוץ ראשוני ללא עלות. נשמח לשמוע על הפרויקט שלך.
            </p>
            <ShimmerButton href="/contact" variant="primary">בוא נתחיל</ShimmerButton>
          </motion.div>
        </section>

      </div>

      <Footer />
    </main>
  );
}
